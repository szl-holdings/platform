/**
 * Self-Improving Data Flywheel — Trajectory Capture & Quality Scoring
 *
 * Capability 3: Every Nuro Mesh orchestration run is captured as a structured
 * training signal. A quality-filtering pipeline scores runs and feeds high-quality
 * trajectories back into prompt optimization as few-shot examples.
 *
 * The platform gets smarter with every use:
 *   1. Capture: Every orchestrate() call produces a trajectory
 *   2. Score: Quality pipeline evaluates trajectory on multiple dimensions
 *   3. Filter: High-quality trajectories become "golden runs"
 *   4. Inject: Golden runs are used as few-shot examples in future prompts
 */

import { createHash } from 'node:crypto';

export type TrajectoryStatus = 'captured' | 'scored' | 'golden' | 'filtered_out';

export interface AgentRoutingStep {
  agentId: string;
  agentName: string;
  domain: string;
  tokensUsed: number;
  latencyMs: number;
  confidence: number;
  success: boolean;
  response: string;
}

export interface ToolCallRecord {
  toolName: string;
  agentId: string;
  arguments: Record<string, unknown>;
  output: string;
  success: boolean;
  latencyMs: number;
}

export interface OrchestrateTrajectory {
  trajectoryId: string;
  contentHash: string;
  query: string;
  agentRouting: AgentRoutingStep[];
  toolCalls: ToolCallRecord[];
  intermediateOutputs: string[];
  finalSynthesis: string;
  averageConfidence: number;
  totalTokens: number;
  totalLatencyMs: number;
  isHighStakes: boolean;
  validationPassed: boolean;
  validationNotes: string;
  userFeedbackScore: number | null;
  qualityScore: number | null;
  qualityDimensions: QualityDimensions | null;
  status: TrajectoryStatus;
  goldenRunRank: number | null;
  fewShotExample: string | null;
  capturedAt: string;
  orgId: number | null;
  metadata: Record<string, unknown>;
}

export interface QualityDimensions {
  coherence: number;
  completeness: number;
  efficiency: number;
  safetyScore: number;
  agentCoordination: number;
  overallScore: number;
}

