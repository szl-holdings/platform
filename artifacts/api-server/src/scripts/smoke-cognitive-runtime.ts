/**
 * Cognitive Runtime Schema Smoke Test
 *
 * Inserts one row in each cognitive runtime table, reads it back with a SELECT,
 * then deletes the test row. All 13 new tables must pass.
 *
 * Run:  pnpm --filter @workspace/api-server smoke:cognitive-runtime
 */
import { db } from "@szl-holdings/db";
import {
  selfModelsTable,
  selfModelSnapshotsTable,
  entityAliasesTable,
  entityEdgesTable,
  skillsTable,
  skillRunsTable,
  plansTable,
  planStepsTable,
  verifierResultsTable,
  reflectionsTable,
  policiesTable,
  cogActionsTable,
  rollbackEventsTable,
} from "@szl-holdings/db";
import { eq } from "drizzle-orm";

const AGENT_ID = "smoke-agent-cog-runtime";
const errors: string[] = [];

async function check<T extends { id: string }>(
  label: string,
  insert: () => Promise<T>,
  read: (id: string) => Promise<T | undefined>,
  del: (id: string) => Promise<void>,
): Promise<T | null> {
  try {
    const row = await insert();
    const readback = await read(row.id);
    if (!readback) throw new Error("read-after-write returned nothing");
    console.log(`[smoke] ✓  ${label.padEnd(22)} id=${row.id}`);
    await del(row.id);
    return row;
  } catch (err) {
    errors.push(`${label}: ${(err as Error).message}`);
    console.error(`[smoke] ✗  ${label}: ${(err as Error).message}`);
    return null;
  }
}

