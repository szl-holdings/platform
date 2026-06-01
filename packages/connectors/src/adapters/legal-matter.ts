/**
 * Legal Matter Demo Adapter
 *
 * Synthetic legal signals: matter deadlines, retainer alerts,
 * and billing milestone events for Counsel.
 */

import type { Signal, SignalInput } from "@workspace/ontology/signal";
import type { ConnectorMetadata, ConnectorStatus, LegalMatterConnector } from "../interfaces.js";

export class LegalMatterDemoAdapter implements LegalMatterConnector {
  readonly category = 'legal-matter' as const;
  readonly metadata: ConnectorMetadata = {
    connectorId: 'demo-legal-matter',
    connectorName: 'Legal Matter Demo Connector',
    category: 'legal-matter',
    version: '1.0.0',
    description: 'Synthetic legal matter deadlines and retainer signals for Counsel',
    synthetic: true,
  };

  private _status: ConnectorStatus = 'idle';
  private _emitSignal?: (input: SignalInput) => Promise<Signal>;

  status(): ConnectorStatus {
    return this._status;
  }

  getUpcomingDeadlines() {
    return [
      {
        matterId: 'matter-001',
        matterName: 'Soltana Vessel Compliance Review',
        deadline: new Date(Date.now() + 48 * 3600_000).toISOString(),
        type: 'regulatory-filing',
      },
      {
        matterId: 'matter-002',
        matterName: 'Eastside Park Environmental Clearance',
        deadline: new Date(Date.now() + 72 * 3600_000).toISOString(),
        type: 'due-diligence-deadline',
      },
    ];
  }

  getRetainerStatus() {
    return [
      {
        clientId: 'client-arcturus',
        clientName: 'Arcturus Shipping',
        balanceUsd: 8_500,
        threshold: 10_000,
      },
      { clientId: 'client-szl', clientName: 'SZL Holdings', balanceUsd: 42_000, threshold: 20_000 },
    ];
  }

  async start(emitSignal: (input: SignalInput) => Promise<Signal>): Promise<void> {
    this._emitSignal = emitSignal;
    this._status = 'polling';
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
      type: 'deadline',
      domain: 'legal',
      occurredAt: new Date().toISOString(),
      freshness: 1.0,
      confidence: 0.99,
      severity: 'high',
      entityRefs: [
        {
          entityId: 'matter-001',
          entityType: 'matter',
          displayName: 'Soltana Vessel Compliance Review',
          domain: 'legal',
        },
      ],
      rawPayload: {
        eventType: 'matter_deadline_approaching',
        matterId: 'matter-001',
        matterName: 'Soltana Vessel Compliance Review',
        deadline: new Date(Date.now() + 48 * 3600_000).toISOString(),
        type: 'regulatory-filing',
        hoursRemaining: 48,
      },
      tags: ['deadline', 'regulatory', 'prism-counsel', 'maritime-legal'],
      provenance: { connectorId: 'demo-legal-matter', connectorCategory: 'legal-matter' },
    });

    await this._emitSignal({
      source: 'connector',
      type: 'threshold-breach',
      domain: 'legal',
      occurredAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
      freshness: 0.92,
      confidence: 0.99,
      severity: 'medium',
      entityRefs: [
        {
          entityId: 'client-arcturus',
          entityType: 'organization',
          displayName: 'Arcturus Shipping',
          domain: 'legal',
        },
      ],
      rawPayload: {
        eventType: 'retainer_low',
        clientId: 'client-arcturus',
        clientName: 'Arcturus Shipping',
        balanceUsd: 8_500,
        threshold: 10_000,
        deficit: 1_500,
      },
      tags: ['retainer', 'billing', 'prism-counsel'],
      provenance: { connectorId: 'demo-legal-matter', connectorCategory: 'legal-matter' },
    });
  }
}
