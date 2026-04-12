import { ServiceAdapter } from "../base.js";

export interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  updatedAt: string;
}

export interface GitHubWebhookEvent {
  id: string;
  type: string;
  repo: string;
  action: string;
  timestamp: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  author: string;
  labels: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  author: string;
  headRef: string;
  baseRef: string;
  draft: boolean;
  merged: boolean;
  mergedAt: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface GitHubCommit {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  authorEmail: string;
  date: string;
  url: string;
}

export interface GitHubCodeSearchResult {
  totalCount: number;
  items: Array<{
    name: string;
    path: string;
    repository: string;
    url: string;
    score: number;
  }>;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  branch: string;
  event: string;
  createdAt: string;
  updatedAt: string;
  url: string;
}

const MOCK_REPOS: GitHubRepo[] = [
  {
    id: "repo_001",
    name: "szl-platform",
    fullName: "szl-holdings/szl-platform",
    url: "https://github.com/szl-holdings/szl-platform",
    description: "Core SZL Holdings platform monorepo",
    language: "TypeScript",
    stars: 42,
    updatedAt: "2026-03-24T18:00:00Z",
  },
  {
    id: "repo_002",
    name: "portfolio-engine",
    fullName: "szl-holdings/portfolio-engine",
    url: "https://github.com/szl-holdings/portfolio-engine",
    description: "Portfolio management and analytics engine",
    language: "TypeScript",
    stars: 18,
    updatedAt: "2026-03-20T12:00:00Z",
  },
];

const MOCK_ISSUES: GitHubIssue[] = [
  {
    id: 1001,
    number: 42,
    title: "API rate limiting not working in production",
    body: "The rate limiter is not applying correctly under high load.",
    state: "open",
    author: "dev-lead",
    labels: ["bug", "high-priority"],
    assignees: ["backend-team"],
    createdAt: "2026-04-10T09:00:00Z",
    updatedAt: "2026-04-11T14:30:00Z",
    closedAt: null,
    url: "https://github.com/szl-holdings/szl-platform/issues/42",
  },
  {
    id: 1002,
    number: 43,
    title: "Add GitHub integration to AI Action Engine",
    body: "Wire the GitHub adapter into the Mastra tool registry.",
    state: "open",
    author: "platform-lead",
    labels: ["enhancement", "ai"],
    assignees: [],
    createdAt: "2026-04-11T10:00:00Z",
    updatedAt: "2026-04-12T08:00:00Z",
    closedAt: null,
    url: "https://github.com/szl-holdings/szl-platform/issues/43",
  },
];

export class GitHubAdapter extends ServiceAdapter {
  readonly name = "github";
  readonly description = "GitHub repositories, issues, pull requests, commits, code search, and CI/CD workflows";
  readonly requiredEnvVars = ["GITHUB_TOKEN"];

  private get token(): string | undefined {
    return process.env["GITHUB_TOKEN"];
  }

