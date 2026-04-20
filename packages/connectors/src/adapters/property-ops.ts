/**
 * Property Ops Demo Adapter
 *
 * Synthetic property management signals: maintenance alerts,
 * occupancy changes, and estate readiness gaps for Carlota Jo.
 */

import type { Signal, SignalInput } from '@workspace/ontology';
import type { ConnectorMetadata, ConnectorStatus, PropertyOpsConnector } from '../interfaces.js';

export class PropertyOpsDemoAdapter implements PropertyOpsConnector {
  readonly category = 'property-ops' as const;
  readonly metadata: ConnectorMetadata = {
    connectorId: 'demo-property-ops',
    connectorName: 'Property Ops Demo Connector',
    category: 'property-ops',
    version: '1.0.0',
    description: 'Synthetic property management and estate readiness signals',
    synthetic: true,
  };

  private _status: ConnectorStatus = 'idle';
  private _emitSignal?: (input: SignalInput) => Promise<Signal>;

  status(): ConnectorStatus {
    return this._status;
  }

  getMaintenanceAlerts() {
    return [
      {
        propertyId: 'property-castellano',
        unit: 'Pool House',
        issue: 'Pool heating system not responding',
        priority: 'high',
        reportedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
      },
      {
        propertyId: 'property-castellano',
        unit: 'Wine Cellar',
        issue: 'Temperature above threshold (16°C vs 13°C target)',
        priority: 'high',
        reportedAt: new Date(Date.now() - 1 * 3600_000).toISOString(),
      },
      {
        propertyId: 'property-harbor-view',
        unit: 'Unit 4B',
        issue: 'HVAC filter replacement overdue',
        priority: 'medium',
        reportedAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
      },
    ];
  }

  getOccupancyStatus() {
    return [
      { propertyId: 'property-castellano', occupancyPct: 100, vacantUnits: 0 },
      { propertyId: 'property-harbor-view', occupancyPct: 87.5, vacantUnits: 2 },
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
      type: 'anomaly',
      domain: 'real-estate',
      occurredAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
      freshness: 0.92,
      confidence: 0.98,
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
        eventType: 'maintenance_alert',
        propertyId: 'property-castellano',
        unit: 'Pool House',
        issue: 'Pool heating system not responding',
        priority: 'high',
        vipArrivalHours: 18,
        financialImpactUsd: 45_000,
      },
      tags: ['maintenance', 'pool', 'vip-prep', 'carlota-jo'],
      provenance: { connectorId: 'demo-property-ops', connectorCategory: 'property-ops' },
    });

    await this._emitSignal({
      source: 'connector',
      type: 'threshold-breach',
      domain: 'real-estate',
      occurredAt: new Date(Date.now() - 1 * 3600_000).toISOString(),
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
        eventType: 'temperature_breach',
        propertyId: 'property-castellano',
        unit: 'Wine Cellar',
        currentTemp: 16,
        targetTemp: 13,
        threshold: 14.5,
        unit_of_measure: '°C',
        vipArrivalHours: 18,
      },
      tags: ['temperature', 'wine-cellar', 'breach', 'carlota-jo'],
      provenance: { connectorId: 'demo-property-ops', connectorCategory: 'property-ops' },
    });
  }
}
