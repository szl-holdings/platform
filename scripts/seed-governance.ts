import { seedGovernance } from "../artifacts/api-server/src/scripts/seed-governance.js";

seedGovernance()
  .then((result) => { console.log("[runner] seed-governance complete:", result); process.exit(0); })
  .catch((err) => { console.error("[runner] seed-governance failed:", err); process.exit(1); });
