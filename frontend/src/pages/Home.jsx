import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Activity, Gauge, ShieldHalf, ShieldAlert, FileCheck,
  FileBarChart2, UserPlus, Shield, Gavel, ClipboardList, LogIn, ArrowRight,
} from 'lucide-react';

const STRIP = [
  { icon: Activity, label: 'Continuous Monitoring' },
  { icon: Gauge, label: 'Risk Scoring' },
  { icon: ShieldHalf, label: 'CIA Impact' },
  { icon: ShieldAlert, label: 'GRC Intelligence' },
  { icon: FileCheck, label: 'Audit Evidence' },
];

const FEATURES = [
  { icon: Activity, title: 'Continuous Exception Monitoring',
    desc: 'Track active waivers, expiry windows, overdue reviews, and orphaned ownership before they become hidden risk.' },
  { icon: Gauge, title: 'Risk-Scored Waiver Portfolio',
    desc: 'Prioritize exceptions using risk level, asset criticality, CIA impact, missing controls, and conflict signals.' },
  { icon: FileBarChart2, title: 'Audit-Ready Evidence',
    desc: 'Preserve lifecycle history, reviewer comments, approver decisions, recommendations, and compliance mapping.' },
];

const METRICS = [
  { value: '100%', label: 'Exception Visibility' },
  { value: '95%+', label: 'Expiry Alert Accuracy' },
  { value: '1 hr', label: 'Audit Report Readiness' },
  { value: 'Risk-Scored', label: 'Waiver Portfolio' },
];

const WORKSPACES = [
  { role: 'Requester', icon: UserPlus, accent: 'blue', desc: 'Submit and track time-bound policy exception requests.' },
  { role: 'Security Reviewer', icon: Shield, accent: 'cyan', desc: 'Review justification, compensating controls, and risk context.' },
  { role: 'Approver', icon: Gavel, accent: 'purple', desc: 'Accept, reject, renew, revoke, or escalate policy waiver risk.' },
  { role: 'Auditor/Admin', icon: ClipboardList, accent: 'emerald', desc: 'View audit evidence, GRC findings, reports, and portfolio risk.' },
];

export default function Home() {
  const navigate = useNavigate();
  const signIn = (role) => navigate('/login', role ? { state: { role } } : undefined);

  return (
    <div className="public-shell">
      <div className="glow-orb orb-1" />
      <div className="glow-orb orb-2" />
      <div className="glow-orb orb-3" />

      <div className="public-inner">
        {/* Navbar */}
        <header className="public-nav">
          <div className="public-brand"><span className="public-brand-mark"><ShieldCheck size={20} /></span> RiskWaiver360</div>
          <nav className="public-nav-links">
            <a href="#value">Platform</a>
            <a href="#workspaces">Workspaces</a>
            <button className="public-nav-cta" onClick={() => signIn()}>Sign In</button>
          </nav>
        </header>

        {/* Hero */}
        <section className="public-hero">
          <span className="hero-badge">Enterprise GRC • Policy Waiver Governance</span>
          <h1 className="hero-title">RiskWaiver360</h1>
          <p className="hero-subtitle">Modern GRC Exception &amp; Policy Waiver Management Platform</p>
          <p className="hero-description">
            Centralize policy exceptions, monitor expiry risk, score waiver impact, detect GRC conflicts,
            and generate audit-ready evidence.
          </p>
          <div className="hero-actions">
            <button className="btn-cta btn-cta-primary" onClick={() => signIn()}><LogIn size={18} /> Sign In</button>
            <a href="#workspaces" className="btn-cta btn-cta-ghost">View Demo Roles</a>
          </div>

          <div className="feature-strip">
            {STRIP.map((s) => {
              const Icon = s.icon;
              return <div className="strip-item" key={s.label}><Icon size={18} /> <span>{s.label}</span></div>;
            })}
          </div>
        </section>

        {/* Value */}
        <section className="value-section" id="value">
          <h2 className="section-heading">Built for exception visibility, risk ownership, and audit readiness.</h2>
          <div className="value-grid">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div className="premium-feature-card" key={f.title}>
                  <div className="pf-icon"><Icon size={24} /></div>
                  <div className="pf-title">{f.title}</div>
                  <div className="pf-desc">{f.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Metrics */}
        <section className="metrics-section">
          <div className="metrics-grid">
            {METRICS.map((m) => (
              <div className="metric-glass-card" key={m.label}>
                <div className="metric-value">{m.value}</div>
                <div className="metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Workspaces */}
        <section className="workspace-section" id="workspaces">
          <h2 className="section-heading">Choose Your Workspace</h2>
          <p className="section-sub">Role-based demo workspaces for request, review, approval, and audit teams.</p>
          <div className="workspace-grid">
            {WORKSPACES.map((w) => {
              const Icon = w.icon;
              return (
                <div className={`workspace-card role-accent-${w.accent}`} key={w.role}>
                  <div className="ws-icon"><Icon size={22} /></div>
                  <div className="ws-name">{w.role}</div>
                  <div className="ws-desc">{w.desc}</div>
                  <button className="ws-btn" onClick={() => signIn(w.role)}>Sign in as this role <ArrowRight size={15} /></button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="cta-section">
          <div className="cta-card">
            <h2 className="cta-title">Ready to govern policy exceptions?</h2>
            <div className="hero-actions" style={{ justifyContent: 'center' }}>
              <button className="btn-cta btn-cta-primary" onClick={() => signIn()}><LogIn size={18} /> Sign In</button>
              <a href="#workspaces" className="btn-cta btn-cta-ghost">Explore Demo Workspaces</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
