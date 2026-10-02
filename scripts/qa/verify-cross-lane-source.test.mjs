import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  PINNED_SOURCE_SHA256,
  parseLaneContract,
  SOURCE_PATH,
  verifySnapshot,
} from './verify-cross-lane-source.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const script = path.join(here, 'verify-cross-lane-source.mjs');
const source = readFileSync(path.join(root, SOURCE_PATH));
const fakeHead = 'a'.repeat(40);

test('verifies the pinned six-lane source without promoting runtime evidence', () => {
  const report = verifySnapshot({
    gitHead: fakeHead,
    workingSource: source,
    committedSource: source,
  });
  assert.equal(report.verification, 'VERIFIED_LOCAL_SOURCE');
  assert.equal(report.runtimeReadiness, 'UNKNOWN');
  assert.equal(report.source.sha256, PINNED_SOURCE_SHA256);
  assert.deepEqual(
    report.lanes.map((lane) => lane.id),
    ['cyber-security', 'finance', 'data-governance', 'enterprise', 'real-estate', 'legal'],
  );
  for (const lane of report.lanes) {
    assert.equal(lane.sourceState, 'DEMO');
    assert.equal(lane.scenarioState, 'DEMO');
    assert.equal(lane.liveState, 'UNAVAILABLE');
    assert.equal(lane.actionState, 'BLOCKED');
    assert.deepEqual(Object.values(lane.externalEvidence), Array(5).fill('UNKNOWN'));
  }
});

test('rejects missing, dirty, and changed source bytes', () => {
  assert.throws(
    () => verifySnapshot({ gitHead: fakeHead, workingSource: null, committedSource: source }),
    { code: 'SOURCE_MISSING' },
  );
  const changed = Buffer.from(
    source.toString('utf8').replace("sourceState: 'DEMO'", "sourceState: 'REAL'"),
  );
  assert.throws(
    () => verifySnapshot({ gitHead: fakeHead, workingSource: changed, committedSource: source }),
    { code: 'SOURCE_NOT_AT_HEAD' },
  );
  assert.throws(
    () => verifySnapshot({ gitHead: fakeHead, workingSource: changed, committedSource: changed }),
    { code: 'SOURCE_DIGEST_CHANGED' },
  );
});

test('rejects missing lanes, dynamic loop calls, and invalid TypeScript', () => {
  const text = source.toString('utf8');
  assert.throws(() => parseLaneContract(''), { code: 'SOURCE_MISSING' });
  assert.throws(
    () =>
      parseLaneContract(
        text.replace(
          /(actionLabel: 'Trace the cyber decision contract',\s+sourceState: )'DEMO'/,
          "$1'REAL'",
        ),
      ),
    { code: 'CONTRACT_CHANGED' },
  );
  assert.throws(() => parseLaneContract(text.replace("id: 'legal'", "id: 'unknown'")), {
    code: 'CONTRACT_CHANGED',
  });
  assert.throws(() => parseLaneContract(text.replace('loop: loop(', 'loop: alternate(')), {
    code: 'CONTRACT_UNPARSEABLE',
  });
  assert.throws(() => parseLaneContract('export const SERIES_A_SOLUTIONS = [ {'), {
    code: 'CONTRACT_UNPARSEABLE',
  });
});

test('CLI emits structured local proof and fails closed for invalid arguments', () => {
  const good = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
  assert.equal(good.status, 0, good.stderr || good.stdout);
  const report = JSON.parse(good.stdout);
  assert.equal(report.verification, 'VERIFIED_LOCAL_SOURCE');
  assert.match(report.source.gitHead, /^[0-9a-f]{40}$/);

  const bad = spawnSync(process.execPath, [script, '--unexpected'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(bad.status, 2);
  const denied = JSON.parse(bad.stdout);
  assert.equal(denied.verification, 'FAILED_CLOSED');
  assert.equal(denied.error.code, 'INVALID_ARGUMENTS');
  assert.deepEqual(denied.lanes, []);
});
