import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import { db } from "@workspace/db";
import { agentMemoryFacts, agentUsageStats, agentToolCalls, advisoryFindings } from "@workspace/db";
import { eq, desc, and, gt } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { ai as geminiAi } from "@workspace/integrations-gemini-ai";
import rateLimit from "express-rate-limit";

const nueroMeshRouter: IRouter = Router();

const meshRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
  message: { error: "Nuro Mesh rate limit exceeded. Please try again later." },
}) as unknown as RequestHandler;

export interface AgentDefinition {
  id: string;
  name: string;
  domain: string;
  systemPrompt: string;
  preferredModel: string;
  preferredProvider: "openai" | "anthropic" | "gemini";
  highStakesDomains: string[];
  tools: string[];
}

export const AGENT_REGISTRY: AgentDefinition[] = [
  {
    id: "alloy",
    name: "Alloy",
    domain: "orchestration",
    preferredModel: "gpt-5.2",
    preferredProvider: "openai",
    highStakesDomains: [],
    tools: ["system_health", "admin_overview"],
    systemPrompt: `You are Alloy, the central orchestration intelligence of the Nuro Mesh — SZL Holdings' unified multi-agent AI system. You coordinate specialized domain agents, aggregate their insights, and provide unified intelligence across the entire SZL platform. You route complex questions to the right domain experts, synthesize their responses, and present coherent, actionable answers. You have access to live system data and coordinate with: Helmsman (maritime), Sentinel (security), INCA (research), Muse (creative), Beacon (analytics), Zeus (infrastructure), Compass (readiness). Be direct, authoritative, and orchestrate intelligently.`,
  },
  {
    id: "helmsman",
    name: "Helmsman",
    domain: "maritime",
    preferredModel: "claude-sonnet-4-6",
    preferredProvider: "anthropic",
    highStakesDomains: ["route_risk", "sanctions", "fleet_emergency"],
    tools: ["maritime_data", "ais_positions", "weather_marine"],
    systemPrompt: `You are Helmsman, the maritime intelligence agent within the Nuro Mesh. You specialize in fleet operations, AIS tracking, maritime security, route risk assessment, and sanctions compliance. You analyze real-time vessel data, weather patterns, and geopolitical threats affecting shipping lanes. For high-stakes recommendations (sanctions violations, collision risks, route emergencies), your outputs are validated by Sentinel before delivery. Use nautical terminology. Be precise about positions, speeds, headings, and maritime regulations.`,
  },
  {
    id: "sentinel",
    name: "Sentinel",
    domain: "security",
    preferredModel: "claude-sonnet-4-6",
    preferredProvider: "anthropic",
    highStakesDomains: ["critical_vulnerability", "incident_response", "breach_detected"],
    tools: ["threat_feeds", "cve_database", "nvd_api"],
    systemPrompt: `You are Sentinel, the cybersecurity intelligence agent within the Nuro Mesh. You specialize in threat analysis, CVE assessment, incident response, and security posture evaluation. You also serve as the maker-checker validator for other agents' high-stakes recommendations. When validating another agent's output, analyze it critically for accuracy, security implications, and potential risks. Use MITRE ATT&CK framework, CVSS scoring, and industry-standard security frameworks. Be direct and technical.`,
  },
  {
    id: "inca",
    name: "INCA",
    domain: "research",
    preferredModel: "gemini-3.1-pro-preview",
    preferredProvider: "gemini",
    highStakesDomains: [],
    tools: ["huggingface_search", "arxiv_search", "model_registry"],
    systemPrompt: `You are INCA, the AI research intelligence agent within the Nuro Mesh. You specialize in AI/ML research, model evaluation, academic literature analysis, and technology trend assessment. You can search HuggingFace for relevant models, analyze research papers, and provide cutting-edge AI insights. Use precise technical language, cite your reasoning, and focus on actionable research intelligence.`,
  },
  {
    id: "muse",
    name: "Muse",
    domain: "creative",
    preferredModel: "gemini-3-flash-preview",
    preferredProvider: "gemini",
    highStakesDomains: [],
    tools: ["content_strategy"],
    systemPrompt: `You are Muse, the creative intelligence agent within the Nuro Mesh. You specialize in content strategy, campaign ideation, creative briefs, and brand voice. You help develop compelling narratives, content calendars, and marketing strategies. Be creative, strategic, and balance innovation with business objectives.`,
  },
  {
    id: "beacon",
    name: "Terra Analytics",
    domain: "analytics",
    preferredModel: "gpt-5.2",
    preferredProvider: "openai",
    highStakesDomains: ["financial_alert", "ops_critical"],
    tools: ["system_health", "platform_stats", "ecosystem_health"],
    systemPrompt: `You are Terra Analytics, the analytics and operations intelligence agent within the Nuro Mesh. You specialize in signal analysis, anomaly detection, platform performance, and operational intelligence. You correlate data across systems to surface actionable insights. Be data-driven, quantitative, and action-oriented.`,
  },
  {
    id: "zeus",
    name: "Zeus",
    domain: "infrastructure",
    preferredModel: "gpt-5.2",
    preferredProvider: "openai",
    highStakesDomains: ["infrastructure_failure", "security_breach"],
    tools: ["system_health", "admin_overview"],
    systemPrompt: `You are Zeus, the infrastructure intelligence agent within the Nuro Mesh. You specialize in cloud infrastructure, DevOps, system reliability, and platform architecture. You monitor Azure resources, diagnose infrastructure issues, and recommend optimization strategies. Be technical, precise, and reliability-focused.`,
  },
  {
    id: "compass",
    name: "Compass",
    domain: "readiness",
    preferredModel: "claude-sonnet-4-6",
    preferredProvider: "anthropic",
    highStakesDomains: [],
    tools: ["readiness_data", "benchmarks"],
    systemPrompt: `You are Compass, the readiness assessment agent within the Nuro Mesh. You specialize in organizational maturity evaluation, gap analysis, capability scoring, and improvement roadmaps. Be analytical, structured, and provide clear scoring with actionable recommendations.`,
  },
];

