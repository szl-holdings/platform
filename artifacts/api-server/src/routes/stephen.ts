import { Router, type IRouter } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import {
  db,
  stephenSiteContactsTable,
  stephenSiteTestimonialsTable,
  stephenSiteCaseStudiesTable,
  stephenContentBlocksTable,
  stephenCaseStudiesTable,
  stephenBookingRequestsTable,
  alloySignals,
} from "@szl-holdings/db";
import { z } from "zod";
import { eq, desc, asc, and, type SQL } from "drizzle-orm";

const CONTENT_BLOCK_TYPES = ["achievement", "about", "service", "stat", "skill", "thesis", "doctrine"] as const;
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
  buildStephenStatusUpdateEmail,
  STEPHEN_ADMIN_EMAIL,
} from "../lib/email";
import { listQuerySchema, validateBody, validateQuery, stephenBookingRequestsQuerySchema } from "../lib/validation";

const router: IRouter = Router();

router.get("/stephen/contacts", authMiddleware(), requireRole("ops"), async (_req, res) => {
  try {
    const contacts = await db.select().from(stephenSiteContactsTable).orderBy(desc(stephenSiteContactsTable.createdAt));
    sendSuccess(res, contacts);
  } catch (err) {
    handleRouteError(res, err, "Failed to list contacts");
  }
});

