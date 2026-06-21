import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import RiskBadge from '../components/RiskBadge.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import CIABadge from '../components/CIABadge.jsx';
import ViewSelector from '../components/ViewSelector.jsx';
import { formatDate, daysRemainingLabel, titleCase } from '../utils/formatters';

// Statuses that land in the review queue. In the current dataset the primary
// in-flight status is 'pending_approval'; submitted/under_review are included
// for any newly submitted exceptions going through the full lifecycle.
const QUEUE_STATUSES = ['submitted', 'under_review', 'pending_approval'];

const VIEWS = [
  { key: 'pending', label: 'Pending Review' },
  { key: 'high', label: 'High Priority' },
  { key: 'critical', label: 'Critical Risk' },
  { key: 'overdue', label: 'Review Overdue' },
  { key: 'missing', label: 'Missing Controls' },
  { key: 'orphaned', label: 'Orphaned Owner' },
  { key: 'expiring', label: 'Expiring Soon' },
  { key: 'recent', label: 'Recently Reviewed' },
];

const CHECKLIST = [
  'Is the business justification clear?',
  'Is the asset and policy mapping correct?',
  'Is the owner active and accountable?',
  'Is the expiry window reasonable?',
  'Is the compensating control documented?',
  'Does the CIA impact match the business risk?',
  'Should this be escalated to Approver?',
];

const TONE = { blue: '#2563EB', danger: '#DC2626', success: '#16A34A', warn: '#B45309', purple: '#7C3AED' };

const isOverdueReview = (e) => e.review_state === 'overdue' || e.review_state === 'never';

// Frontend-computed review priority from existing fields only.
function reviewPriority(e) {
  let score = 0;
  if (e.risk_level === 'Critical') score += 4;
  else if (e.risk_level === 'High') score += 3;
  else if (e.risk_level === 'Medium') score += 1;
  if (typeof e.risk_score === 'number' && e.risk_score >= 70) score += 1;
  if (e.status === 'overdue' || e.days_remaining < 0) score += 3;
  if (isOverdueReview(e)) score += 2;
  if (e.control_strength === 'missing') score += 2;
  if (e.orphaned) score += 2;
  if (e.status === 'expiring_soon') score += 1;
  if (!e.justification || e.justification.trim().length < 20) score += 1;
  if (score >= 7) return { label: 'Critical', tone: 'danger' };
  if (score >= 4) return { label: 'High', tone: 'danger' };
  if (score >= 2) return { label: 'Medium', tone: 'warn' };
  return { label: 'Low', tone: 'success' };
}

function controlTone(strength) {
  if (strength === 'missing') return 'danger';
  if (strength === 'weak') return 'warn';
  return 'success';
}

