#!/usr/bin/env node
/**
 * Fail-closed dependency vulnerability report.
 *
 * Security authority is the parsed package-manager audit result. Unmitigated
 * High/Critical advisories block promotion. A local patch is admitted only when
 * its advisory, package version, pnpm registration, SHA-256, behavior test, and
 * expiry are all explicit. Moderate/Low findings remain visible but do not
 * masquerade as High/Critical failures merely because a package-manager version
 * returns a non-zero exit status for lower severities.
 *
 * We still fail closed when pnpm cannot execute, emits no parseable JSON, or
 * returns an unsupported audit schema. This keeps registry/network/parser
 * failures blocking without weakening the intended High/Critical policy.
 */

import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync,
  constants as fsConstants,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseDocument, parse as parseYaml } from 'yaml';

import { writePreflightFailureReport } from './write-vuln-preflight-report.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const OUTPUT_DIR = join(ROOT, 'security');
const OUTPUT_FILE = join(OUTPUT_DIR, 'vuln-report.md');
const MITIGATIONS_FILE = join(OUTPUT_DIR, 'vulnerability-mitigations.json');
const SEVERITIES = ['critical', 'high', 'moderate', 'low'];
const AUDIT_SEVERITIES = [...SEVERITIES, 'info'];
const BLOCKING_SEVERITIES = new Set(['critical', 'high']);
const DAY_MS = 24 * 60 * 60 * 1000;
export const AUDIT_TIMEOUT_MS = 120_000;
export const BEHAVIOR_TIMEOUT_MS = 30_000;
export const PNPM_VERSION_TIMEOUT_MS = 10_000;
export const MAX_MITIGATION_LIFETIME_DAYS = 30;

const DEPENDENCY_PATCH_TEST_FILE = 'scripts/qa/dependency-patches.test.mjs';

/**
 * The repository, rather than the mitigation manifest, owns executable
 * behavior checks. Manifest entries may select only one of these exact IDs;
 * no command or argument is ever read from JSON.
 */
export const MITIGATION_BEHAVIOR_REGISTRY = Object.freeze({
  'dependency-patches/node-forge-digestalgorithm-v1': Object.freeze({
    advisory: 'GHSA-86w9-cpqp-85rv',
    package: 'node-forge',
    version: '1.4.0',
    testFile: DEPENDENCY_PATCH_TEST_FILE,
    testNames: Object.freeze([
      'node-forge patch rejects nested DigestAlgorithm garbage',
      'node-forge patch accepts standards-compatible DER and rejects noncanonical encodings',
    ]),
  }),
  'dependency-patches/braces-recursive-nesting-v1': Object.freeze({
    advisory: 'GHSA-vfj7-8cjw-p6xm',
    package: 'braces',
    version: '3.0.3',
    testFile: DEPENDENCY_PATCH_TEST_FILE,
    testNames: Object.freeze([
      'braces patch rejects excessive recursive AST nesting',
      'braces patch enforces custom depth with a single stateful option read',
      'braces patch gates direct AST inputs before every recursive walker',
      'braces patch rejects deeply nested and cyclic value arrays',
      'braces patch rejects cyclic and excessive parent chains',
      'braces patch rejects excessive AST breadth without iteration',
      'braces patch resists stateful AST getters during actual traversal',
      'braces patch rejects untrusted recursive parent queues',
      'braces patch ignores concat-spreadable non-array values',
      'braces patch snapshots stateful range values',
    ]),
  }),
});

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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

/** Require one exact pnpm semantic version, never a tag, range, or alternate manager. */
export function parsePinnedPnpmVersion(packageJson) {
  if (!isRecord(packageJson) || typeof packageJson.packageManager !== 'string') {
    throw new Error('package.json packageManager must be an exact pnpm@semver string');
  }
  const match = /^pnpm@(.+)$/.exec(packageJson.packageManager);
  if (!match || !isExactSemver(match[1])) {
    throw new Error('package.json packageManager must be an exact pnpm@semver string');
  }
  return match[1];
}

/**
 * Attest the bare pnpm executable that will subsequently run the audit. The
 * same spawn implementation and command name are deliberately used for both
 * calls, so PATH resolution cannot silently select a different manager by
 * code path.
 */
