import { refreshLiveSignals } from "../artifacts/api-server/src/scripts/refresh-live-signals.js";

refreshLiveSignals()
  .then((result) => { console.log("[runner] refresh-live-signals complete:", result); process.exit(0); })
  .catch((err) => { console.error("[runner] refresh-live-signals failed:", err); process.exit(1); });
