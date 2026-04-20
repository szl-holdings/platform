import { bodyShape } from '@szl-holdings/contracts/common';
import {
  auditLogsTable,
  capitalArtifactsTable,
  capTablePlaceholdersTable,
  db,
  diligenceChecklistItemsTable,
  diligenceChecklistsTable,
  featureFlagsTable,
  financialModelsTable,
  fundraisingMilestonesTable,
  investorPacketDeliverables,
  investorPacketsTable,
  lenderPacketDeliverables,
  lenderPacketsTable,
  useOfFundsVersionsTable,
} from '@szl-holdings/db';
import { durableJobQueue } from '@szl-holdings/forge-runtime';
import { and, desc, eq, sql } from 'drizzle-orm';
import { type IRouter, type NextFunction, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, parsePagination, sendNotFound, sendSuccess } from '../lib/api-response';
import { JOB_TYPES } from '../lib/job-queue';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, parseIdParam, requireRole } from '../middlewares/auth';

const router: IRouter = Router();
const auth = [authMiddleware(), requireRole('ops', 'exec', 'admin')];

async function logCapitalAudit(
  action: string,
  entity: string,
  entityId: string | number,
  payload?: unknown,
) {
  try {
    await db.insert(auditLogsTable).values({
      actionType: action,
      entityType: entity,
      entityId: String(entityId),
      payloadJson: (payload as Record<string, unknown>) ?? null,
    });
  } catch {
    // non-fatal
  }
}

async function requireCapitalFlag(_req: Request, res: Response, next: NextFunction) {
  try {
    const [flag] = await db
      .select()
      .from(featureFlagsTable)
      .where(eq(featureFlagsTable.key, 'capital_readiness_os_enabled'));
    if (flag && !flag.isEnabled) {
      res.status(403).json({ error: 'Capital Readiness OS is currently disabled' });
      return;
    }
    next();
  } catch {
    next();
  }
}

router.use('/capital', requireCapitalFlag);

// ─── CAPITAL ARTIFACTS ────────────────────────────────────────────────────────

router.get('/capital/artifacts', ...auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db
      .select()
      .from(capitalArtifactsTable)
      .orderBy(desc(capitalArtifactsTable.createdAt))
      .limit(limit)
      .offset(offset);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(capitalArtifactsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list capital artifacts');
  }
});

router.post('/capital/artifacts', ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(capitalArtifactsTable).values(req.body).returning();
    await logCapitalAudit('create', 'capital_artifact', row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, 'Failed to create capital artifact');
  }
});

router.patch('/capital/artifacts/:id', ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db
      .update(capitalArtifactsTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(capitalArtifactsTable.id, id))
      .returning();
    if (!row) {
      sendNotFound(res, 'Capital artifact');
      return;
    }
    await logCapitalAudit('update', 'capital_artifact', id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, 'Failed to update capital artifact');
  }
});

router.delete('/capital/artifacts/:id', validateBody(bodyShape({})), ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db
      .delete(capitalArtifactsTable)
      .where(eq(capitalArtifactsTable.id, id))
      .returning();
    if (!row) {
      sendNotFound(res, 'Capital artifact');
      return;
    }
    await logCapitalAudit('delete', 'capital_artifact', id, {});
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete capital artifact');
  }
});

// ─── LENDER PACKETS ───────────────────────────────────────────────────────────

router.get('/capital/lender-packets', ...auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db
      .select()
      .from(lenderPacketsTable)
      .orderBy(desc(lenderPacketsTable.createdAt))
      .limit(limit)
      .offset(offset);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(lenderPacketsTable);
    sendSuccess(res, rows, 200, { page, limit, total: count });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list lender packets');
  }
});

router.post('/capital/lender-packets', ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(lenderPacketsTable).values(req.body).returning();
    await logCapitalAudit('create', 'lender_packet', row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, 'Failed to create lender packet');
  }
});

router.get('/capital/lender-packets/:id', ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [packet] = await db
      .select()
      .from(lenderPacketsTable)
      .where(eq(lenderPacketsTable.id, id));
    if (!packet) {
      sendNotFound(res, 'Lender packet');
      return;
    }
    const deliverables = await db
      .select()
      .from(lenderPacketDeliverables)
      .where(eq(lenderPacketDeliverables.packetId, id))
      .orderBy(lenderPacketDeliverables.sortOrder);
    sendSuccess(res, { ...packet, deliverables });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get lender packet');
  }
});

