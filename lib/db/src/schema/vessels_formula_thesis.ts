import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations';
import { vesselsTable } from './vessels';

export const vesselsRiskHistoryTable = pgTable(
  'vessels_risk_history',
  {
    id: serial('id').primaryKey(),
    vesselId: integer('vessel_id')
      .notNull()
      .references(() => vesselsTable.id, { onDelete: 'cascade' }),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    lambdaScore: doublePrecision('lambda_score').notNull(),
    severity: doublePrecision('severity').notNull(),
    likelihood: doublePrecision('likelihood').notNull(),
    valueAtRiskUsd: doublePrecision('value_at_risk_usd').notNull(),
    capUsd: doublePrecision('cap_usd').notNull().default(1_000_000),
    driftScore: doublePrecision('drift_score'),
    factors: jsonb('factors').$type<Record<string, number>>(),
    formulaVersion: text('formula_version').notNull().default('lambda-v10'),
    receiptHash: text('receipt_hash'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
  },
  (table) => [
    index('vessels_risk_history_vessel_idx').on(table.vesselId),
    index('vessels_risk_history_org_idx').on(table.orgId),
    index('vessels_risk_history_computed_idx').on(table.computedAt),
  ],
);

export const vesselsAnomalyDetectionsTable = pgTable(
  'vessels_anomaly_detections',
  {
    id: serial('id').primaryKey(),
    vesselId: integer('vessel_id')
      .notNull()
      .references(() => vesselsTable.id, { onDelete: 'cascade' }),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    detectionRef: text('detection_ref').notNull(),
    anomalyType: text('anomaly_type', {
      enum: [
        'ais_blackout',
        'route_deviation',
        'speed_spike',
        'unexpected_port',
        'sts_transfer',
        'dark_loiter',
        'cargo_mismatch',
      ],
    }).notNull(),
    severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] })
      .notNull()
      .default('medium'),
    anomalyScore: doublePrecision('anomaly_score').notNull(),
    confidence: doublePrecision('confidence').notNull().default(0.8),
    summary: text('summary').notNull(),
    evidence: jsonb('evidence').$type<Record<string, unknown>>(),
    location: jsonb('location').$type<{ lat: number; lon: number } | null>(),
    status: text('status', { enum: ['open', 'acknowledged', 'resolved', 'dismissed'] })
      .notNull()
      .default('open'),
    a11oyHandoffId: text('a11oy_handoff_id'),
    receiptHash: text('receipt_hash'),
    detectedAt: timestamp('detected_at').notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('vessels_anomaly_detections_ref_unique').on(table.detectionRef),
    index('vessels_anomaly_detections_vessel_idx').on(table.vesselId),
    index('vessels_anomaly_detections_org_idx').on(table.orgId),
    index('vessels_anomaly_detections_detected_idx').on(table.detectedAt),
    index('vessels_anomaly_detections_severity_idx').on(table.severity),
  ],
);

export const vesselsVoyageCalculationsTable = pgTable(
  'vessels_voyage_calculations',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    calculationRef: text('calculation_ref').notNull(),
    vesselClassId: text('vessel_class_id').notNull(),
    routeId: text('route_id').notNull(),
    charterType: text('charter_type', { enum: ['time_charter', 'spot'] })
      .notNull()
      .default('time_charter'),
    cargoQuantityMt: doublePrecision('cargo_quantity_mt'),
    totalRevenueUsd: doublePrecision('total_revenue_usd').notNull(),
    totalCostsUsd: doublePrecision('total_costs_usd').notNull(),
    grossProfitUsd: doublePrecision('gross_profit_usd').notNull(),
    grossMarginPct: doublePrecision('gross_margin_pct').notNull(),
    tceRateUsd: doublePrecision('tce_rate_usd').notNull(),
    breakEvenFreightUsd: doublePrecision('break_even_freight_usd'),
    voyageDays: doublePrecision('voyage_days').notNull(),
    monteCarloP10: doublePrecision('monte_carlo_p10'),
    monteCarloP50: doublePrecision('monte_carlo_p50'),
    monteCarloP90: doublePrecision('monte_carlo_p90'),
    estimate: jsonb('estimate').$type<Record<string, unknown>>().notNull(),
    receiptHash: text('receipt_hash'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('vessels_voyage_calculations_ref_unique').on(table.calculationRef),
    index('vessels_voyage_calculations_org_idx').on(table.orgId),
    index('vessels_voyage_calculations_route_idx').on(table.routeId),
    index('vessels_voyage_calculations_computed_idx').on(table.computedAt),
  ],
);

export const vesselsBunkerStationsTable = pgTable(
  'vessels_bunker_stations',
  {
    id: serial('id').primaryKey(),
    stationCode: text('station_code').notNull(),
    port: text('port').notNull(),
    country: text('country').notNull(),
    region: text('region').notNull(),
    lat: doublePrecision('lat').notNull(),
    lon: doublePrecision('lon').notNull(),
    vlsfoUsdPerMt: doublePrecision('vlsfo_usd_per_mt'),
    hfoUsdPerMt: doublePrecision('hfo_usd_per_mt'),
    mgoUsdPerMt: doublePrecision('mgo_usd_per_mt'),
    lngUsdPerMmbtu: doublePrecision('lng_usd_per_mmbtu'),
    biofuelAvailable: boolean('biofuel_available').notNull().default(false),
    avgWaitHours: doublePrecision('avg_wait_hours').notNull().default(6),
    qualityScore: doublePrecision('quality_score').notNull().default(0.85),
    priceAsOf: timestamp('price_as_of').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('vessels_bunker_stations_code_unique').on(table.stationCode),
    index('vessels_bunker_stations_port_idx').on(table.port),
    index('vessels_bunker_stations_region_idx').on(table.region),
  ],
);

export const insertVesselsRiskHistorySchema = createInsertSchema(vesselsRiskHistoryTable).omit({
  id: true,
  computedAt: true,
});
export type InsertVesselsRiskHistory = z.infer<typeof insertVesselsRiskHistorySchema>;
export type VesselsRiskHistory = typeof vesselsRiskHistoryTable.$inferSelect;

export const insertVesselsAnomalyDetectionSchema = createInsertSchema(
  vesselsAnomalyDetectionsTable,
).omit({ id: true, createdAt: true, detectedAt: true });
export type InsertVesselsAnomalyDetection = z.infer<typeof insertVesselsAnomalyDetectionSchema>;
export type VesselsAnomalyDetection = typeof vesselsAnomalyDetectionsTable.$inferSelect;

export const insertVesselsVoyageCalculationSchema = createInsertSchema(
  vesselsVoyageCalculationsTable,
).omit({ id: true, computedAt: true });
export type InsertVesselsVoyageCalculation = z.infer<typeof insertVesselsVoyageCalculationSchema>;
export type VesselsVoyageCalculation = typeof vesselsVoyageCalculationsTable.$inferSelect;

export const insertVesselsBunkerStationSchema = createInsertSchema(vesselsBunkerStationsTable).omit(
  { id: true, createdAt: true, updatedAt: true },
);
export type InsertVesselsBunkerStation = z.infer<typeof insertVesselsBunkerStationSchema>;
export type VesselsBunkerStation = typeof vesselsBunkerStationsTable.$inferSelect;