async function run() {
  console.log("[smoke] Starting cognitive runtime schema smoke test...\n");

  // ── self_models + self_model_snapshots ───────────────────────────────────────
  const smRow = await check(
    "self_models",
    async () => {
      const [r] = await db
        .insert(selfModelsTable)
        .values({
          agentId: AGENT_ID,
          version: 1,
          status: "active",
          capabilities: ["reasoning"],
          goals: [],
          constraints: [],
          beliefs: {},
          identity: {},
          performanceProfile: {},
          confidence: 0.95,
          sensitivityTier: "internal",
          provenanceSource: "agent",
          provenanceMethod: "agent",
          metadata: { test: true },
        })
        .returning();
      return r;
    },
    async (id) => {
      const [r] = await db.select().from(selfModelsTable).where(eq(selfModelsTable.id, id));
      return r;
    },
    async () => {},
  );

  if (smRow) {
    await check(
      "self_model_snapshots",
      async () => {
        const [r] = await db
          .insert(selfModelSnapshotsTable)
          .values({
            selfModelId: smRow.id,
            agentId: AGENT_ID,
            version: 1,
            snapshotData: { capabilities: ["reasoning"] },
            changeReason: "smoke test",
            confidence: 0.95,
            sensitivityTier: "internal",
            provenanceSource: "agent",
            provenanceMethod: "agent",
            metadata: { test: true },
          })
          .returning();
        return r;
      },
      async (id) => {
        const [r] = await db
          .select()
          .from(selfModelSnapshotsTable)
          .where(eq(selfModelSnapshotsTable.id, id));
        return r;
      },
      async (id) => {
        await db.delete(selfModelSnapshotsTable).where(eq(selfModelSnapshotsTable.id, id));
      },
    );
    await db.delete(selfModelsTable).where(eq(selfModelsTable.id, smRow.id));
  }

  // ── entity_aliases ────────────────────────────────────────────────────────────
  await check(
    "entity_aliases",
    async () => {
      const [r] = await db
        .insert(entityAliasesTable)
        .values({
          entityId: "entity-smoke-001",
          alias: "ACME Corp",
          aliasType: "display",
          provenanceSource: "agent",
          provenanceMethod: "agent",
          confidence: 0.9,
          metadata: {},
        })
        .returning();
      return r;
    },
    async (id) => {
      const [r] = await db.select().from(entityAliasesTable).where(eq(entityAliasesTable.id, id));
      return r;
    },
    async (id) => {
      await db.delete(entityAliasesTable).where(eq(entityAliasesTable.id, id));
    },
  );

  // ── entity_edges ──────────────────────────────────────────────────────────────
  await check(
    "entity_edges",
    async () => {
      const [r] = await db
        .insert(entityEdgesTable)
        .values({
          fromEntityId: "entity-smoke-A",
          toEntityId: "entity-smoke-B",
          edgeType: "relates-to",
          weight: 0.8,
          bidirectional: false,
          provenanceSource: "agent",
          provenanceMethod: "agent",
          confidence: 0.9,
          sensitivityTier: "internal",
          metadata: {},
        })
        .returning();
      return r;
    },
    async (id) => {
      const [r] = await db.select().from(entityEdgesTable).where(eq(entityEdgesTable.id, id));
      return r;
    },
    async (id) => {
      await db.delete(entityEdgesTable).where(eq(entityEdgesTable.id, id));
    },
  );

  // ── skills ────────────────────────────────────────────────────────────────────
  const skillRow = await check(
    "skills",
    async () => {
      const [r] = await db
        .insert(skillsTable)
        .values({
          skillId: "smoke-skill-reasoning",
          version: 1,
          latestVersion: 1,
          name: "Smoke Reasoning Skill",
          domain: "general",
          capability: "reasoning",
          status: "active",
          inputSchema: {},
          outputSchema: {},
          implementation: {},
          triggerConditions: [],
          confidence: 0.9,
          sensitivityTier: "internal",
          provenanceSource: "agent",
          provenanceMethod: "agent",
          metadata: {},
        })
        .returning();
      return r;
    },
    async (id) => {
      const [r] = await db.select().from(skillsTable).where(eq(skillsTable.id, id));
      return r;
    },
    async () => {},
  );

  // ── skill_runs ────────────────────────────────────────────────────────────────
  await check(
    "skill_runs",
    async () => {
      const [r] = await db
        .insert(skillRunsTable)
        .values({
          skillId: "smoke-skill-reasoning",
          skillVersion: 1,
          agentId: AGENT_ID,
          status: "completed",
          inputs: { query: "smoke test" },
          outputs: { result: "ok" },
          latencyMs: 42,
          confidence: 0.9,
          provenanceSource: "agent",
          provenanceMethod: "agent",
          metadata: {},
        })
        .returning();
      return r;
    },
    async (id) => {
      const [r] = await db.select().from(skillRunsTable).where(eq(skillRunsTable.id, id));
      return r;
    },
    async (id) => {
      await db.delete(skillRunsTable).where(eq(skillRunsTable.id, id));
    },
  );

  if (skillRow) {
    await db.delete(skillsTable).where(eq(skillsTable.id, skillRow.id));
  }

  // ── plans + plan_steps ────────────────────────────────────────────────────────
  const planRow = await check(
    "plans",
    async () => {
      const [r] = await db
        .insert(plansTable)
        .values({
          planId: "smoke-plan-001",
          agentId: AGENT_ID,
          title: "Smoke Test Plan",
          goal: { objective: "test schema" },
          status: "draft",
          totalSteps: 1,
          confidence: 0.8,
          sensitivityTier: "internal",
          provenanceSource: "agent",
          provenanceMethod: "agent",
          metadata: {},
        })
        .returning();
      return r;
    },
    async (id) => {
      const [r] = await db.select().from(plansTable).where(eq(plansTable.id, id));
      return r;
    },
    async () => {},
  );

  if (planRow) {
    await check(
      "plan_steps",
      async () => {
        const [r] = await db
          .insert(planStepsTable)
          .values({
            planId: planRow.id,
            stepIndex: 0,
            title: "Step 1",
            status: "pending",
            inputs: {},
            dependsOnStepIds: [],
            confidence: 0.8,
            metadata: {},
          })
          .returning();
        return r;
      },
      async (id) => {
        const [r] = await db.select().from(planStepsTable).where(eq(planStepsTable.id, id));
        return r;
      },
      async (id) => {
        await db.delete(planStepsTable).where(eq(planStepsTable.id, id));
      },
    );
    await db.delete(plansTable).where(eq(plansTable.id, planRow.id));
  }

  // ── verifier_results ──────────────────────────────────────────────────────────
  await check(
    "verifier_results",
    async () => {
      const [r] = await db
        .insert(verifierResultsTable)
        .values({
          verifierId: "smoke-verifier",
          targetType: "plan",
          targetId: "smoke-plan-001",
          outcome: "pass",
          checks: [{ name: "smoke-check", outcome: "pass" }],
          blockerCount: 0,
          warningCount: 0,
          passCount: 1,
          confidence: 0.95,
          sensitivityTier: "internal",
          provenanceSource: "agent",
          provenanceMethod: "agent",
          metadata: {},
        })
        .returning();
      return r;
    },
    async (id) => {
      const [r] = await db
        .select()
        .from(verifierResultsTable)
        .where(eq(verifierResultsTable.id, id));
      return r;
    },
    async (id) => {
      await db.delete(verifierResultsTable).where(eq(verifierResultsTable.id, id));
    },
  );

  // ── reflections ───────────────────────────────────────────────────────────────
  await check(
    "reflections",
    async () => {
      const [r] = await db
        .insert(reflectionsTable)
        .values({
          reflectionId: "smoke-reflection-001",
          agentId: AGENT_ID,
          type: "post-task",
          summary: "Smoke test reflection — schema is functional.",
          observations: [],
          improvements: [],
          policyBreaches: [],
          confidenceAdjustment: 0,
          overallHealth: "good",
          actionable: false,
          suggestedActions: [],
          confidence: 0.9,
          sensitivityTier: "internal",
          provenanceSource: "agent",
          provenanceMethod: "agent",
          metadata: {},
        })
        .returning();
      return r;
    },
    async (id) => {
      const [r] = await db.select().from(reflectionsTable).where(eq(reflectionsTable.id, id));
      return r;
    },
    async (id) => {
      await db.delete(reflectionsTable).where(eq(reflectionsTable.id, id));
    },
  );

  // ── policies ─────────────────────────────────────────────────────────────────
  await check(
    "policies",
    async () => {
      const [r] = await db
        .insert(policiesTable)
        .values({
          policyId: "smoke-policy-001",
          version: 1,
          latestVersion: 1,
          name: "Smoke Test Policy",
          domain: "general",
          scope: "global",
          effect: "allow",
          conditions: [],
          priority: 100,
          enabled: true,
          confidence: 0.95,
          sensitivityTier: "internal",
          provenanceSource: "agent",
          provenanceMethod: "agent",
          metadata: {},
        })
        .returning();
      return r;
    },
    async (id) => {
      const [r] = await db.select().from(policiesTable).where(eq(policiesTable.id, id));
      return r;
    },
    async (id) => {
      await db.delete(policiesTable).where(eq(policiesTable.id, id));
    },
  );

  // ── cog_actions ───────────────────────────────────────────────────────────────
  const cogActionRow = await check(
    "cog_actions",
    async () => {
      const [r] = await db
        .insert(cogActionsTable)
        .values({
          actionId: "smoke-action-001",
          agentId: AGENT_ID,
          domain: "general",
          actionType: "analysis",
          description: "Smoke test action",
          status: "completed",
          inputs: {},
          outputs: { result: "ok" },
          isReversible: true,
          confidence: 0.9,
          sensitivityTier: "internal",
          provenanceSource: "agent",
          provenanceMethod: "agent",
          metadata: {},
        })
        .returning();
      return r;
    },
    async (id) => {
      const [r] = await db.select().from(cogActionsTable).where(eq(cogActionsTable.id, id));
      return r;
    },
    async () => {},
  );

  // ── rollback_events ───────────────────────────────────────────────────────────
  await check(
    "rollback_events",
    async () => {
      const [r] = await db
        .insert(rollbackEventsTable)
        .values({
          rollbackId: "smoke-rollback-001",
          agentId: AGENT_ID,
          trigger: "agent",
          reason: "Smoke test rollback",
          targetType: "cog_action",
          targetId: "smoke-action-001",
          stateBeforeRollback: { status: "running" },
          stateAfterRollback: { status: "pending" },
          success: true,
          confidence: 0.9,
          sensitivityTier: "internal",
          provenanceSource: "agent",
          provenanceMethod: "agent",
          metadata: {},
        })
        .returning();
      return r;
    },
    async (id) => {
      const [r] = await db.select().from(rollbackEventsTable).where(eq(rollbackEventsTable.id, id));
      return r;
    },
    async (id) => {
      await db.delete(rollbackEventsTable).where(eq(rollbackEventsTable.id, id));
    },
  );

  if (cogActionRow) {
    await db.delete(cogActionsTable).where(eq(cogActionsTable.id, cogActionRow.id));
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────");
  if (errors.length === 0) {
    console.log("[smoke] ✓  All cognitive runtime tables PASSED");
  } else {
    console.error(`[smoke] ✗  ${errors.length} table(s) FAILED:`);
    errors.forEach((e) => console.error(`         • ${e}`));
    process.exit(1);
  }
  process.exit(0);
}

run().catch((err) => {
  console.error("[smoke] Unexpected error:", err);
  process.exit(1);
});
