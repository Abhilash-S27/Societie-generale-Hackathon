import * as Icons from 'lucide-react';

export default function StatCard({ label, value, icon, tone = 'default', hint }) {
  const Icon = Icons[icon] || Icons.Activity;
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-card-icon">
        <Icon size={20} />
      </div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
        {hint && <div className="stat-card-hint">{hint}</div>}
      </div>
    </div>
  );
}
