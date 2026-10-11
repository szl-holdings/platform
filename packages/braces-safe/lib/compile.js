'use strict';

const fill = require('fill-range');
const utils = require('./utils');

const compile = (ast, options = {}, maxDepth = utils.getMaxDepth(options)) => {
  maxDepth = utils.normalizeMaxDepth(maxDepth);
  utils.assertNestingDepth(ast, maxDepth);
  const budget = utils.createTraversalBudget();

  const walk = (node, parent = {}, depth = 0, active = new WeakSet()) => {
    if (active.has(node)) {
      throw new SyntaxError('AST contains a recursive node cycle');
    }
    const children = node.nodes;
    const hasChildren = Array.isArray(children);
    const length = hasChildren ? utils.getArrayLength(children, budget) : 0;
    const type = node.type;
    const nodeDepth = hasChildren ? (node === ast && type === 'root' ? depth : depth + 1) : depth;
    if (nodeDepth > maxDepth) {
      throw new SyntaxError(`AST nesting depth exceeds max depth (${maxDepth})`);
    }
    if (hasChildren) active.add(node);

    const invalidBlock = utils.isInvalidBrace(parent);
    const invalidNode = node.invalid === true && options.escapeInvalid === true;
    const invalid = invalidBlock === true || invalidNode === true;
    const prefix = options.escapeInvalid === true ? '\\' : '';
    const value = utils.snapshotValue(node.value, maxDepth, budget);
    let output = '';

    try {
      if (node.isOpen === true) {
        return prefix + value;
      }

      if (node.isClose === true) {
        console.log('node.isClose', prefix, value);
        return prefix + value;
      }

      if (type === 'open') {
        return invalid ? prefix + value : '(';
      }

      if (type === 'close') {
        return invalid ? prefix + value : ')';
      }

      if (type === 'comma') {
        return node.prev.type === 'comma' ? '' : invalid ? value : '|';
      }

      if (value) {
        return value;
      }

      if (hasChildren && node.ranges > 0) {
        const args = utils.reduce(children, length, maxDepth, budget);
        const range = fill(...args, { ...options, wrap: false, toRegex: true, strictZeros: true });

        if (range.length !== 0) {
          return args.length > 1 && range.length > 1 ? `(${range})` : range;
        }
      }

      if (hasChildren) {
        for (let index = 0; index < length; index++) {
          const child = children[index];
          output += walk(child, node, nodeDepth, active);
        }
      }

      return output;
    } finally {
      if (hasChildren) active.delete(node);
    }
  };

  return walk(ast);
};

module.exports = compile;
