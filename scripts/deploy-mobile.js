#!/usr/bin/env node
/**
 * deploy-mobile.js
 * Master deployment CLI for all 7 mobile apps.
 *
 * Usage:
 *   node scripts/deploy-mobile.js [apps...] [options]
 *
 * Examples:
 *   node scripts/deploy-mobile.js --all --platform both --profile production
 *   node scripts/deploy-mobile.js aegis vessels --platform ios --profile preview
 *   node scripts/deploy-mobile.js terra --platform android --profile production --submit
 *   node scripts/deploy-mobile.js --all --dry-run
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const APPS = {
  aegis: {
    dir: 'artifacts/aegis-mobile',
    name: 'Aegis — SOC Command Center',
    bundleId: 'com.aegis.soc.mobile',
    package: 'com.aegis.soc.mobile',
  },
  'carlota-jo': {
    dir: 'artifacts/carlota-jo-mobile',
    name: 'Carlota Jo — Client App',
    bundleId: 'com.carlotajo.advisory.mobile',
    package: 'com.carlotajo.advisory.mobile',
  },
  lyte: {
    dir: 'artifacts/lyte-mobile',
    name: 'Lyte — AIOps Command',
    bundleId: 'com.lyte.aiops.mobile',
    package: 'com.lyte.aiops.mobile',
  },
  szl: {
    dir: 'artifacts/szl-holdings-mobile',
    name: 'SZL Holdings — Executive Command',
    bundleId: 'com.szlholdings.executive.mobile',
    package: 'com.szlholdings.executive.mobile',
  },
  stephen: {
    dir: 'artifacts/stephen-mobile',
    name: 'Stephen Lutar — Personal Command',
    bundleId: 'com.stephenlutar.founder.mobile',
    package: 'com.stephenlutar.founder.mobile',
  },
  terra: {
    dir: 'artifacts/terra-mobile',
    name: 'Terra — Real Estate Intelligence',
    bundleId: 'com.terra.realestate.mobile',
    package: 'com.terra.realestate.mobile',
  },
  vessels: {
    dir: 'artifacts/vessels-mobile',
    name: 'Vessels — Fleet Command',
    bundleId: 'com.vessels.maritime.mobile',
    package: 'com.vessels.maritime.mobile',
  },
};

const VALID_PLATFORMS = ['ios', 'android', 'both'];
const VALID_PROFILES = ['development', 'preview', 'production'];

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    apps: [],
    all: false,
    platform: 'both',
    profile: 'production',
    submit: false,
    update: false,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--all') opts.all = true;
    else if (arg === '--submit') opts.submit = true;
    else if (arg === '--update') opts.update = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--platform') opts.platform = args[++i];
    else if (arg === '--profile') opts.profile = args[++i];
    else if (!arg.startsWith('--')) opts.apps.push(arg);
  }

  return opts;
}

function printHelp() {
}

function run(cmd, cwd, dryRun) {
  const repoRoot = path.resolve(__dirname, '..');
  const fullCwd = path.resolve(repoRoot, cwd);
  if (dryRun) {
    return;
  }
  const result = spawnSync(cmd, {
    cwd: fullCwd,
    shell: true,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`Command failed (exit ${result.status}): ${cmd}`);
  }
}

function buildApp(_appKey, app, opts) {
  const platforms = opts.platform === 'both' ? ['ios', 'android'] : [opts.platform];

  for (const platform of platforms) {
    const cmd = [
      'eas build',
      `--platform ${platform}`,
      `--profile ${opts.profile}`,
      '--non-interactive',
    ].join(' ');
    run(cmd, app.dir, opts.dryRun);
  }
}

function submitApp(_appKey, app, opts) {
  const platforms = opts.platform === 'both' ? ['ios', 'android'] : [opts.platform];

  for (const platform of platforms) {
    const cmd = [
      'eas submit',
      `--platform ${platform}`,
      `--profile production`,
      '--non-interactive',
      '--latest',
    ].join(' ');
    run(cmd, app.dir, opts.dryRun);
  }
}

function updateApp(_appKey, app, opts) {
  const date = new Date().toISOString().split('T')[0];
  const cmd = [
    'eas update',
    `--channel ${opts.profile}`,
    `--message "OTA update — ${date}"`,
    '--non-interactive',
  ].join(' ');
  run(cmd, app.dir, opts.dryRun);
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!VALID_PLATFORMS.includes(opts.platform)) {
    process.exit(1);
  }

  if (!VALID_PROFILES.includes(opts.profile)) {
    process.exit(1);
  }

  let targetKeys;
  if (opts.all) {
    targetKeys = Object.keys(APPS);
  } else if (opts.apps.length > 0) {
    const invalid = opts.apps.filter((a) => !APPS[a]);
    if (invalid.length > 0) {
      process.exit(1);
    }
    targetKeys = opts.apps;
  } else {
    printHelp();
    process.exit(1);
  }

  if (opts.dryRun) {
  }

  const errors = [];

  for (const appKey of targetKeys) {
    const app = APPS[appKey];

    try {
      if (opts.update) {
        updateApp(appKey, app, opts);
      } else {
        buildApp(appKey, app, opts);
        if (opts.submit) {
          submitApp(appKey, app, opts);
        }
      }
    } catch (err) {
      errors.push({ appKey, error: err.message });
    }
  }

  const _succeeded = targetKeys.length - errors.length;

  if (errors.length > 0) {
    for (const { appKey, error } of errors) {
    }
    process.exit(1);
  } else {
  }
}

main();
