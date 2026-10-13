'use strict';

const fill = require('fill-range');
const stringify = require('./stringify');
const utils = require('./utils');

const append = (queue = '', stash = '', enclose = false) => {
  const result = [];

  queue = Array.isArray(queue) ? queue : [queue];
  stash = Array.isArray(stash) ? stash : [stash];

  if (!stash.length) return queue;
  if (!queue.length) {
    return enclose ? utils.flatten(stash).map((ele) => `{${ele}}`) : stash;
  }

  for (const item of queue) {
    if (Array.isArray(item)) {
      for (const value of item) {
        result.push(append(value, stash, enclose));
      }
    } else {
      for (let ele of stash) {
        if (enclose === true && typeof ele === 'string') ele = `{${ele}}`;
        result.push(Array.isArray(ele) ? append(item, ele, enclose) : item + ele);
      }
    }
  }
  return utils.flatten(result);
};

const expand = (ast, options = {}, maxDepth = utils.getMaxDepth(options)) => {
  maxDepth = utils.normalizeMaxDepth(maxDepth);
  utils.assertNestingDepth(ast, maxDepth);
  const budget = utils.createTraversalBudget();

  const rangeLimit = options.rangeLimit === undefined ? 1000 : options.rangeLimit;

  const unread = Symbol('unread children');
  const queues = new WeakMap();
  const walk = (
    node,
    parent = {},
    depth = 0,
    active = new WeakSet(),
    knownChildren = unread,
    knownType = unread,
    knownParentType = unread,
  ) => {
    if (active.has(node)) {
      throw new SyntaxError('AST contains a recursive node cycle');
    }
    const children = knownChildren === unread ? node.nodes : knownChildren;
    const hasChildren = Array.isArray(children);
    const length = hasChildren ? utils.getArrayLength(children, budget) : 0;
    const type = knownType === unread ? node.type : knownType;
    const nodeDepth = hasChildren ? (node === ast && type === 'root' ? depth : depth + 1) : depth;
    if (nodeDepth > maxDepth) {
      throw new SyntaxError(`AST nesting depth exceeds max depth (${maxDepth})`);
    }
    if (hasChildren) active.add(node);

    try {
      queues.set(node, []);
      const parentState =
        knownParentType === unread
          ? utils.findParentQueue(parent, maxDepth)
          : utils.findParentQueue(parent, maxDepth, knownParentType, true);
      const q = queues.get(parentState.node);

      if (node.invalid || node.dollar) {
        q.push(append(q.pop(), stringify(node, options, maxDepth)));
        return;
      }

      if (type === 'brace' && node.invalid !== true && length === 2) {
        q.push(append(q.pop(), ['{}']));
        return;
      }

      if (hasChildren && node.ranges > 0) {
        const args = utils.reduce(children, length, maxDepth, budget);

        if (utils.exceedsLimit(...args, options.step, rangeLimit)) {
          throw new RangeError(
            'expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.',
          );
        }

        let range = fill(...args, options);
        if (range.length === 0) {
          range = stringify(node, options, maxDepth);
        }

        q.push(append(q.pop(), range));
        node.nodes = [];
        return;
      }

      const enclose = utils.encloseBrace(node, type);
      const nodeState = utils.findParentQueue(node, maxDepth, type, true, active);
      const queue = queues.get(nodeState.node);
      if (!Array.isArray(queue)) {
        throw new SyntaxError('AST parent queue is not owned by the active traversal');
      }

      for (let i = 0; i < length; i++) {
        const child = children[i];
        if (active.has(child)) {
          throw new SyntaxError('AST contains a recursive node cycle');
        }
        const childType = child.type;

        if (childType === 'comma' && type === 'brace') {
          if (i === 1) queue.push('');
          queue.push('');
          continue;
        }

        if (childType === 'close') {
          q.push(append(q.pop(), queue, enclose));
          continue;
        }

        const childValue = child.value;
        if (childValue && childType !== 'open') {
          const safeValue = utils.snapshotValue(childValue, maxDepth, budget);
          queue.push(append(queue.pop(), safeValue));
          continue;
        }

        const childNodes = child.nodes;
        if (Array.isArray(childNodes)) {
          walk(child, node, nodeDepth, active, childNodes, childType, type);
        }
      }

      return queue;
    } finally {
      if (hasChildren) active.delete(node);
    }
  };

  return utils.flatten(walk(ast));
};

module.exports = expand;
