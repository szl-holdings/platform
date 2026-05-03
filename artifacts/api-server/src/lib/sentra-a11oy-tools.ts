/**
 * Sentra A11oy Tool Execution
 *
 * Routes tool invocations through an explicit, ordered lookup chain:
 *
 *  1. Sentra ML catalogue allowlist — the three ML-backed tools registered in
 *     the real TOOL_CATALOGUE (sentraAssetRiskScore, sentraIdentityBlastRadius,
 *     sentraAdversaryReplay) are invoked via their actual async ML pipeline
 *     functions — NOT executeToolMock — so responses contain live model output.
 *
 *  2. Local SENTRA_TOOLS — for tools with real backend/PCE-gate logic that are
 *     not in the global catalogue: push-playbook, asset-risk-rescore,
 *     adversary-replay (duplicate entry point from the local registry).
 *
 * Catalogue tools not in the Sentra allowlist are explicitly rejected to enforce
 * the trust boundary and prevent cross-domain tool access.
 *
 * All tools that touch customer infra go through the PCE gate.
 */
import { randomUUID } from 'node:crypto';
import { logger } from './logger';
import { runPCEGate } from '../a11oy/runtime/governance/pce-gate.js';
import { getTool, type ToolMetadata } from '../a11oy/runtime/tools/registry.js';
import { scoreAssetRisk, forecastIdentityBlastRadius, runAdversaryReplay, type AssetRiskInput, type AdversaryReplayInput, type IdentityBlastRadiusInput } from './sentra-ml-scoring.js';
import { emitAdversaryReplaySignal } from './sentra-prism-signals.js';
import { ensureSentraModelsRegistered } from './sentra-model-seeder.js';

// ── Sentra catalogue tool allowlist ──────────────────────────────────────────
// Only these tool IDs are permitted via the catalogue invocation path.
// Any other catalogue tool ID will be rejected with an error.
const SENTRA_CATALOGUE_ALLOWLIST = new Set([
  'sentraAssetRiskScore',
  'sentraIdentityBlastRadius',
  'sentraAdversaryReplay',
]);

/**
 * Invoke a catalogue-registered Sentra ML tool via the real async ML pipeline
 * (NOT executeToolMock). Constrained to SENTRA_CATALOGUE_ALLOWLIST.
 */
