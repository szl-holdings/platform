import { randomUUID } from 'node:crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendCreated, sendNotFound, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import {
  type Project, type Experiment, type Model, type Insight,
  type AssetTwin, type ThreatTwin, type ExposureTwin,
  type IncidentReadiness, type ActionQueueItem,
  type ThreatActor, type IndicatorTimeline, type ContainmentWorkflow,
  type CyberAsset, type SentraTwinIncident, type ControlDrift,
  type Hunt, type RemediationPlan, type RedTeamScenario,
  type PqcStandard, type MigrationPhase, type EcosystemStatus,
  type TrustAnchor, type CapabilityCompartment, type SupplyChainComponent,
  type ComputeTier, type RoutingDecision, type ResearchSignal,
  type ResearchDomain,
  projectsStore, experimentsStore, modelsStore, insightsStore,
  assetTwinsStore, threatTwinsStore, exposureTwinsStore,
  incidentReadinessStore, actionQueueStore,
  threatActorsStore, indicatorsStore, containmentWorkflowsStore,
  cyberAssetsStore, sentraTwinIncidentsStore, controlDriftsStore,
  huntsStore, remediationPlansStore, redTeamScenariosStore,
  pqcStandardsStore, migrationPhasesStore, ecosystemStatusStore,
  trustAnchorsStore, compartmentsStore, supplyChainStore,
  computeTiersStore, routingDecisionsStore, researchSignalsStore,
  researchDomainsStore, cyberAiReposStore,
  agentRuntimesStore, mcpServersStore, meshSecretsStore,
  meshExposuresStore, meshContainmentRulesStore, gatewayEventsStore,
  meshDriftSnapshotsStore, meshResilienceStore,
  complianceFrameworksStore, rbacRolesStore, auditLogEntriesStore,
  retentionPoliciesStore, policyTemplatesStore,
  type Vulnerability, type ComplianceRisk, type VendorRisk, type ZeroTrustPillar,
  vulnerabilitiesStore, complianceRisksStore, vendorRisksStore, zeroTrustPillarsStore,
  type ArenaArchitect, type ArenaEngagement, type ArenaSubmission,
  arenaArchitectsStore, arenaEngagementsStore, arenaSubmissionsStore,
  type HuntFleetAgent, type SimulationRun,
  huntFleetStore, simulationRunsStore,
  type EvidenceRecord,
  evidenceRecordsStore,
  type CrisisScenarioRecord,
  crisisScenarioStore,
  type MicrosystemIntegrityRecord, type PhotonicSensorNode,
  type ThreatHorizonVector, type BioSubstrateAsset,
  microsystemIntegrityStore, photonicSensorStore,
  threatHorizonStore, bioSubstrateStore,
  storeToArray, generateId, itemSource,
} from '../services/sentra-domain-stores';

const router: IRouter = Router();

function crudRoutes<T extends { id: string }>(
  basePath: string,
  store: Map<string, T>,
  resourceName: string,
  collectionKey: string,
  createSchema: z.ZodType<Omit<T, 'id'>>,
  patchSchema: z.ZodType<Partial<Omit<T, 'id'>>>,
  idPrefix: string,
) {
  router.get(basePath, (_req: Request, res: Response) => {
    try {
      const items = storeToArray(store);
      sendSuccess(res, { [collectionKey]: items.map(i => ({ ...i, source: itemSource(i.id) })) });
    } catch (err) { handleRouteError(res, err, `Failed to list ${resourceName}`); }
  });

  router.get(`${basePath}/:id`, (req: Request, res: Response) => {
    try {
      const item = store.get(req.params.id as string);
      if (!item) { sendNotFound(res, resourceName); return; }
      sendSuccess(res, { ...item, source: itemSource(item.id) });
    } catch (err) { handleRouteError(res, err, `Failed to get ${resourceName}`); }
  });

  router.post(basePath, validateBody(createSchema), (req: Request, res: Response) => {
    try {
      const validated = createSchema.parse(req.body) as Omit<T, 'id'>;
      const id = generateId(idPrefix);
      const item: T = { ...validated, id } as T;
      store.set(id, item);
      sendCreated(res, { ...item, source: 'live' });
    } catch (err) { handleRouteError(res, err, `Failed to create ${resourceName}`); }
  });

  router.patch(`${basePath}/:id`, validateBody(patchSchema), (req: Request, res: Response) => {
    try {
      const existing = store.get(req.params.id as string);
      if (!existing) { sendNotFound(res, resourceName); return; }
      const validated = patchSchema.parse(req.body) as Partial<Omit<T, 'id'>>;
      const patched: T = { ...existing, ...validated };
      store.set(existing.id, patched);
      sendSuccess(res, { ...patched, source: itemSource(existing.id) });
    } catch (err) { handleRouteError(res, err, `Failed to update ${resourceName}`); }
  });

  router.delete(`${basePath}/:id`, (req: Request, res: Response) => {
    try {
      if (!store.has(req.params.id as string)) { sendNotFound(res, resourceName); return; }
      store.delete(req.params.id as string);
      sendSuccess(res, { deleted: true });
    } catch (err) { handleRouteError(res, err, `Failed to delete ${resourceName}`); }
  });
}

const projectCreateSchema = z.object({
  name: z.string().min(1).max(200),
  status: z.enum(['research', 'development', 'testing', 'deployed']).default('research'),
  domain: z.string().min(1).max(100),
  description: z.string().max(2000).default(''),
  accuracy: z.number().min(0).max(100).default(0),
  loss: z.number().min(0).default(0),
  inferenceTime: z.number().min(0).default(0),
  progress: z.number().min(0).max(100).default(0),
  team: z.array(z.object({ avatar: z.string() })).default([]),
  updatedAt: z.string().default(() => new Date().toISOString()),
  startDate: z.string().default(() => new Date().toISOString()),
});
const projectPatchSchema = projectCreateSchema.partial();
crudRoutes('/sentra/research/projects', projectsStore, 'Project', 'projects', projectCreateSchema, projectPatchSchema, 'proj');

const experimentCreateSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(200),
  status: z.enum(['running', 'completed', 'failed', 'queued']).default('queued'),
  hypothesis: z.string().max(2000).default(''),
  results: z.string().max(2000).default(''),
  duration: z.string().max(50).default('—'),
  startDate: z.string().default(() => new Date().toISOString()),
  metrics: z.array(z.object({ epoch: z.number(), loss: z.number(), accuracy: z.number(), valAccuracy: z.number().optional() })).default([]),
  hyperparameters: z.record(z.union([z.string(), z.number()])).default({}),
});
const experimentPatchSchema = experimentCreateSchema.partial();
crudRoutes('/sentra/research/experiments', experimentsStore, 'Experiment', 'experiments', experimentCreateSchema, experimentPatchSchema, 'exp');

const modelCreateSchema = z.object({
  name: z.string().min(1).max(200),
  projectId: z.string().min(1),
  status: z.enum(['production', 'staging', 'training', 'archived']).default('training'),
  architecture: z.string().max(200).default(''),
  version: z.string().max(50).default('0.1.0'),
  parameters: z.string().max(50).default(''),
  accuracy: z.number().min(0).max(100).default(0),
  speed: z.number().min(0).default(0),
  cost: z.number().min(0).default(0),
  performanceHistory: z.array(z.object({ date: z.string(), accuracy: z.number(), latency: z.number() })).default([]),
});
const modelPatchSchema = modelCreateSchema.partial();
crudRoutes('/sentra/research/models', modelsStore, 'Model', 'models', modelCreateSchema, modelPatchSchema, 'mdl');

const insightCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).default(''),
  category: z.enum(['success', 'warning', 'trend', 'discovery']).default('discovery'),
  impact: z.enum(['high', 'medium', 'low']).default('medium'),
  confidence: z.number().min(0).max(100).default(50),
  sourceExperiment: z.string().max(200).default(''),
  date: z.string().default(() => new Date().toISOString()),
});
const insightPatchSchema = insightCreateSchema.partial();
crudRoutes('/sentra/research/insights', insightsStore, 'Insight', 'insights', insightCreateSchema, insightPatchSchema, 'ins');

router.get('/sentra/research/health', (_req: Request, res: Response) => {
  try {
    const projects = storeToArray(projectsStore);
    const models = storeToArray(modelsStore);
    const experiments = storeToArray(experimentsStore);
    const deployedCount = projects.filter(p => p.status === 'deployed').length;
    const completedExps = experiments.filter(e => e.status === 'completed').length;
    const productionModels = models.filter(m => m.status === 'production').length;
    const avgAccuracy = models.length > 0 ? models.reduce((sum, m) => sum + m.accuracy, 0) / models.length : 0;
    const score = Math.round(deployedCount * 15 + completedExps * 10 + productionModels * 20 + avgAccuracy * 0.4);
    sendSuccess(res, { score, deployedCount, completedExps, productionModels, avgAccuracy: Math.round(avgAccuracy * 10) / 10 });
  } catch (err) { handleRouteError(res, err, 'Failed to compute research health'); }
});

const assetTwinCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['server', 'endpoint', 'cloud_resource', 'network_device', 'application', 'identity', 'ot_ics']),
  criticality: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  owner: z.string().max(200).default(''),
  environment: z.enum(['production', 'staging', 'dev', 'corp']).default('production'),
  exposureLevel: z.enum(['none', 'minimal', 'moderate', 'elevated', 'critical']).default('none'),
  vulnerabilityCount: z.number().int().min(0).default(0),
  criticalVulnCount: z.number().int().min(0).default(0),
  patchStatus: z.enum(['current', 'behind', 'critical_missing']).default('current'),
  lastSeenAt: z.string().default(() => new Date().toISOString()),
  complianceFrameworks: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  anomalyFlags: z.array(z.string()).default([]),
});
const assetTwinPatchSchema = assetTwinCreateSchema.partial();
crudRoutes('/sentra/threat-twin/assets', assetTwinsStore, 'AssetTwin', 'assets', assetTwinCreateSchema, assetTwinPatchSchema, 'asset');

const threatTwinCreateSchema = z.object({
  title: z.string().min(1).max(500),
  type: z.string().min(1).max(100),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['open', 'investigating', 'contained', 'remediated', 'closed', 'false_positive']).default('open'),
  confidence: z.number().min(0).max(100).default(50),
  affectedAssets: z.array(z.string()).default([]),
  affectedAssetCount: z.number().int().min(0).default(0),
  sourceIndicators: z.array(z.string()).default([]),
  mitreTactics: z.array(z.string()).default([]),
  mitreTechniques: z.array(z.string()).default([]),
  killChainStage: z.string().default('reconnaissance'),
  detectedAt: z.string().default(() => new Date().toISOString()),
  lastActivityAt: z.string().default(() => new Date().toISOString()),
  assignedTo: z.string().optional(),
  responseState: z.string().default('no_action'),
  readinessImpact: z.enum(['ready', 'partial', 'degraded', 'not_ready']).default('ready'),
});
const threatTwinPatchSchema = threatTwinCreateSchema.partial();
crudRoutes('/sentra/threat-twin/threats', threatTwinsStore, 'ThreatTwin', 'threats', threatTwinCreateSchema, threatTwinPatchSchema, 'threat');

const exposureTwinCreateSchema = z.object({
  name: z.string().min(1).max(500),
  type: z.string().min(1).max(100),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).default('medium'),
  exposureLevel: z.enum(['none', 'minimal', 'moderate', 'elevated', 'critical']).default('none'),
  affectedAssetCount: z.number().int().min(0).default(0),
  affectedAssets: z.array(z.string()).default([]),
  cvssScore: z.number().min(0).max(10).optional(),
  cveIds: z.array(z.string()).optional(),
  description: z.string().max(2000).default(''),
  remediationStatus: z.enum(['open', 'in_progress', 'patched', 'risk_accepted', 'false_positive']).default('open'),
  dueDate: z.string().optional(),
  owner: z.string().optional(),
  complianceImpact: z.array(z.string()).default([]),
  riskScore: z.number().min(0).max(100).default(0),
  lastUpdatedAt: z.string().default(() => new Date().toISOString()),
});
const exposureTwinPatchSchema = exposureTwinCreateSchema.partial();
crudRoutes('/sentra/threat-twin/exposures', exposureTwinsStore, 'ExposureTwin', 'exposures', exposureTwinCreateSchema, exposureTwinPatchSchema, 'exp');

const readinessCreateSchema = z.object({
  area: z.enum(['detection', 'response', 'recovery', 'communication', 'governance']),
  label: z.string().min(1).max(200),
  status: z.enum(['ready', 'partial', 'degraded', 'not_ready']).default('not_ready'),
  score: z.number().min(0).max(100).default(0),
  lastTestedAt: z.string().optional(),
  issues: z.array(z.string()).default([]),
  pendingActions: z.number().int().min(0).default(0),
});
const readinessPatchSchema = readinessCreateSchema.partial();
crudRoutes('/sentra/threat-twin/readiness', incidentReadinessStore, 'IncidentReadiness', 'readiness', readinessCreateSchema, readinessPatchSchema, 'read');

const actionCreateSchema = z.object({
  threatId: z.string().optional(),
  exposureId: z.string().optional(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).default(''),
  type: z.enum(['containment', 'remediation', 'investigation', 'governance', 'communication']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['open', 'in_progress', 'blocked', 'completed']).default('open'),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  blocker: z.string().optional(),
});
const actionPatchSchema = actionCreateSchema.partial();
crudRoutes('/sentra/threat-twin/actions', actionQueueStore, 'ActionQueueItem', 'actions', actionCreateSchema, actionPatchSchema, 'act');

const actorCreateSchema = z.object({
  name: z.string().min(1).max(200),
  alias: z.string().max(200).default(''),
  affiliation: z.string().max(200).default(''),
  motivation: z.string().max(500).default(''),
  description: z.string().max(2000).default(''),
  ttps: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
  lastActivityAt: z.string().default(() => new Date().toISOString()),
});
const actorPatchSchema = actorCreateSchema.partial();
crudRoutes('/sentra/threat-twin/actors', threatActorsStore, 'ThreatActor', 'actors', actorCreateSchema, actorPatchSchema, 'actor');

const indicatorCreateSchema = z.object({
  value: z.string().min(1).max(500),
  type: z.enum(['ip', 'domain', 'hash']),
  tlp: z.enum(['white', 'green', 'amber', 'red']).default('amber'),
  firstSeenAt: z.string().default(() => new Date().toISOString()),
  lastSeenAt: z.string().default(() => new Date().toISOString()),
  description: z.string().max(1000).default(''),
});
const indicatorPatchSchema = indicatorCreateSchema.partial();
crudRoutes('/sentra/threat-twin/indicators', indicatorsStore, 'Indicator', 'indicators', indicatorCreateSchema, indicatorPatchSchema, 'ioc');

const cwfCreateSchema = z.object({
  title: z.string().min(1).max(500),
  steps: z.array(z.object({ action: z.string(), target: z.string(), description: z.string() })).default([]),
  recommendedAt: z.string().default(() => new Date().toISOString()),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});
const cwfPatchSchema = cwfCreateSchema.partial();
crudRoutes('/sentra/threat-twin/containment-workflows', containmentWorkflowsStore, 'ContainmentWorkflow', 'workflows', cwfCreateSchema, cwfPatchSchema, 'wf');

router.get('/sentra/threat-twin/summary', (_req: Request, res: Response) => {
  try {
    const assets = storeToArray(assetTwinsStore);
    const threats = storeToArray(threatTwinsStore);
    const exposures = storeToArray(exposureTwinsStore);
    const readiness = storeToArray(incidentReadinessStore);
    const actions = storeToArray(actionQueueStore);
    const avgReadiness = readiness.length > 0 ? Math.round(readiness.reduce((s, r) => s + r.score, 0) / readiness.length) : 0;
    sendSuccess(res, {
      totalAssets: assets.length,
      criticalAssets: assets.filter(a => a.criticality === 'critical').length,
      activeThreats: threats.filter(t => ['open', 'investigating'].includes(t.status)).length,
      criticalExposures: exposures.filter(e => e.severity === 'critical').length,
      avgReadinessScore: avgReadiness,
      openActions: actions.filter(a => a.status === 'open').length,
    });
  } catch (err) { handleRouteError(res, err, 'Failed to compute threat twin summary'); }
});

const cyberAssetCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['OT', 'IT', 'IoT']),
  criticality: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  exposureScore: z.number().min(0).max(100).default(0),
  backupStatus: z.enum(['current', 'stale', 'none']).default('none'),
  lastBackupAt: z.string().optional(),
  controlGaps: z.array(z.string()).default([]),
  status: z.enum(['active', 'compromised', 'isolated']).default('active'),
});
const cyberAssetPatchSchema = cyberAssetCreateSchema.partial();
crudRoutes('/sentra/cyber-twin/assets', cyberAssetsStore, 'CyberAsset', 'assets', cyberAssetCreateSchema, cyberAssetPatchSchema, 'casset');

const twinIncidentCreateSchema = z.object({
  title: z.string().min(1).max(500),
  severity: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  status: z.enum(['active', 'contained', 'resolved']).default('active'),
  mitreStage: z.string().max(200).default(''),
  detectedAt: z.string().default(() => new Date().toISOString()),
  description: z.string().max(2000).default(''),
  affectedAssets: z.array(z.string()).default([]),
});
const twinIncidentPatchSchema = twinIncidentCreateSchema.partial();
crudRoutes('/sentra/cyber-twin/incidents', sentraTwinIncidentsStore, 'TwinIncident', 'incidents', twinIncidentCreateSchema, twinIncidentPatchSchema, 'INC');

const controlDriftCreateSchema = z.object({
  family: z.enum(['Identify', 'Protect', 'Detect', 'Respond', 'Recover']),
  control: z.string().min(1).max(200),
  status: z.enum(['compliant', 'drift_detected', 'remediation_pending']).default('compliant'),
  evidence: z.string().max(2000).default(''),
});
const controlDriftPatchSchema = controlDriftCreateSchema.partial();
crudRoutes('/sentra/cyber-twin/control-drifts', controlDriftsStore, 'ControlDrift', 'controlDrifts', controlDriftCreateSchema, controlDriftPatchSchema, 'cd');

