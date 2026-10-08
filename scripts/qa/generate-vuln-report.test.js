import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  AUDIT_TIMEOUT_MS,
  auditBlockingVerdict,
  auditExecutionFailure,
  MAX_MITIGATION_LIFETIME_DAYS,
  MITIGATION_BEHAVIOR_REGISTRY,
  normalizeAuditJson,
  PNPM_VERSION_TIMEOUT_MS,
  parseAuditJson,
  parsePinnedPnpmVersion,
  renderAdvisoryRow,
  renderMitigationRow,
  runPnpmAuditWithVersionAttestation,
  runRegisteredBehaviorVerifications,
  validateAuditJson,
  verifyMitigationManifest,
} from './generate-vuln-report.js';
import { writePreflightFailureReport } from './write-vuln-preflight-report.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const NODE_FORGE_VERIFICATION = 'dependency-patches/node-forge-digestalgorithm-v1';

const legacyAudit = {
  advisories: {},
  metadata: {
    totalDependencies: 12,
    vulnerabilities: {
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
    },
  },
};

const npmV7Audit = {
  vulnerabilities: {
    axios: {
      name: 'axios',
      severity: 'high',
      range: '<1.8.2',
      via: ['GHSA-example-high'],
    },
  },
  metadata: {
    vulnerabilities: {
      critical: 0,
      high: 1,
      moderate: 0,
      low: 0,
    },
    totalDependencies: 99,
  },
};

function nodeForgeAudit() {
  return normalizeAuditJson({
    advisories: {
      1: {
        github_advisory_id: 'GHSA-86w9-cpqp-85rv',
        module_name: 'node-forge',
        severity: 'high',
        findings: [{ version: '1.4.0', paths: ['root>node-forge'] }],
      },
    },
    metadata: {
      totalDependencies: 1,
      vulnerabilities: { critical: 0, high: 1, moderate: 0, low: 0 },
    },
  });
}

function patchFixture() {
  const root = mkdtempSync(join(tmpdir(), 'a11oy-vuln-gate-'));
  mkdirSync(join(root, 'patches'));
  const patch = Buffer.from('reviewed patch\n');
  const patchPath = join(root, 'patches', 'node-forge.patch');
  writeFileSync(patchPath, patch);
  const patchSha256 = createHash('sha256').update(patch).digest('hex');
  const manifest = {
    schemaVersion: 1,
    mitigations: [
      {
        advisory: 'GHSA-86w9-cpqp-85rv',
        package: 'node-forge',
        version: '1.4.0',
        severity: 'high',
        patch: 'patches/node-forge.patch',
        patchSha256,
        expires: '2026-11-05',
        upstream: 'https://example.test/upstream',
        rationale: 'No fixed package release exists.',
        verification: NODE_FORGE_VERIFICATION,
      },
    ],
  };
  return {
    root,
    patch,
    patchPath,
    patchSha256,
    manifest,
    cleanup: () => rmSync(root, { force: true, recursive: true }),
  };
}

function verifyFixture(fixture, overrides = {}) {
  return verifyMitigationManifest(nodeForgeAudit(), fixture.manifest, {
    now: new Date('2026-10-06T00:00:00Z'),
    root: fixture.root,
    patchedDependencies: {
      'node-forge@1.4.0': fixture.manifest.mitigations[0].patch,
    },
    verifiedBehaviors: new Set([NODE_FORGE_VERIFICATION]),
    ...overrides,
  });
}

test('parses JSON and preserves caller fallback for empty output', () => {
  assert.deepEqual(parseAuditJson(JSON.stringify({ ok: true })), { ok: true });
  assert.throws(() => parseAuditJson('', 'missing audit output'), /missing audit output/);
  assert.throws(
    () => parseAuditJson('No vulnerabilities found'),
    /Failed to parse pnpm audit JSON/,
  );
  assert.throws(
    () => parseAuditJson('{"advisories":{},"advisories":{},"metadata":{}}'),
    /duplicate-key ambiguity/,
  );
  assert.throws(
    () => parseAuditJson('{"metadata":{"totalDependencies":1,"totalDependencies":2}}'),
    /duplicate-key ambiguity/,
  );
});

test('accepts only an exact pinned pnpm semantic version', () => {
  assert.equal(parsePinnedPnpmVersion({ packageManager: 'pnpm@10.26.1' }), '10.26.1');
  assert.equal(
    parsePinnedPnpmVersion({ packageManager: 'pnpm@10.26.1-rc.1+build.7' }),
    '10.26.1-rc.1+build.7',
  );
  for (const packageManager of [
    undefined,
    'npm@10.26.1',
    'pnpm@latest',
    'pnpm@^10.26.1',
    'pnpm@10.26',
    'pnpm@010.26.1',
    'pnpm@10.26.1-01',
  ]) {
    assert.throws(
      () => parsePinnedPnpmVersion({ packageManager }),
      /must be an exact pnpm@semver string/,
    );
  }
});

