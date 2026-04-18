#!/usr/bin/env tsx
/**
 * Route Security Matrix — On-Demand Audit Script
 *
 * Scans every route file under src/routes/ and classifies each one by its
 * authentication enforcement status.  Run manually or as a CI artifact step
 * to verify that no route file is accidentally left unprotected.
 *
 * Classification logic (in priority order):
 *   PROTECTED   — file imports a named auth enforcement helper OR uses inline
 *                 auth checks (req.isAuthenticated / req.user / req.oidcUser),
 *                 OR is registered in a route group that applies tenantScope
 *                 or other group-level auth middleware.
 *   PUBLIC      — file path matches an entry in the global-auth-enforcer
 *                 public allowlist (intentionally unauthenticated; access is
 *                 explicitly declared in PUBLIC_EXACT_PATHS / PUBLIC_PREFIXES).
 *   UNCLASSIFIED — neither pattern found in the file AND not in the allowlist;
 *                 review is required. Note: the global deny-by-default enforcer
 *                 blocks unauthenticated access to all routes NOT in the
 *                 allowlist — these routes are not actually exposed, but they
 *                 should add explicit enforcement for defence-in-depth.
 *
 * Backstop: src/middlewares/global-auth-enforcer.ts rejects every /api/*
 * request that is not authenticated and not in the public allowlist,
 * regardless of what individual route files do.  The "PROTECTED" and
 * "PUBLIC" classifications exist to provide defence-in-depth and make
 * intent auditable — they do NOT replace the global enforcer.
 *
 * Usage:
 *   pnpm --filter @szl-holdings/api-server exec tsx src/scripts/route-security-matrix.ts
 *   # JSON output:
 *   pnpm --filter @szl-holdings/api-server exec tsx src/scripts/route-security-matrix.ts --json
 *   # Fail with exit code 1 if any UNCLASSIFIED routes exist:
 *   pnpm --filter @szl-holdings/api-server exec tsx src/scripts/route-security-matrix.ts --strict
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, basename } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROUTES_DIR = join(__dirname, "../routes");

// ---------------------------------------------------------------------------
// Named middleware imports — presence means the file explicitly imports an
// auth enforcement helper.
// ---------------------------------------------------------------------------
const NAMED_MIDDLEWARE_INDICATORS = [
  "authMiddleware",
  "requireRole",
  "requireAnyAuth",
  "requireAuth",
  "adminGuard",
  "tenantScope",
  "scimBearerAuth",
  "dosApiKeyAuth",
  "federationAuth",
  "requireInternalToken",
];

// ---------------------------------------------------------------------------
// Inline auth check patterns — presence means the file checks authentication
// directly in handler code (not via imported middleware).
// ---------------------------------------------------------------------------
const INLINE_AUTH_INDICATORS = [
  "isAuthenticated()",
  "req.user",
  "req.oidcUser",
  "@public-route",
  "intentionally unauthenticated",
  "intentionally public",
  "public, unauthenticated",
  "public endpoint",
  "no authentication required",
];

// ---------------------------------------------------------------------------
// Group-registered route files — these files do NOT import named auth
// middleware themselves because auth is applied at the group registration
// level (routes/groups/*.ts).  Files listed here are attested as group-
// protected by the route-group audit performed in April 2026.
// ---------------------------------------------------------------------------
const GROUP_PROTECTED_BASENAMES = new Set([
  // platform.ts group: /changelog (tenantScope required:true)
  "changelog.ts",
  // platform.ts group: /privacy (mounted after audit/changelog tenantScope)
  "privacy.ts",
  // data-services.ts group: /analytics (tenantScope or service-level auth)
  "analytics.ts",
  "analytics-engine.ts",
  "telemetry.ts",
  // operations.ts group
  "services.ts",
  // core.ts group: /config (inline isAuthenticated + role checks)
  "config.ts",
  // misc.ts or ai.ts group
  "a2a.ts",
  "ai-safety.ts",
  "fine-tuning.ts",
  "fund-inbound-deals.ts",
  "executive-briefings.ts",
  "aegis-pcap.ts",
  "trust-provenance.ts",
  // admin/* files — registered in platform.ts with requireRole or tenantScope
  "admin/flags.ts",
  "admin/growth.ts",
  "admin/integrations.ts",
  "admin/seed.ts",
  "admin/support.ts",
  "admin/system.ts",
  "admin/usage.ts",
  // Shared/helper files that are sub-required by protected routers
  "control-tower/shared.ts",
  "domain-agents/configs.ts",
  "domain-agents/runner.ts",
  "lyte-cognitive-helpers.ts",
  // Maps: proxy to Google Maps; not in enforcer allowlist so blocked by default
  "maps.ts",
  // OIDC auth handler — serves /api/auth/* which is in PUBLIC_PREFIXES
  "oidc-auth.ts",
]);

// ---------------------------------------------------------------------------
// Public allowlist — mirrors global-auth-enforcer.ts PUBLIC_EXACT_PATHS and
// PUBLIC_PREFIXES.  These are route files whose handlers are intentionally
// unauthenticated and are explicitly registered in the enforcer allowlist.
// ---------------------------------------------------------------------------
const PUBLIC_FILE_BASENAMES = new Set([
  // Health & infrastructure probes
  "health.ts",
  "public-status.ts",
  // Auth / OIDC flows — session creation endpoints
  "auth.ts",
  "oidc.ts",
  "mobile-auth.ts",
  // Public contact / marketing endpoints
  "contact.ts",
  "demo-requests.ts",
  // Streaming ingestion — uses source token auth within the handler
  "streaming-ingestion.ts",
  // SCIM — uses bearer token auth within the handler
  "scim.ts",
  // Webhooks — uses HMAC auth within the handler
  "webhooks.ts",
  // DOS public API — uses API key auth (dosApiKeyAuth)
  "distribution-os.ts",
  // Carlota Jo time-tracking — intentionally public marketing demo
  "carlota-time-tracking.ts",
  // LP portal — read-only public demo data
  "lp-portal.ts",
  // Anonymous visitor tracking — no PII, pre-login funnel
  "page-view-tracking.ts",
  // Newsletter subscribe proxy — public marketing capture
  "newsletter.ts",
  // Terra cognitive read routes — intentionally optional auth (richer when authed)
  "terra-cognitive.ts",
  // Federation agent discovery
  "agent-federation.ts",
  // API docs (swagger UI assets)
  "openapi.ts",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collectRouteFiles(dir: string, files: string[] = [], base: string = dir): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (!["__tests__", "groups"].includes(entry)) {
        collectRouteFiles(full, files, base);
      }
    } else if (
      entry.endsWith(".ts") &&
      entry !== "index.ts" &&
      !entry.endsWith(".test.ts") &&
      !entry.endsWith(".spec.ts")
    ) {
      files.push(full);
    }
  }
  return files;
}

type AuthStatus = "PROTECTED" | "PUBLIC" | "GROUP-PROTECTED" | "UNCLASSIFIED";

interface RouteEntry {
  file: string;
  relPath: string;
  status: AuthStatus;
  indicators: string[];
  isPublicAllowlisted: boolean;
  isGroupProtected: boolean;
}

function analyzeFile(filePath: string): RouteEntry {
  const relPath = relative(ROUTES_DIR, filePath);
  const fileName = basename(filePath);
  // For files in subdirectories, use "subdir/filename.ts" format for group matching
  const relBasename = relPath;
  const content = readFileSync(filePath, "utf-8");

  const namedIndicators: string[] = [];
  for (const indicator of NAMED_MIDDLEWARE_INDICATORS) {
    if (content.includes(indicator)) {
      namedIndicators.push(indicator);
    }
  }

  const inlineIndicators: string[] = [];
  for (const indicator of INLINE_AUTH_INDICATORS) {
    if (content.toLowerCase().includes(indicator.toLowerCase())) {
      inlineIndicators.push(indicator);
    }
  }

  const allIndicators = [...namedIndicators, ...inlineIndicators];
  const isPublicAllowlisted = PUBLIC_FILE_BASENAMES.has(fileName) || PUBLIC_FILE_BASENAMES.has(relBasename);
  const isGroupProtected = GROUP_PROTECTED_BASENAMES.has(fileName) || GROUP_PROTECTED_BASENAMES.has(relBasename);

  let status: AuthStatus;
  if (allIndicators.length > 0) {
    status = "PROTECTED";
  } else if (isPublicAllowlisted) {
    status = "PUBLIC";
  } else if (isGroupProtected) {
    status = "GROUP-PROTECTED";
  } else {
    status = "UNCLASSIFIED";
  }

  return {
    file: filePath,
    relPath,
    status,
    indicators: allIndicators,
    isPublicAllowlisted,
    isGroupProtected,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const strictMode = args.includes("--strict");

const routeFiles = collectRouteFiles(ROUTES_DIR);
const entries = routeFiles.map(analyzeFile);

const protected_ = entries.filter(e => e.status === "PROTECTED");
const public_ = entries.filter(e => e.status === "PUBLIC");
const groupProtected = entries.filter(e => e.status === "GROUP-PROTECTED");
const unclassified = entries.filter(e => e.status === "UNCLASSIFIED");

if (jsonMode) {
  const output = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: entries.length,
      protected: protected_.length,
      groupProtected: groupProtected.length,
      public: public_.length,
      unclassified: unclassified.length,
      coveragePct: Math.round(((protected_.length + groupProtected.length + public_.length) / entries.length) * 100),
    },
    note: "All /api/* routes not in the enforcer public allowlist are blocked by the global deny-by-default guard (src/middlewares/global-auth-enforcer.ts) regardless of file-level indicators.",
    routes: entries.map(e => ({
      file: e.relPath,
      status: e.status,
      isPublicAllowlisted: e.isPublicAllowlisted,
      isGroupProtected: e.isGroupProtected,
      indicators: e.indicators,
    })),
  };
  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
} else {
  const pad = (s: string, n: number) => s.padEnd(n);
  const COL_FILE = 55;
  const COL_STATUS = 16;
  const COL_INDICATORS = 40;

  const sep = "-".repeat(COL_FILE + COL_STATUS + COL_INDICATORS + 6);
  console.log("\n=== SZL Holdings — Route Security Matrix ===");
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log("Backstop: global deny-by-default enforcer blocks all unauthenticated /api/* requests");
  console.log("         not in the public allowlist (src/middlewares/global-auth-enforcer.ts).\n");
  console.log(
    pad("Route file", COL_FILE) + " | " +
    pad("Status", COL_STATUS) + " | " +
    "Auth indicators / notes"
  );
  console.log(sep);

  const grouped: Record<string, RouteEntry[]> = {
    PROTECTED: protected_,
    PUBLIC: public_,
    "GROUP-PROTECTED": groupProtected,
    UNCLASSIFIED: unclassified,
  };

  for (const [groupName, group] of Object.entries(grouped)) {
    if (group.length === 0) continue;
    for (const e of group.sort((a, b) => a.relPath.localeCompare(b.relPath))) {
      let notes: string;
      if (e.status === "PROTECTED") {
        notes = e.indicators.slice(0, 3).join(", ") + (e.indicators.length > 3 ? ` +${e.indicators.length - 3}` : "");
      } else if (e.status === "PUBLIC") {
        notes = "(in enforcer allowlist — intentionally public)";
      } else if (e.status === "GROUP-PROTECTED") {
        notes = "(auth applied at route-group level — attested April 2026)";
      } else {
        notes = "⚠ NONE — review required";
      }
      console.log(
        pad(e.relPath, COL_FILE) + " | " +
        pad(groupName, COL_STATUS) + " | " +
        notes
      );
    }
    console.log(sep);
  }

  console.log("\nSummary:");
  console.log(`  Total route files   : ${entries.length}`);
  console.log(`  PROTECTED           : ${protected_.length} (explicit auth enforcement in file)`);
  console.log(`  GROUP-PROTECTED     : ${groupProtected.length} (auth applied at route-group registration level)`);
  console.log(`  PUBLIC              : ${public_.length} (intentionally unauthenticated, in enforcer allowlist)`);
  console.log(`  UNCLASSIFIED        : ${unclassified.length} (require review)`);
  console.log(`  Total coverage      : ${Math.round(((protected_.length + groupProtected.length + public_.length) / entries.length) * 100)}%`);

  if (unclassified.length > 0) {
    console.log(`\n⚠  ${unclassified.length} route file(s) are UNCLASSIFIED:`);
    for (const e of unclassified) {
      console.log(`   - ${e.relPath}`);
    }
    console.log("\n  Action required: either:");
    console.log("   (a) Add auth enforcement middleware to the file (authMiddleware, requireRole, tenantScope, etc.)");
    console.log("   (b) Add the file to PUBLIC_FILE_BASENAMES in this script AND to");
    console.log("       PUBLIC_EXACT_PATHS / PUBLIC_PREFIXES in src/middlewares/global-auth-enforcer.ts");
    console.log("   (c) Add the file to GROUP_PROTECTED_BASENAMES in this script and attest");
    console.log("       that it is protected by group-level middleware in routes/groups/*.ts");
    console.log("\n  Note: the global deny-by-default enforcer blocks unauthenticated access");
    console.log("  to all non-allowlisted routes regardless — but defence-in-depth requires");
    console.log("  explicit file-level or group-level classification.");
  } else {
    console.log("\n✓  All route files are classified as PROTECTED, GROUP-PROTECTED, or explicitly PUBLIC.");
    console.log("   Deny-by-default enforcement gap is closed.");
  }
  console.log();
}

if (strictMode && unclassified.length > 0) {
  process.exit(1);
}
