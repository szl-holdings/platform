import { randomUUID } from 'crypto';
import type {
  ATLASActor,
  ATLASBaseEvent,
  ATLASBusinessValue,
  ATLASDomain,
  ATLASEvent,
  ATLASEventClass,
  ATLASEventHandler,
  ATLASSeverity,
  ATLASSLOImpact,
} from '../types.js';

export type EventSubscription = { unsubscribe: () => void };

class ATLASEventEmitter {
  private handlers = new Map<string, Set<ATLASEventHandler<ATLASEvent>>>();
  private wildcardHandlers = new Set<ATLASEventHandler<ATLASEvent>>();
  private buffer: ATLASEvent[] = [];
  private readonly MAX_BUFFER = 2000;

  on<T extends ATLASEvent>(
    eventClass: T['eventClass'],
    handler: ATLASEventHandler<T>,
  ): EventSubscription {
    const set = this.handlers.get(eventClass) ?? new Set();
    set.add(handler as ATLASEventHandler<ATLASEvent>);
    this.handlers.set(eventClass, set);
    return {
      unsubscribe: () => {
        set.delete(handler as ATLASEventHandler<ATLASEvent>);
      },
    };
  }

  onAll(handler: ATLASEventHandler<ATLASEvent>): EventSubscription {
    this.wildcardHandlers.add(handler);
    return { unsubscribe: () => this.wildcardHandlers.delete(handler) };
  }

  emit(event: ATLASEvent): void {
    this.buffer.push(event);
    if (this.buffer.length > this.MAX_BUFFER) {
      this.buffer.shift();
    }

    const classHandlers = this.handlers.get(event.eventClass);
    if (classHandlers) {
      for (const handler of classHandlers) {
        try {
          const result = handler(event);
          if (result instanceof Promise) {
            result.catch((err: unknown) => {
              console.error(`[business-events] Handler error for ${event.eventClass}:`, err);
            });
          }
        } catch (err) {
          console.error(`[business-events] Handler error for ${event.eventClass}:`, err);
        }
      }
    }

    for (const handler of this.wildcardHandlers) {
      try {
        const result = handler(event);
        if (result instanceof Promise) {
          result.catch((err: unknown) => {
            console.error('[business-events] Wildcard handler error:', err);
          });
        }
      } catch (err) {
        console.error('[business-events] Wildcard handler error:', err);
      }
    }
  }

  getBuffer(windowMs?: number): ATLASEvent[] {
    if (!windowMs) return [...this.buffer];
    const cutoff = Date.now() - windowMs;
    return this.buffer.filter((e) => e.timestamp >= cutoff);
  }

  getByClass(eventClass: ATLASEventClass, windowMs?: number): ATLASEvent[] {
    return this.getBuffer(windowMs).filter((e) => e.eventClass === eventClass);
  }

  getByDomain(domain: ATLASDomain, windowMs?: number): ATLASEvent[] {
    return this.getBuffer(windowMs).filter((e) => e.domain === domain);
  }

  countByClass(windowMs?: number): Record<string, number> {
    const result: Record<string, number> = {};
    for (const event of this.getBuffer(windowMs)) {
      result[event.eventClass] = (result[event.eventClass] ?? 0) + 1;
    }
    return result;
  }

  clear(): void {
    this.buffer = [];
  }
}

export const atlasEventBus = new ATLASEventEmitter();

