export {
  HybridSigner,
  generateHybridKeyPair,
  createHybridSigner,
  computeContentHash,
  computeBytesHash,
} from './hybrid-signer.js';

export {
  createDidWeb,
  createDidKey,
  buildDidDocument,
  resolveDidKey,
  resolveDidWeb,
  clearDidWebCache,
  setDidWebCacheEntry,
} from './did/resolver.js';

export {
  CertificateAuthority,
  getDefaultCA,
  setDefaultCA,
  onCASwap,
} from './ca/certificate-authority.js';

export {
  initializePersistentCA,
  setPersistentCAStore,
  getPersistentCAStore,
} from './ca/persistent-ca.js';
export type { PersistentCAStore } from './ca/persistent-ca.js';

export {
  SoftwareHsmDriver,
  setHsmAuditSink,
  getHsmAuditSink,
  registerHsmDriver,
  createHsmSigner,
  getConfiguredHsmDriver,
} from './ca/hsm-signer.js';
export type {
  HsmDriverKind,
  HsmKeyTier,
  HsmOperation,
  HsmOutcome,
  HsmSigner,
  HsmSignContext,
  HsmAuditRecord,
  HsmAuditSink,
  HsmAttestation,
  HsmHealth,
  HsmDriverFactory,
} from './ca/hsm-signer.js';

export { IntermediateCA } from './ca/intermediate-ca.js';
export type { IntermediateCAConfig } from './ca/intermediate-ca.js';

export { TransparencyLog } from './transparency/merkle-log.js';

export {
  createTenantIdentity,
  createAgentIdentity,
  clearAgentIdentityCache,
  signEntry,
  buildIdentityDidDocument,
} from './cryptographic-identity.js';

export {
  verifySignedEntry,
  verifyHybridSignature,
  verifyHybridSignatureWithCertBinding,
  verifyDid,
  verifyCertificate,
  walkProofChain,
} from './verification.js';
export type { ProofChainWalkEntry, ProofChainWalkResult } from './verification.js';

export {
  getPQCConfig,
  setPQCConfig,
  getSigningMode,
  getMinimumVerificationLevel,
} from './config/signing-config.js';

export type {
  SigningMode,
  HybridSignature,
  HybridKeyPair,
  SignatureVerdict,
  DIDDocument,
  DIDVerificationMethod,
  DIDService,
  CertificateData,
  CertificateIssuanceResult,
  TransparencyLogEntry,
  TransparencyInclusionProof,
  VerificationVerdict,
  CryptographicIdentity,
  IdentitySignedEntry,
} from './types.js';

export {
  signProofChainEntry,
  verifyProofChainEntry,
  isLegacyEntry,
  verifyLegacyEntry,
} from './proof-chain-identity.js';

export type { SignedProofChainEntry } from './proof-chain-identity.js';
export type { PQCIdentityConfig } from './config/signing-config.js';
export type { CAConfig } from './ca/certificate-authority.js';
