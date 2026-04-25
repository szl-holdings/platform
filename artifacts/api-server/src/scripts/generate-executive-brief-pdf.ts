import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import PDFDocument from "pdfkit";

const OUTPUT_PATH = resolve(
  import.meta.dirname,
  "../../../szl-holdings/public/szl-holdings-executive-brief.pdf",
);

const ACCENT = "#d4a054";
const INK = "#0a0d14";
const MUTED = "#5a6275";
const RULE = "#d8d4cb";

const HIGHLIGHTS = [
  "Platform thesis and what makes SZL Holdings one-of-one",
  "Five domain verticals and go-to-market sequencing",
  "Wedge + platform logic — one engine, multiple domains",
  "Competitive moat: signal-to-action governance layer",
  "Investment thesis, milestones, and honest status",
];

const DOMAINS: Array<{ name: string; tagline: string; detail: string }> = [
  {
    name: "Counsel",
    tagline: "Legal matter observability",
    detail:
      "Outside-counsel telemetry, matter risk scoring, and spend governance for in-house legal teams.",
  },
  {
    name: "Vessels",
    tagline: "Maritime intelligence",
    detail:
      "Fleet positioning, fuel & port analytics, and trading-grade alerts for maritime operators and lenders.",
  },
  {
    name: "Aegis",
    tagline: "Security & defense observability",
    detail:
      "Cross-tenant cyber and physical-security signal fusion with continuous control attestations.",
  },
  {
    name: "Terra",
    tagline: "Real estate intelligence",
    detail:
      "Pro forma, lease abstraction, 1031 exchange, and waterfall modeling tied to live market signals.",
  },
  {
    name: "Carlota Jo",
    tagline: "Advisory & consulting intelligence",
    detail:
      "Engagement telemetry and decision logs for boutique advisory firms operating across portfolios.",
  },
];

const THESIS_PARAGRAPHS = [
  "SZL Holdings is building a Governed Decision Operating System: a single agentic AI substrate that ingests proprietary signal across regulated verticals and turns it into auditable, attributable decisions. The wedge in each market is a domain product; the moat is the shared governance, evidence, and attestation layer that compounds across them.",
  "Existing AI tooling sells answers. We sell governed decisions — every recommendation carries the evidence chain, the policy that authorized it, the model and prompt lineage, and the operator who can override it. This is what regulated buyers (legal, defense, real estate, maritime, advisory) actually need before they automate the next workflow.",
  "Our roadmap is sequenced like a platform company, not a feature factory: launch one credible vertical, harden the agentic core (retrieval, evaluation, evidence, policy), then plug the next vertical into the same substrate at a fraction of incremental cost. Each domain product makes the next one cheaper, faster, and more defensible.",
];

const MILESTONES: Array<{ phase: string; status: string; detail: string }> = [
  {
    phase: "Phase 0 — Foundation",
    status: "Shipped",
    detail:
      "Monorepo, multi-tenant API surface, audit/evidence schema, agentic retrieval (AEF), evaluation harness (AEEP), CI gates.",
  },
  {
    phase: "Phase 1 — Wedge verticals",
    status: "In market",
    detail:
      "PRISM Counsel, Terra, Vessels live with design partners. Aegis and Carlota Jo in pilot.",
  },
  {
    phase: "Phase 2 — Governance layer",
    status: "Building",
    detail:
      "Policy-as-code, customer-managed keys (BYOK), continuous control attestations, cross-vertical decision logs.",
  },
  {
    phase: "Phase 3 — Platform leverage",
    status: "Next",
    detail:
      "Open the substrate to design partners building their own vertical on the SZL Holdings governance fabric.",
  },
];

function header(doc: PDFKit.PDFDocument): void {
  const top = doc.page.margins.top - 24;
  doc
    .save()
    .fillColor(INK)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("SZL HOLDINGS  ·  INVESTOR DATA ROOM", doc.page.margins.left, top, {
      characterSpacing: 1.6,
      lineBreak: false,
    })
    .font("Helvetica")
    .fontSize(8)
    .fillColor(MUTED)
    .text(
      "CONFIDENTIAL",
      doc.page.margins.left,
      top,
      {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: "right",
        characterSpacing: 1.6,
        lineBreak: false,
      },
    )
    .moveTo(doc.page.margins.left, top + 14)
    .lineTo(doc.page.width - doc.page.margins.right, top + 14)
    .lineWidth(0.5)
    .strokeColor(RULE)
    .stroke()
    .restore();
}

function footer(doc: PDFKit.PDFDocument, pageNum: number): void {
  const bottom = doc.page.height - doc.page.margins.bottom + 12;
  doc
    .save()
    .moveTo(doc.page.margins.left, bottom - 4)
    .lineTo(doc.page.width - doc.page.margins.right, bottom - 4)
    .lineWidth(0.5)
    .strokeColor(RULE)
    .stroke()
    .font("Helvetica")
    .fontSize(8)
    .fillColor(MUTED)
    .text("szlholdings.com  ·  investors@szlholdings.com", doc.page.margins.left, bottom, {
      lineBreak: false,
    })
    .text(
      `Executive Brief  ·  Page ${pageNum}`,
      doc.page.margins.left,
      bottom,
      {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: "right",
        lineBreak: false,
      },
    )
    .restore();
}

function sectionTitle(doc: PDFKit.PDFDocument, label: string, title: string): void {
  doc.moveDown(0.6);
  doc
    .fillColor(ACCENT)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(label.toUpperCase(), { characterSpacing: 1.6 });
  doc
    .fillColor(INK)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(title);
  doc.moveDown(0.4);
}

