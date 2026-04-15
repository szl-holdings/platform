import { seedMarineExtended } from "../artifacts/api-server/src/scripts/seed-marine-extended.js";

seedMarineExtended()
  .then((result) => { console.log("[runner] seed-marine-extended complete:", result); process.exit(0); })
  .catch((err) => { console.error("[runner] seed-marine-extended failed:", err); process.exit(1); });
