/**
 * Architecture test: tenant-scope group registration guardrail
 *
 * Ensures that every route group file inside routes/groups/ either:
 *   (a) contains at least one `tenantScope({ required: true })` guard, OR
 *   (b) is listed in UNGATED_GROUPS with a documented reason.
 *
 * The complementary test in group-gate-coverage.test.ts verifies that
 * *within* a group file every route prefix is covered by a gate. This test
 * catches the earlier failure mode: a brand-new group file that has *no*
 * tenantScope call at all — which group-gate-coverage silently skips.
 *
 * Additionally this test verifies that every group whose register() function
 * is called in routes/index.ts is either gated or explicitly exempt, so that
 * a new `foo.register(router)` line cannot quietly bypass the gate.
 *
 * ADDING A NEW UNGATED GROUP:
 *   If you intentionally add a group that should not use tenantScope (e.g.
 *   it only serves public or admin-only routes gated by a different mechanism)
 *   add it to UNGATED_GROUPS below with a comment explaining the alternative
 *   protection. Do NOT add groups here just to silence the test.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const GROUPS_DIR = path.join(__dirname, '../groups');
const INDEX_FILE = path.join(__dirname, '../index.ts');

// ---------------------------------------------------------------------------
// Intentionally ungated group files.
// Each entry MUST have a documented reason explaining the alternative gate.
// ---------------------------------------------------------------------------
const UNGATED_GROUPS: Record<string, string> = {
  'core.ts':
    'Mounts only public infrastructure routes: health, auth/OIDC, webhooks, ' +
    'contact, demo-requests, feedback, config, APM, storage, admin backup. ' +
    'None of these paths carry per-tenant data. Auth routes are protected by ' +
    'the authMiddleware in app.ts; admin routes require the adminGuard role check.',

  'cross-platform.ts':
    'Read-only cross-domain intelligence feed. The /cross-platform prefix is ' +
    'gated by perUserApiSlidingLimiter and per-handler auth checks. It exposes ' +
    'aggregated read-only snapshots, not per-org mutable data, so tenantScope ' +
    'is intentionally omitted in favour of handler-level access control.',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasTenantScopeRequired(content: string): boolean {
  return /tenantScope\s*\(\s*\{\s*required\s*:\s*true/.test(content);
}

/**
 * Extract every `*.register(router)` call from index.ts and return the
 * basename of the group file it refers to (e.g. "vessels.ts").
 *
 * We look for the import alias → filename mapping that index.ts uses:
 *   import * as vessels from "./groups/vessels";
 *   vessels.register(router);
 */
