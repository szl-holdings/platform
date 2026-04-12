import { z } from "zod";
import { logger } from "../logger";
import { registerTool } from "./tool-registry";
import type { AgentExecutionContext } from "./types";

export interface ExternalIntegrationAuth {
  type: "bearer" | "oauth2" | "api_key" | "basic";
  tokenEnvVar?: string;
  token?: string;
}

export interface ExternalIntegrationConfig {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  auth: ExternalIntegrationAuth;
  rateLimit?: { maxCalls: number; windowMs: number };
  retryPolicy?: { maxRetries: number; backoffMs: number; backoffFactor: number };
  timeout?: number;
  enabled: boolean;
  tags: string[];
}

const integrationRegistry = new Map<string, ExternalIntegrationConfig>();

export function registerExternalIntegration(config: ExternalIntegrationConfig): void {
  integrationRegistry.set(config.id, config);
  logger.info({ integrationId: config.id, name: config.name }, "External integration registered");
}

export function getExternalIntegration(id: string): ExternalIntegrationConfig | undefined {
  return integrationRegistry.get(id);
}

export function listExternalIntegrations(): ExternalIntegrationConfig[] {
  return Array.from(integrationRegistry.values());
}

function resolveToken(auth: ExternalIntegrationAuth): string | undefined {
  if (auth.token) return auth.token;
  if (auth.tokenEnvVar) return process.env[auth.tokenEnvVar];
  return undefined;
}

export async function callExternalIntegration(
  integrationId: string,
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
  headers?: Record<string, string>
): Promise<{ data: unknown; status: number; latencyMs: number }> {
  const integration = integrationRegistry.get(integrationId);
  if (!integration) throw new Error(`Integration "${integrationId}" not registered`);
  if (!integration.enabled) throw new Error(`Integration "${integrationId}" is disabled`);

  const token = resolveToken(integration.auth);
  const authHeaders: Record<string, string> = {};

  if (integration.auth.type === "bearer" && token) {
    authHeaders["Authorization"] = `Bearer ${token}`;
  } else if (integration.auth.type === "api_key" && token) {
    authHeaders["X-API-Key"] = token;
  }

  const maxRetries = integration.retryPolicy?.maxRetries ?? 2;
  const timeout = integration.timeout ?? 15000;
  const url = `${integration.baseUrl}${endpoint}`;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const resp = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...authHeaders,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      clearTimeout(timer);
      const latencyMs = Date.now() - start;

      let data: unknown;
      const contentType = resp.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        data = await resp.json();
      } else {
        data = await resp.text();
      }

      if (!resp.ok) {
        throw new Error(`Integration call failed: HTTP ${resp.status} — ${JSON.stringify(data).slice(0, 200)}`);
      }

      return { data, status: resp.status, latencyMs };
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxRetries) {
        const backoffMs = (integration.retryPolicy?.backoffMs ?? 500) *
          Math.pow(integration.retryPolicy?.backoffFactor ?? 2, attempt);
        logger.warn({ integrationId, attempt, backoffMs, error: lastError.message }, "External integration call failed, retrying");
        await new Promise(r => setTimeout(r, backoffMs));
      }
    }
  }

  throw lastError ?? new Error(`Integration call to ${integrationId} failed after ${maxRetries + 1} attempts`);
}

