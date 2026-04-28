import {
  db,
  terraConstructionProjectsTable,
  terraExchanges1031Table,
  terraLeasesTable,
  terraProFormaProjectsTable,
  terraTaxAppealsTable,
  terraTenantApplicationsTable,
  terraWaterfallStructuresTable,
} from '@szl-holdings/db';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, isNull, ne, or } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import mammoth from 'mammoth';
import multer from 'multer';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendSuccess,
  sendUnauthorized,
} from '../lib/api-response';
import {
  terraResourceDeleteSchema,
  terraResourceMutationSchema,
  validateBody,
} from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const authRead = authMiddleware({ required: true });
const authWrite = authMiddleware({ required: true });

const SESSION_PROJECT_NAME = '__szl_scenario_session__';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt', '.doc'];
    const ext = `.${(file.originalname.split('.').pop() ?? '').toLowerCase()}`;
    cb(null, allowed.includes(ext));
  },
});

// ---------------------------------------------------------------------------
// Tenant Screening Provider Abstraction
// ---------------------------------------------------------------------------

import {
  type ScreeningProvider,
  type ScreeningProviderInput,
  type ScreeningProviderResult,
  MockScreeningProvider,
  EquifaxScreeningProvider,
  getScreeningProvider,
} from '../services/terra/screening-provider';
import { extractLeaseFromText } from '../lib/lease-extractor';

router.get('/terra/leases', authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await db
      .select()
      .from(terraLeasesTable)
      .where(
        userId != null
          ? or(eq(terraLeasesTable.ownerUserId, userId), isNull(terraLeasesTable.ownerUserId))
          : isNull(terraLeasesTable.ownerUserId),
      )
      .orderBy(desc(terraLeasesTable.createdAt));
    sendSuccess(res, {
      count: rows.length,
      leases: rows.map(rowToLease),
      dataMode: rows.length > 0 ? 'live' : 'empty',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch leases');
  }
});

const LeaseCreateSchema = z.object({
  documentName: z.string().min(1),
  tenant: z.string().min(1),
  premises: z.string().optional(),
  propertyAddress: z.string().optional(),
  leaseType: z.string().optional(),
  commencementDate: z.string().optional(),
  expirationDate: z.string().optional(),
  baseRent: z.number().optional(),
  rentPerSqft: z.number().optional(),
  sqft: z.number().optional(),
  escalations: z.string().optional(),
  options: z.array(z.string()).optional(),
  cam: z.number().optional(),
  tiAllowance: z.number().optional(),
  securityDeposit: z.number().optional(),
  terminationOption: z.string().optional(),
  exclusiveUse: z.string().optional(),
  coTenancy: z.string().optional(),
  confidence: z.number().int().min(0).max(100).optional(),
  flags: z
    .array(z.object({ field: z.string(), issue: z.string(), severity: z.string() }))
    .optional(),
  isDemo: z.boolean().optional(),
});

router.post(
  '/terra/leases',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const body = LeaseCreateSchema.safeParse(req.body);
      if (!body.success) return sendBadRequest(res, body.error.message);
      const d = body.data;
      const [row] = await db
        .insert(terraLeasesTable)
        .values({
          externalId: randomUUID(),
          documentName: d.documentName,
          tenant: d.tenant,
          premises: d.premises,
          propertyAddress: d.propertyAddress,
          leaseType: d.leaseType,
          commencementDate: d.commencementDate,
          expirationDate: d.expirationDate,
          baseRent: d.baseRent != null ? String(d.baseRent) : undefined,
          rentPerSqft: d.rentPerSqft != null ? String(d.rentPerSqft) : undefined,
          sqft: d.sqft,
          escalations: d.escalations,
          options: d.options ?? [],
          cam: d.cam != null ? String(d.cam) : undefined,
          tiAllowance: d.tiAllowance != null ? String(d.tiAllowance) : undefined,
          securityDeposit: d.securityDeposit != null ? String(d.securityDeposit) : undefined,
          terminationOption: d.terminationOption,
          exclusiveUse: d.exclusiveUse,
          coTenancy: d.coTenancy,
          confidence: d.confidence ?? 85,
          flags: d.flags ?? [],
          ownerUserId: req.user?.id ?? null,
          isDemo: d.isDemo ?? false,
        })
        .returning();
      sendSuccess(res, { lease: rowToLease(row) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create lease');
    }
  },
);

router.post(
  '/terra/leases/upload',
  authWrite,
  upload.single('file'),
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.file)
        return sendBadRequest(
          res,
          "No file uploaded. Use multipart/form-data with field name 'file'.",
        );
      const { originalname, buffer, mimetype, size } = req.file;
      const ext = originalname.split('.').pop()?.toLowerCase() ?? '';

      let extractedText = '';
      let extractionMethod = 'none';

      if (ext === 'txt') {
        extractedText = buffer.toString('utf-8');
        extractionMethod = 'text';
      } else if (ext === 'docx' || ext === 'doc') {
        try {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
          extractionMethod = 'mammoth-docx';
        } catch {
          extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
          extractionMethod = 'raw-ascii-fallback';
        }
      } else if (ext === 'pdf') {
        try {
          // @ts-expect-error -- no type declarations for pdf-parse
          const pdfParse = await import('pdf-parse').catch(() => null);
          if (pdfParse) {
            const parsed = await pdfParse.default(buffer);
            extractedText = parsed.text;
            extractionMethod = 'pdf-parse';
          }
        } catch {
          extractionMethod = 'pdf-failed';
        }
        if (!extractedText) {
          extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
          extractionMethod = 'raw-ascii-fallback';
        }
      }

      const extracted = extractLeaseFromText(extractedText, originalname);
      const missingFields: string[] = [];
      if (!extracted.tenant || extracted.tenant === 'Unknown Tenant') missingFields.push('tenant');
      if (!extracted.commencementDate) missingFields.push('commencement date');
      if (!extracted.expirationDate) missingFields.push('expiration date');
      if (!extracted.baseRent) missingFields.push('base rent');

      const flags: Array<{ field: string; issue: string; severity: string }> = [];
      for (const f of missingFields) {
        flags.push({
          field: f,
          issue: `Could not extract ${f} from document — manual entry required`,
          severity: 'warning',
        });
      }
      if (extracted.confidence < 70) {
        flags.push({
          field: 'Document Quality',
          issue: 'Low extraction confidence — document may be scanned or poorly formatted',
          severity: 'warning',
        });
      }

      const [row] = await db
        .insert(terraLeasesTable)
        .values({
          externalId: randomUUID(),
          documentName: originalname,
          tenant: extracted.tenant,
          premises: extracted.premises || undefined,
          propertyAddress: extracted.propertyAddress || undefined,
          leaseType: extracted.leaseType || undefined,
          commencementDate: extracted.commencementDate || undefined,
          expirationDate: extracted.expirationDate || undefined,
          baseRent: extracted.baseRent > 0 ? String(extracted.baseRent) : undefined,
          rentPerSqft: extracted.rentPerSqft > 0 ? String(extracted.rentPerSqft) : undefined,
          sqft: extracted.sqft > 0 ? extracted.sqft : undefined,
          escalations: extracted.escalations || undefined,
          options: extracted.options,
          cam: extracted.cam > 0 ? String(extracted.cam) : undefined,
          tiAllowance: extracted.tiAllowance > 0 ? String(extracted.tiAllowance) : undefined,
          securityDeposit:
            extracted.securityDeposit > 0 ? String(extracted.securityDeposit) : undefined,
          terminationOption: extracted.terminationOption,
          exclusiveUse: extracted.exclusiveUse,
          confidence: extracted.confidence,
          flags,
          rawData: {
            extractionMethod,
            fileSize: size,
            mimeType: mimetype,
            textLength: extractedText.length,
            missingFields,
          },
          ownerUserId: req.user?.id ?? null,
          isDemo: false,
        })
        .returning();

      sendSuccess(res, {
        lease: rowToLease(row),
        extraction: { method: extractionMethod, confidence: extracted.confidence, missingFields },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to process lease upload');
    }
  },
);

