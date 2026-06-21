import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, RefreshCw, LogIn, ArrowLeft, Check } from 'lucide-react';

// Demo users — role values MUST match the app's role-based navigation keys.
const DEMO_USERS = [
  { role: 'Requester', email: 'requester@riskwaiver360.demo', password: 'Requester@123', accent: 'blue' },
  { role: 'Security Reviewer', email: 'reviewer@riskwaiver360.demo', password: 'Reviewer@123', accent: 'cyan' },
  { role: 'Approver', email: 'approver@riskwaiver360.demo', password: 'Approver@123', accent: 'purple' },
  { role: 'Auditor/Admin', email: 'auditor@riskwaiver360.demo', password: 'Auditor@123', accent: 'emerald' },
];

const TRUST = [
  'Role-based workspace access',
  'Captcha-protected demo sign-in',
  'Audit and risk workflow simulation',
];

function rnd() { return Math.floor(Math.random() * 9) + 1; }

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState(() => ({ a: rnd(), b: rnd() }));
  const [captchaAns, setCaptchaAns] = useState('');
  const [error, setError] = useState('');

  // Prefill from a workspace card on Home (email + password only; never captcha).
  useEffect(() => {
    const role = location.state?.role;
    if (role) {
      const u = DEMO_USERS.find((x) => x.role === role);
      if (u) { setEmail(u.email); setPassword(u.password); }
    }
  }, [location.state]);

  function refreshCaptcha() { setCaptcha({ a: rnd(), b: rnd() }); setCaptchaAns(''); }

  function submit(e) {
    e.preventDefault();
    if (Number(captchaAns) !== captcha.a + captcha.b) {
      setError('Incorrect captcha answer. Please try again.');
      refreshCaptcha();
      return;
    }
    const user = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    if (!user) {
      setError('Invalid email, password, or captcha.');
      refreshCaptcha();
      return;
    }
    localStorage.setItem('rw_role', user.role);
    localStorage.setItem('rw_email', user.email);
    navigate('/dashboard');
  }

  function useAccount(u) { setEmail(u.email); setPassword(u.password); setError(''); }

  return (
    <div className="auth-shell">
      <div className="glow-orb orb-1" />
      <div className="glow-orb orb-2" />

      <div className="auth-top">
      {/* Left trust panel */}
      <aside className="auth-trust-panel">
        <div className="public-brand"><span className="public-brand-mark"><ShieldCheck size={20} /></span> RiskWaiver360</div>
        <h1 className="auth-trust-title">Sign in to RiskWaiver360</h1>
        <p className="auth-trust-desc">Authenticate with a demo account to enter your role workspace.</p>
        <ul className="auth-trust-list">
          {TRUST.map((t) => <li key={t}><Check size={16} /> {t}</li>)}
        </ul>
        <p className="auth-trust-note">
          Demo authentication only. Production would use SSO/OIDC, backend RBAC, secure sessions,
          and server-side authorization.
        </p>
        <button className="auth-back" onClick={() => navigate('/')}><ArrowLeft size={15} /> Back to Home</button>
      </aside>

      {/* Right auth content */}
      <main className="auth-main">
        <form className="auth-card" onSubmit={submit}>
          <h2 className="auth-card-title">Sign in</h2>
          <p className="auth-card-hint">Use a demo account below, or type credentials.</p>

          <div className="field">
            <label>Email</label>
            <input type="email" autoComplete="username" placeholder="you@riskwaiver360.demo"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" autoComplete="current-password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="field">
            <label>Captcha</label>
            <div className="captcha-row">
              <span className="captcha-q">{captcha.a} + {captcha.b} = ?</span>
              <input type="text" inputMode="numeric" placeholder="Answer" style={{ maxWidth: 130 }}
                value={captchaAns} onChange={(e) => setCaptchaAns(e.target.value)} />
              <button type="button" className="btn" onClick={refreshCaptcha} title="Refresh captcha"><RefreshCw size={15} /></button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn-cta btn-cta-primary" style={{ width: '100%', marginTop: 8 }}>
            <LogIn size={17} /> Login
          </button>
        </form>
      </main>
      </div>

      {/* Full-width demo accounts row */}
      <section className="auth-demo">
        <div className="auth-demo-title">Demo Accounts</div>
        <div className="auth-demo-grid">
          {DEMO_USERS.map((u) => (
            <div className={`auth-demo-card role-accent-${u.accent}`} key={u.role}>
              <div className="ad-role">{u.role}</div>
              <div className="ad-cred">{u.email}</div>
              <div className="ad-cred">{u.password}</div>
              <button type="button" className="ad-btn" onClick={() => useAccount(u)}>Use this account</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
