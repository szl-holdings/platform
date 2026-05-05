export type SigningMode = 'hybrid' | 'classical-only' | 'pqc-only';

export interface HybridSignature {
  alg: 'hybrid-v1';
  ed25519?: string;
  mldsa65?: string;
  mode: SigningMode;
  publicKeys?: {
    ed25519?: string;
    mldsa65?: string;
  };
}

export interface SignatureVerdict {
  valid: boolean;
  ed25519Valid: boolean | null;
  mldsa65Valid: boolean | null;
  mode: SigningMode;
  minimumMet: boolean;
}

export interface HybridKeyPair {
  ed25519: { privateKey: Uint8Array; publicKey: Uint8Array };
  mldsa65: { privateKey: Uint8Array; publicKey: Uint8Array };
}

export interface DIDDocument {
  '@context': string[];
  id: string;
  verificationMethod: DIDVerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
  service?: DIDService[];
}

export interface DIDVerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyHex?: string;
}

export interface DIDService {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface CertificateData {
  certId: string;
  version: number;
  issuer: string;
  subject: string;
  subjectDid: string;
  publicKeys: {
    ed25519: string;
    mldsa65: string;
  };
  notBefore: number;
  notAfter: number;
  serialNumber: string;
  thumbprint: string;
  issuedAt: number;
  issuerSignature?: HybridSignature;
  revokedAt?: number;
  revocationReason?: string;
}

export interface CertificateIssuanceResult {
  certificate: CertificateData;
  inclusionProof: TransparencyInclusionProof;
}

export interface TransparencyLogEntry {
  index: number;
  timestamp: number;
  entryType: 'issuance' | 'revocation';
  certThumbprint: string;
  certId: string;
  subjectDid: string;
  leafHash: string;
}

export interface TransparencyInclusionProof {
  logIndex: number;
  leafHash: string;
  merkleRoot: string;
  auditPath: string[];
  treeSize: number;
  timestamp: number;
}

export interface VerificationVerdict {
  proofId?: string;
  did?: string;
  signatureVerdict?: SignatureVerdict;
  certValid: boolean;
  certRevoked: boolean;
  transparencyLogVerified: boolean;
  chainIntegrityOk: boolean;
  overallValid: boolean;
  details: Record<string, unknown>;
  verifiedAt: number;
}

export interface CryptographicIdentity {
  did: string;
  signer: import('./hybrid-signer.js').HybridSigner;
  certificate: CertificateData;
  certThumbprint: string;
}

export interface IdentitySignedEntry {
  signerDid: string;
  certThumbprint: string;
  signature: HybridSignature;
  signedAt: string;
  previousHash?: string;
  contentHash: string;
}