router.put(
  '/terra/leases/:id',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const body = LeaseCreateSchema.partial().safeParse(req.body);
      if (!body.success) return sendBadRequest(res, body.error.message);
      const d = body.data;
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (d.tenant) update.tenant = d.tenant;
      if (d.baseRent != null) update.baseRent = String(d.baseRent);
      if (d.expirationDate) update.expirationDate = d.expirationDate;
      if (d.flags) update.flags = d.flags;
      if (d.confidence != null) update.confidence = d.confidence;
      const leaseUserId = req.user?.id;
      const leaseWhere =
        leaseUserId != null
          ? and(
              eq(terraLeasesTable.externalId, req.params.id as string),
              or(
                eq(terraLeasesTable.ownerUserId, leaseUserId),
                isNull(terraLeasesTable.ownerUserId),
              ),
            )
          : eq(terraLeasesTable.externalId, req.params.id as string);
      const [leaseUpdated] = await db
        .update(terraLeasesTable)
        .set(update)
        .where(leaseWhere)
        .returning({ id: terraLeasesTable.id });
      if (!leaseUpdated)
        return sendUnauthorized(res, 'You do not have permission to update this record');
      sendSuccess(res, { updated: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update lease');
    }
  },
);

router.delete(
  '/terra/leases/:id',
  validateBody(terraResourceDeleteSchema),
  authWrite,
  async (req: Request, res: Response) => {
    try {
      const leaseUserId = req.user?.id;
      const leaseWhere =
        leaseUserId != null
          ? and(
              eq(terraLeasesTable.externalId, req.params.id as string),
              or(
                eq(terraLeasesTable.ownerUserId, leaseUserId),
                isNull(terraLeasesTable.ownerUserId),
              ),
            )
          : eq(terraLeasesTable.externalId, req.params.id as string);
      const [leaseDeleted] = await db
        .delete(terraLeasesTable)
        .where(leaseWhere)
        .returning({ id: terraLeasesTable.id });
      if (!leaseDeleted)
        return sendUnauthorized(res, 'You do not have permission to delete this record');
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete lease');
    }
  },
);

// ---------------------------------------------------------------------------
// Pro Forma Projects
// ---------------------------------------------------------------------------

router.get('/terra/pro-forma-projects', authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const notSessionRow = ne(terraProFormaProjectsTable.projectName, SESSION_PROJECT_NAME);
    const baseQuery = db.select().from(terraProFormaProjectsTable);
    const rows = await (userId
      ? baseQuery.where(and(eq(terraProFormaProjectsTable.ownerUserId, userId), notSessionRow))
      : baseQuery.where(notSessionRow)
    ).orderBy(desc(terraProFormaProjectsTable.updatedAt));
    const projects = rows.map((r) => ({
      id: r.externalId ?? String(r.id),
      projectName: r.projectName,
      propertyType: r.propertyType ?? '',
      inputs: r.inputs as any,
      results: r.results as any | null,
      updatedAt: r.updatedAt.toISOString(),
      isDemo: r.isDemo,
    }));
    sendSuccess(res, {
      count: rows.length,
      projects,
      dataMode: rows.length > 0 ? 'live' : 'empty',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch pro forma projects');
  }
});

const ProFormaProjectSchema = z.object({
  projectName: z.string().min(1),
  propertyType: z.string().optional(),
  inputs: z.record(z.unknown()),
  results: z.record(z.unknown()).optional(),
  ownerName: z.string().optional(),
  isDemo: z.boolean().optional(),
});

router.post(
  '/terra/pro-forma-projects',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const body = ProFormaProjectSchema.safeParse(req.body);
      if (!body.success) return sendBadRequest(res, body.error.message);
      const d = body.data;
      const [row] = await db
        .insert(terraProFormaProjectsTable)
        .values({
          externalId: randomUUID(),
          projectName: d.projectName,
          propertyType: d.propertyType,
          inputs: d.inputs,
          results: d.results,
          ownerName: d.ownerName ?? req.user?.displayName,
          ownerUserId: req.user?.id,
          isDemo: d.isDemo ?? false,
        })
        .returning();
      sendSuccess(res, {
        project: {
          id: row.externalId ?? String(row.id),
          projectName: row.projectName,
          inputs: row.inputs,
          results: row.results,
          updatedAt: row.updatedAt.toISOString(),
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to save pro forma project');
    }
  },
);

router.put(
  '/terra/pro-forma-projects/:id',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const body = ProFormaProjectSchema.partial().safeParse(req.body);
      if (!body.success) return sendBadRequest(res, body.error.message);
      const d = body.data;
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (d.projectName) update.projectName = d.projectName;
      if (d.inputs) update.inputs = d.inputs;
      if (d.results) update.results = d.results;
      const conditions = [
        eq(terraProFormaProjectsTable.externalId, req.params.id as string),
        ne(terraProFormaProjectsTable.projectName, SESSION_PROJECT_NAME),
      ];
      if (req.user?.id) conditions.push(eq(terraProFormaProjectsTable.ownerUserId, req.user.id));
      await db
        .update(terraProFormaProjectsTable)
        .set(update)
        .where(and(...conditions));
      sendSuccess(res, { updated: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update pro forma project');
    }
  },
);

router.delete(
  '/terra/pro-forma-projects/:id',
  validateBody(terraResourceDeleteSchema),
  authWrite,
  async (req: Request, res: Response) => {
    try {
      const conditions = [
        eq(terraProFormaProjectsTable.externalId, req.params.id as string),
        ne(terraProFormaProjectsTable.projectName, SESSION_PROJECT_NAME),
      ];
      if (req.user?.id) conditions.push(eq(terraProFormaProjectsTable.ownerUserId, req.user.id));
      await db.delete(terraProFormaProjectsTable).where(and(...conditions));
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete pro forma project');
    }
  },
);

// ---------------------------------------------------------------------------
// Pro Forma Scenario Session (persist active scenarios for a user)
// ---------------------------------------------------------------------------

router.get('/terra/pro-forma-session', authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const [row] = await db
      .select()
      .from(terraProFormaProjectsTable)
      .where(
        and(
          eq(terraProFormaProjectsTable.projectName, SESSION_PROJECT_NAME),
          eq(terraProFormaProjectsTable.ownerUserId, userId),
        ),
      )
      .limit(1);
    if (!row) {
      return sendSuccess(res, { session: null });
    }
    sendSuccess(res, { session: row.inputs });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load scenario session');
  }
});

