#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { verifyDsseFile } from './verify.mjs';

function writeStdout(value) {
  process.stdout.write(`${value}\n`);
}

function writeStderr(value) {
  process.stderr.write(`${value}\n`);
}

function parseArgs(argv) {
  const args = { offline: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--file') args.file = argv[++index];
    else if (value === '--public-key') args.publicKey = argv[++index];
    else if (value === '--expected-fingerprint') args.expectedFingerprint = argv[++index];
    else if (value === '--expected-payload-type') args.expectedPayloadType = argv[++index];
    else if (value === '--offline') args.offline = true;
    else if (value === '--json') args.json = true;
    else throw new Error(`unknown argument: ${value}`);
  }
  if (!args.file) throw new Error('--file is required');
  if (!args.offline) throw new Error('--offline is required; this verifier never uses a network');
  return args;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const publicKeyPem = args.publicKey ? await readFile(args.publicKey, 'utf8') : undefined;
  const result = await verifyDsseFile(args.file, {
    publicKeyPem,
    expectedFingerprint: args.expectedFingerprint,
    expectedPayloadType: args.expectedPayloadType,
  });
  if (args.json) {
    writeStdout(JSON.stringify(result, null, 2));
  } else {
    writeStdout(
      result.valid
        ? `VERIFIED ${result.payloadHash} trust=${result.trust}`
        : `FAILED ${result.error}`,
    );
  }
  process.exitCode = result.valid ? 0 : 1;
} catch (error) {
  writeStderr(`Usage error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
