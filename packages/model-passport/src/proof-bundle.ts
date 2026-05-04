/**
 * Proof Bundle — SBOM for AI Decisions
 *
 * A signed, offline-verifiable receipt that proves which passport governed
 * an AI decision and that the inputs/outputs/policy trace were not tampered
 * with afterward.
 *
 * Bundle format:
 *   {
 *     manifest:       bundle metadata + integrity root
 *     passport:       SignedModelPassport (full, with signature)
 *     policyTrace:    Covenant Policy decision record
 *     ioHashes:       SHA-256 of request input + response output
 *     telemetrySlice: relevant GenAI telemetry span(s) for the run
 *     bundleSignature: Ed25519 over canonical-JSON(manifest + ioHashes + passportSig)
 *   }
 *
 * Integrity coverage:
 *   integrityRoot = SHA-256(canonical({manifestPartial, ioHashes, passportSignature,
 *                            provenanceHash, policyTraceHash, telemetryHash}))
 *   bundleSignature = Ed25519(canonical({manifest, ioHashes, passportSignature}))
 *
 * Because integrityRoot is inside manifest and manifest is inside the sign payload,
 * all six inputs are transitively covered by the bundleSignature.
 *
 * Verification requires:
 *   - The platform's bundle-signing public key (trustedBundleSignerPublicKey)
 *   - The bundle JSON
 * No platform connectivity needed after export.
 */

import { createHash, sign, verify } from 'node:crypto';
import { verifyPassportSignature } from './crypto.js';
import type { SignedModelPassport } from './types.js';

export interface ProofBundleManifest {
  bundleVersion: '1.0';
  bundleId: string;
  runId: string;
  passportId: string;
  passportSignatureDigest: string;
  createdAt: string;
  ioHashAlgorithm: 'sha256';
  integrityRoot: string;
}

export interface IOHashes {
  requestHash: string;
  responseHash: string;
  algorithm: 'sha256';
}

export interface PolicyTraceEntry {
  requestId: string;
  effect: 'allow' | 'deny';
  allowed: boolean;
  matchedPolicies: string[];
  deniedBy?: string | null;
  reason?: string;
  evaluatedAt: number;
  action: string;
}

export interface TelemetrySlice {
  spanId: string;
  traceId: string;
  model: string;
  provider: string;
  routeClass: string;
  totalTokens: number;
  latencyMs: number;
  costEstimateUsd: number;
  passportId?: string;
  timestamp: number;
}

export interface ProofBundle {
  manifest: ProofBundleManifest;
  passport: SignedModelPassport;
  policyTrace: PolicyTraceEntry | null;
  ioHashes: IOHashes;
  telemetrySlice: TelemetrySlice[];
  bundleSignature: string;
  signerPublicKey: string;
}

export interface ProofBundleVerifyResult {
  valid: boolean;
  signatureOk: boolean;
  integrityRootOk: boolean;
  passportSignatureOk: boolean;
  passportStateOk: boolean;
  errors: string[];
  verifiedAt: string;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + (value as unknown[]).map(canonicalJson).join(',') + ']';
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + canonicalJson((value as Record<string, unknown>)[k]))
      .join(',') +
    '}'
  );
}

