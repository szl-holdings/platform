/**
 * Competitive Intel notifications.
 *
 * After the daily competitive-intel poll creates new alerts, push the high-
 * confidence ones (recommendation === "counter" | "adopt") to Slack as
 * individual posts and to a configurable list of email recipients as a
 * single digest. Per-lane mute switches and per-alert dismissed state
 * suppress the push side; the alert still appears on the Atlas page.
 *
 * Configuration (all optional — when nothing is set, dispatch becomes a
 * structured log line so dev environments stay quiet but observable):
 *
 *   SLACK_WEBHOOK_URL                  — incoming-webhook URL
 *   SLACK_BOT_TOKEN                    — alternative: chat.postMessage
 *   COMPETITIVE_INTEL_SLACK_CHANNEL    — channel for bot mode (default #competitive-intel)
 *   COMPETITIVE_INTEL_EMAIL_RECIPIENTS — comma-separated list of email addresses
 *   APP_URL / VITE_APP_URL             — used to build the Atlas link
 */

import {
  type IntelAlert,
  isLaneMuted,
  markAlertsNotified,
} from '../jobs/competitive-intel-monitor';
import { hasEmailProviderConfigured, sendEmail } from './email';
import { logger } from './logger';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL =
  process.env.COMPETITIVE_INTEL_SLACK_CHANNEL ||
  process.env.SLACK_ALERT_CHANNEL ||
  '#competitive-intel';

function emailRecipients(): string[] {
  const raw = process.env.COMPETITIVE_INTEL_EMAIL_RECIPIENTS || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /.+@.+\..+/.test(s));
}

function appUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.VITE_APP_URL ||
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'https://szlholdings.com')
  );
}

function atlasLink(laneId: string): string {
  return `${appUrl()}/command/competitive-atlas?lane=${encodeURIComponent(laneId)}`;
}

/**
 * Decide whether an alert should be pushed. Exported for testing.
 */
export function shouldNotify(alert: IntelAlert): boolean {
  if (alert.dismissed) return false;
  if (alert.notifiedAt) return false;
  if (alert.source !== 'rss') return false;
  if (alert.recommendation !== 'counter' && alert.recommendation !== 'adopt') return false;
  if (isLaneMuted(alert.laneId)) return false;
  return true;
}

function slackTextFor(alert: IntelAlert): string {
  const emoji = alert.recommendation === 'counter' ? ':crossed_swords:' : ':sparkles:';
  const recLabel = alert.recommendation === 'counter' ? 'COUNTER' : 'ADOPT';
  return [
    `${emoji} *Competitor move — ${recLabel}* · _${alert.laneId}_`,
    `*${alert.champion}:* ${alert.title}`,
    alert.summary ? `> ${alert.summary.slice(0, 280)}` : null,
    `_${alert.recommendationReason}_`,
    `<${alert.link}|Read source> · <${atlasLink(alert.laneId)}|Open Atlas lane>`,
  ]
    .filter(Boolean)
    .join('\n');
}

async function postSlack(text: string): Promise<boolean> {
  try {
    if (SLACK_WEBHOOK_URL) {
      const res = await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        logger.warn({ status: res.status }, '[competitive-intel-notify] Slack webhook failed');
        return false;
      }
      return true;
    }
    if (SLACK_BOT_TOKEN) {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify({ channel: SLACK_CHANNEL, text }),
      });
      if (!res.ok) {
        logger.warn({ status: res.status }, '[competitive-intel-notify] Slack bot HTTP failed');
        return false;
      }
      let body: { ok?: boolean; error?: string } = {};
      try {
        body = (await res.json()) as { ok?: boolean; error?: string };
      } catch {
        return false;
      }
      if (!body.ok) {
        logger.warn({ slackError: body.error }, '[competitive-intel-notify] Slack bot rejected');
        return false;
      }
      return true;
    }
    return false;
  } catch (err) {
    logger.warn({ err }, '[competitive-intel-notify] Slack post threw');
    return false;
  }
}

