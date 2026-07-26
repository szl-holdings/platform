#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const PRE_PUSH_HOOK = `#!/usr/bin/env sh
# Brand drift guard -- runs on every git push.
# Fails the push if deprecated strings or stale metrics are found.
if [ ! -f node_modules/tsx/dist/cli.mjs ]; then
  echo "dependencies are not installed; run pnpm install before pushing" >&2
  exit 1
fi

echo "Running brand:check before push..."
node node_modules/tsx/dist/cli.mjs scripts/brand-check.ts

echo "Running brand:strings before push..."
BASE_REF="$(git merge-base HEAD origin/main 2>/dev/null || true)"
if [ -n "$BASE_REF" ]; then
  node node_modules/tsx/dist/cli.mjs scripts/check-banned-brand-strings.ts --changed-from "$BASE_REF"
else
  node node_modules/tsx/dist/cli.mjs scripts/check-banned-brand-strings.ts
fi

# OG card freshness -- skipped if python3 / Pillow are unavailable.
if command -v python3 >/dev/null 2>&1 && python3 -c "import PIL" >/dev/null 2>&1; then
  echo "Running qa:og before push..."
  python3 scripts/generate_og_cards.py --check
else
  echo "qa:og skipped (python3 + Pillow not available)"
fi
`;

function gitOutput(gitExecutable, cwd, args) {
  const result = spawnSync(gitExecutable, args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout.trim();
}

export function installHooks({
  cwd = process.cwd(),
  gitExecutable = process.env.GIT_EXECUTABLE ?? 'git',
  logger = console,
  fileSystem = { chmodSync, copyFileSync, mkdirSync, writeFileSync },
} = {}) {
  const repoRoot = gitOutput(gitExecutable, cwd, ['rev-parse', '--show-toplevel']);
  if (!repoRoot) {
    logger.log('setup-hooks: not a git repository, skipping hook installation');
    return { installed: false };
  }

  const configuredHooksPath = gitOutput(gitExecutable, cwd, [
    'config',
    '--path',
    '--get',
    'core.hooksPath',
  ]);
  if (configuredHooksPath) {
    const configuredDirectory = isAbsolute(configuredHooksPath)
      ? configuredHooksPath
      : resolve(cwd, configuredHooksPath);
    logger.log(`setup-hooks: preserving configured core.hooksPath at ${configuredDirectory}`);
    return {
      installed: false,
      hooksDirectory: configuredDirectory,
      reason: 'configured-hooks-path-preserved',
    };
  }

  const hooksPath = gitOutput(gitExecutable, cwd, ['rev-parse', '--git-path', 'hooks']);
  if (!hooksPath) {
    logger.log('setup-hooks: Git hooks directory is unavailable, skipping hook installation');
    return { installed: false };
  }

  const hooksDirectory = isAbsolute(hooksPath) ? hooksPath : resolve(cwd, hooksPath);
  try {
    fileSystem.mkdirSync(hooksDirectory, { recursive: true });

    const preCommit = resolve(hooksDirectory, 'pre-commit');
    const prePush = resolve(hooksDirectory, 'pre-push');
    fileSystem.copyFileSync(resolve(repoRoot, '.husky', 'pre-commit'), preCommit);
    fileSystem.writeFileSync(prePush, PRE_PUSH_HOOK, 'utf8');
    fileSystem.chmodSync(preCommit, 0o755);
    fileSystem.chmodSync(prePush, 0o755);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    logger.warn?.(
      `setup-hooks: hook installation unavailable at ${hooksDirectory}; continuing without local hooks (${detail})`,
    );
    return {
      installed: false,
      hooksDirectory,
      reason: 'hook-directory-unavailable',
    };
  }

  logger.log(`setup-hooks: hooks installed at ${hooksDirectory}`);
  return { installed: true, hooksDirectory };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  installHooks();
}
