import { Router, type IRouter } from "express";
import {
  db,
  atlasArtifactsTable,
  atlasExportJobsTable,
  ATLAS_TEMPLATE_TYPES,
  ATLAS_EXPORT_FORMATS,
} from "@szl-holdings/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import type { Request, Response } from "express";
import { z } from "zod";
import { randomBytes } from "crypto";

const atlasRouter: IRouter = Router();
atlasRouter.use("/atlas", authMiddleware({ required: true }));

function generateSlug(title: string, templateType: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  const suffix = randomBytes(4).toString("hex");
  return `${templateType}-${base}-${suffix}`;
}

const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().default(""),
  type: z.enum(["text", "table", "chart", "image", "list", "kpi_grid"]).default("text"),
  data: z.record(z.unknown()).optional(),
  order: z.number().int().default(0),
});

const createArtifactSchema = z.object({
  title: z.string().min(1),
  templateType: z.enum(ATLAS_TEMPLATE_TYPES),
  domain: z.enum(["maritime", "security", "real_estate", "aiops", "research", "creative", "general"]).default("general"),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  sections: z.array(sectionSchema).default([]),
  content: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  correlationId: z.string().optional(),
  outcomeGraphId: z.number().int().optional(),
});

const updateArtifactSchema = z.object({
  title: z.string().min(1).optional(),
  sections: z.array(sectionSchema).optional(),
  content: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

atlasRouter.post("/atlas/artifacts", async (req: Request, res: Response) => {
  try {
    const parsed = createArtifactSchema.safeParse(req.body);
    if (!parsed.success) {
      return void res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    }

    const user = (req as any).user;
    const orgId: number | null = user?.orgId ?? null;
    const slug = generateSlug(parsed.data.title, parsed.data.templateType);

    const [artifact] = await db.insert(atlasArtifactsTable).values({
      orgId,
      slug,
      title: parsed.data.title,
      templateType: parsed.data.templateType,
      domain: parsed.data.domain,
      entityType: parsed.data.entityType ?? null,
      entityId: parsed.data.entityId ?? null,
      version: 1,
      status: "ready",
      content: parsed.data.content ?? {},
      sections: parsed.data.sections,
      metadata: parsed.data.metadata ?? {},
      generatedBy: "atlas-ui",
      generatedByUserId: user?.id ?? null,
      correlationId: parsed.data.correlationId ?? null,
      outcomeGraphId: parsed.data.outcomeGraphId ?? null,
      isLatest: true,
    }).returning();

    return void res.status(201).json({ success: true, data: artifact });
  } catch (err) {
    console.error("POST /atlas/artifacts error:", err);
    return void res.status(500).json({ error: "Failed to create artifact" });
  }
});

atlasRouter.get("/atlas/artifacts", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orgId: number | null = user?.orgId ?? null;

    const domain = req.query.domain as string | undefined;
    const templateType = req.query.templateType as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const latestOnly = req.query.latestOnly !== "false";
    const limit = Math.min(parseInt(req.query.limit as string ?? "50", 10), 200);
    const offset = parseInt(req.query.offset as string ?? "0", 10);

    const conditions: any[] = [];
    if (orgId != null) conditions.push(eq(atlasArtifactsTable.orgId, orgId));
    if (domain) conditions.push(eq(atlasArtifactsTable.domain, domain as any));
    if (templateType) conditions.push(eq(atlasArtifactsTable.templateType, templateType as any));
    if (entityType) conditions.push(eq(atlasArtifactsTable.entityType, entityType));
    if (entityId) conditions.push(eq(atlasArtifactsTable.entityId, entityId));
    if (latestOnly) conditions.push(eq(atlasArtifactsTable.isLatest, true));

    const q = db.select().from(atlasArtifactsTable)
      .orderBy(desc(atlasArtifactsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const rows = conditions.length > 0 ? await q.where(and(...conditions)) : await q;
    return void res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error("GET /atlas/artifacts error:", err);
    return void res.status(500).json({ error: "Failed to list artifacts" });
  }
});

atlasRouter.get("/atlas/artifacts/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string ?? "0", 10);
    if (!id) return void res.status(400).json({ error: "Invalid id" });

    const [artifact] = await db.select().from(atlasArtifactsTable).where(eq(atlasArtifactsTable.id, id));
    if (!artifact) return void res.status(404).json({ error: "Artifact not found" });

    return void res.json({ success: true, data: artifact });
  } catch (err) {
    console.error("GET /atlas/artifacts/:id error:", err);
    return void res.status(500).json({ error: "Failed to get artifact" });
  }
});

atlasRouter.patch("/atlas/artifacts/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string ?? "0", 10);
    if (!id) return void res.status(400).json({ error: "Invalid id" });

    const parsed = updateArtifactSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: "Validation failed", details: parsed.error.issues });

    const [existing] = await db.select().from(atlasArtifactsTable).where(eq(atlasArtifactsTable.id, id));
    if (!existing) return void res.status(404).json({ error: "Artifact not found" });

    const [updated] = await db.update(atlasArtifactsTable)
      .set({
        ...(parsed.data.title ? { title: parsed.data.title } : {}),
        ...(parsed.data.sections ? { sections: parsed.data.sections } : {}),
        ...(parsed.data.content ? { content: parsed.data.content } : {}),
        ...(parsed.data.metadata ? { metadata: parsed.data.metadata } : {}),
        updatedAt: new Date(),
      })
      .where(eq(atlasArtifactsTable.id, id))
      .returning();

    return void res.json({ success: true, data: updated });
  } catch (err) {
    console.error("PATCH /atlas/artifacts/:id error:", err);
    return void res.status(500).json({ error: "Failed to update artifact" });
  }
});

