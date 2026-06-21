// RiskWaiver360 — audit-ready report + dashboard aggregations.
const { enrichAll } = require('./exceptionService');
const { generate: generateAlerts } = require('./alertEngine');
const { detectAll } = require('./conflictDetection');

const ACTIVE_STATUSES = ['active', 'approved', 'renewed', 'expiring_soon', 'overdue', 'escalated', 'renewal_requested'];
const PENDING_STATUSES = ['submitted', 'under_review', 'pending_approval'];

function countBy(rows, keyFn) {
  const out = {};
  for (const r of rows) {
    const k = keyFn(r) || '—';
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function toPairs(obj) {
  return Object.entries(obj).map(([name, value]) => ({ name, value }));
}

function isActive(ex) {
  return ACTIVE_STATUSES.includes(ex.base_status);
}
function isPending(ex) {
  return PENDING_STATUSES.includes(ex.base_status);
}

function summarize(exceptions) {
  const total = exceptions.length;
  const active = exceptions.filter(isActive);
  const pending = exceptions.filter(isPending);
  const expiringSoon = exceptions.filter((e) => e.expiry_status === 'expiring_soon' && isActive(e));
  const overdue = exceptions.filter((e) => e.expiry_status === 'overdue' && isActive(e));
  const orphaned = exceptions.filter((e) => e.orphaned && !['revoked', 'rejected', 'closed'].includes(e.base_status));
  const highCritical = exceptions.filter((e) => e.risk_level === 'High' || e.risk_level === 'Critical');
  // Reviews that are overdue or never done (matches the review_overdue alert).
  const overdueReviews = exceptions.filter(
    (e) => (e.review_state === 'overdue' || e.review_state === 'never')
      && !['revoked', 'rejected', 'closed'].includes(e.base_status)
  );
  const avg = total ? Math.round(exceptions.reduce((s, e) => s + e.risk_score, 0) / total) : 0;

  return {
    total_exceptions: total,
    active_exceptions: active.length,
    pending_review: pending.length,
    expiring_soon: expiringSoon.length,
    overdue_exceptions: overdue.length,
    overdue_reviews: overdueReviews.length,
    orphaned_exceptions: orphaned.length,
    high_critical_exceptions: highCritical.length,
    average_risk_score: avg,
  };
}

function riskDistribution(exceptions) {
  const base = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  for (const e of exceptions) base[e.risk_level] = (base[e.risk_level] || 0) + 1;
  return toPairs(base);
}

function statusDistribution(exceptions) {
  return toPairs(countBy(exceptions, (e) => e.status));
}

function monthlyTrend(exceptions) {
  const byMonth = {};
  for (const e of exceptions) {
    const d = e.start_date || e.created_at;
    if (!d) continue;
    const key = String(d).slice(0, 7); // YYYY-MM
    byMonth[key] = (byMonth[key] || 0) + 1;
  }
  return Object.keys(byMonth)
    .sort()
    .map((name) => ({ name, value: byMonth[name] }));
}

function hotspots(exceptions) {
  const byAsset = {};
  for (const e of exceptions) {
    const key = e.asset_name || '—';
    if (!byAsset[key]) byAsset[key] = { name: key, business_unit: e.business_unit, count: 0, risk: 0 };
    byAsset[key].count += 1;
    byAsset[key].risk += e.risk_score;
  }
  return Object.values(byAsset)
    .map((h) => ({ ...h, value: h.risk, avg_risk: Math.round(h.risk / h.count) }))
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 6);
}

function topRiskExceptions(exceptions, n = 8) {
  return [...exceptions]
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, n)
    .map((e) => ({
      id: e.id,
      exception_type: e.exception_type,
      asset_name: e.asset_name,
      business_unit: e.business_unit,
      owner_name: e.owner_name,
      status: e.status,
      risk_score: e.risk_score,
      risk_level: e.risk_level,
      days_remaining: e.days_remaining,
      recommendation: e.recommendation,
    }));
}

// Risk-weighted roll-up by an arbitrary key (sum of risk scores). Used for
// "top risky business units" and risk accumulation surfacing.
function riskByGroup(exceptions, keyFn, n) {
  const acc = {};
  for (const e of exceptions) {
    const k = keyFn(e) || '—';
    if (!acc[k]) acc[k] = { name: k, value: 0, count: 0 };
    acc[k].value += e.risk_score;
    acc[k].count += 1;
  }
  const rows = Object.values(acc).sort((a, b) => b.value - a.value);
  return n ? rows.slice(0, n) : rows;
}

