import { sendEmail, hasEmailProviderConfigured, INTERNAL_EMAIL } from "./email";
import { logger } from "./logger";
import { LRUCache } from "lru-cache";
import type { NotifSeverity } from "./domain-notifications";
import { sendWebPushToAll } from "./web-push-sender";
import { db, notificationRecipientsTable } from "@szl-holdings/db";
import { eq } from "drizzle-orm";
import { TwilioAdapter } from "@szl-holdings/services";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_PER_WINDOW: Record<NotifSeverity, number> = {
  critical: 5,
  warning: 10,
  info: 20,
};

const rateLimitBuckets = new LRUCache<string, { count: number; windowStart: number }>({ max: 10000 });

function isRateLimited(key: string, severity: NotifSeverity): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(key, { count: 1, windowStart: now });
    return false;
  }
  const max = RATE_LIMIT_MAX_PER_WINDOW[severity];
  if (bucket.count >= max) {
    logger.warn({ key, severity, count: bucket.count, max }, "[notification-dispatch] Rate limit exceeded — suppressing notification");
    return true;
  }
  bucket.count++;
  return false;
}

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_ALERT_CHANNEL = process.env.SLACK_ALERT_CHANNEL || "#alerts";

const TEAMS_WEBHOOK_URL = process.env.MICROSOFT_TEAMS_WEBHOOK_URL;

const SEVERITY_EMOJI: Record<NotifSeverity, string> = {
  critical: ":rotating_light:",
  warning: ":warning:",
  info: ":information_source:",
};

const SEVERITY_COLOR: Record<NotifSeverity, string> = {
  critical: "FF0000",
  warning: "FFA500",
  info: "0078D4",
};

const twilioAdapter = new TwilioAdapter();

async function postToSlack(text: string): Promise<void> {
  if (SLACK_WEBHOOK_URL) {
    try {
      const res = await fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        logger.warn({ status: res.status }, "[slack] Webhook post failed");
      } else {
        logger.debug("[slack] Message sent via webhook");
      }
    } catch (err) {
      logger.warn({ err }, "[slack] Webhook post error");
    }
  } else if (SLACK_BOT_TOKEN) {
    try {
      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({ channel: SLACK_ALERT_CHANNEL, text }),
      });
      if (!res.ok) {
        logger.warn({ status: res.status }, "[slack] Bot API post failed");
      } else {
        const data = await res.json() as { ok: boolean; error?: string };
        if (!data.ok) {
          logger.warn({ slackError: data.error }, "[slack] Bot API returned ok=false");
        } else {
          logger.debug("[slack] Message sent via bot token");
        }
      }
    } catch (err) {
      logger.warn({ err }, "[slack] Bot API post error");
    }
  }
}

async function postToTeams(title: string, text: string, color: string): Promise<void> {
  if (!TEAMS_WEBHOOK_URL) return;
  try {
    const body = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      themeColor: color,
      summary: title,
      sections: [{ activityTitle: title, activityText: text }],
    };
    const res = await fetch(TEAMS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "[teams] Webhook post failed");
    } else {
      logger.debug("[teams] Message sent");
    }
  } catch (err) {
    logger.warn({ err }, "[teams] Webhook post error");
  }
}

async function dispatchWebPush(params: AlertDispatchParams): Promise<void> {
  try {
    const { appName, title, message, severity, actionUrl } = params;
    const severityLabel = severity === "critical" ? "🚨 CRITICAL" : severity === "warning" ? "⚠️ WARNING" : "ℹ️ INFO";
    const result = await sendWebPushToAll({
      title: `${severityLabel}: ${appName}`,
      body: `${title} — ${message}`,
      tag: `alert-${appName}-${severity}`,
      actionUrl: actionUrl ?? "/",
      data: { appName, severity, actionUrl },
    });
    if (result.sent > 0) {
      logger.info({ sent: result.sent, failed: result.failed }, "[web-push] Alert dispatched");
    }
  } catch (err) {
    logger.warn({ err }, "[web-push] Alert dispatch error");
  }
}

