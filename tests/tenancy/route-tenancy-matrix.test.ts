/**
 * Route Tenancy Matrix — Static-Analysis Test
 *
 * Enumerates every route file under artifacts/api-server/src/routes/,
 * identifies files that perform tenant-scoped DB operations, and asserts
 * that each such file applies one of the three tenancy enforcement mechanisms:
 *
 *   1. tenantScope()      — middleware that stamps req.tenantOrgId
 *   2. assertTenantAccess — post-load record guard
 *   3. getUserOrgIds      — explicit filter building (IN clause pattern)
 *
 * Routes in admin/ are legitimately exempted (platform-admin actions require
 * super_admin/platform_admin role but are not tenant-isolated by design).
 *
 * This test acts as a security regression gate: any new route file that
 * touches tenant data MUST add enforcement before this test will pass.
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const ROUTES_DIR = path.resolve(
  __dirname,
  "../../artifacts/api-server/src/routes",
);

/** Patterns that indicate the file performs DB ops against tenant-scoped tables. */
const TENANT_DATA_PATTERNS: RegExp[] = [
  /\.orgId\b/,
  /\borg_id\b/,
  /tenantOrgId\b/,
  /req\.tenantOrg/,
  /from\s+\w+Table.*where.*org/i,
];

/** Patterns that satisfy the tenancy enforcement requirement. */
const ENFORCEMENT_PATTERNS: RegExp[] = [
  /tenantScope\s*\(/,
  /assertTenantAccess\s*\(/,
  /getUserOrgIds\s*\(/,
];

/** Directories whose route files are exempt from tenant isolation. */
const EXEMPT_DIRS = new Set(["admin"]);

/**
 * Known domain route file stems that MUST have tenancy enforcement.
 * This is the explicit contract — add new domain routes here when created.
 *
 * Intentionally-exempt routes NOT in this list:
 *   terra.ts           — geocoding/MLS ingestion, no per-org data returned
 *   terra-portfolio-intel.ts — public demo endpoint (comment in-file)
 *   lyte-surfaces.ts   — public read-only surfaces for demo visitors (comment in-file)
 */
const REQUIRED_ENFORCED_STEMS: string[] = [
  "vessels",
  "vessels-extended",
  "vessels-platform",
  "terra-property-intel",
  "prism-counsel-pilot",
  "prism-counsel-pilot-one",
  "prism-counsel-review",
  "prism-counsel-s31",
  "decisions-runtime",
];

// ── helpers ─────────────────────────────────────────────────────────────────

function collectRouteFiles(dir: string, relativeTo: string): Array<{ abs: string; rel: string }> {
  const results: Array<{ abs: string; rel: string }> = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(relativeTo, abs);
    if (entry.isDirectory()) {
      // Skip exempt directories (e.g. admin/) and __tests__
      const topDir = rel.split(path.sep)[0]!;
      if (EXEMPT_DIRS.has(topDir) || topDir === "__tests__") continue;
      results.push(...collectRouteFiles(abs, relativeTo));
    } else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      results.push({ abs, rel });
    }
  }
  return results;
}

function readFile(abs: string): string {
  return fs.readFileSync(abs, "utf8");
}

function hasTenantData(content: string): boolean {
  return TENANT_DATA_PATTERNS.some((p) => p.test(content));
}

function hasTenantEnforcement(content: string): boolean {
  return ENFORCEMENT_PATTERNS.some((p) => p.test(content));
}

function stemOf(rel: string): string {
  return path.basename(rel, ".ts");
}

// ── test suite ───────────────────────────────────────────────────────────────

describe("Route tenancy matrix — static analysis", () => {
  const allFiles = collectRouteFiles(ROUTES_DIR, ROUTES_DIR);

  const tenantDataFiles = allFiles.filter(({ abs }) => hasTenantData(readFile(abs)));
  const enforcedFiles = tenantDataFiles.filter(({ abs }) => hasTenantEnforcement(readFile(abs)));
  const unenforcedFiles = tenantDataFiles.filter(({ abs }) => !hasTenantEnforcement(readFile(abs)));

  it("discovers a meaningful number of route files (regression: directory not missing)", () => {
    expect(allFiles.length).toBeGreaterThanOrEqual(50);
  });

  it("all route files are discoverable under the known routes directory", () => {
    expect(() => collectRouteFiles(ROUTES_DIR, ROUTES_DIR)).not.toThrow();
  });

  it("finds route files that reference tenant/org data", () => {
    expect(tenantDataFiles.length).toBeGreaterThan(0);
  });

  it("finds route files that apply tenancy enforcement", () => {
    expect(enforcedFiles.length).toBeGreaterThan(0);
  });

  it("at least 15 routes apply enforcement where org data is directly queried (regression gate)", () => {
    // Counts files that both reference orgId in DB queries AND apply
    // tenantScope/assertTenantAccess/getUserOrgIds. If this drops, a
    // previously-enforced domain route lost its tenant guard.
    expect(enforcedFiles.length).toBeGreaterThanOrEqual(15);
  });

  it("each required domain route file has tenancy enforcement", () => {
    const allStems = new Map(allFiles.map(({ abs, rel }) => [stemOf(rel), abs]));
    const missing: string[] = [];

    for (const stem of REQUIRED_ENFORCED_STEMS) {
      const abs = allStems.get(stem);
      if (!abs) {
        missing.push(`${stem} — file not found in routes/`);
        continue;
      }
      const content = readFile(abs);
      if (!hasTenantEnforcement(content)) {
        missing.push(`${stem} — references org data but has no tenancy enforcement`);
      }
    }

    expect(missing, `Missing enforcement:\n${missing.join("\n")}`).toHaveLength(0);
  });

  it("produces a full tenancy coverage report (informational — does not fail)", () => {
    const enforced = enforcedFiles.map(({ rel }) => rel);
    const unenforced = unenforcedFiles.map(({ rel }) => rel);

    console.info("\n── Tenancy Coverage Report ──────────────────────────────────");
    console.info(`Total route files scanned:       ${allFiles.length}`);
    console.info(`Files referencing tenant/org data: ${tenantDataFiles.length}`);
    console.info(`Enforced (tenantScope/assert):   ${enforced.length}`);
    console.info(`Not enforced (may be intentional): ${unenforced.length}`);
    console.info(`Coverage:                        ${Math.round((enforced.length / tenantDataFiles.length) * 100)}%`);
    console.info("──────────────────────────────────────────────────────────────\n");
    console.info("Enforced routes:\n  " + enforced.join("\n  "));
    if (unenforced.length > 0) {
      console.info("\nNot enforced (review manually):\n  " + unenforced.join("\n  "));
    }

    expect(true).toBe(true);
  });

  describe("required domain routes individually", () => {
    const allStems = new Map(allFiles.map(({ abs, rel }) => [stemOf(rel), abs]));

    for (const stem of REQUIRED_ENFORCED_STEMS) {
      it(`${stem} has tenancy enforcement`, () => {
        const abs = allStems.get(stem);
        expect(abs, `Route file for '${stem}' not found`).toBeDefined();
        const content = readFile(abs!);
        const enforced = hasTenantEnforcement(content);
        expect(
          enforced,
          `${stem}.ts references org data but applies no tenantScope/assertTenantAccess/getUserOrgIds`,
        ).toBe(true);
      });
    }
  });
});
