# ADR: HSM Key Custody Activation

## Status: Deferred (scaffolded, inert by default)

## Context

The current key custody backend (`software-encrypted`) stores encrypted key
material in Postgres. For production deployments requiring FIPS 140-3 Level 3+
key protection, an HSM or cloud KMS backend is needed.

The `HsmStubCustody` class in `lib/key-custody.ts` implements the
`KeyCustodyProvider` interface and throws `NotConfigured` on every operation.
It is never selected unless `KEY_CUSTODY_BACKEND=hsm-stub` is set explicitly.

## Activation path

1. Implement a concrete `HsmCustody` class that wraps your HSM SDK.
2. Add it to the `getKeyCustodyProvider()` switch in `key-custody.ts`.
3. Set `KEY_CUSTODY_BACKEND=hsm` (or your chosen name) in env.
4. Update this ADR to `Status: Active`.

## What you need to implement

```typescript
class HsmCustody implements KeyCustodyProvider {
  async bootstrap(did: string): Promise<KeyMetadata> { /* generate key in HSM */ }
  async getSigner(did: string): Promise<{ signer: HybridSigner; meta: KeyMetadata }> { /* ... */ }
  async sign(did: string, bytes: Uint8Array): Promise<SignResult> { /* HSM sign */ }
  async rotateKey(did: string): Promise<KeyMetadata> { /* rotate in HSM */ }
  async revokeKey(did: string, reason: string): Promise<void> { /* ... */ }
  async listKeys(did: string): Promise<KeyMetadata[]> { /* ... */ }
  async getActiveKeyMeta(did: string): Promise<KeyMetadata | null> { /* ... */ }
}
```

The public key material must still be stored in `platform_keys` for the resolver.
Only the private key wrapping changes.
