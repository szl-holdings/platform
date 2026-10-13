'use strict';

const MAX_DEPTH = 100;
const MAX_AST_ITEMS = 100000;

exports.MAX_AST_ITEMS = MAX_AST_ITEMS;

exports.createTraversalBudget = () => ({ remaining: MAX_AST_ITEMS });

exports.getArrayLength = (value, budget) => {
  const length = value.length;
  if (!Number.isSafeInteger(length) || length < 0 || length > MAX_AST_ITEMS) {
    throw new SyntaxError(`AST array item count exceeds safety limit (${MAX_AST_ITEMS})`);
  }
  if (budget !== undefined) {
    if (budget.remaining < length) {
      throw new SyntaxError(`AST array item count exceeds safety limit (${MAX_AST_ITEMS})`);
    }
    budget.remaining -= length;
  }
  return length;
};

/**
 * Resolve the recursive-AST ceiling exactly once per public operation. A
 * caller may choose a stricter limit, but cannot raise the safety ceiling.
 */

exports.normalizeMaxDepth = (value) => {
  return Number.isFinite(value) ? Math.max(0, Math.min(MAX_DEPTH, Math.trunc(value))) : MAX_DEPTH;
};

exports.getMaxDepth = (options) => {
  const value = options == null ? undefined : options.maxDepth;
  return exports.normalizeMaxDepth(value);
};

/**
 * Validate caller-provided ASTs without recursion before recursive walkers run.
 */

exports.snapshotValue = (value, maxDepth, budget = exports.createTraversalBudget()) => {
  if (!Array.isArray(value)) return value;

  const result = [];
  const active = new WeakSet([value]);
  const stack = [
    {
      source: value,
      target: result,
      depth: 1,
      index: 0,
      length: exports.getArrayLength(value, budget),
    },
  ];
  if (maxDepth < 1) {
    throw new SyntaxError(`AST value nesting depth exceeds max depth (${maxDepth})`);
  }

  while (stack.length > 0) {
    const entry = stack[stack.length - 1];
    if (entry.index >= entry.length) {
      active.delete(entry.source);
      stack.pop();
      continue;
    }

    const index = entry.index++;
    const element = entry.source[index];
    if (!Array.isArray(element)) {
      entry.target[index] = element;
      continue;
    }

    if (active.has(element)) {
      throw new SyntaxError('AST contains a recursive value array cycle');
    }
    const depth = entry.depth + 1;
    if (depth > maxDepth) {
      throw new SyntaxError(`AST value nesting depth exceeds max depth (${maxDepth})`);
    }

    const target = [];
    entry.target[index] = target;
    active.add(element);
    stack.push({
      source: element,
      target,
      depth,
      index: 0,
      length: exports.getArrayLength(element, budget),
    });
  }

  return result;
};

exports.assertValueNesting = (value, maxDepth, budget) => {
  exports.snapshotValue(value, maxDepth, budget);
};

exports.findParentQueue = (
  node,
  maxDepth,
  firstType,
  hasFirstType = false,
  allowed = undefined,
) => {
  const parents = new WeakSet();
  let current = node;
  let depth = 0;

  while (current !== null && typeof current === 'object') {
    if (allowed !== undefined && !allowed.has(current)) {
      throw new SyntaxError('AST parent chain leaves the active traversal');
    }
    if (parents.has(current)) {
      throw new SyntaxError('AST contains a recursive parent cycle');
    }
    parents.add(current);

    const type = hasFirstType ? firstType : current.type;
    hasFirstType = false;
    if (type === 'brace' || type === 'root') break;
    if (++depth > maxDepth) {
      throw new SyntaxError(`AST parent chain exceeds max depth (${maxDepth})`);
    }

    const parent = current.parent;
    if (parent === null || typeof parent !== 'object') break;
    current = parent;
  }

  return { node: current };
};

