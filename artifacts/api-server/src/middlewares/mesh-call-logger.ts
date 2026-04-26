/**
 * Mesh Call Log Middleware
 *
 * Records every authenticated inter-service call to the mesh_call_log table
 * after the response is sent. Only logs requests with a resolved meshPrincipal.
 *
 * Intentionally fire-and-forget: logging failures are warned but never
 * interrupt the response path.
 */

import { meshCallLogTable, db } from '@szl-holdings/db';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';

export function meshCallLogger() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = Date.now();

    res.on('finish', () => {
      const principal = req.meshPrincipal;
      if (!principal) return;

      const latencyMs = Date.now() - startedAt;
      const path = req.path || req.url || 'unknown';
      const method = req.method;
      const statusCode = res.statusCode;

      let principalId: string;
      let principalName: string;
      let orgId: number | null = null;

      switch (principal.type) {
        case 'session':
          principalId = String(principal.userId);
          principalName = `user:${principal.userId}`;
          orgId = principal.orgIds[0] ?? null;
          break;
        case 'api_key':
          principalId = String(principal.keyId);
          principalName = `api_key:${principal.keyId}`;
          orgId = principal.orgId;
          break;
        case 'oauth_client':
          principalId = principal.clientId;
          principalName = `oauth:${principal.clientId}`;
          orgId = principal.orgId;
          break;
        case 'internal_agent':
          principalId = principal.name;
          principalName = `agent:${principal.name}`;
          break;
      }

      db.insert(meshCallLogTable)
        .values({
          principalType: principal.type,
          principalId,
          principalName,
          method,
          path,
          statusCode,
          latencyMs,
          orgId: orgId ?? undefined,
        })
        .catch((err) => {
          logger.warn({ err, principalType: principal.type, path }, '[mesh-log] Failed to record call');
        });
    });

    next();
  };
}
