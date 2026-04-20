export * from "./schema.js";
export * from "./registry.js";
export * from "./profiles/index.js";

import { ProfileRegistry } from "./registry.js";
import { 
  lyteGovernanceOps, 
  vesselsMartitimeRisk, 
  terraRealEstateIntel, 
  aegisSecurityIncident, 
  prismLegalMatter, 
  carlotaPrivateAdvisory 
} from "./profiles/index.js";

export { vesselsMartitimeRisk as vesselsMaritime_RiskProfile } from "./profiles/index.js";
export { lyteGovernanceOps as lyteGovernanceOpsProfile } from "./profiles/index.js";
export { terraRealEstateIntel as terraRealEstateIntelProfile } from "./profiles/index.js";
export { aegisSecurityIncident as aegisSecurityIncidentProfile } from "./profiles/index.js";
export { prismLegalMatter as prismLegalMatterProfile } from "./profiles/index.js";
export { carlotaPrivateAdvisory as carlotaPrivateAdvisoryProfile } from "./profiles/index.js";

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

export const AEF_DOMAIN_PROFILES_VERSION = "1.0.0" as const;
