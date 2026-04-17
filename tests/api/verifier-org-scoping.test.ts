/**
 * Verifier API — org/tenant scoping integration tests (Task #1177).
 *
 * Mounts the real verifier router with `authMiddleware` mocked to inject
 * a configurable `req.user` so we can exercise multi-org / privileged-role
 * matrix end-to-end through HTTP.
 *
 * Asserts:
 *   - same-org caller can read its own records;
 *   - cross-org caller gets 404 (not 403) — no existence leak;
 *   - admin/super_admin without `?allOrgs=true` are still scoped;
 *   - admin/super_admin with `?allOrgs=true` sees everything;
 *   - DELETE :id is admin-gated AND org-scoped (404 on cross-org);
 *   - GET /verifier/target/:type/:id is matched before /verifier/:id.
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import request from "supertest";

// Mutable per-test user injected by the mocked authMiddleware.
let currentUser: {
  id: number;
  roles: string[];
  orgs: { orgId: number; orgSlug: string; orgName: string; role: string }[];
} | null = null;

vi.mock("../../artifacts/api-server/src/middlewares/auth", () => {
  const authMiddleware = (_o: { required?: boolean } = {}) =>
    (req: Request, res: Response, next: NextFunction) => {
      if (!currentUser) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      (req as unknown as { user: typeof currentUser }).user = currentUser;
      next();
    };
  const requireRole =
    (...roles: string[]) =>
    (req: Request, res: Response, next: NextFunction) => {
      const u = (req as unknown as { user?: { roles?: string[] } }).user;
      if (!u) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      const ok = roles.some((r) => u.roles?.includes(r));
      if (!ok) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }
      next();
    };
  return { authMiddleware, requireRole };
});

// Mock the api-response helpers used by routes/verifier so we don't pull
// in the rest of the api-server bootstrap. Behavior mirrors the real
// helpers closely enough for HTTP assertions.
vi.mock("../../artifacts/api-server/src/lib/api-response", () => {
  const sendSuccess = (res: Response, data: unknown) => res.status(200).json({ data });
  const sendCreated = (res: Response, data: unknown) => res.status(201).json({ data });
  const sendNotFound = (res: Response, message: string) =>
    res.status(404).json({ error: message });
  const sendBadRequest = (res: Response, message: string) =>
    res.status(400).json({ error: message });
  const handleRouteError = (res: Response, _err: unknown, message: string) =>
    res.status(500).json({ error: message });
  return { sendSuccess, sendCreated, sendNotFound, sendBadRequest, handleRouteError };
});

let app: Express;
let verifierRouter: express.IRouter;
let store: import("@workspace/verifier").InMemoryVerifierStore;

beforeAll(async () => {
  const verifier = await import("@workspace/verifier");
  // Use a fresh in-memory store as the default backend.
  store = new verifier.InMemoryVerifierStore();
  verifier.defaultVerifierStore.setBackend(store);

  // Pre-seed: org 1 has two outputs, org 2 has one, plus a null-org row
  // (legacy / non-tenant scoped data the engine might emit when called
  // from internal agents).
  const t1 = { targetType: "output" as const, targetId: "tgt-1" };
  const t2 = { targetType: "output" as const, targetId: "tgt-2" };
  const t3 = { targetType: "output" as const, targetId: "tgt-3" };
  const tNull = { targetType: "output" as const, targetId: "tgt-null" };

  const o1a = verifier.verify({ text: "org1-a" }, t1, { orgId: 1 });
  o1a.evaluatedAt = 1000;
  const o1b = verifier.verify({ text: "org1-b" }, t1, { orgId: 1 });
  o1b.evaluatedAt = 2000;
  const o2 = verifier.verify({ text: "org2-a" }, t2, { orgId: 2 });
  o2.evaluatedAt = 3000;
  const oNull = verifier.verify({ text: "no-org" }, tNull);
  oNull.evaluatedAt = 4000;
  // Also a target shared across orgs to verify latestForTarget scoping.
  const sharedOrg1 = verifier.verify({ text: "shared-org1" }, t3, { orgId: 1 });
  sharedOrg1.evaluatedAt = 5000;
  const sharedOrg2 = verifier.verify({ text: "shared-org2" }, t3, { orgId: 2 });
  sharedOrg2.evaluatedAt = 9999; // newer, but other tenant

  await store.save(o1a);
  await store.save(o1b);
  await store.save(o2);
  await store.save(oNull);
  await store.save(sharedOrg1);
  await store.save(sharedOrg2);

  // Stash ids on a globally visible scratch object for test assertions.
  ids = {
    o1a: o1a.verifierId,
    o1b: o1b.verifierId,
    o2: o2.verifierId,
    oNull: oNull.verifierId,
    sharedOrg1: sharedOrg1.verifierId,
    sharedOrg2: sharedOrg2.verifierId,
  };

  // Mount the real router under /api so paths match the production prefix.
  const routerMod = await import("../../artifacts/api-server/src/routes/verifier");
  verifierRouter = routerMod.default;
  app = express();
  app.use(express.json());
  app.use("/api", verifierRouter);
});

let ids: Record<string, string>;

const userInOrg = (orgId: number, roles: string[] = ["viewer"]) => ({
  id: 100 + orgId,
  roles,
  orgs: [{ orgId, orgSlug: `org-${orgId}`, orgName: `Org ${orgId}`, role: "member" }],
});

beforeEach(() => {
  currentUser = null;
});

describe("GET /verifier — list scoping", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/verifier");
    expect(res.status).toBe(401);
  });

  it("returns only org-1 records to an org-1 caller", async () => {
    currentUser = userInOrg(1);
    const res = await request(app).get("/api/verifier");
    expect(res.status).toBe(200);
    const items = res.body.data.items as { orgId: number | null; verifierId: string }[];
    expect(items.every((i) => i.orgId === 1)).toBe(true);
    // org1 has 3 records (o1a, o1b, sharedOrg1)
    expect(res.body.data.total).toBe(3);
    expect(items.find((i) => i.verifierId === ids.o2)).toBeUndefined();
    expect(items.find((i) => i.verifierId === ids.oNull)).toBeUndefined();
  });

  it("returns only org-2 records to an org-2 caller", async () => {
    currentUser = userInOrg(2);
    const res = await request(app).get("/api/verifier");
    expect(res.status).toBe(200);
    const items = res.body.data.items as { orgId: number | null }[];
    expect(items.every((i) => i.orgId === 2)).toBe(true);
    expect(res.body.data.total).toBe(2);
  });

  it("admin without ?allOrgs is still scoped to their org memberships", async () => {
    currentUser = userInOrg(1, ["admin"]);
    const res = await request(app).get("/api/verifier");
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(3);
  });

  it("admin with ?allOrgs=true sees every record (incl. null-org)", async () => {
    currentUser = userInOrg(1, ["admin"]);
    const res = await request(app).get("/api/verifier?allOrgs=true");
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(6);
  });

  it("super_admin with ?allOrgs=true sees every record", async () => {
    currentUser = userInOrg(1, ["super_admin"]);
    const res = await request(app).get("/api/verifier?allOrgs=true");
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(6);
  });

  it("non-privileged caller cannot escape scope via ?allOrgs=true", async () => {
    currentUser = userInOrg(1, ["viewer"]);
    const res = await request(app).get("/api/verifier?allOrgs=true");
    expect(res.status).toBe(200);
    // Still only own org.
    expect(res.body.data.total).toBe(3);
  });
});

describe("GET /verifier/:id — record scoping", () => {
  it("returns own-org record", async () => {
    currentUser = userInOrg(1);
    const res = await request(app).get(`/api/verifier/${ids.o1a}`);
    expect(res.status).toBe(200);
    expect(res.body.data.verifierId).toBe(ids.o1a);
  });

  it("returns 404 (not 403) when accessing a record owned by another org", async () => {
    currentUser = userInOrg(1);
    const res = await request(app).get(`/api/verifier/${ids.o2}`);
    expect(res.status).toBe(404);
    // Body must not leak ownership info.
    expect(JSON.stringify(res.body)).not.toContain("forbidden");
  });

  it("admin without ?allOrgs cannot read another org's record", async () => {
    currentUser = userInOrg(1, ["admin"]);
    const res = await request(app).get(`/api/verifier/${ids.o2}`);
    expect(res.status).toBe(404);
  });

  it("admin with ?allOrgs=true can read another org's record", async () => {
    currentUser = userInOrg(1, ["admin"]);
    const res = await request(app).get(`/api/verifier/${ids.o2}?allOrgs=true`);
    expect(res.status).toBe(200);
    expect(res.body.data.orgId).toBe(2);
  });

  it("returns 404 for unknown id", async () => {
    currentUser = userInOrg(1);
    const res = await request(app).get(`/api/verifier/does-not-exist`);
    expect(res.status).toBe(404);
  });
});

describe("GET /verifier/target/:type/:id — route ordering & latest scoping", () => {
  it("matches the target route before the :id catch-all (route-ordering smoke)", async () => {
    currentUser = userInOrg(1);
    // If :id matched first, "target" would be treated as an id and 404 with a
    // verifier-id error. Instead this route should resolve to latestForTarget.
    const res = await request(app).get("/api/verifier/target/output/tgt-1");
    expect(res.status).toBe(200);
    expect(res.body.data.target.targetId).toBe("tgt-1");
    // Latest of org1 on tgt-1 is o1b (evaluatedAt=2000).
    expect(res.body.data.verifierId).toBe(ids.o1b);
  });

  it("returns 404 to org-2 caller asking about tgt-1 (org-1 only)", async () => {
    currentUser = userInOrg(2);
    const res = await request(app).get("/api/verifier/target/output/tgt-1");
    expect(res.status).toBe(404);
  });

  it("returns the org's own latest when both orgs have rows for the same target", async () => {
    currentUser = userInOrg(1);
    const res1 = await request(app).get("/api/verifier/target/output/tgt-3");
    expect(res1.status).toBe(200);
    expect(res1.body.data.verifierId).toBe(ids.sharedOrg1);

    currentUser = userInOrg(2);
    const res2 = await request(app).get("/api/verifier/target/output/tgt-3");
    expect(res2.status).toBe(200);
    expect(res2.body.data.verifierId).toBe(ids.sharedOrg2);
  });

  it("rejects an invalid targetType with 400", async () => {
    currentUser = userInOrg(1);
    const res = await request(app).get("/api/verifier/target/bogus/x");
    expect(res.status).toBe(400);
  });
});

describe("DELETE /verifier/:id — role + org scoping", () => {
  it("requires admin/super_admin (viewer gets 403)", async () => {
    currentUser = userInOrg(1, ["viewer"]);
    const res = await request(app).delete(`/api/verifier/${ids.o1a}`);
    expect(res.status).toBe(403);
  });

  it("admin can delete own-org record", async () => {
    // Save then delete a throwaway org-1 record so the seeded fixtures stay.
    const verifier = await import("@workspace/verifier");
    const tmp = verifier.verify({ text: "tmp" }, { targetType: "output", targetId: "tmp" }, { orgId: 1 });
    await store.save(tmp);

    currentUser = userInOrg(1, ["admin"]);
    const res = await request(app).delete(`/api/verifier/${tmp.verifierId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(tmp.verifierId);
  });

  it("admin gets 404 when deleting another org's record (no existence leak)", async () => {
    currentUser = userInOrg(1, ["admin"]);
    const res = await request(app).delete(`/api/verifier/${ids.o2}`);
    expect(res.status).toBe(404);
    // Confirm the record still exists (cross-org delete must be a true no-op).
    currentUser = userInOrg(2, ["admin"]);
    const check = await request(app).get(`/api/verifier/${ids.o2}`);
    expect(check.status).toBe(200);
  });

  it("super_admin with ?allOrgs=true can delete cross-org", async () => {
    const verifier = await import("@workspace/verifier");
    const cross = verifier.verify(
      { text: "cross" },
      { targetType: "output", targetId: "cross" },
      { orgId: 2 },
    );
    await store.save(cross);

    currentUser = userInOrg(1, ["super_admin"]);
    const res = await request(app).delete(`/api/verifier/${cross.verifierId}?allOrgs=true`);
    expect(res.status).toBe(200);
  });
});

describe("POST /verifier — stamps caller's org on persisted record", () => {
  it("uses caller's primary org for the persisted decision", async () => {
    currentUser = userInOrg(1);
    const res = await request(app)
      .post("/api/verifier")
      .send({ output: { text: "fresh" } });
    expect(res.status).toBe(201);
    expect(res.body.data.orgId).toBe(1);

    // Verify the saved record is visible to org-1 only.
    const id = res.body.data.verifierId as string;
    currentUser = userInOrg(1);
    const own = await request(app).get(`/api/verifier/${id}`);
    expect(own.status).toBe(200);

    currentUser = userInOrg(2);
    const other = await request(app).get(`/api/verifier/${id}`);
    expect(other.status).toBe(404);
  });

  it("ignores caller-supplied context.orgId when caller is not a member", async () => {
    currentUser = userInOrg(1);
    const res = await request(app)
      .post("/api/verifier")
      .send({ output: { text: "spoof" }, context: { orgId: 2 } });
    expect(res.status).toBe(201);
    // Stamped with caller's actual org, not the spoofed one.
    expect(res.body.data.orgId).toBe(1);
  });
});