router.patch(
  '/capital/lender-packets/:id',
  ...auth,
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db
        .update(lenderPacketsTable)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(lenderPacketsTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Lender packet');
        return;
      }
      await logCapitalAudit('update', 'lender_packet', id, req.body);
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update lender packet');
    }
  },
);

router.delete(
  '/capital/lender-packets/:id',
  validateBody(bodyShape({})),
  ...auth,
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db
        .delete(lenderPacketsTable)
        .where(eq(lenderPacketsTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Lender packet');
        return;
      }
      await logCapitalAudit('delete', 'lender_packet', id, {});
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete lender packet');
    }
  },
);

router.patch(
  '/capital/lender-deliverables/:id',
  ...auth,
  validateBody(
    bodyShape({
      completedAt: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const update = { ...req.body, updatedAt: new Date() };
      if (req.body.status === 'final' && !req.body.completedAt) {
        update.completedAt = new Date();
      }
      const [row] = await db
        .update(lenderPacketDeliverables)
        .set(update)
        .where(eq(lenderPacketDeliverables.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Deliverable');
        return;
      }
      await logCapitalAudit('update', 'lender_packet_deliverable', id, req.body);
      const all = await db
        .select()
        .from(lenderPacketDeliverables)
        .where(eq(lenderPacketDeliverables.packetId, row.packetId));
      const completedCount = all.filter((d) => ['reviewed', 'final'].includes(d.status)).length;
      const pct = all.length ? Math.round((completedCount / all.length) * 100) : 0;
      await db
        .update(lenderPacketsTable)
        .set({ completionPct: pct, updatedAt: new Date() })
        .where(eq(lenderPacketsTable.id, row.packetId));
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update deliverable');
    }
  },
);

router.delete(
  '/capital/lender-deliverables/:id',
  validateBody(bodyShape({})),
  ...auth,
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db
        .delete(lenderPacketDeliverables)
        .where(eq(lenderPacketDeliverables.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Deliverable');
        return;
      }
      await logCapitalAudit('delete', 'lender_packet_deliverable', id, {});
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete deliverable');
    }
  },
);

// ─── INVESTOR PACKETS ─────────────────────────────────────────────────────────

router.get(
  '/capital/investor-packets',
  ...auth,
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const rows = await db
        .select()
        .from(investorPacketsTable)
        .orderBy(desc(investorPacketsTable.createdAt))
        .limit(limit)
        .offset(offset);
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(investorPacketsTable);
      sendSuccess(res, rows, 200, { page, limit, total: count });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list investor packets');
    }
  },
);

router.post('/capital/investor-packets', ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(investorPacketsTable).values(req.body).returning();
    await logCapitalAudit('create', 'investor_packet', row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, 'Failed to create investor packet');
  }
});

router.get('/capital/investor-packets/:id', ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [packet] = await db
      .select()
      .from(investorPacketsTable)
      .where(eq(investorPacketsTable.id, id));
    if (!packet) {
      sendNotFound(res, 'Investor packet');
      return;
    }
    const deliverables = await db
      .select()
      .from(investorPacketDeliverables)
      .where(eq(investorPacketDeliverables.packetId, id))
      .orderBy(investorPacketDeliverables.sortOrder);
    sendSuccess(res, { ...packet, deliverables });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get investor packet');
  }
});

router.patch(
  '/capital/investor-packets/:id',
  ...auth,
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db
        .update(investorPacketsTable)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(investorPacketsTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Investor packet');
        return;
      }
      await logCapitalAudit('update', 'investor_packet', id, req.body);
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update investor packet');
    }
  },
);

router.delete(
  '/capital/investor-packets/:id',
  validateBody(bodyShape({})),
  ...auth,
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db
        .delete(investorPacketsTable)
        .where(eq(investorPacketsTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Investor packet');
        return;
      }
      await logCapitalAudit('delete', 'investor_packet', id, {});
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete investor packet');
    }
  },
);

