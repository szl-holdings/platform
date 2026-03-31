import { ServiceAdapter } from "../base.js";

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectType: string;
  lead: string | null;
  description: string | null;
  avatarUrl: string | null;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  status: string;
  statusCategory: "To Do" | "In Progress" | "Done";
  priority: string;
  issueType: string;
  assignee: string | null;
  reporter: string | null;
  projectKey: string;
  projectName: string;
  labels: string[];
  created: string;
  updated: string;
  dueDate: string | null;
  storyPoints: number | null;
  sprint: string | null;
  blockers: string[];
}

export interface JiraSprint {
  id: number;
  name: string;
  state: "active" | "future" | "closed";
  startDate: string | null;
  endDate: string | null;
  boardId: number;
  goal: string | null;
  completedIssues: number;
  totalIssues: number;
  storyPointsCompleted: number;
  storyPointsTotal: number;
}

export interface JiraSprintHealth {
  sprint: JiraSprint;
  burndownRisk: "on_track" | "at_risk" | "behind";
  completionPercentage: number;
  blockedIssues: number;
  overdueIssues: number;
  daysRemaining: number;
  velocityEstimate: number;
  projectedCompletion: number;
}

export interface JiraSignal {
  id: string;
  type: "sprint_burndown_risk" | "blocked_issues" | "sla_breach" | "overdue_items";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  projectKey: string;
  sprintName?: string;
  issueKeys?: string[];
  metadata: Record<string, unknown>;
  occurredAt: string;
}

export interface JiraWebhookEvent {
  id: string;
  webhookEvent: string;
  issue?: JiraIssue;
  changelog?: {
    items: Array<{ field: string; fromString: string | null; toString: string | null }>;
  };
  timestamp: string;
  source: string;
}

export interface JiraConnectionStatus {
  connected: boolean;
  serverTitle?: string;
  version?: string;
  baseUrl?: string;
  userName?: string;
}

const MOCK_PROJECTS: JiraProject[] = [
  {
    id: "10001",
    key: "LYTE",
    name: "Lyte Command Center",
    projectType: "software",
    lead: "alice.chen@szl.example.com",
    description: "Feature development for the Lyte Command Center platform",
    avatarUrl: null,
  },
  {
    id: "10002",
    key: "VESSEL",
    name: "Vessels Maritime Intelligence",
    projectType: "software",
    lead: "bob.martinez@szl.example.com",
    description: "Maritime intelligence platform development and operations",
    avatarUrl: null,
  },
  {
    id: "10003",
    key: "ALLOY",
    name: "AlloyScape Execution Fabric",
    projectType: "software",
    lead: "carol.wu@szl.example.com",
    description: "Alloy workflow engine and orchestration platform",
    avatarUrl: null,
  },
  {
    id: "10004",
    key: "OPS",
    name: "Platform Operations",
    projectType: "service_desk",
    lead: "dan.jones@szl.example.com",
    description: "Cross-platform operational incidents and SRE work",
    avatarUrl: null,
  },
];

