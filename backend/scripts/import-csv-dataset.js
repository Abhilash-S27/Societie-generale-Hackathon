/**
 * import-csv-dataset.js
 *
 * Full authoritative import from exception_registry.csv:
 *  - Builds individual user records for every unique requester + approver in the CSV
 *  - Keeps existing Security Reviewer + Auditor/Admin users (needed for demo roles)
 *  - Uses exact exception type strings that match riskScoring.js TYPE_WEIGHTS
 *  - Stores owners as asset-system owners (≠ requester)
 *  - Writes: users.json, exceptions.json, exception_history.json, approvals.json
 *
 * Run: node backend/scripts/import-csv-dataset.js
 */

const fs   = require('fs');
const path = require('path');

const CSV_PATH  = path.join(__dirname, '../../../exception_registry.csv');
const DATA_DIR  = path.join(__dirname, '../data');
const SEED_DIR  = path.join(__dirname, '../seed');

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    vals.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
}

function nameToEmail(name) {
  return name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') + '@company.com';
}

function pad(n, len = 5) { return String(n).padStart(len, '0'); }

// ── Load CSV + reference data ─────────────────────────────────────────────────
const rows    = parseCSV(fs.readFileSync(CSV_PATH, 'utf8'));
const assets  = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'assets.json'),  'utf8'));
const policies= JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'policies.json'),'utf8'));

// Original 30 system users (asset owners + demo role accounts).
// Hardcoded here so the script is idempotent regardless of what is in users.json.
const SYSTEM_USERS = [
  { id:'USR-0001', name:'Arjun Mehta',         email:'arjun.mehta@sgindia.example',       role:'Requester',       department:'Payments',            is_active:true  },
  { id:'USR-0002', name:'Meera Iyer',           email:'meera.iyer@sgindia.example',         role:'Requester',       department:'Customer Analytics',   is_active:true  },
  { id:'USR-0003', name:'Rahul Verma',          email:'rahul.verma@sgindia.example',        role:'Requester',       department:'Infrastructure',       is_active:true  },
  { id:'USR-0004', name:'Priya Nair',           email:'priya.nair@sgindia.example',         role:'Security Reviewer',department:'Information Security', is_active:true  },
  { id:'USR-0005', name:'Vikram Rao',           email:'vikram.rao@sgindia.example',         role:'Approver',        department:'Security Manager',     is_active:true  },
  { id:'USR-0006', name:'Sanjay Gupta',         email:'sanjay.gupta@sgindia.example',       role:'Approver',        department:'Compliance Lead',      is_active:true  },
  { id:'USR-0007', name:'Anita Desai',          email:'anita.desai@sgindia.example',        role:'Approver',        department:'IT Head',              is_active:true  },
  { id:'USR-0008', name:'Deepak Shah',          email:'deepak.shah@sgindia.example',        role:'Requester',       department:'Core Banking',         is_active:true  },
  { id:'USR-0009', name:'Kavya Reddy',          email:'kavya.reddy@sgindia.example',        role:'Auditor/Admin',   department:'Internal Audit',       is_active:true  },
  { id:'USR-0010', name:'Rohit Sinha',          email:'rohit.sinha@sgindia.example',        role:'Requester',       department:'Treasury',             is_active:false },
  { id:'USR-0011', name:'Neha Kapoor',          email:'neha.kapoor@sgindia.example',        role:'Requester',       department:'Digital Banking',      is_active:true  },
  { id:'USR-0012', name:'Suresh Pillai',        email:'suresh.pillai@sgindia.example',      role:'Requester',       department:'Lending',              is_active:true  },
  { id:'USR-0013', name:'Ritu Agarwal',         email:'ritu.agarwal@sgindia.example',       role:'Requester',       department:'Risk & Fraud',         is_active:true  },
  { id:'USR-0014', name:'Kiran Bhat',           email:'kiran.bhat@sgindia.example',         role:'Requester',       department:'Compliance',           is_active:true  },
  { id:'USR-0015', name:'Ramesh Nambiar',       email:'ramesh.nambiar@sgindia.example',     role:'Requester',       department:'Trade Finance',        is_active:true  },
  { id:'USR-0016', name:'Pooja Menon',          email:'pooja.menon@sgindia.example',        role:'Requester',       department:'Wealth Management',    is_active:true  },
  { id:'USR-0017', name:'Arun Krishnan',        email:'arun.krishnan@sgindia.example',      role:'Requester',       department:'ATM Operations',       is_active:true  },
  { id:'USR-0018', name:'Swati Joshi',          email:'swati.joshi@sgindia.example',        role:'Requester',       department:'Mobile Banking',       is_active:true  },
  { id:'USR-0019', name:'Rajesh Dubey',         email:'rajesh.dubey@sgindia.example',       role:'Requester',       department:'Infrastructure',       is_active:false },
  { id:'USR-0020', name:'Sunita Bhatt',         email:'sunita.bhatt@sgindia.example',       role:'Requester',       department:'AML & Compliance',     is_active:true  },
  { id:'USR-0021', name:'Venkat Subramanian',   email:'venkat.s@sgindia.example',           role:'Requester',       department:'SWIFT Operations',     is_active:true  },
  { id:'USR-0022', name:'Geeta Malhotra',       email:'geeta.malhotra@sgindia.example',     role:'Security Reviewer',department:'Information Security', is_active:true  },
  { id:'USR-0023', name:'Harish Pandey',        email:'harish.pandey@sgindia.example',      role:'Requester',       department:'IT Operations',        is_active:true  },
  { id:'USR-0024', name:'Lalitha Krishnan',     email:'lalitha.k@sgindia.example',          role:'Requester',       department:'Payments',             is_active:false },
  { id:'USR-0025', name:'Manish Tiwari',        email:'manish.tiwari@sgindia.example',      role:'Approver',        department:'CISO Office',          is_active:true  },
  { id:'USR-0026', name:'Nandita Singh',        email:'nandita.singh@sgindia.example',      role:'Requester',       department:'Customer Service',     is_active:true  },
  { id:'USR-0027', name:'Pavan Kumar',          email:'pavan.kumar@sgindia.example',        role:'Requester',       department:'Data Engineering',     is_active:true  },
  { id:'USR-0028', name:'Shilpa Rao',           email:'shilpa.rao@sgindia.example',         role:'Security Reviewer',department:'Information Security', is_active:true  },
  { id:'USR-0029', name:'Tarun Saxena',         email:'tarun.saxena@sgindia.example',       role:'Requester',       department:'Core Banking',         is_active:true  },
  { id:'USR-0030', name:'Uma Krishnaswamy',     email:'uma.k@sgindia.example',              role:'Auditor/Admin',   department:'Internal Audit',       is_active:true  },
];

