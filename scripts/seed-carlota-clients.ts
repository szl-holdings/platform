import { seedCarlotaClients } from "../artifacts/api-server/src/scripts/seed-carlota-clients.js";

seedCarlotaClients()
  .then((result) => { console.log("[runner] seed-carlota-clients complete:", result); process.exit(0); })
  .catch((err) => { console.error("[runner] seed-carlota-clients failed:", err); process.exit(1); });
