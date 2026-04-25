import { jsPDF } from "jspdf";

const SZL_DARK = [7, 10, 16] as [number, number, number];
const SZL_SURFACE = [14, 20, 32] as [number, number, number];
const SZL_ACCENT = [201, 168, 92] as [number, number, number];
const SZL_ACCENT_DIM = [201, 168, 92, 0.12] as [number, number, number, number];
const SZL_BLUE = [110, 168, 216] as [number, number, number];
const SZL_TEXT = [220, 215, 200] as [number, number, number];
const SZL_MUTED = [100, 110, 125] as [number, number, number];
const SZL_BORDER = [35, 45, 65] as [number, number, number];
const SZL_GREEN = [91, 170, 138] as [number, number, number];
const SZL_RED = [201, 96, 112] as [number, number, number];
const SZL_YELLOW = [201, 168, 92] as [number, number, number];

type RGBTuple = [number, number, number];

function setFill(doc: jsPDF, color: RGBTuple) {
  doc.setFillColor(color[0], color[1], color[2]);
}

function setDraw(doc: jsPDF, color: RGBTuple) {
  doc.setDrawColor(color[0], color[1], color[2]);
}

function setTextColor(doc: jsPDF, color: RGBTuple) {
  doc.setTextColor(color[0], color[1], color[2]);
}

function drawPageBackground(doc: jsPDF) {
  setFill(doc, SZL_DARK);
  doc.rect(0, 0, 210, 297, "F");
}

function drawHeaderBar(doc: jsPDF, pageNum: number, totalPages: number, label: string) {
  setFill(doc, SZL_SURFACE);
  doc.rect(0, 0, 210, 14, "F");
  setDraw(doc, SZL_BORDER);
  doc.setLineWidth(0.2);
  doc.line(0, 14, 210, 14);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_ACCENT);
  doc.text("SZL HOLDINGS · A11OY", 12, 9);

  doc.setFont("helvetica", "normal");
  setTextColor(doc, SZL_MUTED);
  doc.text(label.toUpperCase(), 210 / 2, 9, { align: "center" });
  doc.text(`${pageNum} / ${totalPages}`, 198, 9, { align: "right" });
}

function drawFooterBar(doc: jsPDF) {
  const y = 287;
  setDraw(doc, SZL_BORDER);
  doc.setLineWidth(0.2);
  doc.line(12, y, 198, y);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  setTextColor(doc, SZL_MUTED);
  doc.text("© 2026 SZL Holdings · szlholdings.com · Confidential — For distribution with attribution", 12, y + 5);
  doc.text("2026", 198, y + 5, { align: "right" });
}

function drawAccentRule(doc: jsPDF, x: number, y: number, w: number) {
  setFill(doc, SZL_ACCENT);
  doc.rect(x, y, w, 1.5, "F");
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  fontSize: number,
  color: RGBTuple,
  style: "normal" | "bold" = "normal",
): number {
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", style);
  setTextColor(doc, color);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function drawSectionBadge(doc: jsPDF, label: string, x: number, y: number) {
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_ACCENT);
  doc.text(label.toUpperCase(), x, y);
}