router.put(
  '/terra/pro-forma-session',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const sessionData = req.body as Record<string, unknown>;
      const [existing] = await db
        .select({ id: terraProFormaProjectsTable.id })
        .from(terraProFormaProjectsTable)
        .where(
          and(
            eq(terraProFormaProjectsTable.projectName, SESSION_PROJECT_NAME),
            eq(terraProFormaProjectsTable.ownerUserId, userId),
          ),
        )
        .limit(1);
      if (existing) {
        await db
          .update(terraProFormaProjectsTable)
          .set({ inputs: sessionData, updatedAt: new Date() })
          .where(eq(terraProFormaProjectsTable.id, existing.id));
      } else {
        await db.insert(terraProFormaProjectsTable).values({
          externalId: randomUUID(),
          projectName: SESSION_PROJECT_NAME,
          inputs: sessionData,
          ownerUserId: userId,
          ownerName: req.user?.displayName,
          isDemo: false,
        });
      }
      sendSuccess(res, { saved: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to save scenario session');
    }
  },
);

// ---------------------------------------------------------------------------
// 1031 Exchanges
// ---------------------------------------------------------------------------

function rowToExchange(r: typeof terraExchanges1031Table.$inferSelect) {
  return {
    id: r.externalId ?? String(r.id),
    relinquishedProperty: r.relinquishedProperty,
    relinquishedAddress: r.relinquishedAddress ?? '',
    saleDate: r.saleDate ?? '',
    salePrice: Number(r.salePrice ?? 0),
    adjustedBasis: Number(r.adjustedBasis ?? 0),
    deferredGain: Number(r.deferredGain ?? 0),
    qi: r.qi ?? '',
    qiContact: r.qiContact ?? '',
    status: r.status,
    identificationDeadline: r.identificationDeadline ?? '',
    exchangeDeadline: r.exchangeDeadline ?? '',
    identifiedProperties: (r.identifiedProperties as Array<Record<string, unknown>>) ?? [],
    complianceItems: (r.complianceItems as Array<Record<string, unknown>>) ?? [],
    taxSavings: Number(r.taxSavings ?? 0),
    isDemo: r.isDemo,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get('/terra/exchanges-1031', authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await db
      .select()
      .from(terraExchanges1031Table)
      .where(
        userId != null
          ? or(
              eq(terraExchanges1031Table.ownerUserId, userId),
              isNull(terraExchanges1031Table.ownerUserId),
            )
          : isNull(terraExchanges1031Table.ownerUserId),
      )
      .orderBy(desc(terraExchanges1031Table.createdAt));
    sendSuccess(res, {
      count: rows.length,
      exchanges: rows.map(rowToExchange),
      dataMode: rows.length > 0 ? 'live' : 'empty',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch 1031 exchanges');
  }
});

const Exchange1031Schema = z.object({
  relinquishedProperty: z.string().min(1),
  relinquishedAddress: z.string().optional(),
  saleDate: z.string().optional(),
  salePrice: z.number().optional(),
  adjustedBasis: z.number().optional(),
  deferredGain: z.number().optional(),
  qi: z.string().optional(),
  qiContact: z.string().optional(),
  status: z.enum(['identification', 'exchange', 'completed', 'failed']).optional(),
  identificationDeadline: z.string().optional(),
  exchangeDeadline: z.string().optional(),
  identifiedProperties: z.array(z.record(z.unknown())).optional(),
  complianceItems: z.array(z.record(z.unknown())).optional(),
  taxSavings: z.number().optional(),
  isDemo: z.boolean().optional(),
});

router.post(
  '/terra/exchanges-1031',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const body = Exchange1031Schema.safeParse(req.body);
      if (!body.success) return sendBadRequest(res, body.error.message);
      const d = body.data;
      const [row] = await db
        .insert(terraExchanges1031Table)
        .values({
          externalId: randomUUID(),
          relinquishedProperty: d.relinquishedProperty,
          relinquishedAddress: d.relinquishedAddress,
          saleDate: d.saleDate,
          salePrice: d.salePrice != null ? String(d.salePrice) : undefined,
          adjustedBasis: d.adjustedBasis != null ? String(d.adjustedBasis) : undefined,
          deferredGain: d.deferredGain != null ? String(d.deferredGain) : undefined,
          qi: d.qi,
          qiContact: d.qiContact,
          status: d.status ?? 'identification',
          identificationDeadline: d.identificationDeadline,
          exchangeDeadline: d.exchangeDeadline,
          identifiedProperties: d.identifiedProperties ?? [],
          complianceItems: d.complianceItems ?? [],
          taxSavings: d.taxSavings != null ? String(d.taxSavings) : undefined,
          ownerUserId: req.user?.id ?? null,
          isDemo: d.isDemo ?? false,
        })
        .returning();
      sendSuccess(res, { exchange: rowToExchange(row) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create exchange');
    }
  },
);

router.put(
  '/terra/exchanges-1031/:id',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const body = Exchange1031Schema.partial().safeParse(req.body);
      if (!body.success) return sendBadRequest(res, body.error.message);
      const d = body.data;
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (d.status) update.status = d.status;
      if (d.identifiedProperties) update.identifiedProperties = d.identifiedProperties;
      if (d.complianceItems) update.complianceItems = d.complianceItems;
      const exUserId = req.user?.id;
      const exWhere =
        exUserId != null
          ? and(
              eq(terraExchanges1031Table.externalId, req.params.id as string),
              or(
                eq(terraExchanges1031Table.ownerUserId, exUserId),
                isNull(terraExchanges1031Table.ownerUserId),
              ),
            )
          : eq(terraExchanges1031Table.externalId, req.params.id as string);
      const [exUpdated] = await db
        .update(terraExchanges1031Table)
        .set(update)
        .where(exWhere)
        .returning({ id: terraExchanges1031Table.id });
      if (!exUpdated)
        return sendUnauthorized(res, 'You do not have permission to update this record');
      sendSuccess(res, { updated: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update exchange');
    }
  },
);

router.delete(
  '/terra/exchanges-1031/:id',
  validateBody(terraResourceDeleteSchema),
  authWrite,
  async (req: Request, res: Response) => {
    try {
      const exUserId = req.user?.id;
      const exWhere =
        exUserId != null
          ? and(
              eq(terraExchanges1031Table.externalId, req.params.id as string),
              or(
                eq(terraExchanges1031Table.ownerUserId, exUserId),
                isNull(terraExchanges1031Table.ownerUserId),
              ),
            )
          : eq(terraExchanges1031Table.externalId, req.params.id as string);
      const [exDeleted] = await db
        .delete(terraExchanges1031Table)
        .where(exWhere)
        .returning({ id: terraExchanges1031Table.id });
      if (!exDeleted)
        return sendUnauthorized(res, 'You do not have permission to delete this record');
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete exchange');
    }
  },
);

// ---------------------------------------------------------------------------
// Tax Appeals
// ---------------------------------------------------------------------------

function rowToTaxAppeal(r: typeof terraTaxAppealsTable.$inferSelect) {
  return {
    id: r.externalId ?? String(r.id),
    name: r.name,
    address: r.address ?? '',
    propertyType: r.propertyType ?? '',
    sqft: r.sqft ?? 0,
    assessedValue: Number(r.assessedValue ?? 0),
    avmValue: Number(r.avmValue ?? 0),
    taxRate: Number(r.taxRate ?? 0),
    overAssessedPct: Number(r.overAssessedPct ?? 0),
    annualTax: Number(r.annualTax ?? 0),
    potentialSavings: Number(r.potentialSavings ?? 0),
    appealDeadline: r.appealDeadline ?? '',
    appealStatus: r.appealStatus,
    juris: r.juris ?? '',
    comparables: (r.comparables as Array<Record<string, unknown>>) ?? [],
    appealStrength: r.appealStrength,
    notes: r.notes ?? '',
    isDemo: r.isDemo,
  };
}

router.get('/terra/tax-appeals', authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await db
      .select()
      .from(terraTaxAppealsTable)
      .where(
        userId != null
          ? or(
              eq(terraTaxAppealsTable.ownerUserId, userId),
              isNull(terraTaxAppealsTable.ownerUserId),
            )
          : isNull(terraTaxAppealsTable.ownerUserId),
      )
      .orderBy(desc(terraTaxAppealsTable.createdAt));
    sendSuccess(res, {
      count: rows.length,
      properties: rows.map(rowToTaxAppeal),
      dataMode: rows.length > 0 ? 'live' : 'empty',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch tax appeals');
  }
});

const TaxAppealSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  propertyType: z.string().optional(),
  sqft: z.number().optional(),
  assessedValue: z.number().optional(),
  avmValue: z.number().optional(),
  taxRate: z.number().optional(),
  overAssessedPct: z.number().optional(),
  annualTax: z.number().optional(),
  potentialSavings: z.number().optional(),
  appealDeadline: z.string().optional(),
  appealStatus: z.enum(['eligible', 'filed', 'hearing', 'won', 'lost', 'not-eligible']).optional(),
  juris: z.string().optional(),
  comparables: z.array(z.record(z.unknown())).optional(),
  appealStrength: z.enum(['strong', 'moderate', 'weak']).optional(),
  notes: z.string().optional(),
  isDemo: z.boolean().optional(),
});

