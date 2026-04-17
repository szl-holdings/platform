import { seedForge } from "../artifacts/api-server/src/scripts/seed-forge.js";

seedForge()
  .then((result) => { console.log("[runner] seed-forge complete:", result); process.exit(0); })
  .catch((err) => { console.error("[runner] seed-forge failed:", err); process.exit(1); });