const DOMAIN_ROUTING_RULES: Record<string, string[]> = {
  maritime: ["vessel", "ship", "fleet", "port", "cargo", "ais", "maritime", "nautical", "route", "strait", "tanker", "helmsman", "shipping"],
  security: ["threat", "vulnerability", "cve", "attack", "breach", "malware", "firewall", "incident", "exploit", "sentinel", "ransomware", "phishing"],
  research: ["ai", "model", "paper", "research", "huggingface", "arxiv", "machine learning", "algorithm", "dataset", "benchmark", "inca"],
  creative: ["content", "campaign", "creative", "marketing", "brand", "copy", "design", "engagement", "audience", "muse"],
  analytics: ["anomaly", "metric", "performance", "signal", "trend", "dashboard", "kpi", "beacon", "analytics"],
  infrastructure: ["infrastructure", "azure", "kubernetes", "docker", "deployment", "server", "database", "cloud", "zeus", "devops"],
  readiness: ["readiness", "maturity", "assessment", "gap", "score", "compass", "milestone", "capability"],
};

function routeToAgents(query: string): AgentDefinition[] {
  const lower = query.toLowerCase();
  const matched = new Set<string>();

  for (const [domain, keywords] of Object.entries(DOMAIN_ROUTING_RULES)) {
    if (keywords.some(kw => lower.includes(kw))) {
      matched.add(domain);
    }
  }

  if (matched.size === 0) return [AGENT_REGISTRY[0]!];

  return AGENT_REGISTRY.filter(a => matched.has(a.domain) && a.id !== "alloy");
}