exports.assertNestingDepth = (ast, maxDepth) => {
  if (ast === null || typeof ast !== 'object') return;

  const active = new WeakSet();
  const budget = exports.createTraversalBudget();
  const stack = [{ node: ast, depth: 0, leave: false }];

  while (stack.length > 0) {
    const entry = stack.pop();
    const { node, depth, leave } = entry;

    if (leave) {
      active.delete(node);
      continue;
    }
    if (active.has(node)) {
      throw new SyntaxError('AST contains a recursive node cycle');
    }

    const parent = node.parent;
    exports.findParentQueue(parent, maxDepth);
    const children = node.nodes;
    const nestedValue = node.value;
    exports.assertValueNesting(nestedValue, maxDepth, budget);
    if (!Array.isArray(children)) continue;
    const length = exports.getArrayLength(children, budget);

    const type = node.type;
    const nodeDepth = node === ast && type === 'root' ? depth : depth + 1;
    if (nodeDepth > maxDepth) {
      throw new SyntaxError(`AST nesting depth exceeds max depth (${maxDepth})`);
    }

    active.add(node);
    stack.push({ node, depth: nodeDepth, leave: true });
    for (let index = length - 1; index >= 0; index--) {
      const child = children[index];
      if (child === null || typeof child !== 'object' || Array.isArray(child)) continue;
      stack.push({ node: child, depth: nodeDepth, leave: false });
    }
  }
};

exports.isInteger = (num) => {
  if (typeof num === 'number') {
    return Number.isInteger(num);
  }
  if (typeof num === 'string' && num.trim() !== '') {
    return Number.isInteger(Number(num));
  }
  return false;
};

/**
 * Find a node of the given type
 */

exports.find = (node, type) => node.nodes.find((node) => node.type === type);

/**
 * Find a node of the given type
 */

exports.exceedsLimit = (min, max, step = 1, limit) => {
  if (limit === false) return false;
  if (!exports.isInteger(min) || !exports.isInteger(max)) return false;
  return (Number(max) - Number(min)) / Number(step) >= limit;
};

/**
 * Escape the given node with '\\' before node.value
 */

exports.escapeNode = (block, n = 0, type) => {
  const node = block.nodes[n];
  if (!node) return;

  if ((type && node.type === type) || node.type === 'open' || node.type === 'close') {
    if (node.escaped !== true) {
      node.value = '\\' + node.value;
      node.escaped = true;
    }
  }
};

/**
 * Returns true if the given brace node should be enclosed in literal braces
 */

exports.encloseBrace = (node, type = node.type) => {
  if (type !== 'brace') return false;
  if ((node.commas >> (0 + node.ranges)) >> 0 === 0) {
    node.invalid = true;
    return true;
  }
  return false;
};

/**
 * Returns true if a brace node is invalid.
 */

exports.isInvalidBrace = (block) => {
  if (block.type !== 'brace') return false;
  if (block.invalid === true || block.dollar) return true;
  if ((block.commas >> (0 + block.ranges)) >> 0 === 0) {
    block.invalid = true;
    return true;
  }
  if (block.open !== true || block.close !== true) {
    block.invalid = true;
    return true;
  }
  return false;
};

/**
 * Returns true if a node is an open or close node
 */

exports.isOpenOrClose = (node) => {
  if (node.type === 'open' || node.type === 'close') {
    return true;
  }
  return node.open === true || node.close === true;
};

/**
 * Reduce an array of text nodes.
 */

exports.reduce = (
  nodes,
  length = exports.getArrayLength(nodes),
  maxDepth = MAX_DEPTH,
  budget = exports.createTraversalBudget(),
) => {
  const result = [];
  for (let index = 0; index < length; index++) {
    const node = nodes[index];
    const type = node.type;
    if (type === 'text') result.push(exports.snapshotValue(node.value, maxDepth, budget));
    if (type === 'range') node.type = 'text';
  }
  return result;
};

/**
 * Flatten an array
 */

exports.flatten = (...args) => {
  const result = [];
  const active = new WeakSet([args]);
  const stack = [{ array: args, index: 0, length: exports.getArrayLength(args) }];

  while (stack.length > 0) {
    const entry = stack[stack.length - 1];
    if (entry.index >= entry.length) {
      active.delete(entry.array);
      stack.pop();
      continue;
    }

    const element = entry.array[entry.index++];
    if (Array.isArray(element)) {
      if (active.has(element)) {
        throw new SyntaxError('AST contains a recursive value array cycle');
      }
      active.add(element);
      stack.push({
        array: element,
        index: 0,
        length: exports.getArrayLength(element),
      });
      continue;
    }
    if (element !== undefined) result.push(element);
  }
  return result;
};
