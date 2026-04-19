import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  _clearAutonomyStore,
  evaluateAutonomyForAction,
  getAutonomyMode,
  listAutonomyModes,
  setAutonomyMode,
  DEFAULT_AUTONOMY_MODE,
} from "../autonomy-store";

beforeEach(async () => {
  await _clearAutonomyStore();
});

describe("autonomy-store persistence (survives module re-import)", () => {
  it("a mode set before a 'restart' is still observed afterward", async () => {
    // Simulate: operator picks approved-act, then the api-server is
    // redeployed (the module is re-imported with a fresh module-level state).
    await setAutonomyMode({
      tenantOrgId: 11,
      domain: "demo.persistence",
      mode: "approved-act",
      updatedBy: "ops@szl.test",
      reason: "post-restart survivability check",
    });

    // Force a fresh import of the store to mimic a process restart — any
    // module-level cache is rebuilt from scratch. The persisted Postgres row
    // is what guarantees the mode survives.
    vi.resetModules();
    const fresh = await import("../autonomy-store");
    const rec = await fresh.getAutonomyMode(11, "demo.persistence");
    expect(rec.mode).toBe("approved-act");
    expect(rec.tenantOrgId).toBe(11);
    expect(rec.updatedBy).toBe("ops@szl.test");
    expect(rec.reason).toBe("post-restart survivability check");

    // And the evaluator on the fresh module sees the same persisted mode.
    const decision = await fresh.evaluateAutonomyForAction(11, "demo.persistence");
    expect(decision.policyState).toBe("allowed");
    expect(decision.disposition).toBe("execute");
  });
});

describe("autonomy-store", () => {
  it("returns the default mode for an unset (tenant, domain)", async () => {
    const rec = await getAutonomyMode(7, "vessels.routing");
    expect(rec.mode).toBe(DEFAULT_AUTONOMY_MODE);
    expect(rec.tenantOrgId).toBe(7);
    expect(rec.domain).toBe("vessels.routing");
  });

  it("persists a mode change and returns it for the same (tenant, domain)", async () => {
    await setAutonomyMode({
      tenantOrgId: 7,
      domain: "vessels.routing",
      mode: "approved-act",
      updatedBy: "captain@szl.test",
    });
    expect((await getAutonomyMode(7, "vessels.routing")).mode).toBe("approved-act");
    // Different tenant must not see this value
    expect((await getAutonomyMode(8, "vessels.routing")).mode).toBe(DEFAULT_AUTONOMY_MODE);
  });

  it("isolates per-tenant state in listAutonomyModes", async () => {
    await setAutonomyMode({ tenantOrgId: 7, domain: "vessels.routing", mode: "observe" });
    await setAutonomyMode({ tenantOrgId: 7, domain: "holdings.deal-scoring", mode: "draft" });
    await setAutonomyMode({ tenantOrgId: 8, domain: "vessels.routing", mode: "approved-act" });
    expect((await listAutonomyModes(7)).map(r => r.domain).sort()).toEqual([
      "holdings.deal-scoring",
      "vessels.routing",
    ]);
    expect((await listAutonomyModes(8)).map(r => r.mode)).toEqual(["approved-act"]);
  });

  it("upserts (does not duplicate) when the same (tenant, domain) is set twice", async () => {
    await setAutonomyMode({ tenantOrgId: 9, domain: "x.y", mode: "observe" });
    await setAutonomyMode({ tenantOrgId: 9, domain: "x.y", mode: "approved-act", updatedBy: "u" });
    const list = await listAutonomyModes(9);
    expect(list).toHaveLength(1);
    expect(list[0].mode).toBe("approved-act");
    expect(list[0].updatedBy).toBe("u");
  });

  it("blocks side-effecting actions when mode is observe", async () => {
    await setAutonomyMode({ tenantOrgId: 1, domain: "vessels.routing", mode: "observe" });
    const decision = await evaluateAutonomyForAction(1, "vessels.routing", { actionLabel: "deviate route" });
    expect(decision.disposition).toBe("block");
    expect(decision.policyState).toBe("blocked");
    expect(decision.policyReason).toMatch(/observe/i);
    expect(decision.policyReason).toMatch(/deviate route/);
  });

  it("queues actions when mode requires approval (ask-to-act / recommend)", async () => {
    await setAutonomyMode({ tenantOrgId: 1, domain: "x.y", mode: "ask-to-act" });
    expect((await evaluateAutonomyForAction(1, "x.y")).disposition).toBe("queue");
    await setAutonomyMode({ tenantOrgId: 1, domain: "x.y", mode: "recommend" });
    expect((await evaluateAutonomyForAction(1, "x.y")).disposition).toBe("queue");
  });

  it("drafts when mode is draft", async () => {
    await setAutonomyMode({ tenantOrgId: 1, domain: "x.y", mode: "draft" });
    const d = await evaluateAutonomyForAction(1, "x.y");
    expect(d.disposition).toBe("draft");
    expect(d.policyState).toBe("requires-approval");
  });

  it("executes when mode is approved-act", async () => {
    await setAutonomyMode({ tenantOrgId: 1, domain: "x.y", mode: "approved-act" });
    const d = await evaluateAutonomyForAction(1, "x.y");
    expect(d.disposition).toBe("execute");
    expect(d.policyState).toBe("allowed");
  });

  it("matches domains case-insensitively (Vessels.Routing == vessels.routing)", async () => {
    await setAutonomyMode({ tenantOrgId: 5, domain: "Vessels.Routing", mode: "approved-act" });
    expect((await getAutonomyMode(5, "vessels.routing")).mode).toBe("approved-act");
    expect((await getAutonomyMode(5, "VESSELS.ROUTING")).mode).toBe("approved-act");
    // And updates to a different casing should not duplicate the row.
    await setAutonomyMode({ tenantOrgId: 5, domain: "vessels.routing", mode: "observe" });
    const list = await listAutonomyModes(5);
    expect(list).toHaveLength(1);
    expect(list[0].mode).toBe("observe");
    expect(list[0].domain).toBe("vessels.routing");
  });

  it("does not race when many writers touch the same (tenant, domain)", async () => {
    // Concurrent upserts should all succeed (no unique-violation 500s) and
    // collapse onto a single row.
    const writers = Array.from({ length: 10 }, (_, i) =>
      setAutonomyMode({
        tenantOrgId: 42,
        domain: "concurrent.domain",
        mode: i % 2 === 0 ? "observe" : "approved-act",
        updatedBy: `writer-${i}`,
      }),
    );
    await Promise.all(writers);
    const rows = await listAutonomyModes(42);
    expect(rows).toHaveLength(1);
    expect(rows[0].domain).toBe("concurrent.domain");
  });

  it("does not race for global (NULL tenant) entries either", async () => {
    const writers = Array.from({ length: 6 }, (_, i) =>
      setAutonomyMode({
        tenantOrgId: null,
        domain: "global.domain",
        mode: i % 2 === 0 ? "draft" : "ask-to-act",
      }),
    );
    await Promise.all(writers);
    const rows = await listAutonomyModes(null);
    expect(rows).toHaveLength(1);
  });
});
