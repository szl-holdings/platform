import {
  complianceControlEvidenceTable,
  complianceFrameworkControlsTable,
  db,
  disclosureRecipientsTable,
  disclosureRecordsTable,
  disclosureSubprocessorsTable,
  legalAgreementVersionsTable,
  legalAgreementsTable,
} from '@szl-holdings/db';
import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { validateBody, validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';
import { getUserOrgIds } from '../middlewares/tenant-scope';

const router: IRouter = Router();

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.string().optional(),
  type: z.string().optional(),
});

// ─── Disclosure Recipients ────────────────────────────────────────────────────

const CreateRecipientSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['subprocessor', 'controller', 'third_party', 'partner', 'regulator', 'other']),
  country: z.string().optional(),
  legalBasis: z.enum([
    'contract',
    'legal_obligation',
    'vital_interests',
    'public_task',
    'legitimate_interests',
    'consent',
    'other',
  ]),
  dataCategories: z.array(z.string()).default([]),
  purposeDescription: z.string().min(1),
  contactEmail: z.string().email().optional(),
  safeguards: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

router.get(
  '/disclosure/recipients',
  authMiddleware(),
  validateQuery(paginationSchema),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      if (orgIds !== null && orgIds.size === 0) {
        sendSuccess(res, { count: 0, items: [] });
        return;
      }
      const { limit, offset, status } = req.query as z.infer<typeof paginationSchema>;
      const conditions = [];
      if (orgIds !== null) conditions.push(inArray(disclosureRecipientsTable.orgId, [...orgIds]));
      if (status === 'approved') conditions.push(eq(disclosureRecipientsTable.isApproved, true));
      if (status === 'pending') conditions.push(eq(disclosureRecipientsTable.isApproved, false));

      const rows = await db
        .select()
        .from(disclosureRecipientsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(disclosureRecipientsTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, { count: rows.length, items: rows });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list disclosure recipients');
    }
  },
);

router.post(
  '/disclosure/recipients',
  authMiddleware({ required: true }),
  validateBody(CreateRecipientSchema),
  async (req, res) => {
    try {
      const body = req.body as z.infer<typeof CreateRecipientSchema>;
      const orgId = req.tenantOrgId ?? req.user?.orgs[0]?.orgId ?? null;
      if (!orgId) {
        sendBadRequest(res, 'Organization context required');
        return;
      }
      const [inserted] = await db
        .insert(disclosureRecipientsTable)
        .values({
          ...body,
          orgId,
          recipientId: genId('recip'),
          dataCategories: body.dataCategories,
          metadata: (body.metadata ?? {}) as Record<string, unknown>,
        })
        .returning();
      sendCreated(res, inserted);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create disclosure recipient');
    }
  },
);

router.patch(
  '/disclosure/recipients/:recipientId',
  authMiddleware({ required: true }),
  validateBody(CreateRecipientSchema.partial()),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      const { recipientId } = req.params as Record<string, string>;
      const body = req.body as Partial<z.infer<typeof CreateRecipientSchema>>;
      const conditions = [eq(disclosureRecipientsTable.recipientId, recipientId)];
      if (orgIds !== null) conditions.push(inArray(disclosureRecipientsTable.orgId, [...orgIds]));

      const [updated] = await db
        .update(disclosureRecipientsTable)
        .set({ ...body, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();
      if (!updated) {
        sendNotFound(res, 'Disclosure recipient');
        return;
      }
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update disclosure recipient');
    }
  },
);

router.post(
  '/disclosure/recipients/:recipientId/approve',
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      const { recipientId } = req.params as Record<string, string>;
      const approvedBy = req.user?.email ?? req.user?.id?.toString() ?? 'system';
      const conditions = [eq(disclosureRecipientsTable.recipientId, recipientId)];
      if (orgIds !== null) conditions.push(inArray(disclosureRecipientsTable.orgId, [...orgIds]));

      const [updated] = await db
        .update(disclosureRecipientsTable)
        .set({ isApproved: true, approvedAt: new Date(), approvedBy, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();
      if (!updated) {
        sendNotFound(res, 'Disclosure recipient');
        return;
      }
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to approve disclosure recipient');
    }
  },
);

