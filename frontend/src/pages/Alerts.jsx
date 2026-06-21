import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Bell, Check } from 'lucide-react';
import api from '../api/api';
import ViewSelector from '../components/ViewSelector.jsx';
import { titleCase, formatDate, daysRemainingLabel } from '../utils/formatters';
import { SEVERITY_COLORS } from '../utils/constants';

const REMINDER_TYPES = ['overdue', 'expiring_soon', 'orphaned_owner', 'review_overdue'];

const VIEWS = [
  { key: 'all', label: 'All Alerts' },
  { key: 'critical_risk', label: 'Critical Risk' },
  { key: 'high_risk', label: 'High Risk' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'expiring_soon', label: 'Expiring Soon' },
  { key: 'orphaned_owner', label: 'Orphaned Owner' },
  { key: 'missing_control', label: 'Missing Controls' },
  { key: 'review_overdue', label: 'Review Overdue' },
  { key: 'vague_justification', label: 'Vague Justification' },
];

const TONE = { blue: '#2563EB', danger: '#DC2626', warn: '#B45309', purple: '#7C3AED', success: '#16A34A' };

const MONITORED = [
  'Expired or overdue exceptions',
  'Exceptions expiring soon',
  'Orphaned owners (no active accountability)',
  'Missing or weak compensating controls',
  'Review-overdue status',
  'Critical / high risk exceptions',
  'Vague or incomplete justifications',
];

function alertPriority(a) {
  if (a.severity === 'critical') return { label: 'Critical', tone: 'danger' };
  if (a.severity === 'high') return { label: 'High', tone: 'danger' };
  if (['overdue', 'orphaned_owner'].includes(a.type)) return { label: 'High', tone: 'danger' };
  if (a.severity === 'medium') return { label: 'Medium', tone: 'warn' };
  return { label: 'Low', tone: 'success' };
}

