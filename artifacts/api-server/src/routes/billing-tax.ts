/**
 * billing-tax.ts
 *
 * Tax automation routes — extends Stripe Tax defaults with:
 *  - Exemption certificate management (upload + expiry tracking)
 *  - Tax ID / VAT number management and validation
 *  - Product- and invoice-level tax category overrides
 *  - Manual per-invoice tax override (with reason + audit entry)
 *  - Per-invoice tax decision endpoint (for checkout integrations)
 *  - Monthly tax report (JSON + CSV) with jurisdiction drill-down
 */

import {
  billingTaxCalculationsTable,
  db,
  taxCategoryOverridesTable,
  taxExemptionCertificatesTable,
  taxIdsTable,
} from '@szl-holdings/db';
import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import type { z } from 'zod';
import {
  handleRouteError,
  parsePagination,
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { actorFromReq, writeBillingAudit } from '../lib/billing-audit';
import {
  buildDemoTaxReport,
  computeTaxDecision,
  persistTaxCalculation,
  validateTaxIdFormat,
} from '../lib/tax-engine';
import {
  taxCategoryOverrideCreateSchema,
  taxDecisionSchema,
  taxExemptionCertCreateSchema,
  taxExemptionCertUpdateSchema,
  taxIdCreateSchema,
  taxIdUpdateSchema,
  taxManualInvoiceOverrideSchema,
  taxReportQuerySchema,
  validateBody,
  validateQuery,
} from '../lib/validation';
import { authMiddleware, parseIdParam, requireRole } from '../middlewares/auth';

const router: IRouter = Router();

// ─── Tax IDs ──────────────────────────────────────────────────────────────────

router.get(
  '/billing/tax/ids',
  authMiddleware(),
  requireRole('ops', 'analyst', 'compliance'),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const ids = await db
        .select()
        .from(taxIdsTable)
        .where(eq(taxIdsTable.orgId, orgId))
        .orderBy(desc(taxIdsTable.createdAt));
      sendSuccess(res, ids);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list tax IDs');
    }
  },
);

router.post(
  '/billing/tax/ids',
  authMiddleware(),
  requireRole('ops'),
  validateBody(taxIdCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const body = req.body as z.infer<typeof taxIdCreateSchema>;
      // Per-jurisdiction format validation — catches obvious typos before DB write
      const formatError = validateTaxIdFormat(body.taxIdType, body.taxIdValue);
      if (formatError) { sendBadRequest(res, formatError); return; }
      const [row] = await db
        .insert(taxIdsTable)
        .values({
          orgId,
          taxIdType: body.taxIdType,
          taxIdValue: body.taxIdValue,
          jurisdiction: body.jurisdiction,
          metadata: body.metadata ?? null,
        })
        .returning();
      void writeBillingAudit({
        req,
        orgId,
        ...actorFromReq(req),
        action: 'tax.id.created',
        resource: 'tax_id',
        resourceId: String(row.id),
        after: { taxIdType: body.taxIdType, jurisdiction: body.jurisdiction },
      });
      sendSuccess(res, row, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create tax ID');
    }
  },
);

router.patch(
  '/billing/tax/ids/:id',
  authMiddleware(),
  requireRole('ops'),
  validateBody(taxIdUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const id = parseIdParam(req.params.id);
      const body = req.body as z.infer<typeof taxIdUpdateSchema>;
      const [existing] = await db
        .select()
        .from(taxIdsTable)
        .where(and(eq(taxIdsTable.id, id), eq(taxIdsTable.orgId, orgId)));
      if (!existing) { sendNotFound(res, 'Tax ID'); return; }
      const [updated] = await db
        .update(taxIdsTable)
        .set({
          ...(body.validationStatus !== undefined ? { validationStatus: body.validationStatus } : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
          ...(body.metadata !== undefined ? { metadata: body.metadata } : {}),
          updatedAt: new Date(),
        })
        .where(eq(taxIdsTable.id, id))
        .returning();
      void writeBillingAudit({
        req, orgId, ...actorFromReq(req),
        action: 'tax.id.updated', resource: 'tax_id', resourceId: String(id),
        before: existing as unknown as Record<string, unknown>,
        after: body as unknown as Record<string, unknown>,
      });
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update tax ID');
    }
  },
);

