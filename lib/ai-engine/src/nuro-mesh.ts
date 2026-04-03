import { db } from "@szl-holdings/db";
import { agentMemoryFacts, agentUsageStats } from "@szl-holdings/db";
import { eq, desc, and, gt } from "drizzle-orm";
import { openai } from "@szl-holdings/integrations-openai-ai-server";
import { anthropic } from "@szl-holdings/integrations-anthropic-ai";
import { ai as geminiAi } from "@szl-holdings/integrations-gemini-ai";
import type { AgentDefinition, DomainRoutingRule, ValidationResult, AgentCallResult } from "./types.js";

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

export const DOMAIN_ROUTING_RULES: Record<string, string[]> = {
  maritime: ["vessel", "ship", "fleet", "port", "cargo", "ais", "maritime", "nautical", "route", "strait", "tanker", "helmsman", "shipping"],
  security: ["threat", "vulnerability", "cve", "attack", "breach", "malware", "firewall", "incident", "exploit", "sentinel", "ransomware", "phishing"],
  research: ["ai", "model", "paper", "research", "huggingface", "arxiv", "machine learning", "algorithm", "dataset", "benchmark", "inca"],
  creative: ["content", "campaign", "creative", "marketing", "brand", "copy", "design", "engagement", "audience", "muse"],
  analytics: ["anomaly", "metric", "performance", "signal", "trend", "dashboard", "kpi", "beacon", "analytics"],
  infrastructure: ["infrastructure", "azure", "kubernetes", "docker", "deployment", "server", "database", "cloud", "zeus", "devops"],
  readiness: ["readiness", "maturity", "assessment", "gap", "score", "compass", "milestone", "capability"],
};

export function routeToAgents(query: string): AgentDefinition[] {
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

async function checkGovernanceEnforce(
  agent: AgentDefinition,
  model: string,
  action: string,
  orgId: number | null,
  callerUserId: number | null = null,
  callerRoles: string[] = [],
): Promise<{ allowed: boolean; hardBlocked?: boolean; requiresApproval?: boolean; approvalLevel?: string; reason?: string }> {
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
        // Must match the header name in auth middleware (x-internal-token)
        ...(ALLOY_TOKEN ? { "x-internal-token": ALLOY_TOKEN } : {}),
      },
      // Pass caller's identity so /enforce evaluates agent_permission against
      // the actual end-user's roles, not the super_admin service principal
      body: JSON.stringify({ orgId, action, model, agentId: agent.id, callerUserId, callerRoles }),
    });
    if (!resp.ok) {
      // Governance auth failure or endpoint error — fail closed for protected orgs
      return { allowed: false, reason: `Governance enforcement unavailable (HTTP ${resp.status}) — agent run blocked for safety` };
    }
    const data = await resp.json() as { allowed: boolean; hardBlocked?: boolean; requiresApproval?: boolean; approvalLevel?: string; violations?: Array<{ reason: string }> };
    return {
      allowed: data.allowed && !data.requiresApproval,
      hardBlocked: data.hardBlocked,
      requiresApproval: data.requiresApproval,
      approvalLevel: data.approvalLevel,
      reason: data.requiresApproval
        ? `Requires ${data.approvalLevel ?? "manager"}-level approval before execution`
        : data.violations?.[0]?.reason,
    };
  } catch {
    // Network error — fail closed for protected orgs to prevent governance bypass
    return { allowed: false, reason: "Governance enforcement unreachable — agent run blocked for safety" };
  }
}

export async function callAgent(
  agent: AgentDefinition,
  query: string,
  context: string,
  options?: { orgId?: number | null; action?: string; callerUserId?: number | null; callerRoles?: string[] },
): Promise<AgentCallResult> {
  const startTime = Date.now();
  let response = "";
  let tokensUsed = 0;
  let success = false;

  // Governance enforcement — check model routing + cost controls before calling
  const enforcement = await checkGovernanceEnforce(
    agent,
    agent.preferredModel,
    options?.action ?? "agent_run",
    options?.orgId ?? null,
    options?.callerUserId ?? null,
    options?.callerRoles ?? [],
  );
  if (!enforcement.allowed) {
    return {
      agentId: agent.id,
      agentName: agent.name,
      response: `[Blocked by governance policy: ${enforcement.reason ?? "Policy enforcement active"}]`,
      confidence: 0,
      tokensUsed: 0,
      latencyMs: Date.now() - startTime,
      domain: agent.domain,
    };
  }

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

export async function runMakerChecker(
  primaryOutput: string,
  context: string,
  validatorAgent: AgentDefinition = AGENT_REGISTRY.find(a => a.id === "sentinel")!,
): Promise<ValidationResult> {
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

    const status = (validationMatch?.[1]?.toUpperCase() ?? "APPROVED") as ValidationResult["status"];
    const notes = notesMatch?.[1]?.trim() ?? "";
    const adjustedOutput = outputMatch?.[1]?.trim() ?? primaryOutput;

    return {
      validated: status !== "REJECTED",
      validatorNotes: notes,
      adjustedOutput: status !== "REJECTED" ? adjustedOutput : `[Output rejected by Sentinel validation]\n\nOriginal output required revision: ${notes}`,
      status,
    };
  } catch {
    return { validated: true, validatorNotes: "Validation unavailable", adjustedOutput: primaryOutput, status: "APPROVED" };
  }
}