async function getActiveRecipients(): Promise<typeof notificationRecipientsTable.$inferSelect[]> {
  try {
    return await db
      .select()
      .from(notificationRecipientsTable)
      .where(eq(notificationRecipientsTable.isActive, true));
  } catch (err) {
    logger.warn({ err }, "[notification-dispatch] Failed to query recipients");
    return [];
  }
}

async function dispatchSMS(params: AlertDispatchParams): Promise<void> {
  const recipients = await getActiveRecipients();
  const smsRecipients = recipients.filter((r) => r.smsEnabled);
  if (smsRecipients.length === 0) return;

  const { appName, title, message, severity } = params;
  const severityTag = severity.toUpperCase();
  const smsBody = `[SZL ${severityTag}] ${appName}: ${title}\n${message}`.slice(0, 1600);

  const results = await Promise.allSettled(
    smsRecipients.map((r) => twilioAdapter.sendSMS(r.phoneNumber, smsBody))
  );

  let sent = 0;
  let failed = 0;
  for (const result of results) {
    if (result.status === "fulfilled" && result.value.sent) {
      sent++;
    } else {
      failed++;
      if (result.status === "rejected") {
        logger.warn({ err: result.reason }, "[sms] Failed to send SMS alert");
      }
    }
  }
  logger.info({ sent, failed, total: smsRecipients.length }, "[sms] Alert SMS dispatch complete");
}

async function dispatchVoice(params: AlertDispatchParams): Promise<void> {
  const recipients = await getActiveRecipients();
  const voiceRecipients = recipients.filter((r) => r.voiceEnabled);
  if (voiceRecipients.length === 0) return;

  const { appName, title, message } = params;
  const ttsMessage = `Critical alert from S Z L Holdings. Application: ${appName}. ${title}. ${message}. This is a critical automated alert. Please acknowledge immediately.`;

  const results = await Promise.allSettled(
    voiceRecipients.map((r) => twilioAdapter.makeVoiceCall(r.phoneNumber, ttsMessage))
  );

  let initiated = 0;
  let failed = 0;
  for (const result of results) {
    if (result.status === "fulfilled" && result.value.initiated) {
      initiated++;
    } else {
      failed++;
      if (result.status === "rejected") {
        logger.warn({ err: result.reason }, "[voice] Failed to initiate voice call alert");
      }
    }
  }
  logger.info({ initiated, failed, total: voiceRecipients.length }, "[voice] Alert voice call dispatch complete");
}

export interface AlertDispatchParams {
  appName: string;
  title: string;
  message: string;
  severity: NotifSeverity;
  actionUrl?: string;
}

const SEVERITY_THRESHOLD_SLACK: NotifSeverity[] = ["critical", "warning"];
const SEVERITY_THRESHOLD_TEAMS: NotifSeverity[] = ["critical", "warning"];
const SEVERITY_THRESHOLD_EMAIL: NotifSeverity[] = ["critical"];
const SEVERITY_THRESHOLD_WEB_PUSH: NotifSeverity[] = ["critical", "warning"];
const SEVERITY_THRESHOLD_SMS: NotifSeverity[] = ["critical", "warning"];
const SEVERITY_THRESHOLD_VOICE: NotifSeverity[] = ["critical"];