router.get('/sentra/cyber-twin/posture', (_req: Request, res: Response) => {
  try {
    const assets = storeToArray(cyberAssetsStore);
    const incidents = storeToArray(sentraTwinIncidentsStore);
    const drifts = storeToArray(controlDriftsStore);
    const compromised = assets.filter(a => a.status === 'compromised').length;
    const driftsDetected = drifts.filter(d => d.status === 'drift_detected').length;
    const recoveryPosture = assets.length > 0 ? Math.round((1 - compromised / assets.length) * 100) : 100;
    const financialExposure = compromised * 700000;
    sendSuccess(res, { recoveryPosture, financialExposure, totalAssets: assets.length, compromised, activeIncidents: incidents.filter(i => i.status === 'active').length, driftsDetected });
  } catch (err) { handleRouteError(res, err, 'Failed to compute cyber twin posture'); }
});

const huntCreateSchema = z.object({
  title: z.string().min(1).max(500),
  hypothesis: z.string().max(2000).default(''),
  reasoning: z.string().max(2000).default(''),
  proposedAt: z.string().default(() => new Date().toISOString()),
  mitreTactics: z.array(z.string()).default([]),
  mitreIds: z.array(z.string()).default([]),
  falsePositiveRate: z.number().min(0).max(1).default(0),
  confidenceScore: z.number().min(0).max(1).default(0.5),
  signalCount: z.number().int().min(0).default(0),
  severity: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  status: z.enum(['proposed', 'active', 'completed', 'dismissed']).default('proposed'),
  attackPath: z.object({
    nodes: z.array(z.object({ id: z.string(), label: z.string(), type: z.string(), domain: z.string(), risk: z.string(), description: z.string(), businessLabel: z.string().optional(), costAtRisk: z.number().optional() })).default([]),
    edges: z.array(z.object({ from: z.string(), to: z.string(), technique: z.string(), mitreId: z.string(), confidence: z.number() })).default([]),
    blastRadiusCost: z.number().default(0),
    affectedBusinessEntities: z.array(z.string()).default([]),
  }).default({ nodes: [], edges: [], blastRadiusCost: 0, affectedBusinessEntities: [] }),
});
const huntPatchSchema = z.object({
  status: z.enum(['proposed', 'active', 'completed', 'dismissed']).optional(),
  title: z.string().min(1).max(500).optional(),
  hypothesis: z.string().max(2000).optional(),
  reasoning: z.string().max(2000).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
});
crudRoutes('/sentra/hunt-data/hunts', huntsStore, 'Hunt', 'hunts', huntCreateSchema, huntPatchSchema, 'hunt');

const remPlanCreateSchema = z.object({
  huntId: z.string().min(1),
  huntTitle: z.string().max(500).default(''),
  draftedAt: z.string().default(() => new Date().toISOString()),
  status: z.enum(['draft', 'approved', 'executing', 'complete', 'cancelled']).default('draft'),
  steps: z.array(z.object({
    id: z.string().default(() => randomUUID().slice(0, 12)),
    order: z.number().int(),
    action: z.string(),
    target: z.string(),
    rationale: z.string().default(''),
    estimatedMinutes: z.number().int().min(0).default(0),
    reversible: z.boolean().default(true),
    requiredApproval: z.boolean().default(false),
    status: z.enum(['pending', 'approved', 'executing', 'done', 'skipped']).default('pending'),
  })).default([]),
  estimatedTotalMinutes: z.number().int().min(0).default(0),
  blastRadiusCost: z.number().min(0).default(0),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  signalsBroadcast: z.array(z.string()).default([]),
});
const remPlanPatchSchema = z.object({
  status: z.enum(['draft', 'approved', 'executing', 'complete', 'cancelled']).optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
});
crudRoutes('/sentra/hunt-data/remediation-plans', remediationPlansStore, 'RemediationPlan', 'plans', remPlanCreateSchema, remPlanPatchSchema, 'rem');

const rtScenarioCreateSchema = z.object({
  name: z.string().min(1).max(500),
  category: z.enum(['ransomware', 'supply_chain', 'insider']),
  severity: z.enum(['critical', 'high', 'medium']).default('medium'),
  description: z.string().max(2000).default(''),
  objective: z.string().max(2000).default(''),
  mitreChain: z.array(z.object({ id: z.string(), name: z.string(), phase: z.string() })).default([]),
  estimatedImpact: z.string().max(500).default(''),
  estimatedCost: z.number().min(0).default(0),
  durationMinutes: z.number().int().min(0).default(30),
  lastRunAt: z.string().optional(),
  runCount: z.number().int().min(0).default(0),
  coverageGaps: z.array(z.string()).default([]),
});
const rtScenarioPatchSchema = rtScenarioCreateSchema.partial();
crudRoutes('/sentra/hunt-data/red-team-scenarios', redTeamScenariosStore, 'RedTeamScenario', 'scenarios', rtScenarioCreateSchema, rtScenarioPatchSchema, 'rt');

const pqcCreateSchema = z.object({
  fips: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  formerly: z.string().max(100).default(''),
  purpose: z.string().max(200).default(''),
  basis: z.string().max(200).default(''),
  securityLevels: z.array(z.string()).default([]),
  status: z.enum(['deployed', 'in-progress', 'planned', 'not-started']).default('not-started'),
  deployedIn: z.array(z.string()).default([]),
  planned: z.array(z.string()).default([]),
});
const pqcPatchSchema = pqcCreateSchema.partial();
crudRoutes('/sentra/pqc/standards', pqcStandardsStore, 'PqcStandard', 'standards', pqcCreateSchema, pqcPatchSchema, 'pqc');

const migrationPhaseCreateSchema = z.object({
  phase: z.string().min(1).max(200),
  status: z.enum(['deployed', 'in-progress', 'planned', 'not-started']).default('not-started'),
  tasks: z.array(z.string()).default([]),
});
const migrationPhasePatchSchema = migrationPhaseCreateSchema.partial();
crudRoutes('/sentra/pqc/migration-phases', migrationPhasesStore, 'MigrationPhase', 'phases', migrationPhaseCreateSchema, migrationPhasePatchSchema, 'phase');

const ecoCreateSchema = z.object({
  system: z.string().min(1).max(200),
  current: z.string().max(200).default(''),
  target: z.string().max(200).default(''),
  status: z.enum(['deployed', 'in-progress', 'planned', 'not-started']).default('not-started'),
});
const ecoPatchSchema = ecoCreateSchema.partial();
crudRoutes('/sentra/pqc/ecosystem', ecosystemStatusStore, 'EcosystemStatus', 'ecosystem', ecoCreateSchema, ecoPatchSchema, 'eco');

router.get('/sentra/pqc/readiness-score', (_req: Request, res: Response) => {
  try {
    const eco = storeToArray(ecosystemStatusStore);
    const deployed = eco.filter(e => e.status === 'deployed').length;
    const inProgress = eco.filter(e => e.status === 'in-progress').length;
    const total = eco.length || 1;
    const score = Math.round(((deployed * 1 + inProgress * 0.5) / total) * 100);
    sendSuccess(res, { score, deployed, inProgress, total: eco.length });
  } catch (err) { handleRouteError(res, err, 'Failed to compute PQC readiness score'); }
});

const trustAnchorCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['hsm', 'tpm', 'enclave', 'puf', 'dielet']),
  status: z.enum(['verified', 'provisioned', 'pending', 'quarantined']).default('pending'),
  darpaProgram: z.string().max(200).default(''),
  integrityScore: z.number().min(0).max(100).default(0),
  lastAttestation: z.string().default(() => new Date().toISOString()),
  description: z.string().max(2000).default(''),
});
const trustAnchorPatchSchema = trustAnchorCreateSchema.partial();
crudRoutes('/sentra/hardware-trust/anchors', trustAnchorsStore, 'TrustAnchor', 'anchors', trustAnchorCreateSchema, trustAnchorPatchSchema, 'TA');

const compartmentCreateSchema = z.object({
  workcell: z.string().min(1).max(200),
  permissions: z.array(z.string()).default([]),
  isolationLevel: z.enum(['hardware', 'process', 'namespace']).default('process'),
  cheriEnforced: z.boolean().default(false),
  memoryBounds: z.object({ base: z.string(), length: z.string() }).default({ base: '0x0', length: '0 MB' }),
  lastAudit: z.string().default(() => new Date().toISOString()),
});
const compartmentPatchSchema = compartmentCreateSchema.partial();
crudRoutes('/sentra/hardware-trust/compartments', compartmentsStore, 'Compartment', 'compartments', compartmentCreateSchema, compartmentPatchSchema, 'CC');

