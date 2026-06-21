import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function AccessLimited() {
  const navigate = useNavigate();
  const role = localStorage.getItem('rw_role') || 'this role';
  return (
    <div className="state-box" style={{ maxWidth: 520, margin: '60px auto' }}>
      <div className="center" style={{ marginBottom: 14 }}>
        <div className="navbar-logo" style={{ background: 'rgba(185,28,28,0.12)', color: 'var(--red)' }}>
          <Lock size={22} />
        </div>
      </div>
      <h3 style={{ marginBottom: 8 }}>Access limited for this demo role</h3>
      <p className="muted" style={{ marginBottom: 18 }}>
        Your current role (<strong>{role}</strong>) does not have access to this page.
        Please switch role from the login screen.
      </p>
      <div className="center gap-8">
        <button className="btn" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        <button className="btn btn-primary" onClick={() => { localStorage.removeItem('rw_role'); navigate('/login'); }}>
          Switch Role
        </button>
      </div>
    </div>
  );
}
