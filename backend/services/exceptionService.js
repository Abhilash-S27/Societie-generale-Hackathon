// RiskWaiver360 — exception enrichment + lifecycle state machine.
// Central place that joins an exception to its policy/asset/owner/approver,
// computes risk + recommendation + days remaining, and validates transitions.
const store = require('./dataStore');
const { scoreException, expiryStatus } = require('./riskScoring');
const { recommend } = require('./recommendationEngine');
const { daysRemaining, isoNow } = require('../utils/dateUtils');

// Lifecycle statuses.
const STATUSES = [
  'draft', 'submitted', 'under_review', 'pending_approval', 'approved',
  'active', 'expiring_soon', 'renewal_requested', 'renewed', 'revoked',
  'rejected', 'overdue', 'escalated', 'closed',
];

// action -> { from: [...allowed], to: targetStatus }
const TRANSITIONS = {
  submit: { from: ['draft', 'rejected'], to: 'submitted' },
  start_review: { from: ['submitted'], to: 'under_review' },
  approve: { from: ['under_review', 'pending_approval', 'submitted'], to: 'approved' },
  reject: { from: ['under_review', 'pending_approval', 'submitted'], to: 'rejected' },
  activate: { from: ['approved', 'renewed'], to: 'active' },
  request_renewal: { from: ['active', 'expiring_soon', 'overdue'], to: 'renewal_requested' },
  renew: { from: ['renewal_requested', 'active', 'expiring_soon', 'overdue'], to: 'renewed' },
  revoke: { from: STATUSES.filter((s) => !['revoked', 'closed', 'rejected'].includes(s)), to: 'revoked' },
  escalate: { from: STATUSES.filter((s) => !['closed', 'rejected', 'revoked'].includes(s)), to: 'escalated' },
  close: { from: STATUSES.filter((s) => s !== 'closed'), to: 'closed' },
};

function indexBy(rows, key = 'id') {
  const m = {};
  for (const r of rows) m[r[key]] = r;
  return m;
}

// Derive a presentation status that reflects time (expiring/overdue) without
// overwriting terminal/in-flight statuses.
function effectiveStatus(exception, scored) {
  const s = exception.status;
  const liveStatuses = ['active', 'renewed', 'approved'];
  if (liveStatuses.includes(s)) {
    if (scored.expiry_status === 'overdue') return 'overdue';
    if (scored.expiry_status === 'expiring_soon') return 'expiring_soon';
  }
  return s;
}

// --- CIA Triad risk-interpretation layer (derived from exception type / policy) ---
const CIA_BY_TYPE = {
  'Encryption Disabled': 'Confidentiality',
  'Data Access Exception': 'Confidentiality',
  'Data Retention Exception': 'Confidentiality',
  'Admin Access': 'Integrity',
  'Privileged Access Extension': 'Integrity',
  'Firewall Exception': 'Availability',
  'Network Exposure': 'Availability',
  'Logging Disabled': 'Multiple',
  'Password Policy Exception': 'Multiple',
};

function ciaImpact(exceptionType, policyName) {
  if (policyName === 'Customer Data Protection Policy') return 'Confidentiality';
  return CIA_BY_TYPE[exceptionType] || 'Multiple';
}

function ciaExplanation(cia, exceptionType, assetName) {
  const a = assetName || 'the affected system';
  switch (cia) {
    case 'Confidentiality':
      return `This exception affects Confidentiality — ${exceptionType} can expose sensitive data on ${a}.`;
    case 'Integrity':
      return `This exception affects Integrity — ${exceptionType} risks unauthorized or incorrect changes on ${a}.`;
    case 'Availability':
      return `This exception affects Availability — ${exceptionType} can lead to service disruption on ${a}.`;
    default:
      return `This exception affects multiple CIA dimensions (confidentiality, integrity, and/or availability).`;
  }
}

