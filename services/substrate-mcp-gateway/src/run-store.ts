/**
 * Substrate MCP Gateway — In-Process Run Store
 *
 * Tracks submitted runs by ID so the gateway can serve getRun requests.
 * In production this should be backed by a persistent store (e.g. PostgreSQL via
 * the substrate journal). For Phase 1 the gateway keeps an in-process map so the
 * same gateway process can serve both submit and get.
 *
 * The substrate journal (defaultRunStore) is the source of truth for completed
 * runs that survive restart.
 */

import type { PipelineRun } from '@szl/substrate/types';

const _runs = new Map<string, PipelineRun>();

export function storeRun(run: PipelineRun): void {
  _runs.set(run.runId, run);
}

export function updateRun(run: PipelineRun): void {
  _runs.set(run.runId, run);
}

export function getRun(runId: string): PipelineRun | undefined {
  return _runs.get(runId);
}

export function getAllRuns(): PipelineRun[] {
  return [..._runs.values()];
}

export function runCount(): number {
  return _runs.size;
}
