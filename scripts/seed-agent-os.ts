import { seedAgentOS } from '../artifacts/api-server/src/scripts/seed-agent-os.js';

seedAgentOS()
  .then((result) => {
    console.log('[runner] seed-agent-os complete:', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error('[runner] seed-agent-os failed:', err);
    process.exit(1);
  });