router.post(
  '/disclosure/recipients/:recipientId/archive',
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      const { recipientId } = req.params as Record<string, string>;
      const conditions = [eq(disclosureRecipientsTable.recipientId, recipientId)];
      if (orgIds !== null) conditions.push(inArray(disclosureRecipientsTable.orgId, [...orgIds]));

      const [updated] = await db
        .update(disclosureRecipientsTable)
        .set({ archivedAt: new Date(), updatedAt: new Date() })
        .where(and(...conditions))
        .returning();
      if (!updated) {
        sendNotFound(res, 'Disclosure recipient');
        return;
      }
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to archive disclosure recipient');
    }
  },
);

// ─── Disclosure Records ───────────────────────────────────────────────────────

const CreateDisclosureRecordSchema = z.object({
  recipientId: z.string().min(1),
  agreementId: z.string().optional(),
  dataCategories: z.array(z.string()).default([]),
  legalBasis: z.enum([
    'contract',
    'legal_obligation',
    'vital_interests',
    'public_task',
    'legitimate_interests',
    'consent',
    'other',
  ]),
  purposeDescription: z.string().min(1),
  transferMechanism: z
    .enum([
      'standard_contractual_clauses',
      'adequacy_decision',
      'binding_corporate_rules',
      'derogation',
      'api_integration',
      'other',
    ])
    .optional(),
  effectiveAt: z.string().optional(),
  expiresAt: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

router.get(
  '/disclosure/records',
  authMiddleware(),
  validateQuery(paginationSchema),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      if (orgIds !== null && orgIds.size === 0) {
        sendSuccess(res, { count: 0, items: [] });
        return;
      }
      const { limit, offset, status } = req.query as z.infer<typeof paginationSchema>;
      const conditions = [];
      if (orgIds !== null) conditions.push(inArray(disclosureRecordsTable.orgId, [...orgIds]));
      if (status) conditions.push(eq(disclosureRecordsTable.status, status as never));

      const rows = await db
        .select()
        .from(disclosureRecordsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(disclosureRecordsTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, { count: rows.length, items: rows });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list disclosure records');
    }
  },
);

router.post(
  '/disclosure/records',
  authMiddleware({ required: true }),
  validateBody(CreateDisclosureRecordSchema),
  async (req, res) => {
    try {
      const body = req.body as z.infer<typeof CreateDisclosureRecordSchema>;
      const orgId = req.tenantOrgId ?? req.user?.orgs[0]?.orgId ?? null;
      if (!orgId) {
        sendBadRequest(res, 'Organization context required');
        return;
      }

      // Verify recipientId belongs to the caller's org (prevents cross-tenant IDOR).
      const [recipient] = await db
        .select({ orgId: disclosureRecipientsTable.orgId })
        .from(disclosureRecipientsTable)
        .where(
          and(
            eq(disclosureRecipientsTable.recipientId, body.recipientId),
            eq(disclosureRecipientsTable.orgId, orgId),
          ),
        )
        .limit(1);
      if (!recipient) {
        sendNotFound(res, 'Disclosure recipient');
        return;
      }

      // Verify agreementId belongs to the caller's org if provided.
      if (body.agreementId) {
        const [agreement] = await db
          .select({ orgId: legalAgreementsTable.orgId })
          .from(legalAgreementsTable)
          .where(
            and(
              eq(legalAgreementsTable.agreementId, body.agreementId),
              eq(legalAgreementsTable.orgId, orgId),
            ),
          )
          .limit(1);
        if (!agreement) {
          sendNotFound(res, 'Legal agreement');
          return;
        }
      }

      const [inserted] = await db
        .insert(disclosureRecordsTable)
        .values({
          ...body,
          orgId,
          disclosureId: genId('disc'),
          dataCategories: body.dataCategories,
          effectiveAt: body.effectiveAt ? new Date(body.effectiveAt) : null,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
          metadata: (body.metadata ?? {}) as Record<string, unknown>,
        })
        .returning();

      try {
        const { logDisclosureEvent } = await import('@szl-holdings/evidence-ledger');
        logDisclosureEvent({
          disclosureId: inserted.disclosureId,
          recipientName: body.recipientId,
          action: 'created',
          legalBasis: body.legalBasis,
          dataCategories: body.dataCategories,
          agreementId: body.agreementId,
          audit: {
            traceId: `trace-${inserted.disclosureId}`,
            orgId: String(orgId),
          },
        });
      } catch { /* non-fatal — ledger append failure does not block creation */ }

      sendCreated(res, inserted);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create disclosure record');
    }
  },
);

router.patch(
  '/disclosure/records/:disclosureId',
  authMiddleware({ required: true }),
  validateBody(
    z.object({
      purposeDescription: z.string().min(1).optional(),
      dataCategories: z.array(z.string()).optional(),
      transferMechanism: z
        .enum([
          'standard_contractual_clauses',
          'adequacy_decision',
          'binding_corporate_rules',
          'derogation',
          'api_integration',
          'other',
        ])
        .optional(),
      effectiveAt: z.string().optional(),
      expiresAt: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    }),
  ),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      const { disclosureId } = req.params as Record<string, string>;
      const body = req.body as {
        purposeDescription?: string;
        dataCategories?: string[];
        transferMechanism?: string;
        effectiveAt?: string;
        expiresAt?: string;
        metadata?: Record<string, unknown>;
      };
      const conditions = [eq(disclosureRecordsTable.disclosureId, disclosureId)];
      if (orgIds !== null) conditions.push(inArray(disclosureRecordsTable.orgId, [...orgIds]));

      const setFields: Record<string, unknown> = { updatedAt: new Date() };
      if (body.purposeDescription !== undefined) setFields.purposeDescription = body.purposeDescription;
      if (body.dataCategories !== undefined) setFields.dataCategories = body.dataCategories;
      if (body.transferMechanism !== undefined) setFields.transferMechanism = body.transferMechanism;
      if (body.effectiveAt !== undefined) setFields.effectiveAt = new Date(body.effectiveAt);
      if (body.expiresAt !== undefined) setFields.expiresAt = new Date(body.expiresAt);
      if (body.metadata !== undefined) setFields.metadata = body.metadata;

      const [updated] = await db
        .update(disclosureRecordsTable)
        .set(setFields as never)
        .where(and(...conditions))
        .returning();
      if (!updated) {
        sendNotFound(res, 'Disclosure record');
        return;
      }
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update disclosure record');
    }
  },
);

