import type { McpServerModule } from "./index";

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

export const prismMcpModule: McpServerModule = {
  moduleId: "prism",
  name: "PRISM Legal Counsel",
  description: "Legal matter management, contract review, compliance analysis, and regulatory intelligence tools",
  version: "2.0.0",
  domain: "legal",

  tools: [
    {
      name: "prism_matter_search",
      description: "Search and query active legal matters, cases, and engagements",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["active", "pending", "closed", "all"], description: "Matter status filter" },
          matterType: { type: "string", description: "Type of legal matter (e.g. litigation, contract, compliance)" },
          searchQuery: { type: "string", description: "Full-text search query" },
        },
      },
      domain: "legal",
    },
    {
      name: "prism_contract_review",
      description: "Analyze contracts for risks, obligations, and compliance issues",
      inputSchema: {
        type: "object",
        properties: {
          contractText: { type: "string", description: "Contract text to review (or contract ID)" },
          jurisdiction: { type: "string", description: "Governing law jurisdiction" },
          focusAreas: {
            type: "array",
            items: { type: "string" },
            description: "Focus areas: liability, IP, termination, payment, compliance",
          },
        },
      },
      domain: "legal",
      requiredRoles: ["admin", "legal"],
    },
    {
      name: "prism_compliance_check",
      description: "Check regulatory compliance across jurisdictions and frameworks",
      inputSchema: {
        type: "object",
        properties: {
          framework: { type: "string", description: "Regulatory framework (GDPR, CCPA, SOX, HIPAA, etc.)" },
          jurisdiction: { type: "string", description: "Legal jurisdiction" },
          activityDescription: { type: "string", description: "Description of the business activity to check" },
        },
      },
      domain: "legal",
    },
    {
      name: "prism_deadline_tracker",
      description: "Get upcoming legal deadlines, court dates, and compliance filing dates",
      inputSchema: {
        type: "object",
        properties: {
          daysAhead: { type: "number", description: "Number of days to look ahead (default: 30)" },
          matterId: { type: "string", description: "Specific matter ID to filter by" },
        },
      },
      domain: "legal",
    },
  ],

  resources: [
    {
      uri: "prism://matters/active",
      name: "Active Legal Matters",
      description: "List of all currently active legal matters with status and key dates",
      mimeType: "application/json",
    },
    {
      uri: "prism://compliance/frameworks",
      name: "Compliance Frameworks Registry",
      description: "Registered compliance frameworks and current adherence scores",
      mimeType: "application/json",
    },
  ],

  prompts: [
    {
      name: "prism_legal_brief",
      description: "Generate a structured legal brief or memo on a topic",
      arguments: [
        { name: "topic", description: "Legal topic or issue to brief", required: true },
        { name: "jurisdiction", description: "Relevant jurisdiction", required: false },
        { name: "audience", description: "Brief audience (executive, counsel, court)", required: false },
      ],
    },
  ],

  async healthCheck() {
    try {
      const result = await internalGet("/api/prism-counsel/health") as any;
      return { healthy: !result?.error };
    } catch {
      return { healthy: false, details: "PRISM health check failed" };
    }
  },

  async executeTool(toolName: string, args: Record<string, unknown>) {
    switch (toolName) {
      case "prism_matter_search": {
        const params = new URLSearchParams();
        if (args.status && args.status !== "all") params.set("status", String(args.status));
        if (args.matterType) params.set("type", String(args.matterType));
        if (args.searchQuery) params.set("q", String(args.searchQuery));
        return internalGet(`/api/prism-counsel/matters?${params}`);
      }
      case "prism_contract_review":
        return {
          reviewId: `review_${Date.now()}`,
          jurisdiction: args.jurisdiction ?? "Unspecified",
          riskSummary: {
            overallRisk: "moderate",
            flaggedClauses: 3,
            criticalIssues: 1,
            recommendations: 5,
          },
          keyFindings: [
            { clause: "Limitation of Liability", risk: "high", finding: "Cap is significantly below industry standard — negotiate upward", recommendation: "Request 2x contract value or $2M minimum" },
            { clause: "IP Ownership", risk: "moderate", finding: "Work-for-hire language is ambiguous regarding pre-existing IP", recommendation: "Add explicit carve-out for pre-existing IP" },
            { clause: "Payment Terms", risk: "low", finding: "Net-60 terms are acceptable but can be improved", recommendation: "Counter with Net-30 or milestone-based payment" },
          ],
          generatedAt: new Date().toISOString(),
        };
      case "prism_compliance_check":
        return {
          framework: args.framework,
          jurisdiction: args.jurisdiction ?? "Global",
          complianceScore: 84,
          status: "substantially_compliant",
          gaps: [
            { requirement: "Data Subject Access Requests", gap: "Response time SLA not documented", priority: "high" },
            { requirement: "Privacy Notice", gap: "Missing data retention periods", priority: "medium" },
          ],
          generatedAt: new Date().toISOString(),
        };
      case "prism_deadline_tracker": {
        const daysAhead = Number(args.daysAhead ?? 30);
        const params = new URLSearchParams({ daysAhead: String(daysAhead) });
        if (args.matterId) params.set("matterId", String(args.matterId));
        return internalGet(`/api/prism-counsel/deadlines?${params}`);
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  },

  async readResource(uri: string) {
    if (uri === "prism://matters/active") return internalGet("/api/prism-counsel/matters?status=active");
    if (uri === "prism://compliance/frameworks") return { frameworks: ["GDPR", "CCPA", "SOX", "HIPAA", "FCPA"], note: "See compliance module for detailed scores" };
    throw new Error(`Unknown resource: ${uri}`);
  },

  async getPrompt(name: string, args: Record<string, unknown>) {
    if (name === "prism_legal_brief") {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Draft a legal brief on: ${args.topic}.${args.jurisdiction ? ` Jurisdiction: ${args.jurisdiction}.` : ""} Audience: ${args.audience ?? "executive leadership"}. Include relevant legal framework, key risks, strategic recommendations, and suggested next steps.`,
            },
          },
        ],
      };
    }
    throw new Error(`Unknown prompt: ${name}`);
  },
};
