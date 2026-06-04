export { aegisSecurityIncident } from './aegis-security-incident.js';
export { carlotaPrivateAdvisory } from './carlota-private-advisory.js';
export { lyteGovernanceOps } from './lyte-governance-ops.js';
export { prismLegalMatter } from './prism-legal-matter.js';
export { terraRealEstateIntel } from './terra-real-estate-intel.js';
export {
  vesselsMartitimeRisk,
  vesselsMartitimeRisk as vesselsMaritimeRisk,
} from './vessels-maritime-risk.js';

import type { DomainProfile } from '../schema.js';
import { aegisSecurityIncident } from './aegis-security-incident.js';
import { carlotaPrivateAdvisory } from './carlota-private-advisory.js';
import { lyteGovernanceOps } from './lyte-governance-ops.js';
import { prismLegalMatter } from './prism-legal-matter.js';
import { terraRealEstateIntel } from './terra-real-estate-intel.js';
import { vesselsMartitimeRisk } from './vessels-maritime-risk.js';

export const ALL_DOMAIN_PROFILES: DomainProfile[] = [
  lyteGovernanceOps,
  vesselsMartitimeRisk,
  terraRealEstateIntel,
  aegisSecurityIncident,
  prismLegalMatter,
  carlotaPrivateAdvisory,
];