export async function getSharedContext(): Promise<string> {
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

export class NuroMeshOrchestrator {
  async orchestrate(
    query: string,
    options: {
      preferredAgents?: string[];
      requireValidation?: boolean;
      orgId?: number | null;
      action?: string;
      callerUserId?: number | null;
      callerRoles?: string[];
    } = {},
  ): Promise<{
    agentResponses: AgentCallResult[];
    synthesis: string;
    validation: ValidationResult | null;
    averageConfidence: number;
    isHighStakes: boolean;
  }> {
    const context = await getSharedContext();

    let targetAgents: AgentDefinition[];
    if (options.preferredAgents && options.preferredAgents.length > 0) {
      targetAgents = AGENT_REGISTRY.filter(a => options.preferredAgents!.includes(a.id) && a.id !== "alloy");
    } else {
      targetAgents = routeToAgents(query);
    }

    if (targetAgents.length === 0) targetAgents = [AGENT_REGISTRY.find(a => a.id === "beacon")!];

    // Propagate org context AND caller identity so every agent run passes through
    // governance enforcement against the actual end-user, not the service principal
    const agentResponses = await Promise.all(
      targetAgents.map(agent => callAgent(agent, query, context, {
        orgId: options.orgId ?? null,
        action: options.action ?? "orchestrate",
        callerUserId: options.callerUserId ?? null,
        callerRoles: options.callerRoles ?? [],
      }))
    );

    const isHighStakes = options.requireValidation || agentResponses.some(r => {
      const agent = AGENT_REGISTRY.find(a => a.id === r.agentId);
      return agent?.highStakesDomains.some(d => query.toLowerCase().includes(d.replace("_", " ")));
    });

    let validation: ValidationResult | null = null;
    if (isHighStakes && agentResponses.length > 0) {
      const primaryOutput = agentResponses.map(r => `## ${r.agentName} (${r.domain})\n${r.response}`).join("\n\n");
      validation = await runMakerChecker(primaryOutput, context);
    }

    const alloyAgent = AGENT_REGISTRY.find(a => a.id === "alloy")!;
    const aggregationInput = agentResponses.map(r =>
      `## ${r.agentName} Analysis (Confidence: ${r.confidence}%)\n${r.response}`
    ).join("\n\n---\n\n");

    const aggregationPrompt = `${alloyAgent.systemPrompt}

## Query from User
${query}

## Domain Agent Responses
${aggregationInput}

${validation ? `## Sentinel Validation\nValidated: ${validation.validated}\nNotes: ${validation.validatorNotes}\n` : ""}

Synthesize these domain expert responses into a unified, actionable answer. Prioritize higher-confidence responses. Identify consensus and any conflicting perspectives. Be direct and operational.`;

    let synthesis = "";
    try {
      const synthResult = await openai.chat.completions.create({
        model: alloyAgent.preferredModel,
        max_completion_tokens: 4096,
        messages: [{ role: "user", content: aggregationPrompt }],
      });
      synthesis = synthResult.choices[0]?.message?.content ?? "";
    } catch {
      synthesis = agentResponses.map(r => `${r.agentName}: ${r.response}`).join("\n\n");
    }

    try {
      if (synthesis.length > 100) {
        await db.insert(agentMemoryFacts).values({
          agentId: "alloy",
          domain: "orchestration",
          factType: "insight",
          content: `Query: "${query.slice(0, 100)}" — ${synthesis.slice(0, 300)}`,
          importance: Math.round(agentResponses.reduce((sum, r) => sum + r.confidence, 0) / agentResponses.length / 10),
          tags: targetAgents.map(a => a.domain),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }).onConflictDoNothing();
      }
    } catch {}

    const averageConfidence = Math.round(
      agentResponses.reduce((sum, r) => sum + r.confidence, 0) / agentResponses.length
    );

    return { agentResponses, synthesis, validation, averageConfidence, isHighStakes };
  }
}

export const nuroMeshOrchestrator = new NuroMeshOrchestrator();
