# ADR: Federated Trust Bridge

## Status: Deferred (scaffolded, inert by default)

## Context

Cross-organization DID-based mutual authentication and cross-CA trust federation
require a `FederatedTrustBridge` that can evaluate external DIDs and certificates
against a set of trusted certificate authorities.

The `NoOpFederatedTrustBridge` in `lib/federated-trust-bridge.ts` always returns
`{ trusted: false, reason: 'no_federation_configured' }` and is **never invoked
on the hot path**.

## Activation path

1. Implement the `FederatedTrustBridge` interface.
2. Call `registerFederatedTrustBridge(new MyBridge())` at startup.
3. Wire the bridge into the M2M auth resolver so external DIDs can be validated.
4. Update this ADR to `Status: Active`.

## Interface

```typescript
interface FederatedTrustBridge {
  checkExternalDid(did: string): Promise<{ trusted: boolean; reason: string; trustDomain?: string }>;
  checkExternalCert(thumbprint: string, issuer: string): Promise<{ trusted: boolean; reason: string; trustDomain?: string }>;
}
```

## Security note

The no-op bridge guarantees that external DIDs are NEVER trusted by default.
This is the correct fail-closed behavior for v1.
