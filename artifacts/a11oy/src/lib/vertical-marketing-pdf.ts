import { jsPDF } from 'jspdf';

const DARK: [number, number, number] = [7, 9, 14];
const SURFACE: [number, number, number] = [14, 18, 28];
const SURFACE2: [number, number, number] = [20, 26, 40];
const BORDER: [number, number, number] = [35, 44, 64];
const TEXT: [number, number, number] = [220, 215, 200];
const MUTED: [number, number, number] = [110, 120, 140];
const ACCENT_GOLD: [number, number, number] = [201, 183, 135];

type RGB = [number, number, number];

function fill(doc: jsPDF, c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
function draw(doc: jsPDF, c: RGB) { doc.setDrawColor(c[0], c[1], c[2]); }
function textColor(doc: jsPDF, c: RGB) { doc.setTextColor(c[0], c[1], c[2]); }

function bg(doc: jsPDF) {
  fill(doc, DARK);
  doc.rect(0, 0, 210, 297, 'F');
}

function gridLines(doc: jsPDF) {
  draw(doc, BORDER);
  doc.setLineWidth(0.07);
  for (let x = 0; x <= 210; x += 21) doc.line(x, 0, x, 297);
  for (let y = 0; y <= 297; y += 21) doc.line(0, y, 210, y);
}

function header(doc: jsPDF, pg: number, total: number, label: string) {
  fill(doc, SURFACE);
  doc.rect(0, 0, 210, 13, 'F');
  draw(doc, BORDER);
  doc.setLineWidth(0.2);
  doc.line(0, 13, 210, 13);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  textColor(doc, ACCENT_GOLD);
  doc.text('SZL HOLDINGS · A11OY', 12, 8.5);
  doc.setFont('helvetica', 'normal');
  textColor(doc, MUTED);
  doc.text(label.toUpperCase(), 105, 8.5, { align: 'center' });
  doc.text(`${pg} / ${total}`, 198, 8.5, { align: 'right' });
}

function footer(doc: jsPDF) {
  const y = 287;
  draw(doc, BORDER);
  doc.setLineWidth(0.15);
  doc.line(12, y, 198, y);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  textColor(doc, MUTED);
  doc.text('© 2026 SZL Holdings · Governed Autonomy · inquiries@szlholdings.com · szlholdings.com', 12, y + 5);
  doc.text('2026', 198, y + 5, { align: 'right' });
}

function accentBar(doc: jsPDF, x: number, y: number, w: number, color: RGB) {
  fill(doc, color);
  doc.rect(x, y, w, 1.5, 'F');
}

function wrapped(doc: jsPDF, text: string, x: number, y: number, maxW: number, lh: number, fs: number, color: RGB, style: 'normal' | 'bold' = 'normal'): number {
  doc.setFontSize(fs);
  doc.setFont('helvetica', style);
  textColor(doc, color);
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, x, y);
  return y + lines.length * lh;
}

function sectionLabel(doc: jsPDF, label: string, x: number, y: number) {
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  textColor(doc, ACCENT_GOLD);
  doc.text(label.toUpperCase(), x, y);
}

export interface VerticalSpec {
  id: string;
  name: string;
  fullName: string;
  emoji: string;
  color: RGB;
  domain: string;
  tagline: string;
  philosophy: string;
  howA11oyPowers: string;
  architectureLayers: Array<{ layer: string; desc: string }>;
  capabilities: Array<{ title: string; proof: string }>;
}

