# RiskWaiver360 — Video Action Checklist
## Step-by-step screen actions for the demo recording

**Presenter 1 (P1): S Abhilash**
**Presenter 2 (P2): Rajath S**

---

## PRE-RECORDING SETUP

```
[ ] Open terminal window 1
    cd backend
    npm run reset-demo
    npm run dev
    → Wait for: "Server running on port 4000"

[ ] Open terminal window 2
    cd frontend
    npm run dev
    → Wait for: "Local: http://localhost:5173/"

[ ] Open Google Chrome

[ ] Navigate to: http://localhost:5173

[ ] Confirm home page loads with RiskWaiver360 title

[ ] Open a second Chrome tab, navigate to: http://localhost:5173/login
    (Keep this tab ready for role switches)

[ ] Close all other Chrome tabs

[ ] Turn off: Slack, Teams, email app, Windows notifications

[ ] Set Chrome zoom to 100%
    (Ctrl+0 to reset)

[ ] Start screen recording software — record full screen + microphone

[ ] Do a 10-second test recording and play it back
    → Confirm audio is clear and screen is visible
```

---

## SECTION 1 — Opening
**P1 speaks | ~1 minute**

```
[ ] Screen is on: http://localhost:5173 (Home page)

[ ] Scroll slowly DOWN the home page while speaking
    → Show the value proposition section
    → Show the "four workspaces" section if visible
    → Show the feature highlight strip if visible

[ ] Keep mouse still while speaking — only move mouse to point at things

[ ] DO NOT click anything in this section
```

---

## SECTION 2 — Login and Role Overview
**P1 speaks | ~1 minute**

```
[ ] Click "Sign In" button on the home page
    → OR navigate directly to: http://localhost:5173/login

[ ] Point to the login form on screen while explaining roles

[ ] DO NOT log in yet in this section
    → Just show the login page and explain the concept

[ ] At end of this section, hand over to P2 (say: "Rajath will now log in as the Requester")
```

---

## SECTION 3 — Requester Login and Submit Exception
**P2 speaks | ~2 minutes**

### 3A — Login as Requester
```
[ ] On login page: http://localhost:5173/login

[ ] Type email:    requester@riskwaiver360.demo
[ ] Type password: Requester@123

[ ] Solve captcha manually (math question — answer and submit)

[ ] Click Sign In / Login button

[ ] Wait for redirect to Requester dashboard or home
    → If redirect fails: manually navigate to http://localhost:5173
```

### 3B — Navigate to Add Exception
```
[ ] Click "Add Exception" in the left sidebar
    → OR navigate to: http://localhost:5173/add-exception
    → OR look for "New Exception" / "Submit Exception" button

[ ] Wait for the GRC Intake Form to load fully
```

### 3C — Fill the Form
```
[ ] Field: Policy Category
    → Select: "Firewall Management Policy" (or any available)

[ ] Field: Exception Type
    → Select: "Firewall Bypass" (or Admin Access for higher risk score)

[ ] Field: Asset / System
    → Select or type: "Payment Gateway" (or highest criticality available)

[ ] Field: Asset Criticality
    → Select: "Critical"

[ ] Field: Business Justification
    → Type: "Temporary firewall exception required for third-party vendor integration during migration window."

[ ] Field: Start Date
    → Select: Today's date

[ ] Field: Expiry Date
    → Select: A date 30–60 days from today

[ ] Field: Exception Owner
    → Select any available name, or type your own

[ ] Field: Approver
    → Select: Approver name / approver@riskwaiver360.demo

[ ] Field: Compensating Controls
    → Type: "Enhanced monitoring enabled. MFA required for all sessions."
    → OR toggle the "Yes" option if it is a checkbox

[ ] Slowly scroll through the completed form before submitting
    → Let viewers see all filled fields
```

### 3D — Submit
```
[ ] Click the Submit / Create Exception button

[ ] Wait for success message or redirect

[ ] IF redirected to exception details page:
    → Point out the Risk Score shown
    → Briefly show the status badge ("Submitted" or "Under Review")

[ ] IF NOT redirected, navigate to Exception Registry and find the newly created exception
```

### 3E — Logout
```
[ ] Click profile/avatar in top right

[ ] Click Logout or Sign Out

[ ] Confirm you are back at login page or home page
```

---

## SECTION 4 — Security Reviewer Login and Review Queue
**P2 speaks | ~1.5 minutes**

