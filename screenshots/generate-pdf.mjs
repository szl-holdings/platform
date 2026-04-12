import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true,
  info: {
    Title: "SZL Holdings — Agentic AI Operating System Portfolio",
    Author: "Stephen Lutar",
    Subject: "LinkedIn Portfolio & Investor Overview",
    Creator: "SZL Holdings",
  },
});

const output = fs.createWriteStream(path.join(__dirname, "szl-portfolio.pdf"));
doc.pipe(output);

const pageW = doc.page.width;
const contentW = pageW - 100;

const DARK = "#0a0f1a";
const ACCENT = "#00d4aa";
const GOLD = "#c9a94e";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";

function addPage(bg = DARK) {
  doc.addPage();
  doc.rect(0, 0, pageW, doc.page.height).fill(bg);
  doc.fillColor(TEXT);
}

doc.rect(0, 0, pageW, doc.page.height).fill(DARK);

doc.fontSize(11).fillColor(MUTED).text("SZL HOLDINGS", 50, 50);
doc.fontSize(11).fillColor(ACCENT).text("PORTFOLIO OVERVIEW — APRIL 2026", 50, 65);

doc.moveDown(4);
doc.fontSize(36).fillColor(TEXT).text("One founder.", 50, 140, { width: contentW });
doc.fontSize(36).fillColor(TEXT).text("Five industries.", 50, 185, { width: contentW });
doc.fontSize(36).fillColor(ACCENT).text("One agentic architecture.", 50, 230, { width: contentW });

doc.moveDown(2);
doc.fontSize(13).fillColor(MUTED).text(
  "Stephen Lutar — Founder & CEO, SZL Holdings\nstephenlutar2@gmail.com  |  x.com/szlholdings  |  github.com/szl-holdings",
  50, 310, { width: contentW }
);

doc.moveDown(3);
doc.fontSize(14).fillColor(TEXT).text(
  "This document showcases the SZL Holdings ecosystem: 8 web applications, 7 mobile apps, " +
  "375+ database tables, 1,618+ API endpoints, and the Alloy agentic AI execution fabric — " +
  "all built by a single founder, all sharing one unified architecture.",
  50, 400, { width: contentW, lineGap: 4 }
);

doc.moveDown(2);

const stats = [
  ["8", "Web Apps"],
  ["7", "Mobile Apps"],
  ["375+", "DB Tables"],
  ["1,618+", "API Endpoints"],
  ["5", "Industries"],
  ["1", "Founder"],
];

let sx = 50;
const sy = 520;
const boxW = (contentW - 50) / 3;
for (let i = 0; i < stats.length; i++) {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const bx = sx + col * (boxW + 10);
  const by = sy + row * 65;
  doc.rect(bx, by, boxW, 55).lineWidth(1).strokeColor("#1e293b").stroke();
  doc.fontSize(22).fillColor(ACCENT).text(stats[i][0], bx + 10, by + 8, { width: boxW - 20 });
  doc.fontSize(10).fillColor(MUTED).text(stats[i][1], bx + 10, by + 35, { width: boxW - 20 });
}

// ─── PAGE 2: LINKEDIN POST ───
addPage();
doc.fontSize(11).fillColor(GOLD).text("LINKEDIN POST — CTO/EXECUTIVE TONE", 50, 50);
doc.moveDown(1);

const linkedinPost = `Most AI announcements show a chatbot. Here's what an agentic operating system actually looks like — in production, across five industries, built by one founder.

SZL Holdings runs Alloy, our agentic AI execution fabric. Every consequential action follows the same nine-step pipeline:

INGEST → TRANSFORM → ANALYZE → DECIDE → APPROVE → EXECUTE → VERIFY → AUDIT → DELIVER

Every decision object carries a confidence score, evidence chain, and approval trail. Nothing executes without human-in-the-loop governance when the stakes demand it.

One architecture. Five industries:

▸ VESSELS — Maritime intelligence. 214 vessels tracked, AIS gap detection, sanctions screening, voyage economics. Fleet operators see positions, compliance risk, and P&L in one surface.

▸ TERRA — Real estate intelligence. Distressed property discovery, ownership analysis, pipeline management. Investors and brokers get a single command surface from lead to close.

▸ AEGIS — Unified defense & intelligence. Three workspaces (Defense, Command, Labs) share one correlation engine. XDR, managed threat hunting, compliance automation.

▸ LYTE — Business observability. Approval queues, ownership gaps, decision latency, stuck workflows. Surfaces what's stuck, at risk, and about to break — before the damage compounds.

▸ CARLOTA JO — Private advisory operations. Residence operations, household systems, lifestyle administration. Discretion-first concierge intelligence for high-net-worth families.

▸ PRISM COUNSEL — Plaintiff-side litigation intelligence. Matter health, settlement intelligence, insurer behavior, statute clocks. Every AI output is source-traced and attorney-governed.

The technical depth:

• Skill Registry — Every agent capability is a versioned, composable skill. New capabilities deploy without retraining.
• Connector Mesh — Salesforce, Jira, Slack, DocuSign, GitHub — all monitored for health, latency, and error rates.
• Decision Objects — Every consequential agent output carries verdict, evidence, confidence, and approval chain.
• Operator Control Center — Factory floor visibility into every running workflow, queue depth, and capacity.
• AI Eval & Red Teaming — Promptfoo-pattern eval suites, Gray Swan adversarial catalogs, Vectara HHEM hallucination detection.
• Compound AI Pipelines — Fireworks-pattern DAG execution with parallel branching, aggregation, and smart routing.

375+ database tables. 1,618+ API endpoints. 8 web applications. 7 mobile apps.

One founder. One architecture. Every domain.

#AgenticAI #AIEngineering #FounderBuilt #SZLHoldings #NVIDIAInception #FullStack #ProductionAI`;

