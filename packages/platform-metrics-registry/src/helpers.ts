import { PLATFORM_FACTS } from './registry.js';
import type { PlatformFacts } from './schema.js';

/**
 * Docs consumption helpers.
 * These are safe to import in documentation generation scripts.
 */

export function getArtifactCount(facts: PlatformFacts = PLATFORM_FACTS): number {
  return facts.structural.activeArtifactCount;
}

export function getPackageCount(facts: PlatformFacts = PLATFORM_FACTS): number {
  return facts.structural.packageCount + facts.structural.libCount;
}

export function getDomainPackCount(facts: PlatformFacts = PLATFORM_FACTS): number {
  return facts.runtime.domainPackCount;
}

export function getDbTableCount(facts: PlatformFacts = PLATFORM_FACTS): number {
  return facts.schema.dbTableCount;
}

export function getRbacRoleCount(facts: PlatformFacts = PLATFORM_FACTS): number {
  return facts.runtime.rbacRoleCount;
}

export function getV1EndpointCount(facts: PlatformFacts = PLATFORM_FACTS): number {
  return facts.api.v1EndpointCount;
}

export function getPlatformVersion(facts: PlatformFacts = PLATFORM_FACTS): string {
  return facts.curated.platformVersion;
}

export function getAiProviders(facts: PlatformFacts = PLATFORM_FACTS): string[] {
  return facts.curated.aiProviders;
}

/**
 * Render a formatted platform summary string suitable for use in documentation.
 */
export function formatPlatformSummary(facts: PlatformFacts = PLATFORM_FACTS): string {
  return [
    `Platform: ${facts.curated.platformName} (${facts.curated.platformCodename} v${facts.curated.platformVersion})`,
    `Active applications: ${facts.structural.activeArtifactCount}`,
    `Packages: ${facts.structural.packageCount} domain + ${facts.structural.libCount} shared lib`,
    `Domain packs: ${facts.runtime.domainPackCount}`,
    `Database tables: ${facts.schema.dbTableCount}`,
    `RBAC roles: ${facts.runtime.rbacRoleCount}`,
    `AI providers: ${facts.curated.aiProviders.join(', ')}`,
    `Last audit: ${facts.curated.lastAuditDate}`,
  ].join('\n');
}

/**
 * Render a machine-readable JSON summary for API endpoints and health checks.
 */
export function toHealthPayload(facts: PlatformFacts = PLATFORM_FACTS) {
  return {
    platform: facts.curated.platformName,
    codename: facts.curated.platformCodename,
    version: facts.curated.platformVersion,
    generatedAt: facts.generatedAt,
    counts: {
      artifacts: facts.structural.activeArtifactCount,
      packages: facts.structural.packageCount,
      libPackages: facts.structural.libCount,
      domainPacks: facts.runtime.domainPackCount,
      dbTables: facts.schema.dbTableCount,
      rbacRoles: facts.runtime.rbacRoleCount,
      v1Endpoints: facts.api.v1EndpointCount,
      agentRoles: facts.runtime.agentRoleCount,
      starterWorkflows: facts.runtime.starterWorkflowCount,
    },
  };
}
