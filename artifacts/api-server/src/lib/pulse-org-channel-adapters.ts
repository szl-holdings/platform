import { logger } from './logger';
import { sendEmail } from './email';
import { sendPushToUser, type PushMessagePayload } from './expo-push';

export type OrgChannel = 'in_app' | 'push' | 'email' | 'sms' | 'slack' | 'teams' | 'webhook';

export interface BriefingPayload {
  briefingId: string;
  domain: string;
  headline: string;
  situation: string;
  overallRisk: string;
  confidence: string;
  deepLinkUrl: string;
  unsubscribeUrl?: string;
}

export interface AdapterResult {
  status: 'delivered' | 'failed' | 'suppressed';
  providerMessageId?: string;
  error?: string;
  retryable?: boolean;
  suppressReason?: string;
}

export interface ChannelConfig {
  slackWebhookUrl?: string | null;
  slackChannel?: string | null;
  teamsWebhookUrl?: string | null;
  smsSenderId?: string | null;
  outboundWebhookUrl?: string | null;
  outboundWebhookSecret?: string | null;
  emailFromName?: string | null;
  emailFromAddress?: string | null;
}

export interface RecipientContext {
  userId: number;
  email?: string | null;
  phone?: string | null;
  displayName?: string | null;
  pushOptOut?: boolean;
  emailOptOut?: boolean;
  smsOptOut?: boolean;
}

function riskColor(risk: string): string {
  if (risk === 'CRITICAL') return '#e53e3e';
  if (risk === 'HIGH') return '#e8855b';
  if (risk === 'MEDIUM') return '#c8a84b';
  return '#4eca8b';
}

