'use strict';
const pptxgen = require('pptxgenjs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// PALETTE & CONSTANTS
// ═══════════════════════════════════════════════════════════════
const BG   = '080808';   // near-black
const CARD = '1E1E1E';   // dark card
const CARD2= '141414';   // darker card accent
const RED  = 'C41010';   // primary red
const RDDK = '6E0000';   // dark red (header bands)
const RDLT = 'E84040';   // lighter red highlight
const WHT  = 'FFFFFF';
const LGR  = 'C8C8C8';   // light grey
const MGR  = '888888';   // mid grey
const YEL  = 'FFD600';   // gold/yellow accent for warnings
const F    = 'Times New Roman';

const OUT  = path.resolve(__dirname, '../RiskWaiver360_Final_Presentation_Enhanced.pptx');

// ═══════════════════════════════════════════════════════════════
// PRESENTATION INIT
// ═══════════════════════════════════════════════════════════════
const pres = new pptxgen();
pres.layout  = 'LAYOUT_16x9';   // 10" × 5.625"
pres.author  = 'S Abhilash & Rajath S — RVCE';
pres.title   = 'RiskWaiver360 — GRC Exception & Policy Waiver Management Platform';
pres.subject = 'Policy Governance & Risk Management — Societe Generale Hackathon 2026';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const mkShadow = () => ({ type:'outer', blur:10, offset:3, angle:135, color:'000000', opacity:0.45 });

// Standard content slide with header + footer bands
function cs(titleText, num) {
  const s = pres.addSlide();
  s.background = { color: BG };
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0,    w:10, h:0.62,  fill:{color:RDDK}, line:{color:RDDK} });
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.45, w:10, h:0.175, fill:{color:RDDK}, line:{color:RDDK} });
  s.addText(titleText, {
    x:0.4, y:0.07, w:8.6, h:0.48,
    fontSize:21, fontFace:F, bold:true, color:WHT, valign:'middle', margin:0
  });
  s.addText(String(num)+'/12', {
    x:8.7, y:0.07, w:1.0, h:0.48,
    fontSize:11, fontFace:F, color:LGR, align:'right', valign:'middle', margin:0
  });
  s.addText('RiskWaiver360  ·  GRC Exception & Policy Waiver Management  ·  RVCE 2026', {
    x:0.4, y:5.45, w:9.2, h:0.175,
    fontSize:8, fontFace:F, color:LGR, valign:'middle', margin:0
  });
  return s;
}

// Card (rectangle with optional border color)
function card(s, x, y, w, h, opts={}) {
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: opts.bg   || CARD  },
    line: { color: opts.bdr  || RED, width: opts.bw || 1.0 },
    shadow: mkShadow()
  });
}

// Screenshot placeholder
function ph(s, x, y, w, h, label) {
  card(s, x, y, w, h, { bg:'0F0F0F', bdr:RED, bw:1.5 });
  s.addText('[  Insert Screenshot  ]', {
    x:x+0.1, y:y+h*0.28, w:w-0.2, h:0.35,
    fontSize:11, fontFace:F, color:RED, align:'center', bold:true, italic:false, margin:0
  });
  s.addText(label, {
    x:x+0.1, y:y+h*0.52, w:w-0.2, h:0.3,
    fontSize:9.5, fontFace:F, color:LGR, align:'center', italic:true, margin:0
  });
}

// Bullet list items for addText
function bul(items, opts={}) {
  return items.map((t, i) => ({
    text: t,
    options: {
      bullet: true,
      breakLine: i < items.length-1,
      fontSize:  opts.fs    || 14,
      fontFace:  F,
      color:     opts.col   || LGR,
      bold:      opts.bold  || false,
      paraSpaceAfter: opts.gap || 6,
    }
  }));
}

