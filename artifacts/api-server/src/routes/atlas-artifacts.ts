import {
  ATLAS_EXPORT_FORMATS,
  ATLAS_TEMPLATE_TYPES,
  compareArtifactVersions,
  createExportJob,
  createShareLink,
  generateArtifact,
  getArtifactById,
  getArtifactByShareToken,
  getArtifactVersionHistory,
  listArtifacts,
  regenerateArtifact,
} from '@szl-holdings/atlas-artifacts';
import { atlasExportJobsTable, db } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import { type Request, type Response, type IRouter, Router } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';

const atlasRouter: IRouter = Router();
atlasRouter.use('/atlas', authMiddleware({ required: true }));

const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().default(''),
  type: z.enum(['text', 'table', 'chart', 'image', 'list', 'kpi_grid']).default('text'),
  data: z.record(z.unknown()).optional(),
  order: z.number().int().default(0),
});

const createArtifactSchema = z.object({
  title: z.string().min(1),
  templateType: z.enum(ATLAS_TEMPLATE_TYPES),
  domain: z
    .enum(['maritime', 'security', 'real_estate', 'aiops', 'research', 'creative', 'general'])
    .default('general'),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  sections: z.array(sectionSchema).default([]),
  content: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  correlationId: z.string().optional(),
  outcomeGraphId: z.number().int().optional(),
  attachProvenance: z.boolean().default(false),
});

const updateArtifactSchema = z.object({
  title: z.string().min(1).optional(),
  sections: z.array(sectionSchema).optional(),
  content: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

atlasRouter.post('/atlas/artifacts', async (req: Request, res: Response) => {
  try {
    const parsed = createArtifactSchema.safeParse(req.body);
    if (!parsed.success) {
      return void res
        .status(400)
        .json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const user = (req as any).user;

    const artifact = await generateArtifact({
      orgId: user?.orgId ?? null,
      title: parsed.data.title,
      templateType: parsed.data.templateType,
      domain: parsed.data.domain,
      entityType: parsed.data.entityType,
      entityId: parsed.data.entityId,
      sections: parsed.data.sections as any,
      content: parsed.data.content,
      metadata: parsed.data.metadata,
      generatedBy: 'atlas-ui',
      generatedByUserId: user?.id ?? null,
      correlationId: parsed.data.correlationId,
      outcomeGraphId: parsed.data.outcomeGraphId ?? null,
      attachProvenance: parsed.data.attachProvenance,
    });

    return void res.status(201).json({ success: true, data: artifact });
  } catch (err) {
    logger.error({ err }, 'POST /atlas/artifacts error:');
    return void res.status(500).json({ error: 'Failed to create artifact' });
  }
});

atlasRouter.get('/atlas/artifacts', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orgId: number | undefined = user?.orgId ?? undefined;

    const domain = req.query.domain as string | undefined;
    const templateType = req.query.templateType as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const latestOnly = req.query.latestOnly !== 'false';
    const limit = Math.min(parseInt((req.query.limit as string) ?? '50', 10), 200);
    const offset = parseInt((req.query.offset as string) ?? '0', 10);

    const rows = await listArtifacts({
      orgId,
      domain: domain as any,
      templateType: templateType as any,
      entityType,
      entityId,
      latestOnly,
      limit,
      offset,
    });

    return void res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    logger.error({ err }, 'GET /atlas/artifacts error:');
    return void res.status(500).json({ error: 'Failed to list artifacts' });
  }
});

atlasRouter.get('/atlas/artifacts/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt((req.params.id as string) ?? '0', 10);
    if (!id) return void res.status(400).json({ error: 'Invalid id' });

    const artifact = await getArtifactById(id);
    if (!artifact) return void res.status(404).json({ error: 'Artifact not found' });

    return void res.json({ success: true, data: artifact });
  } catch (err) {
    logger.error({ err }, 'GET /atlas/artifacts/:id error:');
    return void res.status(500).json({ error: 'Failed to get artifact' });
  }
});

atlasRouter.patch('/atlas/artifacts/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt((req.params.id as string) ?? '0', 10);
    if (!id) return void res.status(400).json({ error: 'Invalid id' });

    const parsed = updateArtifactSchema.safeParse(req.body);
    if (!parsed.success)
      return void res
        .status(400)
        .json({ error: 'Validation failed', details: parsed.error.issues });

    const existing = await getArtifactById(id);
    if (!existing) return void res.status(404).json({ error: 'Artifact not found' });

    const updated = await regenerateArtifact(id, parsed.data);

    return void res.json({ success: true, data: updated });
  } catch (err: any) {
    if (err?.code === 'NOT_FOUND')
      return void res.status(404).json({ error: 'Artifact not found' });
    logger.error({ err }, 'PATCH /atlas/artifacts/:id error:');
    return void res.status(500).json({ error: 'Failed to update artifact' });
  }
});

