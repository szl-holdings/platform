#!/usr/bin/env node
import { runConformance } from './conformance.mjs';

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
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      `Conformance: ${report.surface} ${report.passed}/${report.total} ${report.conformant ? 'PASS' : 'FAIL'}`,
    );
    for (const check of report.checks) {
      console.log(`${check.status.padEnd(4)} ${check.id}: ${check.detail}`);
    }
  }
  process.exitCode = report.conformant ? 0 : 1;
} catch (error) {
  console.error(
    `Conformance usage error: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 2;
}
