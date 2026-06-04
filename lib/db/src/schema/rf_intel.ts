/**
 * RF Intelligence schema
 *
 * Stores satellite AIS pass observations and detected anomalies from the
 * RF correlation engine. Records are written on each 90-second simulation
 * cycle and used to hydrate the in-memory ring-buffer on server restart.
 *
 * These are NOT keyed to the `vessels` table because the RF engine tracks
 * a simulated fleet (IMO/MMSI-keyed) that may not have corresponding rows
 * in the application vessel registry.
 */

import { index, integer, jsonb, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

export const rfSatellitePassesTable = pgTable(
  'rf_satellite_passes',
  {
    id: text('id').primaryKey(),
    satelliteId: text('satellite_id').notNull(),
    entityId: text('entity_id').notNull(),
    vesselName: text('vessel_name').notNull(),
    imoNumber: text('imo_number').notNull(),
    observedLat: real('observed_lat').notNull(),
    observedLon: real('observed_lon').notNull(),
    aisReportedLat: real('ais_reported_lat').notNull(),
    aisReportedLon: real('ais_reported_lon').notNull(),
    driftDistanceNm: real('drift_distance_nm').notNull(),
    bearingDeviationDeg: real('bearing_deviation_deg').notNull(),
    correlationScore: integer('correlation_score').notNull(),
    anomalyFlag: integer('anomaly_flag').notNull().default(0),
    anomalyType: text('anomaly_type'),
    passTimestamp: timestamp('pass_timestamp').notNull().defaultNow(),
    coverageQuality: text('coverage_quality').notNull().default('good'),
    confidencePercent: integer('confidence_percent').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('rf_passes_entity_idx').on(t.entityId),
    index('rf_passes_timestamp_idx').on(t.passTimestamp),
    index('rf_passes_anomaly_idx').on(t.anomalyFlag),
  ],
);

export const rfAnomaliesTable = pgTable(
  'rf_anomalies',
  {
    id: text('id').primaryKey(),
    entityId: text('entity_id').notNull(),
    vesselName: text('vessel_name').notNull(),
    imoNumber: text('imo_number').notNull(),
    anomalyType: text('anomaly_type').notNull(),
    severity: text('severity').notNull(),
    lat: real('lat').notNull(),
    lon: real('lon').notNull(),
    driftDistanceNm: real('drift_distance_nm'),
    lastKnownLat: real('last_known_lat'),
    lastKnownLon: real('last_known_lon'),
    gapHours: real('gap_hours'),
    correlationScore: integer('correlation_score').notNull(),
    satellitePassId: text('satellite_pass_id').notNull(),
    description: text('description').notNull(),
    predictedHeading: integer('predicted_heading'),
    confidencePercent: integer('confidence_percent').notNull(),
    tags: jsonb('tags').notNull().default('[]'),
    region: text('region').notNull(),
    status: text('status').notNull().default('active'),
    detectedAt: timestamp('detected_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('rf_anomalies_entity_idx').on(t.entityId),
    index('rf_anomalies_type_idx').on(t.anomalyType),
    index('rf_anomalies_status_idx').on(t.status),
    index('rf_anomalies_detected_idx').on(t.detectedAt),
  ],
);

export const insertRfSatellitePassSchema = createInsertSchema(rfSatellitePassesTable).omit({
  createdAt: true,
});

export const insertRfAnomalySchema = createInsertSchema(rfAnomaliesTable).omit({
  createdAt: true,
});

export type RfSatellitePass = typeof rfSatellitePassesTable.$inferSelect;
export type RfAnomalyRecord = typeof rfAnomaliesTable.$inferSelect;
