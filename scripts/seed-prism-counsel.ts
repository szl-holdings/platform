import { seedPrismCounsel } from '../artifacts/api-server/src/scripts/seed-prism-counsel.js';

seedPrismCounsel()
  .then((_result) => {
    process.exit(0);
  })
  .catch((_err) => {
    process.exit(1);
  });
