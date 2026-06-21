import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight } from 'lucide-react';
import api from '../api/api';
import { ROLES } from '../utils/constants';
import ViewSelector from '../components/ViewSelector.jsx';

const VIEWS = [
  { key: 'identity',   label: 'Demo Identity' },
  { key: 'workspaces', label: 'Role Workspaces' },
  { key: 'status',     label: 'System Status' },
  { key: 'dataset',    label: 'Dataset Overview' },
  { key: 'risk',       label: 'Risk Configuration' },
  { key: 'limits',     label: 'Production Limitations' },
  { key: 'roadmap',    label: 'Enterprise Roadmap' },
];

const ROLE_INFO = {
  Requester: {
    accent: 'blue', email: 'requester@riskwaiver360.demo', password: 'Requester@123',
    desc: 'Can submit and track time-bound policy exception requests.',
    can: ['Submit new exception requests', 'Track status of own requests', 'View risk score on own exceptions'],
    cannot: ['Approve, reject, or revoke exceptions', 'Access GRC intelligence or audit reports', 'View other users\' exceptions'],
    nav: 'Dashboard · My Requests · Add Exception',
  },
  'Security Reviewer': {
    accent: 'cyan', email: 'reviewer@riskwaiver360.demo', password: 'Reviewer@123',
    desc: 'Can review justification, compensating controls, ownership, and risk context.',
    can: ['Review submitted exceptions', 'Assess risk scoring & control strength', 'Add comments and request clarification'],
    cannot: ['Approve or reject final risk acceptance', 'Access audit reports or admin settings'],
    nav: 'Dashboard · Registry · Review Queue · Risk Scoring · Alerts',
  },
  Approver: {
    accent: 'purple', email: 'approver@riskwaiver360.demo', password: 'Approver@123',
    desc: 'Can approve, reject, renew, revoke, and escalate exceptions with full risk context.',
    can: ['Approve / reject / renew / revoke / escalate', 'Focus on high-risk & pending approvals', 'View GRC intelligence findings'],
    cannot: ['Bypass the security-review context', 'Access system configuration settings'],
    nav: 'Dashboard · Registry · Review Queue · Risk Scoring · Alerts · GRC Intelligence · Audit',
  },
  'Auditor/Admin': {
    accent: 'emerald', email: 'auditor@riskwaiver360.demo', password: 'Auditor@123',
    desc: 'Full read-only access: audit reports, GRC findings, portfolio risk, and system configuration.',
    can: ['View audit reports & lifecycle evidence', 'View GRC intelligence & portfolio risk', 'Access system status & configuration', 'Export auditor packs via browser print'],
    cannot: ['Submit, approve, or revoke exceptions (read-only)', 'Modify system data or configuration'],
    nav: 'Dashboard · Registry · Risk Scoring · Alerts · GRC Intelligence · Audit · Settings',
  },
};

const ROLE_ORDER = ['Requester', 'Security Reviewer', 'Approver', 'Auditor/Admin'];

const RISK_BANDS = [
  { name: 'Low',      range: '0 – 30',   color: '#16A34A' },
  { name: 'Medium',   range: '31 – 60',  color: '#F59E0B' },
  { name: 'High',     range: '61 – 80',  color: '#EA580C' },
  { name: 'Critical', range: '81 – 100', color: '#DC2626' },
];

const TYPE_WEIGHTS = [
  { type: 'Encryption Disabled',      weight: 35, policy: 'Data Encryption Policy' },
  { type: 'Admin Access',             weight: 30, policy: 'Admin Access Policy' },
  { type: 'Network Exposure',         weight: 30, policy: 'Network Exposure Policy' },
  { type: 'Firewall Exception',       weight: 25, policy: 'Firewall Port Restriction Policy' },
  { type: 'Logging Disabled',         weight: 25, policy: 'Logging & Monitoring Policy' },
  { type: 'Password Policy Exception',weight: 20, policy: 'Password Complexity Policy' },
  { type: 'Data Retention Exception', weight: 20, policy: 'Data Retention Policy' },
];

