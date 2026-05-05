// Smoke + unit tests for a11oy-code core modules. Uses node:test (no deps).
//
// Coverage:
//   - lutar fallback returns a number in [0,1] for known tools
//   - ouroboros injects a verify-before-mutate step
//   - mirrorEval gives a higher score for a coherent successful turn
//   - classifier: safe vs boundary vs doctrine
//   - evolve store: kill-switch round-trips, revert marks entries
//   - proof ledger: append + read round-trip
//   - tools: read works on a real file
//   - one-shot agent run produces turns and ledger entries

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Isolate state under a temp HOME for every test process.
process.env.A11OY_CODE_HOME = mkdtempSync(join(tmpdir(), 'a11oy-code-test-'));

const { lutarScore } = await import('../src/codex/lutar.mjs');
const { ouroboros } = await import('../src/codex/ouroboros.mjs');
const { mirrorEval } = await import('../src/codex/mirroreval.mjs');
const { classify } = await import('../src/evolve/classifier.mjs');
const evolveStore = await import('../src/evolve/store.mjs');
const { proof } = await import('../src/proof.mjs');
const { runTool } = await import('../src/tools/index.mjs');
const { runOneShot } = await import('../src/agent.mjs');

test('lutar fallback returns a finite score in [0,1]', () => {
  for (const t of ['read', 'write', 'shell', 'finish', 'unknown_xyz']) {
    const s = lutarScore(t);
    assert.ok(Number.isFinite(s) && s >= 0 && s <= 1, `score for ${t}: ${s}`);
  }
});

test('ouroboros injects a verify-before-mutate step', () => {
  const plan = { steps: [{ tool: 'edit', args: { path: 'foo.ts' } }] };
  const out = ouroboros(plan, { history: [] });
  assert.equal(out.steps[0].tool, 'read');
  assert.equal(out.steps[1].tool, 'edit');
  assert.equal(out.revised_by, 'ouroboros');
});

test('ouroboros drops steps repeated in recent history', () => {
  const plan = { steps: [{ tool: 'shell', args: { cmd: 'ls' } }, { tool: 'finish', args: {} }] };
  const history = [{ tool: { name: 'shell', args: { cmd: 'ls' } } }];
  const out = ouroboros(plan, { history });
  assert.ok(!out.steps.some((s) => s.tool === 'shell' && s.args?.cmd === 'ls'));
});

test('mirrorEval rewards coherent, successful, safe turns', () => {
  const plan = { steps: [{ tool: 'read', args: { path: '.' } }, { tool: 'edit', args: { path: 'x' } }] };
  const high = mirrorEval({
    plan,
    toolPick: { name: 'edit', score: 0.9 },
    toolResult: { ok: true },
    reflection: { ok: true },
  });
  const low = mirrorEval({
    plan: { steps: [] },
    toolPick: { name: 'shell', score: 0.1 },
    toolResult: { ok: false, error: 'x' },
    reflection: null,
  });
  assert.ok(high > low);
  assert.ok(high <= 1 && low >= 0);
});

test('classifier: safe / boundary / doctrine', () => {
  assert.equal(classify({ kind: 'tool_description_tweak', magnitude: 0.05 }), 'safe');
  assert.equal(classify({ kind: 'routing_weight_nudge', magnitude: 0.5 }), 'boundary');
  assert.equal(classify({ kind: 'add_tool' }), 'boundary');
  assert.equal(classify({ kind: 'system_prompt_rewrite' }), 'doctrine');
  assert.equal(classify({ kind: 'unknown' }), 'doctrine');
});

test('evolve store: kill-switch round-trips and is honoured', () => {
  evolveStore.setKillSwitch(true);
  assert.equal(evolveStore.status().killSwitch, true);
  assert.equal(evolveStore.canAutoApplyNow(), false);
  evolveStore.setKillSwitch(false);
  assert.equal(evolveStore.canAutoApplyNow(), true);
});

test('evolve store: revertLast marks entries reverted', () => {
  evolveStore.recordAutoApply({ id: 'p1', kind: 'tool_description_tweak' }, { rollbackWindow: 10 });
  evolveStore.recordAutoApply({ id: 'p2', kind: 'routing_weight_nudge' }, { rollbackWindow: 10 });
  const reverted = evolveStore.revertLast(2);
  assert.equal(reverted.length, 2);
  assert.equal(evolveStore.status().autoAppliesLast24h, 0);
});

test('proof ledger: append + read round-trip', () => {
  const before = proof.read({ kind: 'unit_test_marker' }).length;
  proof.append({ kind: 'unit_test_marker', detail: 'hello' });
  const after = proof.read({ kind: 'unit_test_marker' });
  assert.ok(after.length === before + 1);
  assert.equal(after[after.length - 1].detail, 'hello');
});

test('tools: read works on a real file inside the working directory', async () => {
  // Sandbox containment requires fixture lives under cwd.
  const dir = mkdtempSync(join(process.cwd(), '.a11oy-test-'));
  const file = join(dir, 'hello.txt');
  writeFileSync(file, 'hello world');
  const r = await runTool('read', { path: file });
  assert.equal(r.ok, true);
  assert.equal(r.kind, 'file');
  assert.equal(r.content, 'hello world');
});

