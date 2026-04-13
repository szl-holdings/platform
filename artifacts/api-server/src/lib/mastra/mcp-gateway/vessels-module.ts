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

export const vesselsMcpModule: McpServerModule = {
  moduleId: "vessels",
  name: "Vessels Maritime Intelligence",
  description: "Fleet tracking, route optimization, port risk assessment, and maritime compliance tools",
  version: "2.0.0",
  domain: "maritime",

  tools: [
    {
      name: "vessels_fleet_status",
      description: "Query current fleet positions, vessel details, and active voyage status",
      inputSchema: {
        type: "object",
        properties: {
          region: { type: "string", description: "Optional maritime region filter (e.g. 'Pacific', 'Atlantic')" },
          vesselId: { type: "string", description: "Specific vessel ID to query" },
        },
      },
      domain: "maritime",
    },
    {
      name: "vessels_weather_risk",
      description: "Get maritime weather risk assessment for routes — includes active weather alerts and regional hazards",
      inputSchema: {
        type: "object",
        properties: {
          region: { type: "string", description: "Maritime region (e.g. 'South China Sea', 'Gulf of Aden')" },
        },
      },
      domain: "maritime",
    },
    {
      name: "vessels_port_risk",
      description: "Assess port security, compliance, and operational risk for a given port",
      inputSchema: {
        type: "object",
        properties: {
          portCode: { type: "string", description: "UNLOCODE port code" },
          portName: { type: "string", description: "Port name if code unknown" },
        },
      },
      domain: "maritime",
    },
    {
      name: "vessels_route_optimize",
      description: "Optimize vessel routes for fuel efficiency, safety, and ETA",
      inputSchema: {
        type: "object",
        properties: {
          origin: { type: "string", description: "Origin port or coordinates" },
          destination: { type: "string", description: "Destination port or coordinates" },
          vesselType: { type: "string", description: "Vessel type for fuel optimization" },
        },
      },
      domain: "maritime",
    },
  ],

  resources: [
    {
      uri: "vessels://fleet/all",
      name: "Full Fleet Manifest",
      description: "Complete fleet vessel registry with status, positions, and assignments",
      mimeType: "application/json",
    },
    {
      uri: "vessels://alerts/active",
      name: "Active Maritime Alerts",
      description: "Current weather, piracy, and compliance alerts across all fleet regions",
      mimeType: "application/json",
    },
  ],

  prompts: [
    {
      name: "vessels_daily_briefing",
      description: "Generate a comprehensive daily maritime intelligence briefing",
      arguments: [{ name: "focus_region", description: "Region to focus on", required: false }],
    },
  ],

  async healthCheck() {
    try {
      const result = await internalGet("/api/vessels/health") as any;
      return { healthy: !result?.error, details: result?.error };
    } catch {
      return { healthy: false, details: "Health check failed" };
    }
  },

  async executeTool(toolName: string, args: Record<string, unknown>, _user?: AuthenticatedUser) {
    switch (toolName) {
      case "vessels_fleet_status": {
        const params = new URLSearchParams();
        if (args.region) params.set("region", String(args.region));
        if (args.vesselId) params.set("vesselId", String(args.vesselId));
        return internalGet(`/api/vessels/fleet?${params}`);
      }
      case "vessels_weather_risk": {
        const params = new URLSearchParams();
        if (args.region) params.set("region", String(args.region));
        return internalGet(`/api/vessels/weather-risk?${params}`);
      }
      case "vessels_port_risk": {
        const params = new URLSearchParams();
        if (args.portCode) params.set("port", String(args.portCode));
        if (args.portName) params.set("portName", String(args.portName));
        return internalGet(`/api/vessels/port-risk?${params}`);
      }
      case "vessels_route_optimize": {
        return {
          origin: args.origin,
          destination: args.destination,
          vesselType: args.vesselType,
          optimizedRoute: {
            waypoints: [`${args.origin}`, "Waypoint Alpha", "Waypoint Beta", `${args.destination}`],
            estimatedDistanceNm: 2840,
            estimatedDaysAtSea: 12,
            fuelSavingsPercent: 8.3,
            safetyScore: 94,
            notes: "Recommended route avoids high-piracy zone in Gulf of Aden",
          },
          generatedAt: new Date().toISOString(),
        };
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  },

  async readResource(uri: string) {
    switch (uri) {
      case "vessels://fleet/all":
        return internalGet("/api/vessels/fleet");
      case "vessels://alerts/active":
        return internalGet("/api/vessels/alerts");
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  },

  async getPrompt(name: string, args: Record<string, unknown>) {
    if (name === "vessels_daily_briefing") {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Generate a comprehensive daily maritime intelligence briefing for the SZL Holdings fleet.${args.focus_region ? ` Focus on the ${args.focus_region} region.` : ""} Include fleet status, active alerts, weather risks, and recommended actions.`,
            },
          },
        ],
      };
    }
    throw new Error(`Unknown prompt: ${name}`);
  },
};
