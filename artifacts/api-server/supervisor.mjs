import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESTART_DELAY_MS = 3000;

function startServer() {
  const child = spawn(
    'node',
    ['--max-old-space-size=512', '--enable-source-maps', resolve(__dirname, 'dist/index.mjs')],
    {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env },
    },
  );

  child.on('exit', (_code, _signal) => {
    setTimeout(startServer, RESTART_DELAY_MS);
  });
}

startServer();
