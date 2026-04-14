import { BaseConnectorAdapter } from "../connector-interface.js";
import type { ConnectorAuthConfig, ConnectorRateLimitConfig, ConnectorToolDefinition } from "../connector-interface.js";

export class SlackConnectorAdapter extends BaseConnectorAdapter {
  connectorId = "slack";
  displayName = "Slack";
  description = "Slack messaging — send messages, create channels, post to webhooks";
  category = "communication" as const;
  vendor = "Salesforce / Slack";
  version = "1.0.0";
  docsUrl = "https://api.slack.com/methods";

  authConfig: ConnectorAuthConfig = {
    type: "bearer",
    envVarNames: ["SLACK_BOT_TOKEN"],
  };

  rateLimit: ConnectorRateLimitConfig = {
    requestsPerMinute: 60,
    burstLimit: 100,
  };

  tools: ConnectorToolDefinition[] = [
    {
      name: "send_message",
      description: "Send a message to a Slack channel or user",
      inputSchema: {
        type: "object",
        required: ["channel", "text"],
        properties: {
          channel: { type: "string" },
          text: { type: "string" },
          blocks: { type: "array" },
          thread_ts: { type: "string" },
        },
      },
      outputSchema: { type: "object", properties: { ok: { type: "boolean" }, ts: { type: "string" } } },
      costEstimate: "free",
    },
    {
      name: "post_webhook",
      description: "Post a message via a Slack incoming webhook",
      inputSchema: {
        type: "object",
        required: ["webhookUrl", "text"],
        properties: {
          webhookUrl: { type: "string" },
          text: { type: "string" },
          username: { type: "string" },
          icon_emoji: { type: "string" },
          attachments: { type: "array" },
        },
      },
      outputSchema: { type: "object", properties: { ok: { type: "boolean" } } },
      costEstimate: "free",
    },
    {
      name: "get_channel_history",
      description: "Retrieve recent messages from a Slack channel",
      inputSchema: {
        type: "object",
        required: ["channel"],
        properties: {
          channel: { type: "string" },
          limit: { type: "number" },
          oldest: { type: "string" },
        },
      },
      outputSchema: { type: "object", properties: { messages: { type: "array" }, has_more: { type: "boolean" } } },
      costEstimate: "free",
    },
  ];

  async execute(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    const headers = { ...this.getAuthHeaders(), "Content-Type": "application/json" };

    if (toolName === "send_message") {
      const resp = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers,
        body: JSON.stringify({ channel: input.channel, text: input.text, blocks: input.blocks, thread_ts: input.thread_ts }),
      });
      return resp.json();
    }

    if (toolName === "post_webhook") {
      const webhookUrl = input.webhookUrl as string;
      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.text, username: input.username, icon_emoji: input.icon_emoji, attachments: input.attachments }),
      });
      return { ok: resp.ok };
    }

    if (toolName === "get_channel_history") {
      const params = new URLSearchParams({ channel: input.channel as string, limit: String(input.limit ?? 10) });
      if (input.oldest) params.set("oldest", input.oldest as string);
      const resp = await fetch(`https://slack.com/api/conversations.history?${params}`, { headers });
      return resp.json();
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }
}
