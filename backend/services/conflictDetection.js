// RiskWaiver360 — overlap, conflict, duplicate, and risk-accumulation detection.
// Pure read layer: consumes enriched exceptions + raw approvals and returns
// plain-English findings. Does NOT mutate any data.
const store = require('./dataStore');
const { enrichAll } = require('./exceptionService');
const { toDate, isoNow } = require('../utils/dateUtils');

const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 };
const LIVE_STATUSES = [
  'active', 'submitted', 'approved', 'expiring_soon', 'overdue',
  'under_review', 'pending_approval', 'escalated', 'renewal_requested', 'renewed',
];
const TERMINAL = ['revoked', 'rejected', 'closed'];

function levelToSeverity(level) {
  return { Critical: 'critical', High: 'high', Medium: 'medium', Low: 'low' }[level] || 'low';
}
function maxSeverity(list) {
  return list.reduce((best, s) => (SEVERITY_RANK[s] > SEVERITY_RANK[best] ? s : best), 'low');
}

// Inclusive date-range overlap.
function rangesOverlap(a, b) {
  const aStart = toDate(a.start_date);
  const aEnd = toDate(a.expiry_date);
  const bStart = toDate(b.start_date);
  const bEnd = toDate(b.expiry_date);
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart <= bEnd && bStart <= aEnd;
}

function isLive(e) {
  return LIVE_STATUSES.includes(e.base_status);
}

function tokenize(text) {
  return new Set(
    String(text || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2)
  );
}
function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = new Set([...a, ...b]).size;
  return union ? inter / union : 0;
}
function daysApart(a, b) {
  const da = toDate(a);
  const db = toDate(b);
  if (!da || !db) return Infinity;
  return Math.abs((da - db) / (24 * 60 * 60 * 1000));
}

function mkFinding(type, severity, ids, ex, reason, action, extra = {}) {
  return {
    conflict_id: `CONF-${type}-${[...ids].sort().join('_')}${extra.suffix ? '-' + extra.suffix : ''}`,
    type,
    severity,
    related_exception_ids: ids,
    asset: ex.asset_name || '—',
    policy: ex.policy_name || '—',
    category: ex.policy_category || '—',
    reason,
    recommended_action: action,
    created_at: isoNow(),
  };
}

// 1. Overlapping exceptions: group by (asset + policy) or (asset + type).
//    Emit ONE finding per cluster instead of one per pair — prevents combinatorial
//    explosion when many exceptions share the same asset and policy scope.
function detectOverlaps(exceptions) {
  const out = [];
  const live = exceptions.filter(isLive);

  // Cluster by asset_id + policy_id
  const byAssetPolicy = {};
  for (const e of live) {
    if (!e.policy_id) continue;
    const key = `${e.asset_id}||${e.policy_id}`;
    if (!byAssetPolicy[key]) byAssetPolicy[key] = [];
    byAssetPolicy[key].push(e);
  }

  // Track (asset_id||type) keys already surfaced by a policy-level finding
  const coveredByPolicy = new Set();

  for (const items of Object.values(byAssetPolicy)) {
    if (items.length < 2) continue;
    let hasOverlap = false;
    outer: for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (rangesOverlap(items[i], items[j])) { hasOverlap = true; break outer; }
      }
    }
    if (!hasOverlap) continue;
    const rep = items[0];
    items.forEach((e) => coveredByPolicy.add(`${e.asset_id}||${e.exception_type}`));
    // Overlaps are governance issues — cap at 'high' regardless of individual criticality
    const rawSev = maxSeverity([...items.map((e) => levelToSeverity(e.risk_level)), 'medium']);
    const sev = rawSev === 'critical' ? 'high' : rawSev;
    out.push(mkFinding('overlap', sev, items.map((e) => e.id), rep,
      `${items.length} active exceptions on "${rep.asset_name}" share the same policy (${rep.policy_name}) with overlapping date ranges — stacked risk under a single policy scope.`,
      'Consolidate into one waiver or revoke redundant exceptions.'));
  }

  // Cluster by asset_id + exception_type (only if not already covered by policy)
  const byAssetType = {};
  for (const e of live) {
    const key = `${e.asset_id}||${e.exception_type}`;
    if (!byAssetType[key]) byAssetType[key] = [];
    byAssetType[key].push(e);
  }

  for (const [key, items] of Object.entries(byAssetType)) {
    if (items.length < 2) continue;
    if (coveredByPolicy.has(key)) continue;
    let hasOverlap = false;
    outer: for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (rangesOverlap(items[i], items[j])) { hasOverlap = true; break outer; }
      }
    }
    if (!hasOverlap) continue;
    const rep = items[0];
    const rawSev = maxSeverity([...items.map((e) => levelToSeverity(e.risk_level)), 'medium']);
    const sev = rawSev === 'critical' ? 'high' : rawSev;
    out.push(mkFinding('overlap', sev, items.map((e) => e.id), rep,
      `${items.length} active exceptions on "${rep.asset_name}" share the same type (${rep.exception_type}) with overlapping date ranges — no consolidated oversight.`,
      'Merge overlapping exceptions and remove redundant waivers.',
      { suffix: 'type' }));
  }

  return out;
}

