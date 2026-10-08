import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { FABRIC_API_KEY, FABRIC_API_TENANT_ID, FABRIC_SERVICE_SECRET } from '../runtime-config.js';

function constantTimeTokenEqual(candidate: string, expected: string): boolean {
  // These are opaque API tokens, compared directly rather than stored password hashes.
  const candidateBytes = Buffer.from(candidate, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  return (
    candidateBytes.length === expectedBytes.length && timingSafeEqual(candidateBytes, expectedBytes)
  );
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
