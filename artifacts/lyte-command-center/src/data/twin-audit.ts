/**
 * Decision Twin Audit Log
 *
 * Records every Decision Twin outcome: accepted, rejected, or modified.
 * Feeds the proof chain so every causal simulation outcome is replayable.
 *
 * The store is in-process (browser) for demo mode. Wire `setAuditPersistenceAdapter`
 * to a backend endpoint to make events durable across sessions — the adapter fires
 * on every write before the in-memory update, so the seam is clean and non-breaking.
 */

import { useSyncExternalStore } from "react";
import type {
  DecisionTwinAuditEvent,
  TwinAuditPersistenceAdapter,
  DecisionTwinAction,
  PRISMImpact,
} from "@workspace/simulation";

export type TwinVerdict = "accepted" | "rejected" | "modified";

export type { DecisionTwinAuditEvent };

let _auditLog: DecisionTwinAuditEvent[] = [];
let _listeners: Array<() => void> = [];
let _persistenceAdapter: TwinAuditPersistenceAdapter | null = null;

/**
 * Register a persistence adapter so audit events are forwarded to a durable
 * backend on every write. Call this at app init time when a real backend is
 * available. The adapter receives the full event object.
 */
export function setAuditPersistenceAdapter(adapter: TwinAuditPersistenceAdapter): void {
  _persistenceAdapter = adapter;
}

function generateProofRef(signalId: string, action: string, verdict: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `TWIN-${signalId.slice(-3).toUpperCase()}-${action.slice(0, 3).toUpperCase()}-${verdict.slice(0, 3).toUpperCase()}-${ts}`;
}

function notify() {
  _listeners.forEach(l => l());
}

export function writeTwinAuditEvent(
  signalId: string,
  scenarioId: string,
  action: DecisionTwinAction,
  verdict: TwinVerdict,
  prismSnapshot: PRISMImpact[],
  overallRiskBefore: number,
  overallRiskAfter: number,
  overallDelta: number,
  opts?: { operator?: string; modificationNote?: string },
): DecisionTwinAuditEvent {
  const event: DecisionTwinAuditEvent = {
    id: `twin-audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    signalId,
    scenarioId,
    action,
    verdict,
    operator: opts?.operator ?? "Demo Operator",
    prismSnapshot,
    overallRiskBefore,
    overallRiskAfter,
    overallDelta,
    modificationNote: opts?.modificationNote,
    proofRef: generateProofRef(signalId, action, verdict),
    timestamp: Date.now(),
  };

  if (_persistenceAdapter) {
    void _persistenceAdapter(event);
  }

  _auditLog = [event, ..._auditLog];
  notify();
  return event;
}

export function getTwinAuditLog(): DecisionTwinAuditEvent[] {
  return _auditLog;
}

export function getTwinAuditForSignal(signalId: string): DecisionTwinAuditEvent[] {
  return _auditLog.filter(e => e.signalId === signalId);
}

export function getLatestTwinAuditForSignal(signalId: string): DecisionTwinAuditEvent | null {
  return getTwinAuditForSignal(signalId)[0] ?? null;
}

export function subscribeTwinAudit(listener: () => void): () => void {
  _listeners = [..._listeners, listener];
  return () => {
    _listeners = _listeners.filter(l => l !== listener);
  };
}

export function useTwinAuditStore(): DecisionTwinAuditEvent[] {
  return useSyncExternalStore(subscribeTwinAudit, getTwinAuditLog);
}
