// Offline regression tests for the reviewed Drizzle journal high-water contract.
// Synthetic copies only. Never queries or mutates a database, or writes to the repo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, 'check-journal.mjs'), 'utf8');
const baseline = JSON.parse(fs.readFileSync(path.join(here, '..', 'drizzle', 'meta', '_journal.json'), 'utf8'));
assert.equal(baseline.entries.length, 148, 'baseline changed; update admission with reviewed migration history');

function runFixture(change) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'szl-db-journal-'));
  try {
    const scripts = path.join(root, 'lib', 'db', 'scripts');
    const drizzle = path.join(root, 'lib', 'db', 'drizzle');
    fs.mkdirSync(path.join(drizzle, 'meta'), { recursive: true });
    fs.mkdirSync(scripts, { recursive: true });
    const scriptPath = path.join(scripts, 'check-journal.mjs');
    fs.writeFileSync(scriptPath, source);
    const j = structuredClone(baseline);
    for (const e of j.entries) fs.writeFileSync(path.join(drizzle, e.tag + '.sql'), '-- synthetic placeholder\n');
    change(j, drizzle);
    fs.writeFileSync(path.join(drizzle, 'meta', '_journal.json'), JSON.stringify(j, null, 2));
    return spawnSync(process.execPath, [scriptPath], { encoding: 'utf8', timeout: 4500 });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function append(j, dir, tag, when) {
  j.entries.push({ ...j.entries.at(-1), idx: j.entries.length, when, tag });
  fs.writeFileSync(path.join(dir, tag + '.sql'), '-- synthetic placeholder\n');
}

test('unchanged reviewed legacy journal is permitted', () => {
  const r = runFixture(() => {});
  assert.equal(r.status, 0, r.stderr);
});

test('new, append-only, strictly newer migration is permitted', () => {
  const r = runFixture((j, dir) => append(j, dir, '0147_new_safe_feature', 1780473600001));
  assert.equal(r.status, 0, r.stderr);
});

test('backdated append fails even when all filenames exist', () => {
  const r = runFixture((j, dir) => append(j, dir, '0147_backdated_feature', 1780473600000));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /high-water|non-monotonic/);
});

test('mid-journal insert fails even if local neighbors are monotonic', () => {
  const r = runFixture((j, dir) => {
    const newEntry = { ...j.entries[5], tag: '0005_injected_after_release', when: j.entries[5].when - 1 };
    j.entries.splice(5, 0, newEntry);
    j.entries.forEach((e, idx) => { e.idx = idx; });
    fs.writeFileSync(path.join(dir, newEntry.tag + '.sql'), '-- synthetic placeholder\n');
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /historical journal prefix modified/);
});

test('a changed historical migration timestamp fails even if local order remains monotonic', () => {
  const r = runFixture((j) => { j.entries[0].when += 1; });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /historical journal prefix modified/);
});

test('untracked SQL file remains a hard error', () => {
  const r = runFixture((_j, dir) => {
    fs.writeFileSync(path.join(dir, '0147_untracked.sql'), '-- synthetic placeholder\n');
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /not in journal/);
});

test('post-baseline migration with increasing local entries but under applied high-water fails', () => {
  const r = runFixture((j, dir) => {
    append(j, dir, '0147_future_migration', 1780473600002);
    append(j, dir, '0148_backdated_after_future', 1780473600001);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /high-water|non-monotonic/);
});
