import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { scanTarget } from './scan-secrets.js';

const SCANNER = fileURLToPath(new URL('./scan-secrets.js', import.meta.url));

function privateKey(prefix) {
  const marker = ['-----BEGIN ', prefix, 'PRIVATE KEY-----'].join('');
  const footer = ['-----END ', prefix, 'PRIVATE KEY-----'].join('');
  return `${marker}\n${'A'.repeat(96)}\n${footer}\n`;
}

function scan(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'szl-secret-scan-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const destination = path.join(root, name);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, content, 'utf8');
    }
    return spawnSync(process.execPath, [SCANNER, root], {
      encoding: 'utf8',
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function inspect(files, options) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'szl-secret-scan-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const destination = path.join(root, name);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, content, 'utf8');
    }
    return scanTarget(root, options);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('rejects encrypted Sigstore material in the standard cosign.key output', () => {
  const result = scan({
    'cosign.key': privateKey('ENCRYPTED SIGSTORE '),
  });

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /cosign\.key: Private key \(PEM\)/);
});

test('rejects PEM private-key material', () => {
  const result = scan({
    'signing.pem': privateKey(''),
  });

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /signing\.pem: Private key \(PEM\)/);
});

test('rejects private-key material in uppercase key-file extensions', () => {
  const result = scan({
    'COSIGN.KEY': privateKey('ENCRYPTED SIGSTORE '),
    'signing.PEM': privateKey(''),
  });

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /COSIGN\.KEY: Private key \(PEM\)/);
  assert.match(result.stderr, /signing\.PEM: Private key \(PEM\)/);
});

test('rejects encrypted PKCS#8 private-key material', () => {
  const result = scan({
    'encrypted-signing.pem': privateKey('ENCRYPTED '),
  });

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /encrypted-signing\.pem: Private key \(PEM\)/);
});

test('rejects traditional encrypted PEM metadata before the payload', () => {
  const marker = ['-----BEGIN RSA ', 'PRIVATE KEY-----'].join('');
  const footer = ['-----END RSA ', 'PRIVATE KEY-----'].join('');
  const result = scan({
    'legacy-signing.pem': [
      marker,
      'Proc-Type: 4,ENCRYPTED',
      `DEK-Info: AES-256-CBC,${'A'.repeat(32)}`,
      '',
      'A'.repeat(96),
      footer,
      '',
    ].join('\n'),
  });

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /legacy-signing\.pem: Private key \(PEM\)/);
});

test('allows public keys and non-key placeholders in key extensions', () => {
  const publicMarker = ['-----BEGIN ', 'PUBLIC KEY-----'].join('');
  const publicFooter = ['-----END ', 'PUBLIC KEY-----'].join('');
  const result = scan({
    'cosign.pub.pem': `${publicMarker}\n${'A'.repeat(96)}\n${publicFooter}\n`,
    'placeholder.key': 'configure this file from the approved secret store\n',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /CLEAN/);
});

test('fails closed when the scan target does not exist', () => {
  const missing = path.join(os.tmpdir(), `szl-secret-scan-missing-${process.pid}-${Date.now()}`);
  const result = spawnSync(process.execPath, [SCANNER, missing], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /secret scan incomplete/);
  assert.match(result.stderr, /Scan target does not exist/);
  assert.doesNotMatch(result.stdout, /CLEAN/);
});

test('fails closed when the file scan limit is exceeded', () => {
  const result = inspect(
    {
      'first.md': 'safe',
      'second.md': 'safe',
    },
    { maxFiles: 1 },
  );

  assert.equal(result.hits.length, 0);
  assert.equal(result.scannedFiles, 1);
  assert.equal(result.coverageIssues.length, 1);
  assert.match(result.coverageIssues[0].label, /File scan limit of 1 was exceeded/);
});

test('fails closed when a candidate file cannot be read', () => {
  const result = inspect(
    { 'unreadable.md': 'safe' },
    {
      readFileSync() {
        throw new Error('synthetic read failure');
      },
    },
  );

  assert.deepEqual(result.coverageIssues, [
    { rel: 'unreadable.md', label: 'File could not be read' },
  ]);
});

test('fails closed when a directory cannot be read', () => {
  const result = inspect(
    { 'candidate.md': 'safe' },
    {
      readdirSync() {
        throw new Error('synthetic directory read failure');
      },
    },
  );

  assert.deepEqual(result.coverageIssues, [{ rel: '.', label: 'Directory could not be read' }]);
});

test('scans audit and security trees instead of blanket-excluding them', () => {
  const result = inspect({
    'audit/leaked.md': privateKey(''),
    'security/leaked.md': privateKey('ENCRYPTED SIGSTORE '),
  });

  assert.deepEqual(result.hits.map(({ rel }) => rel).sort(), [
    'audit/leaked.md',
    'security/leaked.md',
  ]);
});

test('scans generated-name directories outside the two root-qualified skips', () => {
  const result = inspect({
    'src/build/leaked.md': privateKey(''),
    'src/dist/leaked.md': privateKey(''),
  });

  assert.deepEqual(result.hits.map(({ rel }) => rel).sort(), [
    'src/build/leaked.md',
    'src/dist/leaked.md',
  ]);
});

test('keeps the lockfile exception path-qualified', () => {
  const result = inspect({
    'pnpm-lock.yaml': privateKey(''),
    'nested/pnpm-lock.yaml': privateKey(''),
  });

  assert.deepEqual(
    result.hits.map(({ rel }) => rel),
    ['nested/pnpm-lock.yaml'],
  );
});

test('allows only the exact AWS documentation key value', () => {
  const result = inspect({
    'audit/example.md': 'AKIAIOSFODNN7EXAMPLE AKIA0000000000EXAMPLE',
    'src/live.md': ['AKIA', 'ABCDEFGHIJKLMNOP'].join(''),
  });

  assert.deepEqual(result.hits, [{ rel: 'src/live.md', label: 'AWS access key' }]);
});
