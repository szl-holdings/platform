import { type ClaimTruthValue, PUBLIC_CLAIMS } from './public-claims.js';

export type { ClaimTruthValue };

export interface ClaimValue {
  key: string;
  namespace: string;
  value: string;
  truthValue: ClaimTruthValue;
  displayLabel: string | null;
}

export function makeClaimResolver(namespace: string) {
  return function resolveClaim(key: string, defaultValue: string): ClaimValue {
    const registered = PUBLIC_CLAIMS.find((c) => c.id === key);
    return {
      key,
      namespace,
      value: registered?.claim ?? defaultValue,
      truthValue: registered?.truthValue ?? 'demo-data',
      displayLabel: registered?.displayLabel ?? null,
    };
  };
}

export function metricDisplay(claim: ClaimValue): string {
  if (!claim.displayLabel) return claim.value;
  return `${claim.value} ${claim.displayLabel}`;
}
