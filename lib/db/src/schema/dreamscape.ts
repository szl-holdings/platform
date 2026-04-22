import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const dreamscapeProjectsTable = pgTable('dreamscape_projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  clientName: text('client_name'),
  type: text('type').notNull(),
  status: text('status', {
    enum: [
      'concept',
      'pre_production',
      'production',
      'post_production',
      'review',
      'published',
      'archived',
    ],
  })
    .notNull()
    .default('concept'),
  mood: text('mood'),
  colorPalette: jsonb('color_palette'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const dreamscapeAssetsTable = pgTable(
  'dreamscape_assets',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => dreamscapeProjectsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(),
    fileUrl: text('file_url'),
    thumbnailUrl: text('thumbnail_url'),
    width: integer('width'),
    height: integer('height'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('dreamscape_assets_project_idx').on(t.projectId)],
);

export const dreamscapeCampaignsTable = pgTable('dreamscape_campaigns', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  clientName: text('client_name'),
  status: text('status', {
    enum: [
      'concept',
      'pre_production',
      'production',
      'post_production',
      'review',
      'published',
      'archived',
    ],
  })
    .notNull()
    .default('concept'),
  category: text('category', {
    enum: [
      'brand_story',
      'product_launch',
      'social_media',
      'documentary',
      'commercial',
      'internal',
    ],
  }).notNull(),
  targetAudience: text('target_audience'),
  deadline: timestamp('deadline'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const dreamscapeScriptsTable = pgTable(
  'dreamscape_scripts',
  {
    id: serial('id').primaryKey(),
    campaignId: integer('campaign_id')
      .notNull()
      .references(() => dreamscapeCampaignsTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    version: integer('version').notNull().default(1),
    status: text('status', { enum: ['draft', 'review', 'approved', 'final'] })
      .notNull()
      .default('draft'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('dreamscape_scripts_campaign_idx').on(t.campaignId)],
);

export const dreamscapeStoryboardsTable = pgTable(
  'dreamscape_storyboards',
  {
    id: serial('id').primaryKey(),
    campaignId: integer('campaign_id')
      .notNull()
      .references(() => dreamscapeCampaignsTable.id, { onDelete: 'cascade' }),
    scriptId: integer('script_id').references(() => dreamscapeScriptsTable.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    sceneNumber: integer('scene_number').notNull(),
    visualDescription: text('visual_description'),
    dialogue: text('dialogue'),
    duration: text('duration'),
    thumbnailUrl: text('thumbnail_url'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('dreamscape_storyboards_campaign_idx').on(t.campaignId),
    index('dreamscape_storyboards_script_idx').on(t.scriptId),
  ],
);

export const dreamscapeVoiceAssetsTable = pgTable(
  'dreamscape_voice_assets',
  {
    id: serial('id').primaryKey(),
    campaignId: integer('campaign_id')
      .notNull()
      .references(() => dreamscapeCampaignsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    voiceId: text('voice_id'),
    provider: text('provider', { enum: ['elevenlabs', 'manual', 'placeholder'] })
      .notNull()
      .default('placeholder'),
    text: text('text'),
    audioUrl: text('audio_url'),
    duration: text('duration'),
    status: text('status', { enum: ['pending', 'generating', 'ready', 'failed'] })
      .notNull()
      .default('pending'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('dreamscape_voice_assets_campaign_idx').on(t.campaignId)],
);

export const dreamscapeCampaignAssetsTable = pgTable(
  'dreamscape_campaign_assets',
  {
    id: serial('id').primaryKey(),
    campaignId: integer('campaign_id')
      .notNull()
      .references(() => dreamscapeCampaignsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type', {
      enum: ['image', 'video', 'audio', 'document', 'font', 'template', 'other'],
    }).notNull(),
    fileUrl: text('file_url'),
    thumbnailUrl: text('thumbnail_url'),
    fileSize: integer('file_size'),
    mimeType: text('mime_type'),
    tags: jsonb('tags'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('dreamscape_campaign_assets_campaign_idx').on(t.campaignId)],
);

export const dreamscapeReviewsTable = pgTable(
  'dreamscape_reviews',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id').references(() => dreamscapeProjectsTable.id, {
      onDelete: 'cascade',
    }),
    campaignId: integer('campaign_id').references(() => dreamscapeCampaignsTable.id, {
      onDelete: 'cascade',
    }),
    assetId: integer('asset_id').references(() => dreamscapeAssetsTable.id, {
      onDelete: 'set null',
    }),
    reviewerName: text('reviewer_name').notNull(),
    comment: text('comment').notNull(),
    status: text('status', { enum: ['pending', 'approved', 'changes_requested', 'rejected'] })
      .notNull()
      .default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('dreamscape_reviews_project_idx').on(t.projectId),
    index('dreamscape_reviews_campaign_idx').on(t.campaignId),
  ],
);

export const insertDreamscapeCampaignSchema = createInsertSchema(dreamscapeCampaignsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDreamscapeCampaign = z.infer<typeof insertDreamscapeCampaignSchema>;
export type DreamscapeCampaign = typeof dreamscapeCampaignsTable.$inferSelect;

export const insertDreamscapeScriptSchema = createInsertSchema(dreamscapeScriptsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDreamscapeScript = z.infer<typeof insertDreamscapeScriptSchema>;
export type DreamscapeScript = typeof dreamscapeScriptsTable.$inferSelect;

export const insertDreamscapeStoryboardSchema = createInsertSchema(dreamscapeStoryboardsTable).omit(
  { id: true, createdAt: true, updatedAt: true },
);
export type InsertDreamscapeStoryboard = z.infer<typeof insertDreamscapeStoryboardSchema>;
export type DreamscapeStoryboard = typeof dreamscapeStoryboardsTable.$inferSelect;

export const insertDreamscapeVoiceAssetSchema = createInsertSchema(dreamscapeVoiceAssetsTable).omit(
  { id: true, createdAt: true },
);
export type InsertDreamscapeVoiceAsset = z.infer<typeof insertDreamscapeVoiceAssetSchema>;
export type DreamscapeVoiceAsset = typeof dreamscapeVoiceAssetsTable.$inferSelect;

export const insertDreamscapeCampaignAssetSchema = createInsertSchema(
  dreamscapeCampaignAssetsTable,
).omit({ id: true, createdAt: true });
export type InsertDreamscapeCampaignAsset = z.infer<typeof insertDreamscapeCampaignAssetSchema>;
export type DreamscapeCampaignAsset = typeof dreamscapeCampaignAssetsTable.$inferSelect;

export const insertDreamscapeReviewSchema = createInsertSchema(dreamscapeReviewsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDreamscapeReview = z.infer<typeof insertDreamscapeReviewSchema>;
export type DreamscapeReview = typeof dreamscapeReviewsTable.$inferSelect;
