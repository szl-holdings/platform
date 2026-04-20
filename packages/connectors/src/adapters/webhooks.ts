/**
 * Webhook Demo Adapter
 *
 * Synthetic inbound webhook events from external systems.
 * Emits signals from payment processors, partner APIs, and market data feeds.
 */

import type { Signal, SignalInput } from '@workspace/ontology';
import type { ConnectorMetadata, ConnectorStatus, WebhookConnector } from '../interfaces.js';

export class WebhookDemoAdapter implements WebhookConnector {
  readonly category = 'webhooks' as const;
  readonly metadata: ConnectorMetadata = {
    connectorId: 'demo-webhooks',
    connectorName: 'Webhook Demo Connector',
    category: 'webhooks',
    version: '1.0.0',
    description: 'Synthetic inbound webhook events from external market and partner systems',
    synthetic: true,
  };

  private _status: ConnectorStatus = 'idle';
  private _events: Array<{
    eventId: string;
    source: string;
    payload: Record<string, unknown>;
    receivedAt: string;
  }> = [];
  private _emitSignal?: (input: SignalInput) => Promise<Signal>;

  status(): ConnectorStatus {
    return this._status;
  }

  getReceivedEvents() {
    return this._events;
  }

  async start(emitSignal: (input: SignalInput) => Promise<Signal>): Promise<void> {
    this._emitSignal = emitSignal;
    this._status = 'streaming';
    await this._emitInitialSignals();
  }

  async stop(): Promise<void> {
    this._status = 'stopped';
  }

  async poll(): Promise<Signal[]> {
    return [];
  }

  private async _emitInitialSignals(): Promise<void> {
    if (!this._emitSignal) return;

    await this._emitSignal({
      source: 'connector',
      type: 'market-signal',
      domain: 'maritime',
      occurredAt: new Date(Date.now() - 30 * 60_000).toISOString(),
      freshness: 0.9,
      confidence: 0.95,
      severity: 'medium',
      entityRefs: [],
      rawPayload: {
        eventType: 'charter_rate_spike',
        source: 'baltic-exchange-webhook',
        route: 'TD3C',
        currentRate: 38_200,
        previousRate: 31_500,
        changePercent: 21.3,
        currency: 'USD/day',
      },
      tags: ['charter-rate', 'market', 'baltic-exchange', 'vessels'],
      provenance: { connectorId: 'demo-webhooks', connectorCategory: 'webhooks' },
    });

    this._events.push({
      eventId: 'wh-evt-001',
      source: 'baltic-exchange',
      payload: { route: 'TD3C', rate: 38_200 },
      receivedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
    });
  }
}
