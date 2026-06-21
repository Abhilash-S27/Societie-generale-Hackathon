const express = require('express');
const store = require('../services/dataStore');
const {
  enrichAll,
  enrichOne,
  enrichWith,
  buildLookups,
  addHistory,
  applyTransition,
} = require('../services/exceptionService');
const { generate: generateAlerts } = require('../services/alertEngine');
const { detectAll, forException, flagsByException } = require('../services/conflictDetection');
const { isoNow, addDays } = require('../utils/dateUtils');
const { parseToObjects, toCSV } = require('../utils/csv');

const router = express.Router();

// Columns supported by CSV import/export/template.
const CSV_COLUMNS = [
  'exception_id', 'requester_name', 'business_unit', 'asset_name', 'policy_name',
  'exception_type', 'business_justification', 'start_date', 'expiry_date',
  'criticality', 'compensating_control', 'owner_name', 'approver_name', 'status',
];

// --- Lightweight validation hardening (demo-safe; no external libraries) ---
const MAX_IMPORT_ROWS = 1000;
const MAX_JUSTIFICATION = 1000;
const MAX_COMMENT = 500;

// Returns true if the value is empty (optional) or a parseable date string.
function isValidDateOrEmpty(value) {
  if (value == null || String(value).trim() === '') return true;
  return !Number.isNaN(new Date(value).getTime());
}

function userExists(id) {
  if (!id) return true; // optional fields (e.g. owner) may be empty
  return store.read('users').some((u) => u.id === id);
}

// GET /api/exceptions — all exceptions, enriched. Supports basic query filters.
router.get('/', (req, res) => {
  let rows = enrichAll();
  const { q, risk_level, status, business_unit, policy_category } = req.query;

  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((e) =>
      [e.id, e.exception_type, e.asset_name, e.owner_name, e.policy_name, e.requester_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle))
    );
  }
  if (risk_level) rows = rows.filter((e) => e.risk_level === risk_level);
  if (status) rows = rows.filter((e) => e.status === status);
  if (business_unit) rows = rows.filter((e) => e.business_unit === business_unit);
  if (policy_category) rows = rows.filter((e) => e.policy_category === policy_category);

  // Attach conflict badge info for the registry.
  const flags = flagsByException(detectAll().findings);
  rows = rows.map((e) => ({
    ...e,
    conflict_flag: flags[e.id]?.label || 'Clean',
    conflict_severity: flags[e.id]?.severity || null,
    conflict_types: flags[e.id]?.types || [],
  }));

  if (req.query.has_conflicts === 'true') rows = rows.filter((e) => e.conflict_flag !== 'Clean');

  rows.sort((a, b) => b.risk_score - a.risk_score);
  res.json(rows);
});

// --- CSV routes MUST precede '/:id' so they are not captured as an id. ---

// GET /api/exceptions/csv-template — header row + one example row.
router.get('/csv-template', (req, res) => {
  const example = {
    exception_id: '',
    requester_name: 'Meera Nair',
    business_unit: 'Payments',
    asset_name: 'Payment Gateway',
    policy_name: 'Network Firewall Policy',
    exception_type: 'Firewall Exception',
    business_justification: 'Port 443 open for 10 days for vendor gateway integration testing; restricted to VPN IPs.',
    start_date: '2026-06-20',
    expiry_date: '2026-07-05',
    criticality: 'Critical',
    compensating_control: 'Access restricted to approved VPN IP ranges; WAF enabled.',
    owner_name: 'Aisha Khan',
    approver_name: 'Ravi Patel',
    status: 'submitted',
  };
  const csv = toCSV(CSV_COLUMNS, [example]);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="riskwaiver360-template.csv"');
  res.send(csv);
});