function enrichWith(exception, lookups) {
  const asset = lookups.assets[exception.asset_id];
  const owner = lookups.users[exception.owner];
  const approver = lookups.users[exception.approver];
  const requester = lookups.users[exception.requester] || { name: exception.requester };
  const policy = lookups.policies[exception.policy_id];

  const scored = scoreException(exception, asset, owner);
  const cia = ciaImpact(exception.exception_type, policy ? policy.name : null);
  const rec = recommend(exception, scored, {
    ownerName: owner ? owner.name : null,
    ownerId: exception.owner || null,
    conflictingApproval: lookups.conflictingApprovalIds
      ? lookups.conflictingApprovalIds.has(exception.id)
      : false,
  });
  const left = daysRemaining(exception.expiry_date);

  return {
    ...exception,
    status: effectiveStatus(exception, scored),
    base_status: exception.status,
    asset: asset || null,
    asset_name: asset ? asset.name : exception.asset_id,
    business_unit: exception.business_unit || (asset && asset.business_unit) || '—',
    policy: policy || null,
    policy_name: policy ? policy.name : exception.policy_id,
    policy_category: policy ? policy.category : '—',
    owner_user: owner || null,
    owner_name: owner ? owner.name : null,
    approver_user: approver || null,
    approver_name: approver ? approver.name : null,
    requester_name: requester.name,
    risk_score: scored.score,
    risk_level: scored.level,
    risk_breakdown: scored.breakdown,
    risk_factors: scored.factors,
    risk_explanation: [...scored.explanation, ciaExplanation(cia, exception.exception_type, asset ? asset.name : null)],
    cia_impact: cia,
    expiry_status: scored.expiry_status,
    review_state: scored.review_state,
    owner_state: scored.owner_state,
    control_strength: scored.control_strength,
    orphaned: scored.orphaned,
    days_remaining: left,
    recommendation: rec,
  };
}

// Exceptions whose approval record is internally conflicting (used to drive
// the "escalate on conflicting approval" recommendation). Mirrors the primary
// signal in conflictDetection without creating a circular dependency.
function conflictingApprovalIds() {
  const approvals = store.read('approvals');
  const byEx = {};
  for (const a of approvals) (byEx[a.exception_id] = byEx[a.exception_id] || []).push(a);
  const ids = new Set();
  for (const [id, rows] of Object.entries(byEx)) {
    const decisions = new Set(rows.map((r) => r.decision));
    const actors = new Set(rows.map((r) => r.actor));
    if ((decisions.has('approved') && decisions.has('rejected')) || (actors.size > 1 && decisions.size > 1)) {
      ids.add(id);
    }
  }
  return ids;
}

function buildLookups() {
  return {
    assets: indexBy(store.read('assets')),
    users: indexBy(store.read('users')),
    policies: indexBy(store.read('policies')),
    conflictingApprovalIds: conflictingApprovalIds(),
  };
}

function enrichAll() {
  const lookups = buildLookups();
  return store.read('exceptions').map((e) => enrichWith(e, lookups));
}

function enrichOne(id) {
  const raw = store.read('exceptions').find((e) => e.id === id);
  if (!raw) return null;
  return enrichWith(raw, buildLookups());
}

function addHistory(exceptionId, action, fromStatus, toStatus, actor, note) {
  const history = store.read('exception_history');
  const entry = {
    id: store.nextId('exception_history', 'HIST'),
    exception_id: exceptionId,
    action,
    from_status: fromStatus,
    to_status: toStatus,
    actor: actor || 'system',
    note: note || '',
    timestamp: isoNow(),
  };
  history.push(entry);
  store.write('exception_history', history);
  return entry;
}

// Apply a lifecycle action. Returns { ok, exception, error }.
function applyTransition(id, action, { actor, note, patch } = {}) {
  const exceptions = store.read('exceptions');
  const idx = exceptions.findIndex((e) => e.id === id);
  if (idx === -1) return { ok: false, error: 'Exception not found', code: 404 };

  const transition = TRANSITIONS[action];
  if (!transition) return { ok: false, error: `Unknown action: ${action}`, code: 400 };

  const current = exceptions[idx];
  if (!transition.from.includes(current.status)) {
    return {
      ok: false,
      code: 409,
      error: `Cannot ${action} from status "${current.status}".`,
    };
  }

  const from = current.status;
  const to = transition.to;
  const updated = { ...current, status: to, updated_at: isoNow(), ...(patch || {}) };

  if (action === 'start_review' || action === 'approve') {
    updated.last_reviewed_at = isoNow();
  }
  if (action === 'activate' && !updated.activated_at) {
    updated.activated_at = isoNow();
  }

  exceptions[idx] = updated;
  store.write('exceptions', exceptions);
  addHistory(id, action, from, to, actor, note);
  return { ok: true, exception: updated };
}

module.exports = {
  STATUSES,
  TRANSITIONS,
  enrichAll,
  enrichOne,
  enrichWith,
  buildLookups,
  addHistory,
  applyTransition,
  effectiveStatus,
};
