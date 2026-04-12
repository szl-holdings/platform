import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SCREENSHOTS = path.join(ROOT, 'screenshots');
const OUTPUT = path.join(SCREENSHOTS, 'szl-portfolio-linkedin.pdf');

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

const DARK_BG = '#080c14';
const CYAN = '#00b8d9';
const GOLD = '#d4a054';
const GREEN = '#2d6a4f';
const WHITE = '#e8e6e0';
const MUTED = '#64748b';
const ACCENT2 = '#7c3aed';

function safeImg(doc, filePath, opts = {}) {
  if (!filePath || !fs.existsSync(filePath)) return 0;
  try {
    const imgOpts = { width: opts.width ?? CONTENT_W, align: 'center' };
    if (opts.height) imgOpts.height = opts.height;
    if (opts.cover) imgOpts.cover = opts.cover;
    doc.image(filePath, opts.x ?? MARGIN, opts.y ?? doc.y, imgOpts);
    return 1;
  } catch (e) {
    console.warn(`Could not embed ${path.basename(filePath)}: ${e.message}`);
    return 0;
  }
}

function sectionHeader(doc, title, accent = CYAN) {
  doc.moveDown(0.4);
  const y = doc.y;
  doc.rect(MARGIN, y, 4, 18).fill(accent);
  doc.fillColor(WHITE).fontSize(13).font('Helvetica-Bold')
    .text(title, MARGIN + 12, y + 2, { width: CONTENT_W - 12 });
  doc.moveDown(0.5);
}

function twoColImages(doc, img1, img2, gap = 8, height = 120) {
  const w = (CONTENT_W - gap) / 2;
  const startY = doc.y;
  if (img1 && fs.existsSync(img1)) {
    try { doc.image(img1, MARGIN, startY, { width: w, height, cover: [w, height] }); } catch(e) {}
  } else {
    doc.rect(MARGIN, startY, w, height).fill('#0d1b2a');
  }
  if (img2 && fs.existsSync(img2)) {
    try { doc.image(img2, MARGIN + w + gap, startY, { width: w, height, cover: [w, height] }); } catch(e) {}
  } else {
    doc.rect(MARGIN + w + gap, startY, w, height).fill('#0d1b2a');
  }
  doc.y = startY + height + 8;
}

function pageFooter(doc, text) {
  doc.rect(0, PAGE_H - 28, PAGE_W, 28).fill('#070a10');
  doc.fillColor(MUTED).fontSize(7.5).font('Helvetica')
    .text(text, MARGIN, PAGE_H - 18, { width: CONTENT_W, align: 'center' });
}

