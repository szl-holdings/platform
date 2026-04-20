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

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

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
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           Mobile App Deployment CLI — deploy-mobile.js        ║
╚══════════════════════════════════════════════════════════════╝

USAGE:
  node scripts/deploy-mobile.js [apps...] [options]

APPS (use --all for all apps):
${Object.entries(APPS)
  .map(([key, app]) => `  ${key.padEnd(12)} ${app.name}`)
  .join('\n')}

OPTIONS:
  --all              Target all 7 apps
  --platform <p>     Platform: ios | android | both  (default: both)
  --profile <p>      Build profile: development | preview | production  (default: production)
  --submit           Submit to stores after building (requires credentials)
  --update           Push EAS Update (OTA) instead of full build
  --dry-run          Print commands without executing them
  --help, -h         Show this help message

EXAMPLES:
  # Build all apps for production (both platforms)
  node scripts/deploy-mobile.js --all --profile production

  # Build and submit aegis + vessels for iOS only
  node scripts/deploy-mobile.js aegis vessels --platform ios --submit

  # Push an OTA update to all apps on the production channel
  node scripts/deploy-mobile.js --all --update

  # Preview build for terra on Android
  node scripts/deploy-mobile.js terra --platform android --profile preview

  # Dry run to inspect commands before running
  node scripts/deploy-mobile.js --all --dry-run

PREREQUISITES:
  - EAS CLI installed: npm install -g eas-cli
  - Authenticated: eas login
  - Credentials configured (see docs/mobile-deployment-guide.md)
`);
}

function run(cmd, cwd, dryRun) {
  const repoRoot = path.resolve(__dirname, '..');
  const fullCwd = path.resolve(repoRoot, cwd);
  if (dryRun) {
    console.log(`  [DRY RUN] cd ${cwd} && ${cmd}`);
    return;
  }
  console.log(`  $ ${cmd}`);
  const result = spawnSync(cmd, {
    cwd: fullCwd,
    shell: true,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`Command failed (exit ${result.status}): ${cmd}`);
  }
}

function buildApp(appKey, app, opts) {
  const platforms = opts.platform === 'both' ? ['ios', 'android'] : [opts.platform];

  for (const platform of platforms) {
    const cmd = [
      'eas build',
      `--platform ${platform}`,
      `--profile ${opts.profile}`,
      '--non-interactive',
    ].join(' ');

    console.log(`\n  📦 Building ${app.name} [${platform}]...`);
    run(cmd, app.dir, opts.dryRun);
  }
}

function submitApp(appKey, app, opts) {
  const platforms = opts.platform === 'both' ? ['ios', 'android'] : [opts.platform];

  for (const platform of platforms) {
    const cmd = [
      'eas submit',
      `--platform ${platform}`,
      `--profile production`,
      '--non-interactive',
      '--latest',
    ].join(' ');

    console.log(`\n  🚀 Submitting ${app.name} [${platform}]...`);
    run(cmd, app.dir, opts.dryRun);
  }
}

function updateApp(appKey, app, opts) {
  const date = new Date().toISOString().split('T')[0];
  const cmd = [
    'eas update',
    `--channel ${opts.profile}`,
    `--message "OTA update — ${date}"`,
    '--non-interactive',
  ].join(' ');

  console.log(`\n  ⚡ Publishing OTA update for ${app.name}...`);
  run(cmd, app.dir, opts.dryRun);
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!VALID_PLATFORMS.includes(opts.platform)) {
    console.error(`❌ Invalid platform "${opts.platform}". Use: ios | android | both`);
    process.exit(1);
  }

  if (!VALID_PROFILES.includes(opts.profile)) {
    console.error(`❌ Invalid profile "${opts.profile}". Use: development | preview | production`);
    process.exit(1);
  }

  let targetKeys;
  if (opts.all) {
    targetKeys = Object.keys(APPS);
  } else if (opts.apps.length > 0) {
    const invalid = opts.apps.filter((a) => !APPS[a]);
    if (invalid.length > 0) {
      console.error(`❌ Unknown app(s): ${invalid.join(', ')}`);
      console.error(`   Valid apps: ${Object.keys(APPS).join(', ')}`);
      process.exit(1);
    }
    targetKeys = opts.apps;
  } else {
    console.error('❌ No apps specified. Use --all or list app names.');
    printHelp();
    process.exit(1);
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              Mobile App Deployment Pipeline                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n  Apps:     ${targetKeys.join(', ')}`);
  console.log(`  Platform: ${opts.platform}`);
  console.log(`  Profile:  ${opts.profile}`);
  console.log(`  Submit:   ${opts.submit}`);
  console.log(`  OTA:      ${opts.update}`);
  console.log(`  Dry Run:  ${opts.dryRun}`);

  if (opts.dryRun) {
    console.log('\n  ⚠️  DRY RUN MODE — no commands will be executed\n');
  }

  const errors = [];

  for (const appKey of targetKeys) {
    const app = APPS[appKey];
    console.log(`\n${'─'.repeat(64)}`);
    console.log(`  🔵 ${app.name}`);
    console.log(`     ${app.dir}`);
    console.log(`${'─'.repeat(64)}`);

    try {
      if (opts.update) {
        updateApp(appKey, app, opts);
      } else {
        buildApp(appKey, app, opts);
        if (opts.submit) {
          submitApp(appKey, app, opts);
        }
      }
      console.log(`\n  ✅ ${app.name} — complete`);
    } catch (err) {
      console.error(`\n  ❌ ${app.name} — FAILED: ${err.message}`);
      errors.push({ appKey, error: err.message });
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                       Summary                                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const succeeded = targetKeys.length - errors.length;
  console.log(`  Succeeded: ${succeeded}/${targetKeys.length}`);

  if (errors.length > 0) {
    console.log(`  Failed:`);
    for (const { appKey, error } of errors) {
      console.log(`    - ${appKey}: ${error}`);
    }
    process.exit(1);
  } else {
    console.log('\n  🎉 All apps processed successfully!\n');
  }
}

main();
