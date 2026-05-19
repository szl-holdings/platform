/**
 * Sovereign Substrate API — /api/sovereign
 *
 *   GET  /api/sovereign/artifacts            — list published artifacts (catalog feed)
 *   GET  /api/sovereign/artifacts/:id        — packet detail
 *   POST /api/sovereign/artifacts/:id/verify — re-verify packet against bucket bytes
 *   GET  /api/sovereign/public-key           — published Ed25519 public key
 *   POST /api/sovereign/publish              — register a new artifact + packet (internal)
 *
 * Every read/write is mirrored to the Proof Chain so any bucket op is
 * tamper-evident.
 */

import {
  db,
  sovereignArtifactsTable,
  type SovereignArtifact,
  SOVEREIGN_BUCKETS,
  SOVEREIGN_TRUST_TIERS,
  SOVEREIGN_ARTIFACT_KINDS,
} from '@szl-holdings/db';
import {
  HuggingFaceBucketAdapter,
  loadSigningIdentity,
  signPacket,
  verifyPacket,
  type HfBucketAdapter,
  ProofPacketBodySchema,
  type SovereignBucket,
} from '@workspace/sovereign-substrate';
import { tagAIContent } from '@szl-holdings/proof-chain';
import { and, desc, eq, gte } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';

const router: IRouter = Router();

const HF_ORG = process.env.SOVEREIGN_HF_ORG ?? 'betterwithage';
const BUCKETS: Record<SovereignBucket, string> = {
  'forge-models': process.env.HF_BUCKET_MODELS ?? 'forge-models',
  'forge-datasets': process.env.HF_BUCKET_DATASETS ?? 'forge-datasets',
  'forge-public': process.env.HF_BUCKET_PUBLIC ?? 'forge-public',
};

/**
 * Strict adapter: requires HF_TOKEN. Used by publish + bytes streaming so we
 * never claim an artifact is durably stored when it is only in memory.
 */
function getAdapter(): HfBucketAdapter {
  const token = process.env.HF_TOKEN;
  if (!token) {
    throw new Error(
      'HF_TOKEN is not configured — Sovereign Substrate cannot persist or stream artifacts. ' +
        'Set HF_TOKEN to a HuggingFace API token with write access to the configured buckets.',
    );
  }
  return new HuggingFaceBucketAdapter({ org: HF_ORG, buckets: BUCKETS, token });
}

/**
 * Read-only adapter. When HF_TOKEN is set, use the authenticated HF adapter
 * (needed for private buckets). When unset, fall back to an anonymous HF
 * adapter so public-bucket reads (catalog detail, /bytes, /verify against
 * `forge-public`) keep working in tokenless deployments. The In-Memory
 * adapter is only used as a last-resort dev shim when HF is unreachable.
 */
function getReadOnlyAdapter(): HfBucketAdapter {
  const token = process.env.HF_TOKEN;
  const config = { org: HF_ORG, buckets: BUCKETS, token: token ?? '' };
  // Anonymous HF reads work for public datasets/buckets — pass no token.
  return new HuggingFaceBucketAdapter(config);
}

/**
 * Startup health check: verifies HF prerequisites (token + @huggingface/hub
 * resolvable). Fails fast so operators see misconfiguration at boot instead
 * of on first publish. Returns a structured result; callers can choose to
 * throw or log.
 */
export async function checkSovereignHealth(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (!process.env.HF_TOKEN) {
    return { ok: false, reason: 'HF_TOKEN not set' };
  }
  try {
    await import('@huggingface/hub');
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: `@huggingface/hub not installed: ${(err as Error).message}`,
    };
  }
}

function publicKey(): { keyId: string; publicKeyHex: string; algorithm: 'ed25519' } | null {
  const id = loadSigningIdentity();
  if (!id) return null;
  return { keyId: id.publicKeyId, publicKeyHex: id.publicKeyHex, algorithm: 'ed25519' };
}

/**
 * Build the trusted-key set for verification. The platform's published key
 * is the single root of trust — verification never accepts a packet signed
 * by a key the platform has not published.
 */
