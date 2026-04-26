import { createHmac, timingSafeEqual } from 'crypto';
import nodemailer from 'nodemailer';
import { logger } from './logger';
import { isFlagEnabled } from './platform-flags';

// Lazy pool initialization — avoids module-level PgPool construction in tests
let _auditPool: import('pg').Pool | null = null;
let _suppressionPool: import('pg').Pool | null = null;

function getAuditPool(): import('pg').Pool {
  if (!_auditPool) {
    const { PgPool } = require('@szl-holdings/db') as typeof import('@szl-holdings/db');
    _auditPool = new PgPool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: 10_000,
    }) as unknown as import('pg').Pool;
  }
  return _auditPool;
}

function getSuppressionPool(): import('pg').Pool {
  if (!_suppressionPool) {
    const { PgPool } = require('@szl-holdings/db') as typeof import('@szl-holdings/db');
    _suppressionPool = new PgPool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: 10_000,
    }) as unknown as import('pg').Pool;
  }
  return _suppressionPool;
}

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  unsubscribeToken?: string;
  headers?: Record<string, string>;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

const FROM_ADDRESS = 'SZL Holdings <inquiries@szlholdings.com>';
const FROM_NAME = 'SZL Holdings';
const FROM_EMAIL = 'inquiries@szlholdings.com';
const INTERNAL_EMAIL = process.env.SZL_INTERNAL_EMAIL || 'team@szlholdings.com';

async function sendViaSendGrid(options: EmailOptions): Promise<SendResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured');

  const sgAttachments = options.attachments?.map((a) => ({
    content: a.content.toString('base64'),
    filename: a.filename,
    type: a.contentType,
    disposition: 'attachment',
  }));

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: options.to }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      reply_to: options.replyTo ? { email: options.replyTo } : undefined,
      subject: options.subject,
      content: [
        { type: 'text/html', value: options.html },
        ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
      ],
      ...(sgAttachments?.length ? { attachments: sgAttachments } : {}),
      ...(options.headers && Object.keys(options.headers).length > 0
        ? { headers: options.headers }
        : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SendGrid error: ${res.status} ${err}`);
  }

  const messageId = res.headers.get('x-message-id') ?? `sg-${Date.now()}`;
  return { success: true, messageId, provider: 'sendgrid' };
}

async function sendViaResend(options: EmailOptions): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  const resendAttachments = options.attachments?.map((a) => ({
    filename: a.filename,
    content: a.content.toString('base64'),
  }));

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
      ...(resendAttachments?.length ? { attachments: resendAttachments } : {}),
      ...(options.headers && Object.keys(options.headers).length > 0
        ? { headers: options.headers }
        : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { id: string };
  return { success: true, messageId: data.id, provider: 'resend' };
}

async function sendViaSMTP(options: EmailOptions): Promise<SendResult> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('SMTP credentials not configured');
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const smtpAttachments = options.attachments?.map((a) => ({
    filename: a.filename,
    content: a.content,
    contentType: a.contentType,
  }));

  const info = await transporter.sendMail({
    from: FROM_ADDRESS,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
    attachments: smtpAttachments,
    headers: options.headers,
  });

  return { success: true, messageId: info.messageId, provider: 'smtp' };
}

function getPrimaryProvider(): 'sendgrid' | 'resend' {
  const configured = process.env.EMAIL_PROVIDER?.toLowerCase();
  if (configured === 'sendgrid' && process.env.SENDGRID_API_KEY) return 'sendgrid';
  if (configured === 'resend' && process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SENDGRID_API_KEY) return 'sendgrid';
  return 'resend';
}

let _emailProviderWarningLogged = false;

export function hasEmailProviderConfigured(): boolean {
  return !!(
    process.env.SENDGRID_API_KEY ||
    process.env.RESEND_API_KEY ||
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  );
}

export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  const emailEnabled = await isFlagEnabled('live_email_delivery_enabled');
  if (!emailEnabled) {
    logger.debug(
      { to: options.to, subject: options.subject },
      '[email] Delivery skipped — live_email_delivery_enabled flag is OFF',
    );
    return {
      success: false,
      error: 'Email delivery is disabled (set live_email_delivery_enabled flag to activate)',
    };
  }

  const suppressed = await isEmailSuppressed(options.to);
  if (suppressed) {
    logger.info(
      { to: options.to, subject: options.subject },
      '[email] Delivery skipped — address is on suppression list',
    );
    return { success: false, error: 'Address is on the suppression list' };
  }

  if (!hasEmailProviderConfigured()) {
    if (!_emailProviderWarningLogged) {
      logger.warn(
        'No email provider configured (SENDGRID_API_KEY, RESEND_API_KEY, or SMTP credentials). Email delivery skipped.',
      );
      _emailProviderWarningLogged = true;
    }
    return { success: false, error: 'No email provider configured' };
  }

  const enriched: EmailOptions = { ...options };

  if (options.unsubscribeToken) {
    const appUrl = process.env.APP_URL || 'https://szlholdings.com';
    const unsubscribeUrl = `${appUrl}/api/email/unsubscribe?e=${encodeURIComponent(options.to)}&t=${encodeURIComponent(options.unsubscribeToken)}`;
    const listUnsubscribeHeader = `<${unsubscribeUrl}>, <mailto:unsubscribe@szlholdings.com?subject=unsubscribe>`;
    enriched.headers = {
      ...options.headers,
      'List-Unsubscribe': listUnsubscribeHeader,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
    enriched.html = injectUnsubscribeLink(options.html, unsubscribeUrl);
  }

  const primary = getPrimaryProvider();

  const providers: Array<() => Promise<SendResult>> =
    primary === 'sendgrid'
      ? [() => sendViaSendGrid(enriched), () => sendViaResend(enriched), () => sendViaSMTP(enriched)]
      : [() => sendViaResend(enriched), () => sendViaSendGrid(enriched), () => sendViaSMTP(enriched)];

  let lastError: Error | undefined;
  for (const send of providers) {
    try {
      return await send();
    } catch (err) {
      lastError = err as Error;
    }
  }

  return { success: false, error: `All providers failed. Last error: ${lastError?.message}` };
}

export function getEmailProviderStatus(): { primary: string; available: string[] } {
  const available: string[] = [];
  if (process.env.SENDGRID_API_KEY) available.push('sendgrid');
  if (process.env.RESEND_API_KEY) available.push('resend');
  if (process.env.SMTP_HOST && process.env.SMTP_USER) available.push('smtp');
  return { primary: getPrimaryProvider(), available };
}

// ─── Suppression List ─────────────────────────────────────────────────────────

function getUnsubscribeSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error(
      'UNSUBSCRIBE_SECRET is not configured. Set a cryptographically random secret in the environment.',
    );
  }
  return secret;
}

export function generateUnsubscribeToken(email: string): string {
  return createHmac('sha256', getUnsubscribeSecret()).update(email.toLowerCase().trim()).digest('hex');
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  try {
    const expected = generateUnsubscribeToken(email);
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'));
  } catch {
    return false;
  }
}

export async function isEmailSuppressed(email: string): Promise<boolean> {
  try {
    const result = await getSuppressionPool().query<{ id: number }>(
      'SELECT id FROM email_suppressions WHERE email = $1 LIMIT 1',
      [email.toLowerCase().trim()],
    );
    return result.rows.length > 0;
  } catch (err) {
    logger.warn({ email, err }, '[email] Suppression check failed — allowing send');
    return false;
  }
}

export async function addEmailSuppression(
  email: string,
  reason: 'bounce' | 'complaint' | 'unsubscribe' | 'manual',
  opts?: { providerEventId?: string; provider?: string; detail?: string },
): Promise<void> {
  try {
    await getSuppressionPool().query(
      `INSERT INTO email_suppressions (email, reason, provider_event_id, provider, detail)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [
        email.toLowerCase().trim(),
        reason,
        opts?.providerEventId ?? null,
        opts?.provider ?? null,
        opts?.detail ?? null,
      ],
    );
    logger.info({ email, reason }, '[email] Address added to suppression list');
  } catch (err) {
    logger.error({ email, reason, err }, '[email] Failed to add address to suppression list');
  }
}

function injectUnsubscribeLink(html: string, unsubscribeUrl: string): string {
  const link = `<p style="margin:8px 0 0;font-size:11px;"><a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe from these emails</a></p>`;
  const insertBefore = '</div>\n</div>\n</body>';
  const idx = html.lastIndexOf('</div>');
  if (idx === -1) return html + link;
  return html.slice(0, idx) + link + html.slice(idx);
}

