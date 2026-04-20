import PDFDocument from 'pdfkit';

const BRAND = {
  bg: '#0a0c10',
  surface: '#111318',
  border: '#1e2230',
  primary: '#c2a55a',
  primaryLight: '#d4bc82',
  text: '#e8e0d0',
  muted: '#7a8099',
  accent: '#3b82f6',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
};

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255];
}

function createBaseDoc(): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'letter',
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
    info: { Creator: 'SZL Holdings', Producer: 'SZL Document Engine' },
    bufferPages: true,
  });
  return doc;
}

function drawBackground(doc: PDFKit.PDFDocument): void {
  const [r, g, b] = hexToRgb(BRAND.bg);
  doc.rect(0, 0, doc.page.width, doc.page.height).fill([r, g, b]);
}

function drawHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string): number {
  drawBackground(doc);

  const [pr, pg, pb] = hexToRgb(BRAND.primary);
  doc.rect(72, 72, doc.page.width - 144, 3).fill([pr, pg, pb]);

  doc.moveDown(1.2);

  const [mr, mg, mb] = hexToRgb(BRAND.muted);
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor([mr, mg, mb])
    .text('SZL HOLDINGS', 72, 95, { characterSpacing: 2 });

  const [tr, tg, tb] = hexToRgb(BRAND.text);
  doc.font('Helvetica-Bold').fontSize(22).fillColor([tr, tg, tb]).text(title, 72, 112);

  doc.font('Helvetica').fontSize(11).fillColor([mr, mg, mb]).text(subtitle, 72, 140);

  doc
    .rect(72, 158, doc.page.width - 144, 0.5)
    .fillColor([hexToRgb(BRAND.border)[0], hexToRgb(BRAND.border)[1], hexToRgb(BRAND.border)[2]]);

  return 172;
}

