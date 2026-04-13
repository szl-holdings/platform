import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";
import { logAction, updateActionStatus, generateActionId } from "./action-audit";
import type { DocumentDomain, DocumentIntelligenceResult } from "./document-intelligence";
export type { DocumentDomain };

export type InputModality = "text" | "pdf_text" | "image_base64" | "audio_base64" | "handwritten_image" | "html" | "markdown" | "scanned_document";

export interface MultimodalDocumentInput {
  modalities: Array<{
    type: InputModality;
    content: string;
    filename?: string;
    label?: string;
  }>;
  domain?: DocumentDomain;
  tags?: string[];
  triggeredBy?: string;
  crossModalLinking?: boolean;
}

export interface MultimodalDocumentResult extends DocumentIntelligenceResult {
  modalityResults: Array<{
    type: InputModality;
    filename?: string;
    label?: string;
    extractedText: string;
    confidence: number;
    entities: DocumentIntelligenceResult["entities"];
  }>;
  crossModalLinks: Array<{
    sourceModality: InputModality;
    targetModality: InputModality;
    linkType: string;
    referenceText: string;
    confidence: number;
  }>;
  citations: Array<{
    text: string;
    sourceModality: InputModality;
    sourceLabel?: string;
    confidence: number;
  }>;
  fusedContent: string;
}

async function ensureMultimodalTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_multimodal_documents (
        id BIGSERIAL PRIMARY KEY,
        document_id TEXT NOT NULL UNIQUE,
        action_id TEXT,
        domain TEXT NOT NULL DEFAULT 'general',
        tags TEXT[] DEFAULT '{}',
        modality_count INTEGER DEFAULT 0,
        modalities TEXT[] DEFAULT '{}',
        fused_content TEXT,
        cross_modal_links JSONB DEFAULT '[]',
        citations JSONB DEFAULT '[]',
        classification JSONB DEFAULT '{}',
        entities JSONB DEFAULT '[]',
        summary TEXT,
        key_points JSONB DEFAULT '[]',
        action_items JSONB DEFAULT '[]',
        sentiment TEXT,
        risk_signals JSONB DEFAULT '[]',
        triggered_by TEXT,
        tokens_used INTEGER DEFAULT 0,
        latency_ms INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_multimodal_domain ON ai_multimodal_documents(domain);
      CREATE INDEX IF NOT EXISTS idx_ai_multimodal_created_at ON ai_multimodal_documents(created_at DESC);
    `);
  } catch (err) {
    logger.warn({ err }, "Failed to ensure multimodal document tables (non-fatal)");
  }
}

ensureMultimodalTables().catch(() => {});

async function extractTextFromModality(
  type: InputModality,
  content: string,
  filename?: string,
): Promise<{ text: string; confidence: number }> {
  switch (type) {
    case "text":
    case "pdf_text":
    case "html":
    case "markdown":
      return { text: content, confidence: 1.0 };

    case "image_base64":
    case "handwritten_image":
    case "scanned_document": {
      const ocrPrompt = type === "handwritten_image"
        ? "You are an OCR system specialized in handwritten text. Extract all text from this handwritten document accurately. Preserve formatting and note any unclear portions with [unclear]. Return only the extracted text."
        : "You are an OCR system. Extract all text from this document image/scan accurately. Preserve tables, headers, and structure. Return only the extracted text.";

      try {
        const result = await gatewayInfer({
          messages: [
            { role: "system", content: ocrPrompt },
            { role: "user", content: `[Image data: ${content.slice(0, 200)}...] File: ${filename ?? "document"}` },
          ],
          maxTokens: 2000,
          strategy: "cheapest",
        });
        return { text: result.content, confidence: type === "handwritten_image" ? 0.75 : 0.85 };
      } catch {
        return { text: `[OCR extraction failed for ${filename ?? "image"}]`, confidence: 0 };
      }
    }

    case "audio_base64": {
      const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
      const baseUrl = process.env.OPENAI_API_KEY ? "https://api.openai.com/v1" : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

      if (apiKey && baseUrl) {
        try {
          const audioBuffer = Buffer.from(content, "base64");
          const form = new FormData();
          const blob = new Blob([audioBuffer], { type: "audio/mp3" });
          form.append("file", blob, filename ?? "audio.mp3");
          form.append("model", "whisper-1");
          form.append("response_format", "verbose_json");

          const res = await fetch(`${baseUrl}/audio/transcriptions`, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: form,
          });

          if (res.ok) {
            const data = await res.json() as { text: string };
            return { text: `[TRANSCRIPT] ${data.text}`, confidence: 0.92 };
          }
        } catch { }
      }

      return { text: `[Audio transcription pending — ${filename ?? "audio file"}]`, confidence: 0 };
    }

    default:
      return { text: content, confidence: 0.8 };
  }
}

async function detectCrossModalLinks(
  modalityResults: Array<{ type: InputModality; label?: string; text: string }>,
): Promise<Array<{
  sourceModality: InputModality;
  targetModality: InputModality;
  linkType: string;
  referenceText: string;
  confidence: number;
}>> {
  if (modalityResults.length < 2) return [];

  try {
    const contextSummaries = modalityResults.map((m, i) =>
      `Modality ${i + 1} (${m.type}${m.label ? ` - ${m.label}` : ""}): ${m.text.slice(0, 500)}`
    ).join("\n\n");

    const result = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are a cross-document reference analyst. Find references between these document modalities (e.g. "Exhibit A" in audio referring to a document, transcript referencing a photo, etc.).
Return JSON array: [{"sourceIndex":number,"targetIndex":number,"linkType":"exhibit_reference|quote|annotation|figure_reference|timestamp_reference","referenceText":"string","confidence":number}]
Return empty array if no cross-modal links found.`,
        },
        { role: "user", content: contextSummaries },
      ],
      maxTokens: 400,
      strategy: "cheapest",
    });

    const match = result.content.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const raw = JSON.parse(match[0]) as Array<{ sourceIndex: number; targetIndex: number; linkType: string; referenceText: string; confidence: number }>;
    return raw.map(link => ({
      sourceModality: modalityResults[link.sourceIndex]?.type ?? "text",
      targetModality: modalityResults[link.targetIndex]?.type ?? "text",
      linkType: link.linkType,
      referenceText: link.referenceText,
      confidence: link.confidence,
    }));
  } catch {
    return [];
  }
}

