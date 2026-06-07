import { seedLiveSignals } from '../artifacts/api-server/src/scripts/seed-live-signals.js';

seedLiveSignals()
  .then((_result) => {
    process.exit(0);
  })
  .catch((_err) => {
    process.exit(1);
  });
