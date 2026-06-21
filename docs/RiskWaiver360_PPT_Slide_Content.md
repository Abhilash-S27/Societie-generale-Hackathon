# RiskWaiver360 — PPT Slide Content
## 12 Slides · Red + Black Cybersecurity GRC Theme

> **Design spec:** Background `#020617` deep black · Primary red `#DC2626` · Accent `#EF4444` · Text `#F8FAFC` · Cards `rgba(15,23,42,0.88)` · Use red top-accent lines on cards · Monospace font for code/formulas · Clean, audit-ready aesthetic · No animations on text (fade-in on click is acceptable)

---

## SLIDE 1 — TITLE

**Layout:** Full bleed · Centered · Red ambient glow in background

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     [ Shield Icon ]                             │
│                                                                 │
│              RiskWaiver360                                      │
│   GRC Process Exception & Policy Waiver Management Platform     │
│                                                                 │
│         ────────────────────────────────────────                │
│         Track: Policy Governance & Risk Management              │
│                                                                 │
│         Team Name  ·  Institution  ·  Date                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Headline:** `RiskWaiver360`
**Subheading:** GRC Process Exception & Policy Waiver Management Platform
**Tag:** Track: Policy Governance & Risk Management
**Footer line:** Team Name · Institution · Hackathon Date

**Visual elements:**
- Large shield / lock icon (red glow)
- Subtle red radial gradient in upper left and lower right
- Thin red horizontal rule under headline

---

## SLIDE 2 — PROBLEM STATEMENT

**Layout:** 2-column · Left: headline + context · Right: 4 problem cards (dark glass)

**Headline:** `The Problem No One Is Tracking`

**Context (left, 2–3 lines):**
> In most enterprises, security policy exceptions live in emails, Excel sheets, and Slack messages — with no central registry, no expiry tracking, and no audit trail.

**Problem cards (right, 4 cards with red left-border):**

| Icon | Problem |
|---|---|
| 📧 | **Scattered Records** — Exceptions in emails, Excel, chat. No single source of truth. |
| ⏰ | **Temporary Becomes Permanent** — "2-week" waivers stay active for 2 years. |
| 🔓 | **Expired, Never Revoked** — Firewall openings, admin access — still live after the need ends. |
| 🔍 | **Audit Failures** — Auditors ask "who approved what, when?" — teams cannot answer. |

**Screenshot placeholder:**
```
[ SCREENSHOT: Inbox/Excel chaos — illustrative mockup or icon collage ]
```

---

## SLIDE 3 — WHY IT MATTERS

**Layout:** Dark card grid · 3 columns × 2 rows · Red accent icons

**Headline:** `Six Hidden Risks That Compound Into Breaches`

**6 risk cards:**

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 👤 Orphaned      │  │ 📋 Overlapping    │  │ ⚔️ Conflicting    │
│    Access        │  │    Waivers        │  │    Approvals     │
│                  │  │                  │  │                  │
│ Owner left. No   │  │ Two teams, same   │  │ One approves.    │
│ one revoked      │  │ asset, same       │  │ One rejects.     │
│ the exception.   │  │ policy, both      │  │ Nobody detects   │
│ Still active.    │  │ active.           │  │ the conflict.    │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 📅 Long-Running  │  │ 📈 Risk           │  │ ❌ Compliance /   │
│    Temp Access   │  │    Accumulation   │  │    Audit Fail    │
│                  │  │                  │  │                  │
│ Granted for a   │  │ 10 small Low      │  │ NIST, GDPR, CIS  │
│ project in 2022. │  │ exceptions on     │  │ require evidence │
│ Project ended.   │  │ one system =      │  │ of control and   │
│ Access stayed.   │  │ Critical risk.    │  │ revocation.      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Bottom stat bar (3 stats):**
- `68%` of enterprises cannot produce a complete exception list on demand *(representative stat)*
- `43%` of policy exceptions have no recorded expiry date *(representative stat)*
- `1 in 3` audit findings relate to access not revoked when it should have been *(representative stat)*

> *Stats are representative industry data for illustration.*

---

## SLIDE 4 — PROPOSED SOLUTION

**Layout:** Centered · Solution overview card + 5 capability pillars below

**Headline:** `RiskWaiver360 — One Platform. Complete Control.`

**Solution statement (large card, red top border):**
> RiskWaiver360 centralizes every policy exception into a single risk-scored, lifecycle-tracked, alert-monitored, conflict-detected, and audit-ready governance platform.

**5 pillars (icon + label):**

```
  [ Registry ]    [ Risk Score ]   [ Lifecycle ]   [ GRC Intel ]   [ Audit ]
  Centralized     0–100 rule-      14-state         Overlap +       One-click
  exception       based score      machine,         conflict        audit-ready
  register        per exception    immutable log    detection       report
```

