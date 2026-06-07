import { seedMarineExtended } from '../artifacts/api-server/src/scripts/seed-marine-extended.js';

seedMarineExtended()
  .then((_result) => {
    process.exit(0);
  })
  .catch((_err) => {
    process.exit(1);
  });
