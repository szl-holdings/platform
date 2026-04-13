import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";
import { logAction, updateActionStatus, generateActionId } from "./action-audit";

export type FusionDomain = "maritime" | "real_estate" | "legal" | "defense" | "financial" | "general";

export interface ModalityInput {
  type: "text" | "image_url" | "image_base64" | "audio_transcript" | "structured_data" | "document";
  content: string;
  label?: string;
  sourceId?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface FusionCitation {
  modalityType: string;
  label: string;
  excerpt: string;
  relevanceScore: number;
  sourceId?: string;
}

export interface CrossModalConnection {
  modalityA: string;
  modalityB: string;
  connectionType: string;
  description: string;
  strength: number;
}

export interface FusionAssessment {
  fusionId: string;
  actionId: string;
  domain: FusionDomain;
  overallConclusion: string;
  confidenceScore: number;
  threatLevel?: "low" | "medium" | "high" | "critical";
  keyFindings: string[];
  crossModalConnections: CrossModalConnection[];
  citations: FusionCitation[];
  modalitySummaries: Record<string, string>;
  recommendedActions: string[];
  uncertaintyFactors: string[];
  latencyMs: number;
  tokensUsed: number;
}

async function ensureFusionTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS multimodal_fusion_assessments (
      id BIGSERIAL PRIMARY KEY,
      fusion_id TEXT NOT NULL UNIQUE,
      action_id TEXT,
      domain TEXT NOT NULL DEFAULT 'general',
      modality_count INTEGER NOT NULL DEFAULT 0,
      modality_types TEXT[] DEFAULT '{}',
      overall_conclusion TEXT,
      confidence_score REAL DEFAULT 0,
      threat_level TEXT,
      key_findings JSONB DEFAULT '[]',
      cross_modal_connections JSONB DEFAULT '[]',
      citations JSONB DEFAULT '[]',
      modality_summaries JSONB DEFAULT '{}',
      recommended_actions JSONB DEFAULT '[]',
      uncertainty_factors JSONB DEFAULT '[]',
      tokens_used INTEGER DEFAULT 0,
      latency_ms INTEGER DEFAULT 0,
      triggered_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `).catch(() => {});
}

ensureFusionTable().catch(() => {});

function buildFusionSystemPrompt(domain: FusionDomain): string {
  const domainContexts: Record<FusionDomain, string> = {
    maritime: "You are a maritime intelligence analyst specializing in vessel tracking, AIS data anomalies, cargo manifests, port authority records, and radio transcript analysis.",
    real_estate: "You are a real estate intelligence analyst specializing in property valuation, distress signals, county records, drone footage analysis, and neighborhood data fusion.",
    legal: "You are a legal intelligence analyst specializing in contract analysis, deposition evidence, courtroom proceedings, email chain forensics, and evidence graph construction.",
    defense: "You are a defense intelligence analyst specializing in voice stress analysis, movement pattern correlation, OSINT fusion, and multi-source threat assessment.",
    financial: "You are a financial intelligence analyst specializing in cross-market correlation, transaction pattern analysis, regulatory filing fusion, and risk signal detection.",
    general: "You are a cross-domain intelligence analyst specializing in fusing evidence from multiple modalities to produce unified assessments.",
  };

  return `${domainContexts[domain]}

Your task is to perform cross-modal fusion intelligence analysis. You will receive inputs from multiple modalities (text, images, audio transcripts, structured data, documents) and must:
1. Analyze each modality independently and identify key signals
2. Find connections and correlations ACROSS modalities that would be invisible when analyzing each modality alone
3. Synthesize a unified intelligence assessment that references evidence from all modalities
4. Assign confidence scores weighted by evidence strength from each modality
5. Identify contradictions or gaps between modalities that introduce uncertainty

Respond in valid JSON matching the requested schema. Be specific about which evidence comes from which modality.`;
}

export async function runCrossModalFusion(
  modalities: ModalityInput[],
  domain: FusionDomain,
  options?: {
    triggeredBy?: string;
    focusQuestion?: string;
  }
): Promise<FusionAssessment> {
  const fusionId = `fusion_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const actionId = generateActionId();
  const startTime = Date.now();

  await logAction({
    actionId,
    actionType: "document_processed",
    triggeredBy: options?.triggeredBy ?? "api",
    domain,
    input: { modalityCount: modalities.length, modalityTypes: modalities.map(m => m.type) },
    status: "running",
    approvalRequired: false,
  });

  const modalityBlocks = modalities.map((m, i) => {
    const label = m.label ?? `Input ${i + 1}`;
    return `--- MODALITY: ${m.type.toUpperCase()} | LABEL: ${label} ---\n${m.content.slice(0, 3000)}\n`;
  }).join("\n");

  const focusContext = options?.focusQuestion
    ? `\n\nFOCUS QUESTION: ${options.focusQuestion}`
    : "";

  const systemPrompt = buildFusionSystemPrompt(domain);

  const userPrompt = `Perform cross-modal fusion analysis on the following ${modalities.length} inputs:

${modalityBlocks}${focusContext}

Return a JSON object with this exact structure:
{
  "overallConclusion": "2-3 sentence unified assessment synthesizing all modalities",
  "confidenceScore": 0.0-1.0,
  "threatLevel": "low|medium|high|critical",
  "keyFindings": ["finding 1 with modality citation", "finding 2", ...],
  "crossModalConnections": [
    {
      "modalityA": "modality type/label",
      "modalityB": "modality type/label",
      "connectionType": "corroborates|contradicts|extends|contextualizes",
      "description": "how they connect",
      "strength": 0.0-1.0
    }
  ],
  "citations": [
    {
      "modalityType": "text|image_url|audio_transcript|etc",
      "label": "label of the input",
      "excerpt": "key quote or description from this modality",
      "relevanceScore": 0.0-1.0
    }
  ],
  "modalitySummaries": {
    "label_of_input": "summary of what this specific modality revealed"
  },
  "recommendedActions": ["action 1", "action 2", ...],
  "uncertaintyFactors": ["what we don't know", ...]
}`;

  let assessment: Omit<FusionAssessment, "fusionId" | "actionId" | "domain" | "latencyMs" | "tokensUsed">;
  let tokensUsed = 0;

  try {
    const response = await gatewayInfer({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 2000,
      strategy: "preferred",
    });

    tokensUsed = response.usage?.totalTokens ?? 0;

    const match = response.content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in fusion response");

    const parsed = JSON.parse(match[0]);
    assessment = {
      overallConclusion: parsed.overallConclusion ?? "Cross-modal analysis completed",
      confidenceScore: parsed.confidenceScore ?? 0.5,
      threatLevel: parsed.threatLevel,
      keyFindings: parsed.keyFindings ?? [],
      crossModalConnections: parsed.crossModalConnections ?? [],
      citations: parsed.citations ?? [],
      modalitySummaries: parsed.modalitySummaries ?? {},
      recommendedActions: parsed.recommendedActions ?? [],
      uncertaintyFactors: parsed.uncertaintyFactors ?? [],
    };
  } catch (parseErr) {
    logger.warn({ parseErr, fusionId }, "Fusion response parse failed — using fallback");
    assessment = {
      overallConclusion: "Cross-modal fusion analysis completed with partial results",
      confidenceScore: 0.4,
      keyFindings: modalities.map(m => `${m.type}: ${m.content.slice(0, 80)}...`),
      crossModalConnections: [],
      citations: modalities.map(m => ({
        modalityType: m.type,
        label: m.label ?? m.type,
        excerpt: m.content.slice(0, 100),
        relevanceScore: 0.5,
      })),
      modalitySummaries: Object.fromEntries(modalities.map(m => [m.label ?? m.type, m.content.slice(0, 100)])),
      recommendedActions: [],
      uncertaintyFactors: ["Analysis parsing error — results may be incomplete"],
    };
  }

  const latencyMs = Date.now() - startTime;
  const result: FusionAssessment = {
    fusionId,
    actionId,
    domain,
    ...assessment,
    latencyMs,
    tokensUsed,
  };

  await pool.query(
    `INSERT INTO multimodal_fusion_assessments
     (fusion_id, action_id, domain, modality_count, modality_types, overall_conclusion,
      confidence_score, threat_level, key_findings, cross_modal_connections, citations,
      modality_summaries, recommended_actions, uncertainty_factors, tokens_used, latency_ms, triggered_by, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW())`,
    [
      fusionId, actionId, domain, modalities.length,
      modalities.map(m => m.type),
      result.overallConclusion, result.confidenceScore, result.threatLevel ?? null,
      JSON.stringify(result.keyFindings), JSON.stringify(result.crossModalConnections),
      JSON.stringify(result.citations), JSON.stringify(result.modalitySummaries),
      JSON.stringify(result.recommendedActions), JSON.stringify(result.uncertaintyFactors),
      tokensUsed, latencyMs, options?.triggeredBy ?? "api",
    ]
  ).catch(err => logger.warn({ err }, "Failed to persist fusion assessment"));

  await updateActionStatus(actionId, "completed", {
    output: { fusionId, confidenceScore: result.confidenceScore, keyFindingsCount: result.keyFindings.length },
    latencyMs,
  });

  logger.info({ fusionId, domain, modalities: modalities.length, latencyMs }, "Cross-modal fusion completed");
  return result;
}

export async function listFusionAssessments(filters?: {
  domain?: string;
  limit?: number;
  offset?: number;
}): Promise<{ assessments: any[]; total: number }> {
  const conditions = ["1=1"];
  const params: any[] = [];
  let idx = 1;

  if (filters?.domain) { conditions.push(`domain = $${idx}`); params.push(filters.domain); idx++; }

  try {
    const [data, count] = await Promise.all([
      pool.query(
        `SELECT fusion_id, domain, modality_count, modality_types, overall_conclusion,
                confidence_score, threat_level, key_findings, recommended_actions, created_at
         FROM multimodal_fusion_assessments WHERE ${conditions.join(" AND ")}
         ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, filters?.limit ?? 20, filters?.offset ?? 0]
      ),
      pool.query(`SELECT COUNT(*) as cnt FROM multimodal_fusion_assessments WHERE ${conditions.join(" AND ")}`, params),
    ]);
    return { assessments: data.rows, total: parseInt(count.rows[0]?.cnt ?? "0") };
  } catch {
    return { assessments: [], total: 0 };
  }
}

export async function getFusionAssessment(fusionId: string): Promise<any | null> {
  try {
    const result = await pool.query(
      "SELECT * FROM multimodal_fusion_assessments WHERE fusion_id = $1",
      [fusionId]
    );
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}

export function buildMaritimeFusionInputs(params: {
  satelliteImageDesc?: string;
  aisTranscript?: string;
  portDocuments?: string;
  radioTranscript?: string;
  cargoManifest?: string;
}): ModalityInput[] {
  const inputs: ModalityInput[] = [];
  if (params.satelliteImageDesc) inputs.push({ type: "image_url", content: params.satelliteImageDesc, label: "Satellite Imagery" });
  if (params.aisTranscript) inputs.push({ type: "structured_data", content: params.aisTranscript, label: "AIS Transmission Data" });
  if (params.portDocuments) inputs.push({ type: "document", content: params.portDocuments, label: "Port Authority Documents" });
  if (params.radioTranscript) inputs.push({ type: "audio_transcript", content: params.radioTranscript, label: "Radio Communications" });
  if (params.cargoManifest) inputs.push({ type: "document", content: params.cargoManifest, label: "Cargo Manifest" });
  return inputs;
}

export function buildLegalFusionInputs(params: {
  contractText?: string;
  depositionTranscript?: string;
  emailChains?: string;
  courtSketchDesc?: string;
  financialRecords?: string;
}): ModalityInput[] {
  const inputs: ModalityInput[] = [];
  if (params.contractText) inputs.push({ type: "document", content: params.contractText, label: "Contract Document" });
  if (params.depositionTranscript) inputs.push({ type: "audio_transcript", content: params.depositionTranscript, label: "Deposition Recording" });
  if (params.emailChains) inputs.push({ type: "text", content: params.emailChains, label: "Email Evidence" });
  if (params.courtSketchDesc) inputs.push({ type: "image_url", content: params.courtSketchDesc, label: "Courtroom Visual Analysis" });
  if (params.financialRecords) inputs.push({ type: "structured_data", content: params.financialRecords, label: "Financial Records" });
  return inputs;
}
