export type NotificationChannel = "in_app" | "email" | "sms" | "slack";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface NotificationPayload {
  userId: number;
  title: string;
  message: string;
  channel: NotificationChannel;
  priority?: NotificationPriority;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  send(payload: NotificationPayload): Promise<NotificationResult>;
  isConfigured(): boolean;
}

export class InAppProvider implements NotificationProvider {
  channel: NotificationChannel = "in_app";

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    return {
      success: true,
      channel: this.channel,
      messageId: `inapp_${Date.now()}`,
    };
  }

  isConfigured(): boolean {
    return true;
  }
}

export class EmailProvider implements NotificationProvider {
  channel: NotificationChannel = "email";
  private configured: boolean;

  constructor(private smtpConfig?: { host: string; port: number; user: string; pass: string }) {
    this.configured = !!smtpConfig;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.configured) {
      console.log(`[EMAIL DEMO] To: user#${payload.userId} | Subject: ${payload.title} | ${payload.message}`);
      return {
        success: true,
        channel: this.channel,
        messageId: `email_demo_${Date.now()}`,
      };
    }

    return {
      success: true,
      channel: this.channel,
      messageId: `email_${Date.now()}`,
    };
  }

  isConfigured(): boolean {
    return this.configured;
  }
}

export class SlackProvider implements NotificationProvider {
  channel: NotificationChannel = "slack";
  private configured: boolean;

  constructor(private webhookUrl?: string) {
    this.configured = !!webhookUrl;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.configured) {
      console.log(`[SLACK DEMO] Channel: user#${payload.userId} | ${payload.title}: ${payload.message}`);
      return {
        success: true,
        channel: this.channel,
        messageId: `slack_demo_${Date.now()}`,
      };
    }

    return {
      success: true,
      channel: this.channel,
      messageId: `slack_${Date.now()}`,
    };
  }

  isConfigured(): boolean {
    return this.configured;
  }
}

export class SmsProvider implements NotificationProvider {
  channel: NotificationChannel = "sms";
  private configured: boolean;

  constructor(private twilioConfig?: { accountSid: string; authToken: string; fromNumber: string }) {
    this.configured = !!twilioConfig;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.configured) {
      console.log(`[SMS DEMO] To: user#${payload.userId} | ${payload.title}: ${payload.message}`);
      return {
        success: true,
        channel: this.channel,
        messageId: `sms_demo_${Date.now()}`,
      };
    }

    return {
      success: true,
      channel: this.channel,
      messageId: `sms_${Date.now()}`,
    };
  }

  isConfigured(): boolean {
    return this.configured;
  }
}

export class NotificationService {
  private providers = new Map<NotificationChannel, NotificationProvider>();

  constructor(providers?: NotificationProvider[]) {
    const defaults: NotificationProvider[] = [
      new InAppProvider(),
      new EmailProvider(),
      new SlackProvider(),
      new SmsProvider(),
    ];

    for (const provider of providers ?? defaults) {
      this.providers.set(provider.channel, provider);
    }
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const provider = this.providers.get(payload.channel);
    if (!provider) {
      return {
        success: false,
        channel: payload.channel,
        error: `No provider registered for channel: ${payload.channel}`,
      };
    }

    return provider.send(payload);
  }

  async sendMultiple(payload: Omit<NotificationPayload, "channel">, channels: NotificationChannel[]): Promise<NotificationResult[]> {
    return Promise.all(
      channels.map((channel) => this.send({ ...payload, channel }))
    );
  }

  getProvider(channel: NotificationChannel): NotificationProvider | undefined {
    return this.providers.get(channel);
  }

  registerProvider(provider: NotificationProvider): void {
    this.providers.set(provider.channel, provider);
  }
}

export function createNotificationService(config?: {
  smtp?: { host: string; port: number; user: string; pass: string };
  slackWebhookUrl?: string;
  twilio?: { accountSid: string; authToken: string; fromNumber: string };
}): NotificationService {
  return new NotificationService([
    new InAppProvider(),
    new EmailProvider(config?.smtp),
    new SlackProvider(config?.slackWebhookUrl),
    new SmsProvider(config?.twilio),
  ]);
}
