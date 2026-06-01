import { refreshLiveSignals } from "../artifacts/api-server/src/scripts/refresh-live-signals.js";

refreshLiveSignals()
  .then((_result) => { process.exit(0); })
  .catch((_err) => { process.exit(1); });
