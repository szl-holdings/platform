#!/usr/bin/env node
/** Supplemental presentation build witness; not a release or trusted-controller attestation. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const DIST_PATH = 'artifacts/a11oy/dist/public';
export const WITNESS_PATH = 'artifacts/a11oy/dist/cyber-boundary-build.json';
export const BUILD_ARGS = ['exec', 'turbo', 'run', 'build', '--filter=@workspace/a11oy...', '--env-mode=loose', '--force'];
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function sourceIdentity(root) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  if (path.resolve(git('rev-parse', '--show-toplevel')) !== path.resolve(root)) {
    throw new Error('run from the checkout root');
  }
  if (git('status', '--porcelain=v1', '--untracked-files=all')) {
    throw new Error('source checkout is not clean');
  }
  const source_sha = git('rev-parse', 'HEAD');
  const source_tree = git('rev-parse', 'HEAD^{tree}');
  if (![source_sha, source_tree].every(value => /^[0-9a-f]{40}$/.test(value))) {
    throw new Error('source identity is not an exact Git SHA');
  }
  return { source_sha, source_tree };
}

export async function outputIdentity(root) {
  const files = {};
  async function visit(directory, prefix = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute, relative);
      else if (entry.isFile()) files[relative] = sha256(await readFile(absolute));
      else throw new Error(`non-regular build output: ${relative}`);
    }
  }
  await visit(path.join(root, DIST_PATH));
  if (!files['index.html'] || !Object.keys(files).some(name => name.startsWith('assets/'))) {
    throw new Error('required built index/assets are missing');
  }
  return { files, manifest_sha256: sha256(JSON.stringify(files)) };
}

export async function verifyBuildWitness(root, witness) {
  const source = sourceIdentity(root);
  const output = await outputIdentity(root);
  if (witness?.schema !== 'szl.supplemental-cyber-build/v1' ||
      witness.scope !== 'source-presentation-only' || witness.base_path !== '/' ||
      witness.source_sha !== source.source_sha || witness.source_tree !== source.source_tree ||
      witness.build_command !== ['pnpm', ...BUILD_ARGS].join(' ') ||
      JSON.stringify(witness.output) !== JSON.stringify(output)) {
    throw new Error('build witness does not match current source, build contract, and output');
  }
  return witness;
}

export async function captureBuild(root, environment = process.env, runBuild) {
  const witnessPath = path.join(root, WITNESS_PATH);
  // A failed attempt must never leave a prior successful witness available.
  await rm(witnessPath, { force: true });
  const source = sourceIdentity(root);
  if (environment.GITHUB_SHA && environment.GITHUB_SHA !== source.source_sha) {
    throw new Error('checkout differs from the workflow source SHA');
  }
  if (environment.BASE_PATH !== '/' || Object.entries(environment).some(([key, value]) =>
    (key.startsWith('VITE_') && value !== '') || (key === 'SHARED_PROXY_PORT' && value !== ''))) {
    throw new Error('unexpected browser-build environment override');
  }
  for (const directory of [root, path.join(root, 'artifacts/a11oy')]) {
    for (const name of await readdir(directory)) {
      if (!/^\.env(?:\.|$)/.test(name)) continue;
      // Vite does not load example templates. Only a committed exact-name
      // template is permitted; sourceIdentity already checked its clean bytes.
      if (name === '.env.example') {
        const relative = path.relative(root, path.join(directory, name)).split(path.sep).join('/');
        const tracked = execFileSync('git', ['ls-files', '--', relative], { cwd: root, encoding: 'utf8' }).trim();
        if (tracked === relative) continue;
      }
      throw new Error('local environment file would make the build source-dependent');
    }
  }
  const started_at = new Date().toISOString();
  const runner = runBuild ?? (() => execFileSync('pnpm', BUILD_ARGS, {
    cwd: root, env: environment, stdio: 'inherit',
  }));
  await runner();
  const after = sourceIdentity(root);
  if (JSON.stringify(after) !== JSON.stringify(source)) throw new Error('source changed during build');
  const witness = {
    schema: 'szl.supplemental-cyber-build/v1', scope: 'source-presentation-only',
    ...source, started_at, completed_at: new Date().toISOString(),
    workflow_run_id: environment.GITHUB_RUN_ID ?? null,
    workflow_run_attempt: environment.GITHUB_RUN_ATTEMPT ?? null,
    build_command: ['pnpm', ...BUILD_ARGS].join(' '), base_path: '/',
    node_version: process.version, output: await outputIdentity(root),
  };
  await mkdir(path.dirname(witnessPath), { recursive: true });
  await writeFile(witnessPath, JSON.stringify(witness, null, 2) + '\n');
  return witness;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  captureBuild(process.cwd()).then(witness => {
    process.stdout.write(JSON.stringify({ source_sha: witness.source_sha, source_tree: witness.source_tree,
      manifest_sha256: witness.output.manifest_sha256, witness: WITNESS_PATH }) + '\n');
  }).catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = Number.isInteger(error.status) && error.status > 0 ? error.status : 1;
  });
}
