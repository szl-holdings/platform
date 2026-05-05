# Platform Identity System — Overview

## What this is

The platform identity layer adds two capabilities on top of the existing SHA-256 audit chain:

1. **Machine/Agent Identity** — Every tenant org, internal service, and registered agent has a platform-internal DID (`did:plat:<kind>:<id>`) with a DB-backed signing key under the custody service.

2. **Hybrid-Signed Audit Chain** — Every new `audit_chain_events` row carries both an Ed25519 signature and an ML-DSA-65 (Dilithium / NIST PQC standard) signature over a canonical payload, bound to the signing DID. Legacy rows (pre-migration) remain verifiable as `legacy_unsigned`.

## DID method: `did:plat`

The platform uses a custom `did:plat` method that is:
- **Intra-platform only** — not registered publicly, cannot collide with `did:web` or `did:key`
- **Three actor kinds**: `platform_service`, `tenant`, `agent`
- **Example**: `did:plat:platform_service:szl-api-server`

The resolver is in `lib/platform-did-registry.ts`. It reads from `platform_dids` + `platform_keys` tables and returns a W3C DID Document with Ed25519 and ML-DSA-65 verification methods.

## Components

| Component | Location |
|-----------|----------|
| Key custody abstraction | `artifacts/api-server/src/lib/key-custody.ts` |
| Platform DID registry | `artifacts/api-server/src/lib/platform-did-registry.ts` |
| Audit chain signer/verifier | `artifacts/api-server/src/lib/audit-chain-signer.ts` |
| Identity bootstrap | `artifacts/api-server/src/lib/identity-bootstrap.ts` |
| Deferred WebVH scaffolding | `lib/db/src/schema/platform_identity.ts` (`did_webvh_log`) |
| Federated trust bridge (no-op) | `artifacts/api-server/src/lib/federated-trust-bridge.ts` |

## Audit chain signature classification

The verify endpoint (`GET /audit-chain/verify`) classifies each row:

| Status | Meaning |
|--------|---------|
| `hybrid_verified` | Both Ed25519 and ML-DSA-65 signatures present and valid |
| `legacy_unsigned` | No signature columns (row predates migration 0051) |
| `broken` | Signatures present but invalid, or hash chain tampered |

Legacy rows are **never** reported as failures.

## Database tables added (migration 0051)

- `platform_keys` — envelope-encrypted signing key pairs
- `platform_dids` — DID registry
- `platform_did_documents` — DID document snapshots
- `did_webvh_log` — deferred WebVH history log (off by default)
- Six new nullable columns on `audit_chain_events` (sig columns)

## Deferred items

The following are scaffolded but inert by default:

- **HSM custody** — `HsmStubCustody` throws `NotConfigured` unless `KEY_CUSTODY_BACKEND=hsm-stub` (see `adr-hsm-custody.md`)
- **`did:webvh` history log** — writer exists behind `DID_WEBVH_LOG=on` (default: `off`, see `adr-webvh.md`)
- **Federated trust** — `FederatedTrustBridge` always returns `untrusted` (see `adr-federated-trust.md`)