// Speaker notes helper
function notes(s, text) {
  s.addNotes(text);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 1 — TITLE SLIDE
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG };

  // Left red accent bar (full height)
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:0.25, h:5.625, fill:{color:RDDK}, line:{color:RDDK} });

  // Top thin red line
  s.addShape(pres.shapes.RECTANGLE, { x:0.25, y:0, w:9.75, h:0.1, fill:{color:RED}, line:{color:RED} });

  // Bottom thin red line
  s.addShape(pres.shapes.RECTANGLE, { x:0.25, y:5.525, w:9.75, h:0.1, fill:{color:RED}, line:{color:RED} });

  // Large "360" watermark in dark red (decorative)
  s.addText('360', {
    x:5.5, y:0.8, w:4.2, h:3.5,
    fontSize:220, fontFace:F, bold:true, color:RDDK, align:'center', valign:'middle',
    transparency:60, margin:0
  });

  // GRC shield visual — circle accent
  s.addShape(pres.shapes.OVAL, {
    x:7.4, y:1.1, w:2.3, h:2.3,
    fill:{color:RDDK}, line:{color:RED, width:3},
    transparency:30
  });
  s.addShape(pres.shapes.OVAL, {
    x:7.65, y:1.35, w:1.8, h:1.8,
    fill:{color:'0A0000'}, line:{color:RDLT, width:1.5},
    transparency:20
  });
  s.addText('GRC', {
    x:7.4, y:1.95, w:2.3, h:0.6,
    fontSize:22, fontFace:F, bold:true, color:WHT, align:'center', margin:0
  });

  // Project title
  s.addText('RiskWaiver360', {
    x:0.5, y:0.7, w:7.0, h:1.1,
    fontSize:52, fontFace:F, bold:true, color:WHT, margin:0, shadow:mkShadow()
  });

  // Red accent line under title
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:1.82, w:6.8, h:0.05, fill:{color:RED}, line:{color:RED} });

  // Subtitle
  s.addText('GRC Process Exception &\nPolicy Waiver Management Platform', {
    x:0.5, y:1.92, w:6.8, h:1.0,
    fontSize:17, fontFace:F, color:RDLT, bold:false, margin:0
  });

  // Divider
  s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:3.0, w:6.8, h:0.04, fill:{color:'333333'}, line:{color:'333333'} });

  // Team info block
  const teamInfo = [
    { label:'Team',        value:'S Abhilash  ·  Rajath S' },
    { label:'Institution', value:'RVCE (RV College of Engineering), Bengaluru' },
    { label:'Track',       value:'Policy Governance & Risk Management' },
    { label:'Year',        value:'2026  ·  Societe Generale Hackathon' },
  ];

  teamInfo.forEach((row, i) => {
    const yPos = 3.1 + i * 0.52;
    s.addText(row.label.toUpperCase() + ':', {
      x:0.5, y:yPos, w:1.6, h:0.38,
      fontSize:10, fontFace:F, color:MGR, bold:true, valign:'top', margin:0
    });
    s.addText(row.value, {
      x:2.15, y:yPos, w:5.3, h:0.38,
      fontSize:13, fontFace:F, color:LGR, valign:'top', margin:0
    });
  });

  notes(s, 'Welcome everyone. This is RiskWaiver360 — our GRC Exception and Policy Waiver Management Platform, built for the Societe Generale Hackathon 2026. I\'m [S Abhilash / Rajath S] from RVCE Bengaluru. Our team built this to solve a real problem: organizations have no single place to manage, score, track, and audit policy exceptions.');
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 2 — PROBLEM STATEMENT
// ═══════════════════════════════════════════════════════════════
{
  const s = cs('The Problem — Exception Blindspot in GRC', 2);

  // Left column: problem bullets
  card(s, 0.4, 0.72, 5.6, 4.55, { bg:'151515', bdr:RED, bw:1.5 });
  s.addText('Where Do Policy Exceptions Live Today?', {
    x:0.55, y:0.78, w:5.3, h:0.42,
    fontSize:14, fontFace:F, bold:true, color:RDLT, margin:0
  });

  s.addText(bul([
    'Scattered across email threads and Slack messages',
    'Tracked informally in spreadsheets with no lifecycle control',
    'Expired exceptions left active — never revoked',
    'No central visibility for security teams or auditors',
    'Access granted "temporarily" becomes permanent without review',
    'Hidden attack paths grow where exceptions are forgotten',
  ], { fs:13.5, gap:8, col:LGR }), {
    x:0.6, y:1.3, w:5.3, h:3.6, valign:'top', margin:[4,4,4,8]
  });

  // Right column: impact cards
  const impacts = [
    { icon:'⚠', title:'Audit Risk',       desc:'No evidence trail for expired exceptions' },
    { icon:'🔓', title:'Security Gaps',    desc:'Expired firewall & access exceptions still active' },
    { icon:'📋', title:'Compliance Drift', desc:'Policies waived without proper justification' },
  ];
  impacts.forEach((item, i) => {
    const yy = 0.72 + i * 1.52;
    card(s, 6.2, yy, 3.4, 1.38, { bg:CARD2, bdr:RDLT, bw:1 });
    s.addText(item.icon + '  ' + item.title, {
      x:6.35, y:yy+0.1, w:3.1, h:0.38,
      fontSize:15, fontFace:F, bold:true, color:RDLT, margin:0
    });
    s.addText(item.desc, {
      x:6.35, y:yy+0.52, w:3.1, h:0.65,
      fontSize:12, fontFace:F, color:LGR, margin:0
    });
  });

  notes(s, 'Today, policy exceptions are managed in silos — emails, Excel files, and informal Slack approvals. The result: expired exceptions remain active, access is never revoked, and auditors cannot verify whether exceptions were justified or ever reviewed. This creates invisible compliance risk and security exposure.');
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 3 — RISK SCENARIOS
// ═══════════════════════════════════════════════════════════════
{
  const s = cs('Risk Scenarios — What Goes Wrong Without GRC Control', 3);

  const scenarios = [
    { n:'01', title:'Orphaned Access',           desc:'User left the org — access exception never revoked. Account remains open.' },
    { n:'02', title:'Overlapping Waivers',       desc:'Two exceptions approved for the same asset and policy. No one noticed.' },
    { n:'03', title:'Conflicting Approvals',     desc:'One approver approved; another rejected. System shows both records.' },
    { n:'04', title:'Long-Running Temp Access',  desc:'"Temporary" admin access from 18 months ago — still active, never reviewed.' },
    { n:'05', title:'Risk Accumulation',         desc:'15 exceptions on one critical asset. Combined exposure is extremely high.' },
    { n:'06', title:'Audit Failure',             desc:'Auditor requests evidence. No justification, no review record, no expiry trail.' },
  ];

  // 2 rows x 3 columns
  scenarios.forEach((sc, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.25 + col * 3.25;
    const y = 0.72 + row * 2.3;
    const w = 3.05;
    const h = 2.1;

    card(s, x, y, w, h, { bg:CARD2, bdr:RED, bw:1.2 });

    // Number badge
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:0.48, h:0.48, fill:{color:RED}, line:{color:RED} });
    s.addText(sc.n, { x, y, w:0.48, h:0.48, fontSize:14, fontFace:F, bold:true, color:WHT, align:'center', valign:'middle', margin:0 });

    s.addText(sc.title, {
      x:x+0.08, y:y+0.55, w:w-0.16, h:0.48,
      fontSize:13, fontFace:F, bold:true, color:WHT, margin:0
    });
    s.addText(sc.desc, {
      x:x+0.08, y:y+1.05, w:w-0.16, h:0.92,
      fontSize:11, fontFace:F, color:LGR, margin:0
    });
  });

  notes(s, 'These are real scenarios that occur in organizations without proper exception management. Each one represents an audit finding, a security vulnerability, or a compliance gap. RiskWaiver360 is designed to detect and prevent all six of these situations.');
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 4 — PROPOSED SOLUTION
// ═══════════════════════════════════════════════════════════════
{
  const s = cs('Proposed Solution — RiskWaiver360', 4);

  // 4 attribute pills
  const attrs = [
    { label:'CENTRALIZED',    sub:'Single source of truth for all exceptions' },
    { label:'RISK-SCORED',    sub:'Quantitative scoring, not guesswork' },
    { label:'LIFECYCLE-TRACKED', sub:'From intake to expiry, every step recorded' },
    { label:'AUDIT-READY',   sub:'Evidence-backed, exportable reports' },
  ];
  attrs.forEach((a, i) => {
    const x = 0.28 + i * 2.38;
    card(s, x, 0.72, 2.2, 1.3, { bg:RDDK, bdr:RED, bw:1.5 });
    s.addText(a.label, {
      x:x+0.08, y:0.82, w:2.04, h:0.44,
      fontSize:12, fontFace:F, bold:true, color:WHT, align:'center', margin:0
    });
    s.addText(a.sub, {
      x:x+0.08, y:1.3, w:2.04, h:0.6,
      fontSize:10, fontFace:F, color:LGR, align:'center', margin:0
    });
  });

  // Process flow diagram
  s.addText('Exception Lifecycle Flow', {
    x:0.4, y:2.2, w:9.2, h:0.38,
    fontSize:14, fontFace:F, bold:true, color:RED, margin:0
  });

  const steps = [
    { n:'1', label:'Structured\nIntake' },
    { n:'2', label:'Security\nReview' },
    { n:'3', label:'Approver\nDecision' },
    { n:'4', label:'Continuous\nMonitoring' },
    { n:'5', label:'Audit\nEvidence' },
  ];

  steps.forEach((st, i) => {
    const x = 0.4 + i * 1.9;
    const y = 2.68;
    // Box
    card(s, x, y, 1.65, 1.55, { bg:CARD, bdr:RED, bw:1 });
    // Number
    s.addShape(pres.shapes.OVAL, { x:x+0.56, y:y+0.1, w:0.52, h:0.52, fill:{color:RED}, line:{color:RED} });
    s.addText(st.n, { x:x+0.56, y:y+0.1, w:0.52, h:0.52, fontSize:15, fontFace:F, bold:true, color:WHT, align:'center', valign:'middle', margin:0 });
    s.addText(st.label, { x:x+0.08, y:y+0.72, w:1.5, h:0.75, fontSize:12, fontFace:F, color:LGR, align:'center', margin:0 });

    // Arrow between boxes (not after last)
    if (i < steps.length - 1) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: x+1.65, y: y+0.65, w: 0.25, h: 0.15,
        fill:{color:RED}, line:{color:RED}
      });
    }
  });

  // Closing statement
  s.addText('"Turn scattered exceptions into governed, scored, lifecycle-tracked decisions."', {
    x:0.4, y:4.45, w:9.2, h:0.72,
    fontSize:14, fontFace:F, italic:true, color:RDLT, align:'center', margin:0
  });

  notes(s, 'RiskWaiver360 is a centralized platform where every exception goes through a defined lifecycle: structured intake, security review, approver decision, continuous monitoring, and audit evidence generation. No exception falls through the cracks.');
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 5 — ARCHITECTURE
// ═══════════════════════════════════════════════════════════════
{
  const s = cs('System Architecture', 5);

  // Three tier architecture
  const layers = [
    {
      label: 'PRESENTATION LAYER',
      color: '1A0808', bdr: RDLT,
      items: ['React 18 + Vite  ·  Role-Based Workspaces', '4 Role Views: Requester / Reviewer / Approver / Auditor']
    },
    {
      label: 'API LAYER',
      color: '101010', bdr: RED,
      items: ['Node.js + Express REST API  ·  Port 4000', 'Routes: Exceptions · Approvals · Alerts · Conflicts · Audit']
    },
    {
      label: 'DATA & SERVICES LAYER',
      color: '000A00', bdr: '2E6B2E',
      items: ['JSON Flat-File Storage (Demo)  ·  600 Exception Records', 'Services: Risk Scoring · Alert Engine · GRC Intelligence · Audit']
    },
  ];

  layers.forEach((layer, i) => {
    const y = 0.72 + i * 1.55;
    card(s, 0.4, y, 9.2, 1.38, { bg:layer.color, bdr:layer.bdr, bw:1.5 });
    s.addText(layer.label, {
      x:0.58, y:y+0.1, w:9.0, h:0.36,
      fontSize:12, fontFace:F, bold:true, color:WHT, margin:0
    });
    layer.items.forEach((item, j) => {
      s.addText('›  ' + item, {
        x:0.58, y:y+0.5+j*0.38, w:9.0, h:0.36,
        fontSize:12, fontFace:F, color:LGR, margin:0
      });
    });
  });

  // Down arrows between layers — positioned IN THE GAP between boxes
  // Layer 0: y=0.72, h=1.38, bottom=2.10
  // Layer 1: y=2.27, h=1.38, bottom=3.65
  // Layer 2: y=3.82, h=1.38, bottom=5.20
  [2.10, 3.65].forEach(arrowY => {
    s.addShape(pres.shapes.RECTANGLE, { x:4.72, y:arrowY+0.01, w:0.56, h:0.14, fill:{color:RED}, line:{color:RED} });
  });

  // Engine row at bottom — must fit below layer 2 bottom (5.20) and above footer (5.45)
  // Use a compact row at y=5.22
  const engines = ['Risk Scoring', 'Alert Engine', 'GRC Intelligence', 'Audit Report'];
  s.addText('Engines:', {
    x:0.4, y:5.22, w:1.3, h:0.2,
    fontSize:9, fontFace:F, bold:true, color:MGR, valign:'middle', margin:0
  });
  engines.forEach((e, i) => {
    card(s, 1.75 + i * 2.05, 5.22, 1.85, 0.2, { bg:RDDK, bdr:RED, bw:0.7 });
    s.addText(e, {
      x:1.77+i*2.05, y:5.22, w:1.81, h:0.2,
      fontSize:9.5, fontFace:F, bold:true, color:WHT, align:'center', valign:'middle', margin:0
    });
  });

  notes(s, 'The stack is React 18 on Vite for the frontend, Node.js + Express for the API, and JSON flat-file storage for the demo. In production, this would be replaced with PostgreSQL or MongoDB. The core backend services handle risk scoring, alert generation, GRC intelligence detection, and audit report generation.');
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 6 — ROLE WORKFLOW
// ═══════════════════════════════════════════════════════════════
{
  const s = cs('Role-Based Workflow — Four Workspaces', 6);

  const roles = [
    {
      name: 'Requester',
      color: '003080', bdr: '1E5FA8',
      actions: [
        'Submit policy exception requests',
        'Track exception status & history',
        'View own risk scores',
      ]
    },
    {
      name: 'Security\nReviewer',
      color: '003320', bdr: '1E7A40',
      actions: [
        'Review submitted exceptions',
        'Assess risk and controls',
        'Request clarification or escalate',
      ]
    },
    {
      name: 'Approver',
      color: '302000', bdr: 'A07010',
      actions: [
        'Approve, reject, or revoke exceptions',
        'Add governance comments',
        'Focus on critical / high risk items',
      ]
    },
    {
      name: 'Auditor /\nAdmin',
      color: '200030', bdr: '7030A0',
      actions: [
        'Full read-only audit access',
        'GRC intelligence & risk portfolio',
        'Audit reports & system settings',
      ]
    },
  ];

  roles.forEach((role, i) => {
    const x = 0.25 + i * 2.38;
    const w = 2.22;
    // Header
    card(s, x, 0.72, w, 0.6, { bg:role.color, bdr:role.bdr, bw:2 });
    s.addText(role.name, {
      x:x+0.06, y:0.72, w:w-0.12, h:0.6,
      fontSize:13, fontFace:F, bold:true, color:WHT, align:'center', valign:'middle', margin:0
    });
    // Actions
    card(s, x, 1.35, w, 2.65, { bg:CARD2, bdr:role.bdr, bw:1 });
    role.actions.forEach((a, j) => {
      s.addText('›  ' + a, {
        x:x+0.1, y:1.45+j*0.82, w:w-0.2, h:0.72,
        fontSize:12, fontFace:F, color:LGR, margin:0
      });
    });
    // Down arrow for workflow (not after last)
    if (i < roles.length - 1) {
      s.addShape(pres.shapes.RECTANGLE, {
        x:x+w+0.05, y:0.98, w:0.1, h:0.1, fill:{color:RED}, line:{color:RED}
      });
    }
  });

  // Workflow arrows between role headers
  [2.47, 4.85, 7.23].forEach(x => {
    s.addText('▶', { x, y:0.84, w:0.25, h:0.36, fontSize:14, fontFace:F, color:RED, align:'center', margin:0 });
  });

  // Exception journey at bottom
  const flow = ['Submit', 'Under Review', 'Pending Approval', 'Active / Rejected', 'Monitored', 'Audited'];
  s.addText('Exception Status Flow:', { x:0.25, y:4.18, w:2.1, h:0.35, fontSize:11, fontFace:F, color:MGR, bold:true, margin:0 });
  flow.forEach((step, i) => {
    card(s, 2.4 + i * 1.25, 4.18, 1.1, 0.35, { bg:RDDK, bdr:RED, bw:0.7 });
    s.addText(step, { x:2.42+i*1.25, y:4.18, w:1.06, h:0.35, fontSize:9, fontFace:F, color:WHT, align:'center', valign:'middle', bold:true, margin:0 });
    if (i < flow.length - 1) s.addText('›', { x:3.5+i*1.25, y:4.18, w:0.18, h:0.35, fontSize:11, color:RED, align:'center', margin:0 });
  });

  // Audit evidence note
  s.addText('Every action is timestamped and stored in the exception history for audit evidence.', {
    x:0.25, y:4.72, w:9.5, h:0.55,
    fontSize:12, fontFace:F, italic:true, color:MGR, align:'center', margin:0
  });

  notes(s, 'RiskWaiver360 has four distinct role workspaces. Requesters submit exceptions and track status. Security Reviewers perform technical risk assessment. Approvers make the final governance decision. Auditors get full read-only access to all evidence, reports, and GRC intelligence. Each role sees only what is relevant to their function.');
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 7 — CORE FEATURES
// ═══════════════════════════════════════════════════════════════
{
  const s = cs('Core Platform Features', 7);

  const features = [
    { n:'01', title:'Exception Risk Register',    desc:'Filterable registry of all 600 exceptions. Search, filter by dept, status, risk, type.' },
    { n:'02', title:'Structured GRC Intake',      desc:'Validated intake form: exception type, asset, policy, CIA, owner, justification.' },
    { n:'03', title:'Security Review Queue',      desc:'Prioritized queue for reviewers. Checklist, risk bands, action buttons.' },
    { n:'04', title:'Exception Evidence File',    desc:'Full exception detail: lifecycle, approvals, history, GRC conflicts, risk score.' },
    { n:'05', title:'Risk Scoring Engine',        desc:'Rule-based score (0-100). Type + Asset + Duration + Expiry + Review - Controls.' },
    { n:'06', title:'Continuous Monitoring',      desc:'682 alerts: overdue, expiring soon, orphaned owner, missing controls, review due.' },
    { n:'07', title:'GRC Intelligence Center',    desc:'Detects overlaps (90), duplicates (59), conflicts, and risk accumulation hotspots (37).' },
    { n:'08', title:'Audit-Ready Reports',        desc:'Department & risk breakdown, lifecycle analysis, printable evidence packs.' },
    { n:'09', title:'Settings & Roadmap',         desc:'Dataset stats, scoring config, role matrix, limitations, and production roadmap.' },
  ];

  // 3 × 3 grid
  features.forEach((f, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.22 + col * 3.27;
    const y = 0.72 + row * 1.6;
    const w = 3.08;
    const h = 1.48;

    card(s, x, y, w, h, { bg:CARD2, bdr:RED, bw:0.8 });
    // Number
    s.addShape(pres.shapes.RECTANGLE, { x, y, w:0.44, h:0.36, fill:{color:RED}, line:{color:RED} });
    s.addText(f.n, { x, y, w:0.44, h:0.36, fontSize:11, fontFace:F, bold:true, color:WHT, align:'center', valign:'middle', margin:0 });
    // Title
    s.addText(f.title, {
      x:x+0.5, y:y+0.06, w:w-0.6, h:0.38,
      fontSize:12, fontFace:F, bold:true, color:WHT, margin:0
    });
    // Desc
    s.addText(f.desc, {
      x:x+0.08, y:y+0.52, w:w-0.16, h:0.88,
      fontSize:10.5, fontFace:F, color:LGR, margin:0
    });
  });

  notes(s, 'Nine core features make up RiskWaiver360. Each feature is live and functional in the demo. The exception registry, intake form, review queue, risk scoring engine, alert monitoring, and GRC intelligence are all interconnected and driven by the same 600-record exception dataset.');
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 8 — RISK SCORING ENGINE
// ═══════════════════════════════════════════════════════════════
{
  const s = cs('Risk Scoring Engine — Rule-Based & Explainable', 8);

  // Formula banner
  card(s, 0.4, 0.72, 9.2, 0.95, { bg:RDDK, bdr:RED, bw:1.5 });
  s.addText('Risk Score  =  Type Weight  +  Asset Criticality  +  Duration Penalty  +  Expiry Status  +  Review Penalty  +  Owner Status  −  Control Bonus', {
    x:0.55, y:0.78, w:9.0, h:0.82,
    fontSize:12.5, fontFace:F, bold:true, color:WHT, align:'center', valign:'middle', margin:0
  });

  // Scoring components
  const components = [
    { factor:'Exception Type',  range:'20 – 35 pts',  note:'Admin Access 30, Firewall 25, Encryption 35...' },
    { factor:'Asset Criticality', range:'10 – 30 pts', note:'Critical asset adds 30 pts' },
    { factor:'Duration Penalty', range:'0 – 15 pts',   note:'>90 days: +10, >180 days: +15' },
    { factor:'Expiry Status',   range:'0 – 20 pts',   note:'Overdue: +20, Expiring soon: +10' },
    { factor:'Review State',    range:'0 – 10 pts',   note:'Never reviewed: +10, Overdue: +5' },
    { factor:'Owner Status',    range:'0 – 10 pts',   note:'Inactive / unassigned owner: +10' },
    { factor:'Control Bonus',   range:'0 – 15 pts',   note:'Strong compensating control: −15' },
  ];

  s.addText('Scoring Factors', {
    x:0.4, y:1.78, w:5.8, h:0.35,
    fontSize:13, fontFace:F, bold:true, color:RED, margin:0
  });

  // Row step 0.60, card h 0.54 → col-0 last row ends at 2.2+3*0.60+0.54=4.54, plenty before bands
  components.forEach((c, i) => {
    const row = i % 4;
    const col = Math.floor(i / 4);
    const x = 0.4 + col * 4.85;
    const y = 2.2 + row * 0.60;
    card(s, x, y, 4.65, 0.54, { bg:CARD, bdr: i === 6 ? '1E6B1E' : RED, bw:0.8 });
    s.addText(c.factor, {
      x:x+0.1, y:y+0.05, w:1.9, h:0.44,
      fontSize:11, fontFace:F, bold:true, color: i===6 ? '4EC94E' : WHT, margin:0
    });
    s.addText(c.range, {
      x:x+2.05, y:y+0.05, w:1.0, h:0.44,
      fontSize:11.5, fontFace:F, bold:true, color:RDLT, margin:0
    });
    s.addText(c.note, {
      x:x+3.1, y:y+0.05, w:1.45, h:0.44,
      fontSize:9, fontFace:F, color:MGR, margin:0
    });
  });

  // Risk band display — positioned after last row (2.2 + 3*0.60 + 0.54 = 4.54), bands at 4.62
  const bands = [
    { label:'Low',      range:'0–30',  color:'2E7D32' },
    { label:'Medium',   range:'31–59', color:'F9A825' },
    { label:'High',     range:'60–79', color:'E65100' },
    { label:'Critical', range:'80–100',color:'B71C1C' },
  ];
  bands.forEach((b, i) => {
    const x = 0.4 + i * 2.3;
    card(s, x, 4.62, 2.1, 0.32, { bg:b.color, bdr:b.color, bw:0 });
    s.addText(b.label + '  ' + b.range, {
      x:x+0.05, y:4.62, w:2.0, h:0.32,
      fontSize:11.5, fontFace:F, bold:true, color:WHT, align:'center', valign:'middle', margin:0
    });
  });
  s.addText('Score Range 0–100  ·  Rule-based  ·  Explainable  ·  Audit-friendly', {
    x:0.4, y:5.0, w:9.2, h:0.3,
    fontSize:11, fontFace:F, italic:true, color:MGR, margin:0
  });

  notes(s, 'The risk scoring engine is completely rule-based and explainable. Every score is derived from a transparent formula. Auditors and reviewers can see exactly why a score is what it is. There is no machine learning — scoring is deterministic and reproducible. This makes it audit-friendly and trustworthy in a regulated environment.');
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 9 — ALERTS & GRC INTELLIGENCE
// ═══════════════════════════════════════════════════════════════
{
  const s = cs('Continuous Monitoring & GRC Intelligence', 9);

  // LEFT: Alerts
  card(s, 0.3, 0.72, 4.6, 4.55, { bg:'120808', bdr:RED, bw:1.5 });
  s.addText('Continuous Monitoring Alerts', {
    x:0.45, y:0.8, w:4.3, h:0.4,
    fontSize:14, fontFace:F, bold:true, color:RDLT, margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:0.45, y:1.24, w:4.2, h:0.03, fill:{color:RDDK}, line:{color:RDDK} });

  const alertTypes = [
    { label:'682',  desc:'Total Active Alerts', sub:'Across all monitored exceptions' },
    { label:'333',  desc:'Critical Risk',        sub:'Risk score ≥ 80 — immediate attention' },
    { label:'156',  desc:'Overdue Exceptions',   sub:'Past expiry date, still active' },
    { label:'127',  desc:'Review Overdue',       sub:'Not reviewed in 90+ days' },
    { label:' 24',  desc:'Missing Controls',     sub:'No compensating control documented' },
    { label:' 23',  desc:'Expiring Soon',        sub:'Expiry within 14 days' },
    { label:' 19',  desc:'Orphaned Owner',       sub:'Owner is inactive or unassigned' },
  ];

  alertTypes.forEach((a, i) => {
    const yy = 1.35 + i * 0.44;
    s.addText(a.label, {
      x:0.45, y:yy, w:0.7, h:0.38,
      fontSize:16, fontFace:F, bold:true, color:RDLT, align:'right', valign:'middle', margin:0
    });
    s.addText(a.desc, {
      x:1.22, y:yy+0.02, w:2.0, h:0.22,
      fontSize:11, fontFace:F, bold:true, color:WHT, margin:0
    });
    s.addText(a.sub, {
      x:1.22, y:yy+0.22, w:2.9, h:0.18,
      fontSize:9, fontFace:F, color:MGR, margin:0
    });
    if (i < alertTypes.length-1)
      s.addShape(pres.shapes.RECTANGLE, { x:0.45, y:yy+0.4, w:4.2, h:0.01, fill:{color:'222222'}, line:{color:'222222'} });
  });

  // RIGHT: GRC Intelligence
  card(s, 5.1, 0.72, 4.6, 4.55, { bg:'080812', bdr:'3060A0', bw:1.5 });
  s.addText('GRC Intelligence Center', {
    x:5.25, y:0.8, w:4.3, h:0.4,
    fontSize:14, fontFace:F, bold:true, color:'6090D0', margin:0
  });
  s.addShape(pres.shapes.RECTANGLE, { x:5.25, y:1.24, w:4.2, h:0.03, fill:{color:'203060'}, line:{color:'203060'} });

  const grcFindings = [
    { label:'186', desc:'Total GRC Findings',      sub:'Detected across 600 exceptions', color:'8888FF' },
    { label:' 27', desc:'Critical Accumulation',   sub:'Assets with stacked risk ≥ 1500', color:RDLT },
    { label:' 90', desc:'Overlapping Exceptions',  sub:'Same asset + policy, concurrent dates', color:'8888FF' },
    { label:' 59', desc:'Duplicate Waivers',       sub:'Same dept + asset + type, similar justification', color:'8888FF' },
    { label:'  0', desc:'Conflicting Approvals',   sub:'No governance conflicts detected', color:'4EC94E' },
    { label:' 37', desc:'Risk Hotspots',           sub:'Assets accumulating high combined risk', color:YEL },
  ];

  grcFindings.forEach((g, i) => {
    const yy = 1.35 + i * 0.52;
    s.addText(g.label, {
      x:5.25, y:yy, w:0.7, h:0.44,
      fontSize:16, fontFace:F, bold:true, color:g.color || '6090D0', align:'right', valign:'middle', margin:0
    });
    s.addText(g.desc, {
      x:6.02, y:yy+0.02, w:2.7, h:0.22,
      fontSize:11, fontFace:F, bold:true, color:WHT, margin:0
    });
    s.addText(g.sub, {
      x:6.02, y:yy+0.24, w:3.55, h:0.18,
      fontSize:9, fontFace:F, color:MGR, margin:0
    });
  });

  notes(s, 'The monitoring layer has two components. The Alert Engine continuously evaluates 600 exceptions and currently surfaces 682 active alerts across 7 categories. The GRC Intelligence Center uses rule-based detection to find overlapping waivers, duplicate requests, conflicting approvals, and risk accumulation hotspots — patterns that no alert alone would catch.');
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 10 — COMPLIANCE & CIA
// ═══════════════════════════════════════════════════════════════
{
  const s = cs('Compliance Alignment & CIA Impact Mapping', 10);

  // Left: Frameworks
  card(s, 0.3, 0.72, 4.6, 4.55, { bg:CARD2, bdr:RED, bw:1.5 });
  s.addText('Compliance Frameworks', {
    x:0.45, y:0.82, w:4.3, h:0.38,
    fontSize:14, fontFace:F, bold:true, color:RDLT, margin:0
  });

  const frameworks = [
    { fw:'NIST AC-2',         desc:'Account Management — exception lifecycle & access control tracking' },
    { fw:'NIST PL-4',         desc:'Rules of Behavior — policy waiver governance and documentation' },
    { fw:'GDPR Article 25',   desc:'Data Protection by Design — privacy risk captured in exception intake' },
    { fw:'CIS Control 1.1',   desc:'Inventory of Assets — asset-mapped exception registry' },
    { fw:'ISO 27001 A.9',     desc:'Access Control — enforces review, expiry, and approval workflows' },
  ];

  frameworks.forEach((f, i) => {
    const yy = 1.3 + i * 0.77;
    card(s, 0.42, yy, 4.38, 0.65, { bg:RDDK, bdr:RED, bw:0.8 });
    s.addText(f.fw, {
      x:0.52, y:yy+0.06, w:1.5, h:0.52,
      fontSize:12, fontFace:F, bold:true, color:WHT, margin:0
    });
    s.addText(f.desc, {
      x:2.1, y:yy+0.06, w:2.6, h:0.52,
      fontSize:10.5, fontFace:F, color:LGR, margin:0
    });
  });

  // Right: CIA Triad
  card(s, 5.1, 0.72, 4.6, 4.55, { bg:CARD2, bdr:'4060A0', bw:1.5 });
  s.addText('CIA Impact Classification', {
    x:5.25, y:0.82, w:4.3, h:0.38,
    fontSize:14, fontFace:F, bold:true, color:'6090D0', margin:0
  });

  const cia = [
    { tag:'C', label:'Confidentiality', color:'8060C0', desc:'Data disclosure risk if exception is misused' },
    { tag:'I', label:'Integrity',       color:'306090', desc:'Data accuracy at risk from unauthorized changes' },
    { tag:'A', label:'Availability',    color:'207040', desc:'Service disruption risk if exception expires' },
    { tag:'M', label:'Multiple',        color:'804020', desc:'Exceptions impacting more than one CIA dimension' },
  ];
  cia.forEach((c, i) => {
    const yy = 1.35 + i * 0.88;
    // Tag badge
    s.addShape(pres.shapes.OVAL, { x:5.25, y:yy, w:0.55, h:0.55, fill:{color:c.color}, line:{color:c.color} });
    s.addText(c.tag, { x:5.25, y:yy, w:0.55, h:0.55, fontSize:18, fontFace:F, bold:true, color:WHT, align:'center', valign:'middle', margin:0 });
    s.addText(c.label, { x:5.88, y:yy+0.02, w:3.6, h:0.26, fontSize:13, fontFace:F, bold:true, color:WHT, margin:0 });
    s.addText(c.desc,  { x:5.88, y:yy+0.32, w:3.6, h:0.45, fontSize:11, fontFace:F, color:LGR, margin:0 });
  });

  notes(s, 'RiskWaiver360 maps every exception to a CIA impact dimension — Confidentiality, Integrity, Availability, or Multiple. This structured mapping, combined with compliance framework alignment to NIST, GDPR, CIS, and ISO 27001, makes the platform suitable for regulatory audit environments.');
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 11 — DEMO FLOW & SCREENSHOTS
// ═══════════════════════════════════════════════════════════════
{
  const s = cs('Live Demo Walkthrough', 11);

  // Demo flow steps
  const steps = [
    { n:'1',  label:'Home Page',        caption:'Marketing + role cards' },
    { n:'2',  label:'Login',            caption:'Demo role selection' },
    { n:'3',  label:'Dashboard',        caption:'GRC Command Center' },
    { n:'4',  label:'Risk Register',    caption:'600 exceptions, filter & search' },
    { n:'5',  label:'Intake Form',      caption:'Structured exception request' },
    { n:'6',  label:'Review Queue',     caption:'Security reviewer workflow' },
  ];

  // Top flow (numbered steps)
  steps.forEach((st, i) => {
    const x = 0.3 + i * 1.6;
    card(s, x, 0.72, 1.45, 0.7, { bg:RDDK, bdr:RED, bw:1 });
    s.addText(st.n, { x:x+0.04, y:0.72, w:0.28, h:0.7, fontSize:12, fontFace:F, bold:true, color:RDLT, valign:'middle', align:'center', margin:0 });
    s.addText(st.label, { x:x+0.34, y:0.76, w:1.05, h:0.3, fontSize:11, fontFace:F, bold:true, color:WHT, margin:0 });
    s.addText(st.caption, { x:x+0.34, y:1.06, w:1.05, h:0.3, fontSize:9, fontFace:F, color:MGR, margin:0 });
    if (i < steps.length-1) s.addText('›', { x:x+1.45, y:0.88, w:0.14, h:0.38, fontSize:12, color:RED, align:'center', margin:0 });
  });

  // Second row
  const steps2 = [
    { n:'7',  label:'Evidence File',    caption:'Exception detail & history' },
    { n:'8',  label:'Risk Scoring',     caption:'Score explainer & bands' },
    { n:'9',  label:'Alerts',           caption:'682 active alerts dashboard' },
    { n:'10', label:'GRC Intelligence', caption:'186 findings, hotspots' },
    { n:'11', label:'Audit Report',     caption:'Department & lifecycle breakdown' },
    { n:'12', label:'Settings',         caption:'Config, roadmap, dataset stats' },
  ];

  steps2.forEach((st, i) => {
    const x = 0.3 + i * 1.6;
    card(s, x, 1.52, 1.45, 0.7, { bg:CARD2, bdr:RED, bw:0.8 });
    s.addText(st.n, { x:x+0.04, y:1.52, w:0.3, h:0.7, fontSize:11, fontFace:F, bold:true, color:RDLT, valign:'middle', align:'center', margin:0 });
    s.addText(st.label, { x:x+0.36, y:1.56, w:1.03, h:0.3, fontSize:10.5, fontFace:F, bold:true, color:WHT, margin:0 });
    s.addText(st.caption, { x:x+0.36, y:1.86, w:1.03, h:0.3, fontSize:9, fontFace:F, color:MGR, margin:0 });
    if (i < steps2.length-1) s.addText('›', { x:x+1.45, y:1.68, w:0.14, h:0.38, fontSize:12, color:RED, align:'center', margin:0 });
  });

  // Two screenshot placeholders
  ph(s, 0.3, 2.38, 4.6, 2.85, 'Dashboard — GRC Command Center');
  ph(s, 5.1, 2.38, 4.6, 2.85, 'GRC Intelligence Center — Findings');

  notes(s, 'The demo runs at localhost:5173. Login with any of the four demo accounts. Start as a Requester to submit an exception, then switch to Security Reviewer to assess it, then Approver to make a decision, and finally Auditor/Admin to see the full risk picture. The demo dataset has 600 pre-loaded exceptions.');
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 12 — LIMITATIONS & FUTURE SCOPE
// ═══════════════════════════════════════════════════════════════
{
  const s = cs('Prototype Limitations & Production Roadmap', 12);

  // Left: Current limitations
  card(s, 0.3, 0.72, 4.6, 4.0, { bg:'120808', bdr:RED, bw:1.5 });
  s.addText('Current Prototype', {
    x:0.45, y:0.82, w:4.3, h:0.38,
    fontSize:14, fontFace:F, bold:true, color:RDLT, margin:0
  });

  const limitations = [
    'localStorage-based demo authentication (no session security)',
    'JSON flat-file storage (not production-grade)',
    'No backend RBAC — roles enforced frontend only',
    'Email notifications are simulated (not sent)',
    'PDF export via browser print (not server-generated)',
    'Captcha is frontend-only, no CSRF protection',
    '30 demo system users only (not a real user directory)',
  ];

  s.addText(bul(limitations, { fs:12, gap:7, col:LGR }), {
    x:0.45, y:1.3, w:4.3, h:3.2, valign:'top', margin:[2,2,2,4]
  });

  // Right: Roadmap
  card(s, 5.1, 0.72, 4.6, 4.0, { bg:'080A12', bdr:'3060A0', bw:1.5 });
  s.addText('Production Roadmap', {
    x:5.25, y:0.82, w:4.3, h:0.38,
    fontSize:14, fontFace:F, bold:true, color:'6090D0', margin:0
  });

  const roadmap = [
    'SSO / OIDC integration (Okta, Azure AD)',
    'Backend RBAC with JWT-secured routes',
    'PostgreSQL or MongoDB for data persistence',
    'ServiceNow / Jira / CMDB integration',
    'IAM / Active Directory owner resolution',
    'Real PDF audit report generation',
    'AI-assisted risk scoring (future scope only)',
  ];

  s.addText(bul(roadmap, { fs:12, gap:7, col:LGR }), {
    x:5.25, y:1.3, w:4.3, h:3.2, valign:'top', margin:[2,2,2,4]
  });

  // Closing statement
  card(s, 0.3, 4.82, 9.4, 0.52, { bg:RDDK, bdr:RED, bw:1.5 });
  s.addText('"RiskWaiver360 turns scattered exceptions into centralized, risk-scored, lifecycle-tracked, audit-ready governance decisions."', {
    x:0.45, y:4.82, w:9.1, h:0.52,
    fontSize:12, fontFace:F, bold:true, italic:true, color:WHT, align:'center', valign:'middle', margin:0
  });

  notes(s, 'The prototype is honest about its current state. This is a functional demo, not a production deployment. Authentication, storage, and email are all simulated. In production, these would be replaced with enterprise-grade SSO, a real database, and backend-enforced access control. AI is called out as future scope only — the current platform is entirely rule-based.');
}

// ═══════════════════════════════════════════════════════════════
// WRITE OUTPUT
// ═══════════════════════════════════════════════════════════════
pres.writeFile({ fileName: OUT })
  .then(() => {
    console.log('✅  PPTX saved to:', OUT);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌  Error:', err);
    process.exit(1);
  });
