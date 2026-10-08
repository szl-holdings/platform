'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const braces = require('..');
const compile = require('../lib/compile');
const expand = require('../lib/expand');
const stringify = require('../lib/stringify');

const nestedAst = (depth) => {
  let ast = { type: 'text', value: 'a' };
  for (let i = 0; i < depth; i++) {
    ast = { type: 'brace', nodes: [ast] };
  }
  return { type: 'root', nodes: [ast] };
};

const nestedPattern = (open, close, depth) => open.repeat(depth) + 'a,b' + close.repeat(depth);

test('published brace and parenthesis depth 100 remains accepted', () => {
  assert.doesNotThrow(() => braces.parse(nestedPattern('{', '}', 100)));
  assert.doesNotThrow(() => braces.parse('('.repeat(100) + 'a' + ')'.repeat(100)));
});

test('brace and parenthesis depth 101 is rejected before recursive processing', () => {
  assert.throws(() => braces.parse(nestedPattern('{', '}', 101)), /exceeds max depth/);
  assert.throws(() => braces.parse('('.repeat(101) + 'a' + ')'.repeat(101)), /exceeds max depth/);
});

test('all recursive AST walkers reject caller-supplied depth 101', () => {
  for (const operation of [compile, expand, stringify]) {
    assert.throws(() => operation(nestedAst(101)), /exceeds max depth/);
  }
});

test('caller maxDepth is stricter and fractional limits are enforced consistently', () => {
  assert.doesNotThrow(() => braces.parse('{a,b}', { maxDepth: 1.5 }));
  assert.throws(() => braces.parse('{{a,b},c}', { maxDepth: 1.5 }), /exceeds max depth/);
  assert.doesNotThrow(() => braces.parse('(a)', { maxDepth: 1.5 }));
  assert.throws(() => braces.parse('((a))', { maxDepth: 1.5 }), /exceeds max depth/);
  assert.throws(() => compile(nestedAst(2), { maxDepth: 1.5 }), /exceeds max depth/);
});

test('configured depths above the source-owned ceiling remain capped at 100', () => {
  assert.doesNotThrow(() => braces.parse(nestedPattern('{', '}', 100), { maxDepth: 10000 }));
  assert.throws(
    () => braces.parse(nestedPattern('{', '}', 101), { maxDepth: 10000 }),
    /exceeds max depth/,
  );
});

test('expand rejects cyclic parent chains instead of looping', () => {
  const self = { type: 'paren', nodes: [{ type: 'text', value: 'a' }] };
  self.parent = self;
  assert.throws(
    () => vm.runInNewContext('expand(ast)', { expand, ast: self }, { timeout: 250 }),
    (error) => error instanceof RangeError && /parent chain contains a cycle/.test(error.message),
  );

  const parent = { type: 'paren' };
  const child = { type: 'paren', parent, nodes: [{ type: 'text', value: 'a' }] };
  parent.parent = child;
  assert.throws(
    () => vm.runInNewContext('expand(ast)', { expand, ast: child }, { timeout: 250 }),
    (error) => error instanceof RangeError && /parent chain contains a cycle/.test(error.message),
  );
});

test('escapeInvalid output remains compatible with published 3.0.3 behavior', () => {
  for (const pattern of ['{{a}}', '{a,{b}}', '{{x}y}', '{a,{b,{c}}', '{}{a}', '{1..8}']) {
    assert.equal(braces.stringify(braces.parse(pattern), { escapeInvalid: true }), pattern);
  }
});

test('common compile and expansion behavior remains stable', () => {
  assert.equal(braces.compile('a/{b,c}/d'), 'a/(b|c)/d');
  assert.deepEqual(braces.expand('a/{b,c}/d'), ['a/b/d', 'a/c/d']);
  assert.deepEqual(braces('{a,b,c}', { expand: true }), ['a', 'b', 'c']);
  assert.deepEqual(braces(['x/{1..3}', 'y/{a,b}'], { expand: true }), [
    'x/1',
    'x/2',
    'x/3',
    'y/a',
    'y/b',
  ]);
});
