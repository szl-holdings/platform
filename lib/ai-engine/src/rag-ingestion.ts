import { createHash } from "crypto";
import type { RagSourceType, SensitivityLevel } from "./types.js";

export interface ChunkMetadata {
  source: string;
  sourceType: RagSourceType;
  domain: string;
  sensitivityLevel: SensitivityLevel;
  objectId?: string | null;
  timestamp?: string | null;
  [key: string]: unknown;
}

export interface RawChunk {
  id: string;
  content: string;
  source: string;
  sourceType: RagSourceType;
  domain: string;
  sensitivityLevel: SensitivityLevel;
  objectId: string | null;
  chunkIndex: number;
  chunkHash: string;
  metadata: Record<string, unknown>;
}

const CHUNK_SIZE = 300;
const CHUNK_OVERLAP = 50;

export function chunkWithOverlap(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return [];
  if (words.length <= chunkSize) return [words.join(" ")];

  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end >= words.length) break;
    start += chunkSize - overlap;
  }
  return chunks;
}

export function chunkByParagraphs(text: string, maxChunkWords = 500, overlap = CHUNK_OVERLAP): string[] {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 0);
  if (paragraphs.length <= 1) return chunkWithOverlap(text);

  const chunks: string[] = [];
  let current: string[] = [];
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const paraWords = para.split(/\s+/).length;
    if (currentWordCount + paraWords > maxChunkWords && current.length > 0) {
      chunks.push(current.join("\n\n"));
      const overlapParas = current.slice(-Math.ceil(overlap / 50));
      current = [...overlapParas, para];
      currentWordCount = overlapParas.reduce((s, p) => s + p.split(/\s+/).length, 0) + paraWords;
    } else {
      current.push(para);
      currentWordCount += paraWords;
    }
  }
  if (current.length > 0) chunks.push(current.join("\n\n"));
  return chunks.length > 0 ? chunks : [text];
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

export function createChunks(content: string, meta: ChunkMetadata, prefix = ""): RawChunk[] {
  const paragraphs = content.split(/\n{2,}/);
  const usesParagraphs = paragraphs.length > 1 && paragraphs.every(p => p.split(/\s+/).length < 200);

  const textChunks = usesParagraphs
    ? chunkByParagraphs(content)
    : chunkWithOverlap(content);

  const baseId = `rag-${meta.sourceType}-${meta.objectId ?? hashContent(content)}-${Date.now()}`;

  return textChunks.map((chunk, idx) => {
    const chunkContent = prefix ? `${prefix}\n${chunk}` : chunk;
    return {
      id: `${baseId}-${idx}`,
      content: chunkContent,
      source: meta.source,
      sourceType: meta.sourceType,
      domain: meta.domain,
      sensitivityLevel: meta.sensitivityLevel,
      objectId: meta.objectId ?? null,
      chunkIndex: idx,
      chunkHash: hashContent(chunkContent),
      metadata: {
        timestamp: meta.timestamp ?? new Date().toISOString(),
        totalChunks: textChunks.length,
        ...Object.fromEntries(
          Object.entries(meta).filter(([k]) => !["source", "sourceType", "domain", "sensitivityLevel", "objectId", "timestamp"].includes(k))
        ),
      },
    };
  });
}

export async function generateEmbedding(text: string, domain?: string): Promise<number[] | null> {
  try {
    const { getEmbedding, inferDomain } = await import("./embedding/index.js");
    const embeddingDomain = domain ? inferDomain(domain) : undefined;
    return await getEmbedding(text, embeddingDomain ? { domain: embeddingDomain } : undefined);
  } catch {
    return null;
  }
}

export async function ingestToVectorStore(content: string, meta: ChunkMetadata, prefix = ""): Promise<RawChunk[]> {
  const chunks = createChunks(content, meta, prefix);

  try {
    const { upsertChunksBatch } = await import("./rag-vector-store.js");
    const { embeddingPipeline, inferDomain, RAG_DB_DIMENSIONS } = await import("./embedding/index.js");
    const embeddingDomain = inferDomain(meta.domain);

    const texts = chunks.map(c => c.content);
    const batchResult = await embeddingPipeline.embedBatch(texts, { domain: embeddingDomain, concurrency: 5 });

    const chunksWithEmbeddings = chunks.map((chunk, i) => {
      const res = batchResult.results[i];
      if (!res || res.error) return { ...chunk, embedding: null };
      if (res.embedding.length !== RAG_DB_DIMENSIONS) {
        console.warn(
          `[rag-ingestion] Skipping embedding for chunk ${chunk.id}: ` +
          `expected ${RAG_DB_DIMENSIONS} dimensions, got ${res.embedding.length} from ${res.provider}/${res.model}`,
        );
        return { ...chunk, embedding: null };
      }
      return { ...chunk, embedding: res.embedding };
    });
    await upsertChunksBatch(chunksWithEmbeddings);
    return chunks;
  } catch (err) {
    console.warn("[rag-ingestion] Failed to persist chunks to vector store:", err);
    return chunks;
  }
}

