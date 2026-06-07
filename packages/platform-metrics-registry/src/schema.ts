import { z } from 'zod';

/**
 * Typed schema for all platform facts.
 *
 * Structural facts are introspected from the filesystem at generation time.
 * Curated facts are maintained in overrides.json and represent public-facing numbers.
 */
export const StructuralFactsSchema = z.object({
  artifactCount: z
    .number()
    .int()
    .nonnegative()
    .describe('Total registered artifacts (active + archived)'),
  activeArtifactCount: z
    .number()
    .int()
    .nonnegative()
    .describe('Artifacts with a registered workflow'),
  packageCount: z.number().int().nonnegative().describe('packages/ directory entry count'),
  libCount: z.number().int().nonnegative().describe('lib/ directory entry count'),
  workerCount: z.number().int().nonnegative().describe('workers/ directory entry count'),
  serviceCount: z.number().int().nonnegative().describe('services/ directory entry count'),
  appCount: z.number().int().nonnegative().describe('apps/ directory entry count'),
  scriptCount: z.number().int().nonnegative().describe('scripts/ top-level file count'),
});
export type StructuralFacts = z.infer<typeof StructuralFactsSchema>;

export const SchemaFactsSchema = z.object({
  dbTableCount: z
    .number()
    .int()
    .nonnegative()
    .describe('Total database table definitions (Drizzle pgTable calls)'),
  dbSchemaFileCount: z.number().int().nonnegative().describe('lib/db/src/schema/ file count'),
  dbSchemaDomainCount: z.number().int().nonnegative().describe('Distinct schema domain prefixes'),
});
export type SchemaFacts = z.infer<typeof SchemaFactsSchema>;

export const ApiFactsSchema = z.object({
  apiRouteGroupCount: z.number().int().nonnegative().describe('Express route groups in api-server'),
  v1EndpointCount: z.number().int().nonnegative().describe('AEEP /v1/ endpoint count (current)'),
  v1EndpointTarget: z.number().int().nonnegative().describe('AEEP /v1/ endpoint count (target)'),
});
export type ApiFacts = z.infer<typeof ApiFactsSchema>;

export const RuntimeFactsSchema = z.object({
  domainPackCount: z
    .number()
    .int()
    .nonnegative()
    .describe('Domain pack count (Lyte/Vessels/Terra/Aegis/PRISM/Carlota)'),
  agentRoleCount: z.number().int().nonnegative().describe('Typed role contracts'),
  cognitiveLoopPhaseCount: z.number().int().nonnegative().describe('Cognitive loop phase count'),
  starterWorkflowCount: z.number().int().nonnegative().describe('Starter workflow definitions'),
  rbacRoleCount: z.number().int().nonnegative().describe('RBAC role count (platform_role enum)'),
  embeddingBackendCount: z
    .number()
    .int()
    .nonnegative()
    .describe('Embedding backend implementations'),
  memoryTierCount: z
    .number()
    .int()
    .nonnegative()
    .describe('Memory tier count (working/episodic/semantic/governance)'),
});
export type RuntimeFacts = z.infer<typeof RuntimeFactsSchema>;

export const DeploymentFactsSchema = z.object({
  deploymentTargets: z.array(z.string()).describe('Replit deployment target options'),
  primaryRegion: z.string().optional().describe('Primary deployment region'),
});
export type DeploymentFacts = z.infer<typeof DeploymentFactsSchema>;

export const CuratedFactsSchema = z.object({
  platformVersion: z.string().describe('Current platform semver'),
  platformName: z.string().describe('Platform canonical name'),
  platformCodename: z.string().describe('AEEP codename'),
  foundedYear: z.number().int().describe('Company founding year'),
  lastAuditDate: z.string().describe('ISO date of last comprehensive audit'),
  authProviders: z.array(z.string()).describe('Supported authentication providers'),
  aiProviders: z.array(z.string()).describe('Supported AI inference providers'),
  externalDataSources: z.array(z.string()).describe('External data source integrations'),
});
export type CuratedFacts = z.infer<typeof CuratedFactsSchema>;

export const PlatformFactsSchema = z.object({
  generatedAt: z.string().describe('ISO timestamp of last generation'),
  generatedBy: z.literal('generate-platform-metrics').describe('Generation script identifier'),
  structural: StructuralFactsSchema,
  schema: SchemaFactsSchema,
  api: ApiFactsSchema,
  runtime: RuntimeFactsSchema,
  deployment: DeploymentFactsSchema,
  curated: CuratedFactsSchema,
});
export type PlatformFacts = z.infer<typeof PlatformFactsSchema>;