  private async ghRequest(path: string, options?: RequestInit): Promise<unknown> {
    const response = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...options?.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  protected async performHealthCheck(): Promise<void> {
    const result = await this.testConnection();
    if (!result.connected) throw new Error("GitHub connection verification failed");
  }

  async testConnection(): Promise<{ connected: boolean; username?: string }> {
    if (!this.isLive) {
      return { connected: false };
    }
    try {
      const data = (await this.ghRequest("/user")) as { login: string };
      return { connected: true, username: data.login };
    } catch {
      return { connected: false };
    }
  }

  async listRepos(options?: { owner?: string; perPage?: number }): Promise<GitHubRepo[]> {
    if (!this.isLive) {
      return [...MOCK_REPOS];
    }
    const perPage = options?.perPage ?? 20;
    const path = options?.owner
      ? `/users/${options.owner}/repos?sort=updated&per_page=${perPage}`
      : `/user/repos?sort=updated&per_page=${perPage}`;
    const data = (await this.ghRequest(path)) as Array<{
      id: number;
      name: string;
      full_name: string;
      html_url: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
      updated_at: string;
    }>;
    return data.map((r) => ({
      id: String(r.id),
      name: r.name,
      fullName: r.full_name,
      url: r.html_url,
      description: r.description ?? "",
      language: r.language ?? "Unknown",
      stars: r.stargazers_count,
      updatedAt: r.updated_at,
    }));
  }

  async createIssue(params: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
    labels?: string[];
    assignees?: string[];
  }): Promise<GitHubIssue> {
    if (!this.isLive) {
      return {
        id: Math.floor(Math.random() * 9000) + 1000,
        number: Math.floor(Math.random() * 900) + 100,
        title: params.title,
        body: params.body ?? null,
        state: "open",
        author: "mock-user",
        labels: params.labels ?? [],
        assignees: params.assignees ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        closedAt: null,
        url: `https://github.com/${params.owner}/${params.repo}/issues/mock`,
      };
    }
    const data = (await this.ghRequest(`/repos/${params.owner}/${params.repo}/issues`, {
      method: "POST",
      body: JSON.stringify({
        title: params.title,
        body: params.body,
        labels: params.labels,
        assignees: params.assignees,
      }),
    })) as {
      id: number;
      number: number;
      title: string;
      body: string | null;
      state: string;
      user: { login: string };
      labels: Array<{ name: string }>;
      assignees: Array<{ login: string }>;
      created_at: string;
      updated_at: string;
      closed_at: string | null;
      html_url: string;
    };
    return this.mapIssue(data);
  }

  async listIssues(params: {
    owner: string;
    repo: string;
    state?: "open" | "closed" | "all";
    labels?: string;
    perPage?: number;
  }): Promise<GitHubIssue[]> {
    if (!this.isLive) {
      return [...MOCK_ISSUES];
    }
    const state = params.state ?? "open";
    const perPage = params.perPage ?? 20;
    let path = `/repos/${params.owner}/${params.repo}/issues?state=${state}&per_page=${perPage}&filter=all`;
    if (params.labels) path += `&labels=${encodeURIComponent(params.labels)}`;
    const data = (await this.ghRequest(path)) as Array<{
      id: number;
      number: number;
      title: string;
      body: string | null;
      state: string;
      user: { login: string };
      labels: Array<{ name: string }>;
      assignees: Array<{ login: string }>;
      created_at: string;
      updated_at: string;
      closed_at: string | null;
      html_url: string;
      pull_request?: unknown;
    }>;
    return data.filter((i) => !i.pull_request).map(this.mapIssue);
  }

  async getIssue(params: { owner: string; repo: string; issueNumber: number }): Promise<GitHubIssue> {
    if (!this.isLive) {
      return MOCK_ISSUES[0]!;
    }
    const data = (await this.ghRequest(
      `/repos/${params.owner}/${params.repo}/issues/${params.issueNumber}`
    )) as {
      id: number;
      number: number;
      title: string;
      body: string | null;
      state: string;
      user: { login: string };
      labels: Array<{ name: string }>;
      assignees: Array<{ login: string }>;
      created_at: string;
      updated_at: string;
      closed_at: string | null;
      html_url: string;
    };
    return this.mapIssue(data);
  }

