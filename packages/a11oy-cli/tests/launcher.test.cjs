'use strict';

const nodeTest = require('node:test');
const test = (name, fn) =>
  nodeTest(
    name,
    {
      skip: process.platform === 'win32' ? false : 'Windows PowerShell launcher coverage',
    },
    fn,
  );
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { resolve, join, dirname, delimiter } = require('node:path');

const workspace = resolve(__dirname, '..');
const launcher = join(workspace, 'a11oy-atelier.ps1');
// Resolve the parent's configured installation before restricting the child PATH.
// Missing PowerShell on Windows remains a spawn failure, not a skipped test.
const pwsh =
  process.platform === 'win32'
    ? ((process.env.PATH ?? '')
        .split(delimiter)
        .map((directory) => directory.replace(/^"|"$/g, ''))
        .filter(Boolean)
        .map((directory) => resolve(directory, 'pwsh.exe'))
        .find((candidate) => existsSync(candidate)) ?? 'pwsh.exe')
    : 'pwsh';
const env = {
  SystemRoot: process.env.SystemRoot,
  // Explicitly admit only the runtime running these tests. Windows command
  // discovery also needs PATHEXT, which the first credential-free fixture omitted.
  PATH: dirname(process.execPath),
  PATHEXT: '.EXE',
  TEMP: process.env.TEMP,
  TMP: process.env.TMP,
  NO_COLOR: '1',
  // Help/validation cases do not invoke the API. No credentials are inherited.
  A11OY_ATELIER_API_BASE_URL: 'http://127.0.0.1:1',
};

function run(args, script = launcher, environmentOverrides = {}) {
  const result = spawnSync(
    pwsh,
    ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', script, ...args],
    {
      cwd: process.env.ProgramFiles, // Real path with spaces, unrelated to checkout.
      env: { ...env, ...environmentOverrides },
      encoding: 'utf8',
      timeout: 15000,
      maxBuffer: 32768,
      windowsHide: true,
    },
  );
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return result;
}

test('no arguments prints help without starting inference', () => {
  const result = run([]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage: a11oy-atelier/);
  assert.equal(result.stderr, '');
});

for (const args of [['--help'], ['weave', '--help'], ['ask', '--help'], ['doctor', '--help']]) {
  test(`forwards help arguments: ${args.join(' ')}`, () => {
    const result = run(args);
    assert.equal(result.status, 0, result.stderr);
    assert.match(
      result.stdout,
      new RegExp(`Usage: a11oy-atelier${args.length === 2 ? ` ${args[0]}` : ''}`),
    );
    assert.equal(result.stderr, '');
  });
}

test('forwards version to the existing CLI', () => {
  const result = run(['--version']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '0.1.0');
});

test('preserves nonzero CLI exit status', () => {
  const result = run(['definitely-not-an-a11oy-command']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown command 'definitely-not-an-a11oy-command'/);
});

test('a missing Node runtime fails closed without installing anything', () => {
  const result = run(['--help'], launcher, { PATH: '' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /A11oy local launcher:/);
  assert.equal(result.stdout, '');
});

test('metacharacters, spaces and quotes stay in one literal argument', () => {
  const argument =
    'not-a-command "double" \'single\' ; $HOME $(Write-Output SHOULD_NOT_EXECUTE) & | > `';
  const result = run([argument]);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes(`unknown command '${argument}'`), result.stderr);
  assert.equal(result.stdout, '');
});

test('an empty argument is preserved for CLI validation', () => {
  const result = run(['weave', 'offline objective', '--claim', '']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Claims must use KIND:statement/);
  assert.doesNotMatch(result.stderr, /argument missing|ECONNREFUSED|fetch failed/i);
});

for (const failure of [false, true]) {
  for (const strictNativeExit of [false, true]) {
    test(`restores cwd and caller preferences: failure=${failure}, nativeError=${strictNativeExit}`, () => {
      const args = [
        '-Launcher',
        launcher,
        ...(failure ? ['-Failure'] : []),
        ...(strictNativeExit ? ['-StrictNativeExit'] : []),
      ];
      const result = run(args, join(__dirname, 'verify-location.ps1'));
      assert.equal(result.status, failure ? 1 : 0, result.stderr);
      const line = result.stdout
        .split(/\r?\n/)
        .find((value) => value.startsWith('LOCATION_RESULT:'));
      assert.ok(line, result.stdout);
      const observed = JSON.parse(line.slice('LOCATION_RESULT:'.length));
      assert.equal(observed.before, process.env.ProgramFiles);
      assert.equal(observed.after, observed.before);
      assert.equal(observed.cliExit, failure ? 1 : 0);
      assert.equal(observed.nativePreferenceBefore, strictNativeExit);
      assert.equal(observed.nativePreferenceAfter, strictNativeExit);
    });
  }
}

test('dot-sourcing is refused before mutating caller state or exiting its shell', () => {
  const result = run(
    ['-Launcher', launcher, '-StrictNativeExit', '-DotSource'],
    join(__dirname, 'verify-location.ps1'),
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), 'DOTSOURCE_REFUSED');
});
