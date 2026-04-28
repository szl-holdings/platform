/**
 * AIS Maritime Demo Adapter
 *
 * Synthetic AIS vessel position feed with dark period detection and
 * sanctions corridor proximity alerts. Emits realistic maritime signals
 * for the SEXTANT product demo.
 */

import type { Signal, SignalInput } from "@workspace/ontology/signal";
import type { AISMaritimeConnector, ConnectorMetadata, ConnectorStatus } from "../interfaces.js";

const DEMO_VESSELS = [
  {
    mmsi: '538009241',
    imo: '9812347',
    name: 'MV Soltana',
    flag: 'MH',
    cargo: 'Refined Petroleum',
    lat: 25.2,
    lon: 56.8,
    speed: 12.4,
    heading: 95,
    status: 'underway',
    cargoValue: 3_200_000,
  },
  {
    mmsi: '477123456',
    imo: '9654321',
    name: 'MV Horizon Star',
    flag: 'SG',
    cargo: 'Container',
    lat: 22.4,
    lon: 60.1,
    speed: 14.2,
    heading: 215,
    status: 'underway',
    cargoValue: 8_500_000,
  },
  {
    mmsi: '636091234',
    imo: '9100234',
    name: 'MV Atlantic Carrier',
    flag: 'LR',
    cargo: 'Bulk Grain',
    lat: 24.8,
    lon: 58.3,
    speed: 0,
    heading: 180,
    status: 'anchored',
    cargoValue: 2_100_000,
  },
  {
    mmsi: '209333000',
    imo: '9523456',
    name: 'MV Nordic Pioneer',
    flag: 'CY',
    cargo: 'LNG',
    lat: 23.6,
    lon: 59.2,
    speed: 8.1,
    heading: 310,
    status: 'underway',
    cargoValue: 12_000_000,
  },
  {
    mmsi: '311000234',
    imo: '9712345',
    name: 'MV Gulf Express',
    flag: 'BS',
    cargo: 'Chemical Tanker',
    lat: 26.1,
    lon: 55.9,
    speed: 11.8,
    heading: 135,
    status: 'underway',
    cargoValue: 4_700_000,
  },
];

const DARK_PERIOD_VESSELS = [
  {
    mmsi: '538009241',
    imo: '9812347',
    name: 'MV Soltana',
    durationMinutes: 134,
    lat: 25.6,
    lon: 57.2,
  },
];

const PORT_CONGESTION = {
  portId: 'port-fujairah',
  portName: 'Fujairah, UAE',
  congestionLevel: 'high' as const,
  waitTimeHours: 28,
  queueLength: 12,
  affectedVessels: ['MV Soltana', 'MV Horizon Star', 'MV Atlantic Carrier'],
};

export class AISMaritimeDemoAdapter implements AISMaritimeConnector {
  readonly category = 'ais-maritime' as const;
  readonly metadata: ConnectorMetadata = {
    connectorId: 'demo-ais-maritime',
    connectorName: 'AIS Maritime Demo Feed',
    category: 'ais-maritime',
    version: '1.0.0',
    description: 'Synthetic AIS vessel position feed with dark period detection',
    synthetic: true,
  };

  private _status: ConnectorStatus = 'idle';
  private _emitSignal?: (input: SignalInput) => Promise<Signal>;
  private _interval?: ReturnType<typeof setInterval>;

  status(): ConnectorStatus {
    return this._status;
  }

  getVesselPositions() {
    return DEMO_VESSELS.map((v) => ({
      mmsi: v.mmsi,
      imo: v.imo,
      name: v.name,
      lat: v.lat + (Math.random() - 0.5) * 0.01,
      lon: v.lon + (Math.random() - 0.5) * 0.01,
      speed: v.speed,
      heading: v.heading,
      status: v.status,
      updatedAt: new Date().toISOString(),
    }));
  }

  getDarkPeriods() {
    return DARK_PERIOD_VESSELS.map((v) => ({
      mmsi: v.mmsi,
      startedAt: new Date(Date.now() - v.durationMinutes * 60_000).toISOString(),
      durationMinutes: v.durationMinutes,
      lat: v.lat,
      lon: v.lon,
    }));
  }

  async start(emitSignal: (input: SignalInput) => Promise<Signal>): Promise<void> {
    this._emitSignal = emitSignal;
    this._status = 'streaming';

    await this._emitInitialSignals();

    this._interval = setInterval(async () => {
      await this._emitPeriodicSignals();
    }, 30_000);
  }

  async stop(): Promise<void> {
    if (this._interval) clearInterval(this._interval);
    this._status = 'stopped';
  }

