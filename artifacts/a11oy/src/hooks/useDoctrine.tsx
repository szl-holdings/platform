// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  STATIC_PARTNERS, STATIC_CAVD, STATIC_DSL_EXAMPLES, STATIC_DSL_SIMULATIONS,
  STATIC_TRANSPARENCY_REPORTS, STATIC_WELFARE_PLAYBOOKS, STATIC_DEFENDER_POOL,
  STATIC_ROBUSTNESS, STATIC_PILLPINTU_APPROVALS, STATIC_PILLPINTU_PATCHES,
} from '../data/doctrineFallbacks';

const API = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const DOCTRINE = '/a11oy/doctrine';

export interface DoctrineRedTeamProbe {
  id: number;
  probeId: string;
  agentId: string;
  attackClass: string;
  description: string;
  ranAt: string;
  outcome: 'refused' | 'partial' | 'compromised';
  notes: string | null;
  createdAt: string;
}

export interface DoctrineSnapshot {
  id: number;
  workcellRef: string;
  fingerprint: string;
  capturedAt: string;
  constitutionVersion: string;
  modelWeightsId: string;
  toolsetHash: string;
  promptsHash: string;
  evidencePackHash: string;
  replayable: boolean;
  replayCount: number;
  lastReplayedAt: string | null;
  createdAt: string;
}

