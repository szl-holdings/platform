/**
 * Storage / Docs Demo Adapter
 *
 * Synthetic document change signals: key document updates,
 * unsigned agreement alerts, and compliance document expirations.
 */

import type { Signal, SignalInput } from '@workspace/ontology';
import type { ConnectorMetadata, ConnectorStatus, StorageDocsConnector } from '../interfaces.js';

export class StorageDocsDemoAdapter implements StorageDocsConnector {
  readonly category = 'storage-docs' as const;
  readonly metadata: ConnectorMetadata = {
    connectorId: 'demo-storage-docs',
    connectorName: 'Storage / Docs Demo Connector',
    category: 'storage-docs',
    version: '1.0.0',
    description: 'Synthetic document lifecycle signals for compliance and deal tracking',
    synthetic: true,
  };

  private _status: ConnectorStatus = 'idle';
  private _emitSignal?: (input: SignalInput) => Promise<Signal>;

  status(): ConnectorStatus {
    return this._status;
  }

  getRecentDocuments() {
    return [
      {
        docId: 'doc-001',
        title: 'MV Soltana — Charter Party Amendment v3',
        updatedAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
        author: 'legal@arcturus.sh',
      },
      {
        docId: 'doc-002',
        title: 'Castellano Estate — VIP Arrival SLA Agreement',
        updatedAt: new Date(Date.now() - 1 * 3600_000).toISOString(),
        author: 'carlota@carlota.jo',
      },
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
      type: 'state-change',
      domain: 'legal',
      occurredAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
      freshness: 0.8,
      confidence: 0.99,
      severity: 'info',
      entityRefs: [
        {
          entityId: 'matter-001',
          entityType: 'matter',
          displayName: 'Soltana Charter Amendment',
          domain: 'legal',
        },
      ],
      rawPayload: {
        eventType: 'document_updated',
        docId: 'doc-001',
        title: 'MV Soltana — Charter Party Amendment v3',
        version: 3,
        author: 'legal@arcturus.sh',
        requiresReview: true,
        relatedMatterId: 'matter-001',
      },
      tags: ['document', 'charter', 'maritime-legal'],
      provenance: { connectorId: 'demo-storage-docs', connectorCategory: 'storage-docs' },
    });
  }
}