function buildBriefingEmail(
  payload: BriefingPayload,
  recipientEmail: string,
): { html: string; text: string; subject: string } {
  const subject = `[Pulse Org Briefing] ${payload.headline}`;
  const riskHex = riskColor(payload.overallRisk);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0b0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#101216;border:1px solid rgba(200,168,75,0.2);border-radius:12px;overflow:hidden;">
    <div style="padding:20px 28px;border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="font-size:11px;letter-spacing:0.14em;color:#c8a84b;text-transform:uppercase;font-weight:700;">PULSE ORG BRIEFING</span>
      <span style="margin-left:12px;font-size:11px;letter-spacing:0.08em;color:${riskHex};text-transform:uppercase;font-weight:600;padding:2px 7px;background:${riskHex}18;border:1px solid ${riskHex}35;border-radius:4px;">${payload.overallRisk} RISK</span>
    </div>
    <div style="padding:28px;">
      <h2 style="color:#fff;margin:0 0 14px;font-size:1.25rem;line-height:1.4;">${payload.headline}</h2>
      <p style="color:rgba(255,255,255,0.65);line-height:1.6;margin:0 0 20px;font-size:0.9rem;">${payload.situation}</p>
      <div style="margin-bottom:20px;">
        <span style="font-size:12px;color:rgba(255,255,255,0.4);">Domain: <strong style="color:rgba(255,255,255,0.7);">${payload.domain}</strong></span>
        <span style="margin-left:16px;font-size:12px;color:rgba(255,255,255,0.4);">Confidence: <strong style="color:rgba(255,255,255,0.7);">${payload.confidence}</strong></span>
      </div>
      <a href="${payload.deepLinkUrl}" style="display:inline-block;padding:10px 20px;background:rgba(200,168,75,0.12);border:1px solid rgba(200,168,75,0.3);border-radius:6px;color:#c8a84b;text-decoration:none;font-size:0.85rem;font-weight:600;">View Full Briefing →</a>
    </div>
    ${payload.unsubscribeUrl ? `<div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;"><a href="${payload.unsubscribeUrl}" style="font-size:11px;color:rgba(255,255,255,0.3);text-decoration:underline;">Unsubscribe from org briefings</a></div>` : ''}
  </div>
</body>
</html>`;

  const text = `PULSE ORG BRIEFING — ${payload.overallRisk} RISK\n\n${payload.headline}\n\n${payload.situation}\n\nDomain: ${payload.domain} | Confidence: ${payload.confidence}\n\nView: ${payload.deepLinkUrl}${payload.unsubscribeUrl ? `\n\nUnsubscribe: ${payload.unsubscribeUrl}` : ''}`;

  return { html, text, subject };
}

export class InAppAdapter {
  readonly channel = 'in_app' as const;

  isConfigured(_config: ChannelConfig): boolean {
    return true;
  }

  async deliver(_payload: BriefingPayload, _recipient: RecipientContext): Promise<AdapterResult> {
    return { status: 'delivered', providerMessageId: `inapp-${Date.now()}` };
  }
}

export class PushAdapter {
  readonly channel = 'push' as const;

  isConfigured(_config: ChannelConfig): boolean {
    return true;
  }

  async deliver(payload: BriefingPayload, recipient: RecipientContext): Promise<AdapterResult> {
    if (recipient.pushOptOut) {
      return { status: 'suppressed', suppressReason: 'user_opt_out' };
    }
    try {
      const msg: PushMessagePayload = {
        title: '⬡ Org Briefing',
        body: payload.headline,
        data: {
          type: 'org_briefing',
          briefingId: payload.briefingId,
          domain: payload.domain,
          deepLink: payload.deepLinkUrl,
        },
        sound: 'default',
      };
      const result = await sendPushToUser(recipient.userId, msg);
      if (result.sent === 0) {
        return { status: 'suppressed', suppressReason: 'no_active_tokens' };
      }
      return { status: 'delivered', providerMessageId: `push-${result.historyId ?? Date.now()}` };
    } catch (err) {
      logger.error({ err, userId: recipient.userId }, '[pulse-org-push] delivery failed');
      return { status: 'failed', error: String(err), retryable: true };
    }
  }
}

export class EmailAdapter {
  readonly channel = 'email' as const;

  isConfigured(config: ChannelConfig): boolean {
    return !!(process.env.SMTP_HOST || process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY);
  }

  async deliver(payload: BriefingPayload, recipient: RecipientContext): Promise<AdapterResult> {
    if (recipient.emailOptOut) {
      return { status: 'suppressed', suppressReason: 'user_opt_out' };
    }
    if (!recipient.email) {
      return { status: 'suppressed', suppressReason: 'no_email_address' };
    }
    if (!this.isConfigured({})) {
      return { status: 'suppressed', suppressReason: 'channel_not_configured' };
    }
    try {
      const { html, text, subject } = buildBriefingEmail(payload, recipient.email);
      await sendEmail({
        to: recipient.email,
        subject,
        html,
        text,
      });
      return { status: 'delivered', providerMessageId: `email-${Date.now()}` };
    } catch (err) {
      const msg = String(err);
      const retryable = !/invalid|bounce|spam|unsubscribe/i.test(msg);
      return { status: 'failed', error: msg, retryable };
    }
  }
}

export class SmsAdapter {
  readonly channel = 'sms' as const;

  isConfigured(_config: ChannelConfig): boolean {
    return (
      !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) ||
      !!(process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET)
    );
  }

  async deliver(
    payload: BriefingPayload,
    recipient: RecipientContext,
    config?: ChannelConfig,
  ): Promise<AdapterResult> {
    if (recipient.smsOptOut) {
      return { status: 'suppressed', suppressReason: 'user_opt_out' };
    }
    if (!recipient.phone) {
      return { status: 'suppressed', suppressReason: 'no_phone_number' };
    }
    if (!this.isConfigured(config ?? {})) {
      return { status: 'suppressed', suppressReason: 'channel_not_configured' };
    }
    try {
      const body = `PULSE: ${payload.headline.slice(0, 120)} — ${payload.deepLinkUrl}`;
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const { default: twilio } = await import('twilio').catch(() => ({ default: null }));
        if (!twilio) {
          return { status: 'suppressed', suppressReason: 'sms_provider_not_available' };
        }
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const msg = await client.messages.create({
          body,
          from: config?.smsSenderId ?? process.env.TWILIO_PHONE_NUMBER,
          to: recipient.phone,
        });
        return { status: 'delivered', providerMessageId: msg.sid };
      }
      return { status: 'suppressed', suppressReason: 'sms_provider_not_configured' };
    } catch (err) {
      const msg = String(err);
      const retryable = /rate.limit|timeout|network/i.test(msg);
      return { status: 'failed', error: msg, retryable };
    }
  }
}

export class SlackAdapter {
  readonly channel = 'slack' as const;

  isConfigured(config: ChannelConfig): boolean {
    return !!(
      config.slackWebhookUrl ||
      process.env.SLACK_WEBHOOK_URL ||
      process.env.SLACK_BOT_TOKEN
    );
  }

  async deliver(
    payload: BriefingPayload,
    _recipient: RecipientContext,
    config?: ChannelConfig,
  ): Promise<AdapterResult> {
    const webhookUrl = config?.slackWebhookUrl ?? process.env.SLACK_WEBHOOK_URL;
    if (!this.isConfigured(config ?? {})) {
      return { status: 'suppressed', suppressReason: 'channel_not_configured' };
    }
    if (!webhookUrl) {
      return { status: 'suppressed', suppressReason: 'slack_webhook_url_missing' };
    }
    try {
      const riskHex = riskColor(payload.overallRisk);
      const block = {
        attachments: [
          {
            color: riskHex,
            blocks: [
              {
                type: 'header',
                text: { type: 'plain_text', text: '⬡ Pulse Org Briefing' },
              },
              {
                type: 'section',
                text: { type: 'mrkdwn', text: `*${payload.headline}*\n${payload.situation}` },
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `Domain: *${payload.domain}* | Risk: *${payload.overallRisk}* | Confidence: *${payload.confidence}*`,
                  },
                ],
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: { type: 'plain_text', text: 'View Briefing' },
                    url: payload.deepLinkUrl,
                    style: 'primary',
                  },
                ],
              },
            ],
          },
        ],
      };

      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(block),
      });
      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        return {
          status: 'failed',
          error: `Slack returned ${resp.status}: ${body}`,
          retryable: resp.status >= 500,
        };
      }
      return { status: 'delivered', providerMessageId: `slack-${Date.now()}` };
    } catch (err) {
      return { status: 'failed', error: String(err), retryable: true };
    }
  }
}

export class TeamsAdapter {
  readonly channel = 'teams' as const;

  isConfigured(config: ChannelConfig): boolean {
    return !!(config.teamsWebhookUrl || process.env.TEAMS_WEBHOOK_URL);
  }

  async deliver(
    payload: BriefingPayload,
    _recipient: RecipientContext,
    config?: ChannelConfig,
  ): Promise<AdapterResult> {
    const webhookUrl = config?.teamsWebhookUrl ?? process.env.TEAMS_WEBHOOK_URL;
    if (!this.isConfigured(config ?? {})) {
      return { status: 'suppressed', suppressReason: 'channel_not_configured' };
    }
    if (!webhookUrl) {
      return { status: 'suppressed', suppressReason: 'teams_webhook_url_missing' };
    }
    try {
      const riskHex = riskColor(payload.overallRisk);
      const card = {
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
              type: 'AdaptiveCard',
              version: '1.4',
              body: [
                {
                  type: 'TextBlock',
                  text: '⬡ Pulse Org Briefing',
                  weight: 'Bolder',
                  size: 'Medium',
                  color: 'Accent',
                },
                {
                  type: 'TextBlock',
                  text: payload.headline,
                  weight: 'Bolder',
                  wrap: true,
                },
                {
                  type: 'TextBlock',
                  text: payload.situation,
                  wrap: true,
                  isSubtle: true,
                },
                {
                  type: 'FactSet',
                  facts: [
                    { title: 'Domain', value: payload.domain },
                    { title: 'Risk', value: payload.overallRisk },
                    { title: 'Confidence', value: payload.confidence },
                  ],
                },
              ],
              actions: [
                {
                  type: 'Action.OpenUrl',
                  title: 'View Briefing',
                  url: payload.deepLinkUrl,
                },
              ],
            },
          },
        ],
      };

      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card),
      });
      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        return {
          status: 'failed',
          error: `Teams returned ${resp.status}: ${body}`,
          retryable: resp.status >= 500,
        };
      }
      return { status: 'delivered', providerMessageId: `teams-${Date.now()}` };
    } catch (err) {
      return { status: 'failed', error: String(err), retryable: true };
    }
  }
}

export class WebhookAdapter {
  readonly channel = 'webhook' as const;

  isConfigured(config: ChannelConfig): boolean {
    return !!(config.outboundWebhookUrl || process.env.PULSE_ORG_WEBHOOK_URL);
  }

  async deliver(
    payload: BriefingPayload,
    recipient: RecipientContext,
    config?: ChannelConfig,
  ): Promise<AdapterResult> {
    const webhookUrl = config?.outboundWebhookUrl ?? process.env.PULSE_ORG_WEBHOOK_URL;
    if (!this.isConfigured(config ?? {})) {
      return { status: 'suppressed', suppressReason: 'channel_not_configured' };
    }
    if (!webhookUrl) {
      return { status: 'suppressed', suppressReason: 'webhook_url_missing' };
    }
    try {
      const body = JSON.stringify({
        event: 'pulse.org_publication',
        briefingId: payload.briefingId,
        domain: payload.domain,
        headline: payload.headline,
        overallRisk: payload.overallRisk,
        confidence: payload.confidence,
        deepLinkUrl: payload.deepLinkUrl,
        recipientUserId: recipient.userId,
        sentAt: new Date().toISOString(),
      });

      const secret = config?.outboundWebhookSecret ?? process.env.PULSE_ORG_WEBHOOK_SECRET;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Pulse-Event': 'pulse.org_publication',
      };
      if (secret) {
        const { createHmac } = await import('node:crypto');
        headers['X-Pulse-Signature'] =
          `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
      }

      const resp = await fetch(webhookUrl, { method: 'POST', headers, body });
      if (!resp.ok) {
        const rbody = await resp.text().catch(() => '');
        return {
          status: 'failed',
          error: `Webhook returned ${resp.status}: ${rbody}`,
          retryable: resp.status >= 500,
        };
      }
      return { status: 'delivered', providerMessageId: `webhook-${Date.now()}` };
    } catch (err) {
      return { status: 'failed', error: String(err), retryable: true };
    }
  }
}