export const VERTICAL_SPECS: VerticalSpec[] = [
  {
    id: 'lyte',
    name: 'KORA',
    fullName: 'KORA — Decision Intelligence',
    emoji: '◆',
    color: [201, 152, 64] as RGB,
    domain: 'Decision Intelligence',
    tagline: 'Governed multi-model routing and portfolio-wide signal observability.',
    philosophy: 'Every enterprise generates more operational signal than human teams can process. KORA exists to close the gap — not by replacing human judgment, but by making human judgment faster, sharper, and traceable. Through A11oy\'s governed decision loop, KORA transforms raw operational data into classified signals, routes them through the right model at the right cost, and surfaces them to the right decision-maker at precisely the right moment. Every recommendation carries confidence intervals. Every decision carries a proof envelope.',
    howA11oyPowers: 'A11oy\'s Signal Mesh ingests portfolio-wide data from all verticals simultaneously. The Causal Core explains the why behind every anomaly before routing it to KORA operators. The Covenant Layer enforces policy gates on material decisions — no AI agent autonomously executes without human approval on consequential actions. The Proof Ledger creates an immutable record of every decision chain, making KORA\'s operational intelligence auditable by design.',
    architectureLayers: [
      { layer: 'Signal Mesh', desc: 'Continuous ingestion and classification of cross-vertical operational signals — revenue anomalies, resource gaps, pipeline deviations, and system health alerts.' },
      { layer: 'Causal Core', desc: 'Traces the causal chain behind every signal — surfacing root cause, downstream exposure, and confidence-weighted explanation before recommendation.' },
      { layer: 'Model Router', desc: 'Routes decision workloads across 8+ frontier models (Claude, GPT, DeepSeek, Gemini, Llama) with cost awareness, policy constraints, and performance tracking.' },
      { layer: 'Covenant Layer', desc: 'Policy-as-code engine enforcing who can approve which decisions, under what conditions — structured into the execution fabric, not a UI overlay.' },
      { layer: 'Proof Ledger', desc: 'SHA-256 hashed, tamper-evident, actor-attributed record of every decision — exportable for board-level review, compliance filing, and capital diligence.' },
    ],
    capabilities: [
      { title: 'Multi-Model Signal Routing', proof: 'Routes decision workloads across Claude, GPT-4, DeepSeek V3, and Llama 4 with cost and policy awareness — no single model dependency.' },
      { title: 'Portfolio-Wide Observability', proof: 'Single operational surface covering all SZL verticals — one view, governed intelligence, cross-domain signal correlation.' },
      { title: 'Confidence-Weighted Recommendations', proof: 'Every AI recommendation carries confidence intervals from Monte Carlo simulation — operators see outcome distributions, not point estimates.' },
      { title: 'Governed Execution Gates', proof: 'Material decisions pass through Covenant Policy before execution — human approval is structural, not configurable.' },
      { title: 'Full Proof Chain Attribution', proof: 'Every decision links to the signal that triggered it, the model that recommended it, the operator who approved it, and the outcome it produced.' },
    ],
  },
  {
    id: 'aegis',
    name: 'PARAGON',
    fullName: 'PARAGON — Defense & Intelligence Command',
    emoji: '⬡',
    color: [100, 130, 220] as RGB,
    domain: 'Defense & Intelligence',
    tagline: 'Unified SOC, threat intelligence, and defense operations — governed and accountable.',
    philosophy: 'Security operations generate the highest-stakes signals in any enterprise. A wrong call on a threat — either dismissing a real attack or acting on a false positive — carries material consequence. PARAGON brings A11oy\'s governed intelligence framework to the security domain, ensuring every incident recommendation is traceable, every response action is policy-gated, and every outcome is recorded immutably. In an era of AI-assisted security operations, accountability requires proof — not just logs.',
    howA11oyPowers: 'A11oy\'s Signal Mesh normalizes threat intelligence from disparate sources — SIEM events, MITRE ATT&CK correlations, vulnerability feeds, and network telemetry — into a unified classified signal stream. The Causal Core traces attack chains and attribution. Covenant Policy enforces tiered response authorization — automated containment for known patterns, human escalation for novel threats. Every containment action, every escalation decision, every incident closure is Proof Ledger-attributed.',
    architectureLayers: [
      { layer: 'Threat Signal Mesh', desc: 'Normalizes SIEM events, threat feeds, MITRE ATT&CK mappings, and network telemetry into a governed signal stream with severity classification.' },
      { layer: 'Attack Chain Tracer', desc: 'Causal Core applied to security — maps the kill chain from initial access to potential impact, with confidence-weighted attribution.' },
      { layer: 'Response Policy Engine', desc: 'Covenant Layer encoding response authorization tiers — automated containment for known signatures, mandatory human escalation for novel or high-impact threats.' },
      { layer: 'Compliance Posture Monitor', desc: 'Continuous policy evaluation against NIST, CMMC, StateRAMP, and organizational standards — not audit-time snapshots but continuous real-time posture.' },
      { layer: 'Incident Proof Chain', desc: 'Every detection, escalation, containment, and closure action recorded in the Proof Ledger with full actor attribution — exportable for regulators and insurers.' },
    ],
    capabilities: [
      { title: 'Unified SOC Command Surface', proof: 'Single operator view across managed operations, security operations, and threat intelligence — no context-switching between tools.' },
      { title: 'MITRE ATT&CK Correlation', proof: 'Every threat signal mapped to the ATT&CK framework — operators see technique, tactic, and attribution in a single classified surface.' },
      { title: 'Governed Incident Response', proof: 'Response actions pass through policy gates — automated for known playbooks, human-in-the-loop for novel or high-impact incidents.' },
      { title: 'Continuous Compliance Posture', proof: 'Real-time NIST, CMMC, and StateRAMP posture monitoring — not point-in-time snapshots, but continuous policy evaluation against live configuration state.' },
      { title: 'Regulator-Ready Incident Proof', proof: 'Every incident — detection through closure — captured in the Proof Ledger. Exportable for regulators, cyber insurers, and board-level review.' },
    ],
  },
  {
    id: 'vessels',
    name: 'SEXTANT',
    fullName: 'SEXTANT — Maritime Intelligence',
    emoji: '⚓',
    color: [14, 140, 210] as RGB,
    domain: 'Maritime Intelligence',
    tagline: 'Fleet command, voyage economics, and sanctions screening — governed and real-time.',
    philosophy: 'Maritime operations produce enormous signal volume — AIS position updates, port schedules, voyage cost models, sanctions screening results, weather routing — across fleets that span multiple jurisdictions and time zones. A single rerouting decision can determine whether a voyage is profitable or a multi-million dollar loss. SEXTANT brings A11oy\'s governed intelligence fabric to this domain, turning raw maritime data into classified, prioritized signals that operators can act on with confidence — and with proof.',
    howA11oyPowers: 'A11oy\'s Signal Mesh ingests AIS feeds, port state data, sanctions lists, voyage economics, and weather routing into a normalized signal stream. The Causal Core explains deviations — why a vessel is running behind schedule, what caused a route change, whether a cost overrun is systemic or isolated. Covenant Policy gates material decisions — rerouting approvals, sanctions escalations, commercial negotiations — ensuring every action has human authorization. The Proof Ledger creates an audit record that serves compliance, insurance, and charterer due diligence.',
    architectureLayers: [
      { layer: 'AIS Signal Mesh', desc: 'Real-time position, speed, heading, and ETA normalization across the fleet — with dark vessel detection and anomalous behavior flagging.' },
      { layer: 'Voyage Economics Engine', desc: 'Bunker cost modeling, demurrage risk scoring, port fee estimation, and route optimization with confidence intervals from the Monte Carlo layer.' },
      { layer: 'Sanctions Screening Layer', desc: 'Continuous screening of vessels, owners, operators, and ports against OFAC, EU, and UN lists — alert generation with attribution and escalation routing.' },
      { layer: 'Maritime Covenant Policy', desc: 'Authorization tiers for rerouting approvals, sanctions escalations, and commercial dispute responses — enforced before execution, not reviewed after.' },
      { layer: 'Fleet Proof Ledger', desc: 'Every rerouting decision, sanctions match, commercial negotiation, and operational exception recorded with full actor attribution — P&I club and underwriter ready.' },
    ],
    capabilities: [
      { title: 'Real-Time Fleet Command', proof: 'Live AIS tracking, ETA monitoring, and deviation alerts across the entire fleet — with root-cause explanation for every exception.' },
      { title: 'Voyage Economics Intelligence', proof: 'Bunker cost optimization, demurrage risk forecasting, and port cost modeling — with outcome distribution from Monte Carlo simulation.' },
      { title: 'Continuous Sanctions Screening', proof: 'Every vessel, owner, operator, and port continuously screened against current OFAC, EU, and UN sanctions lists — alerts with full attribution chain.' },
      { title: 'Governed Rerouting Decisions', proof: 'Material rerouting and commercial decisions pass through policy gates — operator-approved, Proof Ledger-attributed.' },
      { title: 'Compliance-Ready Proof Records', proof: 'Every operational exception, sanctions match, and material decision exportable for P&I clubs, underwriters, and flag state regulators.' },
    ],
  },
  {
    id: 'terra',
    name: 'DOMAINE',
    fullName: 'DOMAINE — Real Estate Intelligence',
    emoji: '▣',
    color: [64, 133, 100] as RGB,
    domain: 'Real Estate Intelligence',
    tagline: 'Distress-first property intelligence for investors, brokers, and portfolio teams.',
    philosophy: 'Real estate intelligence is not about more data — it is about the right signal at the right time with the right context. Distressed properties surface and close before most market participants even know they exist. DOMAINE applies A11oy\'s governed intelligence framework to NYC real estate, building a multi-factor distress scoring engine that identifies opportunity before it becomes consensus — and tracks deal pipeline with full attribution through the investment decision cycle.',
    howA11oyPowers: 'A11oy\'s Signal Mesh ingests property records, ownership structures, tax delinquency data, mortgage status, and market comparable transactions into a normalized property signal stream. The Causal Core explains distress — tracing the chain from delinquency pattern to distress classification with confidence scoring. Covenant Policy gates investment committee decisions — ensuring material acquisitions carry documented authorization. The Proof Ledger creates an immutable record of every deal decision, from initial signal to close, for LP reporting and regulatory compliance.',
    architectureLayers: [
      { layer: 'Property Signal Mesh', desc: 'NYC tax records, mortgage data, ownership structures, and market comps normalized into a classified signal stream with distress scoring.' },
      { layer: 'Multi-Factor Distress Engine', desc: 'Composite distress scoring across tax delinquency, mortgage delinquency, vacancy signals, and market discount — ranked by opportunity score.' },
      { layer: 'Deal Pipeline Intelligence', desc: 'Structured deal pipeline from initial signal to close, with ownership tracking, document status, and timeline analytics at every stage.' },
      { layer: 'PostGIS Coverage Layer', desc: 'NYC-wide geospatial coverage — neighborhood-level market intelligence, proximity analytics, and portfolio geographic concentration.' },
      { layer: 'Investment Decision Proof Chain', desc: 'Every acquisition, disposition, and material deal decision recorded with full actor attribution — LP report-ready and regulatory compliant.' },
    ],
    capabilities: [
      { title: 'Distress-First Property Discovery', proof: 'Multi-factor distress scoring across 340+ tracked NYC properties — tax delinquency, mortgage default, vacancy, and market discount signals combined.' },
      { title: '$4.8B Deal Pipeline Tracking', proof: 'Structured pipeline from initial distress signal to close — with ownership tracking, document status, and stage-by-stage analytics.' },
      { title: 'Ownership Structure Intelligence', proof: 'Traces beneficial ownership through LLC stacks and corporate structures — identifying decision-makers behind distressed positions.' },
      { title: 'PostGIS Geospatial Analytics', proof: 'NYC-wide geospatial coverage — neighborhood market intelligence, proximity scoring, and portfolio geographic concentration analysis.' },
      { title: 'Investment Committee Proof Records', proof: 'Every material acquisition and disposition decision recorded with authorization chain — LP-reportable and regulatory compliant.' },
    ],
  },
  {
    id: 'counsel',
    name: 'Counsel',
    fullName: 'Counsel — Legal Matter Command',
    emoji: '⚖',
    color: [140, 100, 210] as RGB,
    domain: 'Legal Operations',
    tagline: 'Structured legal matter management with governed document intelligence.',
    philosophy: 'Legal risk is not a back-office concern — it is a strategic variable. Matter deadlines missed, obligations untracked, document intelligence siloed — each represents exposure that compounds over time. Counsel applies A11oy\'s governed intelligence framework to legal operations, bringing the same accountability standards to matter management that the best law departments apply to their most consequential cases. Every obligation is tracked. Every deadline is surfaced. Every document intelligence finding carries attribution.',
    howA11oyPowers: 'A11oy\'s Signal Mesh processes legal document streams, court filings, obligation calendars, and matter status updates into a normalized legal signal stream. The Causal Core maps exposure chains — connecting filing deadlines to risk implications, flagging obligation drift before it becomes breach. Covenant Policy enforces matter authorization — who can approve settlement authority, who can bind the organization on material legal commitments. The Proof Ledger creates the definitive record of every material legal decision, from counsel engagement to matter closure.',
    architectureLayers: [
      { layer: 'Legal Signal Mesh', desc: 'Court filings, document streams, obligation calendars, and external counsel status ingested and classified into a governed legal signal stream.' },
      { layer: 'Obligation Tracking Engine', desc: 'Every contractual and regulatory obligation tracked with deadline monitoring, drift detection, and escalation routing — no obligation falls through the gap.' },
      { layer: 'Document Intelligence Layer', desc: 'AI-assisted document review, clause extraction, obligation identification, and risk scoring — with full source attribution on every finding.' },
      { layer: 'Matter Authorization Policy', desc: 'Covenant Policy governing settlement authority, outside counsel engagement, and material legal commitments — enforced at the decision layer.' },
      { layer: 'Legal Proof Chain', desc: 'Every material legal decision — engagement, settlement, filing, commitment — recorded with full actor attribution and authorization basis.' },
    ],
    capabilities: [
      { title: 'Structured Matter Lifecycle Management', proof: 'End-to-end matter tracking from intake through closure — filings, obligations, document status, and timeline analytics in a single governed surface.' },
      { title: 'AI Document Intelligence', proof: 'Clause extraction, obligation identification, and risk scoring across legal document corpus — with source attribution on every finding.' },
      { title: 'Obligation & Deadline Monitoring', proof: 'Continuous obligation tracking with deadline monitoring and drift detection — every contractual and regulatory commitment surfaced before breach.' },
      { title: 'Governed Settlement Authority', proof: 'Settlement authority and material commitment approval gates enforced by Covenant Policy — every authorization documented and attributable.' },
      { title: 'Auditor-Ready Legal Proof Records', proof: 'Every material legal decision recorded with full authorization chain — ready for audit committee, regulators, and counterparty diligence.' },
    ],
  },
  {
    id: 'carlota-jo',
    name: 'Carlota Jo',
    fullName: 'Carlota Jo — Private Advisory',
    emoji: '◎',
    color: [200, 140, 100] as RGB,
    domain: 'Private Advisory',
    tagline: 'Governed advisory intelligence for principals who value discretion and precision.',
    philosophy: 'Private advisory operates on trust — trust that the advisor has synthesized all the relevant signal, trust that the recommendation is based on complete information, trust that the client\'s confidence is well-placed. Carlota Jo applies A11oy\'s governed intelligence framework to advisory practice management, bringing the same accountability standards that institutional clients expect to every client engagement. Every advisory recommendation is evidence-based. Every client interaction is structured. Every commitment is traceable.',
    howA11oyPowers: 'A11oy\'s Signal Mesh processes engagement notes, client signals, market intelligence, and follow-up commitments into a normalized advisory signal stream. The Causal Core connects market developments to client portfolio implications — ensuring advisors surface the right insight at the right moment. Covenant Policy governs commitment authority — no advisor engages on material client matters without appropriate authorization. The Proof Ledger creates the definitive record of every advisory engagement, from initial session to delivered outcome.',
    architectureLayers: [
      { layer: 'Engagement Signal Mesh', desc: 'Client notes, market intelligence, follow-up commitments, and engagement status classified and routed through the governed advisory signal stream.' },
      { layer: 'Client Intelligence Layer', desc: 'Contextual synthesis of client situation, stated objectives, outstanding commitments, and market developments — surfaced at the right moment before each engagement.' },
      { layer: 'Advisory Brief Generator', desc: 'AI-augmented session preparation — synthesizing client history, market context, and open items into structured pre-session briefing materials.' },
      { layer: 'Commitment Authorization Policy', desc: 'Covenant Policy governing what advisory commitments require senior authorization — ensuring material engagements are properly scoped and approved.' },
      { layer: 'Engagement Proof Chain', desc: 'Every session, commitment, and delivered outcome recorded with full attribution — client-reportable and compliance-ready.' },
    ],
    capabilities: [
      { title: 'Structured Client Portal', proof: 'Engagement workspace with session history, outstanding commitments, delivered materials, and client communication — all in one governed surface.' },
      { title: 'AI-Augmented Session Intelligence', proof: 'Pre-session briefs synthesizing client history, market developments, and open commitments — ensuring advisors walk in fully prepared.' },
      { title: 'Commitment Tracking & Attribution', proof: 'Every advisory commitment tracked through delivery — no commitment falls through the gap, every delivery is attributed.' },
      { title: 'Governed Engagement Authorization', proof: 'Material advisory engagements pass through authorization policy — ensuring proper scoping, pricing, and senior oversight before commitment.' },
      { title: 'Client-Reportable Proof Records', proof: 'Every session, commitment, and outcome recorded — client-reportable, compliance-ready, and available for principal review.' },
    ],
  },
  {
    id: 'pulse',
    name: 'Pulse',
    fullName: 'Pulse — Market Intelligence',
    emoji: '◈',
    color: [60, 170, 155] as RGB,
    domain: 'Market Intelligence',
    tagline: 'Executive market intelligence — synthesized, attributed, governed.',
    philosophy: 'Executive decision-makers are deluged with information but starved of intelligence. The difference is signal-to-noise — distinguishing consequential market developments from ambient information volume. Pulse applies A11oy\'s governed intelligence framework to market intelligence aggregation, delivering executive-grade synthesis that is source-attributed, confidence-scored, and integrated with operational context from all SZL verticals. Every briefing is traceable. Every insight carries its evidentiary basis.',
    howA11oyPowers: 'A11oy\'s Signal Mesh ingests market news, analyst reports, competitor signals, regulatory announcements, and cross-vertical operational intelligence into a normalized executive briefing stream. The Causal Core explains market developments in terms of their operational implications — not just "rates moved" but "here is the exposure this creates across your maritime and real estate portfolios." Covenant Policy governs executive communication distribution — ensuring material intelligence reaches the right principals through the right authorization chain.',
    architectureLayers: [
      { layer: 'Market Signal Mesh', desc: 'News feeds, analyst reports, regulatory announcements, and competitive intelligence normalized and classified into a governed executive signal stream.' },
      { layer: 'Cross-Vertical Synthesis Engine', desc: 'Connects market developments to operational implications across all SZL verticals — surfacing the portfolio-level consequence of external events.' },
      { layer: 'Executive Brief Generator', desc: 'Daily and on-demand executive briefing synthesis — signal-to-noise optimized, source-attributed, and confidence-scored at every level.' },
      { layer: 'Intelligence Distribution Policy', desc: 'Covenant Policy governing which intelligence reaches which principals — ensuring material signals are appropriately classified and distributed.' },
      { layer: 'Intelligence Proof Chain', desc: 'Every published briefing and intelligence product recorded with source attribution, analyst confidence scoring, and distribution authorization.' },
    ],
    capabilities: [
      { title: 'Executive Briefing Intelligence', proof: 'Daily synthesized executive briefings — signal-to-noise optimized, source-attributed, and confidence-scored across market domains.' },
      { title: 'Cross-Vertical Market Synthesis', proof: 'Connects external market developments to operational implications across maritime, real estate, legal, and defense verticals simultaneously.' },
      { title: 'Source Attribution on Every Insight', proof: 'Every intelligence finding carries its source chain — no anonymous "AI says" conclusions, every claim is traceable to its evidence basis.' },
      { title: 'Regulatory & Competitive Signal Monitoring', proof: 'Continuous monitoring of regulatory announcements, competitor signals, and market developments relevant to SZL portfolio operations.' },
      { title: 'Governed Intelligence Distribution', proof: 'Material intelligence distribution passes through authorization policy — ensuring the right signal reaches the right principal at the right classification level.' },
    ],
  },
];

