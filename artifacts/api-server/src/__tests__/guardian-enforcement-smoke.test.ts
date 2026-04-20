/**
 * Guardian Enforcement Smoke Test (Task #1214)
 *
 * Proves that with `GUARDIAN_ENFORCE=true`, the policy middleware
 * actually short-circuits requests:
 *
 *   - allow             → next() runs, route returns 200
 *   - deny              → HTTP 403 + GUARDIAN_DENY (route is NOT invoked)
 *   - require-approval  → HTTP 202 + GUARDIAN_APPROVAL_REQUIRED, with a
 *                         requestId surfaced for the Alloy approval gate
 *
 * Exercises one of each scenario per agent-facing policy domain so a
 * regression in any single category surfaces immediately.
 */

// Env defaults required by the zod-validated env loader (transitively
// pulled in by `lib/db`) are bootstrapped via the global vitest setup
// file: `./helpers/test-env-bootstrap.ts`.

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  vi,
} from "vitest";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import request from "supertest";

// Minimal auth mock — the smoke test runs without DB / real auth.
vi.mock("../middlewares/auth.js", () => ({
  authMiddleware: () => (_req: Request, _res: Response, next: NextFunction) =>
    next(),
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) =>
    next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) =>
    next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) =>
    next(),
  requireOrgMembership: () =>
    (_req: Request, _res: Response, next: NextFunction) => next(),
}));

// Effective tier override resolution hits the DB; stub it out so the
// engine falls back to constants (supervised → riskLevel 2, no gate).
vi.mock("../lib/effective-tiers.js", () => ({
  getEffectiveTierOverride: async () => undefined,
  invalidateEffectiveTierCache: () => {},
}));

// Stub the Alloy/covenant approval gate so the require-approval path
// can return a synthetic approvalRequestId without a real database.
// `failNext` lets a single test simulate gate outage to exercise the
// fail-closed (HTTP 503) branch.
let approvalCallCount = 0;
const approvalCalls: Array<Record<string, unknown>> = [];
let failNext = false;
vi.mock("@szl-holdings/covenant-policy", () => ({
  createApprovalRequest: async (params: Record<string, unknown>) => {
    if (failNext) {
      failNext = false;
      throw new Error("simulated approval gate outage");
    }
    approvalCallCount += 1;
    approvalCalls.push(params);
    return {
      id: 9000 + approvalCallCount,
      status: "pending",
      ...params,
    };
  },
}));

const AGENT_DOMAINS = [
  "alloy",
  "agents",
  "ai",
  "memory",
  "governance",
  "decisions",
  "plans",
] as const;

type Domain = (typeof AGENT_DOMAINS)[number];

// Rule IDs we install — kept on a list so afterAll can deterministically
// remove them and not leak into other tests sharing the engine singleton.
const installedRuleIds: string[] = [];

type GuardianMiddlewareFactory = (opts: {
  category?: string;
  defaultTier?: string;
  enforce?: boolean;
}) => (req: Request, res: Response, next: NextFunction) => void;

let guardianPolicyCheck: GuardianMiddlewareFactory;

function makeApp(domain: Domain): express.Express {
  const app = express();
  app.use(express.json());

  for (const outcome of ["allow", "deny", "approve"] as const) {
    app.post(
      `/${outcome}-test`,
      guardianPolicyCheck({
        category: domain,
        defaultTier: "supervised",
        enforce: true,
      }),
      (_req: Request, res: Response) => res.status(200).json({ ok: true }),
    );
  }

  return app;
}

