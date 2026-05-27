/**
 * Temporal detector — `ts-temporal/baseline-shift` (#5503).
 *
 * Canonical Time-R1 trajectory detector. Reads a `metric.trajectory`
 * stream of points-with-baseline and emits one finding per (metric,
 * lane, entity) tuple whose trajectory score exceeds the threshold.
 *
 * The deterministic scorer lives in `@workspace/anomaly-fabric` so
 * other Sentra surfaces (status board, brain) can reuse it without
 * pulling api-server in.
 */
import type { Detector, Finding } from '@szl-holdings/sentra-detector-sdk';
import {
  scoreTemporalTrajectory,
  type TemporalTrajectoryInput,
} from '@workspace/anomaly-fabric';

export const temporalBaselineShiftDetector: Detector = {
  manifest: {
    id: 'ts-temporal/baseline-shift',
    label: 'Temporal Baseline Shift (Time-R1)',
    description:
      'Scores recent metric trajectories against their pre-window baseline using a deterministic Time-R1 composite (drift · shock · direction). Emits one finding per metric whose composite exceeds the threshold.',
    kind: 'temporal',
    runtime: 'ts',
    inputs: ['metric.trajectory'],
    costClass: 'cheap',
    governanceClass: 'advisory',
    attackTechniques: ['T1071'],
    version: '1.0.0',
  },
  async evaluate(ctx) {
    const threshold = Number(ctx.params.threshold ?? 0.6);
    const rows = ((await ctx.read('metric.trajectory')) ?? []) as TemporalTrajectoryInput[];
    ctx.trace('input.loaded', { rows: rows.length, threshold });

    const findings: Finding[] = [];
    let idx = 0;
    for (const row of rows) {
      if (!row?.metricName || !Array.isArray(row.baseline) || !Array.isArray(row.trajectory)) continue;
      if (row.baseline.length < 2 || row.trajectory.length < 2) continue;
      const score = scoreTemporalTrajectory(row);
      if (score.temporalScore < threshold) continue;
      findings.push({
        id: `${ctx.detectorId}#${ctx.runId}#${idx++}`,
        detectorId: ctx.detectorId,
        runId: ctx.runId,
        severity: score.severity === 'critical' ? 'critical' : score.severity === 'high' ? 'high' : 'medium',
        score: score.temporalScore,
        title: `Temporal anomaly on ${row.metricName} (score=${score.temporalScore.toFixed(2)})`,
        summary: `Trajectory drift ${score.components.driftSigma.toFixed(2)}σ, peak shock ${score.components.peakShockSigma.toFixed(2)}σ, direction-cos-dist ${score.components.directionCosineDistance.toFixed(2)}.`,
        attackTechniques: ['T1071'],
        affectedAssets: [row.entityId ?? row.lane ?? row.metricName],
        evidence: {
          metricName: row.metricName,
          lane: row.lane,
          entityId: row.entityId,
          temporalScore: score.temporalScore,
          components: score.components,
          perStepShock: score.perStepShock.slice(0, 32),
          windowStart: score.windowStart,
          windowEnd: score.windowEnd,
        },
        recommendedAction: {
          kind: 'investigate',
          detail: `Cross-reference ${row.metricName} against contemporaneous deploys and access events; if no business cause, escalate to incident commander.`,
        },
        emittedAt: new Date().toISOString(),
        governanceClass: 'advisory',
      });
    }
    ctx.trace('finished', { findings: findings.length });
    return findings;
  },
};
