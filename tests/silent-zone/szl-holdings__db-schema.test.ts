// Deeper coverage for @szl-holdings/db-schema — verifies that every declared
// domain barrel re-exports a recognisable set of Drizzle tables. The schema is
// the single source of truth for the platform's persistence layer, so a
// regression where a domain stops re-exporting its tables would silently break
// every consumer.
import { describe, expect, it } from 'vitest';

import * as root from '../../packages/db-schema/src/index.ts';
import * as authDomain from '../../packages/db-schema/src/domains/auth.ts';
import * as alloyDomain from '../../packages/db-schema/src/domains/alloy.ts';
import * as auditDomain from '../../packages/db-schema/src/domains/audit.ts';
import * as aiDomain from '../../packages/db-schema/src/domains/ai.ts';
import * as platformDomain from '../../packages/db-schema/src/domains/platform.ts';
import * as vesselsDomain from '../../packages/db-schema/src/domains/vessels.ts';
import * as terraDomain from '../../packages/db-schema/src/domains/terra.ts';
import * as firestormDomain from '../../packages/db-schema/src/domains/firestorm.ts';
import * as continuumDomain from '../../packages/db-schema/src/domains/continuum.ts';

function looksLikeDrizzleTable(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  // Drizzle tables expose symbols and a `_` property at runtime; reliably,
  // they always carry a Symbol(drizzle:Name) own-symbol property.
  const symbols = Object.getOwnPropertySymbols(value);
  return symbols.some((s) => s.description?.startsWith('drizzle:'));
}

function tableNames(mod: Record<string, unknown>): string[] {
  return Object.entries(mod)
    .filter(([, v]) => looksLikeDrizzleTable(v))
    .map(([k]) => k);
}

describe('db-schema / root barrel', () => {
  it('re-exports the full schema from @szl-holdings/db', () => {
    const tables = tableNames(root as Record<string, unknown>);
    // The platform schema has well over a hundred tables; assert a generous
    // lower bound rather than a brittle exact count.
    expect(tables.length).toBeGreaterThan(50);
  });

  it('exports key cross-cutting tables', () => {
    const tables = new Set(tableNames(root as Record<string, unknown>));
    for (const expected of ['usersTable', 'sessionsTable', 'organizationsTable']) {
      expect(tables.has(expected), `${expected} should be re-exported`).toBe(true);
    }
  });
});

describe('db-schema / domain barrels', () => {
  const domains = [
    { name: 'auth', mod: authDomain, expected: ['usersTable', 'sessionsTable', 'organizationsTable'] },
    { name: 'alloy', mod: alloyDomain, expected: [] },
    { name: 'audit', mod: auditDomain, expected: [] },
    { name: 'ai', mod: aiDomain, expected: [] },
    { name: 'platform', mod: platformDomain, expected: [] },
    { name: 'vessels', mod: vesselsDomain, expected: [] },
    { name: 'terra', mod: terraDomain, expected: [] },
    { name: 'firestorm', mod: firestormDomain, expected: [] },
    { name: 'continuum', mod: continuumDomain, expected: [] },
  ];

  for (const { name, mod, expected } of domains) {
    it(`domain "${name}" exposes at least one table`, () => {
      const tables = tableNames(mod as Record<string, unknown>);
      expect(tables.length, `${name} should expose tables`).toBeGreaterThan(0);
    });

    if (expected.length) {
      it(`domain "${name}" exposes the documented contract tables`, () => {
        const tables = new Set(tableNames(mod as Record<string, unknown>));
        for (const t of expected) {
          expect(tables.has(t), `${name}.${t}`).toBe(true);
        }
      });
    }
  }

  it('auth tables in the domain barrel are the same identity as in the root barrel', () => {
    // Identity matters: callers comparing `eq(usersTable.id, …)` across barrels
    // would otherwise silently mismatch the underlying Drizzle table object.
    expect((authDomain as Record<string, unknown>).usersTable).toBe(
      (root as Record<string, unknown>).usersTable,
    );
  });
});
