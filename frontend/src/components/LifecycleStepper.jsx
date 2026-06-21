import { titleCase } from '../utils/formatters';

// Visual lifecycle stepper: Submitted → Under Review → Approved → Active → Outcome.
const STEPS = ['Submitted', 'Under Review', 'Approved', 'Active'];
const TERMINAL = ['revoked', 'rejected', 'closed', 'escalated'];

function stepIndex(status) {
  if (['draft', 'submitted'].includes(status)) return 0;
  if (['under_review', 'pending_approval'].includes(status)) return 1;
  if (status === 'approved') return 2;
  if (['active', 'expiring_soon', 'overdue', 'renewed', 'renewal_requested'].includes(status)) return 3;
  if (TERMINAL.includes(status)) return 4;
  return 0;
}

export default function LifecycleStepper({ status }) {
  const current = stepIndex(status);
  const outcomeLabel = TERMINAL.includes(status) ? titleCase(status) : 'Renew / Revoke / Escalate';
  const nodes = [...STEPS, outcomeLabel];

  return (
    <div className="stepper">
      {nodes.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <div className={`stepper-node ${state}`} key={label}>
            <div className="stepper-dot">{i < current ? '✓' : i + 1}</div>
            <div className="stepper-label">{label}</div>
            {i < nodes.length - 1 && <div className="stepper-line" />}
          </div>
        );
      })}
    </div>
  );
}
