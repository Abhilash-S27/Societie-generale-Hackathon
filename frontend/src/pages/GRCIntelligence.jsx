import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Table2, Search, X } from 'lucide-react';
import ViewSelector from '../components/ViewSelector.jsx';
import api from '../api/api';
import { SEVERITY_COLORS, CONFLICT_TYPE_LABELS } from '../utils/constants';
import { titleCase } from '../utils/formatters';

const VIEWS = [
  { key: 'all', label: 'All Findings' },
  { key: 'overlap', label: 'Overlaps' },
  { key: 'duplicate', label: 'Duplicates' },
  { key: 'conflicting_approval', label: 'Conflicting Approvals' },
  { key: 'accumulation', label: 'Accumulation Hotspots' },
  { key: 'critical', label: 'Critical Findings' },
  { key: 'remediation', label: 'Remediation Plan' },
];

const EXPLAIN = {
  overlap: 'Overlapping waivers may create duplicate or conflicting security gaps on the same asset, policy, or access path.',
  duplicate: 'Duplicate requests may indicate repeated bypasses, weak process control, or redundant approvals.',
  conflicting_approval: 'Conflicting approvals indicate governance inconsistency and create audit risk.',
  accumulation: 'Risk accumulation shows where many waivers combine into concentrated risk on a single asset, owner, policy, or business unit.',
  critical: 'High and critical severity findings with the greatest audit and security impact — remediate these first.',
};

const TONE = { danger: '#DC2626', warn: '#B45309', purple: '#7C3AED', blue: '#2563EB' };
const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'];

function Meta({ label, value }) {
  return (
    <div className="fmeta">
      <div className="fmeta-label">{label}</div>
      <div className="fmeta-value">{value}</div>
    </div>
  );
}

/* ── Card view ── */
function FindingCard({ f }) {
  const color = SEVERITY_COLORS[f.severity] || '#64748b';
  const isCrit = f.severity === 'critical' || f.severity === 'high';
  const title = (CONFLICT_TYPE_LABELS[f.type] || titleCase(f.type)) + (f.asset ? ` · ${f.asset}` : '');
  const first = f.related_exception_ids?.[0];
  return (
    <div className={`card card-pad finding-card ${isCrit ? 'finding-card-critical' : ''}`} style={{ borderLeftColor: color }}>
      <div className="finding-top">
        <span className="finding-type-chip">{CONFLICT_TYPE_LABELS[f.type] || titleCase(f.type)}</span>
        <span className="badge" style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}>{titleCase(f.severity)}</span>
      </div>
      <div className="finding-title">{title}</div>
      <p className="finding-reason">{f.reason}</p>
      <div className="finding-meta-grid">
        {f.asset && <Meta label="Asset / System" value={f.asset} />}
        {f.business_unit && <Meta label="Business Unit" value={f.business_unit} />}
        {f.policy_category && <Meta label="Policy / Control" value={f.policy_category} />}
        <Meta label="Related" value={`${f.related_exception_ids?.length || 0} exception(s)`} />
      </div>
      {f.related_exception_ids?.length > 0 && (
        <div className="finding-chips">
          {f.related_exception_ids.map((id) => (
            <Link key={id} to={`/exceptions/${id}`} className="related-exception-chip">{id}</Link>
          ))}
        </div>
      )}
      <div className="finding-action">→ {f.recommended_action}</div>
      {first && <Link className="btn btn-ghost btn-sm" to={`/exceptions/${first}`}>Open Details</Link>}
    </div>
  );
}

/* ── Table row ── */
function FindingRow({ f }) {
  const color = SEVERITY_COLORS[f.severity] || '#64748b';
  const first = f.related_exception_ids?.[0];
  const ids = f.related_exception_ids || [];
  const extra = ids.length - 3;
  return (
    <tr className="grc-tr">
      <td><span className="finding-type-chip">{CONFLICT_TYPE_LABELS[f.type] || titleCase(f.type)}</span></td>
      <td>
        <span className="badge" style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}>
          {titleCase(f.severity)}
        </span>
      </td>
      <td className="grc-td-asset">{f.asset || '—'}</td>
      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{f.business_unit || '—'}</td>
      <td className="grc-td-reason">{f.reason}</td>
      <td>
        <div className="grc-td-ids">
          {ids.slice(0, 3).map((id) => (
            <Link key={id} to={`/exceptions/${id}`} className="related-exception-chip" style={{ fontSize: 12, padding: '2px 8px' }}>{id}</Link>
          ))}
          {extra > 0 && <span className="faint" style={{ fontSize: 12, alignSelf: 'center' }}>+{extra}</span>}
        </div>
      </td>
      <td style={{ fontSize: 13, color: 'var(--text)', maxWidth: 200 }}>{f.recommended_action}</td>
      <td>{first && <Link className="btn btn-ghost btn-sm" to={`/exceptions/${first}`}>View</Link>}</td>
    </tr>
  );
}

