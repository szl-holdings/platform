import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function readRepositoryFile(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), 'utf8').replaceAll('\r\n', '\n');
}

function yamlJobBlock(workflow, jobName) {
  const marker = `  ${jobName}:\n`;
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, `missing workflow job ${jobName}`);

  const afterStart = start + marker.length;
  const nextJob = /\n {2}[A-Za-z0-9_-]+:\n/.exec(workflow.slice(afterStart));
  const end = nextJob === null ? workflow.length : afterStart + nextJob.index;
  return workflow.slice(start, end);
}

function yamlStepBlock(job, stepName) {
  const marker = `      - name: ${stepName}\n`;
  const start = job.indexOf(marker);
  assert.notEqual(start, -1, `missing workflow step ${stepName}`);

  const afterStart = start + marker.length;
  const nextStep = job.indexOf('\n      - ', afterStart);
  const end = nextStep === -1 ? job.length : nextStep;
  return job.slice(start, end);
}

function runScript(step) {
  const marker = '        run: |\n';
  const start = step.indexOf(marker);
  assert.notEqual(start, -1, 'missing multiline run block');

  return step
    .slice(start + marker.length)
    .split('\n')
    .map((line) => (line.startsWith('          ') ? line.slice(10) : line))
    .join('\n');
}

function severityGateScript() {
  const workflow = readRepositoryFile('.github/workflows/codeql.yml');
  const gate = yamlJobBlock(workflow, 'severity-gate');
  return runScript(yamlStepBlock(gate, 'Fail on open critical/high CodeQL alerts'));
}

function runSeverityGate(fakeGhOutput, fakeGhStatus = 0) {
  const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'a11oy-codeql-gate-'));
  const fakeBin = path.join(temporaryRoot, 'bin');
  const fakeGh = path.join(fakeBin, 'gh');
  const runnerTemp = path.join(temporaryRoot, 'runner');

  mkdirSync(fakeBin, { recursive: true });
  mkdirSync(runnerTemp, { recursive: true });
  writeFileSync(
    fakeGh,
    '#!/usr/bin/env bash\nprintf \'%s\' "${FAKE_GH_OUTPUT}"\nexit "${FAKE_GH_STATUS}"\n',
  );
  chmodSync(fakeGh, 0o755);

  try {
    return spawnSync('bash', ['-c', severityGateScript()], {
      encoding: 'utf8',
      env: {
        ...process.env,
        ANALYZE_RESULT: 'success',
        CONTRACT_RESULT: 'success',
        CODEQL_REPOSITORY: 'szl-holdings/platform',
        CODEQL_REF: 'refs/pull/42/merge',
        FAKE_GH_OUTPUT: fakeGhOutput,
        FAKE_GH_STATUS: String(fakeGhStatus),
        GH_TOKEN: 'test-token-not-a-secret',
        PATH: `${fakeBin}:${process.env.PATH}`,
        RUNNER_TEMP: runnerTemp,
      },
    });
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
}

function codeqlAlert(overrides = {}) {
  return {
    number: 17,
    state: 'open',
    tool: { name: 'CodeQL' },
    rule: {
      id: 'js/example-rule',
      security_severity_level: 'medium',
      severity: 'warning',
    },
    most_recent_instance: { ref: 'refs/pull/42/merge' },
    ...overrides,
  };
}

test('CodeQL severity gate reads the exact synthetic PR merge ref', () => {
  const workflow = readRepositoryFile('.github/workflows/codeql.yml');
  const gate = yamlJobBlock(workflow, 'severity-gate');

  assert.match(
    gate,
    /^ {10}CODEQL_REF: refs\/pull\/\$\{\{ github\.event\.pull_request\.number \}\}\/merge$/m,
  );
  assert.doesNotMatch(gate, /pull_request\.head\.ref/);
  assert.doesNotMatch(gate, /refs\/heads\/\$\{REF\}/);
  assert.match(gate, /-f "ref=\$\{CODEQL_REF\}"/);
});

test('CodeQL runs the release-security contract through the terminating test runner', () => {
  const workflow = readRepositoryFile('.github/workflows/codeql.yml');
  const packageJson = JSON.parse(readRepositoryFile('package.json'));
  const contract = yamlJobBlock(workflow, 'severity-gate-contract');

  assert.match(
    contract,
    /^ {8}run: node --test scripts\/ci\/release-security-workflows\.test\.mjs$/m,
  );
  assert.match(packageJson.scripts.test, /scripts\/ci\/release-security-workflows\.test\.mjs/);
});

