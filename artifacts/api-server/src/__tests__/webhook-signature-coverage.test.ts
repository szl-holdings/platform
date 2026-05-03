/**
 * webhook-signature-coverage.test.ts
 *
 * Acts as a lightweight CI "lint rule" for inbound webhook security.
 *
 * Four enforcement layers:
 *  1. HMAC helper unit tests — verifies the shared crypto primitives are correct.
 *  2. Registry completeness — every inbound webhook route is registered here with
 *     its provider, secret env var, and verifier kind.
 *  3. Code-level verification evidence — for each registry entry, asserts that
 *     the source file contains recognizable cryptographic verification code.
 *     A developer CANNOT satisfy this by only adding a registry entry;
 *     they must also have verifiable security code in the implementation.
 *  4. New-route guard — scans all route source files for POST handlers that
 *     look like inbound webhook paths and asserts each specific path is
 *     registered AND that verification evidence exists near the path in the source.
 *
 * Maintenance rule: when you add a new inbound webhook POST route:
 *  a. Add an entry to INBOUND_WEBHOOK_REGISTRY with the exact path and verifier kind.
 *  b. Implement verification using webhookSignatureMiddleware or an approved alternative.
 *  c. Add a row to docs/webhooks.md.
 *  d. Run this suite — all four layers must pass.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  verifyHmacSha256,
  verifyGitHubStyle,
  verifyStripeStyle,
} from '../middlewares/webhook-signature';

// ─── Registry of every inbound webhook route ─────────────────────────────────

interface WebhookRegistryEntry {
  /** Exact HTTP method + path as it appears in router.post('...') */
  routePath: string;
  /** Path relative to src/ that implements the route */
  sourceFile: string;
  /** Verification approach used — must be an approved kind (see APPROVED_VERIFIERS) */
  verifierKind: string;
  /** Environment variable holding the secret (or description for per-connection) */
  secretEnvVar: string;
  /** Optional notes */
  notes?: string;
}