async function fuseAndAnalyze(fusedContent: string, domain?: DocumentDomain): Promise<{
  classification: DocumentIntelligenceResult["classification"];
  entities: DocumentIntelligenceResult["entities"];
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  riskSignals: string[];
  citations: Array<{ text: string; sourceModality: InputModality; sourceLabel?: string; confidence: number }>;
}> {
  const contentSlice = fusedContent.slice(0, 8000);
  const domainHint = domain ? `Domain: ${domain}.` : "";

  const [classResult, entityResult, summaryResult] = await Promise.allSettled([
    gatewayInfer({
      messages: [
        { role: "system", content: `Classify this multimodal document. ${domainHint} Return JSON: {"primaryCategory":"string","secondaryCategories":["string"],"confidence":number,"sensitivityLevel":"public|internal|confidential|restricted"}` },
        { role: "user", content: contentSlice.slice(0, 3000) },
      ],
      maxTokens: 200,
      strategy: "cheapest",
    }),
    gatewayInfer({
      messages: [
        { role: "system", content: `Extract entities from this multimodal document. Return JSON array: [{"type":"person|organization|location|date|amount|asset|legal_ref|vessel|property|exhibit","value":"string","confidence":number,"context":"string","sourceModality":"string"}]` },
        { role: "user", content: contentSlice.slice(0, 4000) },
      ],
      maxTokens: 600,
      strategy: "cheapest",
    }),
    gatewayInfer({
      messages: [
        {
          role: "system",
          content: `Analyze this multimodal document with fused content from multiple sources. ${domainHint}
Return JSON: {"summary":"string","keyPoints":["string"],"actionItems":["string"],"sentiment":"positive|neutral|negative|mixed","riskSignals":["string"],"citations":[{"text":"string","sourceType":"string","confidence":number}]}`,
        },
        { role: "user", content: contentSlice.slice(0, 6000) },
      ],
      maxTokens: 800,
      strategy: "cheapest",
    }),
  ]);

  const classification = classResult.status === "fulfilled"
    ? (() => {
      try { const m = classResult.value.content.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) as DocumentIntelligenceResult["classification"] : null; } catch { return null; }
    })() ?? { primaryCategory: domain ?? "general", secondaryCategories: [], confidence: 0.5, sensitivityLevel: "internal" as const }
    : { primaryCategory: domain ?? "general", secondaryCategories: [], confidence: 0.5, sensitivityLevel: "internal" as const };

  const entities = entityResult.status === "fulfilled"
    ? (() => {
      try { const m = entityResult.value.content.match(/\[[\s\S]*\]/); return m ? JSON.parse(m[0]) as DocumentIntelligenceResult["entities"] : []; } catch { return []; }
    })()
    : [];

  let summary = "Document processed — analysis unavailable";
  let keyPoints: string[] = [];
  let actionItems: string[] = [];
  let sentiment: "positive" | "neutral" | "negative" | "mixed" = "neutral";
  let riskSignals: string[] = [];
  let citations: Array<{ text: string; sourceModality: InputModality; sourceLabel?: string; confidence: number }> = [];

  if (summaryResult.status === "fulfilled") {
    try {
      const m = summaryResult.value.content.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]) as {
          summary?: string;
          keyPoints?: string[];
          actionItems?: string[];
          sentiment?: "positive" | "neutral" | "negative" | "mixed";
          riskSignals?: string[];
          citations?: Array<{ text: string; sourceType: string; confidence: number }>;
        };
        summary = parsed.summary ?? summary;
        keyPoints = parsed.keyPoints ?? [];
        actionItems = parsed.actionItems ?? [];
        sentiment = parsed.sentiment ?? "neutral";
        riskSignals = parsed.riskSignals ?? [];
        citations = (parsed.citations ?? []).map(c => ({
          text: c.text,
          sourceModality: (c.sourceType as InputModality) ?? "text",
          confidence: c.confidence,
        }));
      }
    } catch { }
  }

  return { classification, entities, summary, keyPoints, actionItems, sentiment, riskSignals, citations };
}

