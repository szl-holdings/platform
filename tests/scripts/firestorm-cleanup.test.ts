import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..', '..');

const ALLOWED_REFERENCES = new Set<string>([
  'scripts/qa/check-deprecated-links.js',
  'tests/scripts/firestorm-cleanup.test.ts',
]);

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), 'utf8');
}

describe('firestorm directory cleanup (task #1438)', () => {
  it('artifacts/firestorm/ directory must not exist on disk', () => {
    expect(existsSync(resolve(ROOT, 'artifacts/firestorm'))).toBe(false);
  });

  it('.replitignore must not list artifacts/firestorm/', () => {
    expect(read('.replitignore')).not.toMatch(/artifacts\/firestorm\//);
  });

  it('scripts/portfolio.config.json must not reference artifacts/firestorm/', () => {
    expect(read('scripts/portfolio.config.json')).not.toMatch(/artifacts\/firestorm\//);
  });

  it('scripts/media/capture-screenshots.ts must not reference /firestorm/ paths', () => {
    expect(read('scripts/media/capture-screenshots.ts')).not.toMatch(/\/firestorm\//);
  });

  it('scripts/brand-check.ts must not list artifacts/firestorm in archived stubs', () => {
    expect(read('scripts/brand-check.ts')).not.toMatch(/artifacts\/firestorm/);
  });

  it('check-deprecated-links.js still guards /firestorm/ as a deprecated route', () => {
    const guard = read('scripts/qa/check-deprecated-links.js');
    expect(guard).toMatch(/slug:\s*['"]\/firestorm\/['"]/);
  });

  it.skip('this allow-list documents the only files that may legitimately mention firestorm directory paths', () => {
    expect(ALLOWED_REFERENCES.size).toBeGreaterThan(0);
  });
});
