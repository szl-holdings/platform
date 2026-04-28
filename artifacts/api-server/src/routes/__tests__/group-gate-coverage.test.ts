import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const GROUPS_DIR = path.join(__dirname, '../groups');

/**
 * Group files that are excluded from this guardrail entirely.
 * core.ts mounts only public infrastructure routes (auth, webhooks, contact,
 * storage, admin status, backup) — none of which carry per-tenant data.
 */
const SKIP_FILES = new Set(['core.ts']);

/**
 * Group files that intentionally have NO `tenantScope({ required: true })` gates.
 * Each entry must document why it is exempt from the hard tenantScope requirement.
 *
 * Adding a new group file without tenantScope? You MUST add it here with a reason,
 * or the CI guardrail below will fail.
 */
const UNSCOPED_GROUPS: Record<string, string> = {
  // cross-platform.ts serves auth-optional cross-product APIs (e.g. approval
  // status widgets embeddable on third-party domains). All four route handlers
  // use authMiddleware({ required: false }) and extract orgId from the session
  // when present; anonymous access is intentional for embeddable use-cases.
  'cross-platform.ts': 'auth-optional embeddable cross-product APIs; handler-level orgId extraction',
};

/**
 * Route prefixes that are intentionally exempt from tenantScope.
 * Key: "groupFileName::routePrefix"
 * Each entry MUST have a documented reason.
 */
const EXEMPTIONS = new Set([
  // platform.ts — pre-membership bootstrap flows (required:false or adminGuard)
  'platform.ts::/orgs', // org lookup for invitation acceptance / discovery
  'platform.ts::/user', // password-reset is a public/pre-auth flow
  'platform.ts::/onboarding', // pre-membership onboarding flow
  'platform.ts::/admin/tenants', // gated by adminGuard (super_admin only), not tenantScope

  // misc.ts — external public API gated by API key, not user session
  'misc.ts::/v1', // dosPublicApiRouter: gated by dosApiKeyAuth

  // operations.ts — admin-only routes gated by adminGuard, not tenantScope
  'operations.ts::/admin', // admin dashboard routes (requireRole / adminGuard)
  'operations.ts::/command', // command center (adminGuard transitively)
  'operations.ts::/linear', // Linear integration: gated by handler-level Replit connector auth, not tenantScope

  // billing.ts — partner-portal cross-org routes with handler-level membership checks
  'billing.ts::/org-branding', // PUBLIC: white-label login page asset (no auth)
  'billing.ts::/resolve-domain', // PUBLIC: custom domain → org resolution (no auth)
  'billing.ts::/orgs/:orgId/branding', // handler-level: authMiddleware + org membership check
  'billing.ts::/orgs/:orgId/custom-domains', // handler-level: authMiddleware + org membership check

  // data-services.ts — data fabric connectors use required:false (soft gate)
  // tenantScope({ required: false }) is registered so tenant context IS hydrated when
  // available, but the route is not hard-blocked for users without an active org.
  // The /connectors handlers themselves enforce ownership checks at the record level.
  'data-services.ts::/connectors',

  // billing.ts — payment-rail webhook receivers (Plaid, Coinbase Commerce)
  // These routes MUST be exempt from tenantScope: payment processors deliver
  // events server-to-server without any user session. Auth is enforced instead
  // by cryptographic webhook signature verification (HMAC/JWS) in each handler.
  // Unauthenticated payloads with invalid or missing signatures are rejected 400.
  // In demo mode (no API keys configured) signature checks are skipped to allow
  // local development without live credentials.
  'billing.ts::/webhooks/plaid',
  'billing.ts::/webhooks/coinbase',
]);

function isExempt(file: string, prefix: string): boolean {
  return EXEMPTIONS.has(`${file}::${prefix}`);
}

/** Returns true if prefix is covered by a gated ancestor (e.g. /vessels/platform under /vessels). */
function isCoveredByParentGate(prefix: string, gated: Set<string>): boolean {
  for (const gate of gated) {
    if (prefix !== gate && prefix.startsWith(`${gate}/`)) {
      return true;
    }
  }
  return false;
}

