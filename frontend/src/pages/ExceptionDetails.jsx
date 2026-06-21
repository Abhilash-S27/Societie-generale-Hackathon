import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lightbulb, ArrowLeft } from 'lucide-react';
import api from '../api/api';
import RiskBadge from '../components/RiskBadge.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import AlertCard from '../components/AlertCard.jsx';
import CIABadge from '../components/CIABadge.jsx';
import LifecycleStepper from '../components/LifecycleStepper.jsx';
import ViewSelector from '../components/ViewSelector.jsx';
import { ACTIONS_BY_STATUS, ACTION_LABELS, SEVERITY_COLORS, CONFLICT_TYPE_LABELS, ROLE_LIFECYCLE_ACTIONS, CIA_COLORS, CIA_MEANINGS, RISK_COLORS } from '../utils/constants';
import { formatDate, formatDateTime, daysRemainingLabel, titleCase } from '../utils/formatters';

const ACTION_STYLE = {
  submit: 'btn-primary', start_review: 'btn-primary', approve: 'btn-success',
  activate: 'btn-success', renew: 'btn-success', request_renewal: 'btn-warn',
  escalate: 'btn-warn', reject: 'btn-danger', revoke: 'btn-danger', close: '',
};

const VIEWS = [
  { key: 'overview', label: 'Overview' },
  { key: 'risk', label: 'Risk & Controls' },
  { key: 'lifecycle', label: 'Lifecycle Evidence' },
  { key: 'grc', label: 'GRC Findings' },
  { key: 'audit', label: 'Audit Trail' },
];

// Control state derived from existing status / expiry / control data.
function controlState(ex) {
  const s = ex.base_status;
  if (s === 'revoked') return { label: 'Revoked Exception', tone: 'purple' };
  if (s === 'rejected') return { label: 'Rejected Exception', tone: 'danger' };
  if (s === 'escalated') return { label: 'Escalated Exception', tone: 'danger' };
  if (s === 'closed') return { label: 'Closed', tone: 'default' };
  if (ex.expiry_status === 'overdue') return { label: 'Expired Exception', tone: 'danger' };
  if (['submitted', 'under_review', 'pending_approval'].includes(s)) return { label: 'Pending Risk Acceptance', tone: 'warn' };
  if (['active', 'renewed', 'expiring_soon', 'approved'].includes(s)) {
    return ex.control_strength === 'missing'
      ? { label: 'Active Exception · No Control', tone: 'warn' }
      : { label: 'Compliant with Exception', tone: 'success' };
  }
  return { label: 'Active Exception', tone: 'default' };
}

