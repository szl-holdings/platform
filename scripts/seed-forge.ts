import { seedForge } from '../artifacts/api-server/src/scripts/seed-forge.js';

seedForge()
  .then((_result) => {
    process.exit(0);
  })
  .catch((_err) => {
    process.exit(1);
  });