function trustedKeys(): Array<{ publicKeyId: string; publicKeyHex: string }> {
  const k = publicKey();
  if (!k) return [];
  return [{ publicKeyId: k.keyId, publicKeyHex: k.publicKeyHex }];
}

/**
 * Authorize an internal publish call. Requires a service token that matches
 * SOVEREIGN_PUBLISH_TOKEN. Fails closed if the token is unset, so the
 * endpoint is never publicly callable.
 */
function authorizePublish(req: Request): { ok: true } | { ok: false; reason: string } {
  const expected = process.env.SOVEREIGN_PUBLISH_TOKEN;
  if (!expected || expected.length < 16) {
    return { ok: false, reason: 'SOVEREIGN_PUBLISH_TOKEN unset — publish disabled' };
  }
  const auth = req.header('authorization') ?? '';
  const presented = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
  // constant-time compare
  if (presented.length !== expected.length) return { ok: false, reason: 'unauthorized' };
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ presented.charCodeAt(i);
  }
  return mismatch === 0 ? { ok: true } : { ok: false, reason: 'unauthorized' };
}

// ─── GET /api/sovereign/public-key ──────────────────────────────────────────
router.get('/public-key', (_req: Request, res: Response) => {
  const key = publicKey();
  if (!key) {
    res.status(503).json({
      error: 'signing-disabled',
      message:
        'No SOVEREIGN_SIGNING_KEY_* configured. Configure platform secrets to enable Proof Packet signing.',
    });
    return;
  }
  res.json(key);
});

// ─── GET /api/sovereign/artifacts ───────────────────────────────────────────
// Public endpoint — ONLY returns records that are publicly visible
// (visibility = 'public' AND bucket = 'forge-public'). Private artifacts must
// be retrieved via authenticated internal APIs (not exposed here).
router.get('/artifacts', async (req: Request, res: Response) => {
  const q = z
    .object({
      kind: z.enum(SOVEREIGN_ARTIFACT_KINDS).optional(),
      trustTier: z.enum(SOVEREIGN_TRUST_TIERS).optional(),
      task: z.string().optional(),
      minMirrorEval: z.coerce.number().min(0).max(1).optional(),
      minBias: z.coerce.number().min(0).max(1).optional(),
      limit: z.coerce.number().int().positive().max(200).default(50),
    })
    .safeParse(req.query);
  if (!q.success) {
    res.status(400).json({ error: 'invalid-query', issues: q.error.issues });
    return;
  }
  const f = q.data;
  const conditions = [
    eq(sovereignArtifactsTable.visibility, 'public'),
    eq(sovereignArtifactsTable.bucket, 'forge-public'),
  ];
  if (f.kind) conditions.push(eq(sovereignArtifactsTable.kind, f.kind));
  if (f.trustTier) conditions.push(eq(sovereignArtifactsTable.trustTier, f.trustTier));
  if (f.task) conditions.push(eq(sovereignArtifactsTable.task, f.task));
  if (f.minMirrorEval !== undefined) {
    conditions.push(gte(sovereignArtifactsTable.mirrorEvalScore, f.minMirrorEval.toString()));
  }
  if (f.minBias !== undefined) {
    conditions.push(gte(sovereignArtifactsTable.biasScore, f.minBias.toString()));
  }

  try {
    const rows = await db
      .select()
      .from(sovereignArtifactsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(sovereignArtifactsTable.publishedAt))
      .limit(f.limit);
    res.json({ artifacts: rows.map(serialize) });
  } catch (err) {
    res.status(500).json({ error: 'list-failed', message: (err as Error).message });
  }
});