// ── PHASE 1: Build users ──────────────────────────────────────────────────────
const sysUsers     = SYSTEM_USERS;
const REVIEWER_IDS = sysUsers.filter(u => u.role === 'Security Reviewer').map(u => u.id);

// Extract unique requesters & approvers from CSV
const reqMap = new Map();   // name → {name, email, dept}
const aprMap = new Map();   // name → name (no email in CSV for approvers)

rows.forEach(r => {
  if (!reqMap.has(r.requester_name))
    reqMap.set(r.requester_name, { name: r.requester_name, email: r.requester_email, dept: r.department });
  if (!aprMap.has(r.approver_name))
    aprMap.set(r.approver_name, r.approver_name);
});

// Create user records: REQ-NNNNN for requesters, APR-NNNNN for approvers
const reqUsers = [];
const reqIdMap = {};   // name → user id
[...reqMap.entries()].forEach(([name, data], i) => {
  const id = `REQ-${pad(i + 1)}`;
  reqIdMap[name] = id;
  reqUsers.push({ id, name: data.name, email: data.email, role: 'Requester', department: data.dept, is_active: true });
});

const aprUsers = [];
const aprIdMap = {};   // name → user id
[...aprMap.entries()].forEach(([name], i) => {
  const id = `APR-${pad(i + 1)}`;
  aprIdMap[name] = id;
  aprUsers.push({ id, name, email: nameToEmail(name), role: 'Approver', department: 'Risk Management', is_active: true });
});

// Final users = system roles + all CSV persons
const allUsers = [...sysUsers, ...reqUsers, ...aprUsers];
console.log(`Users: ${sysUsers.length} system + ${reqUsers.length} requesters + ${aprUsers.length} approvers = ${allUsers.length} total`);

// ── PHASE 2: Lookup maps ──────────────────────────────────────────────────────

