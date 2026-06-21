import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, FileSpreadsheet, X, Table2, LayoutGrid } from 'lucide-react';
import api from '../api/api';
import RiskBadge from '../components/RiskBadge.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ConflictBadge from '../components/ConflictBadge.jsx';
import CIABadge from '../components/CIABadge.jsx';
import ViewSelector from '../components/ViewSelector.jsx';
import { RISK_COLORS, STATUS_GROUPS, isPathAllowed } from '../utils/constants';
import { formatDate, daysRemainingLabel } from '../utils/formatters';
import { parseCSVToObjects } from '../utils/csv';

const PREVIEW_COLS = ['exception_id', 'requester_name', 'exception_type', 'department', 'status', 'risk_level', 'expiry_date', 'owner_name'];

// Human-readable labels for backend status values
const STATUS_LABELS = {
  active:             'Active',
  expiring_soon:      'Expiring Soon',
  overdue:            'Overdue',
  pending_approval:   'Pending Approval',
  under_review:       'Under Review',
  submitted:          'Submitted',
  approved:           'Approved',
  renewal_requested:  'Renewal Requested',
  renewed:            'Renewed',
  escalated:          'Escalated',
  revoked:            'Revoked',
  rejected:           'Rejected',
  closed:             'Closed',
  draft:              'Draft',
};

const VIEWS = [
  { key: 'all', label: 'All Exceptions' },
  { key: 'crit_high', label: 'Critical & High Risk' },
  { key: 'expiring_overdue', label: 'Expiring / Overdue' },
  { key: 'pending', label: 'Pending Review' },
  { key: 'orphaned', label: 'Orphaned Owners' },
  { key: 'conflicts', label: 'Conflict Findings' },
  { key: 'recent', label: 'Recently Updated' },
];

const TONE = { blue: '#2563EB', danger: '#DC2626', success: '#16A34A', warn: '#B45309', purple: '#7C3AED' };

const EMPTY_FILTERS = { q: '', risk_level: '', status: '', business_unit: '', policy_category: '', owner: '', has_conflicts: false, orphaned: false };

function ExpiryCell({ e }) {
  const overdue = e.days_remaining < 0;
  const soon = !overdue && (e.status === 'expiring_soon' || (e.days_remaining >= 0 && e.days_remaining <= 30));
  const cls = overdue ? 'exp-overdue' : soon ? 'exp-soon' : 'exp-ok';
  return (
    <div className={`expiry-indicator ${cls}`}>
      <span className="exp-date">{formatDate(e.expiry_date)}</span>
      <span className="exp-rem">{daysRemainingLabel(e.days_remaining)}</span>
    </div>
  );
}