router.post(
  '/terra/tax-appeals',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const body = TaxAppealSchema.safeParse(req.body);
      if (!body.success) return sendBadRequest(res, body.error.message);
      const d = body.data;
      const [row] = await db
        .insert(terraTaxAppealsTable)
        .values({
          externalId: randomUUID(),
          name: d.name,
          address: d.address,
          propertyType: d.propertyType,
          sqft: d.sqft,
          assessedValue: d.assessedValue != null ? String(d.assessedValue) : undefined,
          avmValue: d.avmValue != null ? String(d.avmValue) : undefined,
          taxRate: d.taxRate != null ? String(d.taxRate) : undefined,
          overAssessedPct: d.overAssessedPct != null ? String(d.overAssessedPct) : undefined,
          annualTax: d.annualTax != null ? String(d.annualTax) : undefined,
          potentialSavings: d.potentialSavings != null ? String(d.potentialSavings) : undefined,
          appealDeadline: d.appealDeadline,
          appealStatus: d.appealStatus ?? 'eligible',
          juris: d.juris,
          comparables: d.comparables ?? [],
          appealStrength: d.appealStrength ?? 'moderate',
          notes: d.notes,
          ownerUserId: req.user?.id ?? null,
          isDemo: d.isDemo ?? false,
        })
        .returning();
      sendSuccess(res, { property: rowToTaxAppeal(row) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create tax appeal');
    }
  },
);

router.put(
  '/terra/tax-appeals/:id',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const body = TaxAppealSchema.partial().safeParse(req.body);
      if (!body.success) return sendBadRequest(res, body.error.message);
      const d = body.data;
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (d.appealStatus) update.appealStatus = d.appealStatus;
      if (d.notes) update.notes = d.notes;
      const taUserId = req.user?.id;
      const taWhere =
        taUserId != null
          ? and(
              eq(terraTaxAppealsTable.externalId, req.params.id as string),
              or(
                eq(terraTaxAppealsTable.ownerUserId, taUserId),
                isNull(terraTaxAppealsTable.ownerUserId),
              ),
            )
          : eq(terraTaxAppealsTable.externalId, req.params.id as string);
      const [taUpdated] = await db
        .update(terraTaxAppealsTable)
        .set(update)
        .where(taWhere)
        .returning({ id: terraTaxAppealsTable.id });
      if (!taUpdated)
        return sendUnauthorized(res, 'You do not have permission to update this record');
      sendSuccess(res, { updated: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update tax appeal');
    }
  },
);

router.delete(
  '/terra/tax-appeals/:id',
  validateBody(terraResourceDeleteSchema),
  authWrite,
  async (req: Request, res: Response) => {
    try {
      const taUserId = req.user?.id;
      const taWhere =
        taUserId != null
          ? and(
              eq(terraTaxAppealsTable.externalId, req.params.id as string),
              or(
                eq(terraTaxAppealsTable.ownerUserId, taUserId),
                isNull(terraTaxAppealsTable.ownerUserId),
              ),
            )
          : eq(terraTaxAppealsTable.externalId, req.params.id as string);
      const [taDeleted] = await db
        .delete(terraTaxAppealsTable)
        .where(taWhere)
        .returning({ id: terraTaxAppealsTable.id });
      if (!taDeleted)
        return sendUnauthorized(res, 'You do not have permission to delete this record');
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete tax appeal');
    }
  },
);

