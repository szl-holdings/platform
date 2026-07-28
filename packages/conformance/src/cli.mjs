#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { runConformance } from './conformance.mjs';

function writeStdout(value) {
  process.stdout.write(`${value}\n`);
}

function writeStderr(value) {
  process.stderr.write(`${value}\n`);
}

function optionValue(argv, index, option) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}

function parseArgs(argv) {
  const args = { json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--surface' || value === '--root' || value === '--manifest') {
      const parsedValue = optionValue(argv, index, value);
      if (value === '--surface') args.surface = parsedValue;
      else if (value === '--root') args.root = parsedValue;
      else args.manifest = parsedValue;
      index += 1;
    } else if (value === '--json') {
      args.json = true;
    } else {
      throw new Error(`unknown argument: ${value}`);
    }
  }
  if (!args.surface) throw new Error('--surface is required');
  if (!/^[a-z0-9-]+$/.test(args.surface)) throw new Error('surface has invalid characters');
  return args;
}

try {
  const args = parseArgs(process.argv.slice(2));
  let manifest;
  if (args.manifest) {
    manifest = JSON.parse(await readFile(args.manifest, 'utf8'));
  }
  const report = await runConformance({
    surface: args.surface,
    root: args.root || process.cwd(),
    manifest,
  });
  if (args.json) {
    writeStdout(JSON.stringify(report, null, 2));
  } else {
    writeStdout(
      `Conformance: ${report.surface} ${report.passed}/${report.total} ${report.conformant ? 'PASS' : 'FAIL'}`,
    );
    for (const check of report.checks) {
      writeStdout(`${check.status.padEnd(4)} ${check.id}: ${check.detail}`);
    }
  }
  process.exitCode = report.conformant ? 0 : 1;
} catch (error) {
  writeStderr(`Conformance usage error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