### 4A — Login as Security Reviewer
```
[ ] On login page: http://localhost:5173/login

[ ] Type email:    reviewer@riskwaiver360.demo
[ ] Type password: Reviewer@123

[ ] Solve captcha manually

[ ] Click Sign In

[ ] Wait for reviewer workspace to load
```

### 4B — Open Review Queue
```
[ ] Click "Review Queue" in the left sidebar
    → OR navigate to: http://localhost:5173/review-queue

[ ] Show the top-level summary cards (Pending / High Priority / Critical counts)

[ ] Point to one Critical or High-risk exception card
```

### 4C — Open Exception Details from Queue
```
[ ] Click on a Critical or High exception card in the queue

[ ] Point to the Risk Score badge (large number visible)

[ ] Point to the CIA Impact badge (Confidentiality / Integrity / etc.)

[ ] Point to the business justification text

[ ] Point to the asset name and expiry date
```

### 4D — Show Comment / Clarification Action
```
[ ] Click "Add Comment" or "Ask Clarification" button (if visible)

[ ] Type a short comment: "Please confirm compensating controls are still in place."

[ ] Click Save / Submit comment

[ ] Show the comment appearing in the timeline or comment thread

[ ] NOTE: Do NOT click Approve here — that belongs to the Approver role only
```

### 4E — Logout
```
[ ] Click profile/avatar → Logout

[ ] Confirm redirect to login page
```

---

## SECTION 5 — Approver Login and Lifecycle Actions
**P1 speaks | ~1.5 minutes**

### 5A — Login as Approver
```
[ ] On login page: http://localhost:5173/login

[ ] Type email:    approver@riskwaiver360.demo
[ ] Type password: Approver@123

[ ] Solve captcha manually

[ ] Click Sign In

[ ] Wait for approver workspace to load
```

### 5B — Navigate to a Critical Exception Evidence File
```
[ ] Click "Exception Registry" in sidebar
    → OR navigate to: http://localhost:5173/registry

[ ] Filter by Risk Level: Critical
    → Click filter dropdown → select Critical

[ ] Click "Open" / "View" / "Details" on the first Critical exception
    → Prefer: EXC-0001 or the highest-score exception
    → This should be an "Encryption Disabled" or "Admin Access" exception for maximum impact

[ ] Wait for the Exception Evidence File / Details page to load
```

### 5C — Show the Evidence File
```
[ ] Point to the large Risk Score number at the top

[ ] Scroll down slowly to show the Risk Score Factor Breakdown section
    → Each factor is listed with its point contribution
    → Point to the largest contributor

[ ] Point to the CIA Impact badge

[ ] Point to the Recommendation text (if visible)

[ ] Scroll down to the Lifecycle Timeline / Audit Timeline
    → Show all previous actions listed with timestamps
```

### 5D — Perform a Lifecycle Action
```
[ ] Find the action buttons (Approve / Reject / Revoke / Escalate / Renew)

[ ] PREFERRED ACTION FOR DEMO: Click "Revoke" on an overdue exception
    → This is visually impactful — the status changes from Active/Overdue → Revoked

[ ] If a confirmation dialog appears: click Confirm / Yes

[ ] Wait for the page to update

[ ] Point to the new entry in the Lifecycle Timeline
    → Show the "Revoked" entry with current timestamp

[ ] Stay on this page and hand back to P1 for the next section
    OR navigate to Dashboard
```

---

## SECTION 6 — Dashboard
**P1 speaks | ~1 minute**

```
[ ] Navigate to Dashboard:
    → Click "Dashboard" in left sidebar
    → OR navigate to: http://localhost:5173/dashboard

[ ] Allow the dashboard to load fully
    (charts and heatmap may take 1–2 seconds)

[ ] Point to the KPI cards at the top:
    → Total Exceptions
    → Critical / High count
    → Overdue count
    → Orphaned (owner left) count
    → Expiring soon count

[ ] Point to the Exception Health Score if visible

[ ] Scroll down slowly to show the charts section:
    → Risk distribution pie or bar chart
    → Status distribution chart

[ ] Continue scrolling to show the Risk Heatmap:
    → Point to the department/business-unit rows
    → Point to the color-coded cells (red = high risk, darker = more exceptions)
    → Mention: "Finance and Payments typically have the highest concentration"

[ ] Do NOT scroll back up — continue to next section
```

---

## SECTION 7 — Exception Registry
**P2 speaks | ~1 minute**

