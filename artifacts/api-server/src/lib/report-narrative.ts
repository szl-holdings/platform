/**
 * Report Narrative Generator
 * AI-powered generation of executive summaries, trend descriptions, and recommendation sections.
 * Uses the available AI gateway (Anthropic/OpenAI) to produce human-quality narrative copy.
 */
import { logger } from "./logger";

export interface NarrativeRequest {
  domain: "szl_holdings" | "carlota_jo" | "aegis" | "terra" | "vessels" | "lyte" | "prism" | "general";
  reportType: string;
  data: Record<string, unknown>;
  tone?: "executive" | "technical" | "investor" | "advisory";
  sections?: Array<"executive_summary" | "trend_analysis" | "recommendations" | "risk_factors" | "outlook">;
}

export interface NarrativeResult {
  executiveSummary?: string;
  trendAnalysis?: string;
  recommendations?: string;
  riskFactors?: string;
  outlook?: string;
  generatedAt: string;
  model: string;
  tokensUsed?: number;
}

const DOMAIN_CONTEXT: Record<string, string> = {
  szl_holdings: "SZL Holdings is a private operating company building command-layer infrastructure across six domain-specific enterprise intelligence platforms: Carlota Jo (advisory), Terra (real estate), Aegis (cybersecurity), Vessels (maritime), Lyte (AIOps), and PRISM (legal). The company operates on a compounding architecture thesis — shared infrastructure that reduces marginal build cost per platform.",
  carlota_jo: "Carlota Jo Consulting is a strategic advisory firm delivering high-value consulting engagements to enterprise clients. Advisory services include strategic planning, market positioning, revenue architecture, and operational transformation. Engagements are delivered via retainer model with AI-augmented advisory sessions.",
  aegis: "Aegis is a unified defense and intelligence command platform converging SOC operations, threat intelligence, penetration testing, and MSP management. Clients are enterprise organizations and managed security service providers requiring multi-domain security coverage.",
  terra: "Terra is a distress-first real estate intelligence platform covering NYC markets. The platform combines multi-factor distress scoring, NYC Open Data integration, deal pipeline management, and market context. Target users are real estate investors and brokers seeking off-market opportunities.",
  vessels: "Vessels is a maritime intelligence platform providing fleet command capabilities including AIS vessel tracking, voyage economics, sanctions screening, route analysis, and operational command surfaces. Users are fleet operators and maritime executives.",
  lyte: "Lyte is a business observability platform providing multi-model AI routing, cross-portfolio signal aggregation, infrastructure telemetry, and AIOps capabilities. The platform surfaces operational intelligence across the SZL Holdings ecosystem.",
  prism: "PRISM Counsel is a legal matter command platform providing case management, compliance tracking, court date management, document handling, and legal intelligence capabilities for law firms and in-house legal teams.",
  general: "SZL Holdings enterprise platform providing intelligence and command capabilities across multiple business domains.",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  executive: "Write in a crisp, executive briefing style. Lead with the most important insight. Use specific numbers. Avoid jargon. Max 3 sentences per section.",
  technical: "Write with technical precision. Include specific metrics, system references, and operational details. Structured and factual.",
  investor: "Write for sophisticated investors. Focus on market dynamics, competitive positioning, and financial implications. Reference benchmarks and industry context.",
  advisory: "Write in the voice of a trusted strategic advisor. Identify the key tension, offer a clear perspective, and provide actionable direction.",
};

function buildSystemPrompt(domain: string, tone: string): string {
  const domainCtx = DOMAIN_CONTEXT[domain] || DOMAIN_CONTEXT.general;
  const toneInstr = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.executive;
  return `You are the chief intelligence officer for ${domain === "szl_holdings" ? "SZL Holdings" : "a professional services firm"}. You generate the narrative sections of executive reports — not summaries of data, but insight-driven prose that turns data into understanding.

Domain context: ${domainCtx}

Tone: ${toneInstr}

Rules:
- Write in present tense, declarative voice
- Use specific numbers from the data provided
- Never say "this report shows" or "the data indicates" — state insights directly
- Do not use placeholder text or hedging language
- Each section should be 2-4 sentences unless the data warrants more
- Output only the narrative text for each requested section, no headings or labels`;
}

function buildUserPrompt(request: NarrativeRequest): string {
  const sections = request.sections || ["executive_summary", "recommendations"];
  const dataStr = JSON.stringify(request.data, null, 2).slice(0, 4000);

  return `Generate narrative sections for a ${request.reportType} report in the ${request.domain} domain.

Sections needed: ${sections.join(", ")}

Report data:
${dataStr}

For each section, provide:
${sections.includes("executive_summary") ? "EXECUTIVE_SUMMARY: [2-4 sentence executive summary leading with the single most important insight]" : ""}
${sections.includes("trend_analysis") ? "TREND_ANALYSIS: [2-3 sentences describing the most significant trend in the data with specific values]" : ""}
${sections.includes("recommendations") ? "RECOMMENDATIONS: [3-4 sentences providing concrete, prioritized action recommendations]" : ""}
${sections.includes("risk_factors") ? "RISK_FACTORS: [2-3 sentences identifying the most significant risks and their potential impact]" : ""}
${sections.includes("outlook") ? "OUTLOOK: [2 sentences on the near-term outlook, grounded in the data]" : ""}

Respond ONLY with the section markers and content, no other text.`;
}

