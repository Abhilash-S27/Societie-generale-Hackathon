// RiskWaiver360 — recommendation engine.
// Generates a single actionable recommendation per exception based on risk
// level, lifecycle status, data-quality signals, and conflicting approvals.
//
// Recommendation object (backward compatible — `text` is kept):
//   { action, title, text, message, reason, priority, owner_name, owner_id }
// Primary actions: escalate | revoke | renew | monitor (plus reassign / clarify
// / add_control / review for governance nuance).

// ctx: { ownerName, ownerId, conflictingApproval }
function build(action, title, message, reason, priority, ctx = {}) {
  return {
    action,
    title,
    text: message, // legacy field used across the UI
    message,
    reason,
    priority,
    owner_name: ctx.ownerName || null,
    owner_id: ctx.ownerId || null,
  };
}

// scored = output of scoreException(); exception = raw record
function recommend(exception, scored, ctx = {}) {
  const level = scored.level;
  const exp = scored.expiry_status;
  const orphaned = scored.orphaned;
  const ctrl = scored.control_strength;
  const status = exception.status;
  const justification = (exception.justification || '').trim();
  const conflicting = !!ctx.conflictingApproval;

  // Terminal records — nothing to action, keep for audit history.
  if (['revoked', 'rejected', 'closed'].includes(status)) {
    return build('monitor', 'No action required',
      `Exception is ${status}; retained for audit history.`,
      `Lifecycle status is ${status}`, 4, ctx);
  }

  // --- Escalation cases (highest priority) ---
  if (level === 'Critical' && exp === 'overdue') {
    return build('escalate', 'Escalate to security leadership',
      'Critical overdue exception requires immediate escalation and revocation.',
      'Critical risk score and overdue expiry status', 1, ctx);
  }
  if (level === 'Critical' && orphaned) {
    return build('escalate', 'Escalate to security leadership',
      'Critical exception has no active owner — escalate and reassign immediately.',
      'Critical risk score with missing/inactive owner', 1, ctx);
  }
  if ((level === 'High' || level === 'Critical') && conflicting) {
    return build('escalate', 'Escalate to security leadership',
      'High-risk exception has conflicting approvals — escalate to resolve the decision.',
      'High/Critical risk with conflicting approval records', 1, ctx);
  }

  // --- Governance / data-quality issues ---
  if (orphaned) {
    return build('reassign', 'Assign a new owner',
      'Assign a new active owner immediately — exception is orphaned.',
      'No active owner assigned', 1, ctx);
  }
  if (!justification || justification.length < 20) {
    return build('clarify', 'Request better justification',
      'Request a stronger business justification before approval.',
      'Justification missing or too vague', 2, ctx);
  }

  // --- Overdue but not critical: revoke or escalate by risk level ---
  if (exp === 'overdue') {
    return level === 'High'
      ? build('escalate', 'Escalate overdue exception',
        'High-risk exception is overdue — escalate for a renew or revoke decision.',
        'High risk and overdue expiry status', 1, ctx)
      : build('revoke', 'Revoke overdue exception',
        'Exception is overdue — revoke unless a renewal is formally justified.',
        'Overdue expiry status', 2, ctx);
  }

  // --- Critical (active, not overdue/orphaned) ---
  if (level === 'Critical') {
    return build('escalate', 'Escalate for immediate review',
      'Critical exception requires immediate review before any renewal.',
      'Critical risk score', 1, ctx);
  }

  // --- High + expiring soon: renew with a stronger control ---
  if (level === 'High' && exp === 'expiring_soon') {
    return build('renew', 'Review and renew with stronger control',
      'Review and renew only with a stronger compensating control.',
      'High risk and expiring soon', 2, ctx);
  }

  if (ctrl === 'missing') {
    return build('add_control', 'Add a compensating control',
      'Add a compensating control before approval.',
      'No compensating control recorded', 2, ctx);
  }

  if (level === 'High') {
    return build('review', 'Schedule a security review',
      'Schedule a security review; reduce duration on renewal.',
      'High risk score', 2, ctx);
  }

  if (level === 'Medium') {
    return build('monitor', 'Monitor and review before expiry',
      'Monitor and review before expiry.',
      'Medium risk, currently valid', 3, ctx);
  }

  return build('monitor', 'Continue until expiry',
    'Low risk — continue and monitor until expiry.',
    'Low risk, currently valid', 4, ctx);
}

module.exports = { recommend };
