module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Keep merge-from-main reconciliation commits conventional without
    // rewriting already-published, DCO-signed branch history.
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
