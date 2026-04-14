import { BaseConnectorAdapter } from "../connector-interface.js";
import type { ConnectorAuthConfig, ConnectorRateLimitConfig, ConnectorToolDefinition } from "../connector-interface.js";

export class JiraConnectorAdapter extends BaseConnectorAdapter {
  connectorId = "jira";
  displayName = "Jira";
  description = "Atlassian Jira — ticket creation, updates, and querying";
  category = "ticketing" as const;
  vendor = "Atlassian";
  version = "1.0.0";
  docsUrl = "https://developer.atlassian.com/cloud/jira/platform/rest/v3/";

  authConfig: ConnectorAuthConfig = {
    type: "basic",
    envVarNames: ["JIRA_EMAIL", "JIRA_API_TOKEN"],
    headerName: "Authorization",
  };

  rateLimit: ConnectorRateLimitConfig = {
    requestsPerMinute: 60,
    requestsPerDay: 50000,
  };

  tools: ConnectorToolDefinition[] = [
    {
      name: "create_issue",
      description: "Create a new Jira issue",
      inputSchema: {
        type: "object",
        required: ["projectKey", "summary", "issueType"],
        properties: {
          projectKey: { type: "string" },
          summary: { type: "string" },
          description: { type: "string" },
          issueType: { type: "string", enum: ["Bug", "Task", "Story", "Epic"] },
          priority: { type: "string", enum: ["Highest", "High", "Medium", "Low"] },
          labels: { type: "array", items: { type: "string" } },
        },
      },
      outputSchema: { type: "object", properties: { id: { type: "string" }, key: { type: "string" }, url: { type: "string" } } },
      costEstimate: "free",
    },
    {
      name: "search_issues",
      description: "Search Jira issues using JQL",
      inputSchema: {
        type: "object",
        required: ["jql"],
        properties: {
          jql: { type: "string" },
          maxResults: { type: "number" },
          fields: { type: "array", items: { type: "string" } },
        },
      },
      outputSchema: { type: "object", properties: { issues: { type: "array" }, total: { type: "number" } } },
      costEstimate: "free",
    },
    {
      name: "update_issue_status",
      description: "Transition a Jira issue to a new status",
      inputSchema: {
        type: "object",
        required: ["issueKey", "transitionId"],
        properties: {
          issueKey: { type: "string" },
          transitionId: { type: "string" },
          comment: { type: "string" },
        },
      },
      outputSchema: { type: "object", properties: { success: { type: "boolean" } } },
      costEstimate: "free",
    },
  ];

  private get baseUrl(): string {
    return process.env.JIRA_BASE_URL ?? "";
  }

  async execute(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    const headers = { ...this.getAuthHeaders(), "Content-Type": "application/json" };

    if (toolName === "create_issue") {
      const resp = await fetch(`${this.baseUrl}/rest/api/3/issue`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          fields: {
            project: { key: input.projectKey },
            summary: input.summary,
            description: input.description ? { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: input.description }] }] } : undefined,
            issuetype: { name: input.issueType ?? "Task" },
            priority: input.priority ? { name: input.priority } : undefined,
            labels: input.labels ?? [],
          },
        }),
      });
      return resp.json();
    }

    if (toolName === "search_issues") {
      const resp = await fetch(`${this.baseUrl}/rest/api/3/search`, {
        method: "POST",
        headers,
        body: JSON.stringify({ jql: input.jql, maxResults: input.maxResults ?? 20, fields: input.fields ?? ["summary", "status", "priority", "assignee"] }),
      });
      return resp.json();
    }

    if (toolName === "update_issue_status") {
      const resp = await fetch(`${this.baseUrl}/rest/api/3/issue/${input.issueKey}/transitions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ transition: { id: input.transitionId } }),
      });
      return { success: resp.ok };
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }
}