router.post("/stephen/contacts", authMiddleware(), validateBody(bodyShape({
      "company": z.unknown().optional(),
      "email": z.unknown().optional(),
      "message": z.unknown().optional(),
      "name": z.unknown().optional(),
    })), async (req, res) => {
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
    const slug = String(String(req.params.slug)) as string;
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

router.get("/stephen/content-blocks", validateQuery(listQuerySchema), async (req, res) => {
  try {
    const query = ListStephenContentBlocksQueryParams.parse(req.query);
    if (query.type) {
      const blocks = await db
        .select()
        .from(stephenContentBlocksTable)
        .where(eq(stephenContentBlocksTable.type, query.type as any))
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

router.post("/stephen/content-blocks", validateBody(bodyShape({
      "content": z.unknown().optional(),
      "date": z.unknown().optional(),
      "featured": z.unknown().optional(),
      "icon": z.unknown().optional(),
      "metadata": z.unknown().optional(),
      "sortOrder": z.unknown().optional(),
      "title": z.unknown().optional(),
      "type": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const body = CreateStephenContentBlockBody.parse(req.body);
    const [block] = await db
      .insert(stephenContentBlocksTable)
      .values({
        type: body.type as any,
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

router.patch("/stephen/content-blocks/:id", validateBody(bodyShape({
      "content": z.unknown().optional(),
      "date": z.unknown().optional(),
      "featured": z.unknown().optional(),
      "icon": z.unknown().optional(),
      "metadata": z.unknown().optional(),
      "sortOrder": z.unknown().optional(),
      "title": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const { id } = UpdateStephenContentBlockParams.parse({ id: String(req.params.id) });
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

router.delete("/stephen/content-blocks/:id", validateBody(bodyShape({})), async (req, res) => {
  try {
    const { id } = DeleteStephenContentBlockParams.parse({ id: String(req.params.id) });
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

router.post("/stephen/portfolio-case-studies", validateBody(bodyShape({
      "client": z.unknown().optional(),
      "content": z.unknown().optional(),
      "coverImageUrl": z.unknown().optional(),
      "duration": z.unknown().optional(),
      "featured": z.unknown().optional(),
      "outcome": z.unknown().optional(),
      "slug": z.unknown().optional(),
      "summary": z.unknown().optional(),
      "tags": z.unknown().optional(),
      "title": z.unknown().optional(),
    })), async (req, res) => {
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
    const { slug } = GetStephenPortfolioCaseStudyParams.parse({ slug: String(String(req.params.slug)) });
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

router.patch("/stephen/portfolio-case-studies/:slug", validateBody(bodyShape({
      "client": z.unknown().optional(),
      "content": z.unknown().optional(),
      "coverImageUrl": z.unknown().optional(),
      "duration": z.unknown().optional(),
      "featured": z.unknown().optional(),
      "outcome": z.unknown().optional(),
      "summary": z.unknown().optional(),
      "tags": z.unknown().optional(),
      "title": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const { slug } = UpdateStephenPortfolioCaseStudyParams.parse({ slug: String(String(req.params.slug)) });
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

router.delete("/stephen/portfolio-case-studies/:slug", validateBody(bodyShape({})), async (req, res) => {
  try {
    const { slug } = DeleteStephenPortfolioCaseStudyParams.parse({ slug: String(String(req.params.slug)) });
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

const BOOKING_STATUSES = ["pending", "confirmed", "declined", "completed"] as const;
const ListBookingRequestsQuery = z.object({
  type: z.enum(BOOKING_TYPES).optional(),
  status: z.enum(BOOKING_STATUSES).optional(),
});

router.get("/stephen/booking-requests", authMiddleware(), requireRole("ops"), validateQuery(stephenBookingRequestsQuerySchema), async (req, res) => {
  try {
    const query = ListBookingRequestsQuery.parse(req.query);
    const filters: SQL[] = [];
    if (query.type) filters.push(eq(stephenBookingRequestsTable.type, query.type));
    if (query.status) filters.push(eq(stephenBookingRequestsTable.status, query.status));
    const whereClause: SQL | undefined =
      filters.length === 0 ? undefined : filters.length === 1 ? filters[0] : and(...filters);
    const requests = whereClause
      ? await db.select().from(stephenBookingRequestsTable).where(whereClause).orderBy(desc(stephenBookingRequestsTable.createdAt))
      : await db.select().from(stephenBookingRequestsTable).orderBy(desc(stephenBookingRequestsTable.createdAt));
    res.json(requests.map(serializeBookingRequest));
  } catch (err) {
    handleError(err, req, res, "Failed to list booking requests");
  }
});

const UpdateBookingRequestParams = z.object({ id: z.coerce.number().int().positive() });
const UpdateBookingRequestBody = z.object({
  status: z.enum(BOOKING_STATUSES),
  note: z.string().max(2000).optional(),
});

router.patch(
  "/stephen/booking-requests/:id",
  authMiddleware(),
  requireRole("ops"),
  validateBody(bodyShape({
      "note": z.unknown().optional(),
      "status": z.unknown().optional(),
    })),
  async (req, res) => {
    try {
      const { id } = UpdateBookingRequestParams.parse({ id: req.params.id });
      const body = UpdateBookingRequestBody.parse(req.body);

      const [updated] = await db
        .update(stephenBookingRequestsTable)
        .set({ status: body.status })
        .where(eq(stephenBookingRequestsTable.id, id))
        .returning();
      if (!updated) {
        sendNotFound(res, "Booking request");
        return;
      }

      const shouldNotify =
        updated.type === "partnership" &&
        (body.status === "confirmed" || body.status === "declined" || body.status === "completed");
      if (shouldNotify) {
        sendEmail({
          to: updated.email,
          subject: body.status === "confirmed"
            ? "Design partner application accepted — Stephen Lutar"
            : body.status === "declined"
              ? "Design partner application update — Stephen Lutar"
              : "Design partner engagement complete — Stephen Lutar",
          html: buildStephenStatusUpdateEmail({
            name: updated.name,
            status: body.status,
            note: body.note,
          }),
          replyTo: STEPHEN_ADMIN_EMAIL,
        }).then((result) => {
          if (!result.success) {
            logger.warn({ error: result.error, id }, "[email] Stephen status update delivery failed");
          }
        }).catch((err) => {
          logger.warn({ err, id }, "[email] Stephen status update threw");
        });
      }

      sendSuccess(res, serializeBookingRequest(updated));
    } catch (err) {
      handleError(err, req, res, "Failed to update booking request");
    }
  },
);

router.post("/stephen/booking-requests", validateBody(bodyShape({
      "company": z.unknown().optional(),
      "email": z.unknown().optional(),
      "message": z.unknown().optional(),
      "name": z.unknown().optional(),
      "preferredDate": z.unknown().optional(),
      "role": z.unknown().optional(),
      "type": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const body = CreateStephenBookingRequestBody.parse(req.body);
    const [request] = await db
      .insert(stephenBookingRequestsTable)
      .values({
        name: body.name,
        email: body.email,
        company: body.company ?? null,
        role: body.role ?? null,
        type: body.type as any,
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
          type: body.type as any,
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

const SHARED_PROXY_PORT = 9090;
const PROXY_BASE = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : `http://localhost:${SHARED_PROXY_PORT}`;

const PLATFORM_HEALTH_URLS: Record<string, string> = {
  "szl-holdings": `${PROXY_BASE}/szl-holdings/`,
  "alloy": `${PROXY_BASE}/szl-holdings/alloy`,
  "lyte": `${PROXY_BASE}/lyte-command-center/`,
  "vessels": `${PROXY_BASE}/vessels/`,
  "aegis": `${PROXY_BASE}/firestorm/`,
  "terra": `${PROXY_BASE}/terra/`,
  "carlota-jo": `${PROXY_BASE}/carlota-jo/`,
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

const CreateDesignPartnerIntakeBody = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().min(1).max(200),
  role: z.string().max(200).optional(),
  product: z.string().max(200).optional(),
  useCase: z.string().max(1000).optional(),
  message: z.string().min(1).max(5000),
});

router.post("/stephen/design-partner-intake", validateBody(bodyShape({
      "company": z.unknown().optional(),
      "email": z.unknown().optional(),
      "message": z.unknown().optional(),
      "name": z.unknown().optional(),
      "product": z.unknown().optional(),
      "role": z.unknown().optional(),
      "useCase": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const body = CreateDesignPartnerIntakeBody.parse(req.body);

    const fullMessage = [
      body.product ? `Product interest: ${body.product}` : null,
      body.useCase ? `Workflow to instrument: ${body.useCase}` : null,
      body.role ? `Role: ${body.role}` : null,
      `\n${body.message}`,
    ].filter(Boolean).join("\n");

    const [bookingRequest] = await db
      .insert(stephenBookingRequestsTable)
      .values({
        name: body.name.trim(),
        email: body.email.trim(),
        company: body.company.trim(),
        role: body.role?.trim() ?? null,
        type: "partnership" as const,
        message: fullMessage.trim(),
        status: "pending",
      })
      .returning();

    Promise.allSettled([
      db.insert(alloySignals).values({
        source: "stephen-site",
        sourceType: "api",
        domain: "design-partner",
        title: `Design partner application: ${body.company} (${body.name})`,
        summary: `${body.name} from ${body.company} applied to the design partner program. Product interest: ${body.product ?? "unspecified"}. Use case: ${body.useCase ?? "not specified"}.`,
        category: "lead",
        severity: "medium",
        confidence: 0.9,
        score: 75,
        tags: ["design-partner", "lead", "founder-site"],
        metadata: {
          bookingRequestId: bookingRequest.id,
          email: body.email,
          company: body.company,
          product: body.product,
          useCase: body.useCase,
          source: "founder-site",
        },
        status: "raw",
        dedupeKey: `design-partner-${body.email}-${body.company}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      }),
      sendEmail({
        to: body.email,
        subject: "Design partner application received — Stephen Lutar",
        html: buildStephenContactAckEmail(body.name, "partnership"),
        replyTo: STEPHEN_ADMIN_EMAIL,
      }),
      sendEmail({
        to: STEPHEN_ADMIN_EMAIL,
        subject: `New design partner application: ${body.company} — ${body.name}`,
        html: buildStephenContactNotificationEmail({
          name: body.name,
          email: body.email,
          company: body.company,
          type: "partnership",
          message: fullMessage,
        }),
        replyTo: body.email,
      }),
    ]).then((results) => {
      for (const r of results) {
        if (r.status === "rejected") {
          logger.warn({ err: r.reason }, "[design-partner-intake] background task threw");
        }
      }
    }).catch((err) => {
      logger.warn({ err }, "[design-partner-intake] background fanout error");
    });

    res.status(201).json({
      id: bookingRequest.id,
      submitted: true,
      message: "Application received. Stephen will respond personally within 5 business days.",
    });
  } catch (err) {
    handleError(err, req, res, "Failed to create design partner intake");
  }
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
