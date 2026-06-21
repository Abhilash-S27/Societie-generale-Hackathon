# RiskWaiver360 — Final Hackathon Presentation Guide
## Speaker Notes · 2-Minute Script · 5-Minute Demo Script · Q&A Preparation

---

## PART 1 — SLIDE-BY-SLIDE SPEAKER NOTES

---

### SLIDE 1 — TITLE

**Speaker Notes:**

Good [morning/afternoon]. We are presenting **RiskWaiver360** — a GRC Process Exception and Policy Waiver Management Platform built for the Policy Governance and Risk Management track.

The problem we are solving is one that every enterprise security team faces, but almost none have properly solved: how do you manage security policy exceptions — the temporary waivers, the "just this once" approvals — in a way that is centralized, risk-scored, and audit-ready?

Over the next few minutes, we will walk you through the problem, our solution, the technology, and a live demonstration of the working prototype.

---

### SLIDE 2 — PROBLEM STATEMENT

**Speaker Notes:**

The reality in most enterprises is that security policy exceptions are not managed — they are tolerated. A business unit needs a firewall rule opened temporarily. Instead of going through a formal process, they send an email. A security engineer approves it verbally. Two years later, that firewall rule is still open, the original requestor has left, and nobody knows it exists.

We identified four core failure modes:

**First — scattered records.** Policy exceptions live in emails, Excel spreadsheets, and Slack channels. There is no central registry. Leadership cannot answer the basic question: "what exceptions do we currently have active, who approved them, and why?"

**Second — temporary becomes permanent.** Waivers approved for a two-week project quietly become standing policy because nobody set an expiry, and nobody is watching for it to expire.

**Third — expired exceptions are never revoked.** The technical access remains long after the business need has ended. This is not a hypothetical — it is a finding in almost every access review audit.

**Fourth — audit failures.** When an internal or external auditor asks for evidence of exception governance — who approved what, when, under what justification, and when was it reviewed — most organizations cannot produce it.

---

### SLIDE 3 — WHY IT MATTERS

**Speaker Notes:**

Let us make this concrete with six specific risk patterns that we have modeled in our system.

**Orphaned access** — an employee who owned an exception has left the organization. The exception is still active. Nobody owns it. Nobody will renew or revoke it. This is a live attack path with no guardian.

**Overlapping waivers** — two separate teams have each submitted an exception for the same asset and the same policy. Both are active. Which one's compensating controls apply? Which approval takes precedence? Nobody knows.

**Conflicting approvals** — one approver approved a firewall bypass exception. A different approver rejected an almost identical one for the same asset. These inconsistencies signal unclear risk tolerance and will fail a governance audit.

**Long-running temporary access** — a vendor was granted network access for a three-month integration project. The project completed. The access was never revoked. This is the most common precursor to third-party breach incidents.

**Risk accumulation** — each of ten exceptions on a single system has individually been assessed as Low or Medium risk. But together, they represent a Critical exposure. No existing spreadsheet-based system catches this.

**Compliance failure** — NIST AC-2, GDPR Article 25, and CIS Controls all require documented, justified, time-limited policy exceptions with evidence of review and revocation. Most enterprises cannot demonstrate this.

---

### SLIDE 4 — PROPOSED SOLUTION

**Speaker Notes:**

RiskWaiver360 addresses all of these problems through a single integrated platform built around five capabilities.

**Centralized registry.** Every exception — from submission to revocation — lives in one place. Searchable, filterable, exportable, with risk scores and CIA impact visible at a glance.

**Risk scoring.** Every exception gets an automatic 0-to-100 risk score, calculated from seven factors: exception type, asset criticality, duration, expiry status, review status, owner status, and compensating controls. The score is explainable — every point traces back to a specific factor.

**Lifecycle tracking.** Exceptions move through a formal 14-state machine from draft to closed. Every state transition is logged with actor, timestamp, and reason. Nothing happens silently.

**GRC intelligence.** The system looks across the full portfolio to detect overlapping exceptions, conflicting approvals, duplicate waivers, and risk accumulation hotspots — patterns that are invisible when looking at one exception at a time.

**Audit-ready evidence.** A one-click audit report compiles everything: executive summary, compliance roll-ups, conflict findings, and a complete evidence timeline. Ready to hand to an auditor.

---

### SLIDE 5 — SYSTEM ARCHITECTURE