router.patch(
  '/disclosure/records/:disclosureId/status',
  authMiddleware({ required: true }),
  validateBody(z.object({ status: z.enum(['active', 'pending_approval', 'approved', 'expired', 'terminated', 'archived']), reason: z.string().optional() })),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      const { disclosureId } = req.params as Record<string, string>;
      const { status, reason } = req.body as { status: string; reason?: string };
      const conditions = [eq(disclosureRecordsTable.disclosureId, disclosureId)];
      if (orgIds !== null) conditions.push(inArray(disclosureRecordsTable.orgId, [...orgIds]));

      const [current] = await db
        .select()
        .from(disclosureRecordsTable)
        .where(and(...conditions))
        .limit(1);

      if (!current) {
        sendNotFound(res, 'Disclosure record');
        return;
      }

      const [updated] = await db
        .update(disclosureRecordsTable)
        .set({ status: status as never, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();

      try {
        const { logDisclosureEvent } = await import('@szl-holdings/evidence-ledger');
        logDisclosureEvent({
          disclosureId,
          recipientName: current.recipientId,
          action: (
            status === 'terminated' ? 'terminated'
            : status === 'archived' ? 'archived'
            : status === 'approved' ? 'approved'
            : status === 'expired' ? 'expired'
            : 'updated'
          ) as 'approved' | 'updated' | 'expired' | 'terminated' | 'archived',
          legalBasis: current.legalBasis,
          dataCategories: (current.dataCategories as string[]) ?? [],
          agreementId: current.agreementId ?? undefined,
          audit: {
            traceId: `trace-${disclosureId}-${status}`,
            orgId: current.orgId?.toString() ?? '',
            notes: reason,
          },
        });
      } catch { /* non-fatal */ }

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update disclosure record status');
    }
  },
);

