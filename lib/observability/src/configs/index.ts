export { vesselsConfig } from "./vessels.js";
export { firestormConfig } from "./firestorm.js";
export { incaConfig } from "./inca.js";
export { dreamscapeConfig } from "./dreamscape.js";
export { carlotaJoConfig } from "./carlota-jo.js";
export { szlHoldingsConfig } from "./szl-holdings.js";
export { readinessReportConfig } from "./readiness-report.js";
export { stephenSiteConfig } from "./stephen-site.js";
export { lyteCommandCenterConfig } from "./lyte-command-center.js";
export { mspConfig } from "./msp.js";
export { terraConfig } from "./terra.js";

import type { DomainConfig } from "../types.js";
import { vesselsConfig } from "./vessels.js";
import { firestormConfig } from "./firestorm.js";
import { incaConfig } from "./inca.js";
import { dreamscapeConfig } from "./dreamscape.js";
import { carlotaJoConfig } from "./carlota-jo.js";
import { szlHoldingsConfig } from "./szl-holdings.js";
import { readinessReportConfig } from "./readiness-report.js";
import { stephenSiteConfig } from "./stephen-site.js";
import { lyteCommandCenterConfig } from "./lyte-command-center.js";
import { mspConfig } from "./msp.js";
import { terraConfig } from "./terra.js";

export const ALL_CONFIGS: DomainConfig[] = [
  vesselsConfig,
  firestormConfig,
  incaConfig,
  dreamscapeConfig,
  carlotaJoConfig,
  szlHoldingsConfig,
  readinessReportConfig,
  stephenSiteConfig,
  lyteCommandCenterConfig,
  mspConfig,
  terraConfig,
];

export function getConfigBySlug(slug: string): DomainConfig | undefined {
  return ALL_CONFIGS.find((c) => c.appSlug === slug);
}