const supplyChainCreateSchema = z.object({
  name: z.string().min(1).max(200),
  vendor: z.string().max(200).default(''),
  type: z.enum(['silicon', 'firmware', 'fpga', 'chiplet', 'pcb']),
  attestationStatus: z.enum(['attested', 'pending', 'failed']).default('pending'),
  shieldDielet: z.boolean().default(false),
  thzInspected: z.boolean().default(false),
  provenance: z.string().max(500).default(''),
});
const supplyChainPatchSchema = supplyChainCreateSchema.partial();
crudRoutes('/sentra/hardware-trust/supply-chain', supplyChainStore, 'SupplyChainComponent', 'components', supplyChainCreateSchema, supplyChainPatchSchema, 'SC');

router.get('/sentra/hardware-trust/summary', (_req: Request, res: Response) => {
  try {
    const anchors = storeToArray(trustAnchorsStore);
    const comps = storeToArray(compartmentsStore);
    const supply = storeToArray(supplyChainStore);
    const verified = anchors.filter(a => a.status === 'verified').length;
    const avgIntegrity = anchors.length > 0 ? Math.round(anchors.reduce((s, a) => s + a.integrityScore, 0) / anchors.length * 10) / 10 : 0;
    const cheriCount = comps.filter(c => c.cheriEnforced).length;
    const attested = supply.filter(s => s.attestationStatus === 'attested').length;
    sendSuccess(res, { verifiedAnchors: verified, totalAnchors: anchors.length, avgIntegrity, cheriCompartments: cheriCount, attestedComponents: attested, totalComponents: supply.length });
  } catch (err) { handleRouteError(res, err, 'Failed to compute hardware trust summary'); }
});

const tierCreateSchema = z.object({
  label: z.string().min(1).max(200),
  classification: z.enum(['baseline', 'production', 'experimental']).default('baseline'),
  hardware: z.string().max(200).default(''),
  latencyP50Ms: z.number().min(0).default(0),
  latencyP99Ms: z.number().min(0).default(0),
  throughputQps: z.number().min(0).default(0),
  energyMjPerInference: z.number().min(0).default(0),
  costPer1MTokens: z.number().min(0).default(0),
  routableWorkloads: z.array(z.string()).default([]),
  notes: z.string().max(1000).default(''),
});
const tierPatchSchema = tierCreateSchema.partial();
crudRoutes('/sentra/photonic/tiers', computeTiersStore, 'ComputeTier', 'tiers', tierCreateSchema, tierPatchSchema, 'tier');

const routingDecisionCreateSchema = z.object({
  workload: z.string().min(1).max(500),
  selectedTier: z.string().min(1),
  reason: z.string().max(500).default(''),
  fellBackFrom: z.string().optional(),
  latencyMs: z.number().min(0).default(0),
  ts: z.string().default(() => new Date().toISOString()),
});
const routingDecisionPatchSchema = routingDecisionCreateSchema.partial();
crudRoutes('/sentra/photonic/routing-decisions', routingDecisionsStore, 'RoutingDecision', 'decisions', routingDecisionCreateSchema, routingDecisionPatchSchema, 'RD');

const researchSignalCreateSchema = z.object({
  source: z.string().min(1).max(200),
  venue: z.string().max(200).default(''),
  year: z.number().int().min(1900).max(2100).default(2024),
  claim: z.string().max(2000).default(''),
  programLink: z.string().max(200).default(''),
  trl: z.number().int().min(0).max(9).default(1),
});
const researchSignalPatchSchema = researchSignalCreateSchema.partial();
crudRoutes('/sentra/photonic/research-signals', researchSignalsStore, 'ResearchSignal', 'signals', researchSignalCreateSchema, researchSignalPatchSchema, 'sig');

router.get('/sentra/photonic/summary', (_req: Request, res: Response) => {
  try {
    const tiers = storeToArray(computeTiersStore);
    const decisions = storeToArray(routingDecisionsStore);
    const photonic = tiers.find(t => t.classification === 'experimental');
    const gpu = tiers.find(t => t.classification === 'production');
    const speedup = photonic && gpu ? Math.round(gpu.latencyP50Ms / photonic.latencyP50Ms) : 0;
    const energyReduction = photonic && gpu ? Math.round((gpu.energyMjPerInference / photonic.energyMjPerInference) * 10) / 10 : 0;
    const photonicShare = decisions.length > 0 ? Math.round((decisions.filter(d => d.selectedTier === 'photonic-experimental').length / decisions.length) * 100) : 0;
    sendSuccess(res, { speedup, energyReduction, photonicShare, totalTiers: tiers.length, totalDecisions: decisions.length });
  } catch (err) { handleRouteError(res, err, 'Failed to compute photonic summary'); }
});

const domainCreateSchema = z.object({
  title: z.string().min(1).max(500),
  darpaProgram: z.string().max(200).default(''),
  programManager: z.string().optional(),
  status: z.enum(['incubation', 'active', 'reference']).default('incubation'),
  cyberApplication: z.string().max(1000).default(''),
  description: z.string().max(2000).default(''),
  keyBreakthroughs: z.array(z.string()).default([]),
  topRepos: z.array(z.object({ name: z.string(), org: z.string(), stars: z.string().optional(), tech: z.string() })).default([]),
  topPapers: z.array(z.object({ title: z.string(), venue: z.string(), year: z.number() })).default([]),
  a11oyIntegration: z.string().max(2000).default(''),
  trl: z.number().int().min(0).max(9).default(1),
});
const domainPatchSchema = domainCreateSchema.partial();
crudRoutes('/sentra/darpa-mto/domains', researchDomainsStore, 'ResearchDomain', 'domains', domainCreateSchema, domainPatchSchema, 'domain');

const repoCreateSchema = z.object({
  name: z.string().min(1).max(200),
  org: z.string().min(1).max(200),
  stars: z.string().max(50).default(''),
  desc: z.string().max(500).default(''),
  license: z.string().max(50).default(''),
});
const repoPatchSchema = repoCreateSchema.partial();
crudRoutes('/sentra/darpa-mto/cyber-ai-repos', cyberAiReposStore, 'CyberAiRepo', 'repos', repoCreateSchema, repoPatchSchema, 'repo');

router.get('/sentra/darpa-mto/summary', (_req: Request, res: Response) => {
  try {
    const domains = storeToArray(researchDomainsStore);
    const active = domains.filter(d => d.status === 'active').length;
    const incubation = domains.filter(d => d.status === 'incubation').length;
    const avgTrl = domains.length > 0 ? Math.round(domains.reduce((s, d) => s + d.trl, 0) / domains.length * 10) / 10 : 0;
    sendSuccess(res, { totalDomains: domains.length, active, incubation, avgTrl, totalRepos: cyberAiReposStore.size });
  } catch (err) { handleRouteError(res, err, 'Failed to compute DARPA MTO summary'); }
});

const runtimeCreateSchema = z.object({
  name: z.string().min(1).max(200),
  version: z.string().min(1).max(50),
  sourceRegistry: z.string().max(200).default(''),
  lastSeen: z.string().default(() => new Date().toISOString()),
  trustState: z.enum(['trusted', 'unverified', 'quarantined']).default('unverified'),
  configFiles: z.array(z.string()).default([]),
  activeAgentIds: z.array(z.string()).default([]),
});
const runtimePatchSchema = runtimeCreateSchema.partial();
crudRoutes('/sentra/agent-mesh/runtimes', agentRuntimesStore, 'AgentRuntime', 'runtimes', runtimeCreateSchema, runtimePatchSchema, 'rt');

const mcpServerCreateSchema = z.object({
  name: z.string().min(1).max(200),
  packageRef: z.string().min(1).max(300),
  version: z.string().min(1).max(50),
  pinned: z.boolean().default(false),
  sourceRegistry: z.string().max(200).default('registry.npmjs.org'),
  lastSeen: z.string().default(() => new Date().toISOString()),
  trustState: z.enum(['trusted', 'unverified', 'quarantined']).default('unverified'),
  runtimeIds: z.array(z.string()).default([]),
  allowedEgressDomains: z.array(z.string()).default([]),
  detectedEgressDomains: z.array(z.string()).default([]),
});
const mcpServerPatchSchema = mcpServerCreateSchema.partial();
crudRoutes('/sentra/agent-mesh/mcp-servers', mcpServersStore, 'McpServer', 'mcpServers', mcpServerCreateSchema, mcpServerPatchSchema, 'mcp');

const meshSecretCreateSchema = z.object({
  label: z.string().min(1).max(200),
  format: z.enum(['github-pat', 'api-key', 'oauth-token', 'env-var']),
  foundInFile: z.string().max(500).default(''),
  entropy: z.number().min(0).max(10).default(0),
  reachableByAgentIds: z.array(z.string()).default([]),
  reachableByMcpIds: z.array(z.string()).default([]),
  lastDetectedAt: z.string().default(() => new Date().toISOString()),
});
const meshSecretPatchSchema = meshSecretCreateSchema.partial();
crudRoutes('/sentra/agent-mesh/secrets', meshSecretsStore, 'MeshSecret', 'secrets', meshSecretCreateSchema, meshSecretPatchSchema, 'secret');