router.patch(
  '/capital/investor-deliverables/:id',
  ...auth,
  validateBody(
    bodyShape({
      completedAt: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const update = { ...req.body, updatedAt: new Date() };
      if (req.body.status === 'final' && !req.body.completedAt) update.completedAt = new Date();
      const [row] = await db
        .update(investorPacketDeliverables)
        .set(update)
        .where(eq(investorPacketDeliverables.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Deliverable');
        return;
      }
      await logCapitalAudit('update', 'investor_packet_deliverable', id, req.body);
      const all = await db
        .select()
        .from(investorPacketDeliverables)
        .where(eq(investorPacketDeliverables.packetId, row.packetId));
      const completedCount = all.filter((d) => ['reviewed', 'final'].includes(d.status)).length;
      const pct = all.length ? Math.round((completedCount / all.length) * 100) : 0;
      await db
        .update(investorPacketsTable)
        .set({ completionPct: pct, updatedAt: new Date() })
        .where(eq(investorPacketsTable.id, row.packetId));
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update investor deliverable');
    }
  },
);

router.delete(
  '/capital/investor-deliverables/:id',
  validateBody(bodyShape({})),
  ...auth,
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db
        .delete(investorPacketDeliverables)
        .where(eq(investorPacketDeliverables.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Deliverable');
        return;
      }
      await logCapitalAudit('delete', 'investor_packet_deliverable', id, {});
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete investor deliverable');
    }
  },
);

// ─── FUNDRAISING MILESTONES ───────────────────────────────────────────────────

router.get('/capital/milestones', ...auth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(fundraisingMilestonesTable)
      .orderBy(fundraisingMilestonesTable.sortOrder, fundraisingMilestonesTable.targetDate);
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list milestones');
  }
});

router.post('/capital/milestones', ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(fundraisingMilestonesTable).values(req.body).returning();
    await logCapitalAudit('create', 'fundraising_milestone', row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, 'Failed to create milestone');
  }
});

router.patch(
  '/capital/milestones/:id',
  ...auth,
  validateBody(
    bodyShape({
      completedAt: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const update = { ...req.body, updatedAt: new Date() };
      if (req.body.status === 'completed' && !req.body.completedAt) update.completedAt = new Date();
      const [row] = await db
        .update(fundraisingMilestonesTable)
        .set(update)
        .where(eq(fundraisingMilestonesTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Milestone');
        return;
      }
      await logCapitalAudit('update', 'fundraising_milestone', id, req.body);
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update milestone');
    }
  },
);

router.delete('/capital/milestones/:id', validateBody(bodyShape({})), ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db
      .delete(fundraisingMilestonesTable)
      .where(eq(fundraisingMilestonesTable.id, id))
      .returning();
    if (!row) {
      sendNotFound(res, 'Milestone');
      return;
    }
    await logCapitalAudit('delete', 'fundraising_milestone', id, {});
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete milestone');
  }
});

// ─── FINANCIAL MODELS ─────────────────────────────────────────────────────────

router.get('/capital/financial-models', ...auth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(financialModelsTable)
      .orderBy(desc(financialModelsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list financial models');
  }
});

router.post('/capital/financial-models', ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(financialModelsTable).values(req.body).returning();
    await logCapitalAudit('create', 'financial_model', row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, 'Failed to create financial model');
  }
});

router.patch(
  '/capital/financial-models/:id',
  ...auth,
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db
        .update(financialModelsTable)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(financialModelsTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Financial model');
        return;
      }
      await logCapitalAudit('update', 'financial_model', id, req.body);
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update financial model');
    }
  },
);

router.delete(
  '/capital/financial-models/:id',
  validateBody(bodyShape({})),
  ...auth,
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db
        .delete(financialModelsTable)
        .where(eq(financialModelsTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Financial model');
        return;
      }
      await logCapitalAudit('delete', 'financial_model', id, {});
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete financial model');
    }
  },
);

// ─── USE OF FUNDS VERSIONS ────────────────────────────────────────────────────

router.get('/capital/use-of-funds', ...auth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(useOfFundsVersionsTable)
      .orderBy(desc(useOfFundsVersionsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list use-of-funds versions');
  }
});

router.post('/capital/use-of-funds', ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(useOfFundsVersionsTable).values(req.body).returning();
    await logCapitalAudit('create', 'use_of_funds_version', row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, 'Failed to create use-of-funds version');
  }
});

router.patch(
  '/capital/use-of-funds/:id',
  ...auth,
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db
        .update(useOfFundsVersionsTable)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(useOfFundsVersionsTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Use-of-funds version');
        return;
      }
      await logCapitalAudit('update', 'use_of_funds_version', id, req.body);
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update use-of-funds version');
    }
  },
);

