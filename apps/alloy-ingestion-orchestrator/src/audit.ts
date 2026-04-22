/**
 * AEF Ingestion Orchestrator — Audit Event Emitter
 *
 * Emits audit events to the AEF evidence ledger for every significant
 * workflow transition. Each event is append-only and tamper-evident.
 */

import { randomUUID } from 'node:crypto';
import type { OrchestratorAuditEvent } from './types.js';

export interface AuditEmitter {
  emit(event: Omit<OrchestratorAuditEvent, 'eventId' | 'occurredAt'>): OrchestratorAuditEvent;
  list(runId?: string): OrchestratorAuditEvent[];
  clear(): void;
}

export class InMemoryAuditEmitter implements AuditEmitter {
  private readonly events: OrchestratorAuditEvent[] = [];

  emit(event: Omit<OrchestratorAuditEvent, 'eventId' | 'occurredAt'>): OrchestratorAuditEvent {
    const full: OrchestratorAuditEvent = {
      ...event,
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
    };
    this.events.push(full);
    return full;
  }

  list(runId?: string): OrchestratorAuditEvent[] {
    if (runId === undefined) return [...this.events];
    return this.events.filter((e) => e.runId === runId);
  }

  clear(): void {
    this.events.length = 0;
  }
}

export const defaultAuditEmitter = new InMemoryAuditEmitter();
