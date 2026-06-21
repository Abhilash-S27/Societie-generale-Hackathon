# RiskWaiver360

**Centralized GRC exception & policy waiver management — risk scoring, lifecycle tracking, alerts, and audit-ready reporting.**

A full-stack working prototype (React + Vite frontend, Node + Express backend, JSON file storage) that gives security and risk teams a single trusted view of every policy exception: who has it, why it was approved, when it expires, and what risk it creates.

---

## Problem Statement (PS1: GRC Process Exception & Policy Waiver Management)

In enterprises, security policy exceptions ("permission to break a rule, just this once") are scattered across emails, chat, and spreadsheets. "Temporary" waivers quietly stay active for months or years. Nobody has one trusted view of who holds which exception, why it was approved, when it expires, and what risk it creates. Forgotten exceptions become hidden attack paths, fail audits, and breach standards like NIST AC-2, GDPR Art.25, and the CIS Controls.

## Solution Overview

RiskWaiver360 centralizes every exception into one searchable registry, scores its risk with a transparent rule-based engine (type + duration + review + asset criticality + expiry + owner status − compensating control), tracks it through a full lifecycle state machine, automatically generates alerts (expiring, overdue, **orphaned**, review-overdue, missing control, vague justification, critical risk), surfaces **risk accumulation hotspots**, recommends actions (revoke / renew / escalate) with an owner, and produces a one-click, print-ready audit report.

---

## The Business Problem & Real Failure Cases

Today, security policy exceptions and waivers live in **email, Excel, and Slack/chat**. There is no single source of truth, so:

- **No visibility into active exceptions** — leadership cannot answer "who currently holds which exception, and why?"
- **Expired exceptions are never revoked** — a "2-week" firewall opening is still live two years later.
- **Temporary becomes permanent** — without a forced renewal/expiry, waivers quietly become standing risk.
- **Vague justifications** ("needed for business", "testing") slip through with no accountability.
- **Overlapping exceptions** on the same asset/policy create ambiguity and double-counted risk.
- **Conflicting approvals** (one approver approves, another rejects) go unnoticed.
- **Risk accumulation** — ten "small" exceptions on one system together form a critical, invisible exposure.
- **Auditors can't prove control** — when asked "show every exception, who approved it, why, and that it's reviewed," teams fail the audit even if nothing was breached.

RiskWaiver360 turns these scattered, forgotten waivers into a **prioritized, risk-scored, lifecycle-tracked, audit-ready decision system**.

## Compliance Alignment

| Standard | Requirement (plain) | How RiskWaiver360 supports it |
|---|---|---|
| **NIST AC-2** (Account Management) | Privileged/admin access must be controlled and periodically reviewed | Admin Access exceptions carry high type-weight, drive review-overdue alerts, and appear in the audit trail with approver + review state |
| **NIST PL-4** (Rules of Behavior) | Deviations from policy must be documented, justified, and acknowledged | Mandatory business justification, approver record, and full `exception_history` per waiver |
| **GDPR Article 25** (Data protection by design) | Personal data must be protected by default; deviations need justification | Encryption-Disabled / Data-Protection exceptions score Critical, require compensating controls, and are surfaced as alerts |
| **CIS Control 1.1** (Asset inventory) | Maintain an inventory of assets and their risk | Every exception is linked to an asset; risk is rolled up by asset into hotspots and a heatmap |

## Success Criteria → How We Meet It

| Success criterion | Delivered by |
|---|---|
| **Visibility** of active exceptions | Centralized registry + portfolio dashboard |
| **Expiry alerts** | Auto `expiring_soon` / `overdue` status + alert engine + email-reminder simulation |
| **Risk scoring** | Transparent rule-based engine with explainable breakdown |
| **Operational efficiency** | Recommendations (revoke/renew/escalate) with owner, review queue, CSV import |
| **Audit readiness** | One-click audit report (exec summary + roll-ups + conflict findings) + Print/Export + immutable history timeline |

## Deliverable Mapping (PS1 → Implementation)

