import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('./atelier-cli.ts', import.meta.url), 'utf8');

test('Atelier CLI preserves and exposes retry/session identity', () => {
  assert.match(source, /const sessionId = options\.session \?\? randomUUID\(\)/);
  assert.match(source, /sessionId,\s*idempotencyKey,/s);
  assert.match(source, /Retry this exact request with --session .* --idempotency-key/s);
  assert.match(source, /Session .*receipt\.sessionId/s);
});