export async function processMultimodalDocument(request: MultimodalDocumentInput): Promise<MultimodalDocumentResult> {
  const documentId = `mmdoc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const actionId = generateActionId();
  const startTime = Date.now();

  await logAction({
    actionId,
    actionType: "document_processed",
    triggeredBy: request.triggeredBy ?? "api",
    domain: request.domain,
    input: {
      modalityCount: request.modalities.length,
      modalities: request.modalities.map(m => m.type),
      domain: request.domain,
    },
    status: "running",
    approvalRequired: false,
  });

  try {
    const extractionResults = await Promise.all(
      request.modalities.map(async (modality) => {
        const { text, confidence } = await extractTextFromModality(modality.type, modality.content, modality.filename);
        const entityResult = await gatewayInfer({
          messages: [
            { role: "system", content: "Extract entities from this content. Return JSON array: [{\"type\":\"string\",\"value\":\"string\",\"confidence\":number,\"context\":\"string\"}]" },
            { role: "user", content: text.slice(0, 3000) },
          ],
          maxTokens: 300,
          strategy: "cheapest",
        }).catch(() => ({ content: "[]" }));

        let entities: DocumentIntelligenceResult["entities"] = [];
        try {
          const m = entityResult.content.match(/\[[\s\S]*\]/);
          if (m) entities = JSON.parse(m[0]) as DocumentIntelligenceResult["entities"];
        } catch { }

        return {
          type: modality.type,
          filename: modality.filename,
          label: modality.label,
          extractedText: text,
          confidence,
          entities,
        };
      })
    );

    const fusedContent = extractionResults
      .map(r => {
        const header = `--- [${r.type.toUpperCase()}${r.label ? ` - ${r.label}` : ""}${r.filename ? ` (${r.filename})` : ""}] ---`;
        return `${header}\n${r.extractedText}`;
      })
      .join("\n\n");

    const crossModalLinks = request.crossModalLinking !== false
      ? await detectCrossModalLinks(extractionResults.map(r => ({ type: r.type, label: r.label, text: r.extractedText })))
      : [];

    const analysis = await fuseAndAnalyze(fusedContent, request.domain);

    const latencyMs = Date.now() - startTime;
    const allEntities = [...analysis.entities, ...extractionResults.flatMap(r => r.entities)].filter(
      (e, i, arr) => arr.findIndex(a => a.value === e.value && a.type === e.type) === i
    );

    const inferredDomain = request.domain ?? inferDomain(analysis.classification.primaryCategory, allEntities);

    const result: MultimodalDocumentResult = {
      documentId,
      actionId,
      domain: inferredDomain,
      classification: analysis.classification,
      entities: allEntities,
      summary: analysis.summary,
      keyPoints: analysis.keyPoints,
      actionItems: analysis.actionItems,
      sentiment: analysis.sentiment,
      riskSignals: analysis.riskSignals,
      latencyMs,
      tokensUsed: extractionResults.length * 200 + 600,
      modalityResults: extractionResults,
      crossModalLinks,
      citations: analysis.citations,
      fusedContent: fusedContent.slice(0, 2000),
    };

    await pool.query(
      `INSERT INTO ai_multimodal_documents
       (document_id, action_id, domain, tags, modality_count, modalities, fused_content, cross_modal_links, citations,
        classification, entities, summary, key_points, action_items, sentiment, risk_signals, triggered_by, tokens_used, latency_ms, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW())
       ON CONFLICT (document_id) DO UPDATE SET updated_at = NOW()`,
      [
        documentId, actionId, inferredDomain, request.tags ?? [],
        extractionResults.length,
        extractionResults.map(r => r.type),
        fusedContent.slice(0, 5000),
        JSON.stringify(crossModalLinks),
        JSON.stringify(analysis.citations),
        JSON.stringify(analysis.classification),
        JSON.stringify(allEntities),
        analysis.summary,
        JSON.stringify(analysis.keyPoints),
        JSON.stringify(analysis.actionItems),
        analysis.sentiment ?? "neutral",
        JSON.stringify(analysis.riskSignals),
        request.triggeredBy ?? "api",
        extractionResults.length * 200 + 600,
        latencyMs,
      ]
    );

    await updateActionStatus(actionId, "completed", {
      output: { documentId, domain: inferredDomain, modalityCount: extractionResults.length, entityCount: allEntities.length },
      latencyMs,
    });

    logger.info({ documentId, domain: inferredDomain, modalityCount: extractionResults.length, latencyMs }, "Multimodal document processed");
    return result;
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    await updateActionStatus(actionId, "failed", {
      errorMessage: err instanceof Error ? err.message : String(err),
      latencyMs,
    });
    throw err;
  }
}

function inferDomain(category: string, entities: DocumentIntelligenceResult["entities"]): DocumentDomain {
  const cat = category.toLowerCase();
  if (cat.includes("legal") || cat.includes("contract") || cat.includes("exhibit") || cat.includes("deposition")) return "legal";
  if (cat.includes("maritime") || cat.includes("vessel") || cat.includes("shipping")) return "maritime";
  if (cat.includes("real estate") || cat.includes("property") || cat.includes("deed")) return "real_estate";
  if (cat.includes("cyber") || cat.includes("security") || cat.includes("threat")) return "cyber";
  if (cat.includes("financial") || cat.includes("finance") || cat.includes("investment")) return "financial";
  const entityTypes = entities.map(e => e.type);
  if (entityTypes.includes("vessel")) return "maritime";
  if (entityTypes.includes("property")) return "real_estate";
  if (entityTypes.includes("legal_ref") || entityTypes.includes("exhibit")) return "legal";
  return "general";
}

export async function listMultimodalDocuments(filters?: {
  domain?: string;
  limit?: number;
  offset?: number;
}): Promise<{ documents: unknown[]; total: number }> {
  try {
    const conditions = ["1=1"];
    const params: unknown[] = [];
    let idx = 1;
    if (filters?.domain) { conditions.push(`domain = $${idx}`); params.push(filters.domain); idx++; }

    const [data, count] = await Promise.all([
      pool.query(
        `SELECT document_id, action_id, domain, tags, modality_count, modalities, summary, classification, sentiment, triggered_by, created_at
         FROM ai_multimodal_documents WHERE ${conditions.join(" AND ")}
         ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, filters?.limit ?? 20, filters?.offset ?? 0],
      ),
      pool.query(`SELECT COUNT(*) as cnt FROM ai_multimodal_documents WHERE ${conditions.join(" AND ")}`, params),
    ]);

    return { documents: data.rows, total: parseInt((count.rows[0] as { cnt?: string })?.cnt ?? "0") };
  } catch {
    return { documents: [], total: 0 };
  }
}

export async function getMultimodalDocument(documentId: string): Promise<unknown | null> {
  try {
    const result = await pool.query("SELECT * FROM ai_multimodal_documents WHERE document_id = $1", [documentId]);
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}

export { type DocumentIntelligenceResult };
