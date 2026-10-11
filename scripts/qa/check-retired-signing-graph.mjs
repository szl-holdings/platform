#!/usr/bin/env node
/** Source/lock policy only; not a vulnerability scan or installed-runtime proof. */
import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseDocument, visit } from 'yaml';

export const SECURE_OVERRIDES = Object.freeze({
  'shell-quote': '1.11.0',
  'proxy-addr': '2.0.8',
  'source-map-js': '1.2.2',
  compression: '1.8.2',
  '@modelcontextprotocol/sdk': '1.31.0',
  sharp: '0.35.5',
  undici: '>=6.28.1 <7',
  '@grpc/grpc-js': '>=1.14.5',
  'adm-zip': '>=0.6.1',
  dompurify: '3.4.16',
  'fast-copy': '4.1.2',
  'postcss-selector-parser': '7.1.6',
  '@opentelemetry/instrumentation-cassandra-driver': '0.66.0',
  '@opentelemetry/instrumentation-knex': '0.65.0',
  '@opentelemetry/instrumentation-mongoose': '0.67.0',
  '@opentelemetry/instrumentation-mysql2': '0.67.0',
  '@opentelemetry/instrumentation-mysql': '0.67.0',
  '@opentelemetry/instrumentation-oracledb': '0.46.0',
  '@opentelemetry/instrumentation-pg': '0.73.0',
  '@opentelemetry/instrumentation-tedious': '0.40.0',
  '@opentelemetry/core': '>=2.8.0',
  tar: '7.5.21',
});
const RETIRED =
  /(?:^|[^A-Za-z0-9_-])(?:node-forge|@expo\/cli|@expo\/code-signing-certificates)(?=$|[^A-Za-z0-9_/-])/;
