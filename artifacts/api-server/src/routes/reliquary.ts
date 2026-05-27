// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { type IRouter, type Request, type Response, Router } from 'express';
import {
  attest,
  get,
  getByCovenant,
  getSovereignStatus,
  lineage,
  put,
  replay,
  setSovereign,
  snapshot,
  verifyAttestation,
} from '@workspace/a11oy-reliquary';
import { db, reliquaryCatalogTable, reliquarySnapshotsTable, reliquaryAttestationsTable } from '@szl-holdings/db';
import { desc, eq, ilike, or } from 'drizzle-orm';
import { authMiddleware } from '../middlewares/auth.js';

const router: IRouter = Router();

function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({ ok: true, data, meta: { timestamp: new Date().toISOString(), ...meta } });
}

function fail(res: Response, status: number, message: string, code?: string) {
  res.status(status).json({ ok: false, error: message, code });
}

// ─── READ-ONLY ENDPOINTS (public, no session required) ───────────────────────

/**
 * GET /reliquary/catalog
 * List all cached artifacts, ordered by newest first.
 * Supports ?q=<search> and ?type=<artifactType> filters.
 */
router.get('/reliquary/catalog', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;
    const type = req.query.type as string | undefined;

    let query = db
      .select()
      .from(reliquaryCatalogTable)
      .orderBy(desc(reliquaryCatalogTable.createdAt))
      .limit(200)
      .$dynamic();

    if (q) {
      query = query.where(
        or(
          ilike(reliquaryCatalogTable.label, `%${q}%`),
          ilike(reliquaryCatalogTable.contentHash, `%${q}%`),
        ),
      );
    } else if (type) {
      query = query.where(eq(reliquaryCatalogTable.artifactType, type));
    }

    const rows = await query;
    ok(res, rows);
  } catch (err) {
    fail(res, 500, String(err));
  }
});

/**
 * GET /reliquary/get/:contentHash
 * Retrieve artifact bytes by content hash. Returns base64-encoded content.
 * Blocked in Sovereign Mode if blob not on local disk.
 */
router.get('/reliquary/get/:contentHash', async (req: Request, res: Response) => {
  try {
    const { contentHash } = req.params;
    const result = await get(contentHash);
    const base64Content = result.content.toString('base64');
    ok(res, { ...result, content: base64Content });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e?.code === 'NOT_FOUND') return fail(res, 404, e.message ?? 'Not found', 'NOT_FOUND');
    if (e?.code === 'SOVEREIGN_BLOCK') return fail(res, 403, e.message ?? 'Blocked by Sovereign Mode', 'SOVEREIGN_BLOCK');
    if (e?.code === 'INTEGRITY_FAIL') return fail(res, 409, e.message ?? 'Integrity check failed', 'INTEGRITY_FAIL');
    fail(res, 500, String(err));
  }
});

/**
 * GET /reliquary/covenant/:covenantHash
 * Retrieve artifact by governance covenant hash.
 */
router.get('/reliquary/covenant/:covenantHash', async (req: Request, res: Response) => {
  try {
    const { covenantHash } = req.params;
    const result = await getByCovenant(covenantHash);
    ok(res, { ...result, content: result.content.toString('base64') });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e?.code === 'NOT_FOUND') return fail(res, 404, e.message ?? 'Not found', 'NOT_FOUND');
    if (e?.code === 'SOVEREIGN_BLOCK') return fail(res, 403, e.message ?? 'Blocked by Sovereign Mode', 'SOVEREIGN_BLOCK');
    fail(res, 500, String(err));
  }
});

/**
 * GET /reliquary/lineage/:contentHash
 * Depth-aware provenance DAG traversal. ?depth=N (default 3) controls recursion.
 */
router.get('/reliquary/lineage/:contentHash', async (req: Request, res: Response) => {
  try {
    const { contentHash } = req.params;
    const depth = Math.min(parseInt((req.query.depth as string) ?? '3', 10), 8);
    const result = await lineage(contentHash, depth);
    ok(res, result);
  } catch (err) {
    fail(res, 500, String(err));
  }
});