// 2. Conflicting approvals: opposite decisions, differing approvers, or a
//    decision that contradicts the current lifecycle status.
function detectConflictingApprovals(exceptions, approvals) {
  const out = [];
  const byEx = {};
  for (const a of approvals) (byEx[a.exception_id] = byEx[a.exception_id] || []).push(a);

  for (const ex of exceptions) {
    const rows = byEx[ex.id];
    if (!rows || rows.length === 0) continue;
    const decisions = new Set(rows.map((r) => r.decision));
    const reasons = [];
    let sev = 'medium';

    if (decisions.has('approved') && decisions.has('rejected')) {
      reasons.push('has both approved and rejected decisions on record');
      sev = 'high';
    }
    const approvers = new Set(rows.map((r) => r.actor));
    if (approvers.size > 1 && decisions.size > 1) {
      reasons.push('different approvers recorded different decisions');
      sev = maxSeverity([sev, 'high']);
    }
    if (decisions.has('approved') && ex.base_status === 'rejected') {
      reasons.push('an approval exists but the exception is currently rejected');
      sev = maxSeverity([sev, 'high']);
    }
    if (decisions.has('rejected') && LIVE_STATUSES.includes(ex.base_status) && !['rejected'].includes(ex.base_status)) {
      reasons.push('a rejection exists but the exception is still in an active lifecycle state');
      sev = maxSeverity([sev, 'critical']);
    }

    if (reasons.length) {
      out.push(mkFinding('conflicting_approval', sev, [ex.id], ex,
        `${ex.id} ${reasons.join('; ')}.`,
        'Reconcile the approval record; confirm the authoritative decision and align the status.'));
    }
  }
  return out;
}

