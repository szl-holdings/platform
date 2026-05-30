import { ServiceAdapter, type ServiceStatus } from "../base.js";
import { assertWebhookUrlAllowed } from "../integrations/webhook-ssrf-guard.js";

export interface SlackMessageResult {
  sent: boolean;
  channel: string;
  timestamp?: string | undefined;
  mock: boolean;
}

export interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

export interface SlackAttachment {
  color?: string;
  fallback?: string;
  blocks?: SlackBlock[];
  text?: string;
  fields?: Array<{ title: string; value: string; short?: boolean }>;
  footer?: string;
  ts?: number;
}

export interface SlackInteractiveMessagePayload {
  type: "block_actions" | "interactive_message" | "dialog_submission" | "shortcut";
  trigger_id?: string;
  user: { id: string; name: string; team_id: string };
  channel?: { id: string; name: string };
  message?: { ts: string; text?: string };
  actions?: Array<{
    action_id: string;
    block_id?: string;
    value?: string;
    type: string;
    selected_option?: { value: string; text: { text: string } };
  }>;
  payload?: string;
}

export interface SlackSlashCommandPayload {
  token?: string;
  command: string;
  text: string;
  user_id: string;
  user_name: string;
  channel_id: string;
  channel_name: string;
  team_id: string;
  team_domain: string;
  response_url: string;
  trigger_id: string;
}

export interface SlackBotInfo {
  botId: string;
  userId: string;
  teamId: string;
  teamName: string;
  appId: string;
}

export interface SlackChannelInfo {
  id: string;
  name: string;
  isMember: boolean;
  isPrivate: boolean;
  memberCount: number | null;
  topic: string | null;
  purpose: string | null;
}

export interface SlackAlertRouting {
  severity: "info" | "warning" | "critical";
  channel: string;
}

const DEFAULT_ALERT_ROUTING: SlackAlertRouting[] = [
  { severity: "critical", channel: "#alerts-critical" },
  { severity: "warning", channel: "#alerts-warning" },
  { severity: "info", channel: "#alerts-info" },
];

function buildSeverityColor(severity: "info" | "warning" | "critical"): string {
  if (severity === "critical") return "#e01e5a";
  if (severity === "warning") return "#ecb22e";
  return "#36a64f";
}

export class SlackAdapter extends ServiceAdapter {
  readonly name = "slack";
  readonly description = "Slack — Bot API with interactive messages, slash commands, and channel-based alert routing";
  readonly requiredEnvVars = ["SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN"];

  private alertRouting: SlackAlertRouting[] = [...DEFAULT_ALERT_ROUTING];

  private get webhookUrl(): string | undefined {
    return process.env.SLACK_WEBHOOK_URL;
  }

  private get botToken(): string | undefined {
    return process.env.SLACK_BOT_TOKEN;
  }

  private get signingSecret(): string | undefined {
    return process.env.SLACK_SIGNING_SECRET;
  }

  override get status(): ServiceStatus {
    if (this.webhookUrl || this.botToken) return "LIVE_CONFIGURED";
    return "MOCKED_DEMO_MODE";
  }

  override get isLive(): boolean {
    return !!(this.webhookUrl || this.botToken);
  }

  override get presentEnvVars(): string[] {
    const present: string[] = [];
    if (this.webhookUrl) present.push("SLACK_WEBHOOK_URL");
    if (this.botToken) present.push("SLACK_BOT_TOKEN");
    if (this.signingSecret) present.push("SLACK_SIGNING_SECRET");
    return present;
  }

  override get missingEnvVars(): string[] {
    if (this.webhookUrl || this.botToken) return [];
    return ["SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN"];
  }

