# Audit Chain Hybrid Signatures

## What changed

Starting with migration 0051, every new `audit_chain_events` row carries:

| Column | Description |
|--------|-------------|
| `ed25519_sig` | Ed25519 signature (hex) over canonical payload |
| `mldsa65_sig` | ML-DSA-65 (Dilithium) signature (hex) over canonical payload |
| `signing_did` | The `did:plat:*` DID of the signing actor |
| `key_id` | The specific key ID used (from `platform_keys`) |
| `scheme_version` | Always `hybrid-v1` for now |
| `sig_public_key_ed25519` | Ed25519 public key (hex) — embedded for offline verification |
| `sig_public_key_mldsa65` | ML-DSA-65 public key (hex) — embedded for offline verification |

All columns are nullable. Legacy rows (pre-migration) have `NULL` for all signature
columns and are classified as `legacy_unsigned` — not as failures.

## Canonical payload

The signature covers a deterministic JSON serialization:

```json
{
  "prevHash": "...",
  "action": "...",
  "actor": "...",
  "domain": "...",
  "actionType": "...",
  "entityId": "...",
  "createdAt": "2026-05-05T00:00:00.000Z",
  "signingDid": "did:plat:platform_service:szl-api-server"
}
```

Fields are in a fixed order. Any mutation of any field invalidates both signatures.

## Signature classification

`GET /audit-chain/verify` returns a chain summary:

```json
{
  "intact": true,
  "chainLength": 1500,
  "brokenAt": null,
  "summary": {
    "hybrid_verified": 250,
    "legacy_unsigned": 1250,
    "broken": 0
  }
}
```

- `hybrid_verified` — both Ed25519 + ML-DSA-65 signatures valid
- `legacy_unsigned` — no signature (predates migration 0051)
- `broken` — hash chain tampered OR signature present but invalid

## Tamper detection

Mutating any byte of the canonical payload fields (action, actor, domain, etc.)
or of the signature hex strings causes the verifier to reclassify the row as
`broken` with a specific reason (`hash_mismatch`, `ed25519_invalid`, `mldsa65_invalid`,
`both_signatures_invalid`).

## Rollout flag

See `rollout.md` for the staged `warn` → `enforce` deployment path.
