/**
 * Sentra Security Event Bus
 *
 * In-process event bus that receives security-relevant events from middleware
 * and routes them to the detection engine, deception grid, and Sentinel agent.
 *
 * Events are also persisted to sentra_events in the DB (with sampling controls).
 */

import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { logger } from '../logger.js';

export type SecurityEventType =
  | 'auth.failure'
  | 'auth.brute_force'
  | 'rate.anomaly'
  | 'geo.drift'
  | 'honey.endpoint_hit'
  | 'canary.triggered'
  | 'payload.suspicious'
  | 'session.replay'
  | 'scraping.detected'
  | 'recon.probe'
  | 'fingerprint.drift'
  | 'tarpit.hit';

export interface SecurityEvent {
  id: string;
  eventType: SecurityEventType;
  sourceIp?: string;
  sessionId?: string;
  userId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  payload: Record<string, unknown>;
  detectedAt: string;
}

class SentraEventBus extends EventEmitter {
  private readonly _droppedCount = { value: 0 };

  constructor() {
    super();
    this.setMaxListeners(50);
  }

  publish(event: SecurityEvent): void {
    logger.debug({ eventType: event.eventType, ip: event.sourceIp }, '[SentraEventBus] event published');
    this.emit('security_event', event);
    this.emit(`event:${event.eventType}`, event);
  }

  onEvent(handler: (event: SecurityEvent) => void): () => void {
    this.on('security_event', handler);
    return () => this.off('security_event', handler);
  }

  onEventType(type: SecurityEventType, handler: (event: SecurityEvent) => void): () => void {
    this.on(`event:${type}`, handler);
    return () => this.off(`event:${type}`, handler);
  }

  get droppedCount(): number {
    return this._droppedCount.value;
  }
}

export const sentraEventBus = new SentraEventBus();

let _persistenceHandler: ((event: SecurityEvent) => Promise<void>) | null = null;

export function registerPersistenceHandler(fn: (event: SecurityEvent) => Promise<void>): void {
  _persistenceHandler = fn;
  sentraEventBus.onEvent((event) => {
    fn(event).catch((err) => logger.debug({ err }, '[SentraEventBus] persistence error (non-fatal)'));
  });
}

export function buildSecurityEvent(
  partial: Omit<SecurityEvent, 'id' | 'detectedAt'>,
): SecurityEvent {
  return {
    ...partial,
    id: randomUUID(),
    detectedAt: new Date().toISOString(),
  };
}