/* ── Hotspot card ── */
function HotspotCard({ title, rows }) {
  const top = (rows || []).slice(0, 6);
  return (
    <div className="card card-pad">
      <div className="card-title">{title}</div>
      {top.length === 0 && <p className="faint">No data.</p>}
      {top.map((h) => (
        <div className="hotspot-row" key={h.name}>
          <div>
            <div className="hotspot-name">{h.name}</div>
            <div className="hotspot-sub">{h.count} exception(s) · avg {h.avg_risk} · {titleCase(h.level)} accumulation</div>
          </div>
          <div className="hotspot-val">{h.total_risk}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Filter + display-mode bar ── */
function FilterBar({ search, onSearch, severity, onSeverity, type, onType, showType, total, shown, displayMode, onDisplayMode }) {
  return (
    <div className="grc-filter-bar">
      <div className="grc-search-wrap">
        <Search size={15} className="grc-search-icon" />
        <input
          type="search"
          className="form-input grc-search"
          placeholder="Search asset, exception ID, reason…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        {search && (
          <button className="grc-search-clear" onClick={() => onSearch('')} title="Clear">
            <X size={14} />
          </button>
        )}
      </div>

      <select className="form-select grc-filter-select" value={severity} onChange={(e) => onSeverity(e.target.value)}>
        <option value="all">All Severities</option>
        {SEVERITY_ORDER.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
      </select>

      {showType && (
        <select className="form-select grc-filter-select" value={type} onChange={(e) => onType(e.target.value)}>
          <option value="all">All Types</option>
          {Object.entries(CONFLICT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      )}

      {shown !== total && (
        <span className="grc-filter-count">{shown} of {total} shown</span>
      )}

      <div className="grc-display-toggle">
        <button className={`gdt-btn${displayMode === 'cards' ? ' gdt-active' : ''}`} onClick={() => onDisplayMode('cards')} title="Card view">
          <LayoutGrid size={14} /> Cards
        </button>
        <button className={`gdt-btn${displayMode === 'table' ? ' gdt-active' : ''}`} onClick={() => onDisplayMode('table')} title="Table view">
          <Table2 size={14} /> Table
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Main page
══════════════════════════════════════════════════════ */
export default function GRCIntelligence() {
  const [data, setData] = useState(null);
  const [view, setView] = useState('all');
  const [displayMode, setDisplayMode] = useState('cards');
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const role = localStorage.getItem('rw_role') || 'system';

  useEffect(() => {
    api.getConflicts()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleViewChange(v) {
    setView(v);
    setSearch('');
    setFilterSeverity('all');
    setFilterType('all');
  }

  if (loading) return <div className="state-box"><div className="spinner" />Analyzing portfolio…</div>;
  if (error) return <div className="state-box">⚠️ {error}</div>;

  const { findings, accumulation, summary } = data;

  // Intelligence-view filter
  const viewFiltered = findings.filter((f) =>
    view === 'all' ? true :
    view === 'critical' ? (f.severity === 'critical' || f.severity === 'high') :
    f.type === view
  );

  // User filter bar
  const filteredFindings = viewFiltered.filter((f) => {
    if (filterSeverity !== 'all' && f.severity !== filterSeverity) return false;
    if (filterType !== 'all' && f.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        f.asset?.toLowerCase().includes(q) ||
        f.reason?.toLowerCase().includes(q) ||
        f.recommended_action?.toLowerCase().includes(q) ||
        f.business_unit?.toLowerCase().includes(q) ||
        f.policy_category?.toLowerCase().includes(q) ||
        (f.related_exception_ids || []).some((id) => id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const metrics = [
    { label: 'Total Findings', value: summary.total, help: 'All detected GRC patterns', tone: 'blue', view: 'all' },
    { label: 'Critical Findings', value: summary.critical, help: 'Highest audit & security impact', tone: 'danger', view: 'critical' },
    { label: 'Overlapping Exceptions', value: summary.overlaps, help: 'Same asset / policy gaps', tone: 'warn', view: 'overlap' },
    { label: 'Duplicate Waivers', value: summary.duplicates, help: 'Redundant or repeated bypasses', tone: 'warn', view: 'duplicate' },
    { label: 'Conflicting Approvals', value: summary.conflicting_approvals, help: 'Governance inconsistency', tone: 'danger', view: 'conflicting_approval' },
    { label: 'Accumulation Hotspots', value: summary.accumulation, help: 'Concentrated stacked risk', tone: 'purple', view: 'accumulation' },
  ];

  const byType = (t) => findings.filter((f) => f.type === t);
  const uniqIds = (arr) => [...new Set(arr.flatMap((f) => f.related_exception_ids || []))];
  const highAccum = (accumulation.by_asset || []).filter((h) => h.level === 'high' || h.level === 'critical');
  const controlFindings = findings.filter((f) => /control/i.test(f.recommended_action || ''));
  const critFindings = findings.filter((f) => f.severity === 'critical' || f.severity === 'high');
  const remediation = [
    { title: 'Address critical findings first', tone: 'danger', count: critFindings.length, detail: 'Prioritize critical / high severity findings for immediate remediation.', ids: uniqIds(critFindings) },
    { title: 'Review conflicting approvals', tone: 'danger', count: summary.conflicting_approvals, detail: 'Reconcile inconsistent approval decisions to restore governance integrity.', ids: uniqIds(byType('conflicting_approval')) },
    { title: 'Escalate high-risk accumulation', tone: 'purple', count: highAccum.length, detail: 'Escalate assets where stacked waivers concentrate risk.', names: highAccum.map((h) => h.name) },
    { title: 'Consolidate overlapping exceptions', tone: 'warn', count: summary.overlaps, detail: 'Merge overlapping waivers on the same asset / policy to remove duplicate gaps.', ids: uniqIds(byType('overlap')) },
    { title: 'Revoke duplicate waivers', tone: 'warn', count: summary.duplicates, detail: 'Close redundant duplicate requests and keep a single governed exception.', ids: uniqIds(byType('duplicate')) },
    { title: 'Add or strengthen compensating controls', tone: 'warn', count: controlFindings.length, detail: 'Findings whose recommended action calls for a stronger compensating control.', ids: uniqIds(controlFindings) },
  ].filter((r) => r.count > 0);

  const viewLabel = VIEWS.find((v) => v.key === view)?.label || 'Findings';
  const isFindingsView = view !== 'accumulation' && view !== 'remediation';

  return (
    <div>
      {/* Header */}
      <div className="dashboard-command-header grc-intelligence-header">
        <div>
          <div className="page-title">GRC Intelligence Center</div>
          <div className="page-sub">Detects overlapping waivers, duplicate exceptions, conflicting approvals, and risk accumulation before they become hidden attack paths.</div>
          <div className="command-badges">
            <span className="cmd-badge cmd-badge-id">Workspace: {role}</span>
            <span className="cmd-badge cmd-badge-blue">Intelligence Mode: Rule-Based Detection</span>
            <span className="cmd-badge cmd-badge-live"><span className="live-dot" /> Live Demo Environment</span>
          </div>
        </div>
        <ViewSelector label="Intelligence View" value={view} onChange={handleViewChange} options={VIEWS} id="grc-view" />
      </div>

      {/* Clickable metric cards */}
      <div className="intelligence-summary-grid">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`intelligence-metric-card${view === m.view ? ' im-active' : ''}`}
            style={{ borderTopColor: TONE[m.tone], cursor: 'pointer' }}
            onClick={() => handleViewChange(m.view)}
            title={`Filter: ${m.label}`}
          >
            <div className="im-value" style={{ color: TONE[m.tone] }}>{m.value}</div>
            <div className="im-label">{m.label}</div>
            <div className="im-help">{m.help}</div>
          </div>
        ))}
      </div>

      {/* ══ Findings (all / overlap / duplicate / conflicting_approval / critical) ══ */}
      {isFindingsView && (
        <>
          {EXPLAIN[view] && <div className="explainer">{EXPLAIN[view]}</div>}

          <div className="section-head">
            <h3>{viewLabel} ({viewFiltered.length})</h3>
            <span className="faint" style={{ fontSize: 14 }}>{summary.critical} critical · {summary.high} high overall</span>
          </div>

          <FilterBar
            search={search}
            onSearch={setSearch}
            severity={filterSeverity}
            onSeverity={setFilterSeverity}
            type={filterType}
            onType={setFilterType}
            showType={view === 'all'}
            total={viewFiltered.length}
            shown={filteredFindings.length}
            displayMode={displayMode}
            onDisplayMode={setDisplayMode}
          />

          {filteredFindings.length === 0 ? (
            <div className="intelligence-empty-state state-box">
              {viewFiltered.length === 0
                ? 'No findings detected for this category.'
                : 'No findings match the current filters — try clearing the search or adjusting the severity filter.'}
            </div>
          ) : displayMode === 'cards' ? (
            <div className="findings-grid">
              {filteredFindings.map((f) => <FindingCard key={f.conflict_id} f={f} />)}
            </div>
          ) : (
            <div className="grc-table-wrap">
              <table className="grc-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Asset / System</th>
                    <th>Business Unit</th>
                    <th>Reason</th>
                    <th>Exception IDs</th>
                    <th>Recommended Action</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFindings.map((f) => <FindingRow key={f.conflict_id} f={f} />)}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══ Accumulation Hotspots ══ */}
      {view === 'accumulation' && (
        <>
          <div className="explainer">{EXPLAIN.accumulation}</div>
          <div className="section-head">
            <h3>Top Accumulation Hotspots (by Asset)</h3>
            <span className="faint" style={{ fontSize: 14 }}>Ranked by combined risk</span>
          </div>
          {(accumulation.by_asset || []).length === 0
            ? <div className="intelligence-empty-state state-box">No findings detected for this category.</div>
            : (accumulation.by_asset).slice(0, 8).map((h, i) => (
              <div className="hotspot-rank-card" key={h.name}>
                <div className="hrc-rank">#{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div className="hrc-name">{h.name}</div>
                  <div className="hrc-sub">{h.count} exception(s) · avg risk {h.avg_risk} · <strong>{titleCase(h.level)}</strong> accumulation</div>
                  <div className="hrc-action">→ {h.level === 'high' || h.level === 'critical' ? 'Escalate and consolidate stacked waivers on this asset.' : 'Monitor combined risk and review on next cycle.'}</div>
                </div>
                <div className="hrc-val">{h.total_risk}</div>
              </div>
            ))}
          <div className="section-head" style={{ marginTop: 22 }}>
            <h3>Accumulation by Owner, Policy &amp; Business Unit</h3>
          </div>
          <div className="report-two">
            <HotspotCard title="By Owner" rows={accumulation.by_owner} />
            <HotspotCard title="By Policy Category" rows={accumulation.by_policy_category} />
            <HotspotCard title="By Business Unit" rows={accumulation.by_business_unit} />
          </div>
        </>
      )}

      {/* ══ Remediation Plan ══ */}
      {view === 'remediation' && (
        <>
          <div className="explainer">Prioritized remediation actions generated from the current findings and accumulation hotspots.</div>
          {remediation.length === 0
            ? <div className="intelligence-empty-state state-box">No remediation actions required — no findings detected.</div>
            : remediation.map((r) => (
              <div className="remediation-plan-card" key={r.title} style={{ borderLeftColor: TONE[r.tone] }}>
                <div className="rp-count" style={{ color: TONE[r.tone] }}>{r.count}</div>
                <div style={{ flex: 1 }}>
                  <div className="rp-title">{r.title}</div>
                  <div className="rp-detail">{r.detail}</div>
                  {r.ids?.length > 0 && (
                    <div className="rp-ids">
                      {r.ids.slice(0, 12).map((id) => (
                        <Link key={id} to={`/exceptions/${id}`} className="related-exception-chip">{id}</Link>
                      ))}
                    </div>
                  )}
                  {r.names?.length > 0 && (
                    <div className="rp-detail" style={{ marginTop: 6 }}>Assets: {r.names.join(', ')}</div>
                  )}
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