// Risk heatmap: business unit (rows) x risk level (columns), cell = count.
function buildHeatmap(exceptions) {
  const levels = ['Low', 'Medium', 'High', 'Critical'];
  const map = {};
  for (const e of exceptions) {
    const bu = e.business_unit || '—';
    if (!map[bu]) map[bu] = { business_unit: bu, Low: 0, Medium: 0, High: 0, Critical: 0, total: 0 };
    if (map[bu][e.risk_level] != null) map[bu][e.risk_level] += 1;
    map[bu].total += 1;
  }
  const rows = Object.values(map).sort((a, b) => b.total - a.total);
  let max = 0;
  for (const r of rows) for (const l of levels) max = Math.max(max, r[l]);
  return { levels, rows, max };
}

function dashboard() {
  const exceptions = enrichAll();
  return {
    summary: summarize(exceptions),
    charts: {
      risk_distribution: riskDistribution(exceptions),
      status_distribution: statusDistribution(exceptions),
      by_policy_category: toPairs(countBy(exceptions, (e) => e.policy_category)),
      by_business_unit: toPairs(countBy(exceptions, (e) => e.business_unit)),
      by_type: toPairs(countBy(exceptions, (e) => e.exception_type)),
      top_risky_business_units: riskByGroup(exceptions, (e) => e.business_unit, 6),
      monthly_trend: monthlyTrend(exceptions),
      heatmap: buildHeatmap(exceptions),
    },
    hotspots: hotspots(exceptions),
    top_risk_exceptions: topRiskExceptions(exceptions),
    conflicts: detectAll().summary,
  };
}

function auditReport() {
  const exceptions = enrichAll();
  const summary = summarize(exceptions);
  const alerts = generateAlerts();

  const overdueList = exceptions
    .filter((e) => e.expiry_status === 'overdue' && isActive(e))
    .sort((a, b) => a.days_remaining - b.days_remaining);
  const orphanedList = exceptions
    .filter((e) => e.orphaned && !['revoked', 'rejected', 'closed'].includes(e.base_status));

  // Recommendation summary roll-up.
  const recSummary = countBy(exceptions, (e) => e.recommendation.action);
  const conflictResult = detectAll();

  return {
    generated_at: new Date().toISOString(),
    executive_summary: buildExecutiveSummary(summary),
    summary,
    by_policy: toPairs(countBy(exceptions, (e) => e.policy_name)),
    by_business_unit: toPairs(countBy(exceptions, (e) => e.business_unit)),
    by_owner: toPairs(countBy(exceptions, (e) => e.owner_name || 'Unassigned')),
    renewal_revocation_status: {
      renewed: exceptions.filter((e) => e.base_status === 'renewed').length,
      renewal_requested: exceptions.filter((e) => e.base_status === 'renewal_requested').length,
      revoked: exceptions.filter((e) => e.base_status === 'revoked').length,
      rejected: exceptions.filter((e) => e.base_status === 'rejected').length,
      active: summary.active_exceptions,
    },
    hotspots: hotspots(exceptions),
    overdue_exceptions: overdueList,
    orphaned_exceptions: orphanedList,
    recommendations_summary: toPairs(recSummary),
    alert_count: alerts.length,
    conflicts: {
      summary: conflictResult.summary,
      findings: conflictResult.findings,
      accumulation: {
        by_asset: conflictResult.accumulation.by_asset.slice(0, 6),
        by_owner: conflictResult.accumulation.by_owner.slice(0, 6),
        by_policy_category: conflictResult.accumulation.by_policy_category,
        by_business_unit: conflictResult.accumulation.by_business_unit,
      },
    },
    exceptions,
  };
}

function buildExecutiveSummary(s) {
  return (
    `As of this report, the organization holds ${s.total_exceptions} tracked policy exceptions, ` +
    `${s.active_exceptions} of which are currently active. ` +
    `${s.high_critical_exceptions} exception(s) sit at High or Critical risk, ` +
    `${s.overdue_exceptions} are overdue, and ${s.orphaned_exceptions} are orphaned (no active owner). ` +
    `${s.expiring_soon} exception(s) expire within 14 days. ` +
    `The portfolio's average risk score is ${s.average_risk_score}/100. ` +
    `Priority actions: revoke or renew overdue exceptions, reassign orphaned ones, and review all High/Critical items before renewal.`
  );
}

module.exports = { dashboard, auditReport, summarize, ACTIVE_STATUSES, PENDING_STATUSES };
