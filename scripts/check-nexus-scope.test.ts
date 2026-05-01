/**
 * Tests for scripts/check-nexus-scope.ts
 *
 * The NEXUS scope check is now the only thing standing between
 * artifacts/mockup-sandbox and accidental coupling to other artifacts,
 * Alloy, real AI/auth SDKs, or arbitrary outbound network calls. It has
 * been hardened twice in code review (boundary checks on URL prefixes,
 * fail-closed declaration resolver, prev-line escape-marker support).
 *
 * This file pins every known bypass scenario as a regression test so a
 * future refactor cannot quietly reopen one of them.
 *
 * Implements Project Task #4572.
 */

import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BANNED_AI_SDK_NAMES,
  BANNED_AUTH_BILLING_NAMES,
  TRANSITIONAL_ALLOWED_PREFIXES,
  checkResolvedPath,
  classifyImport,
  endsAtPathBoundary,
  isAllowed,
  isAllowedFetchUrl,
  resolveBaseIdent,
  stripLineCommentsForScan,
} from './check-nexus-scope';

const ROOT = resolve(__dirname, '..');
// A realistic path inside the NEXUS sandbox we can use as the "from file"
// for relative-import resolution tests.
const NEXUS_FILE = resolve(ROOT, 'artifacts/mockup-sandbox/src/pages/Demo.tsx');

// ---------------------------------------------------------------------------
// 1. Cross-artifact / Alloy import bypasses (relative + bare)
// ---------------------------------------------------------------------------

describe('classifyImport — relative-path bypasses into banned artifacts', () => {
  it('flags ../../sentra/... when it resolves into artifacts/sentra', () => {
    // From artifacts/mockup-sandbox/src/pages/* up to artifacts/, into sentra.
    const r = classifyImport('../../../sentra/src/Whatever', NEXUS_FILE);
    expect(r?.rule).toBe('cross-artifact-import');
    expect(r?.hint).toMatch(/another artifact/);
  });

  it('flags ../../packages/alloy/... when it resolves into the Alloy package', () => {
    const r = classifyImport('../../../../packages/alloy/src/index', NEXUS_FILE);
    expect(r?.rule).toBe('alloy-coupling');
  });

  it('flags relative paths into artifacts/api-server', () => {
    const r = classifyImport('../../../api-server/src/routes/x', NEXUS_FILE);
    expect(r?.rule).toBe('cross-artifact-import');
  });

  it('does not flag relative imports that stay inside mockup-sandbox', () => {
    expect(classifyImport('./components/Foo', NEXUS_FILE)).toBeNull();
    expect(classifyImport('../data/scripted', NEXUS_FILE)).toBeNull();
  });

  it('does not flag the @/ alias (resolves to NEXUS src)', () => {
    expect(classifyImport('@/components/Foo', NEXUS_FILE)).toBeNull();
  });

  it('flags bare specifiers naming banned artifacts directly', () => {
    expect(classifyImport('artifacts/sentra/src/x', NEXUS_FILE)?.rule).toBe(
      'cross-artifact-import',
    );
    expect(classifyImport('artifacts/a11oy', NEXUS_FILE)?.rule).toBe('cross-artifact-import');
  });

  it('flags bare specifiers naming the Alloy package directly', () => {
    expect(classifyImport('@szl/alloy', NEXUS_FILE)?.rule).toBe('alloy-coupling');
    expect(classifyImport('packages/alloy/src', NEXUS_FILE)?.rule).toBe('alloy-coupling');
  });

  it('ignores node:* and virtual:* specifiers', () => {
    expect(classifyImport('node:fs', NEXUS_FILE)).toBeNull();
    expect(classifyImport('virtual:something', NEXUS_FILE)).toBeNull();
  });
});

