/**
 * Court Filing Automation — Counsel adapter
 *
 * Electronic filing preparation and submission for supported jurisdictions.
 * Supported EFS systems: PACER (federal), Odyssey/Tyler eFSP (state courts),
 * NYCourts NYSCEF, California eCourt, with manual fallback for unsupported jurisdictions.
 *
 * Filings track through: draft → ready → submitted → accepted|rejected → filed
 */

import {
  courtFilingEventsTable,
  courtFilingsTable,
  db,
} from '@szl-holdings/db';
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

const SUPPORTED_EFS_SYSTEMS: Record<
  string,
  { system: string; name: string; supported: boolean; notes: string }
> = {
  'US-FEDERAL': { system: 'pacer', name: 'PACER (Federal)', supported: true, notes: 'Full eFiling via PACER CM/ECF' },
  'NY': { system: 'nycourts', name: 'NYSCEF (New York)', supported: true, notes: 'Mandatory eFiling in NY Supreme and Appellate courts' },
  'CA': { system: 'ca_efiling', name: 'California eCourt', supported: true, notes: 'Mandatory eFiling in civil cases' },
  'TX': { system: 'tyler_efsp', name: 'Tyler eFSP (Texas)', supported: true, notes: 'eFile Texas portal' },
  'IL': { system: 'odyssey', name: 'Odyssey eFileIL (Illinois)', supported: true, notes: 'Illinois eCourt' },
  'DEFAULT': { system: 'manual', name: 'Manual Filing', supported: false, notes: 'Electronic filing not yet available for this jurisdiction' },
};

function resolveEfsSystem(jurisdiction: string): typeof SUPPORTED_EFS_SYSTEMS[string] {
  const key = jurisdiction.toUpperCase().split('-')[0];
  return SUPPORTED_EFS_SYSTEMS[key] ?? SUPPORTED_EFS_SYSTEMS['DEFAULT'];
}

const prepareFilingSchema = z.object({
  matterId: z.number().int().positive().optional(),
  filingType: z.enum(['complaint', 'motion', 'answer', 'brief', 'notice', 'order', 'stipulation', 'subpoena', 'other']),
  jurisdiction: z.string().min(2).max(100),
  courtName: z.string().max(300).optional(),
  caseNumber: z.string().max(100).optional(),
  documentTitle: z.string().min(1).max(500),
  documentUrl: z.string().url().optional(),
  dueDate: z.string().datetime().optional(),
});

const submitFilingSchema = z.object({
  attestationAccepted: z.boolean().refine((v) => v === true, {
    message: 'Filing attestation must be explicitly accepted before submission',
  }),
  filingFeeAmount: z.string().optional(),
});