export async function dispatchExternalAlert(params: AlertDispatchParams): Promise<void> {
  const { appName, title, message, severity, actionUrl } = params;

  const rateLimitKey = `${appName}:${severity}`;
  if (isRateLimited(rateLimitKey, severity)) {
    return;
  }

  const dispatchJobs: Promise<void>[] = [];

  if (SEVERITY_THRESHOLD_SLACK.includes(severity) && (SLACK_WEBHOOK_URL || SLACK_BOT_TOKEN)) {
    const emoji = SEVERITY_EMOJI[severity];
    const lines = [
      `${emoji} *[${appName}] ${title}*`,
      message,
    ];
    if (actionUrl) lines.push(`<${process.env.VITE_APP_URL || ""}${actionUrl}|View in platform>`);
    dispatchJobs.push(postToSlack(lines.join("\n")));
  }

  if (SEVERITY_THRESHOLD_TEAMS.includes(severity) && TEAMS_WEBHOOK_URL) {
    const color = SEVERITY_COLOR[severity];
    dispatchJobs.push(postToTeams(`[${appName}] ${title}`, message, color));
  }

  if (SEVERITY_THRESHOLD_EMAIL.includes(severity) && INTERNAL_EMAIL && hasEmailProviderConfigured()) {
    const alertHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><style>
body{font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:0}
.wrap{max-width:560px;margin:0 auto;padding:32px 16px}
.card{background:#fff;border-radius:12px;padding:36px;border:1px solid #e5e7eb}
.badge{display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px;background:${severity === "critical" ? "#fee2e2" : "#fff7ed"};color:${severity === "critical" ? "#dc2626" : "#c2410c"}}
h2{font-size:18px;font-weight:700;color:#111827;margin:0 0 10px}
p{font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 12px}
a{color:#6366f1;font-weight:600}
.footer{font-size:11px;color:#9ca3af;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb}
</style></head><body>
<div class="wrap"><div class="card">
<div class="badge">${severity.toUpperCase()} — ${appName}</div>
<h2>${title}</h2>
<p>${message}</p>
${actionUrl ? `<p><a href="${process.env.VITE_APP_URL || ""}${actionUrl}">View in Platform →</a></p>` : ""}
<div class="footer">SZL Holdings Platform · Automated Alert · ${new Date().toISOString()}</div>
</div></div></body></html>`;

    dispatchJobs.push(
      sendEmail({
        to: INTERNAL_EMAIL,
        subject: `[${severity.toUpperCase()}] ${appName}: ${title}`,
        html: alertHtml,
        text: `[${severity.toUpperCase()}] ${appName}: ${title}\n\n${message}${actionUrl ? `\n\nView: ${process.env.VITE_APP_URL || ""}${actionUrl}` : ""}`,
      }).then((result) => {
        if (!result.success) {
          logger.warn({ error: result.error }, "[email] Alert email delivery failed");
        }
      })
    );
  }

  if (SEVERITY_THRESHOLD_WEB_PUSH.includes(severity)) {
    dispatchJobs.push(dispatchWebPush(params));
  }

  if (SEVERITY_THRESHOLD_SMS.includes(severity)) {
    dispatchJobs.push(dispatchSMS(params));
  }

  if (SEVERITY_THRESHOLD_VOICE.includes(severity)) {
    dispatchJobs.push(dispatchVoice(params));
  }

  if (dispatchJobs.length > 0) {
    await Promise.allSettled(dispatchJobs);
  }
}

export async function sendContactConfirmationEmails(params: {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  adminEmail: string;
  senderName: string;
  confirmationHtml: string;
  notificationHtml: string;
}): Promise<void> {
  const { email, adminEmail, subject, confirmationHtml, notificationHtml } = params;

  await Promise.allSettled([
    sendEmail({
      to: email,
      subject: `We received your inquiry — ${params.senderName}`,
      html: confirmationHtml,
      replyTo: adminEmail,
    }).then((r) => {
      if (r.success) {
        logger.info({ to: email, provider: r.provider }, "[email] Contact confirmation sent");
      } else {
        logger.warn({ error: r.error }, "[email] Contact confirmation failed");
      }
    }),
    sendEmail({
      to: adminEmail,
      subject,
      html: notificationHtml,
      replyTo: email,
    }).then((r) => {
      if (r.success) {
        logger.info({ to: adminEmail, provider: r.provider }, "[email] Admin notification sent");
      } else {
        logger.warn({ error: r.error }, "[email] Admin notification failed");
      }
    }),
  ]);
}
