import { STATUS_COLORS } from '../utils/constants';
import { titleCase } from '../utils/formatters';

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#64748b';
  return (
    <span className="badge" style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}>
      {titleCase(status)}
    </span>
  );
}
