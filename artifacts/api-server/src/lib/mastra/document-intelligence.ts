import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";
import { logAction, updateActionStatus, generateActionId } from "./action-audit";

export type DocumentDomain = "legal" | "maritime" | "real_estate" | "cyber" | "financial" | "general";

export interface DocumentIngestRequest {
  content: string;
  sourceType: "text" | "pdf_text" | "image_description" | "html" | "markdown";
  filename?: string;
  domain?: DocumentDomain;
  tags?: string[];
  triggeredBy?: string;
}

export interface DocumentIntelligenceResult {
  documentId: string;
  actionId: string;
  domain: DocumentDomain;
  classification: {
    primaryCategory: string;
    secondaryCategories: string[];
    confidence: number;
    sensitivityLevel: "public" | "internal" | "confidential" | "restricted";
  };
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
    context?: string;
  }>;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment?: "positive" | "neutral" | "negative" | "mixed";
  riskSignals: string[];
  latencyMs: number;
  tokensUsed: number;
}

export async function ensureDocumentIntelligenceTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_document_intelligence (
        id BIGSERIAL PRIMARY KEY,
        document_id TEXT NOT NULL UNIQUE,
        action_id TEXT,
        filename TEXT,
        source_type TEXT NOT NULL,
        content_preview TEXT,
        domain TEXT NOT NULL DEFAULT 'general',
        tags TEXT[] DEFAULT '{}',
        classification JSONB DEFAULT '{}',
        entities JSONB DEFAULT '[]',
        summary TEXT,
        key_points JSONB DEFAULT '[]',
        action_items JSONB DEFAULT '[]',
        sentiment TEXT,
        risk_signals JSONB DEFAULT '[]',
        tokens_used INTEGER DEFAULT 0,
        latency_ms INTEGER DEFAULT 0,
        triggered_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_doc_intel_domain ON ai_document_intelligence(domain);
      CREATE INDEX IF NOT EXISTS idx_ai_doc_intel_created_at ON ai_document_intelligence(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_doc_intel_tags ON ai_document_intelligence USING GIN(tags);
    `);
    logger.info("ai_document_intelligence table ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure document intelligence tables");
  }
}

export async function ingestDocument(request: DocumentIngestRequest): Promise<DocumentIntelligenceResult> {
  const documentId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const actionId = generateActionId();
  const startTime = Date.now();

  await logAction({
    actionId,
    actionType: "document_processed",
    triggeredBy: request.triggeredBy ?? "api",
    domain: request.domain,
    input: { filename: request.filename, sourceType: request.sourceType, contentLength: request.content.length },
    status: "running",
    approvalRequired: false,
  });

  const contentForAnalysis = request.content.slice(0, 8000);

  try {
    const [classificationResult, entityResult, summaryResult] = await Promise.allSettled([
      classifyDocument(contentForAnalysis, request.domain),
      extractDocumentEntities(contentForAnalysis),
      summarizeDocument(contentForAnalysis),
    ]);

    const classification = classificationResult.status === "fulfilled"
      ? classificationResult.value
      : { primaryCategory: "unknown", secondaryCategories: [], confidence: 0, sensitivityLevel: "internal" as const };

    const entities = entityResult.status === "fulfilled" ? entityResult.value : [];
    const summary = summaryResult.status === "fulfilled" ? summaryResult.value : { summary: "", keyPoints: [], actionItems: [], sentiment: "neutral" as const, riskSignals: [] };

    const inferredDomain = request.domain ?? inferDomain(classification.primaryCategory, entities);
    const latencyMs = Date.now() - startTime;
    const tokensUsed = 500;

    const result: DocumentIntelligenceResult = {
      documentId,
      actionId,
      domain: inferredDomain,
      classification,
      entities,
      summary: summary.summary,
      keyPoints: summary.keyPoints,
      actionItems: summary.actionItems,
      sentiment: summary.sentiment,
      riskSignals: summary.riskSignals,
      latencyMs,
      tokensUsed,
    };

    await pool.query(
      `INSERT INTO ai_document_intelligence
       (document_id, action_id, filename, source_type, content_preview, domain, tags,
        classification, entities, summary, key_points, action_items, sentiment, risk_signals,
        tokens_used, latency_ms, triggered_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW())`,
      [
        documentId, actionId, request.filename ?? null, request.sourceType,
        request.content.slice(0, 500), inferredDomain, request.tags ?? [],
        JSON.stringify(classification), JSON.stringify(entities),
        summary.summary, JSON.stringify(summary.keyPoints),
        JSON.stringify(summary.actionItems), summary.sentiment ?? "neutral",
        JSON.stringify(summary.riskSignals),
        tokensUsed, latencyMs, request.triggeredBy ?? "api",
      ]
    );

    await updateActionStatus(actionId, "completed", {
      output: { documentId, domain: inferredDomain, entityCount: entities.length },
      latencyMs,
    });

    logger.info({ documentId, domain: inferredDomain, latencyMs }, "Document ingested and analyzed");
    return result;
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    await updateActionStatus(actionId, "failed", { errorMessage: err.message, latencyMs });
    throw err;
  }
}

async function classifyDocument(content: string, hintDomain?: DocumentDomain): Promise<DocumentIntelligenceResult["classification"]> {
  const domainHint = hintDomain ? `Hint: this document appears to be in the "${hintDomain}" domain.` : "";

  const response = await gatewayInfer({
    messages: [
      {
        role: "system",
        content: `You are a document classification AI. Classify the document and return valid JSON only.
Return: {"primaryCategory":"string","secondaryCategories":["string"],"confidence":0.0-1.0,"sensitivityLevel":"public|internal|confidential|restricted"}
${domainHint}`,
      },
      { role: "user", content: content.slice(0, 4000) },
    ],
    maxTokens: 200,
    strategy: "cheapest",
  });

  try {
    const match = response.content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    return JSON.parse(match[0]);
  } catch {
    return {
      primaryCategory: hintDomain ?? "general",
      secondaryCategories: [],
      confidence: 0.5,
      sensitivityLevel: "internal",
    };
  }
}

async function extractDocumentEntities(content: string): Promise<DocumentIntelligenceResult["entities"]> {
  const response = await gatewayInfer({
    messages: [
      {
        role: "system",
        content: `Extract named entities from the document. Return valid JSON array only.
Format: [{"type":"person|organization|location|date|amount|asset|legal_ref|vessel|property","value":"string","confidence":0.0-1.0,"context":"brief surrounding context"}]
Return an empty array if no entities found.`,
      },
      { role: "user", content: content.slice(0, 4000) },
    ],
    maxTokens: 500,
    strategy: "cheapest",
  });

  try {
    const match = response.content.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]);
  } catch {
    return [];
  }
}

async function summarizeDocument(content: string): Promise<{
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  riskSignals: string[];
}> {
  const response = await gatewayInfer({
    messages: [
      {
        role: "system",
        content: `Analyze and summarize the document. Return valid JSON only.
Return: {
  "summary": "2-3 sentence summary",
  "keyPoints": ["key point 1", "key point 2", ...],
  "actionItems": ["action 1", "action 2", ...],
  "sentiment": "positive|neutral|negative|mixed",
  "riskSignals": ["risk 1", "risk 2", ...]
}`,
      },
      { role: "user", content: content.slice(0, 6000) },
    ],
    maxTokens: 600,
    strategy: "cheapest",
  });

  try {
    const match = response.content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return JSON.parse(match[0]);
  } catch {
    return {
      summary: "Document processed but analysis unavailable",
      keyPoints: [],
      actionItems: [],
      sentiment: "neutral",
      riskSignals: [],
    };
  }
}

function inferDomain(category: string, entities: DocumentIntelligenceResult["entities"]): DocumentDomain {
  const cat = category.toLowerCase();
  if (cat.includes("legal") || cat.includes("contract") || cat.includes("compliance") || cat.includes("regulation")) return "legal";
  if (cat.includes("maritime") || cat.includes("vessel") || cat.includes("shipping") || cat.includes("port")) return "maritime";
  if (cat.includes("real estate") || cat.includes("property") || cat.includes("land") || cat.includes("mortgage")) return "real_estate";
  if (cat.includes("cyber") || cat.includes("security") || cat.includes("threat") || cat.includes("vulnerability")) return "cyber";
  if (cat.includes("financial") || cat.includes("finance") || cat.includes("investment") || cat.includes("fund")) return "financial";

  const entityTypes = entities.map(e => e.type);
  if (entityTypes.includes("vessel")) return "maritime";
  if (entityTypes.includes("property")) return "real_estate";
  if (entityTypes.includes("legal_ref")) return "legal";

  return "general";
}

export async function listDocuments(filters?: {
  domain?: string;
  limit?: number;
  offset?: number;
}): Promise<{ documents: any[]; total: number }> {
  const conditions = ["1=1"];
  const params: any[] = [];
  let idx = 1;

  if (filters?.domain) { conditions.push(`domain = $${idx}`); params.push(filters.domain); idx++; }

  try {
    const [data, count] = await Promise.all([
      pool.query(
        `SELECT document_id, action_id, filename, source_type, domain, tags,
                classification, summary, key_points, action_items, sentiment, risk_signals,
                tokens_used, latency_ms, triggered_by, created_at
         FROM ai_document_intelligence WHERE ${conditions.join(" AND ")}
         ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, filters?.limit ?? 20, filters?.offset ?? 0]
      ),
      pool.query(`SELECT COUNT(*) as cnt FROM ai_document_intelligence WHERE ${conditions.join(" AND ")}`, params),
    ]);
    return { documents: data.rows, total: parseInt(count.rows[0]?.cnt ?? "0") };
  } catch (err) {
    logger.error({ err }, "Failed to list documents");
    return { documents: [], total: 0 };
  }
}

export async function getDocument(documentId: string): Promise<any | null> {
  try {
    const result = await pool.query(
      "SELECT * FROM ai_document_intelligence WHERE document_id = $1",
      [documentId]
    );
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function batchIngestDocuments(
  documents: DocumentIngestRequest[]
): Promise<{ results: Array<{ documentId?: string; error?: string }>; successCount: number; failureCount: number }> {
  const BATCH_SIZE = 5;
  const allResults: Array<{ documentId?: string; error?: string }> = [];

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(batch.map(doc => ingestDocument(doc)));

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        allResults.push({ documentId: result.value.documentId });
      } else {
        allResults.push({ error: result.reason?.message ?? "Unknown error" });
      }
    }

    if (i + BATCH_SIZE < documents.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return {
    results: allResults,
    successCount: allResults.filter(r => r.documentId).length,
    failureCount: allResults.filter(r => r.error).length,
  };
}