router.post(
  '/disclosure/records/:disclosureId/archive',
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      const { disclosureId } = req.params as Record<string, string>;
      const conditions = [eq(disclosureRecordsTable.disclosureId, disclosureId)];
      if (orgIds !== null) conditions.push(inArray(disclosureRecordsTable.orgId, [...orgIds]));

      const [current] = await db.select().from(disclosureRecordsTable).where(and(...conditions)).limit(1);
      if (!current) {
        sendNotFound(res, 'Disclosure record');
        return;
      }

      const [updated] = await db
        .update(disclosureRecordsTable)
        .set({ status: 'archived', updatedAt: new Date() })
        .where(and(...conditions))
        .returning();

      try {
        const { logDisclosureEvent } = await import('@szl-holdings/evidence-ledger');
        logDisclosureEvent({
          disclosureId,
          recipientName: current.recipientId,
          action: 'archived',
          legalBasis: current.legalBasis,
          dataCategories: (current.dataCategories as string[]) ?? [],
          audit: { traceId: `trace-${disclosureId}-archive`, orgId: current.orgId?.toString() ?? '' },
        });
      } catch { /* non-fatal */ }

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to archive disclosure record');
    }
  },
);

// ─── Subprocessors ────────────────────────────────────────────────────────────

const CreateSubprocessorSchema = z.object({
  name: z.string().min(1),
  country: z.string().min(1),
  serviceDescription: z.string().min(1),
  dataCategories: z.array(z.string()).default([]),
  dpaReference: z.string().optional(),
  certifications: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

router.get(
  '/disclosure/subprocessors',
  authMiddleware(),
  validateQuery(paginationSchema),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      if (orgIds !== null && orgIds.size === 0) {
        sendSuccess(res, { count: 0, items: [] });
        return;
      }
      const { limit, offset, status } = req.query as z.infer<typeof paginationSchema>;
      const conditions = [];
      if (orgIds !== null) conditions.push(inArray(disclosureSubprocessorsTable.orgId, [...orgIds]));
      if (status) conditions.push(eq(disclosureSubprocessorsTable.status, status as never));

      const rows = await db
        .select()
        .from(disclosureSubprocessorsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(disclosureSubprocessorsTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, { count: rows.length, items: rows });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list subprocessors');
    }
  },
);

router.post(
  '/disclosure/subprocessors',
  authMiddleware({ required: true }),
  validateBody(CreateSubprocessorSchema),
  async (req, res) => {
    try {
      const body = req.body as z.infer<typeof CreateSubprocessorSchema>;
      const orgId = req.tenantOrgId ?? req.user?.orgs[0]?.orgId ?? null;
      if (!orgId) {
        sendBadRequest(res, 'Organization context required');
        return;
      }
      const [inserted] = await db
        .insert(disclosureSubprocessorsTable)
        .values({
          ...body,
          orgId,
          subprocessorId: genId('sp'),
          dataCategories: body.dataCategories,
          certifications: body.certifications,
          metadata: (body.metadata ?? {}) as Record<string, unknown>,
        })
        .returning();

      try {
        const { logSubprocessorChange } = await import('@szl-holdings/evidence-ledger');
        logSubprocessorChange({
          subprocessorId: inserted.subprocessorId,
          subprocessorName: inserted.name,
          country: inserted.country,
          action: 'added',
          newStatus: inserted.status,
          dataCategories: body.dataCategories,
          audit: { traceId: `trace-${inserted.subprocessorId}`, orgId: String(orgId) },
        });
      } catch { /* non-fatal */ }

      sendCreated(res, inserted);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create subprocessor');
    }
  },
);

router.patch(
  '/disclosure/subprocessors/:subprocessorId/status',
  authMiddleware({ required: true }),
  validateBody(z.object({ status: z.enum(['active', 'pending', 'removed', 'under_review']) })),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      const { subprocessorId } = req.params as Record<string, string>;
      const { status } = req.body as { status: string };
      const conditions = [eq(disclosureSubprocessorsTable.subprocessorId, subprocessorId)];
      if (orgIds !== null) conditions.push(inArray(disclosureSubprocessorsTable.orgId, [...orgIds]));

      const [current] = await db
        .select()
        .from(disclosureSubprocessorsTable)
        .where(and(...conditions))
        .limit(1);

      if (!current) {
        sendNotFound(res, 'Subprocessor');
        return;
      }

      const [updated] = await db
        .update(disclosureSubprocessorsTable)
        .set({
          status: status as never,
          removedAt: status === 'removed' ? new Date() : current.removedAt,
          updatedAt: new Date(),
        })
        .where(and(...conditions))
        .returning();

      try {
        const { logSubprocessorChange } = await import('@szl-holdings/evidence-ledger');
        logSubprocessorChange({
          subprocessorId: current.subprocessorId,
          subprocessorName: current.name,
          country: current.country,
          action: 'status_changed',
          previousStatus: current.status,
          newStatus: status,
          dataCategories: (current.dataCategories as string[]) ?? [],
          audit: { traceId: `trace-${subprocessorId}-status`, orgId: current.orgId?.toString() },
        });
      } catch { /* non-fatal */ }

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update subprocessor status');
    }
  },
);