export async function ingestAiDecision(decision: {
  decisionId: string;
  recommendedAction: string;
  rationaleSummary: string;
  riskLevel: string;
  confidence: number;
  rawInput?: string | null;
  rawOutput?: string | null;
  createdAt: string;
}): Promise<void> {
  const content = [
    `AI DECISION: ${decision.decisionId}`,
    `Recommended Action: ${decision.recommendedAction}`,
    `Rationale: ${decision.rationaleSummary}`,
    `Risk Level: ${decision.riskLevel} | Confidence: ${Math.round(decision.confidence * 100)}%`,
    decision.rawInput ? `Input Context: ${decision.rawInput.slice(0, 1000)}` : "",
    decision.rawOutput ? `Output: ${decision.rawOutput.slice(0, 1000)}` : "",
  ].filter(Boolean).join("\n");

  await ingestToVectorStore(content, {
    source: `AI Decision: ${decision.decisionId}`,
    sourceType: "ai_decision",
    domain: "orchestration",
    sensitivityLevel: "confidential",
    objectId: decision.decisionId,
    timestamp: decision.createdAt,
    riskLevel: decision.riskLevel,
    confidence: decision.confidence,
  });
}

export async function ingestCaseMemory(caseId: string, caseSnapshot: Record<string, unknown>): Promise<void> {
  const decisions = (caseSnapshot.decisions as Array<Record<string, unknown>>) ?? [];
  const notes = (caseSnapshot.analystNotes as Array<Record<string, unknown>>) ?? [];

  const decisionText = decisions.map(d =>
    `Decision: ${d.decisionType} | Action: ${d.recommendedAction} | Impact: ${d.impactLevel} | Confidence: ${d.confidence}`
  ).join("\n");

  const noteText = notes.map(n => `Note by ${n.author}: ${n.content}`).join("\n");

  const content = [
    `CASE MEMORY: ${caseId}`,
    decisionText ? `Decisions:\n${decisionText}` : "",
    noteText ? `Analyst Notes:\n${noteText}` : "",
  ].filter(Boolean).join("\n\n");

  if (content.length < 50) return;

  await ingestToVectorStore(content, {
    source: `Case Memory: ${caseId}`,
    sourceType: "case_memory",
    domain: "security",
    sensitivityLevel: "confidential",
    objectId: caseId,
    timestamp: new Date().toISOString(),
  });
}

export async function ingestIncidentReport(incident: {
  id: string | number;
  title: string;
  description?: string | null;
  severity: string;
  status: string;
  attackTechnique?: string | null;
  notes?: string | null;
  detectedAt: string;
}): Promise<void> {
  const content = [
    `INCIDENT REPORT: ${incident.title}`,
    `ID: ${incident.id} | Severity: ${incident.severity} | Status: ${incident.status}`,
    `Detected: ${incident.detectedAt}`,
    incident.attackTechnique ? `Attack Technique: ${incident.attackTechnique}` : "",
    incident.description ?? "",
    incident.notes ? `Notes: ${incident.notes}` : "",
  ].filter(Boolean).join("\n");

  await ingestToVectorStore(content, {
    source: `Incident #${incident.id}: ${incident.title}`,
    sourceType: "incident",
    domain: "security",
    sensitivityLevel: incident.severity === "critical" ? "restricted" : "confidential",
    objectId: String(incident.id),
    timestamp: incident.detectedAt,
    severity: incident.severity,
    status: incident.status,
  });
}

export async function ingestAgentKnowledge(entry: {
  entryId: string;
  type: string;
  domain: string;
  sourceAgent: string;
  title: string;
  summary: string;
  confidence: number;
  tags: string[];
  timestamp: number;
}): Promise<void> {
  const content = [
    `AGENT KNOWLEDGE [${entry.sourceAgent.toUpperCase()}]: ${entry.title}`,
    `Type: ${entry.type} | Domain: ${entry.domain}`,
    `Confidence: ${Math.round(entry.confidence * 100)}%`,
    `Tags: ${entry.tags.join(", ")}`,
    entry.summary,
  ].filter(Boolean).join("\n");

  await ingestToVectorStore(content, {
    source: `${entry.sourceAgent} Knowledge: ${entry.title}`,
    sourceType: "agent_knowledge",
    domain: entry.domain,
    sensitivityLevel: "internal",
    objectId: entry.entryId,
    timestamp: new Date(entry.timestamp).toISOString(),
    sourceAgent: entry.sourceAgent,
    confidence: entry.confidence,
    tags: entry.tags,
  });
}

