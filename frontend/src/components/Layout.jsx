import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import AccessLimited from './AccessLimited.jsx';
import { isPathAllowed } from '../utils/constants';

export default function Layout() {
  const location = useLocation();
  const role = localStorage.getItem('rw_role');
  const allowed = isPathAllowed(role, location.pathname);

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          {allowed ? <Outlet /> : <AccessLimited />}
        </main>
      </div>
    </div>
  );
}