const SCORING_FACTORS = [
  { factor: 'Exception Type',          range: '20 – 35',  note: 'Base weight by policy category (see table above)' },
  { factor: 'Asset Criticality',       range: '5 – 35',   note: 'Low=5 · Medium=15 · High=25 · Critical=35' },
  { factor: 'Duration',                range: '5 – 30',   note: '≤7 days=5 · ≤30=10 · ≤90=20 · >90=30' },
  { factor: 'Expiry Status Penalty',   range: '0 – 30',   note: 'Overdue=30 · Expiring Soon=15 · Valid=0' },
  { factor: 'Review Status Penalty',   range: '0 – 25',   note: 'Never reviewed=25 · Overdue=20 · Due=10 · Recent=0' },
  { factor: 'Owner Status Penalty',    range: '0 – 30',   note: 'No owner=30 · Inactive owner=25 · Active=0' },
  { factor: 'Compensating Control',    range: '−15 – 0',  note: 'Strong control=−15 · Basic=−8 · Missing=0' },
];

const LIMITATIONS = [
  'Demo localStorage authentication — no real identity provider or session management',
  'Role control is frontend-only — no server-side RBAC enforcement',
  'JSON flat-file storage — no relational database or ACID guarantees',
  'Simulated email reminders — no live email gateway; notifications are UI-only',
  'Audit pack exported via browser print — no server-rendered PDF',
  'No SSO / OIDC integration (Okta, Microsoft Entra ID, etc.)',
  'No CMDB / IAM system integration for live asset and user sync',
  'No real-time webhook or alerting pipeline (Slack, PagerDuty, etc.)',
  'No enterprise workflow integration (Jira, ServiceNow)',
];

const ROADMAP = [
  { title: 'Security & Access', tone: 'blue', items: [
    'SSO / OIDC login (Okta, Microsoft Entra ID)',
    'Backend RBAC with server-side policy enforcement',
    'Secure session management (JWT / refresh tokens)',
    'Rate limiting & security headers (OWASP best practices)',
    'Tamper-evident audit log with actor tracking',
  ]},
  { title: 'Data & Persistence', tone: 'blue', items: [
    'PostgreSQL or MongoDB for persistent, scalable storage',
    'Database-backed user directory with active sync',
    'Auto-revocation pipeline for expired exceptions',
    'Conflict-detection rules engine (policy overlaps)',
    'Full-text search and advanced filtering across 100k+ records',
  ]},
  { title: 'Enterprise Integrations', tone: 'blue', items: [
    'Live CMDB sync for asset catalogue (ServiceNow, AWS Config)',
    'Jira / ServiceNow workflow ticket integration',
    'Real email gateway with customisable templates',
    'SIEM export (Splunk, Microsoft Sentinel) for live monitoring',
    'Real server-rendered PDF auditor packs',
  ]},
  { title: 'AI-Ready (Future)', tone: 'purple', items: [
    'Vague justification detection using LLM classification',
    'Anomaly detection for repeated / cyclical waiver patterns',
    'AI recommendation engine for control strength improvements',
    'RAG-based policy assistant for exception drafting',
    'Automated audit summary generation from lifecycle evidence',
    'Predictive escalation scoring for high-risk exception queues',
  ]},
];

const DATASET_STATS = [
  { label: 'Total Exceptions',  value: '600', note: 'Sourced from exception_registry.csv' },
  { label: 'Users',             value: '1,180', note: '30 system · 571 requesters · 579 approvers' },
  { label: 'Departments',       value: '6', note: 'Finance · HR · IT · Operations · Sales · Security' },
  { label: 'Exception Types',   value: '5', note: 'Admin Access · Firewall · Encryption · Password · Data Retention' },
  { label: 'Policy Categories', value: '5', note: 'Access Control · Data Governance · Data Protection · Identity · Network Security' },
  { label: 'Active Alerts',     value: '682', note: 'Critical: 489 · High: 23 · Medium: 170' },
  { label: 'Approval Records',  value: '478', note: 'Approved exceptions with auditor trail' },
  { label: 'History Entries',   value: '3,290', note: 'Full lifecycle audit trail per exception' },
];

const DEPT_BREAKDOWN = [
  { dept: 'Finance',    count: 113, pct: 19 },
  { dept: 'IT',         count: 106, pct: 18 },
  { dept: 'Security',   count: 103, pct: 17 },
  { dept: 'HR',         count: 95,  pct: 16 },
  { dept: 'Sales',      count: 93,  pct: 15 },
  { dept: 'Operations', count: 90,  pct: 15 },
];

