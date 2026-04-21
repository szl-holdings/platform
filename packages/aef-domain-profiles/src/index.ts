export * from './profiles/index.js';
export * from './registry.js';
export * from './schema.js';

import { DomainProfileRegistry } from './registry.js';
import {
  aegisSecurityIncident,
  carlotaPrivateAdvisory,
  lyteGovernanceOps,
  prismLegalMatter,
  terraRealEstateIntel,
  vesselsMartitimeRisk,
} from './profiles/index.js';

export {
  aegisSecurityIncident as aegisSecurityIncidentProfile,
  carlotaPrivateAdvisory as carlotaPrivateAdvisoryProfile,
  lyteGovernanceOps as lyteGovernanceOpsProfile,
  prismLegalMatter as prismLegalMatterProfile,
  terraRealEstateIntel as terraRealEstateIntelProfile,
  vesselsMartitimeRisk as vesselsMaritime_RiskProfile,
} from './profiles/index.js';

export function createDefaultProfileRegistry(): DomainProfileRegistry {
  const registry = new DomainProfileRegistry([]);

  registry.registerProfile(vesselsMartitimeRisk);
  registry.registerProfile(lyteGovernanceOps);
  registry.registerProfile(terraRealEstateIntel);
  registry.registerProfile(aegisSecurityIncident);
  registry.registerProfile(prismLegalMatter);
  registry.registerProfile(carlotaPrivateAdvisory);

  return registry;
}

export const AEF_DOMAIN_PROFILES_VERSION = '1.0.0' as const;
