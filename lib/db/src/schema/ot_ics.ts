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
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const otIcsAssetsTable = pgTable(
  'ot_ics_assets',
  {
    id: serial('id').primaryKey(),
    assetId: text('asset_id').notNull().unique(),
    name: text('name').notNull(),
    zone: text('zone').notNull(),
    protocol: text('protocol', { enum: ['Modbus', 'DNP3', 'S7'] }).notNull(),
    baseline: numeric('baseline', { precision: 8, scale: 2 }).notNull().default('10'),
    baselineWindowDays: integer('baseline_window_days').notNull().default(30),
    baselineLastComputedAt: timestamp('baseline_last_computed_at'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    zoneIdx: index('ot_ics_assets_zone_idx').on(t.zone),
    protocolIdx: index('ot_ics_assets_protocol_idx').on(t.protocol),
  }),
);

export const insertOtIcsAssetSchema = createInsertSchema(otIcsAssetsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOtIcsAsset = z.infer<typeof insertOtIcsAssetSchema>;
export type OtIcsAsset = typeof otIcsAssetsTable.$inferSelect;

export const otIcsDecodedFramesTable = pgTable(
  'ot_ics_decoded_frames',
  {
    id: serial('id').primaryKey(),
    frameId: text('frame_id').notNull().unique(),
    observedAt: timestamp('observed_at').notNull().defaultNow(),
    protocol: text('protocol', { enum: ['Modbus', 'DNP3', 'S7'] }).notNull(),
    src: text('src').notNull(),
    dst: text('dst').notNull(),
    assetId: text('asset_id'),
    functionLabel: text('function_label').notNull(),
    summary: text('summary').notNull(),
    severity: text('severity', { enum: ['info', 'low', 'medium', 'high', 'critical'] })
      .notNull()
      .default('info'),
    rawHex: text('raw_hex').notNull(),
    fields: jsonb('fields')
      .$type<
        Array<{
          name: string;
          value: string;
          bytes: string;
          note?: string;
          flag?: 'info' | 'warn' | 'anomaly';
        }>
      >()
      .notNull()
      .default([]),
    forensicEventId: text('forensic_event_id'),
    conversationSessionId: text('conversation_session_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    observedAtIdx: index('ot_ics_frames_observed_at_idx').on(t.observedAt),
    protocolIdx: index('ot_ics_frames_protocol_idx').on(t.protocol),
    assetIdIdx: index('ot_ics_frames_asset_idx').on(t.assetId),
  }),
);

export const insertOtIcsDecodedFrameSchema = createInsertSchema(otIcsDecodedFramesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOtIcsDecodedFrame = z.infer<typeof insertOtIcsDecodedFrameSchema>;
export type OtIcsDecodedFrame = typeof otIcsDecodedFramesTable.$inferSelect;

export const otIcsConversationsTable = pgTable(
  'ot_ics_conversations',
  {
    id: serial('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    seq: integer('seq').notNull(),
    observedAt: timestamp('observed_at').notNull().defaultNow(),
    direction: text('direction', { enum: ['→', '←'] }).notNull(),
    src: text('src').notNull(),
    dst: text('dst').notNull(),
    protocol: text('protocol', { enum: ['Modbus', 'DNP3', 'S7'] }).notNull(),
    summary: text('summary').notNull(),
    bytes: integer('bytes').notNull().default(0),
    anomalous: boolean('anomalous').notNull().default(false),
    frameId: text('frame_id'),
    payloadHex: text('payload_hex').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    sessionSeqUnique: uniqueIndex('ot_ics_conv_session_seq_unique').on(t.sessionId, t.seq),
    sessionIdx: index('ot_ics_conv_session_idx').on(t.sessionId),
  }),
);

export const insertOtIcsConversationSchema = createInsertSchema(otIcsConversationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOtIcsConversation = z.infer<typeof insertOtIcsConversationSchema>;
export type OtIcsConversation = typeof otIcsConversationsTable.$inferSelect;

export const otIcsAnomalyScoresTable = pgTable(
  'ot_ics_anomaly_scores',
  {
    id: serial('id').primaryKey(),
    assetId: text('asset_id').notNull(),
    bucketAt: timestamp('bucket_at').notNull(),
    score: numeric('score', { precision: 8, scale: 2 }).notNull(),
    baselineSnapshot: numeric('baseline_snapshot', { precision: 8, scale: 2 }),
    reason: text('reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    assetBucketUnique: uniqueIndex('ot_ics_scores_asset_bucket_unique').on(t.assetId, t.bucketAt),
    assetIdx: index('ot_ics_scores_asset_idx').on(t.assetId),
    bucketAtIdx: index('ot_ics_scores_bucket_idx').on(t.bucketAt),
  }),
);

export const insertOtIcsAnomalyScoreSchema = createInsertSchema(otIcsAnomalyScoresTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOtIcsAnomalyScore = z.infer<typeof insertOtIcsAnomalyScoreSchema>;
export type OtIcsAnomalyScore = typeof otIcsAnomalyScoresTable.$inferSelect;
