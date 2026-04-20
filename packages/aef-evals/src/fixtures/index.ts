export { maritimeFixtures } from "./maritime.js";
export { legalFixtures } from "./legal.js";
export { realEstateFixtures } from "./real-estate.js";
export { cyberFixtures } from "./cyber.js";
export { complianceFixtures } from "./compliance.js";
export { advisoryFixtures } from "./advisory.js";

import type { GoldenFixtureSet } from "../types.js";
import { maritimeFixtures } from "./maritime.js";
import { legalFixtures } from "./legal.js";
import { realEstateFixtures } from "./real-estate.js";
import { cyberFixtures } from "./cyber.js";
import { complianceFixtures } from "./compliance.js";
import { advisoryFixtures } from "./advisory.js";

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
