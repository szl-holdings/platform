import {
  boolean,
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
import { voyagesTable } from './maritime.js';
import { organizationsTable } from './organizations.js';
import { vesselsTable } from './vessels.js';

export const fleetExceptionsTable = pgTable(
  'fleet_exceptions',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    vesselId: integer('vessel_id').references(() => vesselsTable.id, { onDelete: 'cascade' }),
    voyageId: integer('voyage_id').references(() => voyagesTable.id, { onDelete: 'set null' }),
    exceptionRef: text('exception_ref').notNull(),
    exceptionType: text('exception_type', {
      enum: [
        'route_deviation',
        'delay_risk',
        'port_congestion',
        'weather_disruption',
        'maintenance_risk',
        'fuel_anomaly',
        'schedule_variance',
        'security_alert',
        'ais_dark',
        'sanctions_match',
        'overdue_arrival',
        'inspection_failure',
      ],
    }).notNull(),
    severity: text('severity', { enum: ['critical', 'high', 'watch', 'normal'] })
      .notNull()
      .default('watch'),
    title: text('title').notNull(),
    description: text('description').notNull(),
    whyItMatters: text('why_it_matters'),
    recommendedResponse: text('recommended_response'),
    businessConsequence: text('business_consequence'),
    owner: text('owner'),
    ownerFunction: text('owner_function'),
    estimatedImpactUsd: numeric('estimated_impact_usd', { precision: 15, scale: 2 }),
    status: text('status', { enum: ['active', 'acknowledged', 'resolved', 'dismissed'] })
      .notNull()
      .default('active'),
    acknowledgedAt: timestamp('acknowledged_at'),
    acknowledgedBy: integer('acknowledged_by').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    resolvedAt: timestamp('resolved_at'),
    resolvedBy: integer('resolved_by').references(() => usersTable.id, { onDelete: 'set null' }),
    resolutionNotes: text('resolution_notes'),
    detectedAt: timestamp('detected_at').notNull().defaultNow(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('fleet_exceptions_org_idx').on(table.orgId),
    index('fleet_exceptions_vessel_idx').on(table.vesselId),
    index('fleet_exceptions_status_idx').on(table.status),
    index('fleet_exceptions_severity_idx').on(table.severity),
    index('fleet_exceptions_detected_idx').on(table.detectedAt),
  ],
);

export const vesselMaintenanceTable = pgTable(
  'vessel_maintenance',
  {
    id: serial('id').primaryKey(),
    vesselId: integer('vessel_id')
      .notNull()
      .references(() => vesselsTable.id, { onDelete: 'cascade' }),
    component: text('component').notNull(),
    maintenanceType: text('maintenance_type', {
      enum: ['preventive', 'corrective', 'scheduled', 'predictive'],
    }).notNull(),
    description: text('description'),
    status: text('status', {
      enum: ['overdue', 'due_soon', 'scheduled', 'in_progress', 'completed'],
    })
      .notNull()
      .default('scheduled'),
    priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] })
      .notNull()
      .default('medium'),
    dueDate: timestamp('due_date'),
    completedAt: timestamp('completed_at'),
    estimatedCost: numeric('estimated_cost', { precision: 12, scale: 2 }),
    riskOfServiceIssue: numeric('risk_of_service_issue', { precision: 5, scale: 2 }),
    impactsVoyageAvailability: boolean('impacts_voyage_availability').notNull().default(false),
    assetHealth: numeric('asset_health', { precision: 5, scale: 2 }),
    technician: text('technician'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('vessel_maintenance_vessel_idx').on(table.vesselId),
    index('vessel_maintenance_status_idx').on(table.status),
    index('vessel_maintenance_due_idx').on(table.dueDate),
  ],
);