test('attests the exact pnpm executable before running an audit', () => {
  const calls = [];
  const auditResult = { status: 1, signal: null, stdout: '{}', stderr: '' };
  const result = runPnpmAuditWithVersionAttestation(
    { packageManager: 'pnpm@10.26.1' },
    {
      root: ROOT,
      spawn: (command, args, options) => {
        calls.push({ command, args, options });
        return args[0] === '--version'
          ? { status: 0, signal: null, stdout: '10.26.1\n', stderr: '' }
          : auditResult;
      },
    },
  );
  assert.equal(result.version.error, null);
  assert.equal(result.version.expected, '10.26.1');
  assert.equal(result.version.observed, '10.26.1');
  assert.equal(result.audit, auditResult);
  assert.deepEqual(
    calls.map(({ command, args }) => [command, ...args]),
    [
      ['pnpm', '--version'],
      ['pnpm', 'audit', '--json', '--audit-level=high'],
    ],
  );
  assert.equal(calls[0].options.timeout, PNPM_VERSION_TIMEOUT_MS);
  assert.equal(calls[1].options.timeout, AUDIT_TIMEOUT_MS);
});

test('fails closed before audit on malformed, mismatched, or failed pnpm version checks', () => {
  const scenarios = [
    {
      packageJson: { packageManager: 'pnpm@latest' },
      versionResult: null,
      error: /exact pnpm@semver/,
      calls: 0,
    },
    {
      packageJson: { packageManager: 'pnpm@10.26.1' },
      versionResult: { status: 0, signal: null, stdout: '11.19.0\n', stderr: '' },
      error: /version mismatch/,
      calls: 1,
    },
    {
      packageJson: { packageManager: 'pnpm@10.26.1' },
      versionResult: { status: 0, signal: null, stdout: '10.26.1\nextra\n', stderr: '' },
      error: /one exact semantic version/,
      calls: 1,
    },
    {
      packageJson: { packageManager: 'pnpm@10.26.1' },
      versionResult: { status: null, signal: 'SIGKILL', stdout: '', stderr: '' },
      error: /terminated by SIGKILL/,
      calls: 1,
    },
    {
      packageJson: { packageManager: 'pnpm@10.26.1' },
      versionResult: {
        status: null,
        signal: null,
        stdout: '',
        stderr: '',
        error: new Error('timeout'),
      },
      error: /timeout/,
      calls: 1,
    },
  ];

  for (const scenario of scenarios) {
    let calls = 0;
    const result = runPnpmAuditWithVersionAttestation(scenario.packageJson, {
      root: ROOT,
      spawn: () => {
        calls += 1;
        return scenario.versionResult;
      },
    });
    assert.equal(result.audit, null);
    assert.match(result.version.error, scenario.error);
    assert.equal(calls, scenario.calls);
  }
});

test('normalizes complete legacy advisories and metadata', () => {
  assert.doesNotThrow(() => validateAuditJson(legacyAudit));
  const normalized = normalizeAuditJson(legacyAudit);
  assert.equal(normalized.sourceShape, 'legacy-advisories');
  assert.equal(normalized.totalDependencies, 12);
  assert.equal(normalized.vulnerabilities.high, 0);
});

