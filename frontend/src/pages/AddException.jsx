import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import api from '../api/api';

// --- Local, timezone-safe date helpers (YYYY-MM-DD) ---
function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function getTodayDate() { return fmtDate(new Date()); }
function addDays(dateStr, n) {
  // Parse as local midnight to avoid UTC drift.
  const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  base.setDate(base.getDate() + n);
  return fmtDate(base);
}
// Earliest allowed expiry = the day after the start date.
function minExpiry(startStr) { return addDays(startStr || getTodayDate(), 1); }
const DEFAULT_EXPIRY_DAYS = 15;

const EMPTY = {
  requester: '', business_unit: '', asset_id: '', policy_id: '', exception_type: '',
  risk_impact: '', justification: '', start_date: '', expiry_date: '', criticality: '',
  compensating_control: '', compensating_control_strength: 'missing', owner: '', approver: '',
};

const SECTIONS = [
  { key: 'details', label: 'Request Details' },
  { key: 'asset', label: 'Asset & Policy' },
  { key: 'risk', label: 'Risk & Justification' },
  { key: 'controls', label: 'Compensating Controls' },
  { key: 'ownership', label: 'Ownership & Approval' },
  { key: 'dates', label: 'Date Window' },
  { key: 'review', label: 'Review & Submit' },
];