**Speaker Notes:**

The system is a standard full-stack web application with a React frontend served by Vite on port 5173 and a Node.js Express backend on port 4000.

The frontend communicates exclusively through REST APIs — there is no fake data anywhere in the frontend. Every screen fetches live from the backend with proper loading and error states.

The backend contains six service modules: the risk scoring engine, the alert engine, conflict detection, recommendation engine, exception service for lifecycle transitions, and audit service for report generation.

For storage, we use JSON files — one file per data collection. This is intentional for the prototype. It means the system runs on any machine with Node.js 18 installed, with no database setup required. The architecture is designed so that replacing the JSON store with PostgreSQL or MongoDB is a configuration change, not a rewrite.

For demo authentication, roles are stored in localStorage — Admin, Requester, Security Reviewer, Approver, and Auditor. In production, this would be replaced by SSO and server-side RBAC.

---

### SLIDE 6 — ROLE-BASED WORKFLOW

**Speaker Notes:**

The platform models the actual workflow a GRC team would follow.

A **Requester** fills out the structured GRC Intake Form — selecting the policy, the affected asset, the exception type, entering a business justification, setting start and expiry dates, and identifying compensating controls. On submission, the backend scores the risk automatically.

A **Security Reviewer** triages submitted requests in the Review Queue. They can add comments, ask clarifying questions, and forward to the approver. They see the risk score and CIA triad impact to help prioritize.

An **Approver** makes the formal decision. They can approve, reject, request more information, escalate, renew, or revoke. Every action they take is recorded with their identity, timestamp, and a note.

The **Auditor / Admin** has full read-only access to everything — the complete registry, all exception evidence files, and the audit report. They can print or export the report for formal submission.

The state machine below shows the full lifecycle. The key points are: nothing reaches "active" without a formal approval record, and every state change is immutable — it cannot be edited or deleted.

---

### SLIDE 7 — CORE FEATURES

**Speaker Notes:**

Let me briefly walk through the nine core features of the platform.

The **Exception Risk Register** is the central table. It shows every exception with risk score, status badge, CIA impact badge, conflict flag, and expiry date. It supports full-text search, multi-level filtering by risk, status, business unit, and policy category, plus CSV import from existing spreadsheets and CSV export of the full enriched registry.

The **GRC Intake Form** is a structured multi-step form that guides requesters through providing the information needed for proper risk assessment. Risk is scored automatically on the backend at submission time.

The **Review Queue** gives security reviewers and approvers a prioritized worklist. Every action from the queue — approve, reject, comment — is recorded in the exception's audit timeline.

The **Evidence File** is the full record for one exception: all metadata, the risk score with a point-by-point breakdown and plain-English explanation, the CIA impact, the lifecycle history timeline with every action logged, related alerts, and related conflict findings.

The **Risk Scoring Engine** page explains the scoring model interactively — showing the live formula, the full weight reference table, and a ranked list of all exceptions with their individual factor breakdowns.

**Continuous Monitoring Alerts** — seven alert types, continuously re-evaluated on every request. With a simulated email reminder preview showing exactly what a production notification would look like.

**GRC Intelligence** — the overlap, conflict, duplicate, and hotspot detection layer.

The **Audit Report** — executive summary, compliance roll-ups, conflict findings, recommendations, and a print/export button.

Finally, **Settings** for demo configuration, scoring reference, and system status.

---

### SLIDE 8 — RISK SCORING ENGINE

**Speaker Notes:**

The risk scoring model is the analytical core of the platform. Let me explain how it works.

Each exception receives a score between 0 and 100. The score is the sum of seven weighted factors:

**Exception Type** — the inherent risk of the type of exception. Encryption Disabled and Admin Access are the most dangerous and carry 35 points each. Firewall Bypass carries 30. These weights are based on the potential impact if the exception is exploited.

**Asset Criticality** — how sensitive is the asset being excepted? A Critical asset like a payment gateway adds 25 points. A Low-criticality asset adds 5.

**Duration** — how long has this exception been running? Anything under a week is near-zero penalty. Anything over 180 days — more than six months — adds 20 points, because long-running exceptions are statistically less likely to be actively monitored.

**Expiry Status** — is the exception past its expiry date? That adds 15 points. Expiring within the next 7 days adds 8 points.

**Review Status** — has this exception been reviewed recently? Review overdue adds 12 points.