router.patch(
  '/disclosure/subprocessors/:subprocessorId',
  authMiddleware({ required: true }),
  validateBody(
    z.object({
      name: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
      serviceDescription: z.string().min(1).optional(),
      dataCategories: z.array(z.string()).optional(),
      dpaReference: z.string().optional(),
      certifications: z.array(z.string()).optional(),
      metadata: z.record(z.unknown()).optional(),
    }),
  ),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      const { subprocessorId } = req.params as Record<string, string>;
      const body = req.body as {
        name?: string; country?: string; serviceDescription?: string;
        dataCategories?: string[]; dpaReference?: string;
        certifications?: string[]; metadata?: Record<string, unknown>;
      };
      const conditions = [eq(disclosureSubprocessorsTable.subprocessorId, subprocessorId)];
      if (orgIds !== null) conditions.push(inArray(disclosureSubprocessorsTable.orgId, [...orgIds]));

      const setFields: Record<string, unknown> = { updatedAt: new Date() };
      if (body.name !== undefined) setFields.name = body.name;
      if (body.country !== undefined) setFields.country = body.country;
      if (body.serviceDescription !== undefined) setFields.serviceDescription = body.serviceDescription;
      if (body.dataCategories !== undefined) setFields.dataCategories = body.dataCategories;
      if (body.dpaReference !== undefined) setFields.dpaReference = body.dpaReference;
      if (body.certifications !== undefined) setFields.certifications = body.certifications;
      if (body.metadata !== undefined) setFields.metadata = body.metadata;

      const [updated] = await db
        .update(disclosureSubprocessorsTable)
        .set(setFields as never)
        .where(and(...conditions))
        .returning();
      if (!updated) {
        sendNotFound(res, 'Subprocessor');
        return;
      }
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update subprocessor');
    }
  },
);

// ─── Legal Agreements ─────────────────────────────────────────────────────────