router.delete(
  '/capital/use-of-funds/:id',
  validateBody(bodyShape({})),
  ...auth,
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db
        .delete(useOfFundsVersionsTable)
        .where(eq(useOfFundsVersionsTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Use-of-funds version');
        return;
      }
      await logCapitalAudit('delete', 'use_of_funds_version', id, {});
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete use-of-funds version');
    }
  },
);

// ─── DILIGENCE CHECKLISTS ─────────────────────────────────────────────────────

router.get('/capital/diligence-checklists', ...auth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(diligenceChecklistsTable)
      .orderBy(desc(diligenceChecklistsTable.createdAt));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list checklists');
  }
});

router.get('/capital/diligence-checklists/:id', ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [checklist] = await db
      .select()
      .from(diligenceChecklistsTable)
      .where(eq(diligenceChecklistsTable.id, id));
    if (!checklist) {
      sendNotFound(res, 'Checklist');
      return;
    }
    const items = await db
      .select()
      .from(diligenceChecklistItemsTable)
      .where(eq(diligenceChecklistItemsTable.checklistId, id))
      .orderBy(diligenceChecklistItemsTable.sortOrder);
    sendSuccess(res, { ...checklist, items });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get checklist');
  }
});

router.post(
  '/capital/diligence-checklists',
  ...auth,
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const [row] = await db.insert(diligenceChecklistsTable).values(req.body).returning();
      await logCapitalAudit('create', 'diligence_checklist', row.id, req.body);
      sendSuccess(res, row, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create checklist');
    }
  },
);

router.patch(
  '/capital/diligence-checklists/:id',
  ...auth,
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db
        .update(diligenceChecklistsTable)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(diligenceChecklistsTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Checklist');
        return;
      }
      await logCapitalAudit('update', 'diligence_checklist', id, req.body);
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update checklist');
    }
  },
);

router.delete(
  '/capital/diligence-checklists/:id',
  validateBody(bodyShape({})),
  ...auth,
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db
        .delete(diligenceChecklistsTable)
        .where(eq(diligenceChecklistsTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Checklist');
        return;
      }
      await logCapitalAudit('delete', 'diligence_checklist', id, {});
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete checklist');
    }
  },
);

router.patch(
  '/capital/diligence-checklist-items/:id',
  ...auth,
  validateBody(
    bodyShape({
      completedAt: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const update = { ...req.body, updatedAt: new Date() };
      if (req.body.status === 'complete' && !req.body.completedAt) update.completedAt = new Date();
      const [row] = await db
        .update(diligenceChecklistItemsTable)
        .set(update)
        .where(eq(diligenceChecklistItemsTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Checklist item');
        return;
      }
      await logCapitalAudit('update', 'diligence_checklist_item', id, req.body);
      const all = await db
        .select()
        .from(diligenceChecklistItemsTable)
        .where(eq(diligenceChecklistItemsTable.checklistId, row.checklistId));
      const completedCount = all.filter((i) =>
        ['complete', 'waived', 'na'].includes(i.status),
      ).length;
      const pct = all.length ? Math.round((completedCount / all.length) * 100) : 0;
      await db
        .update(diligenceChecklistsTable)
        .set({ completionPct: pct, updatedAt: new Date() })
        .where(eq(diligenceChecklistsTable.id, row.checklistId));
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update checklist item');
    }
  },
);

router.delete(
  '/capital/diligence-checklist-items/:id',
  validateBody(bodyShape({})),
  ...auth,
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [row] = await db
        .delete(diligenceChecklistItemsTable)
        .where(eq(diligenceChecklistItemsTable.id, id))
        .returning();
      if (!row) {
        sendNotFound(res, 'Checklist item');
        return;
      }
      await logCapitalAudit('delete', 'diligence_checklist_item', id, {});
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete checklist item');
    }
  },
);

// ─── CAP TABLE ────────────────────────────────────────────────────────────────

router.get('/capital/cap-table', ...auth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(capTablePlaceholdersTable)
      .where(eq(capTablePlaceholdersTable.isActive, true))
      .orderBy(capTablePlaceholdersTable.sortOrder);
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get cap table');
  }
});

router.post('/capital/cap-table', ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(capTablePlaceholdersTable).values(req.body).returning();
    await logCapitalAudit('create', 'cap_table_placeholder', row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, 'Failed to create cap table entry');
  }
});

