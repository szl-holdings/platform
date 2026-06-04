import { seedHoldingsFundops } from '../artifacts/api-server/src/scripts/seed-holdings-fundops.js';

seedHoldingsFundops()
  .then((_result) => {
    process.exit(0);
  })
  .catch((_err) => {
    process.exit(1);
  });