function buildPhilosophyDoc(): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const totalPages = 6;
  const cx = 12;
  const cw = 186;

  // ─── Page 1: Cover ───────────────────────────────────────────────────────
  drawPageBackground(doc);

  // Decorative top accent
  setFill(doc, SZL_ACCENT);
  doc.rect(0, 0, 210, 3, "F");

  // Grid texture visual hint
  setDraw(doc, SZL_BORDER);
  doc.setLineWidth(0.1);
  for (let gx = 0; gx <= 210; gx += 24) doc.line(gx, 3, gx, 297);
  for (let gy = 3; gy <= 297; gy += 24) doc.line(0, gy, 210, gy);

  // Cover surface
  setFill(doc, SZL_SURFACE);
  doc.roundedRect(cx, 40, cw, 200, 4, 4, "F");
  setDraw(doc, SZL_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(cx, 40, cw, 200, 4, 4, "S");

  // Accent bar on cover card
  drawAccentRule(doc, cx, 50, 30);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_ACCENT);
  doc.text("A11OY · THE GOVERNING PHILOSOPHY", cx + 6, 60);

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_TEXT);
  const titleLines = doc.splitTextToSize("A11OY Philosophy Whitepaper", cw - 12);
  doc.text(titleLines, cx + 6, 82);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  setTextColor(doc, SZL_MUTED);
  const subtitleLines = doc.splitTextToSize(
    "Human Judgment · Machine Intelligence · Structural Governance · Provable Accountability",
    cw - 12,
  );
  doc.text(subtitleLines, cx + 6, 108);

  // Divider
  setDraw(doc, SZL_BORDER);
  doc.setLineWidth(0.3);
  doc.line(cx + 6, 128, cx + cw - 6, 128);

  // Summary block
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  setTextColor(doc, SZL_MUTED);
  const summaryLines = doc.splitTextToSize(
    "A11OY is not a product. It is the governing philosophy behind Counsel — the enterprise AI platform built by SZL Holdings. A11OY holds that great enterprise systems are alloys: multiple elements combined under structural pressure into something stronger than any single part could ever be.",
    cw - 18,
  );
  doc.text(summaryLines, cx + 6, 136);

  // Meta footer within cover
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_ACCENT);
  doc.text("SZL Holdings", cx + 6, 228);
  doc.setFont("helvetica", "normal");
  setTextColor(doc, SZL_MUTED);
  doc.text("Washington, D.C. · London · Singapore", cx + 6, 235);
  doc.text("2026", cx + 6, 242);

  drawFooterBar(doc);

  // ─── Page 2: The Alloy Thesis ─────────────────────────────────────────────
  doc.addPage();
  drawPageBackground(doc);
  drawHeaderBar(doc, 2, totalPages, "The Alloy Thesis");

  let y = 28;

  drawSectionBadge(doc, "The Core Argument", cx, y);
  y += 7;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_TEXT);
  const h2Lines = doc.splitTextToSize("Steel is stronger than iron. Not by subtraction — by fusion.", cw);
  doc.text(h2Lines, cx, y);
  y += h2Lines.length * 9 + 4;

  drawAccentRule(doc, cx, y, 20);
  y += 8;

  const thesisParas = [
    "Metallurgists discovered centuries ago that combining elements creates properties that neither possesses alone. Steel — iron and carbon — doesn't just add hardness. It creates a new material category with properties emergent from the fusion, not additive from the parts.",
    "The same principle applies to enterprise AI. Human judgment and machine intelligence are not opponents competing for the same role. Structural governance and operational autonomy are not contradictions that must be traded off. They are elements. Combined correctly, under architectural pressure, with precision — they form an alloy that no single element can replicate.",
    "A11OY names this fusion. Counsel is its product implementation. Every primitive in the platform — Proof Chain, Covenant Policy, Outcome Graph, Monte Carlo Engine, Event Fabric, Domain-Pack Architecture — is one element of A11OY made executable.",
  ];

  for (const para of thesisParas) {
    y = addWrappedText(doc, para, cx, y, cw, 5.5, 9.5, SZL_MUTED);
    y += 5;
  }

  y += 6;
  drawSectionBadge(doc, "The Central Claim", cx, y);
  y += 7;

  setFill(doc, [18, 28, 48]);
  doc.roundedRect(cx, y, cw, 28, 3, 3, "F");
  setDraw(doc, SZL_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(cx, y, cw, 28, 3, 3, "S");
  drawAccentRule(doc, cx, y, 3);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_TEXT);
  const claimLines = doc.splitTextToSize(
    "Autonomy without governance is reckless. Governance without autonomy is paralysis. A11OY is the fusion.",
    cw - 12,
  );
  doc.text(claimLines, cx + 7, y + 9);
  y += 36;

  y = addWrappedText(
    doc,
    "This is not a rhetorical positioning. It is a structural description of what the platform does and does not do. Every autonomous action in Counsel passes through a human approval gate. Every governed decision is informed by AI intelligence operating at enterprise scale. The elements are inseparable by design.",
    cx, y, cw, 5.5, 9.5, SZL_MUTED,
  );

  drawFooterBar(doc);

  // ─── Page 3: The Four Elements ───────────────────────────────────────────
  doc.addPage();
  drawPageBackground(doc);
  drawHeaderBar(doc, 3, totalPages, "The Four Elements");

  y = 28;
  drawSectionBadge(doc, "The Four Elements of A11OY", cx, y);
  y += 7;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_TEXT);
  doc.text("Each element is necessary. None is sufficient alone.", cx, y);
  y += 12;

  const elements = [
    {
      num: "01",
      label: "Human Judgment",
      tagline: "The irreducible core",
      body: "Machines classify. Machines rank. Machines recommend. But consequential decisions — the ones with real stakes, real accountability, real exposure — require a human to own them. A11OY doesn't try to remove human judgment. It makes human judgment sharper, faster, and traceable. The operator sees the right signal at the right moment, with the right context, and makes the call. The record follows them forever.",
    },
    {
      num: "02",
      label: "Machine Intelligence",
      tagline: "Signal at scale",
      body: "Enterprise environments produce more signal than any human team can process manually. Machine intelligence — pattern recognition, correlation, anomaly detection, probabilistic modeling — handles the scale problem. The machine doesn't decide. It surfaces, ranks, and prepares the decision for the human. Monte Carlo simulation shows the consequence distribution before the decision is made, not after.",
    },
    {
      num: "03",
      label: "Structural Governance",
      tagline: "The architecture of trust",
      body: "Governance that lives in documentation is theater. Governance that lives in the architecture is structural. A11OY builds governance into the execution layer — not as a UI overlay, not as a configurable feature, but as the actual execution fabric. The approval gate is in the code. Covenant Policy is enforced before execution, not reviewed after. This guarantee is what enterprise buyers actually need.",
    },
    {
      num: "04",
      label: "Provable Accountability",
      tagline: "Show your work",
      body: "In the age of AI-assisted decisions, accountability requires evidence. Who approved this? On what basis? With what confidence? What actually happened? A11OY's Proof Chain answers every question — a SHA-256 hashed, tamper-evident, actor-attributed record of every consequential action in the system. Not logging. Proof. Exportable for compliance, capital review, and customer diligence.",
    },
  ];

  for (const el of elements) {
    setFill(doc, SZL_SURFACE);
    doc.roundedRect(cx, y, cw, 38, 2, 2, "F");
    setDraw(doc, SZL_BORDER);
    doc.setLineWidth(0.2);
    doc.roundedRect(cx, y, cw, 38, 2, 2, "S");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    setTextColor(doc, SZL_ACCENT);
    doc.text(el.num, cx + 5, y + 8);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    setTextColor(doc, SZL_TEXT);
    doc.text(el.label, cx + 14, y + 8);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    setTextColor(doc, SZL_MUTED);
    doc.text(el.tagline.toUpperCase(), cx + 14, y + 14);

    const bodyLines = doc.splitTextToSize(el.body, cw - 18);
    doc.setFontSize(8.5);
    setTextColor(doc, SZL_MUTED);
    doc.text(bodyLines, cx + 5, y + 22);

    y += 44;
  }

  drawFooterBar(doc);

  // ─── Page 4: The Six Primitives ──────────────────────────────────────────
  doc.addPage();
  drawPageBackground(doc);
  drawHeaderBar(doc, 4, totalPages, "The Six Primitives");

  y = 28;
  drawSectionBadge(doc, "Six Primitives — Philosophy Made Architecture", cx, y);
  y += 7;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_TEXT);
  const primH = doc.splitTextToSize("Each primitive is A11OY in code — one element made executable.", cw);
  doc.text(primH, cx, y);
  y += primH.length * 8 + 6;

  const primitives = [
    {
      num: "01", name: "Proof Chain", element: "Provable Accountability",
      body: "SHA-256 hashed, tamper-evident, actor-attributed records of every consequential action. Not logging — structural proof. Exportable for compliance, capital review, and customer diligence. Every entry is attributed to a real actor with a real authorization basis.",
    },
    {
      num: "02", name: "Covenant Policy", element: "Structural Governance",
      body: "Policy enforced at the execution layer before any consequential action. Human-in-the-loop is structural — not configurable away. Every Covenant Policy decision is recorded in the Proof Chain alongside execution records. The guarantee exists at the code layer, not the UI layer.",
    },
    {
      num: "03", name: "Outcome Graph", element: "Human Judgment (cumulative)",
      body: "Every decision feeds the graph — acceptance rates, outcome deviations, calibration data. Human judgment improves with use. The Outcome Graph makes every future recommendation more accurate than the last by closing the feedback loop between decisions and their real-world consequences.",
    },
    {
      num: "04", name: "Monte Carlo Engine", element: "Machine Intelligence",
      body: "Probabilistic simulation before action. Not a confident point estimate — a consequence distribution. Operators see the range of outcomes, confidence intervals, and sensitivity analysis before they decide. Domain scenarios calibrate over time using real outcome data, making the simulation more accurate with each decision cycle.",
    },
    {
      num: "05", name: "Event Fabric (PRAXIS Bus)", element: "Machine Intelligence at platform scale",
      body: "Cross-domain signal correlation that no single-domain tool can produce. A sanctions hit in Vessels can surface a legal risk flag in Counsel, triggering a policy escalation in Lyte. Each domain pack added multiplies the correlation value. The more domains, the more intelligence — unavailable anywhere else.",
    },
    {
      num: "06", name: "Domain-Pack Architecture", element: "Structural Governance without structural tax",
      body: "New domains inherit the full governance stack from day one — Proof Chain, Covenant Policy, Outcome Graph, Monte Carlo, approval gates, RBAC, audit logging — at zero marginal governance cost. The architecture makes every new domain cheaper than the last to govern correctly.",
    },
  ];

  for (const prim of primitives) {
    if (y > 270) {
      doc.addPage();
      drawPageBackground(doc);
      drawHeaderBar(doc, 4, totalPages, "The Six Primitives (continued)");
      drawFooterBar(doc);
      y = 28;
    }

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    setTextColor(doc, SZL_ACCENT);
    doc.text(`${prim.num}  ${prim.name}`, cx, y);

    doc.setFont("helvetica", "normal");
    setTextColor(doc, SZL_MUTED);
    doc.text(`— ${prim.element}`, cx + doc.getTextWidth(`${prim.num}  ${prim.name}`) + 2, y);
    y += 5;

    const bodyLines = doc.splitTextToSize(prim.body, cw - 4);
    doc.setFontSize(8.5);
    setTextColor(doc, SZL_MUTED);
    doc.text(bodyLines, cx + 2, y);
    y += bodyLines.length * 4.5 + 6;

    setDraw(doc, SZL_BORDER);
    doc.setLineWidth(0.15);
    doc.line(cx, y - 2, cx + cw, y - 2);
  }

  drawFooterBar(doc);

  // ─── Page 5: The Governed Decision Loop ──────────────────────────────────
  doc.addPage();
  drawPageBackground(doc);
  drawHeaderBar(doc, 5, totalPages, "The Governed Decision Loop");

  y = 28;
  drawSectionBadge(doc, "A11OY's Operating Model", cx, y);
  y += 7;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_TEXT);
  doc.text("The Governed Decision Loop: six stages, no shortcuts.", cx, y);
  y += 12;

  y = addWrappedText(
    doc,
    "Every consequential decision in an A11OY-built system follows the same arc. The elements don't take turns — they operate together, at each stage, as a unified system. The loop is invariant: whether the decision is a security incident, a maritime rerouting call, a legal settlement, or a real estate acquisition.",
    cx, y, cw, 5.5, 9.5, SZL_MUTED,
  );
  y += 8;

  const loop = [
    { stage: "01 · Signal", desc: "Machine intelligence acquires and normalizes cross-domain signals at scale. No signal is lost. Every signal enters with source attribution, timestamp, and context." },
    { stage: "02 · Surface", desc: "Evaluated, ranked, and contextualized. The right signal surfaces to the right person at the right moment — with enough context to understand, not just react." },
    { stage: "03 · Recommend", desc: "AI proposes, with evidence, confidence intervals from Monte Carlo simulation, and consequence modeling. Recommendation logic is auditable and explainable." },
    { stage: "04 · Gate", desc: "Structural Governance intercepts every consequential action before execution. Covenant Policy enforces who can approve, under what conditions, with what authority. This gate cannot be bypassed." },
    { stage: "05 · Decide", desc: "Human Judgment owns the consequential decision. Ownership is clear, non-delegable, and recorded. The human decides. The record follows." },
    { stage: "06 · Prove", desc: "Provable Accountability records the full chain — who, what, why, when, with what authority, with what AI involvement, and with what outcome. SHA-256 hashed, tamper-evident, attributable." },
  ];

  for (const step of loop) {
    setFill(doc, SZL_SURFACE);
    doc.roundedRect(cx, y, cw, 22, 2, 2, "F");

    setFill(doc, SZL_ACCENT);
    doc.roundedRect(cx, y, 2, 22, 1, 1, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setTextColor(doc, SZL_ACCENT);
    doc.text(step.stage, cx + 6, y + 8);

    const bodyLines = doc.splitTextToSize(step.desc, cw - 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    setTextColor(doc, SZL_MUTED);
    doc.text(bodyLines, cx + 6, y + 14);

    y += 27;
  }

  drawFooterBar(doc);

  // ─── Page 6: Closing ──────────────────────────────────────────────────────
  doc.addPage();
  drawPageBackground(doc);
  drawHeaderBar(doc, 6, totalPages, "Closing");

  y = 28;
  drawSectionBadge(doc, "In Summary", cx, y);
  y += 7;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_TEXT);
  const closingH = doc.splitTextToSize("A11OY is not a metaphor. It is an architecture.", cw);
  doc.text(closingH, cx, y);
  y += closingH.length * 9 + 6;

  const closingParas = [
    "Every aspect of the A11OY philosophy has a direct, inspectable implementation in FORGE. Proof Chain is not a logging layer — it is a tamper-evident proof infrastructure with SHA-256 hashing and export controls. Covenant Policy is not a documentation framework — it is a policy engine that enforces human-in-the-loop at the code layer, wired into every domain pack.",
    "The philosophy is not a sales narrative sitting above the product. It is the product's reason for existing, expressed as architecture, and verifiable by any technical team that cares to look.",
    "Counsel is what A11OY looks like when it runs.",
  ];

  for (const para of closingParas) {
    y = addWrappedText(doc, para, cx, y, cw, 5.5, 9.5, SZL_MUTED);
    y += 6;
  }

  y += 8;
  setFill(doc, [18, 28, 48]);
  doc.roundedRect(cx, y, cw, 38, 3, 3, "F");
  setDraw(doc, SZL_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(cx, y, cw, 38, 3, 3, "S");
  drawAccentRule(doc, cx, y, 3);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_TEXT);
  doc.text("SZL Holdings", cx + 7, y + 11);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  setTextColor(doc, SZL_MUTED);
  doc.text("Washington, D.C. · London · Singapore", cx + 7, y + 19);
  doc.text("szlholdings.com · hello@szlholdings.com", cx + 7, y + 26);
  doc.text("Governed Autonomy · Built for Enterprise · 2026", cx + 7, y + 33);

  drawFooterBar(doc);

  return doc;
}

