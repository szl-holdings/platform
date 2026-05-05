import { randomUUID } from 'node:crypto';
import {
  hubClient,
  classifyHubRisk,
  estimateHubCost,
  type HubOperationType,
  type HubOperationRecord,
  type HubModelSearchParams,
  type HubDatasetSearchParams,
  type HubDownloadRequest,
  type HubUploadRequest,
  type HubBucketRequest,
  type HubSpaceRequest,
} from './hub-client.js';
import {
  runPCEGate,
  generateProofPacket,
  attachTraceToContract,
  getPCEContract,
  type PCEGateResult,
} from './governance/pce-gate.js';

let costControllerModule: { costController: { isAllowed: (orgId: string) => { allowed: boolean; reason?: string }; record: (entry: Record<string, unknown>) => void } } | null = null;
async function getCostController() {
  if (!costControllerModule) {
    try {
      costControllerModule = await import('@szl-holdings/ai-control-plane') as typeof costControllerModule;
    } catch {
      costControllerModule = null;
    }
  }
  return costControllerModule?.costController ?? null;
}

async function checkBudget(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
  const controller = await getCostController();
  if (!controller) return { allowed: true };
  return controller.isAllowed(tenantId);
}

async function recordCost(tenantId: string, costUsd: number, opType: HubOperationType): Promise<void> {
  const controller = await getCostController();
  if (!controller) return;
  try {
    controller.record({
      orgId: tenantId,
      provider: 'huggingface',
      model: opType,
      routeClass: 'hub-operations',
      inputTokens: 0,
      outputTokens: 0,
      inputCostPerToken: 0,
      outputCostPerToken: 0,
      fixedCostUsd: costUsd,
    });
  } catch { /* cost recording must never crash */ }
}

let _skillRegistered = false;
export async function registerHubSkill(): Promise<void> {
  if (_skillRegistered) return;
  _skillRegistered = true;
  try {
    const { skillRegistry } = await import('@szl-holdings/ai-engine');
    skillRegistry.register({
      name: 'hf-hub-bridge',
      version: '1.0.0',
      capability: 'hub-operations',
      domain: 'data-engineering',
      description: 'Governed HuggingFace Hub operations — search, inspect, upload models/datasets, manage buckets and Spaces with PCE gate evaluation and proof chain provenance.',
      triggerConditions: ['model_search', 'dataset_search', 'model_download', 'model_upload', 'bucket_management', 'space_management'],
      requiredInputs: [],
      optionalInputs: ['search', 'modelId', 'repoId', 'spaceId', 'bucketName', 'action'],
      outputSchema: [],
      outputDecisionType: 'action',
      chainMetadata: {
        canChainTo: ['evidence-packaging', 'compliance-check'],
        canChainFrom: ['entity-resolution', 'risk-assessment'],
        requiredPreconditions: [],
        outputsFedToNext: ['governedOperation', 'proofPacketId'],
        maxChainDepth: 4,
        parallelizable: true,
      },
      analyticMode: 'real-time',
      policyClass: 'governed',
      estimatedLatencyMs: 5000,
      tags: ['huggingface', 'hub', 'models', 'datasets', 'governance', 'pce'],
      isBuiltin: true,
      isActive: true,
    });
  } catch { /* skill registry may not be available */ }
}

void registerHubSkill();

export interface GovernedHubOperation {
  operationId: string;
  type: HubOperationType;
  governance: {
    pceResult: PCEGateResult;
    riskLevel: string;
    costEstimateUsd: number;
    proofPacketId?: string;
  };
  hubRecord: HubOperationRecord;
  result?: unknown;
  error?: string;
  timestamp: string;
}

const governedOps: GovernedHubOperation[] = [];
const MAX_GOVERNED_OPS = 5_000;

function storeGovernedOp(op: GovernedHubOperation): void {
  governedOps.unshift(op);
  if (governedOps.length > MAX_GOVERNED_OPS) governedOps.length = MAX_GOVERNED_OPS;
}

function mapRiskToVertical(opType: HubOperationType): string {
  switch (opType) {
    case 'upload_model':
    case 'manage_bucket':
    case 'launch_space':
      return 'security';
    case 'download_model':
      return 'operational';
    default:
      return 'operational';
  }
}

