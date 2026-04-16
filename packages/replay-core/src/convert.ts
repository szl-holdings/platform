/**
 * Capture-to-Replay conversion pipeline.
 *
 * Provides explicit transforms from captured `IncidentSnapshot` and `FlowSnapshot`
 * records (produced by capture.ts) into `ReplaySnapshot` objects (consumed by replay.ts).
 *
 * End-to-end usage:
 *   1. captureIncident()   →  raw IncidentSnapshot stored in capture store
 *   2. redactIncidentPII() →  redacted IncidentSnapshot (sanitized=true, piiRedacted=true)
 *   3. incidentToReplaySnapshot() → ReplaySnapshot registered in snapshot store
 *   4. replaySnapshot()    →  ReplayRunReport with ground-truth comparison
 *
 * Or in batch:
 *   exportDataset() + batchConvert() → ReplaySnapshot[] (ready for replay)
 */

import type { IncidentSnapshot, FlowSnapshot } from "./capture.ts";
import { createSnapshot } from "./snapshot.ts";
import type { ReplaySnapshot } from "./snapshot.ts";

export interface IncidentConvertOptions {
  /** Override the scenario ID (defaults to the incident's scenarioId). */
  scenarioId?: string;
  /** Override the label (defaults to the incident title). */
  label?: string;
  /** Extra tags to add beyond those in the capture context. */
  extraTags?: string[];
  /** If true, registers the resulting snapshot in the snapshot store. Default: true. */
  register?: boolean;
}

/**
 * Convert a captured (and ideally already-redacted) IncidentSnapshot into a ReplaySnapshot
 * suitable for use with replaySnapshot() and replayScenario().
 *
 * The converter maps:
 *   - inputContext          → historicalContext (background data for the agent)
 *   - inputContext          → agentInputs[0] (the primary input the agent receives)
 *   - agentDecision         → groundTruth (expected agent behavior for comparison)
 *   - severity, outcome     → metadata
 *
 * If the snapshot is not yet redacted, this will proceed but log a warning —
 * call redactIncidentPII() before converting for safe replay pipelines.
 */
export function incidentToReplaySnapshot(
  incident: IncidentSnapshot,
  options: IncidentConvertOptions = {},
): ReplaySnapshot {
  if (!incident.piiRedacted) {
    console.warn(
      `[replay-core] incidentToReplaySnapshot: incident "${incident.id}" has piiRedacted=false. ` +
      "Call redactIncidentPII() before converting to avoid PII exposure in replay pipelines.",
    );
  }

  const { scenarioId = incident.scenarioId, label = incident.title, extraTags = [], register = true } = options;

  const snapshot = {
    id: `replay-${incident.id}`,
    scenarioId,
    label,
    domain: incident.domain,
    snapshotType: "incident" as const,
    historicalContext: {
      ...incident.inputContext,
      incidentType: incident.incidentType,
      severity: incident.severity,
    },
    agentInputs: [incident.inputContext],
    groundTruth: incident.agentDecision ?? {},
    sanitized: incident.sanitized,
    tags: [
      ...incident.captureContext.tags,
      ...extraTags,
      `severity:${incident.severity}`,
      `outcome:${incident.outcome}`,
    ],
    metadata: {
      sourceIncidentId: incident.id,
      incidentType: incident.incidentType,
      severity: incident.severity,
      outcome: incident.outcome,
      capturedAt: incident.captureContext.capturedAt,
      capturedBy: incident.captureContext.capturedBy,
      humanOverride: incident.humanOverride,
      ...incident.metadata,
    },
    version: "1.0",
  };

  if (register) {
    return createSnapshot(snapshot);
  }
  return { ...snapshot, createdAt: new Date().toISOString() };
}

export interface FlowConvertOptions {
  scenarioId?: string;
  label?: string;
  extraTags?: string[];
  register?: boolean;
}

/**
 * Convert a captured FlowSnapshot into a ReplaySnapshot.
 *
 * Each step's input feeds into agentInputs (allowing per-step replay),
 * and the final step's output becomes the groundTruth for end-to-end comparison.
 * The full step sequence is preserved in historicalContext for context.
 */
export function flowToReplaySnapshot(
  flow: FlowSnapshot,
  options: FlowConvertOptions = {},
): ReplaySnapshot {
  if (!flow.piiRedacted) {
    console.warn(
      `[replay-core] flowToReplaySnapshot: flow "${flow.id}" has piiRedacted=false. ` +
      "Call exportDataset() or manually redact flow steps before converting.",
    );
  }

  const { scenarioId = flow.scenarioId, label = flow.title, extraTags = [], register = true } = options;

  const lastStep = flow.steps.at(-1);
  const groundTruth = lastStep?.output ?? {};

  const snapshot = {
    id: `replay-${flow.id}`,
    scenarioId,
    label,
    domain: flow.domain,
    snapshotType: "flow" as const,
    historicalContext: {
      flowType: flow.flowType,
      totalSteps: flow.steps.length,
      stepNames: flow.steps.map(s => s.stepName),
      steps: flow.steps.map(s => ({
        stepIndex: s.stepIndex,
        stepName: s.stepName,
        input: s.input,
        output: s.output,
        durationMs: s.durationMs,
        toolsInvoked: s.toolsInvoked,
        policyChecks: s.policyChecks,
      })),
    },
    agentInputs: flow.steps.map(s => s.input),
    groundTruth,
    sanitized: flow.sanitized,
    tags: [
      ...flow.captureContext.tags,
      ...extraTags,
      `flowType:${flow.flowType}`,
    ],
    metadata: {
      sourceFlowId: flow.id,
      flowType: flow.flowType,
      totalSteps: flow.steps.length,
      capturedAt: flow.captureContext.capturedAt,
      capturedBy: flow.captureContext.capturedBy,
      ...flow.metadata,
    },
    version: "1.0",
  };

  if (register) {
    return createSnapshot(snapshot);
  }
  return { ...snapshot, createdAt: new Date().toISOString() };
}

/**
 * Batch-convert an exported dataset (from exportDataset()) into ReplaySnapshots.
 * All records from exportDataset() are already PII-redacted and safe for replay pipelines.
 *
 * Returns a summary of converted snapshots by source type.
 */
export function batchConvert(
  dataset: { incidents: IncidentSnapshot[]; flows: FlowSnapshot[] },
  options: { register?: boolean } = {},
): { incidents: ReplaySnapshot[]; flows: ReplaySnapshot[]; total: number } {
  const { register = true } = options;

  const incidents = dataset.incidents.map(inc =>
    incidentToReplaySnapshot(inc, { register })
  );

  const flows = dataset.flows.map(flow =>
    flowToReplaySnapshot(flow, { register })
  );

  return { incidents, flows, total: incidents.length + flows.length };
}