test('normalizes one advisory across distinct affected packages and rejects true duplicates', () => {
  const sharedAdvisory = {
    advisories: {
      101: {
        github_advisory_id: 'GHSA-shared-example',
        module_name: 'instrumentation-a',
        severity: 'moderate',
        findings: [{ version: '1.0.0', paths: ['root>instrumentation-a'] }],
      },
      102: {
        github_advisory_id: 'GHSA-shared-example',
        module_name: 'instrumentation-b',
        severity: 'moderate',
        findings: [{ version: '2.0.0', paths: ['root>instrumentation-b'] }],
      },
    },
    metadata: {
      totalDependencies: 2,
      vulnerabilities: { critical: 0, high: 0, moderate: 2, low: 0 },
    },
  };
  const normalized = normalizeAuditJson(sharedAdvisory);
  assert.equal(Object.keys(normalized.advisories).length, 2);
  assert.deepEqual(
    Object.values(normalized.advisories)
      .map((advisory) => [advisory.github_advisory_id, advisory.module_name])
      .sort(),
    [
      ['GHSA-shared-example', 'instrumentation-a'],
      ['GHSA-shared-example', 'instrumentation-b'],
    ],
  );
  assert.equal(
    renderAdvisoryRow(Object.values(normalized.advisories)[0]),
    '| `instrumentation-a` | [GHSA-shared-example](https://github.com/advisories/GHSA-shared-example) | MODERATE | `unknown` |\n',
  );
  assert.doesNotMatch(
    renderAdvisoryRow({
      github_advisory_id: 'GHSA-safe|break',
      module_name: 'pkg`name\nnext',
      severity: 'low',
      vulnerable_versions: '<=1|2',
    }),
    /\]\(https:\/\/github\.com/,
  );

  const duplicate = structuredClone(sharedAdvisory);
  duplicate.advisories[102] = {
    ...duplicate.advisories[101],
    findings: [{ version: '1.0.0', paths: ['root>instrumentation-a'] }],
  };
  assert.throws(
    () => normalizeAuditJson(duplicate),
    /duplicate advisory record GHSA-shared-example for instrumentation-a/,
  );
});

test('admits lower-severity summary counts whose detail is filtered by audit-level=high', () => {
  const filtered = {
    advisories: {},
    metadata: {
      totalDependencies: 12,
      vulnerabilities: { critical: 0, high: 0, moderate: 4, low: 2 },
    },
  };
  const normalized = normalizeAuditJson(filtered);
  assert.equal(normalized.vulnerabilities.moderate, 4);
  assert.equal(normalized.vulnerabilities.low, 2);
});

test('normalizes a complete npm v7+ vulnerabilities shape', () => {
  const normalized = normalizeAuditJson(npmV7Audit);
  assert.equal(normalized.sourceShape, 'npm-vulnerabilities');
  assert.equal(normalized.totalDependencies, 99);
  assert.equal(normalized.vulnerabilities.high, 1);
});

test('rejects incomplete, ambiguous, and internally inconsistent audit payloads', () => {
  assert.throws(() => validateAuditJson(null), /must be an object/);
  assert.throws(() => validateAuditJson({}), /unsupported or ambiguous/);
  assert.throws(() => validateAuditJson([]), /must be an object/);
  assert.throws(
    () => validateAuditJson({ advisories: {}, metadata: { vulnerabilities: {} } }),
    /critical.*non-negative safe integer/,
  );
  assert.throws(
    () =>
      validateAuditJson({
        ...legacyAudit,
        metadata: {
          ...legacyAudit.metadata,
          vulnerabilities: { ...legacyAudit.metadata.vulnerabilities, high: 1 },
        },
      }),
    /summary count 1 does not match 0/,
  );
  assert.throws(
    () =>
      validateAuditJson({
        advisories: {
          1: { module_name: 'broken', severity: 'high', findings: [] },
        },
        metadata: {
          totalDependencies: 1,
          vulnerabilities: { critical: 0, high: 1, moderate: 0, low: 0 },
        },
      }),
    /at least one finding/,
  );
});

test('admits only pnpm exit 1 with complete High/Critical findings', () => {
  const blocking = nodeForgeAudit();
  assert.equal(auditExecutionFailure({ status: 0 }, normalizeAuditJson(legacyAudit)), null);
  assert.equal(auditExecutionFailure({ status: 1 }, blocking), null);
  assert.match(auditExecutionFailure({ status: 2 }, blocking), /unsupported exit status 2/);
  assert.match(
    auditExecutionFailure({ status: 1 }, normalizeAuditJson(legacyAudit)),
    /exit 1 without a parsed High\/Critical finding/,
  );
  assert.match(
    auditExecutionFailure({ status: 0 }, blocking),
    /exit 0 despite parsed High\/Critical findings/,
  );
  assert.match(auditExecutionFailure({ status: null, signal: 'SIGKILL' }, null), /SIGKILL/);
  assert.equal(AUDIT_TIMEOUT_MS, 120_000);
});