export async function ingestDocument(doc: {
  id: string;
  title: string;
  content: string;
  domain: string;
  sensitivityLevel?: SensitivityLevel;
  source?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ chunksCreated: number }> {
  const prefix = `DOCUMENT: ${doc.title}`;
  const chunks = await ingestToVectorStore(doc.content, {
    source: doc.source ?? `Document: ${doc.title}`,
    sourceType: "document",
    domain: doc.domain,
    sensitivityLevel: doc.sensitivityLevel ?? "internal",
    objectId: doc.id,
    timestamp: doc.timestamp ?? new Date().toISOString(),
    title: doc.title,
    ...doc.metadata,
  }, prefix);
  return { chunksCreated: chunks.length };
}

export async function runFullReindex(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  try {
    const { pool } = await import("@szl-holdings/db");

    const decisionsResult = await pool.query(
      `SELECT decision_id, recommended_action, rationale_summary, confidence, risk_level, raw_input, raw_output, created_at
       FROM alloy_ai_decisions
       ORDER BY created_at DESC
       LIMIT 500`
    );

    for (const row of decisionsResult.rows as Array<Record<string, unknown>>) {
      try {
        await ingestAiDecision({
          decisionId: row.decision_id as string,
          recommendedAction: row.recommended_action as string,
          rationaleSummary: row.rationale_summary as string,
          confidence: Number(row.confidence),
          riskLevel: row.risk_level as string,
          rawInput: row.raw_input as string | null,
          rawOutput: row.raw_output as string | null,
          createdAt: row.created_at as string,
        });
        processed++;
      } catch {
        errors++;
      }
    }
  } catch (err) {
    console.warn("[rag-reindex] Failed to reindex AI decisions:", err);
  }

  try {
    const { db, alloyCaseMemory } = await import("@szl-holdings/db");
    const cases = await db.select().from(alloyCaseMemory).limit(200);
    for (const c of cases) {
      try {
        await ingestCaseMemory(c.caseId, c.snapshot as Record<string, unknown>);
        processed++;
      } catch {
        errors++;
      }
    }
  } catch (err) {
    console.warn("[rag-reindex] Failed to reindex case memory:", err);
  }

  try {
    const { db, agentKnowledgeTable } = await import("@szl-holdings/db");
    const { desc } = await import("drizzle-orm");
    const knowledge = await db.select().from(agentKnowledgeTable).orderBy(desc(agentKnowledgeTable.createdAt)).limit(500);
    for (const entry of knowledge) {
      try {
        await ingestAgentKnowledge({
          entryId: entry.entryId,
          type: entry.type,
          domain: entry.domain,
          sourceAgent: entry.sourceAgent,
          title: entry.title,
          summary: entry.summary,
          confidence: entry.confidence,
          tags: entry.tags,
          timestamp: entry.timestamp,
        });
        processed++;
      } catch {
        errors++;
      }
    }
  } catch (err) {
    console.warn("[rag-reindex] Failed to reindex agent knowledge:", err);
  }

  try {
    const { db, firestormIncidentsTable } = await import("@szl-holdings/db");
    const { desc } = await import("drizzle-orm");
    const incidents = await db.select().from(firestormIncidentsTable).orderBy(desc(firestormIncidentsTable.createdAt)).limit(500);
    for (const inc of incidents) {
      try {
        await ingestIncidentReport({
          id: String(inc.id),
          title: inc.title,
          description: inc.description ?? null,
          severity: inc.severity,
          status: inc.status,
          attackTechnique: inc.attackTechnique ?? null,
          notes: inc.notes ?? null,
          detectedAt: inc.detectedAt?.toISOString() ?? new Date().toISOString(),
        });
        processed++;
      } catch {
        errors++;
      }
    }
  } catch (err) {
    console.warn("[rag-reindex] Failed to reindex incident reports:", err);
  }

  try {
    const { db, documentsTable } = await import("@szl-holdings/db");
    const { desc } = await import("drizzle-orm");
    const docs = await db.select().from(documentsTable).orderBy(desc(documentsTable.createdAt)).limit(300);
    for (const doc of docs) {
      try {
        const contentText = typeof doc.contentJson === "string"
          ? doc.contentJson
          : JSON.stringify(doc.contentJson);
        if (contentText.length < 20) continue;
        await ingestDocument({
          id: `doc-${doc.id}`,
          title: doc.title,
          content: contentText,
          domain: doc.appSource ?? "general",
          sensitivityLevel: "internal",
          source: `Document: ${doc.title}`,
          timestamp: doc.createdAt?.toISOString(),
        });
        processed++;
      } catch {
        errors++;
      }
    }
  } catch (err) {
    console.warn("[rag-reindex] Failed to reindex documents:", err);
  }

  console.log(`[rag-reindex] Reindex complete: ${processed} processed, ${errors} errors`);
  return { processed, errors };
}
