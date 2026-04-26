/**
 * Plugin / Extension Architecture Registry
 *
 * Defines the contract a new domain module must implement to inherit
 * governance, proof chain, design system, and billing automatically.
 *
 * Plugin contract:
 *   - slug: unique identifier (e.g. "terra", "vessels", "counsel")
 *   - capabilities: array of capability identifiers
 *   - governanceInherited: true = platform governs AI autonomy
 *   - proofChainEnabled: true = all AI outputs are hash-anchored
 *   - designSystemVersion: pinned DS version for visual consistency
 *   - billingEnabled: true = metered through platform billing foundation
 *
 * A plugin that satisfies the contract is registered here and can be
 * installed per-org without touching core platform code.
 */

import { db, pluginInstallationsTable, pluginsTable } from '@szl-holdings/db';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateBody, validateQuery, listQuerySchema, parsePagination } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { getUserOrgIds } from '../middlewares/tenant-scope';
import { bodyShape } from '@szl-holdings/contracts/common';

const router: IRouter = Router();

export interface PluginCapability {
  id: string;
  description: string;
}

export const CORE_PLUGIN_CAPABILITIES: PluginCapability[] = [
  { id: 'domain:intelligence', description: 'Provides AI-driven domain intelligence analysis' },
  { id: 'domain:alerts', description: 'Emits domain-specific alerts into the command inbox' },
  { id: 'domain:timeline', description: 'Contributes a timeline of domain events' },
  { id: 'domain:documents', description: 'Manages domain documents with provenance tracking' },
  { id: 'ui:command-card', description: 'Renders a command card in the unified command center' },
  { id: 'ui:dashboard', description: 'Renders a full domain dashboard' },
  { id: 'billing:metered', description: 'Usage is metered through the platform billing foundation' },
  { id: 'governance:proof-chain', description: 'All AI outputs are cryptographically proof-chained' },
  { id: 'governance:autonomy', description: 'Respects platform autonomy mode and governance policies' },
  { id: 'api:public', description: 'Exposes domain data through the public API v1' },
  { id: 'webhook:events', description: 'Emits domain events to outbound webhook subscribers' },
];

const registerPluginSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  name: z.string().min(1).max(200),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).default('1.0.0'),
  description: z.string().max(2000).optional(),
  author: z.string().max(200).optional(),
  category: z.enum(['domain', 'data-connector', 'ui-extension', 'workflow', 'analytics']),
  entryPoint: z.string().max(500).optional(),
  manifestUrl: z.string().url().optional(),
  capabilities: z.array(z.string()).min(1).max(20),
  governanceInherited: z.boolean().default(true),
  proofChainEnabled: z.boolean().default(true),
  designSystemVersion: z.string().max(20).optional().default('1.0'),
  billingEnabled: z.boolean().default(false),
  pricingModel: z.enum(['free', 'flat', 'usage']).optional(),
});

const installPluginSchema = z.object({
  pluginId: z.number().int().positive(),
  config: z.record(z.unknown()).optional().default({}),
});

const updateInstallationSchema = z.object({
  status: z.enum(['active', 'disabled']).optional(),
  config: z.record(z.unknown()).optional(),
});

router.get('/plugins/capabilities', (_req: Request, res: Response) => {
  sendSuccess(res, {
    capabilities: CORE_PLUGIN_CAPABILITIES,
    contract: {
      required: ['domain:intelligence', 'governance:proof-chain', 'governance:autonomy'],
      recommended: ['ui:command-card', 'api:public', 'webhook:events'],
      billing: ['billing:metered'],
    },
    sdkVersion: '1.0.0',
    documentationUrl: '/api/v1/openapi.json',
  });
});

router.post(
  '/plugins',
  authMiddleware(),
  requireRole('super_admin', 'admin'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const parsed = registerPluginSchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
      return;
    }

    try {
      const validCapabilities = CORE_PLUGIN_CAPABILITIES.map((c) => c.id);
      const invalidCaps = parsed.data.capabilities.filter((c) => !validCapabilities.includes(c));
      if (invalidCaps.length > 0) {
        sendBadRequest(
          res,
          `Unknown capabilities: ${invalidCaps.join(', ')}. See /api/plugins/capabilities for valid options.`,
        );
        return;
      }

      const requiredCaps = ['governance:proof-chain', 'governance:autonomy'];
      const missingRequired = requiredCaps.filter((c) => !parsed.data.capabilities.includes(c));
      if (missingRequired.length > 0) {
        sendBadRequest(
          res,
          `Plugin must implement required capabilities: ${missingRequired.join(', ')}. These ensure platform governance.`,
        );
        return;
      }

      const [plugin] = await db
        .insert(pluginsTable)
        .values({
          ...parsed.data,
          capabilities: parsed.data.capabilities,
          createdById: req.user!.id,
        })
        .returning();

      logger.info(
        { pluginId: plugin.id, slug: plugin.slug, userId: req.user!.id },
        'Plugin registered',
      );

      sendSuccess(res, plugin, 201);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') {
        sendBadRequest(res, `Plugin slug '${parsed.data.slug}' is already registered`);
        return;
      }
      handleRouteError(res, err, 'Failed to register plugin');
    }
  },
);