// ─── GET /api/sovereign/artifacts/:id ───────────────────────────────────────
router.get('/artifacts/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: 'missing-id' });
    return;
  }
  try {
    const [row] = await db
      .select()
      .from(sovereignArtifactsTable)
      .where(
        and(
          eq(sovereignArtifactsTable.id, id),
          eq(sovereignArtifactsTable.visibility, 'public'),
          eq(sovereignArtifactsTable.bucket, 'forge-public'),
        ),
      )
      .limit(1);
    if (!row) {
      res.status(404).json({ error: 'not-found' });
      return;
    }
    let packet = null;
    let packetError: string | null = null;
    try {
      const adapter = getReadOnlyAdapter();
      packet = await adapter.downloadPacket(row.packetUri);
      void recordProof('sovereign.packet.fetch', row.bucketUri, row.contentHash, {
        packetUri: row.packetUri,
        packetHash: row.packetHash,
      });
    } catch (err) {
      packetError = (err as Error).message;
      console.error('[sovereign] packet download failed', {
        id: row.id,
        packetUri: row.packetUri,
        error: packetError,
      });
      void recordProof('sovereign.packet.fetch.failed', row.bucketUri, row.contentHash, {
        packetUri: row.packetUri,
        error: packetError,
      });
    }
    res.json({ artifact: serialize(row), packet, packetError });
  } catch (err) {
    res.status(500).json({ error: 'fetch-failed', message: (err as Error).message });
  }
});

// ─── POST /api/sovereign/artifacts/:id/verify ───────────────────────────────
router.post('/artifacts/:id/verify', async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: 'missing-id' });
    return;
  }
  // Verify is a privileged operation: it triggers HF_TOKEN-backed reads and
  // writes verificationState. Public callers must be confined to public-bucket
  // artifacts; private-artifact verification requires the publish bearer.
  const authz = authorizePublish(req);
  const isInternal = authz.ok;
  try {
    const baseConditions = [eq(sovereignArtifactsTable.id, id)];
    if (!isInternal) {
      baseConditions.push(
        eq(sovereignArtifactsTable.visibility, 'public'),
        eq(sovereignArtifactsTable.bucket, 'forge-public'),
      );
    }
    const [row] = await db
      .select()
      .from(sovereignArtifactsTable)
      .where(and(...baseConditions))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: 'not-found' });
      return;
    }
    // Public artifacts can be verified without an HF_TOKEN — use the
    // anonymous read adapter. Private artifacts still require the
    // authenticated adapter (and the publish bearer above).
    const adapter = row.visibility === 'public' && row.bucket === 'forge-public'
      ? getReadOnlyAdapter()
      : getAdapter();
    const [artifactBytes, packet] = await Promise.all([
      adapter.downloadArtifact(row.bucketUri),
      adapter.downloadPacket(row.packetUri),
    ]);
    void recordProof('sovereign.bucket.download.artifact', row.bucketUri, row.contentHash, {
      via: 'verify',
    });
    void recordProof('sovereign.bucket.download.packet', row.packetUri, row.packetHash, {
      via: 'verify',
    });
    const result = verifyPacket(packet, artifactBytes, { trustedKeys: trustedKeys() });
    const verificationState = result.ok ? 'verified' : 'failed';
    await db
      .update(sovereignArtifactsTable)
      .set({ verificationState, lastVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(sovereignArtifactsTable.id, id));

    void recordProof('sovereign.verify', row.bucketUri, row.contentHash, {
      result: verificationState,
      reason: result.reason,
    });

    res.json({ ok: result.ok, reason: result.reason, verificationState });
  } catch (err) {
    res.status(500).json({ error: 'verify-failed', message: (err as Error).message });
  }
});

