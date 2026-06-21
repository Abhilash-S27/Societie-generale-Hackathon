import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { SEVERITY_COLORS } from '../utils/constants';
import { titleCase, formatDate } from '../utils/formatters';

const TYPE_ICONS = {
  overdue: 'AlarmClockOff',
  expiring_soon: 'Clock',
  orphaned_owner: 'UserX',
  review_overdue: 'CalendarClock',
  missing_control: 'ShieldOff',
  vague_justification: 'FileQuestion',
  critical_risk: 'Flame',
};

export default function AlertCard({ alert }) {
  const color = SEVERITY_COLORS[alert.severity] || '#64748b';
  const Icon = Icons[TYPE_ICONS[alert.type]] || Icons.AlertTriangle;
  return (
    <div className="alert-card" style={{ borderLeftColor: color }}>
      <div className="alert-card-icon" style={{ color }}>
        <Icon size={20} />
      </div>
      <div className="alert-card-main">
        <div className="alert-card-head">
          <span className="alert-card-type">{titleCase(alert.type)}</span>
          <span className="badge" style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}>
            {titleCase(alert.severity)}
          </span>
        </div>
        <div className="alert-card-reason">{alert.reason}</div>
        <div className="alert-card-meta">
          <Link to={`/exceptions/${alert.exception_id}`} className="link">{alert.exception_id}</Link>
          <span>· {alert.exception_type}</span>
          <span>· {alert.asset_name}</span>
          {alert.owner_name && <span>· Owner: {alert.owner_name}</span>}
        </div>
        <div className="alert-card-action">
          <Icons.ArrowRight size={14} /> {alert.recommended_action}
        </div>
      </div>
      <div className="alert-card-date">{formatDate(alert.created_date)}</div>
    </div>
  );
}