const meshExposureCreateSchema = z.object({
  title: z.string().min(1).max(500),
  severity: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  affectedAgentIds: z.array(z.string()).default([]),
  affectedSecretIds: z.array(z.string()).default([]),
  affectedMcpIds: z.array(z.string()).default([]),
  explanation: z.string().max(2000).default(''),
  owaspCategory: z.string().max(200).default(''),
  owaspRef: z.string().max(200).default(''),
  cveRefs: z.array(z.string()).default([]),
  detectedAt: z.string().default(() => new Date().toISOString()),
  fixType: z.enum(['rotate-secret', 'pin-version', 'scope-token', 'revoke-agent', 'quarantine-server']),
  fixLabel: z.string().max(500).default(''),
  proofHash: z.string().max(100).default(''),
  status: z.enum(['open', 'fix-pending', 'resolved']).default('open'),
});
const meshExposurePatchSchema = meshExposureCreateSchema.partial();
crudRoutes('/sentra/agent-mesh/exposures', meshExposuresStore, 'MeshExposure', 'exposures', meshExposureCreateSchema, meshExposurePatchSchema, 'mesh-exp');

const containmentRuleCreateSchema = z.object({
  name: z.string().min(1).max(200),
  agentClass: z.string().min(1).max(100),
  allowedMcpServers: z.array(z.string()).default([]),
  allowedTools: z.array(z.string()).default([]),
  allowedReadPaths: z.array(z.string()).default([]),
  allowedEgressDomains: z.array(z.string()).default([]),
  tier: z.enum(['critical', 'elevated', 'standard']).default('standard'),
  violationCount: z.number().int().min(0).default(0),
  lastEvaluatedAt: z.string().default(() => new Date().toISOString()),
  enforcementMode: z.enum(['log-only', 'block', 'quarantine']).default('log-only'),
  pendingModeChange: z.object({
    requestedMode: z.enum(['log-only', 'block', 'quarantine']),
    requestedBy: z.string(),
    requestedAt: z.string(),
    guardianApprovalId: z.string(),
  }).optional(),
});
const containmentRulePatchSchema = containmentRuleCreateSchema.partial();
crudRoutes('/sentra/agent-mesh/containment-rules', meshContainmentRulesStore, 'ContainmentRule', 'rules', containmentRuleCreateSchema, containmentRulePatchSchema, 'rule');

const gatewayEventCreateSchema = z.object({
  ruleId: z.string().min(1),
  agentClass: z.string().min(1).max(100),
  mcpServerId: z.string().min(1),
  tool: z.string().min(1).max(200),
  egressDomain: z.string().max(200).optional(),
  decision: z.enum(['allowed', 'logged', 'blocked', 'quarantined']),
  reason: z.string().max(500).default(''),
  enforcementMode: z.enum(['log-only', 'block', 'quarantine']),
  linkedExposureId: z.string().optional(),
  occurredAt: z.string().default(() => new Date().toISOString()),
});
const gatewayEventPatchSchema = gatewayEventCreateSchema.partial();
crudRoutes('/sentra/agent-mesh/gateway-events', gatewayEventsStore, 'GatewayEvent', 'events', gatewayEventCreateSchema, gatewayEventPatchSchema, 'gw-evt');

const driftSnapshotCreateSchema = z.object({
  configFile: z.string().min(1).max(500),
  changedAt: z.string().default(() => new Date().toISOString()),
  changedBy: z.string().max(200).default(''),
  policyApproved: z.boolean().default(false),
  approvedBy: z.string().optional(),
  rolledBackBy: z.string().optional(),
  rolledBackAt: z.string().optional(),
  diff: z.object({ removed: z.array(z.string()), added: z.array(z.string()) }).default({ removed: [], added: [] }),
  linkedExposureIds: z.array(z.string()).default([]),
});
const driftSnapshotPatchSchema = driftSnapshotCreateSchema.partial();
crudRoutes('/sentra/agent-mesh/drift-snapshots', meshDriftSnapshotsStore, 'DriftSnapshot', 'snapshots', driftSnapshotCreateSchema, driftSnapshotPatchSchema, 'drift');

const resilienceCreateSchema = z.object({
  overall: z.number().min(0).max(100).default(0),
  grade: z.enum(['A', 'B', 'C', 'D', 'F']).default('F'),
  secretHygiene: z.number().min(0).max(100).default(0),
  permissionSurface: z.number().min(0).max(100).default(0),
  supplyChain: z.number().min(0).max(100).default(0),
  egressContainment: z.number().min(0).max(100).default(0),
  scheduleHygiene: z.number().min(0).max(100).default(0),
  instructionTamperingRisk: z.number().min(0).max(100).default(0),
  crossAgentBlastRadius: z.number().min(0).max(100).default(0),
  computedAt: z.string().default(() => new Date().toISOString()),
});
const resiliencePatchSchema = resilienceCreateSchema.partial();
crudRoutes('/sentra/agent-mesh/resilience', meshResilienceStore, 'ResilienceIndex', 'resilience', resilienceCreateSchema, resiliencePatchSchema, 'resilience');

router.get('/sentra/agent-mesh/summary', (_req: Request, res: Response) => {
  try {
    const runtimes = storeToArray(agentRuntimesStore);
    const servers = storeToArray(mcpServersStore);
    const secrets = storeToArray(meshSecretsStore);
    const exposures = storeToArray(meshExposuresStore);
    const events = storeToArray(gatewayEventsStore);
    const resilience = storeToArray(meshResilienceStore)[0] ?? null;
    sendSuccess(res, {
      totalRuntimes: runtimes.length,
      trustedRuntimes: runtimes.filter(r => r.trustState === 'trusted').length,
      quarantinedRuntimes: runtimes.filter(r => r.trustState === 'quarantined').length,
      totalMcpServers: servers.length,
      quarantinedServers: servers.filter(s => s.trustState === 'quarantined').length,
      totalSecrets: secrets.length,
      openExposures: exposures.filter(e => e.status === 'open').length,
      criticalExposures: exposures.filter(e => e.severity === 'critical').length,
      blockedEvents: events.filter(e => e.decision === 'blocked' || e.decision === 'quarantined').length,
      resilienceGrade: resilience?.grade ?? 'N/A',
      resilienceScore: resilience?.overall ?? 0,
    });
  } catch (err) { handleRouteError(res, err, 'Failed to compute agent mesh summary'); }
});

const frameworkCreateSchema = z.object({
  name: z.string().min(1).max(200),
  shortName: z.string().min(1).max(50),
  score: z.number().min(0).max(100).default(0),
  controls: z.number().int().min(0).default(0),
  implemented: z.number().int().min(0).default(0),
  status: z.string().max(100).default('Not Started'),
  families: z.array(z.object({
    id: z.string(),
    name: z.string(),
    total: z.number().int().min(0),
    implemented: z.number().int().min(0),
    score: z.number().min(0).max(100),
  })).default([]),
});
const frameworkPatchSchema = frameworkCreateSchema.partial();
crudRoutes('/sentra/compliance/frameworks', complianceFrameworksStore, 'ComplianceFramework', 'frameworks', frameworkCreateSchema, frameworkPatchSchema, 'fw');

const rbacRoleCreateSchema = z.object({
  role: z.string().min(1).max(200),
  scope: z.enum(['platform', 'tenant']).default('tenant'),
  permissions: z.array(z.string()).default([]),
  tenantIsolated: z.boolean().default(true),
});
const rbacRolePatchSchema = rbacRoleCreateSchema.partial();
crudRoutes('/sentra/governance/rbac-roles', rbacRolesStore, 'RbacRole', 'roles', rbacRoleCreateSchema, rbacRolePatchSchema, 'role');

const auditLogCreateSchema = z.object({
  action: z.string().min(1).max(200),
  actor: z.string().min(1).max(200),
  target: z.string().max(500).default(''),
  tenant: z.string().max(200).default(''),
  at: z.string().default(() => new Date().toISOString()),
  risk: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
});
const auditLogPatchSchema = auditLogCreateSchema.partial();
crudRoutes('/sentra/governance/audit-logs', auditLogEntriesStore, 'AuditLogEntry', 'entries', auditLogCreateSchema, auditLogPatchSchema, 'AL');

const retentionPolicyCreateSchema = z.object({
  type: z.string().min(1).max(200),
  retention: z.string().min(1).max(100),
  enforcement: z.string().max(500).default(''),
  status: z.enum(['active', 'draft', 'suspended']).default('draft'),
});
const retentionPolicyPatchSchema = retentionPolicyCreateSchema.partial();
crudRoutes('/sentra/governance/retention-policies', retentionPoliciesStore, 'RetentionPolicy', 'policies', retentionPolicyCreateSchema, retentionPolicyPatchSchema, 'ret');

const policyTemplateCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  scope: z.enum(['global', 'tenant']).default('tenant'),
  description: z.string().max(2000).default(''),
});
const policyTemplatePatchSchema = policyTemplateCreateSchema.partial();
crudRoutes('/sentra/governance/policy-templates', policyTemplatesStore, 'PolicyTemplate', 'templates', policyTemplateCreateSchema, policyTemplatePatchSchema, 'TPL');

