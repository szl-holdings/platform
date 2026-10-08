#!/usr/bin/env node
/**
 * Deterministic CycloneDX SBOM generator.
 *
 * This script is intentionally inventory-only and network-free. Vulnerability
 * policy is enforced separately by generate-vuln-report.js using the package
 * manager's own `pnpm audit --audit-level=high` exit status. Keeping SBOM
 * generation independent from registry availability makes the artifact
 * reproducible while preserving a fail-closed vulnerability gate.
 */

import { createHash } from 'node:crypto';
import {
  closeSync,
  constants as fsConstants,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { parseDocument } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const OUTPUT_DIR = join(ROOT, 'security');
const SCHEMA_DIR = join(OUTPUT_DIR, 'schemas', 'cyclonedx');
const CYCLONEDX_SCHEMA_ID = 'http://cyclonedx.org/schema/bom-1.4.schema.json';
const UUID_URL_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
const SERIAL_NAME_PREFIX = 'https://github.com/szl-holdings/platform/security/sbom\n';
const SCHEMA_MANIFEST = [
  {
    filename: 'bom-1.4.schema.json',
    sha256: '51b79463558376e6397802cce4fd792037a941cda89f9a7cc0abd1b5cbeb67b7',
  },
  {
    filename: 'spdx.schema.json',
    sha256: '07e151d41d749e81b868634c8b2b39d65798f1db0356fd98c9591e953c9f24ea',
  },
  {
    filename: 'jsf-0.82.schema.json',
    sha256: 'a517f9e483e2252debd23d5c62edb72805b6d3932935a6ebb8196745052d2dc3',
  },
];

function fatal(message) {
  console.error(message);
  process.exit(1);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function compareStrings(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function uuidV5(name) {
  const namespace = Buffer.from(UUID_URL_NAMESPACE.replaceAll('-', ''), 'hex');
  const bytes = Buffer.from(
    createHash('sha1').update(namespace).update(name, 'utf8').digest().subarray(0, 16),
  );
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function loadOfficialSchema(filename, expectedDigest, schemaDir) {
  const schemaPath = join(schemaDir, filename);
  let raw;
  try {
    raw = readFileSync(schemaPath);
  } catch (error) {
    throw new Error(`Cannot read vendored CycloneDX schema ${filename}: ${error.message}`);
  }
  const observedDigest = sha256(raw);
  if (observedDigest !== expectedDigest) {
    throw new Error(
      `Vendored CycloneDX schema ${filename} failed SHA-256 verification ` +
        `(expected ${expectedDigest}, observed ${observedDigest})`,
    );
  }
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch (error) {
    throw new Error(`Vendored CycloneDX schema ${filename} is not valid JSON: ${error.message}`);
  }
}

export function validateSbom(sbom, { schemaDir = SCHEMA_DIR } = {}) {
  const schemas = Object.fromEntries(
    SCHEMA_MANIFEST.map(({ filename, sha256: expectedDigest }) => [
      filename,
      loadOfficialSchema(filename, expectedDigest, schemaDir),
    ]),
  );
  const ajv = new Ajv({
    allErrors: true,
    // The immutable official 1.4 schemas use several draft-07 patterns that
    // Ajv's optional schema-lint mode rejects even though draft-07 permits them.
    strict: false,
    // Draft-07 treats formats as annotations. These two official-schema formats
    // are not implemented by ajv-formats and are absent from generated SBOMs.
    formats: { 'idn-email': true, 'iri-reference': true },
  });
  addFormats(ajv);
  ajv.addSchema(schemas['spdx.schema.json']);
  ajv.addSchema(schemas['jsf-0.82.schema.json']);
  const validate = ajv.compile(schemas['bom-1.4.schema.json']);
  if (!validate(sbom)) {
    throw new Error(`CycloneDX 1.4 schema validation failed: ${ajv.errorsText(validate.errors)}`);
  }
  return sbom;
}

function parseStrictYamlObject(raw, label) {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new Error(`${label} must be nonempty YAML text`);
  }
  const document = parseDocument(raw, { uniqueKeys: true });
  const diagnostics = [...document.errors, ...document.warnings];
  if (diagnostics.length > 0) {
    throw new Error(
      `${label} is not unambiguous YAML (${diagnostics
        .map((error) => error.message.replaceAll('\n', ' '))
        .join('; ')})`,
    );
  }
  let value;
  try {
    value = document.toJS({ maxAliasCount: 0 });
  } catch (error) {
    throw new Error(`${label} must not contain YAML aliases (${error.message})`);
  }
  if (!isRecord(value)) throw new Error(`${label} must contain a top-level mapping`);
  return value;
}

function isExactSemver(value) {
  const match =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(
      value,
    );
  if (!match) return false;
  return !(match[4] ?? '')
    .split('.')
    .filter(Boolean)
    .some(
      (identifier) => /^\d+$/.test(identifier) && identifier.length > 1 && identifier[0] === '0',
    );
}

function parsePatchedPackageKey(key, label) {
  if (typeof key !== 'string' || key.trim() !== key) {
    throw new Error(`${label} must be an exact package@version key`);
  }
  const separator = key.lastIndexOf('@');
  const name = key.slice(0, separator);
  const version = key.slice(separator + 1);
  if (separator <= 0 || name.length === 0 || /\s|[()]/.test(name) || !isExactSemver(version)) {
    throw new Error(`${label} must be an exact package@semver key`);
  }
  return { name, version };
}

function isPathInside(parent, candidate) {
  const difference = relative(parent, candidate);
  return (
    difference.length > 0 &&
    difference !== '..' &&
    !difference.startsWith(`..${sep}`) &&
    !isAbsolute(difference)
  );
}

function validatePatchPath(relativePath, label) {
  if (
    typeof relativePath !== 'string' ||
    relativePath.length === 0 ||
    relativePath.includes('\\') ||
    !relativePath.startsWith('patches/') ||
    posix.normalize(relativePath) !== relativePath ||
    relativePath === 'patches/'
  ) {
    throw new Error(`${label} must be a normalized repository-relative POSIX path below patches/`);
  }
  return relativePath;
}

function digestRegularPatch(root, relativePath) {
  const rootReal = realpathSync(root);
  const patchesPath = resolve(rootReal, 'patches');
  const patchesStat = lstatSync(patchesPath);
  if (!patchesStat.isDirectory() || patchesStat.isSymbolicLink()) {
    throw new Error('repository patches/ must be a real directory, not a symbolic link');
  }
  const patchesReal = realpathSync(patchesPath);
  if (patchesReal !== patchesPath) {
    throw new Error('repository patches/ must not traverse symbolic links');
  }

  const candidatePath = resolve(rootReal, relativePath);
  if (!isPathInside(patchesReal, candidatePath)) {
    throw new Error('patch must remain below the normalized repository patches/ directory');
  }

  const descriptor = openSync(candidatePath, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0));
  try {
    const opened = fstatSync(descriptor);
    const candidateStat = lstatSync(candidatePath);
    const candidateReal = realpathSync(candidatePath);
    if (
      !opened.isFile() ||
      !candidateStat.isFile() ||
      candidateStat.isSymbolicLink() ||
      opened.dev !== candidateStat.dev ||
      opened.ino !== candidateStat.ino ||
      candidateReal !== candidatePath ||
      !isPathInside(patchesReal, candidateReal)
    ) {
      throw new Error(
        'opened patch must match a regular file below patches/ without symbolic links',
      );
    }
    const bytes = readFileSync(descriptor);
    const after = fstatSync(descriptor);
    if (
      after.size !== opened.size ||
      after.mtimeMs !== opened.mtimeMs ||
      after.ctimeMs !== opened.ctimeMs
    ) {
      throw new Error('patch changed while reading');
    }
    return createHash('sha256').update(bytes).digest('hex');
  } finally {
    closeSync(descriptor);
  }
}

function parseStrictJsonObject(raw, label) {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new Error(`${label} must be nonempty JSON text`);
  }
  let value;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  const document = parseDocument(raw, { schema: 'json', uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new Error(
      `${label} contains duplicate-key ambiguity (${document.errors
        .map((error) => error.message.replaceAll('\n', ' '))
        .join('; ')})`,
    );
  }
  if (!isRecord(value)) throw new Error(`${label} must contain a top-level object`);
  return value;
}

function validateWorkspaceImporter(importer) {
  if (importer === '.') return importer;
  if (
    typeof importer !== 'string' ||
    importer.length === 0 ||
    importer.includes('\\') ||
    posix.isAbsolute(importer) ||
    posix.normalize(importer) !== importer ||
    importer === '..' ||
    importer.startsWith('../')
  ) {
    throw new Error(
      `pnpm workspace importer must be a normalized repository-relative POSIX path: ${importer}`,
    );
  }
  return importer;
}

function readWorkspaceManifest(root, importer) {
  validateWorkspaceImporter(importer);
  const rootReal = realpathSync(root);
  const packageRoot = importer === '.' ? rootReal : resolve(rootReal, importer);
  if (importer !== '.' && !isPathInside(rootReal, packageRoot)) {
    throw new Error(`pnpm workspace importer escapes repository root: ${importer}`);
  }

  const packageRootStat = lstatSync(packageRoot);
  if (!packageRootStat.isDirectory() || packageRootStat.isSymbolicLink()) {
    throw new Error(`pnpm workspace importer must resolve to a real directory: ${importer}`);
  }
  const packageRootReal = realpathSync(packageRoot);
  if (packageRootReal !== packageRoot) {
    throw new Error(`pnpm workspace importer must not traverse symbolic links: ${importer}`);
  }

  const manifestPath = join(packageRoot, 'package.json');
  const descriptor = openSync(manifestPath, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0));
  let raw;
  try {
    const opened = fstatSync(descriptor);
    const manifestStat = lstatSync(manifestPath);
    if (
      !opened.isFile() ||
      !manifestStat.isFile() ||
      manifestStat.isSymbolicLink() ||
      opened.dev !== manifestStat.dev ||
      opened.ino !== manifestStat.ino ||
      realpathSync(manifestPath) !== manifestPath
    ) {
      throw new Error(
        `opened pnpm workspace manifest must match a regular file without symbolic links: ${importer}`,
      );
    }
    raw = readFileSync(descriptor, 'utf8');
    const after = fstatSync(descriptor);
    if (
      after.size !== opened.size ||
      after.mtimeMs !== opened.mtimeMs ||
      after.ctimeMs !== opened.ctimeMs
    ) {
      throw new Error(`pnpm workspace manifest changed while reading: ${importer}`);
    }
  } finally {
    closeSync(descriptor);
  }
  const manifest = parseStrictJsonObject(raw, `${importer}/package.json`);
  if (
    typeof manifest.name !== 'string' ||
    manifest.name.trim() !== manifest.name ||
    manifest.name.length === 0 ||
    /\s/.test(manifest.name)
  ) {
    throw new Error(`${importer}/package.json must declare one exact package name`);
  }
  if (typeof manifest.version !== 'string' || !isExactSemver(manifest.version)) {
    throw new Error(`${importer}/package.json must declare one exact semantic version`);
  }
  return { name: manifest.name, version: manifest.version };
}

function workspaceComponentType(importer) {
  const topLevel = importer.split('/', 1)[0];
  return ['apps', 'artifacts', 'services', 'workers'].includes(topLevel)
    ? 'application'
    : 'library';
}

/**
 * Resolve first-party component identity from the exact importers committed in
 * the lockfile. Importer paths, manifests, names, and versions are all treated
 * as provenance and therefore fail closed on ambiguity or symlink traversal.
 */
export function parseWorkspacePackages({ lockfileText, root = ROOT }) {
  const lockfile = parseStrictYamlObject(lockfileText, 'pnpm-lock.yaml');
  if (!isRecord(lockfile.importers)) {
    throw new Error('pnpm-lock.yaml importers must be a mapping');
  }
  if (!Object.hasOwn(lockfile.importers, '.')) {
    throw new Error('pnpm-lock.yaml importers must contain the root importer');
  }

  const subjectIdentity = readWorkspaceManifest(root, '.');
  const subject = {
    type: 'application',
    name: subjectIdentity.name,
    version: subjectIdentity.version,
    purl: npmPurl(subjectIdentity.name, subjectIdentity.version),
    properties: [{ name: 'szl:pnpm:workspace-importer', value: '.' }],
  };
  const components = [];
  const identities = new Map();
  for (const importer of Object.keys(lockfile.importers).sort(compareStrings)) {
    validateWorkspaceImporter(importer);
    if (!isRecord(lockfile.importers[importer])) {
      throw new Error(`pnpm-lock.yaml importer ${importer} must be a mapping`);
    }
    if (importer === '.') continue;

    const identity = readWorkspaceManifest(root, importer);
    const key = `${identity.name}@${identity.version}`;
    const prior = identities.get(key);
    if (prior) {
      throw new Error(
        `workspace package identity ${key} is ambiguous across importers ${prior} and ${importer}`,
      );
    }
    identities.set(key, importer);
    components.push({
      ...identity,
      importer,
      type: workspaceComponentType(importer),
    });
  }
  return { components, subject };
}

export function parseLockfileText(lockfileText) {
  const packages = {};
  const marker = lockfileText.indexOf('\npackages:');
  if (marker < 0) throw new Error('pnpm-lock.yaml is missing the packages section');
  const packagesStart = marker + '\npackages:'.length;
  const followingSection = lockfileText.slice(packagesStart).search(/^\S[^\n]*:/m);
  const packagesEnd = followingSection < 0 ? lockfileText.length : packagesStart + followingSection;
  const inPackagesSection = lockfileText.slice(packagesStart, packagesEnd);
  const pkgRegex = /^ {2}((?:'[^'\n]+'|"[^"\n]+"|[^\s'"\n][^:\n]*)):\s*$/gm;
  let match;
  while ((match = pkgRegex.exec(inPackagesSection)) !== null) {
    const packageKey = match[1].replace(/^(['"])(.*)\1$/, '$2');
    const canonicalKey = packageKey.split('(', 1)[0];
    const separator = canonicalKey.lastIndexOf('@');
    if (separator <= 0) continue;
    const name = canonicalKey.slice(0, separator).trim();
    const version = canonicalKey.slice(separator + 1).trim();
    if (!name || !version || version.includes(' ')) continue;
    if (!packages[name]) packages[name] = new Set();
    packages[name].add(version);
  }

  const result = {};
  for (const [name, versionSet] of Object.entries(packages)) {
    result[name] = Array.from(versionSet).sort();
  }
  return result;
}

export function parseLockfile(root = ROOT) {
  const lockfilePath = join(root, 'pnpm-lock.yaml');
  let lockfileText;
  try {
    lockfileText = readFileSync(lockfilePath, 'utf8');
  } catch (err) {
    throw new Error(`Cannot read pnpm-lock.yaml: ${err.message}`);
  }

  const packages = Object.fromEntries(
    Object.entries(parseLockfileText(lockfileText)).map(([name, versions]) => [
      name,
      new Set(versions),
    ]),
  );
  const workspace = parseWorkspacePackages({ lockfileText, root });
  for (const component of workspace.components) {
    if (!packages[component.name]) packages[component.name] = new Set();
    packages[component.name].add(component.version);
  }

  const result = {};
  for (const [name, versions] of Object.entries(packages)) {
    result[name] = Array.from(versions).sort();
  }
  return result;
}

/**
 * Correlate the human-owned pnpm patch registry with pnpm's locked hashes and
 * patched snapshot identities. The on-disk patch bytes are the final authority.
 */
export function parsePatchMetadata({ workspaceText, lockfileText, root = ROOT }) {
  const workspace = parseStrictYamlObject(workspaceText, 'pnpm-workspace.yaml');
  const lockfile = parseStrictYamlObject(lockfileText, 'pnpm-lock.yaml');
  const workspacePatches = workspace.patchedDependencies ?? {};
  const lockedPatches = lockfile.patchedDependencies ?? {};
  if (!isRecord(workspacePatches)) {
    throw new Error('pnpm-workspace.yaml patchedDependencies must be a mapping');
  }
  if (!isRecord(lockedPatches)) {
    throw new Error('pnpm-lock.yaml patchedDependencies must be a mapping');
  }
  if (!isRecord(lockfile.packages)) throw new Error('pnpm-lock.yaml packages must be a mapping');
  if (!isRecord(lockfile.snapshots)) {
    throw new Error('pnpm-lock.yaml snapshots must be a mapping');
  }

  const workspaceKeys = Object.keys(workspacePatches).sort();
  const lockedKeys = Object.keys(lockedPatches).sort();
  if (JSON.stringify(workspaceKeys) !== JSON.stringify(lockedKeys)) {
    throw new Error(
      'pnpm workspace and lockfile patchedDependencies must contain the exact same package keys',
    );
  }

  const inventory = parseLockfileText(lockfileText);
  const snapshotKeys = Object.keys(lockfile.snapshots);
  const patches = {};
  for (const key of workspaceKeys) {
    const { name, version } = parsePatchedPackageKey(key, `patchedDependencies.${key}`);
    const workspacePath = validatePatchPath(
      workspacePatches[key],
      `pnpm-workspace.yaml patchedDependencies.${key}`,
    );
    const lockedEntry = lockedPatches[key];
    if (!isRecord(lockedEntry)) {
      throw new Error(`pnpm-lock.yaml patchedDependencies.${key} must be a mapping`);
    }
    const fields = Object.keys(lockedEntry).sort();
    if (JSON.stringify(fields) !== JSON.stringify(['hash', 'path'])) {
      throw new Error(`pnpm-lock.yaml patchedDependencies.${key} must contain only hash and path`);
    }
    const lockedPath = validatePatchPath(
      lockedEntry.path,
      `pnpm-lock.yaml patchedDependencies.${key}.path`,
    );
    if (workspacePath !== lockedPath) {
      throw new Error(`${key}: workspace and lockfile patch paths do not match`);
    }
    if (typeof lockedEntry.hash !== 'string' || !/^[a-f0-9]{64}$/.test(lockedEntry.hash)) {
      throw new Error(`${key}: lockfile patch hash must be a lowercase SHA-256 digest`);
    }
    if (!inventory[name]?.includes(version)) {
      throw new Error(
        `${key}: patched package/version is absent from the lockfile packages inventory`,
      );
    }

    const matchingSnapshots = snapshotKeys.filter(
      (snapshotKey) => snapshotKey.split('(', 1)[0] === key,
    );
    if (matchingSnapshots.length === 0) {
      throw new Error(`${key}: lockfile contains no matching patched snapshot`);
    }
    for (const snapshotKey of matchingSnapshots) {
      const snapshotHashes = [...snapshotKey.matchAll(/\(patch_hash=([a-f0-9]+)\)/g)].map(
        (match) => match[1],
      );
      if (snapshotHashes.length !== 1 || snapshotHashes[0] !== lockedEntry.hash) {
        throw new Error(`${key}: snapshot patch_hash does not match the locked patch hash`);
      }
    }

    let observedHash;
    try {
      observedHash = digestRegularPatch(root, lockedPath);
    } catch (error) {
      throw new Error(`${key}: patch file validation failed (${error.message})`);
    }
    if (observedHash !== lockedEntry.hash) {
      throw new Error(
        `${key}: patch file SHA-256 does not match the lockfile (observed ${observedHash})`,
      );
    }

    patches[key] = {
      name,
      version,
      path: lockedPath,
      sha256: lockedEntry.hash,
    };
  }
  return patches;
}

function npmPurl(name, version) {
  const packageName = name.startsWith('@')
    ? `%40${name
        .slice(1)
        .split('/')
        .map((part) => encodeURIComponent(part))
        .join('/')}`
    : encodeURIComponent(name);
  return `pkg:npm/${packageName}@${encodeURIComponent(version)}`;
}

export function buildSbom(
  packages,
  patches = {},
  { subject = undefined, workspacePackages = [] } = {},
) {
  const components = [];
  const emittedComponents = new Set();
  const patchedComponents = new Set();
  const workspaceByIdentity = new Map();
  for (const workspacePackage of workspacePackages) {
    if (
      !isRecord(workspacePackage) ||
      typeof workspacePackage.name !== 'string' ||
      typeof workspacePackage.version !== 'string' ||
      typeof workspacePackage.importer !== 'string' ||
      !['application', 'library'].includes(workspacePackage.type)
    ) {
      throw new Error('workspace SBOM components must declare name, version, importer, and type');
    }
    const key = `${workspacePackage.name}@${workspacePackage.version}`;
    if (workspaceByIdentity.has(key)) {
      throw new Error(`workspace SBOM component identity is duplicated: ${key}`);
    }
    workspaceByIdentity.set(key, workspacePackage);
  }

  for (const [name, versions] of Object.entries(packages).sort(([a], [b]) =>
    compareStrings(a, b),
  )) {
    for (const version of [...versions].sort(compareStrings)) {
      const componentKey = `${name}@${version}`;
      const workspacePackage = workspaceByIdentity.get(componentKey);
      const component = {
        type: workspacePackage?.type ?? 'library',
        name,
        version,
        purl: npmPurl(name, version),
      };
      const properties = [];
      if (workspacePackage) {
        properties.push({
          name: 'szl:pnpm:workspace-importer',
          value: workspacePackage.importer,
        });
      }
      const patch = patches[componentKey];
      if (patch) {
        properties.push(
          { name: 'szl:pnpm:patch:path', value: patch.path },
          { name: 'szl:pnpm:patch:sha256', value: patch.sha256 },
        );
        patchedComponents.add(componentKey);
      }
      if (properties.length > 0) component.properties = properties;
      components.push(component);
      emittedComponents.add(componentKey);
    }
  }

  const patchKeys = Object.keys(patches).sort(compareStrings);
  const missingComponents = patchKeys.filter((key) => !patchedComponents.has(key));
  if (missingComponents.length > 0) {
    throw new Error(
      `SBOM inventory is missing patched component(s): ${missingComponents.join(', ')}`,
    );
  }
  const missingWorkspaceComponents = [...workspaceByIdentity.keys()]
    .filter((key) => !emittedComponents.has(key))
    .sort(compareStrings);
  if (missingWorkspaceComponents.length > 0) {
    throw new Error(
      `SBOM inventory is missing workspace component(s): ${missingWorkspaceComponents.join(', ')}`,
    );
  }

  const serialFreeBom = {
    $schema: CYCLONEDX_SCHEMA_ID,
    bomFormat: 'CycloneDX',
    specVersion: '1.4',
    version: 1,
    metadata: {
      tools: [{ vendor: 'SZL Holdings', name: 'generate-sbom.js', version: '3.4.0' }],
      ...(subject === undefined ? {} : { component: subject }),
      properties: [
        { name: 'szl:sbom:scan-status', value: 'inventory-only' },
        {
          name: 'szl:sbom:vulnerability-authority',
          value: 'pnpm audit --audit-level=high (separate blocking CI step)',
        },
        { name: 'szl:sbom:component-count', value: String(components.length) },
      ],
    },
    components,
  };
  const serialNumber = `urn:uuid:${uuidV5(`${SERIAL_NAME_PREFIX}${JSON.stringify(serialFreeBom)}`)}`;
  return {
    $schema: serialFreeBom.$schema,
    bomFormat: serialFreeBom.bomFormat,
    specVersion: serialFreeBom.specVersion,
    version: serialFreeBom.version,
    serialNumber,
    metadata: serialFreeBom.metadata,
    components: serialFreeBom.components,
  };
}

export function generateSbomArtifacts({
  root = ROOT,
  outputDir = join(root, 'security'),
  schemaDir = SCHEMA_DIR,
} = {}) {
  const historyDir = join(outputDir, 'sbom-history');
  const packages = parseLockfile(root);
  const workspaceText = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8');
  const lockfileText = readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8');
  const patches = parsePatchMetadata({ workspaceText, lockfileText, root });
  const workspace = parseWorkspacePackages({ lockfileText, root });
  const sbom = buildSbom(packages, patches, {
    subject: workspace.subject,
    workspacePackages: workspace.components,
  });
  validateSbom(sbom, { schemaDir });
  const rendered = `${JSON.stringify(sbom, null, 2)}\n`;
  const digest = sha256(rendered);
  const historyPath = join(historyDir, `sbom-${digest}.json`);
  const latestPath = join(outputDir, 'sbom-latest.json');

  mkdirSync(outputDir, { recursive: true });
  mkdirSync(historyDir, { recursive: true });
  try {
    writeFileSync(historyPath, rendered, { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const descriptor = openSync(historyPath, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0));
    try {
      const opened = fstatSync(descriptor);
      const current = lstatSync(historyPath);
      if (
        !opened.isFile() ||
        !current.isFile() ||
        current.isSymbolicLink() ||
        opened.dev !== current.dev ||
        opened.ino !== current.ino ||
        realpathSync(historyPath) !== resolve(historyPath)
      ) {
        throw new Error(`Content-addressed SBOM history must be a regular file: ${historyPath}`);
      }
      const existing = readFileSync(descriptor, 'utf8');
      const after = fstatSync(descriptor);
      if (
        existing !== rendered ||
        after.size !== opened.size ||
        after.mtimeMs !== opened.mtimeMs ||
        after.ctimeMs !== opened.ctimeMs
      ) {
        throw new Error(`Content-addressed SBOM history collision at ${historyPath}`);
      }
    } finally {
      closeSync(descriptor);
    }
  }
  writeFileSync(latestPath, rendered);

  return { digest, historyPath, latestPath, packages, patches, rendered, sbom, workspace };
}

async function main() {
  const { digest, patches, sbom } = generateSbomArtifacts();

  console.log(`SBOM generated: ${sbom.components.length} package components`);
  console.log(`Verified local patches: ${Object.keys(patches).length}`);
  console.log('Schema validation: official vendored CycloneDX 1.4 schemas');
  console.log(`SBOM SHA-256: ${digest}`);
  console.log('Vulnerability authority: pnpm audit --audit-level=high in generate-vuln-report.js');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => fatal(err.message));
}
