import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth.js';
import { platformSignalsTable } from './canonical.js';
import { organizationsTable } from './organizations.js';

export const portsTable = pgTable(
  'ports',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    locode: text('locode').unique(),
    country: text('country').notNull(),
    region: text('region'),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    portType: text('port_type', {
      enum: ['container', 'bulk', 'tanker', 'multipurpose', 'passenger', 'fishing', 'inland'],
    })
      .notNull()
      .default('multipurpose'),
    status: text('status', { enum: ['open', 'restricted', 'closed', 'congested'] })
      .notNull()
      .default('open'),
    timezone: text('timezone'),
    avgCongestionDays: numeric('avg_congestion_days', { precision: 5, scale: 2 }),
    weeklyCapacityTeu: integer('weekly_capacity_teu'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('ports_org_idx').on(t.orgId), index('ports_country_idx').on(t.country)],
);

export const corridorsTable = pgTable(
  'corridors',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    description: text('description'),
    originPortId: integer('origin_port_id').references(() => portsTable.id, {
      onDelete: 'set null',
    }),
    destinationPortId: integer('destination_port_id').references(() => portsTable.id, {
      onDelete: 'set null',
    }),
    distanceNm: numeric('distance_nm', { precision: 10, scale: 2 }),
    avgTransitDays: numeric('avg_transit_days', { precision: 5, scale: 2 }),
    riskLevel: text('risk_level', { enum: ['low', 'moderate', 'high', 'critical'] })
      .notNull()
      .default('low'),
    activeConflicts: jsonb('active_conflicts').$type<string[]>().default([]),
    waypoints: jsonb('waypoints'),
    geopoliticalRisk: integer('geopolitical_risk').default(0),
    weatherRisk: integer('weather_risk').default(0),
    pirateRisk: integer('pirate_risk').default(0),
    status: text('status', { enum: ['operational', 'monitored', 'restricted', 'deprecated'] })
      .notNull()
      .default('operational'),
    controlledByNation: text('controlled_by_nation'),
    sanctionedTerritory: integer('sanctioned_territory').notNull().default(0),
    alternativeRouteIds: jsonb('alternative_route_ids').$type<number[]>().default([]),
    insurancePremiumModifier: numeric('insurance_premium_modifier', {
      precision: 5,
      scale: 4,
    }).default('1.0000'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('corridors_org_idx').on(t.orgId),
    index('corridors_status_idx').on(t.status),
    index('corridors_risk_level_idx').on(t.riskLevel),
  ],
);

export const maritimeVesselsTable = pgTable(
  'maritime_vessels',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    imo: text('imo'),
    mmsi: text('mmsi'),
    callSign: text('call_sign'),
    flag: text('flag'),
    vesselType: text('vessel_type', {
      enum: [
        'container',
        'tanker',
        'bulk',
        'cargo',
        'passenger',
        'ro-ro',
        'lpg',
        'lng',
        'chemical',
        'other',
      ],
    })
      .notNull()
      .default('container'),
    yearBuilt: integer('year_built'),
    grossTonnage: numeric('gross_tonnage', { precision: 12, scale: 2 }),
    deadweightTonnage: numeric('deadweight_tonnage', { precision: 12, scale: 2 }),
    lengthM: numeric('length_m', { precision: 8, scale: 2 }),
    beamM: numeric('beam_m', { precision: 7, scale: 2 }),
    maxSpeedKnots: numeric('max_speed_knots', { precision: 5, scale: 2 }),
    fuelTypeMain: text('fuel_type_main'),
    status: text('status', {
      enum: [
        'active',
        'in_port',
        'at_sea',
        'anchored',
        'maintenance',
        'decommissioned',
        'off_hire',
      ],
    })
      .notNull()
      .default('active'),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    heading: numeric('heading', { precision: 5, scale: 2 }),
    speedOverGround: numeric('speed_over_ground', { precision: 6, scale: 2 }),
    lastPositionAt: timestamp('last_position_at'),
    currentPortId: integer('current_port_id').references(() => portsTable.id, {
      onDelete: 'set null',
    }),
    destinationPortId: integer('destination_port_id').references(() => portsTable.id, {
      onDelete: 'set null',
    }),
    etaAt: timestamp('eta_at'),
    scheduledEtaAt: timestamp('scheduled_eta_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('maritime_vessels_org_idx').on(t.orgId),
    index('maritime_vessels_status_idx').on(t.status),
  ],
);