| PS1 deliverable | Feature | Where in code |
|---|---|---|
| Centralized exception registry | Exception Registry + JSON store | `pages/ExceptionRegistry.jsx`, `backend/data/exceptions.json` |
| Lifecycle tracking | 14-state machine, every change logged | `backend/services/exceptionService.js` |
| Risk scoring model | Rule-based, capped 0–100, 4 bands | `backend/services/riskScoring.js` |
| Alert system | 7 alert types, recomputed live | `backend/services/alertEngine.js` |
| Dashboard | Cards, charts, heatmap, GRC intelligence | `pages/Dashboard.jsx`, `backend/services/auditService.js` |
| Audit reports | Exec summary + roll-ups + Print/Export | `pages/AuditReport.jsx` |
| Overlap / conflict / duplicate / accumulation | GRC Intelligence | `backend/services/conflictDetection.js`, `pages/GRCIntelligence.jsx` |
| Recommendations with owner | Recommendation engine | `backend/services/recommendationEngine.js` |
| Enterprise data onboarding | CSV import / export | `backend/routes/exceptions.js` (`/bulk-import`, `/export-csv`, `/csv-template`) |

## Data & Enterprise Onboarding

This prototype ships with **realistic synthetic data** (no real customer data): 11 users, 10 policies, 10 banking assets, and 20 exceptions (EX-101…EX-120) covering every risk level, all lifecycle statuses, orphaned/overdue/overlap/conflict/duplicate cases, and accumulation hotspots.

For enterprise onboarding from existing spreadsheets, the registry supports **CSV import** (Template → Import → preview → summary). Supported columns:

```
exception_id (optional), requester_name, business_unit, asset_name, policy_name,
exception_type, business_justification, start_date, expiry_date, criticality,
compensating_control, owner_name, approver_name, status
```

On import, policy/asset/owner/approver names are mapped to records, required fields are validated, risk is scored, a recommendation is generated, and a history entry is created — with per-row warnings for anything unmatched.

## CIA Triad Alignment

RiskWaiver360 maps each policy exception to the CIA Triad:

* **Confidentiality:** encryption-disabled and data access exceptions
* **Integrity:** admin access and conflicting approval exceptions
* **Availability:** firewall and network exposure exceptions

This helps security, risk, and audit teams understand the business impact of each waiver beyond just numeric risk score. CIA impact is derived automatically from the exception type/policy and shown as a small badge in the Exception Registry, Exception Details, Risk Scoring, and Audit Report pages (logging/password exceptions map to **Multiple**).

---

## Features

- **Login / role selection** — Requester, Security Reviewer, Approver, Auditor/Admin (stored in localStorage).
- **Portfolio dashboard** — 8 summary cards + 6 charts (risk distribution, status, by policy category, **by exception type**, **top risky business units**, monthly trend) + top-risk table + risk hotspots.
- **Exception registry** — searchable/filterable table (search, risk level, status, business unit, policy category).
- **Add exception** — full request form (incl. risk impact); risk scored on the backend at creation.
- **Exception details** — metadata, policy/asset, justification, **risk score breakdown + explanation**, timeline/history, approval records, related alerts, and all lifecycle action buttons.
- **Risk Scoring page** — explainable scoring: live formula, full weight-table reference, and a ranked list where each exception shows its point-by-point breakdown and plain-English reasons.
- **Review queue** — approve / reject / ask clarification / add comment for in-flight requests.
- **Alerts** — 7 alert types, severity + type filters, recomputed live.
- **Audit report** — executive summary, roll-ups by policy/BU/owner, renewal/revocation status, hotspots, overdue & orphaned lists, recommendations summary, **overlap & conflict findings**, **Print/Export**.
- **GRC Intelligence (overlap & conflict detection)** — detects overlapping waivers, conflicting approvals, duplicate requests, and **risk-accumulation hotspots** (by asset/owner/policy/BU). Surfaced on the dashboard, as a registry badge + filter, in a details panel, and in the audit report.
- **CSV import / export** — download a template, import scattered spreadsheet records (with validation, name→id mapping, warnings, and an import summary), and export the live registry (incl. risk score, level, recommendation).
- **Settings** — role switcher, live backend status, scoring config, user/owner status table.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, React Router, Axios, Recharts, lucide-react, custom CSS |
| Backend | Node.js, Express, CORS |
| Storage | JSON files (one collection per file) — no database required |

