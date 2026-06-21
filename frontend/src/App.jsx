import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ExceptionRegistry from './pages/ExceptionRegistry.jsx';
import AddException from './pages/AddException.jsx';
import ExceptionDetails from './pages/ExceptionDetails.jsx';
import ReviewQueue from './pages/ReviewQueue.jsx';
import RiskScoring from './pages/RiskScoring.jsx';
import GRCIntelligence from './pages/GRCIntelligence.jsx';
import Alerts from './pages/Alerts.jsx';
import AuditReport from './pages/AuditReport.jsx';
import Settings from './pages/Settings.jsx';

function getRole() {
  return localStorage.getItem('rw_role');
}

function RequireAuth({ children }) {
  const location = useLocation();
  if (!getRole()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signin" element={<Navigate to="/login" replace />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/registry" element={<ExceptionRegistry />} />
        <Route path="/my-requests" element={<ExceptionRegistry title="My Requests" subtitle="Demo mode: My Requests uses shared registry data because user identity is simulated." />} />
        <Route path="/add" element={<AddException />} />
        <Route path="/exceptions/:id" element={<ExceptionDetails />} />
        <Route path="/review" element={<ReviewQueue />} />
        <Route path="/risk-scoring" element={<RiskScoring />} />
        <Route path="/grc-intelligence" element={<GRCIntelligence />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/audit" element={<AuditReport />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