// ---------------------------------------------------------------------------
// Waterfall Structures
// ---------------------------------------------------------------------------

router.get('/terra/waterfall-structures', authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const baseQuery = db.select().from(terraWaterfallStructuresTable);
    const rows = await (userId
      ? baseQuery.where(eq(terraWaterfallStructuresTable.ownerUserId, userId))
      : baseQuery
    ).orderBy(desc(terraWaterfallStructuresTable.updatedAt));
    const structures = rows.map((r) => ({
      id: r.externalId ?? String(r.id),
      name: r.name,
      description: r.description ?? '',
      inputs: r.inputs as any,
      results: r.results as any | null,
      updatedAt: r.updatedAt.toISOString(),
      isDemo: r.isDemo,
    }));
    sendSuccess(res, {
      count: rows.length,
      structures,
      dataMode: rows.length > 0 ? 'live' : 'empty',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch waterfall structures');
  }
});

const WaterfallStructureSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  inputs: z.record(z.unknown()),
  results: z.record(z.unknown()).optional(),
  ownerName: z.string().optional(),
  isDemo: z.boolean().optional(),
});

router.post(
  '/terra/waterfall-structures',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const body = WaterfallStructureSchema.safeParse(req.body);
      if (!body.success) return sendBadRequest(res, body.error.message);
      const d = body.data;
      const [row] = await db
        .insert(terraWaterfallStructuresTable)
        .values({
          externalId: randomUUID(),
          name: d.name,
          description: d.description,
          inputs: d.inputs,
          results: d.results,
          ownerName: d.ownerName ?? req.user?.displayName,
          ownerUserId: req.user?.id,
          isDemo: d.isDemo ?? false,
        })
        .returning();
      sendSuccess(res, {
        structure: {
          id: row.externalId ?? String(row.id),
          name: row.name,
          inputs: row.inputs,
          updatedAt: row.updatedAt.toISOString(),
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to save waterfall structure');
    }
  },
);

router.put(
  '/terra/waterfall-structures/:id',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const body = WaterfallStructureSchema.partial().safeParse(req.body);
      if (!body.success) return sendBadRequest(res, body.error.message);
      const d = body.data;
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (d.name) update.name = d.name;
      if (d.inputs) update.inputs = d.inputs;
      if (d.results) update.results = d.results;
      const conditions = [eq(terraWaterfallStructuresTable.externalId, req.params.id as string)];
      if (req.user?.id) conditions.push(eq(terraWaterfallStructuresTable.ownerUserId, req.user.id));
      await db
        .update(terraWaterfallStructuresTable)
        .set(update)
        .where(and(...conditions));
      sendSuccess(res, { updated: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update waterfall structure');
    }
  },
);

router.delete(
  '/terra/waterfall-structures/:id',
  validateBody(terraResourceDeleteSchema),
  authWrite,
  async (req: Request, res: Response) => {
    try {
      const conditions = [eq(terraWaterfallStructuresTable.externalId, req.params.id as string)];
      if (req.user?.id) conditions.push(eq(terraWaterfallStructuresTable.ownerUserId, req.user.id));
      await db.delete(terraWaterfallStructuresTable).where(and(...conditions));
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete waterfall structure');
    }
  },
);

// ---------------------------------------------------------------------------
// Construction Projects
// ---------------------------------------------------------------------------

function rowToConstructionProject(r: typeof terraConstructionProjectsTable.$inferSelect) {
  return {
    id: r.externalId ?? String(r.id),
    name: r.name,
    address: r.address ?? '',
    type: r.type ?? '',
    totalBudget: Number(r.totalBudget ?? 0),
    totalSpent: Number(r.totalSpent ?? 0),
    overallPct: r.overallPct,
    startDate: r.startDate ?? '',
    projectedCompletion: r.projectedCompletion ?? '',
    revisedCompletion: r.revisedCompletion ?? undefined,
    status: r.status,
    gc: r.gc ?? '',
    architect: r.architect ?? '',
    milestones: (r.milestones as Array<Record<string, unknown>>) ?? [],
    budgetLines: (r.budgetLines as Array<Record<string, unknown>>) ?? [],
    photos: (r.photos as Array<Record<string, unknown>>) ?? [],
    isDemo: r.isDemo,
  };
}

router.get('/terra/construction-projects', authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await db
      .select()
      .from(terraConstructionProjectsTable)
      .where(
        userId != null
          ? or(
              eq(terraConstructionProjectsTable.ownerUserId, userId),
              isNull(terraConstructionProjectsTable.ownerUserId),
            )
          : isNull(terraConstructionProjectsTable.ownerUserId),
      )
      .orderBy(desc(terraConstructionProjectsTable.createdAt));
    sendSuccess(res, {
      count: rows.length,
      projects: rows.map(rowToConstructionProject),
      dataMode: rows.length > 0 ? 'live' : 'empty',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch construction projects');
  }
});

const ConstructionProjectSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  type: z.string().optional(),
  totalBudget: z.number().optional(),
  totalSpent: z.number().optional(),
  overallPct: z.number().int().optional(),
  startDate: z.string().optional(),
  projectedCompletion: z.string().optional(),
  revisedCompletion: z.string().optional(),
  status: z.enum(['on-track', 'behind', 'at-risk', 'complete']).optional(),
  gc: z.string().optional(),
  architect: z.string().optional(),
  milestones: z.array(z.record(z.unknown())).optional(),
  budgetLines: z.array(z.record(z.unknown())).optional(),
  photos: z.array(z.record(z.unknown())).optional(),
  isDemo: z.boolean().optional(),
});

router.post(
  '/terra/construction-projects',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const body = ConstructionProjectSchema.safeParse(req.body);
      if (!body.success) return sendBadRequest(res, body.error.message);
      const d = body.data;
      const [row] = await db
        .insert(terraConstructionProjectsTable)
        .values({
          externalId: randomUUID(),
          name: d.name,
          address: d.address,
          type: d.type,
          totalBudget: d.totalBudget != null ? String(d.totalBudget) : undefined,
          totalSpent: d.totalSpent != null ? String(d.totalSpent) : undefined,
          overallPct: d.overallPct ?? 0,
          startDate: d.startDate,
          projectedCompletion: d.projectedCompletion,
          revisedCompletion: d.revisedCompletion,
          status: d.status ?? 'on-track',
          gc: d.gc,
          architect: d.architect,
          milestones: d.milestones ?? [],
          budgetLines: d.budgetLines ?? [],
          photos: d.photos ?? [],
          ownerUserId: req.user?.id ?? null,
          isDemo: d.isDemo ?? false,
        })
        .returning();
      sendSuccess(res, { project: rowToConstructionProject(row) });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create construction project');
    }
  },
);

