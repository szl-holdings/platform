export * from './profiles/index.js';
export * from './registry.js';
export * from './schema.js';

import {
  aegisSecurityIncident,
  carlotaPrivateAdvisory,
  lyteGovernanceOps,
  prismLegalMatter,
  terraRealEstateIntel,
  vesselsMartitimeRisk,
} from './profiles/index.js';
import { ProfileRegistry } from './registry.js';

export {
  aegisSecurityIncident as aegisSecurityIncidentProfile,
  carlotaPrivateAdvisory as carlotaPrivateAdvisoryProfile,
  lyteGovernanceOps as lyteGovernanceOpsProfile,
  prismLegalMatter as prismLegalMatterProfile,
  terraRealEstateIntel as terraRealEstateIntelProfile,
  vesselsMartitimeRisk as vesselsMaritime_RiskProfile,
} from './profiles/index.js';

export function createDefaultProfileRegistry(): ProfileRegistry {
  const registry = new ProfileRegistry();

  registry.register(vesselsMartitimeRisk);
  registry.register(lyteGovernanceOps);
  registry.register(terraRealEstateIntel);
  registry.register(aegisSecurityIncident);
  registry.register(prismLegalMatter);
  registry.register(carlotaPrivateAdvisory);

  return registry;
}

export const AEF_DOMAIN_PROFILES_VERSION = '1.0.0' as const;