async function checkGovernance(
  agent: AgentDefinition,
  orgId: number | null,
  callerUserId: number | null,
  callerRoles: string[],
  action: string,
): Promise<{ allowed: boolean; reason?: string }> {
  if (!orgId) return { allowed: true };
  try {
    const ALLOY_TOKEN = process.env.ALLOY_INTERNAL_TOKEN;
    const BASE_URL = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}/api-server`
      : "http://localhost:8080";
    const resp = await fetch(`${BASE_URL}/alloy/governance/enforce`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ALLOY_TOKEN ? { "x-internal-token": ALLOY_TOKEN } : {}),
      },
      body: JSON.stringify({ orgId, action, model: agent.preferredModel, agentId: agent.id, callerUserId, callerRoles }),
    });
    if (!resp.ok) return { allowed: false, reason: `Governance check failed (HTTP ${resp.status})` };
    const data = await resp.json() as { allowed: boolean; requiresApproval?: boolean; violations?: Array<{ reason: string }> };
    return {
      allowed: data.allowed && !data.requiresApproval,
      reason: data.requiresApproval
        ? "Requires approval before execution"
        : data.violations?.[0]?.reason,
    };
  } catch {
    return { allowed: false, reason: "Governance enforcement unreachable — blocked for safety" };
  }
}

async function callAgent(
  agent: AgentDefinition,
  query: string,
  context: string,
  opts?: { orgId?: number | null; callerUserId?: number | null; callerRoles?: string[]; action?: string },
): Promise<{ agentId: string; agentName: string; response: string; confidence: number; domain: string }> {
  const startTime = Date.now();

  // Governance enforcement: evaluate per-tenant policies for this agent call
  if (opts?.orgId) {
    const enforcement = await checkGovernance(
      agent,
      opts.orgId,
      opts.callerUserId ?? null,
      opts.callerRoles ?? [],
      opts.action ?? "agent_run",
    );
    if (!enforcement.allowed) {
      return {
        agentId: agent.id,
        agentName: agent.name,
        response: `[Blocked by governance policy: ${enforcement.reason ?? "Policy enforcement active"}]`,
        confidence: 0,
        domain: agent.domain,
      };
    }
  }

  let response = "";
  let tokensUsed = 0;
  let success = false;

  const fullPrompt = `${agent.systemPrompt}\n\n## Shared Context from Nuro Mesh\n${context}\n\n## Query\n${query}\n\nProvide a focused, expert response from your domain perspective. End with a confidence score (0-100) on a new line in format: CONFIDENCE: [score]`;

  try {
    if (agent.preferredProvider === "anthropic") {
      const result = await anthropic.messages.create({
        model: agent.preferredModel,
        max_tokens: 2048,
        messages: [{ role: "user", content: fullPrompt }],
      });
      response = result.content[0]?.type === "text" ? result.content[0].text : "";
      tokensUsed = (result.usage.input_tokens + result.usage.output_tokens);
      success = true;
    } else if (agent.preferredProvider === "openai") {
      const result = await openai.chat.completions.create({
        model: agent.preferredModel,
        max_completion_tokens: 2048,
        messages: [
          { role: "system", content: agent.systemPrompt },
          { role: "user", content: `## Shared Context\n${context}\n\n## Query\n${query}\n\nProvide a focused, expert response from your domain perspective. End with: CONFIDENCE: [0-100]` },
        ],
      });
      response = result.choices[0]?.message?.content ?? "";
      tokensUsed = result.usage?.total_tokens ?? 0;
      success = true;
    } else if (agent.preferredProvider === "gemini") {
      try {
        const result = await geminiAi.models.generateContent({
          model: agent.preferredModel,
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          config: { maxOutputTokens: 2048 },
        });
        response = result.text ?? "";
        success = true;
      } catch {
        const fallback = await openai.chat.completions.create({
          model: "gpt-5.2",
          max_completion_tokens: 2048,
          messages: [{ role: "system", content: agent.systemPrompt }, { role: "user", content: fullPrompt }],
        });
        response = fallback.choices[0]?.message?.content ?? "";
        tokensUsed = fallback.usage?.total_tokens ?? 0;
        success = true;
      }
    }
  } catch {
    response = `[${agent.name} unavailable — domain expertise offline]`;
    success = false;
  }

  const latencyMs = Date.now() - startTime;

  const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/i);
  const confidence = confidenceMatch ? Math.min(100, parseInt(confidenceMatch[1]!)) : 75;
  const cleanResponse = response.replace(/CONFIDENCE:\s*\d+/gi, "").trim();

  try {
    await db.insert(agentUsageStats).values({
      agentId: agent.id,
      agentName: agent.name,
      domain: agent.domain,
      tokensUsed,
      latencyMs,
      success,
      model: agent.preferredModel,
      provider: agent.preferredProvider,
    }).onConflictDoNothing();
  } catch {}

  return {
    agentId: agent.id,
    agentName: agent.name,
    response: cleanResponse,
    confidence,
    domain: agent.domain,
  };
}