// Exception type → string that matches TYPE_WEIGHTS in riskScoring.js exactly
const TYPE_MAP = {
  Access_Exception:         'Admin Access',              // weight 30
  Firewall_Rule_Exception:  'Firewall Exception',        // weight 25
  Encryption_Waiver:        'Encryption Disabled',       // weight 35
  Password_Policy_Exception:'Password Policy Exception', // weight 20
  Data_Export_Exception:    'Data Retention Exception',  // weight 20
  MFA_Exemption:            'Password Policy Exception', // weight 20 – auth bypass
};

// Policy by exception type (matches policy names in policies.json)
const POLICY_BY_TYPE = {
  'Admin Access':              'POL-0003',   // Admin Access Policy
  'Firewall Exception':        'POL-0001',   // Firewall Port Restriction Policy
  'Encryption Disabled':       'POL-0002',   // Data Encryption Policy
  'Password Policy Exception': 'POL-0005',   // Password Complexity Policy
  'Data Retention Exception':  'POL-0007',   // Data Retention Policy
};

// Asset pool by CSV department (realistic matching)
const ASSETS_BY_DEPT = {
  IT:        ['AST-0007','AST-0020','AST-0003','AST-0009','AST-0022'],
  Finance:   ['AST-0010','AST-0017','AST-0025','AST-0001','AST-0019'],
  HR:        ['AST-0024','AST-0023','AST-0016'],
  Operations:['AST-0012','AST-0020','AST-0010','AST-0011'],
  Sales:     ['AST-0016','AST-0023','AST-0006','AST-0013'],
  Security:  ['AST-0021','AST-0022','AST-0014','AST-0005'],
};
const ALL_ASSET_IDS = assets.map(a => a.id);

// Asset owner lookup: asset id → user id (system user who owns the asset)
const assetOwnerMap = Object.fromEntries(assets.map(a => [a.id, a.owner_user_id]));

// Compensating controls by risk level (realistic, varied text)
const CONTROLS_LOW = [
  { control: 'Regular security review and monitoring controls are active.', strength: 'strong' },
  { control: 'Quarterly access certification and automated log review in place.', strength: 'strong' },
  { control: 'Continuous monitoring via SIEM with alert thresholds configured.', strength: 'strong' },
];
const CONTROLS_MED = [
  { control: 'Access logging enabled; quarterly review scheduled.', strength: 'basic' },
  { control: 'Manual review checkpoint before each renewal period.', strength: 'basic' },
  { control: 'Exception owner notified monthly; review pending.', strength: 'basic' },
];
const CONTROLS_HIGH = [
  { control: 'Interim monitoring active; formal remediation plan in progress.', strength: 'basic' },
  { control: 'Compensating detective controls deployed pending permanent fix.', strength: 'basic' },
];
const CONTROLS_CRIT = [
  { control: '', strength: 'missing' },
  { control: '', strength: 'missing' },
];

function getControl(riskLevel, idx) {
  const pools = { Low: CONTROLS_LOW, Medium: CONTROLS_MED, High: CONTROLS_HIGH, Critical: CONTROLS_CRIT };
  const pool = pools[riskLevel] || CONTROLS_MED;
  return pool[idx % pool.length];
}

// Status map: CSV status → backend stored status
// effectiveStatus() in exceptionService.js auto-derives overdue/expiring_soon
// from stored 'active' + expiry_date at query time.
const STATUS_MAP = {
  Active:        'active',
  Expiring_Soon: 'active',      // auto-derived: expiry_date within 14 days
  Expired:       'active',      // auto-derived: expiry_date in the past → overdue
  Revoked:       'revoked',
  Pending_Review:'pending_approval',
};

