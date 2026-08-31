module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Keep titles conventional while allowing machine-generated evidence and
    // immutable source receipts to retain their exact body/footer formatting.
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'merge',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
      ],
    ],
  },
};
