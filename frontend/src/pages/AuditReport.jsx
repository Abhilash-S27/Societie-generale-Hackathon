import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer } from 'lucide-react';
import api from '../api/api';
import RiskBadge from '../components/RiskBadge.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ViewSelector from '../components/ViewSelector.jsx';
import { formatDate, formatDateTime, daysRemainingLabel, titleCase } from '../utils/formatters';
import { SEVERITY_COLORS, CONFLICT_TYPE_LABELS } from '../utils/constants';

const VIEWS = [
  { key: 'summary', label: 'Executive Summary' },
  { key: 'mapping', label: 'Compliance Mapping' },
  { key: 'highrisk', label: 'High-Risk Exceptions' },
  { key: 'overdue', label: 'Overdue / Expired' },
  { key: 'nocontrols', label: 'Exceptions Without Controls' },
  { key: 'grc', label: 'GRC Findings' },
  { key: 'lifecycle', label: 'Lifecycle Evidence' },
];

const TONE = { success: '#16A34A', warn: '#B45309', danger: '#DC2626', purple: '#7C3AED', default: '#2563EB' };

function MiniTable({ title, rows }) {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  return (
    <div className="card card-pad">
      <div className="card-title">{title}</div>
      {rows.length === 0 && <p className="faint">No data.</p>}
      {rows.map((r) => (
        <div className="breakdown-row" key={r.name}>
          <span className="breakdown-label">{titleCase(r.name)}</span>
          <span className="breakdown-points">{r.value} <span className="faint">({Math.round((r.value / total) * 100)}%)</span></span>
        </div>
      ))}
    </div>
  );
}

