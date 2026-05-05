# Key Custody Service

## Purpose

The key custody service provides an abstraction for all signing key lifecycle
operations (generate, store, rotate, revoke, sign). **No caller accesses private
key material directly** — all signing goes through the `KeyCustodyProvider` interface.

## Envelope encryption

Private keys are encrypted at rest using AES-256-GCM with a KEK (Key Encryption Key):

1. A new key pair is generated (`generateHybridKeyPair()` — Ed25519 + ML-DSA-65).
2. Each private key is hex-encoded then encrypted with `encryptSecret()` (AES-256-GCM).
3. The ciphertext is stored in `platform_keys.ed25519_secret_key_enc` / `mldsa65_secret_key_enc`.
4. On retrieval, `decryptSecret()` unwraps the ciphertext, yielding raw key bytes.

The KEK is derived from `SECRET_ENCRYPTION_KEY` or `SESSION_SECRET` (via scrypt).
Setting `KEK` in env explicitly will use that value directly in a future iteration.

## Storage backend swap

The `PlatformKeysTable` is the current storage backend. To swap to HSM/KMS:
1. Implement the `KeyCustodyProvider` interface.
2. Register it in `getKeyCustodyProvider()`.
3. Set `KEY_CUSTODY_BACKEND=<new-backend>` in env.

No callers need to change.

## HSM stub

`HsmStubCustody` implements the interface but throws `NotConfigured` on every
operation. It is selected via `KEY_CUSTODY_BACKEND=hsm-stub`. This is strictly
for forward-compatibility testing — never use it in production without a real
HSM connector behind it.

See `adr-hsm-custody.md` for the full activation path.

## Key rotation

Each rotation creates a new row in `platform_keys` with incremented `key_version`
and sets the old row as `is_active=false`. The `platform_dids.active_key_id` is
updated to point to the new key ID.

Rotation is idempotent at the row level — if a key for the same DID+version already
exists, the insert is skipped.

## Security considerations

- Private keys never leave memory unencrypted.
- The KEK is sourced from env (not hardcoded). It must be rotated via standard
  secret rotation procedures documented in `docs/SECRETS_POLICY.md`.
- All key operations are logged at `info` level with key ID and DID, but never
  with private key material.