export default function AddException() {
  const [lookups, setLookups] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeStep, setActiveStep] = useState('details');
  const navigate = useNavigate();
  const role = localStorage.getItem('rw_role') || 'Requester';

  useEffect(() => {
    api.getLookups().then((lk) => {
      setLookups(lk);
      const today = getTodayDate();
      setForm((f) => ({ ...f, start_date: today, expiry_date: addDays(today, DEFAULT_EXPIRY_DAYS) }));
    }).catch((e) => setError(e.message));
  }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  // Changing the start date keeps expiry valid: if expiry is empty or not after
  // the new start date, reset it to start + 15 days.
  function onStartDate(v) {
    setError(null);
    setForm((f) => {
      const next = { ...f, start_date: v };
      if (!f.expiry_date || f.expiry_date <= v) next.expiry_date = addDays(v, DEFAULT_EXPIRY_DAYS);
      return next;
    });
  }

  // Auto-fill criticality from the selected asset. business_unit (department) is set
  // separately by the user from the dataset departments (IT, Finance, HR, etc.) —
  // asset.business_unit uses banking unit names that differ from the CSV departments.
  function onAsset(id) {
    const asset = lookups?.assets.find((a) => a.id === id);
    setForm((f) => ({
      ...f,
      asset_id: id,
      criticality: asset ? asset.criticality : f.criticality,
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    const required = ['requester', 'asset_id', 'policy_id', 'exception_type', 'expiry_date'];
    const missing = required.filter((k) => !form[k]);
    if (missing.length) { setError(`Please fill: ${missing.join(', ')}`); return; }

    // Date validation — never send invalid date ranges to the backend.
    if (form.start_date && form.start_date < getTodayDate()) {
      setError('Start date cannot be in the past.'); return;
    }
    if (form.start_date && form.expiry_date && form.expiry_date <= form.start_date) {
      setError('Expiry date must be after the start date.'); return;
    }

    setSubmitting(true);
    try {
      const created = await api.createException(form);
      setToast({ type: 'success', msg: `${created.id} created · risk ${created.risk_score} (${created.risk_level})` });
      setTimeout(() => navigate(`/exceptions/${created.id}`), 900);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setSubmitting(false);
    }
  }

  function goToStep(key) {
    setActiveStep(key);
    const el = document.getElementById(`sec-${key}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (!lookups) return <div className="state-box"><div className="spinner" />Loading form…</div>;

  // Live-resolved values for preview / checklist (display only — payload unchanged).
  const policyObj = lookups.policies.find((p) => p.id === form.policy_id);
  const nameOf = (id) => lookups.users.find((u) => u.id === id)?.name;
  const assetName = lookups.assets.find((a) => a.id === form.asset_id)?.name;
  const durationDays = (form.start_date && form.expiry_date)
    ? Math.round((new Date(`${form.expiry_date}T00:00:00`) - new Date(`${form.start_date}T00:00:00`)) / 86400000) : null;
  const datesValid = !!form.start_date && !!form.expiry_date && form.expiry_date > form.start_date;

  const complete = {
    details: !!form.exception_type && !!form.requester,
    asset: !!form.asset_id && !!form.policy_id,
    risk: form.justification.trim().length > 0,
    controls: form.compensating_control.trim().length > 0,
    ownership: !!form.owner && !!form.approver,
    dates: datesValid,
    review: ['requester', 'asset_id', 'policy_id', 'exception_type', 'expiry_date'].every((k) => form[k]) && datesValid,
  };

  const checklist = [
    { label: 'Business justification is clear', ok: form.justification.trim().length > 30 },
    { label: 'Asset and policy are selected', ok: !!form.asset_id && !!form.policy_id },
    { label: 'Owner and approver are assigned', ok: !!form.owner && !!form.approver },
    { label: 'Expiry date is time-bound', ok: datesValid },
    { label: 'Compensating control is documented', ok: form.compensating_control.trim().length > 0 },
    { label: 'Risk impact is understood', ok: !!form.risk_impact },
    { label: 'CIA impact is considered', ok: !!form.risk_impact },
  ];

  return (
    <div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* Premium header */}
      <div className="dashboard-command-header intake-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/registry')}><ArrowLeft size={14} /> Back to Registry</button>
          <div className="page-title" style={{ marginTop: 6 }}>Structured GRC Intake</div>
          <div className="page-sub">Submit a time-bound policy exception with asset, control, risk, ownership, and approval context.</div>
          <div className="command-badges">
            <span className="cmd-badge cmd-badge-id">Workspace: {role}</span>
            <span className="cmd-badge cmd-badge-blue">Requester Workflow</span>
            <span className="cmd-badge cmd-badge-live"><span className="live-dot" /> Live Demo Environment</span>
          </div>
        </div>
      </div>

      {/* Section stepper */}
      <div className="intake-stepper">
        {SECTIONS.map((sec, i) => (
          <button
            key={sec.key}
            type="button"
            className={`intake-step${activeStep === sec.key ? ' active' : ''}${complete[sec.key] ? ' done' : ''}`}
            onClick={() => goToStep(sec.key)}
          >
            <span className="intake-step-num">{complete[sec.key] ? <Check size={15} /> : i + 1}</span>
            <span className="intake-step-label">{sec.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="intake-layout">
        <div className="intake-main">
          {error && <div className="intake-error">{error}</div>}

          {/* 1 · Request Details */}
          <div className="card card-pad intake-section-card" id="sec-details">
            <div className="form-section-title">1 · Request Details</div>
            <div className="intake-field-grid">
              <div className="field">
                <label>Exception Type <span className="req">*</span></label>
                <select value={form.exception_type} onChange={(e) => set('exception_type', e.target.value)}>
                  <option value="">Select type</option>
                  {lookups.exception_types.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Requester <span className="req">*</span></label>
                <select value={form.requester} onChange={(e) => set('requester', e.target.value)}>
                  <option value="">Select requester</option>
                  {lookups.users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div className="field">
                <label>Department</label>
                <select value={form.business_unit} onChange={(e) => set('business_unit', e.target.value)}>
                  <option value="">Select department</option>
                  {lookups.business_units.map((b) => <option key={b}>{b}</option>)}
                </select>
                <span className="field-help">Select the department requesting this exception.</span>
              </div>
            </div>
          </div>

          {/* 2 · Asset & Policy */}
          <div className="card card-pad intake-section-card" id="sec-asset">
            <div className="form-section-title">2 · Asset &amp; Policy Mapping</div>
            <div className="intake-field-grid">
              <div className="field">
                <label>Asset / System <span className="req">*</span></label>
                <select value={form.asset_id} onChange={(e) => onAsset(e.target.value)}>
                  <option value="">Select asset</option>
                  {lookups.assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.criticality})</option>)}
                </select>
              </div>
              <div className="field">
                <label>Policy Violated <span className="req">*</span></label>
                <select value={form.policy_id} onChange={(e) => set('policy_id', e.target.value)}>
                  <option value="">Select policy</option>
                  {lookups.policies.map((p) => <option key={p.id} value={p.id}>{p.name} [{p.category}]</option>)}
                </select>
              </div>
              <div className="field">
                <label>Asset Criticality</label>
                <select value={form.criticality} onChange={(e) => set('criticality', e.target.value)}>
                  <option value="">Auto from asset</option>
                  {lookups.criticalities.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Policy Category</label>
                <input readOnly value={policyObj?.category || ''} placeholder="Set from selected policy" />
                {policyObj?.framework_refs?.length > 0 && <span className="field-help">Frameworks: {policyObj.framework_refs.join(', ')}</span>}
              </div>
            </div>
          </div>

          {/* 3 · Risk & Justification */}
          <div className="card card-pad intake-section-card" id="sec-risk">
            <div className="form-section-title">3 · Risk &amp; Justification</div>
            <div className="intake-field-grid">
              <div className="field">
                <label>Risk Impact</label>
                <select value={form.risk_impact} onChange={(e) => set('risk_impact', e.target.value)}>
                  <option value="">Select impact</option>
                  {['Low', 'Medium', 'High', 'Critical'].map((c) => <option key={c}>{c}</option>)}
                </select>
                <span className="field-help">CIA impact and risk score are derived automatically after submission.</span>
              </div>
            </div>
            <div className="field mt-8">
              <label>Business Justification</label>
              <textarea
                placeholder="Why is this exception needed? (Short or empty justifications are flagged.)"
                value={form.justification} onChange={(e) => set('justification', e.target.value)}
              />
              <span className="intake-helper">Write a clear business justification. Avoid vague statements like “temporary need” or “urgent issue” without context.</span>
            </div>
          </div>

          {/* 4 · Compensating Controls */}
          <div className="card card-pad intake-section-card" id="sec-controls">
            <div className="form-section-title">4 · Compensating Controls</div>
            <div className="intake-field-grid">
              <div className="field">
                <label>Compensating Control Strength</label>
                <select value={form.compensating_control_strength} onChange={(e) => set('compensating_control_strength', e.target.value)}>
                  {lookups.control_strengths.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="field mt-8">
              <label>Compensating Control</label>
              <textarea
                placeholder="What controls reduce the risk while this exception is active?"
                value={form.compensating_control} onChange={(e) => set('compensating_control', e.target.value)}
              />
              <span className="intake-helper">Describe what reduces risk while the exception is active.</span>
            </div>
          </div>

          {/* 5 · Ownership & Approval */}
          <div className="card card-pad intake-section-card" id="sec-ownership">
            <div className="form-section-title">5 · Ownership &amp; Approval</div>
            <div className="intake-field-grid">
              <div className="field">
                <label>Owner</label>
                <select value={form.owner} onChange={(e) => set('owner', e.target.value)}>
                  <option value="">Unassigned (will be flagged orphaned)</option>
                  {lookups.users.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.role}{u.is_active ? '' : ' (inactive)'}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Approver</label>
                <select value={form.approver} onChange={(e) => set('approver', e.target.value)}>
                  <option value="">Select approver</option>
                  {lookups.users
                    .filter((u) => u.role === 'Approver' || u.role === 'Auditor/Admin')
                    .map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 6 · Date Window */}
          <div className="card card-pad intake-section-card" id="sec-dates">
            <div className="form-section-title">6 · Date Window</div>
            <div className="intake-field-grid">
              <div className="field">
                <label>Start Date</label>
                <input type="date" value={form.start_date} min={getTodayDate()} onChange={(e) => onStartDate(e.target.value)} />
                <span className="field-help">Defaults to today. Past dates are not allowed.</span>
              </div>
              <div className="field">
                <label>Expiry Date <span className="req">*</span></label>
                <input type="date" value={form.expiry_date} min={minExpiry(form.start_date)}
                  onChange={(e) => { setError(null); set('expiry_date', e.target.value); }} />
                <span className="field-help">Expiry must be after the start date.</span>
              </div>
              <div className="field">
                <label>Duration</label>
                <input readOnly value={durationDays != null ? `${durationDays} day(s)` : ''} placeholder="Auto-computed" />
              </div>
            </div>
          </div>

          {/* Submit panel */}
          <div className="card card-pad intake-submit-panel" id="sec-review">
            <div className="form-section-title">7 · Review &amp; Submit</div>
            <p className="intake-helper" style={{ margin: '0 0 14px' }}>After submission, the request enters the <strong>Security Reviewer</strong> queue.</p>
            {error && <div className="intake-error">{error}</div>}
            <div className="action-bar">
              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Exception Request'}
              </button>
              <button type="button" className="btn" onClick={() => navigate('/registry')}>Cancel</button>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <aside className="intake-side-panel">
          <div className="card card-pad intake-guidance-card">
            <div className="card-title">Submission Quality Checklist</div>
            {checklist.map((c) => (
              <div className={`intake-check${c.ok ? ' ok' : ''}`} key={c.label}>
                <span className="intake-check-mark">{c.ok ? <Check size={14} /> : ''}</span>
                <span>{c.label}</span>
              </div>
            ))}
            <div className="intake-warning">High-risk or vague requests may be escalated during security review.</div>
          </div>

          <div className="card card-pad intake-preview-card">
            <div className="card-title">Request Preview</div>
            <dl className="kv">
              <dt>Exception Type</dt><dd>{form.exception_type || <span className="faint">—</span>}</dd>
              <dt>Asset</dt><dd>{assetName || <span className="faint">—</span>}</dd>
              <dt>Policy</dt><dd>{policyObj?.name || <span className="faint">—</span>}</dd>
              <dt>Owner</dt><dd>{nameOf(form.owner) || <span className="faint">Unassigned</span>}</dd>
              <dt>Approver</dt><dd>{nameOf(form.approver) || <span className="faint">—</span>}</dd>
              <dt>Start Date</dt><dd>{form.start_date || <span className="faint">—</span>}</dd>
              <dt>Expiry Date</dt><dd>{form.expiry_date || <span className="faint">—</span>}</dd>
              <dt>Duration</dt><dd>{durationDays != null ? `${durationDays} day(s)` : <span className="faint">—</span>}</dd>
              <dt>Risk Score</dt><dd><span className="faint">Generated after submission</span></dd>
            </dl>
          </div>
        </aside>
      </form>
    </div>
  );
}