function extractRegisteredGroupFiles(indexContent: string): string[] {
  // Build a map of alias → filename: e.g. { vessels: 'vessels.ts', ... }
  const aliasToFile = new Map<string, string>();
  for (const m of indexContent.matchAll(
    /import\s+\*\s+as\s+(\w+)\s+from\s+["']\.\/groups\/([^"']+)["']/g,
  )) {
    const alias = m[1];
    const file = m[2].endsWith('.ts') ? m[2] : `${m[2]}.ts`;
    aliasToFile.set(alias, file);
  }

  // Find all `alias.register(router)` calls.
  const registered: string[] = [];
  for (const m of indexContent.matchAll(/\b(\w+)\.register\s*\(\s*router\s*\)/g)) {
    const alias = m[1];
    const file = aliasToFile.get(alias);
    if (file) {
      registered.push(file);
    }
  }

  return registered;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Tenant-scope group registration architecture guardrail', () => {
  const allGroupFiles = fs
    .readdirSync(GROUPS_DIR)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));

  const indexContent = fs.readFileSync(INDEX_FILE, 'utf-8');
  const registeredFiles = extractRegisteredGroupFiles(indexContent);

  /**
   * T1: Every group file on disk must either be gated or in UNGATED_GROUPS.
   *
   * This prevents a developer from creating a new group file without thinking
   * about tenant isolation — even if they haven't registered it in index.ts yet.
   */
  describe('All group files are gated or explicitly exempted', () => {
    for (const file of allGroupFiles) {
      it(`${file} has tenantScope({ required: true }) or is listed in UNGATED_GROUPS`, () => {
        const content = fs.readFileSync(path.join(GROUPS_DIR, file), 'utf-8');
        const isGated = hasTenantScopeRequired(content);
        const isExempt = Object.prototype.hasOwnProperty.call(UNGATED_GROUPS, file);

        expect(
          isGated || isExempt,
          `${file} has no tenantScope({ required: true }) guard and is not listed in ` +
            `UNGATED_GROUPS. Either:\n` +
            `  • Add router.use('<prefix>', tenantScope({ required: true })) for each ` +
            `data-returning prefix in the file, or\n` +
            `  • Add an entry to UNGATED_GROUPS in this test file with a documented ` +
            `reason describing the alternative gate protecting those routes.\n` +
            `Do NOT add entries to UNGATED_GROUPS without a genuine justification.`,
        ).toBe(true);
      });
    }
  });

  /**
   * T2: Every group registered via .register(router) in index.ts must be
   * gated or explicitly exempted.
   *
   * A developer could add `newGroup.register(router)` in index.ts referencing a
   * group file that has no tenantScope. This assertion catches that at PR time.
   */
  describe('All groups registered in index.ts are gated or exempted', () => {
    for (const file of registeredFiles) {
      it(`${file} (registered in index.ts) has tenantScope({ required: true }) or is in UNGATED_GROUPS`, () => {
        const filePath = path.join(GROUPS_DIR, file);

        expect(
          fs.existsSync(filePath),
          `${file} is referenced via .register(router) in index.ts but the file ` +
            `does not exist in routes/groups/. Check the import statement.`,
        ).toBe(true);

        const content = fs.readFileSync(filePath, 'utf-8');
        const isGated = hasTenantScopeRequired(content);
        const isExempt = Object.prototype.hasOwnProperty.call(UNGATED_GROUPS, file);

        expect(
          isGated || isExempt,
          `${file} is registered in index.ts via .register(router) but has no ` +
            `tenantScope({ required: true }) guard and is not listed in UNGATED_GROUPS.\n` +
            `All groups mounted through .register(router) must protect their data-returning ` +
            `routes with tenantScope or be explicitly documented as intentionally public/admin-only ` +
            `in the UNGATED_GROUPS map in this test file.`,
        ).toBe(true);
      });
    }
  });

  /**
   * T3: The UNGATED_GROUPS allowlist must not reference files that no longer exist.
   *
   * If a group file is deleted or renamed, its exemption entry should be removed
   * too. Stale entries in UNGATED_GROUPS are a maintenance smell.
   */
  describe('UNGATED_GROUPS allowlist has no stale entries', () => {
    for (const file of Object.keys(UNGATED_GROUPS)) {
      it(`UNGATED_GROUPS entry "${file}" refers to an existing group file`, () => {
        expect(
          fs.existsSync(path.join(GROUPS_DIR, file)),
          `UNGATED_GROUPS contains "${file}" but that file no longer exists in routes/groups/. ` +
            `Remove the stale entry from UNGATED_GROUPS.`,
        ).toBe(true);
      });
    }
  });

  /**
   * T4: index.ts must not have new router.use() calls that mount group
   * modules (via import * as …) without those groups being gated.
   *
   * This is the meta-level guard: if the extraction regex ever fails to parse
   * a valid .register() call, we should know immediately rather than silently
   * missing a check.
   */
  it('extractRegisteredGroupFiles correctly identifies at least the known core set', () => {
    const KNOWN_CORE_GROUPS = [
      'vessels.ts',
      'lyte.ts',
      'terra.ts',
      'alloy.ts',
      'security.ts',
      'platform.ts',
      'billing.ts',
      'misc.ts',
      'decisions.ts',
      'core.ts',
      'cross-platform.ts',
    ];

    for (const known of KNOWN_CORE_GROUPS) {
      expect(
        registeredFiles,
        `Expected extractRegisteredGroupFiles() to find "${known}" from index.ts ` +
          `but it was missing. If the import alias or .register() call pattern changed, ` +
          `update the extraction regex in this test file.`,
      ).toContain(known);
    }
  });
});