router.get('/sentra/compliance/evidence/summary', (_req: Request, res: Response) => {
  try {
    const items = storeToArray(evidenceRecordsStore);
    const collected = items.filter(e => e.status === 'collected').length;
    const pending = items.filter(e => e.status === 'pending').length;
    const expired = items.filter(e => e.status === 'expired').length;
    const gaps = items.filter(e => e.status === 'gap').length;
    const byType = { log: items.filter(e => e.type === 'log').length, screenshot: items.filter(e => e.type === 'screenshot').length, config: items.filter(e => e.type === 'config').length, report: items.filter(e => e.type === 'report').length, attestation: items.filter(e => e.type === 'attestation').length };
    const byFramework: Record<string, number> = {};
    for (const e of items) byFramework[e.framework] = (byFramework[e.framework] ?? 0) + 1;
    sendSuccess(res, { totalRecords: items.length, collected, pending, expired, gaps, byType, byFramework });
  } catch (err) { handleRouteError(res, err, 'Failed to compute evidence summary'); }
});

const evidenceCreateSchema = z.object({
  title: z.string().min(1).max(500),
  framework: z.string().min(1).max(100),
  control: z.string().min(1).max(100),
  type: z.enum(['log', 'screenshot', 'config', 'report', 'attestation']),
  collectedAt: z.string().max(100).default(''),
  collectedBy: z.enum(['auto', 'manual']).default('auto'),
  status: z.enum(['collected', 'pending', 'expired', 'gap']).default('pending'),
  expiresIn: z.string().max(100).optional(),
});
const evidencePatchSchema = evidenceCreateSchema.partial();
crudRoutes('/sentra/compliance/evidence', evidenceRecordsStore, 'EvidenceRecord', 'evidence', evidenceCreateSchema, evidencePatchSchema, 'EV');

router.get('/sentra/compliance/summary', (_req: Request, res: Response) => {
  try {
    const frameworks = storeToArray(complianceFrameworksStore);
    const avgScore = frameworks.length > 0 ? Math.round(frameworks.reduce((s, f) => s + f.score, 0) / frameworks.length) : 0;
    const compliant = frameworks.filter(f => f.status === 'Compliant').length;
    const totalControls = frameworks.reduce((s, f) => s + f.controls, 0);
    const implementedControls = frameworks.reduce((s, f) => s + f.implemented, 0);
    sendSuccess(res, { totalFrameworks: frameworks.length, avgScore, compliantFrameworks: compliant, totalControls, implementedControls });
  } catch (err) { handleRouteError(res, err, 'Failed to compute compliance summary'); }
});

router.get('/sentra/governance/summary', (_req: Request, res: Response) => {
  try {
    const roles = storeToArray(rbacRolesStore);
    const auditLogs = storeToArray(auditLogEntriesStore);
    const retPolicies = storeToArray(retentionPoliciesStore);
    const templates = storeToArray(policyTemplatesStore);
    const criticalAudits = auditLogs.filter(a => a.risk === 'critical').length;
    const activePolicies = retPolicies.filter(r => r.status === 'active').length;
    sendSuccess(res, { totalRoles: roles.length, totalAuditEntries: auditLogs.length, criticalAudits, activeRetentionPolicies: activePolicies, totalRetentionPolicies: retPolicies.length, totalPolicyTemplates: templates.length });
  } catch (err) { handleRouteError(res, err, 'Failed to compute governance summary'); }
});

router.get('/sentra/vulnerabilities/summary', (_req: Request, res: Response) => {
  try {
    const vulns = storeToArray(vulnerabilitiesStore);
    const criticalOpen = vulns.filter(v => v.severity === 'critical' && v.status === 'open').length;
    const kevCount = vulns.filter(v => v.kev).length;
    const activelyExploited = vulns.filter(v => v.activelyExploited).length;
    const avgRiskScore = vulns.length > 0 ? Math.round(vulns.reduce((s, v) => s + v.riskScore, 0) / vulns.length) : 0;
    const bySeverity = { critical: vulns.filter(v => v.severity === 'critical').length, high: vulns.filter(v => v.severity === 'high').length, medium: vulns.filter(v => v.severity === 'medium').length, low: vulns.filter(v => v.severity === 'low').length };
    const byStatus = { open: vulns.filter(v => v.status === 'open').length, 'in-remediation': vulns.filter(v => v.status === 'in-remediation').length, verified: vulns.filter(v => v.status === 'verified').length, accepted: vulns.filter(v => v.status === 'accepted').length, 'false-positive': vulns.filter(v => v.status === 'false-positive').length };
    sendSuccess(res, { total: vulns.length, criticalOpen, kevExposures: kevCount, activelyExploited, avgRiskScore, bySeverity, byStatus });
  } catch (err) { handleRouteError(res, err, 'Failed to compute vulnerability summary'); }
});

const vulnCreateSchema = z.object({
  cve: z.string().min(1).max(30),
  title: z.string().min(1).max(300),
  cvss: z.number().min(0).max(10),
  epss: z.number().min(0).max(1),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  status: z.enum(['open', 'in-remediation', 'verified', 'accepted', 'false-positive']).default('open'),
  asset: z.string().min(1).max(200),
  assetCriticality: z.enum(['tier-1', 'tier-2', 'tier-3']).default('tier-2'),
  activelyExploited: z.boolean().default(false),
  assignedTo: z.string().max(100).default('Unassigned'),
  dueDate: z.string().max(30).default('—'),
  discoveredAt: z.string().max(30).default(''),
  riskScore: z.number().min(0).max(100).default(50),
  kev: z.boolean().default(false),
});
const vulnPatchSchema = vulnCreateSchema.partial();
crudRoutes('/sentra/vulnerabilities', vulnerabilitiesStore, 'Vulnerability', 'vulnerabilities', vulnCreateSchema, vulnPatchSchema, 'VL');

router.get('/sentra/compliance/risks/summary', (_req: Request, res: Response) => {
  try {
    const risks = storeToArray(complianceRisksStore);
    const bySeverity = { critical: risks.filter(r => r.severity === 'critical').length, high: risks.filter(r => r.severity === 'high').length, medium: risks.filter(r => r.severity === 'medium').length, low: risks.filter(r => r.severity === 'low').length };
    const byStatus = { open: risks.filter(r => r.status === 'open').length, mitigating: risks.filter(r => r.status === 'mitigating').length, resolved: risks.filter(r => r.status === 'resolved').length, accepted: risks.filter(r => r.status === 'accepted').length };
    sendSuccess(res, { total: risks.length, bySeverity, byStatus });
  } catch (err) { handleRouteError(res, err, 'Failed to compute compliance risk summary'); }
});

const complianceRiskCreateSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).default(''),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  likelihood: z.string().max(50).default('possible'),
  status: z.enum(['open', 'mitigating', 'resolved', 'accepted']).default('open'),
  mitigation: z.string().max(2000).default(''),
  owner: z.string().max(100).default(''),
  createdAt: z.string().max(30).default(''),
});
const complianceRiskPatchSchema = complianceRiskCreateSchema.partial();
crudRoutes('/sentra/compliance/risks', complianceRisksStore, 'ComplianceRisk', 'risks', complianceRiskCreateSchema, complianceRiskPatchSchema, 'CR');

router.get('/sentra/compliance/vendors/summary', (_req: Request, res: Response) => {
  try {
    const vendors = storeToArray(vendorRisksStore);
    const byRisk = { Low: vendors.filter(v => v.risk === 'Low').length, Medium: vendors.filter(v => v.risk === 'Medium').length, High: vendors.filter(v => v.risk === 'High').length };
    const avgScore = vendors.length > 0 ? Math.round(vendors.reduce((s, v) => s + v.securityScore, 0) / vendors.length) : 0;
    const totalIssues = vendors.reduce((s, v) => s + v.issues, 0);
    const withSoc2 = vendors.filter(v => v.soc2).length;
    const withIso27001 = vendors.filter(v => v.iso27001).length;
    sendSuccess(res, { total: vendors.length, byRisk, avgSecurityScore: avgScore, totalOpenIssues: totalIssues, withSoc2, withIso27001 });
  } catch (err) { handleRouteError(res, err, 'Failed to compute vendor risk summary'); }
});

const vendorRiskCreateSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(200).default(''),
  risk: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  tier: z.enum(['Critical', 'High', 'Medium', 'Low']).default('Medium'),
  securityScore: z.number().min(0).max(100).default(50),
  soc2: z.boolean().default(false),
  iso27001: z.boolean().default(false),
  lastAssessed: z.string().max(30).default(''),
  dataTypes: z.array(z.string()).default([]),
  issues: z.number().min(0).default(0),
});
const vendorRiskPatchSchema = vendorRiskCreateSchema.partial();
crudRoutes('/sentra/compliance/vendors', vendorRisksStore, 'VendorRisk', 'vendors', vendorRiskCreateSchema, vendorRiskPatchSchema, 'V');