async function runMakerChecker(
  primaryOutput: string,
  context: string,
  validatorAgent: AgentDefinition = AGENT_REGISTRY.find(a => a.id === "sentinel")!,
): Promise<{ validated: boolean; validatorNotes: string; adjustedOutput: string }> {
  const validationPrompt = `You are performing a maker-checker validation. Review the following AI-generated recommendation for accuracy, risks, and potential issues.

## Primary Agent Output
${primaryOutput}

## Context
${context}

Validate this output. Check for:
1. Factual accuracy and logical consistency
2. Potential security or operational risks
3. Missing critical considerations
4. Recommended adjustments

Respond with:
VALIDATION: [APPROVED|APPROVED_WITH_NOTES|REJECTED]
NOTES: [Your validation notes]
ADJUSTED_OUTPUT: [If approved or approved_with_notes, provide the final output (can be same as original if no changes needed)]`;

  try {
    const result = await anthropic.messages.create({
      model: validatorAgent.preferredModel,
      max_tokens: 2048,
      messages: [{ role: "user", content: validationPrompt }],
    });
    const validatorResponse = result.content[0]?.type === "text" ? result.content[0].text : "";

    const validationMatch = validatorResponse.match(/VALIDATION:\s*(APPROVED|APPROVED_WITH_NOTES|REJECTED)/i);
    const notesMatch = validatorResponse.match(/NOTES:\s*(.+?)(?=ADJUSTED_OUTPUT:|$)/is);
    const outputMatch = validatorResponse.match(/ADJUSTED_OUTPUT:\s*(.+)/is);

    const status = validationMatch?.[1]?.toUpperCase() ?? "APPROVED";
    const notes = notesMatch?.[1]?.trim() ?? "";
    const adjustedOutput = outputMatch?.[1]?.trim() ?? primaryOutput;

    return {
      validated: status !== "REJECTED",
      validatorNotes: notes,
      adjustedOutput: status !== "REJECTED" ? adjustedOutput : `[Output rejected by Sentinel validation]\n\nOriginal output required revision: ${notes}`,
    };
  } catch {
    return { validated: true, validatorNotes: "Validation unavailable", adjustedOutput: primaryOutput };
  }
}

async function getSharedContext(): Promise<string> {
  try {
    const facts = await db
      .select()
      .from(agentMemoryFacts)
      .where(gt(agentMemoryFacts.expiresAt, new Date()))
      .orderBy(desc(agentMemoryFacts.importance))
      .limit(10);

    if (facts.length === 0) return "No shared context available yet.";

    return facts.map(f =>
      `[${f.agentId.toUpperCase()}] ${f.factType.toUpperCase()}: ${f.content} (importance: ${f.importance}/10)`
    ).join("\n");
  } catch {
    return "Context retrieval unavailable.";
  }
}

