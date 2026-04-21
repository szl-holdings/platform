import { index, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export type DealAttachment = {
  kind: 'deck' | 'data-room';
  name: string;
  size: number;
  contentType: string;
  objectPath: string;
};

export const fundInboundDealsTable = pgTable(
  'fund_inbound_deals',
  {
    id: serial('id').primaryKey(),
    pipelineId: text('pipeline_id').notNull().unique(),
    company: text('company').notNull(),
    website: text('website'),
    sector: text('sector').notNull(),
    stage: text('stage').notNull(),
    askSize: text('ask_size'),
    valuation: text('valuation'),
    arr: text('arr'),
    growth: text('growth'),
    founderName: text('founder_name').notNull(),
    founderEmail: text('founder_email').notNull(),
    founderBackground: text('founder_background'),
    founderEducation: text('founder_education'),
    founderPriorExits: text('founder_prior_exits'),
    summary: text('summary').notNull(),
    deckUrl: text('deck_url'),
    convictionScore: integer('conviction_score').notNull(),
    scoreTeam: integer('score_team').notNull(),
    scoreMarket: integer('score_market').notNull(),
    scoreProduct: integer('score_product').notNull(),
    scoreTraction: integer('score_traction').notNull(),
    scoreCompetitive: integer('score_competitive').notNull(),
    scoreFinancials: integer('score_financials').notNull(),
    status: text('status', { enum: ['screening', 'active', 'passed', 'invested'] })
      .notNull()
      .default('screening'),
    strengths: jsonb('strengths').$type<string[]>().notNull().default([]),
    risks: jsonb('risks').$type<string[]>().notNull().default([]),
    attachments: jsonb('attachments').$type<DealAttachment[]>().notNull().default([]),
    source: text('source').notNull().default('inbound'),
    notes: text('notes'),
    submittedAt: timestamp('submitted_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('fund_inbound_deals_pipeline_id_idx').on(t.pipelineId),
    index('fund_inbound_deals_status_idx').on(t.status),
    index('fund_inbound_deals_submitted_idx').on(t.submittedAt),
  ],
);

export const insertFundInboundDealSchema = createInsertSchema(fundInboundDealsTable).omit({
  id: true,
  submittedAt: true,
});
export type InsertFundInboundDeal = z.infer<typeof insertFundInboundDealSchema>;
export type FundInboundDeal = typeof fundInboundDealsTable.$inferSelect;