router.put(
  '/terra/construction-projects/:id',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const body = ConstructionProjectSchema.partial().safeParse(req.body);
      if (!body.success) return sendBadRequest(res, body.error.message);
      const d = body.data;
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (d.overallPct != null) update.overallPct = d.overallPct;
      if (d.status) update.status = d.status;
      if (d.milestones) update.milestones = d.milestones;
      if (d.budgetLines) update.budgetLines = d.budgetLines;
      if (d.photos) update.photos = d.photos;
      if (d.totalSpent != null) update.totalSpent = String(d.totalSpent);
      if (d.revisedCompletion) update.revisedCompletion = d.revisedCompletion;
      const cpUserId = req.user?.id;
      const cpWhere =
        cpUserId != null
          ? and(
              eq(terraConstructionProjectsTable.externalId, req.params.id as string),
              or(
                eq(terraConstructionProjectsTable.ownerUserId, cpUserId),
                isNull(terraConstructionProjectsTable.ownerUserId),
              ),
            )
          : eq(terraConstructionProjectsTable.externalId, req.params.id as string);
      const [cpUpdated] = await db
        .update(terraConstructionProjectsTable)
        .set(update)
        .where(cpWhere)
        .returning({ id: terraConstructionProjectsTable.id });
      if (!cpUpdated)
        return sendUnauthorized(res, 'You do not have permission to update this record');
      sendSuccess(res, { updated: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update construction project');
    }
  },
);

router.delete(
  '/terra/construction-projects/:id',
  validateBody(terraResourceDeleteSchema),
  authWrite,
  async (req: Request, res: Response) => {
    try {
      const cpUserId = req.user?.id;
      const cpWhere =
        cpUserId != null
          ? and(
              eq(terraConstructionProjectsTable.externalId, req.params.id as string),
              or(
                eq(terraConstructionProjectsTable.ownerUserId, cpUserId),
                isNull(terraConstructionProjectsTable.ownerUserId),
              ),
            )
          : eq(terraConstructionProjectsTable.externalId, req.params.id as string);
      const [cpDeleted] = await db
        .delete(terraConstructionProjectsTable)
        .where(cpWhere)
        .returning({ id: terraConstructionProjectsTable.id });
      if (!cpDeleted)
        return sendUnauthorized(res, 'You do not have permission to delete this record');
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete construction project');
    }
  },
);

// ---------------------------------------------------------------------------
// Tenant Applications — with screening provider integration
// ---------------------------------------------------------------------------

function rowToTenantApplication(r: typeof terraTenantApplicationsTable.$inferSelect) {
  const screening = (r.screeningData as any) ?? {};
  return {
    id: r.externalId ?? String(r.id),
    name: r.name,
    type: r.type,
    targetUnit: r.targetUnit ?? '',
    proposedRent: Number(r.proposedRent ?? 0),
    leaseTermMonths: r.leaseTermMonths ?? 12,
    submittedDate: r.submittedDate ?? r.createdAt.toISOString().slice(0, 10),
    status: r.status,
    overallScore: r.overallScore,
    recommendation: r.recommendation,
    creditScore: r.creditScore ?? (screening.creditScore as number) ?? 0,
    annualIncome: Number(r.annualIncome ?? (screening.annualIncome as number) ?? 0),
    incomeVerified: r.incomeVerified,
    rentToIncomeRatio: Number(r.rentToIncomeRatio ?? (screening.rentToIncomeRatio as number) ?? 0),
    priorEvictions: r.priorEvictions,
    backgroundClear: r.backgroundClear,
    screeningData: screening,
    flags: (r.flags as Array<Record<string, unknown>>) ?? [],
    notes: r.notes ?? '',
    isDemo: r.isDemo,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get('/terra/tenant-applications', authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await db
      .select()
      .from(terraTenantApplicationsTable)
      .where(
        userId != null
          ? or(
              eq(terraTenantApplicationsTable.ownerUserId, userId),
              isNull(terraTenantApplicationsTable.ownerUserId),
            )
          : isNull(terraTenantApplicationsTable.ownerUserId),
      )
      .orderBy(desc(terraTenantApplicationsTable.createdAt));
    sendSuccess(res, {
      count: rows.length,
      applicants: rows.map(rowToTenantApplication),
      dataMode: rows.length > 0 ? 'live' : 'empty',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch tenant applications');
  }
});

const TenantApplicationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['individual', 'entity']).optional(),
  targetUnit: z.string().optional(),
  proposedRent: z.number().optional(),
  leaseTermMonths: z.number().int().optional(),
  submittedDate: z.string().optional(),
  status: z.enum(['pending', 'approved', 'conditional', 'declined']).optional(),
  overallScore: z.number().int().min(0).max(100).optional(),
  recommendation: z.enum(['approve', 'conditional', 'decline']).optional(),
  creditScore: z.number().int().optional(),
  annualIncome: z.number().optional(),
  incomeVerified: z.boolean().optional(),
  rentToIncomeRatio: z.number().optional(),
  priorEvictions: z.number().int().optional(),
  backgroundClear: z.boolean().optional(),
  screeningData: z.record(z.unknown()).optional(),
  flags: z.array(z.record(z.unknown())).optional(),
  notes: z.string().optional(),
  isDemo: z.boolean().optional(),
});