export const ADAPTER_REGISTRY = {
  in_app: new InAppAdapter(),
  push: new PushAdapter(),
  email: new EmailAdapter(),
  sms: new SmsAdapter(),
  slack: new SlackAdapter(),
  teams: new TeamsAdapter(),
  webhook: new WebhookAdapter(),
} as const;

export function getConfiguredChannels(config: ChannelConfig): OrgChannel[] {
  return (
    Object.entries(ADAPTER_REGISTRY) as [
      OrgChannel,
      { isConfigured: (c: ChannelConfig) => boolean },
    ][]
  )
    .filter(([_ch, adapter]) => adapter.isConfigured(config))
    .map(([ch]) => ch);
}

export async function deliverToChannel(
  channel: OrgChannel,
  payload: BriefingPayload,
  recipient: RecipientContext,
  config?: ChannelConfig,
): Promise<AdapterResult> {
  const adapter = ADAPTER_REGISTRY[channel];
  if (!adapter) {
    return { status: 'suppressed', suppressReason: `unknown_channel_${channel}` };
  }
  if (!adapter.isConfigured(config ?? {})) {
    return { status: 'suppressed', suppressReason: 'channel_not_configured' };
  }
  if ('deliver' in adapter) {
    return (
      adapter as {
        deliver: (
          p: BriefingPayload,
          r: RecipientContext,
          c?: ChannelConfig,
        ) => Promise<AdapterResult>;
      }
    ).deliver(payload, recipient, config);
  }
  return { status: 'suppressed', suppressReason: 'adapter_no_deliver' };
}
