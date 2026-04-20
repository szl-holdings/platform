import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const existing = req.headers["x-request-id"];
  const requestId = typeof existing === "string" && existing.length > 0
    ? existing
    : `aef-${randomUUID()}`;

  req.headers["x-request-id"] = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}

export function getRequestId(req: Request): string {
  const id = req.headers["x-request-id"];
  return typeof id === "string" ? id : `aef-${randomUUID()}`;
}
