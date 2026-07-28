import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

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
