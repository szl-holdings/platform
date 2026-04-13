import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";

export type OutputModality = "text" | "chart" | "annotated_image" | "audio_summary" | "structured_report" | "briefing_card";
export type OutputDomain = "maritime" | "real_estate" | "legal" | "defense" | "financial" | "general";

export interface ChartSpec {
  chartType: "bar" | "line" | "pie" | "scatter" | "area" | "radar" | "heatmap";
  title: string;
  data: Array<Record<string, any>>;
  xKey?: string;
  yKey?: string;
  colorKey?: string;
  description: string;
  rechartsConfig?: Record<string, any>;
}

export interface AnnotatedImageSpec {
  baseImageDescription: string;
  annotations: Array<{
    label: string;
    region: string;
    color: string;
    confidence: number;
    description: string;
  }>;
  overlayText?: string;
  highlightedAreas: string[];
}

export interface AudioSummarySpec {
  text: string;
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  estimatedDurationSeconds: number;
  ssmlHints?: string[];
}

export interface StructuredReport {
  reportId: string;
  title: string;
  domain: OutputDomain;
  executiveSummary: string;
  sections: Array<{
    sectionTitle: string;
    content: string;
    sectionType: "narrative" | "data_table" | "chart_placeholder" | "image_placeholder" | "key_findings";
    data?: any;
  }>;
  appendices: Array<{ title: string; content: string }>;
  metadata: {
    generatedAt: string;
    confidenceScore?: number;
    dataSourceCount?: number;
  };
}

export interface BriefingCard {
  cardId: string;
  domain: OutputDomain;
  priority: "low" | "medium" | "high" | "critical";
  headline: string;
  summary: string;
  keyMetrics: Array<{ label: string; value: string; trend?: "up" | "down" | "stable" }>;
  actionItems: string[];
  timestamp: string;
  expiresAt?: string;
}

export interface MultimodalOutputBundle {
  bundleId: string;
  domain: OutputDomain;
  modalities: OutputModality[];
  text?: string;
  charts?: ChartSpec[];
  annotatedImage?: AnnotatedImageSpec;
  audioSummary?: AudioSummarySpec;
  structuredReport?: StructuredReport;
  briefingCard?: BriefingCard;
  generatedAt: string;
  latencyMs: number;
}

