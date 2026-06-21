// RiskWaiver360 — rule-based risk scoring engine.
//
// risk_score = TYPE_WEIGHT
//            + DURATION_PENALTY
//            + REVIEW_PENALTY
//            + ASSET_CRITICALITY_WEIGHT
//            + EXPIRY_STATUS_PENALTY
//            + OWNER_STATUS_PENALTY
//            - COMPENSATING_CONTROL_BONUS
// Capped to [0, 100].
//
// Risk levels: 0-30 Low | 31-60 Medium | 61-80 High | 81-100 Critical
const { daysBetween, daysRemaining, daysSince } = require('../utils/dateUtils');

const EXPIRING_SOON_DAYS = 14;

const TYPE_WEIGHTS = {
  'Admin Access': 30,
  'Firewall Exception': 25,
  'Encryption Disabled': 35,
  'Logging Disabled': 25,
  'Password Policy Exception': 20,
  'Network Exposure': 30,
  'Data Retention Exception': 20,
};

const ASSET_CRITICALITY_WEIGHTS = {
  Low: 5,
  Medium: 15,
  High: 25,
  Critical: 35,
};

const COMPENSATING_CONTROL_BONUS = {
  strong: 15,
  basic: 8,
  missing: 0,
};

const TERMINAL_STATUSES = ['revoked', 'rejected', 'closed'];

function typeWeight(type) {
  return TYPE_WEIGHTS[type] != null ? TYPE_WEIGHTS[type] : 15;
}

// Duration = requested lifespan of the waiver (start -> expiry).
function durationPenalty(startDate, expiryDate) {
  const span = daysBetween(expiryDate, startDate);
  if (span == null) return 10;
  if (span <= 7) return 5;
  if (span <= 30) return 10;
  if (span <= 90) return 20;
  return 30;
}

function assetCriticalityWeight(criticality) {
  return ASSET_CRITICALITY_WEIGHTS[criticality] != null
    ? ASSET_CRITICALITY_WEIGHTS[criticality]
    : 15;
}

// 'overdue' | 'expiring_soon' | 'valid'
function expiryStatus(exception, ref) {
  if (TERMINAL_STATUSES.includes(exception.status)) return 'valid';
  const left = daysRemaining(exception.expiry_date, ref);
  if (left == null) return 'valid';
  if (left < 0) return 'overdue';
  if (left <= EXPIRING_SOON_DAYS) return 'expiring_soon';
  return 'valid';
}

function expiryStatusPenalty(status) {
  if (status === 'overdue') return 30;
  if (status === 'expiring_soon') return 15;
  return 0;
}

// 'never' | 'overdue' | 'due' | 'recent'
function reviewState(lastReviewedAt, ref) {
  if (!lastReviewedAt) return 'never';
  const since = daysSince(lastReviewedAt, ref);
  if (since == null) return 'never';
  if (since <= 90) return 'recent';
  if (since <= 180) return 'due';
  return 'overdue';
}

function reviewPenalty(state) {
  switch (state) {
    case 'recent': return 0;
    case 'due': return 10;
    case 'overdue': return 20;
    case 'never': return 25;
    default: return 25;
  }
}

// 'active' | 'inactive' | 'missing'
function ownerState(owner) {
  if (!owner) return 'missing';
  if (owner.is_active === false) return 'inactive';
  return 'active';
}

function ownerStatusPenalty(state) {
  if (state === 'missing') return 30;
  if (state === 'inactive') return 25;
  return 0;
}

function controlStrength(exception) {
  const explicit = (exception.compensating_control_strength || '').toLowerCase();
  if (explicit && COMPENSATING_CONTROL_BONUS[explicit] != null) return explicit;
  // Fall back to inferring from free-text control field.
  const text = (exception.compensating_control || '').trim();
  if (!text) return 'missing';
  return text.length >= 40 ? 'strong' : 'basic';
}

function level(score) {
  if (score <= 30) return 'Low';
  if (score <= 60) return 'Medium';
  if (score <= 80) return 'High';
  return 'Critical';
}

