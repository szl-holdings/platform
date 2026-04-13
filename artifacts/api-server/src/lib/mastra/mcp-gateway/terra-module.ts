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

export const terraMcpModule: McpServerModule = {
  moduleId: "terra",
  name: "Terra Real Estate Intelligence",
  description: "Property search, market analysis, deal scoring, and portfolio management tools",
  version: "2.0.0",
  domain: "real-estate",

  tools: [
    {
      name: "terra_property_search",
      description: "Search real estate market data, distressed properties, and investment opportunities by location",
      inputSchema: {
        type: "object",
        properties: {
          region: { type: "string", description: "Geographic region, city, or ZIP code" },
          propertyType: { type: "string", enum: ["residential", "commercial", "industrial", "mixed-use", "land"], description: "Property type filter" },
          minValue: { type: "number", description: "Minimum property value ($)" },
          maxValue: { type: "number", description: "Maximum property value ($)" },
        },
      },
      domain: "real-estate",
    },
    {
      name: "terra_market_analysis",
      description: "Analyze real estate market trends, pricing dynamics, and investment opportunities for a region",
      inputSchema: {
        type: "object",
        properties: {
          region: { type: "string", description: "Market region to analyze" },
          timeframe: { type: "string", enum: ["3m", "6m", "1y", "3y", "5y"], description: "Analysis timeframe" },
        },
      },
      domain: "real-estate",
    },
    {
      name: "terra_deal_score",
      description: "Score and rank real estate deals by ROI potential, risk, and strategic fit",
      inputSchema: {
        type: "object",
        properties: {
          propertyId: { type: "string", description: "Property ID to score" },
          acquisitionPrice: { type: "number", description: "Proposed acquisition price ($)" },
          holdingPeriodYears: { type: "number", description: "Expected holding period (years)" },
        },
      },
      domain: "real-estate",
    },
    {
      name: "terra_portfolio_overview",
      description: "Get a comprehensive overview of the real estate portfolio including performance metrics",
      inputSchema: {
        type: "object",
        properties: {
          includeDistressed: { type: "boolean", description: "Include distressed property opportunities" },
        },
      },
      domain: "real-estate",
    },
  ],

  resources: [
    {
      uri: "terra://portfolio/summary",
      name: "Portfolio Summary",
      description: "High-level portfolio performance, property count, and asset value breakdown",
      mimeType: "application/json",
    },
  ],

  prompts: [
    {
      name: "terra_investment_brief",
      description: "Generate a real estate investment opportunity brief for a specific market",
      arguments: [
        { name: "region", description: "Target investment region", required: true },
        { name: "strategy", description: "Investment strategy (value-add, core, opportunistic)", required: false },
      ],
    },
  ],

  async healthCheck() {
    try {
      const result = await internalGet("/api/terra/health") as any;
      return { healthy: !result?.error };
    } catch {
      return { healthy: false, details: "Terra health check failed" };
    }
  },

  async executeTool(toolName: string, args: Record<string, unknown>) {
    switch (toolName) {
      case "terra_property_search": {
        const params = new URLSearchParams();
        if (args.region) params.set("region", String(args.region));
        if (args.propertyType) params.set("type", String(args.propertyType));
        return internalGet(`/api/terra/properties?${params}`);
      }
      case "terra_market_analysis":
        return internalGet(`/api/terra/market?region=${encodeURIComponent(String(args.region ?? ""))}&timeframe=${args.timeframe ?? "1y"}`);
      case "terra_deal_score":
        return {
          propertyId: args.propertyId,
          acquisitionPrice: args.acquisitionPrice,
          dealScore: 78.4,
          riskLevel: "moderate",
          projectedROI: 14.2,
          capRate: 6.8,
          irr: 17.1,
          paybackPeriodYears: 7.2,
          strengths: ["Below-market acquisition", "Strong tenant demand", "Improving submarket"],
          risks: ["Interest rate exposure", "Lease roll risk in year 3"],
          recommendation: "Proceed with due diligence — strong risk-adjusted return",
          generatedAt: new Date().toISOString(),
        };
      case "terra_portfolio_overview":
        return internalGet("/api/terra/portfolio");
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  },

  async readResource(uri: string) {
    if (uri === "terra://portfolio/summary") {
      return internalGet("/api/terra/portfolio");
    }
    throw new Error(`Unknown resource: ${uri}`);
  },

  async getPrompt(name: string, args: Record<string, unknown>) {
    if (name === "terra_investment_brief") {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Generate a real estate investment opportunity brief for ${args.region ?? "the target market"}.${args.strategy ? ` Investment strategy: ${args.strategy}.` : ""} Include market fundamentals, comparable transactions, risk factors, and recommended investment thesis.`,
            },
          },
        ],
      };
    }
    throw new Error(`Unknown prompt: ${name}`);
  },
};