test('ouroboros keeps finish last so the agent does not terminate early', () => {
  const plan = { steps: [
    { tool: 'finish', args: {} },
    { tool: 'edit', args: { path: 'foo.ts' } },
    { tool: 'read', args: { path: 'foo.ts' } },
  ]};
  const out = ouroboros(plan, { history: [] });
  assert.equal(out.steps[out.steps.length - 1].tool, 'finish');
  assert.notEqual(out.steps[0].tool, 'finish');
});

test('safeJoin rejects path-escape attempts', async () => {
  const r = await runTool('read', { path: '../../etc/passwd' });
  assert.equal(r.ok, false);
  assert.match(String(r.error), /escapes working directory/);
});

test('armed rollback reverts when post-apply window mean drops below baseline', () => {
  evolveStore.recordAutoApply({ id: 'p_rb', kind: 'tool_description_tweak' }, { rollbackWindow: 3, baseline: 0.7 });
  evolveStore.observeScore(0.4);
  evolveStore.observeScore(0.3);
  const reverts = evolveStore.observeScore(0.2);
  assert.ok(reverts.some((r) => r.id === 'p_rb'), 'expected p_rb to be auto-reverted');
});

const applier = await import('../src/evolve/applier.mjs');
const { TOOLS } = await import('../src/tools/index.mjs');
const { router } = await import('../src/providers/router.mjs');

test('applier mutates and reverts a tool description tweak', () => {
  applier._resetForTest();
  const t = TOOLS.find((x) => x.name === 'read');
  const before = t.description;
  const r = applier.apply({ kind: 'tool_description_tweak', target: 'read', magnitude: 0.05 });
  assert.equal(r.applied, true);
  assert.notEqual(t.description, before);
  applier.revert({ kind: 'tool_description_tweak', target: 'read' }, r.before);
  assert.equal(t.description, before);
});

test('applier mutates and reverts a routing weight nudge', () => {
  applier._resetForTest();
  const reg = router.registry;
  const before = reg[0].weight;
  const r = applier.apply({ kind: 'routing_weight_nudge', target: 'read', magnitude: 0.10 });
  assert.equal(r.applied, true);
  assert.notEqual(reg[0].weight, before);
  applier.revert({ kind: 'routing_weight_nudge', target: 'read' }, r.before);
  assert.equal(reg[0].weight, before);
});

test('safeJoin rejects symlink whose target leaves cwd', async () => {
  const { symlinkSync, mkdtempSync: mkdt, rmSync } = await import('node:fs');
  const { tmpdir: tdir } = await import('node:os');
  const linkDir = mkdt(join(process.cwd(), '.a11oy-symlink-test-'));
  const outside = mkdt(join(tdir(), 'a11oy-outside-'));
  const link = join(linkDir, 'escape');
  symlinkSync(outside, link);
  const r = await runTool('read', { path: link });
  assert.equal(r.ok, false);
  assert.match(String(r.error), /escapes working directory|symlink/);
  rmSync(linkDir, { recursive: true, force: true });
});

test('shell rejects general-purpose interpreters', async () => {
  for (const cmd of ['node -e console.log(1)', 'python -c print(1)', 'bash -c id', 'sh -c id', 'deno run x.ts', 'npm install', 'pnpm add x', 'pip install x', 'ruby -e 1', 'perl -e 1']) {
    const r = await runTool('shell', { cmd });
    assert.equal(r.ok, false, `expected reject for: ${cmd}`);
    assert.match(String(r.error), /not in allowlist/);
  }
});

test('shell rejects metacharacters and path-escape arguments', async () => {
  const a = await runTool('shell', { cmd: 'cat /etc/passwd' });
  assert.equal(a.ok, false);
  const b = await runTool('shell', { cmd: 'cat ../../etc/passwd' });
  assert.equal(b.ok, false);
  // metacharacters: argv parsing splits on spaces so we test a value with ;
  const c = await runTool('shell', { cmd: 'echo a;rm' });
  assert.equal(c.ok, false);
  assert.match(String(c.error), /metacharacter/);
});

test('shell rejects rg --exec smuggle', async () => {
  const r = await runTool('shell', { cmd: 'rg --exec=id pattern' });
  assert.equal(r.ok, false);
  assert.match(String(r.error), /rg flag not allowed|not in allowlist/);
});

test('shell allows benign read-only commands', async () => {
  const r = await runTool('shell', { cmd: 'echo hello' });
  assert.equal(r.ok, true);
  assert.match(String(r.stdout), /hello/);
});

test('git tool rejects subcommands outside its own allowlist', async () => {
  const r = await runTool('git', { sub: 'clone', args: ['https://example.com/x.git'] });
  assert.equal(r.ok, false);
  assert.match(String(r.error), /git clone not allowed/);
});

test('telemetry stays silent by default and records intent in proof ledger', async () => {
  const before = proof.read({ kind: 'telemetry' }).length;
  await runOneShot('read package.json', { json: false, autonomy: false });
  const after = proof.read({ kind: 'telemetry' });
  assert.ok(after.length > before, 'expected a telemetry entry');
  const last = after[after.length - 1];
  assert.equal(last.enabled, false);
  assert.equal(last.sent, false);
});

test('one-shot agent run produces turns and ledger entries', async () => {
  await runOneShot('please read the package.json file', { json: true, autonomy: false });
  const planEntries = proof.read({ kind: 'plan', limit: 5 });
  assert.ok(planEntries.length >= 1, 'expected at least one plan entry in the ledger');
});
