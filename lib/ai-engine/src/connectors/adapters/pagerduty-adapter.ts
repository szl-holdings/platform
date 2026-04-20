import { BaseConnectorAdapter } from "../connector-interface.js";
import type { ConnectorAuthConfig, ConnectorRateLimitConfig, ConnectorToolDefinition } from "../connector-interface.js";
import { getEnv } from "@szl-holdings/env";

export class PagerDutyConnectorAdapter extends BaseConnectorAdapter {
  connectorId = "pagerduty";
  displayName = "PagerDuty";
  description = "PagerDuty incident alerting — create incidents, trigger alerts, manage on-call";
  category = "observability" as const;
  vendor = "PagerDuty";
  version = "1.0.0";
  docsUrl = "https://developer.pagerduty.com/api-reference/";

  authConfig: ConnectorAuthConfig = {
    type: "api_key",
    envVarNames: ["PAGERDUTY_API_KEY"],
    headerName: "Authorization",
  };

  rateLimit: ConnectorRateLimitConfig = {
    requestsPerMinute: 60,
    requestsPerDay: 10000,
  };

  tools: ConnectorToolDefinition[] = [
    {
      name: "create_incident",
      description: "Create a new PagerDuty incident",
      inputSchema: {
        type: "object",
        required: ["title", "serviceId"],
        properties: {
          title: { type: "string" },
          serviceId: { type: "string" },
          urgency: { type: "string", enum: ["high", "low"] },
          body: { type: "string" },
          escalationPolicyId: { type: "string" },
        },
      },
      outputSchema: { type: "object", properties: { id: { type: "string" }, status: { type: "string" }, htmlUrl: { type: "string" } } },
      costEstimate: "free",
    },
    {
      name: "list_incidents",
      description: "List current PagerDuty incidents",
      inputSchema: {
        type: "object",
        properties: {
          statuses: { type: "array", items: { type: "string", enum: ["triggered", "acknowledged", "resolved"] } },
          urgencies: { type: "array", items: { type: "string" } },
          limit: { type: "number" },
        },
      },
      outputSchema: { type: "object", properties: { incidents: { type: "array" }, total: { type: "number" } } },
      costEstimate: "free",
    },
    {
      name: "acknowledge_incident",
      description: "Acknowledge a PagerDuty incident",
      inputSchema: {
        type: "object",
        required: ["incidentId", "from"],
        properties: {
          incidentId: { type: "string" },
          from: { type: "string" },
        },
      },
      outputSchema: { type: "object", properties: { success: { type: "boolean" } } },
      costEstimate: "free",
    },
  ];

  private get apiKey(): string {
    return getEnv().PAGERDUTY_API_KEY ?? "";
  }

  async execute(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    const headers = {
      "Authorization": `Token token=${this.apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/vnd.pagerduty+json;version=2",
    };

    if (toolName === "create_incident") {
      const resp = await fetch("https://api.pagerduty.com/incidents", {
        method: "POST",
        headers,
        body: JSON.stringify({
          incident: {
            type: "incident",
            title: input.title,
            service: { id: input.serviceId, type: "service_reference" },
            urgency: input.urgency ?? "high",
            body: input.body ? { type: "incident_body", details: input.body } : undefined,
          },
        }),
      });
      const data = (await resp.json()) as { incident: { id: string; status: string; html_url: string } };
      return { id: data.incident.id, status: data.incident.status, htmlUrl: data.incident.html_url };
    }

    if (toolName === "list_incidents") {
      const params = new URLSearchParams();
      if (input.limit) params.set("limit", String(input.limit));
      const statuses = (input.statuses as string[]) ?? ["triggered", "acknowledged"];
      for (const s of statuses) params.append("statuses[]", s);
      const resp = await fetch(`https://api.pagerduty.com/incidents?${params}`, { headers });
      const data = (await resp.json()) as { incidents: unknown[]; total: number };
      return { incidents: data.incidents, total: data.total };
    }

    if (toolName === "acknowledge_incident") {
      const resp = await fetch(`https://api.pagerduty.com/incidents/${input.incidentId}`, {
        method: "PUT",
        headers: { ...headers, "From": input.from as string },
        body: JSON.stringify({ incident: { type: "incident", status: "acknowledged" } }),
      });
      return { success: resp.ok };
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }
}