const TYPE_BREAKDOWN = [
  { type: 'Password Policy Exception',policy: 'Identity',          count: 197 },
  { type: 'Firewall Exception',       policy: 'Network Security',  count: 111 },
  { type: 'Data Retention Exception', policy: 'Data Governance',   count: 109 },
  { type: 'Admin Access',             policy: 'Access Control',    count:  95 },
  { type: 'Encryption Disabled',      policy: 'Data Protection',   count:  88 },
];

export default function Settings() {
  const [health, setHealth] = useState(null);
  const [view, setView]     = useState('identity');
  const navigate            = useNavigate();
  const currentRole = localStorage.getItem('rw_role') || 'Requester';
  const demoEmail   = localStorage.getItem('rw_email') || ROLE_INFO[currentRole]?.email || '—';
  const info        = ROLE_INFO[currentRole] || ROLE_INFO.Requester;

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ status: 'unreachable' }));
  }, []);

  function switchRole(r) {
    localStorage.setItem('rw_role', r);
    localStorage.removeItem('rw_email');
    navigate('/dashboard');
  }

  const backendOk    = health?.status === 'ok';
  const backendLabel = health ? (backendOk ? 'Connected' : health.status) : 'Checking…';

  const SYSTEM = [
    { name: 'Frontend',      value: 'React 18 + Vite',           note: 'Single-page app · React Router v6 · Recharts · Lucide icons.' },
    { name: 'Backend',       value: 'Node.js 20 + Express',       note: `Health: ${backendLabel} · ${health?.service || 'riskwaiver360-api'} · Port 4000`, ok: backendOk },
    { name: 'Data Store',    value: 'JSON flat-file (600 records)',note: '600 exceptions · 1,180 users · 3,290 history entries · 478 approvals.' },
    { name: 'Auth',          value: 'Demo localStorage (4 roles)', note: 'Requester · Security Reviewer · Approver · Auditor/Admin. Role held client-side.' },
    { name: 'Risk Engine',   value: 'Rule-based scoring (0–100)',  note: '7 weighted factors · explainable breakdown per exception · 4 risk bands.' },
    { name: 'Alert Engine',  value: 'Live computation (682)',      note: '682 alerts across 6 types, derived from 600 exceptions on every request.' },
    { name: 'Email',         value: 'Demo simulation only',        note: 'Reminder previews shown in UI — no live email gateway configured.' },
    { name: 'Audit Report',  value: 'Browser print / export',      note: 'Auditor pack generated from live data and printed via the browser.' },
  ];

  const summary = [
    { label: 'Current Role',  value: currentRole },
    { label: 'Demo Identity', value: demoEmail },
    { label: 'Auth Mode',     value: 'Demo localStorage' },
    { label: 'Storage Mode',  value: '600 Exceptions · JSON' },
    { label: 'Risk Engine',   value: 'Rule-based · 0–100' },
    { label: 'Alerts Live',   value: '682 active alerts' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="dashboard-command-header settings-header">
        <div>
          <div className="page-title">Demo &amp; System Configuration</div>
          <div className="page-sub">System status, dataset overview, risk scoring weights, and production-readiness notes.</div>
          <div className="command-badges">
            <span className="cmd-badge cmd-badge-id">Workspace: {currentRole}</span>
            <span className="cmd-badge cmd-badge-blue">{demoEmail}</span>
            <span className="cmd-badge cmd-badge-live"><span className="live-dot" /> Live Demo Environment</span>
          </div>
        </div>
        <ViewSelector label="Settings View" value={view} onChange={setView} options={VIEWS} id="settings-view" />
      </div>

      {/* Summary cards */}
      <div className="settings-summary-grid">
        {summary.map((s) => (
          <div className="settings-metric-card" key={s.label}>
            <div className="sm-label">{s.label}</div>
            <div className="sm-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ===== Demo Identity ===== */}
      {view === 'identity' && (
        <div className={`card card-pad demo-identity-card role-accent-${info.accent}`}>
          <div className="flex-between wrap" style={{ alignItems: 'center', marginBottom: 8 }}>
            <div className="card-title" style={{ border: 'none', margin: 0, paddingBottom: 0 }}>{currentRole}</div>
            <span className="cmd-badge cmd-badge-blue" style={{ background: 'rgba(37,99,235,0.1)' }}>{demoEmail}</span>
          </div>
          <p className="identity-desc">{info.desc}</p>
          <div className="report-two" style={{ marginTop: 12 }}>
            <div>
              <div className="identity-sub">What this role can do</div>
              {info.can.map((c) => <div className="cando-item ok" key={c}><Check size={15} /> {c}</div>)}
            </div>
            <div>
              <div className="identity-sub">What this role cannot do</div>
              {info.cannot.map((c) => <div className="cando-item no" key={c}><X size={15} /> {c}</div>)}
            </div>
          </div>
          <div className="identity-nav"><strong>Navigation access:</strong> {info.nav}</div>
        </div>
      )}

      {/* ===== Role Workspaces ===== */}
      {view === 'workspaces' && (
        <div className="role-workspace-grid">
          {ROLE_ORDER.map((r) => {
            const ri = ROLE_INFO[r];
            const active = r === currentRole;
            return (
              <div className={`card card-pad role-workspace-card role-accent-${ri.accent}${active ? ' active' : ''}`} key={r}>
                <div className="rw-name">{r}{active && <span className="rw-current">Current</span>}</div>
                <div className="rw-email">{ri.email}</div>
                <div className="rw-pass">Password: <span className="mono">{ri.password}</span></div>
                <p className="rw-desc">{ri.desc}</p>
                <div className="rw-nav"><strong>Access:</strong> {ri.nav}</div>
                <button className="btn btn-sm rw-switch" disabled={active} onClick={() => switchRole(r)}>
                  {active ? 'Active Workspace' : <>Switch to this role <ArrowRight size={14} /></>}
                </button>
              </div>
            );
          })}
          <div className="role-switch-legacy">
            {ROLES.map((r) => (
              <button key={r.key} className={`btn btn-sm ${r.key === currentRole ? 'btn-primary' : ''}`} onClick={() => switchRole(r.key)}>{r.key}</button>
            ))}
          </div>
        </div>
      )}

      {/* ===== System Status ===== */}
      {view === 'status' && (
        <div className="system-status-grid">
          {SYSTEM.map((s) => (
            <div className="card card-pad system-status-card" key={s.name}>
              <div className="flex-between" style={{ alignItems: 'center' }}>
                <div className="ss-name">{s.name}</div>
                <span className={`status-ready-badge${s.ok === false ? ' down' : ''}`}>
                  {s.ok === false ? 'Unreachable' : 'Demo Ready'}
                </span>
              </div>
              <div className="ss-value">{s.value}</div>
              <div className="ss-note">{s.note}</div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Dataset Overview ===== */}
      {view === 'dataset' && (<>
        <div className="system-status-grid" style={{ marginBottom: 20 }}>
          {DATASET_STATS.map((s) => (
            <div className="card card-pad system-status-card" key={s.label}>
              <div className="flex-between" style={{ alignItems: 'center' }}>
                <div className="ss-name">{s.label}</div>
                <span className="status-ready-badge">Loaded</span>
              </div>
              <div className="ss-value" style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</div>
              <div className="ss-note">{s.note}</div>
            </div>
          ))}
        </div>

        <div className="report-two" style={{ gap: 16 }}>
          <div className="card card-pad">
            <div className="card-title">Exceptions by Department</div>
            {DEPT_BREAKDOWN.map((d) => (
              <div key={d.dept} style={{ marginBottom: 10 }}>
                <div className="flex-between" style={{ marginBottom: 4, fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>{d.dept}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{d.count} exceptions</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${d.pct}%`, background: 'var(--brand)', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card card-pad">
            <div className="card-title">Exceptions by Type</div>
            {TYPE_BREAKDOWN.map((t) => (
              <div key={t.type} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.type}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>{t.policy} · {t.count} records</div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((t.count / 197) * 100)}%`, background: 'var(--brand)', borderRadius: 4 }} />
                </div>
              </div>
            ))}
            <div className="settings-note" style={{ marginTop: 8 }}>
              Source: <strong>exception_registry.csv</strong> (600 rows). Imported via <code>backend/scripts/import-csv-dataset.js</code>.
            </div>
          </div>
        </div>
      </>)}

      {/* ===== Risk Configuration ===== */}
      {view === 'risk' && (
        <div className="card card-pad risk-config-card">
          <div className="card-title">Risk Scoring Formula</div>
          <p className="risk-formula">
            Risk Score = Type Weight + Asset Criticality + Duration Penalty + Expiry Status Penalty + Review Penalty + Owner Status Penalty − Compensating Control Bonus
          </p>
          <p className="page-sub">Capped to [0–100]. Every score is the sum of visible, rule-based factors with full per-exception breakdown.</p>

          <div className="card-title" style={{ marginTop: 20 }}>Exception Type Weights (Base Score)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginBottom: 16 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '6px 12px 6px 0', color: 'var(--text-muted)', fontWeight: 600 }}>Exception Type</th>
                <th style={{ padding: '6px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Weight</th>
                <th style={{ padding: '6px 0', color: 'var(--text-muted)', fontWeight: 600 }}>Governing Policy</th>
              </tr>
            </thead>
            <tbody>
              {TYPE_WEIGHTS.map((t) => (
                <tr key={t.type} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '7px 12px 7px 0', fontWeight: 500 }}>{t.type}</td>
                  <td style={{ padding: '7px 12px' }}>
                    <span style={{ fontWeight: 700, color: t.weight >= 30 ? '#DC2626' : t.weight >= 25 ? '#EA580C' : '#F59E0B' }}>{t.weight}</span>
                  </td>
                  <td style={{ padding: '7px 0', color: 'var(--text-muted)' }}>{t.policy}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="card-title" style={{ marginTop: 4 }}>All Scoring Factors</div>
          <div className="settings-band-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {SCORING_FACTORS.map((f) => (
              <div className="settings-band" key={f.factor} style={{ borderTopColor: 'var(--brand)' }}>
                <div className="sb-name" style={{ color: 'var(--text)', fontSize: 13 }}>{f.factor}</div>
                <div className="sb-range" style={{ fontWeight: 700, color: 'var(--brand)' }}>{f.range}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{f.note}</div>
              </div>
            ))}
          </div>

          <div className="card-title" style={{ marginTop: 20 }}>Risk Level Bands</div>
          <div className="settings-band-grid">
            {RISK_BANDS.map((b) => (
              <div className="settings-band" key={b.name} style={{ borderTopColor: b.color }}>
                <div className="sb-name" style={{ color: b.color }}>{b.name}</div>
                <div className="sb-range">{b.range}</div>
              </div>
            ))}
          </div>

          <div className="card-title" style={{ marginTop: 20 }}>CIA Impact Mapping</div>
          <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            <strong>Confidentiality</strong> — Encryption Disabled, Data Retention exceptions (data exposure risk).<br />
            <strong>Integrity</strong> — Admin Access, Password Policy exceptions (privilege abuse risk).<br />
            <strong>Availability</strong> — Firewall Exception, Network Exposure, Logging Disabled (disruption / detection gaps).
          </p>
          <div className="settings-note">Scoring weights validated against the 600-record dataset. Production weights would be calibrated with security, audit, and risk teams.</div>
        </div>
      )}

      {/* ===== Production Limitations ===== */}
      {view === 'limits' && (
        <div className="card card-pad production-limitations-card">
          <div className="card-title">Current Prototype Limitations</div>
          <p className="page-sub" style={{ marginTop: -6, marginBottom: 12 }}>
            Stated honestly — RiskWaiver360 is a functional GRC demo prototype, not a production deployment.
          </p>
          <div className="limitation-grid">
            {LIMITATIONS.map((l) => (
              <div className="limitation-item" key={l}><span className="limitation-dot" /><span>{l}</span></div>
            ))}
          </div>
          <div className="settings-note" style={{ marginTop: 16 }}>
            All limitations above are addressed in the Enterprise Roadmap. See the <strong>Enterprise Roadmap</strong> view for the planned production architecture.
          </div>
        </div>
      )}

      {/* ===== Enterprise Roadmap ===== */}
      {view === 'roadmap' && (<>
        <div className="roadmap-grid">
          {ROADMAP.map((g) => (
            <div className={`card card-pad roadmap-card${g.tone === 'purple' ? ' roadmap-ai' : ''}`} key={g.title}>
              <div className="flex-between" style={{ alignItems: 'center', marginBottom: 8 }}>
                <div className="card-title" style={{ border: 'none', margin: 0, paddingBottom: 0 }}>{g.title}</div>
                <span className={`roadmap-badge tone-${g.tone}`}>{g.tone === 'purple' ? 'Future-ready' : 'Planned'}</span>
              </div>
              {g.items.map((it) => <div className="roadmap-item" key={it}><ArrowRight size={14} /> {it}</div>)}
            </div>
          ))}
        </div>
        <div className="settings-note" style={{ marginTop: 16 }}>
          AI capabilities are described as <strong>future-ready only</strong>. The current prototype is fully rule-based and explainable — it is not AI-powered.
        </div>
      </>)}
    </div>
  );
}
