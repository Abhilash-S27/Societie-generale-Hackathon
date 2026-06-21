# RiskWaiver360 — Modern Cybersecurity & GRC Concepts and Market Alignment

This document maps RiskWaiver360 to the modern cybersecurity / GRC concepts most relevant to
**PS1: GRC Process Exception & Policy Waiver Management**, and is the source-of-truth artifact
for the "Modern Cybersecurity & GRC Concepts Covered" section in the README.

> The current prototype is **rule-based and explainable** (not AI-powered). AI items below are
> clearly marked as future scope.

---

## Concept Coverage Gap Analysis

| Concept | Present? | Where found | Gap | Improvement made |
|---------|----------|-------------|-----|------------------|
| GRC Risk Intelligence | **Yes** | README Solution Overview + positioning line; dashboard; risk engine | Term now named explicitly | Added to concepts section |
| AI-Ready GRC Platform | **Yes** | README "Future AI Enhancements"; positioning line | Already clear it is future, not current | Reaffirmed "not AI-powered" |
| Continuous Controls Monitoring (CCM) | **Partial → Yes** | Alert engine (expiry/overdue/orphaned/review), dashboard, hotspots | Capability existed but term wasn't named | Named + explained |
| Zero Trust Exception Governance | **Partial → Yes** | Lifecycle state machine (justify→approve→time-bound→review→revoke) | Term wasn't named | Named + explained |
| Third-Party / Vendor Risk | **Partial → Yes** | Vendor/external-access exceptions w/ owner, approver, expiry, score, history | Not framed as vendor risk | Named + explained |
| Identity & Privileged Access Risk | **Yes** | Risk scoring type-weights (Admin Access, Privileged Access Extension, Password Policy), orphaned-owner detection; NIST AC-2 mapping | Term wasn't grouped | Named + explained |
| Automated Audit Evidence | **Yes** | `exception_history`, approvals, audit report, alerts, risk/CIA | Term wasn't named | Named + explained |
| Risk Quantification & Portfolio View | **Yes** | Risk scores/levels, heatmap, hotspots, BU/policy roll-ups, top-risk list | Term wasn't named | Named + explained |
| CIA Triad Alignment | **Yes** | README "CIA Triad Alignment"; CIA badge across pages | — | Already strong |
| GRC Intelligence / Conflict Detection | **Yes** | `conflictDetection.js`, GRC Intelligence page, registry badges | — | Already strong |
| Compliance Alignment | **Yes** | README "Compliance Alignment" table | — | Already strong |
| Production Security Limitations | **Yes** | README "Known Limitations" + "Future Integrations" + roadmap below | Consolidated for clarity | Added hardening roadmap below |

**Result:** all 12 concepts are now present and explicitly named. The work was documentation-only —
the capabilities already existed in the code; this clarifies terminology for judges and stakeholders.

---

## Concept Explanations

### 1. GRC Risk Intelligence
Converts scattered, forgotten exceptions (email/Excel/chat) into prioritized, risk-scored,
lifecycle-tracked, audit-ready decisions — a decision system, not a spreadsheet.

### 2. Continuous Controls Monitoring (CCM)
The platform continuously re-evaluates every active exception for expiry, overdue status, orphaned
ownership, review status, and risk hotspots, raising live alerts when a control drifts out of policy.

### 3. Zero Trust Exception Governance
No exception is permanent or implicitly trusted. Each must be justified, approved, time-bound,
reviewed, and revoked when no longer needed — enforced by the lifecycle state machine and expiry logic.

### 4. Third-Party / Vendor Risk
Vendor and external-access waivers (e.g. a vendor payment-gateway firewall opening) are tracked with
owner, approver, expiry, risk score, CIA impact, and full audit history.

### 5. Identity & Privileged Access Risk
Admin access, privileged-access extensions, password-policy exceptions, and orphaned/inactive owners
are weighted as identity and access risk and surfaced via scoring, alerts, and hotspots (NIST AC-2).

### 6. Automated Audit Evidence
Immutable lifecycle history, reviewer comments, approvals, rejections/revocations, risk score, CIA
impact, alerts, and the one-click audit report together form exportable audit evidence.

### 7. Risk Quantification & Portfolio Risk View
Risk is quantified (0–100 score, four levels) and aggregated into a heatmap, hotspots, business-unit
and policy roll-ups, and a prioritized top-risk list — a portfolio view, not per-item only.

### 8. CIA Triad Alignment
Each exception is mapped to Confidentiality, Integrity, Availability, or Multiple so non-numeric
business/security impact is clear alongside the numeric score.

### 9. GRC Intelligence / Conflict Detection
Detects overlapping exceptions, conflicting approvals, duplicate waivers, vague justifications, and
risk accumulation across asset/owner/policy/business unit.

### 10. Compliance Alignment
Maps to NIST AC-2 (account management), NIST PL-4 (rules of behavior), GDPR Article 25 (data
protection by design), CIS Controls, and internal security-policy governance.

### 11. AI-Ready Future Scope (not current)
The rule-based engine is explainable today and architected to later add: AI vague-justification
detection, anomaly detection for repeated waiver patterns, an AI recommendation engine, a RAG-based
policy assistant, automated audit-summary generation, and predictive escalation for high-risk items.

---

## Production Hardening Roadmap (security limitations → production)

The prototype intentionally uses **localStorage demo auth** and **JSON file storage**. A production
deployment would add:

- **SSO / OIDC** authentication (replace demo login)
- **Backend RBAC** — server-side role enforcement on every API
- **Secure sessions** (httpOnly cookies / short-lived tokens)
- **PostgreSQL / MongoDB** with transactions (replace JSON files; remove write races)
- **Audit-safe actor tracking** — record the authenticated identity, not a client-supplied value
- **Rate limiting** and request throttling
- **Security headers** (helmet: CSP, HSTS, etc.) and scoped CORS
- **Server-side authorization** and input validation on all routes

---

**Positioning line:** *RiskWaiver360 is a modern GRC risk intelligence platform that centralizes
policy exceptions, continuously monitors expiry and ownership, scores risk, supports Zero Trust
governance, and creates audit-ready evidence for cybersecurity and compliance teams.*