function drawFooter(doc: PDFKit.PDFDocument): void {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    const [mr, mg, mb] = hexToRgb(BRAND.muted);
    const [br, bg, bb] = hexToRgb(BRAND.border);
    const y = doc.page.height - 50;
    doc.rect(72, y, doc.page.width - 144, 0.5).fillColor([br, bg, bb]);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor([mr, mg, mb])
      .text(
        `SZL Holdings — Confidential  |  Page ${i + 1} of ${pages.count}  |  Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        72,
        y + 10,
        { align: 'center', width: doc.page.width - 144 },
      );
  }
}

function sectionTitle(doc: PDFKit.PDFDocument, text: string, y: number): number {
  const [pr, pg, pb] = hexToRgb(BRAND.primary);
  const [mr, mg, mb] = hexToRgb(BRAND.muted);
  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor([mr, mg, mb])
    .text(text.toUpperCase(), 72, y, { characterSpacing: 1.5 });
  doc
    .rect(72, y + 14, doc.page.width - 144, 0.5)
    .fillColor([pr, pg, pb])
    .fillOpacity(0.4);
  doc.fillOpacity(1);
  return y + 22;
}

function bodyText(
  doc: PDFKit.PDFDocument,
  text: string,
  y: number,
  options: Record<string, unknown> = {},
): number {
  const [tr, tg, tb] = hexToRgb(BRAND.text);
  const before = doc.y;
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor([tr, tg, tb])
    .text(text, 72, y, { width: doc.page.width - 144, lineGap: 3, ...options });
  return doc.y + 8;
}

function labelValue(doc: PDFKit.PDFDocument, label: string, value: string, y: number): number {
  const [mr, mg, mb] = hexToRgb(BRAND.muted);
  const [tr, tg, tb] = hexToRgb(BRAND.text);
  doc.font('Helvetica').fontSize(8).fillColor([mr, mg, mb]).text(label, 72, y);
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor([tr, tg, tb])
    .text(value, 72, y + 12);
  return y + 30;
}

function metricRow(
  doc: PDFKit.PDFDocument,
  metrics: Array<{ label: string; value: string }>,
  y: number,
): number {
  const colW = (doc.page.width - 144) / metrics.length;
  metrics.forEach((m, i) => {
    const x = 72 + i * colW;
    const [mr, mg, mb] = hexToRgb(BRAND.muted);
    const [pr, pg, pb] = hexToRgb(BRAND.primary);
    const [br, bg, bb] = hexToRgb(BRAND.border);
    doc
      .rect(x + 4, y, colW - 8, 48)
      .fillColor([br, bg, bb])
      .fill();
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor([mr, mg, mb])
      .text(m.label, x + 12, y + 8, { width: colW - 20 });
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor([pr, pg, pb])
      .text(m.value, x + 12, y + 20, { width: colW - 20 });
  });
  return y + 62;
}

function bulletItem(
  doc: PDFKit.PDFDocument,
  text: string,
  y: number,
  color: string = BRAND.primary,
): number {
  const [cr, cg, cb] = hexToRgb(color);
  const [tr, tg, tb] = hexToRgb(BRAND.text);
  doc
    .circle(80, y + 5, 2)
    .fillColor([cr, cg, cb])
    .fill();
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor([tr, tg, tb])
    .text(text, 92, y, { width: doc.page.width - 164, lineGap: 2 });
  return doc.y + 6;
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number, currentY: number): number {
  if (currentY + needed > doc.page.height - 80) {
    doc.addPage();
    drawBackground(doc);
    return 72;
  }
  return currentY;
}

export function generateStephenResume(data: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createBaseDoc();
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      let y = drawHeader(doc, 'Stephen Lutar', 'Founder & Chief Executive, SZL Holdings');

      const [pr, pg, pb] = hexToRgb(BRAND.primary);
      const [mr, mg, mb] = hexToRgb(BRAND.muted);
      const [tr, tg, tb] = hexToRgb(BRAND.text);

      y = sectionTitle(doc, 'Profile', y + 12);
      y = bodyText(
        doc,
        'Builder, operator, and systems architect. Designed and operates the full SZL ecosystem across six platforms spanning maritime intelligence, cybersecurity, AI infrastructure, real estate, and enterprise operations. Two-year track record shipping production-grade software across multiple domain verticals within a single compounding monorepo architecture.',
        y + 6,
      );

      y = sectionTitle(doc, 'Portfolio — Platforms Built', y + 14);

      const platforms = [
        {
          name: 'SZL Holdings',
          role: 'Founder & CEO',
          period: '2023–Present',
          desc: 'Holding company and strategic architecture for a portfolio of domain-specific enterprise intelligence platforms.',
        },
        {
          name: 'Lyte Command Center',
          role: 'Architect & Lead Engineer',
          period: '2024 Q2–Present',
          desc: 'Business observability platform with multi-model AI routing, cross-portfolio signal aggregation, and infrastructure telemetry.',
        },
        {
          name: 'Vessels Maritime Intelligence',
          role: 'Architect & Lead Engineer',
          period: '2024 Q2–Present',
          desc: 'Fleet intelligence covering AIS tracking, voyage economics, sanctions screening, and operational command surfaces.',
        },
        {
          name: 'Aegis — Unified Defense & Intelligence',
          role: 'Architect & Lead Engineer',
          period: '2024 Q3–Present',
          desc: 'Unified cybersecurity command platform converging SOC operations, threat intelligence, and MSP management.',
        },
        {
          name: 'Terra Real Estate Intelligence',
          role: 'Architect & Lead Engineer',
          period: '2024 Q3–Present',
          desc: 'Distress-first real estate platform covering NYC with multi-factor distress scoring, deal pipeline, and market context.',
        },
        {
          name: 'Carlota Jo Consulting',
          role: 'Architect & Lead Engineer',
          period: '2024–Present',
          desc: 'Strategic advisory platform with client portal, engagement management, and AI-augmented advisory sessions.',
        },
      ];

      for (const p of platforms) {
        y = ensureSpace(doc, 60, y);
        const [br, bg, bb] = hexToRgb(BRAND.border);
        doc
          .rect(72, y, doc.page.width - 144, 52)
          .fillColor([br, bg, bb])
          .fillOpacity(0.4)
          .fill();
        doc.fillOpacity(1);
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor([tr, tg, tb])
          .text(p.name, 84, y + 8);
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor([pr, pg, pb])
          .text(p.role, 84, y + 23);
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor([mr, mg, mb])
          .text(p.period, doc.page.width - 72 - 80, y + 23, { width: 80, align: 'right' });
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor([mr, mg, mb])
          .text(p.desc, 84, y + 36, { width: doc.page.width - 156 });
        y += 60;
      }

      y = sectionTitle(doc, 'Technical Capabilities', y + 14);

      const skills = [
        {
          layer: 'Frontend',
          items: 'React, TypeScript, Vite, Tailwind CSS, Framer Motion, TanStack Query',
        },
        { layer: 'Backend', items: 'Node.js, Express, TypeScript, REST APIs, GraphQL, WebSockets' },
        { layer: 'Data', items: 'PostgreSQL, PostGIS, Drizzle ORM, Zod validation, Redis' },
        {
          layer: 'AI & ML',
          items:
            'OpenAI GPT-4, Anthropic Claude, Google Gemini, Multi-model routing, RAG pipelines',
        },
        {
          layer: 'Infrastructure',
          items: 'Monorepo (pnpm), Shared auth, Row-level security, Immutable audit logs',
        },
        {
          layer: 'Domains',
          items:
            'Maritime (AIS, MMSI, IMO), Real estate (PostGIS, NYC Open Data), Cybersecurity (MITRE ATT&CK)',
        },
      ];

      const colW2 = (doc.page.width - 144 - 8) / 2;
      let col = 0;
      let rowY = y + 6;
      let maxRowY = rowY;

      for (const s of skills) {
        y = ensureSpace(doc, 40, col === 0 ? rowY : rowY);
        const x = col === 0 ? 72 : 72 + colW2 + 8;
        const [br, bg, bb] = hexToRgb(BRAND.border);
        doc.rect(x, rowY, colW2, 36).fillColor([br, bg, bb]).fillOpacity(0.4).fill();
        doc.fillOpacity(1);
        doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor([mr, mg, mb])
          .text(s.layer.toUpperCase(), x + 8, rowY + 6, { characterSpacing: 1 });
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor([tr, tg, tb])
          .text(s.items, x + 8, rowY + 18, { width: colW2 - 16 });
        const after = doc.y + 4;
        if (after > maxRowY) maxRowY = after;
        col++;
        if (col >= 2) {
          col = 0;
          rowY = maxRowY + 6;
          maxRowY = rowY;
        }
      }
      y = maxRowY + 14;

      y = sectionTitle(doc, 'Stats', y);

      y = metricRow(
        doc,
        [
          { label: 'Platforms Live', value: '5' },
          { label: 'Codebase', value: '1 Monorepo' },
          { label: 'Lines of Code', value: '150k+' },
          { label: 'Commits', value: '1,200+' },
          { label: 'Build Time', value: '2 Years' },
        ],
        y + 6,
      );

      drawFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateSZLInvestorLetter(data: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createBaseDoc();
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const quarter = (data.quarter as string) || 'Q1 2026';

      let y = drawHeader(
        doc,
        `Quarterly Investor Letter — ${quarter}`,
        'SZL Holdings — Strategic Update',
      );

      const [tr, tg, tb] = hexToRgb(BRAND.text);
      const [mr, mg, mb] = hexToRgb(BRAND.muted);
      const [pr, pg, pb] = hexToRgb(BRAND.primary);

      y = sectionTitle(doc, 'Executive Summary', y + 12);
      y = bodyText(
        doc,
        'SZL Holdings continues to execute on its thesis of building command-layer infrastructure for organizations where unreliability is not a recoverable condition. This quarter, all five platforms remained live and in active development. The compounding architecture thesis is showing early validation — shared components and infrastructure continue to reduce marginal build cost per platform.',
        y + 6,
      );

      y = sectionTitle(doc, 'Platform Status', y + 14);

      const platforms = [
        {
          name: 'Carlota Jo Consulting',
          tag: 'Immediate Revenue',
          status: 'Active',
          detail: 'High-margin advisory engagements. Recurring retainer model. Cash flow positive.',
        },
        {
          name: 'Terra Real Estate Intelligence',
          tag: 'Wedge',
          status: 'Active',
          detail: 'NYC distress market coverage. Broker + investor segments. Subscription SaaS.',
        },
        {
          name: 'Aegis (Defense & Intelligence)',
          tag: 'Enterprise',
          status: 'Active',
          detail: 'SOC + MSP + AI intelligence converged. High-ACV enterprise contracts.',
        },
        {
          name: 'Vessels Maritime Intelligence',
          tag: 'Specialized',
          status: 'Active',
          detail: 'Fleet command platform. AIS tracking, voyage economics, sanctions screening.',
        },
        {
          name: 'Lyte Command Center',
          tag: 'Infrastructure',
          status: 'Active',
          detail: 'Business observability. Multi-model AI routing. Portfolio-wide telemetry.',
        },
      ];

      for (const p of platforms) {
        y = ensureSpace(doc, 55, y);
        const [br, bg, bb] = hexToRgb(BRAND.border);
        doc
          .rect(72, y, doc.page.width - 144, 48)
          .fillColor([br, bg, bb])
          .fillOpacity(0.3)
          .fill();
        doc.fillOpacity(1);
        doc
          .circle(84, y + 16, 4)
          .fillColor([
            hexToRgb(BRAND.emerald)[0],
            hexToRgb(BRAND.emerald)[1],
            hexToRgb(BRAND.emerald)[2],
          ])
          .fill();
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor([tr, tg, tb])
          .text(p.name, 96, y + 8);
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor([pr, pg, pb])
          .text(p.tag, 96, y + 24);
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor([mr, mg, mb])
          .text(p.detail, 200, y + 22, { width: doc.page.width - 272 });
        y += 56;
      }

      y = sectionTitle(doc, 'Revenue Architecture', y + 14);
      y = bodyText(
        doc,
        "Three distinct monetization tracks drive SZL Holdings' revenue model:",
        y + 6,
      );
      y = bulletItem(
        doc,
        'Immediate: Carlota Jo advisory retainers — high margin, low capital intensity, cash flow positive.',
        y,
      );
      y = bulletItem(
        doc,
        'Wedge: Terra subscription SaaS — data moat via NYC distress intelligence, broker and investor segments.',
        y,
      );
      y = bulletItem(
        doc,
        'Enterprise: Aegis contract model — high ACV, multi-module expansion, SOC + MSP + AI intelligence unified.',
        y,
      );

      y = sectionTitle(doc, 'Strategic Thesis', y + 14);

      const thesis = [
        {
          heading: 'Systems over features',
          body: 'Features are copied. Systems — the interconnected logic of how an organization actually works — are not. Every SZL platform is designed around the operational system.',
        },
        {
          heading: 'Operators, not advisors',
          body: 'SZL Holdings builds systems, operates them, and owns the outcomes. Skin in the game is a design constraint.',
        },
        {
          heading: 'Compounding architecture',
          body: 'Six platforms on one backbone means every platform gets smarter as the others grow. The whole is structurally greater than the sum.',
        },
      ];

      for (const t of thesis) {
        y = ensureSpace(doc, 55, y);
        const [br, bg, bb] = hexToRgb(BRAND.border);
        doc.rect(72, y, 3, 42).fillColor([pr, pg, pb]).fillOpacity(0.6).fill();
        doc.fillOpacity(1);
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor([tr, tg, tb])
          .text(t.heading, 84, y + 4);
        doc
          .font('Helvetica')
          .fontSize(9.5)
          .fillColor([mr, mg, mb])
          .text(t.body, 84, y + 20, { width: doc.page.width - 156, lineGap: 2 });
        y = doc.y + 14;
      }

      y = sectionTitle(doc, 'Contact & Materials', y + 14);
      y = bodyText(
        doc,
        'SZL Holdings is a private operating company. Detailed financials are available under NDA to qualified investors and strategic partners.',
        y + 6,
      );
      y = bodyText(doc, 'Contact: hello@szlholdings.com  |  www.szlholdings.com', y);

      drawFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateSZLComplianceSummary(data: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createBaseDoc();
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      let y = drawHeader(
        doc,
        'Platform Security & Compliance Summary',
        'SZL Holdings Trust Center — Architecture & Governance',
      );

      const [tr, tg, tb] = hexToRgb(BRAND.text);
      const [mr, mg, mb] = hexToRgb(BRAND.muted);

      y = sectionTitle(doc, 'Overview', y + 12);
      y = bodyText(
        doc,
        'This document describes the platform architecture principles, access and control model, AI governance approach, deployment discipline, incident readiness, and security posture that underpin every product in the SZL ecosystem. Not a compliance checklist — a record of how we build and why.',
        y + 6,
      );

      const sections = [
        {
          title: 'Platform Architecture',
          items: [
            {
              label: 'Four-layer model',
              body: 'Observe, Understand, Execute, and Advise. Each layer has a defined function and interface contract with adjacent layers.',
            },
            {
              label: 'Shared infrastructure',
              body: 'Every product shares a common design system, event schema, entity model, and API layer for cross-domain traceability.',
            },
            {
              label: 'Explicit state',
              body: 'Data freshness, demo mode, model version, and agent confidence are always visible to the operator.',
            },
          ],
        },
        {
          title: 'Access Control',
          items: [
            {
              label: 'Role-based access',
              body: 'Access is granted by explicit role assignment scoped to operational need. Executives see strategic summaries; operators see tactical queues.',
            },
            {
              label: 'Destructive action gates',
              body: 'Irreversible actions require multi-step confirmation enforced at the workflow level. Session escalation is logged.',
            },
            {
              label: 'Short-lived sessions',
              body: 'Session tokens are time-limited. Privileged sessions require explicit re-authentication.',
            },
          ],
        },
        {
          title: 'AI Governance',
          items: [
            {
              label: 'Advisory, not autonomous',
              body: 'AI agents are advisory. They analyse, recommend, and synthesise. They do not execute changes without explicit human confirmation.',
            },
            {
              label: 'Explainability first',
              body: 'Every AI-generated recommendation includes reasoning. No black-box scoring.',
            },
            {
              label: 'Model accountability',
              body: 'Model versions are logged. Drift is monitored. Changes trigger platform alerts.',
            },
          ],
        },
        {
          title: 'Security Posture',
          items: [
            {
              label: 'Encryption',
              body: 'All inter-service communication is encrypted (TLS 1.3). Data at rest uses AES-256 equivalent standards.',
            },
            {
              label: 'Vulnerability management',
              body: 'Dependency scanning is automated. Critical vulnerabilities trigger immediate review.',
            },
            {
              label: 'Data handling',
              body: 'Operational data is used only to deliver the service. Not sold or shared for advertising. Retention windows defined and enforced.',
            },
          ],
        },
      ];

      for (const section of sections) {
        y = ensureSpace(doc, 40, y);
        y = sectionTitle(doc, section.title, y + 14);
        for (const item of section.items) {
          y = ensureSpace(doc, 44, y);
          const [br, bg, bb] = hexToRgb(BRAND.border);
          doc
            .rect(72, y, doc.page.width - 144, 0.5)
            .fillColor([br, bg, bb])
            .fill();
          doc
            .font('Helvetica-Bold')
            .fontSize(8.5)
            .fillColor([tr, tg, tb])
            .text(item.label, 72, y + 8, { width: 140 });
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor([mr, mg, mb])
            .text(item.body, 220, y + 8, { width: doc.page.width - 292, lineGap: 2 });
          y = Math.max(doc.y, y + 32) + 4;
        }
      }

      y = sectionTitle(doc, 'Disclaimer', y + 14);
      y = bodyText(
        doc,
        'SZL Holdings does not claim SOC 2 certification or any formal regulatory compliance status at this time. This document describes our engineering and operational practices as they stand today. Enterprise compliance documentation and security posture details are available on request.',
        y + 6,
      );

      drawFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateTerraPropertyReport(data: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createBaseDoc();
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const property = (data.property as Record<string, unknown>) || {};
      const name = (property.name as string) || 'Property Analysis Report';
      const address = (property.address as string) || '';
      const city = (property.city as string) || '';
      const state = (property.state as string) || '';

      let y = drawHeader(
        doc,
        name,
        `Property Analysis — ${address}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}`,
      );

      const [tr, tg, tb] = hexToRgb(BRAND.text);
      const [mr, mg, mb] = hexToRgb(BRAND.muted);
      const [pr, pg, pb] = hexToRgb(BRAND.primary);

      y = sectionTitle(doc, 'Property Overview', y + 12);

      const metrics = [
        {
          label: 'Property Value',
          value: property.value ? `$${((property.value as number) / 1e6).toFixed(1)}M` : 'N/A',
        },
        {
          label: 'Monthly Revenue',
          value: property.monthlyRevenue
            ? `$${((property.monthlyRevenue as number) / 1e3).toFixed(0)}K`
            : 'N/A',
        },
        {
          label: 'Annual NOI',
          value: property.annualNOI
            ? `$${((property.annualNOI as number) / 1e3).toFixed(0)}K`
            : 'N/A',
        },
        { label: 'Cap Rate', value: property.capRate ? `${property.capRate}%` : 'N/A' },
        { label: 'Occupancy', value: property.occupancy ? `${property.occupancy}%` : 'N/A' },
        { label: 'Units', value: property.units ? `${property.units}` : 'N/A' },
      ];

      y = metricRow(doc, metrics.slice(0, 3), y + 8);
      y = metricRow(doc, metrics.slice(3, 6), y);

      y = sectionTitle(doc, 'Distress Analysis', y + 14);

      const distressScore =
        (data.distressScore as number) ?? (property.distressScore as number) ?? 0;
      const distressLevel = distressScore >= 70 ? 'High' : distressScore >= 40 ? 'Medium' : 'Low';
      const distressColor =
        distressScore >= 70 ? BRAND.rose : distressScore >= 40 ? BRAND.amber : BRAND.emerald;
      const [dr, dg, db] = hexToRgb(distressColor);

      const [br2, bg2, bb2] = hexToRgb(BRAND.border);
      doc
        .rect(72, y + 8, doc.page.width - 144, 52)
        .fillColor([br2, bg2, bb2])
        .fillOpacity(0.4)
        .fill();
      doc.fillOpacity(1);

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor([mr, mg, mb])
        .text('DISTRESS SCORE', 84, y + 16, { characterSpacing: 1 });
      doc
        .font('Helvetica-Bold')
        .fontSize(28)
        .fillColor([dr, dg, db])
        .text(`${distressScore}/100`, 84, y + 28);
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor([dr, dg, db])
        .text(distressLevel, 200, y + 36);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor([mr, mg, mb])
        .text(
          'Multi-factor distress scoring combining ownership stress, tax delinquency, permit violations, and market context.',
          200,
          y + 20,
          { width: doc.page.width - 272, lineGap: 2 },
        );

      y += 68;

      const distressFactors = (data.distressFactors as string[]) || [
        'Ownership concentration and transfer recency',
        'Tax delinquency status and payment history',
        'Building permit violations and ECB summons',
        'Mortgage encumbrance relative to assessed value',
        'Vacancy rate vs. submarket average',
      ];

      y = sectionTitle(doc, 'Contributing Factors', y + 8);
      for (const factor of distressFactors) {
        y = bulletItem(doc, factor, y);
      }

      y = sectionTitle(doc, 'Market Context', y + 14);

      const comps = (data.comparables as Array<Record<string, unknown>>) || [
        { address: '245 W 107th St, Manhattan', price: '$4.2M', capRate: '4.8%', date: 'Jan 2026' },
        {
          address: '891 Flatbush Ave, Brooklyn',
          price: '$2.8M',
          capRate: '5.1%',
          date: 'Feb 2026',
        },
        { address: '1204 Southern Blvd, Bronx', price: '$1.9M', capRate: '6.2%', date: 'Mar 2026' },
      ];

      const [br3, bg3, bb3] = hexToRgb(BRAND.border);
      doc
        .rect(72, y + 6, doc.page.width - 144, 20)
        .fillColor([br3, bg3, bb3])
        .fillOpacity(0.6)
        .fill();
      doc.fillOpacity(1);
      doc.font('Helvetica-Bold').fontSize(8).fillColor([mr, mg, mb]);
      const tw = doc.page.width - 144;
      doc.text('Address', 84, y + 12, { width: tw * 0.5 });
      doc.text('Sale Price', 84 + tw * 0.5, y + 12, { width: tw * 0.2 });
      doc.text('Cap Rate', 84 + tw * 0.7, y + 12, { width: tw * 0.15 });
      doc.text('Date', 84 + tw * 0.85, y + 12, { width: tw * 0.15 });
      y += 28;

      for (const comp of comps) {
        doc
          .rect(72, y, doc.page.width - 144, 0.5)
          .fillColor([br3, bg3, bb3])
          .fill();
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor([tr, tg, tb])
          .text(comp.address as string, 84, y + 6, { width: tw * 0.5 });
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor([pr, pg, pb])
          .text(comp.price as string, 84 + tw * 0.5, y + 6, { width: tw * 0.2 });
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor([tr, tg, tb])
          .text(comp.capRate as string, 84 + tw * 0.7, y + 6, { width: tw * 0.15 });
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor([mr, mg, mb])
          .text(comp.date as string, 84 + tw * 0.85, y + 6, { width: tw * 0.15 });
        y += 22;
      }

      y = sectionTitle(doc, 'Investment Thesis', y + 14);
      const thesis =
        (data.investmentThesis as string) ||
        'This property presents a distress acquisition opportunity in a market with strong long-term fundamentals. The combination of ownership stress signals, below-market occupancy, and near-term lease expirations creates a potential value-add scenario. Subject to further due diligence on title, physical condition, and capital stack requirements, this represents a candidate for the opportunistic acquisition pipeline.';
      y = bodyText(doc, thesis, y + 6);

      y = sectionTitle(doc, 'Risk Factors', y + 14);
      const risks = (data.risks as string[]) || [
        'Market liquidity risk in current rate environment',
        'Deferred maintenance capital requirements',
        'Regulatory and zoning compliance exposure',
        'Tenant roll risk and re-leasing timeline',
      ];
      for (const risk of risks) {
        y = bulletItem(doc, risk, y, BRAND.rose);
      }

      drawFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateAegisAssessmentReport(data: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createBaseDoc();
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const assessment = (data.assessment as Record<string, unknown>) || {};
      const name = (assessment.name as string) || 'Security Assessment Report';
      const assessmentType = ((assessment.assessmentType as string) || 'penetration_test').replace(
        /_/g,
        ' ',
      );
      const scope = (assessment.scope as string) || '';
      const targetEnv = (assessment.targetEnvironment as string) || '';

      let y = drawHeader(
        doc,
        name,
        `Security Assessment — ${assessmentType}${scope ? ` | ${scope}` : ''}`,
      );

      const [tr, tg, tb] = hexToRgb(BRAND.text);
      const [mr, mg, mb] = hexToRgb(BRAND.muted);
      const [pr, pg, pb] = hexToRgb(BRAND.primary);

      y = sectionTitle(doc, 'Assessment Details', y + 12);

      const details = [
        {
          label: 'Assessment Type',
          value: assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1),
        },
        { label: 'Target Environment', value: targetEnv || 'Not specified' },
        { label: 'Scope', value: scope || 'Not specified' },
        { label: 'Status', value: (assessment.status as string)?.replace(/_/g, ' ') || 'Draft' },
        {
          label: 'Date',
          value: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        },
        { label: 'Platform', value: 'Aegis — Unified Defense & Intelligence Command' },
      ];

      const colW3 = (doc.page.width - 144 - 8) / 2;
      let col3 = 0;
      let rowY3 = y + 8;

      for (const d of details) {
        const x = col3 === 0 ? 72 : 72 + colW3 + 8;
        const [br4, bg4, bb4] = hexToRgb(BRAND.border);
        doc.rect(x, rowY3, colW3, 36).fillColor([br4, bg4, bb4]).fillOpacity(0.3).fill();
        doc.fillOpacity(1);
        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor([mr, mg, mb])
          .text(d.label.toUpperCase(), x + 8, rowY3 + 6, {
            characterSpacing: 1,
            width: colW3 - 16,
          });
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor([tr, tg, tb])
          .text(d.value, x + 8, rowY3 + 18, { width: colW3 - 16 });
        col3++;
        if (col3 >= 2) {
          col3 = 0;
          rowY3 += 42;
        }
      }
      y = rowY3 + (col3 > 0 ? 42 : 0);

      const findings = (data.findings as Array<Record<string, unknown>>) || [];
      const criticalFindings = findings.filter((f) => f.severity === 'critical');
      const highFindings = findings.filter((f) => f.severity === 'high');
      const mediumFindings = findings.filter((f) => f.severity === 'medium');
      const lowFindings = findings.filter((f) => f.severity === 'low');

      y = metricRow(
        doc,
        [
          { label: 'Total Findings', value: `${findings.length}` },
          { label: 'Critical', value: `${criticalFindings.length}` },
          { label: 'High', value: `${highFindings.length}` },
          { label: 'Medium', value: `${mediumFindings.length}` },
          { label: 'Low / Info', value: `${lowFindings.length}` },
        ],
        y + 14,
      );

      if (findings.length > 0) {
        y = sectionTitle(doc, 'Findings Summary', y + 14);

        const severityColors: Record<string, string> = {
          critical: BRAND.rose,
          high: BRAND.amber,
          medium: '#f97316',
          low: BRAND.muted,
          info: BRAND.muted,
        };

        for (const finding of findings.slice(0, 10)) {
          y = ensureSpace(doc, 60, y);
          const sev = (finding.severity as string) || 'low';
          const [fr, fg, fb] = hexToRgb(severityColors[sev] || BRAND.muted);
          const [br5, bg5, bb5] = hexToRgb(BRAND.border);
          doc
            .rect(72, y, doc.page.width - 144, 52)
            .fillColor([br5, bg5, bb5])
            .fillOpacity(0.3)
            .fill();
          doc.fillOpacity(1);
          doc.rect(72, y, 3, 52).fillColor([fr, fg, fb]).fill();
          doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .fillColor([tr, tg, tb])
            .text((finding.title as string) || 'Untitled Finding', 84, y + 8, {
              width: doc.page.width - 200,
            });
          doc
            .font('Helvetica-Bold')
            .fontSize(8)
            .fillColor([fr, fg, fb])
            .text(sev.toUpperCase(), doc.page.width - 120, y + 8, { width: 48 });
          if (finding.affectedSystem) {
            doc
              .font('Helvetica')
              .fontSize(8)
              .fillColor([pr, pg, pb])
              .text(`System: ${finding.affectedSystem}`, 84, y + 22);
          }
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor([mr, mg, mb])
            .text(
              (finding.description as string)?.slice(0, 180) || '',
              84,
              finding.affectedSystem ? y + 32 : y + 22,
              { width: doc.page.width - 164, lineGap: 1 },
            );
          y += 60;
        }

        if (findings.length > 10) {
          y = bodyText(
            doc,
            `... and ${findings.length - 10} additional findings. Full findings list available in the Aegis platform.`,
            y,
          );
        }
      } else {
        y = sectionTitle(doc, 'Findings Summary', y + 14);
        y = bodyText(
          doc,
          'No findings have been recorded for this assessment yet. Conduct your assessment in the Aegis platform to populate this report with security findings.',
          y + 6,
        );
      }

      y = sectionTitle(doc, 'Recommendations', y + 14);
      const recommendations = (data.recommendations as string[]) || [
        'Conduct immediate triage of all critical and high severity findings.',
        'Establish a remediation timeline with assigned owners for each finding.',
        'Prioritize findings affecting externally-exposed systems and authentication paths.',
        'Schedule a follow-up validation assessment within 30 days of remediation.',
        'Update threat model and risk register based on assessment findings.',
      ];
      for (const rec of recommendations) {
        y = bulletItem(doc, rec, y, BRAND.accent);
      }

      y = sectionTitle(doc, 'Classification', y + 14);
      y = bodyText(
        doc,
        'This report is CONFIDENTIAL and intended solely for the named client organization. Distribution is restricted to authorized personnel. Contents describe actual or potential security vulnerabilities and must be handled accordingly.',
        y + 6,
      );

      drawFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateCarlotaEngagementSummary(data: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createBaseDoc();
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const client = (data.client as string) || 'Client';
      const period =
        (data.period as string) ||
        new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      let y = drawHeader(
        doc,
        `Engagement Summary — ${client}`,
        `Carlota Jo Consulting — Strategic Advisory  |  ${period}`,
      );

      const [tr, tg, tb] = hexToRgb(BRAND.text);
      const [mr, mg, mb] = hexToRgb(BRAND.muted);
      const [pr, pg, pb] = hexToRgb(BRAND.primary);

      y = sectionTitle(doc, 'Engagement Overview', y + 12);

      const overview =
        (data.overview as string) ||
        'This engagement summary compiles the key insights, strategic recommendations, and action items from recent advisory sessions. The recommendations presented here reflect analysis of market context, competitive dynamics, and organizational capability as of the engagement date.';
      y = bodyText(doc, overview, y + 6);

      const insights = (data.insights as Array<{
        title: string;
        type: string;
        summary: string;
        confidence?: number;
        tags?: string[];
      }>) || [
        {
          title: 'Strategic Priority Assessment',
          type: 'Strategic Analysis',
          summary:
            'Current resource allocation is not aligned with highest-value opportunities. Recommend rebalancing toward core growth drivers.',
          confidence: 85,
          tags: ['Strategy', 'Operations'],
        },
        {
          title: 'Market Positioning Review',
          type: 'Market Research',
          summary:
            'Competitive differentiation is strong in target segments. Adjacent market entry may dilute focus before core position is fully established.',
          confidence: 88,
          tags: ['Market Entry', 'Competitive'],
        },
        {
          title: 'Revenue Architecture Analysis',
          type: 'Revenue Strategy',
          summary:
            'Current pricing architecture undervalues delivered value. Value-based pricing transition would improve margin and signal quality.',
          confidence: 91,
          tags: ['Pricing', 'Revenue'],
        },
      ];

      if (insights.length > 0) {
        y = sectionTitle(doc, 'Key Insights', y + 14);

        for (const insight of insights) {
          y = ensureSpace(doc, 72, y);
          const [br6, bg6, bb6] = hexToRgb(BRAND.border);
          doc
            .rect(72, y, doc.page.width - 144, 64)
            .fillColor([br6, bg6, bb6])
            .fillOpacity(0.3)
            .fill();
          doc.fillOpacity(1);
          doc
            .font('Helvetica')
            .fontSize(7.5)
            .fillColor([pr, pg, pb])
            .text(insight.type, 84, y + 8);
          doc
            .font('Helvetica-Bold')
            .fontSize(11)
            .fillColor([tr, tg, tb])
            .text(insight.title, 84, y + 20);
          doc
            .font('Helvetica')
            .fontSize(9.5)
            .fillColor([mr, mg, mb])
            .text(insight.summary, 84, y + 36, { width: doc.page.width - 180, lineGap: 2 });
          if (insight.confidence) {
            const [er, eg, eb] = hexToRgb(BRAND.emerald);
            doc
              .font('Helvetica')
              .fontSize(8)
              .fillColor([er, eg, eb])
              .text(`${insight.confidence}% confidence`, doc.page.width - 130, y + 8, {
                width: 60,
              });
          }
          y += 72;
        }
      }

      const recommendations = (data.recommendations as string[]) || [
        'Accelerate GTM execution in the primary target segment before year-end.',
        'Initiate pricing architecture review with revenue team within 30 days.',
        'Establish clearer success metrics for each strategic initiative.',
        'Review org design to ensure capacity alignment with strategic priorities.',
      ];

      y = sectionTitle(doc, 'Recommendations', y + 14);
      for (const rec of recommendations) {
        y = bulletItem(doc, rec, y, BRAND.primary);
      }

      const nextSteps = (data.nextSteps as Array<{
        action: string;
        owner: string;
        deadline: string;
      }>) || [
        {
          action: 'Executive review of pricing architecture proposal',
          owner: 'Client CEO',
          deadline: '2 weeks',
        },
        {
          action: 'Market sizing validation for adjacent segment',
          owner: 'Strategy team',
          deadline: '30 days',
        },
        {
          action: 'Follow-up advisory session: Revenue architecture deep-dive',
          owner: 'Carlota Jo',
          deadline: '3 weeks',
        },
      ];

      y = sectionTitle(doc, 'Next Steps', y + 14);

      const [br7, bg7, bb7] = hexToRgb(BRAND.border);
      doc
        .rect(72, y + 6, doc.page.width - 144, 20)
        .fillColor([br7, bg7, bb7])
        .fillOpacity(0.6)
        .fill();
      doc.fillOpacity(1);
      const tw2 = doc.page.width - 144;
      doc.font('Helvetica-Bold').fontSize(8).fillColor([mr, mg, mb]);
      doc.text('Action', 84, y + 12, { width: tw2 * 0.55 });
      doc.text('Owner', 84 + tw2 * 0.55, y + 12, { width: tw2 * 0.25 });
      doc.text('Timeline', 84 + tw2 * 0.8, y + 12, { width: tw2 * 0.2 });
      y += 28;

      for (const step of nextSteps) {
        doc
          .rect(72, y, doc.page.width - 144, 0.5)
          .fillColor([br7, bg7, bb7])
          .fill();
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor([tr, tg, tb])
          .text(step.action, 84, y + 6, { width: tw2 * 0.55 });
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor([mr, mg, mb])
          .text(step.owner, 84 + tw2 * 0.55, y + 6, { width: tw2 * 0.25 });
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor([pr, pg, pb])
          .text(step.deadline, 84 + tw2 * 0.8, y + 6, { width: tw2 * 0.2 });
        y += 22;
      }

      y = sectionTitle(doc, 'Confidentiality', y + 14);
      y = bodyText(
        doc,
        "This document is prepared exclusively for the named client and is confidential. The insights and recommendations contained herein reflect Carlota Jo Consulting's analysis based on information provided during the engagement. This document should not be shared beyond the client organization without prior written consent.",
        y + 6,
      );

      drawFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateSZLPortfolioReport(data: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createBaseDoc();
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const asOf =
        (data.asOf as string) ||
        new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      let y = drawHeader(
        doc,
        'SZL Holdings — Portfolio Report',
        `Platform Overview & Strategic Status  |  As of ${asOf}`,
      );

      const [tr, tg, tb] = hexToRgb(BRAND.text);
      const [mr, mg, mb] = hexToRgb(BRAND.muted);
      const [pr, pg, pb] = hexToRgb(BRAND.primary);

      y = sectionTitle(doc, 'Portfolio at a Glance', y + 12);

      y = metricRow(
        doc,
        [
          { label: 'Active Platforms', value: '6' },
          { label: 'Architecture', value: 'Monorepo' },
          { label: 'Revenue Tracks', value: '3' },
          { label: 'Codebase Age', value: '2 Years' },
          { label: 'Build Velocity', value: '1,200+ Commits' },
        ],
        y + 8,
      );

      y = sectionTitle(doc, 'Platform Portfolio', y + 14);

      const platforms = [
        {
          name: 'Carlota Jo Consulting',
          tag: 'Revenue — Immediate',
          status: 'Live',
          model: 'Advisory Retainers',
          segment: 'Enterprise C-Suite',
          detail:
            'High-margin advisory engagements. Recurring retainer model with AI-augmented strategic research. Cash flow positive from first engagement.',
          color: BRAND.emerald,
        },
        {
          name: 'Terra Real Estate Intelligence',
          tag: 'Revenue — Wedge SaaS',
          status: 'Live',
          model: 'Subscription SaaS',
          segment: 'Brokers & Investors',
          detail:
            'NYC distress property intelligence platform. Multi-factor distress scoring, deal pipeline workflow, and market context. Data moat via Open Data integration.',
          color: '#84cc16',
        },
        {
          name: 'Aegis — Unified Defense & Intelligence',
          tag: 'Revenue — Enterprise',
          status: 'Live',
          model: 'Enterprise Contracts',
          segment: 'Enterprise Security Teams & MSPs',
          detail:
            'Unified SOC, XDR, threat intelligence, and MSP operations. Replaces four fragmented security vendors. High-ACV contracts with strong multi-module expansion.',
          color: BRAND.accent,
        },
        {
          name: 'Vessels Maritime Intelligence',
          tag: 'Specialized Intelligence',
          status: 'Live',
          model: 'Data & SaaS',
          segment: 'Traders, Operators, Regulators',
          detail:
            'Full-spectrum maritime domain awareness. AIS tracking, sanctions screening, voyage economics, and dark vessel detection. 52,000+ vessels monitored.',
          color: '#22d3ee',
        },
        {
          name: 'Lyte Command Center',
          tag: 'Infrastructure',
          status: 'Live',
          model: 'B2B SaaS',
          segment: 'Executives & Operations Teams',
          detail:
            'Business observability platform. Converts operational signals into severity-ranked, explainable decisions. 2.4M+ signals processed per day.',
          color: BRAND.amber,
        },
        {
          name: 'Stephen Lutar — Founder Site',
          tag: 'Presence Layer',
          status: 'Live',
          model: 'Identity & Outreach',
          segment: 'Investors, Clients, Partners',
          detail:
            'Founder identity and professional presence layer. Professional profile, project showcase, and strategic narrative for the SZL ecosystem.',
          color: BRAND.muted,
        },
      ];

      for (const p of platforms) {
        y = ensureSpace(doc, 70, y);
        const [br, bg, bb] = hexToRgb(BRAND.border);
        const [cr, cg, cb] = hexToRgb(p.color);
        doc
          .rect(72, y, doc.page.width - 144, 62)
          .fillColor([br, bg, bb])
          .fillOpacity(0.3)
          .fill();
        doc.fillOpacity(1);
        doc.rect(72, y, 3, 62).fillColor([cr, cg, cb]).fill();
        doc
          .circle(84 + 4, y + 14, 4)
          .fillColor([
            hexToRgb(BRAND.emerald)[0],
            hexToRgb(BRAND.emerald)[1],
            hexToRgb(BRAND.emerald)[2],
          ])
          .fill();
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor([tr, tg, tb])
          .text(p.name, 96, y + 8, { width: doc.page.width - 240 });
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor([cr, cg, cb])
          .text(p.tag, 96, y + 24);
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor([mr, mg, mb])
          .text(`Model: ${p.model}  ·  Segment: ${p.segment}`, 96, y + 36);
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor([mr, mg, mb])
          .text(p.detail, 84, y + 48, { width: doc.page.width - 170, lineGap: 1 });
        y += 70;
      }

      y = sectionTitle(doc, 'Revenue Architecture', y + 14);
      y = bodyText(
        doc,
        'SZL Holdings operates three revenue tracks, each providing distinct economics and strategic optionality:',
        y + 6,
      );

      const tracks = [
        {
          track: 'Track 1 — Immediate',
          color: BRAND.emerald,
          body: 'Carlota Jo advisory retainers. High-margin service contracts, recurring revenue, and low capital intensity. Provides cash flow and proof of market trust from day one.',
        },
        {
          track: 'Track 2 — Wedge SaaS',
          color: BRAND.amber,
          body: 'Terra subscription revenue. Data moat built on NYC Open Data integration with a distress-first thesis. Broker and investor segments provide diversified demand.',
        },
        {
          track: 'Track 3 — Enterprise',
          color: BRAND.accent,
          body: 'Aegis enterprise security contracts. High ACV, multi-module expansion, and SOC + MSP + AI intelligence consolidated on one platform. Strong retention economics.',
        },
      ];

      for (const t of tracks) {
        y = ensureSpace(doc, 52, y);
        const [cr, cg, cb] = hexToRgb(t.color);
        const [br, bg, bb] = hexToRgb(BRAND.border);
        doc
          .rect(72, y, doc.page.width - 144, 44)
          .fillColor([br, bg, bb])
          .fillOpacity(0.3)
          .fill();
        doc.fillOpacity(1);
        doc.rect(72, y, 3, 44).fillColor([cr, cg, cb]).fill();
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor([cr, cg, cb])
          .text(t.track, 84, y + 6);
        doc
          .font('Helvetica')
          .fontSize(9.5)
          .fillColor([mr, mg, mb])
          .text(t.body, 84, y + 20, { width: doc.page.width - 156, lineGap: 2 });
        y = doc.y + 10;
      }

      y = sectionTitle(doc, 'Competitive Positioning', y + 14);
      const advantages = [
        'Compounding architecture: six platforms on a shared backbone — marginal cost per platform decreases as the system scales.',
        'Operator, not advisor: SZL builds, ships, and operates. Accountability is a structural design constraint.',
        'Domain convergence: maritime, real estate, cybersecurity, and business intelligence in one architecture — enabling cross-domain signal fusion unavailable to single-vertical competitors.',
        'Speed to market: monorepo with shared infrastructure, design system, and auth layer allows new product deployment in days, not quarters.',
      ];

      for (const adv of advantages) {
        y = bulletItem(doc, adv, y, BRAND.primary);
      }

      y = sectionTitle(doc, 'Classification', y + 14);
      y = bodyText(
        doc,
        'CONFIDENTIAL — This document is prepared for qualified investors and strategic partners under NDA. SZL Holdings is a private operating company. Detailed financial statements are available on request. Contact: hello@szlholdings.com',
        y + 6,
      );

      drawFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateFirestormIncidentSummary(data: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = createBaseDoc();
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const incident = (data.incident as Record<string, unknown>) || {};
      const title = (incident.title as string) || 'Incident Report';
      const severity = (incident.severity as string) || 'medium';
      const status = (incident.status as string) || 'investigation';

      const severityColors: Record<string, string> = {
        critical: BRAND.rose,
        high: BRAND.amber,
        medium: '#f97316',
        low: BRAND.muted,
      };
      const severityColor = severityColors[severity] || BRAND.muted;

      let y = drawHeader(
        doc,
        title,
        `Incident Report — ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity  |  Aegis Unified Defense`,
      );

      const [tr, tg, tb] = hexToRgb(BRAND.text);
      const [mr, mg, mb] = hexToRgb(BRAND.muted);
      const [pr, pg, pb] = hexToRgb(BRAND.primary);
      const [sr, sg, sb] = hexToRgb(severityColor);

      y = sectionTitle(doc, 'Incident Details', y + 12);

      const details = [
        { label: 'Severity', value: severity.toUpperCase() },
        {
          label: 'Status',
          value: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        },
        { label: 'Assigned Analyst', value: (incident.assignedAnalyst as string) || 'Unassigned' },
        {
          label: 'Attack Technique',
          value: (incident.attackTechnique as string) || 'Under Investigation',
        },
        {
          label: 'Report Generated',
          value: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        },
        { label: 'Platform', value: 'Aegis — Unified Defense & Intelligence Command' },
      ];

      const colW = (doc.page.width - 144 - 8) / 2;
      let col = 0;
      let rowY = y + 8;

      for (const d of details) {
        const x = col === 0 ? 72 : 72 + colW + 8;
        const [br, bg, bb] = hexToRgb(BRAND.border);
        doc.rect(x, rowY, colW, 36).fillColor([br, bg, bb]).fillOpacity(0.3).fill();
        doc.fillOpacity(1);
        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor([mr, mg, mb])
          .text(d.label.toUpperCase(), x + 8, rowY + 6, { characterSpacing: 1, width: colW - 16 });
        const valColor = d.label === 'Severity' ? [sr, sg, sb] : [tr, tg, tb];
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(valColor as [number, number, number])
          .text(d.value, x + 8, rowY + 18, { width: colW - 16 });
        col++;
        if (col >= 2) {
          col = 0;
          rowY += 42;
        }
      }
      y = rowY + (col > 0 ? 42 : 0);

      y = sectionTitle(doc, 'Incident Description', y + 14);
      const description =
        (incident.description as string) ||
        'Incident details are pending investigation. Analysts have been notified and initial triage is underway.';
      y = bodyText(doc, description, y + 6);

      const timeline =
        (data.timeline as Array<{ timestamp: string; event: string; actor?: string }>) || [];

      if (timeline.length > 0) {
        y = sectionTitle(doc, 'Timeline', y + 14);
        const [br, bg, bb] = hexToRgb(BRAND.border);
        for (const event of timeline) {
          y = ensureSpace(doc, 36, y);
          doc
            .rect(72, y, doc.page.width - 144, 0.5)
            .fillColor([br, bg, bb])
            .fill();
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor([mr, mg, mb])
            .text(event.timestamp, 72, y + 6, { width: 140 });
          doc
            .font('Helvetica')
            .fontSize(9.5)
            .fillColor([tr, tg, tb])
            .text(event.event, 220, y + 6, { width: doc.page.width - 292 });
          if (event.actor) {
            doc
              .font('Helvetica')
              .fontSize(8)
              .fillColor([pr, pg, pb])
              .text(`by ${event.actor}`, doc.page.width - 140, y + 6, {
                width: 68,
                align: 'right',
              });
          }
          y += 22;
        }
      }

      const affectedSystems = (data.affectedSystems as string[]) || [];
      if (affectedSystems.length > 0) {
        y = sectionTitle(doc, 'Affected Systems', y + 14);
        for (const sys of affectedSystems) {
          y = bulletItem(doc, sys, y, BRAND.rose);
        }
      }

      y = sectionTitle(doc, 'Response Actions Taken', y + 14);
      const actions = (data.responseActions as string[]) || [
        'Initial detection and severity triage completed.',
        'Incident record opened in Aegis platform with full audit trail.',
        'Assigned analyst notified and investigation initiated.',
        'Affected systems flagged for containment evaluation.',
        'Stakeholder notification distributed per incident response protocol.',
      ];
      for (const action of actions) {
        y = bulletItem(doc, action, y, BRAND.accent);
      }

      y = sectionTitle(doc, 'Recommendations', y + 14);
      const recommendations = (data.recommendations as string[]) || [
        'Complete root cause analysis before closing the incident record.',
        'Validate that all affected systems have been identified and assessed.',
        'Schedule a post-incident review within 7 days of resolution.',
        'Update threat model and detection rules based on attack technique identified.',
        'Document lessons learned and update the incident response playbook.',
      ];
      for (const rec of recommendations) {
        y = bulletItem(doc, rec, y, BRAND.amber);
      }

      y = sectionTitle(doc, 'Classification', y + 14);
      y = bodyText(
        doc,
        'This document is RESTRICTED and for authorized security personnel only. Contents describe an active or recent security incident and must be handled with appropriate confidentiality. Do not distribute beyond the named response team without CISO authorization.',
        y + 6,
      );

      drawFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function generateDocument(
  template: string,
  data: Record<string, unknown>,
): Promise<Buffer> {
  switch (template) {
    case 'stephen-resume':
      return generateStephenResume(data);
    case 'szl-investor-letter':
      return generateSZLInvestorLetter(data);
    case 'szl-compliance-summary':
      return generateSZLComplianceSummary(data);
    case 'szl-portfolio-report':
      return generateSZLPortfolioReport(data);
    case 'terra-property-report':
      return generateTerraPropertyReport(data);
    case 'aegis-assessment-report':
      return generateAegisAssessmentReport(data);
    case 'firestorm-incident-summary':
      return generateFirestormIncidentSummary(data);
    case 'carlota-engagement-summary':
      return generateCarlotaEngagementSummary(data);
    default:
      throw new Error(`Unknown template: ${template}`);
  }
}
