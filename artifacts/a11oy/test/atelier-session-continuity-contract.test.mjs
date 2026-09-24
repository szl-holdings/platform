import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/A11oyAtelier.tsx', import.meta.url), 'utf8');

test('stores only the session identifier in tab-scoped browser storage', () => {
  assert.match(source, /window\.sessionStorage\.setItem\(SESSION_STORAGE_KEY, sessionId\)/);
  assert.doesNotMatch(source, /localStorage/);
  assert.doesNotMatch(source, /sessionStorage\.setItem\([^\n]+idempotency/i);
});

test('binds a generated first-turn session identifier to its retry key', () => {
  assert.match(source, /pendingRetry = useRef<[\s\S]+key: string; sessionId: string/);
  assert.match(source, /sessionId \?\? matchingRetry\?\.sessionId \?\? crypto\.randomUUID\(\)/);
  assert.match(source, /matchingRetry\?\.key \?\? crypto\.randomUUID\(\)/);
  assert.match(
    source,
    /pendingRetry\.current = \{[\s\S]*?key: idempotencyKey,[\s\S]*?sessionId: requestSessionId/,
  );
});

test('exposes explicit resume, new-session, copy, and shared-browser guidance', () => {
  assert.match(source, />\s*Resume\s*</);
  assert.match(source, />\s*New session\s*</);
  assert.match(source, />\s*Copy ID\s*</);
  assert.match(source, /On a shared browser, choose New session/);
});

test('labels provider configuration separately from witnessed inference', () => {
  assert.match(source, /item\.available \? 'CONFIGURED' : 'UNAVAILABLE'/);
  assert.match(source, /health\.evidenceBoundary/);
});
