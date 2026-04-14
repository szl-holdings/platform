import { ToolConnector } from "../framework.js";
import type { AuthConfig, Capability, ConnectorCategory } from "../types.js";
import { services } from "../../registry.js";

export class SalesforceConnector extends ToolConnector {
  readonly id = "salesforce";
  readonly name = "Salesforce";
  readonly description = "Salesforce CRM — accounts, contacts, opportunities, leads, cases, pipeline health, SOQL queries, and real-time CDC event streaming";
  readonly category: ConnectorCategory = "crm";
  readonly version = "1.0.0";

  readonly authConfig: AuthConfig = {
    scheme: "oauth2_client_credentials",
    requiredEnvVars: ["SALESFORCE_CLIENT_ID", "SALESFORCE_CLIENT_SECRET", "SALESFORCE_INSTANCE_URL"],
    optionalEnvVars: ["SALESFORCE_REFRESH_TOKEN", "SALESFORCE_USERNAME", "SALESFORCE_PASSWORD"],
    oauthTokenUrl: "https://login.salesforce.com/services/oauth2/token",
    oauthScopes: ["api", "refresh_token", "offline_access"],
    description: "Connected App OAuth 2.0. Create a Connected App in Salesforce Setup > App Manager.",
  };

  readonly capabilities: Capability[] = [
    {
      id: "query_accounts",
      name: "Query Accounts",
      description: "Retrieve Salesforce accounts",
      parameters: [
        { name: "limit", type: "number", description: "Maximum accounts to return (default 50)", required: false },
      ],
      requiresAuth: true,
      tags: ["read", "accounts"],
      rateLimit: { requestsPerMinute: 100 },
    },
    {
      id: "query_opportunities",
      name: "Query Opportunities",
      description: "Retrieve opportunity pipeline with stage and value data",
      parameters: [
        { name: "limit", type: "number", description: "Maximum opportunities to return (default 50)", required: false },
        { name: "stage", type: "string", description: "Filter by stage name", required: false },
      ],
      requiresAuth: true,
      tags: ["read", "opportunities"],
    },
    {
      id: "query_cases",
      name: "Query Cases",
      description: "Retrieve Salesforce support cases",
      parameters: [
        { name: "limit", type: "number", description: "Maximum cases to return (default 50)", required: false },
        { name: "escalatedOnly", type: "boolean", description: "Only return escalated cases (default false)", required: false },
      ],
      requiresAuth: true,
      tags: ["read", "cases"],
    },
    {
      id: "query_leads",
      name: "Query Leads",
      description: "Retrieve Salesforce leads",
      parameters: [
        { name: "limit", type: "number", description: "Maximum leads to return (default 50)", required: false },
      ],
      requiresAuth: true,
      tags: ["read", "leads"],
    },
    {
      id: "get_pipeline_health",
      name: "Get Pipeline Health",
      description: "Generate a pipeline health summary with win rates, velocity, and risk signals",
      parameters: [],
      requiresAuth: true,
      tags: ["read", "analytics"],
    },
    {
      id: "execute_soql",
      name: "Execute SOQL",
      description: "Execute an arbitrary SOQL query against any Salesforce object",
      parameters: [
        { name: "soql", type: "string", description: "Full SOQL query string", required: true },
      ],
      requiresAuth: true,
      tags: ["read", "search", "soql"],
    },
    {
      id: "ingest_signals",
      name: "Ingest Signals",
      description: "Ingest Salesforce signals (escalated cases, stale opportunities, new high-value leads) for platform analysis",
      parameters: [],
      requiresAuth: true,
      tags: ["read", "signals"],
    },
    {
      id: "create_case",
      name: "Create Case",
      description: "Create a new Salesforce support case",
      parameters: [
        { name: "subject", type: "string", description: "Case subject/title", required: true },
        { name: "description", type: "string", description: "Case description", required: false },
        { name: "priority", type: "string", description: "Priority: High, Medium, Low", required: false },
        { name: "accountId", type: "string", description: "Salesforce account ID to associate", required: false },
        { name: "contactId", type: "string", description: "Salesforce contact ID to associate", required: false },
      ],
      requiresAuth: true,
      tags: ["write", "cases"],
    },
  ];

  protected async performCapability(capabilityId: string, params: Record<string, unknown>): Promise<unknown> {
    const adapter = services.salesforce;
    switch (capabilityId) {
      case "query_accounts":
        return adapter.queryAccounts(params["limit"] ? Number(params["limit"]) : 50);
      case "query_opportunities":
        return adapter.queryOpportunities(params["limit"] ? Number(params["limit"]) : 50, params["stage"] ? String(params["stage"]) : undefined);
      case "query_cases":
        return adapter.queryCases(params["limit"] ? Number(params["limit"]) : 50, params["escalatedOnly"] === true);
      case "query_leads":
        return adapter.queryLeads(params["limit"] ? Number(params["limit"]) : 50);
      case "get_pipeline_health":
        return adapter.getPipelineHealth();
      case "execute_soql":
        return adapter.executeSOQL(String(params["soql"]));
      case "ingest_signals":
        return adapter.ingestSignals();
      case "create_case":
        return adapter.createCase({
          subject: String(params["subject"]),
          description: params["description"] ? String(params["description"]) : undefined,
          priority: params["priority"] ? (String(params["priority"]) as "High" | "Medium" | "Low") : undefined,
          accountId: params["accountId"] ? String(params["accountId"]) : undefined,
        });
      default:
        throw new Error(`Unknown capability: ${capabilityId}`);
    }
  }

  protected async performHealthCheck(): Promise<void> {
    await services.salesforce.testConnection();
  }
}
