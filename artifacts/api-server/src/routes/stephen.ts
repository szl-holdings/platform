import { Router, type IRouter } from "express";
import {
  db,
  stephenSiteContactsTable,
  stephenSiteTestimonialsTable,
  stephenSiteCaseStudiesTable,
  stephenContentBlocksTable,
  stephenCaseStudiesTable,
  stephenBookingRequestsTable,
} from "@workspace/db";
import { z } from "zod";
import { eq, desc, asc } from "drizzle-orm";

const CONTENT_BLOCK_TYPES = ["achievement", "about", "service", "stat", "skill"] as const;
const BOOKING_TYPES = ["consultation", "project", "recruitment", "partnership", "investment", "speaking", "other"] as const;

const ListStephenContentBlocksQueryParams = z.object({ type: z.enum(CONTENT_BLOCK_TYPES).optional() });
const CreateStephenContentBlockBody = z.object({
  type: z.enum(CONTENT_BLOCK_TYPES),
  title: z.string().default(""),
  content: z.string(),
  icon: z.string().optional(),
  date: z.string().optional(),
  sortOrder: z.number().optional(),
  featured: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});
const UpdateStephenContentBlockParams = z.object({ id: z.coerce.number() });
const UpdateStephenContentBlockBody = CreateStephenContentBlockBody.partial();
const DeleteStephenContentBlockParams = z.object({ id: z.coerce.number() });
const CreateStephenPortfolioCaseStudyBody = z.object({
  title: z.string(),
  slug: z.string(),
  summary: z.string().default(""),
  content: z.string().default(""),
  coverImageUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  client: z.string().optional(),
  duration: z.string().optional(),
  outcome: z.string().optional(),
});
const GetStephenPortfolioCaseStudyParams = z.object({ slug: z.string() });
const UpdateStephenPortfolioCaseStudyParams = z.object({ slug: z.string() });
const UpdateStephenPortfolioCaseStudyBody = CreateStephenPortfolioCaseStudyBody.partial();
const DeleteStephenPortfolioCaseStudyParams = z.object({ slug: z.string() });
const CreateStephenBookingRequestBody = z.object({
  name: z.string(),
  email: z.string().email(),
  company: z.string().optional(),
  role: z.string().optional(),
  type: z.enum(BOOKING_TYPES),
  serviceInterest: z.string().optional(),
  message: z.string(),
  preferredDate: z.string().optional(),
  budget: z.string().optional(),
});
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { logger } from "../lib/logger";
import {
  sendEmail,
  buildStephenContactAckEmail,
  buildStephenContactNotificationEmail,
  STEPHEN_ADMIN_EMAIL,
} from "../lib/email";

const router: IRouter = Router();