export const vesselSanctionsScreeningTable = pgTable(
  'vessel_sanctions_screening',
  {
    id: serial('id').primaryKey(),
    vesselId: integer('vessel_id')
      .notNull()
      .references(() => vesselsTable.id, { onDelete: 'cascade' }),
    screeningDate: timestamp('screening_date').notNull().defaultNow(),
    ofacStatus: text('ofac_status', { enum: ['clear', 'match', 'partial_match', 'pending'] })
      .notNull()
      .default('pending'),
    euStatus: text('eu_status', { enum: ['clear', 'match', 'partial_match', 'pending'] })
      .notNull()
      .default('pending'),
    unStatus: text('un_status', { enum: ['clear', 'match', 'partial_match', 'pending'] })
      .notNull()
      .default('pending'),
    ukStatus: text('uk_status', { enum: ['clear', 'match', 'partial_match', 'pending'] })
      .notNull()
      .default('pending'),
    matchedLists: jsonb('matched_lists').$type<string[]>().default([]),
    matchConfidence: numeric('match_confidence', { precision: 5, scale: 2 }),
    flagRegistryValid: boolean('flag_registry_valid').default(true),
    flagRegistryNotes: text('flag_registry_notes'),
    pscInspectionDate: timestamp('psc_inspection_date'),
    pscResult: text('psc_result', {
      enum: ['passed', 'deficiency', 'detained', 'no_inspection'],
    }).default('no_inspection'),
    pscDeficiencies: integer('psc_deficiencies').default(0),
    complianceScore: numeric('compliance_score', { precision: 5, scale: 2 }),
    ownershipOpaque: boolean('ownership_opaque').default(false),
    knownOwner: text('known_owner'),
    knownManager: text('known_manager'),
    flagState: text('flag_state'),
    notes: text('notes'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('vessel_sanctions_vessel_idx').on(table.vesselId),
    index('vessel_sanctions_ofac_idx').on(table.ofacStatus),
    index('vessel_sanctions_date_idx').on(table.screeningDate),
  ],
);

export const vesselPortCallsTable = pgTable(
  'vessel_port_calls',
  {
    id: serial('id').primaryKey(),
    vesselId: integer('vessel_id')
      .notNull()
      .references(() => vesselsTable.id, { onDelete: 'cascade' }),
    portName: text('port_name').notNull(),
    portLocode: text('port_locode'),
    portCountry: text('port_country'),
    arrivalAt: timestamp('arrival_at'),
    departureAt: timestamp('departure_at'),
    durationHours: numeric('duration_hours', { precision: 7, scale: 2 }),
    purpose: text('purpose', {
      enum: [
        'loading',
        'discharging',
        'bunkering',
        'crew_change',
        'repair',
        'inspection',
        'transit',
        'layup',
      ],
    }).default('loading'),
    cargoLoaded: numeric('cargo_loaded', { precision: 12, scale: 2 }),
    cargoDischarged: numeric('cargo_discharged', { precision: 12, scale: 2 }),
    portCostUsd: numeric('port_cost_usd', { precision: 12, scale: 2 }),
    bunkeredMt: numeric('bunkered_mt', { precision: 8, scale: 2 }),
    canalTransit: boolean('canal_transit').default(false),
    canalName: text('canal_name'),
    canalFeeUsd: numeric('canal_fee_usd', { precision: 12, scale: 2 }),
    agentName: text('agent_name'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('vessel_port_calls_vessel_idx').on(table.vesselId),
    index('vessel_port_calls_arrival_idx').on(table.arrivalAt),
    index('vessel_port_calls_port_idx').on(table.portName),
  ],
);

export const vesselVoyageEconomicsTable = pgTable(
  'vessel_voyage_economics',
  {
    id: serial('id').primaryKey(),
    vesselId: integer('vessel_id')
      .notNull()
      .references(() => vesselsTable.id, { onDelete: 'cascade' }),
    voyageRef: text('voyage_ref').notNull(),
    originPort: text('origin_port').notNull(),
    destinationPort: text('destination_port').notNull(),
    cargoType: text('cargo_type'),
    cargoQuantityMt: numeric('cargo_quantity_mt', { precision: 12, scale: 2 }),
    cargoValueUsd: numeric('cargo_value_usd', { precision: 15, scale: 2 }),
    charterType: text('charter_type', {
      enum: ['time_charter', 'voyage_charter', 'spot', 'bareboat'],
    })
      .notNull()
      .default('voyage_charter'),
    charterRatePerDay: numeric('charter_rate_per_day', { precision: 12, scale: 2 }),
    grossRevenue: numeric('gross_revenue', { precision: 15, scale: 2 }),
    fuelCostUsd: numeric('fuel_cost_usd', { precision: 12, scale: 2 }),
    fuelConsumedMt: numeric('fuel_consumed_mt', { precision: 10, scale: 2 }),
    portCostsUsd: numeric('port_costs_usd', { precision: 12, scale: 2 }),
    canalFeesUsd: numeric('canal_fees_usd', { precision: 12, scale: 2 }),
    crewCostsUsd: numeric('crew_costs_usd', { precision: 12, scale: 2 }),
    maintenanceCostsUsd: numeric('maintenance_costs_usd', { precision: 12, scale: 2 }),
    otherCostsUsd: numeric('other_costs_usd', { precision: 12, scale: 2 }),
    totalCostsUsd: numeric('total_costs_usd', { precision: 15, scale: 2 }),
    netMarginUsd: numeric('net_margin_usd', { precision: 15, scale: 2 }),
    marginPct: numeric('margin_pct', { precision: 7, scale: 4 }),
    tcePerDay: numeric('tce_per_day', { precision: 12, scale: 2 }),
    distanceNm: numeric('distance_nm', { precision: 10, scale: 2 }),
    durationDays: numeric('duration_days', { precision: 7, scale: 2 }),
    delayHours: numeric('delay_hours', { precision: 7, scale: 2 }).default('0'),
    delayCostUsd: numeric('delay_cost_usd', { precision: 12, scale: 2 }).default('0'),
    status: text('status', { enum: ['planned', 'loading', 'at_sea', 'completed', 'cancelled'] })
      .notNull()
      .default('planned'),
    scheduledDepartureAt: timestamp('scheduled_departure_at'),
    actualDepartureAt: timestamp('actual_departure_at'),
    scheduledArrivalAt: timestamp('scheduled_arrival_at'),
    estimatedArrivalAt: timestamp('estimated_arrival_at'),
    actualArrivalAt: timestamp('actual_arrival_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('vessel_voyage_econ_vessel_idx').on(table.vesselId),
    index('vessel_voyage_econ_status_idx').on(table.status),
    index('vessel_voyage_econ_created_idx').on(table.createdAt),
  ],
);

export const insertFleetExceptionSchema = createInsertSchema(fleetExceptionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  detectedAt: true,
});
export type InsertFleetException = z.infer<typeof insertFleetExceptionSchema>;
export type FleetException = typeof fleetExceptionsTable.$inferSelect;

export const insertVesselMaintenanceSchema = createInsertSchema(vesselMaintenanceTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVesselMaintenance = z.infer<typeof insertVesselMaintenanceSchema>;
export type VesselMaintenance = typeof vesselMaintenanceTable.$inferSelect;

export const insertVesselSanctionsScreeningSchema = createInsertSchema(
  vesselSanctionsScreeningTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVesselSanctionsScreening = z.infer<typeof insertVesselSanctionsScreeningSchema>;
export type VesselSanctionsScreening = typeof vesselSanctionsScreeningTable.$inferSelect;

export const insertVesselPortCallSchema = createInsertSchema(vesselPortCallsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertVesselPortCall = z.infer<typeof insertVesselPortCallSchema>;
export type VesselPortCall = typeof vesselPortCallsTable.$inferSelect;

export const insertVesselVoyageEconomicsSchema = createInsertSchema(
  vesselVoyageEconomicsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVesselVoyageEconomics = z.infer<typeof insertVesselVoyageEconomicsSchema>;
export type VesselVoyageEconomics = typeof vesselVoyageEconomicsTable.$inferSelect;
