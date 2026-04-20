import type { NextFunction, Request, Response } from 'express';

const SERVICE_API_KEY = process.env['AEF_BEARER_TOKEN'] ?? process.env['AEF_API_KEY'];
const SERVICE_TO_SERVICE_SECRET = process.env['AEF_S2S_SECRET'];

if (!SERVICE_API_KEY) {
  throw new Error(
    'AEF_BEARER_TOKEN (or AEF_API_KEY) env var is required — refusing to start with no auth key',
  );
}

export function bearerAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.status(401).json({
      error: 'missing_authorization',
      message: 'Authorization header is required. Provide a Bearer token.',
    });
    return;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    res.status(401).json({
      error: 'invalid_authorization_scheme',
      message: 'Authorization must use the Bearer scheme.',
    });
    return;
  }

  if (token === SERVICE_API_KEY || token === SERVICE_TO_SERVICE_SECRET) {
    next();
    return;
  }

  res.status(401).json({
    error: 'invalid_token',
    message: 'The provided bearer token is not valid.',
  });
}
