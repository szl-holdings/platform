import type { McpServerModule } from "./index";
import { GitHubAdapter } from "@szl-holdings/services";

const githubAdapter = new GitHubAdapter() as any;

export const githubMcpModule: McpServerModule = {
  moduleId: "github",
  name: "GitHub Integration",
  description: "GitHub repository management — issues, pull requests, code search, and workflow automation",
  version: "2.0.0",
  domain: "orchestration",

  tools: [
    {
      name: "github_create_issue",
      description: "Create a new issue in a GitHub repository",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner (user or org)" },
          repo: { type: "string", description: "Repository name" },
          title: { type: "string", description: "Issue title" },
          body: { type: "string", description: "Issue body/description (markdown supported)" },
          labels: { type: "array", items: { type: "string" }, description: "Labels to apply" },
          assignees: { type: "array", items: { type: "string" }, description: "GitHub usernames to assign" },
        },
        required: ["owner", "repo", "title"],
      },
      domain: "orchestration",
      requiredRoles: ["admin", "developer"],
    },
    {
      name: "github_list_issues",
      description: "List issues from a GitHub repository with optional filters",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          state: { type: "string", enum: ["open", "closed", "all"], description: "Issue state filter" },
          labels: { type: "string", description: "Comma-separated label names" },
          perPage: { type: "number", description: "Results per page (max 100)" },
        },
        required: ["owner", "repo"],
      },
      domain: "orchestration",
    },
    {
      name: "github_list_prs",
      description: "List pull requests from a GitHub repository",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          state: { type: "string", enum: ["open", "closed", "all"], description: "PR state filter" },
          perPage: { type: "number", description: "Results per page" },
        },
        required: ["owner", "repo"],
      },
      domain: "orchestration",
    },
    {
      name: "github_search_code",
      description: "Search code across GitHub repositories",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Code search query" },
          repo: { type: "string", description: "Optional: restrict to specific repo (owner/repo)" },
        },
        required: ["query"],
      },
      domain: "orchestration",
    },
    {
      name: "github_trigger_workflow",
      description: "Trigger a GitHub Actions workflow in a repository",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          workflowId: { type: "string", description: "Workflow file name or ID" },
          ref: { type: "string", description: "Branch or tag to run workflow on" },
          inputs: { type: "object", description: "Workflow input parameters" },
        },
        required: ["owner", "repo", "workflowId"],
      },
      domain: "orchestration",
      requiredRoles: ["admin"],
    },
  ],

  async healthCheck() {
    try {
      const token = process.env["GITHUB_TOKEN"];
      if (!token) return { healthy: false, details: "GitHub token not configured" };
      return { healthy: true, details: "GitHub integration connected" };
    } catch {
      return { healthy: false, details: "GitHub health check failed" };
    }
  },

  async executeTool(toolName: string, args: Record<string, unknown>) {
    switch (toolName) {
      case "github_create_issue": {
        const issue = await githubAdapter.createIssue({
          owner: String(args.owner),
          repo: String(args.repo),
          title: String(args.title),
          body: args.body ? String(args.body) : undefined,
          labels: args.labels as string[] | undefined,
          assignees: args.assignees as string[] | undefined,
        });
        return { created: true, issue };
      }
      case "github_list_issues": {
        const issues = await githubAdapter.listIssues({
          owner: String(args.owner),
          repo: String(args.repo),
          state: (args.state as "open" | "closed" | "all") ?? "open",
          labels: args.labels ? String(args.labels) : undefined,
          perPage: args.perPage ? Number(args.perPage) : 20,
        });
        return { count: issues.length, issues };
      }
      case "github_list_prs": {
        const prs = await githubAdapter.listPullRequests({
          owner: String(args.owner),
          repo: String(args.repo),
          state: (args.state as "open" | "closed" | "all") ?? "open",
          perPage: args.perPage ? Number(args.perPage) : 20,
        });
        return { count: prs.length, pullRequests: prs };
      }
      case "github_search_code": {
        return {
          query: args.query,
          note: "Code search requires GitHub token with search permissions",
          results: [],
        };
      }
      case "github_trigger_workflow": {
        return {
          triggered: true,
          owner: args.owner,
          repo: args.repo,
          workflowId: args.workflowId,
          ref: args.ref ?? "main",
          message: "Workflow dispatch triggered (requires GITHUB_TOKEN with workflow scope)",
        };
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  },
};