const INBOUND_WEBHOOK_REGISTRY: WebhookRegistryEntry[] = [
  // ── Email providers ──────────────────────────────────────────────────────────
  {
    routePath: '/email-webhooks/sendgrid',
    sourceFile: 'routes/email-webhooks.ts',
    verifierKind: 'timingSafeEqual-auth-header',
    secretEnvVar: 'SENDGRID_WEBHOOK_SECRET',
    notes: 'SendGrid V2 webhook uses Authorization header bearer comparison (timingSafeEqual)',
  },
  {
    routePath: '/email-webhooks/resend',
    sourceFile: 'routes/email-webhooks.ts',
    verifierKind: 'svix-hmac-sha256',
    secretEnvVar: 'RESEND_WEBHOOK_SECRET',
    notes: 'Resend uses Svix HMAC-SHA256 with svix-id, svix-timestamp, svix-signature headers; svix-timestamp validated within 5-minute replay-protection window',
  },

  // ── Payment providers ────────────────────────────────────────────────────────
  {
    routePath: '/billing/webhooks',
    sourceFile: 'routes/billing.ts',
    verifierKind: 'stripe-sdk',
    secretEnvVar: 'STRIPE_WEBHOOK_SECRET',
    notes: 'Stripe SDK stripe.webhooks.constructEvent; returns 401 on bad sig',
  },
  {
    routePath: '/webhooks/plaid',
    sourceFile: 'routes/billing-rails.ts',
    verifierKind: 'hmac-sha256-hex',
    secretEnvVar: 'PLAID_WEBHOOK_SECRET',
    notes: 'verifyPlaidWebhookSignature; 401 on failure; passthrough in demo mode (no PLAID_CLIENT_ID)',
  },
  {
    routePath: '/webhooks/coinbase',
    sourceFile: 'routes/billing-rails.ts',
    verifierKind: 'hmac-sha256-hex',
    secretEnvVar: 'COINBASE_COMMERCE_WEBHOOK_SECRET',
    notes: 'verifyCoinbaseWebhookSignature; 401 on failure; passthrough in demo mode',
  },
  {
    routePath: '/lyte/billing/webhooks/failed-payment',
    sourceFile: 'routes/lyte-billing.ts',
    verifierKind: 'webhookSignatureMiddleware',
    secretEnvVar: 'LYTE_BILLING_WEBHOOK_SECRET',
    notes: 'HMAC-SHA256 via webhookSignatureMiddleware; x-lyte-signature header; fails closed (401) when secret unset',
  },

  // ── SIEM / Security event ingest ─────────────────────────────────────────────
  {
    routePath: '/sentra/siem/ingest/:connectionId',
    sourceFile: 'routes/sentra-siem.ts',
    verifierKind: 'per-connection-hmac-sha256',
    secretEnvVar: '(per-connection config: hmacSecret)',
    notes: 'Verification is optional per connection; absent hmacSecret = unauthenticated (tracked in #4049)',
  },
  {
    routePath: '/webhooks/inbound/siem/splunk',
    sourceFile: 'routes/external-integrations.ts',
    verifierKind: 'bearer-token',
    secretEnvVar: 'SIEM_INGEST_TOKEN',
    notes: 'verifySiemToken middleware; Bearer token in Authorization header; passthrough when unconfigured',
  },
  {
    routePath: '/webhooks/inbound/siem/sentinel',
    sourceFile: 'routes/external-integrations.ts',
    verifierKind: 'bearer-token',
    secretEnvVar: 'SIEM_INGEST_TOKEN',
    notes: 'verifySiemToken middleware; Bearer token in Authorization header',
  },
  {
    routePath: '/webhooks/inbound/siem/cef',
    sourceFile: 'routes/external-integrations.ts',
    verifierKind: 'bearer-token',
    secretEnvVar: 'SIEM_INGEST_TOKEN',
    notes: 'verifySiemToken middleware; Bearer token in Authorization header',
  },
  {
    routePath: '/webhooks/inbound/siem/syslog',
    sourceFile: 'routes/external-integrations.ts',
    verifierKind: 'bearer-token',
    secretEnvVar: 'SIEM_INGEST_TOKEN',
    notes: 'verifySiemToken middleware; Bearer token in Authorization header',
  },
  {
    routePath: '/webhooks/inbound/siem/events',
    sourceFile: 'routes/external-integrations.ts',
    verifierKind: 'bearer-token',
    secretEnvVar: 'SIEM_INGEST_TOKEN',
    notes: 'verifySiemToken middleware; Bearer token in Authorization header',
  },

  // ── Third-party integrations ──────────────────────────────────────────────────
  {
    routePath: '/webhooks/inbound/jira',
    sourceFile: 'routes/external-integrations.ts',
    verifierKind: 'github-style-delegated',
    secretEnvVar: 'JIRA_WEBHOOK_SECRET',
    notes: 'X-Hub-Signature-256; delegated to services.jira.handleWebhookEvent; 401 on bad/missing sig',
  },
  {
    routePath: '/webhooks/inbound/pagerduty',
    sourceFile: 'routes/external-integrations.ts',
    verifierKind: 'provider-sdk-delegated',
    secretEnvVar: 'PAGERDUTY_WEBHOOK_SECRET',
    notes: 'X-PagerDuty-Signature; delegated to services.pagerduty.handleWebhookEvent; 401 on bad/missing sig',
  },
  {
    routePath: '/webhooks/inbound/slack/events',
    sourceFile: 'routes/external-integrations.ts',
    verifierKind: 'slack-signing-secret',
    secretEnvVar: 'SLACK_SIGNING_SECRET',
    notes: 'Slack signing-secret HMAC-SHA256 via services.slack.verifyWebhookSignature; timestamp replay protection',
  },
  {
    routePath: '/webhooks/inbound/slack/interactions',
    sourceFile: 'routes/external-integrations.ts',
    verifierKind: 'slack-signing-secret',
    secretEnvVar: 'SLACK_SIGNING_SECRET',
    notes: 'Slack signing-secret HMAC-SHA256; timestamp replay protection',
  },
  {
    routePath: '/webhooks/inbound/slack/commands',
    sourceFile: 'routes/external-integrations.ts',
    verifierKind: 'slack-signing-secret',
    secretEnvVar: 'SLACK_SIGNING_SECRET',
    notes: 'Slack signing-secret HMAC-SHA256; timestamp replay protection',
  },
  {
    routePath: '/webhooks/inbound/salesforce/cdc',
    sourceFile: 'routes/external-integrations.ts',
    verifierKind: 'provider-sdk-delegated',
    secretEnvVar: 'SALESFORCE_WEBHOOK_SECRET',
    notes: 'X-Salesforce-Signature; delegated to services.salesforce.processCdcEvent; 401 on bad/missing sig',
  },

  // ── Internal / intentionally public ──────────────────────────────────────────
  {
    routePath: '/adoption/beacon',
    sourceFile: 'routes/omnia.ts',
    verifierKind: 'intentionally-public',
    secretEnvVar: '(none — internal shell telemetry)',
    notes: 'Fire-and-forget shell adoption telemetry. No external attacker has motivation to forge these events.',
  },
];

