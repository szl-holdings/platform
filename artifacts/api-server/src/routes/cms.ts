import { Router, type IRouter } from "express";
import {
  db, sitesTable, pagesTable, sectionsTable, venturesTable, servicesTable,
  featuresTable, useCasesTable, roadmapItemsTable, updatesTable,
  testimonialsTable, faqsTable, ctasTable, articlesTable, caseStudiesTable,
  downloadsTable, navigationItemsTable, siteSettingsTable, mediaAssetsTable,
  formsTable, contactSubmissionsTable, leadStatusTable, redirectsTable,
} from "@workspace/db";
import { eq, desc, asc, sql, and } from "drizzle-orm";
import { sendSuccess, sendNotFound, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

// ─── Sites ───────────────────────────────────────────────────────────────────

router.get("/cms/sites", async (req, res) => {
  try {
    const rows = await db.select().from(sitesTable).orderBy(asc(sitesTable.slug));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list sites"); }
});

router.get("/cms/sites/:slug", async (req, res) => {
  try {
    const [row] = await db.select().from(sitesTable).where(eq(sitesTable.slug, req.params.slug));
    if (!row) { sendNotFound(res, "Site"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to get site"); }
});

router.patch("/cms/sites/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(sitesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(sitesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Site"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update site"); }
});

// ─── Pages ───────────────────────────────────────────────────────────────────

router.get("/cms/pages", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const siteSlug = req.query.site as string | undefined;
    let query = db.select().from(pagesTable).$dynamic();
    if (siteSlug) {
      const [site] = await db.select({ id: sitesTable.id }).from(sitesTable).where(eq(sitesTable.slug, siteSlug));
      if (site) query = query.where(eq(pagesTable.siteId, site.id));
    }
    const rows = await query.orderBy(desc(pagesTable.updatedAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(pagesTable);
    sendSuccess(res, { data: rows, meta: { page, limit, total: count } });
  } catch (err) { handleRouteError(res, err, "Failed to list pages"); }
});

router.get("/cms/pages/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(pagesTable).where(eq(pagesTable.id, id));
    if (!row) { sendNotFound(res, "Page"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to get page"); }
});

router.post("/cms/pages", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(pagesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create page"); }
});

router.patch("/cms/pages/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(pagesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(pagesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Page"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update page"); }
});

router.delete("/cms/pages/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(pagesTable).where(eq(pagesTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete page"); }
});

// ─── Sections ────────────────────────────────────────────────────────────────

router.get("/cms/sections", async (req, res) => {
  try {
    const pageId = req.query.page_id ? parseInt(req.query.page_id as string) : undefined;
    let query = db.select().from(sectionsTable).$dynamic();
    if (pageId) query = query.where(eq(sectionsTable.pageId, pageId));
    const rows = await query.orderBy(asc(sectionsTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list sections"); }
});

router.post("/cms/sections", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(sectionsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create section"); }
});

router.patch("/cms/sections/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(sectionsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(sectionsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Section"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update section"); }
});

router.delete("/cms/sections/:id", authMiddleware(), async (req, res) => {
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
    const [row] = await db.select().from(venturesTable).where(eq(venturesTable.slug, req.params.slug));
    if (!row) { sendNotFound(res, "Venture"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to get venture"); }
});

router.post("/cms/ventures", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(venturesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create venture"); }
});

router.patch("/cms/ventures/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(venturesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(venturesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Venture"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update venture"); }
});

router.delete("/cms/ventures/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(venturesTable).where(eq(venturesTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete venture"); }
});

// ─── Articles ────────────────────────────────────────────────────────────────

router.get("/cms/articles", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status as string | undefined;
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    const conditions = [];
    if (status) conditions.push(eq(articlesTable.status, status as "draft" | "published"));
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

router.get("/cms/articles/:slug", async (req, res) => {
  try {
    const [row] = await db.select().from(articlesTable).where(eq(articlesTable.slug, req.params.slug));
    if (!row) { sendNotFound(res, "Article"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to get article"); }
});

router.post("/cms/articles", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(articlesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create article"); }
});

router.patch("/cms/articles/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(articlesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(articlesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Article"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update article"); }
});

router.delete("/cms/articles/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(articlesTable).where(eq(articlesTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete article"); }
});

// ─── Case Studies ─────────────────────────────────────────────────────────────

router.get("/cms/case-studies", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(caseStudiesTable).$dynamic();
    if (siteId) query = query.where(eq(caseStudiesTable.siteId, siteId));
    const rows = await query.orderBy(desc(caseStudiesTable.publishedAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(caseStudiesTable);
    sendSuccess(res, { data: rows, meta: { page, limit, total: count } });
  } catch (err) { handleRouteError(res, err, "Failed to list case studies"); }
});

router.get("/cms/case-studies/:slug", async (req, res) => {
  try {
    const [row] = await db.select().from(caseStudiesTable).where(eq(caseStudiesTable.slug, req.params.slug));
    if (!row) { sendNotFound(res, "Case study"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to get case study"); }
});

router.post("/cms/case-studies", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(caseStudiesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create case study"); }
});

router.patch("/cms/case-studies/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(caseStudiesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(caseStudiesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Case study"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update case study"); }
});

router.delete("/cms/case-studies/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(caseStudiesTable).where(eq(caseStudiesTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete case study"); }
});

