import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth.js';

/**
 * crisis_arena_engagements — client-posted crisis scenario briefs.
 * Owned by the authenticated client who created them (ownerId = users.id).
 * tenantId is the org slug used for multi-tenant isolation.
 */
export const crisisArenaEngagementsTable = pgTable(
  'crisis_arena_engagements',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id').notNull(),
    ownerId: integer('owner_id').references(() => usersTable.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    scopedAssets: jsonb('scoped_assets').notNull().default([]),
    scopedDomains: jsonb('scoped_domains').notNull().default([]),
    archetypeFilter: jsonb('archetype_filter').notNull().default([]),
    payoutPool: integer('payout_pool').notNull().default(0),
    deadline: timestamp('deadline').notNull(),
    status: text('status').notNull().default('open'),
    submissionCount: integer('submission_count').notNull().default(0),
    acceptedCount: integer('accepted_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('crisis_arena_eng_tenant_idx').on(t.tenantId),
    index('crisis_arena_eng_owner_idx').on(t.ownerId),
    index('crisis_arena_eng_status_idx').on(t.status),
  ],
);

/**
 * crisis_arena_submissions — architect-submitted adversarial scenarios.
 * Status FSM: pending → accepted | rejected | duplicate | out_of_scope
 *             accepted → graduated
 */
export const crisisArenaSubmissionsTable = pgTable(
  'crisis_arena_submissions',
  {
    id: text('id').primaryKey(),
    engagementId: text('engagement_id')
      .notNull()
      .references(() => crisisArenaEngagementsTable.id, { onDelete: 'cascade' }),
    architectId: text('architect_id').notNull(),
    title: text('title').notNull(),
    narrative: text('narrative').notNull(),
    archetype: text('archetype').notNull(),
    businessImpactScore: integer('business_impact_score').notNull().default(0),
    status: text('status').notNull().default('pending'),
    reputationAwarded: integer('reputation_awarded').notNull().default(0),
    payoutAwarded: integer('payout_awarded').notNull().default(0),
    triageJustification: text('triage_justification'),
    graduatedIncidentId: text('graduated_incident_id'),
    impactEstimate: jsonb('impact_estimate').notNull().default({}),
    killChain: jsonb('kill_chain').notNull().default([]),
    submittedAt: timestamp('submitted_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('crisis_arena_sub_eng_idx').on(t.engagementId),
    index('crisis_arena_sub_architect_idx').on(t.architectId),
    index('crisis_arena_sub_status_idx').on(t.status),
  ],
);

/**
 * crisis_arena_architect_profiles — public leaderboard profiles for crisis architects.
 * handle is unique across all architects.
 */
export const crisisArenaArchitectProfilesTable = pgTable(
  'crisis_arena_architect_profiles',
  {
    id: text('id').primaryKey(),
    handle: text('handle').notNull().unique(),
    displayName: text('display_name').notNull(),
    bio: text('bio'),
    reputationScore: integer('reputation_score').notNull().default(0),
    acceptedCount: integer('accepted_count').notNull().default(0),
    submissionCount: integer('submission_count').notNull().default(0),
    totalImpactUsd: integer('total_impact_usd').notNull().default(0),
    badges: jsonb('badges').notNull().default([]),
    archetypeStats: jsonb('archetype_stats').notNull().default([]),
    topScenarioTitles: jsonb('top_scenario_titles').notNull().default([]),
    isPublic: boolean('is_public').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('crisis_arena_profile_handle_idx').on(t.handle),
    index('crisis_arena_profile_rep_idx').on(t.reputationScore),
  ],
);

/**
 * crisis_arena_reputation_events — immutable ledger of reputation credits/debits.
 * Used to compute monthly movers (deltas in the last 30 days).
 */
export const crisisArenaReputationEventsTable = pgTable(
  'crisis_arena_reputation_events',
  {
    id: serial('id').primaryKey(),
    architectId: text('architect_id').notNull(),
    delta: integer('delta').notNull(),
    reason: text('reason').notNull(),
    submissionId: text('submission_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('crisis_arena_rep_architect_idx').on(t.architectId),
    index('crisis_arena_rep_created_idx').on(t.createdAt),
  ],
);

/**
 * crisis_arena_triage_events — audit log for triage/award/graduate actions.
 * Append-only; records every decision with actor and justification.
 */
export const crisisArenaTriageEventsTable = pgTable(
  'crisis_arena_triage_events',
  {
    id: text('id').primaryKey(),
    submissionId: text('submission_id').notNull(),
    engagementId: text('engagement_id').notNull(),
    action: text('action').notNull(),
    actor: text('actor').notNull(),
    justification: text('justification').notNull(),
    payoutAmount: integer('payout_amount'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('crisis_arena_triage_sub_idx').on(t.submissionId),
    index('crisis_arena_triage_eng_idx').on(t.engagementId),
  ],
);

export const insertCrisisArenaEngagementSchema = createInsertSchema(crisisArenaEngagementsTable).omit({ createdAt: true, updatedAt: true });
export const selectCrisisArenaEngagementSchema = createSelectSchema(crisisArenaEngagementsTable);

export const insertCrisisArenaSubmissionSchema = createInsertSchema(crisisArenaSubmissionsTable).omit({ submittedAt: true, updatedAt: true });
export const selectCrisisArenaSubmissionSchema = createSelectSchema(crisisArenaSubmissionsTable);

export const insertCrisisArenaArchitectProfileSchema = createInsertSchema(crisisArenaArchitectProfilesTable).omit({ createdAt: true, updatedAt: true });
export const selectCrisisArenaArchitectProfileSchema = createSelectSchema(crisisArenaArchitectProfilesTable);

export type CrisisArenaEngagement = typeof crisisArenaEngagementsTable.$inferSelect;
export type InsertCrisisArenaEngagement = typeof crisisArenaEngagementsTable.$inferInsert;

export type CrisisArenaSubmission = typeof crisisArenaSubmissionsTable.$inferSelect;
export type InsertCrisisArenaSubmission = typeof crisisArenaSubmissionsTable.$inferInsert;

export type CrisisArenaArchitectProfile = typeof crisisArenaArchitectProfilesTable.$inferSelect;
export type InsertCrisisArenaArchitectProfile = typeof crisisArenaArchitectProfilesTable.$inferInsert;

export type CrisisArenaReputationEvent = typeof crisisArenaReputationEventsTable.$inferSelect;
export type CrisisArenaTriageEvent = typeof crisisArenaTriageEventsTable.$inferSelect;
