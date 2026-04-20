import { logger } from '../lib/logger';

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

  const hostname = process.env['REPLIT_CONNECTORS_HOSTNAME'];
  if (!hostname) {
    throw new Error(
      'REPLIT_CONNECTORS_HOSTNAME is not set — Linear connector is unavailable in this environment',
    );
  }

  const xReplitToken = process.env['REPL_IDENTITY']
    ? `repl ${process.env['REPL_IDENTITY']}`
    : process.env['WEB_REPL_RENEWAL']
      ? `depl ${process.env['WEB_REPL_RENEWAL']}`
      : null;

  if (!xReplitToken) {
    throw new Error(
      'X_REPLIT_TOKEN not found — Linear connector is unavailable in this environment',
    );
  }

  const url = `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=linear`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json', X_REPLIT_TOKEN: xReplitToken },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Failed to fetch Linear connection (${response.status}): ${text.slice(0, 200)}`,
    );
  }

  const data = (await response.json()) as ReplitConnectionPayload;
  const item = data.items?.[0];
  const settings = item?.settings;
  const accessToken = settings?.access_token ?? settings?.oauth?.credentials?.access_token ?? null;
  const expiresAtRaw = settings?.expires_at ?? settings?.oauth?.credentials?.expires_at;

  if (!accessToken) {
    throw new Error(
      'Linear connection is not authorized — connect Linear in Replit integrations to enable ticket creation',
    );
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
  const response = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Linear GraphQL request failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const payload = (await response.json()) as LinearGraphQLResponse<T>;
  if (payload.errors?.length) {
    throw new Error(`Linear GraphQL error: ${payload.errors.map((e) => e.message).join('; ')}`);
  }
  if (!payload.data) {
    throw new Error('Linear GraphQL response missing data');
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
    throw new Error('No Linear teams available for the connected workspace');
  }
  if (preferredKey) {
    const match = teams.find((t) => t.key.toLowerCase() === preferredKey.toLowerCase());
    if (match) return match;
  }
  return teams[0]!;
}

interface LinearLabel {
  id: string;
  name: string;
  team: { id: string } | null;
}

interface ResolvedLabels {
  // Labels we already had IDs for (existed in the workspace).
  matched: Array<{ id: string; name: string }>;
  // Names that did not match any existing label.
  missing: string[];
}

async function resolveLabels(teamId: string, names: string[]): Promise<ResolvedLabels> {
  if (names.length === 0) return { matched: [], missing: [] };
  const data = await linearGraphQL<{ issueLabels: { nodes: LinearLabel[] } }>(
    `query Labels { issueLabels(first: 250) { nodes { id name team { id } } } }`,
    {},
  );
  const wanted = new Map<string, string>(); // lowercase -> original casing
  for (const n of names) {
    const key = n.toLowerCase();
    if (!wanted.has(key)) wanted.set(key, n);
  }
  const candidates = data.issueLabels.nodes.filter(
    (l) => wanted.has(l.name.toLowerCase()) && (l.team === null || l.team.id === teamId),
  );
  // De-dup by name; prefer team-scoped over workspace-scoped when both exist.
  const byName = new Map<string, LinearLabel>();
  for (const m of candidates) {
    const key = m.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing || (existing.team === null && m.team?.id === teamId)) {
      byName.set(key, m);
    }
  }
  const matched = Array.from(byName.values()).map((l) => ({ id: l.id, name: l.name }));
  const matchedKeys = new Set(byName.keys());
  const missing: string[] = [];
  for (const [key, original] of wanted.entries()) {
    if (!matchedKeys.has(key)) missing.push(original);
  }
  return { matched, missing };
}

// Deterministic pastel-on-dark palette for auto-created labels: same name
// always gets the same color, so labels stay visually consistent across runs.
const LABEL_COLOR_PALETTE = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
];

function colorForLabelName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % LABEL_COLOR_PALETTE.length;
  return LABEL_COLOR_PALETTE[idx]!;
}

