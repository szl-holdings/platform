/**
 * CRM / Project Demo Adapter
 *
 * Synthetic CRM deal and project task signals across domains.
 */

import type { Signal, SignalInput } from "@workspace/ontology/signal";
import type { ConnectorMetadata, ConnectorStatus, CrmProjectConnector } from "../interfaces.js";

export class CrmProjectDemoAdapter implements CrmProjectConnector {
  readonly category = 'crm-project' as const;
  readonly metadata: ConnectorMetadata = {
    connectorId: 'demo-crm-project',
    connectorName: 'CRM / Project Demo Connector',
    category: 'crm-project',
    version: '1.0.0',
    description: 'Synthetic CRM deal pipeline and project task signals',
    synthetic: true,
  };

  private _status: ConnectorStatus = 'idle';
  private _emitSignal?: (input: SignalInput) => Promise<Signal>;

  status(): ConnectorStatus {
    return this._status;
  }

  getOpenDeals() {
    return [
      {
        dealId: 'deal-terra-001',
        name: 'Eastside Commercial Park Acquisition',
        stage: 'due-diligence',
        value: 12_500_000,
      },
      {
        dealId: 'deal-terra-002',
        name: 'Harbor View Residential Portfolio',
        stage: 'loi-signed',
        value: 7_800_000,
      },
      {
        dealId: 'deal-vessels-001',
        name: 'MV Nordic Pioneer Charter Extension',
        stage: 'negotiation',
        value: 2_100_000,
      },
    ];
  }

  getOverdueTasks() {
    return [
      {
        taskId: 'task-001',
        title: 'Eastside Park — Environmental Assessment Sign-Off',
        dueAt: new Date(Date.now() - 48 * 3600_000).toISOString(),
        assignee: 'legal@szl.holdings',
      },
      {
        taskId: 'task-002',
        title: 'Harbor View — Title Search Completion',
        dueAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
        assignee: 'terra-ops@szl.holdings',
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
      type: 'deadline',
      domain: 'real-estate',
      occurredAt: new Date(Date.now() - 48 * 3600_000).toISOString(),
      freshness: 0.8,
      confidence: 0.99,
      severity: 'medium',
      entityRefs: [
        {
          entityId: 'deal-terra-001',
          entityType: 'deal',
          displayName: 'Eastside Commercial Park Acquisition',
          domain: 'real-estate',
        },
      ],
      rawPayload: {
        eventType: 'task_overdue',
        taskId: 'task-001',
        title: 'Environmental Assessment Sign-Off',
        dueAt: new Date(Date.now() - 48 * 3600_000).toISOString(),
        dealValue: 12_500_000,
        dealId: 'deal-terra-001',
      },
      tags: ['overdue', 'task', 'terra', 'deal'],
      provenance: { connectorId: 'demo-crm-project', connectorCategory: 'crm-project' },
    });
  }
}
