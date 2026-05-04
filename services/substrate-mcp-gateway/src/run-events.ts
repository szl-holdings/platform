/**
 * Substrate MCP Gateway — Run Lifecycle Event Bus
 *
 * Decoupled pub/sub for run lifecycle events. Handlers emit into this bus;
 * the SSE transport subscribes and fan-outs to connected clients.
 *
 * This is an in-process EventEmitter — it covers SSE clients connected to
 * the same gateway instance. Distributed deployments should replace this
 * with a Redis pub/sub or similar.
 */

import { EventEmitter } from 'node:events';

// ─── Event Types ──────────────────────────────────────────────────────────────

export type RunEventType =
  | 'run_started'
  | 'stage_complete'
  | 'run_complete'
  | 'run_failed'
  | 'approval_required'
  | 'approval_granted'
  | 'approval_rejected'
  | 'tool_list_changed'
  | 'roots_list_changed'
  | 'sampling_started'
  | 'sampling_completed'
  | 'elicitation_created'
  | 'elicitation_accepted'
  | 'elicitation_declined'
  | 'elicitation_cancelled';

export interface RunLifecycleEvent {
  type: RunEventType;
  runId?: string;
  workflowId?: string;
  workflowName?: string;
  status?: string;
  stageId?: string;
  actor?: string;
  error?: string;
  timestamp: number;
}

// ─── Event Bus ────────────────────────────────────────────────────────────────

class RunEventBus extends EventEmitter {
  private static readonly CHANNEL = 'run_event';

  emit_run_event(event: RunLifecycleEvent): void {
    this.emit(RunEventBus.CHANNEL, event);
  }

  subscribe(listener: (event: RunLifecycleEvent) => void): () => void {
    this.on(RunEventBus.CHANNEL, listener);
    return () => this.off(RunEventBus.CHANNEL, listener);
  }
}

export const runEventBus = new RunEventBus();
runEventBus.setMaxListeners(512);

/**
 * Convenience helper: emit a run lifecycle event onto the global bus.
 * Call this from tool handlers after significant state changes.
 */
export function emitRunEvent(event: RunLifecycleEvent): void {
  runEventBus.emit_run_event(event);
}

/**
 * Emit a `notifications/tools/list_changed` signal to all connected SSE
 * clients. Call this after any operation that changes the set of tools the
 * gateway exposes (e.g. enabling or disabling an MCP server).
 *
 * Clients that receive this notification should call `tools/list` again to
 * refresh their working tool set.
 */
export function emitToolListChanged(): void {
  runEventBus.emit_run_event({ type: 'tool_list_changed', timestamp: Date.now() });
}