function buildEmail(a) {
  const to = a.owner_email || 'grc-team@bank.example';
  const toName = a.owner_name || 'GRC Team (unassigned owner)';
  let subject;
  let intro;
  if (a.type === 'overdue') {
    subject = `[Action Required] Exception ${a.exception_id} is OVERDUE`;
    intro = `Policy exception ${a.exception_id} (${a.exception_type}) on ${a.asset_name} expired ${Math.abs(a.days_remaining)} day(s) ago and is still in effect.`;
  } else if (a.type === 'expiring_soon') {
    subject = `[Reminder] Exception ${a.exception_id} expires in ${a.days_remaining} day(s)`;
    intro = `Policy exception ${a.exception_id} (${a.exception_type}) on ${a.asset_name} will expire on ${formatDate(a.expiry_date)}. Please decide whether to renew or let it lapse.`;
  } else if (a.type === 'orphaned_owner') {
    subject = `[Action Required] Orphaned exception ${a.exception_id} needs an owner`;
    intro = `Policy exception ${a.exception_id} (${a.exception_type}) on ${a.asset_name} has no active owner. It cannot be governed until reassigned.`;
  } else {
    subject = `[Reminder] Review overdue for exception ${a.exception_id}`;
    intro = `Policy exception ${a.exception_id} (${a.exception_type}) on ${a.asset_name} is past its review date and must be reviewed.`;
  }
  return { id: a.id, exception_id: a.exception_id, to, toName, subject, intro, action: a.recommended_action, severity: a.severity };
}

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severity, setSeverity] = useState('');
  const [view, setView] = useState('all');
  const [showEmails, setShowEmails] = useState(false);
  const [sent, setSent] = useState({});
  const navigate = useNavigate();
  const role = localStorage.getItem('rw_role') || 'system';

  useEffect(() => {
    api.getAlerts()
      .then(setAlerts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function matchView(a) {
    switch (view) {
      case 'all': return true;
      case 'critical_risk': return a.type === 'critical_risk' || a.severity === 'critical';
      case 'high_risk': return a.severity === 'high';
      default: return a.type === view;
    }
  }

  const filtered = alerts.filter((a) => (!severity || a.severity === severity) && matchView(a));
  const countType = (t) => alerts.filter((a) => a.type === t).length;
  const counts = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    overdue: countType('overdue'),
    expiring: countType('expiring_soon'),
    orphaned: countType('orphaned_owner'),
    missing: countType('missing_control'),
    reviewOverdue: countType('review_overdue'),
  };

  const metrics = [
    { key: 'all', label: 'Total Alerts', value: counts.total, help: 'Active monitoring signals', tone: 'blue' },
    { key: 'critical_risk', label: 'Critical Alerts', value: counts.critical, help: 'Severity critical', tone: 'danger' },
    { key: 'high_risk', label: 'High Alerts', value: counts.high, help: 'Severity high', tone: 'warn' },
    { key: 'overdue', label: 'Overdue', value: counts.overdue, help: 'Past expiry, still active', tone: 'danger' },
    { key: 'expiring_soon', label: 'Expiring Soon', value: counts.expiring, help: 'Approaching expiry', tone: 'warn' },
    { key: 'orphaned_owner', label: 'Orphaned Owner', value: counts.orphaned, help: 'No active owner', tone: 'purple' },
    { key: 'missing_control', label: 'Missing Controls', value: counts.missing, help: 'No compensating control', tone: 'warn' },
    { key: 'review_overdue', label: 'Review Overdue', value: counts.reviewOverdue, help: 'Past review date', tone: 'danger' },
  ];

  const emails = useMemo(() => filtered.filter((a) => REMINDER_TYPES.includes(a.type)).map(buildEmail), [filtered]);

  if (loading) return <div className="state-box"><div className="spinner" />Generating alerts…</div>;
  if (error) return <div className="state-box">⚠️ {error}</div>;

  return (
    <div>
      {/* Premium header */}
      <div className="dashboard-command-header alerts-header">
        <div>
          <div className="page-title">Continuous Monitoring Alerts</div>
          <div className="page-sub">Live monitoring of expiry, overdue reviews, orphaned ownership, missing controls, vague justifications, and critical exception risk.</div>
          <div className="command-badges">
            <span className="cmd-badge cmd-badge-id">Workspace: {role}</span>
            <span className="cmd-badge cmd-badge-blue">Continuous Controls Monitoring</span>
            <span className="cmd-badge cmd-badge-live"><span className="live-dot" /> Live Demo Environment</span>
          </div>
        </div>
        <ViewSelector label="Alert View" value={view} onChange={setView} options={VIEWS} id="alert-view" />
      </div>

      {/* Summary metric cards */}
      <div className="alerts-summary-grid">
        {metrics.map((m) => (
          <button className="alert-metric-card" key={m.label} style={{ borderTopColor: TONE[m.tone] }} onClick={() => setView(m.key)}>
            <div className="am-value" style={{ color: TONE[m.tone] }}>{m.value}</div>
            <div className="am-label">{m.label}</div>
            <div className="am-help">{m.help}</div>
          </button>
        ))}
      </div>

      {/* Toolbar: severity filter + feed/email toggle */}
      <div className="filters">
        <div className="field">
          <label>Severity</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">All</option>
            {['critical', 'high', 'medium', 'low'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 'unset', minWidth: 'unset' }}>
          <label>Mode</label>
          <div className="flex gap-8">
            <button className={`btn ${showEmails ? '' : 'btn-primary'}`} onClick={() => setShowEmails(false)}><Bell size={15} /> Alert Feed</button>
            <button className={`btn ${showEmails ? 'btn-primary' : ''}`} onClick={() => setShowEmails(true)}><Mail size={15} /> Reminder Emails ({emails.length})</button>
          </div>
        </div>
      </div>

      <div className="alerts-workbench-layout">
        {/* Left: alert feed OR reminder simulation */}
        <div className="alert-list-panel">
          {!showEmails && (
            filtered.length === 0
              ? <div className="card alerts-empty-state state-box">No alerts detected for this category.</div>
              : filtered.map((a) => {
                const color = SEVERITY_COLORS[a.severity] || '#64748b';
                const pr = alertPriority(a);
                const due = a.expiry_date ? `Expiry ${formatDate(a.expiry_date)} · ${daysRemainingLabel(a.days_remaining)}` : null;
                return (
                  <div className="card card-pad monitoring-alert-card" key={a.id} style={{ borderLeftColor: color }}>
                    <div className="flex gap-8 wrap" style={{ alignItems: 'center' }}>
                      <span className="alert-type-chip">{titleCase(a.type)}</span>
                      <span className="badge" style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}>{titleCase(a.severity)}</span>
                      <span className={`alert-priority-badge tone-${pr.tone}`}>{pr.label} Priority</span>
                      <span className="mono link rr-id" style={{ cursor: 'pointer' }} onClick={() => navigate(`/exceptions/${a.exception_id}`)}>{a.exception_id}</span>
                    </div>
                    <div className="alert-reason-text">{a.reason}</div>
                    <div className="alert-meta-line">
                      {a.exception_type} · {a.asset_name}
                      {a.owner_name ? ` · Owner: ${a.owner_name}` : ' · Owner: Unassigned'}
                      {due ? ` · ${due}` : ''}
                    </div>
                    <div className="alert-action-text">→ {a.recommended_action}</div>
                    <button className="btn btn-sm" onClick={() => navigate(`/exceptions/${a.exception_id}`)}>Open Details</button>
                  </div>
                );
              })
          )}

          {showEmails && (
            <div className="card card-pad reminder-simulation-card">
              <div className="card-title">Reminder Email Simulation</div>
              <div className="sim-note">Demo simulation only — no real email is sent.</div>
              {emails.length === 0 && <div className="alerts-empty-state state-box">No reminder-eligible alerts for this view.</div>}
              <div className="email-list">
                {emails.map((m) => (
                  <div className="email-card" key={m.id}>
                    <div className="email-head">
                      <div className="email-avatar"><Mail size={16} /></div>
                      <div className="email-meta">
                        <div className="email-from">RiskWaiver360 &lt;noreply@riskwaiver360.bank&gt;</div>
                        <div className="email-to">To: {m.toName} &lt;{m.to}&gt;</div>
                      </div>
                    </div>
                    <div className="email-subject">{m.subject}</div>
                    <div className="email-body">
                      <p>Hi {m.toName.split(' ')[0]},</p>
                      <p>{m.intro}</p>
                      <p><strong>Recommended action:</strong> {m.action}</p>
                      <p className="faint">This is an automated governance reminder from RiskWaiver360.</p>
                    </div>
                    <div className="email-foot">
                      {sent[m.id]
                        ? <span className="sim-sent"><Check size={14} /> Simulated — no real email sent</span>
                        : <button className="btn btn-sm" onClick={() => setSent((s) => ({ ...s, [m.id]: true }))}>Simulate Send</button>}
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/exceptions/${m.exception_id}`)}>Open Details</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: monitoring explanation */}
        <aside className="alert-insights-panel">
          <div className="card card-pad monitoring-explanation-card">
            <div className="card-title">What is being monitored?</div>
            {MONITORED.map((m) => (
              <div className="monitor-item" key={m}><span className="monitor-dot" /><span>{m}</span></div>
            ))}
            <div className="monitor-note">This supports Continuous Controls Monitoring by surfacing exception drift before audit or security impact.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