router.get('/sentra/zero-trust/summary', (_req: Request, res: Response) => {
  try {
    const pillars = storeToArray(zeroTrustPillarsStore);
    const avgMaturity = pillars.length > 0 ? +(pillars.reduce((s, p) => s + p.maturity, 0) / pillars.length).toFixed(1) : 0;
    const totalActivities = pillars.reduce((s, p) => s + p.maxActivities, 0);
    const totalImplemented = pillars.reduce((s, p) => s + p.implementedActivities, 0);
    const completionPct = totalActivities > 0 ? Math.round((totalImplemented / totalActivities) * 100) : 0;
    const totalGaps = pillars.reduce((s, p) => s + p.gaps.length, 0);
    const totalQuickWins = pillars.reduce((s, p) => s + p.quickWins.length, 0);
    sendSuccess(res, { totalPillars: pillars.length, avgMaturity, totalActivities, totalImplemented, completionPct, totalGaps, totalQuickWins });
  } catch (err) { handleRouteError(res, err, 'Failed to compute zero trust summary'); }
});

const ztPillarCreateSchema = z.object({
  name: z.string().min(1).max(100),
  maturity: z.number().min(0).max(5).default(0),
  maxActivities: z.number().min(0).default(0),
  implementedActivities: z.number().min(0).default(0),
  description: z.string().max(500).default(''),
  gaps: z.array(z.string()).default([]),
  quickWins: z.array(z.string()).default([]),
});
const ztPillarPatchSchema = ztPillarCreateSchema.partial();
crudRoutes('/sentra/zero-trust/pillars', zeroTrustPillarsStore, 'ZeroTrustPillar', 'pillars', ztPillarCreateSchema, ztPillarPatchSchema, 'zt');

router.get('/sentra/hunt-data/fleet/summary', (_req: Request, res: Response) => {
  try {
    const agents = storeToArray(huntFleetStore);
    const online = agents.filter(a => a.status === 'online').length;
    const degraded = agents.filter(a => a.status === 'degraded').length;
    const offline = agents.filter(a => a.status === 'offline').length;
    const totalEventsPerSec = agents.reduce((s, a) => s + a.eventsPerSec, 0);
    const avgCpu = agents.length > 0 ? Math.round(agents.reduce((s, a) => s + a.cpuPct, 0) / agents.length) : 0;
    const avgMem = agents.length > 0 ? Math.round(agents.reduce((s, a) => s + a.memPct, 0) / agents.length) : 0;
    sendSuccess(res, { totalAgents: agents.length, online, degraded, offline, totalEventsPerSec, avgCpuPct: avgCpu, avgMemPct: avgMem });
  } catch (err) { handleRouteError(res, err, 'Failed to compute hunt fleet summary'); }
});

const fleetAgentCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['collector', 'analyzer', 'correlator', 'responder']),
  status: z.enum(['online', 'offline', 'degraded', 'maintenance']).default('offline'),
  hostname: z.string().max(200).default(''),
  lastHeartbeat: z.string().default(''),
  cpuPct: z.number().min(0).max(100).default(0),
  memPct: z.number().min(0).max(100).default(0),
  eventsPerSec: z.number().min(0).default(0),
  version: z.string().max(50).default(''),
  assignedHunts: z.array(z.string()).default([]),
});
const fleetAgentPatchSchema = fleetAgentCreateSchema.partial();
crudRoutes('/sentra/hunt-data/fleet', huntFleetStore, 'HuntFleetAgent', 'agents', fleetAgentCreateSchema, fleetAgentPatchSchema, 'agent');

router.get('/sentra/crisis-arena/simulations/summary', (_req: Request, res: Response) => {
  try {
    const runs = storeToArray(simulationRunsStore);
    const completed = runs.filter(r => r.status === 'completed').length;
    const running = runs.filter(r => r.status === 'running').length;
    const scheduled = runs.filter(r => r.status === 'scheduled').length;
    const avgScore = completed > 0 ? Math.round(runs.filter(r => r.status === 'completed').reduce((s, r) => s + r.score, 0) / completed) : 0;
    const totalFindings = runs.reduce((s, r) => s + r.findings, 0);
    const byType = { tabletop: runs.filter(r => r.type === 'tabletop').length, 'red-team': runs.filter(r => r.type === 'red-team').length, 'purple-team': runs.filter(r => r.type === 'purple-team').length, automated: runs.filter(r => r.type === 'automated').length };
    sendSuccess(res, { totalRuns: runs.length, completed, running, scheduled, avgScore, totalFindings, byType });
  } catch (err) { handleRouteError(res, err, 'Failed to compute simulation runs summary'); }
});

const simulationRunCreateSchema = z.object({
  scenarioId: z.string().min(1),
  scenarioName: z.string().min(1).max(300),
  type: z.enum(['tabletop', 'red-team', 'purple-team', 'automated']),
  status: z.enum(['scheduled', 'running', 'completed', 'failed', 'cancelled']).default('scheduled'),
  startedAt: z.string().default(''),
  completedAt: z.string().default(''),
  durationMinutes: z.number().min(0).default(0),
  score: z.number().min(0).max(100).default(0),
  findings: z.number().min(0).default(0),
  participants: z.array(z.string()).default([]),
  summary: z.string().max(2000).default(''),
});
const simulationRunPatchSchema = simulationRunCreateSchema.partial();
crudRoutes('/sentra/crisis-arena/simulations', simulationRunsStore, 'SimulationRun', 'simulations', simulationRunCreateSchema, simulationRunPatchSchema, 'sim');

router.get('/sentra/crisis-arena/leaderboard', (_req: Request, res: Response) => {
  try {
    const architects = storeToArray(arenaArchitectsStore)
      .filter(a => a.isPublic)
      .sort((a, b) => b.reputationScore - a.reputationScore)
      .map((a, i) => ({ rank: i + 1, ...a, source: itemSource(a.id) }));
    sendSuccess(res, { leaderboard: architects });
  } catch (err) { handleRouteError(res, err, 'Failed to list arena leaderboard'); }
});

router.get('/sentra/crisis-arena/summary', (_req: Request, res: Response) => {
  try {
    const architects = storeToArray(arenaArchitectsStore);
    const engagements = storeToArray(arenaEngagementsStore);
    const submissions = storeToArray(arenaSubmissionsStore);
    const totalImpactUsd = architects.reduce((s, a) => s + a.totalImpactUsd, 0);
    const totalAccepted = architects.reduce((s, a) => s + a.acceptedCount, 0);
    const openEngagements = engagements.filter(e => e.status === 'open' || e.status === 'accepting').length;
    const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
    const topArchitect = architects.sort((a, b) => b.reputationScore - a.reputationScore)[0]?.handle ?? '';
    sendSuccess(res, { totalArchitects: architects.length, totalImpactUsd, totalAccepted, openEngagements, pendingSubmissions, topArchitect, totalEngagements: engagements.length, totalSubmissions: submissions.length });
  } catch (err) { handleRouteError(res, err, 'Failed to compute crisis arena summary'); }
});

const arenaArchitectCreateSchema = z.object({
  handle: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  bio: z.string().max(500).default(''),
  reputationScore: z.number().min(0).default(0),
  acceptedCount: z.number().min(0).default(0),
  submissionCount: z.number().min(0).default(0),
  totalImpactUsd: z.number().min(0).default(0),
  badges: z.array(z.string()).default([]),
  joinedAt: z.string().default(''),
  topScenarioTitles: z.array(z.string()).default([]),
  isPublic: z.boolean().default(true),
});
const arenaArchitectPatchSchema = arenaArchitectCreateSchema.partial();
crudRoutes('/sentra/crisis-arena/architects', arenaArchitectsStore, 'ArenaArchitect', 'architects', arenaArchitectCreateSchema, arenaArchitectPatchSchema, 'arch');

const arenaEngagementCreateSchema = z.object({
  tenantId: z.string().default('tenant-default'),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  scopedAssets: z.array(z.string()).default([]),
  scopedDomains: z.array(z.string()).default([]),
  archetypeFilter: z.array(z.enum(['ransomware', 'insider', 'supply_chain', 'regulatory', 'cascade', 'black_swan'])).default([]),
  payoutPool: z.number().min(0).default(0),
  deadline: z.string().default(''),
  status: z.enum(['open', 'accepting', 'closed', 'archived']).default('open'),
  createdAt: z.string().default(''),
  updatedAt: z.string().default(''),
  submissionCount: z.number().min(0).default(0),
  acceptedCount: z.number().min(0).default(0),
});
const arenaEngagementPatchSchema = arenaEngagementCreateSchema.partial();
crudRoutes('/sentra/crisis-arena/engagements', arenaEngagementsStore, 'ArenaEngagement', 'engagements', arenaEngagementCreateSchema, arenaEngagementPatchSchema, 'eng');

