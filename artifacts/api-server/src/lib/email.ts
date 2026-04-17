import nodemailer from "nodemailer";
import { logger } from "./logger";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

const FROM_ADDRESS = "SZL Holdings <inquiries@szlholdings.com>";
const FROM_NAME = "SZL Holdings";
const FROM_EMAIL = "inquiries@szlholdings.com";
const INTERNAL_EMAIL = process.env.SZL_INTERNAL_EMAIL || "team@szlholdings.com";

async function sendViaSendGrid(options: EmailOptions): Promise<SendResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SENDGRID_API_KEY not configured");

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: options.to }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      reply_to: options.replyTo ? { email: options.replyTo } : undefined,
      subject: options.subject,
      content: [
        { type: "text/html", value: options.html },
        ...(options.text ? [{ type: "text/plain", value: options.text }] : []),
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SendGrid error: ${res.status} ${err}`);
  }

  const messageId = res.headers.get("x-message-id") ?? `sg-${Date.now()}`;
  return { success: true, messageId, provider: "sendgrid" };
}

async function sendViaResend(options: EmailOptions): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${res.status} ${err}`);
  }

  const data = await res.json() as { id: string };
  return { success: true, messageId: data.id, provider: "resend" };
}

async function sendViaSMTP(options: EmailOptions): Promise<SendResult> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP credentials not configured");
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const info = await transporter.sendMail({
    from: FROM_ADDRESS,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
  });

  return { success: true, messageId: info.messageId, provider: "smtp" };
}

function getPrimaryProvider(): "sendgrid" | "resend" {
  const configured = process.env.EMAIL_PROVIDER?.toLowerCase();
  if (configured === "sendgrid" && process.env.SENDGRID_API_KEY) return "sendgrid";
  if (configured === "resend" && process.env.RESEND_API_KEY) return "resend";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  return "resend";
}

let _emailProviderWarningLogged = false;

export function hasEmailProviderConfigured(): boolean {
  return !!(process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS));
}

export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  if (!hasEmailProviderConfigured()) {
    if (!_emailProviderWarningLogged) {
      logger.warn("No email provider configured (SENDGRID_API_KEY, RESEND_API_KEY, or SMTP credentials). Email delivery skipped.");
      _emailProviderWarningLogged = true;
    }
    return { success: false, error: "No email provider configured" };
  }

  const primary = getPrimaryProvider();

  const providers: Array<() => Promise<SendResult>> = primary === "sendgrid"
    ? [
        () => sendViaSendGrid(options),
        () => sendViaResend(options),
        () => sendViaSMTP(options),
      ]
    : [
        () => sendViaResend(options),
        () => sendViaSendGrid(options),
        () => sendViaSMTP(options),
      ];

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
  if (process.env.SENDGRID_API_KEY) available.push("sendgrid");
  if (process.env.RESEND_API_KEY) available.push("resend");
  if (process.env.SMTP_HOST && process.env.SMTP_USER) available.push("smtp");
  return { primary: getPrimaryProvider(), available };
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
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high:     "#ea580c",
  warning:  "#d97706",
  info:     "#2563eb",
};

export function buildAlertFiredEmail(opts: AlertFiredEmailOptions): { subject: string; html: string; text: string } {
  const severityColor = SEVERITY_COLORS[opts.severity.toLowerCase()] ?? "#6b7280";
  const severityLabel = opts.severity.toUpperCase();
  const alertsUrl = opts.alertsUrl ?? "https://szlholdings.com/command/ops/alerts";

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
    <p style="margin-top:20px;font-size:12px;color:#9ca3af;">This is an automated alert from the SZL Holdings Ops Center. No reply is needed.</p>
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
  ].join("\n");

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
}): string {
  return szlBrand(`
    <h2>New Inquiry Received</h2>
    <p>A new inquiry has been submitted through the SZL Holdings contact form.</p>
    <div class="highlight">
      <p class="label">From</p>
      <p>${inquiry.name}${inquiry.company ? ` · ${inquiry.company}` : ""}</p>
      <p class="label" style="margin-top:8px;">Email</p>
      <p>${inquiry.email}</p>
      <p class="label" style="margin-top:8px;">Subject</p>
      <p>${inquiry.subject}</p>
      <p class="label" style="margin-top:8px;">Message</p>
      <p>${inquiry.message.replace(/\n/g, "<br />")}</p>${inquiry.intent ? `
      <p class="label" style="margin-top:8px;">Intent</p>
      <p>${inquiry.intent}</p>` : ""}${inquiry.source ? `
      <p class="label" style="margin-top:8px;">Source</p>
      <p>${inquiry.source}</p>` : ""}
    </div>
    <p>Review and respond in the admin panel or reply directly to this email.</p>
    <a class="cta" href="${process.env.VITE_APP_URL || "https://szlholdings.com"}/admin">Open Admin</a>
  `);
}

