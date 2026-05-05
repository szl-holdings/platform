import type { SigningMode } from '../types.js';

export interface PQCIdentityConfig {
  signingMode: SigningMode;
  minimumVerificationLevel: SigningMode;
  certValidityMs: number;
  caIssuerName: string;
  enableTransparencyLog: boolean;
  didWebDomain?: string;
}

const DEFAULT_CONFIG: PQCIdentityConfig = {
  signingMode: 'hybrid',
  minimumVerificationLevel: 'classical-only',
  certValidityMs: 365 * 24 * 60 * 60 * 1000,
  caIssuerName: 'SZL Holdings Root CA v1',
  enableTransparencyLog: true,
};

let _config: PQCIdentityConfig = { ...DEFAULT_CONFIG };

export function getPQCConfig(): PQCIdentityConfig {
  return { ..._config };
}

export function setPQCConfig(partial: Partial<PQCIdentityConfig>): void {
  _config = { ..._config, ...partial };
}

export function getSigningMode(): SigningMode {
  const envMode = process.env.SZL_SIGNING_MODE;
  if (envMode === 'hybrid' || envMode === 'classical-only' || envMode === 'pqc-only') {
    return envMode;
  }
  return _config.signingMode;
}

export function getMinimumVerificationLevel(): SigningMode {
  return _config.minimumVerificationLevel;
}