router.get(
  '/plugins',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
      const category = req.query.category as string | undefined;
      const published = req.query.published;

      const conditions: ReturnType<typeof eq>[] = [];
      if (category) {
        conditions.push(eq(pluginsTable.category, category as typeof pluginsTable.$inferSelect.category));
      }
      if (published === 'true') {
        conditions.push(eq(pluginsTable.isPublished, true));
      }

      const plugins = await db
        .select()
        .from(pluginsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(pluginsTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, plugins, 200, { page, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list plugins');
    }
  },
);

router.get(
  '/plugins/:id',
  authMiddleware(),
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendBadRequest(res, 'Invalid plugin ID');
      return;
    }

    try {
      const [plugin] = await db
        .select()
        .from(pluginsTable)
        .where(eq(pluginsTable.id, id));

      if (!plugin) {
        sendNotFound(res, 'Plugin');
        return;
      }

      const installations = await db
        .select()
        .from(pluginInstallationsTable)
        .where(eq(pluginInstallationsTable.pluginId, id));

      sendSuccess(res, { ...plugin, installationCount: installations.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get plugin');
    }
  },
);

router.post(
  '/plugins/:id/publish',
  authMiddleware(),
  requireRole('super_admin'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendBadRequest(res, 'Invalid plugin ID');
      return;
    }

    try {
      const [plugin] = await db
        .select()
        .from(pluginsTable)
        .where(eq(pluginsTable.id, id));

      if (!plugin) {
        sendNotFound(res, 'Plugin');
        return;
      }

      await db
        .update(pluginsTable)
        .set({ isPublished: true, updatedAt: new Date() })
        .where(eq(pluginsTable.id, id));

      sendSuccess(res, { id, published: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to publish plugin');
    }
  },
);

router.post(
  '/plugins/install',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const parsed = installPluginSchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
      return;
    }

    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendBadRequest(res, 'No organization context');
      return;
    }
    const orgId = [...orgIds][0];

    try {
      const [plugin] = await db
        .select()
        .from(pluginsTable)
        .where(and(eq(pluginsTable.id, parsed.data.pluginId), eq(pluginsTable.isPublished, true)));

      if (!plugin) {
        sendNotFound(res, 'Published plugin');
        return;
      }

      const [installation] = await db
        .insert(pluginInstallationsTable)
        .values({
          pluginId: plugin.id,
          orgId,
          installedById: req.user!.id,
          status: 'active',
          config: parsed.data.config,
        })
        .returning();

      logger.info(
        { orgId, pluginId: plugin.id, slug: plugin.slug, installationId: installation.id },
        'Plugin installed',
      );

      sendSuccess(res, {
        installation,
        plugin: {
          id: plugin.id,
          slug: plugin.slug,
          name: plugin.name,
          version: plugin.version,
          capabilities: plugin.capabilities,
        },
      }, 201);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') {
        sendBadRequest(res, 'Plugin is already installed for this organization');
        return;
      }
      handleRouteError(res, err, 'Failed to install plugin');
    }
  },
);

router.get(
  '/plugins/installations',
  authMiddleware(),
  async (req: Request, res: Response) => {
    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendSuccess(res, []);
      return;
    }

    try {
      const installations = await db
        .select({
          installation: pluginInstallationsTable,
          plugin: {
            id: pluginsTable.id,
            slug: pluginsTable.slug,
            name: pluginsTable.name,
            version: pluginsTable.version,
            category: pluginsTable.category,
            capabilities: pluginsTable.capabilities,
            governanceInherited: pluginsTable.governanceInherited,
            proofChainEnabled: pluginsTable.proofChainEnabled,
          },
        })
        .from(pluginInstallationsTable)
        .innerJoin(pluginsTable, eq(pluginInstallationsTable.pluginId, pluginsTable.id))
        .where(inArray(pluginInstallationsTable.orgId, [...orgIds]))
        .orderBy(desc(pluginInstallationsTable.installedAt));

      sendSuccess(res, installations);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list plugin installations');
    }
  },
);

router.patch(
  '/plugins/installations/:id',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendBadRequest(res, 'Invalid installation ID');
      return;
    }

    const parsed = updateInstallationSchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
      return;
    }

    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendBadRequest(res, 'No organization context');
      return;
    }

    try {
      const [installation] = await db
        .select()
        .from(pluginInstallationsTable)
        .where(
          and(
            eq(pluginInstallationsTable.id, id),
            inArray(pluginInstallationsTable.orgId, [...orgIds]),
          ),
        );

      if (!installation) {
        sendNotFound(res, 'Plugin installation');
        return;
      }

      await db
        .update(pluginInstallationsTable)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(pluginInstallationsTable.id, id));

      sendSuccess(res, { id, updated: true, ...parsed.data });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update plugin installation');
    }
  },
);

export default router;
