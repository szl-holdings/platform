/**
 * FORGE → Sovereign Substrate publisher
 *
 * Bridge that lets the FORGE training pipeline register a completed model /
 * dataset / eval snapshot into the Sovereign Substrate catalog (HuggingFace
 * Buckets + Proof Packet) without depending on the api-server route handler.
 *
 * Behaviour:
 *   - If the artifact's MirrorEval gate passes (>= 0.7), it is published to
 *     forge-public (visibility: public, trust tier: verified).
 *   - Otherwise the artifact is routed to forge-models / forge-datasets at
 *     the experimental trust tier so the run is still auditable.
 *   - The HTTP call is bearer-authenticated with SOVEREIGN_PUBLISH_TOKEN.
 *     If the token is unset, this is a no-op and the caller is notified
 *     via the returned status — fail open at the pipeline layer, fail
 *     closed at the API layer.
 */

export type SovereignArtifactKind = 'model' | 'dataset' | 'eval-snapshot' | 'agent-skill';

export interface SovereignPublishInput {
  name: string;
  kind: SovereignArtifactKind;
  task?: string;
  license?: string;
  /** Raw artifact bytes (the trained model file, dataset archive, etc.). */
  artifactBytes: Uint8Array;
  /** Path within the chosen HF bucket (e.g. "ner-distill-2026-05/model.safetensors"). */
  path: string;
  performance: {
    mirrorEvalScore?: number;
    biasScore?: number;
    safetyScore?: number;
    metrics?: Record<string, number>;
  };
  provenance?: Record<string, unknown>;
  approvedSigners?: Array<{ signerId: string; role?: string; approvedAt?: string }>;
  revocationUrl?: string;
}

export interface SovereignPublishResult {
  status: 'published' | 'skipped' | 'failed';
  bucket: 'forge-models' | 'forge-datasets' | 'forge-public';
  trustTier: 'verified' | 'community' | 'experimental';
  reason?: string;
  artifactId?: string;
  packetHash?: string;
}

const PUBLIC_GATE_MIRROR_EVAL = 0.7;
const PUBLIC_GATE_BIAS = 0.8;

function chooseBucketAndTier(
  kind: SovereignArtifactKind,
  perf: SovereignPublishInput['performance'],
  approvedSigners: ReadonlyArray<{ signerId: string }>,
): {
  bucket: SovereignPublishResult['bucket'];
  trustTier: SovereignPublishResult['trustTier'];
} {
  const passesPublicGate =
    (perf.mirrorEvalScore ?? 0) >= PUBLIC_GATE_MIRROR_EVAL &&
    (perf.biasScore ?? 0) >= PUBLIC_GATE_BIAS &&
    approvedSigners.length > 0;

  if (passesPublicGate) {
    return { bucket: 'forge-public', trustTier: 'verified' };
  }
  return {
    bucket: kind === 'dataset' ? 'forge-datasets' : 'forge-models',
    trustTier: (perf.mirrorEvalScore ?? 0) >= 0.5 ? 'community' : 'experimental',
  };
}

export async function publishToSovereign(
  input: SovereignPublishInput,
  options: { apiBase?: string; token?: string } = {},
): Promise<SovereignPublishResult> {
  const token = options.token ?? process.env.SOVEREIGN_PUBLISH_TOKEN;
  const apiBase = options.apiBase ?? process.env.SOVEREIGN_API_BASE ?? 'http://localhost:5000';
  const nowIso = new Date().toISOString();
  const approvedSigners = (input.approvedSigners ?? []).map((s) => ({
    signerId: s.signerId,
    ...(s.role ? { role: s.role } : {}),
    approvedAt: s.approvedAt ?? nowIso,
  }));
  const { bucket, trustTier } = chooseBucketAndTier(input.kind, input.performance, approvedSigners);

  if (!token) {
    return {
      status: 'skipped',
      bucket,
      trustTier,
      reason: 'SOVEREIGN_PUBLISH_TOKEN unset — FORGE pipeline cannot publish',
    };
  }

  const payload = {
    bucket,
    path: input.path,
    artifactBase64: Buffer.from(input.artifactBytes).toString('base64'),
    contentType: 'application/octet-stream',
    body: {
      artifact: {
        name: input.name,
        kind: input.kind,
        ...(input.task ? { task: input.task } : {}),
        ...(input.license ? { license: input.license } : {}),
      },
      provenance: input.provenance ?? {},
      performance: {
        ...(input.performance.mirrorEvalScore !== undefined
          ? { mirrorEvalScore: input.performance.mirrorEvalScore }
          : {}),
        ...(input.performance.biasScore !== undefined
          ? { biasScore: input.performance.biasScore }
          : {}),
        ...(input.performance.safetyScore !== undefined
          ? { safetyScore: input.performance.safetyScore }
          : {}),
        evalDatasetRefs: [],
        metrics: input.performance.metrics ?? {},
      },
      policy: {
        covenantPolicies: bucket === 'forge-public' ? ['forge-public'] : [],
        signers: approvedSigners,
        approvalChain: [],
      },
      lifecycle: {
        trustTier,
        ...(input.revocationUrl ? { revocationUrl: input.revocationUrl } : {}),
      },
    },
  };

  try {
    const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/sovereign/publish`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text();
      return {
        status: 'failed',
        bucket,
        trustTier,
        reason: `publish failed (${res.status}): ${err.slice(0, 256)}`,
      };
    }
    const json = (await res.json()) as { artifact?: { id: string; packetHash: string } };
    return {
      status: 'published',
      bucket,
      trustTier,
      artifactId: json.artifact?.id,
      packetHash: json.artifact?.packetHash,
    };
  } catch (err) {
    return {
      status: 'failed',
      bucket,
      trustTier,
      reason: (err as Error).message,
    };
  }
}