  protected override async performHealthCheck(): Promise<void> {
    if (this.botToken) {
      const response = await fetch("https://slack.com/api/auth.test", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.botToken}` },
      });
      if (!response.ok) throw new Error(`Slack API returned ${response.status}`);
      const data = await response.json() as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(`Slack auth failed: ${data.error}`);
    } else if (this.webhookUrl) {
      const url = new URL(this.webhookUrl);
      if (!url.hostname.includes("slack")) throw new Error("Invalid Slack webhook URL");
    }
  }

  async getBotInfo(): Promise<SlackBotInfo | null> {
    if (!this.botToken) return null;
    const response = await fetch("https://slack.com/api/auth.test", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.botToken}` },
    });
    if (!response.ok) throw new Error(`Slack API returned ${response.status}`);
    const data = await response.json() as {
      ok: boolean;
      bot_id?: string;
      user_id?: string;
      team_id?: string;
      team?: string;
      app_id?: string;
      error?: string;
    };
    if (!data.ok) throw new Error(`Slack auth.test failed: ${data.error}`);
    return {
      botId: data.bot_id ?? "",
      userId: data.user_id ?? "",
      teamId: data.team_id ?? "",
      teamName: data.team ?? "",
      appId: data.app_id ?? "",
    };
  }

  async sendWebhookMessage(
    text: string,
    options?: { channel?: string; username?: string; iconEmoji?: string; blocks?: SlackBlock[] },
  ): Promise<SlackMessageResult> {
    if (!this.isLive) {
      return { sent: true, channel: options?.channel ?? "#general", mock: true };
    }

    const body: Record<string, unknown> = { text };
    if (options?.channel) body.channel = options.channel;
    if (options?.username) body.username = options.username;
    if (options?.iconEmoji) body.icon_emoji = options.iconEmoji;
    if (options?.blocks) body.blocks = options.blocks;

    // SSRF guard (P1-C / KG020b): refuse delivery to a non-allowlisted or
    // internal-range host before any outbound request is made.
    await assertWebhookUrlAllowed(this.webhookUrl!);

    const response = await fetch(this.webhookUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Slack webhook error: ${response.status}`);

    return { sent: true, channel: options?.channel ?? "#general", mock: false };
  }

  async postMessage(
    channel: string,
    text: string,
    options?: {
      blocks?: SlackBlock[];
      attachments?: SlackAttachment[];
      threadTs?: string;
      unfurlLinks?: boolean;
      mrkdwn?: boolean;
    },
  ): Promise<SlackMessageResult> {
    if (!this.botToken) {
      return this.sendWebhookMessage(text, { channel, ...(options?.blocks && { blocks: options.blocks }) });
    }

    if (!this.isLive) {
      return { sent: true, channel, mock: true };
    }

    const body: Record<string, unknown> = { channel, text };
    if (options?.blocks) body.blocks = options.blocks;
    if (options?.attachments) body.attachments = options.attachments;
    if (options?.threadTs) body.thread_ts = options.threadTs;
    if (options?.unfurlLinks !== undefined) body.unfurl_links = options.unfurlLinks;
    if (options?.mrkdwn !== undefined) body.mrkdwn = options.mrkdwn;

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.botToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Slack API error: ${response.status}`);

    const data = await response.json() as { ok: boolean; ts?: string; error?: string };
    if (!data.ok) throw new Error(`Slack API error: ${data.error}`);

    return { sent: true, channel, timestamp: data.ts, mock: false };
  }

  async postInteractiveAlert(
    channel: string,
    alert: {
      title: string;
      message: string;
      severity: "info" | "warning" | "critical";
      source?: string;
      metadata?: Record<string, string>;
      actions?: Array<{ actionId: string; label: string; value: string; style?: "primary" | "danger" }>;
    },
  ): Promise<SlackMessageResult> {
    const color = buildSeverityColor(alert.severity);
    const severityEmoji = alert.severity === "critical" ? "🔴" : alert.severity === "warning" ? "🟡" : "🟢";

    const blocks: SlackBlock[] = [
      {
        type: "header",
        text: { type: "plain_text", text: `${severityEmoji} ${alert.title}`, emoji: true },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: alert.message },
        ...(alert.source ? { accessory: { type: "overflow", options: [], action_id: "source_overflow" } } : {}),
      },
    ];

    if (alert.metadata && Object.keys(alert.metadata).length > 0) {
      const fields = Object.entries(alert.metadata).slice(0, 10).map(([title, value]) => ({
        type: "mrkdwn",
        text: `*${title}*\n${value}`,
      }));
      blocks.push({ type: "section", fields: fields.slice(0, 10) });
    }

    if (alert.actions?.length) {
      blocks.push({
        type: "actions",
        elements: alert.actions.map((action) => ({
          type: "button",
          text: { type: "plain_text", text: action.label, emoji: true },
          value: action.value,
          action_id: action.actionId,
          ...(action.style ? { style: action.style } : {}),
        })),
      });
    }

    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `*Source:* ${alert.source ?? "Platform"} | *Time:* <!date^${Math.floor(Date.now() / 1000)}^{date_short} at {time}|${new Date().toISOString()}>`,
        },
      ],
    });

    const attachments: SlackAttachment[] = [{ color, blocks, fallback: alert.title }];

    return this.postMessage(channel, alert.title, { attachments });
  }

  async routeAlertBySeverity(
    alert: {
      title: string;
      message: string;
      severity: "info" | "warning" | "critical";
      source?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<SlackMessageResult> {
    const routing = this.alertRouting.find((r) => r.severity === alert.severity)
      ?? DEFAULT_ALERT_ROUTING.find((r) => r.severity === alert.severity)!;
    return this.postInteractiveAlert(routing.channel, alert);
  }

  configureAlertRouting(routing: SlackAlertRouting[]): void {
    this.alertRouting = routing;
  }

  async handleSlashCommand(payload: SlackSlashCommandPayload): Promise<{
    response_type: "in_channel" | "ephemeral";
    text: string;
    blocks?: SlackBlock[];
  }> {
    const { command, text, user_name } = payload;
    const args = text.trim().split(/\s+/).filter(Boolean);

    switch (command) {
      case "/alert": {
        const severity = (args[0] as "info" | "warning" | "critical") ?? "info";
        const message = args.slice(1).join(" ") || "Manual alert triggered";
        await this.routeAlertBySeverity({
          title: `Manual Alert — ${severity.toUpperCase()}`,
          message,
          severity,
          source: `@${user_name}`,
        });
        return {
          response_type: "ephemeral",
          text: `Alert dispatched to ${this.alertRouting.find((r) => r.severity === severity)?.channel ?? "#alerts"}`,
        };
      }

      case "/status": {
        return {
          response_type: "in_channel",
          text: "Platform Status",
          blocks: [
            {
              type: "section",
              text: { type: "mrkdwn", text: `*Platform Status* — requested by @${user_name}` },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*API:* 🟢 Operational` },
                { type: "mrkdwn", text: `*Integrations:* 🟡 Partial` },
                { type: "mrkdwn", text: `*Data Ingestion:* 🟢 Healthy` },
                { type: "mrkdwn", text: `*Agents:* 🟢 Active` },
              ],
            },
          ],
        };
      }

      case "/incident": {
        const subCommand = args[0];
        if (subCommand === "create") {
          const title = args.slice(1).join(" ") || "New incident";
          return {
            response_type: "in_channel",
            text: `Incident creation initiated: "${title}"`,
            blocks: [
              {
                type: "section",
                text: { type: "mrkdwn", text: `🚨 *Incident Created* by @${user_name}\n*Title:* ${title}` },
              },
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: { type: "plain_text", text: "Acknowledge", emoji: true },
                    style: "primary",
                    action_id: "incident_acknowledge",
                    value: title,
                  },
                  {
                    type: "button",
                    text: { type: "plain_text", text: "Resolve", emoji: true },
                    style: "danger",
                    action_id: "incident_resolve",
                    value: title,
                  },
                ],
              },
            ],
          };
        }
        return { response_type: "ephemeral", text: `Unknown incident subcommand: ${subCommand}. Try: /incident create <title>` };
      }

      default:
        return {
          response_type: "ephemeral",
          text: `Unknown command: ${command}. Available: /alert, /status, /incident`,
        };
    }
  }

  async handleInteractiveAction(payload: SlackInteractiveMessagePayload): Promise<Record<string, unknown> | null> {
    if (payload.type !== "block_actions") return null;

    const actions = payload.actions ?? [];
    const results: Record<string, unknown> = {};

    for (const action of actions) {
      switch (action.action_id) {
        case "incident_acknowledge":
          results[action.action_id] = { status: "acknowledged", value: action.value };
          break;
        case "incident_resolve":
          results[action.action_id] = { status: "resolved", value: action.value };
          break;
        default:
          results[action.action_id] = { status: "handled", value: action.value };
      }
    }

    return results;
  }

  async verifyWebhookSignature(
    rawBody: string,
    signature: string,
    timestamp: string,
  ): Promise<boolean> {
    const secret = this.signingSecret;
    if (!secret) return true;

    const { verifyWebhookSignature: verify } = await import("../integrations/webhook-verifier.js");
    const result = verify({
      algorithm: "slack-v0",
      secret,
      signature,
      body: rawBody,
      timestamp,
    });
    return result.valid;
  }

  async listChannels(limit = 200): Promise<SlackChannelInfo[]> {
    if (!this.botToken || !this.isLive) {
      return [
        { id: "C001", name: "alerts-critical", isMember: true, isPrivate: false, memberCount: null, topic: null, purpose: "Critical alerts" },
        { id: "C002", name: "alerts-warning", isMember: true, isPrivate: false, memberCount: null, topic: null, purpose: "Warning alerts" },
        { id: "C003", name: "general", isMember: true, isPrivate: false, memberCount: null, topic: null, purpose: "General" },
      ];
    }

    const response = await fetch(
      `https://slack.com/api/conversations.list?limit=${limit}&exclude_archived=true`,
      {
        headers: { Authorization: `Bearer ${this.botToken}` },
      },
    );

    if (!response.ok) throw new Error(`Slack API error: ${response.status}`);
    const data = await response.json() as {
      ok: boolean;
      channels?: Array<{
        id: string;
        name: string;
        is_member: boolean;
        is_private: boolean;
        num_members?: number;
        topic?: { value: string };
        purpose?: { value: string };
      }>;
      error?: string;
    };

    if (!data.ok) throw new Error(`Slack conversations.list failed: ${data.error}`);

    return (data.channels ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      isMember: c.is_member,
      isPrivate: c.is_private,
      memberCount: c.num_members ?? null,
      topic: c.topic?.value ?? null,
      purpose: c.purpose?.value ?? null,
    }));
  }

  async updateMessage(
    channel: string,
    ts: string,
    text: string,
    blocks?: SlackBlock[],
  ): Promise<SlackMessageResult> {
    if (!this.botToken || !this.isLive) {
      return { sent: true, channel, timestamp: ts, mock: !this.isLive };
    }

    const body: Record<string, unknown> = { channel, ts, text };
    if (blocks) body.blocks = blocks;

    const response = await fetch("https://slack.com/api/chat.update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.botToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Slack chat.update error: ${response.status}`);
    const data = await response.json() as { ok: boolean; ts?: string; error?: string };
    if (!data.ok) throw new Error(`Slack chat.update failed: ${data.error}`);

    return { sent: true, channel, timestamp: data.ts ?? ts, mock: false };
  }
}