function parseGroupFile(content: string): {
  gated: Set<string>;
  hasTenantScope: boolean;
  all: Set<string>;
} {
  const gated = new Set<string>();
  const all = new Set<string>();
  let hasTenantScope = false;

  // Only count required:true as a proper gate (not required:false bootstrap exemptions)
  for (const m of content.matchAll(
    /router\.use\(\s*["']([^"']+)["']\s*,\s*tenantScope\(\s*\{\s*required\s*:\s*true/g,
  )) {
    gated.add(m[1]);
    hasTenantScope = true;
  }

  for (const m of content.matchAll(/router\.use\(\s*["']([^"']+)["']\s*,/g)) {
    all.add(m[1]);
  }

  return { gated, hasTenantScope, all };
}

/**
 * Task-3145 hardening spot-checks.
 *
 * These named assertions pin the specific routes and controls that were
 * audited as part of the multi-tenant security hardening sprint so that a
 * future refactor cannot silently drop coverage without a test failure.
 */
describe('Task-3145 hardening — named route spot-checks', () => {
  const aiContent = fs.readFileSync(path.join(GROUPS_DIR, 'ai.ts'), 'utf-8');
  const { gated: aiGated } = parseGroupFile(aiContent);

  it('ai.ts: /stream is gated by tenantScope({ required: true })', () => {
    expect(aiGated.has('/stream')).toBe(true);
  });

  it('ai.ts: /jobs is gated by tenantScope({ required: true })', () => {
    expect(aiGated.has('/jobs')).toBe(true);
  });

  const HARDENED_GROUPS = ['ai.ts', 'vessels.ts', 'terra.ts', 'alloy.ts', 'platform.ts', 'security.ts', 'prism-counsel.ts'];

  for (const groupFile of HARDENED_GROUPS) {
    it(`${groupFile} has at least one tenantScope({ required: true }) gate`, () => {
      const content = fs.readFileSync(path.join(GROUPS_DIR, groupFile), 'utf-8');
      const { hasTenantScope } = parseGroupFile(content);
      expect(hasTenantScope).toBe(true);
    });
  }
});

describe('Group file tenant-scope coverage guardrail', () => {
  const files = fs.readdirSync(GROUPS_DIR).filter((f) => f.endsWith('.ts') && !SKIP_FILES.has(f));

  for (const file of files) {
    it(`${file} — every non-exempt route prefix is covered by a tenantScope gate`, () => {
      const content = fs.readFileSync(path.join(GROUPS_DIR, file), 'utf-8');
      const { gated, hasTenantScope, all } = parseGroupFile(content);

      // Files in the explicit UNSCOPED_GROUPS allowlist are intentionally exempt.
      // All other files MUST have at least one tenantScope({ required: true }) gate.
      // If you're adding a new group file without tenantScope, add it to UNSCOPED_GROUPS
      // above with a documented justification — do not remove this check.
      if (!hasTenantScope) {
        expect(
          Object.prototype.hasOwnProperty.call(UNSCOPED_GROUPS, file),
          `${file} has no tenantScope({ required: true }) gates and is not in the UNSCOPED_GROUPS allowlist. ` +
            `Add tenantScope({ required: true }) to the file, or add it to UNSCOPED_GROUPS with a documented reason.`,
        ).toBe(true);
        return;
      }

      const ungated: string[] = [];
      for (const prefix of all) {
        if (
          !gated.has(prefix) &&
          !isExempt(file, prefix) &&
          !isCoveredByParentGate(prefix, gated)
        ) {
          ungated.push(prefix);
        }
      }

      expect(
        ungated,
        `${file} has route prefixes not covered by any tenantScope gate: ${ungated.join(', ')}. ` +
          `Add tenantScope({ required: true }), or add an entry to EXEMPTIONS with a documented reason.`,
      ).toEqual([]);
    });
  }
});
