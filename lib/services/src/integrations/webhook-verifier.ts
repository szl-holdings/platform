import crypto from "crypto";

export type WebhookSignatureAlgorithm = "hmac-sha256" | "hmac-sha1" | "slack-v0" | "salesforce-cdc";

export interface WebhookVerifyOptions {
  algorithm: WebhookSignatureAlgorithm;
  secret: string;
  signature: string;
  body: string;
  timestamp?: string;
  toleranceSeconds?: number;
}

export interface WebhookVerifyResult {
  valid: boolean;
  reason?: string;
}

export function verifyWebhookSignature(opts: WebhookVerifyOptions): WebhookVerifyResult {
  const { algorithm, secret, signature, body, timestamp, toleranceSeconds = 300 } = opts;

  switch (algorithm) {
    case "hmac-sha256":
      return verifyHmacSha256(secret, signature, body);
    case "hmac-sha1":
      return verifyHmacSha1(secret, signature, body);
    case "slack-v0":
      return verifySlackV0(secret, signature, body, timestamp, toleranceSeconds);
    case "salesforce-cdc":
      return verifySalesforceCdc(secret, signature, body);
    default:
      return { valid: false, reason: `Unknown algorithm: ${algorithm}` };
  }
}

function verifyHmacSha256(secret: string, signature: string, body: string): WebhookVerifyResult {
  try {
    const expected = crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");
    const normalizedSig = signature.replace(/^sha256=/, "");
    const valid = crypto.timingSafeEqual(
      Buffer.from(normalizedSig, "hex"),
      Buffer.from(expected, "hex"),
    );
    return { valid, reason: valid ? undefined : "HMAC-SHA256 signature mismatch" };
  } catch {
    return { valid: false, reason: "HMAC-SHA256 verification error" };
  }
}

function verifyHmacSha1(secret: string, signature: string, body: string): WebhookVerifyResult {
  try {
    const expected = crypto.createHmac("sha1", secret).update(body, "utf8").digest("hex");
    const normalizedSig = signature.replace(/^sha1=/, "");
    const valid = crypto.timingSafeEqual(
      Buffer.from(normalizedSig, "hex"),
      Buffer.from(expected, "hex"),
    );
    return { valid, reason: valid ? undefined : "HMAC-SHA1 signature mismatch" };
  } catch {
    return { valid: false, reason: "HMAC-SHA1 verification error" };
  }
}

function verifySlackV0(
  signingSecret: string,
  signature: string,
  body: string,
  timestamp?: string,
  toleranceSeconds = 300,
): WebhookVerifyResult {
  if (!timestamp) return { valid: false, reason: "Missing X-Slack-Request-Timestamp" };

  const ts = parseInt(timestamp, 10);
  if (Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) {
    return { valid: false, reason: "Slack request timestamp too old (replay attack protection)" };
  }

  try {
    const baseString = `v0:${timestamp}:${body}`;
    const expected = "v0=" + crypto.createHmac("sha256", signingSecret).update(baseString).digest("hex");
    const sigBuffer = Buffer.from(signature.padEnd(expected.length, "\0"));
    const expBuffer = Buffer.from(expected.padEnd(signature.length, "\0"));
    const valid = sigBuffer.length === expBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expBuffer);
    return { valid, reason: valid ? undefined : "Slack signature mismatch" };
  } catch {
    return { valid: false, reason: "Slack signature verification error" };
  }
}

function verifySalesforceCdc(secret: string, signature: string, body: string): WebhookVerifyResult {
  try {
    const expected = crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");
    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
    return { valid, reason: valid ? undefined : "Salesforce CDC signature mismatch" };
  } catch {
    return { valid: false, reason: "Salesforce CDC signature verification error" };
  }
}

export function extractJiraSignature(headers: Record<string, string | string[] | undefined>): string | null {
  const sig = headers["x-hub-signature"] ?? headers["X-Hub-Signature"];
  return Array.isArray(sig) ? sig[0] ?? null : sig ?? null;
}

export function extractPagerDutySignature(headers: Record<string, string | string[] | undefined>): string | null {
  const sig = headers["x-pagerduty-signature"] ?? headers["X-PagerDuty-Signature"];
  return Array.isArray(sig) ? sig[0] ?? null : sig ?? null;
}

export function extractSlackSignature(headers: Record<string, string | string[] | undefined>): {
  signature: string | null;
  timestamp: string | null;
} {
  const sig = headers["x-slack-signature"] ?? headers["X-Slack-Signature"];
  const ts = headers["x-slack-request-timestamp"] ?? headers["X-Slack-Request-Timestamp"];
  return {
    signature: Array.isArray(sig) ? sig[0] ?? null : sig ?? null,
    timestamp: Array.isArray(ts) ? ts[0] ?? null : ts ?? null,
  };
}
