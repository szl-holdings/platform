/**
 * Email / Calendar Demo Adapter
 *
 * Synthetic email and calendar signals for Carlota Jo hospitality domain.
 * Emits signals for VIP guest arrival prep gaps, urgent messages, and
 * estate-readiness deadlines approaching.
 */

import type { Signal, SignalInput } from '@workspace/ontology';
import type { ConnectorMetadata, ConnectorStatus, EmailCalendarConnector } from '../interfaces.js';

export class EmailCalendarDemoAdapter implements EmailCalendarConnector {
  readonly category = 'email-calendar' as const;
  readonly metadata: ConnectorMetadata = {
    connectorId: 'demo-email-calendar',
    connectorName: 'Email & Calendar Demo Connector',
    category: 'email-calendar',
    version: '1.0.0',
    description: 'Synthetic email and calendar events for hospitality estate ops',
    synthetic: true,
  };

  private _status: ConnectorStatus = 'idle';
  private _emitSignal?: (input: SignalInput) => Promise<Signal>;
  private _interval?: ReturnType<typeof setInterval>;

  status(): ConnectorStatus {
    return this._status;
  }

  getUnreadCount(): number {
    return 7;
  }

  getUpcomingMeetings() {
    return [
      {
        id: 'mtg-001',
        title: 'VIP Pre-Arrival Briefing — Castellano Estate',
        startAt: new Date(Date.now() + 2 * 3600_000).toISOString(),
        attendees: ['estate-mgr@carlota.jo', 'housekeeper@castellano.estate'],
      },
      {
        id: 'mtg-002',
        title: 'Seasonal Deep Clean Sign-Off',
        startAt: new Date(Date.now() + 6 * 3600_000).toISOString(),
        attendees: ['ops@carlota.jo'],
      },
    ];
  }

  async start(emitSignal: (input: SignalInput) => Promise<Signal>): Promise<void> {
    this._emitSignal = emitSignal;
    this._status = 'polling';
    await this._emitInitialSignals();
    this._interval = setInterval(() => this._emitPeriodicSignals(), 45_000);
  }

  async stop(): Promise<void> {
    if (this._interval) clearInterval(this._interval);
    this._status = 'stopped';
  }

  async poll(): Promise<Signal[]> {
    if (!this._emitSignal) return [];
    const signal = await this._emitSignal({
      source: 'connector',
      type: 'deadline',
      domain: 'hospitality',
      occurredAt: new Date().toISOString(),
      freshness: 1.0,
      confidence: 0.99,
      severity: 'high',
      entityRefs: [
        {
          entityId: 'property-castellano',
          entityType: 'property',
          displayName: 'Castellano Estate',
          domain: 'real-estate',
        },
      ],
      rawPayload: {
        eventType: 'vip_arrival_approaching',
        guestId: 'guest-vip-001',
        guestName: 'The Marchetti Family',
        arrivalAt: new Date(Date.now() + 18 * 3600_000).toISOString(),
        openChecklistItems: 4,
        lastInspectionAt: new Date(Date.now() - 72 * 3600_000).toISOString(),
      },
      tags: ['vip', 'arrival', 'readiness', 'carlota-jo'],
      provenance: { connectorId: 'demo-email-calendar', connectorCategory: 'email-calendar' },
    });
    return [signal];
  }

  private async _emitInitialSignals(): Promise<void> {
    if (!this._emitSignal) return;

    await this._emitSignal({
      source: 'connector',
      type: 'deadline',
      domain: 'hospitality',
      occurredAt: new Date(Date.now() - 30 * 60_000).toISOString(),
      freshness: 0.95,
      confidence: 0.99,
      severity: 'high',
      entityRefs: [
        {
          entityId: 'property-castellano',
          entityType: 'property',
          displayName: 'Castellano Estate',
          domain: 'real-estate',
        },
      ],
      rawPayload: {
        eventType: 'vip_arrival_imminent',
        guestId: 'guest-vip-001',
        guestName: 'The Marchetti Family',
        arrivalAt: new Date(Date.now() + 18 * 3600_000).toISOString(),
        openChecklistItems: 4,
        openItems: [
          'Wine cellar temperature calibration',
          'Master suite linen change',
          'Pool heating activation',
          'Security access codes reset',
        ],
        estateManager: 'Carlota Jo Estate Management',
        financialImpactUsd: 45_000,
      },
      tags: ['vip', 'arrival', 'readiness', 'estate-gap', 'carlota-jo'],
      provenance: { connectorId: 'demo-email-calendar', connectorCategory: 'email-calendar' },
    });

    await this._emitSignal({
      source: 'connector',
      type: 'escalation',
      domain: 'hospitality',
      occurredAt: new Date(Date.now() - 15 * 60_000).toISOString(),
      freshness: 0.97,
      confidence: 0.95,
      severity: 'medium',
      entityRefs: [
        {
          entityId: 'property-castellano',
          entityType: 'property',
          displayName: 'Castellano Estate',
          domain: 'real-estate',
        },
      ],
      rawPayload: {
        eventType: 'checklist_item_overdue',
        item: 'Pool heating activation',
        assignee: 'ops-team@castellano.estate',
        dueAt: new Date(Date.now() - 15 * 60_000).toISOString(),
        escalationReason: 'No confirmation received',
      },
      tags: ['checklist', 'overdue', 'escalation', 'carlota-jo'],
      provenance: { connectorId: 'demo-email-calendar', connectorCategory: 'email-calendar' },
    });
  }

  private async _emitPeriodicSignals(): Promise<void> {
    if (!this._emitSignal) return;
    await this._emitSignal({
      source: 'connector',
      type: 'state-change',
      domain: 'hospitality',
      occurredAt: new Date().toISOString(),
      freshness: 1.0,
      confidence: 0.99,
      severity: 'info',
      entityRefs: [
        {
          entityId: 'property-castellano',
          entityType: 'property',
          displayName: 'Castellano Estate',
        },
      ],
      rawPayload: { eventType: 'calendar_sync', syncedAt: new Date().toISOString() },
      tags: ['sync', 'calendar', 'carlota-jo'],
      provenance: { connectorId: 'demo-email-calendar', connectorCategory: 'email-calendar' },
    });
  }
}
