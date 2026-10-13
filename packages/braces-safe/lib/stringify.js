'use strict';

const utils = require('./utils');

module.exports = (ast, options = {}, maxDepth = utils.getMaxDepth(options)) => {
  maxDepth = utils.normalizeMaxDepth(maxDepth);
  utils.assertNestingDepth(ast, maxDepth);
  const budget = utils.createTraversalBudget();

  const stringify = (node, parent = {}, depth = 0, active = new WeakSet()) => {
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

    const invalidBlock = options.escapeInvalid && utils.isInvalidBrace(parent);
    const invalidNode = node.invalid === true && options.escapeInvalid === true;
    const value = utils.snapshotValue(node.value, maxDepth, budget);
    let output = '';

    try {
      if (value) {
        if ((invalidBlock || invalidNode) && utils.isOpenOrClose(node)) {
          return '\\' + value;
        }
        return value;
      }

      if (hasChildren) {
        for (let index = 0; index < length; index++) {
          const child = children[index];
          output += stringify(child, {}, nodeDepth, active);
        }
      }
      return output;
    } finally {
      if (hasChildren) active.delete(node);
    }
  };

  return stringify(ast);
};
