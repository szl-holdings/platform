export { terraSuite } from "./terra.js";
export { prismCounselSuite } from "./prism-counsel.js";
export { vesselsSuite } from "./vessels.js";
export { aegisSuite } from "./aegis.js";
export { lyteSuite } from "./lyte.js";
export { carlotaJoSuite } from "./carlota-jo.js";
export { imperiumSuite } from "./imperium.js";

import { terraSuite } from "./terra.js";
import { prismCounselSuite } from "./prism-counsel.js";
import { vesselsSuite } from "./vessels.js";
import { aegisSuite } from "./aegis.js";
import { lyteSuite } from "./lyte.js";
import { carlotaJoSuite } from "./carlota-jo.js";
import { imperiumSuite } from "./imperium.js";
import type { EvalSuiteDef } from "../runtime.js";

export const ALL_SUITES: EvalSuiteDef[] = [
  terraSuite,
  prismCounselSuite,
  vesselsSuite,
  aegisSuite,
  lyteSuite,
  carlotaJoSuite,
  imperiumSuite,
];

export const SUITE_BY_ID: Record<string, EvalSuiteDef> = Object.fromEntries(
  ALL_SUITES.map((s) => [s.suiteId, s]),
);

export const SUITE_BY_DOMAIN: Record<string, EvalSuiteDef[]> = {};
for (const suite of ALL_SUITES) {
  const arr = SUITE_BY_DOMAIN[suite.domain] ?? [];
  arr.push(suite);
  SUITE_BY_DOMAIN[suite.domain] = arr;
}
