/**
 * Sentra Probe Detection Middleware
 *
 * Runs on every request and emits security events to the Sentra event bus:
 *  - auth.failure events on 401/403 responses
 *  - rate.anomaly events when rate limits fire
 *  - scraping.detected on high-frequency requests
 *  - tarpit delay for confirmed attackers
 *
 * Also applies:
 *  - IP block enforcement (deny blocked IPs immediately)
 *  - Tarpit delay (slow-roll responses for tarpitted IPs)
 */

import type { NextFunction, Request, Response } from 'express';
import { sentraEventBus, buildSecurityEvent } from '../lib/sentra-defense/event-bus.js';
import {
  isIpBlocked,
  isIpTarpitted,
  isSessionRevoked,
} from '../lib/sentra-defense/active-response.js';
import { logger } from '../lib/logger.js';

const REQUEST_COUNTS = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 60_000;
const SCRAPING_THRESHOLD = 120;

function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    'unknown'
  );
}

function trackRequestRate(ip: string): number {
  const now = Date.now();
  const existing = REQUEST_COUNTS.get(ip);
  if (!existing || now - existing.windowStart > WINDOW_MS) {
    REQUEST_COUNTS.set(ip, { count: 1, windowStart: now });
    return 1;
  }
  existing.count++;
  return existing.count;
}

export function sentraProbeDetectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const ip = getClientIp(req);

  if (isIpBlocked(ip)) {
    logger.info({ ip, path: req.path }, '[SentraProbe] blocked IP denied');
    res.status(403).json({ error: 'Access denied', code: 'IP_BLOCKED' });
    return;
  }

  const reqCount = trackRequestRate(ip);
  if (reqCount > SCRAPING_THRESHOLD) {
    const event = buildSecurityEvent({
      eventType: 'scraping.detected',
      sourceIp: ip,
      path: req.path,
      method: req.method,
      severity: 'medium',
      payload: { requestsInWindow: reqCount },
    });
    sentraEventBus.publish(event);
  }

  const sessionId = req.headers['x-session-id'] as string | undefined;
  if (sessionId && isSessionRevoked(sessionId)) {
    logger.info({ ip, sessionId }, '[SentraProbe] revoked session denied');
    res.status(401).json({ error: 'Session revoked', code: 'SESSION_REVOKED' });
    return;
  }

  if (isIpTarpitted(ip)) {
    const delay = 3000 + Math.random() * 2000;
    logger.debug({ ip, delay }, '[SentraProbe] tarpitting client');

    const honeyEvent = buildSecurityEvent({
      eventType: 'tarpit.hit',
      sourceIp: ip,
      path: req.path,
      method: req.method,
      severity: 'info',
      payload: { delayMs: Math.round(delay) },
    });
    sentraEventBus.publish(honeyEvent);

    res.on('finish', () => {});
    setTimeout(() => next(), delay);
    return;
  }

  res.on('finish', () => {
    const status = res.statusCode;

    if (status === 401 || status === 403) {
      const event = buildSecurityEvent({
        eventType: 'auth.failure',
        sourceIp: ip,
        path: req.path,
        method: req.method,
        statusCode: status,
        severity: 'low',
        payload: { headers: {}, statusCode: status },
      });
      sentraEventBus.publish(event);
    }
  });

  next();
}

export function sentraAuthFailureTracker(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  next();
}