**Owner Status** — is there an active person accountable for this exception? Orphaned adds 12, no owner set adds 10.

**Compensating Control** — if the requestor has put a mitigating control in place, we deduct 15 points.

The result is capped at 0–100 and mapped to four bands. Every point is traceable. This is deliberate — the model is rule-based, explainable, and auditable. Not black-box AI.

---

### SLIDE 9 — ALERTS & GRC INTELLIGENCE

**Speaker Notes:**

The platform has two complementary monitoring layers.

**The Alert Engine** evaluates every active exception against seven conditions on every API request. It does not require a background job or scheduler in the prototype. Alerts are live and always current.

The most severe alerts — Critical — are for overdue exceptions and active exceptions with a risk score above 81. High alerts cover orphaned owners and exceptions expiring within seven days. Medium covers missing compensating controls and review-overdue conditions. Low flags potentially vague justifications.

The email reminder simulation on the Alerts page renders exactly what a production notification email would look like — the exception ID, risk level, expiry date, owner name, and a call to action. No real email is sent in the prototype. This is a demo simulation only.

**The GRC Intelligence layer** is what makes RiskWaiver360 more than just a tracking system.

Overlap detection finds cases where two or more exceptions cover the same asset and policy simultaneously — creating ambiguity about which controls apply.

Conflict detection finds cases where the same scope has received both an approval and a rejection from different approvers — a signal of inconsistent risk governance.

Duplicate detection finds near-identical exception requests from different requesters — a signal of a communication breakdown.

Hotspot analysis aggregates exception risk by asset, business unit, owner, and policy — revealing that a system with ten Low exceptions actually carries Critical combined exposure.

These findings appear on the Intelligence page, in the dashboard, in the registry as conflict flags, and in the audit report.

---

### SLIDE 10 — COMPLIANCE & CIA ALIGNMENT

**Speaker Notes:**

Compliance alignment was built into the design from the start, not added as a label at the end.

**NIST AC-2** requires privileged access to be controlled and periodically reviewed. In RiskWaiver360, Admin Access and Privileged Access exception types carry the highest type weights. Review-overdue alerts fire for these exceptions. Every approval and revocation is in the audit trail with actor and timestamp.

**NIST PL-4** requires policy deviations to be documented and justified. Every exception in RiskWaiver360 requires a business justification — which is stored verbatim in the evidence file. The Vague Justification alert flags thin or generic justifications.

**GDPR Article 25** requires data protection by design. Encryption-Disabled and Data Access exceptions automatically score Critical and are tagged CIA: Confidentiality — immediately visible to data privacy officers and auditors.

**CIS Control 1.1** requires maintaining an asset inventory with risk context. Every exception is linked to a specific named asset. Risk is rolled up by asset into the hotspot analysis. The audit report shows which assets carry the highest exception burden.

The CIA Triad mapping on the right translates each exception type into its impact dimension. Confidentiality for encryption and data access exceptions. Integrity for admin and privileged access. Availability for firewall and network exceptions. Multiple for password and logging exceptions. This mapping appears as a badge in the registry, evidence file, risk scoring, and audit report.

The goal is that a CISO, data protection officer, or external auditor looking at any exception immediately understands its compliance context — without needing to read the technical details.

---

### SLIDE 11 — DEMO FLOW

**Speaker Notes:**

Here is the flow we will walk through in the live demonstration. There are thirteen steps across four roles.

We start on the **home / landing page** to show the value proposition and how the platform presents itself to new users.

Then we log in as a **Requester** and submit a new exception through the GRC Intake Form — choosing a policy, asset, exception type, providing a justification, setting dates, and submitting. The backend scores the risk automatically.

We switch to a **Security Reviewer**, open the Review Queue, add a comment, and forward to the approver.

We switch to the **Approver**, open the exception's Evidence File, read the risk score breakdown and recommendation, and perform a lifecycle action — approve, revoke, or escalate. We watch the timeline update.

Then we show the **Dashboard** — the portfolio overview with KPI cards, six charts, and the risk heatmap.

We open the **Exception Registry**, filter for Critical risk level, look at the conflict badge, and open an exception to show the full Evidence File.

We visit **Risk Scoring** to show the explainable formula and ranked factor breakdown.

We open **Alerts** — filter by Critical severity — and show the simulated email reminder.

