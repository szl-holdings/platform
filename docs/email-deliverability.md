# Email Deliverability Setup

## Sending Domain

All transactional email is sent from `inquiries@szlholdings.com` (SZL brand),
`hello@carlotajo.com` (Carlota Jo), and `stephen@szlholdings.com` (Stephen Lutar
personal site). The instructions below apply to each domain independently.

---

## 1. SPF (Sender Policy Framework)

SPF tells receiving servers which IP addresses are authorized to send on behalf
of your domain. Add a `TXT` record to your DNS for each sending domain.

### For SendGrid

```
Name:  @  (or the bare domain, e.g. szlholdings.com)
Type:  TXT
Value: v=spf1 include:sendgrid.net ~all
```

### For Resend

```
Name:  @
Type:  TXT
Value: v=spf1 include:amazonses.com ~all
```

> If you use both providers simultaneously, combine them:
> `v=spf1 include:sendgrid.net include:amazonses.com ~all`

---

## 2. DKIM (DomainKeys Identified Mail)

DKIM adds a cryptographic signature to every outbound message so receivers can
verify it was not tampered with in transit.

### SendGrid

1. In the SendGrid dashboard go to **Settings → Sender Authentication**.
2. Choose **Authenticate Your Domain** and follow the wizard for your domain registrar.
3. SendGrid will provide two `CNAME` records similar to:

```
Name:  s1._domainkey.szlholdings.com   Type: CNAME   Value: s1.domainkey.u<id>.wl.sendgrid.net
Name:  s2._domainkey.szlholdings.com   Type: CNAME   Value: s2.domainkey.u<id>.wl.sendgrid.net
```

4. Add both records in your DNS registrar and click **Verify** in SendGrid.

### Resend

1. In the Resend dashboard go to **Domains** → add your domain.
2. Resend will provide a `TXT` record for DKIM:

```
Name:  resend._domainkey.szlholdings.com
Type:  TXT
Value: p=<public-key-value>
```

3. Add the record and click **Verify** in the Resend dashboard.

---

## 3. DMARC (Domain-based Message Authentication, Reporting & Conformance)

DMARC ties SPF and DKIM together and instructs receiving servers how to handle
messages that fail authentication. Start in monitoring mode (`p=none`) and
tighten once reports confirm clean alignment.

```
Name:  _dmarc.szlholdings.com
Type:  TXT
Value: v=DMARC1; p=none; rua=mailto:dmarc-reports@szlholdings.com; ruf=mailto:dmarc-reports@szlholdings.com; fo=1;
```

Progress to `p=quarantine` once DMARC reports show >98% pass rate, then
`p=reject` for full enforcement.

---

## 4. Bounce & Complaint Handling

Bounces and spam complaints are ingested via provider webhooks and written to the
`email_suppressions` table. `sendEmail()` refuses to send to any address in this
table.

### SendGrid webhook

1. In SendGrid → **Settings → Mail Settings → Event Webhook**.
2. Set the endpoint URL to:
   `https://szlholdings.com/api/email-webhooks/sendgrid`
3. Enable events: **Bounce**, **Spam Report**, **Unsubscribe**.
4. Set an **Authorization Header** with value matching the `SENDGRID_WEBHOOK_SECRET` env var.

### Resend webhook

1. In Resend → **Webhooks** → Add endpoint.
2. Set the endpoint URL to:
   `https://szlholdings.com/api/email-webhooks/resend`
3. Subscribe to events: `email.bounced`, `email.complained`.
4. Copy the signing secret into the `RESEND_WEBHOOK_SECRET` env var.

---

## 5. Unsubscribe Endpoint

Every outbound transactional email should include an unsubscribe link built with:

```typescript
import { generateUnsubscribeToken } from '../lib/email.js';

const token = generateUnsubscribeToken(recipientEmail);
const unsubscribeUrl = `${process.env.APP_URL}/api/email/unsubscribe?e=${encodeURIComponent(recipientEmail)}&t=${token}`;
```

Pass `unsubscribeToken: token` in `EmailOptions` and `sendEmail` will:
- Inject a `List-Unsubscribe` header
- Append an unsubscribe footer link to the HTML body

---

## 6. Admin Test Endpoint

Admins can send a sample email to verify templates and deliverability:

```
POST /api/admin/email/test-send
Authorization: Bearer <admin-session-token>
Content-Type: application/json

{
  "template": "welcome",   // welcome | alert | invite | digest | reset
  "to": "test@example.com"
}
```

Response: `{ "success": true, "messageId": "sg-abc123", "provider": "sendgrid" }`

---

## 7. Environment Variables

| Variable | Purpose |
|---|---|
| `EMAIL_PROVIDER` | Primary provider: `sendgrid` or `resend` |
| `SENDGRID_API_KEY` | SendGrid API key |
| `RESEND_API_KEY` | Resend API key |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Fallback SMTP credentials |
| `SENDGRID_WEBHOOK_SECRET` | Shared secret for bounce webhook validation |
| `RESEND_WEBHOOK_SECRET` | Signing secret for Resend webhook validation |
| `UNSUBSCRIBE_SECRET` | HMAC secret for unsubscribe token generation |
| `APP_URL` | Base URL used in email links (e.g. `https://szlholdings.com`) |