// 3. Duplicate / similar exceptions: group by (BU + asset + type).
//    Emit ONE finding per cluster that has any pair with similar justification
//    and close start dates — avoids pairwise combinatorial inflation.
function detectDuplicates(exceptions) {
  const out = [];
  const live = exceptions.filter(isLive);

  const groups = {};
  for (const e of live) {
    const key = `${e.business_unit}||${e.asset_id}||${e.exception_type}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }

  for (const items of Object.values(groups)) {
    if (items.length < 2) continue;
    let hasDup = false;
    outer: for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i], b = items[j];
        const sim = jaccard(tokenize(a.justification), tokenize(b.justification));
        const bothVague = (a.justification || '').trim().length < 20 && (b.justification || '').trim().length < 20;
        if ((sim >= 0.4 || bothVague) && daysApart(a.start_date, b.start_date) <= 30) {
          hasDup = true; break outer;
        }
      }
    }
    if (!hasDup) continue;
    const rep = items[0];
    // Duplicates are process-control issues — cap at 'high'
    const rawSev = maxSeverity([...items.map((e) => levelToSeverity(e.risk_level)), 'medium']);
    const sev = rawSev === 'critical' ? 'high' : rawSev;
    out.push(mkFinding('duplicate', sev, items.map((e) => e.id), rep,
      `${items.length} ${rep.exception_type} exceptions in ${rep.business_unit} on "${rep.asset_name}" appear duplicated — similar justifications with start dates within 30 days of each other.`,
      'Merge into one waiver and withdraw duplicates to avoid double-counting risk.'));
  }

  return out;
}

// 4. Risk accumulation: roll up risk by asset / owner / policy category / BU.
function levelFromTotal(total) {
  if (total >= 1500) return 'critical';
  if (total >= 800) return 'high';
  if (total >= 400) return 'medium';
  return 'low';
}
function groupRisk(exceptions, keyFn) {
  const acc = {};
  for (const e of exceptions) {
    if (TERMINAL.includes(e.base_status)) continue;
    const k = keyFn(e) || '—';
    if (!acc[k]) acc[k] = { name: k, total_risk: 0, count: 0, ids: [] };
    acc[k].total_risk += e.risk_score;
    acc[k].count += 1;
    acc[k].ids.push(e.id);
  }
  return Object.values(acc)
    .map((g) => ({ ...g, avg_risk: Math.round(g.total_risk / g.count), level: levelFromTotal(g.total_risk) }))
    .sort((a, b) => b.total_risk - a.total_risk);
}

function accumulationFindings(groups, dimension) {
  const out = [];
  for (const g of groups) {
    if (g.count >= 3 && g.total_risk >= 200) {
      out.push(mkFinding('accumulation', levelFromTotal(g.total_risk), g.ids,
        { asset_name: dimension === 'asset' ? g.name : '—', policy_name: '—', policy_category: dimension === 'policy category' ? g.name : '—' },
        `${g.count} active exceptions on ${dimension} "${g.name}" accumulate to a combined risk of ${g.total_risk} (avg ${g.avg_risk}) — a hidden hotspot.`,
        'Review this hotspot holistically; consolidate, add controls, or revoke to lower combined exposure.',
        { suffix: dimension.replace(/\s/g, '') }));
    }
  }
  return out;
}

function detectAll() {
  const exceptions = enrichAll();
  const approvals = store.read('approvals');

  const accumulation = {
    by_asset: groupRisk(exceptions, (e) => e.asset_name),
    by_owner: groupRisk(exceptions, (e) => e.owner_name || 'Unassigned'),
    by_policy_category: groupRisk(exceptions, (e) => e.policy_category),
    by_business_unit: groupRisk(exceptions, (e) => e.business_unit),
  };

  const findings = [
    ...detectOverlaps(exceptions),
    ...detectConflictingApprovals(exceptions, approvals),
    ...detectDuplicates(exceptions),
    ...accumulationFindings(accumulation.by_asset, 'asset'),
    ...accumulationFindings(accumulation.by_owner, 'owner'),
  ];
  findings.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  return { findings, accumulation, summary: summarize(findings) };
}

function summarize(findings) {
  const count = (t) => findings.filter((f) => f.type === t).length;
  return {
    total: findings.length,
    overlaps: count('overlap'),
    conflicting_approvals: count('conflicting_approval'),
    duplicates: count('duplicate'),
    accumulation: count('accumulation'),
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    top_findings: findings.slice(0, 5),
  };
}

// Findings touching a single exception (for the details page).
function forException(id) {
  const { findings } = detectAll();
  return findings.filter((f) => f.related_exception_ids.includes(id));
}

// Map exceptionId -> { has, label, severity, types } for registry badges.
function flagsByException(findings) {
  const map = {};
  for (const f of findings) {
    for (const id of f.related_exception_ids) {
      if (!map[id]) map[id] = { types: new Set(), severities: [] };
      map[id].types.add(f.type);
      map[id].severities.push(f.severity);
    }
  }
  const out = {};
  for (const [id, v] of Object.entries(map)) {
    let label = 'Conflict';
    if (v.types.has('overlap')) label = 'Overlap';
    else if (v.types.has('duplicate')) label = 'Duplicate';
    else if (v.types.has('conflicting_approval')) label = 'Conflict';
    else if (v.types.has('accumulation')) label = 'Accumulation';
    out[id] = { has: true, label, severity: maxSeverity(v.severities), types: [...v.types] };
  }
  return out;
}

module.exports = { detectAll, forException, flagsByException, SEVERITY_RANK };
