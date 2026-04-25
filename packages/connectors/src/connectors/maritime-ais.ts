/**
 * Reference connector: maritime AIS feed.
 *
 * Production deployments would attach to MarineTraffic, Spire, or a national
 * VTS feed. The seed below mirrors the AIS message shape (MMSI, IMO, call-sign,
 * lat/lon, course, speed, last-port).
 */

import { z } from 'zod';
import type { Connector } from '../types';

const AisMessageSchema = z.object({
  mmsi: z.string().regex(/^\d{9}$/),
  imo: z.string().regex(/^\d{7}$/).nullable(),
  callSign: z.string().min(1),
  vesselName: z.string().min(1),
  vesselType: z.string().min(1),
  flagState: z.string().length(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  courseOverGroundDeg: z.number().min(0).max(360),
  speedOverGroundKts: z.number().min(0).max(60),
  lastPort: z.string().min(1),
  reportedAt: z.string(),
});
export type AisMessage = z.infer<typeof AisMessageSchema>;

const SEED_AIS: AisMessage[] = [
  {
    mmsi: '477881100',
    imo: '9839272',
    callSign: 'VRPN5',
    vesselName: 'EVER GIVEN',
    vesselType: 'container',
    flagState: 'PA',
    latitude: 30.5852,
    longitude: 32.2654,
    courseOverGroundDeg: 184.0,
    speedOverGroundKts: 12.4,
    lastPort: 'TANJUNG PELEPAS',
    reportedAt: '2026-04-22T22:14:18Z',
  },
  {
    mmsi: '538009062',
    imo: '9776418',
    callSign: 'V7PR9',
    vesselName: 'NORDIC ORION',
    vesselType: 'bulk-carrier',
    flagState: 'MH',
    latitude: 60.4422,
    longitude: -148.0021,
    courseOverGroundDeg: 268.0,
    speedOverGroundKts: 11.1,
    lastPort: 'VANCOUVER',
    reportedAt: '2026-04-22T22:11:02Z',
  },
  {
    mmsi: '273347620',
    imo: null,
    callSign: 'UAFR6',
    vesselName: 'PRIBOY',
    vesselType: 'tanker',
    flagState: 'RU',
    latitude: 36.4212,
    longitude: -3.8801,
    courseOverGroundDeg: 92.0,
    speedOverGroundKts: 8.6,
    lastPort: 'NOVOROSSIYSK',
    reportedAt: '2026-04-22T22:09:44Z',
  },
  {
    mmsi: '209521000',
    imo: '9402518',
    callSign: '5BWN3',
    vesselName: 'CMA CGM MARCO POLO',
    vesselType: 'container',
    flagState: 'CY',
    latitude: 40.6782,
    longitude: -74.0445,
    courseOverGroundDeg: 220.0,
    speedOverGroundKts: 0.4,
    lastPort: 'NEW YORK',
    reportedAt: '2026-04-22T22:01:33Z',
  },
];

export const maritimeAisConnector: Connector<AisMessage> = {
  id: 'maritime-ais-feed',
  name: 'Maritime AIS Feed',
  kind: 'maritime',
  description:
    'Live AIS positions from a global aggregator. Used to populate the Vessels watchlist and proximity graph.',
  source: 'ais://global-aggregator',
  schedule: { intervalSec: 300, maxRetries: 3, timeoutMs: 10_000 },
  recordSchema: AisMessageSchema,
  fetch: async () => SEED_AIS.map((m) => ({ ...m })),
  transform: (record) => ({
    kind: 'vessel',
    namespace: 'ais',
    identifier: record.mmsi,
    properties: {
      imo: record.imo,
      callSign: record.callSign,
      vesselName: record.vesselName,
      vesselType: record.vesselType,
      flagState: record.flagState,
      latitude: record.latitude,
      longitude: record.longitude,
      courseDeg: record.courseOverGroundDeg,
      speedKts: record.speedOverGroundKts,
      lastPort: record.lastPort,
      reportedAt: record.reportedAt,
    },
  }),
};
