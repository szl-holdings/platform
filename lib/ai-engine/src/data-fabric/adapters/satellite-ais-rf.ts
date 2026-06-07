import type {
  AdapterHealthStatus,
  DataFabricAdapter,
  Domain,
  NormalizedEntity,
  OntologyMapping,
  RefreshSchedule,
} from '../adapter-registry.js';

const SATELLITE_ONTOLOGY_MAPPINGS: OntologyMapping[] = [
  {
    entityType: 'vessel',
    domain: 'vessels',
    fieldMap: {
      imoNumber: 'imo',
      mmsi: 'mmsi',
      flag: 'flag',
      vesselType: 'vesselType',
      aisStatus: 'aisStatus',
      lastPositionLat: 'lat',
      lastPositionLon: 'lon',
    },
  },
];

const REFRESH_SCHEDULE: RefreshSchedule = {
  intervalMs: 15 * 60 * 1000,
  retryBackoffMs: 10_000,
  maxRetries: 5,
};

interface SatellitePass {
  passId: string;
  satellite: string;
  constellation: string;
  timestamp: string;
  coverageAreaKm2: number;
  detectedTargets: number;
  correlatedWithAis: number;
  darkTargets: number;
  regionName: string;
  centerLat: number;
  centerLon: number;
}

interface RfDetection {
  detectionId: string;
  passId: string;
  lat: number;
  lon: number;
  signalType: 'radar' | 'vhf' | 'satcom' | 'ais_anomaly' | 'unknown';
  frequencyMhz: number;
  signalStrengthDbm: number;
  correlatedImo: string | null;
  correlatedMmsi: string | null;
  vesselName: string | null;
  aisStatus: 'active' | 'dark' | 'spoofed' | 'unknown';
  suspicionScore: number;
  timestamp: string;
  notes: string;
}

interface DarkFleetAlert {
  alertId: string;
  vesselName: string;
  imo: string;
  mmsi: string;
  flag: string;
  lastAisLat: number;
  lastAisLon: number;
  lastAisTimestamp: string;
  rfDetectionLat: number;
  rfDetectionLon: number;
  rfDetectionTimestamp: string;
  darkDurationHours: number;
  suspicionScore: number;
  flagReasons: string[];
  region: string;
}

const SEED_PASSES: SatellitePass[] = [
  { passId: 'SAT-2026-04-26-001', satellite: 'ICEYE-X14', constellation: 'ICEYE-SAR', timestamp: '2026-04-26T08:14:00Z', coverageAreaKm2: 42_000, detectedTargets: 187, correlatedWithAis: 164, darkTargets: 23, regionName: 'Persian Gulf', centerLat: 26.5, centerLon: 52.0 },
  { passId: 'SAT-2026-04-26-002', satellite: 'Sentinel-1B', constellation: 'Copernicus', timestamp: '2026-04-26T06:42:00Z', coverageAreaKm2: 250_000, detectedTargets: 412, correlatedWithAis: 389, darkTargets: 23, regionName: 'Strait of Malacca', centerLat: 2.5, centerLon: 101.0 },
  { passId: 'SAT-2026-04-26-003', satellite: 'HawkEye-360-C3', constellation: 'HawkEye 360', timestamp: '2026-04-26T10:30:00Z', coverageAreaKm2: 180_000, detectedTargets: 95, correlatedWithAis: 71, darkTargets: 24, regionName: 'Gulf of Guinea', centerLat: 3.0, centerLon: 3.0 },
  { passId: 'SAT-2026-04-26-004', satellite: 'Planet-SkySat-22', constellation: 'Planet Labs', timestamp: '2026-04-26T12:05:00Z', coverageAreaKm2: 12_000, detectedTargets: 48, correlatedWithAis: 42, darkTargets: 6, regionName: 'Eastern Mediterranean', centerLat: 34.5, centerLon: 33.0 },
  { passId: 'SAT-2026-04-26-005', satellite: 'Umbra-SAR-05', constellation: 'Umbra', timestamp: '2026-04-26T14:22:00Z', coverageAreaKm2: 28_000, detectedTargets: 134, correlatedWithAis: 121, darkTargets: 13, regionName: 'South China Sea', centerLat: 12.0, centerLon: 113.0 },
];