  async poll(): Promise<Signal[]> {
    if (!this._emitSignal) return [];
    const results: Signal[] = [];

    const darkSignal = await this._emitSignal({
      source: 'connector',
      type: 'anomaly',
      domain: 'maritime',
      occurredAt: new Date().toISOString(),
      freshness: 0.95,
      confidence: 0.92,
      severity: 'high',
      entityRefs: [
        {
          entityId: 'vessel-soltana',
          entityType: 'vessel',
          displayName: 'MV Soltana',
          domain: 'maritime',
        },
      ],
      rawPayload: {
        eventType: 'ais_dark_period',
        mmsi: '538009241',
        imo: '9812347',
        durationMinutes: 134,
        lat: 25.6,
        lon: 57.2,
        corridor: 'Strait of Hormuz proximity',
        sanctionsRisk: 'elevated',
      },
      tags: ['ais', 'dark-period', 'sanctions-adjacent', 'vessels'],
      provenance: { connectorId: 'demo-ais-maritime', connectorCategory: 'ais-maritime' },
    });
    results.push(darkSignal);

    return results;
  }

  private async _emitInitialSignals(): Promise<void> {
    if (!this._emitSignal) return;

    await this._emitSignal({
      source: 'connector',
      type: 'anomaly',
      domain: 'maritime',
      occurredAt: new Date(Date.now() - 134 * 60_000).toISOString(),
      freshness: 0.9,
      confidence: 0.95,
      severity: 'high',
      entityRefs: [
        {
          entityId: 'vessel-soltana',
          entityType: 'vessel',
          displayName: 'MV Soltana',
          domain: 'maritime',
          externalIds: { mmsi: '538009241', imo: '9812347' },
        },
      ],
      rawPayload: {
        eventType: 'ais_dark_period_started',
        mmsi: '538009241',
        imo: '9812347',
        vesselName: 'MV Soltana',
        flag: 'Marshall Islands',
        cargo: 'Refined Petroleum Products',
        cargoValue: 3_200_000,
        lat: 25.6,
        lon: 57.2,
        corridor: 'Strait of Hormuz proximity',
        sanctionsRisk: 'elevated',
        durationMinutes: 134,
      },
      tags: ['ais', 'dark-period', 'sanctions-adjacent', 'vessels'],
      provenance: { connectorId: 'demo-ais-maritime', connectorCategory: 'ais-maritime' },
    });

    await this._emitSignal({
      source: 'connector',
      type: 'threshold-breach',
      domain: 'maritime',
      occurredAt: new Date(Date.now() - 90 * 60_000).toISOString(),
      freshness: 0.85,
      confidence: 0.88,
      severity: 'high',
      entityRefs: [
        {
          entityId: 'port-fujairah',
          entityType: 'port',
          displayName: 'Fujairah Port',
          domain: 'maritime',
        },
      ],
      rawPayload: {
        eventType: 'port_congestion_alert',
        portId: 'port-fujairah',
        portName: 'Fujairah, UAE',
        congestionLevel: 'high',
        waitTimeHours: 28,
        queueLength: 12,
        affectedVessels: PORT_CONGESTION.affectedVessels,
        financialImpactUsd: 185_000,
      },
      tags: ['port', 'congestion', 'delay', 'vessels'],
      provenance: { connectorId: 'demo-ais-maritime', connectorCategory: 'ais-maritime' },
    });

    await this._emitSignal({
      source: 'connector',
      type: 'sanctions-match',
      domain: 'maritime',
      occurredAt: new Date(Date.now() - 60 * 60_000).toISOString(),
      freshness: 0.88,
      confidence: 0.78,
      severity: 'critical',
      entityRefs: [
        {
          entityId: 'vessel-soltana',
          entityType: 'vessel',
          displayName: 'MV Soltana',
          domain: 'maritime',
        },
      ],
      rawPayload: {
        eventType: 'ofac_proximity_alert',
        mmsi: '538009241',
        screeningResult: 'proximity_match',
        matchedList: 'OFAC SDN',
        riskScore: 0.78,
        corridor: 'Iranian waters proximity — Zone C',
      },
      tags: ['ofac', 'sanctions', 'screening', 'vessels'],
      provenance: { connectorId: 'demo-ais-maritime', connectorCategory: 'ais-maritime' },
    });
  }

  private async _emitPeriodicSignals(): Promise<void> {
    if (!this._emitSignal) return;

    const vessel = DEMO_VESSELS[Math.floor(Math.random() * DEMO_VESSELS.length)];
    if (!vessel) return;
    await this._emitSignal({
      source: 'connector',
      type: 'position-update',
      domain: 'maritime',
      occurredAt: new Date().toISOString(),
      freshness: 1.0,
      confidence: 1.0,
      severity: 'info',
      entityRefs: [
        {
          entityId: `vessel-${vessel.mmsi}`,
          entityType: 'vessel',
          displayName: vessel.name,
          domain: 'maritime',
        },
      ],
      rawPayload: {
        eventType: 'position_update',
        mmsi: vessel.mmsi,
        imo: vessel.imo,
        vesselName: vessel.name,
        lat: vessel.lat + (Math.random() - 0.5) * 0.05,
        lon: vessel.lon + (Math.random() - 0.5) * 0.05,
        speed: vessel.speed,
        heading: vessel.heading,
        status: vessel.status,
      },
      tags: ['position', 'ais', 'vessels'],
      provenance: { connectorId: 'demo-ais-maritime', connectorCategory: 'ais-maritime' },
    });
  }
}
