import { describe, it, expect, beforeEach } from "vitest";
import {
  _clearAutonomyStore,
  evaluateAutonomyForAction,
  getAutonomyMode,
  listAutonomyModes,
  setAutonomyMode,
  DEFAULT_AUTONOMY_MODE,
} from "../autonomy-store";

beforeEach(() => {
  _clearAutonomyStore();
});

describe("autonomy-store", () => {
  it("returns the default mode for an unset (tenant, domain)", () => {
    const rec = getAutonomyMode(7, "vessels.routing");
    expect(rec.mode).toBe(DEFAULT_AUTONOMY_MODE);
    expect(rec.tenantOrgId).toBe(7);
    expect(rec.domain).toBe("vessels.routing");
  });

  it("persists a mode change and returns it for the same (tenant, domain)", () => {
    setAutonomyMode({
      tenantOrgId: 7,
      domain: "vessels.routing",
      mode: "approved-act",
      updatedBy: "captain@szl.test",
    });
    expect(getAutonomyMode(7, "vessels.routing").mode).toBe("approved-act");
    // Different tenant must not see this value
    expect(getAutonomyMode(8, "vessels.routing").mode).toBe(DEFAULT_AUTONOMY_MODE);
  });

  it("isolates per-tenant state in listAutonomyModes", () => {
    setAutonomyMode({ tenantOrgId: 7, domain: "vessels.routing", mode: "observe" });
    setAutonomyMode({ tenantOrgId: 7, domain: "holdings.deal-scoring", mode: "draft" });
    setAutonomyMode({ tenantOrgId: 8, domain: "vessels.routing", mode: "approved-act" });
    expect(listAutonomyModes(7).map(r => r.domain).sort()).toEqual([
      "holdings.deal-scoring",
      "vessels.routing",
    ]);
    expect(listAutonomyModes(8).map(r => r.mode)).toEqual(["approved-act"]);
  });

  it("blocks side-effecting actions when mode is observe", () => {
    setAutonomyMode({ tenantOrgId: 1, domain: "vessels.routing", mode: "observe" });
    const decision = evaluateAutonomyForAction(1, "vessels.routing", { actionLabel: "deviate route" });
    expect(decision.disposition).toBe("block");
    expect(decision.policyState).toBe("blocked");
    expect(decision.policyReason).toMatch(/observe/i);
    expect(decision.policyReason).toMatch(/deviate route/);
  });

  it("queues actions when mode requires approval (ask-to-act / recommend)", () => {
    setAutonomyMode({ tenantOrgId: 1, domain: "x.y", mode: "ask-to-act" });
    expect(evaluateAutonomyForAction(1, "x.y").disposition).toBe("queue");
    setAutonomyMode({ tenantOrgId: 1, domain: "x.y", mode: "recommend" });
    expect(evaluateAutonomyForAction(1, "x.y").disposition).toBe("queue");
  });

  it("drafts when mode is draft", () => {
    setAutonomyMode({ tenantOrgId: 1, domain: "x.y", mode: "draft" });
    const d = evaluateAutonomyForAction(1, "x.y");
    expect(d.disposition).toBe("draft");
    expect(d.policyState).toBe("requires-approval");
  });

  it("executes when mode is approved-act", () => {
    setAutonomyMode({ tenantOrgId: 1, domain: "x.y", mode: "approved-act" });
    const d = evaluateAutonomyForAction(1, "x.y");
    expect(d.disposition).toBe("execute");
    expect(d.policyState).toBe("allowed");
  });
});