/**
 * GET /reliquary/snapshots
 * List all Pillpintu snapshots, newest first.
 */
router.get('/reliquary/snapshots', async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(reliquarySnapshotsTable)
      .orderBy(desc(reliquarySnapshotsTable.createdAt))
      .limit(100);
    ok(res, rows);
  } catch (err) {
    fail(res, 500, String(err));
  }
});

/**
 * GET /reliquary/replay/:snapshotHash
 * Rehydrate a snapshot: returns full governance context with per-artifact disk availability
 * and integrity check results.
 */
router.get('/reliquary/replay/:snapshotHash', async (req: Request, res: Response) => {
  try {
    const { snapshotHash } = req.params;
    const result = await replay(snapshotHash);
    ok(res, result);
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e?.code === 'NOT_FOUND') return fail(res, 404, e.message ?? 'Not found', 'NOT_FOUND');
    fail(res, 500, String(err));
  }
});

/**
 * GET /reliquary/attestations
 * List all Proof Ledger attestations.
 */
router.get('/reliquary/attestations', async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(reliquaryAttestationsTable)
      .orderBy(desc(reliquaryAttestationsTable.createdAt))
      .limit(50);
    ok(res, rows);
  } catch (err) {
    fail(res, 500, String(err));
  }
});

/**
 * GET /reliquary/sovereign
 * Return current Sovereign Mode status (active, activatedBy, reason, activatedAt).
 */
router.get('/reliquary/sovereign', async (_req: Request, res: Response) => {
  try {
    const status = await getSovereignStatus();
    ok(res, status);
  } catch (err) {
    fail(res, 500, String(err));
  }
});

// ─── MUTATING ENDPOINTS (require session auth; allow demo pass-through with required:false) ──

/**
 * POST /reliquary/put
 * Store an artifact. Content must be base64-encoded.
 * Covenant hash is computed over raw content bytes + governance context (binary concat).
 */
router.post('/reliquary/put', authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const {
      content,
      artifactType,
      label,
      description,
      policyId,
      actor,
      tenant,
      doctrineRevision,
      mimeType,
      parentHashes,
      metadata,
    } = req.body as {
      content: string;
      artifactType: string;
      label: string;
      description?: string;
      policyId: string;
      actor: string;
      tenant: string;
      doctrineRevision: string;
      mimeType?: string;
      parentHashes?: string[];
      metadata?: Record<string, unknown>;
    };

    if (!content || !artifactType || !label || !policyId || !actor || !tenant || !doctrineRevision) {
      return fail(res, 400, 'Missing required fields: content, artifactType, label, policyId, actor, tenant, doctrineRevision');
    }

    const buffer = Buffer.from(content, 'base64');
    const result = await put({
      content: buffer,
      artifactType: artifactType as 'model' | 'prompt' | 'agent' | 'dataset' | 'embedding' | 'report' | 'bundle',
      label,
      description,
      policyId,
      actor,
      tenant,
      doctrineRevision,
      mimeType,
      parentHashes,
      metadata,
    });

    ok(res, result);
  } catch (err) {
    fail(res, 500, String(err));
  }
});

/**
 * POST /reliquary/snapshot
 * Capture a deterministic Pillpintu snapshot of the current catalog.
 * Manifest is sorted by contentHash and includes Merkle root for integrity.
 */
router.post('/reliquary/snapshot', authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const { label } = req.body as { label?: string };
    const result = await snapshot(label ?? `Snapshot ${new Date().toISOString()}`);
    ok(res, result);
  } catch (err) {
    fail(res, 500, String(err));
  }
});

/**
 * POST /reliquary/attest
 * Compute and persist a Merkle-root attestation over all catalog hashes.
 * Also writes a proof_chain entry for durable governance audit trail.
 */
router.post('/reliquary/attest', authMiddleware({ required: false }), async (_req: Request, res: Response) => {
  try {
    const result = await attest();
    ok(res, result);
  } catch (err) {
    fail(res, 500, String(err));
  }
});

/**
 * POST /reliquary/attest/:id/verify
 * Recompute the Merkle root from stored hashes and compare to the stored root.
 */