async function generate() {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    bufferPages: true,
    info: {
      Title: 'SZL Holdings — LinkedIn Portfolio 2026',
      Author: 'Stephen Lutar',
      Subject: 'Agentic AI Operating System — Five Industries, One Architecture',
    },
  });

  const outStream = fs.createWriteStream(OUTPUT);
  doc.pipe(outStream);

  // ─── PAGE 1: COVER & LINKEDIN POST ───────────────────────────────────────
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(DARK_BG);
  doc.rect(0, 0, PAGE_W, 5).fill(CYAN);

  // Logo area
  doc.rect(MARGIN, 50, 56, 56).roundedRect(MARGIN, 50, 56, 56, 8).fill('#111827');
  doc.fillColor(CYAN).fontSize(20).font('Helvetica-Bold').text('SZL', MARGIN + 8, 68, { width: 56 });

  doc.fillColor(MUTED).fontSize(8).font('Helvetica')
    .text('SZL HOLDINGS  ·  DESIGN-PARTNER STAGE  ·  2026', MARGIN + 68, 56);
  doc.circle(MARGIN + 68 + 220, 61, 3).fill('#22c55e');

  doc.fillColor(WHITE).fontSize(26).font('Helvetica-Bold')
    .text('One agentic operating system.', MARGIN, 124, { width: CONTENT_W });
  doc.fillColor(CYAN).fontSize(26).font('Helvetica-Bold')
    .text('Five industries. One founder.', MARGIN, 152, { width: CONTENT_W });

  doc.moveDown(0.6);
  doc.fillColor(MUTED).fontSize(10).font('Helvetica')
    .text(
      'For 18 months I\'ve been building quietly. No co-founder. No external team. No VC backing. Just a clear thesis: high-stakes industries operate on incomplete information and delayed decisions. The cost is measured in contracts lost, vessels flagged, properties missed, threats undetected.',
      MARGIN, doc.y, { width: CONTENT_W, lineGap: 3 }
    );

  doc.moveDown(0.7);
  doc.fillColor(WHITE).fontSize(12).font('Helvetica-Bold')
    .text('Alloy is the execution fabric that changes this.', MARGIN, doc.y);

  doc.moveDown(0.5);
  doc.fillColor(MUTED).fontSize(9.5).font('Helvetica')
    .text(
      'Every signal — from maritime AIS feeds, legal dockets, property filings, security alerts, or executive dashboards — enters Alloy\'s 9-step pipeline. Signal to auditable action. Every step governed. Every decision explainable. Every output attributed.',
      MARGIN, doc.y, { width: CONTENT_W, lineGap: 3 }
    );

  // Stats row
  const statsY = doc.y + 12;
  const stats = [
    { label: 'DATABASE TABLES', value: '161', color: CYAN },
    { label: 'API ENDPOINTS', value: '518+', color: GOLD },
    { label: 'LIVE APPLICATIONS', value: '8', color: '#22c55e' },
    { label: 'INDUSTRIES', value: '5', color: ACCENT2 },
  ];
  const statW = CONTENT_W / 4 - 6;
  stats.forEach((s, i) => {
    const sx = MARGIN + (statW + 8) * i;
    doc.rect(sx, statsY, statW, 50).roundedRect(sx, statsY, statW, 50, 5).fill('#0f1929');
    doc.fillColor(s.color).fontSize(20).font('Helvetica-Bold').text(s.value, sx + 8, statsY + 7, { width: statW - 16 });
    doc.fillColor(MUTED).fontSize(7).font('Helvetica').text(s.label, sx + 8, statsY + 32, { width: statW - 16 });
  });

  doc.y = statsY + 58;

  // Pipeline section
  doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold').text('The Alloy Pipeline — 9 Steps, Zero Black Boxes', MARGIN, doc.y);
  doc.moveDown(0.35);

  const steps = [
    { n: '01', name: 'Ingest', desc: 'Signal enters from pack or connector' },
    { n: '02', name: 'Normalize', desc: 'Schema reconciled, entity resolved' },
    { n: '03', name: 'Evaluate', desc: 'Severity, blast radius, SLA proximity' },
    { n: '04', name: 'Recommend', desc: 'Priority scored, action proposed' },
    { n: '05', name: 'Route', desc: 'Right person, right context, right channel' },
    { n: '06', name: 'Gate', desc: 'Human approval for consequential actions' },
    { n: '07', name: 'Execute', desc: 'Action confirmed with authorization logged' },
    { n: '08', name: 'Verify', desc: 'Outcome tracked, exceptions escalated' },
    { n: '09', name: 'Audit', desc: 'Immutable record — attributable, complete' },
  ];

  const pipelineY = doc.y;
  const colW = CONTENT_W / 3 - 4;
  steps.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const sx = MARGIN + (colW + 6) * col;
    const sy = pipelineY + row * 35;
    doc.rect(sx, sy, colW, 30).roundedRect(sx, sy, colW, 30, 4).fill('#0d1b2a');
    doc.fillColor(CYAN).fontSize(8).font('Helvetica-Bold').text(s.n, sx + 7, sy + 4);
    doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold').text(s.name, sx + 26, sy + 4, { width: colW - 34 });
    doc.fillColor(MUTED).fontSize(7.5).font('Helvetica').text(s.desc, sx + 7, sy + 16, { width: colW - 14 });
  });

  doc.y = pipelineY + 3 * 35 + 6;
  doc.moveDown(0.5);

  doc.fillColor(MUTED).fontSize(8.5).font('Helvetica-BoldOblique')
    .text(
      '"Signal to confirmed action. No black boxes. No unexplained automation. Every output is source-traced and human-governed where it matters."',
      MARGIN, doc.y, { width: CONTENT_W, align: 'center' }
    );

  pageFooter(doc, 'szlholdings.com  ·  linkedin.com/in/stephenlutar  ·  April 2026');

  // ─── PAGE 2: ALLOY PLATFORM ───────────────────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(DARK_BG);

  doc.fillColor(WHITE).fontSize(20).font('Helvetica-Bold').text('Alloy — Execution Fabric', MARGIN, MARGIN);
  doc.fillColor(MUTED).fontSize(10).font('Helvetica')
    .text('The agentic spine beneath every SZL Holdings product. Every signal. Every decision. Every action. Governed.', MARGIN, MARGIN + 24, { width: CONTENT_W });

  doc.y = MARGIN + 46;

  safeImg(doc, path.join(SCREENSHOTS, 'alloy-platform', 'alloy-public-page.jpg'), { width: CONTENT_W, height: 130 });
  doc.y += 8;

  sectionHeader(doc, 'Command Home & Signal Intelligence', CYAN);
  twoColImages(
    doc,
    path.join(SCREENSHOTS, 'alloy-platform', 'alloy-command-home.jpg'),
    path.join(SCREENSHOTS, 'alloy-platform', 'alloy-signals.jpg'),
    8, 108
  );

  sectionHeader(doc, 'Operator Control Center & Decision Objects', GOLD);
  twoColImages(
    doc,
    path.join(SCREENSHOTS, 'alloy-platform', 'alloy-operator-control.jpg'),
    path.join(SCREENSHOTS, 'alloy-platform', 'alloy-decisions.jpg'),
    8, 108
  );

  sectionHeader(doc, 'Skill Registry & Connector Mesh', '#22c55e');
  twoColImages(
    doc,
    path.join(SCREENSHOTS, 'alloy-platform', 'alloy-skills.jpg'),
    path.join(SCREENSHOTS, 'alloy-platform', 'alloy-connectors.jpg'),
    8, 108
  );

  pageFooter(doc, 'Alloy — Execution Fabric & Action Spine  ·  SZL Holdings 2026');

  // ─── PAGE 3: GOVERNANCE & LINKEDIN POST ──────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(DARK_BG);

  doc.fillColor(WHITE).fontSize(20).font('Helvetica-Bold').text('Governance & The LinkedIn Post', MARGIN, MARGIN);
  doc.y = MARGIN + 30;

  sectionHeader(doc, 'Workflow Orchestration & Governance Audit', CYAN);
  twoColImages(
    doc,
    path.join(SCREENSHOTS, 'alloy-platform', 'alloy-workflows.jpg'),
    path.join(SCREENSHOTS, 'alloy-platform', 'alloy-governance.jpg'),
    8, 100
  );

  // Trust box
  const tbY = doc.y;
  doc.rect(MARGIN, tbY, CONTENT_W, 68).roundedRect(MARGIN, tbY, CONTENT_W, 68, 6).fill('#0a1929');
  doc.rect(MARGIN, tbY, 4, 68).fill(CYAN);
  doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold').text('The Alloy Trust Model', MARGIN + 14, tbY + 8);
  doc.fillColor(MUTED).fontSize(8.5).font('Helvetica')
    .text(
      'Every agent action produces a Decision Object — a structured record containing the verdict, the evidence chain, the confidence score, the approval chain, and the immutable audit hash. No black boxes. No unexplained automation. Every output is source-traced and operator/attorney-governed.',
      MARGIN + 14, tbY + 22, { width: CONTENT_W - 28, lineGap: 3 }
    );
  doc.y = tbY + 76;

  sectionHeader(doc, 'LinkedIn Post — Copy & Paste Ready', WHITE);

  const postLines = [
    'I\'ve spent 18 months building what I believe is the first agentic operating system purpose-built for high-stakes industries.',
    '',
    'One architecture. Five verticals. One founder.',
    '',
    'Here\'s what I built:',
    '',
    '→ Alloy — the 9-step execution fabric: Ingest → Normalize → Evaluate → Recommend → Route → Gate → Execute → Verify → Audit. Every agent action is governed, explainable, and human-approved where it matters.',
    '',
    '→ Lyte — Business observability. Surfaces what\'s stuck, at risk, or about to break before damage compounds. 5 urgent. 8 gaps. $5.03M at risk surfaced in real time.',
    '',
    '→ Aegis — Unified defense & intelligence command. Three workspaces (Defense, Command, Labs) sharing one data context. 7 active incidents. CVSS 9.1 detected.',
    '',
    '→ Vessels — Maritime intelligence. 1,247 vessels tracked. Dark vessel detection. Sanctions screening. Voyage economics to the TCE.',
    '',
    '→ Terra — Real estate intelligence. $319.6M pipeline tracked. Pre-foreclosure signals. Distress detection. Ownership graph analysis.',
    '',
    '→ PRISM Counsel — Litigation intelligence for plaintiff-side firms. AI outputs are source-traced and attorney-governed. Every verdict is auditable.',
    '',
    '→ Carlota Jo — Private advisory OS for UHNW clients. Preference genome. Anticipation engine. Discretion by design.',
    '',
    'The technical depth: 161 database tables · 518+ API endpoints · Skill Registry · Connector Mesh · Decision Objects · Operator Control Center.',
    '',
    'This is not a demo. These are live, running systems.',
    '',
    '#AgenticAI #AIInfrastructure #BuildingInPublic #SZLHoldings #Alloy #StartupFounder #AIGovernance #EnterpriseAI',
  ];

  postLines.forEach(line => {
    if (line === '') {
      doc.moveDown(0.3);
    } else if (line.startsWith('→')) {
      doc.fillColor(WHITE).fontSize(8.5).font('Helvetica-Bold')
        .text(line, MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 });
    } else if (line.startsWith('#')) {
      doc.fillColor('#1e3a5f').fontSize(8).font('Helvetica')
        .text(line, MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 });
    } else {
      doc.fillColor(MUTED).fontSize(9).font('Helvetica')
        .text(line, MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 });
    }
  });

  pageFooter(doc, 'Page 3  ·  Governance & LinkedIn Post  ·  SZL Holdings 2026');

  // ─── PAGE 4: WEB APP SHOWCASE ─────────────────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(DARK_BG);

  doc.fillColor(WHITE).fontSize(20).font('Helvetica-Bold').text('The SZL Holdings Ecosystem', MARGIN, MARGIN);
  doc.fillColor(MUTED).fontSize(10).font('Helvetica')
    .text('Eight production applications. One agentic architecture. Five industries.', MARGIN, MARGIN + 24, { width: CONTENT_W });

  doc.y = MARGIN + 44;

  const apps = [
    { name: 'SZL Holdings', tagline: 'Investor & Platform Hub', img: path.join(SCREENSHOTS, 'web-apps', 'szl-holdings-hero.jpg'), accent: CYAN },
    { name: 'Aegis', tagline: 'Unified Defense & Intelligence', img: path.join(SCREENSHOTS, 'web-apps', 'aegis-hero.jpg'), accent: '#ef4444' },
    { name: 'Vessels', tagline: 'Maritime Intelligence', img: path.join(SCREENSHOTS, 'web-apps', 'vessels-hero.jpg'), accent: '#38bdf8' },
    { name: 'Terra', tagline: 'Real Estate Intelligence', img: path.join(SCREENSHOTS, 'web-apps', 'terra-hero.jpg'), accent: '#22c55e' },
    { name: 'Lyte', tagline: 'Business Observability', img: path.join(SCREENSHOTS, 'web-apps', 'lyte-hero.jpg'), accent: GOLD },
    { name: 'Carlota Jo', tagline: 'Private Advisory OS', img: path.join(SCREENSHOTS, 'web-apps', 'carlota-jo-hero.jpg'), accent: '#c4a57b' },
    { name: 'PRISM Counsel', tagline: 'Litigation Intelligence', img: path.join(SCREENSHOTS, 'web-apps', 'prism-counsel-hero.jpg'), accent: '#b8975a' },
    { name: 'Stephen Lutar', tagline: 'Founder Portfolio', img: path.join(SCREENSHOTS, 'web-apps', 'stephen-hero.jpg'), accent: '#94a3b8' },
  ];

  const cardW = (CONTENT_W - 8) / 2;
  const cardH = 130;
  const startGrid = doc.y;

  apps.forEach((app, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = MARGIN + (cardW + 8) * col;
    const cy = startGrid + row * (cardH + 8);

    doc.rect(cx, cy, cardW, cardH).roundedRect(cx, cy, cardW, cardH, 5).fill('#0c1626');
    doc.rect(cx, cy, cardW, 3).fill(app.accent);

    if (fs.existsSync(app.img)) {
      try { doc.image(app.img, cx + 1, cy + 3, { width: cardW - 2, height: 90, cover: [cardW - 2, 90] }); } catch(e) {}
    } else {
      doc.rect(cx + 1, cy + 3, cardW - 2, 90).fill('#111827');
    }

    doc.fillColor(WHITE).fontSize(9.5).font('Helvetica-Bold').text(app.name, cx + 8, cy + 98);
    doc.fillColor(MUTED).fontSize(7.5).font('Helvetica').text(app.tagline, cx + 8, cy + 112);
  });

  pageFooter(doc, 'Page 4  ·  Eight Applications · One Agentic Architecture  ·  SZL Holdings 2026');

  // ─── PAGE 5: APP INTERIORS ────────────────────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(DARK_BG);

  doc.fillColor(WHITE).fontSize(20).font('Helvetica-Bold').text('Applications in Action', MARGIN, MARGIN);
  doc.fillColor(MUTED).fontSize(10).font('Helvetica')
    .text('Interior command surfaces showing Alloy-powered AI at work across industries.', MARGIN, MARGIN + 24, { width: CONTENT_W });

  doc.y = MARGIN + 46;

  sectionHeader(doc, 'Terra — Deal Pipeline ($319.6M) & Market Dashboard', '#22c55e');
  twoColImages(
    doc,
    path.join(SCREENSHOTS, 'web-apps', 'terra-pipeline.jpg'),
    path.join(SCREENSHOTS, 'web-apps', 'terra-dashboard.jpg'),
    8, 120
  );

  sectionHeader(doc, 'Lyte — Executive Command Center (5 Urgent, $5.03M at Risk)', GOLD);
  safeImg(doc, path.join(SCREENSHOTS, 'web-apps', 'lyte-executive-command.jpg'), { width: CONTENT_W, height: 120 });
  doc.y += 8;

  sectionHeader(doc, 'Vessels & PRISM Counsel — Fleet & Legal Intelligence', '#38bdf8');
  twoColImages(
    doc,
    path.join(SCREENSHOTS, 'web-apps', 'vessels-hero.jpg'),
    path.join(SCREENSHOTS, 'web-apps', 'prism-counsel-hero.jpg'),
    8, 120
  );

  sectionHeader(doc, 'Carlota Jo — Private Advisory OS', '#c4a57b');
  safeImg(doc, path.join(SCREENSHOTS, 'web-apps', 'carlota-jo-hero.jpg'), { width: CONTENT_W, height: 120 });

  pageFooter(doc, 'Page 5  ·  Applications in Action  ·  SZL Holdings 2026');

  // ─── PAGE 6: MOBILE APPS & TECHNICAL DEPTH ────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(DARK_BG);

  doc.fillColor(WHITE).fontSize(20).font('Helvetica-Bold').text('Mobile Apps & Technical Depth', MARGIN, MARGIN);
  doc.fillColor(MUTED).fontSize(10).font('Helvetica')
    .text('Native mobile experiences for each vertical built with Expo React Native.', MARGIN, MARGIN + 24, { width: CONTENT_W });

  doc.y = MARGIN + 46;

  const mobImgs = [
    { label: 'Vessels Mobile', path: path.join(SCREENSHOTS, 'mobile-apps', 'vessels-mobile-fleet.jpg') },
    { label: 'Terra Mobile', path: path.join(SCREENSHOTS, 'mobile-apps', 'terra-mobile-map.jpg') },
    { label: 'Carlota Jo Mobile', path: path.join(SCREENSHOTS, 'mobile-apps', 'carlota-jo-mobile-home.jpg') },
    { label: 'Stephen Mobile', path: path.join(SCREENSHOTS, 'mobile-apps', 'stephen-mobile-home.jpg') },
  ];

  const mobW = (CONTENT_W - 18) / 4;
  const mobH = 190;
  const mobStartY = doc.y;
  mobImgs.forEach((mob, i) => {
    const mx = MARGIN + (mobW + 6) * i;
    doc.rect(mx, mobStartY, mobW, mobH).roundedRect(mx, mobStartY, mobW, mobH, 6).fill('#0c1626');
    if (fs.existsSync(mob.path)) {
      try { doc.image(mob.path, mx + 2, mobStartY + 2, { width: mobW - 4, height: mobH - 22 }); } catch(e) {}
    }
    doc.fillColor(MUTED).fontSize(7).font('Helvetica').text(mob.label, mx + 4, mobStartY + mobH - 17, { width: mobW - 8 });
  });
  doc.y = mobStartY + mobH + 12;

  sectionHeader(doc, 'Aegis Mobile  ·  Lyte Mobile  ·  SZL Holdings Mobile', ACCENT2);

  const mob2Imgs = [
    { label: 'Aegis Mobile', path: path.join(SCREENSHOTS, 'web-apps', 'aegis-hero.jpg') },
    { label: 'Lyte Mobile', path: path.join(SCREENSHOTS, 'web-apps', 'lyte-hero.jpg') },
    { label: 'SZL Holdings Mobile', path: path.join(SCREENSHOTS, 'web-apps', 'szl-holdings-hero.jpg') },
  ];

  const mob2W = (CONTENT_W - 12) / 3;
  const mob2H = 135;
  const mob2StartY = doc.y;
  mob2Imgs.forEach((mob, i) => {
    const mx = MARGIN + (mob2W + 6) * i;
    doc.rect(mx, mob2StartY, mob2W, mob2H).roundedRect(mx, mob2StartY, mob2W, mob2H, 6).fill('#0c1626');
    if (fs.existsSync(mob.path)) {
      try { doc.image(mob.path, mx + 2, mob2StartY + 2, { width: mob2W - 4, height: mob2H - 22, cover: [mob2W - 4, mob2H - 22] }); } catch(e) {}
    }
    doc.fillColor(MUTED).fontSize(7).font('Helvetica').text(mob.label, mx + 4, mob2StartY + mob2H - 17, { width: mob2W - 8 });
  });
  doc.y = mob2StartY + mob2H + 12;

  // Technical depth box
  const tdY = doc.y;
  doc.rect(MARGIN, tdY, CONTENT_W, 110).roundedRect(MARGIN, tdY, CONTENT_W, 110, 6).fill('#0a1929');
  doc.rect(MARGIN, tdY, 4, 110).fill(GOLD);
  doc.fillColor(WHITE).fontSize(11).font('Helvetica-Bold').text('Technical Architecture — One Founder, One Codebase', MARGIN + 14, tdY + 10);

  const techCols = [
    [
      '161 database tables across 5 industries',
      '518+ REST/GraphQL API endpoints',
      '8 web applications (React + Vite + TypeScript)',
      '7 mobile apps (Expo React Native)',
    ],
    [
      'Skill Registry: versioned, approved, audited agent capabilities',
      'Connector Mesh: real-time integration health monitoring',
      'Decision Objects: structured AI outputs with confidence scores',
      'Operator Control: live agent health & policy enforcement',
    ],
  ];

  techCols.forEach((col, ci) => {
    col.forEach((item, ri) => {
      const tx = MARGIN + 14 + ci * (CONTENT_W / 2 - 10);
      const ty = tdY + 30 + ri * 16;
      doc.circle(tx + 2, ty + 5, 2).fill(CYAN);
      doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(item, tx + 10, ty, { width: CONTENT_W / 2 - 30 });
    });
  });

  doc.y = tdY + 118;

  pageFooter(doc, 'Page 6  ·  Mobile Apps & Technical Architecture  ·  SZL Holdings 2026');

  // ─── PAGE 7: CLOSING ─────────────────────────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(DARK_BG);

  const ctaH = 230;
  const ctaY = MARGIN + 20;
  doc.rect(MARGIN, ctaY, CONTENT_W, ctaH).roundedRect(MARGIN, ctaY, CONTENT_W, ctaH, 10).fill('#0d1b2a');
  doc.rect(MARGIN, ctaY, CONTENT_W, 4).fill(CYAN);

  doc.fillColor(WHITE).fontSize(22).font('Helvetica-Bold')
    .text('Ready to see Alloy in production?', MARGIN + 24, ctaY + 24, { width: CONTENT_W - 48 });
  doc.fillColor(MUTED).fontSize(10).font('Helvetica')
    .text(
      'I\'m currently in the design-partner stage. If you\'re a maritime operator, legal firm, institutional real estate investor, security operations team, or executive who wants to understand what\'s actually happening inside their business — I\'d like to talk.\n\nI built this alone. Every table, every endpoint, every pipeline stage, every governed decision surface.',
      MARGIN + 24, ctaY + 60, { width: CONTENT_W - 48, lineGap: 4 }
    );

  const linkY = ctaY + 150;
  const links = [
    { label: 'Platform', url: 'szlholdings.com' },
    { label: 'Alloy Overview', url: 'szlholdings.com/alloy-fabric' },
    { label: 'LinkedIn', url: 'linkedin.com/in/stephenlutar' },
    { label: 'Schedule a Call', url: 'szlholdings.com/contact' },
  ];
  let lx = MARGIN + 24;
  links.forEach(link => {
    const w = Math.max(doc.widthOfString(link.url) + 20, doc.widthOfString(link.label) + 20);
    doc.rect(lx, linkY, w, 32).roundedRect(lx, linkY, w, 32, 4).fill('#0f2035');
    doc.fillColor(CYAN).fontSize(7.5).font('Helvetica-Bold').text(link.label, lx + 8, linkY + 5, { width: w - 16 });
    doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica').text(link.url, lx + 8, linkY + 18, { width: w - 16 });
    lx += w + 8;
  });

  doc.fillColor(MUTED).fontSize(9).font('Helvetica-BoldOblique')
    .text('"Signal to confirmed action. No black boxes. No unexplained automation."', MARGIN + 24, ctaY + 200, { width: CONTENT_W - 48 });

  doc.y = ctaY + ctaH + 20;

  // Hashtags
  doc.fillColor('#1e3a5f').fontSize(9.5).font('Helvetica')
    .text(
      '#AgenticAI  #AIInfrastructure  #BuildingInPublic  #SZLHoldings  #Alloy  #StartupFounder  #AIGovernance  #EnterpriseAI  #MaritimeTech  #LegalTech  #PropTech  #Cybersecurity  #FinTech  #HumanInTheLoop',
      MARGIN, doc.y, { width: CONTENT_W, lineGap: 4 }
    );

  doc.moveDown(1.2);
  doc.rect(MARGIN, doc.y, CONTENT_W, 1).fill('#1e2a3a');
  doc.moveDown(0.6);

  doc.fillColor(WHITE).fontSize(13).font('Helvetica-Bold').text('Stephen Lutar', MARGIN, doc.y);
  doc.fillColor(MUTED).fontSize(9).font('Helvetica')
    .text('Founder & CEO, SZL Holdings  ·  Building command systems that close the loop from signal to decision to auditable action — across five industries, one architecture.', MARGIN, doc.y + 18, { width: CONTENT_W, lineGap: 3 });

  pageFooter(doc, '© 2026 SZL Holdings  ·  Confidential Portfolio Document  ·  szlholdings.com');

  doc.end();
  await new Promise((resolve, reject) => {
    outStream.on('finish', resolve);
    outStream.on('error', reject);
  });

  const size = fs.statSync(OUTPUT).size;
  console.log(`PDF generated: ${OUTPUT} (${(size / 1024 / 1024).toFixed(2)} MB)`);
}

generate().catch(err => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