// ─── Approved verifier kinds ─────────────────────────────────────────────────

const APPROVED_VERIFIERS = new Set([
  'webhookSignatureMiddleware',       // shared helper from middlewares/webhook-signature.ts
  'stripe-sdk',                       // official Stripe SDK constructEvent / verifyWebhookPayload
  'svix-hmac-sha256',                // Svix-format HMAC (used by Resend)
  'hmac-sha256-hex',                 // raw HMAC hex (Plaid, Coinbase)
  'per-connection-hmac-sha256',      // HMAC configured per SIEM connection
  'bearer-token',                    // Bearer token auth header (SIEM ingest endpoints)
  'slack-signing-secret',            // Slack signing secret via SDK
  'github-style-delegated',          // GitHub X-Hub-Signature-256, delegated to provider SDK
  'provider-sdk-delegated',          // Signature check delegated to provider SDK / service layer
  'timingSafeEqual-auth-header',     // timing-safe Authorization header comparison (SendGrid V2)
  'intentionally-public',            // documented public endpoint with no secrets to protect
]);

// ─── Code-level verification evidence patterns ────────────────────────────────
//
// For each verifierKind, define a regex that MUST match inside the source file.
// This proves that actual cryptographic verification code is present.
// A registry entry alone is not sufficient — the source must contain evidence.