test('repository mitigation manifest has exact behavior-registry coverage', () => {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'security', 'vulnerability-mitigations.json'), 'utf8'),
  );
  const configured = manifest.mitigations.map((entry) => entry.verification).sort();
  const registered = Object.keys(MITIGATION_BEHAVIOR_REGISTRY).sort();
  assert.deepEqual(configured, registered);
  for (const entry of manifest.mitigations) {
    const registration = MITIGATION_BEHAVIOR_REGISTRY[entry.verification];
    assert.equal(registration.advisory, entry.advisory);
    assert.equal(registration.package, entry.package);
    assert.equal(registration.version, entry.version);
  }
  const behaviorSource = readFileSync(join(ROOT, 'scripts/qa/dependency-patches.test.mjs'), 'utf8');
  const declaredTests = [...behaviorSource.matchAll(/^test\(\s*'([^']+)'/gm)]
    .map((match) => match[1])
    .sort();
  const registeredTests = Object.values(MITIGATION_BEHAVIOR_REGISTRY)
    .flatMap((entry) => entry.testNames)
    .sort();
  assert.deepEqual(registeredTests, declaredTests);
});

test('behavior runner accepts only exact registered TAP results', () => {
  const ids = Object.keys(MITIGATION_BEHAVIOR_REGISTRY);
  const testNames = ids.flatMap((id) => MITIGATION_BEHAVIOR_REGISTRY[id].testNames);
  const lines = testNames.map((testName, index) => `ok ${index + 1} - ${testName}`);
  let invocation;
  const result = runRegisteredBehaviorVerifications(ids, {
    root: ROOT,
    spawn: (command, args, options) => {
      invocation = { command, args, options };
      return { status: 0, signal: null, stdout: `${lines.join('\n')}\n`, stderr: '' };
    },
  });
  assert.deepEqual([...result.verified].sort(), ids.sort());
  assert.deepEqual(result.errors, []);
  assert.equal(invocation.command, process.execPath);
  assert.deepEqual(invocation.args, [
    '--test-isolation=none',
    '--test-reporter=tap',
    resolve(ROOT, 'scripts/qa/dependency-patches.test.mjs'),
  ]);
  assert.equal(invocation.options.timeout > 0, true);

  const missingExactResult = runRegisteredBehaviorVerifications([NODE_FORGE_VERIFICATION], {
    root: ROOT,
    spawn: () => ({ status: 0, signal: null, stdout: 'ok 1 - another test\n', stderr: '' }),
  });
  assert.match(missingExactResult.errors[0], /exact behavior test\(s\) did not report/);

  const nodeForgeNames = MITIGATION_BEHAVIOR_REGISTRY[NODE_FORGE_VERIFICATION].testNames;
  const skippedResult = runRegisteredBehaviorVerifications([NODE_FORGE_VERIFICATION], {
    root: ROOT,
    spawn: () => ({
      status: 0,
      signal: null,
      stdout: `ok 1 - ${nodeForgeNames[0]} # SKIP\nok 2 - ${nodeForgeNames[1]}\n`,
      stderr: '',
    }),
  });
  assert.equal(skippedResult.verified.has(NODE_FORGE_VERIFICATION), false);
  assert.match(skippedResult.errors[0], /1 exact behavior test\(s\)/);

  const arbitrary = runRegisteredBehaviorVerifications(['node --test attacker.mjs'], {
    root: ROOT,
    spawn: () => assert.fail('unregistered commands must never execute'),
  });
  assert.match(arbitrary.errors[0], /not registered/);
});