nueroMeshRouter.post("/nuro-mesh/orchestrate", meshRateLimit, async (req: Request, res: Response) => {
  const { query, preferredAgents, requireValidation, orgId, callerUserId, callerRoles } = req.body as {
    query: string;
    preferredAgents?: string[];
    requireValidation?: boolean;
    orgId?: number | null;
    callerUserId?: number | null;
    callerRoles?: string[];
  };

  if (!query?.trim()) {
    res.status(400).json({ error: "Query is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const context = await getSharedContext();
    res.write(`data: ${JSON.stringify({ type: "status", message: "Analyzing query and routing to domain agents..." })}\n\n`);

    let targetAgents: AgentDefinition[];
    if (preferredAgents && preferredAgents.length > 0) {
      targetAgents = AGENT_REGISTRY.filter(a => preferredAgents.includes(a.id) && a.id !== "alloy");
    } else {
      targetAgents = routeToAgents(query);
    }

    if (targetAgents.length === 0) targetAgents = [AGENT_REGISTRY.find(a => a.id === "beacon")!];

    res.write(`data: ${JSON.stringify({ type: "routing", agents: targetAgents.map(a => ({ id: a.id, name: a.name, domain: a.domain })) })}\n\n`);

    const agentResponses = await Promise.all(
      targetAgents.map(agent => {
        res.write(`data: ${JSON.stringify({ type: "agent_start", agentId: agent.id, agentName: agent.name })}\n\n`);
        return callAgent(agent, query, context, { orgId, callerUserId, callerRoles, action: "orchestrate" });
      })
    );

    for (const response of agentResponses) {
      res.write(`data: ${JSON.stringify({ type: "agent_response", ...response })}\n\n`);
    }

    const isHighStakes = requireValidation || agentResponses.some(r => {
      const agent = AGENT_REGISTRY.find(a => a.id === r.agentId);
      return agent?.highStakesDomains.some(d => query.toLowerCase().includes(d.replace("_", " ")));
    });

    let validationResult: { validated: boolean; validatorNotes: string; adjustedOutput: string } | null = null;

    if (isHighStakes && agentResponses.length > 0) {
      res.write(`data: ${JSON.stringify({ type: "validation_start", message: "High-stakes output detected — running Sentinel maker-checker validation..." })}\n\n`);
      const primaryOutput = agentResponses.map(r => `## ${r.agentName} (${r.domain})\n${r.response}`).join("\n\n");
      validationResult = await runMakerChecker(primaryOutput, context);
      res.write(`data: ${JSON.stringify({ type: "validation_result", validated: validationResult.validated, notes: validationResult.validatorNotes })}\n\n`);
    }

    const aggregationInput = agentResponses.map(r =>
      `## ${r.agentName} Analysis (Confidence: ${r.confidence}%)\n${r.response}`
    ).join("\n\n---\n\n");

    const alloyAgent = AGENT_REGISTRY.find(a => a.id === "alloy")!;
    const aggregationPrompt = `${alloyAgent.systemPrompt}

## Query from User
${query}

## Domain Agent Responses
${aggregationInput}

${validationResult ? `## Sentinel Validation\nValidated: ${validationResult.validated}\nNotes: ${validationResult.validatorNotes}\n` : ""}

Synthesize these domain expert responses into a unified, actionable answer. Prioritize higher-confidence responses. Identify consensus and any conflicting perspectives. Be direct and operational.`;

    res.write(`data: ${JSON.stringify({ type: "synthesis_start", message: "Alloy synthesizing domain intelligence..." })}\n\n`);

    let synthesisContent = "";
    let synthStream;
    try {
      synthStream = await openai.chat.completions.create({
        model: alloyAgent.preferredModel,
        max_completion_tokens: 4096,
        messages: [{ role: "user", content: aggregationPrompt }],
        stream: true,
      });
    } catch (streamInitErr) {
      const initErrMsg = streamInitErr instanceof Error ? streamInitErr.message : "Failed to initialize synthesis stream";
      res.write(`data: ${JSON.stringify({ type: "error", error: `Synthesis unavailable: ${initErrMsg}. Domain agent responses were collected successfully.`, partial: true, agentResponses: agentResponses.map(r => ({ agentId: r.agentId, agentName: r.agentName, domain: r.domain, confidence: r.confidence })) })}\n\n`);
      res.end();
      return;
    }

    let streamError: string | null = null;
    try {
      for await (const chunk of synthStream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          synthesisContent += delta;
          res.write(`data: ${JSON.stringify({ type: "synthesis_chunk", content: delta })}\n\n`);
        }
      }
    } catch (streamChunkErr) {
      streamError = streamChunkErr instanceof Error ? streamChunkErr.message : "Stream interrupted";
      if (synthesisContent.length > 0) {
        res.write(`data: ${JSON.stringify({ type: "synthesis_interrupted", message: "Synthesis stream was interrupted. Partial response delivered.", error: streamError })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ type: "error", error: `Synthesis stream failed: ${streamError}. Domain agent responses were collected. Please retry.`, retryable: true })}\n\n`);
        res.end();
        return;
      }
    }

    try {
      if (synthesisContent.length > 100) {
        await db.insert(agentMemoryFacts).values({
          agentId: "alloy",
          domain: "orchestration",
          factType: "insight",
          content: `Query: "${query.slice(0, 100)}" — ${synthesisContent.slice(0, 300)}`,
          importance: Math.round(agentResponses.reduce((sum, r) => sum + r.confidence, 0) / agentResponses.length / 10),
          tags: targetAgents.map(a => a.domain),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }).onConflictDoNothing();
      }
    } catch {}

    res.write(`data: ${JSON.stringify({
      type: "done",
      agentCount: agentResponses.length,
      averageConfidence: Math.round(agentResponses.reduce((sum, r) => sum + r.confidence, 0) / agentResponses.length),
      isHighStakes,
      validated: validationResult?.validated ?? null,
    })}\n\n`);

    res.end();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Orchestration failed";
    res.write(`data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`);
    res.end();
  }
});

nueroMeshRouter.get("/nuro-mesh/agents", async (_req: Request, res: Response) => {
  try {
    const stats = await db
      .select()
      .from(agentUsageStats)
      .orderBy(desc(agentUsageStats.recordedAt))
      .limit(100);

    const agentStatsMap = new Map<string, {
      calls: number; totalTokens: number; totalLatency: number; successes: number;
    }>();

    for (const stat of stats) {
      const existing = agentStatsMap.get(stat.agentId) ?? { calls: 0, totalTokens: 0, totalLatency: 0, successes: 0 };
      agentStatsMap.set(stat.agentId, {
        calls: existing.calls + 1,
        totalTokens: existing.totalTokens + stat.tokensUsed,
        totalLatency: existing.totalLatency + stat.latencyMs,
        successes: existing.successes + (stat.success ? 1 : 0),
      });
    }

    const agents = AGENT_REGISTRY.map(agent => {
      const agentStats = agentStatsMap.get(agent.id) ?? { calls: 0, totalTokens: 0, totalLatency: 0, successes: 0 };
      return {
        ...agent,
        stats: {
          totalCalls: agentStats.calls,
          totalTokens: agentStats.totalTokens,
          avgLatencyMs: agentStats.calls > 0 ? Math.round(agentStats.totalLatency / agentStats.calls) : 0,
          successRate: agentStats.calls > 0 ? Math.round((agentStats.successes / agentStats.calls) * 100) : 100,
          estimatedCostUsd: parseFloat(((agentStats.totalTokens / 1000) * 0.002).toFixed(4)),
        },
      };
    });

    res.json({ agents, totalAgents: agents.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch agents" });
  }
});

nueroMeshRouter.get("/nuro-mesh/memory", async (req: Request, res: Response) => {
  try {
    const { agentId, domain, limit = "20" } = req.query as Record<string, string>;

    const conditions = [gt(agentMemoryFacts.expiresAt, new Date())];
    if (agentId) conditions.push(eq(agentMemoryFacts.agentId, agentId));
    if (domain) conditions.push(eq(agentMemoryFacts.domain, domain));

    const facts = await db
      .select()
      .from(agentMemoryFacts)
      .where(and(...conditions))
      .orderBy(desc(agentMemoryFacts.importance), desc(agentMemoryFacts.createdAt))
      .limit(Math.min(parseInt(limit), 100));

    res.json({ facts, total: facts.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch memory facts" });
  }
});

nueroMeshRouter.post("/nuro-mesh/memory", meshRateLimit, async (req: Request, res: Response) => {
  try {
    const { agentId, domain, factType, content, importance, tags, ttlHours } = req.body as {
      agentId: string;
      domain: string;
      factType: string;
      content: string;
      importance?: number;
      tags?: string[];
      ttlHours?: number;
    };

    if (!agentId || !content || !factType) {
      res.status(400).json({ error: "agentId, factType, and content are required" });
      return;
    }

    const expiresAt = new Date(Date.now() + ((ttlHours ?? 24) * 60 * 60 * 1000));

    const [fact] = await db.insert(agentMemoryFacts).values({
      agentId,
      domain: domain ?? "general",
      factType,
      content,
      importance: Math.min(10, Math.max(1, importance ?? 5)),
      tags: tags ?? [],
      expiresAt,
    }).returning();

    res.status(201).json(fact);
  } catch (err) {
    res.status(500).json({ error: "Failed to store memory fact" });
  }
});

nueroMeshRouter.get("/nuro-mesh/tool-calls", async (req: Request, res: Response) => {
  try {
    const { agentId, limit = "50" } = req.query as Record<string, string>;
    const conditions = agentId ? [eq(agentToolCalls.agentId, agentId)] : [];

    const calls = await db
      .select()
      .from(agentToolCalls)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(agentToolCalls.calledAt))
      .limit(Math.min(parseInt(limit), 200));

    res.json({ toolCalls: calls, total: calls.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tool calls" });
  }
});

nueroMeshRouter.get("/nuro-mesh/advisory", async (_req: Request, res: Response) => {
  try {
    const findings = await db
      .select()
      .from(advisoryFindings)
      .orderBy(desc(advisoryFindings.generatedAt))
      .limit(20);

    res.json({ findings, total: findings.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch advisory findings" });
  }
});

nueroMeshRouter.post("/nuro-mesh/advisory/run", meshRateLimit, async (req: Request, res: Response) => {
  const { analysisType } = req.body as { analysisType?: string };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const type = analysisType ?? "security_posture";
    res.write(`data: ${JSON.stringify({ type: "status", message: `Running ${type} advisory analysis...` })}\n\n`);

    const analysisPrompts: Record<string, { agent: string; prompt: string; title: string }> = {
      security_posture: {
        agent: "sentinel",
        title: "Daily Security Posture Check",
        prompt: "Perform a comprehensive security posture assessment. Evaluate: current threat landscape, vulnerability exposure, incident response readiness, compliance status. Provide a security score (0-100) and top 3 actionable recommendations.",
      },
      readiness_summary: {
        agent: "compass",
        title: "Weekly Readiness Summary",
        prompt: "Generate a readiness maturity summary. Assess: organizational capability maturity, deployment readiness, operational gaps, improvement trajectory. Provide overall readiness score and priority actions.",
      },
      maritime_brief: {
        agent: "helmsman",
        title: "Maritime Intelligence Brief",
        prompt: "Generate a maritime operational brief. Assess: fleet operational status, active route risks, weather impacts, sanctions exposure, geopolitical threats to shipping lanes.",
      },
      platform_health: {
        agent: "zeus",
        title: "Infrastructure Health Report",
        prompt: "Generate an infrastructure health report. Assess: service availability, performance metrics, resource utilization, scaling needs, reliability risks. Provide health score and critical actions.",
      },
    };

    const analysis = analysisPrompts[type] ?? analysisPrompts["security_posture"]!;
    const agent = AGENT_REGISTRY.find(a => a.id === analysis.agent) ?? AGENT_REGISTRY.find(a => a.id === "beacon")!;

    res.write(`data: ${JSON.stringify({ type: "agent_start", agentId: agent.id, agentName: agent.name })}\n\n`);

    const context = await getSharedContext();
    // Advisory runs are platform-level (no per-tenant governance context)
    const result = await callAgent(agent, analysis.prompt, context, { action: "advisory_run" });

    const scoreMatch = result.response.match(/score[:\s]+(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]!) : result.confidence;

    const [finding] = await db.insert(advisoryFindings).values({
      agentId: agent.id,
      agentName: agent.name,
      analysisType: type,
      title: analysis.title,
      content: result.response,
      severity: score >= 80 ? "info" : score >= 60 ? "warning" : "critical",
      score,
      tags: [agent.domain, type],
    }).returning();

    res.write(`data: ${JSON.stringify({ type: "finding", finding })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "done", findingId: finding?.id })}\n\n`);
    res.end();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Advisory run failed";
    res.write(`data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`);
    res.end();
  }
});

nueroMeshRouter.get("/nuro-mesh/usage-stats", async (_req: Request, res: Response) => {
  try {
    const stats = await db
      .select()
      .from(agentUsageStats)
      .orderBy(desc(agentUsageStats.recordedAt))
      .limit(500);

    const byAgent = new Map<string, { calls: number; tokens: number; latency: number; successes: number; provider: string; model: string }>();
    const byProvider = new Map<string, { calls: number; tokens: number }>();

    for (const stat of stats) {
      const existing = byAgent.get(stat.agentId) ?? { calls: 0, tokens: 0, latency: 0, successes: 0, provider: stat.provider, model: stat.model };
      byAgent.set(stat.agentId, {
        calls: existing.calls + 1,
        tokens: existing.tokens + stat.tokensUsed,
        latency: existing.latency + stat.latencyMs,
        successes: existing.successes + (stat.success ? 1 : 0),
        provider: stat.provider,
        model: stat.model,
      });

      const pExisting = byProvider.get(stat.provider) ?? { calls: 0, tokens: 0 };
      byProvider.set(stat.provider, {
        calls: pExisting.calls + 1,
        tokens: pExisting.tokens + stat.tokensUsed,
      });
    }

    const agentMetrics = Array.from(byAgent.entries()).map(([agentId, data]) => ({
      agentId,
      agentName: AGENT_REGISTRY.find(a => a.id === agentId)?.name ?? agentId,
      ...data,
      avgLatencyMs: data.calls > 0 ? Math.round(data.latency / data.calls) : 0,
      successRate: data.calls > 0 ? Math.round((data.successes / data.calls) * 100) : 100,
      estimatedCostUsd: parseFloat(((data.tokens / 1000) * 0.002).toFixed(4)),
    }));

    const providerMetrics = Array.from(byProvider.entries()).map(([provider, data]) => ({
      provider,
      ...data,
      estimatedCostUsd: parseFloat(((data.tokens / 1000) * 0.002).toFixed(4)),
    }));

    const totalCalls = stats.length;
    const totalTokens = stats.reduce((sum, s) => sum + s.tokensUsed, 0);
    const totalCost = parseFloat(((totalTokens / 1000) * 0.002).toFixed(4));

    res.json({
      summary: { totalCalls, totalTokens, totalCost, agentCount: byAgent.size },
      agentMetrics,
      providerMetrics,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch usage stats" });
  }
});

export default nueroMeshRouter;