describe("Guardian enforcement smoke (#1214)", () => {
  beforeAll(async () => {
    const middlewareMod = await import("../middlewares/guardian-policy.js");
    guardianPolicyCheck =
      middlewareMod.guardianPolicyCheck as unknown as GuardianMiddlewareFactory;
    const { getGuardianEngine, initGuardianEngine } = await import(
      "../lib/guardian-engine.js"
    );
    // Ensures the bootstrap fallback allow rules are installed so /allow-test
    // matches an allow rule (otherwise deny-by-default kicks in).
    await initGuardianEngine();
    const engine = getGuardianEngine();

    // Per-domain explicit deny + require-approval rules. Priority 1 wins
    // over the bootstrap fallback (priority 9990) so the outcome is
    // deterministic without needing a seeded database.
    for (const domain of AGENT_DOMAINS) {
      const denyRule = {
        id: `smoke-deny-${domain}`,
        name: `Smoke deny ${domain}`,
        description: `Smoke test deny rule for ${domain}`,
        tier: "supervised" as const,
        conditions: [
          { field: "domain", operator: "eq" as const, value: domain },
          { field: "action", operator: "eq" as const, value: "POST:/deny-test" },
        ],
        action: "deny" as const,
        priority: 1,
        enabled: true,
        owner: "guardian-enforcement-smoke-test",
        tags: ["smoke", "deny", domain],
      };
      const approveRule = {
        id: `smoke-approve-${domain}`,
        name: `Smoke require-approval ${domain}`,
        description: `Smoke test require-approval rule for ${domain}`,
        tier: "supervised" as const,
        conditions: [
          { field: "domain", operator: "eq" as const, value: domain },
          {
            field: "action",
            operator: "eq" as const,
            value: "POST:/approve-test",
          },
        ],
        action: "require-approval" as const,
        priority: 1,
        enabled: true,
        owner: "guardian-enforcement-smoke-test",
        tags: ["smoke", "require-approval", domain],
      };
      engine.addRule(denyRule);
      engine.addRule(approveRule);
      installedRuleIds.push(denyRule.id, approveRule.id);
    }
  });

  afterAll(async () => {
    const { getGuardianEngine } = await import("../lib/guardian-engine.js");
    const engine = getGuardianEngine();
    for (const id of installedRuleIds) engine.removeRule(id);
  });

  for (const domain of AGENT_DOMAINS) {
    describe(`domain=${domain}`, () => {
      it("allow → 200 and the route handler runs", async () => {
        const app = makeApp(domain);
        const res = await request(app).post("/allow-test").send({});
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
        expect(res.headers["x-guardian-outcome"]).toBe("allow");
        expect(res.headers["x-guardian-request-id"]).toMatch(/^api-/);
      });

      it("deny → 403 with policy decision context, route NOT invoked", async () => {
        const app = makeApp(domain);
        const res = await request(app).post("/deny-test").send({});
        expect(res.status).toBe(403);
        expect(res.body).toMatchObject({
          success: false,
          code: "GUARDIAN_DENY",
        });
        expect(res.body.requestId).toMatch(/^api-/);
        expect(res.body.matchedRuleId).toBe(`smoke-deny-${domain}`);
        expect(res.body.reason).toBeTruthy();
        expect(res.headers["x-guardian-outcome"]).toBe("deny");
      });

      it("approval gate failure → 503 fail-closed (no 202 with null id)", async () => {
        failNext = true;
        const app = makeApp(domain);
        const res = await request(app).post("/approve-test").send({});
        expect(res.status).toBe(503);
        expect(res.body).toMatchObject({
          success: false,
          code: "GUARDIAN_APPROVAL_GATE_UNAVAILABLE",
        });
        expect(res.body.requestId).toMatch(/^api-/);
      });

      it("require-approval → 202, routes through Alloy approval gate, surfaces approvalRequestId", async () => {
        const before = approvalCallCount;
        const app = makeApp(domain);
        const res = await request(app).post("/approve-test").send({});
        expect(res.status).toBe(202);
        expect(res.body).toMatchObject({
          success: false,
          status: "approval-required",
          code: "GUARDIAN_APPROVAL_REQUIRED",
          outcome: "require-approval",
        });
        expect(res.body.requestId).toMatch(/^api-/);
        expect(res.body.matchedRuleId).toBe(`smoke-approve-${domain}`);
        expect(Array.isArray(res.body.requiredApprovers)).toBe(true);
        expect(res.body.requiredApprovers.length).toBeGreaterThan(0);
        expect(res.headers["x-guardian-outcome"]).toBe("require-approval");

        // The covenant-policy approval gate must have been invoked once
        // for this gated request, with the resource keyed off the
        // request and the Guardian decision id propagated as the
        // approval correlationId.
        expect(approvalCallCount).toBe(before + 1);
        expect(typeof res.body.approvalRequestId).toBe("number");
        expect(res.body.approvalRequestId).toBeGreaterThan(0);
        expect(res.headers["x-guardian-approval-id"]).toBe(
          String(res.body.approvalRequestId),
        );
        const lastCall = approvalCalls[approvalCalls.length - 1]!;
        expect(lastCall.resourceType).toBe("guardian.api.request");
        expect(lastCall.actionClass).toBe(domain);
        expect(lastCall.correlationId).toBe(res.body.requestId);
      });
    });
  }
});