**Screenshot placeholder:**
```
[ SCREENSHOT: Dashboard overview — cards, charts, heatmap ]
```

---

## SLIDE 5 — SYSTEM ARCHITECTURE

**Layout:** Vertical flow diagram · Dark background · Red connector lines

**Headline:** `Architecture — Full-Stack Working Prototype`

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     USER ROLES                                   │
  │  [ Requester ]  [ Security Reviewer ]  [ Approver ]  [ Auditor ] │
  └───────────────────────┬─────────────────────────────────────────┘
                          │  Browser session (localStorage demo auth)
                          ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │              React + Vite Frontend  (:5173)                      │
  │   Dashboard · Registry · Add Exception · Review Queue            │
  │   Risk Scoring · Alerts · GRC Intelligence · Audit Report        │
  └───────────────────────┬─────────────────────────────────────────┘
                          │  REST API  /api/*
                          ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │              Node.js + Express Backend  (:4000)                  │
  │   Risk Scoring Engine · Alert Engine · Conflict Detection        │
  │   Recommendation Engine · Exception Service · Audit Service      │
  └───────────────────────┬─────────────────────────────────────────┘
                          │  fs read/write
                          ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │              JSON Demo Storage  (backend/data/)                  │
  │   exceptions · approvals · history · alerts · users · policies   │
  └─────────────────────────────────────────────────────────────────┘
```

**Tech badge row (bottom):**
`React 18` · `Vite` · `Node.js` · `Express` · `Recharts` · `lucide-react` · `JSON Storage`

---

## SLIDE 6 — ROLE-BASED WORKFLOW

**Layout:** Horizontal timeline / swimlane · 4 lanes

**Headline:** `Formal Governance Workflow — Four Roles, One System`

```
  REQUESTER          SECURITY REVIEWER      APPROVER           AUDITOR / ADMIN
  ─────────────      ─────────────────      ─────────────      ───────────────
  Submit exception   Triage & validate      Approve / Reject   Full read-only
  via GRC Intake     risk, add comments,    Renew / Revoke     access
  Form               forward to approver    Escalate           
                                                               Audit Report
  Track own          View risk score        All lifecycle      Print / Export
  requests           CIA triad impact       actions            
                                                               GRC Intelligence
  View own alerts    Review Queue           Exception          Compliance
  and risk score                            Details            Roll-ups
```

**State machine (compact, bottom of slide):**

```
  DRAFT → SUBMITTED → UNDER_REVIEW → PENDING_APPROVAL → APPROVED → ACTIVE
                                                                      │
                                               ┌──────────────────────┤
                                               │                      │
                                          EXPIRING_SOON           REVOKED
                                               │
                                          OVERDUE / ESCALATED
```

---

## SLIDE 7 — CORE FEATURES

**Layout:** 3×3 feature card grid + 1 wide bottom card · Red top-accent per card

**Headline:** `9 Core Features — Production-Ready Scope`

```
  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │ 📋 Exception      │  │ 📝 GRC Intake     │  │ ✅ Review Queue   │
  │    Risk Register  │  │    Form           │  │                  │
  │                  │  │                  │  │                  │
  │ Searchable,      │  │ Structured multi- │  │ Approve, reject, │
  │ filterable,      │  │ step form. Risk   │  │ request info,    │
  │ CSV import/      │  │ auto-scored on    │  │ add comment.     │
  │ export.          │  │ submission.       │  │ All logged.      │
  └──────────────────┘  └──────────────────┘  └──────────────────┘

  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │ 🗂️ Evidence File  │  │ 🧮 Risk Scoring   │  │ 🔔 Alerts /       │
  │                  │  │    Engine         │  │    Monitoring    │
  │                  │  │                  │  │                  │
  │ Full lifecycle   │  │ 0–100 score,     │  │ 7 alert types.   │
  │ timeline per     │  │ explainable      │  │ Continuous re-   │
  │ exception.       │  │ factor breakdown. │  │ evaluation.      │
  │ Approver record. │  │ 4 risk bands.    │  │ Email sim.       │
  └──────────────────┘  └──────────────────┘  └──────────────────┘

  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │ 🧠 GRC            │  │ 📊 Audit Report   │  │ ⚙️ Settings /     │
  │    Intelligence  │  │                  │  │    Demo Config   │
  │                  │  │                  │  │                  │
  │ Overlaps,        │  │ Exec summary,    │  │ Role switcher,   │
  │ conflicts,       │  │ roll-ups,        │  │ scoring config,  │
  │ duplicates,      │  │ conflict report. │  │ system status,   │
  │ hotspots.        │  │ Print / export.  │  │ user table.      │
  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Screenshot placeholder:**
```
[ SCREENSHOT: Exception Registry table — badges, filters, risk scores ]
```

---

## SLIDE 8 — RISK SCORING ENGINE

**Layout:** Left: formula card · Right: factor table + band bar

**Headline:** `Rule-Based, Explainable Risk Scoring — 0 to 100`

**Formula card (dark, red border, monospace):**

```
  Risk Score =

    Exception Type Weight          (Admin Access: 35 · Encryption Disabled: 35)
  + Asset Criticality Weight       (Critical: 25 · High: 18 · Medium: 10)
  + Duration Penalty               (>180 days: +20 · ≤7 days: 0)
  + Expiry Status Penalty          (Overdue: +15 · Expiring soon: +8)
  + Review Status Penalty          (Review overdue: +12 · Not reviewed: +8)
  + Owner Status Penalty           (Orphaned: +12 · No owner: +10)
  − Compensating Control Bonus     (Control present: −15)

  ──────────────────────────────────────────────────────
  Result capped at 0–100
```

**Risk band bar (right side):**

```
  0 ──────── 30 ──────── 60 ──────── 80 ──────── 100
  │  LOW  ▓▓ │  MEDIUM ▓▓ │  HIGH  ▓▓ │ CRITICAL ▓▓│
  │ Monitor   │ Review    │ Escalate  │ Act Now    │
```

| Band | Score | Action |
|---|---|---|
| Low | 0 – 30 | Monitor · standard renewal |
| Medium | 31 – 60 | Review before renewal |
| High | 61 – 80 | Escalate · owner must confirm |
| Critical | 81 – 100 | Revoke or escalate immediately |

**Key message (bottom, highlighted):**
> `Rule-based · Explainable · Auditable · Not black-box AI`

---

## SLIDE 9 — ALERTS & GRC INTELLIGENCE

**Layout:** 2 columns · Left: Alerts · Right: GRC Intelligence

**Headline:** `Continuous Monitoring + Cross-Exception Intelligence`

**Left column — Alert Engine (7 alert types):**

| Severity | Alert Type |
|---|---|
| 🔴 Critical | Overdue exception — past expiry, not revoked |
| 🔴 Critical | Critical risk score — active, not escalated |
| 🟠 High | Expiring soon — within 7 days |
| 🟠 High | Orphaned owner — owner inactive or departed |
| 🟡 Medium | Missing compensating control |
| 🟡 Medium | Review overdue |
| 🟢 Low | Vague justification detected |

**Right column — GRC Intelligence (4 detection types):**

```
  ┌──────────────────────────────────────┐
  │ 🔁 Overlapping Exceptions             │
  │    Same asset + policy, both active   │
  ├──────────────────────────────────────┤
  │ ⚔️ Conflicting Approvals              │
  │    One approved, one rejected, same   │
  │    scope                              │
  ├──────────────────────────────────────┤
  │ 📄 Duplicate Waivers                  │
  │    Near-identical requests from       │
  │    different requesters               │
  ├──────────────────────────────────────┤
  │ 📈 Risk Accumulation Hotspots         │
  │    Combined exception risk by asset,  │
  │    BU, owner, or policy               │
  └──────────────────────────────────────┘
```

**Screenshot placeholder:**
```
[ SCREENSHOT: Alerts page — severity badges, alert cards ]
```

---

## SLIDE 10 — COMPLIANCE & CIA ALIGNMENT

**Layout:** 2 columns · Left: Compliance frameworks · Right: CIA Triad mapping

**Headline:** `Built for Compliance — NIST · GDPR · CIS`

**Left column — Compliance Table:**

| Standard | Requirement | How Supported |
|---|---|---|
| NIST AC-2 | Admin access review & revocation | High type-weight + review-overdue alerts + full audit trail |
| NIST PL-4 | Policy deviations documented | Mandatory justification + approver record + immutable history |
| GDPR Art. 25 | Data protection by design | Encryption-Disabled exceptions score Critical + CIA: Confidentiality flag |
| CIS 1.1 | Asset inventory & risk | Every exception linked to asset · hotspot roll-up by asset |

**Right column — CIA Triad:**

```
  ┌──────────────────────────────────────────┐
  │                CIA TRIAD                  │
  │                                          │
  │  🔒 CONFIDENTIALITY                      │
  │     Encryption Disabled                  │
  │     Data Access Extension                │
  │                                          │
  │  ✏️ INTEGRITY                             │
  │     Admin Access                         │
  │     Privileged Access Extension          │
  │     Conflicting Approvals                │
  │                                          │
  │  🌐 AVAILABILITY                         │
  │     Firewall Bypass                      │
  │     Network Exposure                     │
  │                                          │
  │  ⚡ MULTIPLE                              │
  │     Password Policy                      │
  │     Audit Logging Disabled               │
  └──────────────────────────────────────────┘
```

**Key message:**
> CIA mapping translates technical exceptions into business risk language that CISOs, auditors, and board members understand.

---

## SLIDE 11 — DEMO FLOW

**Layout:** Numbered step list with role-color coding · 2 columns

**Headline:** `End-to-End Demo — 13 Steps, 4 Roles`

**Step list:**

```
  ① HOME PAGE           Landing page · value proposition

  ② LOGIN — REQUESTER   requester@riskwaiver360.demo
  ③ SUBMIT EXCEPTION    GRC Intake Form · auto risk scored on submit

  ④ LOGIN — REVIEWER    reviewer@riskwaiver360.demo
  ⑤ REVIEW REQUEST      Review Queue · add comment · forward to approver

  ⑥ LOGIN — APPROVER    approver@riskwaiver360.demo
  ⑦ APPROVE / REVOKE    Exception Details · risk breakdown · lifecycle action

  ⑧ DASHBOARD           KPI cards · charts · risk heatmap · hotspots

  ⑨ REGISTRY            Filter Critical · conflict badge · open evidence file

  ⑩ RISK SCORING        Formula · factor breakdown · ranked list

  ⑪ ALERTS              7 alert types · severity filter · email sim

  ⑫ GRC INTELLIGENCE    Overlap/conflict/duplicate/accumulation findings

  ⑬ AUDIT REPORT        Exec summary · compliance roll-up · Print/Export
```

**Role legend:**
`[ Requester ]` · `[ Reviewer ]` · `[ Approver ]` · `[ Auditor/Admin ]`

**Screenshot placeholders:**
```
[ SCREENSHOT: Risk Scoring page — formula + breakdown ]
[ SCREENSHOT: Audit Report — executive summary section ]
```

---

## SLIDE 12 — LIMITATIONS & FUTURE SCOPE

**Layout:** 2 columns · Left: Current limitations (honest) · Right: Roadmap + AI future

**Headline:** `Prototype Today. Production Path Clear.`

**Left column — Current Prototype Limitations:**

| What | Current State |
|---|---|
| Authentication | localStorage demo only — no real IdP |
| Authorization | Frontend role simulation |
| Storage | JSON files — not production-scale |
| Email alerts | Simulated preview — no real delivery |
| PDF export | Browser print dialog |
| Audit actor | Client-provided role string |

**Right column — Production Roadmap:**

```
  SECURITY                    DATA & INFRA
  ─────────────               ────────────────
  • SSO / OIDC                • PostgreSQL / MongoDB
  • Backend RBAC              • Tamper-evident audit logs
  • Secure sessions           • Server-side PDF export
  • Server-side authz         • Real-time alert push

  INTEGRATIONS                FUTURE AI (scope only)
  ────────────                ──────────────────────
  • ServiceNow / Jira         • Vague justification NLP
  • CMDB / asset inventory    • Anomaly detection
  • Okta / Entra ID           • AI recommendation engine
  • SIEM (Splunk/Sentinel)    • RAG policy assistant
  • Enterprise email gateway  • Predictive escalation
```

**Bottom closing statement (full width, centered, red accent line above):**

```
  ────────────────────────────────────────────────────────────────
  RiskWaiver360 helps enterprises move from scattered exception
  tracking to centralized, risk-scored, lifecycle-tracked, and
  audit-ready GRC exception governance.
  ────────────────────────────────────────────────────────────────
```

> Current prototype: **Rule-based · Explainable · Auditable**
> AI capabilities: **Future scope only — not present in this submission**

---

## DESIGN NOTES FOR PRESENTATION TOOL

### Color Tokens
| Use | Color |
|---|---|
| Slide background | `#020617` |
| Primary red | `#DC2626` |
| Accent red | `#EF4444` |
| Card background | `#0F172A` / `#0D1929` |
| Card border | `rgba(255,255,255,0.10)` |
| Body text | `#F8FAFC` |
| Muted text | `#94A3B8` |
| Success green | `#16A34A` / `#86EFAC` |
| Warning amber | `#F59E0B` / `#FCD34D` |
| Danger red | `#EF4444` / `#FCA5A5` |

### Typography
| Element | Recommendation |
|---|---|
| Title (H1) | Inter / Calibri · 36–44pt · Bold · `#F8FAFC` |
| Slide heading | Inter / Calibri · 24–28pt · Bold · `#F8FAFC` |
| Body text | Calibri / Segoe UI · 14–16pt · `#CBD5E1` |
| Code / formula | Cascadia Code / Courier New · 12–14pt · `#E2E8F0` on dark bg |
| Badge text | 11–12pt · Bold · Uppercase |

### Card Style
- Background: `#0F172A`
- Border: `1px solid rgba(255,255,255,0.10)`
- Top accent line: `3px solid #DC2626`
- Rounded corners: 8–12px
- Shadow: subtle dark drop shadow

### Icon Style
- Use outline icons (Lucide, Feather, or Heroicons style)
- Color: `#EF4444` on dark backgrounds
- Size: 24–32px in cards
