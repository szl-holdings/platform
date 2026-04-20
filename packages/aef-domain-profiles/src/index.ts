export * from "./types.js";
export * from "./registry.js";
export { vesselsMaritime_Risk as vesselsMaritime_RiskProfile } from "./profiles/vessels-maritime-risk.js";
export { lyteGovernanceOps as lyteGovernanceOpsProfile } from "./profiles/lyte-governance-ops.js";
export { terraRealEstateIntel as terraRealEstateIntelProfile } from "./profiles/terra-real-estate-intel.js";
export { aegisSecurityIncident as aegisSecurityIncidentProfile } from "./profiles/aegis-security-incident.js";
export { prismLegalMatter as prismLegalMatterProfile } from "./profiles/prism-legal-matter.js";
export { carlotaPrivateAdvisory as carlotaPrivateAdvisoryProfile } from "./profiles/carlota-private-advisory.js";

import { ProfileRegistry } from "./registry.js";
import { vesselsMaritime_Risk } from "./profiles/vessels-maritime-risk.js";
import { lyteGovernanceOps } from "./profiles/lyte-governance-ops.js";
import { terraRealEstateIntel } from "./profiles/terra-real-estate-intel.js";
import { aegisSecurityIncident } from "./profiles/aegis-security-incident.js";
import { prismLegalMatter } from "./profiles/prism-legal-matter.js";
import { carlotaPrivateAdvisory } from "./profiles/carlota-private-advisory.js";

export function createDefaultProfileRegistry(): ProfileRegistry {
  const registry = new ProfileRegistry();

  registry.register(vesselsMaritime_Risk);
  registry.register(lyteGovernanceOps);
  registry.register(terraRealEstateIntel);
  registry.register(aegisSecurityIncident);
  registry.register(prismLegalMatter);
  registry.register(carlotaPrivateAdvisory);

  return registry;
}

export const AEF_DOMAIN_PROFILES_VERSION = "0.1.0" as const;
