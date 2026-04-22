import { seedLyteObservability } from '../lib/lyte-observability-seed.js';

async function main() {
  try {
    const results = await seedLyteObservability();
    for (const [_table, _rows] of Object.entries(results)) {
    }
    process.exit(0);
  } catch (_err) {
    process.exit(1);
  }
}

main();