router.get("/stephen/contacts", authMiddleware(), requireRole("ops"), async (_req, res) => {
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

router.get("/stephen/profile", async (_req, res) => {
  res.json({
    name: "Stephen Lutar",
    title: "Founder & CEO, SZL Holdings",
    tagline: "I build the systems that power enterprises. From fintech platforms processing millions in transactions to maritime intelligence tracking global fleets — I architect, ship, and scale technology that moves industries forward.",
    bio: "Over the past 15 years, I've operated at the intersection of enterprise technology, defense systems, and financial infrastructure — building platforms that handle real complexity at real scale.\n\nMy career started in the trenches of enterprise IT, architecting mission-critical systems for federal defense contractors where failure wasn't a slide in a post-mortem — it was a national security concern. From there I moved into fintech, leading engineering teams that built payment processing infrastructure handling millions of daily transactions across global markets.\n\nIn 2022, I founded SZL Holdings to bring everything I'd learned into a single, vertically integrated technology company. Today, SZL operates six live products spanning maritime intelligence, cybersecurity simulation, creative production, and enterprise commerce — each built from the ground up, each solving problems I encountered firsthand.\n\nI don't advise from the sidelines. I build, I ship, and I operate. Every system in the SZL portfolio runs in production, serves real users, and generates real outcomes.",
    avatarUrl: null,
    email: "stephen@szlholdings.com",
    location: "Washington, D.C. Metro",
    linkedinUrl: "https://linkedin.com/in/stephenlutar",
    githubUrl: "https://github.com/stephenlutar",
    websiteUrl: "https://stephenlutar.com",
  });
});

router.get("/stephen/content-blocks", async (req, res) => {
  try {
    const query = ListStephenContentBlocksQueryParams.parse(req.query);
    if (query.type) {
      const blocks = await db
        .select()
        .from(stephenContentBlocksTable)
        .where(eq(stephenContentBlocksTable.type, query.type))
        .orderBy(asc(stephenContentBlocksTable.sortOrder));
      res.json(blocks.map(serializeContentBlock));
    } else {
      const blocks = await db
        .select()
        .from(stephenContentBlocksTable)
        .orderBy(asc(stephenContentBlocksTable.sortOrder));
      res.json(blocks.map(serializeContentBlock));
    }
  } catch (err) {
    handleError(err, req, res, "Failed to list content blocks");
  }
});

router.post("/stephen/content-blocks", async (req, res) => {
  try {
    const body = CreateStephenContentBlockBody.parse(req.body);
    const [block] = await db
      .insert(stephenContentBlocksTable)
      .values({
        type: body.type,
        title: body.title,
        content: body.content,
        icon: body.icon ?? null,
        date: body.date ?? null,
        sortOrder: body.sortOrder ?? 0,
        featured: body.featured ?? false,
        metadata: body.metadata ?? null,
      })
      .returning();
    res.status(201).json(serializeContentBlock(block));
  } catch (err) {
    handleError(err, req, res, "Failed to create content block");
  }
});

router.patch("/stephen/content-blocks/:id", async (req, res) => {
  try {
    const { id } = UpdateStephenContentBlockParams.parse({ id: req.params.id });
    const body = UpdateStephenContentBlockBody.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.featured !== undefined) updateData.featured = body.featured;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    const [updated] = await db
      .update(stephenContentBlocksTable)
      .set(updateData)
      .where(eq(stephenContentBlocksTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Content block not found" });
      return;
    }
    res.json(serializeContentBlock(updated));
  } catch (err) {
    handleError(err, req, res, "Failed to update content block");
  }
});

router.delete("/stephen/content-blocks/:id", async (req, res) => {
  try {
    const { id } = DeleteStephenContentBlockParams.parse({ id: req.params.id });
    const [deleted] = await db
      .delete(stephenContentBlocksTable)
      .where(eq(stephenContentBlocksTable.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Content block not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    handleError(err, req, res, "Failed to delete content block");
  }
});

router.get("/stephen/portfolio-case-studies", async (_req, res) => {
  try {
    const studies = await db
      .select()
      .from(stephenCaseStudiesTable)
      .orderBy(desc(stephenCaseStudiesTable.createdAt));
    res.json(studies.map(serializeCaseStudy));
  } catch (err) {
    res.status(500).json({ error: "Failed to list portfolio case studies" });
  }
});

router.post("/stephen/portfolio-case-studies", async (req, res) => {
  try {
    const body = CreateStephenPortfolioCaseStudyBody.parse(req.body);
    const [study] = await db
      .insert(stephenCaseStudiesTable)
      .values({
        title: body.title,
        slug: body.slug,
        summary: body.summary,
        content: body.content,
        coverImageUrl: body.coverImageUrl ?? null,
        tags: body.tags ?? [],
        featured: body.featured ?? false,
        client: body.client ?? null,
        duration: body.duration ?? null,
        outcome: body.outcome ?? null,
      })
      .returning();
    res.status(201).json(serializeCaseStudy(study));
  } catch (err) {
    handleError(err, req, res, "Failed to create portfolio case study");
  }
});

router.get("/stephen/portfolio-case-studies/:slug", async (req, res) => {
  try {
    const { slug } = GetStephenPortfolioCaseStudyParams.parse({ slug: req.params.slug });
    const [study] = await db
      .select()
      .from(stephenCaseStudiesTable)
      .where(eq(stephenCaseStudiesTable.slug, slug));
    if (!study) {
      res.status(404).json({ error: "Portfolio case study not found" });
      return;
    }
    res.json(serializeCaseStudy(study));
  } catch (err) {
    handleError(err, req, res, "Failed to get portfolio case study");
  }
});

router.patch("/stephen/portfolio-case-studies/:slug", async (req, res) => {
  try {
    const { slug } = UpdateStephenPortfolioCaseStudyParams.parse({ slug: req.params.slug });
    const body = UpdateStephenPortfolioCaseStudyBody.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.coverImageUrl !== undefined) updateData.coverImageUrl = body.coverImageUrl;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.featured !== undefined) updateData.featured = body.featured;
    if (body.client !== undefined) updateData.client = body.client;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.outcome !== undefined) updateData.outcome = body.outcome;

    const [updated] = await db
      .update(stephenCaseStudiesTable)
      .set(updateData)
      .where(eq(stephenCaseStudiesTable.slug, slug))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Portfolio case study not found" });
      return;
    }
    res.json(serializeCaseStudy(updated));
  } catch (err) {
    handleError(err, req, res, "Failed to update portfolio case study");
  }
});

