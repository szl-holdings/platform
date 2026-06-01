import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

export const insuranceCoverageTypeEnum = pgEnum('insurance_coverage_type', [
  'marine_cargo',
  'hull_machinery',
  'protection_indemnity',
  'freight_demurrage',
  'war_risk',
  'pollution_liability',
]);

export const insuranceRiskRatingEnum = pgEnum('insurance_risk_rating', [
  'low',
  'moderate',
  'high',
  'very_high',
  'uninsurable',
]);
export const insurancePolicyStatusEnum = pgEnum('insurance_policy_status', [
  'quote',
  'bound',
  'active',
  'expired',
  'cancelled',
  'claim_in_progress',
]);
export const insuranceClaimStatusEnum = pgEnum('insurance_claim_status', [
  'filed',
  'under_review',
  'investigation',
  'negotiation',
  'settled',
  'rejected',
  'closed',
]);

export const marineInsuranceQuotesTable = pgTable('marine_insurance_quotes', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').default(1),
  quoteRef: text('quote_ref').notNull().unique(),
  vesselMmsi: text('vessel_mmsi'),
  vesselImo: text('vessel_imo'),
  vesselName: text('vessel_name').notNull(),
  vesselType: text('vessel_type'),
  vesselAge: integer('vessel_age'),
  vesselGrossTonnage: numeric('vessel_gross_tonnage', { precision: 12, scale: 2 }),
  vesselFlag: text('vessel_flag'),
  cargoType: text('cargo_type'),
  cargoValueUsd: numeric('cargo_value_usd', { precision: 20, scale: 2 }),
  cargoHazardClass: text('cargo_hazard_class'),
  voyageOrigin: text('voyage_origin'),
  voyageDestination: text('voyage_destination'),
  routeChokepoints: jsonb('route_chokepoints'),
  coverageType: insuranceCoverageTypeEnum('coverage_type').notNull().default('marine_cargo'),
  coverageLimitUsd: numeric('coverage_limit_usd', { precision: 20, scale: 2 }),
  deductibleUsd: numeric('deductible_usd', { precision: 15, scale: 2 }).default('0'),
  coveragePeriodDays: integer('coverage_period_days').default(30),
  riskRating: insuranceRiskRatingEnum('risk_rating').default('moderate'),
  riskScore: numeric('risk_score', { precision: 5, scale: 2 }),
  riskFactors: jsonb('risk_factors'),
  baseRatePercent: numeric('base_rate_percent', { precision: 8, scale: 5 }),
  vesselAgeFactor: numeric('vessel_age_factor', { precision: 6, scale: 4 }).default('1.0'),
  routeFactor: numeric('route_factor', { precision: 6, scale: 4 }).default('1.0'),
  cargoHazardFactor: numeric('cargo_hazard_factor', { precision: 6, scale: 4 }).default('1.0'),
  claimsHistoryFactor: numeric('claims_history_factor', { precision: 6, scale: 4 }).default('1.0'),
  flagStateFactor: numeric('flag_state_factor', { precision: 6, scale: 4 }).default('1.0'),
  finalRatePercent: numeric('final_rate_percent', { precision: 8, scale: 5 }),
  annualPremiumUsd: numeric('annual_premium_usd', { precision: 15, scale: 2 }),
  premiumUsd: numeric('premium_usd', { precision: 15, scale: 2 }),
  expiresAt: timestamp('expires_at'),
  bindingNotes: text('binding_notes'),
  underwriterNotes: text('underwriter_notes'),
  status: insurancePolicyStatusEnum('status').default('quote'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const marineInsurancePoliciesTable = pgTable('marine_insurance_policies', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').default(1),
  quoteId: integer('quote_id').references(() => marineInsuranceQuotesTable.id),
  policyNumber: text('policy_number').notNull().unique(),
  vesselMmsi: text('vessel_mmsi'),
  vesselImo: text('vessel_imo'),
  vesselName: text('vessel_name').notNull(),
  coverageType: insuranceCoverageTypeEnum('coverage_type').notNull().default('marine_cargo'),
  coverageLimitUsd: numeric('coverage_limit_usd', { precision: 20, scale: 2 }),
  deductibleUsd: numeric('deductible_usd', { precision: 15, scale: 2 }),
  premiumUsd: numeric('premium_usd', { precision: 15, scale: 2 }),
  status: insurancePolicyStatusEnum('status').default('active'),
  effectiveAt: timestamp('effective_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  carrier: text('carrier').default("Lloyd's of London Syndicate"),
  syndicateCode: text('syndicate_code'),
  policyTerms: jsonb('policy_terms'),
  exclusions: jsonb('exclusions'),
  endorsements: jsonb('endorsements'),
  claimsCount: integer('claims_count').default(0),
  totalClaimsUsd: numeric('total_claims_usd', { precision: 20, scale: 2 }).default('0'),
  boundAt: timestamp('bound_at'),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const marineInsuranceClaimsTable = pgTable('marine_insurance_claims', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').default(1),
  policyId: integer('policy_id').references(() => marineInsurancePoliciesTable.id),
  claimRef: text('claim_ref').notNull().unique(),
  vesselMmsi: text('vessel_mmsi'),
  vesselName: text('vessel_name'),
  incidentType: text('incident_type'),
  incidentDescription: text('incident_description'),
  incidentAt: timestamp('incident_at'),
  incidentLocation: text('incident_location'),
  claimedAmountUsd: numeric('claimed_amount_usd', { precision: 20, scale: 2 }),
  approvedAmountUsd: numeric('approved_amount_usd', { precision: 20, scale: 2 }),
  settledAmountUsd: numeric('settled_amount_usd', { precision: 20, scale: 2 }),
  deductibleApplied: numeric('deductible_applied', { precision: 15, scale: 2 }),
  status: insuranceClaimStatusEnum('status').default('filed'),
  linkedExceptionId: integer('linked_exception_id'),
  supportingDocuments: jsonb('supporting_documents'),
  adjustorNotes: text('adjustor_notes'),
  surveyorReport: text('surveyor_report'),
  subrogationPotential: boolean('subrogation_potential').default(false),
  reserveAmountUsd: numeric('reserve_amount_usd', { precision: 20, scale: 2 }),
  filedAt: timestamp('filed_at').defaultNow(),
  settledAt: timestamp('settled_at'),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertMarineInsuranceQuoteSchema = createInsertSchema(marineInsuranceQuotesTable).omit(
  { id: true, createdAt: true, updatedAt: true },
);
export const insertMarineInsurancePolicySchema = createInsertSchema(
  marineInsurancePoliciesTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMarineInsuranceClaimSchema = createInsertSchema(marineInsuranceClaimsTable).omit(
  { id: true, createdAt: true, updatedAt: true },
);

export type MarineInsuranceQuote = typeof marineInsuranceQuotesTable.$inferSelect;
export type MarineInsurancePolicy = typeof marineInsurancePoliciesTable.$inferSelect;
export type MarineInsuranceClaim = typeof marineInsuranceClaimsTable.$inferSelect;
export type InsertMarineInsuranceQuote = typeof marineInsuranceQuotesTable.$inferInsert;
