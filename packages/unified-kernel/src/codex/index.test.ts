/** codex — boots the kernel, then asserts the 4 real codex-kernel contracts. */
import { describe, it, expect } from "vitest";
import { start } from "../kernel.ts";
import {
  runCodexContracts,
  computeTraceIdentity,
  resolveVersionLineage,
  auditSecrets,
  resolveDeploymentContract,
} from "./index.ts";

describe("codex-kernel contracts", () => {
  it("kernel boot runs all 4 contracts as the codex-contracts check", async () => {
    const h = await start();
    const c = h.initReceipt.checks.find((x) => x.name === "codex-contracts");
    expect(c?.pass).toBe(true);
  });

  it("computeTraceIdentity is deterministic for identical inputs", () => {
    const a = computeTraceIdentity("exp", "deadbeef", 12);
    const b = computeTraceIdentity("exp", "deadbeef", 12);
    expect(a.trace_id).toBe(b.trace_id);
    expect(a.span_ids.length).toBeGreaterThan(0);
  });

  it("resolveVersionLineage returns a kernel version + commit", () => {
    const l = resolveVersionLineage({ payload_version: "p/1", resolved_at: new Date().toISOString() });
    expect(l.kernel_version.length).toBeGreaterThan(0);
  });

  it("auditSecrets reports degrade-on-missing without leaking values", () => {
    const a = auditSecrets({ required_secrets: [], optional_secrets: ["NOPE"], missing_secret_behavior: "degrade_gracefully" }, new Date().toISOString());
    expect(typeof a.degraded).toBe("boolean");
  });

  it("resolveDeploymentContract binds a platform + healthcheck (capability binding)", () => {
    const d = resolveDeploymentContract();
    expect(d.platform.length).toBeGreaterThan(0);
    expect(d.healthcheck.path.length).toBeGreaterThan(0);
  });

  it("runCodexContracts returns all four contract outputs", () => {
    const r = runCodexContracts({ x: 1 });
    expect(r.traceIdentity.trace_id.length).toBeGreaterThan(0);
    expect(r.versionLineage.kernel_version.length).toBeGreaterThan(0);
    expect(r.deploymentContract.platform.length).toBeGreaterThan(0);
  });
});
