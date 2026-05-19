/**
 * Proof Packet — canonical JSON envelope binding an AI artifact (by content
 * hash) to its provenance, performance, policy attestations, and lifecycle.
 *
 * Packets are signed with Ed25519. The signature covers the canonical
 * serialization of the envelope (excluding the `signature` field), so any
 * third party can re-verify a packet by downloading it from HuggingFace and
 * checking it against the published public key.
 */

import { z } from 'zod';

export const PROOF_PACKET_VERSION = '1.0.0' as const;

export const ArtifactKindSchema = z.enum([
  'model',
  'dataset',
  'eval-snapshot',
  'agent-skill',
]);
export type ArtifactKind = z.infer<typeof ArtifactKindSchema>;

export const TrustTierSchema = z.enum(['verified', 'community', 'experimental']);
export type TrustTier = z.infer<typeof TrustTierSchema>;

export const ProvenanceSchema = z.object({
  trainingDataHashes: z.array(z.string()).default([]),
  baseModelId: z.string().optional(),
  codeCommit: z.string().optional(),
  computeEnvironment: z
    .object({
      hardware: z.string().optional(),
      runtime: z.string().optional(),
      region: z.string().optional(),
    })
    .partial()
    .optional(),
  pipelineRunId: z.string().optional(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const PerformanceSchema = z.object({
  mirrorEvalScore: z.number().min(0).max(1).optional(),
  biasScore: z.number().min(0).max(1).optional(),
  safetyScore: z.number().min(0).max(1).optional(),
  evalDatasetRefs: z.array(z.string()).default([]),
  metrics: z.record(z.string(), z.number()).default({}),
});
export type Performance = z.infer<typeof PerformanceSchema>;

export const PolicySchema = z.object({
  covenantPolicies: z.array(z.string()).default([]),
  signers: z
    .array(
      z.object({
        signerId: z.string(),
        role: z.string().optional(),
        approvedAt: z.string(),
      }),
    )
    .default([]),
  approvalChain: z.array(z.string()).default([]),
});
export type Policy = z.infer<typeof PolicySchema>;

export const LifecycleSchema = z.object({
  trustTier: TrustTierSchema,
  expiresAt: z.string().optional(),
  revocationUrl: z.string().url().optional(),
  publishedAt: z.string(),
});
export type Lifecycle = z.infer<typeof LifecycleSchema>;

export const ProofPacketBodySchema = z.object({
  version: z.literal(PROOF_PACKET_VERSION),
  artifact: z.object({
    name: z.string().min(1),
    kind: ArtifactKindSchema,
    task: z.string().optional(),
    bucketUri: z.string(),
    contentHash: z.string().regex(/^sha256:[0-9a-f]{64}$/),
    sizeBytes: z.number().int().nonnegative().optional(),
    license: z.string().optional(),
  }),
  provenance: ProvenanceSchema,
  performance: PerformanceSchema,
  policy: PolicySchema,
  lifecycle: LifecycleSchema,
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type ProofPacketBody = z.infer<typeof ProofPacketBodySchema>;

export const SignatureSchema = z.object({
  algorithm: z.literal('ed25519'),
  publicKeyId: z.string(),
  publicKey: z.string(),
  signature: z.string(),
  signedAt: z.string(),
});
export type Signature = z.infer<typeof SignatureSchema>;

export const ProofPacketSchema = ProofPacketBodySchema.extend({
  signature: SignatureSchema,
});
export type ProofPacket = z.infer<typeof ProofPacketSchema>;

/**
 * Canonical JSON serialization with sorted keys, used for both signing and
 * verification. Two semantically-equal packets always produce byte-identical
 * canonical forms.
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const entries = keys.map((k) => {
    const v = (value as Record<string, unknown>)[k];
    return `${JSON.stringify(k)}:${canonicalize(v)}`;
  });
  return `{${entries.join(',')}}`;
}

/**
 * Compute the canonical bytes that get signed. Excludes the `signature` field.
 */
export function packetSigningBytes(body: ProofPacketBody): Uint8Array {
  return new TextEncoder().encode(canonicalize(body));
}