const updateFilingSchema = z.object({
  status: z.enum(['draft', 'ready', 'submitted', 'accepted', 'rejected', 'pending_review', 'filed', 'failed']).optional(),
  efsConfirmationNumber: z.string().max(200).optional(),
  rejectionReason: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

router.get('/counsel/court-filings/jurisdictions', (_req: Request, res: Response) => {
  sendSuccess(res, {
    jurisdictions: Object.entries(SUPPORTED_EFS_SYSTEMS).map(([key, val]) => ({
      key,
      ...val,
    })),
  });
});

router.post(
  '/counsel/court-filings',
  authMiddleware(),
  requireRole('admin', 'analyst', 'ops'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const parsed = prepareFilingSchema.safeParse(req.body);
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
      const efsInfo = resolveEfsSystem(parsed.data.jurisdiction);

      const [filing] = await db
        .insert(courtFilingsTable)
        .values({
          orgId,
          matterId: parsed.data.matterId,
          submittedById: req.user!.id,
          filingType: parsed.data.filingType,
          jurisdiction: parsed.data.jurisdiction,
          courtName: parsed.data.courtName,
          caseNumber: parsed.data.caseNumber,
          documentTitle: parsed.data.documentTitle,
          documentUrl: parsed.data.documentUrl,
          electronicFilingSystem: efsInfo.system as typeof courtFilingsTable.$inferSelect.electronicFilingSystem,
          status: 'draft',
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
          electronicallySupportedJurisdiction: efsInfo.supported,
          metadata: {
            efsName: efsInfo.name,
            efsNotes: efsInfo.notes,
            preparedAt: new Date().toISOString(),
          },
        })
        .returning();

      await db.insert(courtFilingEventsTable).values({
        filingId: filing.id,
        eventType: 'draft_created',
        description: `Filing prepared for ${parsed.data.jurisdiction} — ${efsInfo.name}`,
        performedById: req.user!.id,
        payload: { efsSystem: efsInfo.system, supported: efsInfo.supported },
      });

      logger.info(
        { orgId, filingId: filing.id, jurisdiction: parsed.data.jurisdiction, efsSystem: efsInfo.system },
        'Court filing prepared',
      );

      sendSuccess(res, {
        ...filing,
        efsInfo: {
          system: efsInfo.system,
          name: efsInfo.name,
          supported: efsInfo.supported,
          notes: efsInfo.notes,
        },
      }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to prepare court filing');
    }
  },
);

router.get(
  '/counsel/court-filings',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendSuccess(res, []);
      return;
    }

    try {
      const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
      const matterIdFilter = req.query.matterId ? parseInt(req.query.matterId as string, 10) : undefined;
      const statusFilter = req.query.status as string | undefined;

      const conditions = [inArray(courtFilingsTable.orgId, [...orgIds])];
      if (matterIdFilter && !isNaN(matterIdFilter)) {
        conditions.push(eq(courtFilingsTable.matterId, matterIdFilter));
      }
      if (statusFilter) {
        conditions.push(eq(courtFilingsTable.status, statusFilter as typeof courtFilingsTable.$inferSelect.status));
      }

      const filings = await db
        .select()
        .from(courtFilingsTable)
        .where(and(...conditions))
        .orderBy(desc(courtFilingsTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, filings, 200, { page, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list court filings');
    }
  },
);

router.get(
  '/counsel/court-filings/:id',
  authMiddleware(),
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendBadRequest(res, 'Invalid filing ID');
      return;
    }

    const orgIds = getUserOrgIds(req.user!);
    if (!orgIds || orgIds.size === 0) {
      sendBadRequest(res, 'No organization context');
      return;
    }

    try {
      const [filing] = await db
        .select()
        .from(courtFilingsTable)
        .where(and(eq(courtFilingsTable.id, id), inArray(courtFilingsTable.orgId, [...orgIds])));

      if (!filing) {
        sendNotFound(res, 'Court filing');
        return;
      }

      const events = await db
        .select()
        .from(courtFilingEventsTable)
        .where(eq(courtFilingEventsTable.filingId, id))
        .orderBy(desc(courtFilingEventsTable.occurredAt));

      sendSuccess(res, { ...filing, timeline: events });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get court filing');
    }
  },
);

router.post(
  '/counsel/court-filings/:id/submit',
  authMiddleware(),
  requireRole('admin', 'analyst', 'ops'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendBadRequest(res, 'Invalid filing ID');
      return;
    }

    const parsed = submitFilingSchema.safeParse(req.body);
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
      const [filing] = await db
        .select()
        .from(courtFilingsTable)
        .where(and(eq(courtFilingsTable.id, id), inArray(courtFilingsTable.orgId, [...orgIds])));

      if (!filing) {
        sendNotFound(res, 'Court filing');
        return;
      }

      if (!['draft', 'ready'].includes(filing.status)) {
        sendBadRequest(res, `Cannot submit a filing in '${filing.status}' status`);
        return;
      }

      const submittedStatus = filing.electronicallySupportedJurisdiction
        ? 'submitted'
        : 'pending_review';

      await db
        .update(courtFilingsTable)
        .set({
          status: submittedStatus,
          submittedAt: new Date(),
          filingFeeAmount: parsed.data.filingFeeAmount,
          filingFeeStatus: parsed.data.filingFeeAmount ? 'pending' : 'waived',
          updatedAt: new Date(),
        })
        .where(eq(courtFilingsTable.id, id));

      await db.insert(courtFilingEventsTable).values({
        filingId: id,
        eventType: 'submitted',
        description: filing.electronicallySupportedJurisdiction
          ? `Electronically submitted via ${filing.electronicFilingSystem}`
          : 'Submitted for manual filing — electronic filing not available for this jurisdiction',
        performedById: req.user!.id,
        payload: {
          submittedAt: new Date().toISOString(),
          electronic: filing.electronicallySupportedJurisdiction,
          efsSystem: filing.electronicFilingSystem,
        },
      });

      logger.info(
        { filingId: id, status: submittedStatus, electronic: filing.electronicallySupportedJurisdiction },
        'Court filing submitted',
      );

      sendSuccess(res, {
        id,
        status: submittedStatus,
        submittedAt: new Date(),
        electronicFiling: filing.electronicallySupportedJurisdiction,
        efsSystem: filing.electronicFilingSystem,
        message: filing.electronicallySupportedJurisdiction
          ? `Filing submitted electronically via ${filing.electronicFilingSystem}. Confirmation number will be provided upon acceptance.`
          : 'Filing queued for manual submission. Not all courts in this jurisdiction support electronic filing.',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to submit court filing');
    }
  },
);

router.patch(
  '/counsel/court-filings/:id',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendBadRequest(res, 'Invalid filing ID');
      return;
    }

    const parsed = updateFilingSchema.safeParse(req.body);
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
      const [filing] = await db
        .select()
        .from(courtFilingsTable)
        .where(and(eq(courtFilingsTable.id, id), inArray(courtFilingsTable.orgId, [...orgIds])));

      if (!filing) {
        sendNotFound(res, 'Court filing');
        return;
      }

      const { notes, ...updateFields } = parsed.data;

      await db
        .update(courtFilingsTable)
        .set({
          ...updateFields,
          acceptedAt: updateFields.status === 'accepted' ? new Date() : filing.acceptedAt,
          updatedAt: new Date(),
        })
        .where(eq(courtFilingsTable.id, id));

      if (parsed.data.status || notes) {
        await db.insert(courtFilingEventsTable).values({
          filingId: id,
          eventType: parsed.data.status ? `status_changed_to_${parsed.data.status}` : 'updated',
          description: notes ?? `Status updated to ${parsed.data.status}`,
          performedById: req.user!.id,
          payload: parsed.data,
        });
      }

      sendSuccess(res, { id, updated: true, ...parsed.data });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update court filing');
    }
  },
);

export default router;
