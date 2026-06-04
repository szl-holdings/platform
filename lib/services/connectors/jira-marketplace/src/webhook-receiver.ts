import api, { route } from "@forge/api";

interface AlloyRunCompletionPayload {
  runId: number;
  workflowId: number;
  workflowName: string;
  state: "completed" | "failed" | "canceled";
  durationMs: number;
  output?: Record<string, unknown>;
  metadata?: {
    jiraIssueKey?: string;
    jiraIssueId?: string;
  };
}

export async function handler(event: { payload: AlloyRunCompletionPayload }) {
  const { payload } = event;
  const issueKey = payload.metadata?.jiraIssueKey;
  if (!issueKey) return { statusCode: 200, body: "No issue key — skipping" };

  const stateEmoji = payload.state === "completed" ? "✅" : payload.state === "failed" ? "❌" : "⚠️";
  const comment = {
    body: {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `${stateEmoji} Alloy workflow "${payload.workflowName}" ${payload.state} in ${Math.round(payload.durationMs / 1000)}s (Run #${payload.runId})`,
            },
          ],
        },
        payload.output?.summary
          ? {
              type: "paragraph",
              content: [{ type: "text", text: String(payload.output.summary) }],
            }
          : null,
      ].filter(Boolean),
    },
  };

  const res = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(comment),
  });

  if (!res.ok) {
    console.error(`Failed to add comment to ${issueKey}: ${res.status}`);
    return { statusCode: 500, body: "Failed to add Jira comment" };
  }

  return { statusCode: 200, body: "Comment added" };
}
