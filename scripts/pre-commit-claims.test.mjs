import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const ROOT = resolve(import.meta.dirname, '..');

function runGit(cwd, args) {
  const result = spawnSync(process.env.GIT_EXECUTABLE ?? 'git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
  assert.equal(
    result.status,
    0,
    result.stderr || result.error?.message || `git ${args.join(' ')} failed`,
  );
  return result.stdout.trim();
}

test('the pre-commit claims trigger includes staged deletions', (t) => {
  const hook = readFileSync(join(ROOT, '.husky', 'pre-commit'), 'utf8');
  assert.match(hook, /STAGED_DOC_CLAIMS=\$\(git diff --cached --name-only --diff-filter=ACDMR /);

  const checkout = mkdtempSync(join(tmpdir(), 'szl-claims-delete-'));
  t.after(() => rmSync(checkout, { force: true, recursive: true }));
  mkdirSync(join(checkout, 'artifacts', 'api-server', 'src'), { recursive: true });
  const claimInput = join(checkout, 'artifacts', 'api-server', 'src', 'removed-route.ts');

  runGit(checkout, ['init']);
  writeFileSync(claimInput, 'export const removed = true;\n');
  runGit(checkout, ['add', '--', 'artifacts/api-server/src/removed-route.ts']);
  runGit(checkout, [
    '-c',
    'user.name=SZL Test',
    '-c',
    'user.email=szl-test@example.invalid',
    'commit',
    '-m',
    'fixture',
  ]);

  unlinkSync(claimInput);
  runGit(checkout, ['add', '-u']);
  const stagedClaims = runGit(checkout, ['diff', '--cached', '--name-only', '--diff-filter=ACDMR']);

  assert.equal(stagedClaims, 'artifacts/api-server/src/removed-route.ts');
});
