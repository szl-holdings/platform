import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { FABRIC_API_KEY, FABRIC_API_TENANT_ID, FABRIC_SERVICE_SECRET } from '../runtime-config.js';

function constantTimeTokenEqual(candidate: string, expected: string): boolean {
  const candidateDigest = createHash('sha256').update(candidate, 'utf8').digest();
  const expectedDigest = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

export function bearerAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'missing_authorization',
      message: 'Authorization header is required. Provide a Bearer token.',
    });
    return;
  }

  const token = /^Bearer ([^\s]+)$/i.exec(authHeader)?.[1];

  if (!token) {
    res.status(401).json({
      error: 'invalid_authorization_scheme',
      message: 'Authorization must use the Bearer scheme.',
    });
    return;
  }

  const validApiKey = constantTimeTokenEqual(token, FABRIC_API_KEY);
  const validServiceSecret = FABRIC_SERVICE_SECRET
    ? constantTimeTokenEqual(token, FABRIC_SERVICE_SECRET)
    : false;
  if (validApiKey || validServiceSecret) {
    res.locals.authenticatedTenantId = FABRIC_API_TENANT_ID;
    next();
    return;
  }

  res.status(401).json({
    error: 'invalid_token',
    message: 'The provided bearer token is not valid.',
  });
}