export default function ExceptionRegistry({
  title = 'Exception Risk Register',
  subtitle = 'Central inventory of active, pending, expired, and high-risk policy waivers across assets, owners, and business units.',
} = {}) {
  const [rows, setRows] = useState([]);
  const [lookups, setLookups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [view, setView] = useState('all');
  const [layout, setLayout] = useState('table');
  const [toast, setToast] = useState(null);

  // CSV import state
  const [importRows, setImportRows] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const role = localStorage.getItem('rw_role') || 'system';
  const canAdd = isPathAllowed(role, '/add');

  function load() {
    setLoading(true);
    Promise.all([api.getExceptions(), api.getLookups()])
      .then(([ex, lk]) => { setRows(ex); setLookups(lk); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function flash(type, msg) { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); }
  function set(k, v) { setFilters((f) => ({ ...f, [k]: v })); }
  function clearFilters() { setFilters(EMPTY_FILTERS); }

  const sb = (e) => e.base_status || e.status;

  // Advanced filters (search + selects).
  const filtered = useMemo(() => {
    return rows.filter((e) => {
      const q = filters.q.toLowerCase();
      const matchQ = !q || [e.id, e.exception_type, e.asset_name, e.owner_name, e.policy_name, e.requester_name, e.business_unit, e.approver_name]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      return matchQ
        && (!filters.risk_level || e.risk_level === filters.risk_level)
        && (!filters.status || e.status === filters.status)
        && (!filters.business_unit || e.business_unit === filters.business_unit)
        && (!filters.policy_category || e.policy_category === filters.policy_category)
        && (!filters.owner || e.owner_name === filters.owner)
        && (!filters.has_conflicts || (e.conflict_flag && e.conflict_flag !== 'Clean'))
        && (!filters.orphaned || e.orphaned);
    });
  }, [rows, filters]);

  // Registry View on top of advanced filters.
  const viewRows = useMemo(() => {
    const match = (e) => {
      switch (view) {
        case 'crit_high': return e.risk_level === 'Critical' || e.risk_level === 'High';
        case 'expiring_overdue': return e.status === 'overdue' || e.status === 'expiring_soon';
        case 'pending': return STATUS_GROUPS.pending.includes(sb(e));
        case 'orphaned': return e.orphaned;
        case 'conflicts': return e.conflict_flag && e.conflict_flag !== 'Clean';
        default: return true;
      }
    };
    let list = filtered.filter(match);
    if (view === 'recent') {
      list = [...list].sort((a, b) =>
        new Date(b.updated_at || b.last_reviewed_at || b.start_date || 0) - new Date(a.updated_at || a.last_reviewed_at || a.start_date || 0));
    }
    return list;
  }, [filtered, view]);

  const owners = useMemo(() => [...new Set(rows.map((r) => r.owner_name).filter(Boolean))].sort(), [rows]);

  // Summary metrics computed from all rows.
  const reg = {
    total: rows.length,
    critHigh: rows.filter((e) => e.risk_level === 'Critical' || e.risk_level === 'High').length,
    active: rows.filter((e) => STATUS_GROUPS.active.includes(sb(e))).length,
    pending: rows.filter((e) => STATUS_GROUPS.pending.includes(sb(e))).length,
    overdue: rows.filter((e) => e.status === 'overdue').length,
    expiring: rows.filter((e) => e.status === 'expiring_soon').length,
    orphaned: rows.filter((e) => e.orphaned).length,
    conflicts: rows.filter((e) => e.conflict_flag && e.conflict_flag !== 'Clean').length,
  };
  const metrics = [
    { label: 'Total Exceptions', value: reg.total, help: 'All records in register', tone: 'blue', view: 'all' },
    { label: 'Critical / High Risk', value: reg.critHigh, help: 'Elevated risk waivers', tone: 'danger', view: 'crit_high' },
    { label: 'Active Exceptions', value: reg.active, help: 'Approved & in force', tone: 'success', view: 'all' },
    { label: 'Pending Review', value: reg.pending, help: 'Awaiting review / approval', tone: 'warn', view: 'pending' },
    { label: 'Overdue / Expired', value: reg.overdue, help: 'Past expiry or review', tone: 'danger', view: 'expiring_overdue' },
    { label: 'Expiring Soon', value: reg.expiring, help: 'Approaching expiry', tone: 'warn', view: 'expiring_overdue' },
    { label: 'Orphaned Owners', value: reg.orphaned, help: 'No active owner', tone: 'purple', view: 'orphaned' },
    { label: 'Conflict Findings', value: reg.conflicts, help: 'GRC conflict signals', tone: 'purple', view: 'conflicts' },
  ];

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCSVToObjects(reader.result);
        if (!parsed.length) { flash('error', 'No data rows found in CSV.'); return; }
        setImportSummary(null);
        setImportRows(parsed);
      } catch {
        flash('error', 'Could not parse CSV file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function confirmImport() {
    setImporting(true);
    try {
      const summary = await api.bulkImport(importRows);
      setImportSummary(summary);
      setImportRows(null);
      flash('success', `Imported ${summary.success}/${summary.total} rows.`);
      load();
    } catch (err) {
      flash('error', err.response?.data?.error || err.message);
    } finally {
      setImporting(false);
    }
  }

  if (loading) return <div className="state-box"><div className="spinner" />Loading registry…</div>;
  if (error) return <div className="state-box">⚠️ {error}</div>;

  return (
    <div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* Premium header */}
      <div className="dashboard-command-header registry-header">
        <div>
          <div className="page-title">{title}</div>
          <div className="page-sub">{subtitle}</div>
          <div className="command-badges">
            <span className="cmd-badge cmd-badge-id">Workspace: {role}</span>
            <span className="cmd-badge cmd-badge-blue">{reg.total} records</span>
            <span className="cmd-badge cmd-badge-live"><span className="live-dot" /> Live Demo Environment</span>
          </div>
        </div>
        <div className="flex" style={{ flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
          <div className="workspace-actions">
            <button className="btn" onClick={() => api.downloadCsv('csv-template')}><FileSpreadsheet size={15} /> Template</button>
            <button className="btn" onClick={() => api.downloadCsv('export-csv')}><Download size={15} /> Export CSV</button>
            <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={15} /> Import CSV</button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={onFile} />
            {canAdd && <button className="btn btn-primary" onClick={() => navigate('/add')}>+ Add Exception</button>}
          </div>
          <ViewSelector label="Registry View" value={view} onChange={setView} options={VIEWS} id="registry-view" />
        </div>
      </div>

      {/* Summary metric cards */}
      <div className="registry-summary-grid">
        {metrics.map((m) => (
          <button className="registry-metric-card" key={m.label} style={{ borderTopColor: TONE[m.tone] }} onClick={() => setView(m.view)}>
            <div className="rm-value" style={{ color: TONE[m.tone] }}>{m.value}</div>
            <div className="rm-label">{m.label}</div>
            <div className="rm-help">{m.help}</div>
          </button>
        ))}
      </div>

      {/* CSV import preview */}
      {importRows && (
        <div className="card card-pad" style={{ marginBottom: 16, borderColor: 'var(--brand-light)' }}>
          <div className="flex-between">
            <div className="card-title" style={{ border: 'none', margin: 0, paddingBottom: 0 }}>Preview Import · {importRows.length} row(s)</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setImportRows(null)}><X size={14} /></button>
          </div>
          <div className="table-wrap mt-8" style={{ border: 'none', maxHeight: 280, overflowY: 'auto' }}>
            <table className="data">
              <thead><tr><th>#</th>{PREVIEW_COLS.map((c) => <th key={c}>{c.replace(/_/g, ' ')}</th>)}</tr></thead>
              <tbody>
                {importRows.slice(0, 20).map((r, i) => (
                  <tr key={i}>
                    <td className="faint">{i + 1}</td>
                    {PREVIEW_COLS.map((c) => <td key={c}>{r[c] || <span className="faint">—</span>}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {importRows.length > 20 && <div className="faint mt-8" style={{ fontSize: 12 }}>Showing first 20 of {importRows.length} rows.</div>}
          <div className="action-bar mt-16">
            <button className="btn btn-primary" disabled={importing} onClick={confirmImport}>
              {importing ? 'Importing…' : `Confirm Import (${importRows.length})`}
            </button>
            <button className="btn" onClick={() => setImportRows(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Import summary */}
      {importSummary && (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="flex-between">
            <div className="card-title" style={{ border: 'none', margin: 0, paddingBottom: 0 }}>Import Summary</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setImportSummary(null)}><X size={14} /></button>
          </div>
          <div className="flex gap-16 wrap mt-8">
            <div><strong style={{ fontSize: 20 }}>{importSummary.total}</strong><div className="faint">Total rows</div></div>
            <div><strong style={{ fontSize: 20, color: 'var(--green)' }}>{importSummary.success}</strong><div className="faint">Imported</div></div>
            <div><strong style={{ fontSize: 20, color: 'var(--red)' }}>{importSummary.failed}</strong><div className="faint">Failed</div></div>
            <div><strong style={{ fontSize: 20 }}>{importSummary.created_ids.length}</strong><div className="faint">New IDs</div></div>
          </div>
          {importSummary.warnings?.some((w) => w.messages.length) && (
            <div className="mt-16">
              <div className="faint" style={{ fontSize: 12, marginBottom: 6 }}>Row notes</div>
              <div className="table-wrap" style={{ border: 'none', maxHeight: 200, overflowY: 'auto' }}>
                <table className="data">
                  <thead><tr><th>Row</th><th>Level</th><th>ID</th><th>Notes</th></tr></thead>
                  <tbody>
                    {importSummary.warnings.filter((w) => w.messages.length).map((w, i) => (
                      <tr key={i}>
                        <td>{w.row}</td>
                        <td style={{ color: w.level === 'error' ? 'var(--red)' : 'var(--amber)', fontWeight: 700 }}>{w.level}</td>
                        <td className="mono">{w.id || '—'}</td>
                        <td>{w.messages.join('; ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Console */}
      <div className="card card-pad registry-filter-console">
        <div className="flex-between wrap" style={{ marginBottom: 12, alignItems: 'center' }}>
          <div className="card-title" style={{ border: 'none', margin: 0, paddingBottom: 0 }}>Filter Console</div>
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}><X size={14} /> Clear Filters</button>
        </div>
        <div className="filters" style={{ margin: 0 }}>
          <div className="field search">
            <label>Search</label>
            <input placeholder="ID, type, asset, owner, department, requester…" value={filters.q} onChange={(e) => set('q', e.target.value)} />
          </div>
          <div className="field">
            <label>Risk Level</label>
            <select value={filters.risk_level} onChange={(e) => set('risk_level', e.target.value)}>
              <option value="">All</option>
              {Object.keys(RISK_COLORS).map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={filters.status} onChange={(e) => set('status', e.target.value)}>
              <option value="">All</option>
              {lookups.statuses.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Department</label>
            <select value={filters.business_unit} onChange={(e) => set('business_unit', e.target.value)}>
              <option value="">All</option>
              {lookups.business_units.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Owner</label>
            <select value={filters.owner} onChange={(e) => set('owner', e.target.value)}>
              <option value="">All</option>
              {owners.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Policy Category</label>
            <select value={filters.policy_category} onChange={(e) => set('policy_category', e.target.value)}>
              <option value="">All</option>
              {lookups.policy_categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field" style={{ minWidth: 150 }}>
            <label>Conflicts</label>
            <label className="flex gap-8" style={{ alignItems: 'center', height: 38, fontWeight: 600, fontSize: 15 }}>
              <input type="checkbox" style={{ width: 16 }} checked={filters.has_conflicts} onChange={(e) => set('has_conflicts', e.target.checked)} />
              Has conflicts
            </label>
          </div>
        </div>
      </div>

      {/* Toolbar: count + layout toggle */}
      <div className="registry-toolbar">
        <span className="faint" style={{ fontSize: 15 }}>{viewRows.length} of {rows.length} exceptions shown</span>
        <div className="layout-toggle">
          <button className={`lt-btn${layout === 'table' ? ' active' : ''}`} onClick={() => setLayout('table')}><Table2 size={15} /> Table</button>
          <button className={`lt-btn${layout === 'card' ? ' active' : ''}`} onClick={() => setLayout('card')}><LayoutGrid size={15} /> Cards</button>
        </div>
      </div>

      {/* Empty state */}
      {viewRows.length === 0 && (
        <div className="card registry-empty-state state-box">No exceptions match the selected filters.</div>
      )}

      {/* Table view */}
      {viewRows.length > 0 && layout === 'table' && (
        <div className="card registry-table-card">
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="data risk-register-table">
              <thead>
                <tr>
                  <th>ID</th><th>Policy / Type</th><th>Asset / System</th><th>Department</th>
                  <th>Owner</th><th>Risk</th><th>Status</th><th>CIA</th><th>Conflict</th><th>Expiry</th><th />
                </tr>
              </thead>
              <tbody>
                {viewRows.map((e) => (
                  <tr key={e.id} className="row-clickable" onClick={() => navigate(`/exceptions/${e.id}`)}>
                    <td className="mono rr-id">{e.id}</td>
                    <td><strong>{e.policy_name}</strong><div className="faint" style={{ fontSize: 13 }}>{e.exception_type}</div></td>
                    <td>{e.asset_name}</td>
                    <td>{e.business_unit}</td>
                    <td>{e.owner_name || <span className="faint">Unassigned</span>}</td>
                    <td><RiskBadge level={e.risk_level} score={e.risk_score} /></td>
                    <td><StatusBadge status={e.status} /></td>
                    <td><CIABadge impact={e.cia_impact} /></td>
                    <td><ConflictBadge label={e.conflict_flag} /></td>
                    <td><ExpiryCell e={e} /></td>
                    <td><button className="btn btn-sm" onClick={(ev) => { ev.stopPropagation(); navigate(`/exceptions/${e.id}`); }}>Open Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Card view */}
      {viewRows.length > 0 && layout === 'card' && (
        <div className="registry-card-grid">
          {viewRows.map((e) => (
            <div className="registry-risk-card" key={e.id} onClick={() => navigate(`/exceptions/${e.id}`)}>
              <div className="rrc-top">
                <span className="mono rr-id">{e.id}</span>
                <RiskBadge level={e.risk_level} score={e.risk_score} />
              </div>
              <div className="rrc-title">{e.policy_name}</div>
              <div className="rrc-sub">{e.exception_type} · {e.asset_name}</div>
              <div className="rrc-sub">{e.business_unit} · Owner: {e.owner_name || 'Unassigned'}</div>
              <div className="rrc-badges">
                <StatusBadge status={e.status} />
                <CIABadge impact={e.cia_impact} />
                <ConflictBadge label={e.conflict_flag} />
              </div>
              <div className="rrc-foot">
                <ExpiryCell e={e} />
                <button className="btn btn-sm" onClick={(ev) => { ev.stopPropagation(); navigate(`/exceptions/${e.id}`); }}>Open Details</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
