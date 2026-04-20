import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import { listQuerySchema, validateBody, validateQuery } from "../lib/validation";
import multer from "multer";
import {
  db, sitesTable, pagesTable, sectionsTable, venturesTable, servicesTable,
  featuresTable, useCasesTable, roadmapItemsTable, updatesTable,
  testimonialsTable, faqsTable, ctasTable, articlesTable, caseStudiesTable,
  downloadsTable, navigationItemsTable, siteSettingsTable, mediaAssetsTable,
  formsTable, contactSubmissionsTable, leadStatusTable, redirectsTable,
  cmsPostsTable,
} from "@szl-holdings/db";
import { eq, desc, asc, sql, and, inArray } from "drizzle-orm";
import { sendSuccess, sendNotFound, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { services } from "@szl-holdings/services";

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});


const contactSubmissionSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().max(320).trim().toLowerCase(),
  company: z.string().max(200).trim().optional().nullable(),
  phone: z.string().max(50).trim().optional().nullable(),
  message: z.string().min(1).max(10000).trim(),
  formKey: z.string().max(100).trim().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const createPageSchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1).max(500).trim(),
  slug: z.string().min(1).max(200).trim(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  metaTitle: z.string().max(200).trim().optional().nullable(),
  metaDescription: z.string().max(500).trim().optional().nullable(),
  content: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchPageSchema = createPageSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const createArticleSchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1).max(500).trim(),
  slug: z.string().min(1).max(200).trim(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  excerpt: z.string().max(1000).trim().optional().nullable(),
  content: z.string().max(100000).optional().nullable(),
  coverImageUrl: z.string().url().max(2048).optional().nullable(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchArticleSchema = createArticleSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const createCmsPostSchema = z.object({
  title: z.string().min(1).max(500).trim(),
  slug: z.string().min(1).max(200).trim().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  content: z.string().max(200000).optional().nullable(),
  excerpt: z.string().max(2000).trim().optional().nullable(),
  coverImageUrl: z.string().url().max(2048).optional().nullable(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchCmsPostSchema = createCmsPostSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const patchSiteSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-_]+$/i).optional(),
  domain: z.string().max(253).optional().nullable(),
  description: z.string().max(2000).trim().optional().nullable(),
  logoUrl: z.string().url().max(2048).optional().nullable(),
  settings: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(d => Object.keys(d).length > 0, { message: "At least one field is required" });

const createSectionSchema = z.object({
  pageId: z.number().int().positive().optional().nullable(),
  sectionType: z.string().min(1).max(100).trim(),
  title: z.string().max(500).trim().optional().nullable(),
  content: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchSectionSchema = createSectionSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const createVentureSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-_]+$/i),
  tagline: z.string().max(500).trim().optional().nullable(),
  description: z.string().max(5000).trim().optional().nullable(),
  status: z.enum(["active", "stealth", "sunset", "acquired"]).optional(),
  logoUrl: z.string().url().max(2048).optional().nullable(),
  heroImageUrl: z.string().url().max(2048).optional().nullable(),
  externalUrl: z.string().url().max(2048).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchVentureSchema = createVentureSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const createCaseStudySchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1).max(500).trim(),
  slug: z.string().min(1).max(200).trim(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  client: z.string().max(200).trim().optional().nullable(),
  excerpt: z.string().max(1000).trim().optional().nullable(),
  content: z.string().max(100000).optional().nullable(),
  coverImageUrl: z.string().url().max(2048).optional().nullable(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchCaseStudySchema = createCaseStudySchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const createNavigationItemSchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  navGroup: z.string().max(100).trim().optional(),
  label: z.string().min(1).max(200).trim(),
  href: z.string().max(2048).trim(),
  icon: z.string().max(100).trim().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isExternal: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchNavigationItemSchema = createNavigationItemSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const createTestimonialSchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  author: z.string().min(1).max(200).trim(),
  role: z.string().max(200).trim().optional().nullable(),
  company: z.string().max(200).trim().optional().nullable(),
  content: z.string().min(1).max(5000).trim(),
  avatarUrl: z.string().url().max(2048).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchTestimonialSchema = createTestimonialSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const createFaqSchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  question: z.string().min(1).max(1000).trim(),
  answer: z.string().min(1).max(10000).trim(),
  category: z.string().max(100).trim().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchFaqSchema = createFaqSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const createCtaSchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  label: z.string().min(1).max(200).trim(),
  href: z.string().max(2048).trim(),
  variant: z.string().max(50).trim().optional(),
  icon: z.string().max(100).trim().optional().nullable(),
  isExternal: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchCtaSchema = createCtaSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const createRoadmapItemSchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1).max(500).trim(),
  description: z.string().max(2000).trim().optional().nullable(),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
  quarter: z.string().max(20).trim().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchRoadmapItemSchema = createRoadmapItemSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const createServiceItemSchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  name: z.string().min(1).max(200).trim(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-_]+$/i).optional(),
  tagline: z.string().max(500).trim().optional().nullable(),
  description: z.string().max(5000).trim().optional().nullable(),
  iconUrl: z.string().url().max(2048).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchServiceItemSchema = createServiceItemSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const createFeatureItemSchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional().nullable(),
  iconUrl: z.string().url().max(2048).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const createUseCaseSchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1).max(500).trim(),
  description: z.string().max(5000).trim().optional().nullable(),
  industry: z.string().max(100).trim().optional().nullable(),
  iconUrl: z.string().url().max(2048).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const createUpdateSchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1).max(500).trim(),
  slug: z.string().min(1).max(200).trim().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  content: z.string().max(100000).optional().nullable(),
  excerpt: z.string().max(1000).trim().optional().nullable(),
  coverImageUrl: z.string().url().max(2048).optional().nullable(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchUpdateSchema = createUpdateSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const createLeadStatusSchema = z.object({
  submissionId: z.number().int().positive().optional().nullable(),
  status: z.string().min(1).max(100).trim(),
  notes: z.string().max(2000).trim().optional().nullable(),
  assignedTo: z.string().max(200).trim().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

const patchLeadStatusSchema = createLeadStatusSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const siteSettingSchema = z.object({
  siteId: z.number().int().positive(),
  key: z.string().min(1).max(200).trim(),
  valueJson: z.unknown(),
});

const createMediaAssetSchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  fileName: z.string().min(1).max(255).trim(),
  fileUrl: z.string().url().max(2048),
  mimeType: z.string().min(1).max(100),
  altText: z.string().max(500).trim().optional().nullable(),
  size: z.number().int().positive().optional().nullable(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

const createDownloadSchema = z.object({
  siteId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1).max(500).trim(),
  description: z.string().max(2000).trim().optional().nullable(),
  fileUrl: z.string().url().max(2048),
  mimeType: z.string().max(100).trim().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const patchDownloadSchema = createDownloadSchema.partial().refine(
  d => Object.keys(d).length > 0,
  { message: "At least one field is required" }
);

const createRedirectSchema = z.object({
  fromPath: z.string().min(1).max(2048).trim(),
  toPath: z.string().min(1).max(2048).trim(),
  statusCode: z.number().int().refine(v => [301, 302, 307, 308].includes(v), { message: "statusCode must be 301, 302, 307, or 308" }).optional(),
  isActive: z.boolean().optional(),
});

const router: IRouter = Router();

// All CMS mutating operations require authentication and editor/admin role.
// GET/HEAD/OPTIONS requests may remain accessible without auth (public content reads).
// Contact form POST is explicitly public (public-facing contact form submission).
function requireCmsWrite(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const user = req.user as { roles?: string[] } | undefined;
  const roles = user?.roles ?? [];
  const canWrite = roles.some((r: string) => ["admin", "super_admin", "editor"].includes(r));
  if (!canWrite) {
    res.status(403).json({ error: "Insufficient permissions — editor or admin role required" });
    return;
  }
  next();
}

// ─── Sites ───────────────────────────────────────────────────────────────────

router.get("/cms/sites", async (req, res) => {
  try {
    const rows = await db.select().from(sitesTable).orderBy(asc(sitesTable.slug));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list sites"); }
});

router.get("/cms/sites/:slug", async (req, res) => {
  try {
    const [row] = await db.select().from(sitesTable).where(eq(sitesTable.slug, String(req.params.slug)));
    if (!row) { sendNotFound(res, "Site"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to get site"); }
});

router.patch("/cms/sites/:id", requireCmsWrite, validateBody(patchSiteSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(sitesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(sitesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Site"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update site"); }
});

// ─── Pages ───────────────────────────────────────────────────────────────────

router.get("/cms/pages", authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const siteSlug = req.query.site as string | undefined;
    const isEditor = req.user && (req.user.roles.includes("admin") || req.user.roles.includes("super_admin") || req.user.roles.includes("editor"));
    const conditions: ReturnType<typeof eq>[] = [];
    if (!isEditor) conditions.push(eq(pagesTable.status, "published"));
    if (siteSlug) {
      const [site] = await db.select({ id: sitesTable.id }).from(sitesTable).where(eq(sitesTable.slug, siteSlug));
      if (site) conditions.push(eq(pagesTable.siteId, site.id));
    }
    const rows = await db.select().from(pagesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(pagesTable.updatedAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(pagesTable)
      .where(conditions.length ? and(...conditions) : undefined);
    sendSuccess(res, { data: rows, meta: { page, limit, total: count } });
  } catch (err) { handleRouteError(res, err, "Failed to list pages"); }
});

router.get("/cms/pages/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const isEditor = req.user && (req.user.roles.includes("admin") || req.user.roles.includes("super_admin") || req.user.roles.includes("editor"));
    const [row] = await db.select().from(pagesTable).where(
      isEditor ? eq(pagesTable.id, id) : and(eq(pagesTable.id, id), eq(pagesTable.status, "published"))
    );
    if (!row) { sendNotFound(res, "Page"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to get page"); }
});

router.post("/cms/pages", requireCmsWrite, validateBody(createPageSchema), async (req, res) => {
  try {
    const [row] = await db.insert(pagesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create page"); }
});

router.patch("/cms/pages/:id", requireCmsWrite, validateBody(patchPageSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(pagesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(pagesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Page"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update page"); }
});

router.delete("/cms/pages/:id", validateBody(bodyShape({})), requireCmsWrite, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(pagesTable).where(eq(pagesTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete page"); }
});

// ─── Sections ────────────────────────────────────────────────────────────────

router.get("/cms/sections", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const pageId = req.query.page_id ? parseInt(req.query.page_id as string) : undefined;
    let query = db.select().from(sectionsTable).$dynamic();
    if (pageId) query = query.where(eq(sectionsTable.pageId, pageId));
    const rows = await query.orderBy(asc(sectionsTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list sections"); }
});

router.post("/cms/sections", requireCmsWrite, validateBody(createSectionSchema), async (req, res) => {
  try {
    const [row] = await db.insert(sectionsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create section"); }
});

router.patch("/cms/sections/:id", requireCmsWrite, validateBody(patchSectionSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(sectionsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(sectionsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Section"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update section"); }
});

router.delete("/cms/sections/:id", validateBody(bodyShape({})), requireCmsWrite, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(sectionsTable).where(eq(sectionsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete section"); }
});

// ─── Ventures ────────────────────────────────────────────────────────────────

router.get("/cms/ventures", async (req, res) => {
  try {
    const rows = await db.select().from(venturesTable).orderBy(asc(venturesTable.sortOrder), asc(venturesTable.name));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list ventures"); }
});

router.get("/cms/ventures/:slug", async (req, res) => {
  try {
    const [row] = await db.select().from(venturesTable).where(eq(venturesTable.slug, String(req.params.slug)));
    if (!row) { sendNotFound(res, "Venture"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to get venture"); }
});

router.post("/cms/ventures", requireCmsWrite, validateBody(createVentureSchema), async (req, res) => {
  try {
    const [row] = await db.insert(venturesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create venture"); }
});

router.patch("/cms/ventures/:id", requireCmsWrite, validateBody(patchVentureSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(venturesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(venturesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Venture"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update venture"); }
});

router.delete("/cms/ventures/:id", validateBody(bodyShape({})), requireCmsWrite, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(venturesTable).where(eq(venturesTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete venture"); }
});

// ─── Articles ────────────────────────────────────────────────────────────────

router.get("/cms/articles", authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const isEditor = req.user && (req.user.roles.includes("admin") || req.user.roles.includes("super_admin") || req.user.roles.includes("editor"));
    const statusParam = req.query.status as string | undefined;
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    const conditions = [];
    if (!isEditor) {
      conditions.push(eq(articlesTable.status, "published"));
    } else if (statusParam) {
      conditions.push(eq(articlesTable.status, statusParam as "draft" | "published"));
    }
    if (siteId) conditions.push(eq(articlesTable.siteId, siteId));
    const rows = await db.select().from(articlesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(articlesTable.publishedAt))
      .limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(articlesTable)
      .where(conditions.length ? and(...conditions) : undefined);
    sendSuccess(res, { data: rows, meta: { page, limit, total: count } });
  } catch (err) { handleRouteError(res, err, "Failed to list articles"); }
});

router.get("/cms/articles/:slug", authMiddleware({ required: false }), async (req, res) => {
  try {
    const isEditor = req.user && (req.user.roles.includes("admin") || req.user.roles.includes("super_admin") || req.user.roles.includes("editor"));
    const [row] = await db.select().from(articlesTable).where(
      isEditor ? eq(articlesTable.slug, String(req.params.slug)) : and(eq(articlesTable.slug, String(req.params.slug)), eq(articlesTable.status, "published"))
    );
    if (!row) { sendNotFound(res, "Article"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to get article"); }
});

router.post("/cms/articles", requireCmsWrite, validateBody(createArticleSchema), async (req, res) => {
  try {
    const [row] = await db.insert(articlesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create article"); }
});

router.patch("/cms/articles/:id", requireCmsWrite, validateBody(patchArticleSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(articlesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(articlesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Article"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update article"); }
});

router.delete("/cms/articles/:id", validateBody(bodyShape({})), requireCmsWrite, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(articlesTable).where(eq(articlesTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete article"); }
});

// ─── Case Studies ─────────────────────────────────────────────────────────────

router.get("/cms/case-studies", authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const isEditor = req.user && (req.user.roles.includes("admin") || req.user.roles.includes("super_admin") || req.user.roles.includes("editor"));
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    const conditions = [];
    if (!isEditor) conditions.push(eq(caseStudiesTable.status, "published"));
    if (siteId) conditions.push(eq(caseStudiesTable.siteId, siteId));
    const rows = await db.select().from(caseStudiesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(caseStudiesTable.publishedAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(caseStudiesTable)
      .where(conditions.length ? and(...conditions) : undefined);
    sendSuccess(res, { data: rows, meta: { page, limit, total: count } });
  } catch (err) { handleRouteError(res, err, "Failed to list case studies"); }
});

router.get("/cms/case-studies/:slug", authMiddleware({ required: false }), async (req, res) => {
  try {
    const isEditor = req.user && (req.user.roles.includes("admin") || req.user.roles.includes("super_admin") || req.user.roles.includes("editor"));
    const [row] = await db.select().from(caseStudiesTable).where(
      isEditor ? eq(caseStudiesTable.slug, String(req.params.slug)) : and(eq(caseStudiesTable.slug, String(req.params.slug)), eq(caseStudiesTable.status, "published"))
    );
    if (!row) { sendNotFound(res, "Case study"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to get case study"); }
});

router.post("/cms/case-studies", requireCmsWrite, validateBody(createCaseStudySchema), async (req, res) => {
  try {
    const [row] = await db.insert(caseStudiesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create case study"); }
});

router.patch("/cms/case-studies/:id", requireCmsWrite, validateBody(patchCaseStudySchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(caseStudiesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(caseStudiesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Case study"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update case study"); }
});

router.delete("/cms/case-studies/:id", validateBody(bodyShape({})), requireCmsWrite, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(caseStudiesTable).where(eq(caseStudiesTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete case study"); }
});

// ─── Navigation Items ─────────────────────────────────────────────────────────

router.get("/cms/navigation-items", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    const navGroup = req.query.nav_group as string | undefined;
    const conditions = [];
    if (siteId) conditions.push(eq(navigationItemsTable.siteId, siteId));
    if (navGroup) conditions.push(eq(navigationItemsTable.navGroup, navGroup));
    const rows = await db.select().from(navigationItemsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(navigationItemsTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list navigation items"); }
});

router.post("/cms/navigation-items", requireCmsWrite, validateBody(createNavigationItemSchema), async (req, res) => {
  try {
    const [row] = await db.insert(navigationItemsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create navigation item"); }
});

router.patch("/cms/navigation-items/:id", requireCmsWrite, validateBody(patchNavigationItemSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(navigationItemsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(navigationItemsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Navigation item"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update navigation item"); }
});

router.delete("/cms/navigation-items/:id", validateBody(bodyShape({})), requireCmsWrite, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(navigationItemsTable).where(eq(navigationItemsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete navigation item"); }
});

// ─── Testimonials ─────────────────────────────────────────────────────────────

router.get("/cms/testimonials", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(testimonialsTable).$dynamic();
    if (siteId) query = query.where(eq(testimonialsTable.siteId, siteId));
    const rows = await query.orderBy(asc(testimonialsTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list testimonials"); }
});

router.post("/cms/testimonials", requireCmsWrite, validateBody(createTestimonialSchema), async (req, res) => {
  try {
    const [row] = await db.insert(testimonialsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create testimonial"); }
});

router.patch("/cms/testimonials/:id", requireCmsWrite, validateBody(patchTestimonialSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(testimonialsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(testimonialsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Testimonial"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update testimonial"); }
});

router.delete("/cms/testimonials/:id", validateBody(bodyShape({})), requireCmsWrite, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete testimonial"); }
});

// ─── FAQs ─────────────────────────────────────────────────────────────────────

router.get("/cms/faqs", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(faqsTable).$dynamic();
    if (siteId) query = query.where(eq(faqsTable.siteId, siteId));
    const rows = await query.orderBy(asc(faqsTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list FAQs"); }
});

router.post("/cms/faqs", requireCmsWrite, validateBody(createFaqSchema), async (req, res) => {
  try {
    const [row] = await db.insert(faqsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create FAQ"); }
});

router.patch("/cms/faqs/:id", requireCmsWrite, validateBody(patchFaqSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(faqsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(faqsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "FAQ"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update FAQ"); }
});

router.delete("/cms/faqs/:id", validateBody(bodyShape({})), requireCmsWrite, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(faqsTable).where(eq(faqsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete FAQ"); }
});

// ─── CTAs ─────────────────────────────────────────────────────────────────────

router.get("/cms/ctas", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(ctasTable).$dynamic();
    if (siteId) query = query.where(eq(ctasTable.siteId, siteId));
    const rows = await query.orderBy(desc(ctasTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list CTAs"); }
});

router.post("/cms/ctas", requireCmsWrite, validateBody(createCtaSchema), async (req, res) => {
  try {
    const [row] = await db.insert(ctasTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create CTA"); }
});

router.patch("/cms/ctas/:id", requireCmsWrite, validateBody(patchCtaSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(ctasTable).set({ ...req.body, updatedAt: new Date() }).where(eq(ctasTable.id, id)).returning();
    if (!row) { sendNotFound(res, "CTA"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update CTA"); }
});

router.delete("/cms/ctas/:id", validateBody(bodyShape({})), requireCmsWrite, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(ctasTable).where(eq(ctasTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete CTA"); }
});

// ─── Roadmap Items ────────────────────────────────────────────────────────────

router.get("/cms/roadmap-items", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(roadmapItemsTable).$dynamic();
    if (siteId) query = query.where(eq(roadmapItemsTable.siteId, siteId));
    const rows = await query.orderBy(asc(roadmapItemsTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list roadmap items"); }
});

router.post("/cms/roadmap-items", requireCmsWrite, validateBody(createRoadmapItemSchema), async (req, res) => {
  try {
    const [row] = await db.insert(roadmapItemsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create roadmap item"); }
});

router.patch("/cms/roadmap-items/:id", requireCmsWrite, validateBody(patchRoadmapItemSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(roadmapItemsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(roadmapItemsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Roadmap item"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update roadmap item"); }
});

router.delete("/cms/roadmap-items/:id", validateBody(bodyShape({})), requireCmsWrite, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(roadmapItemsTable).where(eq(roadmapItemsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete roadmap item"); }
});

// ─── Services ─────────────────────────────────────────────────────────────────

router.get("/cms/services-items", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(servicesTable).$dynamic();
    if (siteId) query = query.where(eq(servicesTable.siteId, siteId));
    const rows = await query.orderBy(asc(servicesTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list services"); }
});

router.post("/cms/services-items", requireCmsWrite, validateBody(createServiceItemSchema), async (req, res) => {
  try {
    const [row] = await db.insert(servicesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create service"); }
});

router.patch("/cms/services-items/:id", requireCmsWrite, validateBody(patchServiceItemSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(servicesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(servicesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Service"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update service"); }
});

router.delete("/cms/services-items/:id", validateBody(bodyShape({})), requireCmsWrite, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(servicesTable).where(eq(servicesTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete service"); }
});

// ─── Features ─────────────────────────────────────────────────────────────────

router.get("/cms/features-items", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(featuresTable).$dynamic();
    if (siteId) query = query.where(eq(featuresTable.siteId, siteId));
    const rows = await query.orderBy(asc(featuresTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list features"); }
});

router.post("/cms/features-items", requireCmsWrite, validateBody(createFeatureItemSchema), async (req, res) => {
  try {
    const [row] = await db.insert(featuresTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create feature"); }
});

// ─── Use Cases ────────────────────────────────────────────────────────────────

router.get("/cms/use-cases", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(useCasesTable).$dynamic();
    if (siteId) query = query.where(eq(useCasesTable.siteId, siteId));
    const rows = await query.orderBy(asc(useCasesTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list use cases"); }
});

router.post("/cms/use-cases", requireCmsWrite, validateBody(createUseCaseSchema), async (req, res) => {
  try {
    const [row] = await db.insert(useCasesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create use case"); }
});

// ─── Updates ─────────────────────────────────────────────────────────────────

router.get("/cms/updates", authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const isEditor = req.user && (req.user.roles.includes("admin") || req.user.roles.includes("super_admin") || req.user.roles.includes("editor"));
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    const conditions = [];
    if (!isEditor) conditions.push(eq(updatesTable.status, "published"));
    if (siteId) conditions.push(eq(updatesTable.siteId, siteId));
    const rows = await db.select().from(updatesTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(updatesTable.publishedAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(updatesTable)
      .where(conditions.length ? and(...conditions) : undefined);
    sendSuccess(res, { data: rows, meta: { page, limit, total: count } });
  } catch (err) { handleRouteError(res, err, "Failed to list updates"); }
});

router.post("/cms/updates", requireCmsWrite, validateBody(createUpdateSchema), async (req, res) => {
  try {
    const [row] = await db.insert(updatesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create update"); }
});

router.patch("/cms/updates/:id", requireCmsWrite, validateBody(patchUpdateSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(updatesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(updatesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Update"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update update record"); }
});

// ─── Contact Submissions ──────────────────────────────────────────────────────

router.post("/cms/contact-submissions", validateBody(contactSubmissionSchema), async (req, res) => {
  try {
    const [row] = await db.insert(contactSubmissionsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to submit contact form"); }
});

router.get("/cms/contact-submissions", requireCmsWrite, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const formKey = req.query.form_key as string | undefined;
    let query = db.select().from(contactSubmissionsTable).$dynamic();
    if (formKey) query = query.where(eq(contactSubmissionsTable.formKey, formKey));
    const rows = await query.orderBy(desc(contactSubmissionsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(contactSubmissionsTable);
    sendSuccess(res, { data: rows, meta: { page, limit, total: count } });
  } catch (err) { handleRouteError(res, err, "Failed to list contact submissions"); }
});

// ─── Lead Status ──────────────────────────────────────────────────────────────

router.post("/cms/lead-status", requireCmsWrite, validateBody(createLeadStatusSchema), async (req, res) => {
  try {
    const [row] = await db.insert(leadStatusTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create lead status"); }
});

router.patch("/cms/lead-status/:id", requireCmsWrite, validateBody(patchLeadStatusSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(leadStatusTable).set({ ...req.body, updatedAt: new Date() }).where(eq(leadStatusTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Lead status"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update lead status"); }
});

// ─── Site Settings ────────────────────────────────────────────────────────────

router.get("/cms/site-settings", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(siteSettingsTable).$dynamic();
    if (siteId) query = query.where(eq(siteSettingsTable.siteId, siteId));
    const rows = await query.orderBy(asc(siteSettingsTable.key));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list site settings"); }
});

router.get("/cms/site-settings/:siteId", async (req, res) => {
  try {
    const siteId = parseIdParam(req.params.siteId);
    const rows = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.siteId, siteId));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to get site settings"); }
});

router.post("/cms/site-settings", requireCmsWrite, validateBody(siteSettingSchema), async (req, res) => {
    try {
      const { siteId, key, valueJson } = req.body;
      const [existing] = await db.select().from(siteSettingsTable)
        .where(and(eq(siteSettingsTable.siteId, siteId), eq(siteSettingsTable.key, key)));
      if (existing) {
        const [row] = await db.update(siteSettingsTable).set({ valueJson, updatedAt: new Date() })
          .where(eq(siteSettingsTable.id, existing.id)).returning();
        sendSuccess(res, row);
      } else {
        const [row] = await db.insert(siteSettingsTable).values({ siteId, key, valueJson }).returning();
        sendSuccess(res, row, 201);
      }
    } catch (err) { handleRouteError(res, err, "Failed to set site setting"); }
  });

  router.put("/cms/site-settings", requireCmsWrite, validateBody(siteSettingSchema), async (req, res) => {
  try {
    const { siteId, key, valueJson } = req.body;
    const [existing] = await db.select().from(siteSettingsTable)
      .where(and(eq(siteSettingsTable.siteId, siteId), eq(siteSettingsTable.key, key)));
    if (existing) {
      const [row] = await db.update(siteSettingsTable).set({ valueJson, updatedAt: new Date() })
        .where(eq(siteSettingsTable.id, existing.id)).returning();
      sendSuccess(res, row);
    } else {
      const [row] = await db.insert(siteSettingsTable).values({ siteId, key, valueJson }).returning();
      sendSuccess(res, row, 201);
    }
  } catch (err) { handleRouteError(res, err, "Failed to set site setting"); }
});

router.delete("/cms/site-settings/:id", validateBody(bodyShape({})), requireCmsWrite, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(siteSettingsTable).where(eq(siteSettingsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete site setting"); }
});

// ─── Media Assets ─────────────────────────────────────────────────────────────

router.get("/cms/media-assets", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(mediaAssetsTable).$dynamic();
    if (siteId) query = query.where(eq(mediaAssetsTable.siteId, siteId));
    const rows = await query.orderBy(desc(mediaAssetsTable.createdAt)).limit(200);
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list media assets"); }
});

router.post("/cms/media-assets", requireCmsWrite, validateBody(createMediaAssetSchema), async (req, res) => {
  try {
    const [row] = await db.insert(mediaAssetsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create media asset"); }
});

router.delete("/cms/media-assets/:id", validateBody(bodyShape({})), requireCmsWrite, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(mediaAssetsTable).where(eq(mediaAssetsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete media asset"); }
});

// ─── Downloads ────────────────────────────────────────────────────────────────

router.get("/cms/downloads", authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const isEditor = req.user && (req.user.roles.includes("admin") || req.user.roles.includes("super_admin") || req.user.roles.includes("editor"));
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    const conditions = [];
    if (!isEditor) conditions.push(eq(downloadsTable.status, "published"));
    if (siteId) conditions.push(eq(downloadsTable.siteId, siteId));
    const rows = await db.select().from(downloadsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(downloadsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list downloads"); }
});

router.post("/cms/downloads", requireCmsWrite, validateBody(createDownloadSchema), async (req, res) => {
  try {
    const [row] = await db.insert(downloadsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create download"); }
});

router.patch("/cms/downloads/:id", requireCmsWrite, validateBody(patchDownloadSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(downloadsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(downloadsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Download"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update download"); }
});

// ─── Redirects ────────────────────────────────────────────────────────────────

router.get("/cms/redirects", authMiddleware({ required: false }), async (req, res) => {
  try {
    const rows = await db.select().from(redirectsTable).orderBy(asc(redirectsTable.fromPath));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list redirects"); }
});

router.post("/cms/redirects", requireCmsWrite, validateBody(createRedirectSchema), async (req, res) => {
  try {
    const [row] = await db.insert(redirectsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create redirect"); }
});

router.delete("/cms/redirects/:id", validateBody(bodyShape({})), requireCmsWrite, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(redirectsTable).where(eq(redirectsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete redirect"); }
});

// ─── CMS Posts ────────────────────────────────────────────────────────────────

const VALID_CONTENT_TYPES = ["blog", "case-study", "investor-letter", "update"] as const;
type ContentType = typeof VALID_CONTENT_TYPES[number];

router.get("/cms/posts", authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const isEditor = req.user && (req.user.roles.includes("admin") || req.user.roles.includes("super_admin") || req.user.roles.includes("editor"));
    const statusParam = req.query.status as string | undefined;

    const rawContentType = req.query.content_type;
    const contentTypes: ContentType[] = (
      Array.isArray(rawContentType) ? rawContentType : rawContentType ? [rawContentType] : []
    ).filter((t): t is ContentType => VALID_CONTENT_TYPES.includes(t as ContentType));

    const conditions = [];
    if (!isEditor) {
      conditions.push(eq(cmsPostsTable.status, "published"));
    } else if (statusParam && (statusParam === "draft" || statusParam === "published")) {
      conditions.push(eq(cmsPostsTable.status, statusParam));
    }
    if (contentTypes.length === 1) {
      conditions.push(eq(cmsPostsTable.contentType, contentTypes[0]));
    } else if (contentTypes.length > 1) {
      conditions.push(inArray(cmsPostsTable.contentType, contentTypes));
    }

    const rows = await db.select().from(cmsPostsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(cmsPostsTable.publishedAt))
      .limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(cmsPostsTable)
      .where(conditions.length ? and(...conditions) : undefined);
    sendSuccess(res, { data: rows, meta: { page, limit, total: count } });
  } catch (err) { handleRouteError(res, err, "Failed to list CMS posts"); }
});

router.get("/cms/posts/:slug", authMiddleware({ required: false }), async (req, res) => {
  try {
    const isEditor = req.user && (req.user.roles.includes("admin") || req.user.roles.includes("super_admin") || req.user.roles.includes("editor"));
    const [row] = await db.select().from(cmsPostsTable).where(
      isEditor
        ? eq(cmsPostsTable.slug, String(req.params.slug))
        : and(eq(cmsPostsTable.slug, String(req.params.slug)), eq(cmsPostsTable.status, "published"))
    );
    if (!row) { sendNotFound(res, "Post"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to get CMS post"); }
});

router.post("/cms/posts", authMiddleware(), requireRole("admin", "editor"), validateBody(createCmsPostSchema), async (req, res) => {
  try {
    const [row] = await db.insert(cmsPostsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create CMS post"); }
});

router.put("/cms/posts/:id", authMiddleware(), requireRole("admin", "editor"), validateBody(createCmsPostSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const updateData = { ...req.body, updatedAt: new Date() };
    if (req.body.status === "published" && !req.body.publishedAt) {
      updateData.publishedAt = new Date();
    }
    const [row] = await db.update(cmsPostsTable).set(updateData).where(eq(cmsPostsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Post"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update CMS post"); }
});

router.patch("/cms/posts/:id", authMiddleware(), requireRole("admin", "editor"), validateBody(patchCmsPostSchema), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const updateData = { ...req.body, updatedAt: new Date() };
    if (req.body.status === "published" && !req.body.publishedAt) {
      updateData.publishedAt = new Date();
    }
    const [row] = await db.update(cmsPostsTable).set(updateData).where(eq(cmsPostsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Post"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update CMS post"); }
});

router.delete("/cms/posts/:id", validateBody(bodyShape({})), authMiddleware(), requireRole("admin", "editor"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(cmsPostsTable).where(eq(cmsPostsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete CMS post"); }
});

router.post("/cms/posts/upload-image", authMiddleware(), requireRole("admin", "editor"), imageUpload.single("image"), validateBody(bodyShape({
      "alt": z.unknown().optional(),
    })), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }
    const mime = req.file.mimetype;
    const ext = req.file.originalname.split(".").pop() ?? "bin";
    const key = `cms-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const result = await services.storage.upload(key, req.file.buffer, mime);
    const [asset] = await db.insert(mediaAssetsTable).values({
      fileName: req.file.originalname,
      fileUrl: result.url,
      mimeType: mime,
      altText: (req.body.alt as string | undefined) ?? req.file.originalname,
    }).returning();
    sendSuccess(res, { url: result.url, assetId: asset.id }, 201);
  } catch (err) { handleRouteError(res, err, "Failed to upload image"); }
});

export default router;
