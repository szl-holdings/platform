/**
 * Generates downloadable solution-brief PDFs for each major SZL Holdings
 * product directly from the platform capability manifest.
 *
 * Output: artifacts/szl-holdings/public/briefs/<slug>-solution-brief.pdf
 *
 * The script is data-driven — re-running it after the manifest changes
 * regenerates every brief with the latest capability counts, status mix,
 * and proof points. Wired into scripts/post-merge.sh so briefs stay in
 * sync with manifest edits.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../../../..');
const MANIFEST_PATH = resolve(REPO_ROOT, 'artifacts/audit/platform-capability-manifest.json');
const OUT_DIR = resolve(REPO_ROOT, 'artifacts/szl-holdings/public/briefs');
const INDEX_PATH = resolve(OUT_DIR, 'index.json');

const BRAND = {
  bg: '#0a0c10',
  surface: '#111318',
  border: '#1e2230',
  primary: '#c2a55a',
  text: '#e8e0d0',
  muted: '#7a8099',
  emerald: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  slate: '#6b7280',
};

const STATUS_COLORS: Record<string, string> = {
  live: BRAND.emerald,
  working_demo: BRAND.blue,
  partial: BRAND.amber,
  stub: BRAND.slate,
  broken: BRAND.rose,
  undocumented: BRAND.violet,
};

const STATUS_LABELS: Record<string, string> = {
  live: 'Live',
  working_demo: 'Working Demo',
  partial: 'Partial',
  stub: 'Stub',
  broken: 'Broken',
  undocumented: 'Undocumented',
};

interface Capability {
  id: string;
  product: string;
  capability_name: string;
  claim_source: string;
  route_or_module: string;
  status: keyof typeof STATUS_COLORS;
  evidence: string;
  test_coverage: string;
  blocking_dependencies: string[];
  owner: string;
  severity: string;
}

interface Manifest {
  meta: {
    title: string;
    version: string;
    generated: string;
    auditor: string;
  };
  capabilities: Capability[];
}

interface BriefSpec {
  slug: string;
  productKey: string;
  displayName: string;
  tagline: string;
  positioning: string;
}

const BRIEFS: BriefSpec[] = [
  {
    slug: 'lyte',
    productKey: 'Lyte (Business Observability)',
    displayName: 'Lyte — Decision Intelligence',
    tagline: 'Multi-model AI routing and portfolio-wide signal observability.',
    positioning:
      'Lyte is the decision intelligence layer of the SZL ecosystem — it ingests signals from every platform, routes work across an LLM model fleet with cost and policy awareness, and exposes the operational state of the business as a single observable surface.',
  },
  {
    slug: 'aegis',
    productKey: 'Aegis (Defense & Intelligence)',
    displayName: 'Aegis — Unified Defense & Intelligence',
    tagline: 'SOC operations, threat intelligence, and MSP management converged.',
    positioning:
      'Aegis converges security operations, managed-service ticketing, and threat intelligence into a single command surface. Designed for organizations that cannot tolerate operational drift between security and infrastructure tooling.',
  },
  {
    slug: 'vessels',
    productKey: 'Vessels (Maritime Intelligence)',
    displayName: 'Vessels — Maritime Intelligence',
    tagline: 'Fleet command, voyage economics, and sanctions screening.',
    positioning:
      'Vessels turns AIS, voyage, and sanctions data into a fleet command surface. Operators and underwriters work from the same intelligence layer rather than reconciling spreadsheets across vendors.',
  },
  {
    slug: 'terra',
    productKey: 'Terra (Real Estate Intelligence)',
    displayName: 'Terra — Real Estate Intelligence',
    tagline: 'Distress-first NYC market intelligence for brokers and investors.',
    positioning:
      'Terra is a distress-first real-estate intelligence platform built around a multi-factor distress scoring engine, NYC PostGIS coverage, and a deal pipeline tuned for opportunistic capital.',
  },
  {
    slug: 'carlota-jo',
    productKey: 'Carlota Jo (Private Advisory)',
    displayName: 'Carlota Jo — Private Advisory',
    tagline: 'Strategic advisory with client portal and AI-augmented sessions.',
    positioning:
      'Carlota Jo packages senior advisory engagements with a working client portal, engagement workspace, and AI-augmented session intelligence. Built for partners who run a real practice, not a pitch deck.',
  },
];

function hex(c: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255];
}

function loadManifest(): Manifest {
  const raw = readFileSync(MANIFEST_PATH, 'utf8');
  return JSON.parse(raw) as Manifest;
}

interface ProductSummary {
  total: number;
  counts: Record<string, number>;
  capabilities: Capability[];
  readinessScore: number;
  proven: Capability[];
  risks: Capability[];
}

function summarize(caps: Capability[]): ProductSummary {
  const counts: Record<string, number> = {
    live: 0,
    working_demo: 0,
    partial: 0,
    stub: 0,
    broken: 0,
    undocumented: 0,
  };
  for (const c of caps) {
    if (c.status in counts) counts[c.status]++;
  }
  const readinessScore =
    caps.length === 0
      ? 0
      : Math.round(
          ((counts.live * 1.0 + counts.working_demo * 0.75 + counts.partial * 0.4) / caps.length) *
            100,
        );
  const proven = caps.filter((c) => c.status === 'live' || c.status === 'working_demo');
  const risks = caps.filter(
    (c) => c.status === 'stub' || c.status === 'broken' || c.status === 'undocumented',
  );
  return { total: caps.length, counts, capabilities: caps, readinessScore, proven, risks };
}

function drawBackground(doc: PDFKit.PDFDocument): void {
  const [r, g, b] = hex(BRAND.bg);
  doc.rect(0, 0, doc.page.width, doc.page.height).fill([r, g, b]);
}

function drawHeader(doc: PDFKit.PDFDocument, brief: BriefSpec, generated: string): number {
  drawBackground(doc);
  const [pr, pg, pb] = hex(BRAND.primary);
  const [mr, mg, mb] = hex(BRAND.muted);
  const [tr, tg, tb] = hex(BRAND.text);

  doc.rect(72, 72, doc.page.width - 144, 3).fill([pr, pg, pb]);
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor([mr, mg, mb])
    .text('SZL HOLDINGS  ·  SOLUTION BRIEF', 72, 92, { characterSpacing: 2 });
  doc.font('Helvetica-Bold').fontSize(22).fillColor([tr, tg, tb]).text(brief.displayName, 72, 110);
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor([mr, mg, mb])
    .text(brief.tagline, 72, 140, { width: doc.page.width - 144 });
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor([mr, mg, mb])
    .text(`Manifest snapshot · ${generated}`, 72, 160);

  const [br, bg, bb] = hex(BRAND.border);
  doc
    .rect(72, 178, doc.page.width - 144, 0.5)
    .fillColor([br, bg, bb])
    .fill();
  return 192;
}

function drawFooter(doc: PDFKit.PDFDocument, brief: BriefSpec): void {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const [mr, mg, mb] = hex(BRAND.muted);
    const [br, bg, bb] = hex(BRAND.border);
    const y = doc.page.height - 50;
    doc
      .rect(72, y, doc.page.width - 144, 0.5)
      .fillColor([br, bg, bb])
      .fill();
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor([mr, mg, mb])
      .text(
        `SZL Holdings — ${brief.displayName}  ·  Page ${i + 1} of ${range.count}  ·  Generated from platform-capability-manifest.json`,
        72,
        y + 10,
        { align: 'center', width: doc.page.width - 144 },
      );
  }
}

function sectionTitle(doc: PDFKit.PDFDocument, label: string, y: number): number {
  const [pr, pg, pb] = hex(BRAND.primary);
  const [mr, mg, mb] = hex(BRAND.muted);
  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor([mr, mg, mb])
    .text(label.toUpperCase(), 72, y, { characterSpacing: 1.5 });
  doc
    .rect(72, y + 14, doc.page.width - 144, 0.5)
    .fillColor([pr, pg, pb])
    .fillOpacity(0.5)
    .fill();
  doc.fillOpacity(1);
  return y + 24;
}

function bodyText(doc: PDFKit.PDFDocument, text: string, y: number): number {
  const [tr, tg, tb] = hex(BRAND.text);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor([tr, tg, tb])
    .text(text, 72, y, { width: doc.page.width - 144, lineGap: 3 });
  return doc.y + 8;
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number, currentY: number): number {
  if (currentY + needed > doc.page.height - 80) {
    doc.addPage();
    drawBackground(doc);
    return 72;
  }
  return currentY;
}

function metricCards(doc: PDFKit.PDFDocument, summary: ProductSummary, y: number): number {
  const cards: Array<{ label: string; value: string; color: string }> = [
    { label: 'Total Capabilities', value: String(summary.total), color: BRAND.text },
    { label: 'Readiness Score', value: `${summary.readinessScore}%`, color: BRAND.primary },
    { label: 'Live', value: String(summary.counts.live), color: BRAND.emerald },
    { label: 'Working Demo', value: String(summary.counts.working_demo), color: BRAND.blue },
    {
      label: 'Partial / At Risk',
      value: String(summary.counts.partial + summary.counts.stub + summary.counts.broken),
      color: BRAND.amber,
    },
  ];
  const colW = (doc.page.width - 144) / cards.length;
  cards.forEach((c, i) => {
    const x = 72 + i * colW;
    const [br, bg, bb] = hex(BRAND.border);
    const [mr, mg, mb] = hex(BRAND.muted);
    const [vr, vg, vb] = hex(c.color);
    doc
      .rect(x + 4, y, colW - 8, 56)
      .fillColor([br, bg, bb])
      .fillOpacity(0.45)
      .fill();
    doc.fillOpacity(1);
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor([mr, mg, mb])
      .text(c.label.toUpperCase(), x + 12, y + 8, { width: colW - 20, characterSpacing: 0.6 });
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor([vr, vg, vb])
      .text(c.value, x + 12, y + 24, { width: colW - 20 });
  });
  return y + 70;
}

function statusMix(doc: PDFKit.PDFDocument, summary: ProductSummary, y: number): number {
  const order = ['live', 'working_demo', 'partial', 'stub', 'broken', 'undocumented'] as const;
  const totalWidth = doc.page.width - 144;
  let x = 72;
  for (const status of order) {
    const n = summary.counts[status] ?? 0;
    if (n === 0 || summary.total === 0) continue;
    const w = (n / summary.total) * totalWidth;
    const [r, g, b] = hex(STATUS_COLORS[status]);
    doc.rect(x, y, w, 8).fillColor([r, g, b]).fill();
    x += w;
  }
  let legendY = y + 16;
  const [mr, mg, mb] = hex(BRAND.muted);
  const [tr, tg, tb] = hex(BRAND.text);
  let legendX = 72;
  for (const status of order) {
    const n = summary.counts[status] ?? 0;
    if (n === 0) continue;
    const [r, g, b] = hex(STATUS_COLORS[status]);
    doc
      .rect(legendX, legendY + 2, 7, 7)
      .fillColor([r, g, b])
      .fill();
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor([tr, tg, tb])
      .text(`${STATUS_LABELS[status]} ${n}`, legendX + 11, legendY);
    legendX += 110;
    if (legendX > doc.page.width - 144) {
      legendX = 72;
      legendY += 14;
    }
  }
  // suppress unused warning while keeping muted color centralised
  void mr;
  void mg;
  void mb;
  return legendY + 20;
}

function proofPoints(doc: PDFKit.PDFDocument, items: Capability[], y: number): number {
  const top = items.slice(0, 6);
  const [pr, pg, pb] = hex(BRAND.primary);
  const [tr, tg, tb] = hex(BRAND.text);
  const [mr, mg, mb] = hex(BRAND.muted);
  for (const cap of top) {
    y = ensureSpace(doc, 70, y);
    doc.rect(72, y, 3, 50).fillColor([pr, pg, pb]).fillOpacity(0.7).fill();
    doc.fillOpacity(1);
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor([tr, tg, tb])
      .text(`${cap.id} · ${cap.capability_name}`, 84, y + 2, { width: doc.page.width - 168 });
    const headerEnd = doc.y + 4;
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor([mr, mg, mb])
      .text(cap.evidence, 84, headerEnd, { width: doc.page.width - 168, lineGap: 1.5 });
    const evidenceEnd = doc.y + 4;
    doc
      .font('Helvetica-Oblique')
      .fontSize(7.5)
      .fillColor([mr, mg, mb])
      .text(
        `status: ${STATUS_LABELS[cap.status] ?? cap.status}  ·  module: ${cap.route_or_module}`,
        84,
        evidenceEnd,
        { width: doc.page.width - 168 },
      );
    y = doc.y + 10;
  }
  return y;
}

function risksList(doc: PDFKit.PDFDocument, items: Capability[], y: number): number {
  if (items.length === 0) {
    return bodyText(
      doc,
      'No capabilities currently flagged as stub, broken, or undocumented for this product.',
      y,
    );
  }
  const [tr, tg, tb] = hex(BRAND.text);
  const [mr, mg, mb] = hex(BRAND.muted);
  for (const cap of items.slice(0, 5)) {
    y = ensureSpace(doc, 38, y);
    const [r, g, b] = hex(STATUS_COLORS[cap.status] ?? BRAND.amber);
    doc
      .circle(80, y + 6, 2.6)
      .fillColor([r, g, b])
      .fill();
    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor([tr, tg, tb])
      .text(`${cap.id} · ${cap.capability_name}`, 92, y, { width: doc.page.width - 164 });
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor([mr, mg, mb])
      .text(`${STATUS_LABELS[cap.status] ?? cap.status} · ${cap.evidence}`, 92, doc.y + 2, {
        width: doc.page.width - 164,
        lineGap: 1.5,
      });
    y = doc.y + 8;
  }
  return y;
}

async function generateBrief(
  brief: BriefSpec,
  manifest: Manifest,
): Promise<{ slug: string; bytes: number; capabilityCount: number }> {
  const caps = manifest.capabilities.filter((c) => c.product === brief.productKey);
  const summary = summarize(caps);

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'letter',
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      info: {
        Title: `${brief.displayName} — Solution Brief`,
        Author: 'SZL Holdings',
        Subject: 'Solution brief generated from platform capability manifest',
        Creator: 'SZL Holdings',
        Producer: 'SZL Document Engine',
      },
      bufferPages: true,
    });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = drawHeader(doc, brief, manifest.meta.generated);
    y = sectionTitle(doc, 'Positioning', y);
    y = bodyText(doc, brief.positioning, y);

    y = sectionTitle(doc, 'Capability Snapshot', y + 6);
    y = metricCards(doc, summary, y);
    y = sectionTitle(doc, 'Status Mix', y + 6);
    y = statusMix(doc, summary, y);

    y = sectionTitle(doc, 'Top Proof Points', y + 4);
    if (summary.proven.length === 0) {
      y = bodyText(
        doc,
        'No live or working-demo capabilities currently registered for this product in the manifest.',
        y,
      );
    } else {
      y = proofPoints(doc, summary.proven, y);
    }

    y = sectionTitle(doc, 'Open Risks & Gaps', y + 4);
    y = risksList(doc, summary.risks, y);

    y = sectionTitle(doc, 'Methodology', y + 6);
    y = bodyText(
      doc,
      `Every figure in this brief is derived from artifacts/audit/platform-capability-manifest.json (manifest version ${manifest.meta.version}). The readiness score weights live capabilities at 1.0, working demos at 0.75, and partials at 0.4. Capability statuses use SZL's published status definitions: live, working_demo, partial, stub, broken, undocumented. This brief is regenerated whenever the manifest changes — no manually edited claims.`,
      y,
    );

    drawFooter(doc, brief);
    doc.end();
  });

  mkdirSync(OUT_DIR, { recursive: true });
  const outFile = resolve(OUT_DIR, `${brief.slug}-solution-brief.pdf`);
  writeFileSync(outFile, buffer);
  return { slug: brief.slug, bytes: buffer.length, capabilityCount: caps.length };
}

async function main(): Promise<void> {
  const manifest = loadManifest();
  mkdirSync(OUT_DIR, { recursive: true });
  const results: Array<{
    slug: string;
    displayName: string;
    productKey: string;
    capabilityCount: number;
    readinessScore: number;
    bytes: number;
    file: string;
  }> = [];

  for (const brief of BRIEFS) {
    const caps = manifest.capabilities.filter((c) => c.product === brief.productKey);
    const summary = summarize(caps);
    const out = await generateBrief(brief, manifest);
    results.push({
      slug: brief.slug,
      displayName: brief.displayName,
      productKey: brief.productKey,
      capabilityCount: out.capabilityCount,
      readinessScore: summary.readinessScore,
      bytes: out.bytes,
      file: `/briefs/${brief.slug}-solution-brief.pdf`,
    });
    // eslint-disable-next-line no-console
    console.log(
      `✓ ${brief.slug.padEnd(12)} ${out.bytes.toString().padStart(8)} bytes  ${out.capabilityCount} capabilities`,
    );
  }

  const index = {
    generated_at: new Date().toISOString(),
    manifest_generated: manifest.meta.generated,
    manifest_version: manifest.meta.version,
    briefs: results,
  };
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nWrote ${results.length} solution briefs and index.json to ${OUT_DIR}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('generate-solution-briefs failed:', err);
  process.exit(1);
});
