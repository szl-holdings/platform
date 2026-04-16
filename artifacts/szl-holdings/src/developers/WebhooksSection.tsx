import { Code2, Key, Webhook, Shield, Terminal, Zap, Globe, ChevronRight, ExternalLink, AlertCircle, Lock, RefreshCw, Server, FileCode, Hash, ArrowRight, PlayCircle, Database, Layers } from "lucide-react";
import { CodeBlock, LanguageTabs, SectionHeader, SubSectionHeader, Callout, InlineCode } from "./components";
import { GQL_QUERY_VESSELS, GQL_QUERY_PROJECTS, GQL_MUTATION_SIGNAL, WEBHOOK_EVENTS, RATE_LIMIT_TIERS, ERROR_CODES, API_ERROR_CODES } from "./constants";

export function WebhooksSection() {
  return (
              id="webhooks"
              title="Webhooks"
              subtitle="Subscribe to platform events and receive real-time HTTPS notifications to your endpoint."
            />

            <SubSectionHeader id="webhooks-setup" title="Setup & Configuration" />
            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
              Webhooks are configured per-integration through <InlineCode>POST /api/webhooks</InlineCode>. Each
              webhook target is associated with a list of event types, a secret for signature verification,
              and an active/inactive status.
            </p>

            <CodeBlock
              filename="Register a webhook"
              language="bash"
              code={`curl -X POST https://[host]/api/webhooks \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/hooks/szl",
    "events": ["workflow.run.completed", "signal.ingested"],
    "secret": "your_webhook_secret_min_32_chars",
    "description": "Production workflow notifications"
  }'

# Response
{
  "id": "wh_01j9...",
  "url": "https://your-app.com/hooks/szl",
  "events": ["workflow.run.completed", "signal.ingested"],
  "status": "active",
  "createdAt": "2026-04-01T00:00:00.000Z"
}`}
            />

            <SubSectionHeader id="webhooks-signatures" title="Signature Verification" />
            <p style={{ color: "hsl(214,8%,64%)", lineHeight: "1.7", marginBottom: "1rem" }}>
              Every webhook delivery includes an <InlineCode>X-SZL-Signature-256</InlineCode> header containing
              an HMAC-SHA256 signature of the raw request body, keyed with your webhook secret.
              Always verify this signature before processing a payload.
            </p>

            <Callout type="danger">
              Never process a webhook payload without verifying its signature. Failing to verify
              signatures leaves your integration vulnerable to forged events.
            </Callout>

            <div className="mt-4">
              <LanguageTabs
                tabs={[
                  {
                    label: "Node.js",
                    language: "javascript",
                    filename: "verify-webhook.js",
                    code: `import crypto from 'crypto';

function verifyWebhookSignature(req, secret) {
  const signature = req.headers['x-szl-signature-256'];
  if (!signature) return false;

  const rawBody = req.rawBody; // Buffer — do not parse first
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Express middleware
app.post('/hooks/szl', express.raw({ type: '*/*' }), (req, res) => {
  if (!verifyWebhookSignature(req, process.env.SZL_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  const event = JSON.parse(req.body);
  // handle event...
  res.status(200).end();
});`,
                  },
                  {
                    label: "Python",
                    language: "python",
                    filename: "verify_webhook.py",
                    code: `import hmac
import hashlib

def verify_webhook_signature(body: bytes, signature: str, secret: str) -> bool:
    """Verify SZL webhook HMAC-SHA256 signature."""
    expected = 'sha256=' + hmac.new(
        secret.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

# Flask example
from flask import Flask, request, abort
import json

app = Flask(__name__)

@app.route('/hooks/szl', methods=['POST'])
def handle_webhook():
    sig = request.headers.get('X-SZL-Signature-256', '')
    if not verify_webhook_signature(
        request.get_data(),
        sig,
        os.environ['SZL_WEBHOOK_SECRET']
    ):
        abort(401)
    event = request.get_json()
    # handle event...
    return '', 200`,
                  },
                ]}
              />
            </div>

            <SubSectionHeader id="webhooks-events" title="Event Reference" />

            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid hsla(0,0%,100%,0.07)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsla(214,14%,7%,0.8)", borderBottom: "1px solid hsla(0,0%,100%,0.07)" }}>
                    {["Event Type", "Description"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3"
                        style={{ color: "hsl(214,8%,55%)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "0.75rem" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WEBHOOK_EVENTS.map(({ event, description }, i) => (
                    <tr
                      key={event}
                      style={{
                        borderBottom: i < WEBHOOK_EVENTS.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none",
                        background: i % 2 === 0 ? "hsla(214,14%,6%,0.4)" : "transparent",
                      }}
                    >
                      <td className="px-4 py-3" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "hsl(200,80%,72%)", whiteSpace: "nowrap" }}>
                        {event}
                      </td>
                      <td className="px-4 py-3" style={{ color: "hsl(214,8%,64%)" }}>{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <CodeBlock
                filename="Webhook payload shape"
                language="json"
                code={`{
  "id": "evt_01j9abc...",
  "type": "workflow.run.completed",
  "createdAt": "2026-04-01T12:00:00.000Z",
  "data": {
    "runId": 1024,
    "workflowId": "wf_vessels_alert_handler",
    "status": "completed",
    "durationMs": 3420,
    "triggeredBy": "signal_ingest",
    "output": { ... }
  }
}`}
              />
            </div>
          </section>

          {/* ── Code Samples ── */}
          <section>
  );
}
