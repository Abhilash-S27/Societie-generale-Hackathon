import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListChecks, PlusCircle, Inbox, Gauge, ShieldAlert, Bell,
  FileBarChart2, Settings as SettingsIcon, FileText, LogOut, Shield,
} from 'lucide-react';
import { ROLE_NAV } from '../utils/constants';

const NAV_ITEMS = {
  '/dashboard': { label: 'Dashboard', icon: LayoutDashboard },
  '/my-requests': { label: 'My Requests', icon: FileText },
  '/registry': { label: 'Exception Registry', icon: ListChecks },
  '/add': { label: 'Add Exception', icon: PlusCircle },
  '/review': { label: 'Review Queue', icon: Inbox },
  '/risk-scoring': { label: 'Risk Scoring', icon: Gauge },
  '/grc-intelligence': { label: 'GRC Intelligence', icon: ShieldAlert },
  '/alerts': { label: 'Alerts', icon: Bell },
  '/audit': { label: 'Audit Report', icon: FileBarChart2 },
  '/settings': { label: 'Settings', icon: SettingsIcon },
};

const ROLE_COLORS = {
  Admin: { accent: '#DC2626', bg: 'rgba(220,38,38,0.12)', border: 'rgba(220,38,38,0.22)', text: '#fca5a5' },
  'Security Reviewer': { accent: '#EF4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.20)', text: '#fca5a5' },
  Requester: { accent: '#7C3AED', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.22)', text: '#c4b5fd' },
  Auditor: { accent: '#16A34A', bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.22)', text: '#86efac' },
};

export default function Sidebar() {
  const navigate = useNavigate();
  const role = localStorage.getItem('rw_role');
  const paths = ROLE_NAV[role] || Object.keys(NAV_ITEMS);
  const roleStyle = ROLE_COLORS[role] || ROLE_COLORS.Admin;

  function logout() {
    localStorage.removeItem('rw_role');
    localStorage.removeItem('rw_email');
    navigate('/');
  }

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {role && (
          <div
            className="sidebar-role-badge"
            style={{
              background: roleStyle.bg,
              border: `1px solid ${roleStyle.border}`,
            }}
          >
            <div className="sidebar-role-name" style={{ color: roleStyle.text }}>
              {role}
            </div>
            <div className="sidebar-role-sub">Active Workspace</div>
          </div>
        )}

        {paths.filter((p) => NAV_ITEMS[p]).map((p) => {
          const { label, icon: Icon } = NAV_ITEMS[p];
          return (
            <NavLink key={p} to={p} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          );
        })}

        <div className="sidebar-divider" />
        <button className="sidebar-link sidebar-logout" onClick={logout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-tagline">
          Risk Intelligence · Control Monitoring<br />
          Exception Governance · Audit Evidence
        </div>
      </div>
    </aside>
  );
}
