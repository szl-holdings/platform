import api from "@forge/api";

const SZL_API_BASE = process.env.SZL_API_BASE ?? "https://api.szlholdings.com";
const SZL_INTERNAL_TOKEN = process.env.SZL_INTERNAL_TOKEN ?? "";

interface JiraIssueEvent {
  issue: {
    id: string;
    key: string;
    fields: {
      status: { name: string };
      summary: string;
      assignee?: { accountId: string; displayName: string };
      priority?: { name: string };
    };
  };
  changelog?: {
    items: Array<{ field: string; fromString?: string; toString?: string }>;
  };
}

export async function handler(event: JiraIssueEvent) {
  const { issue, changelog } = event;
  const statusChange = changelog?.items.find(item => item.field === "status");
  if (!statusChange) return;

  const payload = {
    source: "jira_forge",
    sourceType: "webhook",
    title: `Jira issue ${issue.key} status changed: ${statusChange.fromString} → ${statusChange.toString}`,
    severity: "info",
    body: JSON.stringify({
      issueKey: issue.key,
      issueId: issue.id,
      summary: issue.fields.summary,
      fromStatus: statusChange.fromString,
      toStatus: statusChange.toString,
      assignee: issue.fields.assignee?.displayName ?? null,
      priority: issue.fields.priority?.name ?? null,
      source: "jira_forge",
    }),
    metadata: {
      issueKey: issue.key,
      fromStatus: statusChange.fromString,
      toStatus: statusChange.toString,
    },
  };

  try {
    const res = await api.fetch(`${SZL_API_BASE}/api/alloy/ingest/signal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": SZL_INTERNAL_TOKEN,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`Failed to post Alloy signal: ${res.status}`);
    } else {
      console.log(`Alloy signal posted for issue ${issue.key} status change: ${statusChange.fromString} -> ${statusChange.toString}`);
    }
  } catch (err) {
    console.error("Error posting Alloy signal:", err);
  }
}
