import { seedLiveSignals } from '../artifacts/api-server/src/scripts/seed-live-signals.js';

seedLiveSignals()
  .then((result) => {
    console.log('[runner] seed-live-signals complete:', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error('[runner] seed-live-signals failed:', err);
    process.exit(1);
  });