router.post('/reliquary/attest/:id/verify', authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await verifyAttestation(id);
    ok(res, result);
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e?.code === 'NOT_FOUND') return fail(res, 404, e.message ?? 'Not found', 'NOT_FOUND');
    fail(res, 500, String(err));
  }
});

/**
 * POST /reliquary/sovereign
 * Activate or deactivate Sovereign Mode. Writes audit trail to Proof Ledger.
 */
router.post('/reliquary/sovereign', authMiddleware({ required: false }), async (req: Request, res: Response) => {
  try {
    const { active, actor, reason } = req.body as { active: boolean; actor?: string; reason?: string };
    if (typeof active !== 'boolean') return fail(res, 400, 'active (boolean) is required');
    const result = await setSovereign(active, actor ?? 'operator', reason ?? '');
    ok(res, result);
  } catch (err) {
    fail(res, 500, String(err));
  }
});

/**
 * POST /reliquary/seed
 * Populate Reliquary with realistic demo data: model → prompt → agent → dataset → embedding → report
 * lineage chain, then snapshot + attestation (Proof Ledger entry).
 * Idempotent: duplicate content hashes are silently skipped.
 */
router.post('/reliquary/seed', async (_req: Request, res: Response) => {
  try {
    const results: Record<string, unknown>[] = [];

    const modelContent = Buffer.from(JSON.stringify({
      name: 'gpt-4o-a11oy-finetune-v2',
      provider: 'openai',
      version: '2.1.0',
      parameters: { temperature: 0.2, maxTokens: 4096 },
      domains: ['governance', 'compliance', 'risk'],
      trainingDataRevision: 'doctrine-rev-007',
    }, null, 2), 'utf8');

    const model = await put({
      content: modelContent,
      artifactType: 'model',
      label: 'GPT-4o A11oy Fine-tune v2',
      description: 'Governance-tuned model revision with doctrine alignment',
      policyId: 'covenant:governance-v3',
      actor: 'mlops-pipeline',
      tenant: 'a11oy-core',
      doctrineRevision: 'doctrine-rev-007',
      mimeType: 'application/json',
      metadata: { version: '2.1.0', trainingRuns: 3 },
    });
    results.push({ type: 'model', ...model });

    const promptContent = Buffer.from(`You are a governed AI assistant operating under A11oy Doctrine Rev 007.
You must: (1) Cite all evidence sources, (2) Flag uncertainty above 30%, (3) Refuse requests outside covenant scope.
DOMAIN: {{domain}}
CONTEXT: {{context}}
QUERY: {{query}}`, 'utf8');

    const prompt = await put({
      content: promptContent,
      artifactType: 'prompt',
      label: 'Governed Reasoning Prompt v7',
      description: 'Standard prompt template for governed AI inference',
      policyId: 'covenant:governance-v3',
      actor: 'prompt-engineer',
      tenant: 'a11oy-core',
      doctrineRevision: 'doctrine-rev-007',
      mimeType: 'text/plain',
      metadata: { version: '7', domain: 'multi' },
    });
    results.push({ type: 'prompt', ...prompt });

    const agentContent = Buffer.from(JSON.stringify({
      id: 'compliance-sentinel-v3',
      role: 'Compliance Sentinel',
      capabilities: ['eu-ai-act-audit', 'nist-rmf-eval', 'proof-compilation'],
      modelRevision: model.contentHash,
      promptRevision: prompt.contentHash,
      policyConstraints: ['covenant:governance-v3', 'covenant:export-safe'],
      maxAutonomy: 'level-2',
    }, null, 2), 'utf8');

    const agent = await put({
      content: agentContent,
      artifactType: 'agent',
      label: 'Compliance Sentinel v3',
      description: 'Automated compliance audit agent with EU AI Act alignment',
      policyId: 'covenant:governance-v3',
      actor: 'agent-forge',
      tenant: 'a11oy-core',
      doctrineRevision: 'doctrine-rev-007',
      mimeType: 'application/json',
      parentHashes: [model.contentHash, prompt.contentHash],
      metadata: { agentClass: 'sentinel', autonomyLevel: 2 },
    });
    results.push({ type: 'agent', ...agent });

    const datasetContent = Buffer.from(JSON.stringify({
      name: 'EU AI Act Article 12 Audit Dataset',
      version: '2024-Q4',
      records: 14820,
      schema: ['incident_id', 'description', 'severity', 'eu_act_article', 'remediation'],
      sources: ['ENISA reports', 'Member state disclosures', 'Industry submissions'],
    }, null, 2), 'utf8');

    const dataset = await put({
      content: datasetContent,
      artifactType: 'dataset',
      label: 'EU AI Act Article 12 Audit Dataset v2024-Q4',
      description: 'Curated compliance audit dataset for EU AI Act Article 12',
      policyId: 'covenant:data-governance-v2',
      actor: 'data-curator',
      tenant: 'a11oy-core',
      doctrineRevision: 'doctrine-rev-007',
      mimeType: 'application/json',
      metadata: { records: 14820, jurisdiction: 'EU', article: 12 },
    });
    results.push({ type: 'dataset', ...dataset });

    const embeddingContent = Buffer.from(JSON.stringify({
      sourceId: dataset.contentHash,
      model: 'text-embedding-3-large',
      dimension: 3072,
      chunkCount: 14820,
      indexType: 'hnsw',
      createdAt: new Date().toISOString(),
    }, null, 2), 'utf8');

    const embedding = await put({
      content: embeddingContent,
      artifactType: 'embedding',
      label: 'EU AI Act Dataset Embedding Index',
      description: 'Vector index for EU AI Act audit dataset retrieval',
      policyId: 'covenant:data-governance-v2',
      actor: 'embedding-pipeline',
      tenant: 'a11oy-core',
      doctrineRevision: 'doctrine-rev-007',
      mimeType: 'application/json',
      parentHashes: [dataset.contentHash],
      metadata: { dimension: 3072, chunkCount: 14820 },
    });
    results.push({ type: 'embedding', ...embedding });

    const reportContent = Buffer.from(`# Governance Briefing — EU AI Act Readiness
**Classification:** Controlled — Internal Operator Use Only
**Generated by:** ${agent.contentHash.slice(0, 12)} (Compliance Sentinel v3)
**Doctrine Revision:** Rev 007
**Evidence Hash:** ${dataset.contentHash.slice(0, 12)}

## Executive Summary
Based on 14,820 audit records across 7 EU member states, the platform demonstrates 94.2% compliance
readiness across Article 12 (Technical Documentation), Article 9 (Risk Management), and Article 15
(Accuracy, Robustness and Cybersecurity).

## Critical Findings
- 3 High-severity gaps in Article 9 automated risk escalation
- Embedding provenance chain verified: ${embedding.contentHash.slice(0, 12)}
- All AI outputs carry Covenant Hash, enabling post-hoc replay

## Recommendations
1. Close Article 9 gap within 60 days
2. Publish Proof Ledger summary to designated authority
3. Activate Sovereign Mode for next quarterly audit window
`, 'utf8');

    const report = await put({
      content: reportContent,
      artifactType: 'report',
      label: 'EU AI Act Readiness Briefing Q4-2024',
      description: 'Automated governance briefing generated by Compliance Sentinel v3',
      policyId: 'covenant:report-export-v1',
      actor: `${agent.contentHash.slice(0, 12)}`,
      tenant: 'a11oy-core',
      doctrineRevision: 'doctrine-rev-007',
      mimeType: 'text/markdown',
      parentHashes: [agent.contentHash, dataset.contentHash, embedding.contentHash],
      metadata: { complianceScore: 94.2, jurisdiction: 'EU', quarter: 'Q4-2024' },
    });
    results.push({ type: 'report', ...report });

    const snapshotResult = await snapshot('Demo Seed Snapshot — Full Governance Stack');
    results.push({ type: 'snapshot', ...snapshotResult });

    const attestResult = await attest();
    results.push({ type: 'attestation', ...attestResult });

    ok(res, { seeded: results.length, results });
  } catch (err) {
    fail(res, 500, String(err));
  }
});

export default router;
