import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import api from '../api/api';
import StatCard from '../components/StatCard.jsx';
import RiskBadge from '../components/RiskBadge.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { RISK_COLORS, SEVERITY_COLORS, CONFLICT_TYPE_LABELS, ROLE_DASHBOARD } from '../utils/constants';
import { daysRemainingLabel, titleCase } from '../utils/formatters';

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a.toFixed(2)})`;
}

const VIEWS = [
  { key: 'overview', label: 'Executive Overview' },
  { key: 'action', label: 'Action Required' },
  { key: 'monitoring', label: 'Control Monitoring' },
  { key: 'heatmap', label: 'Risk Heatmap' },
  { key: 'grc', label: 'GRC Intelligence' },
  { key: 'compliance', label: 'Compliance Posture' },
  { key: 'toprisk', label: 'Top Risk Exceptions' },
];

const SEV_RANK = { critical: 4, high: 3, medium: 2, low: 1 };
const ACTION_TYPES = ['overdue', 'critical_risk', 'orphaned_owner', 'missing_control', 'expiring_soon', 'review_overdue'];
const TONE_COLOR = { success: 'var(--green)', warn: 'var(--amber)', danger: 'var(--red)', purple: '#7C3AED', default: 'var(--brand)' };

function controlStatus(count, warnAt = 1, attentionAt = 3) {
  if (count >= attentionAt) return { label: 'Attention', tone: 'danger' };
  if (count >= warnAt) return { label: 'Warning', tone: 'warn' };
  return { label: 'Healthy', tone: 'success' };
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [view, setView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getAlerts().catch(() => [])])
      .then(([d, a]) => { setData(d); setAlerts(a || []); })
      .catch((e) => setError(e.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-box"><div className="spinner" />Loading GRC Command Center…</div>;
  if (error) return <div className="state-box">⚠️ {error}</div>;

  const { summary, charts, hotspots, top_risk_exceptions, conflicts } = data;
  const role = localStorage.getItem('rw_role') || 'Guest';
  const roleDash = ROLE_DASHBOARD[role] || { actions: [{ label: '+ Add Exception', to: '/add', primary: true }] };

  const total = summary.total_exceptions || 1;
  const criticalCount = (charts.risk_distribution.find((d) => d.name === 'Critical') || {}).value || 0;
  const missingControls = alerts.filter((a) => a.type === 'missing_control').length;

  const healthPenalty =
    (summary.high_critical_exceptions * 1.2 + summary.overdue_exceptions * 2 +
     summary.orphaned_exceptions * 2 + summary.expiring_soon * 1) / total * 38;
  const healthScore = Math.max(5, Math.min(100, Math.round(100 - healthPenalty)));
  const healthLabel = healthScore >= 70 ? 'Healthy' : healthScore >= 45 ? 'Needs Attention' : 'At Risk';

  const kpis = [
    { label: 'Exception Health Score', value: healthScore, icon: 'ShieldCheck', tone: 'default', hint: 'out of 100 · overall posture' },
    { label: 'Total Exceptions', value: summary.total_exceptions, icon: 'Layers', tone: 'default', hint: 'tracked policy exceptions' },
    { label: 'Critical Risks', value: criticalCount, icon: 'Flame', tone: 'danger', hint: 'highest-severity exposures' },
    { label: 'Overdue Reviews', value: summary.overdue_reviews, icon: 'CalendarClock', tone: 'warn', hint: 'past their review date' },
    { label: 'Expiring Soon', value: summary.expiring_soon, icon: 'Clock', tone: 'warn', hint: 'expire within 14 days' },
    { label: 'Orphaned Exceptions', value: summary.orphaned_exceptions, icon: 'UserX', tone: 'purple', hint: 'no active owner' },
  ];

  const actionItems = [...alerts]
    .filter((a) => ACTION_TYPES.includes(a.type))
    .sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity])
    .slice(0, 5);

  const controls = [
    { name: 'Expiry Monitoring', ...controlStatus(summary.overdue_exceptions * 3 + summary.expiring_soon), detail: `${summary.overdue_exceptions} overdue · ${summary.expiring_soon} expiring soon` },
    { name: 'Owner Monitoring', ...controlStatus(summary.orphaned_exceptions), detail: `${summary.orphaned_exceptions} orphaned exception(s) detected` },
    { name: 'Review Monitoring', ...controlStatus(summary.overdue_reviews), detail: `${summary.overdue_reviews} review(s) overdue` },
    { name: 'Compensating Control Monitoring', ...controlStatus(missingControls), detail: `${missingControls} exception(s) missing a control` },
    { name: 'Conflict Monitoring', ...controlStatus((conflicts?.critical || 0) * 3 + (conflicts?.total || 0)), detail: `${conflicts?.total || 0} GRC finding(s) (overlap / duplicate / conflict)` },
  ];

  const clampPct = (n) => Math.max(40, Math.min(99, Math.round(n)));
  const frameworks = [
    { name: 'NIST AC-2', label: 'Account & Privileged Access', score: clampPct(100 - (summary.orphaned_exceptions / total) * 120 - (summary.overdue_reviews / total) * 40) },
    { name: 'NIST PL-4', label: 'Rules of Behavior / Justification', score: clampPct(100 - (summary.pending_review / total) * 60) },
    { name: 'GDPR Article 25', label: 'Data Protection by Design', score: clampPct(100 - (criticalCount / total) * 130) },
    { name: 'CIS Controls', label: 'Secure Configuration & Inventory', score: clampPct(100 - (missingControls / total) * 110) },
  ];
  const postureStatus = (s) => (s >= 85 ? { t: 'Strong', tone: 'success' } : s >= 70 ? { t: 'Needs Review', tone: 'warn' } : { t: 'Attention', tone: 'danger' });

  return (
    <div>
      {/* Command header */}
      <div className="dashboard-command-header">
        <div>
          <div className="page-title">GRC Command Center</div>
          <div className="page-sub">Continuous monitoring of policy exceptions, risk exposure, lifecycle status, and audit readiness.</div>
          <div className="command-badges">
            <span className="cmd-badge cmd-badge-blue">Workspace: {role}</span>
            <span className="cmd-badge cmd-badge-live"><span className="live-dot" /> Live Demo Environment</span>
          </div>
        </div>
        <div className="dashboard-toolbar">
          <label className="dashboard-view-label" htmlFor="dashboard-view">Dashboard View</label>
          <select id="dashboard-view" className="dashboard-view-select" value={view} onChange={(e) => setView(e.target.value)}>
            {VIEWS.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {/* Always-visible KPI row */}
      <div className="command-kpi-grid">
        {kpis.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Conditional view panel */}
      <div className="dashboard-view-panel">
        {view === 'overview' && (
          <>
            <div className="card card-pad overview-card">
              <div className="card-title">Exception Posture Summary</div>
              <p className="exec-summary">
                The portfolio holds <strong>{summary.total_exceptions}</strong> tracked exceptions —
                <strong> {summary.high_critical_exceptions}</strong> at High/Critical risk,
                <strong> {summary.overdue_exceptions}</strong> overdue, and
                <strong> {summary.orphaned_exceptions}</strong> orphaned. Average risk is
                <strong> {summary.average_risk_score}/100</strong>. Overall posture:&nbsp;
                <strong style={{ color: TONE_COLOR[healthScore >= 70 ? 'success' : healthScore >= 45 ? 'warn' : 'danger'] }}>{healthLabel}</strong>.
              </p>
            </div>
            <div className="overview-grid">
              <div className="card card-pad insight-card">
                <div className="insight-label">Risk Exposure</div>
                <div className="insight-value" style={{ color: 'var(--red)' }}>{summary.high_critical_exceptions}</div>
                <div className="insight-sub">High/Critical exceptions · {criticalCount} critical</div>
              </div>
              <div className="card card-pad insight-card">
                <div className="insight-label">Audit Readiness</div>
                <div className="insight-value" style={{ color: (summary.overdue_exceptions + summary.orphaned_exceptions) === 0 ? 'var(--green)' : 'var(--amber)' }}>
                  {(summary.overdue_exceptions + summary.orphaned_exceptions) === 0 ? 'Ready' : 'Gaps Found'}
                </div>
                <div className="insight-sub">{summary.overdue_exceptions} overdue · {summary.orphaned_exceptions} orphaned</div>
              </div>
              <div className="card card-pad insight-card">
                <div className="insight-label">Lifecycle Health</div>
                <div className="insight-value" style={{ color: 'var(--brand)' }}>{summary.active_exceptions}/{summary.total_exceptions}</div>
                <div className="insight-sub">active · {summary.pending_review} pending review</div>
              </div>
              <div className="card card-pad insight-card">
                <div className="insight-label">Workspace Actions</div>
                <div className="workspace-actions">
                  {roleDash.actions.map((a) => (
                    <button key={a.label} className={`btn btn-sm ${a.primary ? 'btn-primary' : ''}`} onClick={() => navigate(a.to)}>{a.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {view === 'action' && (
          <div className="card card-pad action-required-panel">
            <div className="section-head" style={{ margin: '0 0 4px' }}>
              <h3>Action Required</h3>
              <Link to="/alerts" className="btn btn-sm">View all alerts</Link>
            </div>
            <div className="page-sub" style={{ marginBottom: 14 }}>Highest-priority items detected by continuous monitoring.</div>
            <div className="action-required-list">
              {actionItems.length === 0 && <div className="state-box">✅ No urgent action items right now.</div>}
              {actionItems.map((a) => {
                const color = SEVERITY_COLORS[a.severity] || '#64748b';
                return (
                  <div className="action-item" key={a.id} style={{ borderLeftColor: color }}>
                    <div className="action-item-main">
                      <div className="flex gap-8 wrap" style={{ alignItems: 'center' }}>
                        <span className="badge" style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}>{titleCase(a.severity)}</span>
                        <span className="action-item-type">{titleCase(a.type)}</span>
                        <Link to={`/exceptions/${a.exception_id}`} className="link mono">{a.exception_id}</Link>
                      </div>
                      <div className="action-item-reason">{a.reason}</div>
                      <div className="action-item-meta">Owner: {a.owner_name || 'Unassigned'} · Suggested action: → {a.recommended_action}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'monitoring' && (
          <>
            <div className="section-head"><h3>Control Monitoring Status</h3>
              <span className="faint" style={{ fontSize: 14 }}>Continuous checks across expiry, ownership, review, controls, and conflicts</span></div>
            <div className="monitoring-grid">
              {controls.map((c) => (
                <div className="card monitoring-card" key={c.name}>
                  <div className={`control-status tone-${c.tone}`}>{c.label}</div>
                  <div className="control-name">{c.name}</div>
                  <div className="control-detail">{c.detail}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {view === 'heatmap' && (
          <>
            <div className="card chart-card" style={{ marginBottom: 22 }}>
              <div className="section-head"><h3>Risk Heatmap — Department × Risk Level</h3></div>
              <div className="page-sub" style={{ marginTop: -8, marginBottom: 14 }}>Highlights where exception risk is accumulating by business unit, policy, asset, or severity.</div>
              {charts.heatmap && charts.heatmap.rows.length > 0 ? (() => {
                const activeLevels = charts.heatmap.levels.filter(
                  (l) => charts.heatmap.rows.some((r) => r[l] > 0)
                );
                return (
                  <div className="heatmap-wrap">
                    <table className="heatmap">
                      <thead>
                        <tr>
                          <th>Department</th>
                          {activeLevels.map((l) => <th key={l} style={{ color: RISK_COLORS[l] }}>{l}</th>)}
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {charts.heatmap.rows.map((r) => (
                          <tr key={r.business_unit}>
                            <td className="hm-bu">{r.business_unit}</td>
                            {activeLevels.map((l) => {
                              const v = r[l];
                              const alpha = v === 0 ? 0 : 0.18 + 0.82 * (v / (charts.heatmap.max || 1));
                              return (
                                <td key={l} className="hm-cell"
                                  style={{ background: v === 0 ? 'rgba(15,23,42,0.40)' : hexA(RISK_COLORS[l], alpha), color: alpha > 0.55 ? '#fff' : '#94a3b8' }}>
                                  {v || ''}
                                </td>
                              );
                            })}
                            <td className="hm-total">{r.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })() : <p className="faint">No heatmap data.</p>}
            </div>
            <div className="section-head"><h3>Portfolio Analytics</h3></div>
            <div className="chart-grid">
              <div className="card chart-card">
                <h3>Risk Distribution</h3>
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={charts.risk_distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {charts.risk_distribution.map((d) => <Cell key={d.name} fill={RISK_COLORS[d.name] || '#64748b'} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card chart-card">
                <h3>Exceptions by Policy Category</h3>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={charts.by_policy_category} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip /><Bar dataKey="value" fill="#0891b2" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card chart-card">
                <h3>Top Risky Departments</h3>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={charts.top_risky_business_units} margin={{ left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v, n, p) => [`${v} risk (${p.payload.count} exc.)`, 'Accumulated']} />
                    <Bar dataKey="value" fill="#EA580C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card chart-card">
                <h3>Monthly Exception Trend</h3>
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={charts.monthly_trend} margin={{ left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip /><Line type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {view === 'grc' && conflicts && (
          <>
            <div className="section-head"><h3>GRC Intelligence</h3>
              <Link to="/grc-intelligence" className="btn btn-sm">Open GRC Intelligence</Link></div>
            <div className="page-sub" style={{ marginTop: -8, marginBottom: 14 }}>Identifies waiver patterns that may create hidden attack paths or audit gaps.</div>
            <div className="command-kpi-grid" style={{ marginBottom: 18 }}>
              <StatCard label="Overlapping Exceptions" value={conflicts.overlaps} icon="GitMerge" tone="warn" />
              <StatCard label="Conflicting Approvals" value={conflicts.conflicting_approvals} icon="Scale" tone="danger" />
              <StatCard label="Duplicate Waivers" value={conflicts.duplicates} icon="Copy" tone="warn" />
              <StatCard label="Risk Accumulation Hotspots" value={conflicts.accumulation} icon="Layers3" tone="purple" />
            </div>
            {conflicts.top_findings?.length > 0 && (
              <div className="card chart-card">
                <div className="section-head"><h3>Findings</h3>
                  <span className="faint" style={{ fontSize: 14 }}>Top {conflicts.top_findings.length} of {conflicts.total}</span></div>
                <div className="alert-list">
                  {conflicts.top_findings.map((f) => {
                    const color = SEVERITY_COLORS[f.severity] || '#64748b';
                    return (
                      <div className="alert-card" key={f.conflict_id} style={{ borderLeftColor: color }}>
                        <div className="alert-card-main">
                          <div className="alert-card-head">
                            <span className="alert-card-type">{CONFLICT_TYPE_LABELS[f.type] || f.type}</span>
                            <span className="badge" style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}>{titleCase(f.severity)}</span>
                          </div>
                          <div className="alert-card-reason">{f.reason}</div>
                          <div className="alert-card-meta">
                            {f.related_exception_ids.map((id) => <Link key={id} to={`/exceptions/${id}`} className="link">{id}</Link>)}
                            <span>· {f.asset}</span>
                          </div>
                          <div className="alert-card-action">→ {f.recommended_action}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {view === 'compliance' && (
          <div className="card card-pad compliance-posture-card">
            <div className="card-title">Compliance Posture</div>
            <div className="page-sub" style={{ marginTop: -8, marginBottom: 14 }}>Framework coverage derived from the current exception posture (demo).</div>
            {frameworks.map((f) => {
              const st = postureStatus(f.score);
              return (
                <div className="compliance-row" key={f.name}>
                  <div className="compliance-meta">
                    <div className="compliance-name">{f.name}</div>
                    <div className="compliance-label">{f.label}</div>
                  </div>
                  <div className="compliance-score">
                    <div className="posture-bar"><span style={{ width: `${f.score}%`, background: TONE_COLOR[st.tone] }} /></div>
                    <strong style={{ color: TONE_COLOR[st.tone], minWidth: 44, textAlign: 'right' }}>{f.score}%</strong>
                    <span className="badge" style={{ background: `${TONE_COLOR[st.tone]}1a`, color: TONE_COLOR[st.tone], border: `1px solid ${TONE_COLOR[st.tone]}55` }}>{st.t}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'toprisk' && (
          <div className="chart-grid">
            <div className="card chart-card span-2">
              <div className="section-head">
                <h3>Top Risk Exceptions</h3>
                <button className="btn btn-sm" onClick={() => navigate('/registry')}>Open risk register</button>
              </div>
              <div className="table-wrap" style={{ border: 'none' }}>
                <table className="data">
                  <thead>
                    <tr><th>ID</th><th>Policy</th><th>Asset</th><th>Risk</th><th>Status</th><th>Expiry</th><th></th></tr>
                  </thead>
                  <tbody>
                    {top_risk_exceptions.map((e) => (
                      <tr key={e.id} className="row-clickable" onClick={() => navigate(`/exceptions/${e.id}`)}>
                        <td className="mono">{e.id}</td>
                        <td>{e.policy_name || e.exception_type}</td>
                        <td>{e.asset_name}</td>
                        <td><RiskBadge level={e.risk_level} score={e.risk_score} /></td>
                        <td><StatusBadge status={e.status} /></td>
                        <td>{daysRemainingLabel(e.days_remaining)}</td>
                        <td><button className="btn btn-sm" onClick={(ev) => { ev.stopPropagation(); navigate(`/exceptions/${e.id}`); }}>Open</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card chart-card">
              <h3>Top Risk Hotspots</h3>
              <div className="page-sub" style={{ marginBottom: 8 }}>Accumulated risk by asset / business unit</div>
              {hotspots.map((h) => (
                <div key={h.name} className="hotspot-row">
                  <div>
                    <div className="hotspot-name">{h.name}</div>
                    <div className="hotspot-sub">{h.business_unit} · {h.count} exception(s) · avg {h.avg_risk}</div>
                  </div>
                  <div className="hotspot-val">{h.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