const GROUPS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function requireMap(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a mapping`);
  }
  return value;
}

function parseSource(text, label, json = false) {
  if (typeof text !== 'string' || !text.trim() || Buffer.byteLength(text) > 4 * 1024 * 1024) {
    throw new Error(`${label} is empty, non-text, or oversized`);
  }
  if (json) JSON.parse(text);
  const doc = parseDocument(text, { uniqueKeys: true, strict: true, version: '1.2' });
  if (doc.errors.length || doc.warnings.length || doc.directives.yaml.version !== '1.2') {
    throw new Error(`${label} has invalid or unsupported YAML`);
  }
  visit(doc, {
    Alias() {
      throw new Error(`${label} aliases are unsupported`);
    },
    Node(_key, node) {
      if (node.anchor) throw new Error(`${label} anchors are unsupported`);
    },
  });
  return requireMap(doc.toJS({ maxAliasCount: 0 }), label);
}

function walk(value, action, path = '', budget = { remaining: 150000 }) {
  if (--budget.remaining < 0) throw new Error('graph exceeds traversal budget');
  if (typeof value === 'string') action(value, path);
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    action(key, `${path}/${key}`);
    walk(child, action, `${path}/${key}`, budget);
  }
}

function rejectRetired(value, label) {
  walk(value, (token, path) => {
    if (RETIRED.test(token))
      throw new Error(`${label}${path} reintroduces a retired signing package`);
  });
}

function compareVersion(actual, expected) {
  const a = actual.split('.').map(Number);
  const b = expected.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  return 0;
}

function requireVersion(name, reference) {
  const match = /^(\d+\.\d+\.\d+)(?:\(|$)/.exec(reference);
  if (!match) throw new Error(`${name} has an unsupported resolution: ${reference}`);
  const policy = SECURE_OVERRIDES[name];
  const minimum = /\d+\.\d+\.\d+/.exec(policy)[0];
  if (
    compareVersion(match[1], minimum) < 0 ||
    (!policy.startsWith('>=') && match[1] !== minimum) ||
    (name === 'undici' && Number(match[1].split('.')[0]) >= 7)
  ) {
    throw new Error(`${name} resolves outside its secure policy: ${reference}`);
  }
  return match[1];
}

export function validateRetiredSigningGraph({ workspaceText, lockText, manifests }) {
  const workspace = parseSource(workspaceText, 'workspace');
  const lock = parseSource(lockText, 'lockfile');
  if (
    !Array.isArray(workspace.packages) ||
    workspace.packages.length === 0 ||
    workspace.packages.some((pattern) => typeof pattern !== 'string' || !pattern)
  ) {
    throw new Error('workspace packages must be a nonempty string list');
  }
  if (String(lock.lockfileVersion) !== '9.0') throw new Error('unsupported lockfile version');
  requireMap(lock.settings, 'lockfile settings');
  const workspaceOverrides = requireMap(workspace.overrides, 'workspace overrides');
  const lockOverrides = requireMap(lock.overrides, 'lockfile overrides');
  const importers = requireMap(lock.importers, 'lockfile importers');
  const packages = requireMap(lock.packages, 'lockfile packages');
  const snapshots = requireMap(lock.snapshots, 'lockfile snapshots');
  for (const key of ['.', 'lib/mobile-shared', 'packages/braces-safe']) {
    requireMap(importers[key], `lockfile importer ${key}`);
  }
  if (Object.keys(packages).length === 0 || Object.keys(snapshots).length === 0) {
    throw new Error('lockfile package and snapshot graphs must be nonempty');
  }
  rejectRetired(workspace, 'workspace');
  rejectRetired(lock, 'lockfile');
  function requireLockedEdge(name, reference) {
    const version = requireVersion(name, reference);
    if (!Object.hasOwn(packages, `${name}@${version}`)) {
      throw new Error(`${name} edge has no actual locked node`);
    }
  }
  for (const [graphName, graph] of [
    ['packages', packages],
    ['snapshots', snapshots],
  ]) {
    for (const [key, value] of Object.entries(graph)) {
      requireMap(value, `${graphName}/${key}`);
      for (const group of ['dependencies', 'optionalDependencies'])
        if (value[group] !== undefined) {
          for (const [name, reference] of Object.entries(
            requireMap(value[group], `${key}/${group}`),
          )) {
            if (typeof reference !== 'string')
              throw new Error(`${key}/${name} has an invalid edge`);
            if (SECURE_OVERRIDES[name]) requireLockedEdge(name, reference);
          }
        }
    }
  }
  const lockedPolicyFamilies = [];
  const policyOnlyFamilies = [];
  for (const [name, policy] of Object.entries(SECURE_OVERRIDES)) {
    if (workspaceOverrides[name] !== policy || lockOverrides[name] !== policy) {
      throw new Error(`${name} must retain the canonical override ${policy}`);
    }
    let resolutions = 0;
    for (const graph of [packages, snapshots]) {
      for (const key of Object.keys(graph))
        if (key.startsWith(`${name}@`)) {
          requireVersion(name, key.slice(name.length + 1));
          resolutions++;
        }
    }
    (resolutions ? lockedPolicyFamilies : policyOnlyFamilies).push(name);
  }
  if (
    workspaceOverrides.braces !== 'link:packages/braces-safe' ||
    lockOverrides.braces !== 'link:packages/braces-safe'
  ) {
    throw new Error('braces must resolve to the maintained local braces-safe package');
  }
  walk(lock, (token, path) => {
    if (/\/braces$/.test(path) && token !== 'braces' && token !== 'link:packages/braces-safe') {
      throw new Error(`braces has a non-maintained lock edge at ${path}`);
    }
    if (/^braces@/.test(token)) throw new Error('registry braces resolution remains');
  });
  for (const [importer, entry] of Object.entries(importers)) {
    requireMap(entry, `importer ${importer}`);
    for (const group of GROUPS)
      if (entry[group] !== undefined) {
        for (const [name, edge] of Object.entries(
          requireMap(entry[group], `${importer}/${group}`),
        )) {
          requireMap(edge, `${importer}/${group}/${name}`);
          if (typeof edge.specifier !== 'string' || typeof edge.version !== 'string') {
            throw new Error(`${importer}/${name} has an invalid dependency edge`);
          }
          if (
            name === 'braces' &&
            (!edge.version.startsWith('link:') ||
              resolve(ROOT, importer, edge.version.slice(5)) !==
                resolve(ROOT, 'packages/braces-safe'))
          ) {
            throw new Error(`${importer}/braces must link to the maintained braces-safe package`);
          }
          if (SECURE_OVERRIDES[name]) requireLockedEdge(name, edge.version);
        }
      }
  }
  if (!Array.isArray(manifests) || !manifests.length) throw new Error('tracked manifests missing');
  const parsed = new Map();
  for (const manifest of manifests) {
    if (!manifest || typeof manifest.path !== 'string' || parsed.has(manifest.path)) {
      throw new Error('manifest identity is missing or duplicated');
    }
    const value = parseSource(manifest.text, manifest.path, true);
    if (value.name !== undefined) {
      if (typeof value.name !== 'string' || !value.name.trim() || value.name !== value.name.trim()) {
        throw new Error(`${manifest.path}/name must be a nonempty package name string`);
      }
      rejectRetired(value.name, `${manifest.path}/name`);
    }
    for (const group of GROUPS)
      if (value[group] !== undefined) {
        const dependencies = requireMap(value[group], `${manifest.path}/${group}`);
        for (const reference of Object.values(dependencies))
          if (typeof reference !== 'string') {
            throw new Error(`${manifest.path}/${group} contains a non-string declaration`);
          }
        rejectRetired(dependencies, manifest.path);
      }
    if (value.pnpm !== undefined)
      rejectRetired(requireMap(value.pnpm, `${manifest.path}/pnpm`), manifest.path);
    parsed.set(manifest.path, value);
  }
  const braces = parsed.get('packages/braces-safe/package.json');
  if (
    !parsed.has('package.json') ||
    !parsed.has('lib/mobile-shared/package.json') ||
    braces?.name !== '@szl-holdings/braces-safe' ||
    braces.version !== '0.2.0' ||
    braces.private !== true
  ) {
    throw new Error('canonical root/mobile/braces-safe manifest closure is missing');
  }
  return {
    evidenceClass: 'MEASURED',
    manifestCount: parsed.size,
    retirementContract: 'PASS',
    lockedPolicyFamilies,
    policyOnlyFamilies,
    vulnerabilityScan: 'NOT_RUN',
    installedCompatibility: 'NOT_RUN',
  };
}

export function inspectRepository(root = ROOT) {
  const paths = execFileSync('git', ['-C', root, 'ls-files', '-z', '--', '*package.json'], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
    .split('\0')
    .filter(Boolean);
  if (!paths.length || paths.length > 1000) throw new Error('tracked manifest inventory invalid');
  function read(path) {
    const full = resolve(root, path);
    const within = relative(root, full);
    const stat = lstatSync(full);
    if (
      within.startsWith('..') ||
      isAbsolute(within) ||
      stat.isSymbolicLink() ||
      !stat.isFile() ||
      stat.size > 4 * 1024 * 1024
    )
      throw new Error(`unsafe source ${path}`);
    return readFileSync(full, 'utf8');
  }
  return validateRetiredSigningGraph({
    workspaceText: read('pnpm-workspace.yaml'),
    lockText: read('pnpm-lock.yaml'),
    manifests: paths.map((path) => ({ path, text: read(path) })),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    process.stdout.write(`${JSON.stringify(inspectRepository())}\n`);
  } catch (error) {
    process.stderr.write(`[retired-signing-graph] BLOCKED: ${error.message}\n`);
    process.exitCode = 1;
  }
}