const SEED_RF_DETECTIONS: RfDetection[] = [
  { detectionId: 'RF-001', passId: 'SAT-2026-04-26-001', lat: 26.72, lon: 52.41, signalType: 'radar', frequencyMhz: 9410, signalStrengthDbm: -62, correlatedImo: null, correlatedMmsi: null, vesselName: null, aisStatus: 'dark', suspicionScore: 87, timestamp: '2026-04-26T08:14:22Z', notes: 'X-band navigation radar detected; no AIS correlation within 5nm radius. Consistent with dark tanker operations.' },
  { detectionId: 'RF-002', passId: 'SAT-2026-04-26-001', lat: 26.38, lon: 51.89, signalType: 'vhf', frequencyMhz: 156.8, signalStrengthDbm: -55, correlatedImo: '9234567', correlatedMmsi: '636012345', vesselName: 'MT Shadow Runner', aisStatus: 'spoofed', suspicionScore: 92, timestamp: '2026-04-26T08:14:45Z', notes: 'VHF Ch16 transmission from vessel with AIS position 180nm away — probable spoofing.' },
  { detectionId: 'RF-003', passId: 'SAT-2026-04-26-003', lat: 3.21, lon: 3.45, signalType: 'satcom', frequencyMhz: 1545, signalStrengthDbm: -78, correlatedImo: null, correlatedMmsi: null, vesselName: null, aisStatus: 'dark', suspicionScore: 74, timestamp: '2026-04-26T10:31:10Z', notes: 'Inmarsat L-band uplink from unidentified vessel in IUU fishing hotspot.' },
  { detectionId: 'RF-004', passId: 'SAT-2026-04-26-005', lat: 11.85, lon: 112.94, signalType: 'ais_anomaly', frequencyMhz: 161.975, signalStrengthDbm: -48, correlatedImo: '9876543', correlatedMmsi: '412345678', vesselName: 'MV Jade Star', aisStatus: 'active', suspicionScore: 45, timestamp: '2026-04-26T14:22:55Z', notes: 'AIS reported position differs from RF triangulation by 12nm — potential drift or GPS error.' },
  { detectionId: 'RF-005', passId: 'SAT-2026-04-26-002', lat: 2.31, lon: 101.22, signalType: 'radar', frequencyMhz: 3050, signalStrengthDbm: -71, correlatedImo: null, correlatedMmsi: null, vesselName: null, aisStatus: 'dark', suspicionScore: 81, timestamp: '2026-04-26T06:43:15Z', notes: 'S-band radar emission in busy shipping lane; target not broadcasting AIS. Possible sanctions evasion.' },
  { detectionId: 'RF-006', passId: 'SAT-2026-04-26-004', lat: 34.62, lon: 32.88, signalType: 'radar', frequencyMhz: 9410, signalStrengthDbm: -58, correlatedImo: '9345678', correlatedMmsi: '256789012', vesselName: 'MV Phantom', aisStatus: 'dark', suspicionScore: 89, timestamp: '2026-04-26T12:06:30Z', notes: 'Previously sanctioned vessel operating with AIS disabled near STS transfer zone.' },
];

const SEED_DARK_FLEET_ALERTS: DarkFleetAlert[] = [
  { alertId: 'DFA-001', vesselName: 'MT Shadow Runner', imo: '9234567', mmsi: '636012345', flag: 'Liberia', lastAisLat: 28.1, lastAisLon: 49.2, lastAisTimestamp: '2026-04-24T16:00:00Z', rfDetectionLat: 26.38, rfDetectionLon: 51.89, rfDetectionTimestamp: '2026-04-26T08:14:45Z', darkDurationHours: 40.2, suspicionScore: 92, flagReasons: ['AIS spoofing detected', 'Previously flagged for STS transfers', 'Operating in sanctions corridor'], region: 'Persian Gulf' },
  { alertId: 'DFA-002', vesselName: 'Unknown — RF Only', imo: 'UNKNOWN', mmsi: 'UNKNOWN', flag: 'Unknown', lastAisLat: 0, lastAisLon: 0, lastAisTimestamp: 'N/A', rfDetectionLat: 26.72, rfDetectionLon: 52.41, rfDetectionTimestamp: '2026-04-26T08:14:22Z', darkDurationHours: -1, suspicionScore: 87, flagReasons: ['No AIS correlation', 'X-band radar emission', 'Operating near Iranian waters'], region: 'Persian Gulf' },
  { alertId: 'DFA-003', vesselName: 'MV Phantom', imo: '9345678', mmsi: '256789012', flag: 'Malta', lastAisLat: 35.1, lastAisLon: 33.5, lastAisTimestamp: '2026-04-25T22:00:00Z', rfDetectionLat: 34.62, rfDetectionLon: 32.88, rfDetectionTimestamp: '2026-04-26T12:06:30Z', darkDurationHours: 14.1, suspicionScore: 89, flagReasons: ['Previously sanctioned entity', 'AIS disabled', 'Near known STS zone'], region: 'Eastern Mediterranean' },
];