test('CodeQL alert query exhausts pagination and retains page boundaries', () => {
  const workflow = readRepositoryFile('.github/workflows/codeql.yml');
  const gate = yamlJobBlock(workflow, 'severity-gate');
  const step = yamlStepBlock(gate, 'Fail on open critical/high CodeQL alerts');

  assert.match(step, /gh api --method GET --paginate --slurp/);
  assert.match(step, /code-scanning\/alerts/);
  assert.match(step, /-f state=open/);
  assert.match(step, /-f tool_name=CodeQL/);
  assert.match(step, /-F per_page=100/);
  assert.doesNotMatch(step, /code-scanning\/alerts\?[^\n]*per_page=100/);
});

test('CodeQL severity gate fails closed on analyzer, contract, API, and evidence failures', () => {
  const workflow = readRepositoryFile('.github/workflows/codeql.yml');
  const gate = yamlJobBlock(workflow, 'severity-gate');
  const step = yamlStepBlock(gate, 'Fail on open critical/high CodeQL alerts');

  assert.match(gate, /^ {4}needs: \[analyze, severity-gate-contract\]$/m);
  assert.match(step, /if \[ "\$\{ANALYZE_RESULT\}" != "success" \]/);
  assert.match(step, /if \[ "\$\{CONTRACT_RESULT\}" != "success" \]/);
  assert.match(step, /if ! gh api --method GET --paginate --slurp/);
  assert.match(step, /if \[ ! -s "\$\{alerts_file\}" \]/);
  assert.match(step, /if ! jq -e --arg expected_ref "\$\{CODEQL_REF\}"/);
  assert.doesNotMatch(step, /\|\| true/);
  assert.doesNotMatch(step, /continue-on-error/);
});

test('CodeQL evidence validation rejects ambiguous pages and alerts', () => {
  const workflow = readRepositoryFile('.github/workflows/codeql.yml');
  const gate = yamlJobBlock(workflow, 'severity-gate');
  const step = yamlStepBlock(gate, 'Fail on open critical/high CodeQL alerts');

  assert.match(step, /type == "array" and\n {14}length > 0/);
  assert.match(step, /all\(\.\[\]; type == "array" and length <= 100\)/);
  assert.match(step, /\.state == "open"/);
  assert.match(step, /\.tool\.name == "CodeQL"/);
  assert.match(step, /\.most_recent_instance\.ref == \$expected_ref/);
  assert.match(step, /\[\.\[\]\[\] \| \.number\] \| unique \| length/);
  assert.match(step, /select\(\.sev == "critical" or \.sev == "high"\)/);
});

test('CodeQL waits for uploaded analysis processing before reading alerts', () => {
  const workflow = readRepositoryFile('.github/workflows/codeql.yml');
  const analyze = yamlJobBlock(workflow, 'analyze');

  assert.match(analyze, /^ {10}wait-for-processing: true$/m);
});

test('CodeQL severity gate shell and jq program accept complete clean evidence', () => {
  const syntax = spawnSync('bash', ['-n', '-c', severityGateScript()], {
    encoding: 'utf8',
  });
  assert.equal(syntax.status, 0, syntax.stderr);

  const empty = runSeverityGate('[[]]');
  assert.equal(empty.status, 0, empty.stderr);
  assert.match(empty.stdout, /pagination exhausted 1 page\(s\)/);

  const nonblocking = runSeverityGate(JSON.stringify([[codeqlAlert()]]));
  assert.equal(nonblocking.status, 0, nonblocking.stderr);
  assert.match(nonblocking.stdout, /observed 1 open alert\(s\)/);
});

test('CodeQL severity gate blocks malformed, incomplete, and cross-ref evidence', () => {
  for (const fixture of [
    '',
    '[]',
    '{}',
    JSON.stringify([{}]),
    JSON.stringify([[codeqlAlert({ most_recent_instance: { ref: 'refs/heads/main' } })]]),
    JSON.stringify([[codeqlAlert()], [codeqlAlert()]]),
  ]) {
    const result = runSeverityGate(fixture);
    assert.notEqual(result.status, 0, `fixture unexpectedly passed: ${fixture}`);
  }

  const apiFailure = runSeverityGate('[[]]', 1);
  assert.notEqual(apiFailure.status, 0, 'GitHub API failure unexpectedly passed');
});

