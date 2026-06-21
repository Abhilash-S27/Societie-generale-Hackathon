// RiskWaiver360 — alert generation engine.
// Derives alerts from the current (enriched) exception portfolio. Alerts are
// recomputed on demand so they always reflect live risk + lifecycle state.
const store = require('./dataStore');
const { enrichAll } = require('./exceptionService');

const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 };

function mk(type, ex, severity, reason, action) {
  return {
    id: `ALERT-${type}-${ex.id}`,
    type,
    severity,
    exception_id: ex.id,
    exception_type: ex.exception_type,
    asset_name: ex.asset_name,
    business_unit: ex.business_unit,
    owner_name: ex.owner_name,
    owner_email: ex.owner_user ? ex.owner_user.email : null,
    expiry_date: ex.expiry_date,
    days_remaining: ex.days_remaining,
    risk_level: ex.risk_level,
    reason,
    recommended_action: action,
  };
}

function generate() {
  const exceptions = enrichAll();
  const alerts = [];

  for (const ex of exceptions) {
    if (['revoked', 'rejected', 'closed'].includes(ex.base_status)) continue;

    // Pending-approval exceptions haven't been activated yet — only flag overdue/expiring
    // if they are in an approved/active lifecycle state, not still awaiting decision.
    const inApprovalQueue = ['submitted', 'under_review', 'pending_approval'].includes(ex.base_status);

    if (!inApprovalQueue && ex.expiry_status === 'overdue') {
      alerts.push(mk('overdue', ex, 'critical',
        `Expired ${Math.abs(ex.days_remaining)} day(s) ago and still in effect.`,
        'Revoke or renew immediately.'));
    } else if (!inApprovalQueue && ex.expiry_status === 'expiring_soon') {
      alerts.push(mk('expiring_soon', ex, 'high',
        `Expires in ${ex.days_remaining} day(s).`,
        'Plan renewal or let it lapse with sign-off.'));
    }

    if (ex.orphaned) {
      alerts.push(mk('orphaned_owner', ex,
        ex.owner_state === 'missing' ? 'high' : 'medium',
        ex.owner_state === 'missing' ? 'No owner assigned.' : `Owner ${ex.owner_name} is inactive.`,
        'Reassign to an active owner.'));
    }

    // Only flag review overdue for exceptions that have been approved/active — not drafts in queue.
    if (!inApprovalQueue && (ex.review_state === 'overdue' || ex.review_state === 'never')) {
      alerts.push(mk('review_overdue', ex, 'medium',
        ex.review_state === 'never' ? 'Never been reviewed.' : 'Periodic review is overdue.',
        'Schedule a security review.'));
    }

    if (ex.control_strength === 'missing') {
      alerts.push(mk('missing_control', ex, 'medium',
        'No compensating control recorded.',
        'Add a compensating control.'));
    }

    const just = (ex.justification || '').trim();
    if (!just || just.length < 20) {
      alerts.push(mk('vague_justification', ex, 'low',
        'Business justification is missing or too vague.',
        'Request a detailed business justification.'));
    }

    if (ex.risk_level === 'Critical') {
      alerts.push(mk('critical_risk', ex, 'critical',
        `Critical risk score (${ex.risk_score}).`,
        ex.recommendation.text));
    }
  }

  // Stable, severity-first ordering. (No Date.now in deterministic-ish output;
  // created date stamped from stored alerts file if present, else now.)
  alerts.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  const stamp = new Date().toISOString();
  return alerts.map((a) => ({ ...a, created_date: stamp }));
}

// Persist a snapshot (used at seed/startup so alerts.json is non-empty).
function snapshot() {
  const alerts = generate();
  store.write('alerts', alerts);
  return alerts;
}

module.exports = { generate, snapshot, SEVERITY_RANK };