// Auditor-grade exception table with Open Details action.
function AuditorTable({ rows, orphan }) {
  if (!rows.length) return <p className="faint">None.</p>;
  return (
    <div className="table-wrap" style={{ border: 'none' }}>
      <table className="data auditor-pack-table">
        <thead>
          <tr>
            <th>ID</th><th>Policy</th><th>Asset / System</th><th>Owner</th><th>Risk</th>
            <th>Status</th><th>{orphan ? 'Owner State' : 'Expiry'}</th><th>Recommended Action</th><th className="no-print" />
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id}>
              <td className="mono">{e.id}</td>
              <td>{e.policy_name}</td>
              <td>{e.asset_name}</td>
              <td>{e.owner_name || <span className="faint">Unassigned</span>}</td>
              <td><RiskBadge level={e.risk_level} score={e.risk_score} /></td>
              <td><StatusBadge status={e.status} /></td>
              <td>
                {orphan ? titleCase(e.owner_state) : formatDate(e.expiry_date)}
                {!orphan && <div className="faint" style={{ fontSize: 13 }}>{daysRemainingLabel(e.days_remaining)}</div>}
              </td>
              <td className="rec-pill">{e.recommendation?.text}</td>
              <td className="no-print"><Link className="btn btn-ghost btn-sm" to={`/exceptions/${e.id}`}>Open</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PostureCard({ name, value, sub, tone }) {
  return (
    <div className="posture-card" style={{ borderTopColor: TONE[tone] }}>
      <div className="posture-name">{name}</div>
      <div className="posture-metric" style={{ color: TONE[tone] }}>{value}</div>
      <div className="posture-sub">{sub}</div>
    </div>
  );
}

export default function AuditReport() {
  const [report, setReport] = useState(null);
  const [view, setView] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const role = localStorage.getItem('rw_role') || 'Auditor/Admin';

  useEffect(() => {
    api.getAuditReport()
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-box"><div className="spinner" />Compiling audit report…</div>;
  if (error) return <div className="state-box">⚠️ {error}</div>;

  const s = report.summary;
  const allEx = report.exceptions || [];
  const total = s.total_exceptions || 1;

  // CIA Triad roll-up computed from the enriched exceptions in the report.
  const ciaCounts = allEx.reduce((acc, e) => {
    const k = e.cia_impact || 'Multiple';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const ciaRows = ['Confidentiality', 'Integrity', 'Availability', 'Multiple']
    .filter((k) => ciaCounts[k]).map((k) => ({ name: k, value: ciaCounts[k] }));

  // Frontend-computed posture values.
  const critical = allEx.filter((e) => e.risk_level === 'Critical').length;
  const high = allEx.filter((e) => e.risk_level === 'High').length;
  const expiringSoon = allEx
    .filter((e) => e.expiry_status === 'expiring_soon' || (typeof e.days_remaining === 'number' && e.days_remaining >= 0 && e.days_remaining <= 30))
    .sort((a, b) => (a.days_remaining ?? 999) - (b.days_remaining ?? 999));
  const highRisk = [...allEx].filter((e) => e.risk_level === 'High' || e.risk_level === 'Critical').sort((a, b) => b.risk_score - a.risk_score);
  const noControls = allEx.filter((e) => e.control_strength === 'missing');
  const grcTotal = report.conflicts?.summary?.total || 0;
  const withApprover = allEx.filter((e) => e.approver_name).length;
  const avgRisk = s.average_risk_score;
  const healthPct = Math.round(((total - s.overdue_exceptions - s.orphaned_exceptions) / total) * 100);
  const coveragePct = Math.round((withApprover / total) * 100);

  // Audit readiness status.
  let readiness;
  if (critical > 0 || s.overdue_exceptions > 2) readiness = { label: 'Attention Required', tone: 'danger' };
  else if (s.overdue_exceptions > 0 || s.orphaned_exceptions > 0 || noControls.length > 0) readiness = { label: 'Needs Review', tone: 'warn' };
  else readiness = { label: 'Ready', tone: 'success' };

  const kpis = [
    ['Total Exceptions', s.total_exceptions, 'var(--navy-900)'],
    ['Active', s.active_exceptions, 'var(--green)'],
    ['Critical', critical, 'var(--red)'],
    ['High Risk', high, 'var(--amber)'],
    ['Overdue', s.overdue_exceptions, 'var(--red)'],
    ['Orphaned', s.orphaned_exceptions, '#7C3AED'],
    ['Expiring Soon', expiringSoon.length, 'var(--amber)'],
  ];

  // Compliance framework mapping rows.
  const fwCount = (kw) => allEx.filter((e) => (e.policy?.framework_refs || []).some((r) => r.toLowerCase().includes(kw))).length;
  const COMPLIANCE = [
    { name: 'NIST AC-2', count: fwCount('ac-2'), meaning: 'Account & privileged access management.', support: 'Tracks access-related exceptions, owners, approvals, and expiry windows.' },
    { name: 'NIST PL-4', count: fwCount('pl-4'), meaning: 'Rules of behavior for acceptable system use.', support: 'Documents justified deviations with reviewer and approver evidence.' },
    { name: 'GDPR Article 25', count: fwCount('gdpr'), meaning: 'Data protection by design & by default.', support: 'Flags data-handling exceptions and scores CIA impact.' },
    { name: 'CIS Controls', count: fwCount('cis'), meaning: 'Secure configuration & asset inventory.', support: 'Monitors configuration/asset exceptions and compensating controls.' },
    { name: 'Internal Policy Governance', count: s.total_exceptions, meaning: 'Organization-defined waiver & exception policy.', support: 'Centralizes the full exception lifecycle, risk scoring, and audit trail.' },
  ];

  const observations = [
    `${critical + high} high or critical exception(s) in the portfolio.`,
    `${s.overdue_exceptions} overdue exception(s) past review or expiry.`,
    `${s.orphaned_exceptions} orphaned exception(s) without an active owner.`,
    `${grcTotal} GRC overlap / conflict finding(s) detected.`,
  ];

  return (
    <div>
      {/* Premium report header */}
      <div className="dashboard-command-header audit-report-header">
        <div>
          <div className="page-title">Audit-Ready Exception Report</div>
          <div className="page-sub">Single trusted view of exception approvals, lifecycle evidence, risk posture, and compliance gaps.</div>
          <div className="command-badges">
            <span className="cmd-badge cmd-badge-blue">Generated {formatDateTime(report.generated_at)}</span>
            <span className="cmd-badge cmd-badge-id">Workspace: {role}</span>
            <span className="cmd-badge cmd-badge-live"><span className="live-dot" /> Live Demo Environment</span>
          </div>
        </div>
        <div className="flex" style={{ flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
          <button className="btn btn-primary btn-print no-print" onClick={() => window.print()}><Printer size={16} /> Print / Export Report</button>
          <ViewSelector label="Report View" value={view} onChange={setView} options={VIEWS} id="audit-view" />
        </div>
      </div>

      {/* Executive report summary card (always visible) */}
      <div className="card card-pad audit-summary-card">
        <div className="flex-between wrap" style={{ marginBottom: 16, alignItems: 'center' }}>
          <div className="card-title" style={{ border: 'none', margin: 0, paddingBottom: 0 }}>Exception Posture Summary</div>
          <span className={`audit-readiness-badge tone-${readiness.tone}`}>Audit Readiness: {readiness.label}</span>
        </div>
        <div className="audit-kpi-grid">
          {kpis.map(([label, value, color]) => (
            <div className="audit-kpi" key={label}>
              <div className="audit-kpi-value" style={{ color }}>{value}</div>
              <div className="audit-kpi-label">{label}</div>
            </div>
          ))}
          <div className="audit-kpi">
            <div className="audit-kpi-value" style={{ fontSize: 22, color: TONE[readiness.tone] }}>{readiness.label}</div>
            <div className="audit-kpi-label">Audit Readiness</div>
          </div>
        </div>
      </div>

      {/* ===== Executive Summary ===== */}
      {view === 'summary' && (<>
        <div className="report-section">
          <div className="card card-pad">
            <div className="card-title">Executive Summary</div>
            <p className="exec-summary">{report.executive_summary}</p>
          </div>
        </div>

        <div className="section-label">Risk Posture</div>
        <div className="posture-grid">
          <PostureCard name="Portfolio Risk" value={avgRisk} tone={avgRisk >= 70 ? 'danger' : avgRisk >= 45 ? 'warn' : 'success'}
            sub={`Average risk score · ${avgRisk >= 70 ? 'High' : avgRisk >= 45 ? 'Elevated' : 'Moderate'}`} />
          <PostureCard name="Lifecycle Health" value={`${healthPct}%`} tone={healthPct >= 90 ? 'success' : healthPct >= 70 ? 'warn' : 'danger'}
            sub="Portfolio current (not overdue / orphaned)" />
          <PostureCard name="Audit Evidence Coverage" value={`${coveragePct}%`} tone={coveragePct >= 80 ? 'success' : coveragePct >= 50 ? 'warn' : 'danger'}
            sub="Exceptions with approver evidence" />
          <PostureCard name="Control Exceptions" value={noControls.length} tone={noControls.length === 0 ? 'success' : noControls.length <= 2 ? 'warn' : 'danger'}
            sub="Missing compensating control" />
        </div>

        <div className="report-section">
          <div className="card card-pad">
            <div className="card-title">Top Observations</div>
            {observations.map((o, i) => (
              <div className="observation-item" key={i}><span className="observation-num">{i + 1}</span><span>{o}</span></div>
            ))}
          </div>
        </div>
      </>)}

      {/* ===== Compliance Mapping ===== */}
      {view === 'mapping' && (<>
        <div className="report-section">
          <div className="card card-pad compliance-mapping-card">
            <div className="card-title">Compliance &amp; Control Framework Mapping</div>
            <div className="cm-row cm-head">
              <span>Framework / Control</span><span>What it means</span><span>How RiskWaiver360 supports it</span><span>Posture</span><span>Count</span>
            </div>
            {COMPLIANCE.map((c) => (
              <div className="cm-row" key={c.name}>
                <span className="cm-name">{c.name}</span>
                <span className="cm-text">{c.meaning}</span>
                <span className="cm-text">{c.support}</span>
                <span><span className={`control-state-badge tone-${c.count > 0 ? 'success' : 'default'}`}>{c.count > 0 ? 'Active monitoring' : 'No current exceptions'}</span></span>
                <span className="cm-count">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="section-label">Distribution Roll-ups</div>
        <div className="report-two report-section">
          <MiniTable title="Exceptions by Policy" rows={report.by_policy} />
          <MiniTable title="Exceptions by Department" rows={report.by_business_unit} />
          <MiniTable title="Exceptions by Owner" rows={report.by_owner} />
          <MiniTable title="Exceptions by CIA Impact" rows={ciaRows} />
        </div>
      </>)}

      {/* ===== High-Risk Exceptions ===== */}
      {view === 'highrisk' && (
        <div className="report-section">
          <div className="card card-pad audit-section-card">
            <div className="card-title">High-Risk Exceptions ({highRisk.length})</div>
            <p className="page-sub" style={{ marginTop: -6, marginBottom: 12 }}>Critical and high-risk waivers ranked by risk score.</p>
            <AuditorTable rows={highRisk} />
          </div>
        </div>
      )}

      {/* ===== Overdue / Expired ===== */}
      {view === 'overdue' && (<>
        <div className="report-section">
          <div className="card card-pad audit-section-card">
            <div className="card-title">Overdue Exceptions ({report.overdue_exceptions.length})</div>
            <AuditorTable rows={report.overdue_exceptions} />
          </div>
        </div>
        <div className="report-section">
          <div className="card card-pad audit-section-card">
            <div className="card-title">Expiring Soon ({expiringSoon.length})</div>
            <AuditorTable rows={expiringSoon} />
          </div>
        </div>
        <div className="report-section">
          <div className="card card-pad audit-section-card">
            <div className="card-title">Orphaned Exceptions ({report.orphaned_exceptions.length})</div>
            <AuditorTable rows={report.orphaned_exceptions} orphan />
          </div>
        </div>
      </>)}

      {/* ===== Exceptions Without Controls ===== */}
      {view === 'nocontrols' && (
        <div className="report-section">
          <div className="card card-pad audit-section-card">
            <div className="card-title">Exceptions Without Compensating Controls ({noControls.length})</div>
            {noControls.length === 0
              ? <div className="state-box">No exceptions without controls detected.</div>
              : <AuditorTable rows={noControls} />}
          </div>
        </div>
      )}

      {/* ===== GRC Findings ===== */}
      {view === 'grc' && report.conflicts && (
        <div className="report-section">
          <div className="card card-pad audit-section-card">
            <div className="card-title">Overlap &amp; Conflict Findings</div>
            <div className="flex gap-16 wrap" style={{ marginBottom: 14 }}>
              {[
                ['Total Conflicts', report.conflicts.summary.total],
                ['Critical', report.conflicts.summary.critical],
                ['Overlapping', report.conflicts.summary.overlaps],
                ['Conflicting Approvals', report.conflicts.summary.conflicting_approvals],
                ['Duplicates', report.conflicts.summary.duplicates],
                ['Accumulation', report.conflicts.summary.accumulation],
              ].map(([label, value]) => (
                <div key={label}><strong style={{ fontSize: 20 }}>{value}</strong><div className="faint">{label}</div></div>
              ))}
            </div>

            <h4 style={{ fontSize: 14, margin: '6px 0 8px' }}>Top Accumulation Hotspots (by asset)</h4>
            {report.conflicts.accumulation.by_asset.map((h) => (
              <div className="hotspot-row" key={h.name}>
                <div>
                  <div className="hotspot-name">{h.name}</div>
                  <div className="hotspot-sub">{h.count} exception(s) · avg {h.avg_risk} · {titleCase(h.level)} accumulation</div>
                </div>
                <div className="hotspot-val">{h.total_risk}</div>
              </div>
            ))}

            <h4 style={{ fontSize: 14, margin: '16px 0 8px' }}>Recommended Remediation Plan</h4>
            {report.conflicts.findings.length === 0 && <p className="faint">No overlap/conflict findings.</p>}
            {report.conflicts.findings.length > 0 && (
              <div className="table-wrap" style={{ border: 'none' }}>
                <table className="data auditor-pack-table">
                  <thead><tr><th>Type</th><th>Severity</th><th>Exceptions</th><th>Reason</th><th>Recommended Action</th><th className="no-print" /></tr></thead>
                  <tbody>
                    {report.conflicts.findings.map((f) => {
                      const color = SEVERITY_COLORS[f.severity] || '#64748b';
                      const first = f.related_exception_ids[0];
                      return (
                        <tr key={f.conflict_id}>
                          <td>{CONFLICT_TYPE_LABELS[f.type] || f.type}</td>
                          <td><span className="badge" style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}>{titleCase(f.severity)}</span></td>
                          <td className="mono">{f.related_exception_ids.join(', ')}</td>
                          <td>{f.reason}</td>
                          <td>{f.recommended_action}</td>
                          <td className="no-print">{first && <Link className="btn btn-ghost btn-sm" to={`/exceptions/${first}`}>Open</Link>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Lifecycle Evidence ===== */}
      {view === 'lifecycle' && (<>
        <div className="report-section">
          <div className="card card-pad audit-section-card">
            <div className="card-title">Renewal / Revocation Status</div>
            <div className="flex gap-16 wrap">
              {Object.entries(report.renewal_revocation_status).map(([k, v]) => (
                <div key={k}><strong style={{ fontSize: 20 }}>{v}</strong><div className="faint">{titleCase(k)}</div></div>
              ))}
            </div>
          </div>
        </div>

        <div className="section-label">Evidence Coverage</div>
        <div className="posture-grid">
          <PostureCard name="Approver Evidence" value={`${coveragePct}%`} tone={coveragePct >= 80 ? 'success' : coveragePct >= 50 ? 'warn' : 'danger'} sub={`${withApprover} of ${total} have an approver`} />
          <PostureCard name="Renewals / Revocations" value={Object.values(report.renewal_revocation_status).reduce((a, b) => a + b, 0)} tone="default" sub="Lifecycle decisions recorded" />
          <PostureCard name="GRC Findings" value={grcTotal} tone={grcTotal === 0 ? 'success' : 'purple'} sub="Overlap / conflict findings" />
          <PostureCard name="Lifecycle Health" value={`${healthPct}%`} tone={healthPct >= 90 ? 'success' : healthPct >= 70 ? 'warn' : 'danger'} sub="Portfolio current" />
        </div>

        <div className="report-section">
          <div className="card card-pad audit-section-card">
            <div className="card-title">Top Risk Hotspots</div>
            {report.hotspots.map((h) => (
              <div className="hotspot-row" key={h.name}>
                <div>
                  <div className="hotspot-name">{h.name}</div>
                  <div className="hotspot-sub">{h.business_unit} · {h.count} exception(s) · avg {h.avg_risk}</div>
                </div>
                <div className="hotspot-val">{h.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="report-section">
          <div className="card card-pad audit-section-card lifecycle-evidence-card">
            <div className="card-title">Exception Evidence Index</div>
            <p className="page-sub" style={{ marginTop: -6, marginBottom: 12 }}>Open any exception for its full lifecycle history, approvals, and reviewer comments.</p>
            <div className="table-wrap" style={{ border: 'none' }}>
              <table className="data auditor-pack-table">
                <thead><tr><th>ID</th><th>Policy</th><th>Owner</th><th>Status</th><th>Last Reviewed</th><th className="no-print" /></tr></thead>
                <tbody>
                  {highRisk.slice(0, 10).map((e) => (
                    <tr key={e.id}>
                      <td className="mono">{e.id}</td>
                      <td>{e.policy_name}</td>
                      <td>{e.owner_name || <span className="faint">Unassigned</span>}</td>
                      <td><StatusBadge status={e.status} /></td>
                      <td>{e.last_reviewed_at ? formatDate(e.last_reviewed_at) : <span className="faint">Never</span>}</td>
                      <td className="no-print"><Link className="btn btn-ghost btn-sm" to={`/exceptions/${e.id}`}>Open</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>)}
    </div>
  );
}
