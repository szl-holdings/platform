export { advisoryFixtures } from './advisory.js';
export { AEGIS_GOLDEN_QUERIES, AEGIS_MOCK_CORPUS } from './aegis.js';
export { CARLOTA_GOLDEN_QUERIES, CARLOTA_MOCK_CORPUS } from './carlota.js';
export { complianceFixtures } from './compliance.js';
export { cyberFixtures } from './cyber.js';
export { legalFixtures } from './legal.js';
export { LYTE_GOLDEN_QUERIES, LYTE_MOCK_CORPUS } from './lyte.js';
// Backward compatibility aliases
export { maritimeFixtures } from './maritime.js';
export { PRISM_GOLDEN_QUERIES, PRISM_MOCK_CORPUS } from './prism.js';
export { realEstateFixtures } from './real-estate.js';
export { TERRA_GOLDEN_QUERIES, TERRA_MOCK_CORPUS } from './terra.js';
export { VESSELS_GOLDEN_QUERIES, VESSELS_MOCK_CORPUS } from './vessels.js';

import type { AEFDomain } from '@workspace/cf-domain-profiles/schema';
import type { GoldenQuery } from '../metrics.js';
import type { GoldenFixtureSet } from '../types.js';
import { advisoryFixtures } from './advisory.js';
import { AEGIS_GOLDEN_QUERIES, AEGIS_MOCK_CORPUS } from './aegis.js';
import { CARLOTA_GOLDEN_QUERIES, CARLOTA_MOCK_CORPUS } from './carlota.js';
import { complianceFixtures } from './compliance.js';
import { cyberFixtures } from './cyber.js';
import { legalFixtures } from './legal.js';
import { LYTE_GOLDEN_QUERIES, LYTE_MOCK_CORPUS } from './lyte.js';
import { maritimeFixtures } from './maritime.js';
import { PRISM_GOLDEN_QUERIES, PRISM_MOCK_CORPUS } from './prism.js';
import { realEstateFixtures } from './real-estate.js';
import { TERRA_GOLDEN_QUERIES, TERRA_MOCK_CORPUS } from './terra.js';
import { VESSELS_GOLDEN_QUERIES, VESSELS_MOCK_CORPUS } from './vessels.js';

export const ALL_GOLDEN_QUERIES: Record<AEFDomain, GoldenQuery[]> = {
  lyte_governance_ops: LYTE_GOLDEN_QUERIES,
  vessels_maritime_risk: VESSELS_GOLDEN_QUERIES,
  terra_real_estate_intel: TERRA_GOLDEN_QUERIES,
  aegis_security_incident: AEGIS_GOLDEN_QUERIES,
  prism_legal_matter: PRISM_GOLDEN_QUERIES,
  carlota_private_advisory: CARLOTA_GOLDEN_QUERIES,
};

export const ALL_MOCK_CORPORA: Record<
  AEFDomain,
  Map<string, { text: string; boostTerms: string[] }>
> = {
  lyte_governance_ops: LYTE_MOCK_CORPUS,
  vessels_maritime_risk: VESSELS_MOCK_CORPUS,
  terra_real_estate_intel: TERRA_MOCK_CORPUS,
  aegis_security_incident: AEGIS_MOCK_CORPUS,
  prism_legal_matter: PRISM_MOCK_CORPUS,
  carlota_private_advisory: CARLOTA_MOCK_CORPUS,
};

export const ALL_FIXTURE_SETS: GoldenFixtureSet[] = [
  maritimeFixtures,
  legalFixtures,
  realEstateFixtures,
  cyberFixtures,
  complianceFixtures,
  advisoryFixtures,
];

export function getFixtureSet(profileId: string): GoldenFixtureSet | undefined {
  return ALL_FIXTURE_SETS.find((f) => f.profileId === profileId);
}