test('preflight replaces stale evidence with an explicit run-specific FAIL artifact', () => {
  const root = mkdtempSync(join(tmpdir(), 'a11oy-vuln-preflight-'));
  const output = join(root, 'security', 'vuln-report.md');
  try {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, 'stale PASS\n');
    writePreflightFailureReport(output, new Date('2026-10-06T12:34:56Z'));
    const report = readFileSync(output, 'utf8');
    assert.match(report, /\*\*Generated:\*\* 2026-10-06T12:34:56\.000Z/);
    assert.match(report, /\*\*Blocking verdict:\*\* FAIL/);
    assert.doesNotMatch(report, /stale PASS/);
    assert.deepEqual(readdirSync(dirname(output)), ['vuln-report.md']);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('admits an exact digest-bound regular patch with a passed registered behavior', () => {
  const fixture = patchFixture();
  try {
    const mitigation = verifyFixture(fixture);
    assert.deepEqual(mitigation.errors, []);
    assert.equal(mitigation.mitigated.size, 1);
    assert.equal([...mitigation.mitigated.values()][0].advisory, 'GHSA-86w9-cpqp-85rv');
    assert.equal(auditBlockingVerdict(nodeForgeAudit(), null, mitigation).passed, true);
  } finally {
    fixture.cleanup();
  }
});

test('a mitigation covers only its exact package record for a shared advisory', () => {
  const fixture = patchFixture();
  try {
    const normalized = normalizeAuditJson({
      advisories: {
        1: {
          github_advisory_id: 'GHSA-86w9-cpqp-85rv',
          module_name: 'node-forge',
          severity: 'high',
          findings: [{ version: '1.4.0', paths: ['root>node-forge'] }],
        },
        2: {
          github_advisory_id: 'GHSA-86w9-cpqp-85rv',
          module_name: 'another-package',
          severity: 'high',
          findings: [{ version: '9.9.9', paths: ['root>another-package'] }],
        },
      },
      metadata: {
        totalDependencies: 2,
        vulnerabilities: { critical: 0, high: 2, moderate: 0, low: 0 },
      },
    });
    const mitigation = verifyMitigationManifest(normalized, fixture.manifest, {
      now: new Date('2026-10-06T00:00:00Z'),
      root: fixture.root,
      patchedDependencies: { 'node-forge@1.4.0': fixture.manifest.mitigations[0].patch },
      verifiedBehaviors: new Set([NODE_FORGE_VERIFICATION]),
    });
    assert.deepEqual(mitigation.errors, []);
    assert.equal(mitigation.mitigated.size, 1);
    const verdict = auditBlockingVerdict(normalized, null, mitigation);
    assert.equal(verdict.passed, false);
    assert.equal(verdict.unmitigated.length, 1);
    assert.equal(verdict.unmitigated[0][1].module_name, 'another-package');
    const row = renderMitigationRow(fixture.manifest.mitigations[0]);
    assert.ok(row.includes('https://github.com/advisories/GHSA-86w9-cpqp-85rv'));
    assert.doesNotMatch(row, /legacy:/);
  } finally {
    fixture.cleanup();
  }
});

test('rejects arbitrary or unexecuted behavior declarations', () => {
  const fixture = patchFixture();
  try {
    fixture.manifest.mitigations[0].verification = 'node --test attacker.mjs';
    const arbitrary = verifyFixture(fixture);
    assert.match(arbitrary.errors[0], /exact repository behavior-test registry entry/);

    fixture.manifest.mitigations[0].verification = NODE_FORGE_VERIFICATION;
    const unexecuted = verifyFixture(fixture, { verifiedBehaviors: new Set() });
    assert.match(unexecuted.errors[0], /did not pass in this run/);
  } finally {
    fixture.cleanup();
  }
});

test('enforces real calendar expiry and a maximum 30-day admission window', () => {
  const fixture = patchFixture();
  try {
    fixture.manifest.mitigations[0].expires = '2026-02-30';
    let result = verifyFixture(fixture, { now: new Date('2026-02-01T00:00:00Z') });
    assert.match(result.errors[0], /real ISO calendar date/);

    fixture.manifest.mitigations[0].expires = '2026-11-06';
    result = verifyFixture(fixture);
    assert.match(result.errors[0], /more than 30 days/);

    fixture.manifest.mitigations[0].expires = '2026-10-05';
    result = verifyFixture(fixture);
    assert.match(result.errors[0], /expired/);
    assert.equal(MAX_MITIGATION_LIFETIME_DAYS, 30);
  } finally {
    fixture.cleanup();
  }
});

test('rejects digest mismatches, traversal, symlinks, and noncanonical digests', () => {
  const fixture = patchFixture();
  try {
    fixture.manifest.mitigations[0].patchSha256 = '0'.repeat(64);
    let result = verifyFixture(fixture);
    assert.match(result.errors[0], /SHA-256 mismatch/);

    fixture.manifest.mitigations[0].patchSha256 = fixture.patchSha256.toUpperCase();
    result = verifyFixture(fixture);
    assert.match(result.errors[0], /lowercase SHA-256 digest/);

    fixture.manifest.mitigations[0].patchSha256 = fixture.patchSha256;
    writeFileSync(join(fixture.root, 'outside.patch'), fixture.patch);
    fixture.manifest.mitigations[0].patch = 'patches/../outside.patch';
    result = verifyFixture(fixture);
    assert.match(result.errors[0], /normalized repository patches/);

    symlinkSync('node-forge.patch', join(fixture.root, 'patches', 'linked.patch'));
    fixture.manifest.mitigations[0].patch = 'patches/linked.patch';
    result = verifyFixture(fixture);
    assert.match(result.errors[0], /regular, non-symbolic-link file/);
  } finally {
    fixture.cleanup();
  }
});

test('fails closed when summary counts lack matching advisory detail', () => {
  const normalized = {
    advisories: {},
    vulnerabilities: { critical: 0, high: 1, moderate: 0, low: 0 },
  };
  const verdict = auditBlockingVerdict(normalized);
  assert.equal(verdict.passed, false);
  assert.match(verdict.reason, /1 remain unmitigated/);
});