router.delete("/stephen/portfolio-case-studies/:slug", async (req, res) => {
  try {
    const { slug } = DeleteStephenPortfolioCaseStudyParams.parse({ slug: req.params.slug });
    const [deleted] = await db
      .delete(stephenCaseStudiesTable)
      .where(eq(stephenCaseStudiesTable.slug, slug))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Portfolio case study not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    handleError(err, req, res, "Failed to delete portfolio case study");
  }
});

router.get("/stephen/booking-requests", async (_req, res) => {
  try {
    const requests = await db
      .select()
      .from(stephenBookingRequestsTable)
      .orderBy(desc(stephenBookingRequestsTable.createdAt));
    res.json(requests.map(serializeBookingRequest));
  } catch (err) {
    res.status(500).json({ error: "Failed to list booking requests" });
  }
});

router.post("/stephen/booking-requests", async (req, res) => {
  try {
    const body = CreateStephenBookingRequestBody.parse(req.body);
    const [request] = await db
      .insert(stephenBookingRequestsTable)
      .values({
        name: body.name,
        email: body.email,
        company: body.company ?? null,
        role: body.role ?? null,
        type: body.type,
        message: body.message,
        preferredDate: body.preferredDate ?? null,
        status: "pending",
      })
      .returning();

    Promise.allSettled([
      sendEmail({
        to: body.email,
        subject: "Message received — Stephen Lutar",
        html: buildStephenContactAckEmail(body.name, body.type),
        replyTo: STEPHEN_ADMIN_EMAIL,
      }),
      sendEmail({
        to: STEPHEN_ADMIN_EMAIL,
        subject: `New ${body.type} inquiry from ${body.name}`,
        html: buildStephenContactNotificationEmail({
          name: body.name,
          email: body.email,
          company: body.company,
          type: body.type,
          message: body.message,
        }),
        replyTo: body.email,
      }),
    ]).then((results) => {
      for (const r of results) {
        if (r.status === "rejected") {
          logger.warn({ err: r.reason }, "[email] Stephen booking email dispatch threw");
        } else if (!r.value.success) {
          logger.warn({ error: r.value.error }, "[email] Stephen booking email delivery failed");
        }
      }
    }).catch((err) => {
      logger.warn({ err }, "[email] Stephen booking email fanout error");
    });

    res.status(201).json(serializeBookingRequest(request));
  } catch (err) {
    handleError(err, req, res, "Failed to create booking request");
  }
});

