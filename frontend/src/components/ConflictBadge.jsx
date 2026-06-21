import { CONFLICT_COLORS } from '../utils/constants';

// label: 'Clean' | 'Overlap' | 'Duplicate' | 'Conflict' | 'Accumulation'
export default function ConflictBadge({ label = 'Clean' }) {
  const color = CONFLICT_COLORS[label] || '#64748b';
  return (
    <span className="badge" style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}>
      <span className="badge-dot" style={{ background: color }} />
      {label}
    </span>
  );
}