// ─── GET /api/sovereign/artifacts/:id/bytes ─────────────────────────────────
// Streams the raw artifact bytes so a browser (or any third party) can
// re-verify the signature client-side. Public — same trust boundary as the
// HF bucket itself; we log the access via Proof Chain.
router.get('/artifacts/:id/bytes', async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: 'missing-id' });
    return;
  }
  try {
    const [row] = await db
      .select()
      .from(sovereignArtifactsTable)
      .where(eq(sovereignArtifactsTable.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: 'not-found' });
      return;
    }
    if (row.visibility !== 'public' || row.bucket !== 'forge-public') {
      res.status(403).json({ error: 'not-public', message: 'artifact is not in the public bucket' });
      return;
    }
    // Public bucket reads do not require a platform HF_TOKEN — the bucket
    // itself is publicly readable. Fall back to the read-only adapter so
    // verification remains available even when the server has no write
    // credentials configured.
    const adapter = process.env.HF_TOKEN ? getAdapter() : getReadOnlyAdapter();
    const bytes = await adapter.downloadArtifact(row.bucketUri);
    void recordProof('sovereign.download', row.bucketUri, row.contentHash, {
      via: 'api',
    });
    res.setHeader('content-type', 'application/octet-stream');
    res.setHeader('content-length', String(bytes.length));
    res.setHeader('x-sovereign-content-hash', row.contentHash);
    res.setHeader('x-sovereign-packet-hash', row.packetHash);
    res.end(Buffer.from(bytes));
  } catch (err) {
    res.status(500).json({ error: 'bytes-failed', message: (err as Error).message });
  }
});

// ─── POST /api/sovereign/publish ────────────────────────────────────────────
const PublishSchema = z.object({
  bucket: z.enum(SOVEREIGN_BUCKETS),
  path: z.string().min(1),
  artifactBase64: z.string().min(1),
  contentType: z.string().default('application/octet-stream'),
  body: z.object({
    artifact: z.object({
      name: z.string(),
      kind: z.enum(SOVEREIGN_ARTIFACT_KINDS),
      task: z.string().optional(),
      license: z.string().optional(),
    }),
    provenance: z.record(z.string(), z.unknown()).default({}),
    performance: z
      .object({
        mirrorEvalScore: z.number().min(0).max(1).optional(),
        biasScore: z.number().min(0).max(1).optional(),
        safetyScore: z.number().min(0).max(1).optional(),
        evalDatasetRefs: z.array(z.string()).default([]),
        metrics: z.record(z.string(), z.number()).default({}),
      })
      .default({ evalDatasetRefs: [], metrics: {} }),
    policy: z
      .object({
        covenantPolicies: z.array(z.string()).default([]),
        signers: z
          .array(
            z.object({
              signerId: z.string().min(1),
              role: z.string().optional(),
              approvedAt: z.string().min(1),
            }),
          )
          .default([]),
        approvalChain: z.array(z.string()).default([]),
      })
      .default({ covenantPolicies: [], signers: [], approvalChain: [] }),
    lifecycle: z.object({
      trustTier: z.enum(SOVEREIGN_TRUST_TIERS),
      expiresAt: z.string().optional(),
      revocationUrl: z.string().url().optional(),
    }),
  }),
});

