import {
  type HybridSigner,
  generateHybridKeyPair,
  createHybridSigner,
  computeContentHash,
} from './hybrid-signer.js';
import { createDidWeb, createDidKey, buildDidDocument } from './did/resolver.js';
import { getDefaultCA } from './ca/certificate-authority.js';
import type {
  CryptographicIdentity,
  IdentitySignedEntry,
  HybridSignature,
  DIDDocument,
  DIDService,
} from './types.js';
import { getSigningMode } from './config/signing-config.js';
import { onCASwap } from './ca/certificate-authority.js';

export async function createTenantIdentity(opts: {
  domain: string;
  tenantName: string;
  serviceEndpoints?: DIDService[];
}): Promise<CryptographicIdentity> {
  const keyPair = generateHybridKeyPair();
  const mode = getSigningMode();
  const signer = createHybridSigner(keyPair, mode);
  const did = createDidWeb(opts.domain);

  const ca = getDefaultCA();
  const { certificate } = await ca.issueCertificate({
    subjectDid: did,
    subjectName: opts.tenantName,
    publicKeys: signer.publicKeys,
    requesterIdentity: `tenant:${opts.tenantName}`,
  });

  return {
    did,
    signer,
    certificate,
    certThumbprint: certificate.thumbprint,
  };
}

const _agentIdentityCache = new Map<string, CryptographicIdentity>();
const _agentIdentityInflight = new Map<string, Promise<CryptographicIdentity>>();

onCASwap(() => {
  _agentIdentityCache.clear();
  _agentIdentityInflight.clear();
});

export async function createAgentIdentity(opts: {
  agentName: string;
}): Promise<CryptographicIdentity> {
  const cached = _agentIdentityCache.get(opts.agentName);
  if (cached) return cached;
  const inflight = _agentIdentityInflight.get(opts.agentName);
  if (inflight) return inflight;

  const promise = (async () => {
    const keyPair = generateHybridKeyPair();
    const mode = getSigningMode();
    const signer = createHybridSigner(keyPair, mode);
    const did = createDidKey(keyPair.ed25519.publicKey);

    const ca = getDefaultCA();
    const { certificate } = await ca.issueCertificate({
      subjectDid: did,
      subjectName: opts.agentName,
      publicKeys: signer.publicKeys,
      requesterIdentity: `agent:${opts.agentName}`,
    });

    const identity: CryptographicIdentity = {
      did,
      signer,
      certificate,
      certThumbprint: certificate.thumbprint,
    };

    _agentIdentityCache.set(opts.agentName, identity);
    return identity;
  })();

  _agentIdentityInflight.set(opts.agentName, promise);
  try {
    return await promise;
  } finally {
    _agentIdentityInflight.delete(opts.agentName);
  }
}

export function clearAgentIdentityCache(): void {
  _agentIdentityCache.clear();
}

export function signEntry(
  identity: CryptographicIdentity,
  content: string,
  previousHash?: string,
): IdentitySignedEntry {
  const contentHash = computeContentHash(content);
  const signPayload = previousHash
    ? `proof:${contentHash}:${previousHash}`
    : `proof:${contentHash}`;

  const signature = identity.signer.signString(signPayload);

  return {
    signerDid: identity.did,
    certThumbprint: identity.certThumbprint,
    signature,
    signedAt: new Date().toISOString(),
    previousHash,
    contentHash,
  };
}

export function buildIdentityDidDocument(
  identity: CryptographicIdentity,
  serviceEndpoints?: DIDService[],
): DIDDocument {
  return buildDidDocument({
    did: identity.did,
    signer: identity.signer,
    certificate: identity.certificate,
    serviceEndpoints,
  });
}

export type { CryptographicIdentity };
