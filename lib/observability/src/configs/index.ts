export { carlotaJoConfig } from './carlota-jo.js';
export { dreamscapeConfig } from './dreamscape.js';
export { firestormConfig } from './firestorm.js';
export { incaConfig } from './inca.js';
export { lyteCommandCenterConfig } from './lyte-command-center.js';
export { mspConfig } from './msp.js';
export { readinessReportConfig } from './readiness-report.js';
export { szlHoldingsConfig } from './szl-holdings.js';
export { terraConfig } from './terra.js';
export { vesselsConfig } from './vessels.js';

import type { DomainConfig } from '../types.js';
import { carlotaJoConfig } from './carlota-jo.js';
import { dreamscapeConfig } from './dreamscape.js';
import { firestormConfig } from './firestorm.js';
import { incaConfig } from './inca.js';
import { lyteCommandCenterConfig } from './lyte-command-center.js';
import { mspConfig } from './msp.js';
import { readinessReportConfig } from './readiness-report.js';
import { szlHoldingsConfig } from './szl-holdings.js';
import { terraConfig } from './terra.js';
import { vesselsConfig } from './vessels.js';

export const ALL_CONFIGS: DomainConfig[] = [
  vesselsConfig,
  firestormConfig,
  incaConfig,
  dreamscapeConfig,
  carlotaJoConfig,
  szlHoldingsConfig,
  readinessReportConfig,
  lyteCommandCenterConfig,
  mspConfig,
  terraConfig,
];

export function getConfigBySlug(slug: string): DomainConfig | undefined {
  return ALL_CONFIGS.find((c) => c.appSlug === slug);
}