router.post(
  '/terra/tenant-applications',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const body = TenantApplicationSchema.safeParse(req.body);
      if (!body.success) return sendBadRequest(res, body.error.message);
      const d = body.data;

      let screeningResult: ScreeningProviderResult | null = null;
      let providerError: string | null = null;

      if (!d.isDemo) {
        try {
          const provider = getScreeningProvider();
          screeningResult = await provider.screen({
            name: d.name,
            annualIncome: d.annualIncome,
            creditScore: d.creditScore,
            targetRent: d.proposedRent,
          });
        } catch (err) {
          providerError = err instanceof Error ? err.message : 'Screening provider error';
        }
      }

      const effectiveCreditScore = screeningResult?.creditScore ?? d.creditScore;
      const effectiveBackgroundClear =
        screeningResult?.backgroundClear ?? d.backgroundClear ?? true;
      const effectiveEvictions = screeningResult?.evictionRecords ?? d.priorEvictions ?? 0;
      const effectiveIncomeVerified = screeningResult?.incomeVerified ?? d.incomeVerified ?? false;
      const overallScore = screeningResult?.radarScores.overall ?? d.overallScore ?? 50;
      const recommendation: 'approve' | 'conditional' | 'decline' =
        overallScore >= 75 ? 'approve' : overallScore >= 50 ? 'conditional' : 'decline';

      const normalizedRadarScores: { subject: string; score: number }[] | undefined =
        screeningResult?.radarScores
          ? [
              { subject: 'Credit', score: screeningResult.radarScores.credit },
              { subject: 'Income', score: screeningResult.radarScores.income },
              { subject: 'Rental Hist.', score: screeningResult.radarScores.rental },
              { subject: 'Overall', score: screeningResult.radarScores.overall },
            ]
          : undefined;

      const severityToType = (s: string): 'warning' | 'info' | 'error' =>
        s === 'error' ? 'error' : s === 'warning' ? 'warning' : 'info';

      const screeningData: Record<string, unknown> = {
        ...d.screeningData,
        providerName: screeningResult?.providerName ?? 'Manual Entry',
        providerStatus: screeningResult?.providerStatus ?? 'unavailable',
        creditHistory: screeningResult?.creditHistory,
        bankruptcies: screeningResult?.bankruptcies ?? 0,
        judgments: screeningResult?.judgments ?? 0,
        ...(normalizedRadarScores ? { radarScores: normalizedRadarScores } : {}),
        ...(providerError ? { providerError } : {}),
      };

      const flags: Array<{ type: 'warning' | 'info' | 'error'; text: string }> = [
        ...((d.flags ?? []) as Array<{ type: 'warning' | 'info' | 'error'; text: string }>),
        ...(screeningResult?.flags.map((f) => ({
          type: severityToType(f.severity),
          text: f.note,
        })) ?? []),
      ];

      const [row] = await db
        .insert(terraTenantApplicationsTable)
        .values({
          externalId: randomUUID(),
          name: d.name,
          type: d.type ?? 'individual',
          targetUnit: d.targetUnit,
          proposedRent: d.proposedRent != null ? String(d.proposedRent) : undefined,
          leaseTermMonths: d.leaseTermMonths,
          submittedDate: d.submittedDate ?? new Date().toISOString().slice(0, 10),
          status: d.status ?? 'pending',
          overallScore,
          recommendation: d.recommendation ?? recommendation,
          creditScore: effectiveCreditScore,
          annualIncome: d.annualIncome != null ? String(d.annualIncome) : undefined,
          incomeVerified: effectiveIncomeVerified,
          rentToIncomeRatio: d.rentToIncomeRatio != null ? String(d.rentToIncomeRatio) : undefined,
          priorEvictions: effectiveEvictions,
          backgroundClear: effectiveBackgroundClear,
          screeningData,
          flags,
          notes: d.notes,
          ownerUserId: req.user?.id ?? null,
          isDemo: d.isDemo ?? false,
        })
        .returning();
      sendSuccess(res, {
        applicant: rowToTenantApplication(row),
        screening: screeningResult
          ? { provider: screeningResult.providerName, status: screeningResult.providerStatus }
          : null,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create tenant application');
    }
  },
);