test('CodeQL severity gate blocks every open high or critical alert', () => {
  for (const severity of ['high', 'critical']) {
    const result = runSeverityGate(
      JSON.stringify([
        [
          codeqlAlert({
            rule: {
              id: `js/${severity}-example`,
              security_severity_level: severity,
              severity: 'error',
            },
          }),
        ],
      ]),
    );
    assert.notEqual(result.status, 0, `${severity} alert unexpectedly passed`);
    assert.match(result.stdout, new RegExp(`\\[${severity}\\]`));
  }
});

test('Trivy and Grype workflow labels describe filesystem/SCA scanning only', () => {
  const workflow = readRepositoryFile('.github/workflows/trivy.yml');

  assert.match(workflow, /^name: Trivy \+ Grype filesystem dependency scan$/m);
  assert.match(workflow, /^ {4}name: Trivy filesystem\/SCA scan$/m);
  assert.match(workflow, /^ {4}name: Grype filesystem\/SCA gate \(fail on HIGH\/CRITICAL\)$/m);
  assert.match(workflow, /^ {10}scan-type: 'fs'$/m);
  assert.match(workflow, /^ {10}scan-ref: '\.'$/m);
  assert.match(workflow, /^ {10}path: "\."$/m);
  assert.doesNotMatch(workflow, /\bcontainer\b/i);
  assert.doesNotMatch(workflow, /\bimage scan(?:ning)?\b/i);
});

test('Grype gate retains raw evidence and admits only verified local patches', () => {
  const workflow = readRepositoryFile('.github/workflows/trivy.yml');
  const branchProtection = readRepositoryFile('.github/BRANCH_PROTECTION.md');
  const grype = yamlJobBlock(workflow, 'grype-gate');
  const rawScan = yamlStepBlock(grype, 'Scan repository filesystem with Grype (raw JSON)');
  const digestCapture = yamlStepBlock(grype, 'Seal raw Grype evidence digest');
  const verification = yamlStepBlock(grype, 'Verify local patches and gate raw Grype evidence');
  const evidenceCheck = yamlStepBlock(grype, 'Require nonempty Grype evidence files');
  const uploadVerification = yamlStepBlock(grype, 'Verify raw Grype evidence digest before upload');
  const rawEvidence = yamlStepBlock(grype, 'Upload raw Grype evidence');
  const gateEvidence = yamlStepBlock(grype, 'Upload Grype gate report');
  const summary = yamlStepBlock(grype, 'Publish Grype gate summary');
  const script = runScript(verification);

  assert.match(grype, /^ {4}timeout-minutes: 20$/m);
  assert.match(grype, /^ {8}run: pnpm install --frozen-lockfile --ignore-scripts$/m);
  assert.match(rawScan, /^ {10}fail-build: false$/m);
  assert.match(rawScan, /^ {10}output-format: json$/m);
  assert.match(rawScan, /^ {10}output-file: grype-results\.json$/m);
  assert.match(rawScan, /^ {10}grype-version: v0\.118\.0$/m);
  assert.match(rawScan, /^ {10}by-cve: false$/m);
  assert.match(rawScan, /^ {10}config: \.grype\.yaml$/m);
  assert.doesNotMatch(grype, /fail-build: true/);
  const stepNames = [...grype.matchAll(/^ {6}- name: (.+)$/gm)].map((match) => match[1]);
  const rawScanPosition = stepNames.indexOf('Scan repository filesystem with Grype (raw JSON)');
  assert.equal(
    stepNames[rawScanPosition + 1],
    'Seal raw Grype evidence digest',
    'raw Grype evidence was not sealed immediately after the scan',
  );
  assert.match(digestCapture, /^ {10}test -s grype-results\.json$/m);
  assert.match(
    digestCapture,
    /^ {10}sha256sum grype-results\.json > grype-results\.json\.sha256$/m,
  );

  const behaviorTests = script.indexOf(
    'node --test scripts/qa/gate-grype-report.test.mjs scripts/qa/dependency-patches.test.mjs scripts/qa/third-party-licenses.test.mjs scripts/ci/release-security-workflows.test.mjs',
  );
  const gateDigestCheck = script.indexOf('sha256sum --check --strict grype-results.json.sha256');
  const gate = script.indexOf('node scripts/qa/gate-grype-report.mjs');
  assert.notEqual(behaviorTests, -1, 'missing Grype and dependency-patch behavior tests');
  assert.ok(gateDigestCheck > behaviorTests, 'raw evidence was not verified after behavior tests');
  assert.ok(gate > gateDigestCheck, 'raw evidence was not verified immediately before the gate');
  assert.ok(gate > behaviorTests, 'Grype mitigation gate ran before behavior tests');
  assert.doesNotMatch(verification, /continue-on-error/);

  assert.match(evidenceCheck, /^ {8}if: always\(\)$/m);
  assert.match(evidenceCheck, /^ {10}test -s grype-results\.json$/m);
  assert.match(evidenceCheck, /^ {10}test -s grype-results\.json\.sha256$/m);
  assert.match(evidenceCheck, /^ {10}test -s grype-gate-report\.md$/m);
  const uploadVerificationPosition = stepNames.indexOf(
    'Verify raw Grype evidence digest before upload',
  );
  assert.equal(
    stepNames[uploadVerificationPosition + 1],
    'Upload raw Grype evidence',
    'raw evidence was not verified immediately before upload',
  );
  assert.match(uploadVerification, /^ {8}id: verify-grype-evidence-upload$/m);
  assert.match(uploadVerification, /^ {8}if: always\(\)$/m);
  assert.match(
    uploadVerification,
    /^ {8}run: sha256sum --check --strict grype-results\.json\.sha256$/m,
  );
  assert.match(
    rawEvidence,
    /^ {8}if: always\(\) && steps\.verify-grype-evidence-upload\.outcome == 'success'$/m,
  );
  assert.match(rawEvidence, /^ {10}path: \|$/m);
  assert.match(rawEvidence, /^ {12}grype-results\.json$/m);
  assert.match(rawEvidence, /^ {12}grype-results\.json\.sha256$/m);
  assert.match(rawEvidence, /^ {10}if-no-files-found: error$/m);
  assert.match(gateEvidence, /^ {8}if: always\(\)$/m);
  assert.match(gateEvidence, /^ {10}path: grype-gate-report\.md$/m);
  assert.match(gateEvidence, /^ {10}if-no-files-found: error$/m);
  assert.doesNotMatch(rawEvidence, /grype-gate-report\.md/);
  assert.doesNotMatch(gateEvidence, /grype-results\.json/);
  assert.match(summary, /^ {8}if: always\(\)$/m);
  assert.match(summary, /\$GITHUB_STEP_SUMMARY/);

  const grypeConfigLines = readRepositoryFile('.grype.yaml')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
  assert.deepEqual(grypeConfigLines, ['ignore: []']);
  assert.match(
    branchProtection,
    /^\| `Grype filesystem\/SCA gate \(fail on HIGH\/CRITICAL\)` \| `\.github\/workflows\/trivy\.yml` \| Raw filesystem\/SCA findings block unless an exact, registered, digest-bound, behavior-tested, unexpired local patch is verified \|$/m,
  );
});

