import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const GROUPS_DIR = path.join(__dirname, "../groups");

/**
 * Group files that are excluded from this guardrail entirely.
 * core.ts mounts only public infrastructure routes (auth, webhooks, contact,
 * storage, admin status, backup) — none of which carry per-tenant data.
 */
const SKIP_FILES = new Set(["core.ts"]);

/**
 * Route prefixes that are intentionally exempt from tenantScope.
 * Key: "groupFileName::routePrefix"
 * Each entry MUST have a documented reason.
 */
const EXEMPTIONS = new Set([
  // platform.ts — pre-membership bootstrap flows (required:false or adminGuard)
  "platform.ts::/orgs",         // org lookup for invitation acceptance / discovery
  "platform.ts::/user",         // password-reset is a public/pre-auth flow
  "platform.ts::/onboarding",   // pre-membership onboarding flow
  "platform.ts::/admin/tenants", // gated by adminGuard (super_admin only), not tenantScope

  // misc.ts — external public API gated by API key, not user session
  "misc.ts::/v1",               // dosPublicApiRouter: gated by dosApiKeyAuth

  // operations.ts — admin-only routes gated by adminGuard, not tenantScope
  "operations.ts::/admin",      // admin dashboard routes (requireRole / adminGuard)
  "operations.ts::/command",    // command center (adminGuard transitively)

  // billing.ts — partner-portal cross-org routes with handler-level membership checks
  "billing.ts::/org-branding",              // PUBLIC: white-label login page asset (no auth)
  "billing.ts::/resolve-domain",            // PUBLIC: custom domain → org resolution (no auth)
  "billing.ts::/orgs/:orgId/branding",      // handler-level: authMiddleware + org membership check
  "billing.ts::/orgs/:orgId/custom-domains", // handler-level: authMiddleware + org membership check
]);

function isExempt(file: string, prefix: string): boolean {
  return EXEMPTIONS.has(`${file}::${prefix}`);
}

/** Returns true if prefix is covered by a gated ancestor (e.g. /vessels/platform under /vessels). */
function isCoveredByParentGate(prefix: string, gated: Set<string>): boolean {
  for (const gate of gated) {
    if (prefix !== gate && prefix.startsWith(gate + "/")) {
      return true;
    }
  }
  return false;
}

function parseGroupFile(content: string): { gated: Set<string>; hasTenantScope: boolean; all: Set<string> } {
  const gated = new Set<string>();
  const all = new Set<string>();
  let hasTenantScope = false;

  // Only count required:true as a proper gate (not required:false bootstrap exemptions)
  for (const m of content.matchAll(/router\.use\(\s*["']([^"']+)["']\s*,\s*tenantScope\(\s*\{\s*required\s*:\s*true/g)) {
    gated.add(m[1]);
    hasTenantScope = true;
  }

  for (const m of content.matchAll(/router\.use\(\s*["']([^"']+)["']\s*,/g)) {
    all.add(m[1]);
  }

  return { gated, hasTenantScope, all };
}

describe("Group file tenant-scope coverage guardrail", () => {
  const files = fs.readdirSync(GROUPS_DIR)
    .filter((f) => f.endsWith(".ts") && !SKIP_FILES.has(f));

  for (const file of files) {
    it(`${file} — every non-exempt route prefix is covered by a tenantScope gate`, () => {
      const content = fs.readFileSync(path.join(GROUPS_DIR, file), "utf-8");
      const { gated, hasTenantScope, all } = parseGroupFile(content);

      // Files that have no tenantScope at all are skipped (they may be all-admin or all-public).
      if (!hasTenantScope) return;

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
        `${file} has route prefixes not covered by any tenantScope gate: ${ungated.join(", ")}. ` +
        `Add tenantScope({ required: true }), or add an entry to EXEMPTIONS with a documented reason.`,
      ).toEqual([]);
    });
  }
});