// ─── Navigation Items ─────────────────────────────────────────────────────────

router.get("/cms/navigation-items", async (req, res) => {
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

router.post("/cms/navigation-items", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(navigationItemsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create navigation item"); }
});

router.patch("/cms/navigation-items/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(navigationItemsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(navigationItemsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Navigation item"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update navigation item"); }
});

router.delete("/cms/navigation-items/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(navigationItemsTable).where(eq(navigationItemsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete navigation item"); }
});

// ─── Testimonials ─────────────────────────────────────────────────────────────

router.get("/cms/testimonials", async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(testimonialsTable).$dynamic();
    if (siteId) query = query.where(eq(testimonialsTable.siteId, siteId));
    const rows = await query.orderBy(asc(testimonialsTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list testimonials"); }
});

router.post("/cms/testimonials", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(testimonialsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create testimonial"); }
});

router.patch("/cms/testimonials/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(testimonialsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(testimonialsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Testimonial"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update testimonial"); }
});

router.delete("/cms/testimonials/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete testimonial"); }
});

// ─── FAQs ─────────────────────────────────────────────────────────────────────

router.get("/cms/faqs", async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(faqsTable).$dynamic();
    if (siteId) query = query.where(eq(faqsTable.siteId, siteId));
    const rows = await query.orderBy(asc(faqsTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list FAQs"); }
});

router.post("/cms/faqs", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(faqsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create FAQ"); }
});

router.patch("/cms/faqs/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(faqsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(faqsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "FAQ"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update FAQ"); }
});

router.delete("/cms/faqs/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(faqsTable).where(eq(faqsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete FAQ"); }
});

// ─── CTAs ─────────────────────────────────────────────────────────────────────

router.get("/cms/ctas", async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(ctasTable).$dynamic();
    if (siteId) query = query.where(eq(ctasTable.siteId, siteId));
    const rows = await query.orderBy(desc(ctasTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list CTAs"); }
});

router.post("/cms/ctas", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(ctasTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create CTA"); }
});

router.patch("/cms/ctas/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(ctasTable).set({ ...req.body, updatedAt: new Date() }).where(eq(ctasTable.id, id)).returning();
    if (!row) { sendNotFound(res, "CTA"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update CTA"); }
});

router.delete("/cms/ctas/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(ctasTable).where(eq(ctasTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete CTA"); }
});

// ─── Roadmap Items ────────────────────────────────────────────────────────────

router.get("/cms/roadmap-items", async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(roadmapItemsTable).$dynamic();
    if (siteId) query = query.where(eq(roadmapItemsTable.siteId, siteId));
    const rows = await query.orderBy(asc(roadmapItemsTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list roadmap items"); }
});

router.post("/cms/roadmap-items", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(roadmapItemsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create roadmap item"); }
});

router.patch("/cms/roadmap-items/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(roadmapItemsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(roadmapItemsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Roadmap item"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update roadmap item"); }
});

router.delete("/cms/roadmap-items/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(roadmapItemsTable).where(eq(roadmapItemsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete roadmap item"); }
});

// ─── Services ─────────────────────────────────────────────────────────────────

router.get("/cms/services-items", async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(servicesTable).$dynamic();
    if (siteId) query = query.where(eq(servicesTable.siteId, siteId));
    const rows = await query.orderBy(asc(servicesTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list services"); }
});

router.post("/cms/services-items", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(servicesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create service"); }
});

router.patch("/cms/services-items/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(servicesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(servicesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Service"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update service"); }
});

// ─── Features ─────────────────────────────────────────────────────────────────

