import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const stephenSiteContactsTable = pgTable('stephen_site_contacts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company'),
  message: text('message').notNull(),
  status: text('status', { enum: ['new', 'read', 'replied', 'archived'] })
    .notNull()
    .default('new'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const stephenSiteTestimonialsTable = pgTable('stephen_site_testimonials', {
  id: serial('id').primaryKey(),
  clientName: text('client_name').notNull(),
  clientTitle: text('client_title'),
  clientCompany: text('client_company'),
  clientAvatarUrl: text('client_avatar_url'),
  content: text('content').notNull(),
  rating: integer('rating').notNull().default(5),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const stephenSiteCaseStudiesTable = pgTable('stephen_site_case_studies', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  client: text('client').notNull(),
  industry: text('industry'),
  summary: text('summary').notNull(),
  content: text('content'),
  coverImageUrl: text('cover_image_url'),
  technologies: text('technologies').array(),
  results: jsonb('results'),
  isPublished: boolean('is_published').notNull().default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertStephenSiteContactSchema = createInsertSchema(stephenSiteContactsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertStephenSiteContact = z.infer<typeof insertStephenSiteContactSchema>;
export type StephenSiteContact = typeof stephenSiteContactsTable.$inferSelect;

export const insertStephenSiteTestimonialSchema = createInsertSchema(
  stephenSiteTestimonialsTable,
).omit({ id: true, createdAt: true });
export type InsertStephenSiteTestimonial = z.infer<typeof insertStephenSiteTestimonialSchema>;
export type StephenSiteTestimonial = typeof stephenSiteTestimonialsTable.$inferSelect;

export const insertStephenSiteCaseStudySchema = createInsertSchema(
  stephenSiteCaseStudiesTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStephenSiteCaseStudy = z.infer<typeof insertStephenSiteCaseStudySchema>;
export type StephenSiteCaseStudy = typeof stephenSiteCaseStudiesTable.$inferSelect;