export function runPnpmAuditWithVersionAttestation(
  packageJson,
  {
    root = ROOT,
    spawn = spawnSync,
    versionTimeout = PNPM_VERSION_TIMEOUT_MS,
    auditTimeout = AUDIT_TIMEOUT_MS,
  } = {},
) {
  let expected = null;
  try {
    expected = parsePinnedPnpmVersion(packageJson);
  } catch (error) {
    return {
      version: { expected, observed: null, error: error.message },
      audit: null,
    };
  }

  const versionCheck = spawn('pnpm', ['--version'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024,
    timeout: versionTimeout,
    killSignal: 'SIGKILL',
  });
  const observedOutput = String(versionCheck?.stdout ?? '').trim();
  const observed = isExactSemver(observedOutput) ? observedOutput : null;
  let versionError = null;
  if (versionCheck?.error) {
    versionError = versionCheck.error.message ?? String(versionCheck.error);
  } else if (versionCheck?.signal) {
    versionError = `pnpm --version terminated by ${versionCheck.signal}`;
  } else if (!Number.isSafeInteger(versionCheck?.status)) {
    versionError = 'pnpm --version did not report an exit status';
  } else if (versionCheck.status !== 0) {
    versionError = `pnpm --version returned exit status ${versionCheck.status}`;
  } else if (!observed) {
    versionError = 'pnpm --version did not emit one exact semantic version';
  } else if (observed !== expected) {
    versionError = `pnpm version mismatch: expected ${expected}, observed ${observed}`;
  }

  const version = {
    expected,
    observed: observed ?? (observedOutput.slice(0, 200) || null),
    error: versionError,
  };
  if (versionError) return { version, audit: null };

  const audit = spawn('pnpm', ['audit', '--json', '--audit-level=high'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: auditTimeout,
    killSignal: 'SIGKILL',
  });
  return { version, audit };
}

function parseStrictJson(rawOutput, label, emptyMessage) {
  if (!rawOutput || !rawOutput.trim()) throw new Error(emptyMessage);
  let value;
  try {
    value = JSON.parse(rawOutput);
  } catch (err) {
    throw new Error(`Failed to parse ${label}: ${err.message}`);
  }
  const duplicateCheck = parseDocument(rawOutput, { schema: 'json', uniqueKeys: true });
  if (duplicateCheck.errors.length > 0) {
    throw new Error(
      `Failed to parse ${label}: duplicate-key ambiguity (${duplicateCheck.errors
        .map((error) => error.message.replaceAll('\n', ' '))
        .join('; ')})`,
    );
  }
  return value;
}

export function parseAuditJson(rawOutput, fallback = 'pnpm audit produced no JSON output') {
  return parseStrictJson(rawOutput, 'pnpm audit JSON', fallback);
}

function emptyCounts() {
  return { critical: 0, high: 0, moderate: 0, low: 0 };
}