## Architecture

```
RiskWaiver360/
├── backend/                 # Express API (port 4000)
│   ├── server.js
│   ├── data/                # users, policies, assets, exceptions, approvals, history, alerts (JSON)
│   ├── routes/              # dashboard, exceptions, alerts, audit, lookups
│   ├── services/            # dataStore, riskScoring, recommendationEngine, alertEngine, auditService, exceptionService
│   └── utils/               # dateUtils
└── frontend/                # React + Vite (port 5173, proxies /api -> backend)
    └── src/
        ├── api/             # api.js (axios)
        ├── components/      # Navbar, Sidebar, Layout, StatCard, RiskBadge, StatusBadge, AlertCard
        ├── pages/           # Login, Dashboard, ExceptionRegistry, AddException, ExceptionDetails, ReviewQueue, RiskScoring, Alerts, AuditReport, Settings
        ├── utils/           # formatters, constants
        └── styles/          # global, layout, components
```

The frontend never holds fake data — every screen calls the backend with loading/error/success states.

---

## How to Run

**Prerequisites:** Node.js 18+.

### 1. Backend
```bash
cd backend
npm install
npm run reset-demo
npm run dev
```
Backend runs at **http://localhost:4000** (health check: `/api/health`).
Run `npm run reset-demo` before every fresh demo — it restores the original synthetic dataset from `backend/seed/` so all lifecycle actions, risk scores, and alerts are in their initial state.

### 2. Frontend (in a second terminal)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**. The Vite dev server proxies `/api` to the backend, so no extra config is needed.

## Reset Demo Data

Because the prototype uses JSON file storage, lifecycle actions such as approve, revoke, renew, and escalate update the local JSON files. Before a fresh demo, run:

```bash
cd backend
npm run reset-demo
```

Then start backend and frontend again. (The clean seed lives in `backend/seed/`; the reset copies it over `backend/data/`.)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | Summary metrics, charts, hotspots, top risks |
| GET | `/api/exceptions` | All exceptions (enriched). Filters: `q, risk_level, status, business_unit, policy_category` |
| GET | `/api/exceptions/:id` | Full detail incl. history, approvals, alerts, risk breakdown |
| POST | `/api/exceptions` | Create a new exception |
| PATCH | `/api/exceptions/:id/status` | Lifecycle transition (`{ action, actor, note }`) |
| POST | `/api/exceptions/:id/review` | Add review comment / move to under_review |
| POST | `/api/exceptions/:id/approve` | Approve (auto-activates) |
| POST | `/api/exceptions/:id/reject` | Reject |
| POST | `/api/exceptions/:id/renew` | Renew with new expiry (`{ expiry_date }` or `{ extend_days }`) |
| POST | `/api/exceptions/:id/revoke` | Revoke |
| GET | `/api/exceptions/csv-template` | Download a blank CSV import template |
| GET | `/api/exceptions/export-csv` | Export the enriched registry as CSV |
| POST | `/api/exceptions/bulk-import` | Import rows from parsed CSV (`{ rows: [...] }`) → import summary |
| GET | `/api/exceptions/:id/conflicts` | Overlap/conflict findings for one exception |
| GET | `/api/conflicts` | All overlap/conflict/duplicate/accumulation findings. Filters: `type, severity` |
| GET | `/api/alerts` | Live alerts. Filters: `severity, type` |
| GET | `/api/audit-report` | Audit-ready report payload (incl. conflicts) |
| GET | `/api/lookups` | Users, policies, assets, types, units, categories, statuses |

## Risk Scoring Engine