router.post('/publish', async (req: Request, res: Response) => {
  const authz = authorizePublish(req);
  if (!authz.ok) {
    res.status(401).json({ error: 'unauthorized', message: authz.reason });
    return;
  }
  const parsed = PublishSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid-payload', issues: parsed.error.issues });
    return;
  }
  const identity = loadSigningIdentity();
  if (!identity) {
    res.status(503).json({
      error: 'signing-disabled',
      message: 'SOVEREIGN_SIGNING_KEY_* not configured.',
    });
    return;
  }
  const input = parsed.data;

  // Covenant gate: forge-public requires verified-tier eval score + signer
  if (input.bucket === 'forge-public') {
    const ev = input.body.performance;
    if ((ev.mirrorEvalScore ?? 0) < 0.7) {
      res.status(403).json({
        error: 'policy-blocked',
        policy: 'sovereign.public-eval-floor',
        message: 'forge-public requires a MirrorEval score >= 0.7',
      });
      return;
    }
    if (!input.body.policy.signers.length) {
      res.status(403).json({
        error: 'policy-blocked',
        policy: 'sovereign.public-requires-signer',
        message: 'forge-public requires at least one approved signer in policy.signers',
      });
      return;
    }
  }

  try {
    const adapter = getAdapter();
    const artifactBytes = Buffer.from(input.artifactBase64, 'base64');
    const uploaded = await adapter.uploadArtifact({
      bucket: input.bucket,
      path: input.path,
      bytes: artifactBytes,
      contentType: input.contentType,
    });
    // Per-op proof chain: each concrete HF bucket write is audited
    // separately so the chain reflects the actual sequence of bucket
    // operations, not just the publish event.
    void recordProof('sovereign.bucket.upload.artifact', uploaded.bucketUri, uploaded.contentHash, {
      bytes: artifactBytes.length,
      bucket: input.bucket,
    });

    const publishedAt = new Date();
    const rawPacketBody = {
      version: '1.0.0' as const,
      artifact: {
        ...input.body.artifact,
        bucketUri: uploaded.bucketUri,
        contentHash: uploaded.contentHash,
        sizeBytes: artifactBytes.length,
      },
      provenance: input.body.provenance,
      performance: input.body.performance,
      policy: input.body.policy,
      lifecycle: {
        trustTier: input.body.lifecycle.trustTier,
        ...(input.body.lifecycle.expiresAt ? { expiresAt: input.body.lifecycle.expiresAt } : {}),
        ...(input.body.lifecycle.revocationUrl
          ? { revocationUrl: input.body.lifecycle.revocationUrl }
          : {}),
        publishedAt: publishedAt.toISOString(),
      },
      metadata: {},
    };

    // Validate against the canonical packet schema BEFORE signing so a packet
    // that won't pass verifyPacket can never leave the server.
    const packetBodyParsed = ProofPacketBodySchema.safeParse(rawPacketBody);
    if (!packetBodyParsed.success) {
      res.status(400).json({
        error: 'invalid-packet-body',
        issues: packetBodyParsed.error.issues,
      });
      return;
    }
    const packetBody = packetBodyParsed.data;

    const packet = signPacket(packetBody, identity);
    const packetUpload = await adapter.uploadPacket({
      bucket: input.bucket,
      artifactPath: input.path,
      packet,
    });
    void recordProof('sovereign.bucket.upload.packet', packetUpload.packetUri, packetUpload.packetHash, {
      bucket: input.bucket,
    });
    if (packetUpload.signatureUri) {
      void recordProof(
        'sovereign.bucket.upload.signature',
        packetUpload.signatureUri,
        packet.signature.signature,
        { bucket: input.bucket },
      );
    }
    // Use the hash returned by uploadPacket (hash of the serialized JSON
    // bytes that actually live in HF) as the canonical packetHash. This is
    // what any third party will compute when they re-download the packet,
    // and what /verify recomputes from the same bytes. computePacketHash
    // (hash over canonical body) is still kept in the substrate library for
    // off-chain attestation use cases, but it is NOT the stored hash.
    const packetHash = packetUpload.packetHash;

    const [row] = await db
      .insert(sovereignArtifactsTable)
      .values({
        name: input.body.artifact.name,
        kind: input.body.artifact.kind,
        task: input.body.artifact.task ?? null,
        bucket: input.bucket,
        bucketUri: uploaded.bucketUri,
        packetUri: packetUpload.packetUri,
        contentHash: uploaded.contentHash,
        packetHash,
        trustTier: input.body.lifecycle.trustTier,
        visibility: input.bucket === 'forge-public' ? 'public' : 'private',
        biasScore: input.body.performance.biasScore?.toString() ?? null,
        mirrorEvalScore: input.body.performance.mirrorEvalScore?.toString() ?? null,
        evalSummary: input.body.performance.metrics,
        signerId: identity.publicKeyId,
        publicKeyId: identity.publicKeyId,
        revocationUrl: input.body.lifecycle.revocationUrl ?? null,
        verificationState: 'verified',
        lastVerifiedAt: publishedAt,
        publishedAt,
        license: input.body.artifact.license ?? null,
        metadata: {},
      })
      .returning();

    void recordProof('sovereign.publish', uploaded.bucketUri, uploaded.contentHash, {
      packetHash,
      trustTier: input.body.lifecycle.trustTier,
    });

    // CDN pre-warm: after a successful public-bucket publish, issue HEAD
    // requests to the configured edges so the artifact is hot when the
    // first verifier hits it. Toggled via SOVEREIGN_CDN_PREWARM_REGIONS
    // (comma-separated). Failures are non-fatal and logged via Proof Chain.
    if (input.bucket === 'forge-public') {
      const regions = (process.env.SOVEREIGN_CDN_PREWARM_REGIONS ?? '')
        .split(',').map((s) => s.trim()).filter(Boolean);
      if (regions.length > 0) {
        const cdnUrl = `https://huggingface.co/datasets/${HF_ORG}/${BUCKETS[input.bucket]}/resolve/main/${input.path}`;
        for (const region of regions) {
          void fetch(cdnUrl, { method: 'HEAD', headers: { 'x-prewarm-region': region } })
            .then((r) =>
              recordProof('sovereign.cdn.prewarm', cdnUrl, uploaded.contentHash, {
                region, status: r.status,
              }),
            )
            .catch((err) =>
              recordProof('sovereign.cdn.prewarm.failed', cdnUrl, uploaded.contentHash, {
                region, error: (err as Error).message,
              }),
            );
        }
      }
    }

    // Augment the FORGE/HF Model Registry: if a row already exists in
    // hf_model_registry for this model (by display_name or model_id), wire
    // the sovereign storage columns so the registry UI's "Storage" column
    // shows the bucket location, packet hash, and verification state.
    if (row && input.body.artifact.kind === 'model') {
      try {
        const { hfModelRegistryTable } = await import('@szl-holdings/db');
        await db
          .update(hfModelRegistryTable)
          .set({
            sovereignArtifactId: row.id,
            sovereignBucketUri: row.bucketUri,
            sovereignPacketHash: row.packetHash,
            sovereignVerificationState: row.verificationState,
            sovereignLastVerifiedAt: row.lastVerifiedAt,
            updatedAt: new Date(),
          })
          .where(eq(hfModelRegistryTable.modelId, input.body.artifact.name));
      } catch (err) {
        console.error('[sovereign] hf_model_registry augmentation failed', {
          modelId: input.body.artifact.name,
          error: (err as Error).message,
        });
      }
    }

    res.status(201).json({ artifact: serialize(row!), packet });
  } catch (err) {
    res.status(500).json({ error: 'publish-failed', message: (err as Error).message });
  }
});

