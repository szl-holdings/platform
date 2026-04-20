import { describe, it, expect } from "vitest";
import {
  workflowStatusSchema,
  workflowPrioritySchema,
  createWorkflowBodySchema,
  workflowListQuerySchema,
  workflowIdParamSchema,
  approveWorkflowBodySchema,
  rejectWorkflowBodySchema,
  actionListQuerySchema,
  agentListQuerySchema,
} from "./alloy";

describe("workflowStatusSchema", () => {
  it.each([
    "pending",
    "in_progress",
    "completed",
    "cancelled",
    "blocked",
    "failed",
  ] as const)("accepts %s", (s) => {
    expect(workflowStatusSchema.parse(s)).toBe(s);
  });
  it("rejects unknown status", () => {
    expect(() => workflowStatusSchema.parse("done")).toThrow();
  });
});

describe("workflowPrioritySchema", () => {
  it("rejects unknown priority", () => {
    expect(() => workflowPrioritySchema.parse("urgent")).toThrow();
  });
});

describe("createWorkflowBodySchema", () => {
  const base = { title: "Onboard", type: "approval" };

  it("applies priority default", () => {
    const r = createWorkflowBodySchema.parse(base);
    expect(r.priority).toBe("medium");
  });

  it("rejects empty title", () => {
    expect(() =>
      createWorkflowBodySchema.parse({ title: "", type: "x" }),
    ).toThrow();
  });

  it("rejects title > 256 chars", () => {
    expect(() =>
      createWorkflowBodySchema.parse({ title: "x".repeat(257), type: "x" }),
    ).toThrow();
  });

  it("rejects empty type", () => {
    expect(() =>
      createWorkflowBodySchema.parse({ title: "x", type: "" }),
    ).toThrow();
  });

  it("coerces dueAt from ISO string", () => {
    const r = createWorkflowBodySchema.parse({
      ...base,
      dueAt: "2026-12-01T00:00:00Z",
    });
    expect(r.dueAt).toBeInstanceOf(Date);
  });

  it("rejects assignedTo <= 0", () => {
    expect(() =>
      createWorkflowBodySchema.parse({ ...base, assignedTo: 0 }),
    ).toThrow();
  });
});

describe("workflowListQuerySchema", () => {
  it("applies pagination defaults", () => {
    const r = workflowListQuerySchema.parse({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(50);
    expect(r.sortOrder).toBe("desc");
  });
  it("coerces orgId and assignedTo", () => {
    const r = workflowListQuerySchema.parse({ orgId: "1", assignedTo: "5" });
    expect(r.orgId).toBe(1);
    expect(r.assignedTo).toBe(5);
  });
  it("rejects unknown status", () => {
    expect(() => workflowListQuerySchema.parse({ status: "rogue" })).toThrow();
  });
});

describe("workflowIdParamSchema", () => {
  it("coerces id from string", () => {
    expect(workflowIdParamSchema.parse({ id: "42" }).id).toBe(42);
  });
});

describe("approveWorkflowBodySchema", () => {
  it("accepts an empty body", () => {
    expect(approveWorkflowBodySchema.parse({})).toEqual({});
  });
  it("rejects comment > 1024 chars", () => {
    expect(() =>
      approveWorkflowBodySchema.parse({ comment: "x".repeat(1025) }),
    ).toThrow();
  });
});

describe("rejectWorkflowBodySchema", () => {
  it("requires a non-empty reason", () => {
    expect(() => rejectWorkflowBodySchema.parse({ reason: "" })).toThrow();
    expect(() => rejectWorkflowBodySchema.parse({})).toThrow();
  });
  it("rejects reason > 1024 chars", () => {
    expect(() =>
      rejectWorkflowBodySchema.parse({ reason: "x".repeat(1025) }),
    ).toThrow();
  });
});

describe("actionListQuerySchema", () => {
  it("coerces workflowId and orgId", () => {
    const r = actionListQuerySchema.parse({ workflowId: "1", orgId: "2" });
    expect(r.workflowId).toBe(1);
    expect(r.orgId).toBe(2);
  });
});

describe("agentListQuerySchema", () => {
  it("applies pagination defaults", () => {
    const r = agentListQuerySchema.parse({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(50);
  });
  it("rejects negative orgId", () => {
    expect(() => agentListQuerySchema.parse({ orgId: -1 })).toThrow();
  });
});