const CreateAgreementSchema = z.object({
  agreementType: z.enum(['msa', 'dpa', 'nda', 'sla', 'addendum', 'other']),
  counterpartyName: z.string().min(1),
  counterpartyEmail: z.string().email().optional(),
  version: z.string().default('1.0'),
  linkedMatterId: z.string().optional(),
  linkedRecipientId: z.string().optional(),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

const AgreementStatusTransitionSchema = z.object({
  status: z.enum(['draft', 'sent', 'under_review', 'countersigned', 'active', 'expired', 'terminated']),
  reason: z.string().optional(),
});

router.get(
  '/disclosure/agreements',
  authMiddleware(),
  validateQuery(paginationSchema),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      if (orgIds !== null && orgIds.size === 0) {
        sendSuccess(res, { count: 0, items: [] });
        return;
      }
      const { limit, offset, status, type } = req.query as z.infer<typeof paginationSchema>;
      const conditions = [];
      if (orgIds !== null) conditions.push(inArray(legalAgreementsTable.orgId, [...orgIds]));
      if (status) conditions.push(eq(legalAgreementsTable.status, status as never));
      if (type) conditions.push(eq(legalAgreementsTable.agreementType, type as never));

      const rows = await db
        .select()
        .from(legalAgreementsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(legalAgreementsTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, { count: rows.length, items: rows });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list legal agreements');
    }
  },
);

router.get(
  '/disclosure/agreements/:agreementId',
  authMiddleware(),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      const { agreementId } = req.params as Record<string, string>;
      const conditions = [eq(legalAgreementsTable.agreementId, agreementId)];
      if (orgIds !== null) conditions.push(inArray(legalAgreementsTable.orgId, [...orgIds]));

      const [agreement] = await db
        .select()
        .from(legalAgreementsTable)
        .where(and(...conditions))
        .limit(1);

      if (!agreement) {
        sendNotFound(res, 'Legal agreement');
        return;
      }

      const versions = await db
        .select()
        .from(legalAgreementVersionsTable)
        .where(eq(legalAgreementVersionsTable.agreementId, agreementId))
        .orderBy(desc(legalAgreementVersionsTable.createdAt));

      sendSuccess(res, { ...agreement, versions });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get legal agreement');
    }
  },
);

router.post(
  '/disclosure/agreements',
  authMiddleware({ required: true }),
  validateBody(CreateAgreementSchema),
  async (req, res) => {
    try {
      const body = req.body as z.infer<typeof CreateAgreementSchema>;
      const orgId = req.tenantOrgId ?? req.user?.orgs[0]?.orgId ?? null;
      if (!orgId) {
        sendBadRequest(res, 'Organization context required');
        return;
      }
      const agreementId = genId('agr');
      const [inserted] = await db
        .insert(legalAgreementsTable)
        .values({
          ...body,
          orgId,
          agreementId,
          effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
          tags: body.tags,
          metadata: (body.metadata ?? {}) as Record<string, unknown>,
        })
        .returning();

      await db.insert(legalAgreementVersionsTable).values({
        agreementId,
        orgId,
        version: body.version,
        changeDescription: 'Initial draft',
        authoredBy: req.user?.email ?? req.user?.id?.toString(),
        status: 'draft',
      });

      try {
        const { logAgreementEvent } = await import('@szl-holdings/evidence-ledger');
        logAgreementEvent({
          agreementId,
          agreementType: body.agreementType,
          counterpartyName: body.counterpartyName,
          action: 'created',
          newStatus: 'draft',
          audit: { traceId: `trace-${agreementId}`, orgId: String(orgId) },
        });
      } catch { /* non-fatal */ }

      sendCreated(res, inserted);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create legal agreement');
    }
  },
);

