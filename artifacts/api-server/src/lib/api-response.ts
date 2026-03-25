import type { Response } from "express";
import { InvalidIdError } from "../middlewares/auth";

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export function sendSuccess<T>(res: Response, data: T, status = 200) {
  res.status(status).json(data);
}

export function sendCreated<T>(res: Response, data: T) {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response) {
  res.status(204).send();
}

export function sendError(res: Response, error: string, status = 500, code?: string, details?: unknown) {
  const body: ApiError = { error };
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

export function handleRouteError(res: Response, err: unknown, fallbackMessage: string) {
  if (err instanceof InvalidIdError) {
    sendBadRequest(res, "Invalid ID parameter");
    return;
  }
  if (err && typeof err === "object" && "issues" in err) {
    sendBadRequest(res, "Invalid request data");
    return;
  }
  sendError(res, fallbackMessage);
}