// GET /api/exceptions/export-csv — enriched registry export.
router.get('/export-csv', (req, res) => {
  const lookups = buildLookups();
  const rows = enrichAll().map((e) => ({
    exception_id: e.id,
    requester_name: e.requester_name,
    business_unit: e.business_unit,
    asset_name: e.asset_name,
    policy_name: e.policy_name,
    exception_type: e.exception_type,
    business_justification: e.justification,
    start_date: e.start_date,
    expiry_date: e.expiry_date,
    criticality: e.asset?.criticality || e.criticality || '',
    compensating_control: e.compensating_control,
    owner_name: e.owner_name || '',
    approver_name: e.approver_name || '',
    status: e.status,
    risk_score: e.risk_score,
    risk_level: e.risk_level,
    days_remaining: e.days_remaining,
    recommendation: e.recommendation?.text || '',
  }));
  const headers = [...CSV_COLUMNS, 'risk_score', 'risk_level', 'days_remaining', 'recommendation'];
  const csv = toCSV(headers, rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="riskwaiver360-exceptions.csv"');
  res.send(csv);
});

// GET /api/exceptions/:id/conflicts — conflicts touching one exception.
router.get('/:id/conflicts', (req, res) => {
  const ex = enrichOne(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exception not found' });
  res.json(forException(req.params.id));
});

// GET /api/exceptions/:id — full detail with history, approvals, alerts, conflicts.
router.get('/:id', (req, res) => {
  const ex = enrichOne(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exception not found' });

  const history = store
    .read('exception_history')
    .filter((h) => h.exception_id === ex.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const approvals = store.read('approvals').filter((a) => a.exception_id === ex.id);
  const alerts = generateAlerts().filter((a) => a.exception_id === ex.id);
  const conflicts = forException(ex.id);

  res.json({ ...ex, history, approvals, alerts, conflicts });
});

// POST /api/exceptions — create a new exception (risk scored on read).
router.post('/', (req, res) => {
  const b = req.body || {};
  const required = ['requester', 'asset_id', 'policy_id', 'exception_type', 'expiry_date'];
  const missing = required.filter((f) => !b[f]);
  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }
  // Lightweight validation hardening (does not change the payload shape).
  if ((b.justification || '').length > MAX_JUSTIFICATION) {
    return res.status(400).json({ error: `Justification too long (max ${MAX_JUSTIFICATION} characters).` });
  }
  if (!isValidDateOrEmpty(b.expiry_date) || !isValidDateOrEmpty(b.start_date)) {
    return res.status(400).json({ error: 'start_date / expiry_date must be valid dates.' });
  }
  if (!userExists(b.owner) || !userExists(b.approver)) {
    return res.status(400).json({ error: 'owner / approver must reference an existing user.' });
  }

  const exceptions = store.read('exceptions');
  const id = store.nextId('exceptions', 'EXC');
  const record = {
    id,
    requester: b.requester,
    business_unit: b.business_unit || '',
    asset_id: b.asset_id,
    policy_id: b.policy_id,
    exception_type: b.exception_type,
    risk_impact: b.risk_impact || '',
    justification: b.justification || '',
    start_date: b.start_date || isoNow().slice(0, 10),
    expiry_date: b.expiry_date,
    criticality: b.criticality || '',
    compensating_control: b.compensating_control || '',
    compensating_control_strength: b.compensating_control_strength || '',
    owner: b.owner || '',
    approver: b.approver || '',
    status: 'submitted',
    last_reviewed_at: null,
    activated_at: null,
    created_at: isoNow(),
    updated_at: isoNow(),
  };
  exceptions.push(record);
  store.write('exceptions', exceptions);
  addHistory(id, 'create', null, 'submitted', b.requester, 'Exception request created.');

  const enriched = enrichWith(record, buildLookups());
  res.status(201).json(enriched);
});

// POST /api/exceptions/bulk-import — import many rows from parsed CSV.
// Body: { rows: [ { exception_id?, requester_name, business_unit, asset_name,
//   policy_name, exception_type, business_justification, start_date,
//   expiry_date, criticality, compensating_control, owner_name, approver_name, status } ] }
router.post('/bulk-import', (req, res) => {
  const rows = (req.body && req.body.rows) || [];
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No rows provided. Expected { rows: [...] }.' });
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    return res.status(400).json({ error: `CSV import limit exceeded. Maximum ${MAX_IMPORT_ROWS} rows allowed.` });
  }

  const lookups = buildLookups();
  const users = Object.values(lookups.users);
  const policies = Object.values(lookups.policies);
  const assets = Object.values(lookups.assets);
  const validStatuses = require('../services/exceptionService').STATUSES;

  const byName = (list, name) => {
    if (!name) return null;
    const n = String(name).trim().toLowerCase();
    return list.find((x) => String(x.name).trim().toLowerCase() === n) || null;
  };

  const exceptions = store.read('exceptions');
  const summary = { total: rows.length, success: 0, failed: 0, warnings: [], created_ids: [] };

  rows.forEach((raw, index) => {
    const rowNum = index + 1;
    const warns = [];
    const errs = [];

    const type = (raw.exception_type || '').trim();
    const expiry = (raw.expiry_date || '').trim();
    if (!type) errs.push('exception_type is required');
    if (!expiry) errs.push('expiry_date is required');
    if (expiry && !isValidDateOrEmpty(expiry)) errs.push('expiry_date is not a valid date');
    if (!isValidDateOrEmpty(raw.start_date)) errs.push('start_date is not a valid date');
    if ((raw.business_justification || '').length > MAX_JUSTIFICATION) errs.push(`business_justification too long (max ${MAX_JUSTIFICATION})`);

    const asset = byName(assets, raw.asset_name);
    if (raw.asset_name && !asset) warns.push(`asset "${raw.asset_name}" not found — left unlinked`);
    const policy = byName(policies, raw.policy_name);
    if (raw.policy_name && !policy) warns.push(`policy "${raw.policy_name}" not found — left unlinked`);

    const owner = byName(users, raw.owner_name);
    if (raw.owner_name && !owner) warns.push(`owner "${raw.owner_name}" not found — exception will be orphaned`);
    const approver = byName(users, raw.approver_name);
    if (raw.approver_name && !approver) warns.push(`approver "${raw.approver_name}" not found`);
    const requester = byName(users, raw.requester_name);

    let status = (raw.status || '').trim() || 'submitted';
    if (!validStatuses.includes(status)) { warns.push(`status "${status}" invalid — defaulted to submitted`); status = 'submitted'; }

    if (errs.length) {
      summary.failed += 1;
      summary.warnings.push({ row: rowNum, level: 'error', messages: errs });
      return;
    }

    // Compute id from the in-memory batch so multi-row imports stay unique
    // (records aren't written to disk until the loop completes).
    const batchMax = exceptions.reduce((m, e) => {
      const n = parseInt(String(e.id).replace(/\D/g, ''), 10);
      return Number.isNaN(n) ? m : Math.max(m, n);
    }, 0);
    const finalId = `EXC-${String(batchMax + 1).padStart(4, '0')}`;

    const record = {
      id: finalId,
      requester: requester ? requester.id : (raw.requester_name || 'Imported'),
      business_unit: (raw.business_unit || (asset && asset.business_unit) || '').trim(),
      asset_id: asset ? asset.id : '',
      policy_id: policy ? policy.id : '',
      exception_type: type,
      risk_impact: '',
      justification: (raw.business_justification || '').trim(),
      start_date: (raw.start_date || isoNow().slice(0, 10)).trim(),
      expiry_date: expiry,
      criticality: (raw.criticality || (asset && asset.criticality) || '').trim(),
      compensating_control: (raw.compensating_control || '').trim(),
      compensating_control_strength: '',
      owner: owner ? owner.id : '',
      approver: approver ? approver.id : '',
      status,
      last_reviewed_at: null,
      activated_at: ['active', 'expiring_soon', 'overdue'].includes(status) ? (raw.start_date || isoNow().slice(0, 10)) : null,
      created_at: isoNow(),
      updated_at: isoNow(),
    };
    exceptions.push(record);
    addHistory(finalId, 'import', null, status, 'csv-import', `Imported from CSV (row ${rowNum}).`);

    const enriched = enrichWith(record, buildLookups());
    summary.success += 1;
    summary.created_ids.push(finalId);
    summary.warnings.push({ row: rowNum, level: warns.length ? 'warning' : 'ok', id: finalId, risk_score: enriched.risk_score, risk_level: enriched.risk_level, messages: warns });
  });

  store.write('exceptions', exceptions);
  res.status(201).json(summary);
});

// PATCH /api/exceptions/:id/status — generic lifecycle transition.
router.patch('/:id/status', (req, res) => {
  const { action, actor, note, patch } = req.body || {};
  if (!action) return res.status(400).json({ error: 'action is required' });
  const result = applyTransition(req.params.id, action, { actor, note, patch });
  if (!result.ok) return res.status(result.code || 400).json({ error: result.error });
  res.json(enrichOne(req.params.id));
});

// POST /api/exceptions/:id/review — add review comment + move to under_review.
router.post('/:id/review', (req, res) => {
  const { actor, comment, decision } = req.body || {};
  if ((comment || '').length > MAX_COMMENT) {
    return res.status(400).json({ error: `Review comment too long (max ${MAX_COMMENT} characters).` });
  }
  const ex = store.read('exceptions').find((e) => e.id === req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exception not found' });

  recordApproval(req.params.id, actor, decision || 'review', comment);
  // Move into review if it was just submitted.
  if (ex.status === 'submitted') {
    applyTransition(req.params.id, 'start_review', { actor, note: comment });
  } else {
    addHistory(req.params.id, 'review_comment', ex.status, ex.status, actor, comment);
  }
  res.json(enrichOne(req.params.id));
});

// POST /api/exceptions/:id/approve
router.post('/:id/approve', (req, res) => {
  const { actor, comment } = req.body || {};
  const result = applyTransition(req.params.id, 'approve', { actor, note: comment });
  if (!result.ok) return res.status(result.code || 400).json({ error: result.error });
  recordApproval(req.params.id, actor, 'approved', comment);
  // Auto-activate approved exceptions so they enter the live portfolio.
  applyTransition(req.params.id, 'activate', { actor, note: 'Auto-activated on approval.' });
  res.json(enrichOne(req.params.id));
});

// POST /api/exceptions/:id/reject
router.post('/:id/reject', (req, res) => {
  const { actor, comment } = req.body || {};
  const result = applyTransition(req.params.id, 'reject', { actor, note: comment });
  if (!result.ok) return res.status(result.code || 400).json({ error: result.error });
  recordApproval(req.params.id, actor, 'rejected', comment);
  res.json(enrichOne(req.params.id));
});

// POST /api/exceptions/:id/renew — renew with a new expiry date.
router.post('/:id/renew', (req, res) => {
  const { actor, comment, expiry_date, extend_days } = req.body || {};
  if (expiry_date && !isValidDateOrEmpty(expiry_date)) {
    return res.status(400).json({ error: 'expiry_date must be a valid date.' });
  }
  let newExpiry = expiry_date;
  if (!newExpiry) {
    newExpiry = addDays(new Date(), Number(extend_days) || 90).toISOString().slice(0, 10);
  }
  const result = applyTransition(req.params.id, 'renew', {
    actor,
    note: comment || `Renewed until ${newExpiry}.`,
    patch: { expiry_date: newExpiry, last_reviewed_at: isoNow() },
  });
  if (!result.ok) return res.status(result.code || 400).json({ error: result.error });
  // Re-activate after renewal.
  applyTransition(req.params.id, 'activate', { actor, note: 'Re-activated after renewal.' });
  res.json(enrichOne(req.params.id));
});

// POST /api/exceptions/:id/revoke
router.post('/:id/revoke', (req, res) => {
  const { actor, comment } = req.body || {};
  const result = applyTransition(req.params.id, 'revoke', { actor, note: comment });
  if (!result.ok) return res.status(result.code || 400).json({ error: result.error });
  recordApproval(req.params.id, actor, 'revoked', comment);
  res.json(enrichOne(req.params.id));
});

function recordApproval(exceptionId, actor, decision, comment) {
  const approvals = store.read('approvals');
  approvals.push({
    id: store.nextId('approvals', 'APR'),
    exception_id: exceptionId,
    actor: actor || 'reviewer',
    decision,
    comment: comment || '',
    timestamp: isoNow(),
  });
  store.write('approvals', approvals);
}

module.exports = router;
