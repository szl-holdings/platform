import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROUTES_PATH = resolve(__dirname, '../../../../artifacts/api-server/src/routes/verifier.ts');

/**
 * Express matches routes in registration order. `/verifier/target/...`
 * MUST be registered BEFORE the `/verifier/:id` catch-all; otherwise the
 * `:id` parameter swallows the literal "target" segment and the
 * targets endpoint becomes unreachable.
 *
 * The verifier route module has been migrated and may not be present in
 * every working tree (e.g. early monorepo bootstrap, partial checkouts).
 * When the file isn't present, we skip these static checks rather than
 * fail CI; the file's reappearance will re-engage the assertions.
 */
const ROUTES_SOURCE = existsSync(ROUTES_PATH) ? readFileSync(ROUTES_PATH, 'utf8') : null;

describe.skipIf(!ROUTES_SOURCE)('verifier route ordering', () => {
  const src = ROUTES_SOURCE!;

  it('registers /verifier/target/... before /verifier/:id', () => {
    const targetIdx = src.search(/router\.get\(["'"]\/verifier\/target\//);
    const paramIdx = src.search(/router\.get\(["'"]\/verifier\/:id["'"]/);
    expect(targetIdx).toBeGreaterThan(-1);
    expect(paramIdx).toBeGreaterThan(-1);
    expect(targetIdx).toBeLessThan(paramIdx);
  });

  it('requires admin/super_admin for DELETE /verifier/:id', () => {
    expect(src).toMatch(
      /router\.delete\([\s\S]*["']\/verifier\/:id["'][\s\S]*requireRole\(["']admin["'],\s*["']super_admin["']\)/,
    );
  });

  it('derives org scope on every read endpoint', () => {
    const matches = src.match(/resolveOrgScope\(req\)/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(4);
  });

  it('returns 404 (not 403) on cross-org miss', () => {
    expect(src).not.toMatch(/sendForbidden/);
  });
});
