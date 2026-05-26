/**
 * HSM / KMS signer abstraction for the SZL Holdings root and intermediate CAs.
 *
 * The signing interface from #4167 was deliberately shaped so a hardware-backed
 * driver drops in behind the same `HybridSigner` contract. This module defines
 * that driver surface and ships a `SoftwareHsmDriver` default (in-process keys,
 * used in dev and as the fallback). Hardware drivers (`AwsKmsHsmDriver`,
 * `GcpKmsHsmDriver`, `Pkcs11HsmDriver`) implement the same interface; the
 * application code that calls `sign()` never knows the difference.
 *
 * Every signing operation is announced through an `HsmAuditSink` so the
 * platform can persist a tamper-evident log of root-key usage independent
 * of application audit logs.
 */
import { HybridSigner, createHybridSigner, computeBytesHash } from '../hybrid-signer.js';
import type { HybridKeyPair, HybridSignature, SigningMode } from '../types.js';

export type HsmDriverKind = 'software' | 'aws-kms' | 'gcp-kms' | 'pkcs11';
export type HsmKeyTier = 'root' | 'intermediate';
export type HsmOperation =
  | 'sign'
  | 'attest'
  | 'rotate'
  | 'cross-sign'
  | 'retire'
  | 'dr-rehearsal'
  | 'health-probe';
export type HsmOutcome = 'success' | 'failure' | 'denied';

export interface HsmAuditRecord {
  keyTier: HsmKeyTier;
  keyRef: string;
  driver: HsmDriverKind;
  operation: HsmOperation;
  requesterIdentity: string;
  payloadHash: string;
  outcome: HsmOutcome;
  latencyMs: number;
  metadata?: Record<string, unknown>;
}

export interface HsmAuditSink {
  record(entry: HsmAuditRecord): Promise<void> | void;
}

export interface HsmAttestation {
  keyRef: string;
  keyTier: HsmKeyTier;
  driver: HsmDriverKind;
  publicKeys: { ed25519: string; mldsa65: string };
  statement: string;
  signature: HybridSignature;
  /** Provider-supplied attestation document (CSR-like), opaque to the app. */
  providerAttestation?: Record<string, unknown>;
  attestedAt: number;
}

export interface HsmHealth {
  driver: HsmDriverKind;
  available: boolean;
  lastProbedAt: number;
  latencyMs: number | null;
  message?: string;
}

export interface HsmSignContext {
  requesterIdentity: string;
  operation?: HsmOperation;
  metadata?: Record<string, unknown>;
}

/**
 * Driver-shaped signing surface. Each concrete driver hides the underlying
 * key custody (in-process bytes, AWS KMS key ARN, GCP KMS resource name,
 * PKCS#11 slot/object handle). The public keys are exposed so verifying
 * parties can check signatures without trusting the HSM.
 */
export interface HsmSigner {
  readonly driver: HsmDriverKind;
  readonly keyTier: HsmKeyTier;
  readonly keyRef: string;
  readonly publicKeys: { ed25519: string; mldsa65: string };

  sign(message: Uint8Array, ctx: HsmSignContext): Promise<HybridSignature>;
  attest(statement: string, ctx: HsmSignContext): Promise<HsmAttestation>;
  health(): Promise<HsmHealth>;
}

class NoopAuditSink implements HsmAuditSink {
  record(_entry: HsmAuditRecord): void {
    /* discarded — operators wire a real sink at boot */
  }
}

let _auditSink: HsmAuditSink = new NoopAuditSink();

export function setHsmAuditSink(sink: HsmAuditSink): void {
  _auditSink = sink;
}

export function getHsmAuditSink(): HsmAuditSink {
  return _auditSink;
}

/**
 * Software-backed HSM driver. Holds the hybrid key material in process,
 * matching the pre-HSM behaviour, and emits the same audit records as a
 * hardware driver would. This is the default; production deployments
 * replace it with `AwsKmsHsmDriver`, `GcpKmsHsmDriver`, or
 * `Pkcs11HsmDriver` by setting `HSM_DRIVER` to a non-`software` value
 * and registering the driver factory at boot.
 */
export class SoftwareHsmDriver implements HsmSigner {
  readonly driver: HsmDriverKind = 'software';
  readonly keyTier: HsmKeyTier;
  readonly keyRef: string;
  private readonly _signer: HybridSigner;

