import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

declare module 'express' {
  interface Request {
    traceId: string;
  }
}

export function requestTracing(req: Request, _res: Response, next: NextFunction): void {
  req.traceId = (req.headers['x-trace-id'] as string | undefined) ?? randomUUID();
  next();
}
