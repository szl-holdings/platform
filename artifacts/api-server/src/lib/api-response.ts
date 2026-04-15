import type { Response } from "express";
import { randomUUID } from "crypto";
import { InvalidIdError } from "../middlewares/auth";

export interface ApiError {
  error: string;
  code?: string;
  correlationId?: string;
  details?: unknown;
}

function getOrCreateCorrelationId(res: Response): string {
  const existing = res.getHeader("X-Correlation-ID") as string | undefined;
  if (existing) return existing;
  const id = randomUUID();
  res.setHeader("X-Correlation-ID", id);
  return id;
}

export function sendSuccess<T>(res: Response, data: T, status = 200, meta?: Record<string, unknown>) {
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

export function sendError(res: Response, error: string, status = 500, code?: string, details?: unknown) {
  const correlationId = getOrCreateCorrelationId(res);
  const body: ApiError = { error, correlationId };
  if (code) body.code = code;
  if (details) body.details = details;
  res.status(status).json(body);
}

export function sendNotFound(res: Response, resource = "Resource") {
  sendError(res, `${resource} not found`, 404, "NOT_FOUND");
}

export function sendBadRequest(res: Response, message: string, details?: unknown) {
  sendError(res, message, 400, "BAD_REQUEST", details);
}

export function sendUnauthorized(res: Response, message = "Authentication required") {
  sendError(res, message, 401, "UNAUTHORIZED");
}

export function sendForbidden(res: Response, message = "Insufficient permissions") {
  sendError(res, message, 403, "FORBIDDEN");
}

export function sendMutation<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data, error: null });
}

export function sendMutationCreated<T>(res: Response, data: T): void {
  sendMutation(res, data, 201);
}

export function sendMutationError(res: Response, error: string, status = 500, code?: string): void {
  const correlationId = getOrCreateCorrelationId(res);
  res.status(status).json({ success: false, data: null, error, code, correlationId });
}

export function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || "50"), 10) || 50));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function handleRouteError(res: Response, err: unknown, fallbackMessage: string) {
  if (err instanceof InvalidIdError) {
    sendBadRequest(res, "Invalid ID parameter");
    return;
  }
  if (err && typeof err === "object" && "issues" in err) {
    sendBadRequest(res, "Invalid request data");
    return;
  }
  if (err != null && typeof err === "object" && "statusCode" in err) {
    const statusCode = (err as { statusCode: unknown }).statusCode;
    if (statusCode === 403) {
      sendForbidden(res, (err instanceof Error ? err.message : null) ?? "Access denied");
      return;
    }
    if (statusCode === 404) {
      sendNotFound(res);
      return;
    }
  }
  sendError(res, fallbackMessage);
}
