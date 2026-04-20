import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const stephenContentBlocksTable = pgTable('stephen_content_blocks', {
  id: serial('id').primaryKey(),
  type: text('type', { enum: ['achievement', 'about', 'service', 'stat', 'skill'] }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  icon: text('icon'),
  date: text('date'),
  sortOrder: integer('sort_order').notNull().default(0),
  featured: boolean('featured').notNull().default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertStephenContentBlockSchema = createInsertSchema(stephenContentBlocksTable).omit({
  id: true,
  createdAt: true,
});
export type InsertStephenContentBlock = z.infer<typeof insertStephenContentBlockSchema>;
export type StephenContentBlock = typeof stephenContentBlocksTable.$inferSelect;

export const stephenCaseStudiesTable = pgTable('stephen_case_studies', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  coverImageUrl: text('cover_image_url'),
  tags: jsonb('tags').notNull().default([]),
  featured: boolean('featured').notNull().default(false),
  client: text('client'),
  duration: text('duration'),
  outcome: text('outcome'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertStephenCaseStudySchema = createInsertSchema(stephenCaseStudiesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertStephenCaseStudy = z.infer<typeof insertStephenCaseStudySchema>;
export type StephenCaseStudy = typeof stephenCaseStudiesTable.$inferSelect;

export const stephenBookingRequestsTable = pgTable('stephen_booking_requests', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company'),
  role: text('role'),
  type: text('type', {
    enum: [
      'consultation',
      'project',
      'recruitment',
      'partnership',
      'investment',
      'speaking',
      'other',
    ],
  }).notNull(),
  message: text('message').notNull(),
  preferredDate: text('preferred_date'),
  status: text('status', { enum: ['pending', 'confirmed', 'declined', 'completed'] })
    .notNull()
    .default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertStephenBookingRequestSchema = createInsertSchema(
  stephenBookingRequestsTable,
).omit({ id: true, createdAt: true, status: true });
export type InsertStephenBookingRequest = z.infer<typeof insertStephenBookingRequestSchema>;
export type StephenBookingRequest = typeof stephenBookingRequestsTable.$inferSelect;
