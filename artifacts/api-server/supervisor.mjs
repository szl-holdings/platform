import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESTART_DELAY_MS = 3000;

function startServer() {
  console.log(`[supervisor] Starting API server on port ${process.env.PORT || 8080}...`);
  const child = spawn(
    'node',
    ['--max-old-space-size=512', '--enable-source-maps', resolve(__dirname, 'dist/index.mjs')],
    {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env },
    },
  );

  child.on('exit', (code, signal) => {
    console.log(
      `[supervisor] API server exited (code=${code}, signal=${signal}). Restarting in ${RESTART_DELAY_MS}ms...`,
    );
    setTimeout(startServer, RESTART_DELAY_MS);
  });
}

startServer();
