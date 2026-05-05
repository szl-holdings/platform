/**
 * Frontier Ingestion Workflow — durable, scheduled polling of all frontier
 * provider sources (Anthropic / OpenAI / Google / NVIDIA / HuggingFace).
 *
 * - Per-source `pullFrontierSourceActivity` invocations get independent retry
 *   semantics (5 attempts, exponential backoff) so a flaky provider doesn't
 *   drag the whole sweep down.
 * - When the per-source cost meter trips the cap, the workflow pauses
 *   subsequent sources for the rest of the tick — operators must explicitly
 *   raise the cap before more spend occurs.
 * - `continueAsNew` keeps history bounded for long-running schedules.
 */

import {
  proxyActivities,
  sleep,
  continueAsNew,
  workflowInfo,
} from '@temporalio/workflow';
import type * as frontierActivities from '../activities/frontier-ingest-activities.js';

const { pullFrontierSourceActivity, listFrontierSourcesActivity } = proxyActivities<
  typeof frontierActivities
>({
  startToCloseTimeout: '2m',
  retry: {
    maximumAttempts: 5,
    initialInterval: '10s',
    backoffCoefficient: 2,
    maximumInterval: '5m',
  },
});

export interface FrontierIngestWorkflowInput {
  /** Polling interval between full sweeps (ms). Default: 6h. */
  intervalMs?: number;
  /** Sweep this many times before continueAsNew. Default: 24. */
  ticksBeforeContinue?: number;
  /** Restrict to a subset of sources (by name); omit to sweep all. */
  sourceNames?: string[];
}

export interface FrontierIngestWorkflowResult {
  ticks: number;
  totalDiscovered: number;
  totalCostUsd: number;
  pausedDueToCap: boolean;
}

export async function frontierIngestWorkflow(
  input: FrontierIngestWorkflowInput = {},
): Promise<FrontierIngestWorkflowResult> {
  const interval = input.intervalMs ?? 6 * 60 * 60 * 1000;
  const ticksBeforeContinue = input.ticksBeforeContinue ?? 24;

  const sourceNames = input.sourceNames ?? (await listFrontierSourcesActivity());

  let ticks = 0;
  let totalDiscovered = 0;
  let totalCostUsd = 0;
  let pausedDueToCap = false;

  while (ticks < ticksBeforeContinue) {
    pausedDueToCap = false;
    for (const name of sourceNames) {
      const result = await pullFrontierSourceActivity({ sourceName: name });
      totalDiscovered += result.artifactsDiscovered;
      totalCostUsd += result.costUsd;
      if (result.capReached) {
        pausedDueToCap = true;
        break;
      }
    }
    ticks += 1;
    if (ticks < ticksBeforeContinue) await sleep(interval);
  }

  if (workflowInfo().historyLength > 1_000) {
    return continueAsNew<typeof frontierIngestWorkflow>(input);
  }
  return { ticks, totalDiscovered, totalCostUsd, pausedDueToCap };
}
