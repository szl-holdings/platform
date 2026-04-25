export { SEED_SIGNALS } from './seedSignals';
export { SEED_OUTCOMES } from './seedOutcomes';
export { SEED_POLICIES } from './seedPolicies';
export { SEED_PROOF_PACKETS } from './seedProofPackets';

import { SEED_SIGNALS } from './seedSignals';
import { SEED_OUTCOMES } from './seedOutcomes';
import { SEED_POLICIES } from './seedPolicies';
import { SEED_PROOF_PACKETS } from './seedProofPackets';

export interface SeedSummary {
  signals: number;
  outcomes: number;
  policies: number;
  proofPackets: number;
  verticals: string[];
  seededAt: string;
}

export function getSeedSummary(): SeedSummary {
  const verticals = [...new Set(SEED_SIGNALS.map(s => s.vertical))];
  return {
    signals: SEED_SIGNALS.length,
    outcomes: SEED_OUTCOMES.length,
    policies: SEED_POLICIES.length,
    proofPackets: SEED_PROOF_PACKETS.length,
    verticals,
    seededAt: new Date().toISOString(),
  };
}
