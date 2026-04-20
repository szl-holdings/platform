/**
 * End-to-end logic tests for the Approval Inbox screen.
 *
 * These tests import the production logic module that the real screen
 * (`app/(shell)/intelligence/approval-inbox.tsx`) calls at runtime, so any
 * regression in endpoint paths, decision contracts, normalization, or the
 * offline queue will break these tests.
 */
import {
  VALID_DECISIONS,
  PRIORITY_COLORS,
  isValidDecision,
  normalizeApprovals,
  approvalsListPath,
  buildReviewRequest,
  buildEscalateRequest,
  auditTrailPath,
  commentsListPath,
  buildPostCommentRequest,
  enqueueOfflineDecision,
  type Decision,
} from "../app/(shell)/intelligence/approval-inbox.logic";

describe("approval-inbox decision contract", () => {
  it("only accepts approved, rejected, or revised decisions", () => {
    expect([...VALID_DECISIONS].sort()).toEqual(["approved", "rejected", "revised"]);
    for (const d of ["approved", "rejected", "revised"] as const) {
      expect(isValidDecision(d)).toBe(true);
    }
    expect(isValidDecision("maybe")).toBe(false);
    expect(isValidDecision("")).toBe(false);
  });

  it("throws when submitting an unknown decision value", () => {
    expect(() => buildReviewRequest(7, "maybe" as Decision, "")).toThrow(/invalid decision/i);
  });

  it("targets the correct review endpoint with a POST and decision+note body", () => {
    const req = buildReviewRequest(42, "approved", "Verified invoice total");
    expect(req).toEqual({
      path: "/api/approvals/42/review",
      method: "POST",
      body: { decision: "approved", note: "Verified invoice total" },
    });
  });

  it("surfaces rejection reasons in the mutation body", () => {
    const req = buildReviewRequest(99, "rejected", "Insufficient evidence");
    expect(req.body).toEqual({ decision: "rejected", note: "Insufficient evidence" });
  });
});

describe("approval-inbox escalation contract", () => {
  it("builds a POST request to the escalate endpoint", () => {
    const req = buildEscalateRequest(17, "Policy exception, senior review required");
    expect(req.path).toBe("/api/approvals/17/escalate");
    expect(req.method).toBe("POST");
    expect(req.body.reason).toBe("Policy exception, senior review required");
  });

  it("trims surrounding whitespace from the escalation reason", () => {
    const req = buildEscalateRequest(3, "   looks suspicious   ");
    expect(req.body.reason).toBe("looks suspicious");
  });

  it("rejects reasons shorter than four characters", () => {
    expect(() => buildEscalateRequest(1, "   x   ")).toThrow(/too short/i);
    expect(() => buildEscalateRequest(1, "")).toThrow(/too short/i);
  });
});

describe("approval-inbox list + audit + comment endpoints", () => {
  it("wires status into the list endpoint", () => {
    expect(approvalsListPath("pending")).toBe("/api/approvals?status=pending");
    expect(approvalsListPath("escalated")).toBe("/api/approvals?status=escalated");
  });

  it("exposes audit trail and comments endpoints per approval id", () => {
    expect(auditTrailPath(11)).toBe("/api/approvals/11/audit-trail");
    expect(commentsListPath(22)).toBe("/api/approvals/22/comments");
  });

  it("builds a trimmed comment body for POST", () => {
    const req = buildPostCommentRequest(5, "  needs receipt  ");
    expect(req).toEqual({
      path: "/api/approvals/5/comment",
      method: "POST",
      body: { body: "needs receipt" },
    });
  });

  it("rejects empty comment bodies", () => {
    expect(() => buildPostCommentRequest(5, "   ")).toThrow(/required/i);
  });
});

describe("approval-inbox response normalization", () => {
  it("unwraps { data: [...] } envelope", () => {
    const res = normalizeApprovals({ data: [{ id: 1 }, { id: 2 }] as unknown as Record<string, unknown>[] });
    expect(res.map((r) => (r as { id: number }).id)).toEqual([1, 2]);
  });

  it("passes through already-unwrapped arrays", () => {
    const res = normalizeApprovals([{ id: 9 }] as unknown as Record<string, unknown>[]);
    expect(res).toHaveLength(1);
  });

  it("treats missing payloads as empty (offline / error path)", () => {
    expect(normalizeApprovals(undefined)).toEqual([]);
    expect(normalizeApprovals({ data: undefined } as unknown as { data: unknown[] })).toEqual([]);
  });
});

describe("approval-inbox priority palette", () => {
  it("renders distinct severity colors including critical red", () => {
    expect(PRIORITY_COLORS.critical).toBe("#ef4444");
    expect(PRIORITY_COLORS.high).toBe("#f97316");
    expect(PRIORITY_COLORS.medium).toBe("#f59e0b");
    expect(PRIORITY_COLORS.low).toBe("#6b7280");
    // ensure the four are unique (no accidental duplicates)
    const unique = new Set(Object.values(PRIORITY_COLORS));
    expect(unique.size).toBe(4);
  });
});

describe("approval-inbox offline decision queue", () => {
  const approval = { id: 42, title: "Wire transfer: $50k" };

  it("enqueues a decision with timestamp + title snapshot for later replay", () => {
    const q1 = enqueueOfflineDecision(
      [],
      approval,
      "approved",
      "looks legit",
      "2026-04-20T12:00:00.000Z",
    );
    expect(q1).toHaveLength(1);
    expect(q1[0]).toEqual({
      approvalId: 42,
      approvalTitle: "Wire transfer: $50k",
      decision: "approved",
      note: "looks legit",
      queuedAt: "2026-04-20T12:00:00.000Z",
    });
  });

  it("appends in order without mutating the input queue", () => {
    const initial = [
      { approvalId: 1, approvalTitle: "a", decision: "approved" as Decision, note: "", queuedAt: "t0" },
    ];
    const next = enqueueOfflineDecision(initial, approval, "rejected", "missing docs", "t1");
    expect(initial).toHaveLength(1); // no mutation
    expect(next).toHaveLength(2);
    expect(next[1].approvalId).toBe(42);
    expect(next[1].decision).toBe("rejected");
  });

  it("preserves the original review endpoint when replaying queued decisions", () => {
    const queued = enqueueOfflineDecision([], approval, "revised", "needs correction");
    const replay = buildReviewRequest(queued[0].approvalId, queued[0].decision, queued[0].note);
    expect(replay.path).toBe("/api/approvals/42/review");
    expect(replay.body.decision).toBe("revised");
    expect(replay.body.note).toBe("needs correction");
  });
});
