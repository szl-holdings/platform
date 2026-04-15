import { seedPrismCounsel } from "../artifacts/api-server/src/scripts/seed-prism-counsel.js";

seedPrismCounsel()
  .then((result) => { console.log("[runner] seed-prism-counsel complete:", result); process.exit(0); })
  .catch((err) => { console.error("[runner] seed-prism-counsel failed:", err); process.exit(1); });
