/**
 * App Mode Middleware — SZL Holdings Platform
 *
 * Reads APP_MODE (demo | sandbox | production) and enforces the following:
 *
 * Demo mode:
 *   - Sets X-App-Mode: demo header on every response.
 *   - GET requests (/api/* only): serves seeded fixture data when a fixture is
 *     registered for the path; returns a safe empty stub otherwise — live data
 *     is NEVER exposed (no fallthrough to real handlers in demo mode).
 *   - Mutating requests (POST/PUT/PATCH/DELETE): returns a stubbed 200 so
 *     no live data is ever written (auth and demo-reset routes whitelisted).
 *
 * Sandbox mode:
 *   - Sets X-App-Mode: sandbox header.
 *   - No request interception — full staging access.
 *
 * Production mode:
 *   - Sets X-App-Mode: production header.
 *   - Sets X-Destructive-Confirm-Required header on DELETE admin routes
 *     as a signal to the frontend double-confirm guard.
 */

import type { NextFunction, Request, Response } from 'express';
import { demoFixtureStore } from '../lib/demo-fixture-store.js';
import { logger } from '../lib/logger.js';

export type AppMode = 'demo' | 'sandbox' | 'production';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const DEMO_WRITE_WHITELIST = [
  '/api/auth',
  '/api/oidc',
  '/api/admin/seed/reset-demo',
  '/api/healthz',
  '/api/status',
];

const DEMO_READ_BYPASS = [
  '/api/auth',
  '/api/oidc',
  '/api/csrf-token',
  '/api/healthz',
  '/api/status',
  '/api/admin/seed',
];

const PRODUCTION_DESTRUCTIVE_PREFIXES = ['/api/admin'];

function resolveAppMode(): AppMode {
  const raw = (process.env.APP_MODE ?? '').toLowerCase().trim();
  if (raw === 'demo') return 'demo';
  if (raw === 'sandbox') return 'sandbox';
  if (raw === 'production') return 'production';

  const nodeEnv = (process.env.NODE_ENV ?? '').toLowerCase();
  if (nodeEnv === 'production') return 'production';

  const appEnv = (process.env.APP_ENV ?? '').toLowerCase();
  if (appEnv === 'demo' || process.env.DEMO_MODE === 'true') return 'demo';
  if (appEnv === 'sandbox') return 'sandbox';
  if (appEnv === 'production') return 'production';

  return 'sandbox';
}

function isWriteWhitelisted(path: string): boolean {
  return DEMO_WRITE_WHITELIST.some((p) => path.startsWith(p));
}

function isReadBypassed(path: string): boolean {
  return DEMO_READ_BYPASS.some((p) => path.startsWith(p));
}

function isDestructivePath(path: string): boolean {
  return PRODUCTION_DESTRUCTIVE_PREFIXES.some((p) => path.startsWith(p));
}

export function appModeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const mode = resolveAppMode();

  res.setHeader('X-App-Mode', mode);

  const isApiPath = req.path.startsWith('/api/');

  if (mode === 'demo' && isApiPath) {
    if (req.method === 'GET' && !isReadBypassed(req.path)) {
      const fixture = demoFixtureStore.get(req.path);
      if (fixture) {
        logger.debug({ path: req.path, mode: 'demo' }, '[app-mode] Demo fixture served');
        res.setHeader('X-Demo-Fixture', 'true');
        res.status(fixture.status ?? 200).json(fixture.data);
        return;
      }
      logger.debug(
        { path: req.path, mode: 'demo' },
        '[app-mode] Demo GET: no fixture, returning empty stub',
      );
      res.setHeader('X-Demo-No-Fixture', 'true');
      res.status(200).json({
        demo: true,
        data: [],
        items: [],
        total: 0,
        message: 'No demo data configured for this endpoint.',
      });
      return;
    }

    if (MUTATING_METHODS.has(req.method) && !isWriteWhitelisted(req.path)) {
      logger.info(
        { method: req.method, path: req.path, mode: 'demo' },
        '[app-mode] Demo intercept: write blocked',
      );
      res.status(200).json({
        ok: true,
        demo: true,
        message: 'This is a demo environment. No data was written.',
        intercepted: { method: req.method, path: req.path },
      });
      return;
    }
  }

  if (mode === 'production' && req.method === 'DELETE' && isDestructivePath(req.path)) {
    res.setHeader('X-Destructive-Confirm-Required', 'true');
  }

  next();
}