router.patch(
  '/disclosure/agreements/:agreementId/status',
  authMiddleware({ required: true }),
  validateBody(AgreementStatusTransitionSchema),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      const { agreementId } = req.params as Record<string, string>;
      const { status } = req.body as z.infer<typeof AgreementStatusTransitionSchema>;
      const conditions = [eq(legalAgreementsTable.agreementId, agreementId)];
      if (orgIds !== null) conditions.push(inArray(legalAgreementsTable.orgId, [...orgIds]));

      const [current] = await db
        .select()
        .from(legalAgreementsTable)
        .where(and(...conditions))
        .limit(1);

      if (!current) {
        sendNotFound(res, 'Legal agreement');
        return;
      }

      const timestampFields: Record<string, Date | null> = {};
      if (status === 'sent') timestampFields.sentAt = new Date();
      if (status === 'countersigned') timestampFields.countersignedAt = new Date();
      if (status === 'terminated') timestampFields.terminatedAt = new Date();
      if (status === 'expired') timestampFields.terminatedAt = null;

      const [updated] = await db
        .update(legalAgreementsTable)
        .set({ status, ...timestampFields, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();

      // Append a version snapshot every time the agreement transitions state.
      try {
        await db.insert(legalAgreementVersionsTable).values({
          agreementId,
          orgId: current.orgId,
          version: current.version,
          changeDescription: `Status transitioned from '${current.status}' to '${status}'`,
          contentHash: current.contentHash ?? undefined,
          authoredBy: req.user?.id?.toString(),
          status: 'superseded',
        });
      } catch { /* non-fatal — version snapshot failure does not block the transition */ }

      try {
        const { logAgreementEvent } = await import('@szl-holdings/evidence-ledger');
        const actionMap: Record<string, Parameters<typeof logAgreementEvent>[0]['action']> = {
          sent: 'sent', countersigned: 'countersigned', active: 'activated',
          expired: 'expired', terminated: 'terminated',
        };
        logAgreementEvent({
          agreementId,
          agreementType: current.agreementType,
          counterpartyName: current.counterpartyName,
          action: actionMap[status] ?? 'amended',
          previousStatus: current.status,
          newStatus: status,
          audit: { traceId: `trace-${agreementId}-${status}`, orgId: current.orgId?.toString() },
        });
      } catch { /* non-fatal */ }

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update agreement status');
    }
  },
);

// ─── Compliance Framework Controls ───────────────────────────────────────────

router.get(
  '/disclosure/compliance-controls',
  authMiddleware(),
  validateQuery(paginationSchema.extend({ framework: z.string().optional() })),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      const { limit, offset, framework } = req.query as z.infer<typeof paginationSchema> & { framework?: string };

      const conditions = [];
      if (framework) conditions.push(eq(complianceFrameworkControlsTable.framework, framework as never));

      // For scoped users: return org-specific controls AND platform-wide controls (orgId IS NULL).
      // Elevated users (null orgIds) see everything with no filter.
      if (orgIds !== null) {
        if (orgIds.size > 0) {
          conditions.push(
            or(
              inArray(complianceFrameworkControlsTable.orgId, [...orgIds]),
              isNull(complianceFrameworkControlsTable.orgId),
            )!,
          );
        } else {
          // User has no org membership — show only platform-wide controls.
          conditions.push(isNull(complianceFrameworkControlsTable.orgId));
        }
      }

      const controls = await db
        .select()
        .from(complianceFrameworkControlsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(complianceFrameworkControlsTable.framework, complianceFrameworkControlsTable.controlRef)
        .limit(limit)
        .offset(offset);

      // For evidence: match on org-specific rows first, then fall back to global (orgId IS NULL).
      // Three cases for org scoping:
      //   elevated (orgIds=null) → no org filter, all rows visible
      //   org user (orgIds.size>0) → org rows + global (orgId IS NULL) rows
      //   no-org user (orgIds.size=0) → global (orgId IS NULL) rows only (never expose other orgs)
      let evidenceOrgCondition: ReturnType<typeof isNull> | ReturnType<typeof or> | undefined;
      if (orgIds !== null) {
        if (orgIds.size > 0) {
          evidenceOrgCondition = or(
            inArray(complianceControlEvidenceTable.orgId, [...orgIds]),
            isNull(complianceControlEvidenceTable.orgId),
          );
        } else {
          evidenceOrgCondition = isNull(complianceControlEvidenceTable.orgId);
        }
      }

      const evidenceRows = controls.length > 0
        ? await db
            .select()
            .from(complianceControlEvidenceTable)
            .where(
              and(
                inArray(
                  complianceControlEvidenceTable.controlId,
                  controls.map((c) => c.controlId),
                ),
                evidenceOrgCondition,
              ),
            )
        : [];

      // Build a precedence map: org-specific rows win over platform-wide (orgId IS NULL) rows.
      // Sort so org-specific rows (non-null orgId) come first, then global rows as fallback.
      const sortedEvidence = [...evidenceRows].sort((a, b) => {
        if (a.orgId !== null && b.orgId === null) return -1;
        if (a.orgId === null && b.orgId !== null) return 1;
        return 0;
      });
      const evidenceByControlId = new Map(sortedEvidence.map((e) => [e.controlId, e]));

      const enriched = controls.map((control) => {
        const evidence = evidenceByControlId.get(control.controlId);
        const now = Date.now();
        const thresholdMs = control.freshnessThresholdDays * 24 * 60 * 60 * 1000;
        const lastAt = evidence?.lastEvidenceAt ?? evidence?.lastAssessedAt;
        const isStale = lastAt ? now - lastAt.getTime() > thresholdMs : true;
        return {
          ...control,
          evidenceStatus: evidence?.evidenceStatus ?? 'gap',
          lastEvidenceAt: evidence?.lastEvidenceAt?.toISOString() ?? null,
          lastAssessedAt: evidence?.lastAssessedAt?.toISOString() ?? null,
          isStale,
        };
      });

      sendSuccess(res, { count: enriched.length, items: enriched });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list compliance controls');
    }
  },
);