router.delete(
  '/billing/tax/ids/:id',
  authMiddleware(),
  requireRole('ops'),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const id = parseIdParam(req.params.id);
      const [existing] = await db
        .select()
        .from(taxIdsTable)
        .where(and(eq(taxIdsTable.id, id), eq(taxIdsTable.orgId, orgId)));
      if (!existing) { sendNotFound(res, 'Tax ID'); return; }
      await db
        .update(taxIdsTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(taxIdsTable.id, id));
      void writeBillingAudit({
        req, orgId, ...actorFromReq(req),
        action: 'tax.id.deactivated', resource: 'tax_id', resourceId: String(id),
      });
      sendSuccess(res, { deleted: true, id });
    } catch (err) {
      handleRouteError(res, err, 'Failed to deactivate tax ID');
    }
  },
);

// ─── Exemption Certificates ───────────────────────────────────────────────────

router.get(
  '/billing/tax/exemptions',
  authMiddleware(),
  requireRole('ops', 'analyst', 'compliance'),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const certs = await db
        .select()
        .from(taxExemptionCertificatesTable)
        .where(eq(taxExemptionCertificatesTable.orgId, orgId))
        .orderBy(desc(taxExemptionCertificatesTable.createdAt));
      sendSuccess(res, certs);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list exemption certificates');
    }
  },
);

router.post(
  '/billing/tax/exemptions',
  authMiddleware(),
  requireRole('ops'),
  validateBody(taxExemptionCertCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const body = req.body as z.infer<typeof taxExemptionCertCreateSchema>;
      const [row] = await db
        .insert(taxExemptionCertificatesTable)
        .values({
          orgId,
          jurisdiction: body.jurisdiction,
          exemptionType: body.exemptionType,
          certificateNumber: body.certificateNumber ?? null,
          fileUrl: body.fileUrl ?? null,
          notes: body.notes ?? null,
          metadata: body.metadata ?? null,
          issuedAt: body.issuedAt ? new Date(body.issuedAt) : null,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        })
        .returning();
      void writeBillingAudit({
        req, orgId, ...actorFromReq(req),
        action: 'tax.exemption.created', resource: 'tax_exemption_cert', resourceId: String(row.id),
        after: { jurisdiction: body.jurisdiction, exemptionType: body.exemptionType, expiresAt: body.expiresAt },
      });
      sendSuccess(res, row, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create exemption certificate');
    }
  },
);

router.patch(
  '/billing/tax/exemptions/:id',
  authMiddleware(),
  requireRole('ops', 'compliance'),
  validateBody(taxExemptionCertUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const id = parseIdParam(req.params.id);
      const body = req.body as z.infer<typeof taxExemptionCertUpdateSchema>;
      const [existing] = await db
        .select()
        .from(taxExemptionCertificatesTable)
        .where(and(eq(taxExemptionCertificatesTable.id, id), eq(taxExemptionCertificatesTable.orgId, orgId)));
      if (!existing) { sendNotFound(res, 'Exemption certificate'); return; }
      const [updated] = await db
        .update(taxExemptionCertificatesTable)
        .set({
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.notes !== undefined ? { notes: body.notes } : {}),
          ...(body.expiresAt !== undefined ? { expiresAt: new Date(body.expiresAt) } : {}),
          updatedAt: new Date(),
        })
        .where(eq(taxExemptionCertificatesTable.id, id))
        .returning();
      void writeBillingAudit({
        req, orgId, ...actorFromReq(req),
        action: 'tax.exemption.updated', resource: 'tax_exemption_cert', resourceId: String(id),
        before: existing as unknown as Record<string, unknown>,
        after: body as unknown as Record<string, unknown>,
      });
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update exemption certificate');
    }
  },
);

router.delete(
  '/billing/tax/exemptions/:id',
  authMiddleware(),
  requireRole('ops'),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const id = parseIdParam(req.params.id);
      const [existing] = await db
        .select()
        .from(taxExemptionCertificatesTable)
        .where(and(eq(taxExemptionCertificatesTable.id, id), eq(taxExemptionCertificatesTable.orgId, orgId)));
      if (!existing) { sendNotFound(res, 'Exemption certificate'); return; }
      await db
        .update(taxExemptionCertificatesTable)
        .set({ status: 'revoked', updatedAt: new Date() })
        .where(eq(taxExemptionCertificatesTable.id, id));
      void writeBillingAudit({
        req, orgId, ...actorFromReq(req),
        action: 'tax.exemption.revoked', resource: 'tax_exemption_cert', resourceId: String(id),
      });
      sendSuccess(res, { revoked: true, id });
    } catch (err) {
      handleRouteError(res, err, 'Failed to revoke exemption certificate');
    }
  },
);

// ─── Tax Category Overrides ───────────────────────────────────────────────────