function mapRiskLevelString(opType: HubOperationType): string {
  const risk = classifyHubRisk(opType);
  switch (risk) {
    case 'high':
      return 'critical';
    case 'medium':
      return 'high';
    default:
      return 'low';
  }
}

function finalizeProofPacket(governedOp: GovernedHubOperation): void {
  const contractId = governedOp.governance.pceResult.contract?.contractId;
  if (!contractId) return;

  const contract = getPCEContract(contractId);
  if (!contract) return;

  contract.isVerified = true;
  contract.verifiedAt = new Date().toISOString();
  const packet = generateProofPacket(contract);
  governedOp.governance.proofPacketId = packet.packetId;
}

async function runGovernanceGate(
  opType: HubOperationType,
  resourceUri: string,
  opts?: { agentId?: string; tenantId?: string; purpose?: string },
): Promise<{ allowed: boolean; pceResult: PCEGateResult; governedOp: GovernedHubOperation }> {
  const actionId = `hub-${randomUUID().slice(0, 8)}`;
  const riskLevel = mapRiskLevelString(opType);
  const isDestructive = opType === 'manage_bucket' || opType === 'upload_model';
  const tenantId = opts?.tenantId ?? 'default';

  const budgetResult = await checkBudget(tenantId);
  if (!budgetResult.allowed) {
    const blockedOp: GovernedHubOperation = {
      operationId: actionId,
      type: opType,
      governance: {
        pceResult: { allowed: false, blockedReason: `Budget exceeded: ${budgetResult.reason ?? 'org limit reached'}` },
        riskLevel,
        costEstimateUsd: estimateHubCost(opType),
      },
      hubRecord: {
        id: actionId,
        type: opType,
        riskLevel: classifyHubRisk(opType),
        agentId: opts?.agentId,
        tenantId,
        resourceUri,
        purpose: opts?.purpose,
        costEstimateUsd: estimateHubCost(opType),
        status: 'blocked',
        createdAt: new Date().toISOString(),
      },
      error: `Budget exceeded: ${budgetResult.reason ?? 'org limit reached'}`,
      timestamp: new Date().toISOString(),
    };
    storeGovernedOp(blockedOp);
    return { allowed: false, pceResult: blockedOp.governance.pceResult, governedOp: blockedOp };
  }

  const pceResult = await runPCEGate({
    actionId,
    originSignalIds: [`hub:${opType}:${Date.now()}`],
    vertical: mapRiskToVertical(opType),
    riskLevel,
    isDestructive,
    actionDescription: `HF Hub ${opType}: ${resourceUri}`,
    signals: [
      {
        id: `hub-signal-${actionId}`,
        type: 'hub_operation',
        source: 'hf-hub-bridge',
        freshness: 1,
        opType,
        resourceUri,
        agentId: opts?.agentId,
        tenantId,
      },
    ],
  });

  if (pceResult.allowed && pceResult.contract) {
    const traceId = `hub-trace-${actionId}`;
    attachTraceToContract(pceResult.contract.contractId, traceId);
  }

  const costUsd = estimateHubCost(opType);
  const governedOp: GovernedHubOperation = {
    operationId: actionId,
    type: opType,
    governance: {
      pceResult,
      riskLevel,
      costEstimateUsd: costUsd,
    },
    hubRecord: {
      id: actionId,
      type: opType,
      riskLevel: classifyHubRisk(opType),
      agentId: opts?.agentId,
      tenantId,
      resourceUri,
      purpose: opts?.purpose,
      costEstimateUsd: costUsd,
      status: pceResult.allowed ? 'pending' : 'blocked',
      createdAt: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  };

  if (!pceResult.allowed) {
    governedOp.error = pceResult.blockedReason;
    storeGovernedOp(governedOp);
  } else {
    // NOTE: Cost is recorded at governance-allow time (pre-execution). If the
    // downstream HF API call fails, the cost is still metered as "attempted cost".
    // This is intentional: budget enforcement must be conservative to prevent
    // overspend. Refund/adjustment for failed ops is a follow-up (#4733).
    void recordCost(tenantId, costUsd, opType);
  }

  return { allowed: pceResult.allowed, pceResult, governedOp };
}

export async function governedSearchModels(
  params: HubModelSearchParams,
  opts?: { agentId?: string; tenantId?: string },
) {
  const { allowed, governedOp } = await runGovernanceGate(
    'search_models',
    'hf://models',
    { ...opts, purpose: `search: ${params.search ?? '*'}` },
  );

  if (!allowed) return { models: [], governance: governedOp };

  try {
    const { models, record } = await hubClient.searchModels(params);
    governedOp.hubRecord = record;
    governedOp.hubRecord.agentId = opts?.agentId;
    governedOp.hubRecord.tenantId = opts?.tenantId;
    governedOp.result = { count: models.length };
    finalizeProofPacket(governedOp);
    storeGovernedOp(governedOp);
    return { models, governance: governedOp };
  } catch (err) {
    governedOp.error = err instanceof Error ? err.message : String(err);
    governedOp.hubRecord.status = 'failed';
    governedOp.hubRecord.error = governedOp.error;
    storeGovernedOp(governedOp);
    return { models: [], governance: governedOp };
  }
}

export async function governedSearchDatasets(
  params: HubDatasetSearchParams,
  opts?: { agentId?: string; tenantId?: string },
) {
  const { allowed, governedOp } = await runGovernanceGate(
    'search_datasets',
    'hf://datasets',
    { ...opts, purpose: `search: ${params.search ?? '*'}` },
  );

  if (!allowed) return { datasets: [], governance: governedOp };

  try {
    const { datasets, record } = await hubClient.searchDatasets(params);
    governedOp.hubRecord = record;
    governedOp.hubRecord.agentId = opts?.agentId;
    governedOp.hubRecord.tenantId = opts?.tenantId;
    governedOp.result = { count: datasets.length };
    finalizeProofPacket(governedOp);
    storeGovernedOp(governedOp);
    return { datasets, governance: governedOp };
  } catch (err) {
    governedOp.error = err instanceof Error ? err.message : String(err);
    governedOp.hubRecord.status = 'failed';
    governedOp.hubRecord.error = governedOp.error;
    storeGovernedOp(governedOp);
    return { datasets: [], governance: governedOp };
  }
}

export async function governedDownloadModel(
  req: HubDownloadRequest,
  opts?: { agentId?: string; tenantId?: string },
) {
  const { allowed, governedOp } = await runGovernanceGate(
    'download_model',
    `hf://models/${req.modelId}`,
    { ...opts, purpose: req.purpose ?? `download ${req.modelId}` },
  );

  if (!allowed) return { metadata: null, governance: governedOp };

  try {
    const { metadata, record } = await hubClient.downloadModelMetadata(req);
    governedOp.hubRecord = record;
    governedOp.hubRecord.agentId = opts?.agentId;
    governedOp.hubRecord.tenantId = opts?.tenantId;
    governedOp.result = metadata;
    finalizeProofPacket(governedOp);
    storeGovernedOp(governedOp);
    return { metadata, governance: governedOp };
  } catch (err) {
    governedOp.error = err instanceof Error ? err.message : String(err);
    governedOp.hubRecord.status = 'failed';
    governedOp.hubRecord.error = governedOp.error;
    storeGovernedOp(governedOp);
    return { metadata: null, governance: governedOp };
  }
}

export async function governedUploadModel(
  req: HubUploadRequest,
  opts?: { agentId?: string; tenantId?: string },
) {
  const { allowed, governedOp } = await runGovernanceGate(
    'upload_model',
    `hf://repos/${req.repoId}`,
    { ...opts, purpose: req.purpose ?? `upload to ${req.repoId}` },
  );

  if (!allowed) return { result: null, governance: governedOp };

  try {
    const { result, record } = await hubClient.uploadModel(req);
    governedOp.hubRecord = record;
    governedOp.hubRecord.agentId = opts?.agentId;
    governedOp.hubRecord.tenantId = opts?.tenantId;
    governedOp.result = result;
    finalizeProofPacket(governedOp);
    storeGovernedOp(governedOp);
    return { result, governance: governedOp };
  } catch (err) {
    governedOp.error = err instanceof Error ? err.message : String(err);
    governedOp.hubRecord.status = 'failed';
    governedOp.hubRecord.error = governedOp.error;
    storeGovernedOp(governedOp);
    return { result: null, governance: governedOp };
  }
}

export async function governedManageBucket(
  req: HubBucketRequest,
  opts?: { agentId?: string; tenantId?: string },
) {
  const { allowed, governedOp } = await runGovernanceGate(
    'manage_bucket',
    `hf://buckets/${req.bucketName ?? 'default'}`,
    { ...opts, purpose: `bucket ${req.action}` },
  );

  if (!allowed) return { result: null, governance: governedOp };

  try {
    const { result, record } = await hubClient.manageBucket(req);
    governedOp.hubRecord = record;
    governedOp.hubRecord.agentId = opts?.agentId;
    governedOp.hubRecord.tenantId = opts?.tenantId;
    governedOp.result = result;
    finalizeProofPacket(governedOp);
    storeGovernedOp(governedOp);
    return { result, governance: governedOp };
  } catch (err) {
    governedOp.error = err instanceof Error ? err.message : String(err);
    governedOp.hubRecord.status = 'failed';
    governedOp.hubRecord.error = governedOp.error;
    storeGovernedOp(governedOp);
    return { result: null, governance: governedOp };
  }
}

export async function governedManageSpace(
  req: HubSpaceRequest,
  opts?: { agentId?: string; tenantId?: string },
) {
  const { allowed, governedOp } = await runGovernanceGate(
    'launch_space',
    `hf://spaces/${req.spaceId ?? 'new'}`,
    { ...opts, purpose: `space ${req.action}` },
  );

  if (!allowed) return { result: null, governance: governedOp };

  try {
    const { result, record } = await hubClient.manageSpace(req);
    governedOp.hubRecord = record;
    governedOp.hubRecord.agentId = opts?.agentId;
    governedOp.hubRecord.tenantId = opts?.tenantId;
    governedOp.result = result;
    finalizeProofPacket(governedOp);
    storeGovernedOp(governedOp);
    return { result, governance: governedOp };
  } catch (err) {
    governedOp.error = err instanceof Error ? err.message : String(err);
    governedOp.hubRecord.status = 'failed';
    governedOp.hubRecord.error = governedOp.error;
    storeGovernedOp(governedOp);
    return { result: null, governance: governedOp };
  }
}

export async function governedSearchPapers(
  params: { query: string; limit?: number },
  opts?: { agentId?: string; tenantId?: string },
) {
  const { allowed, governedOp } = await runGovernanceGate(
    'search_papers',
    'hf://papers',
    { ...opts, purpose: `search papers: ${params.query || '*'}` },
  );

  if (!allowed) return { result: null, governance: governedOp };

  try {
    const { callHfTool } = await import('../../routes/hf-mcp-proxy.js');
    const result = await callHfTool('search_papers', params);
    governedOp.hubRecord.status = 'completed';
    governedOp.result = result;
    finalizeProofPacket(governedOp);
    storeGovernedOp(governedOp);
    return { result, governance: governedOp };
  } catch (err) {
    governedOp.error = err instanceof Error ? err.message : String(err);
    governedOp.hubRecord.status = 'failed';
    governedOp.hubRecord.error = governedOp.error;
    storeGovernedOp(governedOp);
    return { result: null, governance: governedOp };
  }
}

export async function governedSearchSpaces(
  params: { query: string; limit?: number },
  opts?: { agentId?: string; tenantId?: string },
) {
  const { allowed, governedOp } = await runGovernanceGate(
    'search_spaces',
    'hf://spaces',
    { ...opts, purpose: `search spaces: ${params.query || '*'}` },
  );

  if (!allowed) return { result: null, governance: governedOp };

  try {
    const { callHfTool } = await import('../../routes/hf-mcp-proxy.js');
    const result = await callHfTool('search_spaces', params);
    governedOp.hubRecord.status = 'completed';
    governedOp.result = result;
    finalizeProofPacket(governedOp);
    storeGovernedOp(governedOp);
    return { result, governance: governedOp };
  } catch (err) {
    governedOp.error = err instanceof Error ? err.message : String(err);
    governedOp.hubRecord.status = 'failed';
    governedOp.hubRecord.error = governedOp.error;
    storeGovernedOp(governedOp);
    return { result: null, governance: governedOp };
  }
}

export async function governedGetModelInfo(
  params: { model_id: string },
  opts?: { agentId?: string; tenantId?: string },
) {
  const { allowed, governedOp } = await runGovernanceGate(
    'get_model_card',
    `hf://models/${params.model_id}`,
    { ...opts, purpose: `get model info: ${params.model_id}` },
  );

  if (!allowed) return { result: null, governance: governedOp };

  try {
    const { callHfTool } = await import('../../routes/hf-mcp-proxy.js');
    const result = await callHfTool('get_model_info', params);
    governedOp.hubRecord.status = 'completed';
    governedOp.result = result;
    finalizeProofPacket(governedOp);
    storeGovernedOp(governedOp);
    return { result, governance: governedOp };
  } catch (err) {
    governedOp.error = err instanceof Error ? err.message : String(err);
    governedOp.hubRecord.status = 'failed';
    governedOp.hubRecord.error = governedOp.error;
    storeGovernedOp(governedOp);
    return { result: null, governance: governedOp };
  }
}

export async function governedGetDatasetInfo(
  params: { dataset_id: string },
  opts?: { agentId?: string; tenantId?: string },
) {
  const { allowed, governedOp } = await runGovernanceGate(
    'get_dataset_info',
    `hf://datasets/${params.dataset_id}`,
    { ...opts, purpose: `get dataset info: ${params.dataset_id}` },
  );

  if (!allowed) return { result: null, governance: governedOp };

  try {
    const { callHfTool } = await import('../../routes/hf-mcp-proxy.js');
    const result = await callHfTool('get_dataset_info', params);
    governedOp.hubRecord.status = 'completed';
    governedOp.result = result;
    finalizeProofPacket(governedOp);
    storeGovernedOp(governedOp);
    return { result, governance: governedOp };
  } catch (err) {
    governedOp.error = err instanceof Error ? err.message : String(err);
    governedOp.hubRecord.status = 'failed';
    governedOp.hubRecord.error = governedOp.error;
    storeGovernedOp(governedOp);
    return { result: null, governance: governedOp };
  }
}

export async function governedDocSearch(
  params: { query: string; doc_type?: string; limit?: number },
  opts?: { agentId?: string; tenantId?: string },
) {
  const { allowed, governedOp } = await runGovernanceGate(
    'get_model_card',
    'hf://docs',
    { ...opts, purpose: `doc search: ${params.query || '*'}` },
  );

  if (!allowed) return { result: null, governance: governedOp };

  try {
    const { callHfTool } = await import('../../routes/hf-mcp-proxy.js');
    const result = await callHfTool('doc_search', params);
    governedOp.hubRecord.status = 'completed';
    governedOp.result = result;
    finalizeProofPacket(governedOp);
    storeGovernedOp(governedOp);
    return { result, governance: governedOp };
  } catch (err) {
    governedOp.error = err instanceof Error ? err.message : String(err);
    governedOp.hubRecord.status = 'failed';
    governedOp.hubRecord.error = governedOp.error;
    storeGovernedOp(governedOp);
    return { result: null, governance: governedOp };
  }
}

export function listGovernedOperations(opts?: {
  limit?: number;
  type?: HubOperationType;
  agentId?: string;
  tenantId?: string;
}): GovernedHubOperation[] {
  let ops = governedOps;
  if (opts?.type) ops = ops.filter((o) => o.type === opts.type);
  if (opts?.agentId) ops = ops.filter((o) => o.hubRecord.agentId === opts.agentId);
  if (opts?.tenantId) ops = ops.filter((o) => o.hubRecord.tenantId === opts.tenantId);
  return ops.slice(0, opts?.limit ?? 50);
}

export function getHubCostDashboard(opts?: { agentId?: string; tenantId?: string }) {
  const clientCosts = hubClient.getCostSummary(opts);
  const governedCount = governedOps.filter(
    (o) =>
      (!opts?.agentId || o.hubRecord.agentId === opts.agentId) &&
      (!opts?.tenantId || o.hubRecord.tenantId === opts.tenantId),
  ).length;

  const blocked = governedOps.filter(
    (o) =>
      o.hubRecord.status === 'blocked' &&
      (!opts?.agentId || o.hubRecord.agentId === opts.agentId) &&
      (!opts?.tenantId || o.hubRecord.tenantId === opts.tenantId),
  ).length;

  return {
    ...clientCosts,
    governedOperations: governedCount,
    blockedOperations: blocked,
    complianceRate: governedCount > 0 ? ((governedCount - blocked) / governedCount) * 100 : 100,
  };
}