function parseNarrativeResponse(text: string, sections: string[]): Partial<NarrativeResult> {
  const result: Partial<NarrativeResult> = {};

  const sectionMap: Record<string, keyof NarrativeResult> = {
    EXECUTIVE_SUMMARY: "executiveSummary",
    TREND_ANALYSIS: "trendAnalysis",
    RECOMMENDATIONS: "recommendations",
    RISK_FACTORS: "riskFactors",
    OUTLOOK: "outlook",
  };

  for (const [marker, key] of Object.entries(sectionMap)) {
    const regex = new RegExp(`${marker}:\\s*([\\s\\S]*?)(?=(?:EXECUTIVE_SUMMARY|TREND_ANALYSIS|RECOMMENDATIONS|RISK_FACTORS|OUTLOOK):|$)`, "i");
    const match = text.match(regex);
    if (match && match[1]) {
      (result as Record<string, string>)[key] = match[1].trim();
    }
  }

  return result;
}

function generateFallbackNarrative(request: NarrativeRequest): NarrativeResult {
  const domainName = request.domain.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const reportName = request.reportType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const dataKeys = Object.keys(request.data);
  const hasMetrics = dataKeys.some(k => typeof request.data[k] === "number");

  return {
    executiveSummary: `${domainName} ${reportName} reflects current operational status across ${dataKeys.length} tracked dimensions. ${hasMetrics ? "Quantitative indicators are available for detailed analysis within this report." : "Qualitative assessment indicates normal operating parameters."} Review of this report against prior periods and strategic benchmarks is recommended.`,
    trendAnalysis: `Trend data for the reporting period covers ${dataKeys.slice(0, 3).join(", ")} and related operational metrics. Comparative period analysis requires historical baseline data for directional assessment.`,
    recommendations: `Prioritize review of flagged items within this report and assign owners to any action items identified. Establish a follow-up cadence to track resolution of recommendations. Ensure this report is shared with all relevant stakeholders before the next reporting cycle.`,
    riskFactors: `Standard operational risks apply to this reporting period. Elevated risk items, if any, are noted within the relevant sections of this report. Risk mitigation actions should be assigned and tracked through the standard workflow.`,
    outlook: `The near-term outlook is stable based on current data. Continue monitoring key indicators and escalate any material changes through the standard reporting channel.`,
    generatedAt: new Date().toISOString(),
    model: "fallback",
  };
}

export async function generateReportNarrative(request: NarrativeRequest): Promise<NarrativeResult> {
  const sections = request.sections || ["executive_summary", "recommendations"];
  const tone = request.tone || "executive";

  try {
    let aiModule: { default?: unknown } | null = null;
    try {
      aiModule = await import("@szl-holdings/integrations-anthropic-ai") as { default?: unknown };
    } catch {
      try {
        aiModule = await import("@szl-holdings/integrations-openai-ai-server") as { default?: unknown };
      } catch {
        logger.warn("No AI integration available for narrative generation, using fallback");
      }
    }

    if (!aiModule) {
      return generateFallbackNarrative(request);
    }

    const systemPrompt = buildSystemPrompt(request.domain, tone);
    const userPrompt = buildUserPrompt(request);

    let responseText: string | null = null;
    let tokensUsed: number | undefined;
    let modelName = "claude-3-5-haiku-20241022";

    try {
      const anthropic = aiModule as { default?: { messages?: { create: (...args: unknown[]) => Promise<{ content: Array<{ type: string; text: string }>; usage?: { input_tokens: number; output_tokens: number }; model: string }> } } };
      if (anthropic.default?.messages?.create) {
        const response = await anthropic.default.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });
        responseText = response.content.find((c: { type: string; text: string }) => c.type === "text")?.text || null;
        tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
        modelName = response.model;
      }
    } catch (anthropicErr) {
      logger.warn({ err: anthropicErr }, "Anthropic narrative generation failed, trying OpenAI");
    }

    if (!responseText) {
      try {
        const openai = aiModule as { default?: { chat?: { completions?: { create: (...args: unknown[]) => Promise<{ choices: Array<{ message: { content: string } }>; usage?: { total_tokens: number }; model: string }> } } } };
        if (openai.default?.chat?.completions?.create) {
          const response = await openai.default.chat.completions.create({
            model: "gpt-4o-mini",
            max_tokens: 1024,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          });
          responseText = response.choices[0]?.message?.content || null;
          tokensUsed = response.usage?.total_tokens;
          modelName = response.model;
        }
      } catch (openaiErr) {
        logger.warn({ err: openaiErr }, "OpenAI narrative generation failed, using fallback");
      }
    }

    if (!responseText) {
      return generateFallbackNarrative(request);
    }

    const parsed = parseNarrativeResponse(responseText, sections);

    return {
      ...generateFallbackNarrative(request),
      ...parsed,
      generatedAt: new Date().toISOString(),
      model: modelName,
      tokensUsed,
    };
  } catch (err) {
    logger.error({ err, domain: request.domain, reportType: request.reportType }, "Narrative generation error");
    return generateFallbackNarrative(request);
  }
}
