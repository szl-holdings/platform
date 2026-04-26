import { EventEmitter } from 'node:events';
import { logger } from '../logger.js';

// ─── Domain Event Type Definitions ────────────────────────────────────────────

export interface VesselPositionUpdatedEvent {
  type: 'vessel.position-updated';
  payload: {
    vesselId: number;
    latitude: number | null;
    longitude: number | null;
    speed: number | null;
    recordedAt: string | null;
  };
}

export interface VesselStatusChangedEvent {
  type: 'vessel.status-changed';
  payload: { vesselId: number; previousStatus: string | null; newStatus: string };
}

export interface VesselRiskScoredEvent {
  type: 'vessel.risk-scored';
  payload: { vesselId: number; riskScore: string; domain: string };
}

export interface TerraDealUpdatedEvent {
  type: 'terra.deal-updated';
  payload: { dealId: number; stage: string | null; probability: number | null };
}

export interface TerraLeadCreatedEvent {
  type: 'terra.lead-created';
  payload: { leadId: number; firstName: string; lastName: string; type: string };
}

export interface TerraActionItemUpdatedEvent {
  type: 'terra.action-item-updated';
  payload: { itemId: number; propertyId: string; status: string; previousStatus: string };
}

export interface TerraDistressDetectedEvent {
  type: 'terra.distress-detected';
  payload: { propertyId: string; opportunityScore: number; distressType: string };
}

export interface FirestormIncidentUpdatedEvent {
  type: 'firestorm.incident-updated';
  payload: {
    incidentId: number;
    previousStatus: string;
    newStatus: string;
    severity: string | null;
  };
}

export interface FirestormIncidentEscalatedEvent {
  type: 'firestorm.incident-escalated';
  payload: { incidentId: number; title: string; severity: string | null };
}

export interface FirestormThreatDetectedEvent {
  type: 'firestorm.threat-detected';
  payload: { assessmentId: number; overallRiskScore: number | null; domain: string };
}

export interface PrismCounselApprovalResolvedEvent {
  type: 'prism-counsel.approval-resolved';
  payload: {
    requestId: number;
    matterId: number;
    decision: 'approved' | 'rejected';
    actorId: number;
  };
}

export interface PrismCounselDeadlineApproachingEvent {
  type: 'prism-counsel.deadline-approaching';
  payload: {
    deadlineId: number;
    matterId: number;
    title: string;
    dueDate: string;
    priority: string;
  };
}

export interface PrismCounselRecommendationActedEvent {
  type: 'prism-counsel.recommendation-acted';
  payload: {
    recommendationId: number;
    matterId: number;
    action: 'accepted' | 'dismissed';
    actorId: number;
  };
}

export interface LyteSignalTriagedEvent {
  type: 'lyte.signal-triaged';
  payload: { signalId: number; status: string; severity: string | null; source: string | null };
}

export interface LyteIncidentEscalatedEvent {
  type: 'lyte.incident-escalated';
  payload: {
    incidentId: number;
    severity: string | null;
    targetRole: string;
    reason: string | null;
  };
}

export interface LyteIncidentResolvedEvent {
  type: 'lyte.incident-resolved';
  payload: { incidentId: number; resolution: string; rootCause: string | null };
}

export interface CarlotaInquiryCreatedEvent {
  type: 'carlota-jo.inquiry-created';
  payload: { inquiryId: number; name: string; service: string; status: string };
}

export interface AlloySignalIngestedEvent {
  type: 'alloy.signal-ingested';
  payload: {
    signalId: number;
    severity: string;
    domain: string | null;
    source: string;
    title: string;
  };
}

export interface AlloyWorkflowCreatedEvent {
  type: 'alloy.workflow-created';
  payload: { workflowId: number; signalId: number; workflowType: string; priority: string };
}

export interface AlloyWorkflowRunUpdatedEvent {
  type: 'alloy.workflow-run-updated';
  payload: { runId: number; workflowId: number; state: string };
}

export interface SentraHuntApprovedEvent {
  type: 'sentra.hunt-approved';
  payload: {
    huntId: string;
    huntTitle: string;
    severity: string;
    blastRadiusCost: number;
    affectedBusinessEntities: string[];
    approvedBy: string;
  };
}

export interface SentraRemediationApprovedEvent {
  type: 'sentra.remediation-approved';
  payload: {
    planId: string;
    huntId: string;
    huntTitle: string;
    blastRadiusCost: number;
    stepCount: number;
    approvedBy: string;
    signalsBroadcast: string[];
  };
}

// ─── Union of All Domain Events ────────────────────────────────────────────────

export type DomainEvent =
  | VesselPositionUpdatedEvent
  | VesselStatusChangedEvent
  | VesselRiskScoredEvent
  | TerraDealUpdatedEvent
  | TerraLeadCreatedEvent
  | TerraActionItemUpdatedEvent
  | TerraDistressDetectedEvent
  | FirestormIncidentUpdatedEvent
  | FirestormIncidentEscalatedEvent
  | FirestormThreatDetectedEvent
  | PrismCounselApprovalResolvedEvent
  | PrismCounselDeadlineApproachingEvent
  | PrismCounselRecommendationActedEvent
  | LyteSignalTriagedEvent
  | LyteIncidentEscalatedEvent
  | LyteIncidentResolvedEvent
  | CarlotaInquiryCreatedEvent
  | AlloySignalIngestedEvent
  | AlloyWorkflowCreatedEvent
  | AlloyWorkflowRunUpdatedEvent
  | SentraHuntApprovedEvent
  | SentraRemediationApprovedEvent;

export type DomainEventType = DomainEvent['type'];

export type DomainEventPayload<T extends DomainEventType> = Extract<
  DomainEvent,
  { type: T }
>['payload'];

type DomainEventHandler<T extends DomainEventType> = (
  payload: DomainEventPayload<T>,
) => void | Promise<void>;

// ─── Typed Domain Event Bus ────────────────────────────────────────────────────

class DomainEventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(64);
  }

  publish<T extends DomainEventType>(type: T, payload: DomainEventPayload<T>): void {
    logger.debug({ eventType: type }, 'Domain event published');
    this.emitter.emit(type, payload);
  }

  subscribe<T extends DomainEventType>(type: T, handler: DomainEventHandler<T>): () => void {
    const wrappedHandler = async (payload: DomainEventPayload<T>) => {
      try {
        await handler(payload);
      } catch (err) {
        logger.error({ err, eventType: type }, 'Domain event handler error');
      }
    };
    this.emitter.on(type, wrappedHandler);
    return () => {
      this.emitter.off(type, wrappedHandler);
    };
  }

  subscribeOnce<T extends DomainEventType>(type: T, handler: DomainEventHandler<T>): void {
    this.emitter.once(type, async (payload: DomainEventPayload<T>) => {
      try {
        await handler(payload);
      } catch (err) {
        logger.error({ err, eventType: type }, 'Domain event one-time handler error');
      }
    });
  }
}

export const domainEventBus = new DomainEventBus();