function paragraph(doc: PDFKit.PDFDocument, text: string): void {
  doc
    .fillColor(INK)
    .font("Helvetica")
    .fontSize(10.5)
    .text(text, { align: "left", lineGap: 3 });
  doc.moveDown(0.5);
}

function bullet(doc: PDFKit.PDFDocument, text: string): void {
  const x = doc.page.margins.left;
  const y = doc.y;
  doc.save().fillColor(ACCENT).circle(x + 3, y + 6, 1.8).fill().restore();
  doc
    .fillColor(INK)
    .font("Helvetica")
    .fontSize(10.5)
    .text(text, x + 14, y, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 14,
      lineGap: 3,
    });
  doc.moveDown(0.25);
}

async function main(): Promise<void> {
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 72, bottom: 72, left: 64, right: 64 },
    info: {
      Title: "SZL Holdings — Executive Brief",
      Author: "SZL Holdings",
      Subject: "Investor Executive Brief",
      Keywords: "SZL Holdings, executive brief, investor, governed decision OS",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  let pageNum = 0;
  let painting = false;
  const paint = (): void => {
    if (painting) return;
    painting = true;
    pageNum += 1;
    header(doc);
    footer(doc, pageNum);
    painting = false;
  };
  doc.on("pageAdded", paint);
  paint();

  // Cover block
  doc.moveDown(2);
  doc
    .fillColor(ACCENT)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("EXECUTIVE BRIEF  ·  CONFIDENTIAL", { characterSpacing: 1.8 });
  doc.moveDown(0.5);
  doc
    .fillColor(INK)
    .font("Helvetica-Bold")
    .fontSize(28)
    .text("SZL Holdings");
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(13)
    .text("The Governed Decision Operating System.", { lineGap: 2 });
  doc.moveDown(1.2);

  doc
    .fillColor(INK)
    .font("Helvetica")
    .fontSize(10.5)
    .text(
      "This brief covers the platform narrative, vertical product depth, competitive moat, and investment thesis. It is the primary document for investors, partners, and evaluators who need structured context before a deeper diligence conversation.",
      { lineGap: 3 },
    );

  doc.moveDown(0.8);
  doc
    .fillColor(ACCENT)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("WHAT THIS BRIEF COVERS", { characterSpacing: 1.6 });
  doc.moveDown(0.3);
  for (const h of HIGHLIGHTS) bullet(doc, h);

  // Thesis
  sectionTitle(doc, "01  ·  Thesis", "One engine. Many regulated verticals.");
  for (const p of THESIS_PARAGRAPHS) paragraph(doc, p);

  // Domain products
  sectionTitle(doc, "02  ·  Domain products", "Wedges that share one substrate.");
  for (const d of DOMAINS) {
    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(`${d.name}  —  ${d.tagline}`);
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(10)
      .text(d.detail, { lineGap: 2 });
    doc.moveDown(0.5);
  }

  // Moat
  sectionTitle(doc, "03  ·  Moat", "Governance, evidence, and attestation.");
  paragraph(
    doc,
    "Every decision the platform produces carries: (a) the retrieved evidence and its provenance, (b) the policy that authorized the action, (c) the model, prompt, and tool lineage, and (d) the operator who can review or override it. Regulated buyers cannot adopt unaccountable AI; this evidence chain is what unlocks them.",
  );
  paragraph(
    doc,
    "Because the substrate is shared, each new vertical inherits the audit log, the policy engine, the evaluation harness (AEEP), and the agentic retrieval fabric (AEF). Incremental verticals get cheaper to ship and harder to displace.",
  );

  // Roadmap
  sectionTitle(doc, "04  ·  Roadmap", "Sequenced like a platform company.");
  for (const m of MILESTONES) {
    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(`${m.phase}`, { continued: true })
      .fillColor(ACCENT)
      .font("Helvetica-Bold")
      .text(`   ${m.status}`);
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(10)
      .text(m.detail, { lineGap: 2 });
    doc.moveDown(0.5);
  }

  // Investment ask
  sectionTitle(doc, "05  ·  Investment thesis", "What we are raising for.");
  paragraph(
    doc,
    "Capital deployed against this round funds (1) hardening of the governance substrate to enterprise-grade (BYOK, residency, attestations), (2) sales motion into the two highest-conviction verticals, and (3) the design-partner program that opens the substrate to outside builders.",
  );
  paragraph(
    doc,
    "We are deliberately benchmarking against IBM, Nvidia, Tesla, Thiel, and Altman: long-cycle infrastructure companies with a single coherent thesis, executed against multiple end markets, with governance as the durable moat.",
  );

  // Contact
  sectionTitle(doc, "Next step", "Schedule a working session.");
  paragraph(
    doc,
    "Request a live walkthrough or deeper diligence access from the data room, or write directly: investors@szlholdings.com.",
  );

  doc.end();

  await new Promise<void>((resolveP, rejectP) => {
    doc.on("end", () => resolveP());
    doc.on("error", (err: Error) => rejectP(err));
  });

  const buffer = Buffer.concat(chunks);
  writeFileSync(OUTPUT_PATH, buffer);
  process.stdout.write(`Wrote ${buffer.length} bytes to ${OUTPUT_PATH}\n`);
}

main().catch((err) => {
  process.stderr.write(`Failed: ${(err as Error).stack ?? err}\n`);
  process.exit(1);
});