We open **GRC Intelligence** to show the overlap, conflict, and hotspot findings.

Finally we open the **Audit Report** — read the executive summary, point out the conflict findings section, and click Print / Export.

---

### SLIDE 12 — LIMITATIONS & FUTURE SCOPE

**Speaker Notes:**

We want to be transparent about what this prototype is and is not.

**Authentication** is client-side localStorage only. Credentials are checked in the frontend, and the role is stored in localStorage. There is no backend RBAC and no real identity provider. In production, this would be replaced by SSO with Okta or Microsoft Entra, with server-side session management and per-role permission enforcement on every API endpoint.

**Storage** is JSON files. This works for a single-process prototype — it is not concurrency-safe for production-scale writes. The production path is PostgreSQL or MongoDB with connection pooling.

**Emails** are a simulated preview. The email card you see on the Alerts page is rendered HTML — no real email is sent. Production would use an enterprise SMTP gateway or SendGrid.

**Export** is browser print. Production would use server-side PDF generation with a digital signature option.

These are honest, known limitations. The architecture is designed for each one to have a clean production replacement path.

On the roadmap, the near-term items are real authentication and authorization, a production database, and integrations with ServiceNow, Jira, CMDB, and enterprise SIEM systems.

For AI — we have scoped future AI capabilities including NLP-based vague justification detection, anomaly detection for unusual waiver patterns, a RAG-based cybersecurity policy assistant, and predictive escalation. These are future scope only. The current prototype is fully rule-based and explainable. We believe that for a governance and audit tool, starting with explainability is the right design choice — every score, every alert, every recommendation can be traced to a specific rule.

**Closing:** RiskWaiver360 helps enterprises move from scattered exception tracking to centralized, risk-scored, lifecycle-tracked, and audit-ready GRC exception governance.

---

## PART 2 — 2-MINUTE PITCH SCRIPT

*Use this for lightning rounds, elevator pitches, or if time is strictly limited.*

---

**[0:00 – 0:20] Hook**

> Every enterprise has security policy exceptions. The problem is that nobody is tracking them. They live in emails, Excel sheets, and Slack messages. Temporary waivers become permanent. Expired exceptions are never revoked. And when the auditor asks "show me every exception, who approved it, and that it was reviewed" — teams fail. Not because they broke the rules, but because they have no record.

**[0:20 – 0:45] Solution**

> We built RiskWaiver360 — a centralized GRC exception management platform. Every exception gets a formal record, a 0-to-100 risk score calculated from seven factors, a structured approval workflow, and continuous monitoring for expiry, orphaned ownership, and risk accumulation. Every action — approval, revocation, comment — is logged immutably. One click produces a complete, print-ready audit report.

**[0:45 – 1:10] Differentiation**

> What makes RiskWaiver360 different is GRC Intelligence. The system looks across all exceptions together to detect overlapping waivers on the same asset, conflicting approvals between reviewers, duplicate requests, and risk accumulation hotspots — ten individually low exceptions on one system that together represent a critical exposure. This is the layer that no spreadsheet catches.

**[1:10 – 1:35] Technical Credibility**

> It is a full-stack working prototype. React and Vite frontend, Node.js Express backend, with a risk scoring engine, alert engine, conflict detection engine, and audit service. Every screen calls live backend APIs. The risk scoring model is rule-based and fully explainable — every point in a score traces back to a specific factor and weight.

**[1:35 – 2:00] Close**

> We align to NIST AC-2, GDPR Article 25, and CIS Controls. The platform is architected for production — SSO, backend RBAC, database persistence, SIEM integration, and AI capabilities are on the roadmap. But today, we deliver something that works, that a security team could use tomorrow, and that an auditor could trust.
>
> **RiskWaiver360. From scattered waivers to audit-ready governance.**

---

## PART 3 — 5-MINUTE DETAILED DEMO SCRIPT

*Use this for judge demos, live product walkthroughs, or recorded demos.*

---

### PRE-DEMO SETUP CHECKLIST

```
[ ] Backend running:  cd backend && npm run reset-demo && npm run dev
[ ] Frontend running: cd frontend && npm run dev
[ ] Browser: http://localhost:5173  (Chrome recommended, full screen)
[ ] Windows: close other apps, disable notifications
[ ] Have these tabs ready:
    - /  (home page)
    - /login
[ ] Know your demo accounts:
    Approver: approver@riskwaiver360.demo / Approver@123
    Auditor:  auditor@riskwaiver360.demo / Auditor@123
```