const PLATFORM_HEALTH_URLS: Record<string, string> = {
  "szl-holdings": `http://localhost:${process.env.SZL_PORT || 80}/szl-holdings/`,
  "alloy": `http://localhost:${process.env.ALLOY_PORT || 25500}/alloy/`,
  "lyte": `http://localhost:${process.env.LYTE_PORT || 25501}/lyte-command-center/`,
  "vessels": `http://localhost:${process.env.VESSELS_PORT || 25502}/vessels/`,
  "aegis": `http://localhost:${process.env.AEGIS_PORT || 25503}/firestorm/`,
  "terra": `http://localhost:${process.env.TERRA_PORT || 25504}/terra/`,
  "carlota-jo": `http://localhost:${process.env.CARLOTA_PORT || 25505}/carlota-jo/`,
};

async function probeHealth(url: string): Promise<"operational" | "degraded"> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal, method: "HEAD" });
    clearTimeout(timeout);
    return res.status < 500 ? "operational" : "degraded";
  } catch {
    return "degraded";
  }
}

router.get("/stephen/ecosystem-status", async (_req, res) => {
  const now = new Date().toISOString();

  const platformDefs = [
    { name: "SZL Holdings", slug: "szl-holdings", description: "Parent Company" },
    { name: "Alloy", slug: "alloy", description: "Execution Fabric" },
    { name: "Lyte", slug: "lyte", description: "Business Observability" },
    { name: "Vessels", slug: "vessels", description: "Maritime Intelligence" },
    { name: "Aegis", slug: "aegis", description: "Defense & Intelligence" },
    { name: "Terra", slug: "terra", description: "Real Estate Intelligence" },
    { name: "Carlota Jo", slug: "carlota-jo", description: "Private Advisory" },
  ];

  const healthResults = await Promise.allSettled(
    platformDefs.map(async (p) => {
      const url = PLATFORM_HEALTH_URLS[p.slug];
      const status = url ? await probeHealth(url) : "operational";
      return { ...p, status, lastChecked: now };
    })
  );

  const apps = healthResults.map((result, i) =>
    result.status === "fulfilled"
      ? result.value
      : { ...platformDefs[i], status: "degraded" as const, lastChecked: now }
  );

  const connectors = [
    { name: "GitHub", slug: "github", status: "connected", lastChecked: now },
    { name: "Stripe", slug: "stripe", status: "connected", lastChecked: now },
    { name: "Google Calendar", slug: "gcal", status: "connected", lastChecked: now },
    { name: "Dropbox", slug: "dropbox", status: "connected", lastChecked: now },
    { name: "AWS", slug: "aws", status: "connected", lastChecked: now },
  ];
  res.json({ apps, connectors, lastChecked: now });
});

function handleError(err: unknown, req: any, res: any, label: string) {
  if (err && typeof err === "object" && "issues" in err && Array.isArray((err as any).issues)) {
    res.status(400).json({ error: "Validation failed", details: (err as any).issues });
    return;
  }
  req.log?.error({ err }, label);
  res.status(500).json({ error: label });
}

function serializeContentBlock(b: typeof stephenContentBlocksTable.$inferSelect) {
  return {
    id: b.id,
    type: b.type,
    title: b.title,
    content: b.content,
    icon: b.icon,
    date: b.date,
    sortOrder: b.sortOrder,
    featured: b.featured,
    metadata: b.metadata,
    createdAt: b.createdAt.toISOString(),
  };
}

function serializeCaseStudy(s: typeof stephenCaseStudiesTable.$inferSelect) {
  return {
    id: s.id,
    title: s.title,
    slug: s.slug,
    summary: s.summary,
    content: s.content,
    coverImageUrl: s.coverImageUrl,
    tags: s.tags,
    featured: s.featured,
    client: s.client,
    duration: s.duration,
    outcome: s.outcome,
    createdAt: s.createdAt.toISOString(),
  };
}

function serializeBookingRequest(r: typeof stephenBookingRequestsTable.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    company: r.company,
    role: r.role,
    type: r.type,
    message: r.message,
    preferredDate: r.preferredDate,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}

export default router;
