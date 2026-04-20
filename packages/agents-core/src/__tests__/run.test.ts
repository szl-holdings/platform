import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The AgentRun lifecycle calls globalCollector.recordKnown with metric names
// (e.g. "run_status_transition", "step_started") that are not part of the
// shared cognitive-observability KnownMetricName registry. To keep these
// safety-critical tests focused on approval/retry/dead-letter behaviour, we
// stub the collector with a no-op shim.
vi.mock("@workspace/cognitive-observability", () => ({
  globalCollector: {
    recordKnown: vi.fn(),
    record: vi.fn(),
  },
}));

import { createAgentRun } from "../run.js";
import { getDeadLetterEntries } from "../dead-letter.js";
import {
  clearApprovalInbox,
  clearPendingApprovalRequests,
} from "@workspace/approvals-inbox";

beforeEach(() => {
  clearApprovalInbox();
  clearPendingApprovalRequests();
});

afterEach(() => {
  clearApprovalInbox();
  clearPendingApprovalRequests();
});

describe("AgentRun", () => {
  it("executes a happy-path step and completes the run", async () => {
    const run = createAgentRun("happy path", {
      runId: `run-happy-${Date.now()}`,
      retryPolicy: { maxAttempts: 2, initialDelayMs: 0, maxDelayMs: 0, backoffMultiplier: 1 },
    });
    await run.start();

    const handler = vi.fn(async (input: { n: number }) => ({ doubled: input.n * 2 }));

    const output = await run.step(
      {
        id: "double",
        name: "double_number",
        handler,
      },
      { n: 21 },
    );

    expect(output).toEqual({ doubled: 42 });
    expect(handler).toHaveBeenCalledTimes(1);

    const summary = await run.complete("done");
    expect(summary.status).toBe("completed");
    expect(summary.stepResults).toHaveLength(1);
    expect(summary.stepResults[0].status).toBe("completed");
    expect(summary.stepResults[0].retryCount).toBe(0);
  });

  it("lands a permanently-failing step in the dead-letter store after max retries", async () => {
    const runId = `run-dead-${Date.now()}`;
    const run = createAgentRun("guaranteed failure", {
      runId,
      retryPolicy: { maxAttempts: 3, initialDelayMs: 0, maxDelayMs: 0, backoffMultiplier: 1 },
    });
    await run.start();

    const handler = vi.fn(async () => {
      throw new Error("provider unavailable");
    });

    let stepError: unknown;
    try {
      await run.step(
        {
          id: "always-fail",
          name: "always_fail",
          handler,
        },
        {},
      );
    } catch (err) {
      stepError = err;
    }

    expect(stepError).toBeDefined();
    expect(handler).toHaveBeenCalledTimes(3);

    const summary = await run.fail(stepError);

    expect(summary.status).toBe("dead_lettered");
    expect(summary.errorCategory).toBe("provider");

    const entries = getDeadLetterEntries().filter((e) => e.runId === runId);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      runId,
      objective: "guaranteed failure",
      errorCategory: "provider",
      attemptCount: 3,
      manuallyResolved: false,
    });
  });
});
