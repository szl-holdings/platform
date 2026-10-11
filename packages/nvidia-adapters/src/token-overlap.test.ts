import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { scoreLocalAdapterCase } from './token-overlap.ts';

test('a missing token-overlap reference does not pass', () => {
  const missing = scoreLocalAdapterCase('any output', {}, 'token_jaccard');
  assert.equal(missing.passed, false);
  assert.equal(missing.score, 0);
  assert.equal(missing.method, 'unevaluable');

  const blank = scoreLocalAdapterCase('any output', { expectedOutput: '   ' }, 'token_jaccard');
  assert.equal(blank.method, 'unevaluable');
  assert.equal(blank.passed, false);
});

test('keyword and exact strategies reject a missing reference', () => {
  const keywords = scoreLocalAdapterCase('alpha', { expectedKeywords: [] }, 'keyword_match');
  assert.equal(keywords.passed, false);
  assert.equal(keywords.method, 'unevaluable');

  const exact = scoreLocalAdapterCase('', {}, 'exact_match');
  assert.equal(exact.passed, false);
  assert.equal(exact.method, 'unevaluable');
});

test('declared references still score as keyword, exact, or token overlap', () => {
  const keywords = scoreLocalAdapterCase('Alpha beta', { expectedKeywords: ['alpha'] }, 'keyword_match');
  assert.equal(keywords.passed, true);
  assert.equal(keywords.method, 'keyword_match');

  const exact = scoreLocalAdapterCase(' same ', { expectedOutput: 'same' }, 'exact_match');
  assert.equal(exact.passed, true);
  assert.equal(exact.score, 1);

  const overlap = scoreLocalAdapterCase('beta alpha', { expectedOutput: 'alpha beta' }, 'token_jaccard');
  assert.equal(overlap.method, 'token_jaccard');
  assert.equal(overlap.score, 1);
  assert.equal(overlap.passed, true);

  const low = scoreLocalAdapterCase('unrelated', { expectedOutput: 'alpha beta gamma' }, 'token_jaccard');
  assert.equal(low.passed, false);
  assert.match(low.failureReason ?? '', /Token overlap/);
});

test('the adapter source does not name this scorer as an LLM judge', () => {
  const hooks = readFileSync(new URL('./nemo-hooks.ts', import.meta.url), 'utf8');
  const scorer = readFileSync(new URL('./token-overlap.ts', import.meta.url), 'utf8');
  assert.equal(hooks.includes('llm_judge'), false);
  assert.equal(hooks.includes('semantic_similarity'), false);
  assert.equal(hooks.includes('Low semantic similarity'), false);
  assert.equal(scorer.includes('token_jaccard'), true);
  assert.equal(scorer.includes('not an LLM judge'), true);
});
