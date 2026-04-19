import { logger } from "../lib/logger";

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

interface ReplitConnectionPayload {
  items?: Array<{
    settings?: {
      access_token?: string;
      oauth?: { credentials?: { access_token?: string; expires_at?: string } };
      expires_at?: string;
    };
  }>;
}

async function getLinearAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const hostname = process.env["REPLIT_CONNECTORS_HOSTNAME"];
  if (!hostname) {
    throw new Error("REPLIT_CONNECTORS_HOSTNAME is not set — Linear connector is unavailable in this environment");
  }

  const xReplitToken = process.env["REPL_IDENTITY"]
    ? `repl ${process.env["REPL_IDENTITY"]}`
    : process.env["WEB_REPL_RENEWAL"]
      ? `depl ${process.env["WEB_REPL_RENEWAL"]}`
      : null;

  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found — Linear connector is unavailable in this environment");
  }

  const url = `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=linear`;
  const response = await fetch(url, {
    headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Failed to fetch Linear connection (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as ReplitConnectionPayload;
  const item = data.items?.[0];
  const settings = item?.settings;
  const accessToken =
    settings?.access_token ?? settings?.oauth?.credentials?.access_token ?? null;
  const expiresAtRaw = settings?.expires_at ?? settings?.oauth?.credentials?.expires_at;

  if (!accessToken) {
    throw new Error("Linear connection is not authorized — connect Linear in Replit integrations to enable ticket creation");
  }

  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw).getTime() : Date.now() + 30 * 60_000;
  cachedAccessToken = { token: accessToken, expiresAt };
  return accessToken;
}

interface LinearGraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: unknown }>;
}

async function linearGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const token = await getLinearAccessToken();
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Linear GraphQL request failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const payload = (await response.json()) as LinearGraphQLResponse<T>;
  if (payload.errors?.length) {
    throw new Error(`Linear GraphQL error: ${payload.errors.map((e) => e.message).join("; ")}`);
  }
  if (!payload.data) {
    throw new Error("Linear GraphQL response missing data");
  }
  return payload.data;
}

export interface LinearTeam {
  id: string;
  key: string;
  name: string;
}

export async function listLinearTeams(): Promise<LinearTeam[]> {
  const data = await linearGraphQL<{ teams: { nodes: LinearTeam[] } }>(
    `query Teams { teams(first: 50) { nodes { id key name } } }`,
    {},
  );
  return data.teams.nodes ?? [];
}

async function getDefaultTeam(preferredKey?: string): Promise<LinearTeam> {
  const teams = await listLinearTeams();
  if (teams.length === 0) {
    throw new Error("No Linear teams available for the connected workspace");
  }
  if (preferredKey) {
    const match = teams.find((t) => t.key.toLowerCase() === preferredKey.toLowerCase());
    if (match) return match;
  }
  return teams[0]!;
}

interface LinearLabel { id: string; name: string; team: { id: string } | null }

async function findLabelIdsByNames(teamId: string, names: string[]): Promise<string[]> {
  if (names.length === 0) return [];
  const data = await linearGraphQL<{ issueLabels: { nodes: LinearLabel[] } }>(
    `query Labels { issueLabels(first: 250) { nodes { id name team { id } } } }`,
    {},
  );
  const wanted = new Set(names.map((n) => n.toLowerCase()));
  const matches = data.issueLabels.nodes.filter(
    (l) => wanted.has(l.name.toLowerCase()) && (l.team === null || l.team.id === teamId),
  );
  // De-dup by name; prefer team-scoped over workspace-scoped when both exist.
  const byName = new Map<string, LinearLabel>();
  for (const m of matches) {
    const key = m.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing || (existing.team === null && m.team?.id === teamId)) {
      byName.set(key, m);
    }
  }
  return Array.from(byName.values()).map((l) => l.id);
}

async function findUserIdByName(name: string): Promise<string | null> {
  const data = await linearGraphQL<{ users: { nodes: Array<{ id: string; name: string; displayName: string }> } }>(
    `query Users { users(first: 100, includeDisabled: false) { nodes { id name displayName } } }`,
    {},
  );
  const lower = name.toLowerCase();
  const match = data.users.nodes.find(
    (u) => u.name?.toLowerCase() === lower || u.displayName?.toLowerCase() === lower,
  );
  return match?.id ?? null;
}

export type LinearPriority = 0 | 1 | 2 | 3 | 4; // 0=No, 1=Urgent, 2=High, 3=Normal, 4=Low

export interface CreateLinearIssueInput {
  title: string;
  description?: string;
  priority?: LinearPriority;
  // Best-effort exact-match against Linear user `name` or `displayName`. If no
  // user matches, the issue is created unassigned (no error is raised).
  assigneeName?: string;
  teamKey?: string;
  // Best-effort exact-match against existing Linear label `name`s. Names that
  // do not match an existing label are silently skipped (no auto-create).
  labels?: string[];
}

export interface CreatedLinearIssue {
  id: string;
  identifier: string;
  url: string;
  title: string;
  priority: number;
  team: { id: string; key: string; name: string };
  assignee: { id: string; name: string } | null;
  createdAt: string;
}

export async function createLinearIssue(input: CreateLinearIssueInput): Promise<CreatedLinearIssue> {
  const team = await getDefaultTeam(input.teamKey);
  let assigneeId: string | null = null;
  if (input.assigneeName) {
    try {
      assigneeId = await findUserIdByName(input.assigneeName);
    } catch (err) {
      logger.warn({ err, assignee: input.assigneeName }, "linear: assignee lookup failed");
    }
  }

  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          url
          title
          priority
          createdAt
          team { id key name }
          assignee { id name }
        }
      }
    }
  `;

  let labelIds: string[] = [];
  if (input.labels && input.labels.length > 0) {
    try {
      labelIds = await findLabelIdsByNames(team.id, input.labels);
    } catch (err) {
      logger.warn({ err, labels: input.labels }, "linear: label lookup failed");
    }
  }

  const variables: Record<string, unknown> = {
    input: {
      teamId: team.id,
      title: input.title,
      description: input.description,
      priority: input.priority,
      assigneeId,
      labelIds: labelIds.length > 0 ? labelIds : undefined,
    },
  };

  const data = await linearGraphQL<{
    issueCreate: { success: boolean; issue: CreatedLinearIssue };
  }>(mutation, variables);

  if (!data.issueCreate.success || !data.issueCreate.issue) {
    throw new Error("Linear rejected the issue creation request");
  }
  return data.issueCreate.issue;
}

export function isLinearConfigured(): boolean {
  return Boolean(process.env["REPLIT_CONNECTORS_HOSTNAME"]) &&
    Boolean(process.env["REPL_IDENTITY"] ?? process.env["WEB_REPL_RENEWAL"]);
}
