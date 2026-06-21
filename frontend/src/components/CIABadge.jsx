import { CIA_COLORS } from '../utils/constants';

// Small, clean CIA Triad impact badge. label: Confidentiality | Integrity | Availability | Multiple
export default function CIABadge({ impact }) {
  if (!impact) return <span className="faint">—</span>;
  const color = CIA_COLORS[impact] || '#64748b';
  const short = impact === 'Multiple' ? 'Multiple' : impact[0]; // C / I / A
  return (
    <span
      className="badge"
      title={`CIA impact: ${impact}`}
      style={{ background: `${color}14`, color, border: `1px solid ${color}40` }}
    >
      <span className="badge-dot" style={{ background: color }} />
      {impact === 'Multiple' ? 'Multiple' : `${short} · ${impact}`}
    </span>
  );
}