// History note pools
const REVIEW_NOTES = [
  'Review initiated by Information Security. Risk analysis underway.',
  'Security review in progress — evaluating control coverage and exposure.',
  'Reviewer triaging exception; checking asset classification and policy alignment.',
  'Risk assessment started; pending asset owner confirmation.',
];
const FORWARD_NOTES = [
  'Review complete — forwarded to approver for final decision.',
  'Security review concluded; escalated to approval authority.',
  'Risk analysis complete; recommended for conditional approval.',
];
const APPROVE_NOTES = [
  'Approved: justification accepted; compensating controls verified and documented.',
  'Approved with conditions: mandatory quarterly review required.',
  'Risk accepted within policy boundaries; approval granted for specified duration.',
  'Approved following risk assessment. Expiry date and controls on record.',
];
const ACTIVATE_NOTES = [
  'Exception activated on scheduled start date.',
  'Exception is now active as per approved start date.',
  'Waiver activated; expiry tracking initiated.',
];
const REVOKE_NOTES = [
  'Revoked: risk no longer acceptable; remediation completed.',
  'Exception revoked following security incident review.',
  'Revoked: replacement permanent control deployed; waiver retired.',
  'Revoked by approver — scope creep identified during periodic review.',
];
const RENEW_NOTES = [
  'Renewal approved; exception extended for additional period.',
  'Exception renewed following satisfactory periodic review.',
  'Renewal granted; updated compensating controls confirmed.',
];

function pick(arr, idx) { return arr[idx % arr.length]; }

// ── PHASE 3: Build exceptions + history + approvals ───────────────────────────
const exceptions = [];
const history    = [];
const approvals  = [];
let histIdx = 1, aprIdx = 1;
const deptCtr = {};