export function hashContent(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function hashOptionalJson(value: unknown): string {
  if (value === null || value === undefined) return hashContent('null');
  return hashContent(canonicalJson(value));
}

/**
 * Compute the integrity root that covers all six integrity inputs:
 *   manifestPartial, ioHashes, passportSignature, provenanceHash,
 *   policyTrace (hashed), telemetrySlice (hashed).
 *
 * Including policyTrace and telemetrySlice means any tampering with the
 * policy decision or telemetry data invalidates the bundle signature.
 */
function computeIntegrityRoot(
  manifestPartial: Omit<ProofBundleManifest, 'integrityRoot'>,
  ioHashes: IOHashes,
  passport: SignedModelPassport,
  policyTrace: PolicyTraceEntry | null,
  telemetrySlice: TelemetrySlice[],
): string {
  const payload = canonicalJson({
    manifestPartial,
    ioHashes,
    passportSignature: passport.signature,
    provenanceHash: passport.provenanceHash,
    policyTraceHash: hashOptionalJson(policyTrace),
    telemetryHash: hashOptionalJson(telemetrySlice),
  });
  return hashContent(payload);
}

function buildSignPayload(
  manifest: ProofBundleManifest,
  ioHashes: IOHashes,
  passport: SignedModelPassport,
): Buffer {
  return Buffer.from(
    canonicalJson({ manifest, ioHashes, passportSignature: passport.signature }),
    'utf8',
  );
}

export interface BuildProofBundleParams {
  runId: string;
  passport: SignedModelPassport;
  requestContent: string;
  responseContent: string;
  policyTrace?: PolicyTraceEntry | null;
  telemetrySlice?: TelemetrySlice[];
  signerPrivateKeyPem: string;
  signerPublicKeyPem: string;
}

export function buildProofBundle(params: BuildProofBundleParams): ProofBundle {
  const bundleId = `pb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const passportId = params.passport.passport.identity.id;
  const passportDigest = createHash('sha256')
    .update(params.passport.signature)
    .digest('hex')
    .slice(0, 32);

  const ioHashes: IOHashes = {
    requestHash: hashContent(params.requestContent),
    responseHash: hashContent(params.responseContent),
    algorithm: 'sha256',
  };

  const policyTrace = params.policyTrace ?? null;
  const telemetrySlice = params.telemetrySlice ?? [];

  const manifestPartial: Omit<ProofBundleManifest, 'integrityRoot'> = {
    bundleVersion: '1.0',
    bundleId,
    runId: params.runId,
    passportId,
    passportSignatureDigest: passportDigest,
    createdAt: new Date().toISOString(),
    ioHashAlgorithm: 'sha256',
  };

  const integrityRoot = computeIntegrityRoot(
    manifestPartial,
    ioHashes,
    params.passport,
    policyTrace,
    telemetrySlice,
  );
  const manifest: ProofBundleManifest = { ...manifestPartial, integrityRoot };

  const signPayload = buildSignPayload(manifest, ioHashes, params.passport);
  const bundleSignature = sign(null, signPayload, {
    key: params.signerPrivateKeyPem,
    dsaEncoding: 'ieee-p1363',
  }).toString('base64url');

  return {
    manifest,
    passport: params.passport,
    policyTrace,
    ioHashes,
    telemetrySlice,
    bundleSignature,
    signerPublicKey: params.signerPublicKeyPem,
  };
}

/**
 * Verify a proof bundle.
 *
 * @param bundle - The bundle to verify.
 * @param trustedBundleSignerPublicKey - The platform's known bundle-signing public key (PEM).
 *   This is the PASSPORT_SIGNER_PUBLIC_KEY env var on the platform — NOT the passport's own
 *   signerPublicKey (which governs passport content integrity, not bundle integrity).
 *   When provided, the verifier asserts bundle.signerPublicKey matches this key before
 *   proceeding, preventing an attacker from re-signing a tampered bundle with a different key.
 *   Omit only for unit tests that build bundles with ephemeral keys.
 */
export function verifyProofBundle(
  bundle: ProofBundle,
  trustedBundleSignerPublicKey?: string,
): ProofBundleVerifyResult {
  const errors: string[] = [];

  if (trustedBundleSignerPublicKey) {
    const normalize = (pem: string) => pem.trim().replace(/\r\n/g, '\n');
    if (normalize(bundle.signerPublicKey) !== normalize(trustedBundleSignerPublicKey)) {
      errors.push(
        'Bundle signer key is not the trusted platform bundle-signing key — ' +
        'the bundle may have been re-signed by an untrusted party',
      );
      return {
        valid: false,
        signatureOk: false,
        integrityRootOk: false,
        passportSignatureOk: false,
        passportStateOk: false,
        errors,
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  let signatureOk = false;
  try {
    const signPayload = buildSignPayload(bundle.manifest, bundle.ioHashes, bundle.passport);
    const sigBuffer = Buffer.from(bundle.bundleSignature, 'base64url');
    signatureOk = verify(
      null,
      signPayload,
      { key: bundle.signerPublicKey, format: 'pem', dsaEncoding: 'ieee-p1363' },
      sigBuffer,
    );
    if (!signatureOk) errors.push('Bundle signature verification failed');
  } catch (e) {
    errors.push(`Bundle signature error: ${e instanceof Error ? e.message : String(e)}`);
  }

  let integrityRootOk = false;
  try {
    const { integrityRoot: _stored, ...manifestPartial } = bundle.manifest;
    const recomputed = computeIntegrityRoot(
      manifestPartial as Omit<ProofBundleManifest, 'integrityRoot'>,
      bundle.ioHashes,
      bundle.passport,
      bundle.policyTrace,
      bundle.telemetrySlice,
    );
    integrityRootOk = recomputed === bundle.manifest.integrityRoot;
    if (!integrityRootOk) errors.push('Integrity root mismatch — bundle may have been tampered');
  } catch (e) {
    errors.push(`Integrity root error: ${e instanceof Error ? e.message : String(e)}`);
  }

  let passportSignatureOk = false;
  try {
    const result = verifyPassportSignature(bundle.passport);
    passportSignatureOk = result.signatureOk && result.hashOk;
    if (!result.signatureOk) errors.push('Passport Ed25519 signature invalid');
    if (!result.hashOk) errors.push('Passport provenance hash mismatch');
  } catch (e) {
    errors.push(`Passport verification error: ${e instanceof Error ? e.message : String(e)}`);
  }

  const passportStateOk =
    bundle.passport.passport.state === 'active' ||
    bundle.passport.passport.state === 'deprecated';
  if (!passportStateOk) {
    errors.push(`Passport state '${bundle.passport.passport.state}' is not valid for proof`);
  }

  return {
    valid: signatureOk && integrityRootOk && passportSignatureOk && passportStateOk,
    signatureOk,
    integrityRootOk,
    passportSignatureOk,
    passportStateOk,
    errors,
    verifiedAt: new Date().toISOString(),
  };
}

export function serializeBundle(bundle: ProofBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function deserializeBundle(json: string): ProofBundle {
  return JSON.parse(json) as ProofBundle;
}