export const voyagesTable = pgTable(
  'voyages',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    vesselId: integer('vessel_id')
      .notNull()
      .references(() => maritimeVesselsTable.id, { onDelete: 'cascade' }),
    voyageNumber: text('voyage_number'),
    originPortId: integer('origin_port_id').references(() => portsTable.id, {
      onDelete: 'set null',
    }),
    destinationPortId: integer('destination_port_id').references(() => portsTable.id, {
      onDelete: 'set null',
    }),
    cargoType: text('cargo_type'),
    cargoDescription: text('cargo_description'),
    cargoTonnage: numeric('cargo_tonnage', { precision: 12, scale: 2 }),
    cargoValueUsd: numeric('cargo_value_usd', { precision: 15, scale: 2 }),
    status: text('status', {
      enum: [
        'planned',
        'loading',
        'departed',
        'at_sea',
        'arrived',
        'discharging',
        'completed',
        'cancelled',
        'diverted',
      ],
    })
      .notNull()
      .default('planned'),
    scheduledDepartureAt: timestamp('scheduled_departure_at'),
    actualDepartureAt: timestamp('actual_departure_at'),
    scheduledArrivalAt: timestamp('scheduled_arrival_at'),
    estimatedArrivalAt: timestamp('estimated_arrival_at'),
    actualArrivalAt: timestamp('actual_arrival_at'),
    distanceNm: numeric('distance_nm', { precision: 10, scale: 2 }),
    fuelConsumedMt: numeric('fuel_consumed_mt', { precision: 10, scale: 2 }),
    fuelCostUsd: numeric('fuel_cost_usd', { precision: 12, scale: 2 }),
    portCostsUsd: numeric('port_costs_usd', { precision: 12, scale: 2 }),
    revenueUsd: numeric('revenue_usd', { precision: 15, scale: 2 }),
    charterRatePerDay: numeric('charter_rate_per_day', { precision: 12, scale: 2 }),
    etaDriftHours: numeric('eta_drift_hours', { precision: 7, scale: 2 }),
    corridorId: integer('corridor_id').references(() => corridorsTable.id, {
      onDelete: 'set null',
    }),
    waypoints: jsonb('waypoints'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('voyages_org_idx').on(t.orgId),
    index('voyages_vessel_idx').on(t.vesselId),
    index('voyages_status_idx').on(t.status),
    index('voyages_created_idx').on(t.createdAt),
  ],
);

export const maritimeExceptionsTable = pgTable(
  'maritime_exceptions',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    voyageId: integer('voyage_id').references(() => voyagesTable.id, { onDelete: 'set null' }),
    vesselId: integer('vessel_id').references(() => maritimeVesselsTable.id, {
      onDelete: 'set null',
    }),
    signalId: integer('signal_id').references(() => platformSignalsTable.id, {
      onDelete: 'set null',
    }),
    exceptionType: text('exception_type', {
      enum: [
        'eta_deviation',
        'route_deviation',
        'weather_delay',
        'port_congestion',
        'mechanical',
        'cargo_incident',
        'security_threat',
        'regulatory',
        'commercial',
        'other',
      ],
    }).notNull(),
    severity: text('severity', { enum: ['critical', 'high', 'medium', 'low'] })
      .notNull()
      .default('medium'),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', {
      enum: ['new', 'acknowledged', 'assigned', 'escalated', 'resolved', 'dismissed'],
    })
      .notNull()
      .default('new'),
    assignedTo: integer('assigned_to').references(() => usersTable.id, { onDelete: 'set null' }),
    valueAtRiskUsd: numeric('value_at_risk_usd', { precision: 15, scale: 2 }),
    etaImpactHours: numeric('eta_impact_hours', { precision: 7, scale: 2 }),
    costImpactUsd: numeric('cost_impact_usd', { precision: 12, scale: 2 }),
    detectedAt: timestamp('detected_at').notNull().defaultNow(),
    acknowledgedAt: timestamp('acknowledged_at'),
    resolvedAt: timestamp('resolved_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('maritime_exceptions_org_idx').on(t.orgId),
    index('maritime_exceptions_status_idx').on(t.status),
    index('maritime_exceptions_severity_idx').on(t.severity),
    index('maritime_exceptions_vessel_idx').on(t.vesselId),
    index('maritime_exceptions_detected_idx').on(t.detectedAt),
  ],
);

export const insertPortSchema = createInsertSchema(portsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPort = z.infer<typeof insertPortSchema>;
export type Port = typeof portsTable.$inferSelect;

export const insertCorridorSchema = createInsertSchema(corridorsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCorridor = z.infer<typeof insertCorridorSchema>;
export type Corridor = typeof corridorsTable.$inferSelect;

export const insertMaritimeVesselSchema = createInsertSchema(maritimeVesselsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMaritimeVessel = z.infer<typeof insertMaritimeVesselSchema>;
export type MaritimeVessel = typeof maritimeVesselsTable.$inferSelect;

export const insertVoyageSchema = createInsertSchema(voyagesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVoyage = z.infer<typeof insertVoyageSchema>;
export type Voyage = typeof voyagesTable.$inferSelect;

export const insertMaritimeExceptionSchema = createInsertSchema(maritimeExceptionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMaritimeException = z.infer<typeof insertMaritimeExceptionSchema>;
export type MaritimeException = typeof maritimeExceptionsTable.$inferSelect;
