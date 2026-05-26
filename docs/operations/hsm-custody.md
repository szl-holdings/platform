# HSM / KMS Root-Key Custody

Operational doctrine for the SZL Holdings root CA when run behind a hardware
security module or cloud KMS. This document is referenced from the Sentra
"HSM Custody" panel and from the engineering oncall runbook.

## Driver decision

The `HybridSigner` interface is driver-agnostic. The platform supports three
hardware-backed driver kinds in addition to the in-process `software`
default. The driver is selected at boot via `HSM_DRIVER`:

| Driver       | When to choose                                         | PQC support today |
| ------------ | ------------------------------------------------------ | ------------------ |
| `aws-kms`    | AWS-native deployment; existing CloudHSM tenancy       | Ed25519 native; ML-DSA via external signer (PKCS#11 over CloudHSM custom key store) |
| `gcp-kms`    | GCP-native; existing Cloud KMS / Cloud HSM tenancy     | Ed25519 native; ML-DSA via EKM bridge until KMS PQC GA |
| `pkcs11`     | On-prem HSM (Thales, YubiHSM, Entrust nShield, AWS CloudHSM PKCS#11) | Ed25519 + ML-DSA-65 native when the firmware supports it; otherwise hybrid via external signer |
| `software`   | Dev, CI, and emergency fallback                        | Ed25519 + ML-DSA-65 (in-process, encrypted at rest) |

**Decision (2026-Q2):** PKCS#11 is the primary production driver because it
is the only option that supports both halves of the hybrid suite
(`Ed25519` + `ML-DSA-65`) on a single device today. `aws-kms` is the
documented fallback for any region where a certified HSM is unavailable; the
fallback degrades to classical-only signing for the ML-DSA leg and logs the
degradation against the HSM audit chain.

## Two-tier signing

The root key only ever signs:

1. **Intermediate certificates** — a new intermediate is minted at most once
   per quarter and is valid for ~13 months.
2. **Attestation statements** — operator-initiated; produces a fresh
   signed `I currently control private key X at time T` statement.
3. **Cross-signatures during rotation** — see ceremony below.

Day-to-day tenant and agent certificates are issued by an **intermediate
signer**, whose private key is also HSM-backed but lives on a separate slot
with its own audit identity. Compromising an intermediate is a recoverable
event: revoke the intermediate, mint a new one with the root, and revoke
all certificates the compromised intermediate issued.

## HSM audit chain

Every root and intermediate signing operation is appended to
`pqc_hsm_audit_log`. Each row is hash-chained to the previous row
(`prev_hash` ← `event_hash`), independent of `audit_chain_events`, so an
API-server compromise that rewrites application audit history cannot also
rewrite root-key history.

The Sentra "HSM Custody" panel shows the chain tip, the most recent
operations, and the time since the last attestation, rotation, and DR
rehearsal.

## Rotation ceremony

Quarterly cadence; rehearsed against staging HSM monthly.

1. **Schedule.** Two-week notice to all relying parties via the
   transparency log and the public DID document.
2. **Mint new root in HSM.** Operator A initiates `rotate`; HSM generates a
   new hybrid key pair internally and emits the public-key bundle plus a
   provider attestation document.
3. **Cross-sign.** Operator B signs the new root's public-key bundle with
   the *outgoing* root. The cross-signature is appended to the transparency
   log (`entryType: 'cross-sign'`) and to the audit chain.
4. **Publish.** The platform updates `/.well-known/did.json` and the
   `did:webvh` history to add the new root verification method while
   keeping the old root's verification method present until the grace
   period ends.
5. **Grace period.** 90 days. During the grace period both roots verify;
   issuance prefers the new root.
6. **Retire.** Operator A executes `retire` against the old root; HSM
   marks the key non-exportable and non-usable but retained for
   verification. The retirement is signed by the *new* root and appended
   to the transparency log.
7. **Rehearsal mode.** Setting `HSM_DRIVER=software` with `HSM_REHEARSAL=1`
   runs the same ceremony end-to-end against an ephemeral staging chain;
   the resulting transparency-log entries are written to a `_rehearsal`
   table and never published.

## Attestation

`POST /api/pqc/ca/attest` requests a fresh attestation. The signer produces
a hybrid signature over the canonical statement
`{"challenge":"…","issuer":"…","keyRef":"…","publicKeys":{…},"statement":"I currently control private key X","issuedAt":…}`.

An external auditor verifies by:

1. Re-canonicalising the statement.
2. Verifying `attestation.signature.ed25519` with `attestation.publicKeys.ed25519`.
3. Verifying `attestation.signature.mldsa65` with `attestation.publicKeys.mldsa65`.
4. Optionally checking `attestation.providerAttestation` against the
   HSM vendor's attestation root.

No application trust is required for steps 1–3.

## Disaster recovery

The root key is sharded M-of-N across operator HSM custody (production:
3-of-5; staging: 2-of-3). The shards are produced by the HSM at key
generation time and never exist outside the HSM.

| Driver       | Sharding mechanism                                        |
| ------------ | --------------------------------------------------------- |
| `aws-kms`    | AWS KMS Custom Key Stores backed by CloudHSM cluster; cluster backups encrypted under operator-held QSCD-protected backup keys (M-of-N) |
| `gcp-kms`    | Cloud EKM bound to on-prem HSM cluster; cluster backups encrypted under operator-held smartcards (M-of-N) |
| `pkcs11`     | HSM-native sharding (e.g. Thales Smart Card Set, nShield Operator Card Set) |

The DR readiness endpoint
(`GET /api/pqc/ca/disaster-recovery/readiness`) confirms:

- A backup verification has been recorded in the last 30 days.
- A recovery rehearsal has been recorded in the last 180 days.
- A rotation rehearsal has been recorded.
- The operator roster matches the M-of-N parameters.

Sentra surfaces the staleness counters and any blocking reason.

### Recovery procedure (production)

This is a destructive, multi-operator ceremony. Do not execute outside an
incident or scheduled rehearsal.

1. Convene 3 operators (M=3, N=5) physically present at the secure
   facility; each presents their HSM access token / smartcard.
2. Stand up replacement HSM hardware in the target region.
3. Each operator inserts their backup-key share; HSM performs the M-of-N
   reconstruction internally.
4. Run `POST /api/pqc/ca/disaster-recovery/rehearse` with
   `rehearsalType=recovery-rehearsal` and `outcome=passed` to anchor the
   ceremony in the DR ledger.
5. Run `POST /api/pqc/ca/attest` against the recovered key and publish the
   attestation to the transparency log.
6. Resume issuance.

## Out of scope

- Procuring physical HSM hardware (operational, not engineering).
- Replacing per-tenant signing keys with HSM-backed keys.
- Multi-region active-active HSM replication.
- FIPS 140-3 or Common Criteria validation (audit activities).