```
[ ] Navigate to Exception Registry:
    → Click "Registry" or "Exception Register" in left sidebar
    → OR navigate to: http://localhost:5173/registry

[ ] Wait for table to load fully

[ ] Point to the top-level summary cards if visible (Total / Active / Overdue / Critical)

[ ] Show the search box — type one letter to show it is live search
    → Then clear it

[ ] Click the Filter dropdown → select "Critical" for Risk Level
    → Show the table refreshing to show Critical only

[ ] Point to the risk score badges in the table (red = Critical)

[ ] Point to the CIA Impact badges

[ ] Point to the Status badges

[ ] Point to the Conflict badge if visible (orange or yellow flag icon)

[ ] Click the Table/Card toggle if available to show card view briefly
    → Then switch back to table view

[ ] Click "Export CSV" button
    → Show the download starting (or the browser download bar)

[ ] Click "Open" / "View" on one exception row
    → Show that it opens the same Evidence File seen in Section 5
    → Briefly point to key elements
    → Then navigate away (back to Registry or next page)
```

---

## SECTION 8 — Risk Scoring Engine
**P2 speaks | ~1.5 minutes**

```
[ ] Navigate to Risk Scoring:
    → Click "Risk Scoring" in left sidebar
    → OR navigate to: http://localhost:5173/risk-scoring

[ ] Wait for page to load

[ ] Point to the Formula section at the top:
    → Read the formula aloud as written in the script

[ ] Point to the Risk Bands visual (Low / Medium / High / Critical bar or color strip)

[ ] Scroll down to the Factor Weights reference table:
    → Point to the Exception Type rows (Encryption Disabled: 35, Admin Access: 35)
    → Point to the Asset Criticality rows (Critical: 25, High: 18)
    → Point to the Duration rows (>180 days: +20)
    → Point to Compensating Control bonus (-15)

[ ] Continue scrolling to the Highest Risk Exceptions ranked list
    → Point to the first exception in the list
    → Show the individual factor breakdown for that exception
    → Point to each factor row

[ ] If there is a CIA Impact view or toggle:
    → Switch to it briefly to show the Confidentiality / Integrity / Availability breakdown

[ ] KEY STATEMENT: "This is completely rule-based and explainable. No AI. No black box."
    → Pause slightly after this for emphasis
```

---

## SECTION 9 — Continuous Monitoring Alerts
**P1 speaks | ~1 minute**

```
[ ] Navigate to Alerts:
    → Click "Alerts" in left sidebar
    → OR navigate to: http://localhost:5173/alerts

[ ] Wait for page to load

[ ] Point to the alert summary cards at the top:
    → Critical count
    → High count
    → Medium count
    → Low count
    → Total count

[ ] Click the "Critical" filter to show only Critical alerts

[ ] Scroll through the alert cards:
    → Point to one "Overdue Exception" alert card
    → Point to one "Orphaned Owner" or "Expiring Soon" alert card

[ ] Click on one alert card to expand or open it (if interactive)

[ ] Find and show the Reminder Email Simulation card:
    → This looks like a rendered email preview card
    → Point to: Exception ID, Expiry Date, Risk Level, Owner name in the email
    → Say: "This is a simulation only — no real email is sent in the prototype"

[ ] Navigate away when done
```

---

## SECTION 10 — GRC Intelligence Center
**P1 speaks | ~1 minute**

```
[ ] Navigate to GRC Intelligence:
    → Click "GRC Intelligence" in left sidebar
    → OR navigate to: http://localhost:5173/grc-intelligence
    → OR it may be on the Dashboard — scroll to find it there

[ ] Wait for findings to load

[ ] Point to the summary count cards:
    → Total Findings
    → Overlapping Exceptions count
    → Conflicting Approvals count
    → Duplicate Waivers count
    → Risk Accumulation Hotspots count

[ ] Click the "Overlapping Exceptions" tab or section
    → Point to the exception IDs listed
    → Explain what overlap means (same asset + same policy, both active)

[ ] Click the "Conflicting Approvals" section
    → Point to an example: "Approved by X, Rejected by Y for the same scope"

[ ] Click or scroll to "Risk Accumulation Hotspots"
    → Point to the asset or business unit with the highest combined risk

[ ] Scroll to the Remediation Plan section if visible
    → Point to the prioritized action items
```

---

## SECTION 11 — Audit Report
**P2 speaks | ~1 minute**

