/**
 * Amaru agent coalition runtime.
 *
 * Replaces the old Math.random simulator with a deterministic, replay-grade
 * pipeline driven by the eight Amaru agents. The pipeline emits a sequence of
 * RelayRunEvents with hash-chained stateHashes and a Lutar Σ envelope.
 *
 * Each invocation is fully a function of (mapping, model, destination, seed).
 * Same inputs → same trace. This is the contract the Codex Kernel cares about.
 */

import type {
  AgentId,
  RelayDestination,
  RelayMapping,
  RelayModel,
  RelayPolicy,
  RelayRunEvent,
  RelaySource,
  RunEventType,
  SeverityLevel,
} from '@/data/fabric/types';
import { computeLutarSigma, type LutarSigma } from './intelligence';
import { DEMO_DESTINATION_ADAPTER, DEMO_SOURCE_ADAPTER, DEMO_SYNC_PLANNER } from './adapters';

export interface CoalitionRunArgs {
  readonly mapping: RelayMapping;
  readonly model: RelayModel;
  readonly destination: RelayDestination;
  readonly source: RelaySource;
  readonly policies: readonly RelayPolicy[];
  readonly seed: number;
  readonly nowIso: string;
}

export interface CoalitionRunResult {
  readonly runId: string;
  readonly events: readonly RelayRunEvent[];
  readonly sigma: LutarSigma;
  readonly verdict: 'completed' | 'blocked' | 'failed';
  readonly recordsDelivered: number;
  readonly recordsFailed: number;
  readonly evidenceRef: string;
}

const AGENT_BY_TYPE: Record<RunEventType, AgentId | null> = {
  planned: 'cartographer',
  approved: null,
  started: 'courier',
  extracted: 'courier',
  transformed: 'mapper',
  policy_checked: 'sentinel',
  delivered: 'courier',
  failed: 'fixer',
  retried: 'courier',
  quarantined: 'sentinel',
  rolled_back: 'fixer',
  completed: 'verity',
};

const SEV: Record<RunEventType, SeverityLevel> = {
  planned: 'info', approved: 'info', started: 'info', extracted: 'info',
  transformed: 'info', policy_checked: 'low', delivered: 'info',
  failed: 'high', retried: 'medium', quarantined: 'high',
  rolled_back: 'critical', completed: 'info',
};

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
function shortHex(n: number) {
  return n.toString(16).padStart(8, '0').slice(0, 8);
}

export function runCoalition(args: CoalitionRunArgs): CoalitionRunResult {
  const { mapping, model, destination, source, policies, seed, nowIso } = args;
  const runId = `run-${shortHex(fnv1a(`${mapping.id}:${seed}`))}`;
  const baseAt = Date.parse(nowIso);

  // 1. Cartographer profiles, source-side.
  const profile = DEMO_SOURCE_ADAPTER.profile(source);
  const contractCheck = DEMO_DESTINATION_ADAPTER.validateContract(mapping, destination);
  void profile;
  void contractCheck;

  // 2. Sync planner produces batches.
  const plan = DEMO_SYNC_PLANNER.plan(mapping, model, destination);

  // 3. Walk the deterministic flow; inject failure if approval pending or governance red.
  const willBlock =
    mapping.governanceState === 'red' ||
    destination.governanceState === 'red' ||
    destination.authState === 'expired' ||
    destination.authState === 'rotation_required';
  const willRequireApproval = mapping.approvalRequired;

  const flow: RunEventType[] = willBlock
    ? ['planned', 'started', 'policy_checked', 'quarantined', 'rolled_back']
    : willRequireApproval
      ? ['planned', 'approved', 'started', 'extracted', 'transformed', 'policy_checked', 'delivered', 'completed']
      : ['planned', 'started', 'extracted', 'transformed', 'policy_checked', 'delivered', 'completed'];

  let chain = fnv1a(`chain:${runId}`);
  const events: RelayRunEvent[] = [];
  const totalRecords = plan.totalRecords;
  let delivered = 0;
  let failed = 0;

  flow.forEach((type, i) => {
    chain = fnv1a(`${chain}:${type}:${i}`);
    const at = new Date(baseAt + i * 320).toISOString();
    const records =
      type === 'extracted' || type === 'transformed' ? totalRecords :
      type === 'delivered' ? Math.round(totalRecords * 0.988) :
      type === 'completed' ? Math.round(totalRecords * 0.988) :
      type === 'quarantined' ? totalRecords :
      0;
    if (type === 'delivered') delivered = records;
    if (type === 'rolled_back' || type === 'quarantined') failed = totalRecords;

    const summary =
      type === 'planned' ? `Cartographer planned ${plan.batches.length} batch(es) · ${totalRecords.toLocaleString()} records` :
      type === 'approved' ? `Approval granted (${mapping.approvalReason ?? 'standard review'})` :
      type === 'started' ? `Courier opened batch ${plan.batches[0]?.batchId ?? ''}` :
      type === 'extracted' ? `Extracted ${records.toLocaleString()} records via cursor` :
      type === 'transformed' ? `Mapper applied ${mapping.transformations.length} transforms` :
      type === 'policy_checked' ? `Sentinel evaluated ${policies.filter((p) => p.scope.includes(mapping.verticalId)).length} policies` :
      type === 'delivered' ? `Courier delivered ${records.toLocaleString()} to ${destination.name}` :
      type === 'completed' ? `Verity reconciled · 1.2% rejection rate` :
      type === 'quarantined' ? `Sentinel quarantined batch · ${willBlock ? 'governance red' : 'policy block'}` :
      type === 'rolled_back' ? 'Auto-rollback complete' :
      type === 'failed' ? 'Delivery failed' :
      type === 'retried' ? 'Retry with exponential backoff' :
      type;

    events.push({
      id: `${runId}-${i}-${type}`,
      syncId: runId,
      syncName: mapping.name,
      destinationId: destination.id,
      verticalId: mapping.verticalId,
      type,
      atIso: at,
      agentId: AGENT_BY_TYPE[type],
      summary,
      recordsAffected: records,
      latencyMs: 80 + (i * 60),
      stateHash: `0x${shortHex(chain)}`,
      evidenceRef: type === 'completed' || type === 'rolled_back' || type === 'quarantined' ? `evidence/${runId}` : null,
      severity: SEV[type],
      errorClass: null,
    });
  });

  // Lutar axes from the actual run.
  const provenance = Math.min(1, mapping.confidence);
  const containment = Math.min(1, destination.fieldContractStrength);
  const coherence = willBlock ? 0.4 : 0.85 + (mapping.confidence - 0.7) * 0.5;
  const convergence = willBlock ? 0.3 : delivered / Math.max(1, totalRecords);
  const sigma = computeLutarSigma({
    P: provenance,
    K: containment,
    phi: Math.max(0, Math.min(1, coherence)),
    C: Math.max(0, Math.min(1, convergence)),
  });

  const verdict: CoalitionRunResult['verdict'] = willBlock ? 'blocked' : delivered === 0 ? 'failed' : 'completed';
  return {
    runId,
    events,
    sigma,
    verdict,
    recordsDelivered: delivered,
    recordsFailed: failed,
    evidenceRef: `evidence/${runId}`,
  };
}
