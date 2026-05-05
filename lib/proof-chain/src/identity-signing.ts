import type { ProofChain } from '@szl-holdings/db';
import type { SignedProofChainEntry } from '@szl-holdings/pqc-identity';

let _pqcIdentityModule: typeof import('@szl-holdings/pqc-identity') | null = null;

async function getPqcIdentity() {
  if (!_pqcIdentityModule) {
    _pqcIdentityModule = await import('@szl-holdings/pqc-identity');
  }
  return _pqcIdentityModule;
}

export interface TagAIContentWithIdentityParams {
  contentId: string;
  contentType: string;
  sourceClass: string;
  agentName: string;
  previousEntryHash?: string;
  metadata?: Record<string, unknown>;
}

export async function tagAIContentWithIdentity(
  params: TagAIContentWithIdentityParams,
): Promise<SignedProofChainEntry> {
  const pqc = await getPqcIdentity();

  const identity = pqc.createAgentIdentity({ agentName: params.agentName });

  const entryContent = buildCanonicalContent(
    params.contentId,
    params.contentType,
    params.sourceClass,
    params.metadata,
  );

  return pqc.signProofChainEntry(
    identity,
    entryContent,
    params.previousEntryHash,
  );
}

export function canonicalStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalStringify).join(',') + ']';
  const sorted = Object.keys(obj as Record<string, unknown>).sort();
  return '{' + sorted.map(k => JSON.stringify(k) + ':' + canonicalStringify((obj as Record<string, unknown>)[k])).join(',') + '}';
}

function buildCanonicalContent(
  contentId: string,
  contentType: string,
  sourceClass: string,
  metadata?: Record<string, unknown>,
): string {
  return canonicalStringify({
    contentId,
    contentType,
    sourceClass,
    metadata: metadata ?? {},
  });
}

export interface VerifyProofEntryParams {
  proof: ProofChain;
}

export async function verifyProofEntry(
  params: VerifyProofEntryParams,
): Promise<{ valid: boolean; legacy: boolean; details: Record<string, unknown> }> {
  const metadata = (params.proof.metadata ?? {}) as Record<string, unknown>;

  const pqc = await getPqcIdentity();

  if (pqc.isLegacyEntry(metadata)) {
    const result = pqc.verifyLegacyEntry();
    return { valid: result.valid, legacy: true, details: result.details };
  }

  const signedEntry = metadata.pqcSignature as SignedProofChainEntry | undefined;

  if (!signedEntry) {
    return { valid: true, legacy: true, details: { note: 'No PQC signature metadata found' } };
  }

  const originalMetadata = { ...metadata };
  delete originalMetadata.pqcSignature;

  const entryContent = buildCanonicalContent(
    params.proof.contentId,
    params.proof.contentType,
    params.proof.sourceClass as string,
    Object.keys(originalMetadata).length > 0 ? originalMetadata : undefined,
  );

  const result = pqc.verifyProofChainEntry(signedEntry, entryContent);
  return { valid: result.valid, legacy: false, details: result.details };
}