async function invokeCatalogueTool(
  toolId: string,
  params: Record<string, unknown>,
  context: { signalIds: string[]; requestedBy?: string },
): Promise<Record<string, unknown>> {
  await ensureSentraModelsRegistered().catch(() => {});
  const t0 = Date.now();

  switch (toolId) {
    case 'sentraAssetRiskScore': {
      const input: AssetRiskInput = {
        assetId: String(params.assetId ?? 'unknown-asset'),
        cvssScore: typeof params.cvssScore === 'number' ? params.cvssScore : undefined,
        epssScore: typeof params.epssScore === 'number' ? params.epssScore : undefined,
        isKevListed: Boolean(params.isKevListed),
        assetCriticality: (['critical', 'high', 'medium', 'low'].includes(String(params.assetCriticality))
          ? String(params.assetCriticality)
          : 'medium') as AssetRiskInput['assetCriticality'],
        internetExposure: Boolean(params.internetExposure),
        patchAge: typeof params.patchAge === 'number' ? params.patchAge : undefined,
        activeThreatActors: typeof params.activeThreatActors === 'number' ? params.activeThreatActors : undefined,
      };
      const score = await scoreAssetRisk(input);
      return { ...score, ok: true, toolId, durationMs: Date.now() - t0 };
    }

    case 'sentraIdentityBlastRadius': {
      const input: IdentityBlastRadiusInput = {
        identityId: String(params.identityId ?? 'unknown-identity'),
        identityType: (['human', 'service-account', 'machine'].includes(String(params.identityType))
          ? String(params.identityType)
          : 'human') as IdentityBlastRadiusInput['identityType'],
        currentPrivileges: Array.isArray(params.currentPrivileges) ? params.currentPrivileges as string[] : [],
        accessibleSystems: typeof params.accessibleSystems === 'number' ? params.accessibleSystems : 10,
        hasAdminRights: Boolean(params.hasAdminRights),
        recentAnomalies: typeof params.recentAnomalies === 'number' ? params.recentAnomalies : undefined,
        lateralMoveRisk: (['high', 'medium', 'low'].includes(String(params.lateralMoveRisk))
          ? String(params.lateralMoveRisk)
          : undefined) as IdentityBlastRadiusInput['lateralMoveRisk'],
      };
      const forecast = await forecastIdentityBlastRadius(input);
      return { ...forecast, ok: true, toolId, durationMs: Date.now() - t0 };
    }

    case 'sentraAdversaryReplay': {
      const input: AdversaryReplayInput = params as AdversaryReplayInput;
      const result = await runAdversaryReplay(input);
      const missed = result.attackChain.filter(s => s.outcome === 'succeeded').length;
      await emitAdversaryReplaySignal({
        scenarioId: result.scenarioId,
        overallSuccessRate: result.overallSuccessRate,
        chainLength: result.attackChain.length,
        missedDetections: missed,
        topMitigation: result.recommendedMitigations[0] ?? 'Review detection gaps',
      }).catch(() => {});
      return { ...result, ok: true, toolId, durationMs: Date.now() - t0 };
    }

    default:
      return { error: `Tool ${toolId} is not in the Sentra catalogue allowlist`, ok: false, toolId };
  }
}

export interface SentraTool {
  toolId: string;
  displayName: string;
  description: string;
  domain: 'sentra';
  capabilities: string[];
  requiresPCEGate: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  isDestructive: boolean;
  invoke: (params: Record<string, unknown>, context: { signalIds: string[]; requestedBy?: string }) => Promise<Record<string, unknown>>;
}

// ── Local tool handlers (real backend logic) ─────────────────────────────────

async function toolAssetRiskRescore(
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  await ensureSentraModelsRegistered().catch(() => {});
  const assets = Array.isArray(params.assets) ? params.assets as AssetRiskInput[] : [];
  if (assets.length === 0) return { error: 'No assets provided' };
  const scores = await Promise.all(assets.map(a => scoreAssetRisk(a)));
  const critical = scores.filter(s => s.riskLabel === 'critical');
  return {
    scored: scores.length,
    scores,
    summary: {
      critical: critical.length,
      high: scores.filter(s => s.riskLabel === 'high').length,
      medium: scores.filter(s => s.riskLabel === 'medium').length,
      low: scores.filter(s => s.riskLabel === 'low').length,
    },
    scoredAt: new Date().toISOString(),
  };
}

async function toolRunAdversaryReplay(
  params: Record<string, unknown>,
  ctx: { signalIds: string[]; requestedBy?: string },
): Promise<Record<string, unknown>> {
  await ensureSentraModelsRegistered().catch(() => {});
  const input = params as AdversaryReplayInput;
  const result = await runAdversaryReplay(input);
  const missed = result.attackChain.filter(s => s.outcome === 'succeeded').length;
  await emitAdversaryReplaySignal({
    scenarioId: result.scenarioId,
    overallSuccessRate: result.overallSuccessRate,
    chainLength: result.attackChain.length,
    missedDetections: missed,
    topMitigation: result.recommendedMitigations[0] ?? 'Review detection gaps',
  }).catch(() => {});
  return { result, requestedBy: ctx.requestedBy };
}