router.get("/cms/features-items", async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(featuresTable).$dynamic();
    if (siteId) query = query.where(eq(featuresTable.siteId, siteId));
    const rows = await query.orderBy(asc(featuresTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list features"); }
});

router.post("/cms/features-items", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(featuresTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create feature"); }
});

// ─── Use Cases ────────────────────────────────────────────────────────────────

router.get("/cms/use-cases", async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(useCasesTable).$dynamic();
    if (siteId) query = query.where(eq(useCasesTable.siteId, siteId));
    const rows = await query.orderBy(asc(useCasesTable.sortOrder));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list use cases"); }
});

router.post("/cms/use-cases", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(useCasesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create use case"); }
});

// ─── Updates ─────────────────────────────────────────────────────────────────

router.get("/cms/updates", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(updatesTable).$dynamic();
    if (siteId) query = query.where(eq(updatesTable.siteId, siteId));
    const rows = await query.orderBy(desc(updatesTable.publishedAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(updatesTable);
    sendSuccess(res, { data: rows, meta: { page, limit, total: count } });
  } catch (err) { handleRouteError(res, err, "Failed to list updates"); }
});

router.post("/cms/updates", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(updatesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create update"); }
});

router.patch("/cms/updates/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(updatesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(updatesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Update"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update update record"); }
});

// ─── Contact Submissions ──────────────────────────────────────────────────────

router.post("/cms/contact-submissions", async (req, res) => {
  try {
    const [row] = await db.insert(contactSubmissionsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to submit contact form"); }
});

router.get("/cms/contact-submissions", authMiddleware(), async (req, res) => {
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

router.post("/cms/lead-status", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(leadStatusTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create lead status"); }
});

router.patch("/cms/lead-status/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(leadStatusTable).set({ ...req.body, updatedAt: new Date() }).where(eq(leadStatusTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Lead status"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update lead status"); }
});

// ─── Site Settings ────────────────────────────────────────────────────────────

router.get("/cms/site-settings/:siteId", async (req, res) => {
  try {
    const siteId = parseIdParam(req.params.siteId);
    const rows = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.siteId, siteId));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to get site settings"); }
});

router.put("/cms/site-settings", authMiddleware(), async (req, res) => {
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

// ─── Media Assets ─────────────────────────────────────────────────────────────

router.get("/cms/media-assets", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(mediaAssetsTable).$dynamic();
    if (siteId) query = query.where(eq(mediaAssetsTable.siteId, siteId));
    const rows = await query.orderBy(desc(mediaAssetsTable.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(mediaAssetsTable);
    sendSuccess(res, { data: rows, meta: { page, limit, total: count } });
  } catch (err) { handleRouteError(res, err, "Failed to list media assets"); }
});

router.post("/cms/media-assets", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(mediaAssetsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create media asset"); }
});

router.delete("/cms/media-assets/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(mediaAssetsTable).where(eq(mediaAssetsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete media asset"); }
});

// ─── Downloads ────────────────────────────────────────────────────────────────

router.get("/cms/downloads", async (req, res) => {
  try {
    const siteId = req.query.site_id ? parseInt(req.query.site_id as string) : undefined;
    let query = db.select().from(downloadsTable).$dynamic();
    if (siteId) query = query.where(eq(downloadsTable.siteId, siteId));
    const rows = await query.orderBy(desc(downloadsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list downloads"); }
});

router.post("/cms/downloads", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(downloadsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create download"); }
});

router.patch("/cms/downloads/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(downloadsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(downloadsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Download"); return; }
    sendSuccess(res, row);
  } catch (err) { handleRouteError(res, err, "Failed to update download"); }
});

// ─── Redirects ────────────────────────────────────────────────────────────────

router.get("/cms/redirects", authMiddleware(), async (req, res) => {
  try {
    const rows = await db.select().from(redirectsTable).orderBy(asc(redirectsTable.fromPath));
    sendSuccess(res, rows);
  } catch (err) { handleRouteError(res, err, "Failed to list redirects"); }
});

router.post("/cms/redirects", authMiddleware(), async (req, res) => {
  try {
    const [row] = await db.insert(redirectsTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) { handleRouteError(res, err, "Failed to create redirect"); }
});

router.delete("/cms/redirects/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db.delete(redirectsTable).where(eq(redirectsTable.id, id));
    sendSuccess(res, { deleted: true });
  } catch (err) { handleRouteError(res, err, "Failed to delete redirect"); }
});

export default router;
