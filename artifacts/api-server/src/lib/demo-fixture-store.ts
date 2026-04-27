/**
 * Demo Fixture Store — SZL Holdings Platform
 *
 * Provides seeded, in-memory fixture data for key API paths.
 * Used exclusively when APP_MODE=demo to serve realistic responses
 * without touching the live database.
 *
 * Fixture data lives in demo-fixtures/ — add domain files there and
 * register them in demo-fixtures/index.ts to extend demo coverage.
 *
 * - get(path):   Returns fixture data for an exact or prefix match, or null.
 * - reset():     Reloads all fixtures to their initial seeded state.
 * - demoActive:  True when APP_MODE=demo (checked at runtime).
 */

import { FIXTURE_REGISTRY } from './demo-fixtures/index.js';

export interface DemoFixture {
  status?: number;
  data: unknown;
}

function buildFixtures(): Map<string, DemoFixture> {
  const m = new Map<string, DemoFixture>();
  for (const entry of FIXTURE_REGISTRY) {
    m.set(entry.path, { status: entry.status, data: entry.data });
  }
  return m;
}

class DemoFixtureStore {
  private fixtures: Map<string, DemoFixture>;

  constructor() {
    this.fixtures = buildFixtures();
  }

  get isDemoMode(): boolean {
    const raw = (process.env.APP_MODE ?? '').toLowerCase().trim();
    if (raw === 'demo') return true;
    const demoMode = process.env.DEMO_MODE;
    if (demoMode === 'true' || demoMode === '1') return true;
    const appEnv = (process.env.APP_ENV ?? '').toLowerCase();
    return appEnv === 'demo';
  }

  reset(): void {
    this.fixtures = buildFixtures();
  }

  get(path: string): DemoFixture | null {
    const exact = this.fixtures.get(path);
    if (exact) return exact;

    for (const [prefix, fixture] of this.fixtures) {
      if (path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`)) {
        return fixture;
      }
    }
    return null;
  }

  get size(): number {
    return this.fixtures.size;
  }
}

export const demoFixtureStore = new DemoFixtureStore();