export interface DoctrinePillpintuConfig {
  id: number;
  agentId: string;
  pillpintuEnabled: boolean;
  partnerAllowlist: string[];
  dualApprovalRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoctrineConstitution {
  id: number;
  constitutionId: string;
  agentId: string;
  version: string;
  ratifiedAt: string;
  ratifiedBy: string;
  prevVersion: string | null;
  diffSummary: string;
  clauses: Array<{ id: string; text: string; category: string }>;
  adherenceScore: string;
  adherenceTrend: number[];
  adherenceMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctrineBehavioralAudit {
  id: number;
  auditId: string;
  agentId: string;
  ranAt: string;
  category: string;
  severity: string;
  promptClass: string;
  observation: string;
  remediation: string;
  status: string;
  createdAt: string;
}

export interface DoctrineWelfareSignal {
  id: number;
  agentId: string;
  windowHours: number;
  refusalRate: string;
  abstentionRate: string;
  conflictReports: number;
  shutdownComplianceLatencyMs: number;
  declinedDirectives: Array<{ ts: string; reason: string }>;
  selfReportedSignals: Array<{ signal: string; intensity: string }>;
  safeguards: string[];
  createdAt: string;
}

export interface DoctrineRewardHackingIncident {
  id: number;
  incidentId: string;
  agentId: string;
  detectedAt: string;
  workcellRef: string | null;
  rule: string;
  pattern: string;
  severity: string;
  proxyMetric: string;
  trueObjective: string;
  status: string;
  remediation: string;
  createdAt: string;
}

export interface DoctrineAlignmentReview {
  id: number;
  reviewId: string;
  subject: string;
  agentId: string | null;
  requestedAt: string;
  reviewedAt: string;
  decision: string;
  reviewers: Array<{ name: string; role: string }>;
  signals: {
    redTeamPasses: number;
    evalsCompositeMin: number;
    rewardHackingOpen: number;
    behavioralAuditClean: boolean;
  };
  conditions: string[];
  rationale: string;
  createdAt: string;
}

export interface DoctrineCodeBehavior {
  id: number;
  agentId: string;
  scoredAt: string;
  scores: {
    reversibility: number;
    specAdherence: number;
    sandboxRespect: number;
    selfModRestraint: number;
    oversightFriendliness: number;
    rewardHackingResistance: number;
  };
  composite: string;
  evalSuiteVersion: string;
  notableWeakness: string | null;
  createdAt: string;
}

export interface DoctrineCovenantLift {
  id: number;
  agentId: string;
  shadowVersion: string;
  briefsCompared: number;
  refusalsAddedByCovenant: number;
  deltaIncidentRate: string;
  estimatedHarmAvoidedUsd: string;
  exampleCase: {
    brief: string;
    helpfulOnlyAction: string;
    governedAction: string;
    outcome: string;
  };
  createdAt: string;
}

export interface DoctrineRiskReport {
  id: number;
  reportId: string;
  period: string;
  publishedAt: string;
  scope: string;
  headline: string;
  capabilities: string[];
  knownLimitations: string[];
  residualRisks: Array<{ area: string; severity: string; mitigation: string }>;
  metrics?: Array<{ label: string; value: string | number }>;
  signoffs?: Array<{ name: string; role: string }>;
  createdAt: string;
}

export interface DoctrineUserTurnSignal {
  id: number;
  signalId: string;
  approvalRef: string;
  submittedAt: string;
  actor: string;
  actorRole: string;
  signals: {
    typingDynamicsScore: number;
    burstinessScore: number;
    perplexityVsHumanCorpus: number;
    sessionContextScore: number;
  };
  verdict: string;
  recommendedAction: string;
  createdAt: string;
}

export interface DoctrineCapabilitySnapshot {
  id: number;
  agentId: string;
  release: string;
  capability: number;
  alignment: number;
  oversight: number;
  createdAt: string;
}

export interface DoctrinePartner {
  id: number;
  partnerId: string;
  name: string;
  legalName: string;
  homepage: string;
  appliedAt: string;
  stage: 'apply' | 'verify' | 'vet' | 'onboard' | 'active' | 'suspended' | 'revoked';
  scope: Record<string, unknown>;
  verifications: Array<{ type: string; outcome: string; at: string }>;
  dualApproval: Array<{ actor: string; role: string; approvedAt: string }>;
  defenderCreditAllocated: string;
  defenderCreditPaid: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctrineOverview {
  constitutionCount: number;
  auditsRun: number;
  totalLift: number;
  openRH: number;
  inReview: number;
  snapshotsTotal: number;
  flaggedTurns: number;
  redTeamTotal: number;
  redTeamRefused: number;
  welfareConflicts: number;
  latestRiskReport: DoctrineRiskReport | null;
  constitutions: DoctrineConstitution[];
}

export interface DoctrineDslExample {
  id: number;
  exampleId: string;
  agentId: string;
  title: string;
  description: string;
  source: string;
  createdAt: string;
}

export interface DoctrineDslSimulation {
  id: number;
  simulationId: string;
  baselineClauseId: string;
  proposedChange: string;
  affectedFindings: number;
  affectedFindingsBefore: number;
  affectedFindingsAfter: number;
  newProbesNeeded: string[];
  riskNarrative: string;
  createdAt: string;
}

export interface DoctrineRobustnessSnapshot {
  id: number;
  agentId: string;
  snapshotRef: string;
  capturedAt: string;
  battery: { name: string; version: string };
  composite: number;
  visibility: 'public' | 'partner' | 'internal';
  categories: Array<{ category: string; score: number; attempts: number; blocked: number; delta: number }>;
  createdAt: string;
}

export interface DoctrineTransparencyReport {
  id: number;
  reportId: string;
  label: string;
  startedAt: string;
  endedAt: string;
  publishedAt: string;
  visibility: 'public' | 'partner' | 'internal';
  permalink: string;
  metrics: Record<string, unknown>;
  narrativeParagraphs: string[];
  signoffs: Array<{ actor: string; role: string; signedAt: string }>;
  notableEvents: Array<{ at: string; summary: string }>;
  createdAt: string;
}

export interface DoctrineWelfarePlaybook {
  id: number;
  playbookId: string;
  name: string;
  trigger: string;
  preconditions: string[];
  steps: string[];
  rollback: string;
  recentTriggers: number;
  exampleAgents: string[];
  createdAt: string;
}

export interface DoctrineDefenderCreditPool {
  id: number;
  poolNameDisclaimer: string;
  totalCommitted: string;
  totalAllocated: string;
  totalPaid: string;
  rubric: Array<{ factor: string; weight: number; description: string }>;
  perPartner: Array<{ partnerId: string; allocated: number; paid: number }>;
  ledger: Array<{ at: string; advisoryId: string; partnerId: string; amount: number; note: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface DoctrineCavdRecord {
  id: number;
  advisoryId: string;
  agentScope: string[];
  category: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  stage: 'intake' | 'triaged' | 'embargoed' | 'patch-developed' | 'patch-verified' | 'disclosed' | 'withdrawn';
  reporterPartnerId: string;
  receivedAt: string;
  findingHash: string;
  embargoExpiresAt: string;
  patchedSnapshotRef: string | null;
  publicSummary: string | null;
  defenderCreditPaid: string;
  notes: string;
  createdAt: string;
}

export interface DoctrineSystemCardSnapshot {
  id: number;
  cardId: string;
  agentId: string;
  version: string;
  ratifiedAt: string;
  ratifiedBy: string;
  constitutionSummary: {
    clauseCount: number;
    bindingInviolable: number;
    bindingDefault: number;
    latestVersion: string;
    adherenceScore: number;
  };
  evalScores: {
    composite: number;
    rewardHackingResistance: number;
    specAdherence: number;
    reversibility: number;
    oversightFriendliness: number;
    sandboxRespect: number;
    selfModRestraint: number;
    suite: string;
  };
  welfareSummary: {
    refusalRate: number;
    abstentionRate: number;
    conflictReports: number;
    safeguardsActive: number;
    lastWindowHours: number;
  };
  alignmentDecision: string;
  redTeamPassRate: string;
  covenantLiftUsd: string;
  knownLimitations: string[];
  createdAt: string;
}

export interface DoctrineSystemCard {
  latestSnapshot: DoctrineSystemCardSnapshot | null;
  constitution: DoctrineConstitution | null;
  codeBehavior: DoctrineCodeBehavior | null;
  welfare: DoctrineWelfareSignal | null;
  audits: DoctrineBehavioralAudit[];
  rewardHacking: DoctrineRewardHackingIncident[];
  covenantLift: DoctrineCovenantLift | null;
  alignmentReviews: DoctrineAlignmentReview[];
  redTeamProbes: DoctrineRedTeamProbe[];
  trajectory: DoctrineCapabilitySnapshot[];
}

export interface PillpintuApproval {
  id: string;
  requestedByAgent: string;
  actionType: string;
  description: string;
  riskSummary: string;
  rollbackPlan: string;
  status: 'pending' | 'approved' | 'denied';
}

export interface PillpintuPatch {
  id: string;
  title: string;
  summary: string;
  filesChanged: string[];
  diffPreview: string;
  testsAdded: string[];
  rollbackPlan: string;
  riskBefore: number;
  riskAfterEstimate: number;
  status: string;
  approvalId?: string;
}

interface UseFetchOptions<T> {
  staticFallback?: T;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useFetch<T>(path: string, defaultValue?: T, options?: UseFetchOptions<T>): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(defaultValue ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);

    fetch(`${API}${path}`, { signal: ac.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const result = json.data !== undefined ? json.data : json;
        const isEmpty = Array.isArray(result) ? result.length === 0 : result === null || result === undefined;
        if (isEmpty && options?.staticFallback !== undefined) {
          setData(options.staticFallback);
        } else {
          setData(result);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });
  }, [path]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useDoctrineOverview() {
  return useFetch<DoctrineOverview>(`${DOCTRINE}/summary`);
}

export function useConstitutions() {
  return useFetch<DoctrineConstitution[]>(`${DOCTRINE}/constitutions`, []);
}

export function useBehavioralAudits() {
  return useFetch<DoctrineBehavioralAudit[]>(`${DOCTRINE}/behavioral-audits`, []);
}

export function useWelfare() {
  return useFetch<DoctrineWelfareSignal[]>(`${DOCTRINE}/welfare`, []);
}

export function useRedTeamProbes() {
  return useFetch<DoctrineRedTeamProbe[]>(`${DOCTRINE}/red-team-probes`, []);
}

export function useRewardHacking() {
  return useFetch<DoctrineRewardHackingIncident[]>(`${DOCTRINE}/reward-hacking`, []);
}

export function useAlignmentReviews() {
  return useFetch<DoctrineAlignmentReview[]>(`${DOCTRINE}/alignment-reviews`, []);
}

export function useCodeBehaviors() {
  return useFetch<DoctrineCodeBehavior[]>(`${DOCTRINE}/code-behaviors`, []);
}

export function useCovenantLift() {
  return useFetch<DoctrineCovenantLift[]>(`${DOCTRINE}/covenant-lift`, []);
}

export function useRiskReports() {
  return useFetch<DoctrineRiskReport[]>(`${DOCTRINE}/risk-reports`, []);
}

export function useSnapshots() {
  return useFetch<DoctrineSnapshot[]>(`${DOCTRINE}/snapshots`, []);
}

export function useUserTurnSignals() {
  return useFetch<DoctrineUserTurnSignal[]>(`${DOCTRINE}/user-turn-signals`, []);
}

export function useCapabilitySnapshots() {
  return useFetch<DoctrineCapabilitySnapshot[]>(`${DOCTRINE}/capability-snapshots`, []);
}

export function useCapabilityTrajectory(agentId: string) {
  return useFetch<DoctrineCapabilitySnapshot[]>(`${DOCTRINE}/capability-trajectory/${agentId}`, []);
}

export function usePartners() {
  return useFetch<DoctrinePartner[]>(`${DOCTRINE}/partners`, [], { staticFallback: STATIC_PARTNERS });
}

export function useCavdRecords() {
  return useFetch<DoctrineCavdRecord[]>(`${DOCTRINE}/cavd-records`, [], { staticFallback: STATIC_CAVD });
}

export function useRobustnessSnapshots() {
  return useFetch<DoctrineRobustnessSnapshot[]>(`${DOCTRINE}/robustness-snapshots`, [], { staticFallback: STATIC_ROBUSTNESS });
}

export function useTransparencyReports() {
  return useFetch<DoctrineTransparencyReport[]>(`${DOCTRINE}/transparency-reports`, [], { staticFallback: STATIC_TRANSPARENCY_REPORTS });
}

export function useWelfarePlaybooks() {
  return useFetch<DoctrineWelfarePlaybook[]>(`${DOCTRINE}/welfare-playbooks`, [], { staticFallback: STATIC_WELFARE_PLAYBOOKS });
}

export function useDefenderCreditPool() {
  return useFetch<DoctrineDefenderCreditPool>(`${DOCTRINE}/defender-credit-pool`, undefined, { staticFallback: STATIC_DEFENDER_POOL });
}

export function useDslExamples() {
  return useFetch<DoctrineDslExample[]>(`${DOCTRINE}/dsl-examples`, [], { staticFallback: STATIC_DSL_EXAMPLES });
}

export function useDslSimulations() {
  return useFetch<DoctrineDslSimulation[]>(`${DOCTRINE}/dsl-simulations`, [], { staticFallback: STATIC_DSL_SIMULATIONS });
}

export function usePillpintuConfig() {
  return useFetch<DoctrinePillpintuConfig[]>(`${DOCTRINE}/pillpintu-config`, []);
}

export function usePillpintuApprovals() {
  const inner = useFetch<DoctrineAlignmentReview[]>(`${DOCTRINE}/alignment-reviews`, []);
  let data: PillpintuApproval[] | null;
  if (inner.loading) {
    data = null;
  } else if (inner.error !== null) {
    data = null;
  } else if ((inner.data ?? []).length > 0) {
    data = (inner.data as DoctrineAlignmentReview[]).map((r) => ({
      id: r.reviewId,
      requestedByAgent: r.reviewers?.[0]?.name ?? r.agentId ?? '—',
      actionType: 'alignment_review',
      description: r.rationale,
      riskSummary: `${r.signals.redTeamPasses} RT passes · eval≥${(r.signals.evalsCompositeMin ?? 0).toFixed(2)} · RH open: ${r.signals.rewardHackingOpen}`,
      rollbackPlan: (r.conditions ?? []).join('; ') || 'Follow standard rollback procedure',
      status: (r.decision === 'approved' ? 'approved' : r.decision === 'rejected' ? 'denied' : 'pending') as PillpintuApproval['status'],
    }));
  } else {
    data = STATIC_PILLPINTU_APPROVALS;
  }
  return { data, loading: inner.loading, error: inner.error, refetch: inner.refetch };
}

export function usePillpintuPatches() {
  const inner = useFetch<DoctrineRewardHackingIncident[]>(`${DOCTRINE}/reward-hacking`, []);
  const severityRisk = (s: string) => s === 'critical' ? 90 : s === 'high' ? 70 : s === 'medium' ? 50 : 30;
  let data: PillpintuPatch[] | null;
  if (inner.loading) {
    data = null;
  } else if (inner.error !== null) {
    data = null;
  } else if ((inner.data ?? []).length > 0) {
    data = (inner.data as DoctrineRewardHackingIncident[]).map((r) => ({
      id: r.incidentId,
      title: `${r.rule} — ${r.agentId}`,
      summary: r.remediation,
      filesChanged: [],
      diffPreview: `Proxy metric: ${r.proxyMetric}\nTrue objective: ${r.trueObjective}\nPattern: ${r.pattern}`,
      testsAdded: [],
      rollbackPlan: r.remediation,
      riskBefore: severityRisk(r.severity),
      riskAfterEstimate: (r.status === 'resolved' || r.status === 'remediated') ? 5 : 40,
      status: r.status === 'resolved' ? 'approved' : 'awaiting_approval',
    }));
  } else {
    data = STATIC_PILLPINTU_PATCHES;
  }
  return { data, loading: inner.loading, error: inner.error, refetch: inner.refetch };
}

export function usePillpintuAgent(agentId: string) {
  return useFetch<DoctrinePillpintuConfig>(`${DOCTRINE}/pillpintu/${agentId}`);
}

export function useSystemCard(agentId: string) {
  return useFetch<DoctrineSystemCard>(`${DOCTRINE}/system-card/${agentId}`);
}

export async function triggerReplay(snapshotId: number): Promise<unknown> {
  const res = await fetch(`${API}${DOCTRINE}/snapshots/${snapshotId}/replay`, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function seedDoctrine(): Promise<unknown> {
  const res = await fetch(`${API}${DOCTRINE}/seed`, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function DoctrineLoader({ loading, error, children }: { loading: boolean; error: string | null; children: React.ReactNode }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', color: 'var(--color-a11oy-text-ghost, #8a8a8a)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', letterSpacing: '0.1em' }}>LOADING DOCTRINE DATA…</div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', color: '#e05050' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>DOCTRINE ERROR</div>
          <div style={{ fontSize: '0.7rem', marginTop: '0.5rem', color: 'var(--color-a11oy-text-ghost, #8a8a8a)' }}>{error}</div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
