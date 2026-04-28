import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PROXY_ROUTES } from '../../packages/proxy-routes.js';

const ARTIFACTS_DIR = path.resolve(import.meta.dirname, '../../artifacts');

const NON_VITE_PREFIXES = new Set(['/api/', '/ws/']);

interface ConfigEntry {
  dir: string;
  source: string;
}

function buildBasePathMap(): Map<string, ConfigEntry> {
  const map = new Map<string, ConfigEntry>();
  const dirs = fs
    .readdirSync(ARTIFACTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of dirs) {
    const configPath = path.join(ARTIFACTS_DIR, dir, 'vite.config.ts');
    if (!fs.existsSync(configPath)) continue;
    const source = fs.readFileSync(configPath, 'utf-8');

    const match = source.match(
      /basePath\s*=\s*(?:process\.env\.BASE_PATH\s*\|\|\s*)?['"]([^'"]+)['"]/,
    );
    if (match) {
      map.set(match[1]!, { dir, source });
    }
  }
  return map;
}

const basePathMap = buildBasePathMap();

const subPathRoutes = PROXY_ROUTES.filter((r) => !NON_VITE_PREFIXES.has(r.prefix));

describe('Vite HMR config compliance — sub-path artifacts', () => {
  it('finds at least one sub-path route to validate', () => {
    expect(subPathRoutes.length).toBeGreaterThan(0);
  });

  for (const route of subPathRoutes) {
    const entry = basePathMap.get(route.prefix);

    describe(`${route.prefix}`, () => {
      it('has a vite.config.ts with a matching basePath', () => {
        expect(
          entry,
          `No vite.config.ts found with basePath="${route.prefix}" for route ${route.prefix}`,
        ).toBeDefined();
      });

      if (!entry) return;

      it('imports sharedProxyPlugin', () => {
        expect(entry.source).toMatch(/import\s.*sharedProxyPlugin/);
      });

      it('calls sharedProxyPlugin() in plugins array', () => {
        expect(entry.source).toContain('sharedProxyPlugin()');
      });

      it('sets hmr.clientPort to 443', () => {
        expect(entry.source).toMatch(/clientPort:\s*443/);
      });

      it('sets hmr.path to a basePath variable (not hardcoded)', () => {
        expect(entry.source).toMatch(/path:\s*basePath/);
      });
    });
  }
});
