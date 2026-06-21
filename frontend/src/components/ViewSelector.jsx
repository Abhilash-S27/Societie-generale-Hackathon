// Reusable dropdown view selector (shared enterprise pattern across pages).
// options: [{ key, label }]
export default function ViewSelector({ label = 'View', value, onChange, options, id = 'view-select' }) {
  return (
    <div className="dashboard-toolbar">
      <label className="dashboard-view-label" htmlFor={id}>{label}</label>
      <select id={id} className="dashboard-view-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </div>
  );
}
