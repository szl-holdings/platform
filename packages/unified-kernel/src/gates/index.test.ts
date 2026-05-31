/** gates (T05) — boots the kernel, then asserts the real fail-closed gate. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import { GATE_COUNTS, evaluateGates } from "./index.ts";

describe("T05 gates", () => {
  it("kernel boot registers the gates module as wired", async () => {
    const h = await start();
    expect(h.modules.T05.descriptor.backing).toBe("wired");
    expect(h.modules.T05.descriptor.api).toContain("evaluateGates");
  });

  it("carries the real gate counts with provenance", () => {
    expect(GATE_COUNTS.sentraEgress).toBe(8);
    expect(GATE_COUNTS.a11oyAnchor).toBe(44);
    expect(GATE_COUNTS.a11oyPackage).toBe(48);
  });

  it("allows only after all 8 egress gates pass", () => {
    const r = evaluateGates({
      actionClass: "contain",
      assetExists: true,
      targetOwnershipStatus: "owned",
      integrationTenantId: "t1",
      requestingTenantId: "t1",
      assetTenantId: "t1",
      approvalStatus: "approved",
      auditLoggingEnabled: true,
    });
    expect(r.allowed).toBe(true);
    expect(r.gate).toBe(0);
  });

  it("fails closed on cross-tenant asset (gate 5)", () => {
    const r = evaluateGates({
      actionClass: "scan",
      assetExists: true,
      targetOwnershipStatus: "owned",
      integrationTenantId: null,
      requestingTenantId: "t1",
      assetTenantId: "t2",
      auditLoggingEnabled: true,
    });
    expect(r.allowed).toBe(false);
    expect(r.gate).toBe(5);
  });

  it("fails closed on high-impact action without approval (gate 6)", () => {
    const r = evaluateGates({
      actionClass: "remediate",
      assetExists: true,
      targetOwnershipStatus: "owned",
      integrationTenantId: null,
      requestingTenantId: "t1",
      assetTenantId: "t1",
      auditLoggingEnabled: true,
    });
    expect(r.allowed).toBe(false);
    expect(r.gate).toBe(6);
  });
});
