import nodemailer from "nodemailer";

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
const INTERNAL_EMAIL = process.env.SZL_INTERNAL_EMAIL || "team@szlholdings.com";

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

export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  try {
    return await sendViaResend(options);
  } catch (resendErr) {
    console.warn("[email] Resend failed, trying SMTP fallback:", (resendErr as Error).message);
    try {
      return await sendViaSMTP(options);
    } catch (smtpErr) {
      console.error("[email] SMTP fallback also failed:", (smtpErr as Error).message);
      return { success: false, error: `All providers failed. Resend: ${(resendErr as Error).message}` };
    }
  }
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
      <p>${inquiry.message.replace(/\n/g, "<br />")}</p>
    </div>
    <p>Review and respond in the admin panel or reply directly to this email.</p>
    <a class="cta" href="${process.env.VITE_APP_URL || "https://szlholdings.com"}/admin">Open Admin</a>
  `);
}

export function buildWelcomeEmail(name: string, email: string): string {
  return szlBrand(`
    <h2>Welcome to the SZL Ecosystem</h2>
    <p>Hello ${name},</p>
    <p>You're now connected to SZL Holdings — a vertically-integrated technology holding company engineering the convergence of AI, cybersecurity, and maritime intelligence.</p>
    <p>Here's what you now have access to:</p>
    <div class="highlight">
      <p><strong>Firestorm</strong> — Military-grade cybersecurity simulation &amp; SOC operations</p>
    </div>
    <div class="highlight">
      <p><strong>Vessels</strong> — Full-spectrum maritime domain awareness &amp; AIS intelligence</p>
    </div>
    <div class="highlight">
      <p><strong>INCA</strong> — AI research command center &amp; model governance</p>
    </div>
    <div class="highlight">
      <p><strong>Lyte</strong> — AIOps and MLOps command center for enterprise AI</p>
    </div>
    <p>Explore the full ecosystem at your command:</p>
    <a class="cta" href="${process.env.VITE_APP_URL || "https://szlholdings.com"}">Enter the Ecosystem</a>
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

export { INTERNAL_EMAIL };