export default function ReviewQueue() {
  const [rows, setRows] = useState([]);
  const [view, setView] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState(null);
  const [comments, setComments] = useState({});
  const navigate = useNavigate();
  const role = localStorage.getItem('rw_role') || 'reviewer';

  const load = useCallback(() => {
    setLoading(true);
    api.getExceptions()
      .then((all) => setRows(all.filter((e) => QUEUE_STATUSES.includes(e.base_status))))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function flash(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 2600); }

  async function act(id, kind) {
    setBusy(id + kind);
    const comment = comments[id] || '';
    try {
      if (kind === 'approve') await api.approveException(id, { actor: role, comment: comment || 'Approved.' });
      else if (kind === 'reject') await api.rejectException(id, { actor: role, comment: comment || 'Rejected.' });
      else if (kind === 'clarify') await api.reviewException(id, { actor: role, comment: comment || 'Clarification requested.', decision: 'clarification' });
      else await api.reviewException(id, { actor: role, comment: comment || 'Review comment added.' });
      flash('success', `${kind} applied to ${id}.`);
      setComments((c) => ({ ...c, [id]: '' }));
      load();
    } catch (err) {
      flash('error', err.response?.data?.error || err.message);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="state-box"><div className="spinner" />Loading review queue…</div>;
  if (error) return <div className="state-box">⚠️ {error}</div>;

  const counts = {
    pending:  rows.length, // all in-queue records need review
    high:     rows.filter((e) => e.risk_level === 'High' || e.risk_level === 'Critical').length,
    critical: rows.filter((e) => e.risk_level === 'Critical').length,
    overdue:  rows.filter(isOverdueReview).length,
    missing:  rows.filter((e) => e.control_strength === 'missing').length,
    orphaned: rows.filter((e) => e.orphaned).length,
    expiring: rows.filter((e) => e.status === 'expiring_soon').length,
    recent:   rows.filter((e) => ['under_review', 'pending_approval'].includes(e.base_status)).length,
  };

  const metrics = [
    { key: 'pending', label: 'Pending Review', value: counts.pending, help: 'Awaiting decision', tone: 'blue' },
    { key: 'high', label: 'High Priority', value: counts.high, help: 'High / critical risk', tone: 'danger' },
    { key: 'critical', label: 'Critical Risk', value: counts.critical, help: 'Highest risk level', tone: 'danger' },
    { key: 'overdue', label: 'Review Overdue', value: counts.overdue, help: 'Never / late review', tone: 'danger' },
    { key: 'missing', label: 'Missing Controls', value: counts.missing, help: 'No compensating control', tone: 'warn' },
    { key: 'orphaned', label: 'Orphaned Owner', value: counts.orphaned, help: 'No active owner', tone: 'purple' },
    { key: 'expiring', label: 'Expiring Soon', value: counts.expiring, help: 'Approaching expiry', tone: 'warn' },
    { key: 'recent', label: 'Recently Reviewed', value: counts.recent, help: 'In review / pending', tone: 'success' },
  ];

  const filtered = rows.filter((e) => {
    switch (view) {
      case 'pending': return QUEUE_STATUSES.includes(e.base_status); // all in-queue
      case 'high': return e.risk_level === 'High' || e.risk_level === 'Critical';
      case 'critical': return e.risk_level === 'Critical';
      case 'overdue': return isOverdueReview(e);
      case 'missing': return e.control_strength === 'missing';
      case 'orphaned': return e.orphaned;
      case 'expiring': return e.status === 'expiring_soon';
      case 'recent': return e.base_status === 'under_review' || e.base_status === 'pending_approval';
      default: return true;
    }
  });

  return (
    <div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* Premium header */}
      <div className="dashboard-command-header review-header">
        <div>
          <div className="page-title">Security Review Queue</div>
          <div className="page-sub">Prioritize submitted exceptions by risk, expiry, missing controls, ownership, and review urgency.</div>
          <div className="command-badges">
            <span className="cmd-badge cmd-badge-id">Workspace: {role}</span>
            <span className="cmd-badge cmd-badge-blue">Reviewer Workflow</span>
            <span className="cmd-badge cmd-badge-live"><span className="live-dot" /> Live Demo Environment</span>
          </div>
        </div>
        <ViewSelector label="Review View" value={view} onChange={setView} options={VIEWS} id="review-view" />
      </div>

      {/* Summary metric cards */}
      <div className="review-summary-grid">
        {metrics.map((m) => (
          <button className="review-metric-card" key={m.key} style={{ borderTopColor: TONE[m.tone] }} onClick={() => setView(m.key)}>
            <div className="rv-value" style={{ color: TONE[m.tone] }}>{m.value}</div>
            <div className="rv-label">{m.label}</div>
            <div className="rv-help">{m.help}</div>
          </button>
        ))}
      </div>

      <div className="review-workbench-layout">
        {/* Queue */}
        <div className="review-queue-panel">
          {filtered.length === 0 ? (
            <div className="card review-empty-state state-box">No exceptions require this review category.</div>
          ) : filtered.map((e) => {
            const pr = reviewPriority(e);
            const ct = controlTone(e.control_strength);
            return (
              <div className="card card-pad review-item-card" key={e.id}>
                <div className="flex gap-8 wrap" style={{ alignItems: 'center' }}>
                  <span className="mono link rr-id" onClick={() => navigate(`/exceptions/${e.id}`)} style={{ cursor: 'pointer' }}>{e.id}</span>
                  <span className={`review-priority-badge tone-${pr.tone}`}>{pr.label} Priority</span>
                  <StatusBadge status={e.status} />
                  <RiskBadge level={e.risk_level} score={e.risk_score} />
                  <CIABadge impact={e.cia_impact} />
                  <span className={`control-chip tone-${ct}`}>Control: {titleCase(e.control_strength)}</span>
                </div>

                <div className="review-item-title">{e.exception_type}</div>
                <div className="page-sub" style={{ marginTop: 2 }}>
                  {e.policy_name} · {e.asset_name} · {e.business_unit}
                </div>
                <div className="review-meta-line">
                  Requester: <strong>{e.requester_name}</strong> · Owner: <strong>{e.owner_name || 'Unassigned'}</strong> · Expiry {formatDate(e.expiry_date)} · {daysRemainingLabel(e.days_remaining)}
                </div>

                <div className="justification-preview">
                  <strong>Justification:</strong> {e.justification ? e.justification : <span className="faint">none provided</span>}
                </div>
                <div className="muted" style={{ marginTop: 4, fontSize: 15 }}>
                  <strong>Recommendation:</strong> {e.recommendation?.text}
                </div>

                <div className="flex gap-8 wrap mt-16" style={{ alignItems: 'flex-end' }}>
                  <div className="field" style={{ flex: 1, minWidth: 240, margin: 0 }}>
                    <label>Review comment</label>
                    <input placeholder="Add a comment for the audit trail…"
                      value={comments[e.id] || ''} onChange={(ev) => setComments((c) => ({ ...c, [e.id]: ev.target.value }))} />
                  </div>
                  <button className="btn btn-sm" onClick={() => navigate(`/exceptions/${e.id}`)}>Open Details</button>
                  <button className="btn" disabled={busy} onClick={() => act(e.id, 'comment')}>Add Comment</button>
                  <button className="btn btn-warn" disabled={busy} onClick={() => act(e.id, 'clarify')}>Ask Clarification</button>
                  {role === 'Approver' && (
                    <>
                      <button className="btn btn-success" disabled={busy} onClick={() => act(e.id, 'approve')}>Approve</button>
                      <button className="btn btn-danger" disabled={busy} onClick={() => act(e.id, 'reject')}>Reject</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reviewer guidance */}
        <aside className="review-guidance-panel">
          <div className="card card-pad reviewer-checklist">
            <div className="card-title">Reviewer Checklist</div>
            {CHECKLIST.map((g, i) => (
              <div className="checklist-item" key={i}>
                <span className="checklist-num">{i + 1}</span><span>{g}</span>
              </div>
            ))}
            <div className="review-note">Security Reviewers validate risk context before an Approver accepts or rejects the exception.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