```
[ ] Navigate to Audit Report:
    → Click "Audit Report" in left sidebar
    → OR navigate to: http://localhost:5173/audit-report

[ ] Wait for report to generate and render

[ ] Point to the Audit Readiness Status at the top (percentage or traffic light)

[ ] Point to the Executive Summary section:
    → Total exceptions, active, overdue, orphaned, average risk score

[ ] Slowly scroll down:
    → Show the Compliance Mapping table (NIST / GDPR / CIS rows)
    → Show the High-Risk Exceptions list
    → Show the GRC Intelligence Findings section

[ ] Scroll to the bottom or find the "Print / Export" button

[ ] Click the "Print / Export" or "Print Report" button
    → The browser print dialog will open
    → Let it open for 2–3 seconds on screen
    → Then press Escape to close it without printing
    → Say: "In production, this would be a server-side PDF with digital signatures"
```

---

## SECTION 12 — Settings and Future Scope
**P2 speaks | ~1 minute**

```
[ ] Navigate to Settings:
    → Click "Settings" in left sidebar
    → OR navigate to: http://localhost:5173/settings

[ ] Wait for page to load

[ ] Point to the Demo Identity / Current User section:
    → Show current role displayed

[ ] Point to the System Status section:
    → Show backend status (running / connected)
    → Show storage info (JSON demo storage)

[ ] If there is a Production Limitations section:
    → Read through the items briefly
    → Mention: localStorage auth, JSON storage, simulated emails, browser print

[ ] If there is an Enterprise Roadmap or Future Scope section:
    → Point to SSO/OIDC
    → Point to backend RBAC
    → Point to PostgreSQL / MongoDB
    → Point to ServiceNow / Jira integration

[ ] IMPORTANT — AI Statement:
    → "AI features are future scope only. The current prototype is completely rule-based and explainable."
    → Pause briefly after this
```

---

## SECTION 13 — Closing
**P1 speaks | ~30 seconds**

```
[ ] Navigate to Dashboard:
    → Click "Dashboard" in left sidebar
    → Wait for full dashboard to load including charts

[ ] Let the full dashboard be visible on screen throughout the closing statement

[ ] Do NOT click anything during the closing — let the dashboard speak for itself

[ ] After closing statement, both presenters wave / nod if on camera

[ ] Stop screen recording
```

---

## ROLE SWITCHING CHECKLIST

```
START (no login)
│
├─ Section 1: No login needed — show home page
│
├─ Section 2: No login — show login page only
│
├─ LOGIN #1: Requester
│   Email:    requester@riskwaiver360.demo
│   Password: Requester@123
│   Sections: 3 (Add Exception)
│
├─ LOGOUT #1 (after Section 3)
│   → Click profile icon → Sign Out
│
├─ LOGIN #2: Security Reviewer
│   Email:    reviewer@riskwaiver360.demo
│   Password: Reviewer@123
│   Sections: 4 (Review Queue)
│
├─ LOGOUT #2 (after Section 4)
│   → Click profile icon → Sign Out
│
├─ LOGIN #3: Approver
│   Email:    approver@riskwaiver360.demo
│   Password: Approver@123
│   Sections: 5 (Exception Details + Lifecycle Actions)
│             6 (Dashboard — stay logged in as Approver)
│             7 (Registry — stay logged in)
│             8 (Risk Scoring — stay logged in)
│             9 (Alerts — stay logged in)
│             10 (GRC Intelligence — stay logged in)
│
├─ LOGOUT #3 (optional — before Section 11 if you want to show Auditor role)
│   → Click profile icon → Sign Out
│
├─ LOGIN #4 (OPTIONAL): Auditor / Admin
│   Email:    auditor@riskwaiver360.demo
│   Password: Auditor@123
│   Sections: 11 (Audit Report — Auditor has full access)
│             12 (Settings)
│             13 (Dashboard Closing)
│
│   NOTE: If you do not want a 4th login, the Approver role can also
│   access the Audit Report and Settings — skip LOGIN #4 to save time.
│
END
```

---

## BACKUP PLAN

### If form submission fails during Section 3
```
OPTION A — Use a pre-existing exception:
→ After the failed submission, say:
   "Let me open one of our existing demo records to show what the submitted exception looks like."
→ Navigate to Exception Registry
→ Open EXC-0001 or any existing exception
→ Continue with the demo from there

OPTION B — Refresh and try again:
→ Press Ctrl+R to refresh
→ Navigate back to Add Exception
→ Re-fill the form (fields may be cleared after refresh)
→ Submit again

OPTION C — Skip to Section 4 directly:
→ If you already spent 90+ seconds on the form and submission fails:
→ Say: "The form captures all the details we described. Let me now show what happens after submission."
→ Log out as Requester, log in as Reviewer, and continue from Section 4
```