async function createLinearLabel(
  teamId: string,
  name: string,
): Promise<{ id: string; name: string }> {
  const mutation = `
    mutation CreateLabel($input: IssueLabelCreateInput!) {
      issueLabelCreate(input: $input) {
        success
        issueLabel { id name }
      }
    }
  `;
  const data = await linearGraphQL<{
    issueLabelCreate: { success: boolean; issueLabel: { id: string; name: string } | null };
  }>(mutation, {
    input: { teamId, name, color: colorForLabelName(name) },
  });
  if (!data.issueLabelCreate.success || !data.issueLabelCreate.issueLabel) {
    throw new Error(`Linear rejected label creation for "${name}"`);
  }
  return data.issueLabelCreate.issueLabel;
}

async function findUserIdByName(name: string): Promise<string | null> {
  const data = await linearGraphQL<{
    users: { nodes: Array<{ id: string; name: string; displayName: string }> };
  }>(
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
  // Best-effort exact-match against existing Linear label `name`s. Behaviour
  // for names that don't match an existing label is controlled by
  // `autoCreateLabels`: when true (the default) the missing labels are created
  // in the resolved team with a deterministic colour; when false they are
  // returned in `skippedLabels` and the issue is created without them.
  labels?: string[];
  autoCreateLabels?: boolean;
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
  // Label names that were attached to the issue (existing matches).
  appliedLabels: string[];
  // Label names that were created on demand and attached to the issue.
  createdLabels: string[];
  // Label names that were requested but not attached (auto-create disabled
  // or label creation failed). Operators see these as a UI warning.
  skippedLabels: string[];
}

export async function createLinearIssue(
  input: CreateLinearIssueInput,
): Promise<CreatedLinearIssue> {
  const team = await getDefaultTeam(input.teamKey);
  let assigneeId: string | null = null;
  if (input.assigneeName) {
    try {
      assigneeId = await findUserIdByName(input.assigneeName);
    } catch (err) {
      logger.warn({ err, assignee: input.assigneeName }, 'linear: assignee lookup failed');
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

  const labelIds: string[] = [];
  const appliedLabels: string[] = [];
  const createdLabels: string[] = [];
  const skippedLabels: string[] = [];
  const autoCreate = input.autoCreateLabels !== false; // default true

  if (input.labels && input.labels.length > 0) {
    try {
      const resolved = await resolveLabels(team.id, input.labels);
      for (const m of resolved.matched) {
        labelIds.push(m.id);
        appliedLabels.push(m.name);
      }
      if (resolved.missing.length > 0) {
        if (autoCreate) {
          for (const name of resolved.missing) {
            try {
              const created = await createLinearLabel(team.id, name);
              labelIds.push(created.id);
              createdLabels.push(created.name);
            } catch (err) {
              logger.warn(
                { err, label: name, teamId: team.id },
                'linear: auto-create label failed',
              );
              skippedLabels.push(name);
            }
          }
        } else {
          skippedLabels.push(...resolved.missing);
        }
      }
    } catch (err) {
      logger.warn({ err, labels: input.labels }, 'linear: label lookup failed');
      // Lookup failed entirely — surface every requested label as skipped so
      // operators see why nothing got tagged instead of silently dropping them.
      skippedLabels.push(...input.labels);
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
    issueCreate: {
      success: boolean;
      issue: Omit<CreatedLinearIssue, 'appliedLabels' | 'createdLabels' | 'skippedLabels'>;
    };
  }>(mutation, variables);

  if (!data.issueCreate.success || !data.issueCreate.issue) {
    throw new Error('Linear rejected the issue creation request');
  }
  return {
    ...data.issueCreate.issue,
    appliedLabels,
    createdLabels,
    skippedLabels,
  };
}

export function isLinearConfigured(): boolean {
  return (
    Boolean(process.env['REPLIT_CONNECTORS_HOSTNAME']) &&
    Boolean(process.env['REPL_IDENTITY'] ?? process.env['WEB_REPL_RENEWAL'])
  );
}
