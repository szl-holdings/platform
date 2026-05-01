import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..', '..');
const SCANNER = resolve(ROOT, 'scripts', 'qa', 'check-deprecated-links.js');

function runScannerInTempRoot(): { exitCode: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync('node', [SCANNER], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (err: unknown) {
    const e = err as { status?: number | null; stdout?: string; stderr?: string };
    return {
      exitCode: typeof e.status === 'number' ? e.status : 1,
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? '',
    };
  }
}

describe('scripts/qa/check-deprecated-links.js — JSON nav field scanning (task #1645)', () => {
  it('scans .json files (not just source files)', () => {
    const src = readFileSync(SCANNER, 'utf8');
    expect(src).toMatch(/JSON_EXTENSIONS/);
    expect(src).toMatch(/JSON_NAV_PATTERN/);
  });

  it('JSON_NAV_PATTERN matches link/href/url/to fields with deprecated routes', () => {
    const src = readFileSync(SCANNER, 'utf8');
    // Extract the JSON_NAV_PATTERN literal from the source so the test
    // exercises the same regex that ships in the scanner.
    const match = src.match(/const JSON_NAV_PATTERN\s*=\s*\n?\s*(\/.+?\/[gimuy]*);/);
    expect(match).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const pattern = (new Function(`return ${match![1]}`))() as RegExp;

    const sample = `{
      "link": "/firestorm/",
      "href": "/lyte-command-center/dashboard",
      "url": "/aegis/incidents",
      "to": "/imperium/console",
      "label": "/firestorm/should-not-match-non-nav-key"
    }`;
    const hits: Array<{ field: string; href: string }> = [];
    let m: RegExpExecArray | null;
    pattern.lastIndex = 0;
    while ((m = pattern.exec(sample)) !== null) {
      hits.push({ field: m[1], href: m[2] });
    }
    expect(hits.find((h) => h.field === 'link' && h.href === '/firestorm/')).toBeTruthy();
    expect(hits.find((h) => h.field === 'href' && h.href === '/lyte-command-center/dashboard')).toBeTruthy();
    expect(hits.find((h) => h.field === 'to' && h.href === '/imperium/console')).toBeTruthy();
    expect(hits.find((h) => h.field === 'url' && h.href === '/aegis/incidents')).toBeTruthy();
    // Non-navigation key "label" must not match
    expect(hits.find((h) => h.field === 'label')).toBeFalsy();
  });

  it('skips *.generated.json files', () => {
    const src = readFileSync(SCANNER, 'utf8');
    expect(src).toMatch(/GENERATED_FILE_SUFFIX/);
    expect(src).toMatch(/\.generated\\\.json/);
  });

  it('the active codebase has no deprecated JSON nav-link references (scanner exits clean)', () => {
    const result = runScannerInTempRoot();
    expect(result.exitCode).toBe(0);
  });
});

describe('scripts/qa/check-deprecated-links.js — JSON scanner end-to-end with planted fixture', () => {
  // Fixtures must live inside scripts/ since SCAN_DIRS is hardcoded to
  // [artifacts/, packages/, scripts/]. Using mkdtempSync gives a unique
  // per-run directory name; defense-in-depth: wipe any stale __test_fixtures__
  // sibling at suite startup in case a prior crashed run left cruft.
  const FIXTURE_PARENT = resolve(ROOT, 'scripts', '__test_fixtures__');
  let fixtureDir: string;
  let plantedFile: string;

  beforeAll(() => {
    // Wipe any stale fixture parent left over from a prior crashed run.
    if (existsSync(FIXTURE_PARENT)) {
      rmSync(FIXTURE_PARENT, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    // Re-create parent so mkdtempSync has somewhere to land.
    if (!existsSync(FIXTURE_PARENT)) {
      mkdirSync(FIXTURE_PARENT, { recursive: true });
    }
    fixtureDir = mkdtempSync(join(FIXTURE_PARENT, 'run-'));
    plantedFile = join(fixtureDir, 'deprecated-json.json');
  });

  afterEach(() => {
    rmSync(fixtureDir, { recursive: true, force: true });
    // Best-effort: remove the parent if empty, so a clean repo stays clean.
    try {
      rmSync(FIXTURE_PARENT, { recursive: false, force: false });
    } catch {
      // Parent has siblings (concurrent test runs), leave it alone.
    }
  });

  it('scanner detects a planted JSON file with a deprecated link field', () => {
    writeFileSync(
      plantedFile,
      JSON.stringify(
        {
          items: [
            { name: 'Dashboard', link: '/firestorm/' },
            { name: 'Incidents', link: '/aegis/incidents' },
          ],
        },
        null,
        2,
      ),
    );

    const result = runScannerInTempRoot();
    expect(result.exitCode).toBe(1);
  });

  it('scanner ignores planted *.generated.json fixture files', () => {
    const generatedFile = plantedFile.replace(/\.json$/, '.generated.json');
    writeFileSync(
      generatedFile,
      JSON.stringify({ items: [{ link: '/firestorm/' }] }, null, 2),
    );
    const result = runScannerInTempRoot();
    expect(result.exitCode).toBe(0);
  });

  it('scanner ignores common non-nav JSON files (package.json, tsconfig.json, *.schema.json)', () => {
    // These will get cleaned up with fixtureDir.
    writeFileSync(
      join(fixtureDir, 'package.json'),
      JSON.stringify({ name: 'fixture', repository: { url: '/firestorm/repo' } }),
    );
    writeFileSync(
      join(fixtureDir, 'tsconfig.json'),
      JSON.stringify({ extends: '/firestorm/tsconfig' }),
    );
    writeFileSync(
      join(fixtureDir, 'data.schema.json'),
      JSON.stringify({ properties: { link: { default: '/firestorm/' } } }),
    );
    const result = runScannerInTempRoot();
    expect(result.exitCode).toBe(0);
  });
});
