import { index, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const alloyPolicyVersions = pgTable(
  'alloy_policy_versions',
  {
    id: serial('id').primaryKey(),
    externalId: text('external_id').notNull().unique(),
    studioId: text('studio_id').notNull().default('default'),
    versionNumber: integer('version_number').notNull(),
    input: text('input').notNull(),
    policy: jsonb('policy').notNull(),
    author: text('author').notNull(),
    authorId: text('author_id').notNull(),
    message: text('message').notNull(),
    signers: jsonb('signers').notNull().default([]),
    savedAt: timestamp('saved_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('alloy_policy_versions_studio_idx').on(t.studioId, t.versionNumber),
    index('alloy_policy_versions_saved_idx').on(t.savedAt),
  ],
);

export const alloyPolicyTestCases = pgTable(
  'alloy_policy_test_cases',
  {
    id: serial('id').primaryKey(),
    externalId: text('external_id').notNull().unique(),
    studioId: text('studio_id').notNull().default('default'),
    name: text('name').notNull(),
    context: jsonb('context').notNull().default({}),
    expectedOutcome: text('expected_outcome').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('alloy_policy_test_cases_studio_idx').on(t.studioId)],
);

export type AlloyPolicyVersion = typeof alloyPolicyVersions.$inferSelect;
export type InsertAlloyPolicyVersion = typeof alloyPolicyVersions.$inferInsert;
export type AlloyPolicyTestCase = typeof alloyPolicyTestCases.$inferSelect;
export type InsertAlloyPolicyTestCase = typeof alloyPolicyTestCases.$inferInsert;