export function generatePhilosophyPDF(): void {
  buildPhilosophyDoc().save("A11OY-Philosophy-Whitepaper-SZL-Holdings.pdf");
}

function buildCompetitiveBriefDoc(): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const totalPages = 5;
  const cx = 12;
  const cw = 186;

  // ─── Page 1: Cover ───────────────────────────────────────────────────────
  drawPageBackground(doc);
  setFill(doc, SZL_BLUE);
  doc.rect(0, 0, 210, 3, "F");

  setDraw(doc, SZL_BORDER);
  doc.setLineWidth(0.1);
  for (let gx = 0; gx <= 210; gx += 24) doc.line(gx, 3, gx, 297);
  for (let gy = 3; gy <= 297; gy += 24) doc.line(0, gy, 210, gy);

  setFill(doc, SZL_SURFACE);
  doc.roundedRect(cx, 40, cw, 200, 4, 4, "F");
  setDraw(doc, SZL_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(cx, 40, cw, 200, 4, 4, "S");

  setFill(doc, SZL_BLUE);
  doc.rect(cx, 50, 30, 1.5, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_BLUE);
  doc.text("A11OY · COMPETITIVE POSITIONING", cx + 6, 60);

  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_TEXT);
  const titleLines = doc.splitTextToSize("A11OY Competitive Brief", cw - 12);
  doc.text(titleLines, cx + 6, 82);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  setTextColor(doc, SZL_MUTED);
  const subtitleLines = doc.splitTextToSize(
    "Market Positioning vs. Palantir · ServiceNow · C3.ai · UiPath · Microsoft Copilot Studio · LangChain/CrewAI",
    cw - 12,
  );
  doc.text(subtitleLines, cx + 6, 108);

  setDraw(doc, SZL_BORDER);
  doc.setLineWidth(0.3);
  doc.line(cx + 6, 128, cx + cw - 6, 128);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  setTextColor(doc, SZL_MUTED);
  const summaryLines = doc.splitTextToSize(
    "Every category has a leader. None of them have fused all four elements of A11OY. This brief assesses each competitor fairly — what they do well and the structural gap A11OY fills — across six capability dimensions.",
    cw - 18,
  );
  doc.text(summaryLines, cx + 6, 136);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_BLUE);
  doc.text("SZL Holdings", cx + 6, 228);
  doc.setFont("helvetica", "normal");
  setTextColor(doc, SZL_MUTED);
  doc.text("Washington, D.C. · London · Singapore", cx + 6, 235);
  doc.text("2026", cx + 6, 242);

  drawFooterBar(doc);

  // ─── Page 2: Capability Matrix ───────────────────────────────────────────
  doc.addPage();
  drawPageBackground(doc);
  drawHeaderBar(doc, 2, totalPages, "Capability Matrix");

  let y = 28;
  drawSectionBadge(doc, "Six-Dimension Capability Matrix", cx, y);
  y += 7;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_TEXT);
  doc.text("How every platform scores across the six A11OY dimensions.", cx, y);
  y += 11;

  const competitors = [
    "Palantir AIP", "ServiceNow", "C3.ai", "UiPath / AA", "Copilot Studio", "LangChain/CrewAI", "A11OY / Counsel",
  ];
  const dims = ["AI Intel.", "Workflow", "Human Loop", "Audit", "Cross-Domain", "Decision Acct."];

  type CapRating = "S" | "P" | "G";
  const matrix: CapRating[][] = [
    ["S", "P", "P", "P", "S", "G"],
    ["P", "S", "P", "P", "P", "G"],
    ["S", "P", "G", "P", "P", "G"],
    ["P", "S", "G", "P", "P", "G"],
    ["P", "P", "P", "P", "P", "P"],
    ["S", "P", "G", "G", "P", "G"],
    ["S", "S", "S", "S", "S", "S"],
  ];

  const colW = cw / (dims.length + 1);
  const rowH = 10;

  setFill(doc, SZL_SURFACE);
  doc.rect(cx, y, cw, rowH, "F");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_MUTED);

  for (let d = 0; d < dims.length; d++) {
    doc.text(dims[d], cx + colW + d * colW + colW / 2, y + 6.5, { align: "center" });
  }

  y += rowH;

  for (let r = 0; r < competitors.length; r++) {
    const isA11oy = r === competitors.length - 1;
    if (isA11oy) {
      setFill(doc, [18, 28, 48]);
    } else {
      setFill(doc, r % 2 === 0 ? SZL_SURFACE : SZL_DARK);
    }
    doc.rect(cx, y, cw, rowH, "F");

    if (isA11oy) {
      setFill(doc, SZL_ACCENT);
      doc.rect(cx, y, 2, rowH, "F");
    }

    doc.setFontSize(7.5);
    doc.setFont("helvetica", isA11oy ? "bold" : "normal");
    setTextColor(doc, isA11oy ? SZL_ACCENT : SZL_TEXT);
    doc.text(competitors[r], cx + 4, y + 6.5);

    for (let d = 0; d < dims.length; d++) {
      const rating = matrix[r][d];
      const color: RGBTuple = rating === "S" ? SZL_GREEN : rating === "P" ? SZL_YELLOW : SZL_RED;
      const label = rating === "S" ? "Strong" : rating === "P" ? "Partial" : "Gap";
      setTextColor(doc, color);
      doc.setFont("helvetica", isA11oy ? "bold" : "normal");
      doc.text(label, cx + colW + d * colW + colW / 2, y + 6.5, { align: "center" });
    }

    y += rowH;
  }

  y += 8;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  setTextColor(doc, SZL_MUTED);
  doc.text("Strong = structural capability  ·  Partial = present but limited  ·  Gap = structural absence", cx, y);

  drawFooterBar(doc);

  // ─── Pages 3–4: Competitor Assessments ───────────────────────────────────
  const competitorData = [
    {
      name: "Palantir AIP / Foundry",
      category: "Intelligence Platform",
      strength: "World-class data integration and intelligence layer. Exceptional at making sense of complex, heterogeneous enterprise data at scale. AIP's LLM integration is among the most mature in the enterprise space.",
      gap: "Intelligence without governed execution. Foundry surfaces insight — but the translation from insight to governed, auditable action falls outside the platform. The accountability for what the human did with the intelligence is not structurally enforced. The Proof Chain for decisions does not exist.",
    },
    {
      name: "ServiceNow",
      category: "Workflow Platform",
      strength: "The enterprise standard for IT workflow, ticketing, and service management. Deep integrations with existing enterprise systems. Strong ITSM governance and process compliance tooling.",
      gap: "Workflow without AI governance. ServiceNow orchestrates process well, but its AI layer (Now Assist) operates as a productivity overlay — not as a governed decision engine with traceable reasoning, approval gates, and decision accountability across domains.",
    },
    {
      name: "C3.ai",
      category: "Enterprise AI Platform",
      strength: "Strong predictive analytics and industry-specific AI applications. Serious depth in asset-intensive industries — energy, manufacturing, defense. Pre-built domain models reduce time to value.",
      gap: "Analytics without decision accountability. C3.ai surfaces predictions and anomalies effectively, but the decision layer — who acted on this, what they approved, what actually happened — is not governed or audited at the platform level. Outcomes are not fed back into a structured calibration loop.",
    },
    {
      name: "UiPath / Automation Anywhere",
      category: "RPA & Automation",
      strength: "Market leaders in robotic process automation. Exceptional at automating repetitive, rule-based workflows across enterprise systems without requiring code changes to source systems.",
      gap: "Task automation without decision governance. RPA automates execution — but consequential decisions (approvals, exceptions, judgment calls) are handled by humans outside the platform, without structural accountability or audit trail integration. The human-in-the-loop is an afterthought, not an architecture.",
    },
    {
      name: "Microsoft Copilot Studio",
      category: "AI Agent Platform",
      strength: "Deeply embedded in the Microsoft ecosystem. Fast deployment of AI agents across Teams, SharePoint, and M365 with strong low-code tooling. Network effects from M365 adoption are substantial.",
      gap: "AI agents without structural human-in-the-loop. Copilot Studio offers human escalation as a configurable option — not as a structural governance layer. Enterprise trust requires that consequential actions cannot be bypassed even by configuration. That guarantee does not exist here. Audit trails are shallow.",
    },
    {
      name: "LangChain / CrewAI",
      category: "Agent Framework",
      strength: "The fastest path to building multi-agent workflows. Rich tooling for agent orchestration, tool use, and reasoning chains. Strong open-source community and rapid iteration velocity.",
      gap: "Agent frameworks without enterprise trust infrastructure. LangChain and CrewAI are excellent engineering primitives — but they provide no Proof Chain, no Covenant Policy, no structural approval gates, no tenant isolation, and no decision accountability. Building enterprise-grade governance on top requires rebuilding what A11OY already is.",
    },
  ];

  for (let pg = 0; pg < 2; pg++) {
    doc.addPage();
    drawPageBackground(doc);
    const pageNum = 3 + pg;
    drawHeaderBar(doc, pageNum, totalPages, `Competitor Assessments (${pg + 1}/2)`);
    y = 28;

    const slice = competitorData.slice(pg * 3, pg * 3 + 3);

    for (const comp of slice) {
      if (y > 240) break;

      setFill(doc, SZL_SURFACE);
      doc.roundedRect(cx, y, cw, 62, 2, 2, "F");
      setDraw(doc, SZL_BORDER);
      doc.setLineWidth(0.2);
      doc.roundedRect(cx, y, cw, 62, 2, 2, "S");

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      setTextColor(doc, SZL_TEXT);
      doc.text(comp.name, cx + 5, y + 8);

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      setTextColor(doc, SZL_MUTED);
      doc.text(comp.category.toUpperCase(), cx + 5 + doc.getTextWidth(comp.name) + 3, y + 8);

      setDraw(doc, SZL_BORDER);
      doc.setLineWidth(0.15);
      doc.line(cx + 5, y + 12, cx + cw - 5, y + 12);

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      setTextColor(doc, SZL_GREEN);
      doc.text("WHAT THEY DO WELL", cx + 5, y + 19);
      const sLines = doc.splitTextToSize(comp.strength, (cw / 2) - 10);
      doc.setFont("helvetica", "normal");
      setTextColor(doc, SZL_MUTED);
      doc.setFontSize(7.5);
      doc.text(sLines, cx + 5, y + 25);

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      setTextColor(doc, SZL_ACCENT);
      doc.text("THE STRUCTURAL GAP A11OY FILLS", cx + cw / 2 + 5, y + 19);
      const gLines = doc.splitTextToSize(comp.gap, (cw / 2) - 10);
      doc.setFont("helvetica", "normal");
      setTextColor(doc, SZL_MUTED);
      doc.setFontSize(7.5);
      doc.text(gLines, cx + cw / 2 + 5, y + 25);

      y += 68;
    }

    drawFooterBar(doc);
  }

  // ─── Page 5: What Only A11OY Does ────────────────────────────────────────
  doc.addPage();
  drawPageBackground(doc);
  drawHeaderBar(doc, 5, totalPages, "What Only A11OY Does");

  y = 28;
  drawSectionBadge(doc, "Six Structural Advantages", cx, y);
  y += 7;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, SZL_TEXT);
  const onlyH = doc.splitTextToSize("Six structural capabilities no competitor in any category currently combines.", cw);
  doc.text(onlyH, cx, y);
  y += onlyH.length * 8 + 8;

  const onlyItems = [
    {
      num: "01",
      title: "Structural Human-in-the-Loop",
      body: "Governance that cannot be configured away — enforced at the execution layer, not the UI layer. Covenant Policy is wired into every consequential action in the system. The guarantee exists at the code layer.",
    },
    {
      num: "02",
      title: "Cryptographic Proof Chain",
      body: "SHA-256 hashed, tamper-evident records of every consequential action with actor attribution, reasoning, and authorization basis. Not log files — structural proof usable in compliance, capital review, and customer diligence.",
    },
    {
      num: "03",
      title: "Monte Carlo Before Every Action",
      body: "Probabilistic simulation before the decision is made, not after. Operators see the distribution of consequences — with confidence intervals and sensitivity analysis — before they approve. This is not a feature. It is the default.",
    },
    {
      num: "04",
      title: "Cross-Domain Signal Correlation",
      body: "Intelligence that grows with each domain pack added. A sanctions hit in Vessels can surface a legal risk flag in Counsel, triggering a policy escalation in Lyte. This intelligence is unavailable in any single-domain tool, by definition.",
    },
    {
      num: "05",
      title: "Zero-Marginal Governance Cost",
      body: "New domains inherit the full governance stack — Proof Chain, Covenant Policy, approval gates, audit logging, RBAC — without rebuilding it. The architecture makes every new vertical cheaper to govern correctly than the last.",
    },
    {
      num: "06",
      title: "Governed Enterprise MCP Gateway",
      body: "23+ governed tools, role enforcement, tenant isolation, and immutable audit logging for AI agent operations. Enterprise IT teams get a provably governed execution environment for every AI agent — not just a framework.",
    },
  ];

  for (const item of onlyItems) {
    setFill(doc, SZL_SURFACE);
    doc.roundedRect(cx, y, cw, 26, 2, 2, "F");

    setFill(doc, SZL_ACCENT);
    doc.rect(cx, y, 2, 26, "F");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    setTextColor(doc, SZL_ACCENT);
    doc.text(item.num, cx + 6, y + 8);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    setTextColor(doc, SZL_TEXT);
    doc.text(item.title, cx + 14, y + 8);

    const bodyLines = doc.splitTextToSize(item.body, cw - 18);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    setTextColor(doc, SZL_MUTED);
    doc.text(bodyLines, cx + 6, y + 15);

    y += 31;
  }

  drawFooterBar(doc);

  return doc;
}

export function generateCompetitiveBriefPDF(): void {
  buildCompetitiveBriefDoc().save("A11OY-Competitive-Brief-SZL-Holdings.pdf");
}

export function getPhilosophyPDFBlobUrl(): string {
  const blob = buildPhilosophyDoc().output("blob");
  return URL.createObjectURL(blob);
}

export function getCompetitiveBriefPDFBlobUrl(): string {
  const blob = buildCompetitiveBriefDoc().output("blob");
  return URL.createObjectURL(blob);
}
