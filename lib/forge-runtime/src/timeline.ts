import type { PrismDomain } from '@szl-holdings/prism-bus';

export type ForgeTimelineEventType =
  | 'execution_started'
  | 'execution_completed'
  | 'execution_failed'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'tool_called'
  | 'tool_result'
  | 'evidence_captured'
  | 'approval_requested'
  | 'approval_received'
  | 'dry_run_result'
  | 'sandbox_violation'
  | 'policy_check'
  | 'replay_point';

export interface ForgeTimelineEvent {
  id: string;
  executionId: string;
  domain: PrismDomain;
  type: ForgeTimelineEventType;
  label: string;
  timestamp: number;
  durationMs?: number;
  payload?: Record<string, unknown>;
  isReplayPoint?: boolean;
  parentId?: string | null;
}

export interface ForgeReplayCheckpoint {
  checkpointId: string;
  executionId: string;
  label: string;
  capturedAt: number;
  stateSnapshot: Record<string, unknown>;
  eventIndex: number;
}

const MAX_TIMELINE_EVENTS = 2000;
const MAX_CHECKPOINTS = 50;

export class ForgeTimeline {
  private events: ForgeTimelineEvent[] = [];
  private checkpoints: ForgeReplayCheckpoint[] = [];

  record(
    event: Omit<ForgeTimelineEvent, 'id' | 'timestamp'> & { timestamp?: number },
  ): ForgeTimelineEvent {
    const full: ForgeTimelineEvent = {
      ...event,
      id: `forg-tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: event.timestamp ?? Date.now(),
    };
    this.events.unshift(full);
    if (this.events.length > MAX_TIMELINE_EVENTS) {
      this.events.length = MAX_TIMELINE_EVENTS;
    }
    return full;
  }

  createCheckpoint(
    executionId: string,
    label: string,
    stateSnapshot: Record<string, unknown>,
  ): ForgeReplayCheckpoint {
    const checkpoint: ForgeReplayCheckpoint = {
      checkpointId: `forg-ckpt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      executionId,
      label,
      capturedAt: Date.now(),
      stateSnapshot,
      eventIndex: this.events.findIndex((e) => e.executionId === executionId),
    };
    this.checkpoints.unshift(checkpoint);
    if (this.checkpoints.length > MAX_CHECKPOINTS) {
      this.checkpoints.length = MAX_CHECKPOINTS;
    }

    this.record({
      executionId,
      domain: (stateSnapshot.domain as PrismDomain) ?? 'global',
      type: 'replay_point',
      label: `Checkpoint: ${label}`,
      isReplayPoint: true,
      payload: { checkpointId: checkpoint.checkpointId },
    });

    return checkpoint;
  }

  getEventsForExecution(
    executionId: string,
    options: { limit?: number } = {},
  ): ForgeTimelineEvent[] {
    const results = this.events.filter((e) => e.executionId === executionId);
    return results.slice(0, options.limit ?? 200);
  }

  getCheckpointsForExecution(executionId: string): ForgeReplayCheckpoint[] {
    return this.checkpoints.filter((c) => c.executionId === executionId);
  }

  getAllEvents(
    options: { limit?: number; domain?: PrismDomain; executionId?: string } = {},
  ): ForgeTimelineEvent[] {
    let results = this.events;
    if (options.domain) results = results.filter((e) => e.domain === options.domain);
    if (options.executionId) results = results.filter((e) => e.executionId === options.executionId);
    return results.slice(0, options.limit ?? 100);
  }
}

export const forgeTimeline = new ForgeTimeline();