---

### STEP 1 — HOME PAGE [0:00 – 0:20]

*Navigate to `http://localhost:5173`*

> "This is the RiskWaiver360 home page. It explains the platform to new users — the problem we solve, the features, and the four workspaces each role gets. From here, any user signs in."

*Point out: capability strip, role workspace cards*

---

### STEP 2 — LOGIN AS APPROVER [0:20 – 0:35]

*Click Sign In → Enter: `approver@riskwaiver360.demo` / `Approver@123` → Solve captcha*

> "The login includes a simple math captcha — a small friction layer for the demo. Authentication here is demo-only using localStorage. In production, this would be SSO."

---

### STEP 3 — DASHBOARD OVERVIEW [0:35 – 1:00]

*Navigate to Dashboard*

> "The dashboard gives an immediate portfolio view. We have twenty exceptions in our demo dataset. Three are overdue — past their expiry date, not yet revoked. Six are orphaned — the owner has left. Average risk score across the portfolio is 82, which is in the Critical band."

*Point out: KPI cards (Overdue, Orphaned, Avg Risk), then scroll to heatmap*

> "The risk heatmap shows exception density by department and risk level. Finance and Payments have the highest concentration of High and Critical exceptions. This is where a security team focuses first."

---

### STEP 4 — EXCEPTION REGISTRY → CRITICAL FILTER [1:00 – 1:30]

*Navigate to Registry → Filter: Risk Level = Critical*

> "The registry filtered to Critical only. Every exception with a score above 81. Let me open EXC-0001 — Encryption Disabled on the Payment Gateway."

*Click the first Critical exception → Exception Details page*

> "Here is the full evidence file. Look at the risk score: 100 out of 100. It is over 180 days old, the asset is Critical, there is no compensating control, the owner is orphaned, and it is overdue. Each factor is called out in the breakdown below."

*Scroll to risk breakdown section*

> "This is what I mean by explainable scoring. Every point in that score is visible here — 35 for Encryption Disabled type, 25 for Critical asset, 20 for duration over 180 days, 15 for overdue expiry, 12 for orphaned owner, zero compensating control bonus. An auditor can verify every number."

*Scroll to Audit Timeline*

> "The timeline shows every action ever taken on this exception — submission, review comments, approvals, and any alerts that fired. This is the immutable record."

---

### STEP 5 — LIFECYCLE ACTION: REVOKE [1:30 – 1:50]

*Scroll to action buttons → Click Revoke → Confirm*

> "I will revoke this exception now. Revocation requires a confirmation. Watch the status change and the timeline update."

*Show the updated status badge and the new timeline entry*

> "The timeline immediately shows the revocation — who did it, when, and the system-recorded note. This cannot be edited or deleted."

---

### STEP 6 — RISK SCORING PAGE [1:50 – 2:10]

*Navigate to Risk Scoring*

> "The Risk Scoring page shows the full model openly. Here is the formula at the top. Below it, every exception ranked from highest to lowest score, with the individual factor points shown for each one. No black box — complete transparency."

---

### STEP 7 — ALERTS PAGE [2:10 – 2:30]

*Navigate to Alerts → Filter: Severity = Critical*

> "Alerts filtered to Critical only. Overdue exceptions, orphaned owners, Critical risk scores. Each alert links directly to the affected exception."

*Click on an expiring-soon alert → Show email simulation card*

> "This email card shows exactly what a production alert notification would look like — the exception ID, expiry date, risk level, and a link for the owner to act. In production, this goes via your email gateway. In the demo, it is a rendered preview."

---

### STEP 8 — GRC INTELLIGENCE [2:30 – 3:00]

*Navigate to Dashboard → scroll to GRC Intelligence section, or navigate to GRC Intelligence page*

> "This is the layer that no spreadsheet catches. GRC Intelligence looks across all exceptions together."

*Point out findings*

> "Overlap: EXC-0017 and EXC-0018 are both active exceptions for the same firewall rule on the same asset. Neither team knows about the other. Conflict: EXC-0019 was approved by one reviewer and rejected by another for the same scope — a governance inconsistency. Hotspot: the Payment Gateway has the highest combined exception risk of any single asset."

*If on the Intelligence page, show the remediation plan*