const MOCK_ISSUES: JiraIssue[] = [
  {
    id: "20001",
    key: "LYTE-142",
    summary: "Signal ingestion pipeline — handle Salesforce CDC events",
    status: "In Progress",
    statusCategory: "In Progress",
    priority: "High",
    issueType: "Story",
    assignee: "alice.chen@szl.example.com",
    reporter: "product@szl.example.com",
    projectKey: "LYTE",
    projectName: "Lyte Command Center",
    labels: ["salesforce", "integration", "signals"],
    created: "2026-03-20T09:00:00Z",
    updated: "2026-03-29T14:00:00Z",
    dueDate: "2026-04-05",
    storyPoints: 8,
    sprint: "Sprint 24",
    blockers: ["LYTE-139"],
  },
  {
    id: "20002",
    key: "LYTE-143",
    summary: "Value-at-Risk calculation — Salesforce opportunity feed",
    status: "To Do",
    statusCategory: "To Do",
    priority: "High",
    issueType: "Story",
    assignee: null,
    reporter: "product@szl.example.com",
    projectKey: "LYTE",
    projectName: "Lyte Command Center",
    labels: ["salesforce", "var", "finance"],
    created: "2026-03-22T10:00:00Z",
    updated: "2026-03-28T09:00:00Z",
    dueDate: "2026-04-10",
    storyPoints: 5,
    sprint: "Sprint 24",
    blockers: ["LYTE-142"],
  },
  {
    id: "20003",
    key: "VESSEL-88",
    summary: "Port ETA refresh — stale data after storm advisory",
    status: "In Progress",
    statusCategory: "In Progress",
    priority: "Critical",
    issueType: "Bug",
    assignee: "bob.martinez@szl.example.com",
    reporter: "ops@szl.example.com",
    projectKey: "VESSEL",
    projectName: "Vessels Maritime Intelligence",
    labels: ["eta", "data-quality", "urgent"],
    created: "2026-03-28T07:00:00Z",
    updated: "2026-03-30T16:00:00Z",
    dueDate: "2026-03-31",
    storyPoints: 3,
    sprint: "Sprint 24",
    blockers: [],
  },
  {
    id: "20004",
    key: "ALLOY-55",
    summary: "Workflow orchestration — Salesforce deal closed trigger",
    status: "To Do",
    statusCategory: "To Do",
    priority: "Medium",
    issueType: "Feature",
    assignee: "carol.wu@szl.example.com",
    reporter: "product@szl.example.com",
    projectKey: "ALLOY",
    projectName: "AlloyScape Execution Fabric",
    labels: ["salesforce", "workflow", "automation"],
    created: "2026-03-25T11:00:00Z",
    updated: "2026-03-29T11:00:00Z",
    dueDate: "2026-04-15",
    storyPoints: 13,
    sprint: "Sprint 25",
    blockers: [],
  },
  {
    id: "20005",
    key: "OPS-201",
    summary: "SLA breach — API p99 latency exceeds 800ms threshold",
    status: "In Progress",
    statusCategory: "In Progress",
    priority: "Critical",
    issueType: "Incident",
    assignee: "dan.jones@szl.example.com",
    reporter: "monitoring@szl.example.com",
    projectKey: "OPS",
    projectName: "Platform Operations",
    labels: ["sla", "latency", "incident"],
    created: "2026-03-30T06:00:00Z",
    updated: "2026-03-30T18:00:00Z",
    dueDate: "2026-03-30",
    storyPoints: null,
    sprint: null,
    blockers: [],
  },
];

const MOCK_SPRINTS: JiraSprint[] = [
  {
    id: 24,
    name: "Sprint 24",
    state: "active",
    startDate: "2026-03-23T09:00:00Z",
    endDate: "2026-04-05T18:00:00Z",
    boardId: 1,
    goal: "Deliver Salesforce connector MVP and stabilize vessel ETA pipeline",
    completedIssues: 8,
    totalIssues: 14,
    storyPointsCompleted: 31,
    storyPointsTotal: 55,
  },
  {
    id: 25,
    name: "Sprint 25",
    state: "future",
    startDate: "2026-04-06T09:00:00Z",
    endDate: "2026-04-19T18:00:00Z",
    boardId: 1,
    goal: "Jira integration bidirectional sync and Alloy workflow orchestration",
    completedIssues: 0,
    totalIssues: 10,
    storyPointsCompleted: 0,
    storyPointsTotal: 47,
  },
];

