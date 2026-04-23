import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const sitesTable = pgTable('sites', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  brandLabel: text('brand_label'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pagesTable = pgTable('pages', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  pageType: text('page_type'),
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('draft'),
  templateKey: text('template_key'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  ogTitle: text('og_title'),
  ogDescription: text('og_description'),
  canonicalUrl: text('canonical_url'),
  noindex: boolean('noindex').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  publishedAt: timestamp('published_at'),
});

export const sectionsTable = pgTable('sections', {
  id: serial('id').primaryKey(),
  pageId: integer('page_id')
    .notNull()
    .references(() => pagesTable.id, { onDelete: 'cascade' }),
  sectionKey: text('section_key').notNull(),
  sectionType: text('section_type'),
  heading: text('heading'),
  subheading: text('subheading'),
  bodyRichtext: text('body_richtext'),
  eyebrow: text('eyebrow'),
  sortOrder: integer('sort_order').notNull().default(0),
  isEnabled: boolean('is_enabled').notNull().default(true),
  styleVariant: text('style_variant'),
  dataJson: jsonb('data_json'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const venturesTable = pgTable('ventures', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  shortDescription: text('short_description'),
  longDescription: text('long_description'),
  statusBadge: text('status_badge'),
  stage: text('stage'),
  category: text('category'),
  primaryCtaLabel: text('primary_cta_label'),
  primaryCtaUrl: text('primary_cta_url'),
  secondaryCtaLabel: text('secondary_cta_label'),
  secondaryCtaUrl: text('secondary_cta_url'),
  accentToken: text('accent_token'),
  featuredImageUrl: text('featured_image_url'),
  isFeatured: boolean('is_featured').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  shortDescription: text('short_description'),
  fullDescription: text('full_description'),
  category: text('category'),
  iconKey: text('icon_key'),
  isFeatured: boolean('is_featured').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const featuresTable = pgTable('features', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  groupKey: text('group_key'),
  iconKey: text('icon_key'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const useCasesTable = pgTable('use_cases', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  audience: text('audience'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const roadmapItemsTable = pgTable('roadmap_items', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  phaseLabel: text('phase_label'),
  status: text('status', { enum: ['planned', 'in_progress', 'completed', 'delayed'] })
    .notNull()
    .default('planned'),
  targetQuarter: text('target_quarter'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const updatesTable = pgTable('updates', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  summary: text('summary'),
  bodyRichtext: text('body_richtext'),
  slug: text('slug').notNull(),
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('draft'),
  publishedAt: timestamp('published_at'),
  featuredImageUrl: text('featured_image_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const testimonialsTable = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  quote: text('quote').notNull(),
  attributionName: text('attribution_name'),
  attributionTitle: text('attribution_title'),
  attributionCompany: text('attribution_company'),
  isPublic: boolean('is_public').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const faqsTable = pgTable('faqs', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  answerRichtext: text('answer_richtext').notNull(),
  category: text('category'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const ctasTable = pgTable('ctas', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  url: text('url').notNull(),
  variant: text('variant'),
  helperText: text('helper_text'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const articlesTable = pgTable('articles', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  bodyRichtextOrMdx: text('body_richtext_or_mdx'),
  authorName: text('author_name'),
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('draft'),
  coverImageUrl: text('cover_image_url'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const caseStudiesTable = pgTable('case_studies', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  challenge: text('challenge'),
  approach: text('approach'),
  outcome: text('outcome'),
  takeaway: text('takeaway'),
  coverImageUrl: text('cover_image_url'),
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('draft'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const downloadsTable = pgTable('downloads', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  fileUrl: text('file_url'),
  fileType: text('file_type'),
  requiresForm: boolean('requires_form').notNull().default(false),
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const navigationItemsTable = pgTable('navigation_items', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  navGroup: text('nav_group').notNull(),
  label: text('label').notNull(),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isExternal: boolean('is_external').notNull().default(false),
  isEnabled: boolean('is_enabled').notNull().default(true),
  requiresAuth: boolean('requires_auth').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const siteSettingsTable = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  valueJson: jsonb('value_json'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const mediaAssetsTable = pgTable('media_assets', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id').references(() => sitesTable.id, { onDelete: 'set null' }),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  altText: text('alt_text'),
  mimeType: text('mime_type'),
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const formsTable = pgTable('forms', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id')
    .notNull()
    .references(() => sitesTable.id, { onDelete: 'cascade' }),
  formKey: text('form_key').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  successMessage: text('success_message'),
  notifyEmail: text('notify_email'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const contactSubmissionsTable = pgTable('contact_submissions', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id').references(() => sitesTable.id, { onDelete: 'set null' }),
  formKey: text('form_key').notNull(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  company: text('company'),
  message: text('message'),
  preferredTimeline: text('preferred_timeline'),
  metadataJson: jsonb('metadata_json'),
  status: text('status', { enum: ['open', 'resolved'] })
    .notNull()
    .default('open'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  emailOptOut: boolean('email_opt_out').notNull().default(false),
  emailOptOutAt: timestamp('email_opt_out_at'),
});

export const leadStatusTable = pgTable('lead_status', {
  id: serial('id').primaryKey(),
  contactSubmissionId: integer('contact_submission_id')
    .notNull()
    .references(() => contactSubmissionsTable.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['new', 'contacted', 'qualified', 'closed', 'lost'] })
    .notNull()
    .default('new'),
  ownerUserId: integer('owner_user_id'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  notificationSentAt: timestamp('notification_sent_at'),
});

export const redirectsTable = pgTable('redirects', {
  id: serial('id').primaryKey(),
  fromPath: text('from_path').notNull().unique(),
  toPath: text('to_path').notNull(),
  statusCode: integer('status_code').notNull().default(301),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertSiteSchema = createInsertSchema(sitesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Site = typeof sitesTable.$inferSelect;

export const insertPageSchema = createInsertSchema(pagesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pagesTable.$inferSelect;

export const insertSectionSchema = createInsertSchema(sectionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = typeof sectionsTable.$inferSelect;

export const insertVentureSchema = createInsertSchema(venturesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVenture = z.infer<typeof insertVentureSchema>;
export type Venture = typeof venturesTable.$inferSelect;

export const insertServiceSchema = createInsertSchema(servicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof servicesTable.$inferSelect;

export const insertFeatureSchema = createInsertSchema(featuresTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type Feature = typeof featuresTable.$inferSelect;

export const insertUseCaseSchema = createInsertSchema(useCasesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUseCase = z.infer<typeof insertUseCaseSchema>;
export type UseCase = typeof useCasesTable.$inferSelect;

export const insertRoadmapItemSchema = createInsertSchema(roadmapItemsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRoadmapItem = z.infer<typeof insertRoadmapItemSchema>;
export type RoadmapItem = typeof roadmapItemsTable.$inferSelect;

export const insertUpdateSchema = createInsertSchema(updatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUpdate = z.infer<typeof insertUpdateSchema>;
export type Update = typeof updatesTable.$inferSelect;

export const insertTestimonialSchema = createInsertSchema(testimonialsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonialsTable.$inferSelect;

export const insertFaqSchema = createInsertSchema(faqsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqsTable.$inferSelect;

export const insertCtaSchema = createInsertSchema(ctasTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCta = z.infer<typeof insertCtaSchema>;
export type Cta = typeof ctasTable.$inferSelect;

export const insertArticleSchema = createInsertSchema(articlesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;

export const insertCaseStudySchema = createInsertSchema(caseStudiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCaseStudy = z.infer<typeof insertCaseStudySchema>;
export type CaseStudy = typeof caseStudiesTable.$inferSelect;

export const insertDownloadSchema = createInsertSchema(downloadsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloadsTable.$inferSelect;

export const insertNavigationItemSchema = createInsertSchema(navigationItemsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertNavigationItem = z.infer<typeof insertNavigationItemSchema>;
export type NavigationItem = typeof navigationItemsTable.$inferSelect;

export const insertSiteSettingSchema = createInsertSchema(siteSettingsTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteSetting = typeof siteSettingsTable.$inferSelect;

export const insertMediaAssetSchema = createInsertSchema(mediaAssetsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;
export type MediaAsset = typeof mediaAssetsTable.$inferSelect;

export const insertFormSchema = createInsertSchema(formsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertForm = z.infer<typeof insertFormSchema>;
export type Form = typeof formsTable.$inferSelect;

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type ContactSubmission = typeof contactSubmissionsTable.$inferSelect;

export const insertLeadStatusSchema = createInsertSchema(leadStatusTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertLeadStatus = z.infer<typeof insertLeadStatusSchema>;
export type LeadStatus = typeof leadStatusTable.$inferSelect;

export const insertRedirectSchema = createInsertSchema(redirectsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertRedirect = z.infer<typeof insertRedirectSchema>;
export type Redirect = typeof redirectsTable.$inferSelect;

export const cmsPostsTable = pgTable('cms_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content'),
  excerpt: text('excerpt'),
  contentType: text('content_type', {
    enum: ['blog', 'case-study', 'investor-letter', 'update'],
  }).notNull(),
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('draft'),
  featuredImage: text('featured_image'),
  metaDescription: text('meta_description'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertCmsPostSchema = createInsertSchema(cmsPostsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCmsPost = z.infer<typeof insertCmsPostSchema>;
export type CmsPost = typeof cmsPostsTable.$inferSelect;

export const contactSubmissionRepliesTable = pgTable('contact_submission_replies', {
  id: serial('id').primaryKey(),
  contactSubmissionId: integer('contact_submission_id')
    .notNull()
    .references(() => contactSubmissionsTable.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  sentBy: text('sent_by').notNull().default('Admin'),
  emailSuccess: boolean('email_success').notNull().default(true),
  messageId: text('message_id'),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
});

export type ContactSubmissionReply = typeof contactSubmissionRepliesTable.$inferSelect;
