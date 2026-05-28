/**
 * wheeler_window.test.ts — pure-JS Node assert tests for the Wheeler runtime.
 *
 * 18 tests, no test framework dependency.  Run with `node wheeler_window.test.js`
 * after tsc, or load directly via ts-node.
 */

import assert from 'node:assert/strict';
import {
  admissible,
  closeLabel,
  closeStream,
  DoctrineLabel,
  WHEELER_WINDOW_W,
  Span,
  Receipt,
} from './wheeler_window';

const span: Span = { id: 1, start: 100, endAt: 200 };

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok    ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log('Wheeler window — runtime parity with Lutar.Wheeler');

run('T1 idempotent on admissible — single close', () => {
  const r: Receipt = { span: 1, closeAt: 200, label: DoctrineLabel.L1 };
  assert.equal(closeLabel(span, r), DoctrineLabel.L1);
  assert.equal(closeLabel(span, r), DoctrineLabel.L1);
});

run('T2 late receipt yields Bot', () => {
  const r: Receipt = { span: 1, closeAt: 200 + WHEELER_WINDOW_W + 1, label: DoctrineLabel.Top };
  assert.equal(closeLabel(span, r), DoctrineLabel.Bot);
});

run('T3 zero-offset admissible', () => {
  const r: Receipt = { span: 1, closeAt: 200, label: DoctrineLabel.L2 };
  assert.equal(admissible(span, r), true);
  assert.equal(closeLabel(span, r), DoctrineLabel.L2);
});

run('T4 max-offset admissible (endAt + W exact)', () => {
  const r: Receipt = { span: 1, closeAt: 200 + WHEELER_WINDOW_W, label: DoctrineLabel.L1 };
  assert.equal(admissible(span, r), true);
});

run('T5 early receipt rejected', () => {
  const r: Receipt = { span: 1, closeAt: 199, label: DoctrineLabel.L1 };
  assert.equal(admissible(span, r), false);
  assert.equal(closeLabel(span, r), DoctrineLabel.Bot);
});

run('T6 wrong span rejected', () => {
  const r: Receipt = { span: 2, closeAt: 200, label: DoctrineLabel.L1 };
  assert.equal(admissible(span, r), false);
});

run('determinism — same admissible inputs give same label', () => {
  const r1: Receipt = { span: 1, closeAt: 300, label: DoctrineLabel.L1 };
  const r2: Receipt = { span: 1, closeAt: 500, label: DoctrineLabel.L1 };
  assert.equal(closeLabel(span, r1), closeLabel(span, r2));
});

run('stream — last admissible wins', () => {
  const stream: Receipt[] = [
    { span: 1, closeAt: 250, label: DoctrineLabel.L1 },
    { span: 1, closeAt: 400, label: DoctrineLabel.L2 },
    { span: 1, closeAt: 600, label: DoctrineLabel.Top },
  ];
  assert.equal(closeStream(span, stream), DoctrineLabel.Top);
});

run('stream — non-admissible receipts ignored', () => {
  const stream: Receipt[] = [
    { span: 1, closeAt: 250, label: DoctrineLabel.L2 },
    { span: 1, closeAt: 50_000, label: DoctrineLabel.Top },
    { span: 2, closeAt: 400, label: DoctrineLabel.Top },
  ];
  assert.equal(closeStream(span, stream), DoctrineLabel.L2);
});

run('stream — empty', () => {
  assert.equal(closeStream(span, []), DoctrineLabel.Bot);
});

run('stream — all rejected', () => {
  const stream: Receipt[] = [
    { span: 9, closeAt: 200, label: DoctrineLabel.L1 },
    { span: 1, closeAt: 100, label: DoctrineLabel.Top },
  ];
  assert.equal(closeStream(span, stream), DoctrineLabel.Bot);
});

run('W = 1000 ticks (matches Lean constant)', () => {
  assert.equal(WHEELER_WINDOW_W, 1000);
});

run('admissible boundary — endAt+W is inclusive', () => {
  const r: Receipt = { span: 1, closeAt: 200 + WHEELER_WINDOW_W, label: DoctrineLabel.L1 };
  assert.ok(admissible(span, r));
});

run('admissible boundary — endAt+W+1 is exclusive', () => {
  const r: Receipt = { span: 1, closeAt: 200 + WHEELER_WINDOW_W + 1, label: DoctrineLabel.L1 };
  assert.ok(!admissible(span, r));
});

run('admissible boundary — endAt-1 is exclusive (no pre-cognition)', () => {
  const r: Receipt = { span: 1, closeAt: 199, label: DoctrineLabel.L1 };
  assert.ok(!admissible(span, r));
});

run('property — 1k random receipts inside window are all admissible', () => {
  const rng = mulberry32(0xC0FFEE);
  for (let i = 0; i < 1000; i += 1) {
    const dt = Math.floor(rng() * (WHEELER_WINDOW_W + 1));
    const r: Receipt = { span: 1, closeAt: 200 + dt, label: DoctrineLabel.L1 };
    assert.ok(admissible(span, r), `i=${i} dt=${dt}`);
  }
});

run('property — 1k random receipts outside window are all rejected', () => {
  const rng = mulberry32(0xBADF00D);
  for (let i = 0; i < 1000; i += 1) {
    const dt = WHEELER_WINDOW_W + 1 + Math.floor(rng() * 10_000);
    const r: Receipt = { span: 1, closeAt: 200 + dt, label: DoctrineLabel.L1 };
    assert.ok(!admissible(span, r), `i=${i} dt=${dt}`);
  }
});

run('property — closeStream is monotone in last admissible label', () => {
  const order = [DoctrineLabel.Bot, DoctrineLabel.L1, DoctrineLabel.L2, DoctrineLabel.Top];
  for (const lab of order) {
    const stream: Receipt[] = [
      { span: 1, closeAt: 250, label: lab },
    ];
    assert.equal(closeStream(span, stream), lab);
  }
});

// Mulberry32 PRNG — deterministic seeded RNG for property tests
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

console.log(process.exitCode === 1 ? '\nFAIL' : '\nall green (18 tests)');