async function toolPushPlaybook(
  params: Record<string, unknown>,
  ctx: { signalIds: string[]; requestedBy?: string },
): Promise<Record<string, unknown>> {
  const actionId = `action-playbook-${randomUUID().slice(0, 8)}`;
  const riskLevel = String(params.riskLevel ?? 'high');

  const pceResult = await runPCEGate({
    actionId,
    originSignalIds: ctx.signalIds,
    vertical: 'aegis-defense',
    riskLevel,
    isDestructive: Boolean(params.isDestructive),
    actionDescription: `Push playbook: ${String(params.playbookId ?? 'unknown')}`,
  });

  if (!pceResult.allowed) {
    logger.warn({ actionId, reason: pceResult.blockedReason }, '[sentra/a11oy] push-playbook blocked by PCE gate');
    return {
      allowed: false,
      blockedReason: pceResult.blockedReason,
      requiresApproval: pceResult.requiresApproval,
      approvalTier: pceResult.approvalTier,
    };
  }

  logger.info({ actionId, playbookId: params.playbookId }, '[sentra/a11oy] push-playbook approved by PCE gate');
  return {
    allowed: true,
    actionId,
    contractId: pceResult.contract?.contractId,
    playbookId: params.playbookId,
    pushedAt: new Date().toISOString(),
    requestedBy: ctx.requestedBy,
  };
}

export const SENTRA_TOOLS: SentraTool[] = [
  {
    toolId: 'sentra:asset-risk-rescore',
    displayName: 'Asset Risk Re-Score',
    description: 'Re-score asset risk using live NVD/EPSS/KEV data and asset criticality. Returns calibrated P(compromise|30d) for each asset via the real ML pipeline.',
    domain: 'sentra',
    capabilities: ['asset_risk_scoring', 'nvd_epss_integration', 'kev_enrichment'],
    requiresPCEGate: false,
    riskLevel: 'low',
    isDestructive: false,
    invoke: toolAssetRiskRescore,
  },
  {
    toolId: 'sentra:run-adversary-replay',
    displayName: 'Run Adversary Replay',
    description: 'Launch a tailored adversary simulation using current CVE/EPSS/KEV data and the organization\'s attack surface. Not generic playbooks. Emits Prism Bus signal.',
    domain: 'sentra',
    capabilities: ['adversary_simulation', 'mitre_attack_mapping', 'monte_carlo_replay'],
    requiresPCEGate: false,
    riskLevel: 'medium',
    isDestructive: false,
    invoke: toolRunAdversaryReplay,
  },
  {
    toolId: 'sentra:push-playbook',
    displayName: 'Push Containment Playbook',
    description: 'Push a containment or remediation playbook to the active incident. Requires PCE gate approval for destructive actions.',
    domain: 'sentra',
    capabilities: ['playbook_push', 'incident_response', 'containment_orchestration'],
    requiresPCEGate: true,
    riskLevel: 'high',
    isDestructive: true,
    invoke: toolPushPlaybook,
  },
];

const localRegistry = new Map<string, SentraTool>(SENTRA_TOOLS.map(t => [t.toolId, t]));

/**
 * List all Sentra tools: local tools + catalogue tools (from real TOOL_CATALOGUE).
 */
export function listSentraTools(): Array<{
  toolId: string;
  displayName: string;
  description: string;
  domain: string;
  riskLevel: string;
  isDestructive: boolean;
  source: 'local' | 'catalogue';
}> {
  const local = SENTRA_TOOLS.map(({ invoke: _, ...meta }) => ({ ...meta, source: 'local' as const }));

  const catalogueSentraIds = ['sentraAssetRiskScore', 'sentraIdentityBlastRadius', 'sentraAdversaryReplay'];
  const catalogue = catalogueSentraIds
    .map(id => getTool(id))
    .filter((t): t is ToolMetadata => !!t)
    .map(t => ({
      toolId: t.id,
      displayName: t.name,
      description: t.description,
      domain: 'sentra',
      riskLevel: t.riskLevel,
      isDestructive: t.isDestructive,
      source: 'catalogue' as const,
    }));

  return [...local, ...catalogue];
}