function computeContentHash(
  trajectory: Pick<OrchestrateTrajectory, 'query' | 'finalSynthesis' | 'capturedAt'>,
): string {
  const payload = `${trajectory.query}:${trajectory.finalSynthesis}:${trajectory.capturedAt}`;
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

function scoreTrajectory(trajectory: OrchestrateTrajectory): QualityDimensions {
  const coherence = Math.min(
    1,
    (trajectory.averageConfidence / 100) * 0.5 +
      (trajectory.validationPassed ? 0.3 : 0) +
      (trajectory.finalSynthesis.length > 200 ? 0.2 : trajectory.finalSynthesis.length / 1000),
  );

  const agentCount = trajectory.agentRouting.length;
  const successfulAgents = trajectory.agentRouting.filter((a) => a.success).length;
  const agentCoordination = agentCount > 0 ? successfulAgents / agentCount : 0;

  const completeness = Math.min(
    1,
    agentCoordination * 0.4 +
      (trajectory.finalSynthesis.length > 500 ? 0.3 : trajectory.finalSynthesis.length / 1666) +
      (trajectory.toolCalls.length > 0 ? 0.2 : 0) +
      (trajectory.intermediateOutputs.length > 0 ? 0.1 : 0),
  );

  const tokenEfficiency =
    trajectory.totalTokens > 0 ? Math.min(1, 5000 / trajectory.totalTokens) : 0;
  const latencyEfficiency = Math.min(1, 10000 / Math.max(1, trajectory.totalLatencyMs));
  const efficiency = tokenEfficiency * 0.5 + latencyEfficiency * 0.5;

  const toolSuccessRate =
    trajectory.toolCalls.length > 0
      ? trajectory.toolCalls.filter((t) => t.success).length / trajectory.toolCalls.length
      : 1;
  const safetyScore = Math.min(
    1,
    (trajectory.validationPassed ? 0.5 : 0.2) +
      toolSuccessRate * 0.3 +
      (trajectory.isHighStakes && trajectory.validationPassed
        ? 0.2
        : trajectory.isHighStakes
          ? 0
          : 0.2),
  );

  const overallScore =
    coherence * 0.25 +
    completeness * 0.25 +
    efficiency * 0.15 +
    safetyScore * 0.25 +
    agentCoordination * 0.1;

  return { coherence, completeness, efficiency, safetyScore, agentCoordination, overallScore };
}

function buildFewShotExample(trajectory: OrchestrateTrajectory): string {
  const agentList = trajectory.agentRouting
    .map((a) => `${a.agentName} (${a.domain}, confidence: ${a.confidence}%)`)
    .join(', ');
  return `## Example Query & Response
Query: "${trajectory.query.slice(0, 200)}"
Agents Engaged: ${agentList}
Quality Score: ${(trajectory.qualityScore! * 100).toFixed(0)}/100
Response Pattern: ${trajectory.finalSynthesis.slice(0, 500)}
---`;
}

const GOLDEN_RUN_THRESHOLD = 0.75;
const MAX_TRAJECTORIES = 5000;
const MAX_GOLDEN_RUNS = 200;

export class TrajectoryStore {
  private trajectories: OrchestrateTrajectory[] = [];
  private goldenRuns: OrchestrateTrajectory[] = [];

  capture(data: {
    query: string;
    agentRouting: AgentRoutingStep[];
    toolCalls?: ToolCallRecord[];
    intermediateOutputs?: string[];
    finalSynthesis: string;
    averageConfidence: number;
    totalTokens: number;
    totalLatencyMs: number;
    isHighStakes: boolean;
    validationPassed: boolean;
    validationNotes?: string;
    orgId?: number | null;
    metadata?: Record<string, unknown>;
  }): OrchestrateTrajectory {
    const capturedAt = new Date().toISOString();
    const trajectory: OrchestrateTrajectory = {
      trajectoryId: `traj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      contentHash: '',
      query: data.query,
      agentRouting: data.agentRouting,
      toolCalls: data.toolCalls ?? [],
      intermediateOutputs: data.intermediateOutputs ?? [],
      finalSynthesis: data.finalSynthesis,
      averageConfidence: data.averageConfidence,
      totalTokens: data.totalTokens,
      totalLatencyMs: data.totalLatencyMs,
      isHighStakes: data.isHighStakes,
      validationPassed: data.validationPassed,
      validationNotes: data.validationNotes ?? '',
      userFeedbackScore: null,
      qualityScore: null,
      qualityDimensions: null,
      status: 'captured',
      goldenRunRank: null,
      fewShotExample: null,
      capturedAt,
      orgId: data.orgId ?? null,
      metadata: data.metadata ?? {},
    };
    trajectory.contentHash = computeContentHash({
      query: trajectory.query,
      finalSynthesis: trajectory.finalSynthesis,
      capturedAt,
    });

    this.trajectories.push(trajectory);
    if (this.trajectories.length > MAX_TRAJECTORIES) {
      this.trajectories.splice(0, this.trajectories.length - MAX_TRAJECTORIES);
    }

    setImmediate(() => this.scoreAndFilter(trajectory));
    return trajectory;
  }

  private scoreAndFilter(trajectory: OrchestrateTrajectory): void {
    const dims = scoreTrajectory(trajectory);
    trajectory.qualityDimensions = dims;
    trajectory.qualityScore = dims.overallScore;
    trajectory.status = 'scored';

    if (dims.overallScore >= GOLDEN_RUN_THRESHOLD) {
      trajectory.fewShotExample = buildFewShotExample(trajectory);
      trajectory.status = 'golden';
      this.goldenRuns.push(trajectory);
      this.goldenRuns.sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
      if (this.goldenRuns.length > MAX_GOLDEN_RUNS) {
        this.goldenRuns.splice(MAX_GOLDEN_RUNS);
      }
      this.goldenRuns.forEach((r, i) => {
        r.goldenRunRank = i + 1;
      });
    } else {
      trajectory.status = 'filtered_out';
    }
  }

  addUserFeedback(trajectoryId: string, score: number): boolean {
    const traj = this.trajectories.find((t) => t.trajectoryId === trajectoryId);
    if (!traj) return false;

    traj.userFeedbackScore = Math.max(-1, Math.min(1, score));
    if (traj.qualityDimensions && traj.qualityScore !== null) {
      const feedbackBoost = traj.userFeedbackScore * 0.1;
      traj.qualityScore = Math.max(0, Math.min(1, traj.qualityScore + feedbackBoost));

      if (traj.qualityScore >= GOLDEN_RUN_THRESHOLD && traj.status !== 'golden') {
        traj.fewShotExample = buildFewShotExample(traj);
        traj.status = 'golden';
        this.goldenRuns.push(traj);
        this.goldenRuns.sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
        if (this.goldenRuns.length > MAX_GOLDEN_RUNS) this.goldenRuns.splice(MAX_GOLDEN_RUNS);
      }
    }
    return true;
  }

  getGoldenRunsContext(maxExamples = 3, domainFilter?: string): string {
    const runs = domainFilter
      ? this.goldenRuns.filter((r) => r.agentRouting.some((a) => a.domain === domainFilter))
      : this.goldenRuns;

    const top = runs.slice(0, maxExamples);
    if (top.length === 0) return '';

    return `## High-Quality Reference Examples (from ${this.goldenRuns.length} golden runs)\n\n${top.map((r) => r.fewShotExample).join('\n')}`;
  }

  getStats(): {
    totalCaptured: number;
    totalGolden: number;
    avgQualityScore: number;
    avgConfidence: number;
  } {
    const scored = this.trajectories.filter((t) => t.qualityScore !== null);
    const avgQuality =
      scored.length > 0 ? scored.reduce((s, t) => s + (t.qualityScore ?? 0), 0) / scored.length : 0;
    const avgConf =
      this.trajectories.length > 0
        ? this.trajectories.reduce((s, t) => s + t.averageConfidence, 0) / this.trajectories.length
        : 0;
    return {
      totalCaptured: this.trajectories.length,
      totalGolden: this.goldenRuns.length,
      avgQualityScore: avgQuality,
      avgConfidence: avgConf,
    };
  }

  getTrajectories(limit = 50, status?: TrajectoryStatus): OrchestrateTrajectory[] {
    const filtered = status
      ? this.trajectories.filter((t) => t.status === status)
      : this.trajectories;
    return filtered.slice(-limit).reverse();
  }

  getGoldenRuns(limit = 20): OrchestrateTrajectory[] {
    return this.goldenRuns.slice(0, limit);
  }
}

export const trajectoryStore = new TrajectoryStore();