router.patch(
  '/disclosure/compliance-controls/:controlId/evidence',
  authMiddleware({ required: true }),
  validateBody(
    z.object({
      evidenceStatus: z.enum(['fresh', 'stale', 'gap']),
      evidenceRef: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
  async (req, res) => {
    try {
      // Use getUserOrgIds so membership is checked the same way as every other route.
      const orgIds = getUserOrgIds(req.user!);
      const orgId = req.tenantOrgId ?? req.user?.orgs[0]?.orgId ?? null;

      // Evidence writes always require a resolved org — never allow implicit global writes.
      if (!orgId || (orgIds !== null && orgIds.size === 0)) {
        sendBadRequest(res, 'Organization context required');
        return;
      }
      // If the caller has a constrained org set, orgId must be in it.
      if (orgIds !== null && !orgIds.has(orgId)) {
        sendBadRequest(res, 'Organization context required');
        return;
      }

      const { controlId } = req.params as Record<string, string>;
      const { evidenceStatus, evidenceRef, notes } = req.body as {
        evidenceStatus: 'fresh' | 'stale' | 'gap';
        evidenceRef?: string;
        notes?: string;
      };

      // Only match org-specific evidence rows — never update global platform rows.
      const existing = await db
        .select()
        .from(complianceControlEvidenceTable)
        .where(
          and(
            eq(complianceControlEvidenceTable.controlId, controlId),
            eq(complianceControlEvidenceTable.orgId, orgId),
          ),
        )
        .limit(1);

      const now = new Date();
      if (existing.length > 0) {
        const [updated] = await db
          .update(complianceControlEvidenceTable)
          .set({
            evidenceStatus,
            evidenceRef: evidenceRef ?? existing[0].evidenceRef,
            notes: notes ?? existing[0].notes,
            lastEvidenceAt: evidenceStatus === 'fresh' ? now : existing[0].lastEvidenceAt,
            lastAssessedAt: now,
            isStale: evidenceStatus === 'stale',
            updatedAt: now,
          })
          .where(eq(complianceControlEvidenceTable.id, existing[0].id))
          .returning();
        sendSuccess(res, updated);
      } else {
        const [inserted] = await db
          .insert(complianceControlEvidenceTable)
          .values({
            orgId: orgId ?? undefined,
            controlId,
            evidenceStatus,
            evidenceRef: evidenceRef ?? null,
            notes: notes ?? null,
            lastEvidenceAt: evidenceStatus === 'fresh' ? now : null,
            lastAssessedAt: now,
            isStale: evidenceStatus === 'stale',
          })
          .returning();
        sendCreated(res, inserted);
      }
    } catch (err) {
      handleRouteError(res, err, 'Failed to update control evidence');
    }
  },
);

export default router;
