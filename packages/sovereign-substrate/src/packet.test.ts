import { describe, expect, it } from 'vitest';
import { canonicalize, ProofPacketSchema, PROOF_PACKET_VERSION } from './packet.js';
import { computeContentHash, generateSigningIdentity, signPacket } from './sign.js';
import { verifyPacket } from './verify.js';

describe('proof packet', () => {
  it('canonicalizes with sorted keys', () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(canonicalize([{ z: 1, a: 2 }])).toBe('[{"a":2,"z":1}]');
  });

  it('signs and verifies a packet end-to-end', () => {
    const id = generateSigningIdentity('test-key');
    const artifact = new TextEncoder().encode('hello world');
    const contentHash = computeContentHash(artifact);
    const body = ProofPacketSchema.omit({ signature: true }).parse({
      version: PROOF_PACKET_VERSION,
      artifact: {
        name: 'test-model',
        kind: 'model',
        bucketUri: 'hf-bucket://betterwithage/forge-models/test/v1',
        contentHash,
      },
      provenance: { trainingDataHashes: [] },
      performance: { evalDatasetRefs: [], metrics: {} },
      policy: { covenantPolicies: [], signers: [], approvalChain: [] },
      lifecycle: { trustTier: 'experimental', publishedAt: new Date().toISOString() },
      metadata: {},
    });
    const packet = signPacket(body, id);
    const trustedKeys = [{ publicKeyId: id.publicKeyId, publicKeyHex: id.publicKeyHex }];
    const result = verifyPacket(packet, artifact, { trustedKeys });
    expect(result.ok).toBe(true);
  });

  it('rejects a packet signed by an untrusted key (forgery)', () => {
    const platformKey = generateSigningIdentity('platform-key');
    const attackerKey = generateSigningIdentity('attacker-key');
    const artifact = new TextEncoder().encode('malicious model');
    const body = ProofPacketSchema.omit({ signature: true }).parse({
      version: PROOF_PACKET_VERSION,
      artifact: {
        name: 'malicious',
        kind: 'model',
        bucketUri: 'hf-bucket://attacker/forge-models/x/v1',
        contentHash: computeContentHash(artifact),
      },
      provenance: { trainingDataHashes: [] },
      performance: { evalDatasetRefs: [], metrics: {} },
      policy: { covenantPolicies: [], signers: [], approvalChain: [] },
      lifecycle: { trustTier: 'verified', publishedAt: new Date().toISOString() },
      metadata: {},
    });
    const forged = signPacket(body, attackerKey);
    const result = verifyPacket(forged, artifact, {
      trustedKeys: [
        { publicKeyId: platformKey.publicKeyId, publicKeyHex: platformKey.publicKeyHex },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/not in the trusted key set/);
  });

  it('rejects when artifact bytes are tampered', () => {
    const id = generateSigningIdentity('test-key');
    const artifact = new TextEncoder().encode('hello world');
    const body = ProofPacketSchema.omit({ signature: true }).parse({
      version: PROOF_PACKET_VERSION,
      artifact: {
        name: 'test-model',
        kind: 'model',
        bucketUri: 'hf-bucket://betterwithage/forge-models/test/v1',
        contentHash: computeContentHash(artifact),
      },
      provenance: { trainingDataHashes: [] },
      performance: { evalDatasetRefs: [], metrics: {} },
      policy: { covenantPolicies: [], signers: [], approvalChain: [] },
      lifecycle: { trustTier: 'experimental', publishedAt: new Date().toISOString() },
      metadata: {},
    });
    const packet = signPacket(body, id);
    const tampered = new TextEncoder().encode('hello WORLD');
    const result = verifyPacket(packet, tampered, {
      trustedKeys: [{ publicKeyId: id.publicKeyId, publicKeyHex: id.publicKeyHex }],
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/content hash mismatch/);
  });
});
