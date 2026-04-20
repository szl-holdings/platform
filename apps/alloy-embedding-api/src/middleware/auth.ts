import type { NextFunction, Request, Response } from 'express';

const AEF_API_KEY = process.env['AEF_API_KEY'] ?? '';
const AUTH_BYPASS = process.env['AEF_AUTH_BYPASS'] === 'true';

function sendUnauthorized(res: Response, msg: string): void {
  res.status(401).json({ error: 'Unauthorized', detail: msg });
}

export function bearerAuth(req: Request, res: Response, next: NextFunction): void {
  if (AUTH_BYPASS) {
    next();
    return;
  }

  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    sendUnauthorized(res, 'Authorization header missing or not Bearer scheme');
    return;
  }

  const token = header.slice(7).trim();
  if (!token) {
    sendUnauthorized(res, 'Bearer token is empty');
    return;
  }

  if (AEF_API_KEY && token !== AEF_API_KEY) {
    sendUnauthorized(res, 'Bearer token is invalid');
    return;
  }

  next();
}

export const HEALTH_PATHS = new Set(['/health', '/metrics']);

export function conditionalAuth(req: Request, res: Response, next: NextFunction): void {
  if (HEALTH_PATHS.has(req.path)) {
    next();
    return;
  }
  bearerAuth(req, res, next);
}
