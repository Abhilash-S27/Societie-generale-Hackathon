import { RISK_COLORS } from '../utils/constants';

export default function RiskBadge({ level, score }) {
  const color = RISK_COLORS[level] || '#64748b';
  return (
    <span className="badge" style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}>
      <span className="badge-dot" style={{ background: color }} />
      {level}
      {score != null && <strong style={{ marginLeft: 4 }}>{score}</strong>}
    </span>
  );
}
