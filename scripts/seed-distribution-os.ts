import { seedDistributionOS } from "../artifacts/api-server/src/scripts/seed-distribution-os.js";

seedDistributionOS()
  .then((result) => { console.log("[runner] seed-distribution-os complete:", result); process.exit(0); })
  .catch((err) => { console.error("[runner] seed-distribution-os failed:", err); process.exit(1); });
