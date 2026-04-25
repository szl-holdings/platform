import { type ChildProcess, spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { SHARED_PROXY_PORT } from '../../packages/proxy-routes.js';

export function apiServerPlugin(): Plugin {
  let child: ChildProcess | null = null;
  const apiRoot = resolve(dirname(import.meta.dirname!), 'api-server');

  function startApi() {
    if (child) return;
    child = spawn(
      'node',
      ['--max-old-space-size=512', '--enable-source-maps', resolve(apiRoot, 'dist/index.mjs')],
      {
        cwd: apiRoot,
        env: { ...process.env, PORT: String(SHARED_PROXY_PORT), __FAST_START_SERVER: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    child.stdout?.on('data', (d: Buffer) => {
      const line = d.toString().trim();
      if (line) {}
    });
    child.stderr?.on('data', (d: Buffer) => {
      const line = d.toString().trim();
      if (line) {}
    });

    child.on('exit', (_code, _signal) => {
      child = null;
      setTimeout(startApi, 3000);
    });
  }

  return {
    name: 'api-server-plugin',
    configureServer() {
      startApi();
    },
    buildEnd() {
      if (child) {
        child.removeAllListeners('exit');
        child.kill();
        child = null;
      }
    },
  };
}