doc.fontSize(10.5).fillColor(TEXT).text(linkedinPost, 50, 85, {
  width: contentW,
  lineGap: 3,
});

// ─── PAGE 3: WEB APP HEROES ───
addPage();
doc.fontSize(11).fillColor(GOLD).text("WEB APPLICATIONS — HERO PAGES", 50, 50);
doc.moveDown(1);

const webHeroes = [
  ["web-apps/szl-holdings-hero.jpg", "SZL Holdings — Corporate Platform"],
  ["web-apps/aegis-firestorm-hero.jpg", "Aegis — Unified Defense & Intelligence"],
  ["web-apps/vessels-hero.jpg", "Vessels — Maritime Intelligence"],
  ["web-apps/terra-hero.jpg", "Terra — Real Estate Intelligence"],
];

let wy = 75;
for (const [img, label] of webHeroes) {
  const imgPath = path.join(__dirname, img);
  if (fs.existsSync(imgPath)) {
    doc.image(imgPath, 50, wy, { width: contentW, height: 145 });
    doc.fontSize(9).fillColor(MUTED).text(label, 50, wy + 148, { width: contentW });
    wy += 170;
  }
}

addPage();
doc.fontSize(11).fillColor(GOLD).text("WEB APPLICATIONS — HERO PAGES (CONTINUED)", 50, 50);
wy = 75;

const webHeroes2 = [
  ["web-apps/lyte-command-center-hero.jpg", "Lyte — Business Observability"],
  ["web-apps/carlota-jo-hero.jpg", "Carlota Jo — Private Advisory"],
  ["web-apps/prism-counsel-hero.jpg", "PRISM Counsel — Litigation Intelligence"],
  ["web-apps/stephen-lutar-hero.jpg", "Stephen Lutar — Founder Portfolio"],
];

for (const [img, label] of webHeroes2) {
  const imgPath = path.join(__dirname, img);
  if (fs.existsSync(imgPath)) {
    doc.image(imgPath, 50, wy, { width: contentW, height: 145 });
    doc.fontSize(9).fillColor(MUTED).text(label, 50, wy + 148, { width: contentW });
    wy += 170;
  }
}

// ─── PAGE 5: ALLOY PLATFORM ───
addPage();
doc.fontSize(11).fillColor(GOLD).text("ALLOY — AGENTIC AI EXECUTION FABRIC", 50, 50);
wy = 75;

const alloyPages = [
  ["alloy-platform/alloy-command-home.jpg", "Factory Floor — Execution Overview"],
  ["alloy-platform/alloy-decisions.jpg", "Decision Objects — Verdict, Evidence, Approval"],
  ["alloy-platform/alloy-signals.jpg", "Signal Feed — Cross-Platform Intelligence"],
  ["alloy-platform/alloy-workflows.jpg", "Workflow Orchestration — SLA & Step Tracking"],
];

for (const [img, label] of alloyPages) {
  const imgPath = path.join(__dirname, img);
  if (fs.existsSync(imgPath)) {
    doc.image(imgPath, 50, wy, { width: contentW, height: 145 });
    doc.fontSize(9).fillColor(MUTED).text(label, 50, wy + 148, { width: contentW });
    wy += 170;
  }
}

// ─── PAGE 6: ALLOY CONTINUED ───
addPage();
doc.fontSize(11).fillColor(GOLD).text("ALLOY — CONNECTORS, GOVERNANCE & ANALYTICS", 50, 50);
wy = 75;

const alloyPages2 = [
  ["alloy-platform/alloy-connectors.jpg", "Connector Mesh — Health, Latency, Error Rates"],
  ["alloy-platform/alloy-governance.jpg", "Governance & Audit — Compliance Trail"],
  ["alloy-platform/alloy-analytics.jpg", "Automation Analytics — Execution Volume & ROI"],
];

for (const [img, label] of alloyPages2) {
  const imgPath = path.join(__dirname, img);
  if (fs.existsSync(imgPath)) {
    doc.image(imgPath, 50, wy, { width: contentW, height: 145 });
    doc.fontSize(9).fillColor(MUTED).text(label, 50, wy + 148, { width: contentW });
    wy += 170;
  }
}

// ─── PAGE 7: APP DASHBOARDS ───
addPage();
doc.fontSize(11).fillColor(GOLD).text("APPLICATION DASHBOARDS — DEEP INTERIOR", 50, 50);
wy = 75;