// exception: raw record; asset/owner: resolved related records (may be undefined)
function scoreException(exception, asset, owner, ref = new Date()) {
  const criticality = (asset && asset.criticality) || exception.criticality || 'Medium';
  const exp = expiryStatus(exception, ref);
  const rev = reviewState(exception.last_reviewed_at, ref);
  const own = ownerState(owner);
  const ctrl = controlStrength(exception);

  const factors = {
    TYPE_WEIGHT: typeWeight(exception.exception_type),
    DURATION_PENALTY: durationPenalty(exception.start_date, exception.expiry_date),
    REVIEW_PENALTY: reviewPenalty(rev),
    ASSET_CRITICALITY_WEIGHT: assetCriticalityWeight(criticality),
    EXPIRY_STATUS_PENALTY: expiryStatusPenalty(exp),
    OWNER_STATUS_PENALTY: ownerStatusPenalty(own),
    COMPENSATING_CONTROL_BONUS: -COMPENSATING_CONTROL_BONUS[ctrl],
  };

  const raw = Object.values(factors).reduce((a, b) => a + b, 0);
  const score = Math.max(0, Math.min(100, raw));

  return {
    score,
    level: level(score),
    factors,
    breakdown: buildBreakdown(factors),
    explanation: explain(exception, asset, owner, { exp, rev, own, ctrl, criticality }),
    expiry_status: exp,
    review_state: rev,
    owner_state: own,
    control_strength: ctrl,
    orphaned: own !== 'active',
  };
}

function buildBreakdown(factors) {
  const labels = {
    TYPE_WEIGHT: 'Exception type',
    DURATION_PENALTY: 'Requested duration',
    REVIEW_PENALTY: 'Review status',
    ASSET_CRITICALITY_WEIGHT: 'Asset criticality',
    EXPIRY_STATUS_PENALTY: 'Expiry status',
    OWNER_STATUS_PENALTY: 'Owner status',
    COMPENSATING_CONTROL_BONUS: 'Compensating control',
  };
  return Object.entries(factors).map(([key, value]) => ({
    key,
    label: labels[key] || key,
    points: value,
  }));
}

function explain(exception, asset, owner, ctx) {
  const out = [];
  const t = exception.exception_type;
  const tw = typeWeight(t);
  if (tw >= 30) out.push(`${t} carries a high base risk weight.`);
  else if (tw >= 25) out.push(`${t} carries a moderate base risk weight.`);
  else out.push(`${t} carries a lower base risk weight.`);

  if (ctx.criticality === 'Critical' || ctx.criticality === 'High') {
    out.push(`${asset ? asset.name : 'The asset'} is a ${ctx.criticality.toLowerCase()}-criticality system, increasing potential impact.`);
  }
  if (ctx.exp === 'overdue') out.push('Exception is overdue — it is creating a hidden, unmanaged attack path.');
  else if (ctx.exp === 'expiring_soon') out.push('Exception is expiring soon and needs a renewal decision.');

  if (ctx.rev === 'never') out.push('This exception has never been reviewed.');
  else if (ctx.rev === 'overdue') out.push('Periodic review is overdue.');

  if (ctx.own === 'missing') out.push('No owner is assigned (orphaned exception).');
  else if (ctx.own === 'inactive') out.push(`Owner ${owner ? owner.name : ''} is inactive (orphaned exception).`);

  if (ctx.ctrl === 'missing') out.push('No compensating control is in place.');
  else if (ctx.ctrl === 'strong') out.push('A strong compensating control partially offsets the risk.');

  // Light renewal-status note (uses existing lifecycle status; no scoring change).
  if (exception.status === 'renewed') {
    out.push('Exception was formally renewed, reducing ambiguity versus an un-renewed long-running waiver.');
  } else if (exception.status === 'renewal_requested') {
    out.push('A renewal has been requested and is pending a decision.');
  }

  return out;
}

module.exports = {
  scoreException,
  expiryStatus,
  reviewState,
  ownerState,
  level,
  controlStrength,
  EXPIRING_SOON_DAYS,
  TYPE_WEIGHTS,
  ASSET_CRITICALITY_WEIGHTS,
  TERMINAL_STATUSES,
};