// ─── helpers ────────────────────────────────────────────────────────────────
function serialize(row: SovereignArtifact) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    task: row.task,
    bucket: row.bucket,
    bucketUri: row.bucketUri,
    packetUri: row.packetUri,
    contentHash: row.contentHash,
    packetHash: row.packetHash,
    trustTier: row.trustTier,
    visibility: row.visibility,
    biasScore: row.biasScore ? Number(row.biasScore) : null,
    mirrorEvalScore: row.mirrorEvalScore ? Number(row.mirrorEvalScore) : null,
    evalSummary: row.evalSummary,
    signerId: row.signerId,
    revocationUrl: row.revocationUrl,
    verificationState: row.verificationState,
    lastVerifiedAt: row.lastVerifiedAt?.toISOString() ?? null,
    publishedAt: row.publishedAt.toISOString(),
    license: row.license,
    isRevoked: row.isRevoked,
  };
}

async function recordProof(
  action: string,
  bucketUri: string,
  contentHash: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    await tagAIContent({
      contentId: `${action}:${contentHash}:${Date.now()}`,
      contentType: 'sovereign.bucket-op',
      sourceClass: 'system_computed',
      agentName: 'sovereign-substrate',
      metadata: { action, bucketUri, contentHash, ...metadata },
      enablePqcSigning: false,
    });
  } catch (err) {
    // Proof-chain logging is a tamper-evident audit requirement. We must not
    // mask the failure — surface it loudly so operators see it in the logs
    // and metrics. The request itself still completes (the bucket op already
    // happened), but a missing audit entry is a real problem.
    console.error('[sovereign] proof-chain write failed', {
      action,
      bucketUri,
      contentHash,
      error: (err as Error).message,
    });
  }
}

export default router;
