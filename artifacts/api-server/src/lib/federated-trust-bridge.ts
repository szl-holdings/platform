/**
 * FederatedTrustBridge — deferred scaffolding for cross-CA trust federation.
 *
 * This interface is inert by default (always returns `untrusted`). It is
 * NEVER invoked on the hot path. Activation requires a future task.
 * See docs/internal/identity/adr-federated-trust.md for the activation path.
 *
 * The bridge is registered via `registerFederatedTrustBridge()` and can be
 * swapped in at runtime (e.g., in tests or when the feature is enabled).
 */

export interface FederatedTrustBridgeResult {
  trusted: boolean;
  reason: string;
  trustDomain?: string;
}

export interface FederatedTrustBridge {
  /** Check whether a DID from an external CA is trusted by the platform. */
  checkExternalDid(did: string): Promise<FederatedTrustBridgeResult>;
  /** Check whether a certificate thumbprint from an external issuer is trusted. */
  checkExternalCert(thumbprint: string, issuer: string): Promise<FederatedTrustBridgeResult>;
}

class NoOpFederatedTrustBridge implements FederatedTrustBridge {
  async checkExternalDid(_did: string): Promise<FederatedTrustBridgeResult> {
    return { trusted: false, reason: 'no_federation_configured' };
  }
  async checkExternalCert(_thumbprint: string, _issuer: string): Promise<FederatedTrustBridgeResult> {
    return { trusted: false, reason: 'no_federation_configured' };
  }
}

let _bridge: FederatedTrustBridge = new NoOpFederatedTrustBridge();

export function getFederatedTrustBridge(): FederatedTrustBridge {
  return _bridge;
}

export function registerFederatedTrustBridge(bridge: FederatedTrustBridge): void {
  _bridge = bridge;
}

export function resetFederatedTrustBridge(): void {
  _bridge = new NoOpFederatedTrustBridge();
}
