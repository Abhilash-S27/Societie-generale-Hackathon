const express = require('express');
const store   = require('../services/dataStore');
const { TYPE_WEIGHTS, EXPIRING_SOON_DAYS } = require('../services/riskScoring');

const router = express.Router();

// GET /api/lookups — reference data for forms & filters.
// All list values are derived from the ACTUAL data in the current dataset
// so filters only show options that have matching records.
router.get('/', (req, res) => {
  const users      = store.read('users');
  const policies   = store.read('policies');
  const assets     = store.read('assets');
  const exceptions = store.read('exceptions');

  // Business units — from exceptions directly (CSV departments: IT, Finance, HR…)
  const businessUnits = [...new Set(
    exceptions.map(e => e.business_unit).filter(Boolean)
  )].sort();

  // Policies actually used in exceptions (5 of 15) — for forms and filters
  const usedPolicyIds = new Set(exceptions.map(e => e.policy_id).filter(Boolean));
  const usedPolicies  = policies.filter(p => usedPolicyIds.has(p.id));

  // Policy categories — only from used policies
  const policyCategories = [...new Set(
    usedPolicies.map(p => p.category).filter(Boolean)
  )].sort();

  // Exception types — only types present in current dataset
  const exceptionTypes = [...new Set(
    exceptions.map(e => e.exception_type).filter(Boolean)
  )].sort();

  // Form users — only the 30 core system users (USR-NNNN) for form dropdowns.
  // REQ-/APR- users are historical CSV persons and should not appear in new forms.
  const formUsers = users.filter(u => u.id && u.id.startsWith('USR-'));

  // Effective statuses — mirrors the effectiveStatus() logic so filter values
  // match what the exceptions endpoint returns.
  const today = new Date();
  const effectiveStatuses = new Set();
  for (const e of exceptions) {
    const base = e.status;
    if (base === 'active') {
      const daysLeft = Math.floor((new Date(e.expiry_date) - today) / 86400000);
      if (daysLeft < 0)                    effectiveStatuses.add('overdue');
      else if (daysLeft <= EXPIRING_SOON_DAYS) effectiveStatuses.add('expiring_soon');
      else                                 effectiveStatuses.add('active');
    } else {
      effectiveStatuses.add(base);
    }
  }

  // Return statuses in a meaningful display order
  const STATUS_ORDER = [
    'active', 'expiring_soon', 'overdue',
    'pending_approval', 'under_review', 'submitted', 'approved',
    'renewal_requested', 'renewed', 'escalated',
    'revoked', 'rejected', 'closed', 'draft',
  ];
  const statuses = STATUS_ORDER.filter(s => effectiveStatuses.has(s));

  res.json({
    users:             formUsers,   // 30 system users for form dropdowns
    all_users:         users,       // full 1180 for name resolution (not used in forms)
    policies:          usedPolicies, // only the 5 policies used in current dataset
    all_policies:      policies,    // full list if needed
    assets,
    exception_types:   exceptionTypes,
    business_units:    businessUnits,
    policy_categories: policyCategories,
    criticalities:     ['Low', 'Medium', 'High', 'Critical'],
    control_strengths: ['strong', 'basic', 'missing'],
    statuses,
    risk_levels:       ['Low', 'Medium', 'High', 'Critical'],
  });
});

module.exports = router;