> "The system generates a prioritized remediation plan — which exception to address first, what action to take, and who owns it."

---

### STEP 9 — ADD EXCEPTION [3:00 – 3:25]

*Navigate to Add Exception*

> "Let me show the intake form quickly. The requester selects the policy — say, Firewall Management Policy. Selects the asset — Payment Gateway. Exception type: Firewall Bypass. Enters a justification. Sets the expiry 200 days out. No compensating control."

*Submit the form*

> "Submitted. The backend scored this instantly — watch the new exception appear in the registry. Because it is a Firewall Bypass on a Critical asset with a long duration and no compensating control, it will score High."

---

### STEP 10 — AUDIT REPORT [3:25 – 4:15]

*Navigate to Audit Report — switch to Auditor role first if needed (Settings)*

> "Finally, the audit report. This is what you hand an auditor."

*Point out sections*

> "Executive summary: total exceptions, active, overdue, orphaned, average risk score. Posture overview: what percentage are on-track versus at-risk. Roll-up by policy category — which policy categories have the most exceptions. Roll-up by business unit — which teams carry the most risk."

*Scroll to conflict findings*

> "Conflict findings — every overlap, conflicting approval, and duplicate detected by the GRC Intelligence engine, with exception IDs and recommended actions."

*Click Print / Export*

> "Print / Export opens the browser print dialog, which lets you save as PDF. The print stylesheet removes navigation and renders a clean document layout."

---

### STEP 11 — CLOSE [4:15 – 5:00]

> "Let me recap what you just saw. A complete, working GRC exception management platform — not a mock-up. Every screen called live backend APIs. We submitted an exception and watched it be scored automatically. We revoked an overdue exception and watched the immutable audit trail update. We saw the overlap and conflict intelligence that no spreadsheet would catch. And we generated a one-click audit report ready for an auditor."

> "The platform aligns to NIST AC-2, GDPR Article 25, and CIS Controls. The risk scoring model is fully rule-based and explainable — every point is accountable. AI capabilities — justification detection, anomaly detection, a RAG policy assistant — are scoped for the roadmap but not claimed today."

> "RiskWaiver360. From scattered exception tracking to centralized, risk-scored, lifecycle-tracked, and audit-ready GRC governance."

---

## PART 4 — SCREENSHOT PLACEHOLDERS

*Take screenshots of these pages/states before the presentation. Insert them into the PPT in the locations indicated in the slide content file.*

| Slide | Screenshot | Page / State |
|---|---|---|
| 2 | Problem illustration | Excel/email chaos mockup or icon collage |
| 4 | Dashboard overview | Dashboard — KPI cards + heatmap visible |
| 7 | Exception Registry | Registry — table with Critical filter + badges visible |
| 8 | Risk Score Breakdown | Exception Details — risk breakdown section of a Critical exception |
| 9 | Alerts page | Alerts — filtered to Critical, email sim card visible |
| 10 | Compliance section | Audit Report — compliance roll-up section |
| 11 (a) | Risk Scoring page | Risk Scoring — formula + ranked list |
| 11 (b) | Audit Report | Audit Report — executive summary |

---

## PART 5 — LIKELY JUDGE QUESTIONS & ANSWERS

---

**Q: The risk scoring seems arbitrary. How do you justify the specific weights?**

> The weights are based on the principle of proportional impact. Exception types that create the highest direct path to a breach — Encryption Disabled, Admin Access — receive the highest weights because their exploitation has the most severe potential consequence. Asset criticality is weighted because a firewall bypass on a payment gateway is categorically different from one on a development sandbox. Duration reflects that longer-running exceptions have statistically more time to be exploited or forgotten. The weights are configurable — in production, a security team would tune them to their own risk appetite. But the model structure — these seven factors — maps directly to the criteria any experienced security reviewer would apply manually.

---

**Q: How does this differ from existing GRC tools like ServiceNow or Archer?**

> ServiceNow and Archer are enterprise GRC platforms that are powerful but require months of configuration, significant licensing cost, and dedicated administrators. RiskWaiver360 is purpose-built specifically for exception management — it is opinionated, focused, and immediately usable. Additionally, our GRC Intelligence layer — the cross-exception overlap, conflict, and accumulation detection — is not a standard feature of those platforms out of the box. We are also explicitly designed to integrate with those platforms: ServiceNow and Jira are in our integration roadmap, so we do not compete with them, we complement them.

