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
  const contract = yamlJobBlock(workflow, 'severity-gate-contract');

  assert.match(
    contract,
    /^ {8}run: node --test scripts\/ci\/release-security-workflows\.test\.mjs$/m,
  );
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
