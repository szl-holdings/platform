/**
 * Vessels A11oy primitive backend — Drizzle schema (Task #5318).
 *
 * These tables back the five `/api/vessels/{fleet,positions,risk,route-plan,
 * coexistence}` routes. They map 1:1 to the A11oy primitive model:
 *
 *   vessels_a11oy_fleet                = Anatomy
 *   vessels_a11oy_position_log         = Substance state-log
 *   vessels_a11oy_route                = Connection (RF coexistence vector)
 *   vessels_a11oy_coexistence_report   = Connection-level Transformation
 *   vessels_a11oy_risk_snapshot        = Transformation (perturbation bound)
 *
 * The SQL backing these definitions lives in
 *   lib/db/drizzle/0166_vessels_a11oy_primitives.sql
 * and is applied idempotently by the platform migration runner on boot.
 */

import {
  bigserial,
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

export const vesselsA11oyFleetTable = pgTable(
  'vessels_a11oy_fleet',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id'),
    fleetRef: text('fleet_ref').notNull(),
    name: text('name').notNull(),
    operator: text('operator'),
    vesselCount: integer('vessel_count').notNull().default(0),
    anatomySeal: text('anatomy_seal'),
    metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('vessels_a11oy_fleet_org_ref_idx').on(t.orgId, t.fleetRef)],
);

export const vesselsA11oyPositionLogTable = pgTable(
  'vessels_a11oy_position_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    orgId: integer('org_id'),
    fleetRef: text('fleet_ref').notNull(),
    vesselImo: text('vessel_imo').notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    speedKnots: doublePrecision('speed_knots'),
    headingDeg: doublePrecision('heading_deg'),
    source: text('source').notNull().default('ais'),
    recordedAt: timestamp('recorded_at').notNull().defaultNow(),
  },
  (t) => [
    index('vessels_a11oy_position_log_vessel_idx').on(t.vesselImo, t.recordedAt),
    index('vessels_a11oy_position_log_fleet_idx').on(t.fleetRef, t.recordedAt),
  ],
);

export const vesselsA11oyRiskSnapshotTable = pgTable(
  'vessels_a11oy_risk_snapshot',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id'),
    fleetRef: text('fleet_ref').notNull(),
    vesselImo: text('vessel_imo'),
    perturbationBound: doublePrecision('perturbation_bound').notNull(),
    severity: text('severity', {
      enum: ['normal', 'watch', 'elevated', 'critical'],
    })
      .notNull()
      .default('normal'),
    factors: jsonb('factors').$type<Record<string, unknown> | null>(),
    receiptHash: text('receipt_hash'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
  },
  (t) => [
    index('vessels_a11oy_risk_fleet_idx').on(t.fleetRef, t.computedAt),
    index('vessels_a11oy_risk_org_idx').on(t.orgId),
  ],
);

export interface RouteWaypoint {
  readonly lat: number;
  readonly lon: number;
  readonly label?: string;
}

export const vesselsA11oyRouteTable = pgTable(
  'vessels_a11oy_route',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id'),
    fleetRef: text('fleet_ref').notNull(),
    vesselImo: text('vessel_imo').notNull(),
    originPort: text('origin_port').notNull(),
    destinationPort: text('destination_port').notNull(),
    waypoints: jsonb('waypoints').$type<RouteWaypoint[]>().notNull().default([]),
    rfCoexistenceVector: jsonb('rf_coexistence_vector').$type<number[] | null>(),
    anatomyBoundaryOk: boolean('anatomy_boundary_ok').notNull().default(true),
    anatomyBoundaryNotes: text('anatomy_boundary_notes'),
    receiptHash: text('receipt_hash'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('vessels_a11oy_route_fleet_idx').on(t.fleetRef, t.createdAt),
    index('vessels_a11oy_route_vessel_idx').on(t.vesselImo, t.createdAt),
  ],
);

export interface CoexistenceBand {
  readonly band: string;
  readonly utilization: number;
}

export const vesselsA11oyCoexistenceReportTable = pgTable(
  'vessels_a11oy_coexistence_report',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id'),
    fleetRef: text('fleet_ref').notNull(),
    routeId: integer('route_id'),
    rfBands: jsonb('rf_bands').$type<CoexistenceBand[]>().notNull(),
    nullSpaceProjection: jsonb('null_space_projection').$type<number[]>().notNull(),
    interferenceScore: doublePrecision('interference_score').notNull(),
    receiptHash: text('receipt_hash'),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
  },
  (t) => [index('vessels_a11oy_coexistence_fleet_idx').on(t.fleetRef, t.computedAt)],
);

export type VesselsA11oyFleet = typeof vesselsA11oyFleetTable.$inferSelect;
export type VesselsA11oyFleetInsert = typeof vesselsA11oyFleetTable.$inferInsert;
export type VesselsA11oyPositionLog = typeof vesselsA11oyPositionLogTable.$inferSelect;
export type VesselsA11oyRiskSnapshot = typeof vesselsA11oyRiskSnapshotTable.$inferSelect;
export type VesselsA11oyRoute = typeof vesselsA11oyRouteTable.$inferSelect;
export type VesselsA11oyCoexistenceReport = typeof vesselsA11oyCoexistenceReportTable.$inferSelect;
