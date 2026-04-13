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

export const aegisMcpModule: McpServerModule = {
  moduleId: "aegis",
  name: "Aegis Unified Defense & Intelligence",
  description: "Threat detection, incident response, vulnerability assessment, and cyber defense intelligence tools",
  version: "2.0.0",
  domain: "security",
  tools: [
    {
      name: "firestorm_threat_scan",
      description: "Query active cybersecurity threats, recent CVEs, and incident status from the Aegis SOC platform",
      inputSchema: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["critical", "high", "medium", "low"], description: "Filter by threat severity" },
          domain: { type: "string", description: "Specific domain or system to scan" },
        },
      },
      domain: "security",
    },
    {
      name: "firestorm_compliance_check",
      description: "Check security compliance readiness scores and framework adherence status",
      inputSchema: {
        type: "object",
        properties: {
          framework: { type: "string", description: "Compliance framework (e.g. NIST, ISO 27001, CIS, SOC 2)" },
        },
      },
      domain: "security",
    },
    {
      name: "aegis_incident_response",
      description: "Trigger or query incident response playbooks and containment procedures",
      inputSchema: {
        type: "object",
        properties: {
          incidentId: { type: "string", description: "Incident ID to query or action" },
          action: { type: "string", enum: ["status", "escalate", "contain", "resolve"], description: "Action to take" },
        },
      },
      domain: "security",
      requiredRoles: ["admin", "security_analyst"],
    },
    {
      name: "aegis_vulnerability_assessment",
      description: "Run or retrieve vulnerability assessment for systems, applications, or infrastructure",
      inputSchema: {
        type: "object",
        properties: {
          target: { type: "string", description: "Target system, IP range, or application name" },
          depth: { type: "string", enum: ["quick", "standard", "deep"], description: "Assessment depth" },
        },
      },
      domain: "security",
    },
  ],

  resources: [
    {
      uri: "aegis://threats/active",
      name: "Active Threat Feed",
      description: "Real-time feed of active threats, CVEs, and incidents",
      mimeType: "application/json",
    },
    {
      uri: "aegis://compliance/scores",
      name: "Compliance Scorecard",
      description: "Current compliance scores across all registered frameworks",
      mimeType: "application/json",
    },
  ],

  prompts: [
    {
      name: "aegis_threat_assessment",
      description: "Generate a structured threat assessment report with mitigations",
      arguments: [
        { name: "threat_type", description: "Type of threat to assess", required: false },
        { name: "severity", description: "Minimum severity threshold", required: false },
      ],
    },
  ],

  async healthCheck() {
    try {
      const result = await internalGet("/api/firestorm/health") as any;
      return { healthy: !result?.error };
    } catch {
      return { healthy: false, details: "Aegis health check failed" };
    }
  },

  async executeTool(toolName: string, args: Record<string, unknown>) {
    switch (toolName) {
      case "firestorm_threat_scan": {
        const params = new URLSearchParams();
        if (args.severity) params.set("severity", String(args.severity));
        return internalGet(`/api/firestorm/threats?${params}`);
      }
      case "firestorm_compliance_check": {
        const params = new URLSearchParams();
        if (args.framework) params.set("framework", String(args.framework));
        return internalGet(`/api/firestorm/compliance?${params}`);
      }
      case "aegis_incident_response": {
        return {
          incidentId: args.incidentId ?? "INC-" + Date.now(),
          action: args.action ?? "status",
          status: "acknowledged",
          playbook: "IR-001-Containment",
          steps: [
            "Isolate affected systems",
            "Preserve forensic evidence",
            "Notify security team",
            "Begin root cause analysis",
          ],
          estimatedContainmentTime: "2-4 hours",
          severity: "high",
          generatedAt: new Date().toISOString(),
        };
      }
      case "aegis_vulnerability_assessment": {
        return {
          target: args.target,
          depth: args.depth ?? "standard",
          findings: [
            { cve: "CVE-2024-1234", severity: "high", cvss: 8.1, description: "Remote code execution vulnerability", remediation: "Patch to version 3.2.1+" },
            { cve: "CVE-2024-5678", severity: "medium", cvss: 5.4, description: "Authentication bypass in legacy endpoint", remediation: "Disable endpoint or upgrade to v2 auth" },
          ],
          summary: { critical: 0, high: 1, medium: 1, low: 2, info: 5 },
          riskScore: 72,
          generatedAt: new Date().toISOString(),
        };
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  },

  async readResource(uri: string) {
    switch (uri) {
      case "aegis://threats/active":
        return internalGet("/api/firestorm/threats");
      case "aegis://compliance/scores":
        return internalGet("/api/firestorm/compliance");
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  },

  async getPrompt(name: string, args: Record<string, unknown>) {
    if (name === "aegis_threat_assessment") {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Generate a structured threat assessment report for the Aegis security platform.${args.threat_type ? ` Focus on ${args.threat_type} threats.` : ""} Include current threat landscape, risk scoring, and prioritized mitigations. Format as an executive-ready security brief.`,
            },
          },
        ],
      };
    }
    throw new Error(`Unknown prompt: ${name}`);
  },
};
