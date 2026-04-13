import type { McpServerModule } from "./index";
import type { AuthenticatedUser } from "../../../middlewares/auth";

function buildInternalUrl(path: string): string {
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  const port = process.env["PORT"] || 3000;
  const base = devDomain ? `https://${devDomain}` : `http://localhost:${port}`;
  return `${base}${path}`;
}

async function internalGet(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const token = process.env["ALLOY_INTERNAL_TOKEN"];
    const resp = await fetch(buildInternalUrl(path), {
      signal: controller.signal,
      headers: { Accept: "application/json", ...(token ? { "x-internal-token": token } : {}) },
    });
    if (!resp.ok) return { error: `API ${resp.status}`, path };
    return await resp.json();
  } catch (err: any) {
    return { error: `Fetch failed: ${err.message}`, path };
  } finally {
    clearTimeout(timer);
  }
}

async function internalPost(path: string, body: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const token = process.env["ALLOY_INTERNAL_TOKEN"];
    const resp = await fetch(buildInternalUrl(path), {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { "x-internal-token": token } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { error: `API ${resp.status}`, details: text.slice(0, 300) };
    }
    return await resp.json();
  } catch (err: any) {
    return { error: `Fetch failed: ${err.message}` };
  } finally {
    clearTimeout(timer);
  }
}