rows.forEach((row, idx) => {
  const excId     = row.exception_id.trim();           // EXC00000 — exact CSV id
  const excType   = TYPE_MAP[row.exception_type] || 'Admin Access';
  const status    = STATUS_MAP[row.status]        || 'active';
  const isRenewed = /^true$/i.test(row.is_renewed);
  const riskLevel = row.risk_level || 'Medium';        // Low/Medium/High/Critical

  // Users — exact CSV persons
  const requesterId = reqIdMap[row.requester_name];
  const approverId  = aprIdMap[row.approver_name];
  const reviewerId  = REVIEWER_IDS[idx % REVIEWER_IDS.length];

  // Asset — cycled by department
  const dept       = row.department;
  const deptAssets = ASSETS_BY_DEPT[dept] || ALL_ASSET_IDS;
  deptCtr[dept]    = (deptCtr[dept] || 0);
  const assetId    = deptAssets[deptCtr[dept]++ % deptAssets.length];

  // Owner = the asset's system owner (from assets.json) — different from requester
  const ownerId = assetOwnerMap[assetId] || sysUsers[0]?.id || requesterId;

  const policyId = POLICY_BY_TYPE[excType] || 'POL-0003';
  const ctrl     = getControl(riskLevel, idx);

  // Dates
  const startDate  = row.request_date;
  const expiryDate = row.expiry_date;

  // last_reviewed_at: set for renewed exceptions & ~30% of long-running active ones
  const duration   = parseInt(row.duration_days, 10) || 90;
  let lastReviewedAt = null;
  if (isRenewed || (status === 'active' && duration > 120 && idx % 3 === 0)) {
    // Set review date to ~90 days after start
    const sd = new Date(startDate + 'T00:00:00Z');
    sd.setDate(sd.getDate() + 90);
    lastReviewedAt = sd.toISOString().slice(0, 10);
  }

  const activatedAt = (status === 'active' || status === 'revoked') ? startDate : null;

  exceptions.push({
    id:                            excId,
    requester:                     requesterId,
    business_unit:                 dept,
    asset_id:                      assetId,
    policy_id:                     policyId,
    exception_type:                excType,
    justification:                 row.justification,
    start_date:                    startDate,
    expiry_date:                   expiryDate,
    criticality:                   riskLevel,          // fallback if asset lookup fails
    compensating_control:          ctrl.control,
    compensating_control_strength: ctrl.strength,
    owner:                         ownerId,
    approver:                      approverId,
    status,
    last_reviewed_at:              lastReviewedAt,
    activated_at:                  activatedAt,
    created_at:                    startDate,
    updated_at:                    startDate,
  });

  // ── Generate lifecycle history ──────────────────────────────────────────────
  const t0 = new Date(startDate + 'T08:00:00.000Z').getTime();
  const at = (offsetHours) => new Date(t0 + offsetHours * 3_600_000).toISOString();

  // Every exception: create → submitted
  history.push({
    id: `HIST-${pad(histIdx++)}`,
    exception_id: excId,
    action: 'create', from_status: null, to_status: 'submitted',
    actor: requesterId,
    note: `Exception request submitted by ${row.requester_name} (${dept}).`,
    timestamp: at(0),
  });

  if (status === 'pending_approval') {
    history.push({
      id: `HIST-${pad(histIdx++)}`, exception_id: excId,
      action: 'start_review', from_status: 'submitted', to_status: 'under_review',
      actor: reviewerId, note: pick(REVIEW_NOTES, idx), timestamp: at(26),
    });
    history.push({
      id: `HIST-${pad(histIdx++)}`, exception_id: excId,
      action: 'pending_approval', from_status: 'under_review', to_status: 'pending_approval',
      actor: reviewerId, note: pick(FORWARD_NOTES, idx), timestamp: at(52),
    });
  }

  if (status === 'active' || status === 'revoked') {
    history.push({
      id: `HIST-${pad(histIdx++)}`, exception_id: excId,
      action: 'start_review', from_status: 'submitted', to_status: 'under_review',
      actor: reviewerId, note: pick(REVIEW_NOTES, idx), timestamp: at(24),
    });
    history.push({
      id: `HIST-${pad(histIdx++)}`, exception_id: excId,
      action: 'pending_approval', from_status: 'under_review', to_status: 'pending_approval',
      actor: reviewerId, note: pick(FORWARD_NOTES, idx), timestamp: at(48),
    });
    history.push({
      id: `HIST-${pad(histIdx++)}`, exception_id: excId,
      action: 'approve', from_status: 'pending_approval', to_status: 'approved',
      actor: approverId, note: pick(APPROVE_NOTES, idx), timestamp: at(72),
    });
    history.push({
      id: `HIST-${pad(histIdx++)}`, exception_id: excId,
      action: 'activate', from_status: 'approved', to_status: 'active',
      actor: approverId, note: pick(ACTIVATE_NOTES, idx), timestamp: at(96),
    });

    approvals.push({
      id: `APR-${pad(aprIdx++)}`,
      exception_id: excId,
      actor: approverId,
      decision: 'approved',
      comment: pick(APPROVE_NOTES, idx),
      timestamp: at(72),
    });

    if (isRenewed) {
      const renewOffset = Math.max(120, Math.floor(duration * 0.6)) * 24;
      history.push({
        id: `HIST-${pad(histIdx++)}`, exception_id: excId,
        action: 'request_renewal', from_status: 'active', to_status: 'renewal_requested',
        actor: requesterId,
        note: 'Renewal requested before original expiry date.',
        timestamp: at(renewOffset),
      });
      history.push({
        id: `HIST-${pad(histIdx++)}`, exception_id: excId,
        action: 'renew', from_status: 'renewal_requested', to_status: 'renewed',
        actor: approverId, note: pick(RENEW_NOTES, idx), timestamp: at(renewOffset + 24),
      });
      history.push({
        id: `HIST-${pad(histIdx++)}`, exception_id: excId,
        action: 'activate', from_status: 'renewed', to_status: 'active',
        actor: approverId,
        note: 'Renewed exception re-activated with updated expiry.',
        timestamp: at(renewOffset + 48),
      });
    }

    if (status === 'revoked') {
      const revokeOffset = Math.floor(duration * 0.5) * 24;
      history.push({
        id: `HIST-${pad(histIdx++)}`, exception_id: excId,
        action: 'revoke', from_status: 'active', to_status: 'revoked',
        actor: approverId, note: pick(REVOKE_NOTES, idx), timestamp: at(revokeOffset),
      });
    }
  }
});

// ── PHASE 4: Write all files ──────────────────────────────────────────────────
function write(dir, file, data) {
  fs.writeFileSync(path.join(dir, file), JSON.stringify(data, null, 2));
}

write(DATA_DIR, 'users.json',             allUsers);
write(DATA_DIR, 'exceptions.json',        exceptions);
write(DATA_DIR, 'exception_history.json', history);
write(DATA_DIR, 'approvals.json',         approvals);

write(SEED_DIR, 'users.json',             allUsers);
write(SEED_DIR, 'exceptions.json',        exceptions);
write(SEED_DIR, 'exception_history.json', history);
write(SEED_DIR, 'approvals.json',         approvals);

console.log(`\n✓ users.json             → ${allUsers.length} records`);
console.log(`✓ exceptions.json        → ${exceptions.length} records`);
console.log(`✓ exception_history.json → ${history.length} entries`);
console.log(`✓ approvals.json         → ${approvals.length} records`);
console.log(`\nData + seed directories both updated. Restart the backend.`);
