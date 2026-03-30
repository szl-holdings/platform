import type { Request, Response, NextFunction } from "express";
import { serverTelemetry } from "@workspace/observability";

export function telemetryMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
    serverTelemetry.recordRequest({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: elapsed,
      timestamp: Date.now(),
      correlationId: req.correlationId,
    });
  });

  next();
}