---

**Q: Is there any AI in this?**

> No. We are transparent about this. The current prototype is fully rule-based. The risk scores, alerts, conflict detection, and recommendations all run on deterministic logic that can be read directly in the source code. We have scoped AI capabilities — NLP-based justification analysis, anomaly detection, a RAG policy assistant — as future enhancements. We believe that for a governance and audit tool, the first implementation should be explainable. When a CISO asks "why did this score 95?" they should get a plain-English answer, not "the model assigned it." The rule-based foundation makes the AI layer something to add on top, not something to replace the core logic.

---

**Q: How would this work in a real enterprise with thousands of exceptions?**

> The architecture scales cleanly. The JSON storage is replaced with PostgreSQL or MongoDB — the service layer is identical. The API endpoints are the same. The frontend pages are the same. We have designed with pagination, filtering, and indexed queries in mind. The risk scoring engine runs in-process and is fast — scoring one exception takes microseconds. The alert engine scales by adding a scheduled background job rather than recomputing on every request. The audit report is query-based so it handles large datasets without loading everything into memory. We have been deliberate about not optimizing prematurely for scale, but we have not made any architectural decisions that would block scale.

---

**Q: What happens if someone bypasses the frontend role checks?**

> In the prototype, yes — if someone directly calls the API, the backend does not enforce role checks. This is a known prototype limitation that we have documented explicitly. In production, every API endpoint would enforce server-side RBAC using the authenticated session token. We have structured the backend service layer so that adding this middleware is additive — it does not require rewriting the business logic.

---

**Q: How does the CSV import work for existing data?**

> The import endpoint accepts a CSV in the documented template format — requester name, business unit, asset name, policy name, exception type, justification, dates, and compensating control. The backend maps name strings to internal IDs — so "Payment Gateway" maps to the correct asset record, "Alice Johnson" maps to the correct user. It validates required fields, flags mismatches as warnings, scores each row automatically, and returns an import summary with per-row results. This is designed for the realistic enterprise scenario where exceptions exist in a legacy spreadsheet and the team needs to onboard them without re-keying everything.

---

## PART 6 — CLOSING STATEMENT

*(Read exactly at the end of the presentation)*

> We built RiskWaiver360 to solve a problem that is real, widespread, and under-solved.
>
> Security policy exceptions are inevitable. Every enterprise has them. The question is whether they are tracked, justified, time-limited, monitored, and revocable — or whether they are scattered across inboxes and spreadsheets, quietly accumulating risk while nobody is watching.
>
> RiskWaiver360 makes the difference.
>
> One registry. One risk score. One audit trail. One report.
>
> From scattered exception tracking to centralized, risk-scored, lifecycle-tracked, and audit-ready GRC exception governance.
>
> Thank you.

---

## APPENDIX — DEMO ACCOUNT QUICK REFERENCE

| Role | Email | Password | Primary Action |
|---|---|---|---|
| Requester | requester@riskwaiver360.demo | Requester@123 | Submit exceptions, track own requests |
| Security Reviewer | reviewer@riskwaiver360.demo | Reviewer@123 | Triage, comment, forward |
| Approver | approver@riskwaiver360.demo | Approver@123 | Approve / reject / renew / revoke / escalate |
| Auditor / Admin | auditor@riskwaiver360.demo | Auditor@123 | Full visibility, audit report, settings |

> **Captcha:** Always shown on login. Must be solved manually. The "Use this account" button fills email and password only.

> **Reset demo data:** `cd backend && npm run reset-demo` — restores original dataset for a clean run.

---

## APPENDIX — TECHNOLOGY USED

| Layer | Technology |
|---|---|
| Frontend | React 18.3.1 · Vite 5.4.21 · React Router · Axios · Recharts · lucide-react · Custom CSS |
| Backend | Node.js 24 · Express 4 · CORS |
| Storage | JSON files (backend/data/) — no database required |
| PDF export | Browser print API |
| CSV | Native Node.js parsing + export |
| Charts | Recharts (pie, bar, line, composed) |
| Icons | lucide-react |
| Auth (demo) | localStorage role + email |

---

*End of RiskWaiver360 Final Presentation Guide*

*All AI capabilities described are future scope only. The current prototype is rule-based and explainable.*
*No real emails are sent. Email reminders are demo simulations only.*