export const alloyMcpModule: McpServerModule = {
  moduleId: "alloy",
  name: "Alloy Orchestration & Intelligence",
  description: "Cross-domain agent orchestration, workflow execution, NLA routing, and platform intelligence tools",
  version: "2.0.0",
  domain: "orchestration",

  tools: [
    {
      name: "alloy_launch_workflow",
      description: "Launch a durable workflow across the SZL Holdings platform with multi-agent coordination",
      inputSchema: {
        type: "object",
        properties: {
          workflowType: { type: "string", description: "Workflow type identifier" },
          input: { type: "object", description: "Workflow input parameters" },
          priority: { type: "string", enum: ["low", "normal", "high", "critical"], description: "Execution priority" },
        },
        required: ["workflowType"],
      },
      domain: "orchestration",
    },
    {
      name: "alloy_research",
      description: "Run an AI research task across all available domain agents and knowledge sources",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Research query or topic" },
          domains: { type: "array", items: { type: "string" }, description: "Domains to include in research" },
          depth: { type: "string", enum: ["quick", "standard", "deep"], description: "Research depth" },
        },
        required: ["query"],
      },
      domain: "orchestration",
    },
    {
      name: "alloy_approve_decision",
      description: "Approve or reject a pending AI-generated decision or action in the approval queue",
      inputSchema: {
        type: "object",
        properties: {
          decisionId: { type: "string", description: "Decision ID to approve or reject" },
          action: { type: "string", enum: ["approve", "reject", "defer"], description: "Approval action" },
          notes: { type: "string", description: "Optional reviewer notes" },
        },
        required: ["decisionId", "action"],
      },
      domain: "orchestration",
      requiredRoles: ["admin", "super_admin"],
    },
    {
      name: "alloy_skill_invoke",
      description: "Invoke a specific AI skill from the skills registry on behalf of any agent",
      inputSchema: {
        type: "object",
        properties: {
          skillId: { type: "string", description: "Skill ID from the skills registry" },
          input: { type: "object", description: "Skill input parameters" },
          agentId: { type: "string", description: "Agent to invoke the skill on behalf of" },
        },
        required: ["skillId", "input"],
      },
      domain: "orchestration",
    },
    {
      name: "alloy_query_ecosystem",
      description: "Query cross-platform metrics, agent status, and platform health across all SZL Holdings apps",
      inputSchema: {
        type: "object",
        properties: {
          metrics: {
            type: "array",
            items: { type: "string" },
            description: "Metrics to query: apps, tables, endpoints, agents, workflows, memory_threads",
          },
        },
      },
      domain: "orchestration",
    },
    {
      name: "alloy_executive_digest",
      description: "Generate a cross-domain executive intelligence briefing for leadership",
      inputSchema: {
        type: "object",
        properties: {
          domains: { type: "array", items: { type: "string" }, description: "Domains to include" },
          period: { type: "string", enum: ["daily", "weekly", "monthly"], description: "Briefing period" },
        },
      },
      domain: "orchestration",
    },
  ],

  resources: [
    {
      uri: "alloy://agents/all",
      name: "All Agent Cards",
      description: "Full A2A agent card registry with capabilities and skills",
      mimeType: "application/json",
    },
    {
      uri: "alloy://skills/catalog",
      name: "Skills Catalog",
      description: "Complete skills registry with metadata, domain tags, and usage metrics",
      mimeType: "application/json",
    },
    {
      uri: "alloy://platform/health",
      name: "Platform Health",
      description: "Cross-platform service health, agent status, and performance metrics",
      mimeType: "application/json",
    },
  ],

  prompts: [
    {
      name: "alloy_executive_brief",
      description: "Generate a structured executive intelligence brief across all domains",
      arguments: [{ name: "focus", description: "Area of focus (optional)", required: false }],
    },
    {
      name: "alloy_cross_domain_analysis",
      description: "Run a cross-domain correlation analysis across selected business verticals",
      arguments: [
        { name: "domains", description: "Comma-separated list of domains", required: true },
        { name: "analysis_type", description: "Analysis type: correlation, risk, opportunity, compliance", required: false },
      ],
    },
  ],

  async healthCheck() {
    return { healthy: true, details: "Alloy orchestration module online" };
  },

  async executeTool(toolName: string, args: Record<string, unknown>, user?: AuthenticatedUser) {
    switch (toolName) {
      case "alloy_launch_workflow":
        return internalPost("/api/alloy/workflows", {
          workflowType: args.workflowType,
          input: args.input ?? {},
          priority: args.priority ?? "normal",
        });
      case "alloy_research":
        return internalPost("/api/alloy/research", {
          query: args.query,
          domains: args.domains ?? ["vessels", "aegis", "terra", "prism"],
          depth: args.depth ?? "standard",
        });
      case "alloy_approve_decision":
        return internalPost("/api/approvals/decision", {
          decisionId: args.decisionId,
          action: args.action,
          notes: args.notes,
          reviewerId: user?.id,
        });
      case "alloy_skill_invoke":
        return internalPost("/api/skills/execute", {
          skillId: args.skillId,
          input: args.input,
          agentId: args.agentId ?? "szl-orchestrator",
        });
      case "alloy_query_ecosystem":
        return internalGet(`/api/mastra/metrics?metrics=${(args.metrics as string[] ?? ["apps", "tables", "agents"]).join(",")}`);
      case "alloy_executive_digest":
        return internalPost("/api/alloy/digest", {
          domains: args.domains ?? ["vessels", "aegis", "terra", "prism", "lyte", "carlota-jo"],
          period: args.period ?? "daily",
        });
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  },

  async readResource(uri: string) {
    switch (uri) {
      case "alloy://agents/all":
        return internalGet("/api/mastra/agents");
      case "alloy://skills/catalog":
        return internalGet("/api/skills");
      case "alloy://platform/health":
        return internalGet("/api/health");
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  },

  async getPrompt(name: string, args: Record<string, unknown>) {
    if (name === "alloy_executive_brief") {
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Generate a concise executive intelligence brief covering the SZL Holdings platform.${args.focus ? ` Focus on: ${args.focus}.` : ""} Synthesize key operational signals, risks, and opportunities across all domains. Format for C-suite consumption.`,
          },
        }],
      };
    }
    if (name === "alloy_cross_domain_analysis") {
      const domains = String(args.domains ?? "vessels,aegis,terra").split(",").map(d => d.trim());
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Run a cross-domain ${args.analysis_type ?? "correlation"} analysis across these SZL Holdings business verticals: ${domains.join(", ")}. Identify patterns, shared risk signals, and emergent opportunities that cut across domain boundaries. Provide actionable insights for leadership.`,
          },
        }],
      };
    }
    throw new Error(`Unknown prompt: ${name}`);
  },
};
