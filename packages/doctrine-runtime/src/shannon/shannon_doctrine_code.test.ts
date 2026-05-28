/**
 * shannon_doctrine_code.test.ts — Shannon runtime parity with
 * Lutar/Shannon/DoctrineEntropy.lean
 */

import assert from 'node:assert/strict';
import {
  DoctrineLabel,
  SHANNON_CODE,
  shannonEncode,
  shannonDecode,
  codewordLength,
  CODEWORD_BITS,
  channelRateBound,
  kraftSum,
} from './shannon_doctrine_code';

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

console.log('Shannon doctrine code — runtime parity with Lutar.Shannon');

run('alphabet has exactly 4 codewords', () => {
  assert.equal(Object.keys(SHANNON_CODE).length, 4);
});

run('codewords are 0..3', () => {
  assert.deepEqual(
    [DoctrineLabel.Bot, DoctrineLabel.L1, DoctrineLabel.L2, DoctrineLabel.Top].map(shannonEncode),
    [0, 1, 2, 3],
  );
});

run('round-trip Bot', () => {
  assert.equal(shannonDecode(shannonEncode(DoctrineLabel.Bot)), DoctrineLabel.Bot);
});

run('round-trip L1', () => {
  assert.equal(shannonDecode(shannonEncode(DoctrineLabel.L1)), DoctrineLabel.L1);
});

run('round-trip L2', () => {
  assert.equal(shannonDecode(shannonEncode(DoctrineLabel.L2)), DoctrineLabel.L2);
});

run('round-trip Top', () => {
  assert.equal(shannonDecode(shannonEncode(DoctrineLabel.Top)), DoctrineLabel.Top);
});

run('decode rejects invalid codeword 4', () => {
  assert.equal(shannonDecode(4), undefined);
});

run('decode rejects negative codeword', () => {
  assert.equal(shannonDecode(-1), undefined);
});

run('codeword length is constant 2', () => {
  for (const l of Object.values(DoctrineLabel)) {
    assert.equal(codewordLength(l), 2);
  }
});

run('CODEWORD_BITS = 2 (matches Lean constant)', () => {
  assert.equal(CODEWORD_BITS, 2);
});

run('Kraft sum = 1 (equality case)', () => {
  assert.equal(kraftSum(), 1);
});

run('channel rate bound 8 bps -> 4 receipts/s', () => {
  assert.equal(channelRateBound(8), 4);
});

run('channel rate bound 1 bps -> 0 receipts/s', () => {
  assert.equal(channelRateBound(1), 0);
});

run('channel rate bound 0 bps -> 0 receipts/s', () => {
  assert.equal(channelRateBound(0), 0);
});

run('channel rate bound rejects negative budget', () => {
  assert.throws(() => channelRateBound(-1));
});

run('channel rate bound rejects NaN', () => {
  assert.throws(() => channelRateBound(NaN));
});

run('property — round-trip preserves identity for all labels', () => {
  for (const l of Object.values(DoctrineLabel)) {
    assert.equal(shannonDecode(shannonEncode(l)), l);
  }
});

run('property — codewords are unique', () => {
  const seen = new Set<number>();
  for (const l of Object.values(DoctrineLabel)) {
    const c = shannonEncode(l);
    assert.ok(!seen.has(c), `codeword ${c} duplicated`);
    seen.add(c);
  }
  assert.equal(seen.size, 4);
});

run('integration — encoded labels deserialize from a byte stream', () => {
  const labels: DoctrineLabel[] = [
    DoctrineLabel.Bot,
    DoctrineLabel.L1,
    DoctrineLabel.Top,
    DoctrineLabel.L2,
    DoctrineLabel.Top,
  ];
  const stream = labels.map(shannonEncode);
  const decoded = stream.map(shannonDecode);
  assert.deepEqual(decoded, labels);
});

console.log(process.exitCode === 1 ? '\nFAIL' : '\nall green (18 tests)');