export function buildWelcomeEmail(name: string, email: string): string {
  return szlBrand(`
    <h2>Welcome to SZL Holdings</h2>
    <p>Hello ${name},</p>
    <p>You're now connected to SZL Holdings — we build <strong>Lyte</strong>, a business observability platform that surfaces revenue stalls, approval gaps, and ownership drift before they compound.</p>
    <p>Powered by <strong>Alloy</strong>, our execution fabric that routes signals to accountable action.</p>
    <div class="highlight">
      <p><strong>Lyte</strong> — Business observability. Surfaces what's stalling, aging, or drifting before it costs you.</p>
    </div>
    <div class="highlight">
      <p><strong>Alloy</strong> — Execution fabric. Workflow orchestration, signal routing, audit trail, and policy-gated action.</p>
    </div>
    <p>Explore the platform:</p>
    <a class="cta" href="${process.env.VITE_APP_URL || "https://szlholdings.com"}">Visit SZL Holdings</a>
  `);
}

export function buildBookingAckEmail(name: string, appointmentType: string, scheduledAt?: string): string {
  return szlBrand(`
    <h2>Booking Confirmed</h2>
    <p>Hello ${name},</p>
    <p>Your ${appointmentType} booking with SZL Holdings has been confirmed.</p>
    ${scheduledAt ? `
    <div class="highlight">
      <p class="label">Scheduled</p>
      <p>${scheduledAt}</p>
    </div>
    ` : ""}
    <p>Our team will prepare a briefing tailored to your organization's interests. We look forward to exploring how the SZL ecosystem can accelerate your strategic objectives.</p>
    <p>If you need to reschedule or have questions beforehand, reply to this email or contact us at <strong>inquiries@szlholdings.com</strong>.</p>
    <a class="cta" href="${process.env.VITE_APP_URL || "https://szlholdings.com"}/corporate">About SZL Holdings</a>
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

export function buildDemoConfirmationEmail(name: string, company: string, scheduledAt: string, calendarUrl?: string): string {
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

export function buildAccessRequestConfirmationEmail(name: string, productName: string, requestId: string): string {
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

export function buildClientPortalInviteEmail(name: string, company: string, inviteUrl: string, expiresAt: string): string {
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
    <p>${invitedByName ? `<strong>${invitedByName}</strong> has invited you` : "You have been invited"} to join <strong>${orgName}</strong> on the SZL Holdings platform as a <strong>${role}</strong>.</p>
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
  notifications: Array<{ title: string; message: string; type: string; actionUrl?: string | null; createdAt: string }>;
}): string {
  const { userName, date, notifications } = params;

  const typeLabel: Record<string, string> = {
    info: "Info",
    success: "Success",
    warning: "Warning",
    error: "Alert",
    action_required: "Action Required",
  };

  const typeColor: Record<string, string> = {
    info: "#6366f1",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    action_required: "#f59e0b",
  };

  const items = notifications.map(n => {
    const color = typeColor[n.type] ?? "#6366f1";
    const label = typeLabel[n.type] ?? n.type;
    const time = new Date(n.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `
    <div style="border-left:3px solid ${color};padding:10px 14px;margin:10px 0;background:#f9fafb;border-radius:4px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${color};">${label}</span>
        <span style="font-size:11px;color:#9ca3af;">${time}</span>
      </div>
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#111827;">${n.title}</p>
      <p style="margin:0;font-size:13px;color:#4b5563;">${n.message}</p>
      ${n.actionUrl ? `<a href="${n.actionUrl.startsWith("http") ? n.actionUrl : `${process.env.APP_URL || "https://szlholdings.com"}${n.actionUrl}`}" style="font-size:12px;color:#6366f1;text-decoration:none;margin-top:6px;display:inline-block;">View →</a>` : ""}
    </div>`;
  }).join("");

  return szlBrand(`
    <h2>Your Daily Digest — ${date}</h2>
    <p>Hello ${userName},</p>
    <p>Here's a summary of your <strong>${notifications.length} unread notification${notifications.length !== 1 ? "s" : ""}</strong> from the past 24 hours.</p>
    ${items}
    <div class="divider"></div>
    <p style="font-size:13px;color:#6b7280;">To manage your notification preferences or turn off digest emails, visit your account settings.</p>
    <a class="cta" href="${process.env.APP_URL || "https://szlholdings.com"}/settings/notifications">Manage Preferences</a>
  `);
}

export function buildBillingNotificationEmail(params: {
  name: string;
  eventType: "invoice_paid" | "invoice_due" | "payment_failed" | "subscription_renewed" | "subscription_cancelled" | "trial_ending";
  amount?: string;
  currency?: string;
  invoiceUrl?: string;
  dueDate?: string;
  renewalDate?: string;
  trialEndDate?: string;
}): string {
  const { name, eventType, amount, currency = "USD", invoiceUrl, dueDate, renewalDate, trialEndDate } = params;

  const eventMessages: Record<typeof eventType, { title: string; body: string }> = {
    invoice_paid: {
      title: "Payment Received",
      body: `Your payment of <strong>${amount} ${currency}</strong> has been successfully processed. Your services remain active and uninterrupted.`,
    },
    invoice_due: {
      title: "Invoice Due Soon",
      body: `An invoice of <strong>${amount} ${currency}</strong> is due on <strong>${dueDate}</strong>. Please ensure your payment method is up to date to avoid any service interruption.`,
    },
    payment_failed: {
      title: "Payment Failed — Action Required",
      body: `We were unable to process your payment of <strong>${amount} ${currency}</strong>. Please update your payment method immediately to avoid service interruption.`,
    },
    subscription_renewed: {
      title: "Subscription Renewed",
      body: `Your SZL Holdings subscription has been successfully renewed. Your next billing date is <strong>${renewalDate}</strong>.`,
    },
    subscription_cancelled: {
      title: "Subscription Cancelled",
      body: `Your subscription has been cancelled. You will continue to have access until your current billing period ends. We're sorry to see you go — contact us if there's anything we can improve.`,
    },
    trial_ending: {
      title: "Your Trial is Ending Soon",
      body: `Your free trial ends on <strong>${trialEndDate}</strong>. To continue accessing SZL Holdings services without interruption, please upgrade your plan before that date.`,
    },
  };

  const { title, body } = eventMessages[eventType];

  return szlBrand(`
    <h2>${title}</h2>
    <p>Hello ${name},</p>
    <p>${body}</p>
    ${invoiceUrl ? `
    <div class="highlight">
      <p class="label">Invoice</p>
      <p>View and download your invoice for your records.</p>
    </div>
    <a class="cta" href="${invoiceUrl}">View Invoice</a>
    ` : `<a class="cta" href="https://szlholdings.com/billing">Manage Billing</a>`}
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
      <p>${inquiry.name}${inquiry.company ? ` · ${inquiry.company}` : ""}</p>
      <p class="label" style="margin-top:8px;">Email</p>
      <p>${inquiry.email}</p>
      <p class="label" style="margin-top:8px;">Type</p>
      <p>${inquiry.type}</p>
      <p class="label" style="margin-top:8px;">Message</p>
      <p>${inquiry.message.replace(/\n/g, "<br />")}</p>
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

export function buildCarlotaContactAckEmail(name: string): string {
  return carlotaBrand(`
    <h2>Inquiry received.</h2>
    <p>Thank you, ${name}. Your inquiry has been received and will be reviewed by a senior member of the advisory team.</p>
    <div class="highlight">
      <p class="label">What to expect</p>
      <p>All inquiries are handled with absolute discretion. You will receive a personal response within one business day.</p>
    </div>
    <p>Should you have an urgent matter, please contact us directly at <strong>hello@carlotajo.com</strong>.</p>
    <a class="cta" href="${process.env.VITE_APP_URL || "https://carlotajo.com"}/carlota-jo">Visit Our Site</a>
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
    rateType: "standard" | "premium" | "fixed" | "non-billable";
    amount: number;
  }>;
  fromName?: string;
  fromEmail?: string;
  notes?: string;
}

export function buildCarlotaInvoiceEmail(invoice: CarlotaInvoiceEmailData): string {
  const currency = invoice.currency || "GBP";
  const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
  const fmt = (n: number) =>
    `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const itemsHtml = invoice.items && invoice.items.length > 0
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
          ${invoice.items.map(it => `
            <tr style="border-bottom:1px solid #f0ebe0;">
              <td style="padding:10px 4px;font-size:12px;color:#4a4a4a;vertical-align:top;">${it.date}</td>
              <td style="padding:10px 4px;font-size:12px;color:#1a1a1a;vertical-align:top;">
                <div style="font-weight:600;">${it.phase}</div>
                <div style="color:#6b5e47;font-size:11px;margin-top:2px;">${it.deliverable}</div>
              </td>
              <td style="padding:10px 4px;font-size:12px;color:#4a4a4a;text-align:right;vertical-align:top;">${it.hours.toFixed(2)}</td>
              <td style="padding:10px 4px;font-size:12px;color:#1a1a1a;text-align:right;vertical-align:top;">${fmt(it.amount)}</td>
            </tr>
          `).join("")}
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
    ${invoice.notes ? `<p style="font-size:12px;color:#6b5e47;font-style:italic;margin-top:16px;">${invoice.notes}</p>` : ""}
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
      <p>${inquiry.name}${inquiry.company ? ` — ${inquiry.company}` : ""}</p>
      <p class="label" style="margin-top:10px;">Email</p>
      <p>${inquiry.email}</p>
      ${inquiry.phone ? `<p class="label" style="margin-top:10px;">Phone</p><p>${inquiry.phone}</p>` : ""}
      ${inquiry.service ? `<p class="label" style="margin-top:10px;">Service interest</p><p>${inquiry.service}</p>` : ""}
      <p class="label" style="margin-top:10px;">Message</p>
      <p>${inquiry.message.replace(/\n/g, "<br />")}</p>
    </div>
    <p>Reply directly to this email to respond to ${inquiry.name}.</p>
  `);
}

const STEPHEN_ADMIN_EMAIL = process.env.STEPHEN_ADMIN_EMAIL || process.env.SZL_INTERNAL_EMAIL || "stephen@szlholdings.com";
const CARLOTA_ADMIN_EMAIL = process.env.CARLOTA_ADMIN_EMAIL || process.env.SZL_INTERNAL_EMAIL || "hello@carlotajo.com";

export { INTERNAL_EMAIL, STEPHEN_ADMIN_EMAIL, CARLOTA_ADMIN_EMAIL };

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
  const primaryColor = branding.primaryColor || "#6366f1";
  const accentColor = branding.accentColor || "#7c3aed";
  const companyName = branding.companyName || "SZL Holdings";
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
  const companyName = branding.companyName || "the platform";
  return buildTenantBrand(branding, `
    <h2>Welcome to ${companyName}</h2>
    <p>Hello ${name},</p>
    <p>Your account has been created and you now have access to <strong>${companyName}</strong>. You can sign in and get started right away.</p>
    ${dashboardUrl ? `<a class="cta" href="${dashboardUrl}">Access Your Dashboard</a>` : ""}
  `);
}

export function buildTenantInviteEmail(
  branding: TenantEmailBranding,
  name: string,
  inviteUrl: string,
  expiresAt?: string,
): string {
  const companyName = branding.companyName || "the platform";
  return buildTenantBrand(branding, `
    <h2>You've been invited</h2>
    <p>Hello ${name},</p>
    <p>You have been invited to join <strong>${companyName}</strong>. Click the button below to set up your account.</p>
    ${expiresAt ? `
    <div class="highlight">
      <p class="label">Invitation Expires</p>
      <p>${expiresAt}</p>
    </div>
    ` : ""}
    <a class="cta" href="${inviteUrl}">Accept Invitation</a>
    <p style="margin-top:16px;font-size:12px;color:#9ca3af;">If you did not expect this invitation, you can safely ignore this email.</p>
  `);
}

export function buildTenantNotificationEmail(
  branding: TenantEmailBranding,
  title: string,
  body: string,
  ctaLabel?: string,
  ctaUrl?: string,
): string {
  return buildTenantBrand(branding, `
    <h2>${title}</h2>
    <p>${body}</p>
    ${ctaLabel && ctaUrl ? `<a class="cta" href="${ctaUrl}">${ctaLabel}</a>` : ""}
  `);
}