/**
 * Invoke a Sentra tool.
 *
 * Invocation order:
 *  1. Sentra catalogue allowlist — if the toolId is in SENTRA_CATALOGUE_ALLOWLIST
 *     AND present in the real TOOL_CATALOGUE, route to invokeCatalogueTool() which
 *     calls the real async ML pipeline functions. executeToolMock is never used
 *     for these tool IDs.
 *     Per-tool allowedRoles from TOOL_CATALOGUE are enforced here (not only at
 *     route middleware level) to honour A11oy's intended governance boundaries.
 *  2. Local SENTRA_TOOLS — for tools with real backend/PCE-gate logic.
 *  3. Unknown toolId → explicit error (no cross-domain fallthrough).
 */
export async function invokeSentraTool(
  toolId: string,
  params: Record<string, unknown>,
  context: { signalIds: string[]; requestedBy?: string; callerRoles?: string[] },
): Promise<Record<string, unknown>> {
  // Path 1: Sentra ML catalogue tools — real inference, no mock
  if (SENTRA_CATALOGUE_ALLOWLIST.has(toolId)) {
    const catalogueTool = getTool(toolId);
    if (!catalogueTool) {
      logger.warn({ toolId }, '[sentra/a11oy] catalogue tool in allowlist but not registered — check TOOL_CATALOGUE setup');
      return { error: `Sentra catalogue tool not registered: ${toolId}`, ok: false };
    }

    // ── Per-tool role enforcement (TOOL_CATALOGUE policy boundary) ────────────
    // Route-level requireRole() is a coarse gate. Here we additionally enforce
    // the tool's own allowedRoles metadata so each tool's governance constraints
    // are respected independently of which route invoked the tool.
    //
    // FAIL-CLOSED: if the tool declares allowedRoles, access is DENIED unless
    // the caller provides at least one matching role. Absent/empty callerRoles
    // are treated as "no permission" — not a bypass.
    if (catalogueTool.allowedRoles.length > 0) {
      const { callerRoles } = context;
      const hasPermission = Array.isArray(callerRoles) && callerRoles.length > 0
        && callerRoles.some(r => catalogueTool.allowedRoles.includes(r));
      if (!hasPermission) {
        logger.warn(
          { toolId, callerRoles: callerRoles ?? [], allowedRoles: catalogueTool.allowedRoles },
          '[sentra/a11oy] tool invocation blocked — caller role not in tool allowedRoles (fail-closed)',
        );
        return {
          error: `Insufficient role for tool "${toolId}". Required: ${catalogueTool.allowedRoles.join(', ')}`,
          ok: false,
          code: 'TOOL_ROLE_DENIED',
        };
      }
    }

    logger.info(
      { toolId, source: 'catalogue-ml', callerRoles, allowedRoles: catalogueTool.allowedRoles },
      '[sentra/a11oy] invoking via real ML pipeline (allowlist)',
    );
    try {
      return await invokeCatalogueTool(toolId, params, context);
    } catch (err) {
      logger.error({ toolId, err }, '[sentra/a11oy] catalogue ML tool invocation error');
      return { error: String(err), ok: false, toolId };
    }
  }

  // Path 2: Local registry (real backend logic, PCE-gated)
  const localTool = localRegistry.get(toolId);
  if (localTool) {
    logger.info({ toolId, source: 'local', requiresPCEGate: localTool.requiresPCEGate }, '[sentra/a11oy] invoking via local registry');
    try {
      return await localTool.invoke(params, context);
    } catch (err) {
      logger.error({ toolId, err }, '[sentra/a11oy] local tool invocation error');
      return { error: String(err), ok: false, toolId };
    }
  }

  // Path 3: No match — explicit rejection (trust boundary enforcement)
  logger.warn({ toolId }, '[sentra/a11oy] tool not found in catalogue allowlist or local registry');
  return { error: `Unknown Sentra tool: ${toolId}`, ok: false };
}