atlasRouter.post("/atlas/artifacts/:id/regenerate", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string ?? "0", 10);
    if (!id) return void res.status(400).json({ error: "Invalid id" });

    const [existing] = await db.select().from(atlasArtifactsTable).where(eq(atlasArtifactsTable.id, id));
    if (!existing) return void res.status(404).json({ error: "Artifact not found" });

    await db.update(atlasArtifactsTable)
      .set({ isLatest: false })
      .where(eq(atlasArtifactsTable.id, id));

    const updates = updateArtifactSchema.safeParse(req.body);
    const [newVersion] = await db.insert(atlasArtifactsTable).values({
      orgId: existing.orgId,
      slug: existing.slug,
      title: updates.success && updates.data.title ? updates.data.title : existing.title,
      templateType: existing.templateType as any,
      domain: existing.domain as any,
      entityType: existing.entityType,
      entityId: existing.entityId,
      version: existing.version + 1,
      parentArtifactId: id,
      status: "ready",
      content: updates.success && updates.data.content ? updates.data.content : (existing.content ?? {}),
      sections: updates.success && updates.data.sections ? updates.data.sections : (existing.sections ?? []),
      metadata: updates.success && updates.data.metadata ? updates.data.metadata : (existing.metadata ?? {}),
      generatedBy: existing.generatedBy,
      generatedByUserId: existing.generatedByUserId,
      correlationId: existing.correlationId,
      outcomeGraphId: existing.outcomeGraphId,
      isLatest: true,
    }).returning();

    return void res.status(201).json({ success: true, data: newVersion });
  } catch (err) {
    console.error("POST /atlas/artifacts/:id/regenerate error:", err);
    return void res.status(500).json({ error: "Failed to regenerate artifact" });
  }
});

atlasRouter.get("/atlas/artifacts/:slug/versions", async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    if (!slug) return void res.status(400).json({ error: "Invalid slug" });

    const rows = await db
      .select({
        id: atlasArtifactsTable.id,
        version: atlasArtifactsTable.version,
        title: atlasArtifactsTable.title,
        status: atlasArtifactsTable.status,
        isLatest: atlasArtifactsTable.isLatest,
        createdAt: atlasArtifactsTable.createdAt,
      })
      .from(atlasArtifactsTable)
      .where(eq(atlasArtifactsTable.slug, slug))
      .orderBy(desc(atlasArtifactsTable.version));

    return void res.json({ success: true, data: rows });
  } catch (err) {
    console.error("GET /atlas/artifacts/:slug/versions error:", err);
    return void res.status(500).json({ error: "Failed to get version history" });
  }
});

atlasRouter.post("/atlas/artifacts/:id/share", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string ?? "0", 10);
    if (!id) return void res.status(400).json({ error: "Invalid id" });

    const { expiresInHours = 72 } = req.body as { expiresInHours?: number };
    const token = randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + Math.min(expiresInHours, 168) * 60 * 60 * 1000);

    await db.update(atlasArtifactsTable)
      .set({ shareToken: token, shareExpiresAt: expiresAt, updatedAt: new Date() })
      .where(eq(atlasArtifactsTable.id, id));

    return void res.json({ success: true, token, expiresAt });
  } catch (err) {
    console.error("POST /atlas/artifacts/:id/share error:", err);
    return void res.status(500).json({ error: "Failed to create share link" });
  }
});

atlasRouter.get("/atlas/shared/:token", async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    if (!token) return void res.status(400).json({ error: "Invalid token" });

    const [artifact] = await db.select().from(atlasArtifactsTable)
      .where(eq(atlasArtifactsTable.shareToken, token));

    if (!artifact) return void res.status(404).json({ error: "Artifact not found or link expired" });
    if (artifact.shareExpiresAt && artifact.shareExpiresAt < new Date()) {
      return void res.status(410).json({ error: "Share link has expired" });
    }

    return void res.json({ success: true, data: artifact });
  } catch (err) {
    console.error("GET /atlas/shared/:token error:", err);
    return void res.status(500).json({ error: "Failed to get shared artifact" });
  }
});

atlasRouter.post("/atlas/artifacts/:id/export", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string ?? "0", 10);
    if (!id) return void res.status(400).json({ error: "Invalid id" });

    const schema = z.object({
      format: z.enum(ATLAS_EXPORT_FORMATS),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: "Invalid export format" });

    const [artifact] = await db.select().from(atlasArtifactsTable).where(eq(atlasArtifactsTable.id, id));
    if (!artifact) return void res.status(404).json({ error: "Artifact not found" });

    const user = (req as any).user;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [job] = await db.insert(atlasExportJobsTable).values({
      orgId: artifact.orgId,
      artifactId: id,
      format: parsed.data.format,
      status: "pending",
      requestedByUserId: user?.id ?? null,
      expiresAt,
      metadata: { templateType: artifact.templateType, title: artifact.title },
    }).returning();

    return void res.status(202).json({ success: true, data: job, message: "Export job queued" });
  } catch (err) {
    console.error("POST /atlas/artifacts/:id/export error:", err);
    return void res.status(500).json({ error: "Failed to create export job" });
  }
});

atlasRouter.get("/atlas/export-jobs/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string ?? "0", 10);
    if (!id) return void res.status(400).json({ error: "Invalid id" });

    const [job] = await db.select().from(atlasExportJobsTable).where(eq(atlasExportJobsTable.id, id));
    if (!job) return void res.status(404).json({ error: "Export job not found" });

    return void res.json({ success: true, data: job });
  } catch (err) {
    console.error("GET /atlas/export-jobs/:id error:", err);
    return void res.status(500).json({ error: "Failed to get export job" });
  }
});

export default atlasRouter;