  async listPullRequests(params: {
    owner: string;
    repo: string;
    state?: "open" | "closed" | "all";
    perPage?: number;
  }): Promise<GitHubPullRequest[]> {
    if (!this.isLive) {
      return [
        {
          id: 5001,
          number: 21,
          title: "feat: Add GitHub tools to Mastra registry",
          body: "Registers GitHub operations as AI-accessible tools.",
          state: "open",
          author: "platform-lead",
          headRef: "feat/github-ai-tools",
          baseRef: "main",
          draft: false,
          merged: false,
          mergedAt: null,
          createdAt: "2026-04-11T12:00:00Z",
          updatedAt: "2026-04-12T08:00:00Z",
          url: "https://github.com/szl-holdings/szl-platform/pull/21",
        },
      ];
    }
    const state = params.state ?? "open";
    const perPage = params.perPage ?? 20;
    const data = (await this.ghRequest(
      `/repos/${params.owner}/${params.repo}/pulls?state=${state}&per_page=${perPage}`
    )) as Array<{
      id: number;
      number: number;
      title: string;
      body: string | null;
      state: string;
      user: { login: string };
      head: { ref: string };
      base: { ref: string };
      draft: boolean;
      merged_at: string | null;
      created_at: string;
      updated_at: string;
      html_url: string;
    }>;
    return data.map((p) => ({
      id: p.id,
      number: p.number,
      title: p.title,
      body: p.body,
      state: p.state,
      author: p.user.login,
      headRef: p.head.ref,
      baseRef: p.base.ref,
      draft: p.draft,
      merged: !!p.merged_at,
      mergedAt: p.merged_at,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      url: p.html_url,
    }));
  }

  async getPullRequest(params: { owner: string; repo: string; pullNumber: number }): Promise<GitHubPullRequest> {
    if (!this.isLive) {
      return {
        id: 5001,
        number: params.pullNumber,
        title: "Mock pull request",
        body: null,
        state: "open",
        author: "mock-user",
        headRef: "feature/mock",
        baseRef: "main",
        draft: false,
        merged: false,
        mergedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: `https://github.com/${params.owner}/${params.repo}/pull/${params.pullNumber}`,
      };
    }
    const p = (await this.ghRequest(
      `/repos/${params.owner}/${params.repo}/pulls/${params.pullNumber}`
    )) as {
      id: number;
      number: number;
      title: string;
      body: string | null;
      state: string;
      user: { login: string };
      head: { ref: string };
      base: { ref: string };
      draft: boolean;
      merged_at: string | null;
      created_at: string;
      updated_at: string;
      html_url: string;
    };
    return {
      id: p.id,
      number: p.number,
      title: p.title,
      body: p.body,
      state: p.state,
      author: p.user.login,
      headRef: p.head.ref,
      baseRef: p.base.ref,
      draft: p.draft,
      merged: !!p.merged_at,
      mergedAt: p.merged_at,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      url: p.html_url,
    };
  }

  async listCommits(params: {
    owner: string;
    repo: string;
    branch?: string;
    perPage?: number;
  }): Promise<GitHubCommit[]> {
    if (!this.isLive) {
      return [
        {
          sha: "abc123def456",
          shortSha: "abc123d",
          message: "feat: wire GitHub adapter into Mastra tool registry",
          author: "platform-lead",
          authorEmail: "platform@szl-holdings.com",
          date: "2026-04-12T08:00:00Z",
          url: "https://github.com/szl-holdings/szl-platform/commit/abc123def456",
        },
      ];
    }
    const perPage = params.perPage ?? 20;
    let path = `/repos/${params.owner}/${params.repo}/commits?per_page=${perPage}`;
    if (params.branch) path += `&sha=${encodeURIComponent(params.branch)}`;
    const data = (await this.ghRequest(path)) as Array<{
      sha: string;
      commit: {
        message: string;
        author: { name: string; email: string; date: string };
      };
      html_url: string;
    }>;
    return data.map((c) => ({
      sha: c.sha,
      shortSha: c.sha.slice(0, 7),
      message: c.commit.message.split("\n")[0]?.slice(0, 120) ?? "",
      author: c.commit.author.name,
      authorEmail: c.commit.author.email,
      date: c.commit.author.date,
      url: c.html_url,
    }));
  }