function buildEmailDigest(alerts: IntelAlert[]): { subject: string; html: string; text: string } {
  const counter = alerts.filter((a) => a.recommendation === 'counter');
  const adopt = alerts.filter((a) => a.recommendation === 'adopt');
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const subject =
    `[Competitive Atlas] ${alerts.length} new ` +
    (alerts.length === 1 ? 'competitor move' : 'competitor moves') +
    ` — ${counter.length} counter / ${adopt.length} adopt`;

  const renderRow = (a: IntelAlert) => {
    const recColor = a.recommendation === 'counter' ? '#dc2626' : '#0ea5e9';
    return `
      <div style="border-left:3px solid ${recColor};padding:12px 16px;margin:12px 0;background:#f9fafb;border-radius:4px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${recColor};margin-bottom:4px;">
          ${a.recommendation.toUpperCase()} · ${a.laneId} · ${a.champion}
        </div>
        <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:6px;">${a.title}</div>
        <div style="font-size:13px;color:#4b5563;line-height:1.5;margin-bottom:8px;">${a.summary}</div>
        <div style="font-size:12px;color:#374151;font-style:italic;margin-bottom:8px;">${a.recommendationReason}</div>
        <a href="${a.link}" style="font-size:12px;color:#6366f1;text-decoration:none;margin-right:12px;">Read source →</a>
        <a href="${atlasLink(a.laneId)}" style="font-size:12px;color:#6366f1;text-decoration:none;">Open Atlas lane →</a>
      </div>`;
  };

  const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:0;">
<div style="max-width:640px;margin:0 auto;padding:32px 16px;">
  <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <h2 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 4px;">Competitive Atlas — ${date}</h2>
    <p style="font-size:13px;color:#6b7280;margin:0 0 20px;">${alerts.length} new competitor move${alerts.length === 1 ? '' : 's'} detected. ${counter.length} counter · ${adopt.length} adopt.</p>
    ${alerts.map(renderRow).join('')}
    <div style="font-size:11px;color:#9ca3af;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
      SZL Holdings · You're receiving this because you're on COMPETITIVE_INTEL_EMAIL_RECIPIENTS. Mute lanes from the Competitive Atlas to stop notifications for that lane.
    </div>
  </div>
</div>
</body></html>`;

  const text = [
    `Competitive Atlas — ${date}`,
    `${alerts.length} new competitor move(s). ${counter.length} counter / ${adopt.length} adopt.`,
    ``,
    ...alerts.map(
      (a) =>
        `[${a.recommendation.toUpperCase()}] ${a.laneId} · ${a.champion}: ${a.title}\n${a.summary}\nWhy: ${a.recommendationReason}\nSource: ${a.link}\n`,
    ),
  ].join('\n');

  return { subject, html, text };
}

async function dispatchEmailDigest(alerts: IntelAlert[]): Promise<number> {
  const recipients = emailRecipients();
  if (recipients.length === 0) return 0;
  if (!hasEmailProviderConfigured()) return 0;
  const digest = buildEmailDigest(alerts);
  let sent = 0;
  await Promise.allSettled(
    recipients.map(async (to) => {
      const result = await sendEmail({
        to,
        subject: digest.subject,
        html: digest.html,
        text: digest.text,
      });
      if (result.success) sent++;
      else
        logger.warn(
          { to, error: result.error },
          '[competitive-intel-notify] Email digest delivery failed',
        );
    }),
  );
  return sent;
}

export interface NotifyResult {
  candidates: number;
  /**
   * Number of eligible alerts that successfully delivered on at least one
   * configured channel. When neither Slack nor email is configured, all
   * eligible alerts are counted as pushed (log-only fallback).
   */
  pushed: number;
  slackSent: number;
  emailSent: number;
  /**
   * Eligible alerts that could not be delivered on any configured channel.
   * Their `notifiedAt` is left unset so the next poll cycle retries them.
   */
  deliveryFailed: number;
  laneMutesSkipped: number;
  alreadyDismissedSkipped: number;
}

/**
 * Notify Slack/email about the given freshly-created alerts. Returns a
 * structured result so callers and tests can assert on it.
 */
export async function notifyNewAlerts(alerts: IntelAlert[]): Promise<NotifyResult> {
  const result: NotifyResult = {
    candidates: alerts.length,
    pushed: 0,
    slackSent: 0,
    emailSent: 0,
    laneMutesSkipped: 0,
    alreadyDismissedSkipped: 0,
  };

  const eligible: IntelAlert[] = [];
  for (const a of alerts) {
    if (a.dismissed) {
      result.alreadyDismissedSkipped++;
      continue;
    }
    if (a.notifiedAt) continue;
    if (a.source !== 'rss') continue;
    if (a.recommendation !== 'counter' && a.recommendation !== 'adopt') continue;
    if (isLaneMuted(a.laneId)) {
      result.laneMutesSkipped++;
      continue;
    }
    eligible.push(a);
  }

  if (eligible.length === 0) {
    logger.info(result, '[competitive-intel-notify] No eligible alerts to push');
    return result;
  }

  // Track per-alert delivery so we only mark an alert notified if at least
  // one configured channel actually succeeded. This avoids silent loss when
  // Slack is temporarily down — the alert stays unnotified and the next
  // poll cycle will retry it.
  const slackDeliveredIds = new Set<string>();
  const slackConfigured = !!(SLACK_WEBHOOK_URL || SLACK_BOT_TOKEN);

  if (slackConfigured) {
    for (const a of eligible) {
      const ok = await postSlack(slackTextFor(a));
      if (ok) {
        slackDeliveredIds.add(a.id);
        result.slackSent++;
      }
    }
  } else {
    // Dev fallback — log what would have been sent so it shows up in the
    // workflow logs even without Slack creds.
    for (const a of eligible) {
      logger.info(
        {
          laneId: a.laneId,
          champion: a.champion,
          recommendation: a.recommendation,
          title: a.title,
        },
        '[competitive-intel-notify] (no-op: no Slack creds) would post',
      );
    }
  }

  // Email: single digest with all eligible alerts. dispatchEmailDigest
  // returns the number of recipients that accepted the message; if any did,
  // every eligible alert is considered email-delivered (one digest per
  // cycle). Returns 0 when no recipients are configured or the provider is
  // unavailable.
  const emailRecipientCount = emailRecipients().length;
  const emailConfigured = emailRecipientCount > 0 && hasEmailProviderConfigured();
  result.emailSent = await dispatchEmailDigest(eligible);
  const emailDelivered = emailConfigured && result.emailSent > 0;

  // If neither channel is configured, fall back to "log-only" delivery and
  // mark notified so we don't spam the workflow logs every poll cycle. When
  // at least one channel IS configured, only mark alerts that successfully
  // delivered on at least one channel.
  const pushedIds: string[] = [];
  if (!slackConfigured && !emailConfigured) {
    for (const a of eligible) pushedIds.push(a.id);
  } else {
    for (const a of eligible) {
      if (slackDeliveredIds.has(a.id) || emailDelivered) pushedIds.push(a.id);
    }
  }

  await markAlertsNotified(pushedIds);
  result.pushed = pushedIds.length;
  result.deliveryFailed = eligible.length - pushedIds.length;

  if (result.deliveryFailed > 0) {
    logger.warn(
      result,
      '[competitive-intel-notify] Some competitor-move alerts could not be delivered — will retry next cycle',
    );
  } else {
    logger.info(result, '[competitive-intel-notify] Dispatched competitor-move notifications');
  }
  return result;
}

// Exported for testing.
export const __test__ = { buildEmailDigest, slackTextFor };