test('dependency audit behavior-tests local patches before admitting mitigations', () => {
  const workflow = readRepositoryFile('.github/workflows/security.yml');
  const dependencyScan = yamlJobBlock(workflow, 'dependency-scan');
  const install = yamlStepBlock(dependencyScan, 'Install dependencies');
  const sbomUpload = yamlStepBlock(dependencyScan, 'Upload current-run SBOM artifact');
  const vulnerabilityUpload = yamlStepBlock(
    dependencyScan,
    'Upload current-run vulnerability report artifact',
  );
  const preflight = yamlStepBlock(
    dependencyScan,
    'Initialize current-run vulnerability failure artifact',
  );
  const step = yamlStepBlock(dependencyScan, 'Generate vulnerability report from pnpm audit');
  const script = runScript(step);
  const patchTests = script.indexOf(
    'node --test scripts/qa/generate-vuln-report.test.js scripts/qa/dependency-patches.test.mjs scripts/qa/third-party-licenses.test.mjs',
  );
  const audit = script.indexOf('node scripts/qa/generate-vuln-report.js');

  assert.match(dependencyScan, /^ {4}timeout-minutes: 20$/m);
  assert.match(install, /^ {8}run: pnpm install --frozen-lockfile$/m);
  assert.match(install, /^ {10}ONNXRUNTIME_NODE_INSTALL: skip$/m);
  assert.doesNotMatch(install, /--ignore-scripts/);
  assert.match(preflight, /^ {8}id: vulnerability-preflight$/m);
  assert.match(preflight, /^ {8}if: always\(\)$/m);
  assert.match(preflight, /^ {8}run: node scripts\/qa\/write-vuln-preflight-report\.mjs$/m);
  assert.match(
    step,
    /^ {8}if: always\(\) && steps\.vulnerability-preflight\.outcome == 'success'$/m,
  );
  assert.notEqual(patchTests, -1, 'missing local dependency-patch behavior tests');
  assert.ok(audit > patchTests, 'vulnerability admission ran before patch behavior tests');
  assert.doesNotMatch(step, /continue-on-error/);

  assert.match(sbomUpload, /^ {8}if: always\(\) && steps\.sbom\.outcome == 'success'$/m);
  assert.match(sbomUpload, /^ {10}path: security\/sbom-latest\.json$/m);
  assert.match(sbomUpload, /^ {10}if-no-files-found: error$/m);
  assert.doesNotMatch(sbomUpload, /vuln-report\.md/);

  assert.match(
    vulnerabilityUpload,
    /^ {8}if: always\(\) && steps\.vulnerability-preflight\.outcome == 'success'$/m,
  );
  assert.match(vulnerabilityUpload, /^ {10}path: security\/vuln-report\.md$/m);
  assert.match(vulnerabilityUpload, /^ {10}if-no-files-found: error$/m);
  assert.doesNotMatch(vulnerabilityUpload, /sbom-latest\.json/);
});