```
risk_score = TYPE_WEIGHT + DURATION_PENALTY + REVIEW_PENALTY
           + ASSET_CRITICALITY_WEIGHT + EXPIRY_STATUS_PENALTY
           + OWNER_STATUS_PENALTY − COMPENSATING_CONTROL_BONUS      (capped 0–100)
```
Bands: **0–30 Low · 31–60 Medium · 61–80 High · 81–100 Critical**. See `backend/services/riskScoring.js` for the full weight tables. Each score returns a factor breakdown and a plain-English explanation.

## Lifecycle State Machine

`draft → submitted → under_review → pending_approval → approved → active → expiring_soon → renewal_requested → renewed`, plus `revoked`, `rejected`, `overdue`, `escalated`, `closed`. Every transition appends a record to `exception_history`. See `backend/services/exceptionService.js`.

---

## Demo Flow (for judges)

1. **Login** → pick **Approver**.
2. **Dashboard** — point out Overdue (3), Orphaned (6), avg risk 82, and the **risk hotspots** (Payment Gateway, Customer Data Warehouse).
3. **Registry** — filter `Risk Level = Critical`; open **EXC-0001** (Encryption Disabled on Payment Gateway, overdue, score 100).
4. **Details** — show the **risk breakdown + explanation**, the recommendation ("Revoke immediately and escalate"), then click **Revoke** and watch the history update.
5. **Add Exception** — create a long-lived Admin Access exception with no owner; show it scores Critical and is flagged orphaned.
6. **Review Queue** — approve a `submitted` request; it auto-activates.
7. **Alerts** — filter `Severity = Critical`; show overdue + orphaned + critical-risk alerts.
8. **GRC Intelligence (Dashboard)** — show the Overlapping / Conflicting Approvals / Duplicate / Accumulation cards and top findings (EXC-0017 ↔ EXC-0018 firewall overlap + duplicate on Payment Gateway; EXC-0019 conflicting approval).
9. **Registry** — tick **Has conflicts**; open a flagged row to see the **Related Risks & Conflicts** panel.
10. **CSV** — click **Template**, then **Import CSV** (preview → confirm → summary); **Export CSV** downloads the live registry.
11. **Audit Report** — read the executive summary + **Overlap & Conflict Findings**, then **Print / Export Report**.

## Sample Login Roles

Sign in at `/login` with email + password, then solve the simple math captcha. The four demo accounts:

| Role | Demo email | Demo password | Focus |
|------|------------|---------------|-------|
| Requester | requester@riskwaiver360.demo | Requester@123 | Submit & track requests |
| Security Reviewer | reviewer@riskwaiver360.demo | Reviewer@123 | Review, comment, triage |
| Approver | approver@riskwaiver360.demo | Approver@123 | Approve / reject / renew / revoke |
| Auditor/Admin | auditor@riskwaiver360.demo | Auditor@123 | Full visibility + audit reporting |

Demo authentication only — credentials and role are validated client-side and the role is stored in `localStorage` (`rw_role` / `rw_email`). No real identity provider, backend RBAC, or server-side session is used in the prototype. On the Sign In page, **Use this account** fills the email/password only (the captcha is always entered manually).

## Modern Cybersecurity & GRC Concepts Covered

> Full detail + market alignment: [docs/concepts-and-market-alignment.md](docs/concepts-and-market-alignment.md)

RiskWaiver360 is not a simple tracker — it implements the concepts modern security/GRC teams expect:

