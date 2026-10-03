import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const provenance = JSON.parse(
  readFileSync(join(root, 'audit/node-forge-backport-20261003.json'), 'utf8'),
);

export function assertForgeBytes(
  packageRoot,
  expectedHash = provenance.node_forge.installed_patched_rsa_sha256,
) {
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  assert.equal(manifest.name, 'node-forge');
  assert.equal(manifest.version, '1.4.0');
  assert.equal(manifest.license, '(BSD-3-Clause OR GPL-2.0)');
  const bytes = readFileSync(join(packageRoot, 'lib/rsa.js'));
  const actual = createHash('sha256').update(bytes).digest('hex');
  assert.equal(actual, expectedHash, 'Installed RSA bytes must match the pinned source');
  return actual;
}

export function loadConsumerPackages() {
  const fixtureRoot = process.env.NODE_FORGE_BACKPORT_FIXTURE_ROOT;
  assert.ok(!(process.env.CI && fixtureRoot), 'CI must inspect the workspace Expo consumers');
  let consumerRequire;
  let scope;
  if (fixtureRoot) {
    consumerRequire = createRequire(join(resolve(fixtureRoot), 'package.json'));
    scope = 'isolated pnpm fixture; workspace CLI binding UNKNOWN';
  } else {
    const mobileRequire = createRequire(join(root, 'lib/mobile-shared/package.json'));
    const expoRequire = createRequire(mobileRequire.resolve('expo/package.json'));
    consumerRequire = createRequire(expoRequire.resolve('@expo/cli/package.json'));
    scope = 'workspace Expo CLI and certificate transitive dependencies';
  }
  const forgeRoot = dirname(consumerRequire.resolve('node-forge/package.json'));
  const certificateRoot = dirname(
    consumerRequire.resolve('@expo/code-signing-certificates/package.json'),
  );
  const certificateRequire = createRequire(join(certificateRoot, 'package.json'));
  const certificateForgeRoot = dirname(certificateRequire.resolve('node-forge/package.json'));
  assertForgeBytes(forgeRoot);
  assertForgeBytes(certificateForgeRoot);
  const certificateManifest = JSON.parse(
    readFileSync(join(certificateRoot, 'package.json'), 'utf8'),
  );
  assert.equal(certificateManifest.name, provenance.expo_certificates.name);
  assert.equal(certificateManifest.version, provenance.expo_certificates.version);
  assert.equal(certificateManifest.license, 'MIT');
  return {
    forge: consumerRequire('node-forge'),
    certificates: consumerRequire('@expo/code-signing-certificates'),
    forgeRoot,
    certificateForgeRoot,
    scope,
  };
}

export function assertPatchBinding() {
  const bytes = readFileSync(join(root, provenance.patch.path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), provenance.patch.sha256);
  const workspace = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8');
  assert.match(
    workspace,
    /patchedDependencies:\s*\n\s+node-forge@1\.4\.0: patches\/node-forge@1\.4\.0\.patch/,
  );
  const lock = readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8');
  assert.ok(lock.includes(`hash: ${provenance.patch.sha256}`));
  assert.ok(lock.includes(provenance.node_forge.registry_integrity));
  assert.equal((lock.match(/node-forge: 1\.4\.0\(patch_hash=/g) || []).length, 2);
}