export const satelliteAisRfAdapter: DataFabricAdapter = {
  id: 'satellite-ais-rf',
  displayName: 'Satellite AIS + RF Vessel Tracking',
  domain: 'vessels',
  category: 'maritime_intelligence',
  costPerQueryUsd: 0.35,
  ontologyMappings: SATELLITE_ONTOLOGY_MAPPINGS,
  refreshSchedule: REFRESH_SCHEDULE,

  isConfigured(): boolean {
    return true;
  },

  async fetch(params?: Record<string, unknown>): Promise<NormalizedEntity[]> {
    const region = params?.region as string | undefined;
    const now = new Date().toISOString();
    const entities: NormalizedEntity[] = [];

    let passes = SEED_PASSES;
    if (region) passes = passes.filter((p) => p.regionName.toLowerCase().includes(region.toLowerCase()));

    for (const pass of passes) {
      entities.push({
        id: `sat-pass-${pass.passId}`,
        entityType: 'signal',
        domain: 'vessels',
        label: `${pass.satellite} — ${pass.regionName} (${pass.detectedTargets} targets)`,
        confidence: 0.94,
        freshness: 'live',
        sourceRef: `satellite-ais-rf:${pass.passId}`,
        provenance: {
          sourceId: pass.passId,
          adapterId: 'satellite-ais-rf',
          confidence: 0.94,
          freshness: 'live',
          fetchedAt: now,
          costUsd: 0.1,
          rawRecordCount: 1,
        },
        data: { ...pass, dataType: 'satellite_pass' },
        createdAt: pass.timestamp,
        updatedAt: now,
      });
    }

    let detections = SEED_RF_DETECTIONS;
    if (region) {
      const regionPasses = passes.map((p) => p.passId);
      detections = detections.filter((d) => regionPasses.includes(d.passId));
    }

    for (const det of detections) {
      entities.push({
        id: `rf-det-${det.detectionId}`,
        entityType: det.correlatedImo ? 'vessel' : 'signal',
        domain: 'vessels',
        label: det.vesselName
          ? `RF: ${det.vesselName} (${det.signalType}, ${det.aisStatus})`
          : `RF: Unknown ${det.signalType} @ ${det.lat.toFixed(2)},${det.lon.toFixed(2)}`,
        confidence: det.suspicionScore / 100,
        freshness: 'live',
        sourceRef: `satellite-ais-rf:${det.detectionId}`,
        provenance: {
          sourceId: det.detectionId,
          adapterId: 'satellite-ais-rf',
          confidence: det.suspicionScore / 100,
          freshness: 'live',
          fetchedAt: now,
          costUsd: 0.05,
          rawRecordCount: 1,
        },
        data: { ...det, dataType: 'rf_detection' },
        createdAt: det.timestamp,
        updatedAt: now,
      });
    }

    let alerts = SEED_DARK_FLEET_ALERTS;
    if (region) alerts = alerts.filter((a) => a.region.toLowerCase().includes(region.toLowerCase()));

    for (const alert of alerts) {
      entities.push({
        id: `dark-fleet-${alert.alertId}`,
        entityType: 'vessel',
        domain: 'vessels',
        label: `Dark Fleet: ${alert.vesselName} — ${alert.region}`,
        confidence: alert.suspicionScore / 100,
        freshness: 'live',
        sourceRef: `satellite-ais-rf:${alert.alertId}`,
        provenance: {
          sourceId: alert.alertId,
          adapterId: 'satellite-ais-rf',
          confidence: alert.suspicionScore / 100,
          freshness: 'live',
          fetchedAt: now,
          costUsd: 0.08,
          rawRecordCount: 1,
        },
        data: { ...alert, dataType: 'dark_fleet_alert' },
        createdAt: alert.rfDetectionTimestamp,
        updatedAt: now,
      });
    }

    return entities;
  },

  async healthCheck(): Promise<AdapterHealthStatus> {
    return {
      adapterId: 'satellite-ais-rf',
      status: 'healthy',
      lastSuccessAt: new Date().toISOString(),
      lastErrorAt: null,
      lastError: null,
      totalQueries: 0,
      totalErrors: 0,
      avgLatencyMs: 120,
    };
  },
};

export type { SatellitePass, RfDetection, DarkFleetAlert };
export { SEED_PASSES, SEED_RF_DETECTIONS, SEED_DARK_FLEET_ALERTS };
