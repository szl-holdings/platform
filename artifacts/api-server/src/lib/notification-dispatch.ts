import { sendEmail, hasEmailProviderConfigured, INTERNAL_EMAIL } from "./email";
import { logger } from "./logger";
import type { NotifSeverity } from "./domain-notifications";

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

export async function dispatchExternalAlert(params: AlertDispatchParams): Promise<void> {
  const { appName, title, message, severity, actionUrl } = params;

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
