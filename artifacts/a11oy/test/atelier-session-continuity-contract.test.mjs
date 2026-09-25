import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/A11oyAtelier.tsx', import.meta.url), 'utf8');

test('stores the session and a prompt-free pending retry in tab-scoped browser storage', () => {
  assert.match(source, /window\.sessionStorage\.setItem\(SESSION_STORAGE_KEY, sessionId\)/);
  assert.match(
    source,
    /window\.sessionStorage\.setItem\(PENDING_RETRY_STORAGE_KEY, JSON\.stringify\(value\)\)/,
  );
  assert.match(source, /const fingerprintSha256 = await fingerprintRequest\(requestFingerprint\)/);
  assert.match(source, /initialPendingRetry] = useState\(\(\) => readPendingRetry\(\)\)/);
  assert.match(source, /pendingRetry = useRef<PendingRetry \| undefined>\(initialPendingRetry\)/);
  assert.match(source, /storePendingRetry\(pendingRetry\.current\)/);
  assert.match(source, /forgetPendingRetry\(\)/);
  assert.doesNotMatch(source, /localStorage/);
  assert.doesNotMatch(source, /JSON\.stringify\(\{[^\n]*prompt: trimmed/);
});

test('binds a generated first-turn session identifier to its retry key', () => {
  assert.match(source, /interface PendingRetry \{[\s\S]+key: string;[\s\S]+sessionId: string/);
  assert.match(source, /sessionId \?\? matchingRetry\?\.sessionId \?\? crypto\.randomUUID\(\)/);
  assert.match(source, /matchingRetry\?\.key \?\? crypto\.randomUUID\(\)/);
  assert.match(
    source,
    /pendingRetry\.current = \{[\s\S]*?key: idempotencyKey,[\s\S]*?sessionId: requestSessionId/,
  );
  assert.match(source, /pendingRetry\.current\.fingerprintSha256 !== fingerprintSha256/);
  assert.match(source, /Date\.now\(\) - pendingRetry\.current\.createdAt >= PENDING_RETRY_TTL_MS/);
});

test('exposes explicit resume, new-session, copy, and shared-browser guidance', () => {
  assert.match(source, />\s*Resume\s*</);
  assert.match(source, />\s*New session\s*</);
  assert.match(source, />\s*Copy ID\s*</);
  assert.match(source, /while a turn is unconfirmed, a prompt-free retry/);
  assert.match(source, /On a shared browser, choose New session/);
});

test('labels provider configuration separately from witnessed inference', () => {
  assert.match(source, /item\.available \? 'CONFIGURED' : 'UNAVAILABLE'/);
  assert.match(source, /health\.evidenceBoundary/);
});
