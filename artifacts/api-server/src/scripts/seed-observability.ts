import { seedLyteObservability } from '../lib/lyte-observability-seed.js';

async function main() {
  console.log('[seed] Starting Lyte observability seed...');
  try {
    const results = await seedLyteObservability();
    console.log('[seed] Complete:');
    for (const [table, rows] of Object.entries(results)) {
      console.log(`  ${table}: ${rows} rows`);
    }
    process.exit(0);
  } catch (err) {
    console.error('[seed] Failed:', err);
    process.exit(1);
  }
}

main();