router.put(
  '/terra/tenant-applications/:id',
  authWrite,
  validateBody(terraResourceMutationSchema),
  async (req: Request, res: Response) => {
    try {
      const body = TenantApplicationSchema.partial().safeParse(req.body);
      if (!body.success) return sendBadRequest(res, body.error.message);
      const d = body.data;
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (d.status) update.status = d.status;
      if (d.recommendation) update.recommendation = d.recommendation;
      if (d.overallScore != null) update.overallScore = d.overallScore;
      if (d.notes != null) update.notes = d.notes;
      if (d.screeningData) update.screeningData = d.screeningData;
      if (d.flags) update.flags = d.flags;
      const userId = req.user?.id;
      const where =
        userId != null
          ? and(
              eq(terraTenantApplicationsTable.externalId, req.params.id as string),
              or(
                eq(terraTenantApplicationsTable.ownerUserId, userId),
                isNull(terraTenantApplicationsTable.ownerUserId),
              ),
            )
          : eq(terraTenantApplicationsTable.externalId, req.params.id as string);
      const [updated] = await db
        .update(terraTenantApplicationsTable)
        .set(update)
        .where(where)
        .returning({ id: terraTenantApplicationsTable.id });
      if (!updated)
        return sendUnauthorized(res, 'You do not have permission to update this record');
      sendSuccess(res, { updated: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update tenant application');
    }
  },
);

router.delete(
  '/terra/tenant-applications/:id',
  validateBody(terraResourceDeleteSchema),
  authWrite,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const where =
        userId != null
          ? and(
              eq(terraTenantApplicationsTable.externalId, req.params.id as string),
              or(
                eq(terraTenantApplicationsTable.ownerUserId, userId),
                isNull(terraTenantApplicationsTable.ownerUserId),
              ),
            )
          : eq(terraTenantApplicationsTable.externalId, req.params.id as string);
      const [deleted] = await db
        .delete(terraTenantApplicationsTable)
        .where(where)
        .returning({ id: terraTenantApplicationsTable.id });
      if (!deleted)
        return sendUnauthorized(res, 'You do not have permission to delete this record');
      sendSuccess(res, { deleted: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete tenant application');
    }
  },
);

// ---------------------------------------------------------------------------
// Mobile-facing endpoints — shaped for the CORTEX mobile Terra modules
// ---------------------------------------------------------------------------

/**
 * GET /terra/rent-roll
 * Groups stored leases by propertyAddress and returns a rent-roll payload
 * compatible with the mobile Rent Roll screen mapper.
 */
router.get('/terra/rent-roll', authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await db
      .select()
      .from(terraLeasesTable)
      .where(
        userId != null
          ? or(eq(terraLeasesTable.ownerUserId, userId), isNull(terraLeasesTable.ownerUserId))
          : isNull(terraLeasesTable.ownerUserId),
      )
      .orderBy(desc(terraLeasesTable.createdAt));

    if (rows.length === 0) {
      return sendSuccess(res, { properties: [], dataMode: 'empty' });
    }

    const now = new Date();
    const EXPIRY_WARNING_DAYS = 180;

    const byAddress = new Map<string, typeof rows>();
    for (const row of rows) {
      const key = row.propertyAddress ?? row.documentName ?? 'Unknown Property';
      if (!byAddress.has(key)) byAddress.set(key, []);
      byAddress.get(key)?.push(row);
    }

    const properties = Array.from(byAddress.entries()).map(([address, leases], pi) => {
      const leaseItems = leases.map((r, li) => {
        const expiryStr = r.expirationDate ?? '';
        const expiryDate = expiryStr ? new Date(expiryStr) : null;
        const daysToExpiry = expiryDate
          ? Math.floor((expiryDate.getTime() - now.getTime()) / 86_400_000)
          : null;

        let status: 'active' | 'expiring' | 'month-to-month' | 'vacant' = 'active';
        if (!expiryStr) {
          status = 'month-to-month';
        } else if (daysToExpiry !== null && daysToExpiry <= EXPIRY_WARNING_DAYS && daysToExpiry >= 0) {
          status = 'expiring';
        }

        const creditScore = Number(r.rentPerSqft ?? 0) > 40 ? 'A' : Number(r.rentPerSqft ?? 0) > 25 ? 'B' : 'C';

        return {
          id: r.externalId ?? String(r.id ?? li),
          tenant: r.tenant,
          suite: r.premises ?? String(li + 1),
          sqft: r.sqft ?? 0,
          monthlyRent: Number(r.baseRent ?? 0),
          leaseEnd: expiryStr
            ? new Date(expiryStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : 'M-T-M',
          status,
          creditScore: creditScore as 'A' | 'B' | 'C' | 'D',
          paymentHistory: 'good' as const,
          markToMarketGap: 0,
        };
      });

      const occupiedLeases = leaseItems.filter((l) => l.status !== 'vacant');
      const egi = occupiedLeases.reduce((s, l) => s + l.monthlyRent, 0);
      const gpr = leaseItems.reduce((s, l) => s + l.monthlyRent, 0);

      return {
        id: `prop-${pi}`,
        name: address.split(',')[0]?.trim() ?? address,
        address,
        totalUnits: leaseItems.length,
        occupiedUnits: occupiedLeases.length,
        grossPotentialRent: gpr,
        effectiveGrossIncome: egi,
        vacancyLoss: gpr - egi,
        leases: leaseItems,
      };
    });

    sendSuccess(res, { properties, dataMode: 'live' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch rent roll');
  }
});

/**
 * GET /terra/construction
 * Returns construction projects shaped for the mobile Construction Monitor mapper.
 * Field names are normalised to match what the mobile mapper expects.
 */
router.get('/terra/construction', authRead, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await db
      .select()
      .from(terraConstructionProjectsTable)
      .where(
        userId != null
          ? or(
              eq(terraConstructionProjectsTable.ownerUserId, userId),
              isNull(terraConstructionProjectsTable.ownerUserId),
            )
          : isNull(terraConstructionProjectsTable.ownerUserId),
      )
      .orderBy(desc(terraConstructionProjectsTable.createdAt));

    if (rows.length === 0) {
      return sendSuccess(res, { projects: [], dataMode: 'empty' });
    }

    const projects = rows.map((r) => {
      const rawMilestones = (r.milestones as Array<Record<string, unknown>>) ?? [];
      const rawBudgetLines = (r.budgetLines as Array<Record<string, unknown>>) ?? [];

      const milestones = rawMilestones.map((m, mi) => ({
        id: String(m.id ?? mi),
        label: String(m.label ?? m.name ?? 'Milestone'),
        dueDate: String(m.dueDate ?? m.targetDate ?? m.date ?? ''),
        completedDate: m.completedDate != null ? String(m.completedDate) : m.actualDate != null ? String(m.actualDate) : undefined,
        status: (['complete', 'in-progress', 'upcoming', 'delayed'].includes(String(m.status))
          ? m.status
          : 'upcoming') as 'complete' | 'in-progress' | 'upcoming' | 'delayed',
      }));

      const budgetLines = rawBudgetLines.map((b) => ({
        category: String(b.category ?? 'Other'),
        budgeted: Number(b.budgeted ?? b.budget ?? 0),
        spent: Number(b.spent ?? b.actual ?? 0),
        committed: Number(b.committed ?? 0),
      }));

      const effectiveCompletion = r.revisedCompletion ?? r.projectedCompletion ?? '';

      return {
        id: r.externalId ?? String(r.id),
        name: r.name,
        address: r.address ?? '',
        type: r.type ?? '',
        totalBudget: Number(r.totalBudget ?? 0),
        spentToDate: Number(r.totalSpent ?? 0),
        percentComplete: r.overallPct ?? 0,
        startDate: r.startDate ?? '',
        targetCompletion: effectiveCompletion,
        gcName: r.gc ?? '',
        inspectionStatus: 'pending' as const,
        flags: [] as string[],
        milestones,
        budgetLines,
        isDemo: r.isDemo,
      };
    });

    sendSuccess(res, { projects, dataMode: 'live' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch construction projects for mobile');
  }
});

/**
 * GET /terra/screening
 * Returns tenant applications normalised for the mobile Tenant Screening mapper.
 * Status values and field names are mapped to match the mobile ScreeningApplication type.
 */
const terraMobileScreeningHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await db
      .select()
      .from(terraTenantApplicationsTable)
      .where(
        userId != null
          ? or(
              eq(terraTenantApplicationsTable.ownerUserId, userId),
              isNull(terraTenantApplicationsTable.ownerUserId),
            )
          : isNull(terraTenantApplicationsTable.ownerUserId),
      )
      .orderBy(desc(terraTenantApplicationsTable.createdAt));

    if (rows.length === 0) {
      return sendSuccess(res, { applications: [], dataMode: 'empty' });
    }

    const statusMap: Record<string, string> = {
      pending: 'pending',
      approved: 'approved',
      conditional: 'in-review',
      declined: 'denied',
    };

    const creditGradeFromScore = (score: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
      if (score >= 720) return 'A';
      if (score >= 660) return 'B';
      if (score >= 580) return 'C';
      if (score >= 500) return 'D';
      return 'F';
    };

    const applications = rows.map((r) => {
      const annualIncome = Number(r.annualIncome ?? 0);
      const monthlyRent = Number(r.proposedRent ?? 0);
      const creditScore = r.creditScore ?? 0;
      const rtiRaw = Number(r.rentToIncomeRatio ?? 0);
      const rentToIncome = rtiRaw > 1 ? Math.round(rtiRaw) : Math.round(rtiRaw * 100);
      const targetUnit = r.targetUnit ?? '';
      const parts = targetUnit.split('|');
      const propertyName = parts[1]?.trim() ?? '';
      const unitName = parts[0]?.trim() ?? targetUnit;

      return {
        id: r.externalId ?? String(r.id),
        applicantName: r.name,
        property: propertyName,
        unit: unitName,
        submittedDate: r.submittedDate
          ? new Date(r.submittedDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : r.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: (statusMap[r.status] ?? 'pending') as 'approved' | 'pending' | 'in-review' | 'denied' | 'more-info',
        creditScore,
        creditGrade: creditGradeFromScore(creditScore),
        annualIncome,
        monthlyRent,
        rentToIncome,
        backgroundCheck: (r.backgroundClear ? 'clear' : r.backgroundClear === false ? 'flag' : 'pending') as 'clear' | 'flag' | 'pending',
        evictionHistory: (r.priorEvictions ?? 0) > 0,
        employmentStatus: (r.incomeVerified ? 'verified' : 'pending') as 'verified' | 'pending' | 'unverified',
        references: 'pending' as const,
        notes: r.notes ?? undefined,
        isDemo: r.isDemo,
      };
    });

    sendSuccess(res, { applications, dataMode: 'live' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch tenant screening applications for mobile');
  }
};

router.get('/terra/screening', authRead, terraMobileScreeningHandler);
router.get('/terra/tenant-screening', authRead, terraMobileScreeningHandler);

export default router;
