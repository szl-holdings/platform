import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { Router, type Request, type Response, type NextFunction } from "express";
import request from "supertest";

vi.mock("@szl-holdings/db", () => ({
  db: {
    select() {
      const chain: Record<string, unknown> = {
        from: () => chain,
        where: () => chain,
        innerJoin: () => chain,
        then: (resolve: (v: unknown) => unknown) => Promise.resolve([]).then(resolve),
      };
      return chain;
    },
  },
  orgMembersTable: { orgId: "org_id", userId: "user_id" },
  organizationsTable: { id: "id", slug: "slug", name: "name" },
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ op: "eq", col, val }),
  and: (...conds: unknown[]) => ({ op: "and", conds }),
  inArray: (col: unknown, vals: unknown) => ({ op: "inArray", col, vals }),
}));

vi.mock("../../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@szl-holdings/observability", () => ({
  serverTelemetry: { recordAuthFailure: vi.fn(), recordRequest: vi.fn() },
}));

vi.mock("../../middlewares/sliding-window-limiter", () => ({
  perUserApiSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  perUserWriteSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock("../../middlewares/idempotency", () => ({
  idempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
  optionalIdempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock("../../middlewares/auth", () => ({
  authMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  parseIdParam: (raw: string) => parseInt(raw, 10),
  InvalidIdError: class InvalidIdError extends Error {},
}));

vi.mock("../../lib/validation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/validation")>();
  return {
    ...actual,
    validateBody: () => (_req: Request, _res: Response, next: NextFunction) => next(),
    validateQuery: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  };
});

const stubRouter = () => {
  const r = Router();
  r.use((_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });
  return r;
};

// decisions group
vi.mock("../decisioning", () => ({ default: stubRouter() }));
vi.mock("../decision-fabric", () => ({ default: stubRouter() }));
// graph group
vi.mock("../graph", () => ({ default: stubRouter() }));
// verifier group
vi.mock("../verifier", () => ({ default: stubRouter() }));
// vessels group
vi.mock("../vessels", () => ({ default: stubRouter() }));
vi.mock("../vessels-platform", () => ({ default: stubRouter() }));
vi.mock("../vessels-live", () => ({ default: stubRouter() }));
vi.mock("../vessels-extended", () => ({ default: stubRouter() }));
vi.mock("../vessels-trading", () => ({ default: stubRouter() }));
vi.mock("../vessels-insurance", () => ({ default: stubRouter() }));
vi.mock("../vessels-cognitive", () => ({ default: stubRouter() }));
// lyte group
vi.mock("../lyte", () => ({ default: stubRouter() }));
vi.mock("../lyte-billing", () => ({ default: stubRouter() }));
vi.mock("../lyte-platform", () => ({ default: stubRouter() }));
vi.mock("../lyte-live", () => ({ default: stubRouter() }));
vi.mock("../lyte-observability", () => ({ default: stubRouter() }));
vi.mock("../lyte-extended", () => ({ default: stubRouter() }));
vi.mock("../lyte-cognitive", () => ({ default: stubRouter() }));
// guardian group
vi.mock("../guardian", () => ({ default: stubRouter() }));
// terra group
vi.mock("../terra", () => ({ default: stubRouter() }));
vi.mock("../terra-crm", () => ({ default: stubRouter() }));
vi.mock("../terra-distress", () => ({ default: stubRouter() }));
vi.mock("../terra-broker", () => ({ default: stubRouter() }));
vi.mock("../terra-live", () => ({ default: stubRouter() }));
vi.mock("../terra-cognitive", () => ({ default: stubRouter() }));
vi.mock("../terra-modules", () => ({ default: stubRouter() }));
// alloy group
vi.mock("../alloy", () => ({ default: stubRouter() }));
vi.mock("../alloy-chat", () => ({ default: stubRouter() }));
vi.mock("../alloy-email", () => ({ default: stubRouter() }));
vi.mock("../alloy-meetings", () => ({ default: stubRouter() }));
vi.mock("../alloy-digest", () => ({ default: stubRouter() }));
vi.mock("../alloy-integrations", () => ({ default: stubRouter() }));
vi.mock("../alloy-voice", () => ({ default: stubRouter() }));
vi.mock("../alloy-cognitive-learning", () => ({ default: stubRouter() }));
vi.mock("../alloy-governance", () => ({ default: stubRouter() }));
vi.mock("../alloy-skills", () => ({ default: stubRouter() }));
vi.mock("../alloy-research", () => ({ default: stubRouter(), alloyResearchRouter: stubRouter() }));
vi.mock("../alloy-channels", () => ({ default: stubRouter() }));
vi.mock("../governance", () => ({ default: stubRouter() }));
// billing group
vi.mock("../billing", () => ({ default: stubRouter() }));
vi.mock("../metering", () => ({ register: (_r: unknown) => {} }));
vi.mock("../usage", () => ({ default: stubRouter() }));
vi.mock("../partner-portal", () => ({ default: stubRouter() }));
vi.mock("../feature-flags", () => ({ default: stubRouter() }));
vi.mock("../notifications", () => ({ default: stubRouter() }));
vi.mock("../projects", () => ({ default: stubRouter() }));
vi.mock("../services", () => ({ default: stubRouter() }));
vi.mock("../connectors", () => ({ default: stubRouter() }));
// data-services group
vi.mock("../documents", () => ({ register: (_r: unknown) => {} }));
vi.mock("../cms", () => ({ default: stubRouter() }));
vi.mock("../exports", () => ({ default: stubRouter() }));
vi.mock("../reports", () => ({ default: stubRouter() }));
vi.mock("../comments", () => ({ default: stubRouter() }));
vi.mock("../atlas-artifacts", () => ({ default: stubRouter() }));
vi.mock("../telemetry", () => ({ default: stubRouter() }));
vi.mock("../doctrine", () => ({ default: stubRouter() }));
vi.mock("../analytics", () => ({ default: stubRouter() }));
vi.mock("../analytics-engine", () => ({ default: stubRouter() }));
vi.mock("../genai-telemetry", () => ({ default: stubRouter() }));
vi.mock("../outcome-graph", () => ({ default: stubRouter() }));
vi.mock("../pulse-evals", () => ({ default: stubRouter() }));
vi.mock("../receipt-graph", () => ({ default: stubRouter() }));
vi.mock("../revenue-intelligence", () => ({ default: stubRouter() }));
// security group
vi.mock("../firestorm", () => ({ register: (_r: unknown) => {} }));
vi.mock("../firestorm-live", () => ({ default: stubRouter() }));
vi.mock("../firestorm-command-surfaces", () => ({ default: stubRouter() }));
vi.mock("../firestorm-cognitive", () => ({ default: stubRouter() }));
vi.mock("../intelligence", () => ({ register: (_r: unknown) => {}, scheduleIntelligenceRefresh: () => {}, prewarmIntelligenceCache: () => Promise.resolve(), scheduleIntelligenceCachePruning: () => ({} as NodeJS.Timeout) }));
vi.mock("../inca", () => ({ default: stubRouter() }));
vi.mock("../gov-data", () => ({ default: stubRouter() }));
vi.mock("../readiness", () => ({ default: stubRouter() }));
vi.mock("../msp-live", () => ({ default: stubRouter() }));
vi.mock("../msp", () => ({ default: stubRouter() }));
vi.mock("../rmm", () => ({ register: (_r: unknown) => {}, startSyncScheduler: () => {} }));
vi.mock("../ot-ics", () => ({ default: stubRouter() }));
// misc group
vi.mock("../stephen", () => ({ default: stubRouter() }));
vi.mock("../carlota-jo", () => ({ default: stubRouter() }));
vi.mock("../holdings", () => ({ default: stubRouter() }));
vi.mock("../capital-readiness", () => ({ default: stubRouter() }));
vi.mock("../certification-readiness", () => ({ default: stubRouter() }));
vi.mock("../ownership-control", () => ({ default: stubRouter() }));
vi.mock("../fund-ops", () => ({ default: stubRouter() }));
vi.mock("../booking", () => ({ default: stubRouter() }));
vi.mock("../crm", () => ({ default: stubRouter() }));
vi.mock("../dreamscape", () => ({ default: stubRouter() }));
vi.mock("../briefing", () => ({ default: stubRouter() }));
vi.mock("../cortex", () => ({ default: stubRouter() }));
vi.mock("../innovation-engine", () => ({ default: stubRouter() }));
vi.mock("../autopilot", () => ({ default: stubRouter(), autopilotRouter: stubRouter() }));
vi.mock("../monte-carlo", () => ({ default: stubRouter() }));
vi.mock("../signal-chains", () => ({ default: stubRouter() }));
vi.mock("../cross-domain-query", () => ({ default: stubRouter() }));
vi.mock("../correlation-map", () => ({ default: stubRouter() }));
vi.mock("../realtime", () => ({ default: stubRouter() }));
vi.mock("../helm-console", () => ({ default: stubRouter() }));
vi.mock("../cross-app-handoffs", () => ({ default: stubRouter() }));
vi.mock("../multiplayer-sessions", () => ({ default: stubRouter() }));
vi.mock("../prism-bus-api", () => ({ default: stubRouter() }));
vi.mock("../forge-runtime-api", () => ({ default: stubRouter() }));
vi.mock("../covenant-policy-api", () => ({ default: stubRouter() }));
vi.mock("../imperium", () => ({ default: stubRouter() }));
vi.mock("../distribution-os", () => ({ register: (_r: unknown) => {} }));
vi.mock("../dos-public-api", () => ({ default: stubRouter() }));
vi.mock("../integrations", () => ({ default: stubRouter() }));
vi.mock("../microsoft-graph", () => ({ default: stubRouter() }));
vi.mock("../microsoft-integrations", () => ({ default: stubRouter() }));
vi.mock("../push-tokens", () => ({ default: stubRouter() }));
vi.mock("../push-notifications", () => ({ default: stubRouter() }));
vi.mock("../push-preferences", () => ({ default: stubRouter() }));
vi.mock("../push-history", () => ({ default: stubRouter() }));
vi.mock("../push-analytics", () => ({ default: stubRouter() }));
vi.mock("../web-push-subscriptions", () => ({ default: stubRouter() }));
vi.mock("../notification-recipients", () => ({ default: stubRouter() }));
vi.mock("../support", () => ({ default: stubRouter() }));
vi.mock("../data-retention", () => ({ default: stubRouter() }));
vi.mock("../investor-analytics", () => ({ default: stubRouter() }));
// ai group
vi.mock("../ai-engine", () => ({ default: stubRouter() }));
vi.mock("../ai-ops-dashboard", () => ({ default: stubRouter() }));
vi.mock("../copilot", () => ({ default: stubRouter() }));
vi.mock("../mcp", () => ({ default: stubRouter() }));
vi.mock("../nuro-mesh", () => ({ default: stubRouter() }));
vi.mock("../nuro-mesh-advanced", () => ({ default: stubRouter() }));
vi.mock("../control-tower", () => ({ register: (_r: unknown) => {} }));
vi.mock("../domain-agents/index", () => ({ default: stubRouter() }));
vi.mock("../agent-os", () => ({ default: stubRouter() }));
vi.mock("../agent-training", () => ({ default: stubRouter() }));
vi.mock("../agent-autonomy", () => ({ default: stubRouter() }));
vi.mock("../agent-federation", () => ({ default: stubRouter() }));
vi.mock("../fine-tuning", () => ({ default: stubRouter() }));
vi.mock("../ml-pipeline", () => ({ default: stubRouter() }));
vi.mock("../consciousness", () => ({ default: stubRouter() }));
vi.mock("../ontology", () => ({ default: stubRouter() }));
vi.mock("../digital-twins", () => ({ default: stubRouter() }));
vi.mock("../fusion", () => ({ default: stubRouter() }));
vi.mock("../knowledge-graph", () => ({ default: stubRouter() }));
vi.mock("../ai-safety", () => ({ default: stubRouter() }));
vi.mock("../forge", () => ({ default: stubRouter() }));
vi.mock("../rag-knowledge", () => ({ default: stubRouter() }));
vi.mock("../streaming-ingestion", () => ({ default: stubRouter() }));
vi.mock("../connector-hub", () => ({ default: stubRouter() }));
vi.mock("../a2a", () => ({ default: stubRouter() }));
vi.mock("../jobs", () => ({ default: stubRouter() }));
vi.mock("../atlas-spatial-runtime", () => ({ default: stubRouter() }));

function org1User() {
  return {
    id: 1,
    displayName: "Alice",
    email: "alice@org1.example",
    roles: ["member"] as string[],
    orgs: [{ orgId: 1, orgSlug: "org-one", orgName: "Org One", role: "member" }],
    isInternalAgent: false,
  };
}

function noOrgUser() {
  return { ...org1User(), orgs: [] };
}

function adminUser() {
  return { ...org1User(), roles: ["admin"], orgs: [] };
}

async function buildGroupApp(
  groupPath: string,
  userFactory: () => ReturnType<typeof org1User>,
) {
  const app = express();
  app.use(express.json());

  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = userFactory();
    (req as Request & { isInternalAgent: boolean }).isInternalAgent = false;
    next();
  });

  const groupRouter = Router();

  if (groupPath === "decisions") {
    const { register } = await import("../groups/decisions.js");
    register(groupRouter);
  } else if (groupPath === "graph") {
    const { register } = await import("../groups/graph.js");
    register(groupRouter);
  } else if (groupPath === "verifier") {
    const { register } = await import("../groups/verifier.js");
    register(groupRouter);
  } else if (groupPath === "vessels") {
    const { register } = await import("../groups/vessels.js");
    register(groupRouter);
  } else if (groupPath === "lyte") {
    const { register } = await import("../groups/lyte.js");
    register(groupRouter);
  } else if (groupPath === "guardian") {
    const { register } = await import("../groups/guardian.js");
    register(groupRouter);
  } else if (groupPath === "terra") {
    const { register } = await import("../groups/terra.js");
    register(groupRouter);
  } else if (groupPath === "alloy") {
    const { register } = await import("../groups/alloy.js");
    register(groupRouter);
  } else if (groupPath === "billing") {
    const { register } = await import("../groups/billing.js");
    register(groupRouter);
  } else if (groupPath === "data-services") {
    const { register } = await import("../groups/data-services.js");
    register(groupRouter);
  } else if (groupPath === "security") {
    const { register } = await import("../groups/security.js");
    register(groupRouter);
  } else if (groupPath === "misc") {
    const { register } = await import("../groups/misc.js");
    register(groupRouter);
  } else if (groupPath === "ai") {
    const { register } = await import("../groups/ai.js");
    register(groupRouter);
  }

  app.use(groupRouter);
  return app;
}

describe("Domain group tenant gate — integration via assembled router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const GROUPS: Array<{ group: string; testPath: string; description: string }> = [
    { group: "decisions", testPath: "/decisioning/status", description: "/decisioning" },
    { group: "decisions", testPath: "/decision-fabric/status", description: "/decision-fabric" },
    { group: "graph", testPath: "/graph/status", description: "/graph" },
    { group: "verifier", testPath: "/verifier/status", description: "/verifier" },
    { group: "vessels", testPath: "/vessels/status", description: "/vessels" },
    { group: "lyte", testPath: "/lyte/status", description: "/lyte" },
    { group: "guardian", testPath: "/guardian/status", description: "/guardian" },
    { group: "terra", testPath: "/terra/status", description: "/terra" },
    { group: "alloy", testPath: "/alloy/status", description: "/alloy" },
    { group: "billing", testPath: "/billing/status", description: "/billing" },
    { group: "billing", testPath: "/partner/accounts", description: "/partner (billing — previously ungated)" },
    { group: "billing", testPath: "/services/health", description: "/services (billing — previously ungated)" },
    { group: "data-services", testPath: "/documents/status", description: "/documents (data-services)" },
    { group: "security", testPath: "/firestorm/status", description: "/firestorm (security)" },
    { group: "misc", testPath: "/booking/status", description: "/booking (misc — previously ungated)" },
    { group: "misc", testPath: "/forge/status", description: "/forge (misc — previously ungated)" },
    { group: "misc", testPath: "/stephen/status", description: "/stephen (misc — previously ungated)" },
    { group: "ai", testPath: "/forge/agents", description: "/forge (ai — previously ungated)" },
  ];

  for (const { group, testPath, description } of GROUPS) {
    describe(`${group} group — ${description}`, () => {
      it("allows an org member to reach the route (200)", async () => {
        const app = await buildGroupApp(group, org1User);
        const res = await request(app).get(testPath);
        expect(res.status).toBe(200);
      });

      it("blocks a user with no org memberships (403)", async () => {
        const app = await buildGroupApp(group, noOrgUser);
        const res = await request(app).get(testPath);
        expect(res.status).toBe(403);
        expect(res.body.error).toMatch(/organization/i);
      });

      it("allows an admin user through regardless of org membership (200)", async () => {
        const app = await buildGroupApp(group, adminUser);
        const res = await request(app).get(testPath);
        expect(res.status).toBe(200);
      });
    });
  }
});
