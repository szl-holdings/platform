import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

declare module "express" {
  interface Request {
    traceId: string;
  }
}

export function requestTracing(req: Request, _res: Response, next: NextFunction): void {
  req.traceId = (req.headers["x-trace-id"] as string | undefined) ?? randomUUID();
  next();
}