  constructor(opts: {
    keyTier: HsmKeyTier;
    keyRef: string;
    keyPair: HybridKeyPair;
    mode?: SigningMode;
  }) {
    this.keyTier = opts.keyTier;
    this.keyRef = opts.keyRef;
    this._signer = createHybridSigner(opts.keyPair, opts.mode ?? 'hybrid');
  }

  get publicKeys(): { ed25519: string; mldsa65: string } {
    return this._signer.publicKeys;
  }

  async sign(message: Uint8Array, ctx: HsmSignContext): Promise<HybridSignature> {
    const start = Date.now();
    let outcome: HsmOutcome = 'success';
    let sig: HybridSignature;
    try {
      sig = this._signer.sign(message);
    } catch (err) {
      outcome = 'failure';
      await emitAudit(this, ctx.operation ?? 'sign', ctx, message, outcome, start, {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
    await emitAudit(this, ctx.operation ?? 'sign', ctx, message, outcome, start, ctx.metadata);
    return sig;
  }

  async attest(statement: string, ctx: HsmSignContext): Promise<HsmAttestation> {
    const start = Date.now();
    const msg = new TextEncoder().encode(statement);
    const signature = this._signer.sign(msg);
    const attestation: HsmAttestation = {
      keyRef: this.keyRef,
      keyTier: this.keyTier,
      driver: this.driver,
      publicKeys: this.publicKeys,
      statement,
      signature,
      providerAttestation: {
        provider: 'software',
        note: 'Software driver — no hardware attestation. Replace with HSM/KMS driver in production.',
      },
      attestedAt: Date.now(),
    };
    await emitAudit(this, 'attest', ctx, msg, 'success', start, {
      statementHash: computeBytesHash(msg),
    });
    return attestation;
  }

  async health(): Promise<HsmHealth> {
    const start = Date.now();
    return {
      driver: this.driver,
      available: true,
      lastProbedAt: Date.now(),
      latencyMs: Date.now() - start,
      message: 'software driver — always available',
    };
  }
}

async function emitAudit(
  signer: HsmSigner,
  operation: HsmOperation,
  ctx: HsmSignContext,
  message: Uint8Array,
  outcome: HsmOutcome,
  startMs: number,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await _auditSink.record({
      keyTier: signer.keyTier,
      keyRef: signer.keyRef,
      driver: signer.driver,
      operation,
      requesterIdentity: ctx.requesterIdentity,
      payloadHash: computeBytesHash(message),
      outcome,
      latencyMs: Date.now() - startMs,
      metadata,
    });
  } catch {
    /* never fail the signing call because audit emission failed */
  }
}

/**
 * Factory selected at boot from the `HSM_DRIVER` env var. Hardware drivers
 * register themselves here; the software driver is always available.
 */
export type HsmDriverFactory = (opts: {
  keyTier: HsmKeyTier;
  keyRef: string;
  keyPair?: HybridKeyPair;
  mode?: SigningMode;
}) => HsmSigner;

const _driverRegistry = new Map<HsmDriverKind, HsmDriverFactory>();

_driverRegistry.set('software', (opts) => {
  if (!opts.keyPair) {
    throw new Error('software HSM driver requires a keyPair');
  }
  return new SoftwareHsmDriver({
    keyTier: opts.keyTier,
    keyRef: opts.keyRef,
    keyPair: opts.keyPair,
    mode: opts.mode,
  });
});

export function registerHsmDriver(kind: HsmDriverKind, factory: HsmDriverFactory): void {
  _driverRegistry.set(kind, factory);
}

export function createHsmSigner(
  kind: HsmDriverKind,
  opts: Parameters<HsmDriverFactory>[0],
): HsmSigner {
  const factory = _driverRegistry.get(kind);
  if (!factory) {
    throw new Error(
      `HSM driver '${kind}' is not registered. Available: ${[..._driverRegistry.keys()].join(', ')}`,
    );
  }
  return factory(opts);
}

export function getConfiguredHsmDriver(): HsmDriverKind {
  const raw = (process.env.HSM_DRIVER ?? 'software').toLowerCase();
  if (raw === 'aws-kms' || raw === 'gcp-kms' || raw === 'pkcs11' || raw === 'software') {
    return raw;
  }
  return 'software';
}