router.patch('/capital/cap-table/:id', ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db
      .update(capTablePlaceholdersTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(capTablePlaceholdersTable.id, id))
      .returning();
    if (!row) {
      sendNotFound(res, 'Cap table entry');
      return;
    }
    await logCapitalAudit('update', 'cap_table_placeholder', id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, 'Failed to update cap table entry');
  }
});

router.delete('/capital/cap-table/:id', validateBody(bodyShape({})), ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    await db
      .update(capTablePlaceholdersTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(capTablePlaceholdersTable.id, id));
    await logCapitalAudit('delete', 'cap_table_placeholder', id, {});
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete cap table entry');
  }
});

// ─── ON-DEMAND PACKET GENERATION ──────────────────────────────────────────────

router.post(
  '/capital/generate-lender-packet/:id',
  ...auth,
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [packet] = await db
        .select()
        .from(lenderPacketsTable)
        .where(eq(lenderPacketsTable.id, id));
      if (!packet) {
        sendNotFound(res, 'Lender packet');
        return;
      }
      const job = await durableJobQueue.enqueue(
        JOB_TYPES.LENDER_PACKET_GENERATE,
        { packetId: id, lenderType: packet.lenderType, title: packet.title },
        { maxRetries: 2 },
      );
      await logCapitalAudit('generate', 'lender_packet', id, {
        triggeredBy: 'on_demand',
        jobId: job.id,
      });
      sendSuccess(
        res,
        { queued: true, packetId: id, jobId: job.id, message: 'Lender packet generation queued' },
        202,
      );
    } catch (err) {
      handleRouteError(res, err, 'Failed to queue lender packet generation');
    }
  },
);

router.post(
  '/capital/generate-investor-packet/:id',
  ...auth,
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [packet] = await db
        .select()
        .from(investorPacketsTable)
        .where(eq(investorPacketsTable.id, id));
      if (!packet) {
        sendNotFound(res, 'Investor packet');
        return;
      }
      const job = await durableJobQueue.enqueue(
        JOB_TYPES.INVESTOR_PACKET_GENERATE,
        { packetId: id, investorType: packet.investorType, title: packet.title },
        { maxRetries: 2 },
      );
      await logCapitalAudit('generate', 'investor_packet', id, {
        triggeredBy: 'on_demand',
        jobId: job.id,
      });
      sendSuccess(
        res,
        { queued: true, packetId: id, jobId: job.id, message: 'Investor packet generation queued' },
        202,
      );
    } catch (err) {
      handleRouteError(res, err, 'Failed to queue investor packet generation');
    }
  },
);

// ─── DASHBOARD SUMMARY ────────────────────────────────────────────────────────

router.get('/capital/dashboard', ...auth, async (req, res) => {
  try {
    const [lenderPackets, investorPackets, milestones, models, checklists] = await Promise.all([
      db.select().from(lenderPacketsTable).orderBy(desc(lenderPacketsTable.updatedAt)),
      db.select().from(investorPacketsTable).orderBy(desc(investorPacketsTable.updatedAt)),
      db.select().from(fundraisingMilestonesTable).orderBy(fundraisingMilestonesTable.sortOrder),
      db.select().from(financialModelsTable).orderBy(desc(financialModelsTable.updatedAt)),
      db.select().from(diligenceChecklistsTable),
    ]);

    const bankReadiness = lenderPackets.length
      ? Math.round(
          lenderPackets.reduce((sum, p) => sum + p.completionPct, 0) / lenderPackets.length,
        )
      : 0;
    const angelReadiness = investorPackets.length
      ? Math.round(
          investorPackets.reduce((sum, p) => sum + p.completionPct, 0) / investorPackets.length,
        )
      : 0;

    const milestonesInProgress = milestones.filter((m) => m.status === 'in_progress').length;
    const milestonesCompleted = milestones.filter((m) => m.status === 'completed').length;

    sendSuccess(res, {
      bankReadiness,
      angelReadiness,
      lenderPacketCount: lenderPackets.length,
      investorPacketCount: investorPackets.length,
      activeLenderPacket: lenderPackets[0] ?? null,
      activeInvestorPacket: investorPackets[0] ?? null,
      milestonesTotal: milestones.length,
      milestonesCompleted,
      milestonesInProgress,
      financialModelCount: models.length,
      checklistCount: checklists.length,
      recentLenderPackets: lenderPackets.slice(0, 3),
      recentInvestorPackets: investorPackets.slice(0, 3),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load capital dashboard');
  }
});

export default router;