- **GRC Risk Intelligence** — converts scattered, forgotten exceptions into prioritized, risk-scored, lifecycle-tracked, audit-ready decisions.
- **Continuous Controls Monitoring (CCM)** — continuously evaluates active exceptions for expiry, overdue status, orphaned ownership, review status, and risk hotspots, surfacing drift as live alerts.
- **Zero Trust Exception Governance** — every exception is treated as a *temporary* deviation that must be justified, approved, time-bound, reviewed, and revoked when no longer needed (no permanent implicit trust).
- **Third-Party / Vendor Risk** — vendor and external-access exceptions are tracked with owner, approver, expiry, risk score, and full audit history (e.g. the vendor payment-gateway firewall waiver).
- **Identity & Privileged Access Risk** — admin access, privileged-access extensions, password-policy exceptions, and orphaned owners are weighted as identity/access risk (aligns with NIST AC-2).
- **Automated Audit Evidence** — immutable lifecycle history, reviewer comments, approvals, rejections/revocations, risk score, CIA impact, and alerts form ready-to-export audit evidence.
- **Risk Quantification & Portfolio View** — 0–100 scores, risk levels, heatmap, hotspots, business-unit/policy roll-ups, and a prioritized top-risk list.
- **CIA Triad Alignment** — each exception maps to Confidentiality / Integrity / Availability / Multiple to explain business and security impact.
- **GRC Intelligence / Conflict Detection** — surfaces overlapping exceptions, conflicting approvals, duplicate waivers, vague justifications, and risk accumulation.
- **Compliance Alignment** — NIST AC-2, NIST PL-4, GDPR Article 25, CIS Controls, and internal security-policy governance.
- **AI-Ready Future Scope** — today the engine is fully **rule-based and explainable**; it is architected to later add AI (vague-justification detection, anomaly detection, recommendations, a RAG policy assistant, audit summaries, predictive escalation). *The current prototype is not AI-powered.*

**Positioning:** *RiskWaiver360 is a modern GRC risk intelligence platform that centralizes policy exceptions, continuously monitors expiry and ownership, scores risk, supports Zero Trust governance, and creates audit-ready evidence for cybersecurity and compliance teams.*

## Future Enhancements

- Real authentication & per-role permission enforcement
- Database persistence (PostgreSQL/Mongo) and native PDF export
- Scheduled background job for proactive expiry/review notifications
- *(Already implemented: CSV import for fragmented records, overlap/conflict/duplicate detection, risk-accumulation hotspots.)*

## Future Integrations (Enterprise)

RiskWaiver360 is designed to drop into an enterprise GRC/security toolchain. Recommended integrations:

| System | Integration value |
|---|---|
| **ITSM / ServiceNow / Jira** | Raise and sync exception requests as tickets; lifecycle status mirrors the ticket; closing the waiver closes the ticket |
| **Email / Slack** | Deliver expiring/overdue/orphaned reminders to owners and approvers (the in-app **email-reminder simulation** previews exactly this), and accept requests via intake forms/bots |
| **SIEM (Splunk / Sentinel / QRadar)** | Feed active exceptions as risk context so alerts on a system "with an active encryption waiver" are prioritized; export critical/overdue findings as events |
| **SSO / IdP (Okta / Entra ID)** | Replace demo localStorage roles with real authentication and enforced authorization |
| **CMDB** | Auto-populate the asset inventory and criticality that drive risk scoring (CIS 1.1 alignment) |

These are integration recommendations for production; the prototype demonstrates the data, scoring, and workflow they would plug into.

## Future AI Enhancements

RiskWaiver360 currently uses rule-based risk scoring, lifecycle tracking, alerts, and audit intelligence. In production, the platform can be extended with AI-based cybersecurity and GRC intelligence features.

Possible future AI enhancements:

* AI-based vague justification detection
* Anomaly detection for unusual or repeated waiver patterns
* AI-powered risk recommendation engine
* RAG-based cybersecurity policy assistant
* Automated audit summary generation
* Predictive escalation for high-risk exceptions
* AI-assisted compliance mapping to NIST, CIS, GDPR, and internal policies

> These AI capabilities are future enhancements. The current hackathon prototype focuses on a clear, explainable, rule-based system so judges can understand the logic behind every risk score and recommendation.

**RiskWaiver360 is an AI-ready GRC risk intelligence platform that can evolve from rule-based risk scoring to AI-assisted exception governance.**

## Known Limitations

- Demo authentication only (role in localStorage; backend does not enforce permissions).
- Role-based access is demonstrated in the frontend using localStorage (role-specific navigation, dashboard, and action buttons). Production implementation would require backend authentication and authorization.
- JSON file storage is single-process and not concurrency-safe for heavy writes.
- Alerts are recomputed on each request rather than pushed in real time.