export function registerGitHubIntegration(): void {
  const token = process.env["GITHUB_TOKEN"] || process.env["GITHUB_PERSONAL_ACCESS_TOKEN"];

  registerExternalIntegration({
    id: "github",
    name: "GitHub",
    description: "GitHub repository management, issues, PRs, and workflow automation",
    baseUrl: "https://api.github.com",
    auth: {
      type: "bearer",
      tokenEnvVar: "GITHUB_TOKEN",
      token,
    },
    rateLimit: { maxCalls: 60, windowMs: 3600000 },
    retryPolicy: { maxRetries: 2, backoffMs: 500, backoffFactor: 2 },
    timeout: 15000,
    enabled: true,
    tags: ["vcs", "issues", "automation"],
  });

  registerTool({
    name: "github_create_issue",
    description: "Create a GitHub issue in a repository — use for bug reports, compliance tasks, action items",
    inputSchema: z.object({
      owner: z.string().min(1).describe("Repository owner (org or user)"),
      repo: z.string().min(1).describe("Repository name"),
      title: z.string().min(1).describe("Issue title"),
      body: z.string().optional().describe("Issue body (markdown supported)"),
      labels: z.array(z.string()).optional().describe("Labels to apply"),
      assignees: z.array(z.string()).optional().describe("GitHub usernames to assign"),
      milestone: z.number().int().optional().describe("Milestone number"),
    }),
    outputSchema: z.object({
      number: z.number(),
      html_url: z.string(),
      title: z.string(),
      state: z.string(),
    }),
    rateLimit: { maxCalls: 20, windowMs: 60000 },
    permissions: ["github:write"],
    handler: async (input: any) => {
      const result = await callExternalIntegration(
        "github",
        `/repos/${input.owner}/${input.repo}/issues`,
        "POST",
        {
          title: input.title,
          body: input.body,
          labels: input.labels,
          assignees: input.assignees,
          milestone: input.milestone,
        }
      );
      const data = result.data as any;
      return { number: data.number, html_url: data.html_url, title: data.title, state: data.state };
    },
  });

  registerTool({
    name: "github_list_issues",
    description: "List issues from a GitHub repository, optionally filtered by state or labels",
    inputSchema: z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      state: z.enum(["open", "closed", "all"]).default("open"),
      labels: z.string().optional().describe("Comma-separated list of labels"),
      limit: z.number().int().min(1).max(100).default(30),
    }),
    rateLimit: { maxCalls: 30, windowMs: 60000 },
    permissions: ["github:read"],
    handler: async (input: any) => {
      const params = new URLSearchParams({
        state: input.state,
        per_page: String(input.limit),
      });
      if (input.labels) params.set("labels", input.labels);
      const result = await callExternalIntegration(
        "github",
        `/repos/${input.owner}/${input.repo}/issues?${params.toString()}`,
        "GET"
      );
      const data = result.data as any[];
      return {
        issues: data.map((i: any) => ({
          number: i.number,
          title: i.title,
          state: i.state,
          html_url: i.html_url,
          labels: i.labels?.map((l: any) => l.name),
          created_at: i.created_at,
          assignees: i.assignees?.map((a: any) => a.login),
        })),
        total: data.length,
      };
    },
  });

  registerTool({
    name: "github_create_comment",
    description: "Add a comment to an existing GitHub issue or pull request",
    inputSchema: z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      issueNumber: z.number().int().positive(),
      body: z.string().min(1),
    }),
    rateLimit: { maxCalls: 20, windowMs: 60000 },
    permissions: ["github:write"],
    handler: async (input: any) => {
      const result = await callExternalIntegration(
        "github",
        `/repos/${input.owner}/${input.repo}/issues/${input.issueNumber}/comments`,
        "POST",
        { body: input.body }
      );
      const data = result.data as any;
      return { id: data.id, html_url: data.html_url, created_at: data.created_at };
    },
  });

  registerTool({
    name: "github_get_repo",
    description: "Get metadata and statistics for a GitHub repository",
    inputSchema: z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
    }),
    rateLimit: { maxCalls: 30, windowMs: 60000 },
    permissions: ["github:read"],
    handler: async (input: any) => {
      const result = await callExternalIntegration(
        "github",
        `/repos/${input.owner}/${input.repo}`,
        "GET"
      );
      const data = result.data as any;
      return {
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        stars: data.stargazers_count,
        forks: data.forks_count,
        open_issues: data.open_issues_count,
        language: data.language,
        visibility: data.visibility,
        html_url: data.html_url,
      };
    },
  });

  registerTool({
    name: "github_create_workflow_dispatch",
    description: "Trigger a GitHub Actions workflow dispatch event to run a CI/CD workflow",
    inputSchema: z.object({
      owner: z.string().min(1),
      repo: z.string().min(1),
      workflowId: z.string().min(1).describe("Workflow filename (e.g. ci.yml) or workflow ID"),
      ref: z.string().default("main").describe("Branch or tag to run workflow on"),
      inputs: z.record(z.string()).optional().describe("Workflow input parameters"),
    }),
    rateLimit: { maxCalls: 5, windowMs: 60000 },
    permissions: ["github:write", "github:actions"],
    handler: async (input: any) => {
      await callExternalIntegration(
        "github",
        `/repos/${input.owner}/${input.repo}/actions/workflows/${input.workflowId}/dispatches`,
        "POST",
        { ref: input.ref, inputs: input.inputs ?? {} }
      );
      return {
        triggered: true,
        workflow: input.workflowId,
        ref: input.ref,
        repo: `${input.owner}/${input.repo}`,
        timestamp: new Date().toISOString(),
      };
    },
  });

  logger.info("GitHub external integration registered with 5 tools");
}