function szlBrand(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SZL Holdings</title>
<style>
  body { margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e5e7eb; }
  .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
  .logo-mark { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #7c3aed); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
  .logo-mark span { color: white; font-weight: 700; font-size: 12px; }
  .logo-text { font-size: 15px; font-weight: 600; color: #111827; }
  h2 { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 12px; }
  p { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 16px; }
  .cta { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 8px; }
  .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
  .footer { font-size: 11px; color: #9ca3af; line-height: 1.6; margin-top: 24px; }
  .highlight { background: #f0f0ff; border-left: 3px solid #6366f1; border-radius: 4px; padding: 12px 16px; margin: 16px 0; }
  .highlight p { margin: 0; font-size: 13px; color: #374151; }
  .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin: 0 0 4px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="logo">
      <div class="logo-mark"><span>SZL</span></div>
      <span class="logo-text">SZL Holdings</span>
    </div>
    ${content}
    <div class="divider"></div>
    <div class="footer">
      <p>SZL Holdings · Washington, D.C. · London · Singapore</p>
      <p>This is a transactional email. You're receiving this because of your interaction with SZL Holdings.</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

export interface AlertFiredEmailOptions {
  ruleName: string;
  severity: string;
  metricName: string;
  metricValue: number;
  condition: string;
  threshold: number;
  alertsUrl?: string;
  notificationUnsubscribeUrl?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  warning: '#d97706',
  info: '#2563eb',
};

export function buildAlertFiredEmail(opts: AlertFiredEmailOptions): {
  subject: string;
  html: string;
  text: string;
} {
  const severityColor = SEVERITY_COLORS[opts.severity.toLowerCase()] ?? '#6b7280';
  const severityLabel = opts.severity.toUpperCase();
  const alertsUrl = opts.alertsUrl ?? 'https://szlholdings.com/command/ops/alerts';

  const subject = `[${severityLabel}] Alert fired: ${opts.ruleName}`;

  const html = szlBrand(`
    <h2 style="color:${severityColor};">&#9888; Alert Fired: ${opts.ruleName}</h2>
    <p style="margin-bottom:20px;">An alert rule has triggered on your SZL Holdings platform. Review the details below and take action if needed.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <tr>
        <td style="padding:8px 0;color:#6b7280;font-weight:500;width:40%;">Severity</td>
        <td style="padding:8px 0;"><strong style="color:${severityColor};">${severityLabel}</strong></td>
      </tr>
      <tr style="border-top:1px solid #f3f4f6;">
        <td style="padding:8px 0;color:#6b7280;font-weight:500;">Metric</td>
        <td style="padding:8px 0;font-family:monospace;">${opts.metricName}</td>
      </tr>
      <tr style="border-top:1px solid #f3f4f6;">
        <td style="padding:8px 0;color:#6b7280;font-weight:500;">Current value</td>
        <td style="padding:8px 0;font-family:monospace;font-weight:700;">${opts.metricValue}</td>
      </tr>
      <tr style="border-top:1px solid #f3f4f6;">
        <td style="padding:8px 0;color:#6b7280;font-weight:500;">Threshold</td>
        <td style="padding:8px 0;font-family:monospace;">${opts.condition} ${opts.threshold}</td>
      </tr>
    </table>
    <a href="${alertsUrl}" class="cta">View Alerts Dashboard</a>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">This is an automated alert from the SZL Holdings Ops Center. No reply is needed.</p>${
      opts.notificationUnsubscribeUrl
        ? `\n    <p style="margin:8px 0 0;font-size:11px;"><a href="${opts.notificationUnsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe from alert emails</a></p>`
        : ''
    }
  `);

  const text = [
    `[${severityLabel}] Alert Fired: ${opts.ruleName}`,
    ``,
    `Severity:      ${severityLabel}`,
    `Metric:        ${opts.metricName}`,
    `Current value: ${opts.metricValue}`,
    `Threshold:     ${opts.condition} ${opts.threshold}`,
    ``,
    `View alerts: ${alertsUrl}`,
    ``,
    `This is an automated alert from the SZL Holdings Ops Center.`,
    ...(opts.notificationUnsubscribeUrl
      ? [``, `Unsubscribe from alert emails: ${opts.notificationUnsubscribeUrl}`]
      : []),
  ].join('\n');

  return { subject, html, text };
}

export function buildInquiryAckEmail(name: string, subject: string): string {
  return szlBrand(`
    <h2>We received your inquiry</h2>
    <p>Thank you, ${name}. Your message has been received and routed to the appropriate member of our team.</p>
    <div class="highlight">
      <p class="label">Subject</p>
      <p>${subject}</p>
    </div>
    <p>Our team typically responds within <strong>24 business hours</strong>. For time-sensitive matters, you can reach us directly at <strong>inquiries@szlholdings.com</strong>.</p>
    <p>While you wait, explore our latest research and platform insights:</p>
    <a class="cta" href="https://szlholdings.com/insights">Read Our Insights</a>
  `);
}

export function buildLeadNotificationEmail(inquiry: {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  intent?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
}): string {
  const hasUtm =
    inquiry.utm_source || inquiry.utm_medium || inquiry.utm_campaign || inquiry.utm_content;
  return szlBrand(`
    <h2>New Inquiry Received</h2>
    <p>A new inquiry has been submitted through the SZL Holdings contact form.</p>
    <div class="highlight">
      <p class="label">From</p>
      <p>${inquiry.name}${inquiry.company ? ` · ${inquiry.company}` : ''}</p>
      <p class="label" style="margin-top:8px;">Email</p>
      <p>${inquiry.email}</p>
      <p class="label" style="margin-top:8px;">Subject</p>
      <p>${inquiry.subject}</p>
      <p class="label" style="margin-top:8px;">Message</p>
      <p>${inquiry.message.replace(/\n/g, '<br />')}</p>${
        inquiry.intent
          ? `
      <p class="label" style="margin-top:8px;">Intent</p>
      <p>${inquiry.intent}</p>`
          : ''
      }${
        inquiry.source
          ? `
      <p class="label" style="margin-top:8px;">Source</p>
      <p>${inquiry.source}</p>`
          : ''
      }${
        hasUtm
          ? `
      <p class="label" style="margin-top:8px;">Attribution</p>
      <p>${[
        inquiry.utm_source ? `source: ${inquiry.utm_source}` : '',
        inquiry.utm_medium ? `medium: ${inquiry.utm_medium}` : '',
        inquiry.utm_campaign ? `campaign: ${inquiry.utm_campaign}` : '',
        inquiry.utm_content ? `content: ${inquiry.utm_content}` : '',
      ]
        .filter(Boolean)
        .join(' · ')}</p>`
          : ''
      }
    </div>
    <p>Review and respond in the admin panel or reply directly to this email.</p>
    <a class="cta" href="${process.env.VITE_APP_URL || 'https://szlholdings.com'}/admin">Open Admin</a>
  `);
}

export function buildWelcomeEmail(name: string, _email: string): string {
  return szlBrand(`
    <h2>Welcome to SZL Holdings</h2>
    <p>Hello ${name},</p>
    <p>You're now connected to SZL Holdings — we build <strong>Lyte</strong>, a business observability platform that surfaces revenue stalls, approval gaps, and ownership drift before they compound.</p>
    <p>Powered by <strong>Counsel</strong>, our execution fabric that routes signals to accountable action.</p>
    <div class="highlight">
      <p><strong>Lyte</strong> — Business observability. Surfaces what's stalling, aging, or drifting before it costs you.</p>
    </div>
    <div class="highlight">
      <p><strong>Counsel</strong> — Execution fabric. Workflow orchestration, signal routing, audit trail, and policy-gated action.</p>
    </div>
    <p>Explore the platform:</p>
    <a class="cta" href="${process.env.VITE_APP_URL || 'https://szlholdings.com'}">Visit SZL Holdings</a>
  `);
}

export function buildBookingAckEmail(
  name: string,
  appointmentType: string,
  scheduledAt?: string,
): string {
  return szlBrand(`
    <h2>Booking Confirmed</h2>
    <p>Hello ${name},</p>
    <p>Your ${appointmentType} booking with SZL Holdings has been confirmed.</p>
    ${
      scheduledAt
        ? `
    <div class="highlight">
      <p class="label">Scheduled</p>
      <p>${scheduledAt}</p>
    </div>
    `
        : ''
    }
    <p>Our team will prepare a briefing tailored to your organization's interests. We look forward to exploring how the SZL ecosystem can accelerate your strategic objectives.</p>
    <p>If you need to reschedule or have questions beforehand, reply to this email or contact us at <strong>inquiries@szlholdings.com</strong>.</p>
    <a class="cta" href="${process.env.VITE_APP_URL || 'https://szlholdings.com'}/corporate">About SZL Holdings</a>
  `);
}

export function buildVerifyEmailTemplate(name: string, verifyUrl: string): string {
  return szlBrand(`
    <h2>Verify Your Email Address</h2>
    <p>Hello ${name},</p>
    <p>Thanks for registering with SZL Holdings. Please verify your email address to activate your account and gain access to the full SZL ecosystem.</p>
    <div class="highlight">
      <p class="label">What happens next</p>
      <p>Click the button below to confirm your email. This link expires in <strong>24 hours</strong>.</p>
    </div>
    <a class="cta" href="${verifyUrl}">Verify Email Address</a>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">If you didn't create this account, you can safely ignore this email. If you're having trouble clicking the button, copy and paste this URL into your browser: <span style="word-break:break-all;">${verifyUrl}</span></p>
  `);
}

export function buildPasswordResetEmail(name: string, resetUrl: string): string {
  return szlBrand(`
    <h2>Reset Your Password</h2>
    <p>Hello ${name},</p>
    <p>We received a request to reset the password for your SZL Holdings account. If you made this request, click the button below.</p>
    <div class="highlight">
      <p class="label">Security Notice</p>
      <p>This link expires in <strong>1 hour</strong>. If you didn't request a password reset, please contact us immediately at <strong>security@szlholdings.com</strong>.</p>
    </div>
    <a class="cta" href="${resetUrl}">Reset Password</a>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">If you're having trouble clicking the button, copy and paste this URL into your browser: <span style="word-break:break-all;">${resetUrl}</span></p>
  `);
}

export function buildDemoConfirmationEmail(
  name: string,
  company: string,
  scheduledAt: string,
  calendarUrl?: string,
): string {
  return szlBrand(`
    <h2>Demo Confirmed — SZL Holdings</h2>
    <p>Hello ${name},</p>
    <p>Your product demonstration has been scheduled. We're looking forward to walking you through the full SZL ecosystem and understanding how we can serve <strong>${company}</strong>.</p>
    <div class="highlight">
      <p class="label">Session Details</p>
      <p><strong>Date &amp; Time:</strong> ${scheduledAt}</p>
      <p><strong>Format:</strong> Private video walkthrough with Q&amp;A</p>
      <p><strong>Duration:</strong> 45–60 minutes</p>
    </div>
    <p>Our team will send dial-in details 30 minutes before the session. If you need to reschedule, reply to this email.</p>
    ${calendarUrl ? `<a class="cta" href="${calendarUrl}">Add to Calendar</a>` : `<a class="cta" href="https://szlholdings.com">Visit SZL Holdings</a>`}
  `);
}

export function buildAccessRequestConfirmationEmail(
  name: string,
  productName: string,
  requestId: string,
): string {
  return szlBrand(`
    <h2>Access Request Received</h2>
    <p>Hello ${name},</p>
    <p>Your request for access to <strong>${productName}</strong> has been received and is under review by our team.</p>
    <div class="highlight">
      <p class="label">Request Reference</p>
      <p><strong>#${requestId}</strong></p>
    </div>
    <p>Access requests are typically reviewed within <strong>2–3 business days</strong>. You will receive an email notification once a decision has been made. For enterprise or priority access, please contact us directly.</p>
    <div class="highlight">
      <p>Enterprise inquiries: <strong>enterprise@szlholdings.com</strong></p>
    </div>
    <a class="cta" href="https://szlholdings.com/corporate">Learn More About SZL</a>
  `);
}

export function buildClientPortalInviteEmail(
  name: string,
  company: string,
  inviteUrl: string,
  expiresAt: string,
): string {
  return szlBrand(`
    <h2>You're Invited to the SZL Client Portal</h2>
    <p>Hello ${name},</p>
    <p>You have been granted access to the SZL Holdings client portal on behalf of <strong>${company}</strong>. This secure portal gives you direct visibility into project status, reporting, and communications.</p>
    <div class="highlight">
      <p class="label">Invitation Details</p>
      <p><strong>Organization:</strong> ${company}</p>
      <p><strong>Access Expires:</strong> ${expiresAt}</p>
    </div>
    <p>Click below to set up your credentials and access the portal. This invitation link can only be used once.</p>
    <a class="cta" href="${inviteUrl}">Accept Invitation</a>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">If you did not expect this invitation, please contact us at <strong>security@szlholdings.com</strong>. Do not share this link with others.</p>
  `);
}

export function buildOrgInviteEmail(params: {
  orgName: string;
  inviteUrl: string;
  role: string;
  expiresAt: string;
  invitedByName?: string;
}): string {
  const { orgName, inviteUrl, role, expiresAt, invitedByName } = params;
  return szlBrand(`
    <h2>You've been invited to join ${orgName}</h2>
    <p>Hello,</p>
    <p>${invitedByName ? `<strong>${invitedByName}</strong> has invited you` : 'You have been invited'} to join <strong>${orgName}</strong> on the SZL Holdings platform as a <strong>${role}</strong>.</p>
    <div class="highlight">
      <p class="label">Organization</p>
      <p>${orgName}</p>
      <p class="label" style="margin-top:8px;">Role</p>
      <p>${role.charAt(0).toUpperCase() + role.slice(1)}</p>
      <p class="label" style="margin-top:8px;">Invitation expires</p>
      <p>${expiresAt}</p>
    </div>
    <p>Click below to accept the invitation and set up your account. This link can only be used once.</p>
    <a class="cta" href="${inviteUrl}">Accept Invitation</a>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">If you did not expect this invitation, you can safely ignore this email. If you have concerns, contact us at <strong>security@szlholdings.com</strong>.</p>
  `);
}

export function buildNotificationDigestEmail(params: {
  userName: string;
  date: string;
  notifications: Array<{
    title: string;
    message: string;
    type: string;
    actionUrl?: string | null;
    createdAt: string;
  }>;
  unsubscribeUrl?: string;
}): string {
  const { userName, date, notifications, unsubscribeUrl } = params;

  const typeLabel: Record<string, string> = {
    info: 'Info',
    success: 'Success',
    warning: 'Warning',
    error: 'Alert',
    action_required: 'Action Required',
  };

  const typeColor: Record<string, string> = {
    info: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    action_required: '#f59e0b',
  };

  const items = notifications
    .map((n) => {
      const color = typeColor[n.type] ?? '#6366f1';
      const label = typeLabel[n.type] ?? n.type;
      const time = new Date(n.createdAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      return `
    <div style="border-left:3px solid ${color};padding:10px 14px;margin:10px 0;background:#f9fafb;border-radius:4px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${color};">${label}</span>
        <span style="font-size:11px;color:#9ca3af;">${time}</span>
      </div>
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#111827;">${n.title}</p>
      <p style="margin:0;font-size:13px;color:#4b5563;">${n.message}</p>
      ${n.actionUrl ? `<a href="${n.actionUrl.startsWith('http') ? n.actionUrl : `${process.env.APP_URL || 'https://szlholdings.com'}${n.actionUrl}`}" style="font-size:12px;color:#6366f1;text-decoration:none;margin-top:6px;display:inline-block;">View →</a>` : ''}
    </div>`;
    })
    .join('');

  return szlBrand(`
    <h2>Your Daily Digest — ${date}</h2>
    <p>Hello ${userName},</p>
    <p>Here's a summary of your <strong>${notifications.length} unread notification${notifications.length !== 1 ? 's' : ''}</strong> from the past 24 hours.</p>
    ${items}
    <div class="divider"></div>
    <p style="font-size:13px;color:#6b7280;">To manage your notification preferences or turn off digest emails, visit your account settings.</p>
    <a class="cta" href="${process.env.APP_URL || 'https://szlholdings.com'}/settings/notifications">Manage Preferences</a>
    ${unsubscribeUrl ? `<p style="margin:12px 0 0;font-size:11px;"><a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe from digest emails</a></p>` : ''}
  `);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  closed: 'Closed',
  lost: 'Lost',
};

export function buildTicketStatusEmail(params: {
  name: string;
  previousStatus?: string;
  newStatus: string;
  notes?: string | null;
  ticketId: number;
}): { subject: string; html: string; text: string } {
  const { name, previousStatus, newStatus, notes, ticketId } = params;
  const statusLabel = STATUS_LABELS[newStatus] ?? escapeHtml(newStatus);
  const safeName = escapeHtml(name);

  const subject = `Update on your inquiry — ${statusLabel}`;

  const notesBlock = notes
    ? `<div class="highlight"><p class="label">Note from our team</p><p>${escapeHtml(notes).replace(/\n/g, '<br />')}</p></div>`
    : '';

  const html = szlBrand(`
    <h2>Your Inquiry Has Been Updated</h2>
    <p>Hello ${safeName},</p>
    <p>We wanted to keep you informed — our team has updated the status of your inquiry.</p>
    <div class="highlight">
      <p class="label">Status</p>
      <p><strong>${statusLabel}</strong></p>
      ${previousStatus && previousStatus !== newStatus ? `<p style="margin-top:4px;font-size:12px;color:#9ca3af;">Previously: ${STATUS_LABELS[previousStatus] ?? escapeHtml(previousStatus)}</p>` : ''}
    </div>
    ${notesBlock}
    <p>If you have any questions or need further assistance, feel free to reply directly to this email or contact us at <strong>inquiries@szlholdings.com</strong>.</p>
    <a class="cta" href="mailto:inquiries@szlholdings.com">Reply to Our Team</a>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">Inquiry reference: #${ticketId}</p>
  `);

  const textParts = [
    `Your Inquiry Has Been Updated`,
    ``,
    `Hello ${name},`,
    ``,
    `Our team has updated the status of your inquiry.`,
    ``,
    `Status: ${statusLabel}`,
    ...(previousStatus && previousStatus !== newStatus
      ? [`Previously: ${STATUS_LABELS[previousStatus] ?? previousStatus}`]
      : []),
    ...(notes ? [``, `Note from our team:`, notes] : []),
    ``,
    `If you have questions, reply to this email or contact inquiries@szlholdings.com.`,
    ``,
    `Inquiry reference: #${ticketId}`,
  ];

  return { subject, html, text: textParts.join('\n') };
}

export function buildBillingNotificationEmail(params: {
  name: string;
  eventType:
    | 'invoice_paid'
    | 'invoice_due'
    | 'payment_failed'
    | 'subscription_renewed'
    | 'subscription_cancelled'
    | 'trial_ending';
  amount?: string;
  currency?: string;
  invoiceUrl?: string;
  dueDate?: string;
  renewalDate?: string;
  trialEndDate?: string;
}): string {
  const {
    name,
    eventType,
    amount,
    currency = 'USD',
    invoiceUrl,
    dueDate,
    renewalDate,
    trialEndDate,
  } = params;

  const eventMessages: Record<typeof eventType, { title: string; body: string }> = {
    invoice_paid: {
      title: 'Payment Received',
      body: `Your payment of <strong>${amount} ${currency}</strong> has been successfully processed. Your services remain active and uninterrupted.`,
    },
    invoice_due: {
      title: 'Invoice Due Soon',
      body: `An invoice of <strong>${amount} ${currency}</strong> is due on <strong>${dueDate}</strong>. Please ensure your payment method is up to date to avoid any service interruption.`,
    },
    payment_failed: {
      title: 'Payment Failed — Action Required',
      body: `We were unable to process your payment of <strong>${amount} ${currency}</strong>. Please update your payment method immediately to avoid service interruption.`,
    },
    subscription_renewed: {
      title: 'Subscription Renewed',
      body: `Your SZL Holdings subscription has been successfully renewed. Your next billing date is <strong>${renewalDate}</strong>.`,
    },
    subscription_cancelled: {
      title: 'Subscription Cancelled',
      body: `Your subscription has been cancelled. You will continue to have access until your current billing period ends. We're sorry to see you go — contact us if there's anything we can improve.`,
    },
    trial_ending: {
      title: 'Your Trial is Ending Soon',
      body: `Your free trial ends on <strong>${trialEndDate}</strong>. To continue accessing SZL Holdings services without interruption, please upgrade your plan before that date.`,
    },
  };

  const { title, body } = eventMessages[eventType];

  return szlBrand(`
    <h2>${title}</h2>
    <p>Hello ${name},</p>
    <p>${body}</p>
    ${
      invoiceUrl
        ? `
    <div class="highlight">
      <p class="label">Invoice</p>
      <p>View and download your invoice for your records.</p>
    </div>
    <a class="cta" href="${invoiceUrl}">View Invoice</a>
    `
        : `<a class="cta" href="https://szlholdings.com/billing">Manage Billing</a>`
    }
    <p style="margin-top:16px;font-size:12px;color:#9ca3af;">Questions about your billing? Contact <strong>billing@szlholdings.com</strong></p>
  `);
}

function stephenBrand(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Stephen Lutar</title>
<style>
  body { margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #111111; border-radius: 12px; padding: 40px; border: 1px solid rgba(255,255,255,0.08); }
  .logo { font-size: 15px; font-weight: 700; color: #ffffff; margin-bottom: 32px; letter-spacing: -0.02em; }
  .logo span { color: rgba(255,255,255,0.35); font-weight: 400; }
  h2 { font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 12px; }
  p { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.6; margin: 0 0 16px; }
  .highlight { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px 16px; margin: 16px 0; }
  .highlight p { margin: 0; font-size: 13px; color: rgba(255,255,255,0.65); }
  .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(255,255,255,0.25); margin: 0 0 4px; }
  .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 24px 0; }
  .footer { font-size: 11px; color: rgba(255,255,255,0.2); line-height: 1.6; margin-top: 24px; }
  a.cta { display: inline-block; padding: 11px 22px; background: rgba(255,255,255,0.9); color: #0a0a0a; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px; margin-top: 8px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="logo">Stephen Lutar <span>/ SZL Holdings</span></div>
    ${content}
    <div class="divider"></div>
    <div class="footer">
      <p>stephenlutar.com · London, UK</p>
      <p>This is a transactional email sent because you submitted a contact form.</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

export function buildStephenContactAckEmail(name: string, inquiryType: string): string {
  return stephenBrand(`
    <h2>Message received</h2>
    <p>Thank you, ${name}. Your message has arrived and I'll review it shortly.</p>
    <div class="highlight">
      <p class="label">Inquiry type</p>
      <p>${inquiryType}</p>
    </div>
    <p>I respond to most inquiries within two business days. For time-sensitive opportunities, feel free to connect on LinkedIn.</p>
    <a class="cta" href="https://linkedin.com/in/stephenlutar">Connect on LinkedIn</a>
  `);
}

export function buildStephenStatusUpdateEmail(args: {
  name: string;
  status: 'confirmed' | 'declined' | 'completed';
  note?: string;
}): string {
  const headlines: Record<typeof args.status, string> = {
    confirmed: 'Design partner application accepted',
    declined: 'Design partner application update',
    completed: 'Design partner engagement complete',
  };
  const bodies: Record<typeof args.status, string> = {
    confirmed: `Thank you, ${args.name}. Your application has been accepted. I'll follow up shortly to schedule a working session and share the design partner brief.`,
    declined: `Thank you, ${args.name}, for your interest in becoming a design partner. After review, we are not moving this conversation forward at this time. I appreciate the time you took to write in and wish you the very best.`,
    completed: `Thank you, ${args.name}. Marking our design partner engagement as complete. It has been a pleasure to build alongside your team.`,
  };
  return stephenBrand(`
    <h2>${headlines[args.status]}</h2>
    <p>${bodies[args.status]}</p>
    ${args.note ? `<div class="highlight"><p class="label">A note from Stephen</p><p>${args.note.replace(/\n/g, '<br />')}</p></div>` : ''}
    <p>If you'd like to follow up directly, just reply to this email.</p>
  `);
}

export function buildStephenContactNotificationEmail(inquiry: {
  name: string;
  email: string;
  company?: string;
  type: string;
  message: string;
}): string {
  return stephenBrand(`
    <h2>New Contact Form Submission</h2>
    <p>A new inquiry has arrived through your contact form.</p>
    <div class="highlight">
      <p class="label">From</p>
      <p>${inquiry.name}${inquiry.company ? ` · ${inquiry.company}` : ''}</p>
      <p class="label" style="margin-top:8px;">Email</p>
      <p>${inquiry.email}</p>
      <p class="label" style="margin-top:8px;">Type</p>
      <p>${inquiry.type}</p>
      <p class="label" style="margin-top:8px;">Message</p>
      <p>${inquiry.message.replace(/\n/g, '<br />')}</p>
    </div>
    <p>Reply directly to this email to respond to ${inquiry.name}.</p>
  `);
}

function carlotaBrand(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Carlota Jo Advisory</title>
<style>
  body { margin: 0; padding: 0; background: #faf9f7; font-family: Georgia, 'Times New Roman', serif; }
  .wrapper { max-width: 560px; margin: 0 auto; padding: 48px 24px; }
  .card { background: #ffffff; padding: 48px; border: 1px solid #e8e2d9; }
  .logo { font-size: 13px; letter-spacing: 0.25em; text-transform: uppercase; color: #a07850; margin-bottom: 40px; font-family: -apple-system, sans-serif; font-weight: 500; }
  h2 { font-size: 22px; font-weight: 400; color: #1a1a1a; margin: 0 0 16px; font-style: italic; }
  p { font-size: 14px; color: #4a4a4a; line-height: 1.75; margin: 0 0 16px; font-family: -apple-system, sans-serif; font-weight: 300; }
  .highlight { border-left: 2px solid #c9a97a; padding: 12px 16px; margin: 20px 0; background: #fdf8f2; }
  .highlight p { margin: 0 0 6px; font-size: 13px; }
  .highlight p:last-child { margin: 0; }
  .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; color: #a07850; font-family: -apple-system, sans-serif; }
  .divider { height: 1px; background: #e8e2d9; margin: 32px 0; }
  .footer { font-size: 11px; color: #9a8a78; line-height: 1.6; font-family: -apple-system, sans-serif; }
  a.cta { display: inline-block; padding: 12px 24px; border: 1px solid #c9a97a; color: #a07850; text-decoration: none; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; font-family: -apple-system, sans-serif; font-weight: 500; margin-top: 8px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="logo">Carlota Jo Advisory</div>
    ${content}
    <div class="divider"></div>
    <div class="footer">
      <p>Carlota Jo Advisory · Private &amp; Confidential</p>
      <p>This communication is sent in response to your inquiry and is handled with absolute discretion.</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

export interface CarlotaRadarSignalSummary {
  competitor: string;
  event: string;
  date: string;
  detail: string;
  url?: string;
  source?: string;
}

export function buildCarlotaRadarAlertEmail(opts: {
  recipientName?: string;
  signal: CarlotaRadarSignalSummary;
  radarUrl?: string;
}): { subject: string; html: string } {
  const radarUrl =
    opts.radarUrl ||
    `${process.env.VITE_APP_URL || 'https://carlotajo.com'}/carlota-jo/competitive-radar`;
  const subject = `[High impact] ${opts.signal.competitor}: ${opts.signal.event.slice(0, 80)}`;
  const html = carlotaBrand(`
    <h2 style="color:#a07850;">High-impact competitor signal</h2>
    <p>${opts.recipientName ? `${opts.recipientName}, a` : 'A'} new high-impact signal has landed on your competitive radar.</p>
    <div class="highlight">
      <p class="label">${opts.signal.competitor} · ${opts.signal.date}</p>
      <p style="font-weight:600;margin:4px 0 8px;">${opts.signal.event}</p>
      <p style="font-size:13px;color:#555;">${opts.signal.detail}</p>
      ${opts.signal.source ? `<p style="font-size:11px;color:#888;margin-top:8px;">Source: ${opts.signal.source}</p>` : ''}
    </div>
    ${opts.signal.url ? `<p><a href="${opts.signal.url}" style="color:#a07850;">Open original article →</a></p>` : ''}
    <a class="cta" href="${radarUrl}">Open Competitive Radar</a>
    <p style="font-size:11px;color:#999;margin-top:16px;">Manage your alert preferences from the radar settings panel.</p>
  `);
  return { subject, html };
}

export function buildCarlotaRadarDigestEmail(opts: {
  recipientName?: string;
  frequency: 'daily' | 'weekly';
  signals: CarlotaRadarSignalSummary[];
  radarUrl?: string;
}): { subject: string; html: string } {
  const radarUrl =
    opts.radarUrl ||
    `${process.env.VITE_APP_URL || 'https://carlotajo.com'}/carlota-jo/competitive-radar`;
  const window = opts.frequency === 'daily' ? 'today' : 'this week';
  const subject = `Competitive Radar — ${opts.signals.length} high-impact signal${opts.signals.length === 1 ? '' : 's'} ${window}`;
  const items = opts.signals
    .map(
      (s) => `
    <div style="border-left:3px solid #c9a97a;padding:8px 12px;margin:8px 0;background:#faf7f2;">
      <p style="margin:0;font-size:11px;color:#a07850;text-transform:uppercase;letter-spacing:0.1em;">${s.competitor} · ${s.date}</p>
      <p style="margin:4px 0;font-weight:600;">${s.event}</p>
      <p style="margin:0;font-size:12px;color:#555;">${s.detail}</p>
      ${s.url ? `<p style="margin:6px 0 0;"><a href="${s.url}" style="font-size:11px;color:#a07850;">Open article →</a></p>` : ''}
    </div>
  `,
    )
    .join('');
  const html = carlotaBrand(`
    <h2 style="color:#a07850;">Competitive Radar — ${opts.frequency === 'daily' ? 'Daily' : 'Weekly'} digest</h2>
    <p>${opts.recipientName ? `${opts.recipientName},` : ''} ${opts.signals.length} high-impact competitor signal${opts.signals.length === 1 ? '' : 's'} landed ${window}.</p>
    ${items}
    <a class="cta" href="${radarUrl}">Open Competitive Radar</a>
    <p style="font-size:11px;color:#999;margin-top:16px;">Manage your alert preferences from the radar settings panel.</p>
  `);
  return { subject, html };
}

export function buildCarlotaContactAckEmail(name: string): string {
  return carlotaBrand(`
    <h2>Inquiry received.</h2>
    <p>Thank you, ${name}. Your inquiry has been received and will be reviewed by a senior member of the advisory team.</p>
    <div class="highlight">
      <p class="label">What to expect</p>
      <p>All inquiries are handled with absolute discretion. You will receive a personal response within one business day.</p>
    </div>
    <p>Should you have an urgent matter, please contact us directly at <strong>hello@carlotajo.com</strong>.</p>
    <a class="cta" href="${process.env.VITE_APP_URL || 'https://carlotajo.com'}/carlota-jo">Visit Our Site</a>
  `);
}

export interface CarlotaInvoiceEmailData {
  invoiceId: string;
  clientName: string;
  engagement: string;
  issuedDate: string;
  dueDate: string;
  amount: number;
  currency?: string;
  items?: Array<{
    date: string;
    phase: string;
    deliverable: string;
    hours: number;
    rate: number;
    rateType: 'standard' | 'premium' | 'fixed' | 'non-billable';
    amount: number;
  }>;
  fromName?: string;
  fromEmail?: string;
  notes?: string;
}

export function buildCarlotaInvoiceEmail(invoice: CarlotaInvoiceEmailData): string {
  const currency = invoice.currency || 'GBP';
  const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
  const fmt = (n: number) =>
    `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const itemsHtml =
    invoice.items && invoice.items.length > 0
      ? `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-family:-apple-system,sans-serif;">
        <thead>
          <tr style="border-bottom:1px solid #c9a97a;">
            <th style="text-align:left;padding:8px 4px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#a07850;font-weight:600;">Date</th>
            <th style="text-align:left;padding:8px 4px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#a07850;font-weight:600;">Description</th>
            <th style="text-align:right;padding:8px 4px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#a07850;font-weight:600;">Hours</th>
            <th style="text-align:right;padding:8px 4px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#a07850;font-weight:600;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items
            .map(
              (it) => `
            <tr style="border-bottom:1px solid #f0ebe0;">
              <td style="padding:10px 4px;font-size:12px;color:#4a4a4a;vertical-align:top;">${it.date}</td>
              <td style="padding:10px 4px;font-size:12px;color:#1a1a1a;vertical-align:top;">
                <div style="font-weight:600;">${it.phase}</div>
                <div style="color:#6b5e47;font-size:11px;margin-top:2px;">${it.deliverable}</div>
              </td>
              <td style="padding:10px 4px;font-size:12px;color:#4a4a4a;text-align:right;vertical-align:top;">${it.hours.toFixed(2)}</td>
              <td style="padding:10px 4px;font-size:12px;color:#1a1a1a;text-align:right;vertical-align:top;">${fmt(it.amount)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    `
      : `<p style="font-size:12px;color:#6b5e47;font-style:italic;">Summary invoice — line item details available on request.</p>`;

  return carlotaBrand(`
    <h2>Invoice ${invoice.invoiceId}</h2>
    <p>Dear ${invoice.clientName},</p>
    <p>Please find attached your invoice for <strong>${invoice.engagement}</strong>. We thank you for your continued partnership.</p>
    <div class="highlight">
      <p class="label">Invoice Reference</p>
      <p style="font-size:14px;color:#1a1a1a;font-weight:600;">${invoice.invoiceId}</p>
      <p class="label" style="margin-top:10px;">Engagement</p>
      <p>${invoice.engagement}</p>
      <p class="label" style="margin-top:10px;">Issued</p>
      <p>${invoice.issuedDate}</p>
      <p class="label" style="margin-top:10px;">Due</p>
      <p>${invoice.dueDate}</p>
    </div>
    ${itemsHtml}
    <table style="width:100%;border-collapse:collapse;margin-top:8px;font-family:-apple-system,sans-serif;">
      <tr>
        <td style="padding:8px 4px;font-size:13px;color:#6b5e47;text-align:right;">Subtotal</td>
        <td style="padding:8px 4px;font-size:13px;color:#1a1a1a;text-align:right;width:120px;">${fmt(invoice.amount)}</td>
      </tr>
      <tr style="border-top:1px solid #1a1a1a;">
        <td style="padding:12px 4px;font-size:14px;color:#1a1a1a;text-align:right;font-weight:600;">Total Due</td>
        <td style="padding:12px 4px;font-size:16px;color:#1a1a1a;text-align:right;font-weight:700;font-family:Georgia,serif;">${fmt(invoice.amount)}</td>
      </tr>
    </table>
    ${invoice.notes ? `<p style="font-size:12px;color:#6b5e47;font-style:italic;margin-top:16px;">${invoice.notes}</p>` : ''}
    <p style="margin-top:24px;">Payment terms: <strong>Net 15</strong>. Please remit via bank transfer to the account on file. For any questions regarding this invoice, reply directly to this email or contact <strong>billing@carlotajo.com</strong>.</p>
    <p>With appreciation,<br /><em>Carlota Jo Advisory</em></p>
  `);
}

export function buildCarlotaInquiryNotificationEmail(inquiry: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  service?: string;
  message: string;
}): string {
  return carlotaBrand(`
    <h2>New private inquiry.</h2>
    <p>A new inquiry has been submitted through the Carlota Jo Advisory contact form.</p>
    <div class="highlight">
      <p class="label">From</p>
      <p>${inquiry.name}${inquiry.company ? ` — ${inquiry.company}` : ''}</p>
      <p class="label" style="margin-top:10px;">Email</p>
      <p>${inquiry.email}</p>
      ${inquiry.phone ? `<p class="label" style="margin-top:10px;">Phone</p><p>${inquiry.phone}</p>` : ''}
      ${inquiry.service ? `<p class="label" style="margin-top:10px;">Service interest</p><p>${inquiry.service}</p>` : ''}
      <p class="label" style="margin-top:10px;">Message</p>
      <p>${inquiry.message.replace(/\n/g, '<br />')}</p>
    </div>
    <p>Reply directly to this email to respond to ${inquiry.name}.</p>
  `);
}

const STEPHEN_ADMIN_EMAIL =
  process.env.STEPHEN_ADMIN_EMAIL || process.env.SZL_INTERNAL_EMAIL || 'stephen@szlholdings.com';
const CARLOTA_ADMIN_EMAIL =
  process.env.CARLOTA_ADMIN_EMAIL || process.env.SZL_INTERNAL_EMAIL || 'hello@carlotajo.com';

export { CARLOTA_ADMIN_EMAIL, INTERNAL_EMAIL, STEPHEN_ADMIN_EMAIL };

// ─── Tenant-Branded Email Templates ──────────────────────────────────────────

export interface TenantEmailBranding {
  companyName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  emailFromName?: string | null;
  emailFooterText?: string | null;
  tagline?: string | null;
}

export function buildTenantBrand(branding: TenantEmailBranding, content: string): string {
  const primaryColor = branding.primaryColor || '#6366f1';
  const accentColor = branding.accentColor || '#7c3aed';
  const companyName = branding.companyName || 'SZL Holdings';
  const footerText = branding.emailFooterText || `${companyName} · Powered by SZL Holdings`;

  const logoHtml = branding.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${companyName}" style="height:28px;object-fit:contain;max-width:180px;" />`
    : `<div style="display:inline-flex;align-items:center;gap:8px;">
        <div style="width:28px;height:28px;background:linear-gradient(135deg,${primaryColor},${accentColor});border-radius:7px;display:inline-flex;align-items:center;justify-content:center;">
          <span style="color:white;font-weight:700;font-size:11px;">${companyName.charAt(0)}</span>
        </div>
        <span style="font-size:14px;font-weight:600;color:#111827;">${companyName}</span>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${companyName}</title>
<style>
  body { margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e5e7eb; }
  .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; }
  h2 { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 12px; }
  p { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 16px; }
  .cta { display: inline-block; padding: 12px 24px; background: ${primaryColor}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 8px; }
  .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
  .footer { font-size: 11px; color: #9ca3af; line-height: 1.6; margin-top: 24px; }
  .highlight { background: #f8f7ff; border-left: 3px solid ${primaryColor}; border-radius: 4px; padding: 12px 16px; margin: 16px 0; }
  .highlight p { margin: 0; font-size: 13px; color: #374151; }
  .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin: 0 0 4px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="logo">
      ${logoHtml}
    </div>
    ${content}
    <div class="divider"></div>
    <div class="footer">
      <p>${footerText}</p>
      <p>This is a transactional notification sent on behalf of ${companyName}.</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

export function buildTenantWelcomeEmail(
  branding: TenantEmailBranding,
  name: string,
  dashboardUrl?: string,
): string {
  const companyName = branding.companyName || 'the platform';
  return buildTenantBrand(
    branding,
    `
    <h2>Welcome to ${companyName}</h2>
    <p>Hello ${name},</p>
    <p>Your account has been created and you now have access to <strong>${companyName}</strong>. You can sign in and get started right away.</p>
    ${dashboardUrl ? `<a class="cta" href="${dashboardUrl}">Access Your Dashboard</a>` : ''}
  `,
  );
}

export function buildTenantInviteEmail(
  branding: TenantEmailBranding,
  name: string,
  inviteUrl: string,
  expiresAt?: string,
): string {
  const companyName = branding.companyName || 'the platform';
  return buildTenantBrand(
    branding,
    `
    <h2>You've been invited</h2>
    <p>Hello ${name},</p>
    <p>You have been invited to join <strong>${companyName}</strong>. Click the button below to set up your account.</p>
    ${
      expiresAt
        ? `
    <div class="highlight">
      <p class="label">Invitation Expires</p>
      <p>${expiresAt}</p>
    </div>
    `
        : ''
    }
    <a class="cta" href="${inviteUrl}">Accept Invitation</a>
    <p style="margin-top:16px;font-size:12px;color:#9ca3af;">If you did not expect this invitation, you can safely ignore this email.</p>
  `,
  );
}

export function buildTenantNotificationEmail(
  branding: TenantEmailBranding,
  title: string,
  body: string,
  ctaLabel?: string,
  ctaUrl?: string,
): string {
  return buildTenantBrand(
    branding,
    `
    <h2>${title}</h2>
    <p>${body}</p>
    ${ctaLabel && ctaUrl ? `<a class="cta" href="${ctaUrl}">${ctaLabel}</a>` : ''}
  `,
  );
}

export function buildSupportTicketConfirmationEmail(params: {
  submitterName: string;
  ticketRef: string;
  subject: string;
  category: string;
  priority: string;
}): string {
  const priorityLabel = params.priority.charAt(0).toUpperCase() + params.priority.slice(1);
  const categoryLabel = params.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return szlBrand(`
    <h2>Support ticket received</h2>
    <p>Hi ${params.submitterName}, your support request has been logged and our team will be in touch shortly.</p>
    <div class="highlight">
      <p class="label">Reference</p>
      <p style="font-weight:600;font-size:15px;">${params.ticketRef}</p>
      <p class="label" style="margin-top:8px;">Subject</p>
      <p>${params.subject}</p>
      <p class="label" style="margin-top:8px;">Category</p>
      <p>${categoryLabel}</p>
      <p class="label" style="margin-top:8px;">Priority</p>
      <p>${priorityLabel}</p>
    </div>
    <p>Please keep your reference number handy — you'll need it if you contact us directly.</p>
    <p>Our support team typically responds within <strong>1–2 business days</strong> for standard requests, or within <strong>4 hours</strong> for urgent issues.</p>
    <p>For immediate assistance you can reach us at <strong>support@szlholdings.com</strong>.</p>
  `);
}

export function buildSupportTicketAdminNotificationEmail(params: {
  ticketRef: string;
  submitterName: string;
  submitterEmail: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
}): string {
  const priorityLabel = params.priority.charAt(0).toUpperCase() + params.priority.slice(1);
  const categoryLabel = params.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return szlBrand(`
    <h2>New support ticket — ${params.ticketRef}</h2>
    <p>A new support ticket has been submitted and requires attention.</p>
    <div class="highlight">
      <p class="label">Reference</p>
      <p style="font-weight:600;">${params.ticketRef}</p>
      <p class="label" style="margin-top:8px;">From</p>
      <p>${params.submitterName} &lt;${params.submitterEmail}&gt;</p>
      <p class="label" style="margin-top:8px;">Subject</p>
      <p>${params.subject}</p>
      <p class="label" style="margin-top:8px;">Category</p>
      <p>${categoryLabel}</p>
      <p class="label" style="margin-top:8px;">Priority</p>
      <p>${priorityLabel}</p>
      <p class="label" style="margin-top:8px;">Description</p>
      <p>${params.description.replace(/\n/g, '<br />')}</p>
    </div>
  `);
}

export function buildSupportTicketStatusUpdateEmail(params: {
  submitterName: string;
  ticketRef: string;
  subject: string;
  newStatus: string;
}): string {
  const statusLabels: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    waiting_on_customer: 'Waiting on You',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  const statusLabel = statusLabels[params.newStatus] ?? params.newStatus;
  const isResolved = params.newStatus === 'resolved' || params.newStatus === 'closed';
  return szlBrand(`
    <h2>Your ticket status has been updated</h2>
    <p>Hi ${params.submitterName}, there's an update on your support request.</p>
    <div class="highlight">
      <p class="label">Reference</p>
      <p style="font-weight:600;">${params.ticketRef}</p>
      <p class="label" style="margin-top:8px;">Subject</p>
      <p>${params.subject}</p>
      <p class="label" style="margin-top:8px;">New Status</p>
      <p style="font-weight:600;">${statusLabel}</p>
    </div>
    ${
      isResolved
        ? `<p>We believe your issue has been resolved. If you have further questions or the issue persists, please don't hesitate to reach out at <strong>support@szlholdings.com</strong>.</p>`
        : `<p>Our team is actively working on your request. We'll keep you updated as things progress.</p>`
    }
    <p>Thank you for your patience.</p>
  `);
}

export function buildSupportTicketReplyEmail(params: {
  submitterName: string;
  ticketRef: string;
  subject: string;
  replyBody: string;
  agentName: string;
  ticketUrl?: string;
}): string {
  const ticketUrl =
    params.ticketUrl ??
    `${process.env.APP_URL || 'https://szlholdings.com'}/support/tickets/${params.ticketRef}`;
  return szlBrand(`
    <h2>A reply has been added to your support ticket</h2>
    <p>Hi ${params.submitterName}, our support team has responded to your request.</p>
    <div class="highlight">
      <p class="label">Reference</p>
      <p style="font-weight:600;">${params.ticketRef}</p>
      <p class="label" style="margin-top:8px;">Subject</p>
      <p>${params.subject}</p>
      <p class="label" style="margin-top:8px;">Reply from ${params.agentName}</p>
      <p>${params.replyBody.replace(/\n/g, '<br />')}</p>
    </div>
    <a class="cta" href="${ticketUrl}">View Your Ticket</a>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">You're receiving this because you submitted a support request. If you have further questions, reply to this email or visit your ticket above.</p>
  `);
}

const TYPE_COLORS: Record<string, string> = {
  info: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  action_required: '#f59e0b',
  alert: '#ef4444',
};

const TYPE_LABELS: Record<string, string> = {
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  error: 'Alert',
  action_required: 'Action Required',
  alert: 'Alert',
};

export function buildTransactionalNotificationEmail(params: {
  name: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string | null;
}): string {
  const { name, title, message, type, actionUrl } = params;
  const color = TYPE_COLORS[type] ?? '#6366f1';
  const label = TYPE_LABELS[type] ?? 'Notification';
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

  return szlBrand(`
    <div style="display:inline-block;padding:3px 10px;background:${color}15;border-radius:4px;margin-bottom:16px;">
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:${color};">${label}</span>
    </div>
    <h2>${safeTitle}</h2>
    <p>Hi ${safeName},</p>
    <p>${safeMessage}</p>
    ${actionUrl ? `<a class="cta" href="${actionUrl}" style="background:${color};">View Details</a>` : ''}
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">This is a notification from the SZL Holdings platform. To manage your notification preferences, visit your account settings.</p>
  `);
}

export interface ScheduledReportEmailOptions {
  recipientName?: string;
  reportTitle: string;
  reportId: string;
  scheduleName: string;
  domain: string;
  frequency: string;
  generatedAt: string;
  downloadUrl: string;
  /**
   * Selects the access copy used in the email body:
   *   - "auth"      → "The link requires authentication" (default; for the
   *                   /reports/:id/pdf endpoint).
   *   - "presigned" → "This link is valid for 7 days and does not require
   *                   sign-in" (for object-storage presigned GET URLs).
   *   - "attachment" → "The PDF is attached to this email" (when the PDF
   *                    is delivered as an email attachment).
   */
  linkMode?: 'auth' | 'presigned' | 'attachment';
}

export function buildScheduledReportEmail(opts: ScheduledReportEmailOptions): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientName, reportTitle, scheduleName, domain, frequency, generatedAt, downloadUrl } =
    opts;
  const linkMode = opts.linkMode ?? 'auth';
  const accessHtml =
    linkMode === 'attachment'
      ? 'The PDF report is attached to this email. You can also use the button below to access the latest version online.'
      : linkMode === 'presigned'
        ? 'Click below to download the PDF. This link is valid for 7 days and does not require signing in.'
        : 'Click below to download the PDF report. The link requires authentication to your SZL Holdings account.';
  const accessText =
    linkMode === 'attachment'
      ? 'The PDF report is attached to this email.'
      : linkMode === 'presigned'
        ? 'Download your report (link valid for 7 days, no sign-in required):'
        : 'Download your report (sign-in required):';

  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';
  const domainLabel = domain.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const frequencyLabel = frequency.charAt(0).toUpperCase() + frequency.slice(1);

  const subject = `Your ${frequencyLabel} Report is Ready — ${reportTitle}`;

  const html = szlBrand(`
    <h2>Your Scheduled Report is Ready</h2>
    <p>${greeting}</p>
    <p>Your <strong>${frequencyLabel.toLowerCase()} report</strong> has been generated and is ready for download.</p>
    <div class="highlight">
      <p class="label">Report</p>
      <p style="font-weight:600;">${reportTitle}</p>
      <p class="label" style="margin-top:8px;">Schedule</p>
      <p>${scheduleName}</p>
      <p class="label" style="margin-top:8px;">Domain</p>
      <p>${domainLabel}</p>
      <p class="label" style="margin-top:8px;">Generated</p>
      <p>${generatedAt}</p>
    </div>
    <p>${accessHtml}</p>
    <a class="cta" href="${downloadUrl}">Download Report PDF</a>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">This is an automated delivery from your scheduled report configuration. If you no longer wish to receive these reports, contact your administrator to update the distribution list.</p>
  `);

  const text = [
    `Your Scheduled Report is Ready`,
    ``,
    greeting,
    ``,
    `Your ${frequencyLabel.toLowerCase()} report has been generated and is ready for download.`,
    ``,
    `Report:    ${reportTitle}`,
    `Schedule:  ${scheduleName}`,
    `Domain:    ${domainLabel}`,
    `Generated: ${generatedAt}`,
    ``,
    `${accessText} ${downloadUrl}`,
    ``,
    `This is an automated delivery from your scheduled report configuration.`,
    `If you no longer wish to receive these reports, contact your administrator.`,
  ].join('\n');

  return { subject, html, text };
}

export interface PulseBriefingEmailSection {
  id: string;
  title: string;
  agentName?: string;
  agentId: string;
  riskLevel: string;
  confidence: number;
  confidenceLabel: string;
  keyJudgment: string;
  keyFindings: Array<{ finding: string; severity: string }>;
}

export interface PulseBriefingEmailOptions {
  recipientName?: string;
  briefingId: string;
  date: string;
  edition: string;
  classification: string;
  headline: string;
  leadSentence: string;
  overallRisk: string;
  overallConfidence: number;
  sections: PulseBriefingEmailSection[];
  recommendedActions: Array<{ action: string; priority: string; owner: string; dueBy: string }>;
  pulseUrl: string;
  unsubscribeUrl: string;
  manageUrl: string;
  domainsFilter?: string[];
}

const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#b91c1c',
  HIGH: '#c2410c',
  MEDIUM: '#b45309',
  LOW: '#15803d',
};

function pulseBrand(content: string, footer: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Pulse Briefing</title>
</head>
<body style="margin:0;padding:0;background:#0a0b0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',sans-serif;color:#e6e6e6;">
<div style="max-width:640px;margin:0 auto;padding:32px 16px;">
  <div style="background:#101216;border:1px solid rgba(200,168,75,0.18);border-radius:12px;padding:32px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#c8a84b;margin-bottom:16px;">PULSE · AI EXECUTIVE BRIEFING</div>
    ${content}
    <div style="height:1px;background:rgba(255,255,255,0.08);margin:28px 0;"></div>
    <div style="font-size:11px;color:rgba(255,255,255,0.4);line-height:1.7;">
      ${footer}
    </div>
  </div>
</div>
</body>
</html>`;
}

export function buildPulseBriefingEmail(opts: PulseBriefingEmailOptions): {
  subject: string;
  html: string;
  text: string;
} {
  const filtered =
    opts.domainsFilter && opts.domainsFilter.length > 0
      ? opts.sections.filter(
          (s) =>
            opts.domainsFilter?.includes(s.id ?? s.agentId) ||
            opts.domainsFilter?.some((d) => s.title.toLowerCase().includes(d.replace(/_/g, ' '))),
        )
      : opts.sections;
  const sectionsToRender = filtered.length > 0 ? filtered : opts.sections;

  const overallColor = RISK_COLORS[opts.overallRisk] ?? '#9ca3af';
  const greeting = opts.recipientName
    ? `Good morning, ${escapeHtml(opts.recipientName)}.`
    : 'Good morning.';

  const sectionsHtml = sectionsToRender
    .map((s) => {
      const color = RISK_COLORS[s.riskLevel] ?? '#9ca3af';
      const findingsHtml = s.keyFindings
        .slice(0, 3)
        .map((f) => {
          const fc = RISK_COLORS[f.severity] ?? '#9ca3af';
          return `<li style="margin:4px 0;color:rgba(255,255,255,0.78);font-size:13px;line-height:1.5;"><span style="color:${fc};font-weight:700;font-size:10px;letter-spacing:0.06em;">[${escapeHtml(f.severity)}]</span> ${escapeHtml(f.finding)}</li>`;
        })
        .join('');
      return `
    <div style="border-left:3px solid ${color};padding:14px 18px;margin:14px 0;background:rgba(255,255,255,0.03);border-radius:0 6px 6px 0;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <span style="font-size:14px;font-weight:600;color:#fff;">${escapeHtml(s.title)}</span>
        <span style="font-size:10px;color:rgba(255,255,255,0.4);">${escapeHtml(s.agentName ?? s.agentId)}</span>
        <span style="font-size:10px;font-weight:700;color:${color};letter-spacing:0.08em;margin-left:auto;">${escapeHtml(s.riskLevel)} · ${(s.confidence * 100).toFixed(0)}% (${escapeHtml(s.confidenceLabel)})</span>
      </div>
      <p style="margin:0 0 10px;font-size:13px;color:rgba(255,255,255,0.85);line-height:1.55;">${escapeHtml(s.keyJudgment)}</p>
      ${findingsHtml ? `<ul style="margin:8px 0 0;padding-left:18px;">${findingsHtml}</ul>` : ''}
    </div>`;
    })
    .join('');

  const actionsHtml = opts.recommendedActions.length
    ? `<div style="margin-top:24px;">
        <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#c8a84b;margin-bottom:10px;">Recommended Actions</div>
        ${opts.recommendedActions
          .slice(0, 5)
          .map(
            (a) => `
          <div style="padding:10px 14px;background:rgba(200,168,75,0.06);border:1px solid rgba(200,168,75,0.18);border-radius:6px;margin-bottom:8px;">
            <div style="font-size:13px;color:#fff;font-weight:600;margin-bottom:4px;"><span style="color:#c8a84b;font-weight:700;">[${escapeHtml(a.priority)}]</span> ${escapeHtml(a.action)}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5);">Owner: ${escapeHtml(a.owner)} · Due: ${escapeHtml(a.dueBy)}</div>
          </div>`,
          )
          .join('')}
      </div>`
    : '';

  const html = pulseBrand(
    `
    <div style="font-size:10px;letter-spacing:0.1em;color:#b45309;text-align:right;margin-bottom:8px;">${escapeHtml(opts.classification)}</div>
    <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.55);">${greeting}</p>
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#fff;line-height:1.3;">${escapeHtml(opts.headline)}</h1>
    <p style="margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6;">${escapeHtml(opts.leadSentence)}</p>
    <div style="display:inline-block;padding:6px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:6px;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:8px;">
      Overall risk <strong style="color:${overallColor};">${escapeHtml(opts.overallRisk)}</strong> · Confidence ${(opts.overallConfidence * 100).toFixed(0)}% · ${escapeHtml(opts.edition)}
    </div>
    ${sectionsHtml}
    ${actionsHtml}
    <div style="margin-top:28px;text-align:center;">
      <a href="${opts.pulseUrl}" style="display:inline-block;padding:10px 20px;background:rgba(200,168,75,0.14);border:1px solid rgba(200,168,75,0.4);border-radius:6px;color:#c8a84b;text-decoration:none;font-size:13px;font-weight:600;">Read Full Briefing →</a>
    </div>
  `,
    `
    SZL Holdings · Pulse — AI Executive Briefing<br />
    You're receiving this because you subscribed to daily Pulse briefings.<br />
    <a href="${opts.manageUrl}" style="color:rgba(200,168,75,0.7);">Manage subscription</a> · <a href="${opts.unsubscribeUrl}" style="color:rgba(200,168,75,0.7);">Unsubscribe</a>
  `,
  );

  const textLines = [
    `PULSE · AI EXECUTIVE BRIEFING — ${opts.date}`,
    opts.classification,
    '',
    opts.headline,
    '',
    opts.leadSentence,
    '',
    `Overall risk: ${opts.overallRisk} · Confidence: ${(opts.overallConfidence * 100).toFixed(0)}%`,
    '',
    ...sectionsToRender.flatMap((s) => [
      `── ${s.title} (${s.agentName ?? s.agentId}) — ${s.riskLevel} · ${(s.confidence * 100).toFixed(0)}% (${s.confidenceLabel})`,
      s.keyJudgment,
      ...s.keyFindings.slice(0, 3).map((f) => `  • [${f.severity}] ${f.finding}`),
      '',
    ]),
    ...(opts.recommendedActions.length
      ? [
          'RECOMMENDED ACTIONS:',
          ...opts.recommendedActions
            .slice(0, 5)
            .map((a) => `  [${a.priority}] ${a.action} (Owner: ${a.owner}, Due: ${a.dueBy})`),
          '',
        ]
      : []),
    `Read full briefing: ${opts.pulseUrl}`,
    '',
    `Manage subscription: ${opts.manageUrl}`,
    `Unsubscribe: ${opts.unsubscribeUrl}`,
  ];

  return {
    subject: `Pulse Brief · ${opts.date} · ${opts.headline.slice(0, 80)}`,
    html,
    text: textLines.join('\n'),
  };
}

export function buildDealSubmissionAckEmail(params: {
  founderName: string;
  company: string;
  pipelineId: string;
  submittedAt: string;
}): { subject: string; html: string; text: string } {
  const { founderName, company, pipelineId, submittedAt } = params;
  const safeName = escapeHtml(founderName);
  const safeCompany = escapeHtml(company);
  const safePipelineId = escapeHtml(pipelineId);

  const subject = `Deal submission received — ${safeCompany} (${safePipelineId})`;

  const html = szlBrand(`
    <h2>Submission Received</h2>
    <p>Hello ${safeName},</p>
    <p>Thank you for submitting <strong>${safeCompany}</strong> to SZL Holdings. We've received your application and our investment team will review it carefully.</p>
    <div class="highlight">
      <p class="label">Pipeline ID</p>
      <p style="font-family:monospace;font-size:16px;font-weight:700;color:#111827;">${safePipelineId}</p>
      <p class="label" style="margin-top:8px;">Submitted</p>
      <p>${escapeHtml(submittedAt)}</p>
    </div>
    <p>Please keep your Pipeline ID for your records — you may be asked to reference it in any future correspondence with our team.</p>
    <p>Our team reviews submissions on a rolling basis. If your opportunity aligns with our thesis, a member of our team will be in touch. Due to the volume of submissions we receive, we are unable to provide individual feedback on applications that do not advance.</p>
    <p>Thank you again for considering SZL Holdings as a partner.</p>
    <a class="cta" href="https://szlholdings.com/corporate">Learn About SZL Holdings</a>
  `);

  const text = [
    `Submission Received — SZL Holdings`,
    ``,
    `Hello ${founderName},`,
    ``,
    `Thank you for submitting ${company} to SZL Holdings. We've received your application and our investment team will review it carefully.`,
    ``,
    `Pipeline ID:  ${pipelineId}`,
    `Submitted:    ${submittedAt}`,
    ``,
    `Please keep your Pipeline ID for your records — you may be asked to reference it in any future correspondence with our team.`,
    ``,
    `Our team reviews submissions on a rolling basis. If your opportunity aligns with our thesis, a member of our team will be in touch.`,
    ``,
    `Thank you again for considering SZL Holdings as a partner.`,
    ``,
    `SZL Holdings · Washington, D.C. · London · Singapore`,
  ].join('\n');

  return { subject, html, text };
}

// ─── Notification Audit Log ────────────────────────────────────────────────────

export async function logNotificationAudit(opts: {
  template: string;
  recipient: string;
  subject?: string;
  entityType?: string;
  entityId?: string;
  deliveryStatus: 'sent' | 'failed' | 'skipped';
  messageId?: string;
  provider?: string;
  error?: string;
}): Promise<void> {
  try {
    await getAuditPool().query(
      `INSERT INTO notification_audit_log (template, recipient, subject, entity_type, entity_id, delivery_status, message_id, provider, error)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        opts.template,
        opts.recipient,
        opts.subject ?? null,
        opts.entityType ?? null,
        opts.entityId ?? null,
        opts.deliveryStatus,
        opts.messageId ?? null,
        opts.provider ?? null,
        opts.error ?? null,
      ],
    );
  } catch (err) {
    logger.warn({ err, template: opts.template, recipient: opts.recipient }, '[email-audit] Failed to write audit log');
  }
}

// ─── LP Portal Email Templates ────────────────────────────────────────────────

export function buildLpReportPublishedEmail(opts: {
  lpName: string;
  period: string;
  reportType: string;
  portalUrl: string;
}): { subject: string; html: string; text: string } {
  const { lpName, period, reportType, portalUrl } = opts;
  const subject = `New report available: ${reportType} — ${period}`;
  const html = szlBrand(`
    <h2>A New Report is Available</h2>
    <p>Hello ${lpName},</p>
    <p>A new <strong>${reportType}</strong> report for the period <strong>${period}</strong> has been posted to your LP portal.</p>
    <div class="highlight">
      <p class="label">Action Required</p>
      <p>Log in to your LP portal to review the report and any accompanying documents.</p>
    </div>
    <a class="cta" href="${portalUrl}">View in LP Portal</a>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">You are receiving this because you are a limited partner of SZL Holdings. If you believe this was sent in error, please contact <strong>investor-relations@szlholdings.com</strong>.</p>
  `);
  const text = [
    `New Report Available: ${reportType} — ${period}`,
    ``,
    `Hello ${lpName},`,
    ``,
    `A new ${reportType} report for the period ${period} has been posted to your LP portal.`,
    ``,
    `Log in to review it: ${portalUrl}`,
    ``,
    `SZL Holdings · investor-relations@szlholdings.com`,
  ].join('\n');
  return { subject, html, text };
}

export function buildLpGpMessageEmail(opts: {
  lpName: string;
  messagePreview: string;
  portalUrl: string;
}): { subject: string; html: string; text: string } {
  const { lpName, messagePreview, portalUrl } = opts;
  const subject = 'New message from your GP — SZL Holdings';
  const html = szlBrand(`
    <h2>Message from the GP Team</h2>
    <p>Hello ${lpName},</p>
    <p>Your General Partner has sent you a message via the LP portal.</p>
    <div class="highlight">
      <p class="label">Message Preview</p>
      <p>${messagePreview.slice(0, 200).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}${messagePreview.length > 200 ? '…' : ''}</p>
    </div>
    <a class="cta" href="${portalUrl}">View Full Message</a>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">You are receiving this because you are a limited partner of SZL Holdings. Reply to this email or visit your portal to respond.</p>
  `);
  const text = [
    `New Message from Your GP — SZL Holdings`,
    ``,
    `Hello ${lpName},`,
    ``,
    `Your General Partner has sent you a message:`,
    ``,
    messagePreview.slice(0, 300),
    ``,
    `View the full message: ${portalUrl}`,
    ``,
    `SZL Holdings · investor-relations@szlholdings.com`,
  ].join('\n');
  return { subject, html, text };
}

// ─── LP Data Room Document Published Email ────────────────────────────────────

export function buildLpDataRoomDocEmail(opts: {
  lpName: string;
  docName: string;
  folder: string;
  portalUrl: string;
}): { subject: string; html: string; text: string } {
  const { lpName, docName, folder, portalUrl } = opts;
  const safeDocName = docName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeFolder = folder.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const subject = `New document in your data room — ${docName}`;
  const html = szlBrand(`
    <h2>A New Document Is Available</h2>
    <p>Hello ${lpName},</p>
    <p>A new document has been added to your permissioned data room.</p>
    <div class="highlight">
      <p class="label">Document Details</p>
      <p><strong>${safeDocName}</strong></p>
      <p style="margin-top:4px;font-size:13px;color:#9ca3af;">Folder: ${safeFolder}</p>
    </div>
    <a class="cta" href="${portalUrl}">View in Data Room</a>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">You are receiving this because you are a limited partner of SZL Holdings and this document is accessible at your permission tier. Contact <strong>investor-relations@szlholdings.com</strong> with questions.</p>
  `);
  const text = [
    `New Document in Your Data Room — ${docName}`,
    ``,
    `Hello ${lpName},`,
    ``,
    `A new document has been added to your permissioned data room:`,
    ``,
    `  ${docName} (folder: ${folder})`,
    ``,
    `Log in to view it: ${portalUrl}`,
    ``,
    `SZL Holdings · investor-relations@szlholdings.com`,
  ].join('\n');
  return { subject, html, text };
}

// ─── NET-30 Invoice / Dunning Email ──────────────────────────────────────────

export interface Net30DunningEmailOptions {
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  outstandingBalance: number;
  currency: string;
  dueDate: string;
  daysOverdue?: number;
  poNumber?: string;
  hostedUrl?: string;
  isInitialSend?: boolean;
}

export function buildNet30DunningEmail(opts: Net30DunningEmailOptions): string {
  const {
    invoiceNumber,
    customerName,
    totalAmount,
    outstandingBalance,
    currency,
    dueDate,
    daysOverdue,
    poNumber,
    hostedUrl,
    isInitialSend,
  } = opts;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(n);

  const isOverdue = (daysOverdue ?? 0) > 0;
  const headerColor = isInitialSend ? '#6366f1' : isOverdue ? (daysOverdue! >= 30 ? '#dc2626' : '#d97706') : '#6366f1';
  const headline = isInitialSend
    ? `Invoice ${invoiceNumber} — Payment Due ${dueDate}`
    : isOverdue
      ? `REMINDER: Invoice ${invoiceNumber} is ${daysOverdue} Day${daysOverdue === 1 ? '' : 's'} Past Due`
      : `Upcoming Payment: Invoice ${invoiceNumber} Due ${dueDate}`;

  const intro = isInitialSend
    ? `<p>Dear ${customerName},</p><p>Please find your invoice details below. Payment is due by <strong>${dueDate}</strong>.</p>`
    : isOverdue
      ? `<p>Dear ${customerName},</p><p>This is a reminder that Invoice ${invoiceNumber} is <strong style="color:${headerColor};">${daysOverdue} day${daysOverdue === 1 ? '' : 's'} past due</strong>. Please arrange payment at your earliest convenience to avoid further escalation.</p>`
      : `<p>Dear ${customerName},</p><p>This is a courtesy reminder that Invoice ${invoiceNumber} is due on <strong>${dueDate}</strong>. Please arrange payment before the due date.</p>`;

  const ctaButton = hostedUrl
    ? `<a href="${hostedUrl}" class="cta" style="background:${headerColor};">Pay Invoice Online</a>`
    : '';

  return szlBrand(`
    <h2 style="color:${headerColor};">${headline}</h2>
    ${intro}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;">
      <tr><td style="padding:8px 0;color:#6b7280;font-weight:500;width:40%;">Invoice Number</td><td style="padding:8px 0;"><strong>${invoiceNumber}</strong></td></tr>
      ${poNumber ? `<tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;font-weight:500;">PO Number</td><td style="padding:8px 0;">${poNumber}</td></tr>` : ''}
      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;font-weight:500;">Invoice Total</td><td style="padding:8px 0;">${fmt(totalAmount)}</td></tr>
      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;font-weight:500;">Due Date</td><td style="padding:8px 0;">${dueDate}</td></tr>
      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;font-weight:500;"><strong>Outstanding Balance</strong></td><td style="padding:8px 0;"><strong style="color:${headerColor};font-size:16px;">${fmt(outstandingBalance)}</strong></td></tr>
    </table>
    ${ctaButton}
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">Questions? Reply to this email or contact our billing team. Please reference invoice ${invoiceNumber} in all correspondence.</p>
  `);
}

// ─── Agent Ticket Reply Email ─────────────────────────────────────────────────

export function buildAgentTicketReplyEmail(params: {
  name: string;
  agentReply: string;
  ticketId: number;
  originalSubject: string;
}): { subject: string; html: string; text: string } {
  const { name, agentReply, ticketId, originalSubject } = params;
  const subject = `Re: ${originalSubject} [Ticket #${ticketId}]`;
  const html = szlBrand(`
    <h2>Our Team Has Replied to Your Inquiry</h2>
    <p>Hello ${name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')},</p>
    <p>A member of our support team has posted a reply to your inquiry.</p>
    <div class="highlight">
      <p class="label">Reply from our team</p>
      <p>${agentReply.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />')}</p>
    </div>
    <p>If you have further questions, reply directly to this email and your message will reach the same team member.</p>
    <a class="cta" href="mailto:inquiries@szlholdings.com">Reply to Support</a>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">Inquiry reference: #${ticketId}</p>
  `);
  const text = [
    `Re: ${originalSubject} [Ticket #${ticketId}]`,
    ``,
    `Hello ${name},`,
    ``,
    `A member of our support team has replied:`,
    ``,
    agentReply,
    ``,
    `Reply to inquiries@szlholdings.com with any follow-up questions.`,
    ``,
    `Inquiry reference: #${ticketId}`,
  ].join('\n');
  return { subject, html, text };
}

// ─── ACH payment failed dunning email ─────────────────────────────────────────

export interface AchPaymentFailedEmailOptions {
  userName: string;
  invoiceId: string;
  amount: string;
  currency: string;
  returnCode?: string;
  reason: string;
  billingUrl?: string;
}

export function buildAchPaymentFailedEmail(opts: AchPaymentFailedEmailOptions): string {
  const billingUrl =
    opts.billingUrl ??
    `${process.env.APP_URL ?? 'https://szlholdings.com'}/billing/invoices/${opts.invoiceId}`;

  return szlBrand(`
    <h2 style="color:#dc2626;">&#9888; ACH Payment Failed — Action Required</h2>
    <p>Hello ${opts.userName},</p>
    <p>Your ACH bank transfer for Invoice <strong>#${opts.invoiceId}</strong> was returned by your bank and could not be processed.</p>
    <div class="highlight">
      <p class="label">Invoice</p>
      <p>#${opts.invoiceId}</p>
      <p class="label" style="margin-top:8px;">Amount</p>
      <p>${opts.currency} ${opts.amount}</p>${
        opts.returnCode
          ? `
      <p class="label" style="margin-top:8px;">Return Code</p>
      <p style="font-family:monospace;font-weight:700;">${opts.returnCode}</p>`
          : ''
      }
      <p class="label" style="margin-top:8px;">Reason</p>
      <p>${opts.reason}</p>
    </div>
    <p>To keep your account in good standing, please update your payment method and retry the payment:</p>
    <a class="cta" href="${billingUrl}">Update Payment &amp; Retry</a>
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">If you believe this was an error, please contact your bank or reach us at <strong>billing@szlholdings.com</strong>.</p>
  `);
}

// ─── Crypto payment failure dunning email ─────────────────────────────────────

export interface CryptoPaymentFailedEmailOptions {
  userName: string;
  invoiceId: string;
  amount: string;
  currency: string;
  reason: 'failed' | 'expired' | 'underpaid' | 'overpaid' | 'delayed';
  coinbaseChargeCode?: string;
  billingUrl?: string;
}

export function buildCryptoPaymentFailedEmail(opts: CryptoPaymentFailedEmailOptions): string {
  const billingUrl =
    opts.billingUrl ??
    `${process.env.APP_URL ?? 'https://szlholdings.com'}/billing/invoices/${opts.invoiceId}`;

  const reasonText: Record<CryptoPaymentFailedEmailOptions['reason'], string> = {
    failed: 'The crypto payment could not be confirmed on-chain.',
    expired: 'The payment window expired before a transaction was detected. Coinbase Commerce charges expire after 60 minutes.',
    underpaid: 'The amount received was less than the invoice total. Partial crypto payments cannot be automatically applied.',
    overpaid: 'An overpayment was detected. Please contact us to arrange a credit or refund of the excess.',
    delayed: 'Your crypto transaction has been detected but is awaiting additional network confirmations. We will notify you once it clears.',
  };

  const headingColor = opts.reason === 'delayed' ? '#d97706' : '#dc2626';
  const heading =
    opts.reason === 'delayed'
      ? '&#9203; Crypto Payment Awaiting Confirmation'
      : '&#9888; Crypto Payment Issue — Action Required';

  return szlBrand(`
    <h2 style="color:${headingColor};">${heading}</h2>
    <p>Hello ${opts.userName},</p>
    <p>${reasonText[opts.reason]}</p>
    <div class="highlight">
      <p class="label">Invoice</p>
      <p>#${opts.invoiceId}</p>
      <p class="label" style="margin-top:8px;">Amount Due</p>
      <p>${opts.currency} ${opts.amount}</p>${
        opts.coinbaseChargeCode
          ? `
      <p class="label" style="margin-top:8px;">Coinbase Charge Reference</p>
      <p style="font-family:monospace;">${opts.coinbaseChargeCode}</p>`
          : ''
      }
    </div>
    ${
      opts.reason !== 'delayed'
        ? `<p>To keep your account current, you can retry payment via a different method:</p>
    <a class="cta" href="${billingUrl}">Retry Payment</a>`
        : `<p>No action is required at this time. We will update you as soon as the transaction is confirmed.</p>
    <a class="cta" href="${billingUrl}">View Invoice</a>`
    }
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">Questions? Contact us at <strong>billing@szlholdings.com</strong>.</p>
  `);
}

export function buildCryptoPaymentFailedEmailSubject(
  opts: Pick<CryptoPaymentFailedEmailOptions, 'reason' | 'invoiceId'>,
): string {
  if (opts.reason === 'delayed') {
    return `Crypto payment awaiting confirmation — Invoice #${opts.invoiceId}`;
  }
  return `Crypto payment issue — Invoice #${opts.invoiceId}`;
}

// ─── Settlement reconciliation alert email ────────────────────────────────────

export interface ReconciliationMismatchEmailOptions {
  mismatchCount: number;
  totalChecked: number;
  mismatches: Array<{
    invoiceId: string;
    rail: string;
    expectedAmount: string;
    actualAmount?: string;
    issue: string;
  }>;
  reportDate: string;
  adminUrl?: string;
}

export function buildReconciliationMismatchEmail(opts: ReconciliationMismatchEmailOptions): string {
  const adminUrl =
    opts.adminUrl ??
    `${process.env.APP_URL ?? 'https://szlholdings.com'}/admin/billing/reconciliation`;

  const mismatchRows = opts.mismatches
    .slice(0, 10)
    .map(
      (m) => `
    <tr style="border-top:1px solid #f3f4f6;">
      <td style="padding:8px 4px;font-family:monospace;font-size:12px;">${m.invoiceId}</td>
      <td style="padding:8px 4px;text-transform:uppercase;font-size:12px;">${m.rail}</td>
      <td style="padding:8px 4px;font-size:12px;">${m.expectedAmount}</td>
      <td style="padding:8px 4px;font-size:12px;">${m.actualAmount ?? '—'}</td>
      <td style="padding:8px 4px;color:#dc2626;font-size:12px;">${m.issue}</td>
    </tr>`,
    )
    .join('');

  return szlBrand(`
    <h2 style="color:#dc2626;">&#9888; Settlement Reconciliation — Mismatches Detected</h2>
    <p>The daily settlement reconciliation job for <strong>${opts.reportDate}</strong> completed with <strong>${opts.mismatchCount}</strong> mismatch(es) out of ${opts.totalChecked} records checked.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:8px 4px;text-align:left;font-weight:600;color:#374151;">Invoice ID</th>
          <th style="padding:8px 4px;text-align:left;font-weight:600;color:#374151;">Rail</th>
          <th style="padding:8px 4px;text-align:left;font-weight:600;color:#374151;">Expected</th>
          <th style="padding:8px 4px;text-align:left;font-weight:600;color:#374151;">Actual</th>
          <th style="padding:8px 4px;text-align:left;font-weight:600;color:#374151;">Issue</th>
        </tr>
      </thead>
      <tbody>${mismatchRows}</tbody>
    </table>
    ${opts.mismatches.length > 10 ? `<p style="font-size:12px;color:#6b7280;">Showing 10 of ${opts.mismatches.length} mismatches. View all in the admin panel.</p>` : ''}
    <a class="cta" href="${adminUrl}">Open Reconciliation Dashboard</a>
  `);
}
