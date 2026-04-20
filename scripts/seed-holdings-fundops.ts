import { seedHoldingsFundops } from '../artifacts/api-server/src/scripts/seed-holdings-fundops.js';

seedHoldingsFundops()
  .then((result) => {
    console.log('[runner] seed-holdings-fundops complete:', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error('[runner] seed-holdings-fundops failed:', err);
    process.exit(1);
  });