### If captcha fails
```
→ Press Ctrl+R to refresh the login page
→ A new captcha will appear
→ Read the new math question carefully and answer it
→ Do NOT press Enter rapidly — click the Submit button deliberately
→ If captcha fails 3 times in a row:
   → Check that JavaScript is enabled in Chrome
   → Clear browser cache: Ctrl+Shift+Delete → Clear cache → Reload
   → Try again
```

### If backend is not running
```
Error symptom: API errors on every page, blank data, "Failed to fetch" messages

Fix:
→ Open a new terminal
→ cd backend
→ npm run dev
→ Wait for: "Server running on port 4000"
→ Return to Chrome and refresh the page

If data looks corrupted:
→ Stop the backend (Ctrl+C)
→ npm run reset-demo
→ npm run dev
→ Refresh Chrome — data is now clean
```

### If frontend is not loading
```
Error symptom: http://localhost:5173 shows "This site can't be reached"

Fix:
→ Open a new terminal
→ cd frontend
→ npm run dev
→ Wait for Vite to compile (usually 5–10 seconds)
→ Reload Chrome
```

### If a specific page does not exist
```
→ If any sidebar link gives a 404 or blank page:
   → Do not panic — simply skip that page
   → Say: "Let me move to the next feature."
   → Continue with the next section in the script

→ GRC Intelligence may be part of the Dashboard page (scroll down)
   → If there is no dedicated /grc-intelligence route, scroll to the Intelligence section on the Dashboard
```

### If risk scores all show zero
```
→ This means the backend risk engine is not responding
→ Stop and restart the backend: Ctrl+C → npm run dev
→ Hard refresh Chrome: Ctrl+Shift+R
→ Risk scores should now populate
```

---

## BACKUP EXCEPTION RECORDS — RECOMMENDED ONES TO OPEN

If the newly submitted exception does not appear or is missing, use these existing demo records:

| Priority | Exception ID | Type | Asset | Risk Band | Why Use It |
|---|---|---|---|---|---|
| 1st choice | EXC-0001 | Encryption Disabled | Payment Gateway | Critical (100) | Highest score, most dramatic |
| 2nd choice | EXC-0003 | Admin Access | Core Banking | Critical (90+) | Admin type, orphaned owner |
| 3rd choice | EXC-0005 | Firewall Bypass | API Gateway | High (70–80) | Firewall type, good for approver demo |
| 4th choice | EXC-0007 | Password Policy | Internal HR System | Medium | Shows diversity of exception types |

> To find these: go to Registry → search for "EXC-0001" in the search bar → click Open.

---

## TIMING RECOVERY TABLE

*If you are running ahead or behind schedule, use this table.*

| Current Time | Expected Section | If Running Late: Skip or Shorten |
|---|---|---|
| 3:00 | End of Section 3 | Shorten form fill-in — just scroll through without filling every field |
| 5:00 | End of Section 4 | Skip clicking Add Comment — just point to the button |
| 7:00 | End of Section 5 | Skip performing the lifecycle action — just show the buttons |
| 9:00 | End of Section 7 | Skip Registry (Section 7) entirely — 1 minute saved |
| 11:00 | End of Section 9 | Shorten Alerts to 30 seconds |
| 12:30 | End of Section 10 | Skip Settings/Limitations (Section 12) — mention in closing sentence instead |
| 13:30 | Start of Closing | On track — deliver closing as written |
| 14:30 | End | Stop recording |

---

## CAPTCHA QUICK REFERENCE

- The captcha is a simple math problem (e.g., "What is 3 + 7?")
- Read the question, type the answer number in the input box
- Click Submit or press Enter
- If it resets the form: the answer was wrong. Refresh and try again.
- The captcha changes on every refresh — do not memorize the answer

---

## FINAL CHECKLIST BEFORE HITTING RECORD

```
[ ] Backend running on port 4000
[ ] Frontend running on port 5173
[ ] Home page loads in Chrome
[ ] All four demo accounts tested (can login and logout)
[ ] Demo data looks fresh (20 exceptions, multiple risk levels)
[ ] Screen recording software ready and tested
[ ] Microphone tested — no echo, no background noise
[ ] Phone on silent
[ ] Windows notification center: Do Not Disturb ON
[ ] Script printed or on second monitor
[ ] Both presenters know which sections they handle
[ ] Practice run complete (at least once)
[ ] Water available (speaking for 14 minutes)
```

---

*End of RiskWaiver360 Video Action Checklist*
*No source code was modified to create this file.*
