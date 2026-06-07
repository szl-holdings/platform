import { seedAgentOS } from '../artifacts/api-server/src/scripts/seed-agent-os.js';

seedAgentOS()
  .then((_result) => {
    process.exit(0);
  })
  .catch((_err) => {
    process.exit(1);
  });
