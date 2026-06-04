import express, { type Express } from 'express';
import { vi } from 'vitest';

export function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, _res, next) => {
    (req as unknown as Record<string, unknown>).log = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };
    next();
  });

  return app;
}

export function mockAuthUser(app: Express, roles: string[] = ['viewer']) {
  app.use((req, _res, next) => {
    (req as unknown as Record<string, unknown>).user = {
      id: 1,
      displayName: 'Test User',
      email: 'test@example.com',
      roles,
      orgs: [],
    };
    next();
  });
}