  async searchCode(params: {
    query: string;
    owner?: string;
    repo?: string;
    perPage?: number;
  }): Promise<GitHubCodeSearchResult> {
    if (!this.isLive) {
      return {
        totalCount: 2,
        items: [
          {
            name: "tool-registry.ts",
            path: "artifacts/api-server/src/lib/mastra/tool-registry.ts",
            repository: "szl-holdings/szl-platform",
            url: "https://github.com/szl-holdings/szl-platform/blob/main/artifacts/api-server/src/lib/mastra/tool-registry.ts",
            score: 1.0,
          },
        ],
      };
    }
    let q = params.query;
    if (params.owner && params.repo) q += ` repo:${params.owner}/${params.repo}`;
    else if (params.owner) q += ` user:${params.owner}`;
    const perPage = params.perPage ?? 10;
    const data = (await this.ghRequest(
      `/search/code?q=${encodeURIComponent(q)}&per_page=${perPage}`
    )) as {
      total_count: number;
      items: Array<{
        name: string;
        path: string;
        repository: { full_name: string };
        html_url: string;
        score: number;
      }>;
    };
    return {
      totalCount: data.total_count,
      items: data.items.map((i) => ({
        name: i.name,
        path: i.path,
        repository: i.repository.full_name,
        url: i.html_url,
        score: i.score,
      })),
    };
  }

  async triggerWorkflowDispatch(params: {
    owner: string;
    repo: string;
    workflowId: string;
    ref: string;
    inputs?: Record<string, string>;
  }): Promise<{ triggered: boolean; workflowId: string; ref: string }> {
    if (!this.isLive) {
      return { triggered: true, workflowId: params.workflowId, ref: params.ref };
    }
    await this.ghRequest(
      `/repos/${params.owner}/${params.repo}/actions/workflows/${params.workflowId}/dispatches`,
      {
        method: "POST",
        body: JSON.stringify({ ref: params.ref, inputs: params.inputs ?? {} }),
      }
    );
    return { triggered: true, workflowId: params.workflowId, ref: params.ref };
  }

  async listWorkflowRuns(params: {
    owner: string;
    repo: string;
    workflowId?: string;
    status?: string;
    perPage?: number;
  }): Promise<GitHubWorkflowRun[]> {
    if (!this.isLive) {
      return [
        {
          id: 99001,
          name: "CI",
          status: "completed",
          conclusion: "success",
          branch: "main",
          event: "push",
          createdAt: "2026-04-12T07:00:00Z",
          updatedAt: "2026-04-12T07:15:00Z",
          url: "https://github.com/szl-holdings/szl-platform/actions/runs/99001",
        },
      ];
    }
    const perPage = params.perPage ?? 10;
    const basePath = params.workflowId
      ? `/repos/${params.owner}/${params.repo}/actions/workflows/${params.workflowId}/runs`
      : `/repos/${params.owner}/${params.repo}/actions/runs`;
    let path = `${basePath}?per_page=${perPage}`;
    if (params.status) path += `&status=${encodeURIComponent(params.status)}`;
    const data = (await this.ghRequest(path)) as {
      workflow_runs: Array<{
        id: number;
        name: string;
        status: string;
        conclusion: string | null;
        head_branch: string;
        event: string;
        created_at: string;
        updated_at: string;
        html_url: string;
      }>;
    };
    return data.workflow_runs.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      conclusion: r.conclusion,
      branch: r.head_branch,
      event: r.event,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      url: r.html_url,
    }));
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<GitHubWebhookEvent> {
    return {
      id: `gh_evt_${Date.now()}`,
      type: (payload["action"] as string) ?? "unknown",
      repo: ((payload["repository"] as Record<string, unknown>)?.["full_name"] as string) ?? "unknown",
      action: (payload["action"] as string) ?? "unknown",
      timestamp: new Date().toISOString(),
    };
  }

  private mapIssue(i: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: string;
    user: { login: string };
    labels: Array<{ name: string }>;
    assignees: Array<{ login: string }>;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    html_url: string;
  }): GitHubIssue {
    return {
      id: i.id,
      number: i.number,
      title: i.title,
      body: i.body,
      state: i.state,
      author: i.user.login,
      labels: i.labels.map((l) => l.name),
      assignees: i.assignees.map((a) => a.login),
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      closedAt: i.closed_at,
      url: i.html_url,
    };
  }
}