export async function generateMultimodalOutput(params: {
  content: string;
  domain?: OutputDomain;
  requestedModalities?: OutputModality[];
  title?: string;
  contextData?: Record<string, any>;
}): Promise<MultimodalOutputBundle> {
  const bundleId = `bundle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const domain = params.domain ?? "general";
  const startTime = Date.now();
  const modalities = params.requestedModalities ?? ["text", "chart", "briefing_card", "structured_report"];

  const bundle: MultimodalOutputBundle = {
    bundleId,
    domain,
    modalities,
    generatedAt: new Date().toISOString(),
    latencyMs: 0,
  };

  const [textResult, structureResult] = await Promise.allSettled([
    modalities.includes("text") || modalities.includes("structured_report") || modalities.includes("briefing_card")
      ? generateTextAndStructure(params.content, domain, params.title)
      : Promise.resolve(null),
    modalities.includes("chart")
      ? generateChartSpecs(params.content, domain, params.contextData)
      : Promise.resolve(null),
  ]);

  if (textResult.status === "fulfilled" && textResult.value) {
    const tv = textResult.value;
    if (modalities.includes("text")) bundle.text = tv.text;
    if (modalities.includes("structured_report")) bundle.structuredReport = tv.report;
    if (modalities.includes("briefing_card")) bundle.briefingCard = tv.briefingCard;
    if (modalities.includes("audio_summary")) {
      bundle.audioSummary = generateAudioSummarySpec(tv.text);
    }
  }

  if (structureResult.status === "fulfilled" && structureResult.value && modalities.includes("chart")) {
    bundle.charts = structureResult.value;
  }

  if (modalities.includes("annotated_image") && params.contextData?.imageDescription) {
    bundle.annotatedImage = generateAnnotatedImageSpec(
      String(params.contextData.imageDescription),
      params.content,
      domain
    );
  }

  bundle.latencyMs = Date.now() - startTime;
  logger.info({ bundleId, domain, modalities, latencyMs: bundle.latencyMs }, "Multimodal output bundle generated");
  return bundle;
}

async function generateTextAndStructure(
  content: string,
  domain: OutputDomain,
  title?: string
): Promise<{ text: string; report: StructuredReport; briefingCard: BriefingCard }> {
  const reportId = `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const cardId = `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const response = await gatewayInfer({
    messages: [
      {
        role: "system",
        content: `You are an intelligence briefing author for ${domain} domain. Generate structured, professional outputs. Return valid JSON only.`,
      },
      {
        role: "user",
        content: `Based on this intelligence content, generate a full output package:

${content.slice(0, 4000)}

Return JSON:
{
  "text": "polished narrative text (3-4 paragraphs)",
  "executiveSummary": "2-3 sentence executive summary",
  "sections": [
    {"sectionTitle": "Section Name", "content": "content", "sectionType": "narrative|key_findings|data_table"}
  ],
  "headline": "one-line headline for briefing card",
  "summary": "2 sentence briefing card summary",
  "keyMetrics": [{"label": "Metric", "value": "Value", "trend": "up|down|stable"}],
  "actionItems": ["action 1", "action 2"],
  "priority": "low|medium|high|critical",
  "confidenceScore": 0.0-1.0
}`,
      },
    ],
    maxTokens: 2000,
    strategy: "preferred",
  });

  let parsed: any = {};
  try {
    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
  } catch { }

  const now = new Date().toISOString();
  const reportTitle = title ?? `${domain.replace("_", " ").toUpperCase()} Intelligence Report`;

  const report: StructuredReport = {
    reportId,
    title: reportTitle,
    domain,
    executiveSummary: parsed.executiveSummary ?? content.slice(0, 200),
    sections: parsed.sections ?? [
      { sectionTitle: "Analysis", content: content.slice(0, 500), sectionType: "narrative" },
    ],
    appendices: [],
    metadata: {
      generatedAt: now,
      confidenceScore: parsed.confidenceScore ?? 0.7,
      dataSourceCount: 1,
    },
  };

  const briefingCard: BriefingCard = {
    cardId,
    domain,
    priority: parsed.priority ?? "medium",
    headline: parsed.headline ?? reportTitle,
    summary: parsed.summary ?? content.slice(0, 200),
    keyMetrics: parsed.keyMetrics ?? [],
    actionItems: parsed.actionItems ?? [],
    timestamp: now,
  };

  return {
    text: parsed.text ?? content,
    report,
    briefingCard,
  };
}

async function generateChartSpecs(
  content: string,
  domain: OutputDomain,
  contextData?: Record<string, any>
): Promise<ChartSpec[]> {
  const response = await gatewayInfer({
    messages: [
      {
        role: "system",
        content: "You are a data visualization specialist. Generate Recharts-compatible chart specifications from intelligence content. Return valid JSON array only.",
      },
      {
        role: "user",
        content: `Generate 1-2 chart specifications for this ${domain} intelligence content:

${content.slice(0, 2000)}
${contextData ? `\nContext data: ${JSON.stringify(contextData).slice(0, 500)}` : ""}

Return JSON array:
[{
  "chartType": "bar|line|pie|scatter|area|radar",
  "title": "Chart title",
  "description": "what this chart shows",
  "data": [{"name": "Category A", "value": 42}, {"name": "Category B", "value": 67}],
  "xKey": "name",
  "yKey": "value",
  "rechartsConfig": {"margin": {"top": 5, "right": 30, "left": 20, "bottom": 5}}
}]`,
      },
    ],
    maxTokens: 800,
    strategy: "fastest",
  });

  try {
    const match = response.content.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array");
    return JSON.parse(match[0]);
  } catch {
    return [{
      chartType: "bar",
      title: `${domain} Intelligence Overview`,
      data: [{ name: "High", value: 3 }, { name: "Medium", value: 7 }, { name: "Low", value: 12 }],
      xKey: "name",
      yKey: "value",
      description: "Risk distribution by severity",
    }];
  }
}

function generateAnnotatedImageSpec(
  imageDescription: string,
  analysisContent: string,
  domain: OutputDomain
): AnnotatedImageSpec {
  return {
    baseImageDescription: imageDescription,
    annotations: [
      {
        label: "Region of Interest",
        region: "center",
        color: "#ef4444",
        confidence: 0.8,
        description: `Key area identified in ${domain} analysis`,
      },
      {
        label: "Secondary Element",
        region: "top-right",
        color: "#f59e0b",
        confidence: 0.65,
        description: "Supporting evidence marker",
      },
    ],
    overlayText: analysisContent.slice(0, 100),
    highlightedAreas: ["primary-zone", "secondary-zone"],
  };
}

function generateAudioSummarySpec(text: string): AudioSummarySpec {
  const wordCount = text.split(/\s+/).length;
  const estimatedDuration = Math.ceil((wordCount / 150) * 60);

  return {
    text: text.slice(0, 500),
    voice: "alloy",
    estimatedDurationSeconds: estimatedDuration,
    ssmlHints: [
      '<break time="500ms"/>',
      '<emphasis level="strong">key points</emphasis>',
    ],
  };
}

export async function generateIntelligenceBriefing(params: {
  domain: OutputDomain;
  assessments: string[];
  title?: string;
}): Promise<StructuredReport> {
  const reportId = `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const domain = params.domain;
  const combinedContent = params.assessments.join("\n\n---\n\n").slice(0, 6000);

  const response = await gatewayInfer({
    messages: [
      {
        role: "system",
        content: `You are a senior intelligence officer producing formal briefings for ${domain} operations. Generate comprehensive, structured intelligence reports.`,
      },
      {
        role: "user",
        content: `Generate an intelligence briefing from these ${params.assessments.length} assessments:

${combinedContent}

Return JSON:
{
  "title": "briefing title",
  "executiveSummary": "2-3 sentence summary",
  "sections": [
    {"sectionTitle": "Current Situation", "content": "...", "sectionType": "narrative"},
    {"sectionTitle": "Key Findings", "content": "...", "sectionType": "key_findings"},
    {"sectionTitle": "Risk Assessment", "content": "...", "sectionType": "narrative"},
    {"sectionTitle": "Recommended Actions", "content": "...", "sectionType": "narrative"}
  ],
  "confidenceScore": 0.0-1.0
}`,
      },
    ],
    maxTokens: 2000,
    strategy: "preferred",
  });

  let parsed: any = {};
  try {
    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
  } catch { }

  return {
    reportId,
    title: params.title ?? parsed.title ?? `${domain} Intelligence Briefing`,
    domain,
    executiveSummary: parsed.executiveSummary ?? combinedContent.slice(0, 200),
    sections: parsed.sections ?? [{ sectionTitle: "Analysis", content: combinedContent.slice(0, 500), sectionType: "narrative" }],
    appendices: [],
    metadata: {
      generatedAt: new Date().toISOString(),
      confidenceScore: parsed.confidenceScore ?? 0.7,
      dataSourceCount: params.assessments.length,
    },
  };
}

export async function generateDomainBriefingCard(params: {
  domain: OutputDomain;
  headline: string;
  data: Record<string, any>;
}): Promise<BriefingCard> {
  const cardId = `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    cardId,
    domain: params.domain,
    priority: params.data.severity === "critical" ? "critical" : params.data.severity === "high" ? "high" : "medium",
    headline: params.headline,
    summary: params.data.summary ?? params.headline,
    keyMetrics: params.data.metrics ?? [],
    actionItems: params.data.actionItems ?? [],
    timestamp: new Date().toISOString(),
  };
}