test('license gate replaces stale evidence and blocks denied, unknown, or malformed inventory', () => {
  const workflow = readRepositoryFile('.github/workflows/security.yml');
  const licenseJob = yamlJobBlock(workflow, 'license-report');
  const install = yamlStepBlock(licenseJob, 'Install dependencies');
  const preflight = yamlStepBlock(licenseJob, 'Initialize current-run license failure artifact');
  const generation = yamlStepBlock(licenseJob, 'Generate license compliance report');
  const upload = yamlStepBlock(licenseJob, 'Upload license report artifact');
  const script = runScript(generation);
  const negativeContracts = script.indexOf(
    'node --test scripts/qa/third-party-licenses.test.mjs scripts/ci/release-security-workflows.test.mjs',
  );
  const inventory = script.indexOf('node scripts/qa/generate-license-report.js');

  assert.match(licenseJob, /^ {4}timeout-minutes: 20$/m);
  assert.match(install, /^ {8}run: pnpm install --frozen-lockfile$/m);
  assert.match(install, /^ {10}ONNXRUNTIME_NODE_INSTALL: skip$/m);
  assert.doesNotMatch(install, /--ignore-scripts/);
  assert.match(preflight, /^ {8}id: license-preflight$/m);
  assert.match(preflight, /^ {8}if: always\(\)$/m);
  assert.match(preflight, /^ {8}run: node scripts\/qa\/write-license-preflight-report\.mjs$/m);
  assert.match(
    generation,
    /^ {8}if: always\(\) && steps\.license-preflight\.outcome == 'success'$/m,
  );
  assert.notEqual(negativeContracts, -1, 'missing license negative contracts');
  assert.ok(inventory > negativeContracts, 'license inventory ran before its negative contracts');
  assert.doesNotMatch(generation, /continue-on-error|\|\| true/);

  assert.match(upload, /^ {8}if: always\(\) && steps\.license-preflight\.outcome == 'success'$/m);
  assert.match(upload, /^ {10}path: security\/license-report\.md$/m);
  assert.match(upload, /^ {10}if-no-files-found: error$/m);
  assert.doesNotMatch(upload, /sbom-latest\.json|vuln-report\.md/);
});

test('required aggregate security gate accepts success as its sole passing result', () => {
  const workflow = readRepositoryFile('.github/workflows/security.yml');
  const gate = yamlJobBlock(workflow, 'security-gate');
  const enforcement = yamlStepBlock(gate, 'Check all security jobs passed');
  const script = runScript(enforcement);

  assert.match(
    gate,
    /^ {4}needs: \[dependency-scan, secret-scan, lockfile-integrity, license-report\]$/m,
  );
  assert.match(gate, /^ {4}if: always\(\)$/m);
  assert.doesNotMatch(gate, /^\s+continue-on-error:/m);
  for (const job of ['dependency-scan', 'secret-scan', 'lockfile-integrity', 'license-report']) {
    assert.match(script, new RegExp(`needs\\.${job}\\.result \\}\\}" != "success"`));
  }
  assert.match(script, /^\s*exit 1$/m);
  assert.doesNotMatch(script, /continue-on-error|\|\| true/);
});
