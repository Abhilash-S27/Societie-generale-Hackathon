import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, ArrowRight } from 'lucide-react';
import api from '../api/api';
import RiskBadge from '../components/RiskBadge.jsx';
import CIABadge from '../components/CIABadge.jsx';
import ViewSelector from '../components/ViewSelector.jsx';
import { RISK_COLORS, CIA_COLORS, CIA_MEANINGS } from '../utils/constants';
import { daysRemainingLabel, formatDate } from '../utils/formatters';

const TONE = { blue: '#2563EB', danger: '#DC2626', warn: '#B45309', purple: '#7C3AED', success: '#16A34A' };

// Weight reference — matches the backend rule-based scoring tables.
const TABLES = [
  { title: 'Exception Type', rows: [
    ['Encryption Disabled', 35], ['Admin Access', 30], ['Network Exposure', 30],
    ['Firewall Exception', 25], ['Logging Disabled', 25],
    ['Password Policy Exception', 20], ['Data Retention Exception', 20]] },
  { title: 'Asset Criticality', rows: [['Critical', 35], ['High', 25], ['Medium', 15], ['Low', 5]] },
  { title: 'Requested Duration', rows: [['0–7 days', 5], ['8–30 days', 10], ['31–90 days', 20], ['90+ days', 30]] },
  { title: 'Expiry Status', rows: [['Valid', 0], ['Expiring ≤14 days', 15], ['Overdue', 30]] },
  { title: 'Review Status', rows: [['Reviewed recently', 0], ['Review due', 10], ['Review overdue', 20], ['Never reviewed', 25]] },
  { title: 'Owner Status', rows: [['Active owner', 0], ['Inactive owner', 25], ['Missing owner', 30]] },
  { title: 'Compensating Control', rows: [['Strong', -15], ['Basic', -8], ['Missing', 0]] },
];

// Explainer cards — names mirror the real scoring factors above.
const FACTORS = [
  { name: 'Exception Type Weight', desc: 'Inherent danger of the exception category.', why: 'Disabling encryption or granting admin access is riskier than a password-policy waiver.', ex: 'Encryption Disabled +35 · Password Policy +20' },
  { name: 'Asset Criticality', desc: 'Importance of the affected system.', why: 'A waiver on a Critical asset exposes more business value.', ex: 'Critical +35 · Low +5' },
  { name: 'Duration Risk', desc: 'How long the exception stays open.', why: 'Longer windows mean longer exposure.', ex: '90+ days +30 · 0–7 days +5' },
  { name: 'Expiry Status', desc: 'Whether the waiver is valid, expiring, or overdue.', why: 'Overdue waivers are unmanaged, accumulating risk.', ex: 'Overdue +30 · Valid 0' },
  { name: 'Review Status', desc: 'Whether the exception was reviewed recently.', why: 'Never-reviewed waivers escape governance.', ex: 'Never reviewed +25 · Recent 0' },
  { name: 'Ownership Risk', desc: 'Whether an active owner is accountable.', why: 'Orphaned waivers have no one to remediate them.', ex: 'Missing owner +30 · Inactive +25' },
  { name: 'Compensating Control', desc: 'Controls that reduce risk while active (lowers the score).', why: 'Strong controls offset exposure.', ex: 'Strong −15 · Missing 0' },
];

const RISK_BANDS = [
  { name: 'Critical', range: '81 – 100', level: 'Critical', meaning: 'Severe, concentrated risk that demands immediate attention.', handling: 'Immediate review, escalation, revocation, or strict approval required.' },
  { name: 'High', range: '61 – 80', level: 'High', meaning: 'Elevated risk needing formal governance.', handling: 'Requires security review and an approver decision.' },
  { name: 'Medium', range: '31 – 60', level: 'Medium', meaning: 'Moderate risk acceptable with controls.', handling: 'Monitor and validate compensating controls.' },
  { name: 'Low', range: '0 – 30', level: 'Low', meaning: 'Limited risk under governance.', handling: 'Acceptable only if time-bound and documented.' },
];

const CIA_DIMS = [
  { dim: 'Confidentiality', example: 'Encryption disabled, data exposure, retention waivers.' },
  { dim: 'Integrity', example: 'Admin / privileged access, configuration change waivers.' },
  { dim: 'Availability', example: 'Firewall / network exposure, logging-disabled waivers.' },
  { dim: 'Multiple', example: 'Exceptions that affect more than one CIA dimension.' },
];

const VIEWS = [
  { key: 'formula', label: 'Scoring Formula' },
  { key: 'bands', label: 'Risk Bands' },
  { key: 'top', label: 'Highest Risk Exceptions' },
  { key: 'by_bu', label: 'Risk by Business Unit' },
  { key: 'by_policy', label: 'Risk by Policy' },
  { key: 'cia', label: 'CIA Impact View' },
  { key: 'explain', label: 'Explainability Notes' },
];

