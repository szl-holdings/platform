/**
 * Shared test harness for route handler tests.
 *
 * Builds a real Express app that mounts a single v1 router behind the
 * production apiKeyGuard, then exposes a tiny fetch-style client. This boots
 * the same middleware + handler stack a real request hits (minus OTEL, which
 * is covered by otel.test.ts), so the assertions exercise actual handler logic.
 */
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { request } from 'node:http';
import express, { type IRouter } from 'express';
import { apiKeyGuard } from '../middleware/auth.js';

export interface TestClient {
  baseUrl: string;
  close: () => void;
  req: (
    method: string,
    path: string,
    opts?: { body?: unknown; headers?: Record<string, string> },
  ) => Promise<{ status: number; json: any }>;
}

/** Mount a router at `mountPath` behind apiKeyGuard and start listening. */
export async function mountRouter(mountPath: string, router: IRouter): Promise<TestClient> {
  const app = express();
  app.use(express.json({ limit: '4mb' }));
  app.use(mountPath, apiKeyGuard, router);

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const req: TestClient['req'] = (method, path, opts = {}) =>
    new Promise((resolve, reject) => {
      const payload = opts.body !== undefined ? JSON.stringify(opts.body) : undefined;
      const r = request(
        `${baseUrl}${path}`,
        {
          method,
          headers: {
            'content-type': 'application/json',
            ...(opts.headers ?? {}),
          },
        },
        (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () =>
            resolve({ status: res.statusCode ?? 0, json: body ? JSON.parse(body) : null }),
          );
        },
      );
      r.on('error', reject);
      if (payload) r.write(payload);
      r.end();
    });

  return { baseUrl, close: () => server.close(), req };
}