const dashPages = [
  ["web-apps/prism-counsel-demo.jpg", "PRISM Counsel — NY Command Overview (Demo)"],
  ["web-apps/vessels-hero.jpg", "Vessels — Live Fleet & Voyage Economics"],
];

for (const [img, label] of dashPages) {
  const imgPath = path.join(__dirname, img);
  if (fs.existsSync(imgPath)) {
    doc.image(imgPath, 50, wy, { width: contentW, height: 200 });
    doc.fontSize(9).fillColor(MUTED).text(label, 50, wy + 203, { width: contentW });
    wy += 225;
  }
}

// ─── PAGE 8: ARCHITECTURE ───
addPage();
doc.fontSize(11).fillColor(GOLD).text("TECHNICAL ARCHITECTURE — 10-LAYER STACK", 50, 50);
doc.moveDown(1);

const archLayers = [
  ["LAYER 10", "AI Observability", "Real-time traces, latency heatmaps, SLO compliance"],
  ["LAYER 9", "AI Safety & Grounding", "Hallucination detection, factual claim verification"],
  ["LAYER 8", "AI Eval & Red Teaming", "Promptfoo eval suites, Gray Swan adversarial catalog"],
  ["LAYER 7", "Compound AI Pipelines", "DAG execution, parallel branching, smart routing"],
  ["LAYER 6", "Agent Orchestration", "Multi-agent delegation, A2A protocol, tool registry"],
  ["LAYER 5", "Knowledge & Memory", "Entity graph, semantic recall, thread context"],
  ["LAYER 4", "AI Gateway", "Multi-provider routing, fallback chains, cost optimization"],
  ["LAYER 3", "Alloy Execution Fabric", "9-step pipeline, decision objects, governance"],
  ["LAYER 2", "Platform Services", "Auth, notifications, audit, billing, observability"],
  ["LAYER 1", "Infrastructure", "PostgreSQL, Express, React, Expo, TypeScript"],
];

let ay = 85;
for (const [num, name, desc] of archLayers) {
  doc.rect(50, ay, contentW, 55).lineWidth(1).strokeColor("#1e293b").stroke();
  doc.fontSize(8).fillColor(ACCENT).text(num, 60, ay + 5, { width: 60 });
  doc.fontSize(12).fillColor(TEXT).text(name, 60, ay + 18, { width: contentW - 20 });
  doc.fontSize(9).fillColor(MUTED).text(desc, 60, ay + 35, { width: contentW - 20 });
  ay += 58;
}

// ─── PAGE 9: NVIDIA INCEPTION ───
addPage();
doc.fontSize(11).fillColor(GOLD).text("NVIDIA INCEPTION — INTEGRATED CAPABILITIES", 50, 50);
doc.moveDown(1);

const inceptionItems = [
  ["Promptfoo", "LLM evaluation framework with 7 assertion types — automated test suites for every agent"],
  ["Gray Swan AI", "Adversarial red teaming with 20-attack catalog across 10 categories — prompt injection to supply chain"],
  ["Vectara HHEM", "Hallucination detection via claim decomposition — grounding score for every factual assertion"],
  ["Fireworks AI", "Compound AI pipeline engine — DAG orchestration with parallel branching and smart routing"],
  ["Tavily", "Real-time web search integration — agents can ground responses in live internet data"],
  ["Twelve Labs", "Video understanding and search — multimodal intelligence for surveillance and media analysis"],
];

let iy = 85;
for (const [name, desc] of inceptionItems) {
  doc.rect(50, iy, contentW, 65).lineWidth(1).strokeColor("#1e293b").stroke();
  doc.fontSize(14).fillColor(ACCENT).text(name, 60, iy + 8, { width: contentW - 20 });
  doc.fontSize(10).fillColor(TEXT).text(desc, 60, iy + 30, { width: contentW - 20, lineGap: 2 });
  iy += 70;
}

doc.moveDown(2);
doc.fontSize(11).fillColor(MUTED).text(
  "All capabilities are production-integrated across the SZL platform — not prototypes or demos.",
  50, iy + 20, { width: contentW }
);

// ─── PAGE 10: CONTACT ───
addPage();

doc.fontSize(36).fillColor(TEXT).text("Let's talk.", 50, 200, { width: contentW });
doc.moveDown(1);
doc.fontSize(14).fillColor(MUTED).text(
  "Stephen Lutar\nFounder & CEO, SZL Holdings\n\nstephenlutar2@gmail.com\nx.com/szlholdings\ngithub.com/szl-holdings",
  50, 280, { width: contentW, lineGap: 4 }
);

doc.moveDown(4);
doc.fontSize(10).fillColor(ACCENT).text(
  "This portfolio was generated programmatically from live, running applications.\n" +
  "Every screenshot in this document was captured from production code — not mockups.",
  50, 440, { width: contentW, lineGap: 2 }
);

doc.end();

output.on("finish", () => {
  const stats = fs.statSync(path.join(__dirname, "szl-portfolio.pdf"));
  console.log(`PDF generated: ${(stats.size / 1024).toFixed(0)} KB`);
});