export interface EmitOptions {
  domain: ATLASDomain;
  tenantId?: string;
  actor?: ATLASActor;
  workflowId?: string;
  correlationId?: string;
  entityIds?: Record<string, string>;
  businessValue?: ATLASBusinessValue;
  sloImpact?: ATLASSLOImpact;
  severity?: ATLASSeverity;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

function baseEvent(eventClass: ATLASEventClass, opts: EmitOptions): ATLASBaseEvent {
  return {
    eventId: randomUUID(),
    eventClass,
    domain: opts.domain,
    tenantId: opts.tenantId,
    actor: opts.actor,
    workflowId: opts.workflowId,
    correlationId: opts.correlationId,
    entityIds: opts.entityIds,
    businessValue: opts.businessValue,
    sloImpact: opts.sloImpact,
    severity: opts.severity,
    tags: opts.tags,
    metadata: opts.metadata,
    timestamp: Date.now(),
    schemaVersion: '1.0',
  };
}

export const atlas = {
  transactionStarted(
    opts: EmitOptions & { transactionType: string; transactionId?: string },
  ): void {
    atlasEventBus.emit({
      ...baseEvent('business.transaction.started', opts),
      eventClass: 'business.transaction.started',
      transactionType: opts.transactionType,
      transactionId: opts.transactionId ?? randomUUID(),
    });
  },

  transactionCompleted(
    opts: EmitOptions & {
      transactionType: string;
      transactionId: string;
      durationMs: number;
      outcome?: 'success' | 'partial' | 'compensated';
    },
  ): void {
    atlasEventBus.emit({
      ...baseEvent('business.transaction.completed', opts),
      eventClass: 'business.transaction.completed',
      transactionType: opts.transactionType,
      transactionId: opts.transactionId,
      durationMs: opts.durationMs,
      outcome: opts.outcome ?? 'success',
    });
  },

  transactionFailed(
    opts: EmitOptions & {
      transactionType: string;
      transactionId: string;
      durationMs: number;
      errorCode?: string;
      errorMessage?: string;
      retryable?: boolean;
    },
  ): void {
    atlasEventBus.emit({
      ...baseEvent('business.transaction.failed', opts),
      eventClass: 'business.transaction.failed',
      transactionType: opts.transactionType,
      transactionId: opts.transactionId,
      durationMs: opts.durationMs,
      errorCode: opts.errorCode,
      errorMessage: opts.errorMessage,
      retryable: opts.retryable,
    });
  },

  riskDetected(
    opts: EmitOptions & {
      riskType: string;
      riskScore?: number;
      riskFactors?: string[];
      mitigationSuggested?: string;
    },
  ): void {
    atlasEventBus.emit({
      ...baseEvent('business.risk.detected', opts),
      eventClass: 'business.risk.detected',
      riskType: opts.riskType,
      riskScore: opts.riskScore,
      riskFactors: opts.riskFactors,
      mitigationSuggested: opts.mitigationSuggested,
    });
  },

  opportunityCreated(
    opts: EmitOptions & {
      opportunityType: string;
      opportunityId?: string;
      estimatedValue?: ATLASBusinessValue;
      expiresAt?: number;
    },
  ): void {
    atlasEventBus.emit({
      ...baseEvent('business.opportunity.created', opts),
      eventClass: 'business.opportunity.created',
      opportunityType: opts.opportunityType,
      opportunityId: opts.opportunityId ?? randomUUID(),
      estimatedValue: opts.estimatedValue,
      expiresAt: opts.expiresAt,
    });
  },

  policyViolation(
    opts: EmitOptions & {
      policyId: string;
      policyName: string;
      violationType: string;
      autoRemediated?: boolean;
      remediationNote?: string;
    },
  ): void {
    atlasEventBus.emit({
      ...baseEvent('policy.violation.detected', opts),
      eventClass: 'policy.violation.detected',
      policyId: opts.policyId,
      policyName: opts.policyName,
      violationType: opts.violationType,
      autoRemediated: opts.autoRemediated,
      remediationNote: opts.remediationNote,
    });
  },

  recommendationGenerated(
    opts: EmitOptions & {
      recommendationType: string;
      recommendationId?: string;
      confidence?: number;
      modelId?: string;
      reasoningSummary?: string;
    },
  ): void {
    atlasEventBus.emit({
      ...baseEvent('recommendation.generated', opts),
      eventClass: 'recommendation.generated',
      recommendationType: opts.recommendationType,
      recommendationId: opts.recommendationId ?? randomUUID(),
      confidence: opts.confidence,
      modelId: opts.modelId,
      reasoningSummary: opts.reasoningSummary,
    });
  },

  actionApproved(
    opts: EmitOptions & {
      actionId: string;
      actionType: string;
      approvedByUserId?: string;
      approvalDelayMs?: number;
      approvalLevel: 'auto' | 'human' | 'executive';
    },
  ): void {
    atlasEventBus.emit({
      ...baseEvent('action.approved', opts),
      eventClass: 'action.approved',
      actionId: opts.actionId,
      actionType: opts.actionType,
      approvedByUserId: opts.approvedByUserId,
      approvalDelayMs: opts.approvalDelayMs,
      approvalLevel: opts.approvalLevel,
    });
  },

  actionExecuted(
    opts: EmitOptions & {
      actionId: string;
      actionType: string;
      executorId?: string;
      durationMs: number;
      resultSummary?: string;
    },
  ): void {
    atlasEventBus.emit({
      ...baseEvent('action.executed', opts),
      eventClass: 'action.executed',
      actionId: opts.actionId,
      actionType: opts.actionType,
      executorId: opts.executorId,
      durationMs: opts.durationMs,
      resultSummary: opts.resultSummary,
    });
  },

  actionFailed(
    opts: EmitOptions & {
      actionId: string;
      actionType: string;
      durationMs: number;
      errorCode?: string;
      errorMessage?: string;
      rollbackPerformed?: boolean;
    },
  ): void {
    atlasEventBus.emit({
      ...baseEvent('action.failed', opts),
      eventClass: 'action.failed',
      actionId: opts.actionId,
      actionType: opts.actionType,
      durationMs: opts.durationMs,
      errorCode: opts.errorCode,
      errorMessage: opts.errorMessage,
      rollbackPerformed: opts.rollbackPerformed,
    });
  },

  outcomeRealized(
    opts: EmitOptions & {
      outcomeType: string;
      outcomeId?: string;
      measuredValue?: ATLASBusinessValue;
      comparedToBaseline?: number;
      periodDays?: number;
      confidence?: number;
    },
  ): void {
    atlasEventBus.emit({
      ...baseEvent('outcome.realized', opts),
      eventClass: 'outcome.realized',
      outcomeType: opts.outcomeType,
      outcomeId: opts.outcomeId,
      measuredValue: opts.measuredValue,
      comparedToBaseline: opts.comparedToBaseline,
      periodDays: opts.periodDays,
      confidence: opts.confidence,
    });
  },
};
