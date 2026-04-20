/**
 * Idempotency tests for the Guardian / Tool-Mesh seed routines.
 *
 * Re-running seedGuardianTiers() and seedGuardianDefaults() must be safe —
 * the api-server may restart any number of times in production, and each
 * restart calls these seed functions on bootstrap. They MUST NOT create
 * duplicate rows or violate unique constraints.
 */

import { describe, it, expect } from "vitest";
import {
  db,
  guardianPoliciesTable,
  guardianTiersTable,
  toolMeshToolsTable,
  toolMeshToolVersionsTable,
} from "@szl-holdings/db";
import { isNull, eq, sql, and, like } from "drizzle-orm";
import { seedGuardianDefaults, seedGuardianTiers } from "../seed-guardian";

async function countDefaultPolicies(): Promise<number> {
  // Only count seeded "default-*" rows so test-injected rows from sibling
  // suites (engine resync tests, etc.) don't perturb the counts.
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(guardianPoliciesTable)
    .where(
      and(
        isNull(guardianPoliciesTable.orgId),
        like(guardianPoliciesTable.name, "default-%"),
      ),
    );
  return row?.c ?? 0;
}

async function countDefaultTiers(): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(guardianTiersTable)
    .where(isNull(guardianTiersTable.orgId));
  return row?.c ?? 0;
}

async function countTools(): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(toolMeshToolsTable);
  return row?.c ?? 0;
}

async function countToolVersions(): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(toolMeshToolVersionsTable);
  return row?.c ?? 0;
}

describe("seedGuardianTiers — idempotent", () => {
  it("is safe to run twice; row count after second run equals row count after first run", async () => {
    await seedGuardianTiers();
    const afterFirst = await countDefaultTiers();
    expect(afterFirst).toBeGreaterThan(0);

    await seedGuardianTiers();
    const afterSecond = await countDefaultTiers();
    expect(afterSecond).toBe(afterFirst);
  });

  it("re-seeding does not modify or delete existing rows", async () => {
    await seedGuardianTiers();
    const before = await db
      .select({ id: guardianTiersTable.id, tier: guardianTiersTable.tier })
      .from(guardianTiersTable)
      .where(isNull(guardianTiersTable.orgId));
    await seedGuardianTiers();
    const after = await db
      .select({ id: guardianTiersTable.id, tier: guardianTiersTable.tier })
      .from(guardianTiersTable)
      .where(isNull(guardianTiersTable.orgId));
    expect(after.map((r) => `${r.id}:${r.tier}`).sort()).toEqual(
      before.map((r) => `${r.id}:${r.tier}`).sort(),
    );
  });
});

describe("seedGuardianDefaults — idempotent", () => {
  it("is safe to run twice; default policy count is identical", async () => {
    await seedGuardianDefaults();
    const afterFirst = await countDefaultPolicies();
    expect(afterFirst).toBeGreaterThan(0);

    await seedGuardianDefaults();
    const afterSecond = await countDefaultPolicies();
    expect(afterSecond).toBe(afterFirst);
  });

  it("does not duplicate tool manifests on re-run", async () => {
    await seedGuardianDefaults();
    const toolsAfterFirst = await countTools();
    const versionsAfterFirst = await countToolVersions();

    await seedGuardianDefaults();
    expect(await countTools()).toBe(toolsAfterFirst);
    // Versions table only inserts on freshly-created tools, so re-runs add zero.
    expect(await countToolVersions()).toBe(versionsAfterFirst);
  });

  it("each default policy name is unique within the global (orgId IS NULL) scope", async () => {
    await seedGuardianDefaults();
    const rows = await db
      .select({ name: guardianPoliciesTable.name })
      .from(guardianPoliciesTable)
      .where(isNull(guardianPoliciesTable.orgId));
    const defaultPrefixed = rows.filter((r) => r.name.startsWith("default-"));
    const seen = new Set<string>();
    for (const r of defaultPrefixed) {
      expect(seen.has(r.name)).toBe(false);
      seen.add(r.name);
    }
    expect(seen.size).toBe(defaultPrefixed.length);
  });

  it("running tiers + defaults together back-to-back twice is stable", async () => {
    await seedGuardianTiers();
    await seedGuardianDefaults();
    const tiersA = await countDefaultTiers();
    const policiesA = await countDefaultPolicies();
    const toolsA = await countTools();

    await seedGuardianTiers();
    await seedGuardianDefaults();
    expect(await countDefaultTiers()).toBe(tiersA);
    expect(await countDefaultPolicies()).toBe(policiesA);
    expect(await countTools()).toBe(toolsA);
  });

  it("seeded default policies all reference one of the canonical tier names", async () => {
    await seedGuardianDefaults();
    const rows = await db
      .select({ tier: guardianPoliciesTable.tier })
      .from(guardianPoliciesTable)
      .where(
        and(
          isNull(guardianPoliciesTable.orgId),
          like(guardianPoliciesTable.name, "default-%"),
        ),
      );
    const validTiers = new Set([
      "advisory",
      "supervised",
      "operator-approved",
      "dual-approved",
      "regulated",
      "sovereign",
      "human-approval-mandatory",
    ]);
    for (const r of rows.filter((x) => x.tier)) {
      expect(validTiers.has(r.tier)).toBe(true);
    }
  });

  it("seedGuardianDefaults is safe to call concurrently (no unique-violation crash)", async () => {
    // Two parallel calls race to insert the same default rows. Idempotency
    // must hold even under concurrency — onConflictDoNothing + per-row
    // existence checks should prevent duplicate-key errors from bubbling.
    await Promise.all([seedGuardianDefaults(), seedGuardianDefaults()]);
    const policies = await db
      .select({ name: guardianPoliciesTable.name })
      .from(guardianPoliciesTable)
      .where(isNull(guardianPoliciesTable.orgId));
    const defaults = policies.filter((p) => p.name.startsWith("default-"));
    expect(new Set(defaults.map((p) => p.name)).size).toBe(defaults.length);
  });

  it("seeded tools all carry a non-empty toolId", async () => {
    await seedGuardianDefaults();
    const rows = await db
      .select({ toolId: toolMeshToolsTable.toolId })
      .from(toolMeshToolsTable);
    for (const r of rows) {
      expect(r.toolId).toBeTruthy();
      expect(typeof r.toolId).toBe("string");
    }
    // toolId must be unique
    expect(new Set(rows.map((r) => r.toolId)).size).toBe(rows.length);
  });

  it("each seeded tool has at least one version row", async () => {
    await seedGuardianDefaults();
    const tools = await db
      .select({ id: toolMeshToolsTable.id })
      .from(toolMeshToolsTable);
    for (const t of tools) {
      const [v] = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(toolMeshToolVersionsTable)
        .where(eq(toolMeshToolVersionsTable.toolDbId, t.id));
      expect(v?.c ?? 0).toBeGreaterThanOrEqual(1);
    }
  });
});
