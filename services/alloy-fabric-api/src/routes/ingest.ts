import { randomUUID } from 'node:crypto';
import { IngestRequestSchema } from '@workspace/aef-contracts';
import type { PolicyContext } from '@workspace/aef-policy-guard';
import type { Request, Response, Router } from 'express';
import { defaultLedgerStore, policyEngine, storageBundle, tenantEnforcer } from '../context.js';
import { logger } from '../logger.js';
import { getRequestId } from '../middleware/request-id.js';
import { getTenantId } from '../middleware/tenant.js';

const EMBED_DIMS = 768;
const EMBED_MODEL = 'aef-embed-cpu-v1';

/**
 * Deterministic CPU embedding — unit-length vector for cosine ANN search.
 * In production this delegates to alloy-vector-worker via ExternalHttpBackend.
 */
function cpuEmbedVector(text: string, dims: number): number[] {
  const v = new Array<number>(dims).fill(0);
  for (let i = 0; i < text.length && i < dims; i++) {
    v[i % dims] = (v[i % dims]! + text.charCodeAt(i)) / 255;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

function splitIntoChunks(text: string, chunkSize: number, chunkOverlap: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const stride = Math.max(1, chunkSize - chunkOverlap);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += stride) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}

export function registerIngestRoute(router: Router): void {
  router.post('/v1/ingest', async (req: Request, res: Response) => {
    const parsed = IngestRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'validation_error', issues: parsed.error.issues });
      return;
    }

    const { requestId, documents, chunkSize, chunkOverlap } = parsed.data;
    const tenantId = getTenantId(res);
    const startMs = Date.now();
    const reqId = requestId || getRequestId(req);

    // Tenant boundary enforcement — hard stop; no auto-registration in request path
    const policyCtx: PolicyContext = { requestId: reqId, tenantId, hasProvenance: true };
    const tenantDecision = tenantEnforcer.enforce(policyCtx);
    if (tenantDecision !== null && !tenantDecision.allow) {
      res.status(403).json({
        error: 'tenant_not_registered',
        reasons: tenantDecision.reasons,
        appliedRuleIds: tenantDecision.appliedRuleIds,
      });
      return;
    }
    const policyDecision = policyEngine.evaluate(policyCtx);
    if (!policyDecision.allow) {
      res.status(403).json({ error: 'policy_denied', reasons: policyDecision.reasons });
      return;
    }

    const now = new Date().toISOString();

    interface DocResult {
      sourceId: string;
      chunksProduced: number;
      chunksIndexed: number;
      vectorsIndexed: number;
      status: 'indexed' | 'failed';
      error?: string;
    }
    const results: DocResult[] = [];

    for (const doc of documents as Array<{
      sourceId: string;
      content: string;
      contentType: string;
      metadata?: Record<string, unknown>;
      title?: string;
      sourceUri?: string;
      profileId?: string;
    }>) {
      try {
        // Step 1: persist raw document
        await storageBundle.rawDocs.upsert({
          sourceId: doc.sourceId,
          tenantId,
          contentType: doc.contentType,
          content: doc.content,
          ...(doc.profileId !== undefined ? { profileId: doc.profileId } : {}),
          ...(doc.title !== undefined ? { title: doc.title } : {}),
          ...(doc.sourceUri !== undefined ? { sourceUri: doc.sourceUri } : {}),
          metadata: doc.metadata ?? {},
          ingestedAt: now,
        });

        // Step 2: split into overlapping word-boundary chunks
        const chunks = splitIntoChunks(doc.content, chunkSize, chunkOverlap);
        let chunksIndexed = 0;
        let vectorsIndexed = 0;

        for (let i = 0; i < chunks.length; i++) {
          const text = chunks[i]!;
          const chunkId = `${doc.sourceId}:chunk:${i}:${randomUUID().slice(0, 8)}`;
          const tokenCount = Math.ceil(text.split(/\s+/).length * 1.3);

          const chunkMeta = {
            tenantId,
            sourceId: doc.sourceId,
            chunkIndex: i,
            ...(doc.title !== undefined ? { title: doc.title } : {}),
            ...(doc.sourceUri !== undefined ? { sourceUri: doc.sourceUri } : {}),
            ...doc.metadata,
          };

          // Step 3: persist chunk record
          await storageBundle.chunks.upsert({
            chunkId,
            sourceId: doc.sourceId,
            tenantId,
            chunkIndex: i,
            text,
            tokenCount,
            ...(doc.profileId !== undefined ? { profileId: doc.profileId } : {}),
            metadata: chunkMeta,
            createdAt: now,
          });
          chunksIndexed++;

          // Step 4: compute CPU embedding and persist vector record
          const vector = cpuEmbedVector(text, EMBED_DIMS);
          await storageBundle.vectors.upsert({
            chunkId,
            sourceId: doc.sourceId,
            tenantId,
            model: EMBED_MODEL,
            dimensions: EMBED_DIMS,
            vector,
            ...(doc.profileId !== undefined ? { profileId: doc.profileId } : {}),
            metadata: { ...chunkMeta, text: text.slice(0, 200) },
            indexedAt: now,
          });
          vectorsIndexed++;

          // Step 5: persist metadata index record for keyword/BM25 retrieval
          await storageBundle.metadataIndex.upsert({
            chunkId,
            sourceId: doc.sourceId,
            tenantId,
            ...(doc.profileId !== undefined ? { profileId: doc.profileId } : {}),
            ...(doc.title !== undefined ? { title: doc.title } : {}),
            metadata: { ...chunkMeta, text },
            updatedAt: now,
          });
        }

        // Ledger write — ingest operation is governed; one entry per document
        try {
          defaultLedgerStore.append({
            entryId: randomUUID(),
            requestId: reqId,
            tenantId,
            ...(doc.profileId !== undefined ? { profileId: doc.profileId } : {}),
            chunkId: `ingest:${doc.sourceId}`,
            sourceId: doc.sourceId,
            fusedScore: 0,
            boostApplied: false,
            finalScore: 0,
            policyAllow: policyDecision.allow,
            policyReasons: policyDecision.reasons,
            redactedFields: policyDecision.redactions,
            requestedAt: now,
            completedAt: new Date().toISOString(),
            backendId: `ingest:${EMBED_MODEL}`,
            stageTimings: { ingest: Date.now() - startMs },
            scoreBreakdown: { chunksIndexed, vectorsIndexed },
          });
        } catch (ledgerErr) {
          logger.error('ingest ledger write failed', {
            sourceId: doc.sourceId,
            reqId,
            err: String(ledgerErr),
          });
        }

        results.push({
          sourceId: doc.sourceId,
          chunksProduced: chunks.length,
          chunksIndexed,
          vectorsIndexed,
          status: 'indexed',
        });
      } catch (err) {
        logger.error('ingest failed', { sourceId: doc.sourceId, reqId, err: String(err) });
        results.push({
          sourceId: doc.sourceId,
          chunksProduced: 0,
          chunksIndexed: 0,
          vectorsIndexed: 0,
          status: 'failed',
          error: String(err),
        });
      }
    }

    res.status(202).json({
      requestId: reqId,
      tenantId,
      status: 'queued',
      results,
      totalChunksIndexed: results.reduce((s, r) => s + r.chunksIndexed, 0),
      totalVectorsIndexed: results.reduce((s, r) => s + r.vectorsIndexed, 0),
      embeddingModel: EMBED_MODEL,
      processingMs: Date.now() - startMs,
    });
  });
}