router.get(
  '/billing/tax/category-overrides',
  authMiddleware(),
  requireRole('ops', 'analyst', 'compliance'),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const rows = await db
        .select()
        .from(taxCategoryOverridesTable)
        .where(and(eq(taxCategoryOverridesTable.orgId, orgId), eq(taxCategoryOverridesTable.isActive, true)))
        .orderBy(desc(taxCategoryOverridesTable.createdAt));
      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list tax category overrides');
    }
  },
);

router.post(
  '/billing/tax/category-overrides',
  authMiddleware(),
  requireRole('ops'),
  validateBody(taxCategoryOverrideCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const body = req.body as z.infer<typeof taxCategoryOverrideCreateSchema>;
      const actor = actorFromReq(req);
      const [row] = await db
        .insert(taxCategoryOverridesTable)
        .values({
          orgId,
          scope: body.scope,
          scopeRef: body.scopeRef,
          jurisdiction: body.jurisdiction,
          taxBehavior: body.taxBehavior,
          taxCode: body.taxCode ?? null,
          taxRate: body.taxRate !== undefined ? String(body.taxRate) : null,
          reasonCode: body.reasonCode,
          description: body.description ?? null,
          appliedBy: actor.actorId ?? null,
          metadata: body.metadata ?? null,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        })
        .returning();
      void writeBillingAudit({
        req, orgId, ...actor,
        action: 'tax.category_override.created', resource: 'tax_category_override', resourceId: String(row.id),
        after: {
          scope: body.scope, scopeRef: body.scopeRef,
          jurisdiction: body.jurisdiction, taxBehavior: body.taxBehavior,
          reasonCode: body.reasonCode,
        },
      });
      sendSuccess(res, row, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create tax category override');
    }
  },
);

router.delete(
  '/billing/tax/category-overrides/:id',
  authMiddleware(),
  requireRole('ops'),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const id = parseIdParam(req.params.id);
      const [existing] = await db
        .select()
        .from(taxCategoryOverridesTable)
        .where(and(eq(taxCategoryOverridesTable.id, id), eq(taxCategoryOverridesTable.orgId, orgId)));
      if (!existing) { sendNotFound(res, 'Tax category override'); return; }
      await db
        .update(taxCategoryOverridesTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(taxCategoryOverridesTable.id, id), eq(taxCategoryOverridesTable.orgId, orgId)));
      void writeBillingAudit({
        req, orgId, ...actorFromReq(req),
        action: 'tax.category_override.deactivated', resource: 'tax_category_override', resourceId: String(id),
      });
      sendSuccess(res, { deactivated: true, id });
    } catch (err) {
      handleRouteError(res, err, 'Failed to deactivate tax category override');
    }
  },
);

// ─── Manual invoice tax override ──────────────────────────────────────────────

router.post(
  '/billing/tax/invoice-override',
  authMiddleware(),
  requireRole('ops'),
  validateBody(taxManualInvoiceOverrideSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const body = req.body as z.infer<typeof taxManualInvoiceOverrideSchema>;
      const actor = actorFromReq(req);

      const taxInput = {
        orgId,
        invoiceId: body.invoiceId,
        sellerCountry: body.sellerCountry,
        customerCountry: body.customerCountry,
        amountExclusive: body.amountExclusive,
        currency: body.currency,
        manualOverride: {
          taxRate: body.taxRate,
          reasonCode: body.reasonCode,
          description: body.description,
        },
      };

      const decision = await computeTaxDecision(taxInput);
      const calcId = await persistTaxCalculation(taxInput, decision);

      void writeBillingAudit({
        req, orgId, ...actor,
        action: 'tax.invoice_override.applied', resource: 'tax_calculation', resourceId: String(calcId),
        after: {
          invoiceId: body.invoiceId,
          taxRate: body.taxRate,
          reasonCode: body.reasonCode,
          taxAmountExclusive: decision.taxAmountExclusive,
        },
      });

      sendSuccess(res, {
        calculationId: calcId,
        decision,
        invoiceId: body.invoiceId,
        lineItemDescriptor: decision.lineItemDescriptor,
      }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to apply manual invoice tax override');
    }
  },
);

// ─── Tax decision endpoint ────────────────────────────────────────────────────

router.post(
  '/billing/tax/decision',
  authMiddleware(),
  validateBody(taxDecisionSchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const body = req.body as z.infer<typeof taxDecisionSchema>;
      const input = { ...body, orgId };
      const decision = await computeTaxDecision(input);
      const calcId = await persistTaxCalculation(input, decision);
      sendSuccess(res, { calculationId: calcId, decision });
    } catch (err) {
      handleRouteError(res, err, 'Failed to compute tax decision');
    }
  },
);

