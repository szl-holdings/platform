/**
 * Frontier retention workflow — unit test that asserts:
 *
 *   1. The worker registry exposes `pruneFrontierRetentionActivity` so the
 *      Temporal worker can resolve the activity at runtime. Without this
 *      the scheduled workflow would fail every tick (the original code
 *      review caught exactly this gap).
 *   2. `frontierRetentionWorkflow` invokes the activity, accumulates the
 *      row-deleted counts in its result, and respects `ticksBeforeContinue`.
 */
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { frontierRetentionWorkflow } from '../workflows/frontier-retention-workflow.ts';
import { buildActivityRegistry } from '../worker.ts';

let env: TestWorkflowEnvironment;

beforeAll(async () => {
  env = await TestWorkflowEnvironment.createTimeSkipping();
}, 60_000);

afterAll(async () => {
  await env?.teardown();
}, 30_000);

it('worker activity registry includes pruneFrontierRetentionActivity', () => {
  const registry = buildActivityRegistry();
  expect(typeof registry.pruneFrontierRetentionActivity).toBe('function');
});

it('frontierRetentionWorkflow runs the prune activity and aggregates deletes', async () => {
  let activityCalls = 0;
  const activities = {
    pruneFrontierRetentionActivity: async () => {
      activityCalls += 1;
      return {
        timelineDeleted: 5,
        discardedInboxDeleted: 2,
        orphanArtifactsDeleted: 1,
        timelineCutoff: new Date().toISOString(),
        discardedInboxCutoff: new Date().toISOString(),
        skipped: false,
      };
    },
  };
  const worker = await Worker.create({
    connection: env.nativeConnection,
    taskQueue: 'frontier-retention-test',
    workflowsPath: new URL('../workflows/index.ts', import.meta.url).pathname,
    activities,
  });

  const result = await worker.runUntil(
    env.client.workflow.execute(frontierRetentionWorkflow, {
      workflowId: 'frontier-retention-test-1',
      taskQueue: 'frontier-retention-test',
      args: [{ ticksBeforeContinue: 2, intervalMs: 1 }],
    }),
  );

  expect(activityCalls).toBe(2);
  expect(result.ticks).toBe(2);
  expect(result.totalTimelineDeleted).toBe(10);
  expect(result.totalDiscardedInboxDeleted).toBe(4);
  expect(result.totalOrphanArtifactsDeleted).toBe(2);
}, 60_000);
