#!/usr/bin/env node
import { runConformance } from './conformance.mjs';

function writeStdout(value) {
  process.stdout.write(`${value}\n`);
}

function writeStderr(value) {
  process.stderr.write(`${value}\n`);
}

function parseArgs(argv) {
  const args = { json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--surface') args.surface = argv[++index];
    else if (value === '--json') args.json = true;
    else throw new Error(`unknown argument: ${value}`);
  }
  if (!args.surface) throw new Error('--surface is required');
  if (!/^[a-z0-9-]+$/.test(args.surface)) throw new Error('surface has invalid characters');
  return args;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const report = await runConformance({ surface: args.surface });
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