// ─── Monthly tax report ───────────────────────────────────────────────────────

router.get(
  '/billing/tax/report',
  authMiddleware(),
  requireRole('ops', 'analyst', 'compliance'),
  validateQuery(taxReportQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const query = req.query as z.infer<typeof taxReportQuerySchema>;
      const { year, month, format } = query;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      const rows = await db
        .select()
        .from(billingTaxCalculationsTable)
        .where(
          and(
            eq(billingTaxCalculationsTable.orgId, orgId),
            gte(billingTaxCalculationsTable.calculatedAt, startDate),
            lt(billingTaxCalculationsTable.calculatedAt, endDate),
          ),
        )
        .orderBy(billingTaxCalculationsTable.jurisdiction, billingTaxCalculationsTable.calculatedAt);

      const isDemo = rows.length === 0;
      const reportRows = isDemo
        ? buildDemoTaxReport(month, year)
        : aggregateByJurisdiction(rows, month, year);

      if (format === 'csv') {
        const csv = buildCsv(reportRows, month, year);
        res.set('Content-Type', 'text/csv');
        res.set(
          'Content-Disposition',
          `attachment; filename="tax-report-${year}-${String(month).padStart(2, '0')}.csv"`,
        );
        res.send(csv);
        return;
      }

      sendSuccess(res, {
        year,
        month,
        orgId,
        demo: isDemo,
        jurisdictions: reportRows,
        totalTaxableRevenue: reportRows.reduce((s, r) => s + r.taxableRevenue, 0),
        totalTaxCollected: reportRows.reduce((s, r) => s + r.taxCollected, 0),
        rowCount: rows.length,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate tax report');
    }
  },
);

// ─── Tax calculations list (audit drill-down) ─────────────────────────────────

router.get(
  '/billing/tax/calculations',
  authMiddleware(),
  requireRole('ops', 'analyst', 'compliance'),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }
      const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
      const calcs = await db
        .select()
        .from(billingTaxCalculationsTable)
        .where(eq(billingTaxCalculationsTable.orgId, orgId))
        .orderBy(desc(billingTaxCalculationsTable.calculatedAt))
        .limit(limit)
        .offset(offset);
      sendSuccess(res, calcs, 200, { page, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list tax calculations');
    }
  },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

type TaxCalcRow = typeof billingTaxCalculationsTable.$inferSelect;

function aggregateByJurisdiction(
  rows: TaxCalcRow[],
  month: number,
  year: number,
): Array<{
  jurisdiction: string;
  taxType: string;
  taxRate: number;
  source: string;
  taxableRevenue: number;
  taxCollected: number;
  invoiceCount: number;
  month: number;
  year: number;
  calculations: TaxCalcRow[];
}> {
  const map = new Map<string, TaxCalcRow[]>();
  for (const row of rows) {
    const key = row.jurisdiction ?? 'UNKNOWN';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }

  return Array.from(map.entries()).map(([jurisdiction, calcs]) => {
    const taxableRevenue = calcs.reduce((s, c) => s + Number(c.basisAmount ?? 0), 0);
    const taxCollected = calcs.reduce((s, c) => s + Number(c.taxAmountExclusive ?? 0), 0);
    const sample = calcs[0];
    return {
      jurisdiction,
      taxType: sample?.taxType ?? 'unknown',
      taxRate: Number(sample?.taxRate ?? 0),
      source: sample?.source ?? 'stripe_tax',
      taxableRevenue: Math.round(taxableRevenue * 100) / 100,
      taxCollected: Math.round(taxCollected * 100) / 100,
      invoiceCount:
        new Set(calcs.map((c) => c.stripeInvoiceId).filter(Boolean)).size || calcs.length,
      month,
      year,
      calculations: calcs,
    };
  });
}

function buildCsv(
  rows: Array<{
    jurisdiction: string;
    taxType: string;
    taxRate: number;
    source: string;
    taxableRevenue: number;
    taxCollected: number;
    invoiceCount: number;
    month?: number;
    year?: number;
  }>,
  month: number,
  year: number,
): string {
  const header =
    'Jurisdiction,Tax Type,Tax Rate,Source,Taxable Revenue,Tax Collected,Invoice Count,Month,Year';
  const lines = rows.map((r) =>
    [
      r.jurisdiction,
      r.taxType,
      r.taxRate,
      r.source,
      r.taxableRevenue.toFixed(2),
      r.taxCollected.toFixed(2),
      r.invoiceCount,
      r.month ?? month,
      r.year ?? year,
    ].join(','),
  );
  return [header, ...lines].join('\n');
}

export default router;
