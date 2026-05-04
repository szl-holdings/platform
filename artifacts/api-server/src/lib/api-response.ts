import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { InvalidIdError } from '../middlewares/auth';

export interface ApiError {
  error: string;
  code?: string;
  requestId?: string;
  correlationId?: string;
  details?: unknown;
}

function getOrCreateRequestId(res: Response): { requestId: string; correlationId: string } {
  const requestId = (res.getHeader('X-Request-ID') as string | undefined) ?? randomUUID();
  const correlationId = (res.getHeader('X-Correlation-ID') as string | undefined) ?? requestId;
  if (!res.getHeader('X-Request-ID')) res.setHeader('X-Request-ID', requestId);
  if (!res.getHeader('X-Correlation-ID')) res.setHeader('X-Correlation-ID', correlationId);
  return { requestId, correlationId };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: Record<string, unknown>,
) {
  if (meta) {
    res.status(status).json({ data, meta });
  } else {
    res.status(status).json(data);
  }
}

export function sendCreated<T>(res: Response, data: T) {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response) {
  res.status(204).send();
}

export function sendError(
  res: Response,
  error: string,
  status = 500,
  code?: string,
  details?: unknown,
) {
  const { requestId, correlationId } = getOrCreateRequestId(res);
  const body: ApiError = {
    error,
    code: code ?? (status >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR'),
    requestId,
    correlationId,
  };
  if (details) body.details = details;
  res.status(status).json(body);
}

export function sendNotFound(res: Response, resource = 'Resource') {
  sendError(res, `${resource} not found`, 404, 'NOT_FOUND');
}

export function sendBadRequest(res: Response, message: string, details?: unknown) {
  sendError(res, message, 400, 'BAD_REQUEST', details);
}

export function sendUnauthorized(res: Response, message = 'Authentication required') {
  sendError(res, message, 401, 'UNAUTHORIZED');
}

export function sendForbidden(res: Response, message = 'Insufficient permissions') {
  sendError(res, message, 403, 'FORBIDDEN');
}

export function sendMutation<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data, error: null });
}

export function sendMutationCreated<T>(res: Response, data: T): void {
  sendMutation(res, data, 201);
}

export function sendMutationError(
  res: Response,
  error: string,
  status = 500,
  code?: string,
  details?: unknown,
): void {
  sendError(res, error, status, code ?? 'MUTATION_ERROR', details);
}

export function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '50'), 10) || 50));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function sendConflict(res: Response, message = 'Resource conflict') {
  sendError(res, message, 409, 'CONFLICT');
}

export function sendTooManyRequests(
  res: Response,
  message = 'Rate limit exceeded',
  retryAfterSeconds?: number,
) {
  if (retryAfterSeconds !== undefined) res.setHeader('Retry-After', String(retryAfterSeconds));
  sendError(res, message, 429, 'RATE_LIMITED');
}

export function sendServiceUnavailable(res: Response, message = 'Service temporarily unavailable') {
  sendError(res, message, 503, 'SERVICE_UNAVAILABLE');
}

export function handleRouteError(res: Response, err: unknown, fallbackMessage: string) {
  // Governance gate blocks must surface as structured 403 responses regardless
  // of which call site threw them. Pattern: governance_gate_blocked:<model>:<gates>
  if (err instanceof Error && err.message.startsWith('governance_gate_blocked:')) {
    const parts = err.message.split(':');
    const model = parts[1] ?? 'unknown';
    const failedGates = (parts.slice(2).join(':') || '').split(',').filter(Boolean);
    res.status(403).json({
      error: 'governance_gate_blocked',
      model,
      failedGates,
      message: `Inference blocked for model "${model}": gates [${failedGates.join(', ')}] not satisfied.`,
    });
    return;
  }
  if (err instanceof InvalidIdError) {
    sendBadRequest(res, 'Invalid ID parameter');
    return;
  }
  if (err && typeof err === 'object' && 'issues' in err) {
    const issues = (err as { issues: Array<{ path?: (string | number)[]; message?: string }> })
      .issues;
    const details = issues?.map((i) => ({
      path: i.path?.join('.'),
      message: i.message,
    }));
    sendBadRequest(res, 'Validation failed', details);
    return;
  }
  if (err != null && typeof err === 'object' && 'statusCode' in err) {
    const statusCode = (err as { statusCode: unknown }).statusCode;
    const code = 'code' in err ? (err as { code: unknown }).code : undefined;
    if (statusCode === 403) {
      sendForbidden(res, (err instanceof Error ? err.message : null) ?? 'Access denied');
      return;
    }
    if (statusCode === 404) {
      sendNotFound(res);
      return;
    }
    if (statusCode === 409) {
      sendConflict(res, err instanceof Error ? err.message : 'Resource conflict');
      return;
    }
    if (statusCode === 503 && typeof code === 'string') {
      sendError(
        res,
        err instanceof Error ? err.message : 'Service temporarily unavailable',
        503,
        code,
      );
      return;
    }
  }
  sendError(res, fallbackMessage);
}
