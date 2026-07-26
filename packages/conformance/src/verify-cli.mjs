#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { KHIPU_PAYLOAD_TYPE, VERIFICATION_STATUS, verifyDsseFile } from './verify.mjs';

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
  let publicKeyPem;
  if (args.publicKey) {
    try {
      publicKeyPem = await readFile(args.publicKey, 'utf8');
    } catch (error) {
      writeStderr(
        `INDETERMINATE unable to read public key: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      process.exitCode = 2;
    }
  }
  if (process.exitCode !== 2) {
    const result = await verifyDsseFile(args.file, {
      publicKeyPem,
      expectedFingerprint: args.expectedFingerprint,
      expectedPayloadType: KHIPU_PAYLOAD_TYPE,
    });
    if (args.json) {
      writeStdout(JSON.stringify(result, null, 2));
    } else {
      writeStdout(
        result.status === VERIFICATION_STATUS.VERIFIED
          ? `VERIFIED ${result.payloadHash} trust=${result.trust} algorithm=${result.algorithm}`
          : result.status === VERIFICATION_STATUS.INVALID
            ? `FAILED ${result.error}`
            : `INDETERMINATE ${result.error}`,
      );
    }
    process.exitCode =
      result.status === VERIFICATION_STATUS.VERIFIED
        ? 0
        : result.status === VERIFICATION_STATUS.INVALID
          ? 1
          : 2;
  }
} catch (error) {
  writeStderr(`Usage error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