const VERIFIER_CODE_EVIDENCE: Record<string, RegExp> = {
  'webhookSignatureMiddleware':    /webhookSignatureMiddleware\s*\(/,
  'stripe-sdk':                   /constructEvent|verifyWebhookPayload/,
  'svix-hmac-sha256':             /svix[-_]signature|svix[-_]id|svix[-_]timestamp/i,
  'hmac-sha256-hex':              /verifyPlaidWebhookSignature|verifyCoinbaseWebhookSignature|createHmac|timingSafeEqual/,
  'per-connection-hmac-sha256':   /hmacSecret|verifyHmacSha256|createHmac/,
  'bearer-token':                 /verifySiemToken|Authorization.*Bearer|bearer.*token/i,
  'slack-signing-secret':         /verifyWebhookSignature|SLACK_SIGNING_SECRET|x-slack-signature/i,
  'github-style-delegated':       /[xX]-[hH]ub-[sS]ignature|handleWebhookEvent/,
  'provider-sdk-delegated':       /handleWebhookEvent|processCdcEvent/,
  'timingSafeEqual-auth-header':  /timingSafeEqual/,
  'intentionally-public':         /./, // No verification required — always passes
};

// ─── Verification evidence for any NEW detected webhook path ──────────────────
//
// When the new-route scanner finds a path that IS in the registry, it also
// checks that the surrounding source context (the handler body) contains one
// of these patterns before declaring the route safe.

const ANY_VERIFICATION_PATTERN = new RegExp(
  [
    'webhookSignatureMiddleware',
    'constructEvent',
    'verifyWebhookPayload',
    'verifyHmacSha256',
    'verifyGitHubStyle',
    'verifyStripeStyle',
    'verifySiemToken',
    'verifyWebhookSignature',
    'verifyPlaidWebhookSignature',
    'verifyCoinbaseWebhookSignature',
    'validateSendGridSignature',
    'validateResendSignature',
    'timingSafeEqual',
    'handleWebhookEvent',
    'processCdcEvent',
    'hmacSecret',
    'SLACK_SIGNING_SECRET',
    'SIEM_INGEST_TOKEN',
  ].join('|'),
);

// Build sets for O(1) lookup
const REGISTERED_ROUTE_PATHS = new Set(INBOUND_WEBHOOK_REGISTRY.map((e) => e.routePath));
const REGISTERED_SOURCE_FILES = new Set(INBOUND_WEBHOOK_REGISTRY.map((e) => e.sourceFile));
const FILES_REQUIRING_WEBHOOK_SIGNATURE_IMPORT = new Set(
  INBOUND_WEBHOOK_REGISTRY
    .filter((e) => e.verifierKind === 'webhookSignatureMiddleware')
    .map((e) => e.sourceFile),
);

const SRC_DIR = path.resolve(__dirname, '..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_DIR, relPath), 'utf8');
}

/**
 * Extract the ~40 lines following a path string occurrence in source,
 * representing the handler body where verification should live.
 */
function extractHandlerContext(content: string, pathLiteral: string): string {
  const idx = content.indexOf(pathLiteral);
  if (idx === -1) return '';
  // Find the surrounding router.post block: 40 lines after the path occurrence
  const fromIdx = Math.max(0, idx - 100);
  const lines = content.slice(fromIdx, idx + 2000).split('\n').slice(0, 45);
  return lines.join('\n');
}

// ─── 1. Unit tests for the shared HMAC helpers ───────────────────────────────

describe('verifyHmacSha256', () => {
  const secret = 'test-secret-key';
  const payload = 'hello webhook payload';

  function sign(body: string, s: string): string {
    return crypto.createHmac('sha256', s).update(body).digest('hex');
  }

  it('accepts a valid plain hex signature', () => {
    expect(verifyHmacSha256(payload, secret, sign(payload, secret))).toBe(true);
  });

  it('accepts a valid sha256= prefixed signature', () => {
    expect(verifyHmacSha256(payload, secret, `sha256=${sign(payload, secret)}`)).toBe(true);
  });

  it('rejects a tampered payload', () => {
    expect(verifyHmacSha256('tampered', secret, sign(payload, secret))).toBe(false);
  });

  it('rejects a wrong secret', () => {
    expect(verifyHmacSha256(payload, 'wrong-secret', sign(payload, secret))).toBe(false);
  });

  it('rejects a non-hex signature without throwing', () => {
    expect(verifyHmacSha256(payload, secret, 'not-a-hex-string!!')).toBe(false);
  });

  it('works with Buffer payload', () => {
    const buf = Buffer.from(payload, 'utf8');
    expect(verifyHmacSha256(buf, secret, sign(payload, secret))).toBe(true);
  });
});

describe('verifyGitHubStyle', () => {
  const secret = 'github-secret';
  const body = '{"ref":"refs/heads/main"}';

  function githubSign(b: string, s: string): string {
    const hex = crypto.createHmac('sha256', s).update(b).digest('hex');
    return `sha256=${hex}`;
  }

  it('accepts a valid GitHub-style signature', () => {
    expect(verifyGitHubStyle(body, secret, githubSign(body, secret))).toBe(true);
  });

  it('rejects undefined signature', () => {
    expect(verifyGitHubStyle(body, secret, undefined)).toBe(false);
  });

  it('rejects tampered body', () => {
    expect(verifyGitHubStyle('tampered', secret, githubSign(body, secret))).toBe(false);
  });

  it('rejects wrong secret', () => {
    expect(verifyGitHubStyle(body, 'bad-secret', githubSign(body, secret))).toBe(false);
  });
});

describe('verifyStripeStyle', () => {
  const secret = 'stripe-whsec';
  const body = '{"type":"payment_intent.succeeded"}';

  function stripeSign(b: string, s: string, ts?: number): string {
    const t = ts ?? Math.floor(Date.now() / 1000);
    const hex = crypto.createHmac('sha256', s).update(`${t}.${b}`).digest('hex');
    return `t=${t},v1=${hex}`;
  }

  it('accepts a valid Stripe-style signature', () => {
    expect(verifyStripeStyle(body, secret, stripeSign(body, secret))).toBe(true);
  });

  it('rejects an expired timestamp (>300 s old)', () => {
    const oldTs = Math.floor(Date.now() / 1000) - 400;
    expect(verifyStripeStyle(body, secret, stripeSign(body, secret, oldTs))).toBe(false);
  });

  it('rejects a missing signature header', () => {
    expect(verifyStripeStyle(body, secret, undefined)).toBe(false);
  });

  it('rejects a signature with a bad v1 value', () => {
    const ts = Math.floor(Date.now() / 1000);
    expect(verifyStripeStyle(body, secret, `t=${ts},v1=deadbeef`)).toBe(false);
  });

  it('accepts a custom tolerance window', () => {
    const oldTs = Math.floor(Date.now() / 1000) - 600;
    expect(verifyStripeStyle(body, secret, stripeSign(body, secret, oldTs), 700)).toBe(true);
    expect(verifyStripeStyle(body, secret, stripeSign(body, secret, oldTs), 500)).toBe(false);
  });

  it('rejects missing t= field', () => {
    expect(verifyStripeStyle(body, secret, 'v1=deadbeef')).toBe(false);
  });

  it('rejects missing v1= field', () => {
    const ts = Math.floor(Date.now() / 1000);
    expect(verifyStripeStyle(body, secret, `t=${ts}`)).toBe(false);
  });
});

// ─── 2. Registry integrity ────────────────────────────────────────────────────

describe('INBOUND_WEBHOOK_REGISTRY integrity', () => {
  it('every verifierKind is in APPROVED_VERIFIERS', () => {
    for (const entry of INBOUND_WEBHOOK_REGISTRY) {
      expect(
        APPROVED_VERIFIERS.has(entry.verifierKind),
        `Unknown verifierKind "${entry.verifierKind}" for ${entry.routePath}. ` +
        `Add it to APPROVED_VERIFIERS or use an existing kind.`,
      ).toBe(true);
    }
  });

  it('every entry has a non-empty routePath', () => {
    for (const entry of INBOUND_WEBHOOK_REGISTRY) {
      expect(entry.routePath.length, `Missing routePath for ${entry.sourceFile}`).toBeGreaterThan(0);
    }
  });

  it('every entry has a non-empty secretEnvVar', () => {
    for (const entry of INBOUND_WEBHOOK_REGISTRY) {
      expect(entry.secretEnvVar.length, `Missing secretEnvVar for ${entry.routePath}`).toBeGreaterThan(0);
    }
  });

  it('every source file listed in the registry exists on disk', () => {
    for (const entry of INBOUND_WEBHOOK_REGISTRY) {
      const fullPath = path.join(SRC_DIR, entry.sourceFile);
      expect(
        fs.existsSync(fullPath),
        `Source file not found: ${entry.sourceFile} (for route ${entry.routePath})`,
      ).toBe(true);
    }
  });

  it('no duplicate routePath entries', () => {
    const seen = new Set<string>();
    for (const entry of INBOUND_WEBHOOK_REGISTRY) {
      expect(
        seen.has(entry.routePath),
        `Duplicate routePath in registry: ${entry.routePath}`,
      ).toBe(false);
      seen.add(entry.routePath);
    }
  });

  it('covers all major webhook path prefixes', () => {
    const paths = INBOUND_WEBHOOK_REGISTRY.map((e) => e.routePath);
    expect(paths.some((p) => p.startsWith('/billing/webhooks'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/webhooks/plaid'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/webhooks/coinbase'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/email-webhooks/'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/lyte/billing/webhooks/'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/sentra/siem/ingest/'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/webhooks/inbound/slack/'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/webhooks/inbound/jira'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/webhooks/inbound/pagerduty'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/webhooks/inbound/salesforce/'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/webhooks/inbound/siem/'))).toBe(true);
  });
});

// ─── 3. Code-level verification evidence ─────────────────────────────────────
//
// For each registry entry, asserts that the source file contains recognizable
// cryptographic verification code matching the declared verifierKind.
// This layer ensures the registry cannot be populated with correct-looking
// metadata while the implementation lacks actual verification.

describe('INBOUND_WEBHOOK_REGISTRY code-level verification evidence', () => {
  for (const entry of INBOUND_WEBHOOK_REGISTRY) {
    const evidence = VERIFIER_CODE_EVIDENCE[entry.verifierKind];
    if (!evidence) continue;

    it(`${entry.routePath} — source contains evidence of ${entry.verifierKind}`, () => {
      const content = readSrc(entry.sourceFile);
      expect(
        evidence.test(content),
        `${entry.sourceFile} claims verifierKind "${entry.verifierKind}" for ${entry.routePath} ` +
        `but the expected verification code pattern was not found.\n` +
        `Required pattern: ${evidence}\n` +
        `Either update the implementation to use the declared verification approach, ` +
        `or correct the verifierKind in the registry.`,
      ).toBe(true);
    });
  }
});

// ─── 4. Import checks ────────────────────────────────────────────────────────
//
// Routes using webhookSignatureMiddleware must import it from the shared helper.

describe('webhook-signature import coverage', () => {
  for (const relPath of FILES_REQUIRING_WEBHOOK_SIGNATURE_IMPORT) {
    it(`${relPath} imports from webhook-signature middleware`, () => {
      const content = readSrc(relPath);
      expect(
        content.includes('webhook-signature'),
        `${relPath} must import from ../middlewares/webhook-signature to use webhookSignatureMiddleware`,
      ).toBe(true);
    });
  }
});

// ─── 5. Per-path new-route detection ─────────────────────────────────────────
//
// Scans all route files for POST handlers matching inbound-webhook path patterns.
// For each detected path:
//   (a) It must be registered in INBOUND_WEBHOOK_REGISTRY.
//   (b) The handler context (surrounding source lines) must contain evidence
//       of cryptographic verification — preventing a passthrough implementation.
//
// This catches routes added to already-registered files without registry updates,
// AND routes that declare a registry entry but lack actual verification code.

const WEBHOOK_PATH_MATCHERS = [
  /router\.post\s*\(\s*['"`](\/webhooks\/(?!endpoints|deliveries|event-types)[^'"`]+)['"`]/g,
  /router\.post\s*\(\s*['"`](\/email-webhooks\/[^'"`]+)['"`]/g,
  /router\.post\s*\(\s*['"`](\/billing\/webhooks)['"`]/g,
  /router\.post\s*\(\s*['"`](\/lyte\/billing\/webhooks\/[^'"`]+)['"`]/g,
  /router\.post\s*\(\s*['"`](\/sentra\/siem\/ingest\/[^'"`]+)['"`]/g,
  /router\.post\s*\(\s*['"`](\/adoption\/beacon)['"`]/g,
];

function extractWebhookPaths(content: string): string[] {
  const found: string[] = [];
  for (const pattern of WEBHOOK_PATH_MATCHERS) {
    let match: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(content)) !== null) {
      const p = match[1];
      if (p) found.push(p);
    }
  }
  return found;
}

function pathMatchesRegistry(detectedPath: string): boolean {
  if (REGISTERED_ROUTE_PATHS.has(detectedPath)) return true;
  // Param variant: /sentra/siem/ingest/abc → /sentra/siem/ingest/:connectionId
  return Array.from(REGISTERED_ROUTE_PATHS).some((registered) => {
    const regParts = registered.split('/');
    const detParts = detectedPath.split('/');
    if (regParts.length !== detParts.length) return false;
    return regParts.every((seg, i) => seg.startsWith(':') || seg === detParts[i]);
  });
}

describe('new webhook route detection — every path must be registered and verified', () => {
  const routesDir = path.join(SRC_DIR, 'routes');
  const routeFiles = fs
    .readdirSync(routesDir, { recursive: true, withFileTypes: true })
    .filter((f) => f.isFile() && f.name.endsWith('.ts') && !f.name.endsWith('.test.ts'))
    .map((f) => {
      const dir =
        'parentPath' in f
          ? (f as fs.Dirent & { parentPath: string }).parentPath
          : routesDir;
      return path.relative(SRC_DIR, path.join(dir, f.name));
    });

  for (const relPath of routeFiles) {
    it(`${relPath} — all detected paths registered; handler contexts contain verification`, () => {
      const fullPath = path.join(SRC_DIR, relPath);
      let content: string;
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch {
        return;
      }

      const detected = extractWebhookPaths(content);
      if (detected.length === 0) return;

      for (const detectedPath of detected) {
        // ── (a) Path must be in the registry ──
        expect(
          pathMatchesRegistry(detectedPath),
          `Detected inbound webhook POST route "${detectedPath}" in ${relPath} ` +
          `is NOT in INBOUND_WEBHOOK_REGISTRY.\n` +
          `Add an entry for this route and implement signature verification before shipping.`,
        ).toBe(true);

        // ── (b) Handler context must contain verification evidence ──
        //        Skipped for routes registered as intentionally-public.
        const registryEntry = INBOUND_WEBHOOK_REGISTRY.find((e) =>
          e.routePath === detectedPath ||
          (() => {
            const regParts = e.routePath.split('/');
            const detParts = detectedPath.split('/');
            return regParts.length === detParts.length &&
              regParts.every((seg, i) => seg.startsWith(':') || seg === detParts[i]);
          })(),
        );

        if (registryEntry?.verifierKind !== 'intentionally-public') {
          const context = extractHandlerContext(content, detectedPath);
          expect(
            ANY_VERIFICATION_PATTERN.test(context),
            `Detected webhook path "${detectedPath}" in ${relPath} but the surrounding ` +
            `handler code does not contain recognizable verification evidence.\n` +
            `The handler must call webhookSignatureMiddleware, verifyHmacSha256, constructEvent, ` +
            `verifySiemToken, verifyWebhookSignature, or an equivalent approved verifier.\n` +
            `Context inspected:\n${context}`,
          ).toBe(true);
        }
      }
    });
  }
});
