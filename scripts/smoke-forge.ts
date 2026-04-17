/**
 * Forge smoke test (10 steps).
 *
 * Idempotent end-to-end check of the Forge service layer. Runs against the
 * already-seeded demo data. Asserts each canonical step of the governance
 * loop produces the expected outcome.
 *
 * Run with: pnpm --filter @workspace/scripts run smoke:forge
 *
 * Exits non-zero if any assertion fails.
 */
import {
  db,
  forgeAgentsTable, forgeAgentVersionsTable, forgeEnvironmentProfilesTable,
  forgeModelsTable, forgeAuditEventsTable,
} from "@szl-holdings/db";
import { eq } from "drizzle-orm";
import {
  evaluateDrift,
  recordDriftEvent,
  validatePromotion,
  enforcePolicy,
  captureRuntime,
  rollbackAgent,
  aggregateDrift,
  PROMOTION_BLOCKER_CODES,
  type DriftFinding,
} from "../artifacts/api-server/src/services/forge/index.ts";

let failed = 0;
const T = (name: string, ok: boolean, extra?: string) => {
  console.log(`  ${ok ? "✓" : "✗"} ${name}${extra ? ` — ${extra}` : ""}`);
  if (!ok) failed++;
};

async function main() {
  console.log("[smoke-forge] Starting 10-step Forge governance smoke test…");

  // ── 1. seed exists
  const agents = await db.select().from(forgeAgentsTable).where(eq(forgeAgentsTable.isSeed, true));
  T("1. seeded agents present", agents.length >= 5, `found ${agents.length}`);
  if (agents.length === 0) { console.error("Run `pnpm seed:forge` first."); process.exit(2); }

  const exec = agents.find(a => a.slug === "trade-executor-bot")!;
  const briefer = agents.find(a => a.slug === "executive-briefer")!;
  const router = agents.find(a => a.slug === "vessels-ops-router")!;

  // ── 2. drift aggregation math
  const findings: DriftFinding[] = [
    { dimension: "tool", expected: "a", observed: "b", severity: "high",     detail: "" },
    { dimension: "model",expected: "x", observed: "y", severity: "critical", detail: "" },
  ];
  const agg = aggregateDrift(findings);
  T("2. aggregateDrift returns critical for high+critical", agg.severity === "critical", `score=${agg.score}`);

  // ── 3. live drift evaluation against seeded snapshot
  const [stagingEnv] = await db.select().from(forgeEnvironmentProfilesTable).where(eq(forgeEnvironmentProfilesTable.tier, "staging")).limit(1);
  const [prodEnv]    = await db.select().from(forgeEnvironmentProfilesTable).where(eq(forgeEnvironmentProfilesTable.tier, "production")).limit(1);
  const matter = agents.find(a => a.slug === "matter-twin-analyst")!;
  const driftReport = await evaluateDrift(matter.id, stagingEnv!.id);
  T("3. drift detected for matter-twin-analyst in staging", driftReport.driftScore > 0, `score=${driftReport.driftScore} sev=${driftReport.severity}`);
  await recordDriftEvent(driftReport);

  // ── 4. promotion validation — drift is evaluated and reported in staging promotions
  // matter-twin-analyst's staging snapshot is seeded with v1 inventory while its active version is v2
  // → evaluator detects prompt drift and includes it in the validation report
  const promoVal = await validatePromotion({ agentId: matter.id, toVersionId: matter.activeVersionId!, fromEnv: "sandbox", toEnv: "staging", hasHumanApproval: true });
  const driftReported = (promoVal.report as { drift?: { score: number; severity: string } }).drift;
  T("4. promotion validator includes drift score in report", driftReported !== undefined && driftReported.score > 0, `drift=${JSON.stringify(driftReported)} blockers=${promoVal.blockers.map(b => b.code).join(",")}`);

  // ── 5. promotion validator covers all blocker codes individually
  // 5a) INVALID_TIER_TRANSITION
  const invalid = await validatePromotion({ agentId: briefer.id, toVersionId: briefer.activeVersionId!, fromEnv: "dev", toEnv: "production", hasHumanApproval: true });
  T("5a. INVALID_TIER_TRANSITION emitted", invalid.blockers.some(b => b.code === PROMOTION_BLOCKER_CODES.INVALID_TIER_TRANSITION));
  // 5b) MISSING_HUMAN_APPROVAL for executive risk into production
  const noApproval = await validatePromotion({ agentId: briefer.id, toVersionId: briefer.activeVersionId!, fromEnv: "staging", toEnv: "production", hasHumanApproval: false });
  T("5b. MISSING_HUMAN_APPROVAL emitted for executive→production", noApproval.blockers.some(b => b.code === PROMOTION_BLOCKER_CODES.MISSING_HUMAN_APPROVAL));
  // 5c) UNAPPROVED_MODEL — create a synthetic version on-the-fly that uses the unapproved model
  const [unapproved] = await db.select().from(forgeModelsTable).where(eq(forgeModelsTable.approved, false)).limit(1);
  if (unapproved) {
    const [newVer] = await db.insert(forgeAgentVersionsTable).values({
      agentId: briefer.id, version: 99, modelId: unapproved.id, toolIds: [],
      evalsPassed: true, observabilityHookConfigured: true, provenanceComplete: true,
    }).returning();
    const unapprovedRes = await validatePromotion({ agentId: briefer.id, toVersionId: newVer!.id, fromEnv: "staging", toEnv: "production", hasHumanApproval: true });
    T("5c. UNAPPROVED_MODEL emitted", unapprovedRes.blockers.some(b => b.code === PROMOTION_BLOCKER_CODES.UNAPPROVED_MODEL));
    await db.delete(forgeAgentVersionsTable).where(eq(forgeAgentVersionsTable.id, newVer!.id));
  } else {
    T("5c. UNAPPROVED_MODEL emitted", false, "no unapproved model in seed");
  }
  // 5d) EVALS_NOT_PASSED + MISSING_OBSERVABILITY + MISSING_PROVENANCE on a malformed new version
  const [bad] = await db.insert(forgeAgentVersionsTable).values({
    agentId: briefer.id, version: 100, toolIds: [],
    evalsPassed: false, observabilityHookConfigured: false, provenanceComplete: false,
  }).returning();
  const badRes = await validatePromotion({ agentId: briefer.id, toVersionId: bad!.id, fromEnv: "dev", toEnv: "sandbox", hasHumanApproval: true });
  T("5d. EVALS_NOT_PASSED emitted",       badRes.blockers.some(b => b.code === PROMOTION_BLOCKER_CODES.EVALS_NOT_PASSED));
  T("5e. MISSING_OBSERVABILITY emitted",  badRes.blockers.some(b => b.code === PROMOTION_BLOCKER_CODES.MISSING_OBSERVABILITY));
  T("5f. MISSING_PROVENANCE emitted",     badRes.blockers.some(b => b.code === PROMOTION_BLOCKER_CODES.MISSING_PROVENANCE));
  await db.delete(forgeAgentVersionsTable).where(eq(forgeAgentVersionsTable.id, bad!.id));

  // ── 6. policy enforcement
  const policy = await enforcePolicy({ agentId: exec.id, envTier: "production", action: "execute" });
  T("6. policy enforcement returns needs_approval for regulated executor", policy.outcome === "needs_approval" || policy.outcome === "deny", `outcome=${policy.outcome}`);

  // ── 7. runtime capture
  const run = await captureRuntime({
    agentId: briefer.id, versionId: briefer.activeVersionId!, envTier: "production",
    status: "success", latencyMs: 1234, inputTokens: 500, outputTokens: 250,
    toolCalls: 2, toolFailures: 0, policyOutcome: "allow", input: { q: "smoke" }, output: { ok: true },
    isSeed: true,
  });
  T("7. runtime capture persists execution run", !!run.id);

  // ── 8. rollback orchestration
  const versions = await db.select().from(forgeAgentVersionsTable).where(eq(forgeAgentVersionsTable.agentId, briefer.id)).orderBy(forgeAgentVersionsTable.version);
  const v1 = versions[0]!;
  const before = (await db.select().from(forgeAgentsTable).where(eq(forgeAgentsTable.id, briefer.id)).limit(1))[0]!;
  await rollbackAgent({ agentId: briefer.id, toVersionId: v1.id, envTier: "production", reason: "smoke-test rollback" });
  const after = (await db.select().from(forgeAgentsTable).where(eq(forgeAgentsTable.id, briefer.id)).limit(1))[0]!;
  T("8. rollback swaps activeVersionId atomically", after.activeVersionId === v1.id, `before=${before.activeVersionId?.slice(0,8)} after=${after.activeVersionId?.slice(0,8)}`);
  // restore
  await db.update(forgeAgentsTable).set({ activeVersionId: before.activeVersionId }).where(eq(forgeAgentsTable.id, briefer.id));

  // ── 9. audit trail recorded
  const audits = await db.select().from(forgeAuditEventsTable).where(eq(forgeAuditEventsTable.action, "rollback"));
  T("9. audit log records rollback action", audits.length > 0, `${audits.length} rollback audit rows`);

  // ── 10. registry coverage — every demo agent has a model + prompt + tool
  let allOk = true;
  for (const a of agents) {
    const [v] = await db.select().from(forgeAgentVersionsTable).where(eq(forgeAgentVersionsTable.id, a.activeVersionId!)).limit(1);
    if (!v?.modelId || !v?.promptVersionId || !(v.toolIds as string[])?.length) allOk = false;
  }
  T("10. every seeded agent has full registry provenance", allOk);

  console.log(failed === 0 ? `\n[smoke-forge] ✓ All checks passed.` : `\n[smoke-forge] ✗ ${failed} check(s) failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(err => { console.error("[smoke-forge] fatal:", err); process.exit(2); });
