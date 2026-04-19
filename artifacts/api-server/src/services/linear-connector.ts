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

async function getDefaultTeam(preferredKey?: string): Promise<LinearTeam> {
  const data = await linearGraphQL<{ teams: { nodes: LinearTeam[] } }>(
    `query Teams { teams(first: 50) { nodes { id key name } } }`,
    {},
  );
  const teams = data.teams.nodes ?? [];
  if (teams.length === 0) {
    throw new Error("No Linear teams available for the connected workspace");
  }
  if (preferredKey) {
    const match = teams.find((t) => t.key.toLowerCase() === preferredKey.toLowerCase());
    if (match) return match;
  }
  return teams[0]!;
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

  const variables: Record<string, unknown> = {
    input: {
      teamId: team.id,
      title: input.title,
      description: input.description,
      priority: input.priority,
      assigneeId,
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
