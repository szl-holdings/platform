import { seedCarlotaClients } from '../artifacts/api-server/src/scripts/seed-carlota-clients.js';

seedCarlotaClients()
  .then((_result) => {
    process.exit(0);
  })
  .catch((_err) => {
    process.exit(1);
  });