function computeSprintHealth(sprint: JiraSprint): JiraSprintHealth {
  const now = new Date();
  const start = sprint.startDate ? new Date(sprint.startDate) : now;
  const end = sprint.endDate ? new Date(sprint.endDate) : now;
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(0, Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const timeProgress = Math.min(1, daysElapsed / totalDays);
  const workProgress = sprint.storyPointsTotal > 0 ? sprint.storyPointsCompleted / sprint.storyPointsTotal : 0;

  let burndownRisk: "on_track" | "at_risk" | "behind";
  if (workProgress >= timeProgress - 0.05) {
    burndownRisk = "on_track";
  } else if (workProgress >= timeProgress - 0.2) {
    burndownRisk = "at_risk";
  } else {
    burndownRisk = "behind";
  }

  const sprintIssues = MOCK_ISSUES.filter((i) => i.sprint === sprint.name);
  const blockedIssues = sprintIssues.filter((i) => i.blockers.length > 0).length;
  const overdueIssues = sprintIssues.filter(
    (i) => i.dueDate && new Date(i.dueDate) < now && i.statusCategory !== "Done",
  ).length;

  const velocityEstimate =
    daysRemaining > 0
      ? sprint.storyPointsCompleted + Math.round((sprint.storyPointsCompleted / Math.max(1, daysElapsed)) * daysRemaining)
      : sprint.storyPointsCompleted;

  return {
    sprint,
    burndownRisk,
    completionPercentage: Math.round(workProgress * 100),
    blockedIssues,
    overdueIssues,
    daysRemaining,
    velocityEstimate,
    projectedCompletion: Math.round((velocityEstimate / Math.max(1, sprint.storyPointsTotal)) * 100),
  };
}

function generateSignalsFromMockData(): JiraSignal[] {
  const signals: JiraSignal[] = [];
  const now = new Date().toISOString();

  for (const sprint of MOCK_SPRINTS.filter((s) => s.state === "active")) {
    const health = computeSprintHealth(sprint);
    if (health.burndownRisk !== "on_track") {
      signals.push({
        id: `jira_signal_sprint_${sprint.id}`,
        type: "sprint_burndown_risk",
        title: `Sprint Burndown Risk: ${sprint.name}`,
        description: `${sprint.name} is ${health.burndownRisk}. ${health.completionPercentage}% complete with ${health.daysRemaining} days remaining. Projected completion: ${health.projectedCompletion}%.`,
        severity: health.burndownRisk === "behind" ? "critical" : "warning",
        projectKey: "LYTE",
        sprintName: sprint.name,
        metadata: {
          sprintId: sprint.id,
          completionPercentage: health.completionPercentage,
          daysRemaining: health.daysRemaining,
          blockedIssues: health.blockedIssues,
          projectedCompletion: health.projectedCompletion,
        },
        occurredAt: now,
      });
    }

    if (health.blockedIssues > 0) {
      const blocked = MOCK_ISSUES.filter((i) => i.sprint === sprint.name && i.blockers.length > 0);
      signals.push({
        id: `jira_signal_blocked_${sprint.id}`,
        type: "blocked_issues",
        title: `Blocked Issues in ${sprint.name}`,
        description: `${health.blockedIssues} issue(s) blocked in active sprint: ${blocked.map((i) => i.key).join(", ")}.`,
        severity: "warning",
        projectKey: "LYTE",
        sprintName: sprint.name,
        issueKeys: blocked.map((i) => i.key),
        metadata: { sprintId: sprint.id, blockedIssues: health.blockedIssues, issueKeys: blocked.map((i) => i.key) },
        occurredAt: now,
      });
    }
  }

  const slaIssues = MOCK_ISSUES.filter(
    (i) => i.labels.includes("sla") && i.statusCategory !== "Done",
  );
  for (const issue of slaIssues) {
    signals.push({
      id: `jira_signal_sla_${issue.id}`,
      type: "sla_breach",
      title: `SLA Breach Risk: ${issue.key}`,
      description: `${issue.summary} — priority ${issue.priority} ticket is in progress with potential SLA breach.`,
      severity: issue.priority === "Critical" ? "critical" : "warning",
      projectKey: issue.projectKey,
      issueKeys: [issue.key],
      metadata: { issueId: issue.id, issueKey: issue.key, priority: issue.priority, status: issue.status },
      occurredAt: issue.updated,
    });
  }

  const now2 = new Date();
  const overdueIssues = MOCK_ISSUES.filter(
    (i) => i.dueDate && new Date(i.dueDate) < now2 && i.statusCategory !== "Done",
  );
  if (overdueIssues.length > 0) {
    signals.push({
      id: `jira_signal_overdue_${Date.now()}`,
      type: "overdue_items",
      title: `${overdueIssues.length} Overdue Issue(s) Detected`,
      description: `Overdue issues: ${overdueIssues.map((i) => i.key).join(", ")}.`,
      severity: overdueIssues.some((i) => i.priority === "Critical") ? "critical" : "warning",
      projectKey: overdueIssues[0]?.projectKey ?? "UNKNOWN",
      issueKeys: overdueIssues.map((i) => i.key),
      metadata: { count: overdueIssues.length, issueKeys: overdueIssues.map((i) => i.key) },
      occurredAt: now,
    });
  }

  return signals;
}

export class JiraAdapter extends ServiceAdapter {
  readonly name = "jira";
  readonly description = "Jira Cloud — projects, issues, sprints, and delivery execution signals";
  readonly requiredEnvVars = ["JIRA_BASE_URL", "JIRA_API_TOKEN", "JIRA_USER_EMAIL"];

  private get baseUrl(): string | undefined {
    return process.env["JIRA_BASE_URL"];
  }

  private get apiToken(): string | undefined {
    return process.env["JIRA_API_TOKEN"];
  }

  private get userEmail(): string | undefined {
    return process.env["JIRA_USER_EMAIL"];
  }

  private get authHeader(): string {
    const credentials = `${this.userEmail}:${this.apiToken}`;
    return `Basic ${Buffer.from(credentials).toString("base64")}`;
  }

  private async jiraRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}/rest/api/3${path}`, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options?.headers,
      },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Jira API error: ${response.status} ${response.statusText} — ${body}`);
    }
    return response.json() as Promise<T>;
  }

  protected async performHealthCheck(): Promise<void> {
    const status = await this.testConnection();
    if (!status.connected) throw new Error("Jira connection verification failed");
  }

  async testConnection(): Promise<JiraConnectionStatus> {
    if (!this.isLive) return { connected: false };
    try {
      const data = await this.jiraRequest<{
        serverTitle?: string;
        version?: string;
        baseUrl?: string;
        deploymentType?: string;
      }>("/serverInfo");
      const user = await this.jiraRequest<{ displayName?: string }>("/myself");
      return {
        connected: true,
        serverTitle: data.serverTitle,
        version: data.version,
        baseUrl: data.baseUrl,
        userName: user.displayName,
      };
    } catch {
      return { connected: false };
    }
  }

  async listProjects(limit = 50): Promise<JiraProject[]> {
    if (!this.isLive) return [...MOCK_PROJECTS];
    const data = await this.jiraRequest<{
      values: Array<{
        id: string;
        key: string;
        name: string;
        projectTypeKey: string;
        lead?: { displayName: string };
        description?: string;
        avatarUrls?: Record<string, string>;
      }>;
    }>(`/project/search?maxResults=${limit}&expand=lead,description`);
    return data.values.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      projectType: p.projectTypeKey,
      lead: p.lead?.displayName ?? null,
      description: p.description ?? null,
      avatarUrl: p.avatarUrls?.["48x48"] ?? null,
    }));
  }

  async searchIssues(jql: string, limit = 50): Promise<JiraIssue[]> {
    if (!this.isLive) {
      const keywords = jql.toLowerCase();
      return MOCK_ISSUES.filter((i) => {
        if (keywords.includes("sprint =") && i.sprint) return true;
        if (keywords.includes("blocked") && i.blockers.length > 0) return true;
        return true;
      }).slice(0, limit);
    }
    const data = await this.jiraRequest<{
      issues: Array<{
        id: string;
        key: string;
        fields: {
          summary: string;
          status: { name: string; statusCategory: { name: string } };
          priority: { name: string };
          issuetype: { name: string };
          assignee: { displayName: string } | null;
          reporter: { displayName: string } | null;
          project: { key: string; name: string };
          labels: string[];
          created: string;
          updated: string;
          duedate: string | null;
          story_points?: number | null;
          customfield_10016?: number | null;
          sprint?: { name: string } | null;
          customfield_10020?: Array<{ name: string; state: string }> | null;
          issuelinks?: Array<{ type: { name: string }; outwardIssue?: { key: string }; inwardIssue?: { key: string } }>;
        };
      }>;
    }>(`/search?jql=${encodeURIComponent(jql)}&maxResults=${limit}&fields=summary,status,priority,issuetype,assignee,reporter,project,labels,created,updated,duedate,customfield_10016,customfield_10020,issuelinks`);

    return data.issues.map((i) => {
      const sprintField = i.fields.customfield_10020;
      const activeSprint = Array.isArray(sprintField)
        ? sprintField.find((s) => s.state === "active") ?? sprintField[0]
        : null;
      const blockers = (i.fields.issuelinks ?? [])
        .filter((l) => l.type.name === "Blocks" && l.inwardIssue)
        .map((l) => l.inwardIssue!.key);

      const catName = i.fields.status.statusCategory.name;
      let statusCategory: "To Do" | "In Progress" | "Done" = "To Do";
      if (catName === "In Progress") statusCategory = "In Progress";
      else if (catName === "Done") statusCategory = "Done";

      return {
        id: i.id,
        key: i.key,
        summary: i.fields.summary,
        status: i.fields.status.name,
        statusCategory,
        priority: i.fields.priority.name,
        issueType: i.fields.issuetype.name,
        assignee: i.fields.assignee?.displayName ?? null,
        reporter: i.fields.reporter?.displayName ?? null,
        projectKey: i.fields.project.key,
        projectName: i.fields.project.name,
        labels: i.fields.labels,
        created: i.fields.created,
        updated: i.fields.updated,
        dueDate: i.fields.duedate ?? null,
        storyPoints: (i.fields.customfield_10016 as number | null) ?? null,
        sprint: activeSprint?.name ?? null,
        blockers,
      };
    });
  }

  async getActiveSprints(boardId?: number): Promise<JiraSprint[]> {
    if (!this.isLive) return MOCK_SPRINTS.filter((s) => s.state === "active");
    if (!boardId) return MOCK_SPRINTS.filter((s) => s.state === "active");
    const data = await this.jiraRequest<{
      values: Array<{
        id: number;
        name: string;
        state: string;
        startDate?: string;
        endDate?: string;
        goal?: string;
      }>;
    }>(`/board/${boardId}/sprint?state=active`);
    return data.values.map((s) => ({
      id: s.id,
      name: s.name,
      state: s.state as "active" | "future" | "closed",
      startDate: s.startDate ?? null,
      endDate: s.endDate ?? null,
      boardId: boardId ?? 0,
      goal: s.goal ?? null,
      completedIssues: 0,
      totalIssues: 0,
      storyPointsCompleted: 0,
      storyPointsTotal: 0,
    }));
  }

  async getSprintHealth(sprintId?: number): Promise<JiraSprintHealth[]> {
    const sprints = await this.getActiveSprints();
    const targetSprints = sprintId ? sprints.filter((s) => s.id === sprintId) : sprints;
    return targetSprints.map((s) => computeSprintHealth(s));
  }

  async ingestSignals(): Promise<JiraSignal[]> {
    if (!this.isLive) return generateSignalsFromMockData();

    const signals: JiraSignal[] = [];
    const now = new Date().toISOString();

    try {
      const sprints = await this.getActiveSprints();
      for (const sprint of sprints) {
        const health = computeSprintHealth(sprint);
        if (health.burndownRisk !== "on_track") {
          signals.push({
            id: `jira_signal_sprint_${sprint.id}`,
            type: "sprint_burndown_risk",
            title: `Sprint Burndown Risk: ${sprint.name}`,
            description: `${sprint.name} is ${health.burndownRisk}. ${health.completionPercentage}% complete with ${health.daysRemaining} days remaining.`,
            severity: health.burndownRisk === "behind" ? "critical" : "warning",
            projectKey: "UNKNOWN",
            sprintName: sprint.name,
            metadata: { sprintId: sprint.id, completionPercentage: health.completionPercentage, daysRemaining: health.daysRemaining },
            occurredAt: now,
          });
        }
      }

      const blockedIssues = await this.searchIssues('status = "In Progress" AND issueType != Epic AND "Flagged" = Impediment ORDER BY priority DESC', 20);
      if (blockedIssues.length > 0) {
        signals.push({
          id: `jira_signal_blocked_${Date.now()}`,
          type: "blocked_issues",
          title: `${blockedIssues.length} Blocked Issue(s) Detected`,
          description: `Issues flagged as blocked: ${blockedIssues.map((i) => i.key).join(", ")}.`,
          severity: blockedIssues.some((i) => i.priority === "Critical") ? "critical" : "warning",
          projectKey: blockedIssues[0]?.projectKey ?? "UNKNOWN",
          issueKeys: blockedIssues.map((i) => i.key),
          metadata: { count: blockedIssues.length },
          occurredAt: now,
        });
      }
    } catch {
      return generateSignalsFromMockData();
    }

    return signals;
  }

  async createIssue(params: {
    projectKey: string;
    summary: string;
    description?: string;
    issueType?: string;
    priority?: "Highest" | "High" | "Medium" | "Low" | "Lowest";
    labels?: string[];
    assigneeEmail?: string;
  }): Promise<{ id: string; key: string; url: string }> {
    if (!this.isLive) {
      const mockKey = `${params.projectKey}-${Math.floor(Math.random() * 900) + 100}`;
      return { id: `mock_${Date.now()}`, key: mockKey, url: `${this.baseUrl ?? "https://jira.example.com"}/browse/${mockKey}` };
    }
    const response = await this.jiraRequest<{ id: string; key: string; self: string }>("/issue", {
      method: "POST",
      body: JSON.stringify({
        fields: {
          project: { key: params.projectKey },
          summary: params.summary,
          description: params.description
            ? {
                type: "doc",
                version: 1,
                content: [
                  { type: "paragraph", content: [{ type: "text", text: params.description }] },
                ],
              }
            : undefined,
          issuetype: { name: params.issueType ?? "Task" },
          priority: params.priority ? { name: params.priority } : undefined,
          labels: params.labels ?? [],
        },
      }),
    });
    return {
      id: response.id,
      key: response.key,
      url: `${this.baseUrl}/browse/${response.key}`,
    };
  }

  async transitionIssue(issueKey: string, transitionName: string): Promise<void> {
    if (!this.isLive) return;
    const transitions = await this.jiraRequest<{ transitions: Array<{ id: string; name: string }> }>(
      `/issue/${issueKey}/transitions`,
    );
    const target = transitions.transitions.find(
      (t) => t.name.toLowerCase() === transitionName.toLowerCase(),
    );
    if (!target) throw new Error(`Transition "${transitionName}" not found for issue ${issueKey}`);
    await this.jiraRequest(`/issue/${issueKey}/transitions`, {
      method: "POST",
      body: JSON.stringify({ transition: { id: target.id } }),
    });
  }

  async handleWebhookEvent(payload: Record<string, unknown>): Promise<JiraWebhookEvent> {
    return {
      id: `jira_wh_${Date.now()}`,
      webhookEvent: (payload["webhookEvent"] as string) ?? "unknown",
      issue: undefined,
      changelog: (payload["changelog"] as JiraWebhookEvent["changelog"]) ?? undefined,
      timestamp: new Date().toISOString(),
      source: "jira",
    };
  }

  async sync(): Promise<{ projects: number; issues: number; signals: number; timestamp: string }> {
    const [projects, issues, signals] = await Promise.all([
      this.listProjects(20),
      this.searchIssues("project in (LYTE, VESSEL, ALLOY, OPS) AND statusCategory != Done ORDER BY updated DESC", 50),
      this.ingestSignals(),
    ]);
    return {
      projects: projects.length,
      issues: issues.length,
      signals: signals.length,
      timestamp: new Date().toISOString(),
    };
  }
}
