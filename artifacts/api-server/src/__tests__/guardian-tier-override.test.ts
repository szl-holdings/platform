/**
 * Tier Override Effective-Behavior Test (Task #1928)
 *
 * Proves that overriding a tier through the public Guardian API changes
 * runtime behavior of the policy decision middleware for that org — not
 * just what `GET /policies/tiers` returns.
 *
 * Scenario:
 *   1. A request from a non-privileged user in TEST_ORG_ID resolves to
 *      tier `supervised`. Out of the box (constants), that tier has
 *      riskLevel=2 and approvalGate="none", so the middleware allows
 *      the request through (matched by the bootstrap fallback rule).
 *   2. We PATCH /policies/tiers/supervised for the same org to escalate
 *      the controls (approvalGate=dual, riskLevel=4).
 *   3. We re-issue the same request. The middleware must now respond
 *      with HTTP 202 + GUARDIAN_APPROVAL_REQUIRED because the engine
 *      sees the org-scoped override via the shared effective-tier helper.
 *
 * Skipped if no DATABASE_URL is configured.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";
import { randomUUID } from "crypto";

const HAS_DB = Boolean(process.env.DATABASE_URL);
const d = HAS_DB ? describe : describe.skip;

const TEST_ORG_ID = 1;

const adminUser = {
  id: undefined as number | undefined,
  email: "tier-override-admin@example.com",
  roles: ["super_admin"],
  orgs: [{ orgId: TEST_ORG_ID, orgSlug: "tier-override", orgName: "Tier Override Test", role: "super_admin" }],
};

const memberUser = {
  id: undefined as number | undefined,
  email: "tier-override-member@example.com",
  // No admin/operator/supervisor roles — middleware derives tier
  // = configured default ("supervised") instead of operator-approved.
  roles: ["member"],
  orgs: [{ orgId: TEST_ORG_ID, orgSlug: "tier-override", orgName: "Tier Override Test", role: "member" }],
};

let activeUser: typeof adminUser | typeof memberUser = adminUser;

vi.mock("../middlewares/auth.js", () => ({
  authMiddleware: (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as { user: typeof activeUser }).user = activeUser;
    next();
  },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireOrgMembership: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  parseIdParam: (paramName: string) => (req: Request, res: Response, next: NextFunction) => {
    const val = req.params[paramName];
    if (!val || isNaN(Number(val))) { res.status(400).json({ error: "Invalid ID" }); return; }
    next();
  },
  InvalidIdError: class extends Error {},
}));

d("Tier overrides drive middleware decisions (#1928)", () => {
  const runId = randomUUID().slice(0, 8);
  let tierRowId: number | null = null;

  beforeAll(async () => {
    const { db, organizationsTable } = await import("@szl-holdings/db");
    const { eq } = await import("drizzle-orm");
    const [existingOrg] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, TEST_ORG_ID)).limit(1);
    if (!existingOrg) {
      await db.insert(organizationsTable).values({
        id: TEST_ORG_ID,
        name: "Tier Override Test Org",
        slug: "tier-override-test",
      }).onConflictDoNothing();
    }

    // Hydrate the in-process engine + fallback rules so the middleware
    // has rules to match against (otherwise everything deny-by-defaults).
    const { initGuardianEngine } = await import("../lib/guardian-engine.js");
    await initGuardianEngine();
  });

  afterAll(async () => {
    const { db, guardianTiersTable } = await import("@szl-holdings/db");
    const { eq } = await import("drizzle-orm");
    if (tierRowId !== null) {
      await db.delete(guardianTiersTable).where(eq(guardianTiersTable.id, tierRowId));
    }
    const { invalidateEffectiveTierCache } = await import("../lib/effective-tiers.js");
    invalidateEffectiveTierCache();
  });

  async function buildApp() {
    const { default: guardianRouter } = await import("../routes/guardian.js");
    const { guardianPolicyCheck } = await import("../middlewares/guardian-policy.js");

    const app = express();
    app.use(express.json());
    // Mount the admin guardian routes so we can PATCH the tier through HTTP.
    app.use("/api/guardian", guardianRouter);
    // A protected mutating route that runs through the policy middleware.
    // Using /alloy/* maps to the "alloy" category in deriveCategory(), which
    // has bootstrap fallback allow rules for the supervised tier. We
    // inject req.user before the middleware so the org-scoped tier
    // override resolution sees the test org id.
    const injectUser = (req: Request, _res: Response, next: NextFunction): void => {
      (req as unknown as { user: typeof activeUser }).user = activeUser;
      next();
    };
    app.post(
      "/api/alloy/test-action",
      injectUser,
      // Using `advisory` (not supervised) keeps this test isolated from
      // the supervised-tier write that the #1912 governance-persistence
      // test performs against the same TEST_ORG_ID. Both tier rows live
      // in `guardian_tiers`, so picking different tiers prevents the two
      // tests from clobbering each other's row.
      guardianPolicyCheck({ enforce: true, defaultTier: "advisory" }),
      (_req, res) => res.status(200).json({ ok: true }),
    );
    return app;
  }

  it("Phase 1 — with default constants, an advisory request is allowed", async () => {
    const app = await buildApp();

    // Make the policy call as a non-privileged member so deriveTier
    // resolves to the middleware's configured defaultTier ('advisory').
    activeUser = memberUser;
    const res = await request(app).post("/api/alloy/test-action").send({ runId });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(res.headers["x-guardian-outcome"]).toBe("allow");
  });

  it("Phase 2 — admin overrides advisory → dual-approval; same request is now gated", async () => {
    const app = await buildApp();

    // Step 1 — escalate the advisory tier for this org through the real
    // PATCH route. Switch the auth mock to admin so the route accepts the
    // mutation.
    activeUser = adminUser;
    const patchRes = await request(app)
      .patch("/api/guardian/policies/tiers/advisory")
      .send({
        // Risk level >= 4 + approvalGate=dual together trigger the
        // dual-approval branch in GuardianDecisionEngine.decide().
        riskLevel: 4,
        controls: {
          tier: "advisory",
          tierNumber: 0,
          allowedModels: null,
          allowedTools: null,
          maxActionsPerSession: 100,
          approvalGate: "dual",
          requiresRollback: false,
          redactPII: true,
          retentionDays: 30,
          allowExternalComms: false,
          allowedEnvironments: ["development", "staging", "production"],
          allowMemoryWrite: false,
        },
        description: `Escalated advisory override for tier-override test (${runId})`,
      });
    expect([200, 201]).toContain(patchRes.status);
    tierRowId = patchRes.body.id ?? tierRowId;

    // Step 2 — re-issue the same member request. The middleware must now
    // see the override (org-scoped) and gate the call as dual-approval.
    activeUser = memberUser;
    const res = await request(app).post("/api/alloy/test-action").send({ runId });
    expect(res.status).toBe(202);
    expect(res.body?.code).toBe("GUARDIAN_APPROVAL_REQUIRED");
    expect(res.body?.outcome).toBe("require-dual-approval");
    expect(res.headers["x-guardian-outcome"]).toBe("require-dual-approval");
  });
});