atlasRouter.post('/atlas/artifacts/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const id = parseInt((req.params.id as string) ?? '0', 10);
    if (!id) return void res.status(400).json({ error: 'Invalid id' });

    const updates = updateArtifactSchema.safeParse(req.body);
    const newVersion = await regenerateArtifact(id, updates.success ? updates.data : {});

    return void res.status(201).json({ success: true, data: newVersion });
  } catch (err: any) {
    if (err?.code === 'NOT_FOUND')
      return void res.status(404).json({ error: 'Artifact not found' });
    logger.error({ err }, 'POST /atlas/artifacts/:id/regenerate error:');
    return void res.status(500).json({ error: 'Failed to regenerate artifact' });
  }
});

atlasRouter.get('/atlas/artifacts/:slug/versions', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    if (!slug) return void res.status(400).json({ error: 'Invalid slug' });

    const rows = await getArtifactVersionHistory(slug);
    return void res.json({ success: true, data: rows });
  } catch (err) {
    logger.error({ err }, 'GET /atlas/artifacts/:slug/versions error:');
    return void res.status(500).json({ error: 'Failed to get version history' });
  }
});

atlasRouter.get('/atlas/artifacts/:idA/compare/:idB', async (req: Request, res: Response) => {
  try {
    const idA = parseInt((req.params.idA as string) ?? '0', 10);
    const idB = parseInt((req.params.idB as string) ?? '0', 10);
    if (!idA || !idB) return void res.status(400).json({ error: 'Invalid ids' });

    const diff = await compareArtifactVersions(idA, idB);
    return void res.json({ success: true, data: diff });
  } catch (err: any) {
    if (err?.code === 'NOT_FOUND')
      return void res.status(404).json({ error: 'One or both artifacts not found' });
    logger.error({ err }, 'GET /atlas/artifacts/:idA/compare/:idB error:');
    return void res.status(500).json({ error: 'Failed to compare artifacts' });
  }
});

atlasRouter.post('/atlas/artifacts/:id/share', async (req: Request, res: Response) => {
  try {
    const id = parseInt((req.params.id as string) ?? '0', 10);
    if (!id) return void res.status(400).json({ error: 'Invalid id' });

    const { expiresInHours = 72 } = req.body as { expiresInHours?: number };
    const token = await createShareLink(id, Math.min(expiresInHours, 168));
    const expiresAt = new Date(Date.now() + Math.min(expiresInHours, 168) * 60 * 60 * 1000);

    return void res.json({ success: true, token, expiresAt });
  } catch (err) {
    logger.error({ err }, 'POST /atlas/artifacts/:id/share error:');
    return void res.status(500).json({ error: 'Failed to create share link' });
  }
});

atlasRouter.get('/atlas/shared/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    if (!token) return void res.status(400).json({ error: 'Invalid token' });

    const artifact = await getArtifactByShareToken(token);
    if (!artifact)
      return void res.status(410).json({ error: 'Artifact not found or share link has expired' });

    return void res.json({ success: true, data: artifact });
  } catch (err) {
    logger.error({ err }, 'GET /atlas/shared/:token error:');
    return void res.status(500).json({ error: 'Failed to get shared artifact' });
  }
});

atlasRouter.post('/atlas/artifacts/:id/export', async (req: Request, res: Response) => {
  try {
    const id = parseInt((req.params.id as string) ?? '0', 10);
    if (!id) return void res.status(400).json({ error: 'Invalid id' });

    const schema = z.object({
      format: z.enum(ATLAS_EXPORT_FORMATS),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Invalid export format' });

    const user = (req as any).user;

    const job = await createExportJob({
      orgId: user?.orgId ?? null,
      artifactId: id,
      format: parsed.data.format,
      requestedByUserId: user?.id ?? null,
    });

    return void res.status(202).json({ success: true, data: job, message: 'Export job queued' });
  } catch (err: any) {
    if (err?.code === 'NOT_FOUND')
      return void res.status(404).json({ error: 'Artifact not found' });
    logger.error({ err }, 'POST /atlas/artifacts/:id/export error:');
    return void res.status(500).json({ error: 'Failed to create export job' });
  }
});

atlasRouter.get('/atlas/export-jobs/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt((req.params.id as string) ?? '0', 10);
    if (!id) return void res.status(400).json({ error: 'Invalid id' });

    const [job] = await db
      .select()
      .from(atlasExportJobsTable)
      .where(eq(atlasExportJobsTable.id, id));
    if (!job) return void res.status(404).json({ error: 'Export job not found' });

    return void res.json({ success: true, data: job });
  } catch (err) {
    logger.error({ err }, 'GET /atlas/export-jobs/:id error:');
    return void res.status(500).json({ error: 'Failed to get export job' });
  }
});

export default atlasRouter;
