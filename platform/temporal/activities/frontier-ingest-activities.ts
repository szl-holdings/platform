/**
 * Frontier Ingest Activities — wrap the in-process frontier-ingest service so
 * it can be driven from a durable Temporal workflow with retries, cost-cap
 * pause behavior, and per-source schedules.
 *
 * Activities perform external I/O (HTTP fetch via the frontier service);
 * workflow code itself stays deterministic.
 */

export interface PullSourceInput {
  sourceName: string;
}

export interface PullSourceResult {
  artifactsDiscovered: number;
  costUsd: number;
  capReached: boolean;
}

/**
 * Pull a single frontier source and run the discover→score→route pipeline.
 * The Temporal worker should configure retries (5 attempts, exponential) so
 * transient HTTP failures don't lose a polling tick.
 */
export async function pullFrontierSourceActivity(
  input: PullSourceInput,
): Promise<PullSourceResult> {
  const { getSource } = await import('@workspace/frontier-ingest');
  const { pullSource, isCapReached } = await import('@workspace/frontier-ingest');
  if (isCapReached()) {
    return { artifactsDiscovered: 0, costUsd: 0, capReached: true };
  }
  const source = getSource(input.sourceName);
  if (!source) throw new Error(`unknown frontier source: ${input.sourceName}`);
  const result = await pullSource(source);
  return {
    artifactsDiscovered: result.artifacts.length,
    costUsd: result.costUsd,
    capReached: isCapReached(),
  };
}

export async function listFrontierSourcesActivity(): Promise<string[]> {
  const { listSources } = await import('@workspace/frontier-ingest');
  return listSources().map((s) => s.name);
}