export default function RiskScoring() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('formula');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const role = localStorage.getItem('rw_role') || 'system';

  useEffect(() => {
    api.getExceptions()
      .then((all) => {
        const sorted = [...all].sort((a, b) => b.risk_score - a.risk_score);
        setRows(sorted);
        setSelected(sorted[0] || null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-box"><div className="spinner" />Loading risk model…</div>;
  if (error) return <div className="state-box">⚠️ {error}</div>;

  const total = rows.length || 1;
  const avg = Math.round(rows.reduce((s, e) => s + e.risk_score, 0) / total);
  const critical = rows.filter((e) => e.risk_level === 'Critical').length;
  const high = rows.filter((e) => e.risk_level === 'High').length;
  const missing = rows.filter((e) => e.control_strength === 'missing').length;
  const overdue = rows.filter((e) => e.status === 'overdue').length;
  const orphaned = rows.filter((e) => e.orphaned).length;
  const conflictSignals = rows.filter((e) => e.conflict_flag && e.conflict_flag !== 'Clean').length;
  const ciaMultiple = rows.filter((e) => e.cia_impact === 'Multiple').length;

  const metrics = [
    { label: 'Average Risk Score', value: avg, help: 'out of 100', tone: 'blue' },
    { label: 'Critical Exceptions', value: critical, help: 'score 81–100', tone: 'danger' },
    { label: 'High Risk Exceptions', value: high, help: 'score 61–80', tone: 'warn' },
    { label: 'Missing Controls', value: missing, help: 'no compensating control', tone: 'warn' },
    { label: 'Overdue Exceptions', value: overdue, help: 'past expiry', tone: 'danger' },
    { label: 'Orphaned Owners', value: orphaned, help: 'no active owner', tone: 'purple' },
    { label: 'Conflict Signals', value: conflictSignals, help: 'overlap / duplicate / conflict', tone: 'purple' },
    { label: 'CIA Multiple Impact', value: ciaMultiple, help: 'affects multiple dimensions', tone: 'blue' },
  ];

  const groupBy = (keyFn) => {
    const m = {};
    rows.forEach((e) => {
      const k = keyFn(e) || '—';
      if (!m[k]) m[k] = { name: k, total: 0, count: 0, crit: 0, high: 0 };
      m[k].total += e.risk_score; m[k].count += 1;
      if (e.risk_level === 'Critical') m[k].crit += 1;
      if (e.risk_level === 'High') m[k].high += 1;
    });
    return Object.values(m).map((g) => ({ ...g, avg: Math.round(g.total / g.count) })).sort((a, b) => b.total - a.total);
  };

  const GroupCard = ({ title, sub, data }) => {
    const max = data[0]?.total || 1;
    return (
      <div className="card card-pad">
        <div className="card-title">{title}</div>
        <div className="page-sub" style={{ marginTop: -8, marginBottom: 12 }}>{sub}</div>
        {data.length === 0 && <div className="risk-empty-state state-box">No risk records available for this category.</div>}
        {data.map((g, i) => (
          <div className="risk-ranking-card" key={g.name}>
            <div className="rr-rank">#{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div className="rr-name">{g.name}</div>
              <div className="rr-sub">{g.count} exception(s) · avg {g.avg}{g.crit > 0 ? ` · ${g.crit} critical` : ''}{g.high > 0 ? ` · ${g.high} high` : ''}</div>
              <div className="posture-bar" style={{ marginTop: 8 }}><span style={{ width: `${Math.round((g.total / max) * 100)}%`, background: TONE.blue }} /></div>
            </div>
            <div className="rr-total">{g.total}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Premium header */}
      <div className="dashboard-command-header risk-engine-header">
        <div>
          <div className="page-title">Risk Scoring Engine</div>
          <div className="page-sub">Explainable scoring model for prioritizing policy exception risk across assets, policies, controls, and CIA impact.</div>
          <div className="command-badges">
            <span className="cmd-badge cmd-badge-id">Workspace: {role}</span>
            <span className="cmd-badge cmd-badge-blue">Explainable Rule-Based Scoring</span>
            <span className="cmd-badge cmd-badge-live"><span className="live-dot" /> Live Demo Environment</span>
          </div>
        </div>
        <ViewSelector label="Risk View" value={view} onChange={setView} options={VIEWS} id="risk-view" />
      </div>

      {/* Summary metric cards */}
      <div className="risk-summary-grid">
        {metrics.map((m) => (
          <div className="risk-metric-card" key={m.label} style={{ borderTopColor: TONE[m.tone] }}>
            <div className="rk-value" style={{ color: TONE[m.tone] }}>{m.value}</div>
            <div className="rk-label">{m.label}</div>
            <div className="rk-help">{m.help}</div>
          </div>
        ))}
      </div>

      <div className="rec-banner">
        <Gauge className="rec-icon" size={22} />
        <div className="rec-banner-text">
          <strong>Risk Score = Exception Type + Asset Criticality + Duration + Expiry Status + Review Status + Owner Status − Compensating Control</strong>
          <span>Capped 0–100 · Low 0–30 · Medium 31–60 · High 61–80 · Critical 81–100</span>
        </div>
      </div>

      {/* ===== Scoring Formula ===== */}
      {view === 'formula' && (<>
        <div className="card card-pad formula-card">
          <div className="card-title" style={{ border: 'none' }}>Scoring Formula</div>
          <div className="formula-expr">
            Risk Score = <span className="fx">Type</span> + <span className="fx">Asset Criticality</span> + <span className="fx">Duration</span> + <span className="fx">Expiry</span> + <span className="fx">Review</span> + <span className="fx">Owner</span> − <span className="fx fx-neg">Compensating Control</span>
          </div>
          <p className="page-sub" style={{ marginTop: 8 }}>Every score is the sum of visible, rule-based factors — capped 0–100. No black-box model.</p>
        </div>

        <div className="formula-factor-grid">
          {FACTORS.map((f) => (
            <div className="card card-pad formula-factor-card" key={f.name}>
              <div className="ff-name">{f.name}</div>
              <div className="ff-desc">{f.desc}</div>
              <div className="ff-why"><strong>Why it matters:</strong> {f.why}</div>
              <div className="ff-ex">{f.ex}</div>
            </div>
          ))}
        </div>

        <div className="card card-pad" style={{ marginTop: 18 }}>
          <div className="card-title">Weight Reference (matches backend tables)</div>
          <div className="chart-grid" style={{ marginBottom: 0 }}>
            {TABLES.map((t) => (
              <div key={t.title}>
                <h4 style={{ fontSize: 15, marginBottom: 8, fontWeight: 800 }}>{t.title}</h4>
                {t.rows.map(([label, pts]) => (
                  <div className="breakdown-row" key={label} style={{ padding: '5px 0' }}>
                    <span className="breakdown-label">{label}</span>
                    <span className={`breakdown-points ${pts < 0 ? 'neg' : pts > 0 ? 'pos' : ''}`}>{pts > 0 ? '+' : ''}{pts}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </>)}

      {/* ===== Risk Bands ===== */}
      {view === 'bands' && (<>
        <div className="risk-band-grid">
          {RISK_BANDS.map((b) => {
            const color = RISK_COLORS[b.level];
            const count = rows.filter((e) => e.risk_level === b.level).length;
            const pct = Math.round((count / total) * 100);
            return (
              <div className="card card-pad risk-band-card" key={b.name} style={{ borderTopColor: color }}>
                <div className="rb-head"><span className="rb-name" style={{ color }}>{b.name}</span><span className="rb-range">{b.range}</span></div>
                <div className="rb-meaning">{b.meaning}</div>
                <div className="rb-handling">{b.handling}</div>
                <div className="posture-bar" style={{ marginTop: 12 }}><span style={{ width: `${pct}%`, background: color }} /></div>
                <div className="rb-count" style={{ color }}>{count} exception(s) · {pct}%</div>
              </div>
            );
          })}
        </div>
      </>)}

      {/* ===== Highest Risk Exceptions ===== */}
      {view === 'top' && (
        <div className="detail-grid">
          <div className="card card-pad">
            <div className="card-title">Exceptions Ranked by Risk</div>
            {rows.length === 0 ? <div className="risk-empty-state state-box">No risk records available for this category.</div> : (
              <div className="table-wrap" style={{ border: 'none' }}>
                <table className="data ranked-risk-table">
                  <thead>
                    <tr><th>#</th><th>ID</th><th>Type</th><th>Asset</th><th>Score</th><th>Level</th><th>CIA</th><th /></tr>
                  </thead>
                  <tbody>
                    {rows.map((e, i) => (
                      <tr key={e.id} className="row-clickable" onClick={() => setSelected(e)}
                        style={selected?.id === e.id ? { background: '#eef2ff' } : undefined}>
                        <td className="faint">{i + 1}</td>
                        <td className="mono">{e.id}</td>
                        <td>{e.exception_type}</td>
                        <td>{e.asset_name}</td>
                        <td>
                          <div className="risk-meter">
                            <div className="risk-bar"><span style={{ width: `${e.risk_score}%`, background: RISK_COLORS[e.risk_level] }} /></div>
                            <strong>{e.risk_score}</strong>
                          </div>
                        </td>
                        <td><RiskBadge level={e.risk_level} /></td>
                        <td><CIABadge impact={e.cia_impact} /></td>
                        <td><button className="btn btn-sm" onClick={(ev) => { ev.stopPropagation(); navigate(`/exceptions/${e.id}`); }}>Open</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="flex" style={{ flexDirection: 'column', gap: 18 }}>
            {selected && (
              <>
                <div className="card card-pad">
                  <div className="flex-between" style={{ marginBottom: 6 }}>
                    <div className="card-title" style={{ border: 'none', margin: 0, paddingBottom: 0 }}>{selected.id}</div>
                    <RiskBadge level={selected.risk_level} score={selected.risk_score} />
                  </div>
                  <div className="page-sub" style={{ marginBottom: 6 }}>{selected.policy_name} · {selected.asset_name} · {selected.business_unit}</div>
                  <div className="page-sub" style={{ marginBottom: 12 }}>Owner: {selected.owner_name || 'Unassigned'} · Expiry {formatDate(selected.expiry_date)} · {daysRemainingLabel(selected.days_remaining)}</div>
                  {selected.risk_breakdown?.map((b) => (
                    <div className="breakdown-row" key={b.key}>
                      <span className="breakdown-label">{b.label}</span>
                      <span className={`breakdown-points ${b.points < 0 ? 'neg' : b.points > 0 ? 'pos' : ''}`}>{b.points > 0 ? '+' : ''}{b.points}</span>
                    </div>
                  ))}
                  <div className="breakdown-row" style={{ borderTop: '2px solid var(--border)', marginTop: 6, paddingTop: 8 }}>
                    <span className="breakdown-label"><strong>Total (capped 0–100)</strong></span>
                    <span className="breakdown-points"><strong>{selected.risk_score}</strong></span>
                  </div>
                  {selected.recommendation?.text && <div className="page-sub" style={{ marginTop: 12 }}><strong>Recommended:</strong> {selected.recommendation.text}</div>}
                  <button className="btn btn-sm mt-16" onClick={() => navigate(`/exceptions/${selected.id}`)}>Open full details <ArrowRight size={13} /></button>
                </div>
                <div className="card card-pad">
                  <div className="card-title">Why this is risky</div>
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, fontSize: 15 }}>
                    {selected.risk_explanation?.map((line, i) => <li key={i}>{line}</li>)}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {view === 'by_bu' && <GroupCard title="Risk by Business Unit" sub="Accumulated risk score per business unit" data={groupBy((e) => e.business_unit)} />}
      {view === 'by_policy' && <GroupCard title="Risk by Policy" sub="Accumulated risk score per policy" data={groupBy((e) => e.policy_name)} />}

      {/* ===== CIA Impact View ===== */}
      {view === 'cia' && (<>
        <div className="explainer">CIA mapping helps translate technical exceptions into business security impact.</div>
        <div className="cia-impact-grid">
          {CIA_DIMS.map(({ dim, example }) => {
            const color = CIA_COLORS[dim] || '#7C3AED';
            const count = rows.filter((e) => e.cia_impact === dim).length;
            return (
              <div className="card card-pad cia-impact-card" key={dim} style={{ borderTopColor: color }}>
                <div className="flex-between" style={{ alignItems: 'center' }}>
                  <CIABadge impact={dim} />
                  <span className="cia-count" style={{ color }}>{count}</span>
                </div>
                <div className="cia-meaning">{CIA_MEANINGS[dim] || 'Affects more than one CIA dimension.'}</div>
                <div className="cia-example"><strong>Example:</strong> {example}</div>
              </div>
            );
          })}
        </div>
      </>)}

      {/* ===== Explainability Notes ===== */}
      {view === 'explain' && (
        <div className="card card-pad explainability-card">
          <div className="card-title">Why This Risk Engine Is Explainable</div>
          <ul className="explain-list">
            <li><strong>Rule-based, not black-box AI.</strong> Every score is a sum of defined factor weights.</li>
            <li><strong>Fully traceable.</strong> Each exception exposes its per-factor breakdown and a plain-language explanation.</li>
            <li><strong>Audit-friendly.</strong> Reviewers and auditors can reconstruct any score from visible factors and weights.</li>
            <li><strong>Consistent.</strong> The same inputs always produce the same score — no model drift.</li>
            <li><strong>AI-ready (future).</strong> The factor structure can later be tuned by an AI/analytics layer without becoming opaque — no AI is claimed today.</li>
          </ul>
          <div className="card-title" style={{ marginTop: 18 }}>Limitations</div>
          <ul className="explain-list">
            <li>Scoring is validated against the 600-record <strong>exception_registry.csv</strong> dataset (IT, Finance, HR, Operations, Sales, Security departments).</li>
            <li>Production would validate and calibrate weights against historical audit outcomes and risk-team input.</li>
            <li>Weights are fixed for this prototype; a real deployment would tune them per organisation and risk appetite.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