function parseCount(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer`);
  }
  return value;
}

function auditMetadata(value, observedCounts) {
  if (!isRecord(value)) throw new Error('pnpm audit metadata must be an object');
  if (!isRecord(value.vulnerabilities)) {
    throw new Error('pnpm audit metadata.vulnerabilities must be an object');
  }
  const counts = emptyCounts();
  for (const severity of SEVERITIES) {
    counts[severity] = parseCount(
      value.vulnerabilities[severity],
      `pnpm audit metadata.vulnerabilities.${severity}`,
    );
    if (
      (BLOCKING_SEVERITIES.has(severity) && counts[severity] !== observedCounts[severity]) ||
      counts[severity] < observedCounts[severity]
    ) {
      throw new Error(
        `pnpm audit ${severity} summary count ${counts[severity]} does not match ${observedCounts[severity]} parsed finding(s)`,
      );
    }
  }
  if (value.vulnerabilities.info !== undefined) {
    const info = parseCount(value.vulnerabilities.info, 'pnpm audit metadata.vulnerabilities.info');
    if (info < observedCounts.info) {
      throw new Error(
        `pnpm audit info summary count ${info} is below ${observedCounts.info} parsed finding(s)`,
      );
    }
  } else if (observedCounts.info > 0) {
    throw new Error('pnpm audit metadata is missing a non-zero info count');
  }
  return {
    counts,
    totalDependencies: parseCount(value.totalDependencies, 'pnpm audit metadata.totalDependencies'),
  };
}

function validateLegacyAdvisory(advisory, key) {
  if (!isRecord(advisory)) throw new Error(`pnpm audit advisory ${key} must be an object`);
  const severity = String(advisory.severity ?? '').toLowerCase();
  if (!AUDIT_SEVERITIES.includes(severity)) {
    throw new Error(`pnpm audit advisory ${key} has an unsupported severity`);
  }
  if (typeof advisory.module_name !== 'string' || advisory.module_name.trim().length === 0) {
    throw new Error(`pnpm audit advisory ${key} is missing module_name`);
  }
  if (!Array.isArray(advisory.findings) || advisory.findings.length === 0) {
    throw new Error(`pnpm audit advisory ${key} must contain at least one finding`);
  }
  for (const [index, finding] of advisory.findings.entries()) {
    if (!isRecord(finding) || typeof finding.version !== 'string' || !finding.version.trim()) {
      throw new Error(`pnpm audit advisory ${key} finding ${index} is missing a version`);
    }
  }
  const id = advisory.github_advisory_id ?? advisory.id ?? key;
  if ((typeof id !== 'string' && typeof id !== 'number') || String(id).trim().length === 0) {
    throw new Error(`pnpm audit advisory ${key} is missing an identifier`);
  }
  return { id: String(id), severity };
}

function legacyFindingFingerprint(advisory, { id, severity, sourceKey }) {
  const records = [];
  for (const [findingIndex, finding] of advisory.findings.entries()) {
    const paths = finding.paths === undefined ? [''] : finding.paths;
    if (!Array.isArray(paths) || paths.length === 0) {
      throw new Error(
        `pnpm audit advisory ${sourceKey} finding ${findingIndex} paths must be a non-empty array`,
      );
    }
    for (const [pathIndex, findingPath] of paths.entries()) {
      if (typeof findingPath !== 'string') {
        throw new Error(
          `pnpm audit advisory ${sourceKey} finding ${findingIndex} path ${pathIndex} must be a string`,
        );
      }
      records.push([finding.version, findingPath]);
    }
  }
  records.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return JSON.stringify([id, advisory.module_name, severity, records]);
}

function fromLegacyAdvisoryMap(map, metadata) {
  const advisories = {};
  const fingerprints = new Map();
  const observedCounts = { ...emptyCounts(), info: 0 };
  for (const [key, advisory] of Object.entries(map)) {
    const { id, severity } = validateLegacyAdvisory(advisory, key);
    const fingerprint = legacyFindingFingerprint(advisory, { id, severity, sourceKey: key });
    if (fingerprints.has(fingerprint)) {
      throw new Error(
        `pnpm audit contains duplicate advisory record ${id} for ${advisory.module_name}`,
      );
    }
    fingerprints.set(fingerprint, key);
    const recordKey = `legacy:${JSON.stringify([id, advisory.module_name, key])}`;
    advisories[recordKey] = { ...advisory, audit_source_key: key };
    observedCounts[severity] += 1;
  }
  const parsedMetadata = auditMetadata(metadata, observedCounts);
  return {
    advisories,
    vulnerabilities: parsedMetadata.counts,
    totalDependencies: parsedMetadata.totalDependencies,
    sourceShape: 'legacy-advisories',
  };
}

function fromNpmVulnerabilities(map, metadata) {
  const advisories = {};
  const fingerprints = new Set();
  const observedCounts = { ...emptyCounts(), info: 0 };
  for (const [key, advisory] of Object.entries(map)) {
    if (!isRecord(advisory)) {
      throw new Error(`pnpm audit vulnerability ${key} must be an object`);
    }
    const severity = String(advisory.severity ?? '').toLowerCase();
    if (!AUDIT_SEVERITIES.includes(severity)) {
      throw new Error(`pnpm audit vulnerability ${key} has an unsupported severity`);
    }
    const packageName = advisory.name ?? key;
    if (typeof packageName !== 'string' || packageName.trim().length === 0) {
      throw new Error(`pnpm audit vulnerability ${key} is missing a package name`);
    }
    if (typeof advisory.range !== 'string' || advisory.range.trim().length === 0) {
      throw new Error(`pnpm audit vulnerability ${key} is missing a vulnerable range`);
    }
    const id = String(advisory.github_advisory_id ?? advisory.id ?? key);
    const fingerprint = JSON.stringify([id, packageName, severity, advisory.range]);
    if (fingerprints.has(fingerprint)) {
      throw new Error(
        `pnpm audit contains duplicate vulnerability record ${id} for ${packageName}`,
      );
    }
    fingerprints.add(fingerprint);
    const recordKey = `npm:${JSON.stringify([id, packageName, key])}`;
    advisories[recordKey] = { ...advisory, module_name: packageName, audit_source_key: key };
    observedCounts[severity] += 1;
  }
  const parsedMetadata = auditMetadata(metadata, observedCounts);
  return {
    advisories,
    vulnerabilities: parsedMetadata.counts,
    totalDependencies: parsedMetadata.totalDependencies,
    sourceShape: 'npm-vulnerabilities',
  };
}

export function normalizeAuditJson(value) {
  if (!isRecord(value)) throw new Error('pnpm audit JSON must be an object');

  const hasLegacy = Object.hasOwn(value, 'advisories');
  const hasNpmV7 = Object.hasOwn(value, 'vulnerabilities');
  if (hasLegacy === hasNpmV7) {
    throw new Error('unsupported or ambiguous pnpm audit JSON shape');
  }
  if (!isRecord(value.metadata)) throw new Error('pnpm audit JSON is missing metadata');
  if (hasLegacy) {
    if (!isRecord(value.advisories)) throw new Error('pnpm audit advisories must be an object');
    return fromLegacyAdvisoryMap(value.advisories, value.metadata);
  }
  if (!isRecord(value.vulnerabilities)) {
    throw new Error('pnpm audit vulnerabilities must be an object');
  }
  return fromNpmVulnerabilities(value.vulnerabilities, value.metadata);
}

export function validateAuditJson(value) {
  normalizeAuditJson(value);
}

function mitigationIdentifier(advisory, fallback) {
  return String(advisory?.github_advisory_id ?? advisory?.id ?? fallback);
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

function resolveRegularPatch(root, relativePath) {
  if (
    typeof relativePath !== 'string' ||
    !relativePath.startsWith('patches/') ||
    relativePath.includes('\\')
  ) {
    throw new Error('patch must be a repository-relative POSIX path below patches/');
  }

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
  const candidateStat = lstatSync(candidatePath);
  if (!candidateStat.isFile() || candidateStat.isSymbolicLink()) {
    throw new Error('patch must be a regular, non-symbolic-link file');
  }
  const candidateReal = realpathSync(candidatePath);
  if (candidateReal !== candidatePath || !isPathInside(patchesReal, candidateReal)) {
    throw new Error('patch must resolve below patches/ without traversing symbolic links');
  }
  return candidateReal;
}

function readRegularFileNoFollow(path) {
  const descriptor = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  try {
    const stat = fstatSync(descriptor);
    if (!stat.isFile()) throw new Error('opened patch is not a regular file');
    return readFileSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function strictUtcDay(value) {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const epoch = Date.UTC(year, month - 1, day);
  const parsed = new Date(epoch);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return epoch;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Execute only repository-owned behavior suites and return exact verified IDs. */
export function runRegisteredBehaviorVerifications(
  requestedIds,
  { root = ROOT, spawn = spawnSync, timeout = BEHAVIOR_TIMEOUT_MS } = {},
) {
  const verified = new Set();
  const errors = [];
  const grouped = new Map();

  for (const id of new Set(requestedIds ?? [])) {
    const registration = MITIGATION_BEHAVIOR_REGISTRY[id];
    if (!registration) {
      errors.push(`${id}: behavior verification ID is not registered`);
      continue;
    }
    const entries = grouped.get(registration.testFile) ?? [];
    entries.push([id, registration]);
    grouped.set(registration.testFile, entries);
  }

  for (const [testFile, entries] of grouped) {
    let testPath;
    try {
      const rootReal = realpathSync(root);
      const candidatePath = resolve(rootReal, testFile);
      const testStat = lstatSync(candidatePath);
      if (!testStat.isFile() || testStat.isSymbolicLink()) {
        throw new Error('registered behavior test must be a regular, non-symbolic-link file');
      }
      testPath = realpathSync(candidatePath);
      if (!isPathInside(rootReal, testPath)) {
        throw new Error('registered behavior test is outside the repository');
      }
      if (testPath !== candidatePath) {
        throw new Error('registered behavior test must not traverse symbolic links');
      }
    } catch (error) {
      for (const [id] of entries) {
        errors.push(`${id}: behavior test file validation failed (${error.message})`);
      }
      continue;
    }
    const result = spawn(
      process.execPath,
      ['--test-isolation=none', '--test-reporter=tap', testPath],
      {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        timeout,
        killSignal: 'SIGKILL',
      },
    );
    if (result.error || result.signal || result.status !== 0) {
      const detail = result.error?.message ?? result.signal ?? `exit ${result.status}`;
      for (const [id] of entries) errors.push(`${id}: behavior verification failed (${detail})`);
      continue;
    }
    const stdout = result.stdout ?? '';
    for (const [id, registration] of entries) {
      const missingTests = registration.testNames.filter((testName) => {
        const passedLine = new RegExp(`^ok \\d+ - ${escapeRegExp(testName)}$`, 'm');
        return !passedLine.test(stdout);
      });
      if (missingTests.length > 0) {
        errors.push(
          `${id}: ${missingTests.length} exact behavior test(s) did not report a passing TAP result`,
        );
        continue;
      }
      verified.add(id);
    }
  }

  return { verified, errors };
}

/**
 * Verify exact, time-bounded local patches for advisories that have no fixed
 * package release. A mitigation is active only when the advisory metadata,
 * installed version, pnpm patch registration, patch digest, and expiry all
 * match. Any mismatch is returned as a fail-closed verification error.
 */
export function verifyMitigationManifest(
  normalized,
  manifest,
  { now = new Date(), root = ROOT, patchedDependencies = {}, verifiedBehaviors = new Set() } = {},
) {
  const mitigated = new Map();
  const errors = [];

  if (!isRecord(manifest) || manifest.schemaVersion !== 1 || !Array.isArray(manifest.mitigations)) {
    return {
      mitigated,
      errors: [
        'security/vulnerability-mitigations.json must use schemaVersion 1 with a mitigations array',
      ],
    };
  }

  const configured = new Map();
  for (const entry of manifest.mitigations) {
    if (!isRecord(entry) || typeof entry.advisory !== 'string' || entry.advisory.length === 0) {
      errors.push('every vulnerability mitigation must declare a non-empty advisory identifier');
      continue;
    }
    if (configured.has(entry.advisory)) {
      errors.push(`duplicate vulnerability mitigation for ${entry.advisory}`);
      continue;
    }
    configured.set(entry.advisory, entry);
  }

  const observed = new Set();
  for (const [fallbackId, advisory] of Object.entries(normalized?.advisories ?? {})) {
    if (!BLOCKING_SEVERITIES.has(advisorySeverity(advisory))) continue;
    const id = mitigationIdentifier(advisory, fallbackId);
    const entry = configured.get(id);
    if (!entry) continue;
    const prefix = `${id}:`;
    const requiredStrings = [
      'package',
      'version',
      'severity',
      'patch',
      'patchSha256',
      'expires',
      'upstream',
      'rationale',
      'verification',
    ];
    const missing = requiredStrings.filter(
      (field) => typeof entry[field] !== 'string' || entry[field].trim().length === 0,
    );
    if (missing.length > 0) {
      errors.push(`${prefix} missing non-empty fields: ${missing.join(', ')}`);
      continue;
    }
    if (entry.package !== advisory.module_name && entry.package !== advisory.name) {
      continue;
    }
    observed.add(id);
    if (entry.severity.toLowerCase() !== advisorySeverity(advisory)) {
      errors.push(`${prefix} severity does not match the audit finding`);
      continue;
    }
    if (!BLOCKING_SEVERITIES.has(entry.severity.toLowerCase())) {
      errors.push(`${prefix} mitigation severity must be High or Critical`);
      continue;
    }

    const behaviorRegistration = MITIGATION_BEHAVIOR_REGISTRY[entry.verification];
    if (
      !behaviorRegistration ||
      behaviorRegistration.advisory !== id ||
      behaviorRegistration.package !== entry.package ||
      behaviorRegistration.version !== entry.version
    ) {
      errors.push(
        `${prefix} verification must match an exact repository behavior-test registry entry`,
      );
      continue;
    }
    if (!verifiedBehaviors.has(entry.verification)) {
      errors.push(`${prefix} registered behavior verification did not pass in this run`);
      continue;
    }

    const findings = Array.isArray(advisory.findings) ? advisory.findings : [];
    if (
      findings.length === 0 ||
      findings.some((finding) => String(finding?.version) !== entry.version)
    ) {
      errors.push(`${prefix} installed finding versions do not exactly match ${entry.version}`);
      continue;
    }

    if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
      errors.push(`${prefix} verification clock is invalid`);
      continue;
    }
    const expiresAt = strictUtcDay(entry.expires);
    if (expiresAt === null) {
      errors.push(`${prefix} expires must be a real ISO calendar date`);
      continue;
    }
    const currentDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    if (currentDay > expiresAt) {
      errors.push(`${prefix} mitigation expired on ${entry.expires}`);
      continue;
    }
    if (expiresAt - currentDay > MAX_MITIGATION_LIFETIME_DAYS * DAY_MS) {
      errors.push(
        `${prefix} expires more than ${MAX_MITIGATION_LIFETIME_DAYS} days after verification`,
      );
      continue;
    }

    if (!/^[a-f0-9]{64}$/.test(entry.patchSha256)) {
      errors.push(`${prefix} patchSha256 must be a lowercase SHA-256 digest`);
      continue;
    }

    const registration = patchedDependencies[`${entry.package}@${entry.version}`];
    if (registration !== entry.patch) {
      errors.push(`${prefix} pnpm patchedDependencies registration does not match ${entry.patch}`);
      continue;
    }
    try {
      const patchPath = resolveRegularPatch(root, entry.patch);
      const digest = createHash('sha256').update(readRegularFileNoFollow(patchPath)).digest('hex');
      if (digest !== entry.patchSha256) {
        errors.push(`${prefix} patch SHA-256 mismatch (observed ${digest})`);
        continue;
      }
    } catch (error) {
      errors.push(`${prefix} patch could not be read: ${error.message}`);
      continue;
    }

    mitigated.set(fallbackId, entry);
  }

  for (const id of configured.keys()) {
    if (!observed.has(id))
      errors.push(`${id}: mitigation has no matching High/Critical audit finding`);
  }

  return { mitigated, errors };
}

/**
 * Fail closed unless a supported audit payload was parsed and every
 * High/Critical advisory is absent or covered by verified local patch evidence.
 * Lower severities stay reportable, not promotional.
 */
export function auditBlockingVerdict(
  normalized,
  executionError = null,
  mitigationResult = { mitigated: new Map(), errors: [] },
) {
  if (executionError || !normalized) {
    return {
      passed: false,
      reason: executionError
        ? `audit execution was not trustworthy (${executionError})`
        : 'audit execution or JSON parsing was unavailable',
    };
  }
  if (mitigationResult.errors.length > 0) {
    return {
      passed: false,
      reason: `${mitigationResult.errors.length} local mitigation verification error(s)`,
      unmitigated: [],
    };
  }
  const counts = normalized.vulnerabilities ?? emptyCounts();
  const high = Number(counts.high ?? 0);
  const critical = Number(counts.critical ?? 0);
  const parsedBlocking = Object.entries(normalized.advisories ?? {}).filter(([, advisory]) =>
    BLOCKING_SEVERITIES.has(advisorySeverity(advisory)),
  );
  const unmitigated = parsedBlocking.filter(([fallbackId]) => {
    return !mitigationResult.mitigated.has(fallbackId);
  });
  const unresolvedCount = Math.max(
    unmitigated.length,
    high + critical - mitigationResult.mitigated.size,
  );
  const passed = unresolvedCount === 0;
  const mitigatedCount = mitigationResult.mitigated.size;
  return {
    passed,
    reason: passed
      ? mitigatedCount > 0
        ? `no unmitigated parsed High/Critical advisory (${mitigatedCount} exact local patch mitigation(s) verified)`
        : 'no parsed High/Critical advisory'
      : `${critical} Critical and ${high} High advisories reported; ${unresolvedCount} remain unmitigated`,
    unmitigated,
  };
}

/**
 * pnpm uses exit 1 when the selected audit level has findings. Admit only that
 * documented non-zero case, and require it to agree with the complete payload.
 */
export function auditExecutionFailure(audit, normalized) {
  if (audit?.error) return audit.error.message ?? String(audit.error);
  if (audit?.signal) return `pnpm audit terminated by ${audit.signal}`;
  if (!Number.isSafeInteger(audit?.status)) return 'pnpm audit did not report an exit status';
  if (audit.status !== 0 && audit.status !== 1) {
    return `pnpm audit returned unsupported exit status ${audit.status}`;
  }
  if (!normalized) return null;
  const blockingCount =
    Number(normalized.vulnerabilities?.critical ?? 0) +
    Number(normalized.vulnerabilities?.high ?? 0);
  if (audit.status === 1 && blockingCount === 0) {
    return 'pnpm audit returned exit 1 without a parsed High/Critical finding';
  }
  if (audit.status === 0 && blockingCount > 0) {
    return 'pnpm audit returned exit 0 despite parsed High/Critical findings';
  }
  return null;
}

function readWorkspace() {
  return parseYaml(readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8'));
}

function advisorySeverity(advisory) {
  return String(advisory?.severity ?? '').toLowerCase();
}

function markdownTableCell(value) {
  return String(value)
    .replaceAll('|', '\\|')
    .replaceAll('`', "'")
    .replace(/[\r\n]+/g, ' ');
}

