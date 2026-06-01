import { seedDistributionOS } from '../artifacts/api-server/src/scripts/seed-distribution-os.js';

seedDistributionOS()
  .then((_result) => {
    process.exit(0);
  })
  .catch((_err) => {
    process.exit(1);
  });
