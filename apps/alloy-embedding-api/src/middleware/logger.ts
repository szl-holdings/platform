import type { NextFunction, Request, Response } from 'express';

export interface StructuredLogger {
  info(data: Record<string, unknown>, msg?: string): void;
  warn(data: Record<string, unknown>, msg?: string): void;
  error(data: Record<string, unknown>, msg?: string): void;
  debug(data: Record<string, unknown>, msg?: string): void;
}

function log(level: string, data: Record<string, unknown>, msg?: string): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'alloy-embedding-api',
    ...data,
    ...(msg ? { msg } : {}),
  };
  process.stdout.write(`${JSON.stringify(entry)}\n`);
}

export const logger: StructuredLogger = {
  info: (data, msg) => log('info', data, msg),
  warn: (data, msg) => log('warn', data, msg),
  error: (data, msg) => log('error', data, msg),
  debug: (data, msg) => log('debug', data, msg),
};

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const traceId = (req as Request & { traceId?: string }).traceId ?? 'unknown';

  res.on('finish', () => {
    logger.info(
      {
        traceId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        latencyMs: Date.now() - start,
        tenantId: (req as Request & { tenantId?: string }).tenantId,
      },
      'request',
    );
  });

  next();
}