export default function ExceptionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ex, setEx] = useState(null);
  const [view, setView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const role = localStorage.getItem('rw_role') || 'system';

  const load = useCallback(() => {
    setLoading(true);
    api.getException(id)
      .then(setEx)
      .catch((e) => setError(e.response?.status === 404 ? 'Exception not found' : e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function flash(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 2600); }

  async function doAction(action) {
    setBusy(true);
    try {
      if (action === 'approve') await api.approveException(id, { actor: role, comment: 'Approved via console.' });
      else if (action === 'reject') await api.rejectException(id, { actor: role, comment: 'Rejected via console.' });
      else if (action === 'revoke') await api.revokeException(id, { actor: role, comment: 'Revoked via console.' });
      else if (action === 'renew') await api.renewException(id, { actor: role, extend_days: 90 });
      else await api.updateStatus(id, { action, actor: role, note: `${ACTION_LABELS[action]} via console.` });
      flash('success', `${ACTION_LABELS[action]} applied.`);
      load();
    } catch (err) {
      flash('error', err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="state-box"><div className="spinner" />Loading exception evidence…</div>;
  if (error) return <div className="state-box">⚠️ {error} · <Link className="link" to="/registry">Back to registry</Link></div>;

  const roleActions = ROLE_LIFECYCLE_ACTIONS[role] || [];
  const actions = (ACTIONS_BY_STATUS[ex.base_status] || []).filter((a) => roleActions.includes(a));
  const cs = controlState(ex);
  const frameworks = ex.policy?.framework_refs || [];

  const meta = [
    ['Exception ID', <span className="mono" key="id">{ex.id}</span>],
    ['Status', <StatusBadge status={ex.status} key="s" />],
    ['CIA Impact', <CIABadge impact={ex.cia_impact} key="c" />],
    ['Control State', <span className={`control-state-badge tone-${cs.tone}`} key="cs">{cs.label}</span>],
    ['Expiry Date', formatDate(ex.expiry_date)],
    ['Days Remaining', daysRemainingLabel(ex.days_remaining)],
    ['Owner', ex.owner_name || 'Unassigned'],
    ['Approver', ex.approver_name || '—'],
    ['Requester', ex.requester_name],
    ['Business Unit', ex.business_unit],
    ['Asset / System', ex.asset_name],
    ['Policy', ex.policy_name],
  ];

  return (
    <div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* Evidence-file header */}
      <div className="dashboard-command-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/registry')}><ArrowLeft size={14} /> Back to Registry</button>
          <div className="page-title" style={{ marginTop: 6 }}>Exception Evidence File</div>
          <div className="page-sub">Complete audit trail, risk context, lifecycle status, and control-exception evidence.</div>
          <div className="command-badges">
            <span className="cmd-badge cmd-badge-blue">Workspace: {role}</span>
            <span className="cmd-badge cmd-badge-live"><span className="live-dot" /> Live Demo Environment</span>
            <span className="cmd-badge cmd-badge-id">{ex.id}</span>
          </div>
        </div>
        <ViewSelector label="Evidence View" value={view} onChange={setView} options={VIEWS} id="evidence-view" />
      </div>

      {/* Premium summary card: big score + meta grid */}
      <div className="card card-pad evidence-summary-card">
        <div className="evidence-summary-top">
          <div className="evidence-score-block" style={{ borderColor: `${RISK_COLORS[ex.risk_level]}55` }}>
            <div className="esb-label">Risk Score</div>
            <div className="esb-score" style={{ color: RISK_COLORS[ex.risk_level] }}>{ex.risk_score}</div>
            <RiskBadge level={ex.risk_level} />
          </div>
          <div className="evidence-meta-grid">
            {meta.map(([label, value]) => (
              <div className="evi-field" key={label}>
                <div className="evi-label">{label}</div>
                <div className="evi-value">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendation banner */}
      <div className="rec-banner">
        <Lightbulb className="rec-icon" size={22} />
        <div className="rec-banner-text">
          <strong>Recommendation: {ex.recommendation?.text}</strong>
          <span>Action: {ex.recommendation?.action} · Owner: {ex.recommendation?.owner_name || 'Unassigned'} · {daysRemainingLabel(ex.days_remaining)}</span>
        </div>
      </div>

      {/* Lifecycle stepper */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="card-title">Lifecycle Stage</div>
        <LifecycleStepper status={ex.base_status} />
      </div>

      {/* Available actions (role-gated) */}
      <div className="card card-pad evidence-action-panel" style={{ marginBottom: 18 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>Available Actions</div>
        {actions.length > 0 ? (
          <div className="action-bar">
            {actions.map((a) => (
              <button key={a} className={`btn ${ACTION_STYLE[a] || ''}`} disabled={busy} onClick={() => doAction(a)}>{ACTION_LABELS[a]}</button>
            ))}
          </div>
        ) : (
          <p className="faint" style={{ margin: 0, fontSize: 15 }}>
            No lifecycle actions available for the <strong>{role}</strong> role at the current status (read-only).
          </p>
        )}
      </div>

      {/* ===== View: Overview ===== */}
      {view === 'overview' && (
        <>
          <div className="page-sub" style={{ marginBottom: 14 }}>This view summarizes the business reason, ownership, and affected control scope for the exception.</div>
          <div className="detail-grid">
            <div className="flex" style={{ flexDirection: 'column', gap: 18 }}>
              <div className="card card-pad">
                <div className="card-title">Business Justification</div>
                <p style={{ margin: 0, lineHeight: 1.75, fontSize: 16 }}>
                  {ex.justification ? ex.justification : <span className="faint">No justification provided — flagged for clarification.</span>}
                </p>
              </div>
              <div className="card card-pad">
                <div className="card-title">Request &amp; Ownership</div>
                <dl className="kv">
                  <dt>Type</dt><dd>{ex.exception_type}</dd>
                  {ex.risk_impact && <><dt>Risk Impact</dt><dd>{ex.risk_impact}</dd></>}
                  <dt>Requester</dt><dd>{ex.requester_name}</dd>
                  <dt>Owner</dt><dd>{ex.owner_name || <span className="faint">Unassigned (orphaned)</span>}</dd>
                  <dt>Approver</dt><dd>{ex.approver_name || '—'}</dd>
                  <dt>Business Unit</dt><dd>{ex.business_unit}</dd>
                  <dt>Start Date</dt><dd>{formatDate(ex.start_date)}</dd>
                  <dt>Expiry Date</dt><dd>{formatDate(ex.expiry_date)} · {daysRemainingLabel(ex.days_remaining)}</dd>
                  <dt>Last Reviewed</dt><dd>{ex.last_reviewed_at ? formatDate(ex.last_reviewed_at) : <span className="faint">Never</span>}</dd>
                </dl>
              </div>
            </div>
            <div className="card card-pad">
              <div className="card-title">Policy Violated &amp; Asset</div>
              <dl className="kv">
                <dt>Policy</dt><dd>{ex.policy_name}{ex.policy?.code ? ` (${ex.policy.code})` : ''}</dd>
                <dt>Category</dt><dd>{ex.policy_category}</dd>
                <dt>Frameworks</dt><dd>{frameworks.join(', ') || '—'}</dd>
                <dt>Asset / System</dt><dd>{ex.asset_name}</dd>
                <dt>Criticality</dt><dd>{ex.asset?.criticality || ex.criticality || '—'}</dd>
                <dt>Control</dt><dd>{titleCase(ex.control_strength)}{ex.compensating_control ? ` — ${ex.compensating_control}` : ''}</dd>
              </dl>
            </div>
          </div>
        </>
      )}

      {/* ===== View: Risk & Controls ===== */}
      {view === 'risk' && (
        <div className="detail-grid">
          <div className="flex" style={{ flexDirection: 'column', gap: 18 }}>
            <div className="card card-pad">
              <div className="card-title">Risk Score Breakdown</div>
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <RiskBadge level={ex.risk_level} score={ex.risk_score} />
                <span className="faint" style={{ fontSize: 13 }}>capped 0–100</span>
              </div>
              {ex.risk_breakdown?.map((b) => (
                <div className="breakdown-row" key={b.key}>
                  <span className="breakdown-label">{b.label}</span>
                  <span className={`breakdown-points ${b.points < 0 ? 'neg' : b.points > 0 ? 'pos' : ''}`}>{b.points > 0 ? '+' : ''}{b.points}</span>
                </div>
              ))}
            </div>
            <div className="card card-pad">
              <div className="card-title">Why this score</div>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, fontSize: 15 }}>
                {ex.risk_explanation?.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </div>
          </div>
          <div className="flex" style={{ flexDirection: 'column', gap: 18 }}>
            {/* Recommendation card */}
            <div className="card card-pad rec-strong-card">
              <div className="card-title">Recommendation</div>
              <div className="rec-strong-action">{ex.recommendation?.title || titleCase(ex.recommendation?.action || 'Review')}</div>
              <p className="rec-strong-text">{ex.recommendation?.text}</p>
              {ex.recommendation?.reason && <div className="rec-strong-reason">Why: {ex.recommendation.reason}</div>}
              <div className="rec-strong-owner">Owner: <strong>{ex.recommendation?.owner_name || 'Unassigned'}</strong></div>
            </div>

            <div className="card card-pad">
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <div className="card-title" style={{ border: 'none', margin: 0, paddingBottom: 0 }}>Control State</div>
                <span className={`control-state-badge tone-${cs.tone}`}>{cs.label}</span>
              </div>
              <dl className="kv">
                <dt>Control Strength</dt><dd>{titleCase(ex.control_strength)}</dd>
                <dt>Compensating Control</dt><dd>{ex.compensating_control || <span className="faint">None recorded</span>}</dd>
              </dl>
            </div>

            <div className="card card-pad">
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <div className="card-title" style={{ border: 'none', margin: 0, paddingBottom: 0 }}>CIA Impact</div>
                <CIABadge impact={ex.cia_impact} />
              </div>
              {['Confidentiality', 'Integrity', 'Availability'].map((dim) => {
                const active = ex.cia_impact === dim || ex.cia_impact === 'Multiple';
                const color = CIA_COLORS[dim];
                return (
                  <div key={dim} className="breakdown-row" style={{ opacity: active ? 1 : 0.45 }}>
                    <span className="breakdown-label" style={{ color: active ? color : 'var(--text-muted)', fontWeight: active ? 800 : 600 }}>{dim}</span>
                    <span className="breakdown-label" style={{ textAlign: 'right' }}>{CIA_MEANINGS[dim]}</span>
                  </div>
                );
              })}
            </div>

            <div className="card card-pad">
              <div className="card-title">Compliance Mapping</div>
              {frameworks.length > 0 && (
                <div className="flex gap-8 wrap" style={{ marginBottom: 10 }}>
                  {frameworks.map((f) => <span className="badge" key={f} style={{ background: 'var(--brand-50)', color: 'var(--brand)', border: '1px solid rgba(37,99,235,0.3)' }}>{f}</span>)}
                </div>
              )}
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                Relevant control families: <strong>NIST AC-2</strong> (account/privileged access), <strong>NIST PL-4</strong> (rules of behavior),
                <strong> GDPR Article 25</strong> (data protection by design), and <strong>CIS Controls</strong> (secure configuration).
                This exception is a documented, time-bound deviation requiring justification and review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== View: Lifecycle Evidence ===== */}
      {view === 'lifecycle' && (
        <div className="card card-pad">
          <div className="card-title">Audit Evidence Timeline</div>
          {ex.history?.length ? (
            <div className="timeline">
              {ex.history.map((h) => (
                <div className="timeline-item" key={h.id}>
                  <div className="timeline-action">{titleCase(h.action)}{h.from_status ? `: ${titleCase(h.from_status)} → ${titleCase(h.to_status)}` : ` → ${titleCase(h.to_status)}`}</div>
                  <div className="timeline-meta">{formatDateTime(h.timestamp)} · {h.actor}</div>
                  {h.note && <div className="timeline-note">{h.note}</div>}
                </div>
              ))}
            </div>
          ) : <div className="state-box">No lifecycle history yet.</div>}
        </div>
      )}

      {/* ===== View: GRC Findings ===== */}
      {view === 'grc' && (
        <div className="detail-grid">
          <div className="card card-pad">
            <div className="card-title">Related Risks &amp; Conflicts ({ex.conflicts?.length || 0})</div>
            {ex.conflicts?.length ? (
              <div className="alert-list">
                {ex.conflicts.map((c) => {
                  const color = SEVERITY_COLORS[c.severity] || '#64748b';
                  const others = c.related_exception_ids.filter((rid) => rid !== ex.id);
                  return (
                    <div className="alert-card finding-card" key={c.conflict_id} style={{ borderLeftColor: color }}>
                      <div className="alert-card-main">
                        <div className="alert-card-head">
                          <span className="alert-card-type">{CONFLICT_TYPE_LABELS[c.type] || c.type}</span>
                          <span className="badge" style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}>{titleCase(c.severity)}</span>
                        </div>
                        <div className="alert-card-reason">{c.reason}</div>
                        <div className="alert-card-meta">Asset: {c.asset}</div>
                        {others.length > 0 && (
                          <div className="alert-card-meta">Related:&nbsp;{others.map((rid) => <Link key={rid} to={`/exceptions/${rid}`} className="link">{rid}</Link>)}</div>
                        )}
                        <div className="alert-card-action">→ {c.recommended_action}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="state-box">No related GRC findings detected for this exception.</div>}
          </div>
          <div className="card card-pad">
            <div className="card-title">Related Alerts ({ex.alerts?.length || 0})</div>
            {ex.alerts?.length ? (
              <div className="alert-list">{ex.alerts.map((a) => <AlertCard key={a.id} alert={a} />)}</div>
            ) : <div className="state-box">No active alerts.</div>}
          </div>
        </div>
      )}

      {/* ===== View: Audit Trail ===== */}
      {view === 'audit' && (
        <div className="flex" style={{ flexDirection: 'column', gap: 18 }}>
          <div className="card card-pad audit-trail-card">
            <div className="card-title">Approval &amp; Review Records ({ex.approvals?.length || 0})</div>
            {ex.approvals?.length ? (
              <div className="table-wrap" style={{ border: 'none' }}>
                <table className="data">
                  <thead><tr><th>Decision</th><th>Actor</th><th>Comment</th><th>When</th></tr></thead>
                  <tbody>
                    {ex.approvals.map((a) => (
                      <tr key={a.id}>
                        <td><StatusBadge status={a.decision} /></td>
                        <td>{a.actor}</td>
                        <td>{a.comment || '—'}</td>
                        <td>{formatDateTime(a.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="state-box">No approval or review records yet.</div>}
          </div>
          <div className="card card-pad audit-trail-card">
            <div className="card-title">Status Change Log</div>
            {ex.history?.length ? (
              <div className="timeline">
                {ex.history.map((h) => (
                  <div className="timeline-item" key={h.id}>
                    <div className="timeline-action">{titleCase(h.action)}{h.from_status ? `: ${titleCase(h.from_status)} → ${titleCase(h.to_status)}` : ` → ${titleCase(h.to_status)}`}</div>
                    <div className="timeline-meta">{formatDateTime(h.timestamp)} · {h.actor}</div>
                    {h.note && <div className="timeline-note">{h.note}</div>}
                  </div>
                ))}
              </div>
            ) : <div className="state-box">No history yet.</div>}
          </div>
          <div className="card card-pad">
            <div className="card-title">Evidence Summary</div>
            <dl className="kv">
              <dt>Requested by</dt><dd>{ex.requester_name}</dd>
              <dt>Owner</dt><dd>{ex.owner_name || 'Unassigned'}</dd>
              <dt>Approver</dt><dd>{ex.approver_name || '—'}</dd>
              <dt>Current status</dt><dd><StatusBadge status={ex.status} /></dd>
              <dt>Control state</dt><dd><span className={`control-state-badge tone-${cs.tone}`}>{cs.label}</span></dd>
              <dt>Accepted risk</dt><dd>{ex.risk_score}/100 ({ex.risk_level})</dd>
              <dt>History records</dt><dd>{ex.history?.length || 0}</dd>
              <dt>Approval records</dt><dd>{ex.approvals?.length || 0}</dd>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
