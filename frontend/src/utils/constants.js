export const ROLES = [
  { key: 'Requester', desc: 'Submit and track exception requests', icon: 'UserPlus' },
  { key: 'Security Reviewer', desc: 'Review, comment, and triage requests', icon: 'ShieldCheck' },
  { key: 'Approver', desc: 'Approve, reject, renew, and revoke', icon: 'Gavel' },
  { key: 'Auditor/Admin', desc: 'Full visibility and audit reporting', icon: 'ClipboardList' },
];

// --- Role-based demo navigation & permissions (frontend only) ---

// Ordered sidebar paths each role may see.
export const ROLE_NAV = {
  Requester: ['/dashboard', '/my-requests', '/add'],
  'Security Reviewer': ['/dashboard', '/registry', '/review', '/risk-scoring', '/alerts'],
  Approver: ['/dashboard', '/registry', '/review', '/risk-scoring', '/alerts', '/grc-intelligence', '/audit'],
  'Auditor/Admin': ['/dashboard', '/registry', '/risk-scoring', '/alerts', '/grc-intelligence', '/audit', '/settings'],
};

// Lifecycle action codes each role may perform on the Exception Details page.
export const ROLE_LIFECYCLE_ACTIONS = {
  Requester: ['submit'],
  'Security Reviewer': ['start_review'],
  Approver: ['submit', 'start_review', 'approve', 'reject', 'activate', 'request_renewal', 'renew', 'revoke', 'escalate', 'close'],
  'Auditor/Admin': [],
};

// Role-specific dashboard heading + quick actions.
export const ROLE_DASHBOARD = {
  Requester: {
    heading: 'Requester Dashboard',
    actions: [
      { label: 'Create New Exception', to: '/add', primary: true },
      { label: 'View My Requests', to: '/my-requests' },
    ],
  },
  'Security Reviewer': {
    heading: 'Security Reviewer Dashboard',
    actions: [
      { label: 'Open Review Queue', to: '/review', primary: true },
      { label: 'View Risk Scoring', to: '/risk-scoring' },
      { label: 'View Alerts', to: '/alerts' },
    ],
  },
  Approver: {
    heading: 'Approver Dashboard',
    actions: [
      { label: 'Open Review Queue', to: '/review', primary: true },
      { label: 'Approve Pending Exceptions', to: '/review' },
      { label: 'View Critical Risks', to: '/risk-scoring' },
    ],
  },
  'Auditor/Admin': {
    heading: 'Auditor/Admin Dashboard',
    actions: [
      { label: 'Open Audit Report', to: '/audit', primary: true },
      { label: 'View GRC Intelligence', to: '/grc-intelligence' },
      { label: 'Print/Export Report', to: '/audit' },
    ],
  },
};

// Whether a role may open a given path (route guard for direct-URL access).
// Dashboard and exception detail views are always allowed for any logged-in role.
export function isPathAllowed(role, path) {
  if (!role) return false;
  if (path === '/' || path === '/dashboard') return true;
  if (path.startsWith('/exceptions/')) return true; // detail view (read) for all
  const nav = ROLE_NAV[role] || [];
  return nav.some((p) => path === p || path.startsWith(`${p}/`));
}

export const RISK_COLORS = {
  Low: '#16A34A',
  Medium: '#F59E0B',
  High: '#EA580C',
  Critical: '#DC2626',
};

export const STATUS_GROUPS = {
  active: ['active', 'approved', 'renewed'],
  pending: ['submitted', 'under_review', 'pending_approval'],
  attention: ['overdue', 'expiring_soon', 'escalated', 'renewal_requested'],
  closed: ['revoked', 'rejected', 'closed'],
  draft: ['draft'],
};

export const STATUS_COLORS = {
  draft: '#64748b',
  submitted: '#0ea5e9',
  under_review: '#6366f1',
  pending_approval: '#8b5cf6',
  approved: '#0891b2',
  active: '#16a34a',
  expiring_soon: '#d97706',
  renewal_requested: '#d97706',
  renewed: '#0d9488',
  revoked: '#64748b',
  rejected: '#94a3b8',
  overdue: '#b91c1c',
  escalated: '#dc2626',
  closed: '#64748b',
};

export const SEVERITY_COLORS = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#F59E0B',
  low: '#16A34A',
};

export const CHART_PALETTE = ['#2563EB', '#0891b2', '#7c3aed', '#F59E0B', '#16A34A', '#db2777', '#64748B', '#EA580C'];

export const CONFLICT_COLORS = {
  Clean: '#16a34a',
  Overlap: '#ea580c',
  Duplicate: '#d97706',
  Conflict: '#b91c1c',
  Accumulation: '#7c3aed',
};

export const CONFLICT_TYPE_LABELS = {
  overlap: 'Overlap',
  conflicting_approval: 'Conflicting Approval',
  duplicate: 'Duplicate',
  accumulation: 'Risk Accumulation',
};

// CIA Triad risk-interpretation badges (muted, enterprise palette).
export const CIA_COLORS = {
  Confidentiality: '#4f46e5',
  Integrity: '#0d9488',
  Availability: '#b45309',
  Multiple: '#64748b',
};

export const CIA_MEANINGS = {
  Confidentiality: 'Risk of sensitive data exposure',
  Integrity: 'Risk of unauthorized or incorrect changes',
  Availability: 'Risk of service disruption or downtime',
  Multiple: 'Affects more than one CIA dimension',
};

// Which lifecycle action buttons make sense from a given base status.
export const ACTIONS_BY_STATUS = {
  draft: ['submit'],
  submitted: ['start_review', 'approve', 'reject'],
  under_review: ['approve', 'reject', 'escalate'],
  pending_approval: ['approve', 'reject', 'escalate'],
  approved: ['activate', 'revoke'],
  active: ['request_renewal', 'renew', 'revoke', 'escalate'],
  expiring_soon: ['renew', 'revoke', 'escalate'],
  overdue: ['renew', 'revoke', 'escalate'],
  renewal_requested: ['renew', 'revoke'],
  renewed: ['activate', 'revoke'],
  escalated: ['renew', 'revoke', 'close'],
  revoked: [],
  rejected: ['submit'],
  closed: [],
};

export const ACTION_LABELS = {
  submit: 'Submit for Review',
  start_review: 'Start Review',
  approve: 'Approve',
  reject: 'Reject',
  activate: 'Activate',
  request_renewal: 'Request Renewal',
  renew: 'Renew',
  revoke: 'Revoke',
  escalate: 'Escalate',
  close: 'Close',
};
