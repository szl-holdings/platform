/**
 * seed:forge — populate Forge governance demo data.
 *
 * Idempotent: skips if any agent with isSeed=true already exists.
 * Creates: 4 policy packs, 3 deployment targets, 4 env profiles, env snapshots,
 *          5 approved models, 4 approved tools, 4 prompts (w/ versions),
 *          5 demo agents (each with 2-3 versions), promotions, drift events,
 *          execution runs across the full status spectrum.
 */
import {
  db,
  forgeAgentsTable, forgeAgentVersionsTable,
  forgeModelsTable, forgePromptsTable, forgePromptVersionsTable,
  forgeToolsTable, forgeDeploymentTargetsTable, forgeEnvironmentProfilesTable,
  forgeEnvironmentSnapshotsTable, forgePolicyPacksTable, forgePolicyAssignmentsTable,
  forgeDriftEventsTable, forgePromotionsTable, forgeExecutionRunsTable,
  forgeRollbackEventsTable, forgeAuditEventsTable,
} from "@szl-holdings/db";
import { eq } from "drizzle-orm";
import { createHash, randomUUID } from "crypto";

const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

export async function seedForge() {
  console.log("[seed-forge] Starting Forge governance seed...");

  const existing = await db.select({ id: forgeAgentsTable.id }).from(forgeAgentsTable).where(eq(forgeAgentsTable.isSeed, true)).limit(1);
  if (existing.length > 0) {
    console.log("[seed-forge] Already seeded, skipping.");
    return { skipped: true };
  }

  // ─── Policy packs (4) ───
  const policies = await db.insert(forgePolicyPacksTable).values([
    { slug: "low-risk-internal", name: "Low Risk — Internal", description: "Default pack for internal-only low-risk agents", riskTier: "low", rules: { requireApprovalActions: [], denyEnvs: [] } },
    { slug: "standard-prod-gate", name: "Standard — Production Gate", description: "Standard production promotions require human approval", riskTier: "standard", rules: { requireApprovalActions: ["promote"], denyEnvs: [] } },
    { slug: "regulated-finance", name: "Regulated — Finance", description: "Finance/insurance agents — strict approval and execution gates", riskTier: "regulated", rules: { requireApprovalActions: ["promote", "modify", "execute"], denyEnvs: [] } },
    { slug: "executive-briefings", name: "Executive — Briefings", description: "Executive-tier agents — promotion + rollback approval required", riskTier: "executive", rules: { requireApprovalActions: ["promote", "rollback", "modify"], denyEnvs: [] } },
  ]).returning();
  const policyBySlug = Object.fromEntries(policies.map(p => [p.slug, p]));

  // ─── Deployment targets (3) ───
  const targets = await db.insert(forgeDeploymentTargetsTable).values([
    { slug: "replit-edge", name: "Replit Edge", kind: "replit", region: "us-east", computeProfile: { cpu: "shared", memMb: 512 }, packageLock: {}, requiredSecrets: [], storageDeps: ["postgres"], allowedIntegrations: ["github"] },
    { slug: "vercel-prod", name: "Vercel Production", kind: "vercel", region: "iad1", computeProfile: { runtime: "edge", memMb: 256 }, packageLock: {}, requiredSecrets: [], storageDeps: ["postgres", "redis"], allowedIntegrations: ["openai"] },
    { slug: "fargate-regulated", name: "AWS Fargate (Regulated)", kind: "aws-fargate", region: "us-east-1", computeProfile: { vcpu: 1, memMb: 2048 }, packageLock: {}, requiredSecrets: [], storageDeps: ["postgres", "kms"], complianceNotes: "SOC2 + HIPAA + PCI", allowedIntegrations: [] },
  ]).returning();
  const targetBySlug = Object.fromEntries(targets.map(t => [t.slug, t]));

  // ─── Environment profiles (4 tiers) ───
  const envs = await db.insert(forgeEnvironmentProfilesTable).values([
    { slug: "dev",        name: "Development",   tier: "dev",        targetId: targetBySlug["replit-edge"]!.id,        observabilityHook: "tower:dev",        requireApproval: false },
    { slug: "sandbox",    name: "Sandbox",       tier: "sandbox",    targetId: targetBySlug["replit-edge"]!.id,        observabilityHook: "tower:sandbox",    requireApproval: false },
    { slug: "staging",    name: "Staging",       tier: "staging",    targetId: targetBySlug["vercel-prod"]!.id,        observabilityHook: "tower:staging",    requireApproval: false },
    { slug: "production", name: "Production",    tier: "production", targetId: targetBySlug["fargate-regulated"]!.id,  observabilityHook: "tower:production", requireApproval: true },
  ]).returning();
  const envByTier = Object.fromEntries(envs.map(e => [e.tier, e]));

  // ─── Approved models (5) ───
  const models = await db.insert(forgeModelsTable).values([
    { slug: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet",   provider: "anthropic", family: "claude", contextWindow: 200000, inputCostPer1k: "0.003",  outputCostPer1k: "0.015",  approved: true,  riskTier: "standard" },
    { slug: "gpt-4o",            name: "GPT-4o",              provider: "openai",    family: "gpt-4",  contextWindow: 128000, inputCostPer1k: "0.0025", outputCostPer1k: "0.010",  approved: true,  riskTier: "standard" },
    { slug: "gemini-1-5-pro",    name: "Gemini 1.5 Pro",      provider: "google",    family: "gemini", contextWindow: 1000000,inputCostPer1k: "0.00125",outputCostPer1k: "0.005",  approved: true,  riskTier: "standard" },
    { slug: "claude-3-opus",     name: "Claude 3 Opus",       provider: "anthropic", family: "claude", contextWindow: 200000, inputCostPer1k: "0.015",  outputCostPer1k: "0.075",  approved: true,  riskTier: "regulated" },
    { slug: "experimental-llama-405b", name: "Llama 3.1 405B (experimental)", provider: "meta", family: "llama", contextWindow: 128000, inputCostPer1k: "0.005", outputCostPer1k: "0.015", approved: false, riskTier: "regulated" },
  ]).returning();
  const modelBySlug = Object.fromEntries(models.map(m => [m.slug, m]));

  // ─── Tools (4) ───
  const tools = await db.insert(forgeToolsTable).values([
    { slug: "search-knowledge",   name: "Knowledge Search",        description: "Reads from RAG knowledge base",          category: "read",  riskLevel: "low",      approved: true,  schema: {} },
    { slug: "draft-document",     name: "Draft Document",          description: "Generates draft documents (read-only)",  category: "write", riskLevel: "low",      approved: true,  schema: {} },
    { slug: "execute-trade",      name: "Execute Trade",           description: "Submits trade orders to broker",         category: "execute", riskLevel: "high",   approved: true,  schema: {} },
    { slug: "experimental-fetch", name: "Experimental Web Fetch",  description: "Untrusted browsing — pending review",    category: "read",  riskLevel: "high",     approved: false, schema: {} },
  ]).returning();
  const toolBySlug = Object.fromEntries(tools.map(t => [t.slug, t]));

  // ─── Prompts + versions ───
  const prompts = await db.insert(forgePromptsTable).values([
    { slug: "executive-briefer-system", name: "Executive Briefer — System", purpose: "Daily exec briefing", tags: ["executive"] },
    { slug: "matter-twin-analyst",      name: "Matter Twin — Analyst",       purpose: "PRISM Counsel analysis", tags: ["legal", "regulated"] },
    { slug: "vessels-ops-router",       name: "Vessels — Ops Router",        purpose: "Maritime ops routing",   tags: ["maritime"] },
    { slug: "carlota-concierge",        name: "Carlota — Concierge",         purpose: "Client engagement",      tags: ["client"] },
  ]).returning();

  const promptVersions: Record<string, { v1: string; v2?: string }> = {};
  for (const p of prompts) {
    const [v1] = await db.insert(forgePromptVersionsTable).values({ promptId: p.id, version: 1, body: `# ${p.name}\nv1 baseline prompt.`, evalsPassed: true, evalScore: "92.0" }).returning();
    const [v2] = await db.insert(forgePromptVersionsTable).values({ promptId: p.id, version: 2, body: `# ${p.name}\nv2 — improved guardrails.`, evalsPassed: true, evalScore: "95.5" }).returning();
    promptVersions[p.slug] = { v1: v1!.id, v2: v2!.id };
  }

  // ─── Agents (5) with versions ───
  const agentSpecs = [
    { slug: "executive-briefer",  name: "Executive Briefer",        domain: "executive", riskTier: "executive", policy: "executive-briefings", env: "production", model: "claude-3-opus",        prompt: "executive-briefer-system", tools: ["search-knowledge", "draft-document"] },
    { slug: "matter-twin-analyst",name: "Matter Twin Analyst",      domain: "legal",     riskTier: "regulated", policy: "regulated-finance",   env: "staging",    model: "claude-3-5-sonnet",    prompt: "matter-twin-analyst",      tools: ["search-knowledge", "draft-document"] },
    { slug: "vessels-ops-router", name: "Vessels Ops Router",       domain: "maritime",  riskTier: "standard",  policy: "standard-prod-gate",  env: "production", model: "gpt-4o",               prompt: "vessels-ops-router",       tools: ["search-knowledge"] },
    { slug: "carlota-concierge",  name: "Carlota Concierge",        domain: "client",    riskTier: "standard",  policy: "standard-prod-gate",  env: "sandbox",    model: "gemini-1-5-pro",       prompt: "carlota-concierge",        tools: ["search-knowledge", "draft-document"] },
    { slug: "trade-executor-bot", name: "Trade Executor (sandbox)", domain: "finance",   riskTier: "regulated", policy: "regulated-finance",   env: "dev",        model: "claude-3-5-sonnet",    prompt: "matter-twin-analyst",      tools: ["execute-trade", "search-knowledge"] },
  ] as const;

  const created = [];
  for (const s of agentSpecs) {
    const [agent] = await db.insert(forgeAgentsTable).values({
      slug: s.slug, name: s.name, description: `${s.name} (seeded demo agent)`,
      domain: s.domain, riskTier: s.riskTier, currentEnv: s.env, status: "active",
      policyPackId: policyBySlug[s.policy]!.id, isSeed: true, tags: [s.domain, s.riskTier],
    }).returning();

    const toolIds = s.tools.map(t => toolBySlug[t]!.id);
    const [v1] = await db.insert(forgeAgentVersionsTable).values({
      agentId: agent!.id, version: 1, modelId: modelBySlug[s.model]!.id,
      promptVersionId: promptVersions[s.prompt]!.v1, toolIds, systemConfig: {},
      evalsPassed: true, observabilityHookConfigured: true, provenanceComplete: true,
      notes: "Initial release",
    }).returning();
    const [v2] = await db.insert(forgeAgentVersionsTable).values({
      agentId: agent!.id, version: 2, modelId: modelBySlug[s.model]!.id,
      promptVersionId: promptVersions[s.prompt]!.v2, toolIds, systemConfig: {},
      evalsPassed: true, observabilityHookConfigured: true, provenanceComplete: true,
      notes: "Hardened guardrails + better evals",
    }).returning();
    await db.update(forgeAgentsTable).set({ activeVersionId: v2!.id }).where(eq(forgeAgentsTable.id, agent!.id));

    await db.insert(forgePolicyAssignmentsTable).values(
      ["dev", "sandbox", "staging", "production"].map(tier => ({
        policyPackId: policyBySlug[s.policy]!.id, agentId: agent!.id, envTier: tier,
      })),
    );

    created.push({ agent, v1, v2, spec: s });
  }

  // ─── Environment snapshots (so drift can be evaluated) ───
  for (const env of envs) {
    const inv: Record<string, { modelId: string; promptVersionId: string; toolIds: string[] }> = {};
    for (const c of created) {
      // Stage env shows v1 inventory (drift vs active v2) for drifting agents
      const useV1 = (env.tier === "staging" && c.spec.env === "staging") || (env.tier === "sandbox" && c.spec.slug === "trade-executor-bot");
      const ver = useV1 ? c.v1 : c.v2;
      inv[c.agent.id] = {
        modelId: ver!.modelId!,
        promptVersionId: ver!.promptVersionId!,
        toolIds: (ver!.toolIds as string[]) ?? [],
      };
    }
    await db.insert(forgeEnvironmentSnapshotsTable).values({
      envId: env.id, capturedAt: daysAgo(1), agentInventory: inv, modelInventory: {}, toolInventory: {},
      secretsFingerprint: hash(env.tier + ":secrets"), hash: hash(env.tier + JSON.stringify(inv)),
    });
  }

  // ─── Drift events (variety of severities) ───
  const driftSeeds: Array<{ agentSlug: string; envTier: string; severity: "low" | "medium" | "high" | "critical"; dimension: "model" | "prompt" | "tool" | "data" | "config"; score: number; remediation: string }> = [
    { agentSlug: "matter-twin-analyst", envTier: "staging", severity: "medium",   dimension: "prompt", score: 42, remediation: "Re-deploy v2 prompt to staging" },
    { agentSlug: "executive-briefer",   envTier: "production", severity: "low",    dimension: "config", score: 18, remediation: "Refresh env snapshot" },
    { agentSlug: "trade-executor-bot",  envTier: "sandbox",    severity: "high",   dimension: "tool",   score: 72, remediation: "Restore execute-trade tool permission in sandbox" },
    { agentSlug: "vessels-ops-router",  envTier: "production", severity: "critical", dimension: "model",score: 88, remediation: "Freeze production traffic; investigate model regression" },
  ];
  for (const d of driftSeeds) {
    const c = created.find(x => x.spec.slug === d.agentSlug)!;
    await db.insert(forgeDriftEventsTable).values({
      agentId: c.agent.id, envId: envByTier[d.envTier]!.id,
      detectedAt: daysAgo(Math.floor(Math.random() * 4) + 1),
      driftScore: String(d.score), severity: d.severity, dimension: d.dimension,
      expectedFingerprint: hash(d.agentSlug + ":expected"),
      observedFingerprint: hash(d.agentSlug + ":observed"),
      findings: { dimension: d.dimension, score: d.score },
      remediation: d.remediation,
    });
  }

  // ─── Promotions across the spectrum ───
  for (const c of created) {
    // historical successful promotion v1 → v2 (dev → sandbox)
    await db.insert(forgePromotionsTable).values({
      agentId: c.agent.id, fromVersionId: c.v1.id, toVersionId: c.v2.id,
      fromEnv: "dev", toEnv: "sandbox", status: "promoted",
      promotedAt: daysAgo(7), blockers: [], validationReport: { ok: true },
    });
  }
  // pending validated, blocked, requested
  await db.insert(forgePromotionsTable).values([
    { agentId: created[1]!.agent.id, fromVersionId: created[1]!.v1.id, toVersionId: created[1]!.v2.id, fromEnv: "staging", toEnv: "production", status: "validated", blockers: [], validationReport: { ok: true } },
    { agentId: created[2]!.agent.id, fromVersionId: created[2]!.v1.id, toVersionId: created[2]!.v2.id, fromEnv: "staging", toEnv: "production", status: "blocked",
      blockers: [{ code: "DRIFT_OVER_THRESHOLD", message: "Drift score 88 exceeds threshold 60 for production" }], validationReport: { drift: { score: 88, severity: "critical" } } },
    { agentId: created[4]!.agent.id, fromVersionId: created[4]!.v1.id, toVersionId: created[4]!.v2.id, fromEnv: "sandbox", toEnv: "staging", status: "requested", blockers: [], validationReport: {} },
  ]);

  // ─── Execution runs (success / failure / escalated / overridden) ───
  const execRows = [];
  for (const c of created) {
    for (let i = 0; i < 6; i++) {
      const isFailure = i === 4;
      const isEscalated = i === 5;
      execRows.push({
        agentId: c.agent.id, versionId: c.v2.id, envTier: c.spec.env,
        modelId: c.v2.modelId, promptVersionId: c.v2.promptVersionId,
        status: isFailure ? "failure" : isEscalated ? "escalated" : "success",
        outcome: isFailure ? "tool_timeout" : isEscalated ? "human_review" : "completed",
        latencyMs: 800 + Math.floor(Math.random() * 1500),
        inputTokens: 1200 + Math.floor(Math.random() * 800),
        outputTokens: 400 + Math.floor(Math.random() * 600),
        toolCalls: Math.floor(Math.random() * 4),
        toolFailures: isFailure ? 1 : 0,
        policyOutcome: c.spec.riskTier === "regulated" ? "needs_approval" : "allow",
        humanOverride: isEscalated,
        valueAtRiskUsd: c.spec.domain === "finance" ? String(50000 + Math.floor(Math.random() * 200000)) : null,
        provenance: { modelId: c.v2.modelId, promptVersionId: c.v2.promptVersionId, capturedAt: daysAgo(i).toISOString() },
        isSeed: true,
        startedAt: daysAgo(i),
        completedAt: daysAgo(i),
      });
    }
  }
  await db.insert(forgeExecutionRunsTable).values(execRows);

  // ─── One historical rollback ───
  await db.insert(forgeRollbackEventsTable).values({
    agentId: created[0]!.agent.id, fromVersionId: created[0]!.v2.id, toVersionId: created[0]!.v1.id,
    envTier: "production", reason: "Hallucination spike during weekly executive run — reverted to v1 baseline",
    triggeredBy: null,
  });

  await db.insert(forgeAuditEventsTable).values({
    action: "seed", resourceType: "forge", resourceId: randomUUID(),
    metadata: { script: "seed-forge", seededAgents: created.length, seededAt: new Date().toISOString() },
  });

  console.log(`[seed-forge] Done. Seeded ${created.length} agents, ${execRows.length} runs, ${driftSeeds.length} drift events.`);
  return { agents: created.length, runs: execRows.length, drift: driftSeeds.length };
}