export function renderAdvisoryRow(advisory) {
  const pkg = markdownTableCell(advisory.module_name ?? advisory.name ?? 'unknown');
  const id = markdownTableCell(advisory.github_advisory_id ?? advisory.id ?? 'N/A');
  const advisoryUrl = /^GHSA-[0-9A-Za-z-]+$/.test(id) ? `https://github.com/advisories/${id}` : '#';
  const range = markdownTableCell(advisory.vulnerable_versions ?? advisory.range ?? 'unknown');
  const severity = markdownTableCell(String(advisory.severity ?? 'unknown').toUpperCase());
  return `| \`${pkg}\` | [${id}](${advisoryUrl}) | ${severity} | \`${range}\` |\n`;
}

export function renderMitigationRow(entry) {
  return `| \`${entry.package}\` | [${entry.advisory}](https://github.com/advisories/${entry.advisory}) | \`${entry.version}\` | \`${entry.patchSha256}\` | \`${entry.verification}\` | ${entry.expires} | [patch source](${entry.upstream}) |\n`;
}

function inlineEvidence(value) {
  return String(value)
    .slice(0, 200)
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/`/g, '\\`');
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  // A failed or timed-out run must never leave a committed prior report looking
  // like evidence from this execution. Keep an explicit current-run failure
  // artifact in place until the atomic final replacement below succeeds.
  writePreflightFailureReport(OUTPUT_FILE);
  const packageJson = parseStrictJson(
    readFileSync(join(ROOT, 'package.json'), 'utf8'),
    'package.json',
    'package.json is empty',
  );
  const { version: pnpmVersion, audit } = runPnpmAuditWithVersionAttestation(packageJson);

  const stdout = audit?.stdout ?? '';
  const stderr = audit?.stderr ?? '';
  let normalized = null;
  let parseNote = null;
  try {
    normalized = normalizeAuditJson(parseAuditJson(stdout));
  } catch (err) {
    parseNote = err.message;
  }
  const executionFailure = pnpmVersion.error ?? auditExecutionFailure(audit, normalized);

  const counts = normalized?.vulnerabilities ?? emptyCounts();
  const workspace = readWorkspace();
  let mitigationManifest = null;
  let mitigationReadError = null;
  try {
    mitigationManifest = parseStrictJson(
      readFileSync(MITIGATIONS_FILE, 'utf8'),
      'security/vulnerability-mitigations.json',
      'security/vulnerability-mitigations.json is empty',
    );
  } catch (error) {
    mitigationReadError = error;
  }
  const requestedBehaviors = Array.isArray(mitigationManifest?.mitigations)
    ? mitigationManifest.mitigations.map((entry) => entry?.verification)
    : [];
  const behaviorResult = runRegisteredBehaviorVerifications(requestedBehaviors);
  const mitigationResult = mitigationReadError
    ? {
        mitigated: new Map(),
        errors: [`mitigation manifest unavailable: ${mitigationReadError.message}`],
      }
    : verifyMitigationManifest(normalized, mitigationManifest, {
        patchedDependencies: workspace?.patchedDependencies ?? {},
        verifiedBehaviors: behaviorResult.verified,
      });
  mitigationResult.errors.push(...behaviorResult.errors);
  const verdict = auditBlockingVerdict(normalized, executionFailure, mitigationResult);
  const blocking = (verdict.unmitigated ?? []).map(([, advisory]) => advisory);
  const nonBlocking = Object.values(normalized?.advisories ?? {})
    .filter((advisory) => ['moderate', 'low'].includes(advisorySeverity(advisory)))
    .sort((left, right) => {
      const leftKey = `${left.module_name ?? left.name ?? ''}\0${left.github_advisory_id ?? left.id ?? ''}`;
      const rightKey = `${right.module_name ?? right.name ?? ''}\0${right.github_advisory_id ?? right.id ?? ''}`;
      return leftKey.localeCompare(rightKey);
    });
  const generated = new Date().toISOString();

  let report = '# Dependency Vulnerability Report\n\n';
  report += `**Generated:** ${generated}\n`;
  report +=
    '**Policy:** unmitigated High/Critical advisories block; exact local patches must be registered, digest-bound, behavior-tested, and unexpired; Moderate/Low remain reported\n';
  report += '**Command:** `pnpm audit --json --audit-level=high`\n';
  report += `**Expected package manager:** \`pnpm@${inlineEvidence(pnpmVersion.expected ?? 'UNAVAILABLE')}\`\n`;
  report += `**Observed package manager:** \`pnpm@${inlineEvidence(pnpmVersion.observed ?? 'UNAVAILABLE')}\`\n`;
  report += `**Package-manager attestation:** ${pnpmVersion.error ? 'FAIL' : 'PASS'}\n`;
  report += `**Version-check timeout:** ${PNPM_VERSION_TIMEOUT_MS} ms\n`;
  report += `**Command exit status:** ${audit?.status ?? 'UNAVAILABLE'}\n`;
  report += `**Command termination signal:** ${audit?.signal ?? 'NONE'}\n`;
  report += `**Audit timeout:** ${AUDIT_TIMEOUT_MS} ms\n`;
  report += `**Parsed schema:** ${normalized?.sourceShape ?? 'UNAVAILABLE'}\n`;
  report += `**Total dependencies reported by audit:** ${normalized?.totalDependencies ?? 'not reported'}\n\n`;
  report += '## Blocking verdict\n\n';
  report += verdict.passed
    ? `PASS — ${verdict.reason}.\n\n`
    : `FAIL — ${verdict.reason}; release remains blocked.\n\n`;

  report += '## Parsed counts\n\n';
  report += '| Severity | Count |\n|---|---:|\n';
  for (const severity of SEVERITIES) {
    report += `| ${severity[0].toUpperCase() + severity.slice(1)} | ${counts[severity]} |\n`;
  }
  report += '\n';

  if (mitigationResult.mitigated.size > 0) {
    report += '## Verified local patch mitigations\n\n';
    report +=
      '| Package | Advisory | Version | Patch SHA-256 | Behavior verification | Expires | Upstream |\n';
    report += '|---|---|---:|---|---|---:|---|\n';
    for (const entry of mitigationResult.mitigated.values()) {
      report += renderMitigationRow(entry);
    }
    report += '\n';
  }

  if (mitigationResult.errors.length > 0) {
    report += '## Local mitigation verification errors\n\n';
    for (const error of mitigationResult.errors) report += `- ${error}\n`;
    report += '\n';
  }

  if (blocking.length) {
    report += '## Unmitigated High / Critical findings\n\n';
    report += '| Package | Advisory | Severity | Vulnerable range |\n|---|---|---|---|\n';
    for (const advisory of blocking) report += renderAdvisoryRow(advisory);
    report += '\n';
  }

  const nonBlockingCount = counts.moderate + counts.low;
  if (nonBlockingCount > 0) {
    report += '## Reported Moderate / Low findings\n\n';
    if (nonBlocking.length > 0) {
      report += '| Package | Advisory | Severity | Vulnerable range |\n|---|---|---|---|\n';
      for (const advisory of nonBlocking) report += renderAdvisoryRow(advisory);
      report += '\n';
    }
    if (nonBlocking.length < nonBlockingCount) {
      report += `${nonBlockingCount - nonBlocking.length} Moderate/Low finding(s) were present only in pnpm's aggregate metadata for this audit-level response; their missing detail is not inferred.\n\n`;
    }
  }

  if (parseNote) {
    report += '## Parser note\n\n';
    report += `Audit JSON was not recognized for detailed reporting: \`${parseNote}\`. `;
    report +=
      'The blocking verdict remains FAIL because an unsupported or unavailable audit cannot be admitted.\n\n';
  }
  if (pnpmVersion.error) {
    report += '## Package-manager attestation error\n\n';
    report += `${pnpmVersion.error.replace(/[`\r\n]/g, ' ')}. The audit command was not executed.\n\n`;
  }
  if (audit?.error) {
    report += '## Audit execution error\n\n```text\n';
    report += String(audit.error.message ?? audit.error)
      .slice(0, 4000)
      .replace(/```/g, "''' ");
    report += '\n```\n\n';
  }
  if (executionFailure && !audit?.error && !pnpmVersion.error) {
    report += '## Audit execution consistency error\n\n';
    report += `${executionFailure}.\n\n`;
  }
  if (stderr.trim()) {
    report += '## Audit stderr\n\n```text\n';
    report += stderr.trim().slice(0, 4000).replace(/```/g, "''' ");
    report += '\n```\n\n';
  }

  const overrideEntries = Object.entries(workspace?.overrides ?? {});
  if (overrideEntries.length) {
    report += '## Workspace overrides\n\n| Package | Pinned version |\n|---|---|\n';
    for (const [pkg, version] of overrideEntries) report += `| \`${pkg}\` | \`${version}\` |\n`;
    report += '\n';
  }

  report +=
    '_CI fails closed on unmitigated High/Critical findings, expired or mismatched local patch evidence, and audit execution/parser failure. Moderate/Low findings remain visible and non-promotional._\n';
  const runOutput = `${OUTPUT_FILE}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(runOutput, report, { flag: 'wx' });
    renameSync(runOutput, OUTPUT_FILE);
  } finally {
    rmSync(runOutput, { force: true });
  }

  if (!verdict.passed) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