function buildVerticalDoc(spec: VerticalSpec): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const totalPages = 5;
  const cx = 12;
  const cw = 186;
  const accent = spec.color;

  // ─── Page 1: Cover ───────────────────────────────────────────────────────
  bg(doc);
  gridLines(doc);

  fill(doc, accent);
  doc.rect(0, 0, 210, 3, 'F');

  fill(doc, SURFACE);
  doc.roundedRect(cx, 36, cw, 210, 4, 4, 'F');
  draw(doc, BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(cx, 36, cw, 210, 4, 4, 'S');

  fill(doc, accent);
  doc.rect(cx, 36, 3, 210, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  textColor(doc, accent);
  doc.text('SZL HOLDINGS · A11OY MARKETING BRIEF', cx + 10, 50);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  textColor(doc, MUTED);
  doc.text(spec.domain.toUpperCase(), cx + 10, 58);

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  textColor(doc, TEXT);
  const titleLines = doc.splitTextToSize(spec.fullName, cw - 20);
  doc.text(titleLines, cx + 10, 76);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  textColor(doc, accent);
  const titleH = titleLines.length * 12;
  doc.text(spec.emoji + '  ' + spec.domain, cx + 10, 76 + titleH + 4);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  textColor(doc, MUTED);
  const tagLines = doc.splitTextToSize(spec.tagline, cw - 20);
  doc.text(tagLines, cx + 10, 76 + titleH + 14);

  draw(doc, BORDER);
  doc.setLineWidth(0.25);
  doc.line(cx + 10, 140, cx + cw - 6, 140);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  textColor(doc, accent);
  doc.text('SZL Holdings', cx + 10, 230);
  doc.setFont('helvetica', 'normal');
  textColor(doc, MUTED);
  doc.text('Washington, D.C. · London · Singapore', cx + 10, 237);
  doc.text('szlholdings.com · Governed Autonomy · 2026', cx + 10, 244);

  footer(doc);

  // ─── Page 2: Business Observability Philosophy ────────────────────────────
  doc.addPage();
  bg(doc);
  header(doc, 2, totalPages, `${spec.name} — Business Observability`);

  let y = 24;
  sectionLabel(doc, 'The A11oy Philosophy for ' + spec.domain, cx, y);
  y += 7;

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  textColor(doc, TEXT);
  const phH = doc.splitTextToSize('Business Observability: Governed Intelligence for ' + spec.domain, cw - 4);
  doc.text(phH, cx, y);
  y += phH.length * 7.5 + 4;

  accentBar(doc, cx, y, 22, accent);
  y += 7;

  y = wrapped(doc, spec.philosophy, cx, y, cw, 5.2, 9, MUTED);
  y += 8;

  sectionLabel(doc, 'How A11oy Powers ' + spec.name, cx, y);
  y += 7;

  fill(doc, SURFACE2);
  const howLines = doc.splitTextToSize(spec.howA11oyPowers, cw - 14);
  const howH = howLines.length * 4.8 + 12;
  doc.roundedRect(cx, y, cw, howH, 3, 3, 'F');
  fill(doc, accent);
  doc.rect(cx, y, 2.5, howH, 'F');
  draw(doc, BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(cx, y, cw, howH, 3, 3, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  textColor(doc, MUTED);
  doc.text(howLines, cx + 8, y + 7);
  y += howH + 10;

  sectionLabel(doc, 'The Governed Decision Fabric', cx, y);
  y += 7;

  const loop = [
    'Signal — Every operational signal from ' + spec.name + ' enters through A11oy\'s Signal Mesh, classified and attributed.',
    'Structure — The Causal Core explains the why behind every anomaly — before it reaches a decision-maker.',
    'Recommend — AI proposes, with confidence intervals from Monte Carlo simulation. No point estimates — outcome distributions.',
    'Gate — Covenant Policy intercepts every material action. The approval gate is in the code — not the UI layer.',
    'Decide — Human judgment owns consequential decisions. Every approval is recorded and attributed.',
    'Prove — The Proof Ledger records the full decision chain — SHA-256 hashed, tamper-evident, actor-attributed.',
  ];

  for (const step of loop) {
    if (y > 275) break;
    const colon = step.indexOf(' — ');
    const stepLabel = step.slice(0, colon);
    const stepBody = step.slice(colon + 3);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    textColor(doc, accent);
    doc.text(stepLabel + ' —', cx, y);

    const labelW = doc.getTextWidth(stepLabel + ' — ');
    doc.setFont('helvetica', 'normal');
    textColor(doc, MUTED);
    const bodyLines = doc.splitTextToSize(stepBody, cw - labelW - 2);
    doc.text(bodyLines, cx + labelW, y);
    y += bodyLines.length * 4.5 + 3;
  }

  footer(doc);

  // ─── Page 3: Architecture Diagram ────────────────────────────────────────
  doc.addPage();
  bg(doc);
  header(doc, 3, totalPages, `${spec.name} — Architecture Overview`);

  y = 24;
  sectionLabel(doc, 'A11oy Seven-Layer Fabric — ' + spec.name + ' Configuration', cx, y);
  y += 7;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  textColor(doc, TEXT);
  doc.text('The Governed Execution Fabric for ' + spec.domain, cx, y);
  y += 10;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  textColor(doc, MUTED);
  const archIntro = 'A11oy\'s seven-layer architecture is domain-configured — each layer operates with ' + spec.name + '-specific signal schemas, workcells, and governance policies while sharing the unified proof infrastructure.';
  const archIntroLines = doc.splitTextToSize(archIntro, cw);
  doc.text(archIntroLines, cx, y);
  y += archIntroLines.length * 4.5 + 8;

  for (let i = 0; i < spec.architectureLayers.length; i++) {
    const layer = spec.architectureLayers[i];
    if (y > 265) break;

    fill(doc, SURFACE);
    doc.roundedRect(cx, y, cw, 30, 2, 2, 'F');
    draw(doc, BORDER);
    doc.setLineWidth(0.15);
    doc.roundedRect(cx, y, cw, 30, 2, 2, 'S');

    fill(doc, accent);
    doc.roundedRect(cx, y, 2, 30, 1, 1, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    textColor(doc, accent);
    doc.text(`L${i + 1}`, cx + 6, y + 9);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    textColor(doc, TEXT);
    doc.text(layer.layer, cx + 16, y + 9);

    const bodyLines = doc.splitTextToSize(layer.desc, cw - 22);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    textColor(doc, MUTED);
    doc.text(bodyLines, cx + 6, y + 16);

    y += 34;
  }

  y += 4;
  fill(doc, SURFACE2);
  const diagramW = cw;
  const diagramH = 32;
  doc.roundedRect(cx, y, diagramW, diagramH, 3, 3, 'F');
  draw(doc, accent);
  doc.setLineWidth(0.3);
  doc.roundedRect(cx, y, diagramW, diagramH, 3, 3, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  textColor(doc, accent);
  doc.text('SIGNAL FLOW', cx + 6, y + 8);

  const flowStr = 'Signal Mesh → Causal Core → Action Rail → Covenant Layer → Workcell → Proof Ledger → Outcome Graph';
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  textColor(doc, TEXT);
  const flowLines = doc.splitTextToSize(flowStr, diagramW - 14);
  doc.text(flowLines, cx + 6, y + 16);

  footer(doc);

  // ─── Page 4: Key Capabilities ────────────────────────────────────────────
  doc.addPage();
  bg(doc);
  header(doc, 4, totalPages, `${spec.name} — Key Capabilities`);

  y = 24;
  sectionLabel(doc, 'Capabilities — ' + spec.domain + ' Edition', cx, y);
  y += 7;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  textColor(doc, TEXT);
  doc.text('What ' + spec.name + ' Delivers', cx, y);
  y += 10;

  for (let i = 0; i < spec.capabilities.length; i++) {
    const cap = spec.capabilities[i];
    if (y > 260) break;

    fill(doc, SURFACE);
    const capBodyLines = doc.splitTextToSize(cap.proof, cw - 22);
    const capH = capBodyLines.length * 4.5 + 20;
    doc.roundedRect(cx, y, cw, capH, 2, 2, 'F');
    draw(doc, BORDER);
    doc.setLineWidth(0.15);
    doc.roundedRect(cx, y, cw, capH, 2, 2, 'S');

    fill(doc, accent);
    doc.roundedRect(cx, y, 2, capH, 1, 1, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    textColor(doc, accent);
    doc.text(`0${i + 1}`, cx + 6, y + 8);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    textColor(doc, TEXT);
    doc.text(cap.title, cx + 16, y + 8);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    textColor(doc, MUTED);
    doc.text(capBodyLines, cx + 6, y + 14);

    y += capH + 4;
  }

  footer(doc);

  // ─── Page 5: SZL Holdings Footer & Contact ────────────────────────────────
  doc.addPage();
  bg(doc);
  header(doc, 5, totalPages, `${spec.name} — SZL Holdings`);

  y = 24;
  sectionLabel(doc, 'SZL Holdings — Governed Autonomy', cx, y);
  y += 7;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  textColor(doc, TEXT);
  doc.text('The SZL Holdings Platform', cx, y);
  y += 10;

  const ecosystemDesc = 'SZL Holdings is a technology holding company building a governed portfolio of enterprise intelligence platforms. ' + spec.name + ' is one of seven operating platforms — each commanding its vertical, each powered by the A11oy execution fabric, each compounding intelligence across the ecosystem.';
  y = wrapped(doc, ecosystemDesc, cx, y, cw, 5.2, 9.5, MUTED);
  y += 10;

  sectionLabel(doc, 'The Full Portfolio', cx, y);
  y += 7;

  const portfolio = [
    { emoji: '◆', name: 'KORA', desc: 'Decision Intelligence — multi-model routing and portfolio-wide signal observability', color: [201, 152, 64] as RGB },
    { emoji: '⬡', name: 'PARAGON', desc: 'Defense & Intelligence — unified SOC, threat intelligence, and compliance posture', color: [100, 130, 220] as RGB },
    { emoji: '⚓', name: 'SEXTANT', desc: 'Maritime Intelligence — fleet command, voyage economics, sanctions screening', color: [14, 140, 210] as RGB },
    { emoji: '▣', name: 'DOMAINE', desc: 'Real Estate Intelligence — distress scoring, deal pipeline, ownership intelligence', color: [64, 133, 100] as RGB },
    { emoji: '⚖', name: 'Counsel', desc: 'Legal Matter Command — structured matter management with governed document intelligence', color: [140, 100, 210] as RGB },
    { emoji: '◎', name: 'Carlota Jo', desc: 'Private Advisory — governed advisory intelligence for principals who value precision', color: [200, 140, 100] as RGB },
    { emoji: '◈', name: 'Pulse', desc: 'Market Intelligence — executive briefings, synthesized and attributed', color: [60, 170, 155] as RGB },
  ];

  for (const p of portfolio) {
    if (y > 250) break;
    const isThis = p.name === spec.name;
    if (isThis) {
      fill(doc, SURFACE2);
      doc.roundedRect(cx, y - 1, cw, 10, 1.5, 1.5, 'F');
    }

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    textColor(doc, isThis ? accent : p.color);
    doc.text(p.emoji + '  ' + p.name, cx + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    textColor(doc, MUTED);
    doc.text('— ' + p.desc, cx + 4 + doc.getTextWidth(p.emoji + '  ' + p.name) + 2, y + 6);

    y += 11;
  }

  y += 10;
  fill(doc, SURFACE);
  doc.roundedRect(cx, y, cw, 40, 3, 3, 'F');
  draw(doc, BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(cx, y, cw, 40, 3, 3, 'S');
  fill(doc, accent);
  doc.rect(cx, y, 3, 40, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  textColor(doc, TEXT);
  doc.text('SZL Holdings', cx + 8, y + 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  textColor(doc, MUTED);
  doc.text('Washington, D.C. · London · Singapore', cx + 8, y + 19);
  doc.text('inquiries@szlholdings.com · szlholdings.com', cx + 8, y + 26);
  doc.text('Governed Autonomy — Built for Enterprise — 2026', cx + 8, y + 33);

  footer(doc);

  return doc;
}

export function generateVerticalPDF(verticalId: string): void {
  const spec = VERTICAL_SPECS.find(v => v.id === verticalId);
  if (!spec) return;
  buildVerticalDoc(spec).save(`A11oy-${spec.name}-Marketing-Brief-SZL-Holdings.pdf`);
}

function buildPlatformBriefDoc(): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const totalPages = 4;
  const cx = 12;
  const cw = 186;

  // ─── Page 1: Cover ───────────────────────────────────────────────────────
  bg(doc);
  gridLines(doc);

  fill(doc, ACCENT_GOLD);
  doc.rect(0, 0, 210, 3, 'F');

  fill(doc, SURFACE);
  doc.roundedRect(cx, 36, cw, 210, 4, 4, 'F');
  draw(doc, BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(cx, 36, cw, 210, 4, 4, 'S');

  fill(doc, ACCENT_GOLD);
  doc.rect(cx, 36, 3, 210, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  textColor(doc, ACCENT_GOLD);
  doc.text('SZL HOLDINGS · A11OY PLATFORM BRIEF', cx + 10, 50);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  textColor(doc, MUTED);
  doc.text('THE UNIFIED PLATFORM', cx + 10, 58);

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  textColor(doc, TEXT);
  const titleLines = doc.splitTextToSize('SZL Holdings Platform Brief', cw - 20);
  doc.text(titleLines, cx + 10, 76);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  textColor(doc, MUTED);
  const tagLines = doc.splitTextToSize('Seven verticals. One execution fabric. Governed intelligence that compounds across every domain.', cw - 20);
  doc.text(tagLines, cx + 10, 108);

  draw(doc, BORDER);
  doc.setLineWidth(0.25);
  doc.line(cx + 10, 130, cx + cw - 6, 130);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  textColor(doc, MUTED);
  const summaryLines = doc.splitTextToSize(
    'A11oy is the governing philosophy and execution fabric behind every SZL Holdings platform. Where competitors aggregate tools, A11oy builds a unified governed intelligence loop — Signal, Structure, Recommend, Gate, Decide, Prove — across KORA, PARAGON, SEXTANT, DOMAINE, Counsel, Carlota Jo, and Pulse. Every vertical shares the proof infrastructure. Every decision is traceable. Every outcome compounds.',
    cw - 20,
  );
  doc.text(summaryLines, cx + 10, 140);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  textColor(doc, ACCENT_GOLD);
  doc.text('SZL Holdings', cx + 10, 230);
  doc.setFont('helvetica', 'normal');
  textColor(doc, MUTED);
  doc.text('Washington, D.C. · London · Singapore', cx + 10, 237);
  doc.text('szlholdings.com · Governed Autonomy · 2026', cx + 10, 244);

  footer(doc);

  // ─── Page 2: The Seven Verticals ──────────────────────────────────────────
  doc.addPage();
  bg(doc);
  header(doc, 2, totalPages, 'SZL Holdings — Seven Verticals');

  let y = 24;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  textColor(doc, ACCENT_GOLD);
  doc.text('THE SZL HOLDINGS PORTFOLIO', cx, y);
  y += 7;

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  textColor(doc, TEXT);
  doc.text('Seven Verticals. One Execution Fabric.', cx, y);
  y += 10;

  for (const spec of VERTICAL_SPECS) {
    if (y > 258) break;
    fill(doc, SURFACE);
    const capBodyLines = doc.splitTextToSize(spec.tagline, cw - 30);
    const rowH = Math.max(24, capBodyLines.length * 4.5 + 14);
    doc.roundedRect(cx, y, cw, rowH, 2, 2, 'F');
    draw(doc, BORDER);
    doc.setLineWidth(0.12);
    doc.roundedRect(cx, y, cw, rowH, 2, 2, 'S');

    fill(doc, spec.color);
    doc.roundedRect(cx, y, 2, rowH, 1, 1, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    textColor(doc, TEXT);
    doc.text(spec.emoji, cx + 6, y + rowH / 2 + 2);

    doc.setFontSize(9.5);
    textColor(doc, spec.color);
    doc.text(spec.name, cx + 16, y + 8);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    textColor(doc, MUTED);
    doc.text(spec.domain.toUpperCase(), cx + 16, y + 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    textColor(doc, MUTED);
    doc.text(capBodyLines, cx + 16, y + 20);

    y += rowH + 3;
  }

  footer(doc);

  // ─── Page 3: A11oy Architecture ───────────────────────────────────────────
  doc.addPage();
  bg(doc);
  header(doc, 3, totalPages, 'A11oy — Governing Architecture');

  y = 24;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  textColor(doc, ACCENT_GOLD);
  doc.text('THE GOVERNED EXECUTION FABRIC', cx, y);
  y += 7;

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  textColor(doc, TEXT);
  doc.text('Six Stages. No Shortcuts.', cx, y);
  y += 9;

  const fabDesc = 'A11oy\'s governed decision loop runs identically across all seven verticals — the architecture is invariant. What changes per vertical is the signal schema, the workcell configuration, and the governance policies. The proof infrastructure is shared.';
  y = wrapped(doc, fabDesc, cx, y, cw, 5.0, 8.5, MUTED);
  y += 8;

  const stages = [
    { num: '01', name: 'Signal', desc: 'Every business signal — from any vertical, any source — enters through the Signal Mesh. Classified, attributed, timestamped. No signal is lost.' },
    { num: '02', name: 'Structure', desc: 'The Causal Core explains the why behind every signal. Root cause, downstream exposure, confidence-weighted explanation — before recommendation.' },
    { num: '03', name: 'Recommend', desc: 'AI proposes, with confidence intervals from Monte Carlo simulation. Every recommendation shows the outcome distribution — not a point estimate.' },
    { num: '04', name: 'Gate', desc: 'Covenant Policy intercepts every consequential action before execution. Who can approve, under what conditions — enforced at the code layer. Cannot be bypassed.' },
    { num: '05', name: 'Decide', desc: 'Human judgment owns consequential decisions. Ownership is non-delegable, documented, and recorded. The human decides. The record follows.' },
    { num: '06', name: 'Prove', desc: 'The Proof Ledger records the full chain — who, what, why, when, with what model, with what evidence, with what outcome. SHA-256 hashed. Tamper-evident.' },
  ];

  for (const stage of stages) {
    if (y > 268) break;
    fill(doc, SURFACE);
    doc.roundedRect(cx, y, cw, 22, 2, 2, 'F');
    fill(doc, ACCENT_GOLD);
    doc.roundedRect(cx, y, 2, 22, 1, 1, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    textColor(doc, ACCENT_GOLD);
    doc.text(`${stage.num} · ${stage.name}`, cx + 6, y + 8);

    const stageBodyLines = doc.splitTextToSize(stage.desc, cw - 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    textColor(doc, MUTED);
    doc.text(stageBodyLines, cx + 6, y + 14);

    y += 26;
  }

  footer(doc);

  // ─── Page 4: Why SZL Holdings ─────────────────────────────────────────────
  doc.addPage();
  bg(doc);
  header(doc, 4, totalPages, 'SZL Holdings — Governed Autonomy');

  y = 24;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  textColor(doc, ACCENT_GOLD);
  doc.text('WHY SZL HOLDINGS GOES FURTHER', cx, y);
  y += 7;

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  textColor(doc, TEXT);
  doc.text('Beyond Aggregation. Into Governance.', cx, y);
  y += 10;

  const differentiation = [
    {
      title: 'Not tool aggregation — governed intelligence',
      body: 'Competitors aggregate tools and call it a platform. A11oy builds a governed execution fabric — a system that senses, structures, recommends, gates, decides, and proves. The difference is not feature count. It is architectural integrity.',
    },
    {
      title: 'Not dashboards — proof',
      body: 'Dashboards show you what happened. A11oy proves why it happened, who decided, on what basis, with what model, and what the outcome was. Every consequential action is Proof Ledger-attributed. That is not a feature — it is a governance guarantee.',
    },
    {
      title: 'Not single-domain — compounding cross-vertical intelligence',
      body: 'A sanctions hit on a maritime vessel can surface a legal risk flag in Counsel, triggering an executive alert in KORA. No single-domain tool can produce this. The more verticals share the Signal Mesh, the more intelligence compounds across all of them.',
    },
    {
      title: 'Not configuration — architecture',
      body: 'Every new domain inherits Proof Chain, Covenant Policy, Outcome Graph, and human-in-the-loop gates from day one — at zero marginal governance cost. The architecture makes every new vertical cheaper to govern correctly than the last.',
    },
  ];

  for (const d of differentiation) {
    if (y > 252) break;
    fill(doc, SURFACE);
    const diffBodyLines = doc.splitTextToSize(d.body, cw - 14);
    const diffH = diffBodyLines.length * 4.5 + 18;
    doc.roundedRect(cx, y, cw, diffH, 2, 2, 'F');
    draw(doc, BORDER);
    doc.setLineWidth(0.12);
    doc.roundedRect(cx, y, cw, diffH, 2, 2, 'S');
    fill(doc, ACCENT_GOLD);
    doc.rect(cx, y, 2, diffH, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    textColor(doc, TEXT);
    doc.text(d.title, cx + 7, y + 8);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    textColor(doc, MUTED);
    doc.text(diffBodyLines, cx + 7, y + 14);

    y += diffH + 4;
  }

  y += 6;
  fill(doc, SURFACE);
  doc.roundedRect(cx, y, cw, 36, 3, 3, 'F');
  draw(doc, BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(cx, y, cw, 36, 3, 3, 'S');
  fill(doc, ACCENT_GOLD);
  doc.rect(cx, y, 3, 36, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  textColor(doc, TEXT);
  doc.text('SZL Holdings', cx + 8, y + 10);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  textColor(doc, MUTED);
  doc.text('Washington, D.C. · London · Singapore', cx + 8, y + 18);
  doc.text('inquiries@szlholdings.com · szlholdings.com', cx + 8, y + 25);
  doc.text('Governed Autonomy — Built for Enterprise — 2026', cx + 8, y + 32);

  footer(doc);

  return doc;
}

export function generatePlatformBriefPDF(): void {
  buildPlatformBriefDoc().save('SZL-Holdings-Platform-Brief-A11oy.pdf');
}
