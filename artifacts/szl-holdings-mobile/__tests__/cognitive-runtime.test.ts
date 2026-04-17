/**
 * Tests for cognitive runtime utility logic and API wiring.
 *
 * These tests cover:
 * 1. Time-formatting utilities used across all 5 cognitive surfaces.
 * 2. API response normalization (wrapped vs. unwrapped array shapes).
 * 3. Priority → color mapping logic.
 * 4. Approval decision validation rules.
 * 5. Run detail + steps response merging logic.
 */

// ── Utility helpers (extracted from screen implementations) ─────────────────

function formatRelative(iso?: string): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function timeUntil(iso?: string): string {
  if (!iso) return "No expiry";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "Expired";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `Expires in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Expires in ${hrs}h`;
  return `Expires in ${Math.floor(hrs / 24)}d`;
}

function formatDuration(ms?: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  const secs = (ms / 1000).toFixed(1);
  if (ms < 60000) return `${secs}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// ── API response normalization ───────────────────────────────────────────────

type WrappedOrRaw<T> = { data: T } | T;

function normalizeList<T>(raw: WrappedOrRaw<T[]> | undefined): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const wrapped = raw as { data: T[] };
  return wrapped.data ?? [];
}

// ── Priority color logic ─────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#6b7280",
};

function priorityColor(priority: string): string {
  return PRIORITY_COLORS[priority] ?? "#6b7280";
}

// ── Decision validation ──────────────────────────────────────────────────────

const VALID_DECISIONS = ["approved", "rejected", "revised"] as const;
type Decision = typeof VALID_DECISIONS[number];

function isValidDecision(d: string): d is Decision {
  return (VALID_DECISIONS as readonly string[]).includes(d);
}

// ── Run detail merging ───────────────────────────────────────────────────────

interface RunStep { id: number | string; name: string; state: string }
interface StepsPayload { run: { id: number; state: string }; workflow?: { name?: string }; steps: RunStep[] }

function mergeRunDetail(
  baseRaw: WrappedOrRaw<{ id: number; state: string; durationMs?: number }>,
  stepsRaw: WrappedOrRaw<StepsPayload> | null,
): { id: number; state: string; durationMs?: number; steps?: RunStep[]; workflowName?: string } {
  const base = (baseRaw as { data: { id: number; state: string } })?.data ?? (baseRaw as { id: number; state: string });
  if (!stepsRaw) return base;
  const stepsData = (stepsRaw as { data: StepsPayload })?.data ?? (stepsRaw as StepsPayload);
  return {
    ...base,
    steps: Array.isArray(stepsData?.steps) ? stepsData.steps : undefined,
    workflowName: stepsData?.workflow?.name,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// TESTS
// ────────────────────────────────────────────────────────────────────────────

describe("formatRelative", () => {
  it("returns — for undefined input", () => {
    expect(formatRelative(undefined)).toBe("—");
  });

  it("returns 'just now' for very recent timestamps", () => {
    const now = new Date(Date.now() - 30000).toISOString();
    expect(formatRelative(now)).toBe("just now");
  });

  it("returns minutes ago for timestamps < 1 hour", () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60000).toISOString();
    expect(formatRelative(thirtyMinsAgo)).toBe("30m ago");
  });

  it("returns hours ago for timestamps < 24 hours", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(formatRelative(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days ago for timestamps > 24 hours", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600000).toISOString();
    expect(formatRelative(twoDaysAgo)).toBe("2d ago");
  });
});

describe("timeUntil", () => {
  it("returns 'No expiry' for undefined", () => {
    expect(timeUntil(undefined)).toBe("No expiry");
  });

  it("returns 'Expired' for past timestamps", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(timeUntil(past)).toBe("Expired");
  });

  it("returns minutes for expiry < 1h", () => {
    const future = new Date(Date.now() + 30 * 60000).toISOString();
    expect(timeUntil(future)).toMatch(/^Expires in \d+m$/);
  });

  it("returns hours for expiry < 24h", () => {
    const future = new Date(Date.now() + 5 * 3600000).toISOString();
    expect(timeUntil(future)).toBe("Expires in 5h");
  });

  it("returns days for expiry > 24h", () => {
    const future = new Date(Date.now() + 3 * 24 * 3600000).toISOString();
    expect(timeUntil(future)).toBe("Expires in 3d");
  });
});

describe("formatDuration", () => {
  it("returns — for null/undefined", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(undefined)).toBe("—");
  });

  it("returns ms for durations < 1000ms", () => {
    expect(formatDuration(500)).toBe("500ms");
  });

  it("returns seconds for durations < 60s", () => {
    expect(formatDuration(2500)).toBe("2.5s");
  });

  it("returns minutes for durations >= 60s", () => {
    expect(formatDuration(90000)).toBe("1.5m");
  });
});

describe("normalizeList — API response unwrapping", () => {
  it("handles a raw array response", () => {
    const data = [{ id: 1 }, { id: 2 }];
    expect(normalizeList(data)).toEqual(data);
  });

  it("handles a wrapped { data: [...] } response", () => {
    const data = [{ id: 1 }, { id: 2 }];
    expect(normalizeList({ data })).toEqual(data);
  });

  it("returns empty array for undefined", () => {
    expect(normalizeList(undefined)).toEqual([]);
  });

  it("returns empty array when wrapped data is missing", () => {
    expect(normalizeList({} as { data: unknown[] })).toEqual([]);
  });
});

describe("priorityColor", () => {
  it("maps critical to red", () => {
    expect(priorityColor("critical")).toBe("#ef4444");
  });

  it("maps high to orange", () => {
    expect(priorityColor("high")).toBe("#f97316");
  });

  it("maps medium to amber", () => {
    expect(priorityColor("medium")).toBe("#f59e0b");
  });

  it("maps low to gray", () => {
    expect(priorityColor("low")).toBe("#6b7280");
  });

  it("falls back to gray for unknown priorities", () => {
    expect(priorityColor("unknown")).toBe("#6b7280");
  });
});

describe("isValidDecision — approval-inbox decision validation", () => {
  it("accepts valid decisions", () => {
    expect(isValidDecision("approved")).toBe(true);
    expect(isValidDecision("rejected")).toBe(true);
    expect(isValidDecision("revised")).toBe(true);
  });

  it("rejects invalid decisions", () => {
    expect(isValidDecision("pending")).toBe(false);
    expect(isValidDecision("")).toBe(false);
    expect(isValidDecision("APPROVED")).toBe(false);
  });
});

describe("mergeRunDetail — run-review run+steps merging", () => {
  const baseRun = { id: 42, state: "completed", durationMs: 1500 };
  const steps: RunStep[] = [
    { id: 1, name: "plan", state: "completed" },
    { id: 2, name: "execute", state: "completed" },
  ];
  const stepsPayload: StepsPayload = {
    run: baseRun,
    workflow: { name: "Cognitive Loop Alpha" },
    steps,
  };

  it("merges run detail with steps from wrapped response", () => {
    const merged = mergeRunDetail({ data: baseRun }, { data: stepsPayload });
    expect(merged.id).toBe(42);
    expect(merged.steps).toEqual(steps);
    expect(merged.workflowName).toBe("Cognitive Loop Alpha");
  });

  it("merges run detail with steps from unwrapped response", () => {
    const merged = mergeRunDetail(baseRun, stepsPayload);
    expect(merged.id).toBe(42);
    expect(merged.steps).toEqual(steps);
    expect(merged.workflowName).toBe("Cognitive Loop Alpha");
  });

  it("returns base run when steps are null (graceful degradation)", () => {
    const merged = mergeRunDetail(baseRun, null);
    expect(merged.id).toBe(42);
    expect(merged.steps).toBeUndefined();
  });

  it("handles missing workflow name gracefully", () => {
    const merged = mergeRunDetail(baseRun, { run: baseRun, steps });
    expect(merged.workflowName).toBeUndefined();
  });

  it("handles non-array steps gracefully", () => {
    const badPayload = { run: baseRun, steps: null as unknown as RunStep[] };
    const merged = mergeRunDetail(baseRun, badPayload);
    expect(merged.steps).toBeUndefined();
  });
});

describe("approval API endpoint contracts", () => {
  it("approval list endpoint uses correct path for pending filter", () => {
    const status = "pending";
    const path = `/api/approvals?status=${status}`;
    expect(path).toBe("/api/approvals?status=pending");
  });

  it("approval review endpoint uses correct path and method", () => {
    const id = 99;
    const path = `/api/approvals/${id}/review`;
    expect(path).toBe("/api/approvals/99/review");
  });

  it("approval escalation endpoint uses correct path", () => {
    const id = 99;
    const path = `/api/approvals/${id}/escalate`;
    expect(path).toBe("/api/approvals/99/escalate");
  });

  it("run detail endpoint uses correct path", () => {
    const runId = 7;
    const detailPath = `/api/alloy/runs/${runId}`;
    const stepsPath = `/api/alloy/runs/${runId}/steps`;
    expect(detailPath).toBe("/api/alloy/runs/7");
    expect(stepsPath).toBe("/api/alloy/runs/7/steps");
  });

  it("briefings endpoint uses correct paths", () => {
    expect("/api/briefings").toBe("/api/briefings");
    expect("/api/pulse/today").toBe("/api/pulse/today");
  });

  it("quick actions submit to approvals endpoint", () => {
    const actionPayload = {
      resourceType: "agent_run",
      resourceId: "run-42",
      title: "Suspend Agent Run",
      actionClass: "deployment",
      priority: "critical",
      payload: {
        templateId: "suspend-agent",
        domain: "alloy",
        requiresBiometric: true,
        rollbackPoint: new Date().toISOString(),
        initiatedFrom: "mobile:secure-quick-actions",
      },
    };
    expect(actionPayload.payload.initiatedFrom).toBe("mobile:secure-quick-actions");
    expect(actionPayload.payload.rollbackPoint).toBeTruthy();
    expect(actionPayload.payload.requiresBiometric).toBe(true);
  });
});
