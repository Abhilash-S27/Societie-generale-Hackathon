import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, UserCircle2, Lock } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem('rw_role') || 'Guest';
  const email = localStorage.getItem('rw_email');

  function logout() {
    localStorage.removeItem('rw_role');
    localStorage.removeItem('rw_email');
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo"><ShieldCheck size={22} /></div>
        <div>
          <div className="navbar-title">RiskWaiver360</div>
          <div className="navbar-subtitle">GRC Exception &amp; Policy Waiver Management</div>
        </div>
      </div>

      <div className="navbar-center">
        <span className="navbar-secure-badge">
          <Lock size={11} />
          Secure Workspace
        </span>
        <span className="navbar-live-badge">
          <span className="navbar-live-dot" />
          Live Demo Environment
        </span>
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          <UserCircle2 size={17} />
          <span>{email ? <>{email} &middot; </> : ''}<strong>{role}</strong></span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </header>
  );
}
