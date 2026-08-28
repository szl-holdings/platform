import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

function shellCaseArm(script, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const marker = new RegExp(`^\\s*${escapedLabel}\\)\\s*$`, 'm');
  const match = marker.exec(script);
  assert.notEqual(match, null, `missing shell case arm ${label}`);

  const afterStart = match.index + match[0].length;
  const remainder = script.slice(afterStart);
  const nextArm = /^\s*(?:[A-Za-z][A-Za-z0-9_|-]*|\*)\)\s*$/m.exec(remainder);
  const end = nextArm === null ? script.length : afterStart + nextArm.index;
  return script.slice(afterStart, end);
}

test('Lighthouse matrix failures cannot be neutralized and ONNX CUDA is skipped narrowly', () => {
  const workflow = readRepositoryFile('.github/workflows/lighthouse.yml');
  const lighthouse = yamlJobBlock(workflow, 'lighthouse');
  const install = yamlStepBlock(
    lighthouse,
    'Install dependencies without optional ONNX CUDA binaries',
  );

  assert.doesNotMatch(lighthouse, /^\s+continue-on-error:/m);
  assert.match(lighthouse, /^ {6}fail-fast: false$/m);
  assert.match(install, /^ {8}run: pnpm install --frozen-lockfile$/m);
  assert.match(install, /^ {10}ONNXRUNTIME_NODE_INSTALL: skip$/m);
  assert.doesNotMatch(install, /--ignore-scripts/);
  assert.match(lighthouse, /Run Lighthouse CI \(accessibility enforced\)/);
});

test('Lighthouse accessibility remains a hard 0.90 assertion', () => {
  const configuration = JSON.parse(readRepositoryFile('.lighthouserc.json'));

  assert.deepEqual(configuration.ci.assert.assertions['categories:accessibility'], [
    'error',
    { minScore: 0.9 },
  ]);
});

test('aggregate Lighthouse gate treats success as the sole passing matrix result', () => {
  const workflow = readRepositoryFile('.github/workflows/lighthouse.yml');
  const gate = yamlJobBlock(workflow, 'lighthouse-gate');
  const enforcement = yamlStepBlock(gate, 'Enforce Lighthouse accessibility gate');
  const script = runScript(enforcement);

  assert.match(gate, /^ {4}needs: lighthouse$/m);
  assert.match(gate, /^ {4}if: always\(\)$/m);
  assert.doesNotMatch(gate, /^\s+continue-on-error:/m);
  assert.match(script, /^result="\$\{\{ needs\.lighthouse\.result \}\}"$/m);
  assert.doesNotMatch(shellCaseArm(script, 'success'), /exit 1/);
  assert.match(shellCaseArm(script, 'failure'), /exit 1/);
  assert.match(shellCaseArm(script, 'cancelled|skipped'), /exit 1/);
  assert.match(shellCaseArm(script, '*'), /exit 1/);
  assert.match(
    shellCaseArm(script, 'failure'),
    /assertion failure is an accessibility-gate failure/,
  );
  assert.match(
    shellCaseArm(script, 'failure'),
    /install, build, serve, browser, or collection failures are infrastructure failures/,
  );
});

test('root test suite executes the Lighthouse workflow contract regression', () => {
  const packageJson = JSON.parse(readRepositoryFile('package.json'));

  assert.match(packageJson.scripts.test, /scripts\/ci\/lighthouse-workflow\.test\.mjs/);
});
