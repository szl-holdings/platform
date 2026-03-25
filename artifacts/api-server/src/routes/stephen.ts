import { Router, type IRouter } from "express";
import { db, stephenSiteContactsTable, stephenSiteTestimonialsTable, stephenSiteCaseStudiesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/stephen/contacts", authMiddleware(), requireRole("operator"), async (_req, res) => {
  try {
    const contacts = await db.select().from(stephenSiteContactsTable).orderBy(desc(stephenSiteContactsTable.createdAt));
    sendSuccess(res, contacts);
  } catch (err) {
    handleRouteError(res, err, "Failed to list contacts");
  }
});

router.post("/stephen/contacts", authMiddleware(), async (req, res) => {
  try {
    const { name, email, company, message } = req.body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      sendBadRequest(res, "name is required and must be a non-empty string");
      return;
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      sendBadRequest(res, "A valid email is required");
      return;
    }
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      sendBadRequest(res, "message is required and must be a non-empty string");
      return;
    }
    const [contact] = await db.insert(stephenSiteContactsTable).values({
      name: name.trim(),
      email: email.trim(),
      company: company ?? null,
      message: message.trim(),
    }).returning();
    sendCreated(res, contact);
  } catch (err) {
    req.log?.error({ err }, "Failed to create contact");
    handleRouteError(res, err, "Failed to create contact");
  }
});

router.get("/stephen/testimonials", authMiddleware(), async (_req, res) => {
  try {
    const testimonials = await db.select().from(stephenSiteTestimonialsTable).orderBy(desc(stephenSiteTestimonialsTable.createdAt));
    sendSuccess(res, testimonials);
  } catch (err) {
    handleRouteError(res, err, "Failed to list testimonials");
  }
});

router.get("/stephen/case-studies", authMiddleware(), async (_req, res) => {
  try {
    const studies = await db.select().from(stephenSiteCaseStudiesTable).orderBy(desc(stephenSiteCaseStudiesTable.createdAt));
    sendSuccess(res, studies);
  } catch (err) {
    handleRouteError(res, err, "Failed to list case studies");
  }
});

router.get("/stephen/case-studies/:slug", authMiddleware(), async (req, res) => {
  try {
    const slug = req.params.slug as string;
    const [study] = await db.select().from(stephenSiteCaseStudiesTable).where(eq(stephenSiteCaseStudiesTable.slug, slug));
    if (!study) {
      sendNotFound(res, "Case study");
      return;
    }
    sendSuccess(res, study);
  } catch (err) {
    handleRouteError(res, err, "Failed to get case study");
  }
});

export default router;
