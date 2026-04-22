import { runNightlyEvals } from './nightly-runner.js';
import { FORGE_SUITE_BY_ID, FORGE_SUITES } from './suites/index.js';
import { ALL_EVAL_TYPES } from './types.js';

function printHelp(): void {
  for (const _s of FORGE_SUITES) {
  }
}

function printList(): void {
  for (const s of FORGE_SUITES) {
    const _redTeam = s.cases.filter((c) => c.isRedTeam).length;
  }
}

function printTypes(): void {
  ALL_EVAL_TYPES.forEach((t, _i) => {
    const _suite = FORGE_SUITES.find((s) => s.evalType === t);
  });
}

export async function runCli(args: string[] = process.argv.slice(2)): Promise<void> {
  const command = args[0];
  const verbose = args.includes('--verbose') || args.includes('-v');

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'list') {
    printList();
    return;
  }

  if (command === 'types') {
    printTypes();
    return;
  }

  if (command === 'run') {
    const suiteArg = args[1];
    const evalTypeFilter = args.find((_a, i) => args[i - 1] === '--eval-type');
    const domainFilter = args.find((_a, i) => args[i - 1] === '--domain');

    if (!suiteArg) {
      process.exit(1);
    }

    let suitesToRun = FORGE_SUITES;

    if (suiteArg !== 'all') {
      const found = FORGE_SUITE_BY_ID[suiteArg];
      if (!found) {
        process.exit(1);
      }
      suitesToRun = [found];
    }

    if (evalTypeFilter) {
      suitesToRun = suitesToRun.filter((s) => s.evalType === evalTypeFilter);
    }
    if (domainFilter) {
      suitesToRun = suitesToRun.filter((s) => s.domain === domainFilter);
    }

    if (suitesToRun.length === 0) {
      process.exit(1);
    }

    const summary = await runNightlyEvals({
      suites: suitesToRun,
      triggeredBy: 'cli',
      verbose: verbose || suitesToRun.length === 1,
    });

    if (!verbose && suitesToRun.length > 1) {
      if (summary.suitesWithRegression > 0) {
      }
    }

    if (summary.criticalRegressions.length > 0) {
      process.exit(2);
    }
    if (summary.suitesWithRegression > 0) {
      process.exit(1);
    }
    return;
  }
  printHelp();
  process.exit(1);
}

const isMain =
  process.argv[1] != null &&
  (process.argv[1].endsWith('cli.ts') ||
    process.argv[1].endsWith('cli.js') ||
    process.argv[1].endsWith('eval-forge'));

if (isMain) {
  runCli(process.argv.slice(2)).catch((_err) => {
    process.exit(1);
  });
}