---

## 48-Hour Hackathon Implementation Approach

> Full detail: [docs/48-hour-implementation-roadmap.md](docs/48-hour-implementation-roadmap.md)

A phase-by-phase plan showing how RiskWaiver360 was scoped and built within a 48-hour hackathon window.

### Hour 0 to 4: Problem Understanding and Project Setup
**Objective:** Understand the problem statement, finalize the project name, define the scope, and create the base project structure.
- Understand PS1: GRC Process Exception & Policy Waiver Management; finalize name **RiskWaiver360**; define core modules and MVP scope.
- Create project folder structure; set up React frontend and Express backend; initialize README and sample data; verify the backend server runs.
- **Output:** project folder created, README initialized, sample data prepared, basic frontend pages created, backend running.

### Hour 4 to 12: Dashboard and Exception Registry
**Objective:** Build the main visibility layer of the platform.
- Build dashboard layout and summary cards; create the exception registry table; connect frontend to backend APIs; display sample records; add risk/status badges and search + filtering.
- **Output:** dashboard cards, exception table, risk badges, status badges, and sample data connected to the frontend.

### Hour 12 to 20: Add Exception Request and Risk Scoring
**Objective:** Allow users to create new exception requests and automatically calculate risk.
- Build the Add Exception form (requester, policy, asset, owner, dates, justification, compensating control); connect to the POST API; implement rule-based risk scoring; auto-generate risk level, recommendation, and a history entry.
- **Output:** working form, automatic risk score / level / recommendation, and the new exception added to the registry.

### Hour 20 to 30: Lifecycle Workflow and Audit Timeline
**Objective:** Implement the complete exception lifecycle workflow.
- Add lifecycle status transitions and the approve, reject, renew, revoke, and escalate actions; record an audit timeline entry for every action; surface actions on the Exception Details page.
- **Output:** all lifecycle actions working with the audit timeline updated after each one.

### Hour 30 to 38: Reports, Charts, Filters, and UI Polish
**Objective:** Make the prototype presentation-ready and useful for leadership/audit review.
- Build the audit report page; add dashboard and risk-distribution charts; add business-unit and policy-based analysis; improve filters; polish the professional banking/cybersecurity UI; add print/export.
- **Output:** audit report, charts, filters, professional UI, and print/export available.

### Hour 38 to 44: Testing and Fixing
**Objective:** Verify that the complete prototype works without errors.
- Test backend APIs and frontend pages; test the create flow, lifecycle actions, dashboard metrics, alerts, and audit report; fix errors and broken routes; confirm the frontend production build succeeds; update the README.
- **Output:** no major errors, clean demo flow, complete README, successful build, verified APIs.

### Hour 44 to 48: Final Pitch, Screenshots, and Q&A Preparation
**Objective:** Prepare the project for final hackathon submission and presentation.
- Prepare the demo flow, screenshots, PPT content, project explanation, Q&A answers, and future enhancements; final push and submission check.
- **Output:** final pitch, PPT content, screenshots, demo script, Q&A, and a submission-ready project.

### Final Demo Flow
1. Login as Approver or Auditor
2. Open Dashboard and explain portfolio summary
3. Open Exception Registry and filter Critical exceptions
4. Open a Critical/Overdue exception
5. Explain risk score breakdown and recommendation
6. Perform a lifecycle action such as Revoke or Approve
7. Show audit timeline update
8. Add a new exception request
9. Show automatic risk scoring
10. Open Alerts page
11. Open GRC Intelligence page
12. Open Audit Report and use Print/Export

### Project Outcome
RiskWaiver360 converts scattered security policy exceptions and temporary waivers into a centralized, risk-scored, lifecycle-tracked, and audit-ready GRC management platform — demonstrating a centralized exception registry, risk scoring, lifecycle workflow, alerts, audit timeline, dashboard analytics, GRC intelligence, and audit-ready reporting.
