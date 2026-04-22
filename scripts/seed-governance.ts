import { seedGovernance } from '../artifacts/api-server/src/scripts/seed-governance.js';

seedGovernance()
  .then((_result) => {
    process.exit(0);
  })
  .catch((_err) => {
    process.exit(1);
  });