const arenaSubmissionCreateSchema = z.object({
  engagementId: z.string().min(1),
  architectId: z.string().min(1),
  title: z.string().min(1).max(300),
  narrative: z.string().max(5000).default(''),
  archetype: z.enum(['ransomware', 'insider', 'supply_chain', 'regulatory', 'cascade', 'black_swan']),
  status: z.enum(['pending', 'accepted', 'duplicate', 'out_of_scope', 'rejected', 'graduated']).default('pending'),
  businessImpactScore: z.number().min(0).max(100).default(0),
  reputationAwarded: z.number().min(0).default(0),
  payoutAwarded: z.number().min(0).default(0),
  submittedAt: z.string().default(''),
  updatedAt: z.string().default(''),
});
const arenaSubmissionPatchSchema = arenaSubmissionCreateSchema.partial();
crudRoutes('/sentra/crisis-arena/submissions', arenaSubmissionsStore, 'ArenaSubmission', 'submissions', arenaSubmissionCreateSchema, arenaSubmissionPatchSchema, 'sub');

// ── Crisis Scenarios (read-only) ────────────────────────────────────────────

router.get('/sentra/crisis-scenarios', (_req: Request, res: Response) => {
  try {
    const items = storeToArray(crisisScenarioStore);
    sendSuccess(res, { scenarios: items.map(i => ({ ...i, source: itemSource(i.id) })) });
  } catch (err) { handleRouteError(res, err, 'Failed to list crisis scenarios'); }
});

// ── Microsystem Integrity ───────────────────────────────────────────────────

const mirPatchSchema = z.object({
  attestationResult: z.enum(['pass', 'fail', 'degraded', 'unavailable']).optional(),
  patchLevel: z.enum(['current', 'behind', 'critical_missing']).optional(),
  anomalyScore: z.number().min(0).max(100).optional(),
}).passthrough();

router.get('/sentra/microsystem-integrity/devices', (_req: Request, res: Response) => {
  try {
    const items = storeToArray(microsystemIntegrityStore);
    sendSuccess(res, { devices: items.map(i => ({ ...i, source: itemSource(i.id) })) });
  } catch (err) { handleRouteError(res, err, 'Failed to list microsystem devices'); }
});

router.patch('/sentra/microsystem-integrity/devices/:id', validateBody(mirPatchSchema), (req: Request, res: Response) => {
  try {
    const existing = microsystemIntegrityStore.get(req.params.id as string);
    if (!existing) { sendNotFound(res, 'MicrosystemDevice'); return; }
    const validated = mirPatchSchema.parse(req.body);
    const patched = { ...existing, ...validated };
    microsystemIntegrityStore.set(existing.id, patched);
    sendSuccess(res, { ...patched, source: itemSource(existing.id) });
  } catch (err) { handleRouteError(res, err, 'Failed to update microsystem device'); }
});

router.get('/sentra/microsystem-integrity/summary', (_req: Request, res: Response) => {
  try {
    const items = storeToArray(microsystemIntegrityStore);
    const passing = items.filter(r => r.attestationResult === 'pass').length;
    const failing = items.filter(r => r.attestationResult === 'fail').length;
    const sideChannelTotal = items.reduce((a, r) => a + r.sideChannelAlerts.length, 0);
    const avgAnomaly = items.length > 0 ? Math.round(items.reduce((a, r) => a + r.anomalyScore, 0) / items.length) : 0;
    sendSuccess(res, { totalDevices: items.length, passing, failing, sideChannelTotal, avgAnomaly });
  } catch (err) { handleRouteError(res, err, 'Failed to get microsystem summary'); }
});

// ── Photonic Sensors ────────────────────────────────────────────────────────

const photonicSensorPatchSchema = z.object({
  health: z.enum(['optimal', 'degraded', 'calibration_needed', 'offline', 'compromised']).optional(),
  driftPercentage: z.number().min(0).optional(),
  eavesdroppingDetected: z.boolean().optional(),
}).passthrough();

router.get('/sentra/photonic-sensors/nodes', (_req: Request, res: Response) => {
  try {
    const items = storeToArray(photonicSensorStore);
    sendSuccess(res, { nodes: items.map(i => ({ ...i, source: itemSource(i.id) })) });
  } catch (err) { handleRouteError(res, err, 'Failed to list photonic sensor nodes'); }
});

router.patch('/sentra/photonic-sensors/nodes/:id', validateBody(photonicSensorPatchSchema), (req: Request, res: Response) => {
  try {
    const existing = photonicSensorStore.get(req.params.id as string);
    if (!existing) { sendNotFound(res, 'PhotonicSensorNode'); return; }
    const validated = photonicSensorPatchSchema.parse(req.body);
    const patched = { ...existing, ...validated };
    photonicSensorStore.set(existing.id, patched);
    sendSuccess(res, { ...patched, source: itemSource(existing.id) });
  } catch (err) { handleRouteError(res, err, 'Failed to update photonic sensor node'); }
});

router.get('/sentra/photonic-sensors/summary', (_req: Request, res: Response) => {
  try {
    const items = storeToArray(photonicSensorStore);
    const optimal = items.filter(n => n.health === 'optimal').length;
    const compromised = items.filter(n => n.health === 'compromised').length;
    const eavesdropping = items.filter(n => n.eavesdroppingDetected).length;
    const avgQber = items.length > 0 ? Math.round(items.reduce((a, n) => a + n.quantumBitErrorRate, 0) / items.length * 10) / 10 : 0;
    sendSuccess(res, { totalNodes: items.length, optimal, compromised, eavesdropping, avgQber });
  } catch (err) { handleRouteError(res, err, 'Failed to get photonic sensor summary'); }
});

// ── Threat Horizon Vectors ──────────────────────────────────────────────────

const thvPatchSchema = z.object({
  maturity: z.enum(['theoretical', 'lab_demonstrated', 'weaponizable', 'actively_exploited']).optional(),
  mitigationAvailable: z.boolean().optional(),
  yearsToWeaponization: z.number().nullable().optional(),
}).passthrough();

router.get('/sentra/threat-horizon/vectors', (_req: Request, res: Response) => {
  try {
    const items = storeToArray(threatHorizonStore);
    sendSuccess(res, { vectors: items.map(i => ({ ...i, source: itemSource(i.id) })) });
  } catch (err) { handleRouteError(res, err, 'Failed to list threat horizon vectors'); }
});

router.patch('/sentra/threat-horizon/vectors/:id', validateBody(thvPatchSchema), (req: Request, res: Response) => {
  try {
    const existing = threatHorizonStore.get(req.params.id as string);
    if (!existing) { sendNotFound(res, 'ThreatHorizonVector'); return; }
    const validated = thvPatchSchema.parse(req.body);
    const patched = { ...existing, ...validated };
    threatHorizonStore.set(existing.id, patched);
    sendSuccess(res, { ...patched, source: itemSource(existing.id) });
  } catch (err) { handleRouteError(res, err, 'Failed to update threat horizon vector'); }
});

router.get('/sentra/threat-horizon/summary', (_req: Request, res: Response) => {
  try {
    const items = storeToArray(threatHorizonStore);
    const activelyExploited = items.filter(v => v.maturity === 'actively_exploited').length;
    const weaponizable = items.filter(v => v.maturity === 'weaponizable').length;
    const noMitigation = items.filter(v => !v.mitigationAvailable).length;
    sendSuccess(res, { totalVectors: items.length, activelyExploited, weaponizable, noMitigation });
  } catch (err) { handleRouteError(res, err, 'Failed to get threat horizon summary'); }
});

// ── Bio-Substrate Assets ────────────────────────────────────────────────────

const bioPatchSchema = z.object({
  integrity: z.enum(['nominal', 'degraded', 'contaminated', 'expired', 'compromised']).optional(),
  contaminationRisk: z.number().min(0).max(100).optional(),
  temperatureCelsius: z.number().optional(),
}).passthrough();

router.get('/sentra/bio-substrate/assets', (_req: Request, res: Response) => {
  try {
    const items = storeToArray(bioSubstrateStore);
    sendSuccess(res, { assets: items.map(i => ({ ...i, source: itemSource(i.id) })) });
  } catch (err) { handleRouteError(res, err, 'Failed to list bio-substrate assets'); }
});

router.patch('/sentra/bio-substrate/assets/:id', validateBody(bioPatchSchema), (req: Request, res: Response) => {
  try {
    const existing = bioSubstrateStore.get(req.params.id as string);
    if (!existing) { sendNotFound(res, 'BioSubstrateAsset'); return; }
    const validated = bioPatchSchema.parse(req.body);
    const patched = { ...existing, ...validated };
    bioSubstrateStore.set(existing.id, patched);
    sendSuccess(res, { ...patched, source: itemSource(existing.id) });
  } catch (err) { handleRouteError(res, err, 'Failed to update bio-substrate asset'); }
});

router.get('/sentra/bio-substrate/summary', (_req: Request, res: Response) => {
  try {
    const items = storeToArray(bioSubstrateStore);
    const nominal = items.filter(a => a.integrity === 'nominal').length;
    const compromised = items.filter(a => a.integrity === 'compromised').length;
    const avgContamination = items.length > 0 ? Math.round(items.reduce((a, b) => a + b.contaminationRisk, 0) / items.length) : 0;
    sendSuccess(res, { totalAssets: items.length, nominal, compromised, avgContamination });
  } catch (err) { handleRouteError(res, err, 'Failed to get bio-substrate summary'); }
});

export default router;
