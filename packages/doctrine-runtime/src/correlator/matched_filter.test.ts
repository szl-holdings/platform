import assert from 'node:assert/strict';
import {
  correlate,
  detect,
  energy,
  snrDb,
  DOCTRINE_TEMPLATE,
  Signal,
} from './matched_filter';

function run(name: string, fn: () => void) {
  try { fn(); console.log(`  ok    ${name}`); }
  catch (e) { console.error(`  FAIL  ${name}`); console.error(e); process.exitCode = 1; }
}

console.log('Matched filter — runtime parity with Lutar.Correlator');

run('correlation of matched signals equals energy', () => {
  assert.equal(correlate(DOCTRINE_TEMPLATE, DOCTRINE_TEMPLATE), 4);
});

run('energy of canonical template = 4', () => {
  assert.equal(energy(DOCTRINE_TEMPLATE), 4);
});

run('correlation with zero signal = 0', () => {
  assert.equal(correlate(DOCTRINE_TEMPLATE, [0, 0, 0, 0]), 0);
});

run('anti-correlation = -energy', () => {
  assert.equal(correlate(DOCTRINE_TEMPLATE, [-1, 1, -1, 1]), -4);
});

run('detection fires at threshold ≤ energy', () => {
  assert.equal(detect(DOCTRINE_TEMPLATE, DOCTRINE_TEMPLATE, 3), true);
  assert.equal(detect(DOCTRINE_TEMPLATE, DOCTRINE_TEMPLATE, 4), true);
});

run('detection rejects above energy', () => {
  assert.equal(detect(DOCTRINE_TEMPLATE, DOCTRINE_TEMPLATE, 5), false);
});

run('anti-correlated signal does not fire at threshold 0', () => {
  assert.equal(detect(DOCTRINE_TEMPLATE, [-1, 1, -1, 1], 0), false);
});

run('partial match (3/4) fires at threshold 1', () => {
  assert.equal(detect(DOCTRINE_TEMPLATE, [1, -1, 1, 1], 1), true);
});

run('length mismatch → correlation 0, no fire', () => {
  assert.equal(correlate(DOCTRINE_TEMPLATE, [1, -1]), 0);
});

run('SNR dB: 100 vs 1 → 20 dB', () => {
  assert.ok(Math.abs(snrDb(100, 1) - 20) < 1e-9);
});

run('SNR dB: 1 vs 1 → 0 dB', () => {
  assert.equal(snrDb(1, 1), 0);
});

run('SNR dB rejects zero noise', () => {
  assert.throws(() => snrDb(1, 0));
});

run('property: correlation is symmetric', () => {
  const a: Signal = [2, -1, 3, 0];
  const b: Signal = [1, 1, -1, 4];
  assert.equal(correlate(a, b), correlate(b, a));
});

run('property: energy is non-negative on integer signals', () => {
  for (const s of [[0], [1, 2, 3], [-5, 5], [1, -1, 1, -1]] as Signal[]) {
    assert.ok(energy(s) >= 0);
  }
});

run('P300 oddball: spike template detects spike, rejects baseline shift', () => {
  const tmpl: Signal = [0, 0, 1, 0];
  const hit: Signal = [0, 0, 1, 0];
  const miss: Signal = [0, 1, 0, 0];
  assert.equal(detect(tmpl, hit, 1), true);
  assert.equal(detect(tmpl, miss, 1), false);
});

run('Bell-Labs 300-baud analogy: correlation pulls a bit out of noise', () => {
  const bit1: Signal = [1, -1, 1, -1, 1, -1, 1, -1];
  const bit0: Signal = [-1, 1, -1, 1, -1, 1, -1, 1];
  const noisy: Signal = [1, -1, 1, 1, 1, -1, 1, -1]; // 7/8 match bit1
  assert.ok(correlate(bit1, noisy) > correlate(bit0, noisy));
});

console.log(process.exitCode === 1 ? '\nFAIL' : '\nall green (16 tests)');