describe('checkResolvedPath — boundary semantics (artifacts/sentra-fake)', () => {
  it('flags exact banned-prefix path', () => {
    const abs = resolve(ROOT, 'artifacts/sentra');
    expect(checkResolvedPath(abs)?.rule).toBe('cross-artifact-import');
  });

  it('flags banned-prefix subpath', () => {
    const abs = resolve(ROOT, 'artifacts/sentra/src/whatever.ts');
    expect(checkResolvedPath(abs)?.rule).toBe('cross-artifact-import');
  });

  it('does NOT flag a sibling that merely shares the name as a prefix', () => {
    // `artifacts/sentra-fake` must not be confused with `artifacts/sentra`.
    const abs = resolve(ROOT, 'artifacts/sentra-fake/src/x.ts');
    expect(checkResolvedPath(abs)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. Banned AI / auth-billing SDK imports
// ---------------------------------------------------------------------------

describe('classifyImport — banned SDKs', () => {
  it('flags every known live-AI SDK name', () => {
    for (const name of BANNED_AI_SDK_NAMES) {
      expect(classifyImport(name, NEXUS_FILE)?.rule).toBe('live-ai-sdk');
    }
  });

  it('flags subpath imports of banned AI SDKs', () => {
    expect(classifyImport('openai/resources', NEXUS_FILE)?.rule).toBe('live-ai-sdk');
    expect(classifyImport('@anthropic-ai/sdk/lib/foo', NEXUS_FILE)?.rule).toBe('live-ai-sdk');
  });

  it('flags every known real auth/billing SDK name', () => {
    for (const name of BANNED_AUTH_BILLING_NAMES) {
      expect(classifyImport(name, NEXUS_FILE)?.rule).toBe('real-auth-billing-sdk');
    }
  });

  it('flags subpath imports of banned auth/billing SDKs', () => {
    expect(classifyImport('stripe/lib/foo', NEXUS_FILE)?.rule).toBe('real-auth-billing-sdk');
    expect(classifyImport('@clerk/clerk-react/internal', NEXUS_FILE)?.rule).toBe(
      'real-auth-billing-sdk',
    );
  });

  it('does not flag innocuous third-party deps', () => {
    expect(classifyImport('zod', NEXUS_FILE)).toBeNull();
    expect(classifyImport('framer-motion', NEXUS_FILE)).toBeNull();
    expect(classifyImport('react', NEXUS_FILE)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. URL prefix bypass attempts on the transitional allowlist
// ---------------------------------------------------------------------------

describe('endsAtPathBoundary', () => {
  it('returns true at end of string', () => {
    expect(endsAtPathBoundary('/api/pulse-evals', '/api/pulse-evals'.length)).toBe(true);
  });

  it('returns true at /', () => {
    expect(endsAtPathBoundary('/api/pulse-evals/run', '/api/pulse-evals'.length)).toBe(true);
  });

  it('returns true at ? and #', () => {
    expect(endsAtPathBoundary('/api/pulse-evals?q=1', '/api/pulse-evals'.length)).toBe(true);
    expect(endsAtPathBoundary('/api/pulse-evals#x', '/api/pulse-evals'.length)).toBe(true);
  });

  it('returns false when the next char is anything else (e.g. -)', () => {
    expect(endsAtPathBoundary('/api/pulse-evals-malicious', '/api/pulse-evals'.length)).toBe(false);
  });
});

describe('isAllowedFetchUrl — canonical /api/nexus', () => {
  it('allows the bare canonical prefix', () => {
    expect(isAllowedFetchUrl('/api/nexus', '')).toBe(true);
  });

  it('allows subpaths', () => {
    expect(isAllowedFetchUrl('/api/nexus/research', '')).toBe(true);
  });

  it('allows querystrings on the bare prefix', () => {
    expect(isAllowedFetchUrl('/api/nexus?foo=bar', '')).toBe(true);
  });

  it('blocks unknown bare prefixes', () => {
    expect(isAllowedFetchUrl('/api/something-else', '')).toBe(false);
    expect(isAllowedFetchUrl('https://evil.example.com', '')).toBe(false);
  });
});

describe('isAllowedFetchUrl — transitional allowlist boundary', () => {
  // The transitional allowlist is currently empty (post-#4570). The boundary
  // matcher itself is still exercised by the synthetic tests below — they
  // patch a fixture prefix in via the array reference cannot be done at
  // import time, so we test the boundary semantics through `endsAtPathBoundary`
  // directly above and verify the canonical prefix only here.
  it('always blocks former transitional prefixes now that the allowlist is empty', () => {
    expect(isAllowedFetchUrl('/api/pulse-evals', '')).toBe(false);
    expect(isAllowedFetchUrl('/api/pulse-evals/run', '')).toBe(false);
    expect(isAllowedFetchUrl('/api/ai/prompts', '')).toBe(false);
    expect(isAllowedFetchUrl('/api/ai/prompts/abc/promote', '')).toBe(false);
  });

  it('blocks /api/pulse-evals-malicious (boundary bypass attempt)', () => {
    expect(isAllowedFetchUrl('/api/pulse-evals-malicious', '')).toBe(false);
  });

  it('blocks /api/ai/promptsXYZ (boundary bypass attempt)', () => {
    expect(isAllowedFetchUrl('/api/ai/promptsXYZ', '')).toBe(false);
  });

  it('blocks /api/pulse-evalsattacker (boundary bypass attempt)', () => {
    expect(isAllowedFetchUrl('/api/pulse-evalsattacker', '')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Template-literal URL bypass attempts
// ---------------------------------------------------------------------------

describe('isAllowedFetchUrl — ${API} template literal, fail-closed resolver', () => {
  const goodFile = `const API = '/api/nexus';\n`;
  const goodSubFile = `const API = '/api/nexus/research';\n`;

  it('allows ${API}/path when API resolves to /api/nexus', () => {
    expect(isAllowedFetchUrl('${API}/research', goodFile)).toBe(true);
  });

  it('allows bare ${API} when API resolves to /api/nexus', () => {
    expect(isAllowedFetchUrl('${API}', goodFile)).toBe(true);
  });

  it('allows ${API}?q when API resolves to /api/nexus', () => {
    expect(isAllowedFetchUrl('${API}?q=1', goodFile)).toBe(true);
  });

  it('allows ${API}${path} when API resolves to /api/nexus (next char is interpolation)', () => {
    // Template syntax: `${API}${path}` — encoded here as the literal URL the
    // scanner sees (the regex captures whatever sits inside `fetch(\`...\`)`
    // before the next interpolation).
    expect(isAllowedFetchUrl('${API}${path}', goodFile)).toBe(true);
  });

  it('blocks ${API}.evil — adjacent literal, no path boundary', () => {
    expect(isAllowedFetchUrl('${API}.evil', goodFile)).toBe(false);
  });

  it('blocks ${API}-evil — adjacent literal, no path boundary', () => {
    expect(isAllowedFetchUrl('${API}-evil', goodFile)).toBe(false);
  });

  it('still blocks ${API}-evil even when API points to the canonical subpath', () => {
    expect(isAllowedFetchUrl('${API}-evil', goodSubFile)).toBe(false);
  });

  it('blocks ${API} when the file has NO declaration of API (fail-closed)', () => {
    expect(isAllowedFetchUrl('${API}/research', '')).toBe(false);
  });

  it('blocks ${API} when API resolves to a non-nexus prefix', () => {
    expect(isAllowedFetchUrl('${API}/x', `const API = '/api/something';\n`)).toBe(false);
  });

  it('blocks ${UNKNOWN_IDENT}/x (identifier not in TEMPLATE_BASE_IDENTS)', () => {
    expect(isAllowedFetchUrl('${UNKNOWN}/x', `const UNKNOWN = '/api/nexus';\n`)).toBe(false);
  });

  it('honours every documented base identifier', () => {
    const idents = ['API', 'API_BASE', 'NEXUS_API', 'NEXUS_BASE'];
    for (const ident of idents) {
      const file = `const ${ident} = '/api/nexus';\n`;
      expect(isAllowedFetchUrl(`\${${ident}}/research`, file)).toBe(true);
    }
  });
});

describe('resolveBaseIdent — fail-closed semantics', () => {
  it('returns the value for a clean single declaration', () => {
    expect(resolveBaseIdent(`const API = '/api/nexus';\n`, 'API')).toBe('/api/nexus');
    expect(resolveBaseIdent(`let API = "/api/nexus/x";\n`, 'API')).toBe('/api/nexus/x');
    expect(resolveBaseIdent(`var API = '/api/nexus';\n`, 'API')).toBe('/api/nexus');
  });

  it('returns null when no declaration exists', () => {
    expect(resolveBaseIdent(`const SOMETHING = 1;\n`, 'API')).toBeNull();
  });

  it('returns null when the declaration is shadowed (>1 match)', () => {
    const src = `const API = '/api/nexus';\nconst API = '/api/evil';\n`;
    expect(resolveBaseIdent(src, 'API')).toBeNull();
  });

  it('returns null on string concatenation: const API = "/api/nexus" + "-evil"', () => {
    expect(resolveBaseIdent(`const API = '/api/nexus' + '-evil';\n`, 'API')).toBeNull();
  });

  it('returns null on a function call rhs', () => {
    expect(resolveBaseIdent(`const API = makeBase();\n`, 'API')).toBeNull();
  });

  it('returns null on a template-literal rhs', () => {
    // No matching `'…'` quote — regex won't match at all.
    expect(resolveBaseIdent(`const API = \`/api/\${env}\`;\n`, 'API')).toBeNull();
  });

  it('treats commented-out fake declarations as if they were not there', () => {
    // The fake `// const API = '/api/nexus'` line gets stripped, so only the
    // real (empty) source remains and resolution returns null.
    const src = `// const API = '/api/nexus';\n`;
    expect(resolveBaseIdent(src, 'API')).toBeNull();
  });

  it('does NOT confuse a real declaration with an adjacent line comment', () => {
    const src = `const API = '/api/nexus'; // canonical base\n`;
    expect(resolveBaseIdent(src, 'API')).toBe('/api/nexus');
  });

  it('still fails closed when one real + one commented declaration disagree', () => {
    // After comment stripping, only the real declaration remains, so this
    // resolves to the real value (the bypass attempt was the comment itself,
    // which is a no-op once stripped).
    const src = `const API = '/api/nexus';\n// const API = '/api/evil';\n`;
    expect(resolveBaseIdent(src, 'API')).toBe('/api/nexus');
  });
});

describe('stripLineCommentsForScan', () => {
  it('removes // comments without touching code', () => {
    expect(stripLineCommentsForScan(`const x = 1; // hi\n`).trim()).toBe('const x = 1;');
  });

  it('does not remove block comments', () => {
    expect(stripLineCommentsForScan(`/* keep */ const x = 1;`)).toContain('/* keep */');
  });
});

// ---------------------------------------------------------------------------
// 5. Allow-marker placement (same line + previous line)
// ---------------------------------------------------------------------------

describe('isAllowed — escape marker placement', () => {
  it('honours the marker on the same line', () => {
    expect(isAllowed(`fetch('/api/evil') // nexus-scope-allow`, undefined)).toBe(true);
  });

  it('honours the marker on the previous line', () => {
    expect(isAllowed(`fetch('/api/evil')`, `// nexus-scope-allow: reviewed exception`)).toBe(true);
  });

  it('returns false when neither line has the marker', () => {
    expect(isAllowed(`fetch('/api/evil')`, `const x = 1;`)).toBe(false);
  });

  it('returns false when prevLine is undefined and current line has no marker', () => {
    expect(isAllowed(`fetch('/api/evil')`, undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. Sanity-check the transitional allowlist contents (drift alarm)
// ---------------------------------------------------------------------------

describe('TRANSITIONAL_ALLOWED_PREFIXES — drift alarm', () => {
  it('is empty (post Project Task #4570)', () => {
    // After Task #4570, every NEXUS page uses scripted demo data and the
    // transitional list MUST stay empty. If a future change adds a new
    // entry, this assertion forces an explicit scope-doc amendment AND a
    // matching update to this test — making silent expansion impossible.
    expect(TRANSITIONAL_ALLOWED_PREFIXES).toEqual([]);
  });
});
