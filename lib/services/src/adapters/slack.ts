import { ServiceAdapter, type ServiceStatus } from "../base.js";

export interface SlackMessageResult {
  sent: boolean;
  channel: string;
  timestamp?: string;
  mock: boolean;
}

export class SlackAdapter extends ServiceAdapter {
  readonly name = "slack";
  readonly description = "Slack notifications via webhook or Bot API";
  readonly requiredEnvVars = ["SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN"];

  private get webhookUrl(): string | undefined {
    return process.env["SLACK_WEBHOOK_URL"];
  }

  private get botToken(): string | undefined {
    return process.env["SLACK_BOT_TOKEN"];
  }

  get status(): ServiceStatus {
    if (this.webhookUrl || this.botToken) return "LIVE_CONFIGURED";
    return "MOCKED_DEMO_MODE";
  }

  get isLive(): boolean {
    return !!(this.webhookUrl || this.botToken);
  }

  get presentEnvVars(): string[] {
    const present: string[] = [];
    if (this.webhookUrl) present.push("SLACK_WEBHOOK_URL");
    if (this.botToken) present.push("SLACK_BOT_TOKEN");
    return present;
  }

  get missingEnvVars(): string[] {
    if (this.webhookUrl || this.botToken) return [];
    return ["SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN"];
  }

  async sendWebhookMessage(
    text: string,
    options?: { channel?: string; username?: string; iconEmoji?: string },
  ): Promise<SlackMessageResult> {
    if (!this.isLive) {
      return {
        sent: true,
        channel: options?.channel ?? "#general",
        mock: true,
      };
    }

    const body: Record<string, string> = { text };
    if (options?.channel) body["channel"] = options.channel;
    if (options?.username) body["username"] = options.username;
    if (options?.iconEmoji) body["icon_emoji"] = options.iconEmoji;

    const response = await fetch(this.webhookUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook error: ${response.status}`);
    }

    return {
      sent: true,
      channel: options?.channel ?? "#general",
      mock: false,
    };
  }

  async postMessage(
    channel: string,
    text: string,
  ): Promise<SlackMessageResult> {
    if (!this.botToken) {
      return this.sendWebhookMessage(text, { channel });
    }

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.botToken}`,
      },
      body: JSON.stringify({ channel, text }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    const data = (await response.json()) as { ok: boolean; ts?: string; error?: string };
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return {
      sent: true,
      channel,
      timestamp: data.ts,
      mock: false,
    };
  }
}
