/**
 * billing-net30.ts
 *
 * NET-30 Enterprise Invoice Workflow
 * Lifecycle: draft → review → approved → sent → (partial) → paid | void | in_collections
 *
 * Features:
 *  - Draft invoice creation with line items, PO numbers, custom terms (NET-15/30/45/60)
 *  - Role-gated state machine transitions with full audit trail
 *  - Stripe finalization + hosted PDF on "send"
 *  - AR aging buckets (current, 1–30, 31–60, 61–90, 90+) computed on-demand + daily snapshot
 *  - Dunning automation: configurable cadence, per-invoice pause, audit log
 *  - Partial payments: Stripe webhook + manual mark-as-paid (wire/check)
 *  - Credit memos: applied to outstanding balance, audited
 *  - Collections handoff: freezes dunning, exports PDF packet
 *  - Demo mode returns realistic AR dataset so dashboards render without real customers
 */

import {
  billingAuditLogTable,
  db,
  net30AgingSnapshotsTable,
  net30CreditMemosTable,
  net30DunningConfigTable,
  net30DunningLogTable,
  net30InvoiceLineItemsTable,
  net30InvoicePaymentsTable,
  net30InvoicesTable,
  organizationsTable,
} from '@szl-holdings/db';
import { services } from '@szl-holdings/services';
import { and, asc, desc, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  parsePagination,
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { actorFromReq, writeBillingAudit } from '../lib/billing-audit';
import { buildNet30DunningEmail, sendEmail } from '../lib/email';
import { logger } from '../lib/logger';
import { generateNet30CollectionsPacket } from '../lib/net30-collections-pdf';
import { validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, parseIdParam, requireRole } from '../middlewares/auth';
import { getUserOrgIds } from '../middlewares/tenant-scope';

const router: IRouter = Router();

// ─── Validation Schemas ───────────────────────────────────────────────────────

const lineItemSchema = z.object({
  description: z.string().min(1),
  productCode: z.string().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  taxable: z.boolean().default(false),
  taxCategory: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

const createNet30InvoiceSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  externalCustomerId: z.string().optional(),
  terms: z.enum(['NET-15', 'NET-30', 'NET-45', 'NET-60', 'CUSTOM']).default('NET-30'),
  customTermsDays: z.number().int().positive().optional(),
  poNumber: z.string().optional(),
  billingAddress: z.record(z.unknown()).optional(),
  shippingAddress: z.record(z.unknown()).optional(),
  lineItems: z.array(lineItemSchema).min(1),
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  currency: z.string().default('usd'),
  issuedDate: z.string().datetime().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    mimeType: z.string().optional(),
    sizeBytes: z.number().int().optional(),
  })).optional(),
});

const updateNet30InvoiceSchema = createNet30InvoiceSchema.partial();

const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['stripe', 'wire', 'check', 'ach', 'crypto', 'other']).default('wire'),
  reference: z.string().optional(),
  stripePaymentIntentId: z.string().optional(),
  stripeChargeId: z.string().optional(),
  paidAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const creditMemoSchema = z.object({
  amount: z.number().positive(),
  reason: z.enum(['billing_error', 'service_credit', 'goodwill', 'dispute_resolution', 'other']).default('other'),
  description: z.string().optional(),
});

const dunningConfigSchema = z.object({
  cadenceDays: z.array(z.number().int().positive()).min(1),
  templateName: z.string().default('standard_reminder'),
  enabled: z.boolean().default(true),
});

const listInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  status: z.enum(['draft', 'review', 'approved', 'sent', 'partial', 'paid', 'void', 'in_collections']).optional(),
  demo: z.coerce.boolean().default(false),
});

// ─── Utility: compute invoice totals ─────────────────────────────────────────

function computeTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
  discountPercent?: number,
  discountAmount?: number,
  existingTaxAmount = 0,
): { subtotal: number; discountAmount: number; totalAmount: number; outstandingBalance: number } {
  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  let discount = discountAmount ?? 0;
  if (discountPercent && !discountAmount) {
    discount = (subtotal * discountPercent) / 100;
  }
  const totalAmount = Math.max(0, subtotal - discount + existingTaxAmount);
  return { subtotal, discountAmount: discount, totalAmount, outstandingBalance: totalAmount };
}

// ─── Utility: compute due date from terms ────────────────────────────────────

function computeDueDate(terms: string, customDays?: number | null, issuedAt?: Date): Date {
  const base = issuedAt ?? new Date();
  const dayMap: Record<string, number> = {
    'NET-15': 15,
    'NET-30': 30,
    'NET-45': 45,
    'NET-60': 60,
    CUSTOM: customDays ?? 30,
  };
  const days = dayMap[terms] ?? 30;
  const due = new Date(base);
  due.setDate(due.getDate() + days);
  return due;
}

// ─── Utility: generate invoice number ────────────────────────────────────────

async function generateInvoiceNumber(orgId: number): Promise<string> {
  const year = new Date().getFullYear();
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(net30InvoicesTable)
    .where(and(eq(net30InvoicesTable.orgId, orgId)));
  const seq = (countRow?.count ?? 0) + 1;
  return `INV-${year}-${String(seq).padStart(4, '0')}`;
}

// ─── Utility: recompute invoice balance ──────────────────────────────────────

async function recomputeBalance(invoiceId: number): Promise<void> {
  const [inv] = await db
    .select()
    .from(net30InvoicesTable)
    .where(eq(net30InvoicesTable.id, invoiceId));
  if (!inv) return;

  const payments = await db
    .select({ amount: net30InvoicePaymentsTable.amount })
    .from(net30InvoicePaymentsTable)
    .where(eq(net30InvoicePaymentsTable.invoiceId, invoiceId));

  const credits = await db
    .select({ amount: net30CreditMemosTable.amount })
    .from(net30CreditMemosTable)
    .where(eq(net30CreditMemosTable.invoiceId, invoiceId));

  const paidAmount = payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);
  const creditApplied = credits.reduce((s, c) => s + parseFloat(String(c.amount)), 0);
  const totalAmount = parseFloat(String(inv.totalAmount));
  const outstandingBalance = Math.max(0, totalAmount - paidAmount - creditApplied);

  const newStatus =
    inv.status === 'void' || inv.status === 'in_collections'
      ? inv.status
      : outstandingBalance <= 0
        ? 'paid'
        : paidAmount > 0
          ? 'partial'
          : inv.status;

  await db
    .update(net30InvoicesTable)
    .set({
      paidAmount: String(paidAmount),
      creditApplied: String(creditApplied),
      outstandingBalance: String(outstandingBalance),
      status: newStatus as typeof inv.status,
      paidAt: outstandingBalance <= 0 && !inv.paidAt ? new Date() : inv.paidAt,
      updatedAt: new Date(),
    })
    .where(eq(net30InvoicesTable.id, invoiceId));
}

// ─── Utility: AR aging computation ───────────────────────────────────────────

type AgingBuckets = {
  current: number;
  bucket1to30: number;
  bucket31to60: number;
  bucket61to90: number;
  bucket90plus: number;
  totalOutstanding: number;
  invoiceCount: number;
};

async function computeAgingForOrgs(orgIdFilter: number[] | null): Promise<
  Array<{
    orgId: number;
    orgName: string;
    buckets: AgingBuckets;
    invoices: Array<{
      id: number;
      invoiceNumber: string;
      customerName: string;
      outstandingBalance: number;
      dueDate: Date | null;
      daysOverdue: number;
      bucket: string;
    }>;
  }>
> {
  const now = new Date();

  const baseQuery = db
    .select({
      id: net30InvoicesTable.id,
      orgId: net30InvoicesTable.orgId,
      orgName: organizationsTable.name,
      invoiceNumber: net30InvoicesTable.invoiceNumber,
      customerName: net30InvoicesTable.customerName,
      outstandingBalance: net30InvoicesTable.outstandingBalance,
      dueDate: net30InvoicesTable.dueDate,
    })
    .from(net30InvoicesTable)
    .innerJoin(organizationsTable, eq(net30InvoicesTable.orgId, organizationsTable.id))
    .where(
      and(
        orgIdFilter ? inArray(net30InvoicesTable.orgId, orgIdFilter) : undefined,
        or(
          eq(net30InvoicesTable.status, 'sent'),
          eq(net30InvoicesTable.status, 'partial'),
          eq(net30InvoicesTable.status, 'in_collections'),
        ),
      ),
    );

  const invoices = await baseQuery;

  const orgMap = new Map<
    number,
    {
      orgId: number;
      orgName: string;
      buckets: AgingBuckets;
      invoices: Array<{
        id: number;
        invoiceNumber: string;
        customerName: string;
        outstandingBalance: number;
        dueDate: Date | null;
        daysOverdue: number;
        bucket: string;
      }>;
    }
  >();

  for (const inv of invoices) {
    const balance = parseFloat(String(inv.outstandingBalance));
    if (balance <= 0) continue;

    const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
    const daysOverdue = dueDate
      ? Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 86_400_000))
      : 0;

    let bucket: string;
    if (!dueDate || dueDate > now) {
      bucket = 'current';
    } else if (daysOverdue <= 30) {
      bucket = '1-30';
    } else if (daysOverdue <= 60) {
      bucket = '31-60';
    } else if (daysOverdue <= 90) {
      bucket = '61-90';
    } else {
      bucket = '90+';
    }

    if (!orgMap.has(inv.orgId)) {
      orgMap.set(inv.orgId, {
        orgId: inv.orgId,
        orgName: inv.orgName,
        buckets: { current: 0, bucket1to30: 0, bucket31to60: 0, bucket61to90: 0, bucket90plus: 0, totalOutstanding: 0, invoiceCount: 0 },
        invoices: [],
      });
    }
    const entry = orgMap.get(inv.orgId)!;
    entry.buckets.totalOutstanding += balance;
    entry.buckets.invoiceCount += 1;

    if (bucket === 'current') entry.buckets.current += balance;
    else if (bucket === '1-30') entry.buckets.bucket1to30 += balance;
    else if (bucket === '31-60') entry.buckets.bucket31to60 += balance;
    else if (bucket === '61-90') entry.buckets.bucket61to90 += balance;
    else entry.buckets.bucket90plus += balance;

    entry.invoices.push({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      outstandingBalance: balance,
      dueDate: inv.dueDate,
      daysOverdue,
      bucket,
    });
  }

  return Array.from(orgMap.values());
}

// ─── Demo Mode Dataset ────────────────────────────────────────────────────────

function buildDemoAgingData() {
  const now = new Date();
  const ago = (days: number) => new Date(now.getTime() - days * 86_400_000);

  return {
    demo: true,
    generatedAt: now.toISOString(),
    summary: {
      current: 87_450.0,
      bucket1to30: 42_200.0,
      bucket31to60: 18_750.0,
      bucket61to90: 9_500.0,
      bucket90plus: 4_200.0,
      totalOutstanding: 162_100.0,
      invoiceCount: 14,
    },
    invoices: [
      { invoiceNumber: 'INV-2026-0042', customerName: 'Meridian Capital Partners', outstandingBalance: 35_000, dueDate: ago(-15).toISOString(), daysOverdue: 0, bucket: 'current', terms: 'NET-30' },
      { invoiceNumber: 'INV-2026-0039', customerName: 'Apex Defense Systems', outstandingBalance: 22_450, dueDate: ago(-8).toISOString(), daysOverdue: 0, bucket: 'current', terms: 'NET-45' },
      { invoiceNumber: 'INV-2026-0041', customerName: 'Vantage Infrastructure LLC', outstandingBalance: 30_000, dueDate: ago(-5).toISOString(), daysOverdue: 0, bucket: 'current', terms: 'NET-30' },
      { invoiceNumber: 'INV-2026-0038', customerName: 'Meridian Capital Partners', outstandingBalance: 18_200, dueDate: ago(12).toISOString(), daysOverdue: 12, bucket: '1-30', terms: 'NET-30' },
      { invoiceNumber: 'INV-2026-0036', customerName: 'NovaTech Analytics', outstandingBalance: 24_000, dueDate: ago(21).toISOString(), daysOverdue: 21, bucket: '1-30', terms: 'NET-60' },
      { invoiceNumber: 'INV-2026-0034', customerName: 'Strata Capital Group', outstandingBalance: 15_750, dueDate: ago(43).toISOString(), daysOverdue: 43, bucket: '31-60', terms: 'NET-30' },
      { invoiceNumber: 'INV-2026-0033', customerName: 'Apex Defense Systems', outstandingBalance: 3_000, dueDate: ago(51).toISOString(), daysOverdue: 51, bucket: '31-60', terms: 'NET-30' },
      { invoiceNumber: 'INV-2026-0030', customerName: 'Horizon Maritime LLC', outstandingBalance: 9_500, dueDate: ago(78).toISOString(), daysOverdue: 78, bucket: '61-90', terms: 'NET-45' },
      { invoiceNumber: 'INV-2026-0027', customerName: 'NovaTech Analytics', outstandingBalance: 4_200, dueDate: ago(112).toISOString(), daysOverdue: 112, bucket: '90+', terms: 'NET-30' },
    ],
    agingTrend: [
      { date: ago(6 * 30).toISOString().slice(0, 10), totalOutstanding: 98_000 },
      { date: ago(5 * 30).toISOString().slice(0, 10), totalOutstanding: 115_000 },
      { date: ago(4 * 30).toISOString().slice(0, 10), totalOutstanding: 127_500 },
      { date: ago(3 * 30).toISOString().slice(0, 10), totalOutstanding: 148_200 },
      { date: ago(2 * 30).toISOString().slice(0, 10), totalOutstanding: 155_800 },
      { date: ago(30).toISOString().slice(0, 10), totalOutstanding: 159_300 },
      { date: now.toISOString().slice(0, 10), totalOutstanding: 162_100 },
    ],
  };
}

// ─── Routes: Invoice CRUD ─────────────────────────────────────────────────────

router.post(
  '/billing/net30/invoices',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof createNet30InvoiceSchema>;
      const parsed = createNet30InvoiceSchema.safeParse(body);
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.issues.map((i) => i.message).join('; '));
        return;
      }
      const data = parsed.data;

      const orgId = req.tenantOrgId;
      if (!orgId) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const invoiceNumber = await generateInvoiceNumber(orgId);
      const totals = computeTotals(
        data.lineItems,
        data.discountPercent,
        data.discountAmount,
      );
      const issuedDate = data.issuedDate ? new Date(data.issuedDate) : new Date();
      const dueDate = computeDueDate(data.terms, data.customTermsDays, issuedDate);

      const [invoice] = await db
        .insert(net30InvoicesTable)
        .values({
          orgId,
          invoiceNumber,
          customerName: data.customerName,
          customerEmail: data.customerEmail ?? null,
          externalCustomerId: data.externalCustomerId ?? null,
          terms: data.terms,
          customTermsDays: data.customTermsDays ?? null,
          poNumber: data.poNumber ?? null,
          billingAddress: data.billingAddress ?? null,
          shippingAddress: data.shippingAddress ?? null,
          subtotal: String(totals.subtotal),
          discountAmount: String(totals.discountAmount),
          discountPercent: data.discountPercent ? String(data.discountPercent) : null,
          taxAmount: '0',
          totalAmount: String(totals.totalAmount),
          outstandingBalance: String(totals.outstandingBalance),
          currency: data.currency,
          status: 'draft',
          issuedDate,
          dueDate,
          notes: data.notes ?? null,
          internalNotes: data.internalNotes ?? null,
          attachments: data.attachments ?? null,
          createdBy: req.user?.id ?? null,
        })
        .returning();

      if (!invoice) {
        sendBadRequest(res, 'Failed to create invoice');
        return;
      }

      const lineItemValues = data.lineItems.map((item, idx) => ({
        invoiceId: invoice.id,
        description: item.description,
        productCode: item.productCode ?? null,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        lineTotal: String(item.quantity * item.unitPrice),
        taxable: item.taxable,
        taxCategory: item.taxCategory ?? null,
        sortOrder: item.sortOrder ?? idx,
      }));

      const lineItems = await db.insert(net30InvoiceLineItemsTable).values(lineItemValues).returning();

      void writeBillingAudit({
        req,
        orgId,
        ...actorFromReq(req),
        action: 'net30_invoice.created',
        resource: 'net30_invoice',
        resourceId: String(invoice.id),
        after: { invoiceNumber, status: 'draft', totalAmount: totals.totalAmount },
      });

      sendSuccess(res, { ...invoice, lineItems }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create NET-30 invoice');
    }
  },
);

router.get(
  '/billing/net30/invoices',
  authMiddleware(),
  requireRole('ops', 'analyst'),
  async (req: Request, res: Response) => {
    try {
      const query = listInvoicesQuerySchema.safeParse(req.query);
      if (!query.success) {
        sendBadRequest(res, 'Invalid query params');
        return;
      }
      const { page, limit, status, demo } = query.data;

      if (demo || req.query.demo === 'true') {
        sendSuccess(res, buildDemoAgingData().invoices, 200, { demo: true });
        return;
      }

      const orgIds = getUserOrgIds(req.user!);
      if (orgIds !== null && orgIds.size === 0) {
        sendSuccess(res, [], 200, { page, limit, offset: 0 });
        return;
      }

      const offset = (page - 1) * limit;
      const whereClause = and(
        orgIds !== null ? inArray(net30InvoicesTable.orgId, [...orgIds]) : undefined,
        status ? eq(net30InvoicesTable.status, status) : undefined,
      );

      const invoices = await db
        .select()
        .from(net30InvoicesTable)
        .where(whereClause)
        .orderBy(desc(net30InvoicesTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, invoices, 200, { page, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list NET-30 invoices');
    }
  },
);

router.get(
  '/billing/net30/invoices/:id',
  authMiddleware(),
  requireRole('ops', 'analyst'),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgIds = getUserOrgIds(req.user!);

      const [invoice] = await db
        .select()
        .from(net30InvoicesTable)
        .where(
          and(
            eq(net30InvoicesTable.id, id),
            orgIds !== null ? inArray(net30InvoicesTable.orgId, [...orgIds]) : undefined,
          ),
        );

      if (!invoice) {
        sendNotFound(res, 'Invoice');
        return;
      }

      const [lineItems, payments, creditMemos, dunningLog] = await Promise.all([
        db
          .select()
          .from(net30InvoiceLineItemsTable)
          .where(eq(net30InvoiceLineItemsTable.invoiceId, id))
          .orderBy(asc(net30InvoiceLineItemsTable.sortOrder)),
        db
          .select()
          .from(net30InvoicePaymentsTable)
          .where(eq(net30InvoicePaymentsTable.invoiceId, id))
          .orderBy(desc(net30InvoicePaymentsTable.paidAt)),
        db
          .select()
          .from(net30CreditMemosTable)
          .where(eq(net30CreditMemosTable.invoiceId, id))
          .orderBy(desc(net30CreditMemosTable.appliedAt)),
        db
          .select()
          .from(net30DunningLogTable)
          .where(eq(net30DunningLogTable.invoiceId, id))
          .orderBy(desc(net30DunningLogTable.dispatchedAt)),
      ]);

      sendSuccess(res, { ...invoice, lineItems, payments, creditMemos, dunningLog });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get NET-30 invoice');
    }
  },
);

router.put(
  '/billing/net30/invoices/:id',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.tenantOrgId;
      if (!orgId) {
        sendForbidden(res, 'No organization context');
        return;
      }

      const parsed = updateNet30InvoiceSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.issues.map((i) => i.message).join('; '));
        return;
      }

      const [existing] = await db
        .select()
        .from(net30InvoicesTable)
        .where(and(eq(net30InvoicesTable.id, id), eq(net30InvoicesTable.orgId, orgId)));

      if (!existing) {
        sendNotFound(res, 'Invoice');
        return;
      }

      if (!['draft', 'review'].includes(existing.status)) {
        sendBadRequest(res, `Cannot edit invoice in status '${existing.status}'`);
        return;
      }

      const data = parsed.data;
      const updates: Partial<typeof net30InvoicesTable.$inferInsert> = { updatedAt: new Date() };

      if (data.customerName) updates.customerName = data.customerName;
      if (data.customerEmail !== undefined) updates.customerEmail = data.customerEmail;
      if (data.terms) updates.terms = data.terms;
      if (data.customTermsDays !== undefined) updates.customTermsDays = data.customTermsDays;
      if (data.poNumber !== undefined) updates.poNumber = data.poNumber;
      if (data.billingAddress !== undefined) updates.billingAddress = data.billingAddress;
      if (data.shippingAddress !== undefined) updates.shippingAddress = data.shippingAddress;
      if (data.notes !== undefined) updates.notes = data.notes;
      if (data.internalNotes !== undefined) updates.internalNotes = data.internalNotes;
      if (data.attachments !== undefined) updates.attachments = data.attachments;
      if (data.issuedDate) updates.issuedDate = new Date(data.issuedDate);

      if (data.lineItems) {
        const totals = computeTotals(data.lineItems, data.discountPercent, data.discountAmount);
        updates.subtotal = String(totals.subtotal);
        updates.discountAmount = String(totals.discountAmount);
        if (data.discountPercent !== undefined) updates.discountPercent = String(data.discountPercent);
        updates.totalAmount = String(totals.totalAmount);
        updates.outstandingBalance = String(totals.outstandingBalance);

        if (data.terms || data.customTermsDays !== undefined) {
          updates.dueDate = computeDueDate(
            data.terms ?? existing.terms,
            data.customTermsDays ?? existing.customTermsDays,
            data.issuedDate ? new Date(data.issuedDate) : existing.issuedDate ?? undefined,
          );
        }

        await db
          .delete(net30InvoiceLineItemsTable)
          .where(eq(net30InvoiceLineItemsTable.invoiceId, id));

        await db.insert(net30InvoiceLineItemsTable).values(
          data.lineItems.map((item, idx) => ({
            invoiceId: id,
            description: item.description,
            productCode: item.productCode ?? null,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            lineTotal: String(item.quantity * item.unitPrice),
            taxable: item.taxable,
            taxCategory: item.taxCategory ?? null,
            sortOrder: item.sortOrder ?? idx,
          })),
        );
      }

      const [updated] = await db
        .update(net30InvoicesTable)
        .set(updates)
        .where(eq(net30InvoicesTable.id, id))
        .returning();

      void writeBillingAudit({
        req,
        orgId,
        ...actorFromReq(req),
        action: 'net30_invoice.updated',
        resource: 'net30_invoice',
        resourceId: String(id),
        before: { status: existing.status },
        after: { fields: Object.keys(updates) },
      });

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update NET-30 invoice');
    }
  },
);

// ─── State Machine Transitions ────────────────────────────────────────────────

router.post(
  '/billing/net30/invoices/:id/submit',
  authMiddleware(),
  requireRole('ops'),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }

      const [inv] = await db.select().from(net30InvoicesTable)
        .where(and(eq(net30InvoicesTable.id, id), eq(net30InvoicesTable.orgId, orgId)));
      if (!inv) { sendNotFound(res, 'Invoice'); return; }
      if (inv.status !== 'draft') { sendBadRequest(res, `Invoice is ${inv.status}; must be draft to submit`); return; }

      const [updated] = await db.update(net30InvoicesTable)
        .set({ status: 'review', updatedAt: new Date() })
        .where(eq(net30InvoicesTable.id, id))
        .returning();

      void writeBillingAudit({ req, orgId, ...actorFromReq(req), action: 'net30_invoice.submitted', resource: 'net30_invoice', resourceId: String(id), before: { status: 'draft' }, after: { status: 'review' } });
      sendSuccess(res, updated);
    } catch (err) { handleRouteError(res, err, 'Failed to submit invoice'); }
  },
);

router.post(
  '/billing/net30/invoices/:id/approve',
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }

      const [inv] = await db.select().from(net30InvoicesTable)
        .where(and(eq(net30InvoicesTable.id, id), eq(net30InvoicesTable.orgId, orgId)));
      if (!inv) { sendNotFound(res, 'Invoice'); return; }
      if (inv.status !== 'review') { sendBadRequest(res, `Invoice is ${inv.status}; must be in review to approve`); return; }

      const [updated] = await db.update(net30InvoicesTable)
        .set({ status: 'approved', approvedBy: req.user?.id ?? null, approvedAt: new Date(), updatedAt: new Date() })
        .where(eq(net30InvoicesTable.id, id))
        .returning();

      void writeBillingAudit({ req, orgId, ...actorFromReq(req), action: 'net30_invoice.approved', resource: 'net30_invoice', resourceId: String(id), before: { status: 'review' }, after: { status: 'approved', approvedBy: req.user?.id } });
      sendSuccess(res, updated);
    } catch (err) { handleRouteError(res, err, 'Failed to approve invoice'); }
  },
);

router.post(
  '/billing/net30/invoices/:id/send',
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }

      const [inv] = await db.select().from(net30InvoicesTable)
        .where(and(eq(net30InvoicesTable.id, id), eq(net30InvoicesTable.orgId, orgId)));
      if (!inv) { sendNotFound(res, 'Invoice'); return; }
      if (inv.status !== 'approved') { sendBadRequest(res, `Invoice is ${inv.status}; must be approved to send`); return; }
      if (!inv.customerEmail) { sendBadRequest(res, 'Invoice has no customerEmail — set it before sending'); return; }

      const lineItems = await db.select().from(net30InvoiceLineItemsTable)
        .where(eq(net30InvoiceLineItemsTable.invoiceId, id))
        .orderBy(asc(net30InvoiceLineItemsTable.sortOrder));

      const [org] = await db.select({ billingCustomerId: organizationsTable.billingCustomerId })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, orgId));

      let stripeInvoiceId: string | null = null;
      let stripeHostedInvoiceUrl: string | null = null;
      let stripePdfUrl: string | null = null;

      // Always finalize via Stripe — both live and sandbox modes produce a
      // trackable invoice with a hosted payment URL. If Stripe fails, the
      // invoice stays in 'approved' so the operator can retry without losing data.
      {
        let customerId = org?.billingCustomerId;
        if (!customerId && inv.customerEmail) {
          const existing = await services.stripe.getCustomerByEmail(inv.customerEmail);
          if (existing) {
            customerId = existing.id;
          } else {
            const newCustomer = await services.stripe.createCustomer(inv.customerEmail, inv.customerName);
            customerId = newCustomer.id;
          }
        }

        if (!customerId) {
          sendBadRequest(res, 'No Stripe customer could be resolved or created for this invoice — ensure customerEmail is set');
          return;
        }

        const stripeLineItems = lineItems.map((li) => ({
          description: li.description,
          amount: Math.round(parseFloat(String(li.lineTotal)) * 100),
          currency: inv.currency,
        }));

        const discountAmt = parseFloat(String(inv.discountAmount ?? '0'));
        if (discountAmt > 0) {
          stripeLineItems.push({
            description: 'Discount',
            amount: -Math.round(discountAmt * 100),
            currency: inv.currency,
          });
        }

        const stripeInvoice = await services.stripe.createInvoice(
          customerId,
          stripeLineItems,
          {
            notes: `Invoice ${inv.invoiceNumber} — PO: ${inv.poNumber ?? 'N/A'}`,
            metadata: {
              net30InvoiceId: String(id),
              invoiceNumber: inv.invoiceNumber,
              poNumber: inv.poNumber ?? '',
              orgId: String(orgId),
            },
          },
        );
        stripeInvoiceId = stripeInvoice.id;
        stripeHostedInvoiceUrl = stripeInvoice.hostedInvoiceUrl ?? null;
        stripePdfUrl = null;
      }

      const dunningConfig = await db.select().from(net30DunningConfigTable)
        .where(eq(net30DunningConfigTable.orgId, orgId));
      const cadence = (dunningConfig[0]?.cadenceDays as number[] | null) ?? [3, 7, 14, 21];
      const dueDate = inv.dueDate ?? new Date();
      const nextDunningAt = new Date(dueDate.getTime() + cadence[0] * 86_400_000);

      const [updated] = await db.update(net30InvoicesTable)
        .set({
          status: 'sent',
          sentAt: new Date(),
          sentBy: req.user?.id ?? null,
          stripeInvoiceId,
          stripeHostedInvoiceUrl,
          stripePdfUrl,
          nextDunningAt,
          dunningStep: 0,
          updatedAt: new Date(),
        })
        .where(eq(net30InvoicesTable.id, id))
        .returning();

      if (inv.customerEmail) {
        const emailHtml = buildNet30DunningEmail({
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          totalAmount: parseFloat(String(inv.totalAmount)),
          outstandingBalance: parseFloat(String(inv.outstandingBalance)),
          currency: inv.currency.toUpperCase(),
          dueDate: inv.dueDate?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) ?? 'N/A',
          poNumber: inv.poNumber ?? undefined,
          hostedUrl: stripeHostedInvoiceUrl ?? undefined,
          isInitialSend: true,
        });

        void sendEmail({
          to: inv.customerEmail,
          subject: `Invoice ${inv.invoiceNumber} — Due ${inv.dueDate?.toLocaleDateString('en-US') ?? ''}`,
          html: emailHtml,
        });
      }

      void writeBillingAudit({
        req, orgId, ...actorFromReq(req),
        action: 'net30_invoice.sent', resource: 'net30_invoice', resourceId: String(id),
        stripeInvoiceId,
        before: { status: 'approved' }, after: { status: 'sent', stripeInvoiceId },
      });

      sendSuccess(res, updated);
    } catch (err) { handleRouteError(res, err, 'Failed to send invoice'); }
  },
);

router.post(
  '/billing/net30/invoices/:id/void',
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }

      const [inv] = await db.select().from(net30InvoicesTable)
        .where(and(eq(net30InvoicesTable.id, id), eq(net30InvoicesTable.orgId, orgId)));
      if (!inv) { sendNotFound(res, 'Invoice'); return; }
      if (inv.status === 'paid') { sendBadRequest(res, 'Cannot void a paid invoice'); return; }
      if (inv.status === 'void') { sendBadRequest(res, 'Invoice is already void'); return; }

      const [updated] = await db.update(net30InvoicesTable)
        .set({ status: 'void', updatedAt: new Date() })
        .where(eq(net30InvoicesTable.id, id))
        .returning();

      void writeBillingAudit({ req, orgId, ...actorFromReq(req), action: 'net30_invoice.voided', resource: 'net30_invoice', resourceId: String(id), before: { status: inv.status }, after: { status: 'void' } });
      sendSuccess(res, updated);
    } catch (err) { handleRouteError(res, err, 'Failed to void invoice'); }
  },
);

// ─── AR Aging Report ──────────────────────────────────────────────────────────

router.get(
  '/billing/net30/ar-aging',
  authMiddleware(),
  requireRole('ops', 'analyst'),
  async (req: Request, res: Response) => {
    try {
      if (req.query.demo === 'true') {
        sendSuccess(res, buildDemoAgingData());
        return;
      }

      const orgIds = getUserOrgIds(req.user!);
      const orgIdFilter = orgIds !== null ? [...orgIds] : null;
      const aging = await computeAgingForOrgs(orgIdFilter);

      const rollup: AgingBuckets = { current: 0, bucket1to30: 0, bucket31to60: 0, bucket61to90: 0, bucket90plus: 0, totalOutstanding: 0, invoiceCount: 0 };
      for (const entry of aging) {
        rollup.current += entry.buckets.current;
        rollup.bucket1to30 += entry.buckets.bucket1to30;
        rollup.bucket31to60 += entry.buckets.bucket31to60;
        rollup.bucket61to90 += entry.buckets.bucket61to90;
        rollup.bucket90plus += entry.buckets.bucket90plus;
        rollup.totalOutstanding += entry.buckets.totalOutstanding;
        rollup.invoiceCount += entry.buckets.invoiceCount;
      }

      // Build per-customer rollup across all orgs
      const customerMap = new Map<
        string,
        { customerName: string; externalCustomerId: string | null; buckets: AgingBuckets }
      >();

      for (const orgEntry of aging) {
        for (const inv of orgEntry.invoices) {
          const key = inv.customerName.trim().toLowerCase();
          if (!customerMap.has(key)) {
            customerMap.set(key, {
              customerName: inv.customerName,
              externalCustomerId: null,
              buckets: { current: 0, bucket1to30: 0, bucket31to60: 0, bucket61to90: 0, bucket90plus: 0, totalOutstanding: 0, invoiceCount: 0 },
            });
          }
          const ce = customerMap.get(key)!;
          ce.buckets.totalOutstanding += inv.outstandingBalance;
          ce.buckets.invoiceCount += 1;
          if (inv.bucket === 'current') ce.buckets.current += inv.outstandingBalance;
          else if (inv.bucket === '1-30') ce.buckets.bucket1to30 += inv.outstandingBalance;
          else if (inv.bucket === '31-60') ce.buckets.bucket31to60 += inv.outstandingBalance;
          else if (inv.bucket === '61-90') ce.buckets.bucket61to90 += inv.outstandingBalance;
          else ce.buckets.bucket90plus += inv.outstandingBalance;
        }
      }

      const byCustomer = Array.from(customerMap.values()).sort(
        (a, b) => b.buckets.totalOutstanding - a.buckets.totalOutstanding,
      );

      sendSuccess(res, { generatedAt: new Date().toISOString(), summary: rollup, byOrg: aging, byCustomer });
    } catch (err) { handleRouteError(res, err, 'Failed to compute AR aging'); }
  },
);

router.get(
  '/billing/net30/ar-aging/history',
  authMiddleware(),
  requireRole('ops', 'analyst'),
  async (req: Request, res: Response) => {
    try {
      if (req.query.demo === 'true') {
        sendSuccess(res, buildDemoAgingData().agingTrend);
        return;
      }

      const orgIds = getUserOrgIds(req.user!);
      const snapshots = await db
        .select()
        .from(net30AgingSnapshotsTable)
        .where(orgIds !== null ? inArray(net30AgingSnapshotsTable.orgId, [...orgIds]) : undefined)
        .orderBy(desc(net30AgingSnapshotsTable.snapshotDate))
        .limit(90);

      sendSuccess(res, snapshots);
    } catch (err) { handleRouteError(res, err, 'Failed to get AR aging history'); }
  },
);

// ─── Dunning Management ───────────────────────────────────────────────────────

router.get(
  '/billing/net30/dunning-config',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }

      const [config] = await db.select().from(net30DunningConfigTable)
        .where(eq(net30DunningConfigTable.orgId, orgId));

      sendSuccess(res, config ?? { orgId, cadenceDays: [3, 7, 14, 21], templateName: 'standard_reminder', enabled: true, isDefault: true });
    } catch (err) { handleRouteError(res, err, 'Failed to get dunning config'); }
  },
);

router.put(
  '/billing/net30/dunning-config',
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }

      const parsed = dunningConfigSchema.safeParse(req.body);
      if (!parsed.success) { sendBadRequest(res, parsed.error.issues.map((i) => i.message).join('; ')); return; }

      const [existing] = await db.select().from(net30DunningConfigTable)
        .where(eq(net30DunningConfigTable.orgId, orgId));

      let config;
      if (existing) {
        [config] = await db.update(net30DunningConfigTable)
          .set({ ...parsed.data, updatedAt: new Date() })
          .where(eq(net30DunningConfigTable.orgId, orgId))
          .returning();
      } else {
        [config] = await db.insert(net30DunningConfigTable)
          .values({ orgId, ...parsed.data })
          .returning();
      }

      void writeBillingAudit({ req, orgId, ...actorFromReq(req), action: 'net30_dunning_config.updated', resource: 'net30_dunning_config', after: parsed.data });
      sendSuccess(res, config);
    } catch (err) { handleRouteError(res, err, 'Failed to update dunning config'); }
  },
);

router.post(
  '/billing/net30/invoices/:id/dunning/pause',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }

      const [inv] = await db.select().from(net30InvoicesTable)
        .where(and(eq(net30InvoicesTable.id, id), eq(net30InvoicesTable.orgId, orgId)));
      if (!inv) { sendNotFound(res, 'Invoice'); return; }
      if (inv.status === 'paid' || inv.status === 'void') {
        sendBadRequest(res, `Cannot pause dunning on a ${inv.status} invoice`);
        return;
      }

      const [updated] = await db.update(net30InvoicesTable)
        .set({ dunningPausedAt: new Date(), updatedAt: new Date() })
        .where(eq(net30InvoicesTable.id, id))
        .returning();

      void writeBillingAudit({ req, orgId, ...actorFromReq(req), action: 'net30_invoice.dunning_paused', resource: 'net30_invoice', resourceId: String(id) });
      sendSuccess(res, updated);
    } catch (err) { handleRouteError(res, err, 'Failed to pause dunning'); }
  },
);

router.post(
  '/billing/net30/invoices/:id/dunning/resume',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }

      const [inv] = await db.select().from(net30InvoicesTable)
        .where(and(eq(net30InvoicesTable.id, id), eq(net30InvoicesTable.orgId, orgId)));
      if (!inv) { sendNotFound(res, 'Invoice'); return; }

      const dunningConfig = await db.select().from(net30DunningConfigTable)
        .where(eq(net30DunningConfigTable.orgId, orgId));
      const cadence = (dunningConfig[0]?.cadenceDays as number[] | null) ?? [3, 7, 14, 21];
      const step = Math.min(inv.dunningStep, cadence.length - 1);
      const dueDate = inv.dueDate ?? new Date();
      const nextDunningAt = new Date(dueDate.getTime() + cadence[step] * 86_400_000);

      const [updated] = await db.update(net30InvoicesTable)
        .set({ dunningPausedAt: null, nextDunningAt, updatedAt: new Date() })
        .where(eq(net30InvoicesTable.id, id))
        .returning();

      void writeBillingAudit({ req, orgId, ...actorFromReq(req), action: 'net30_invoice.dunning_resumed', resource: 'net30_invoice', resourceId: String(id) });
      sendSuccess(res, updated);
    } catch (err) { handleRouteError(res, err, 'Failed to resume dunning'); }
  },
);

// ─── Payments ─────────────────────────────────────────────────────────────────

router.post(
  '/billing/net30/invoices/:id/payments',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }

      const parsed = recordPaymentSchema.safeParse(req.body);
      if (!parsed.success) { sendBadRequest(res, parsed.error.issues.map((i) => i.message).join('; ')); return; }

      const [inv] = await db.select().from(net30InvoicesTable)
        .where(and(eq(net30InvoicesTable.id, id), eq(net30InvoicesTable.orgId, orgId)));
      if (!inv) { sendNotFound(res, 'Invoice'); return; }
      if (inv.status === 'void') { sendBadRequest(res, 'Cannot record payment on a voided invoice'); return; }

      const data = parsed.data;
      const [payment] = await db.insert(net30InvoicePaymentsTable)
        .values({
          invoiceId: id,
          amount: String(data.amount),
          currency: inv.currency,
          method: data.method,
          reference: data.reference ?? null,
          stripePaymentIntentId: data.stripePaymentIntentId ?? null,
          stripeChargeId: data.stripeChargeId ?? null,
          paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
          recordedBy: req.user?.id ?? null,
          notes: data.notes ?? null,
        })
        .returning();

      await recomputeBalance(id);

      const [updatedInv] = await db.select().from(net30InvoicesTable).where(eq(net30InvoicesTable.id, id));

      void writeBillingAudit({
        req, orgId, ...actorFromReq(req),
        action: 'net30_invoice.payment_recorded', resource: 'net30_invoice', resourceId: String(id),
        after: { paymentId: payment.id, amount: data.amount, method: data.method, newBalance: updatedInv?.outstandingBalance },
      });

      sendSuccess(res, { payment, invoice: updatedInv }, 201);
    } catch (err) { handleRouteError(res, err, 'Failed to record payment'); }
  },
);

router.get(
  '/billing/net30/invoices/:id/payments',
  authMiddleware(),
  requireRole('ops', 'analyst'),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }

      const [inv] = await db.select({ id: net30InvoicesTable.id }).from(net30InvoicesTable)
        .where(and(eq(net30InvoicesTable.id, id), eq(net30InvoicesTable.orgId, orgId)));
      if (!inv) { sendNotFound(res, 'Invoice'); return; }

      const payments = await db.select().from(net30InvoicePaymentsTable)
        .where(eq(net30InvoicePaymentsTable.invoiceId, id))
        .orderBy(desc(net30InvoicePaymentsTable.paidAt));
      sendSuccess(res, payments);
    } catch (err) { handleRouteError(res, err, 'Failed to list payments'); }
  },
);

// ─── Credit Memos ─────────────────────────────────────────────────────────────

router.post(
  '/billing/net30/invoices/:id/credit-memos',
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }

      const parsed = creditMemoSchema.safeParse(req.body);
      if (!parsed.success) { sendBadRequest(res, parsed.error.issues.map((i) => i.message).join('; ')); return; }

      const [inv] = await db.select().from(net30InvoicesTable)
        .where(and(eq(net30InvoicesTable.id, id), eq(net30InvoicesTable.orgId, orgId)));
      if (!inv) { sendNotFound(res, 'Invoice'); return; }
      if (inv.status === 'void') { sendBadRequest(res, 'Cannot apply credit memo to a voided invoice'); return; }

      const year = new Date().getFullYear();
      const [countRow] = await db.select({ count: sql<number>`count(*)::int` })
        .from(net30CreditMemosTable).where(eq(net30CreditMemosTable.orgId, orgId));
      const memoNumber = `CM-${year}-${String((countRow?.count ?? 0) + 1).padStart(4, '0')}`;

      const data = parsed.data;
      const [memo] = await db.insert(net30CreditMemosTable)
        .values({
          invoiceId: id,
          orgId,
          memoNumber,
          amount: String(data.amount),
          currency: inv.currency,
          reason: data.reason,
          description: data.description ?? null,
          createdBy: req.user?.id ?? null,
        })
        .returning();

      await recomputeBalance(id);
      const [updatedInv] = await db.select().from(net30InvoicesTable).where(eq(net30InvoicesTable.id, id));

      void writeBillingAudit({
        req, orgId, ...actorFromReq(req),
        action: 'net30_credit_memo.created', resource: 'net30_invoice', resourceId: String(id),
        after: { memoId: memo.id, memoNumber, amount: data.amount, reason: data.reason, newBalance: updatedInv?.outstandingBalance },
      });

      sendSuccess(res, { creditMemo: memo, invoice: updatedInv }, 201);
    } catch (err) { handleRouteError(res, err, 'Failed to create credit memo'); }
  },
);

router.get(
  '/billing/net30/invoices/:id/credit-memos',
  authMiddleware(),
  requireRole('ops', 'analyst'),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }

      const [inv] = await db.select({ id: net30InvoicesTable.id }).from(net30InvoicesTable)
        .where(and(eq(net30InvoicesTable.id, id), eq(net30InvoicesTable.orgId, orgId)));
      if (!inv) { sendNotFound(res, 'Invoice'); return; }

      const memos = await db.select().from(net30CreditMemosTable)
        .where(eq(net30CreditMemosTable.invoiceId, id))
        .orderBy(desc(net30CreditMemosTable.appliedAt));
      sendSuccess(res, memos);
    } catch (err) { handleRouteError(res, err, 'Failed to list credit memos'); }
  },
);

// ─── Collections ──────────────────────────────────────────────────────────────

router.post(
  '/billing/net30/invoices/:id/collections',
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }

      const [inv] = await db.select().from(net30InvoicesTable)
        .where(and(eq(net30InvoicesTable.id, id), eq(net30InvoicesTable.orgId, orgId)));
      if (!inv) { sendNotFound(res, 'Invoice'); return; }
      if (!['sent', 'partial'].includes(inv.status)) {
        sendBadRequest(res, `Invoice must be in sent or partial status to flag for collections (current: ${inv.status})`);
        return;
      }

      const [updated] = await db.update(net30InvoicesTable)
        .set({ status: 'in_collections', collectionsAt: new Date(), dunningPausedAt: new Date(), updatedAt: new Date() })
        .where(eq(net30InvoicesTable.id, id))
        .returning();

      void writeBillingAudit({ req, orgId, ...actorFromReq(req), action: 'net30_invoice.collections_flagged', resource: 'net30_invoice', resourceId: String(id), before: { status: inv.status }, after: { status: 'in_collections' } });
      sendSuccess(res, updated);
    } catch (err) { handleRouteError(res, err, 'Failed to flag invoice for collections'); }
  },
);

router.get(
  '/billing/net30/invoices/:id/collections-packet',
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const orgId = req.tenantOrgId;
      if (!orgId) { sendForbidden(res, 'No organization context'); return; }

      const [inv] = await db.select().from(net30InvoicesTable)
        .where(and(eq(net30InvoicesTable.id, id), eq(net30InvoicesTable.orgId, orgId)));
      if (!inv) { sendNotFound(res, 'Invoice'); return; }
      if (inv.status !== 'in_collections') {
        sendBadRequest(res, 'Collections packet is only available for invoices in_collections status');
        return;
      }

      const [org] = await db.select({ name: organizationsTable.name }).from(organizationsTable)
        .where(eq(organizationsTable.id, orgId));

      const [lineItems, payments, creditMemos, dunningLog] = await Promise.all([
        db.select().from(net30InvoiceLineItemsTable).where(eq(net30InvoiceLineItemsTable.invoiceId, id)).orderBy(asc(net30InvoiceLineItemsTable.sortOrder)),
        db.select().from(net30InvoicePaymentsTable).where(eq(net30InvoicePaymentsTable.invoiceId, id)).orderBy(asc(net30InvoicePaymentsTable.paidAt)),
        db.select().from(net30CreditMemosTable).where(eq(net30CreditMemosTable.invoiceId, id)).orderBy(asc(net30CreditMemosTable.appliedAt)),
        db.select().from(net30DunningLogTable).where(eq(net30DunningLogTable.invoiceId, id)).orderBy(asc(net30DunningLogTable.dispatchedAt)),
      ]);

      const pdfBuffer = await generateNet30CollectionsPacket({
        invoice: inv,
        orgName: org?.name ?? 'Organization',
        lineItems,
        payments,
        creditMemos,
        dunningLog,
      });

      void writeBillingAudit({ req, orgId, ...actorFromReq(req), action: 'net30_invoice.collections_packet_exported', resource: 'net30_invoice', resourceId: String(id) });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="collections-packet-${inv.invoiceNumber}.pdf"`);
      res.end(pdfBuffer);
    } catch (err) { handleRouteError(res, err, 'Failed to generate collections packet'); }
  },
);

// ─── Demo AR Data ─────────────────────────────────────────────────────────────

router.get('/billing/net30/demo/ar-aging', async (_req, res) => {
  sendSuccess(res, buildDemoAgingData());
});

export default router;

// ─── Exported Scheduled Job: Daily Aging Snapshot ────────────────────────────

export async function runDailyNet30AgingSnapshot(): Promise<{
  orgsProcessed: number;
  snapshotsWritten: number;
  errors: number;
}> {
  let orgsProcessed = 0;
  let snapshotsWritten = 0;
  let errors = 0;

  try {
    const aging = await computeAgingForOrgs(null);
    const snapshotDate = new Date();
    snapshotDate.setHours(0, 0, 0, 0);

    for (const entry of aging) {
      try {
        await db.insert(net30AgingSnapshotsTable).values({
          orgId: entry.orgId,
          snapshotDate,
          current: String(entry.buckets.current),
          bucket1to30: String(entry.buckets.bucket1to30),
          bucket31to60: String(entry.buckets.bucket31to60),
          bucket61to90: String(entry.buckets.bucket61to90),
          bucket90plus: String(entry.buckets.bucket90plus),
          totalOutstanding: String(entry.buckets.totalOutstanding),
          invoiceCount: entry.buckets.invoiceCount,
        });
        orgsProcessed++;
        snapshotsWritten++;
      } catch (err) {
        errors++;
        logger.warn({ err, orgId: entry.orgId }, '[net30-aging] Failed to write snapshot for org');
      }
    }
  } catch (err) {
    logger.error({ err }, '[net30-aging] Fatal error in daily aging snapshot');
    errors++;
  }

  return { orgsProcessed, snapshotsWritten, errors };
}

// ─── Exported Scheduled Job: Dunning Runner ───────────────────────────────────

export async function runNet30DunningPass(): Promise<{
  invoicesProcessed: number;
  remindersDispatched: number;
  errors: number;
}> {
  let invoicesProcessed = 0;
  let remindersDispatched = 0;
  let errors = 0;
  const now = new Date();

  try {
    const dueInvoices = await db
      .select()
      .from(net30InvoicesTable)
      .where(
        and(
          or(
            eq(net30InvoicesTable.status, 'sent'),
            eq(net30InvoicesTable.status, 'partial'),
          ),
          eq(net30InvoicesTable.dunningEnabled, true),
          isNull(net30InvoicesTable.dunningPausedAt),
          lte(net30InvoicesTable.nextDunningAt, now),
        ),
      );

    for (const inv of dueInvoices) {
      try {
        invoicesProcessed++;
        if (!inv.customerEmail) continue;
        if (!inv.dueDate) continue;

        const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / 86_400_000);

        const dunningConfig = await db.select().from(net30DunningConfigTable)
          .where(eq(net30DunningConfigTable.orgId, inv.orgId));

        // Respect org-level dunning enable flag — if explicitly disabled, skip without error
        if (dunningConfig[0]?.enabled === false) {
          logger.info(
            { invoiceId: inv.id, orgId: inv.orgId },
            '[net30-dunning] Dunning disabled for org — skipping invoice',
          );
          continue;
        }

        const cadence = (dunningConfig[0]?.cadenceDays as number[] | null) ?? [3, 7, 14, 21];
        const nextStep = inv.dunningStep + 1;

        const html = buildNet30DunningEmail({
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          totalAmount: parseFloat(String(inv.totalAmount)),
          outstandingBalance: parseFloat(String(inv.outstandingBalance)),
          currency: inv.currency.toUpperCase(),
          dueDate: inv.dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          daysOverdue,
          poNumber: inv.poNumber ?? undefined,
          hostedUrl: inv.stripeHostedInvoiceUrl ?? undefined,
          isInitialSend: false,
        });

        const subject = daysOverdue > 0
          ? `REMINDER: Invoice ${inv.invoiceNumber} is ${daysOverdue} days past due`
          : `UPCOMING: Invoice ${inv.invoiceNumber} is due soon`;

        const result = await sendEmail({ to: inv.customerEmail, subject, html });

        await db.insert(net30DunningLogTable).values({
          invoiceId: inv.id,
          orgId: inv.orgId,
          step: nextStep,
          daysOverdue,
          recipient: inv.customerEmail,
          template: dunningConfig[0]?.templateName ?? 'standard_reminder',
          subject,
          success: result.success,
          error: result.error ?? null,
          messageId: result.messageId ?? null,
        });

        if (result.success) remindersDispatched++;

        const nextCadenceIndex = nextStep;
        const nextDunningAt = nextCadenceIndex < cadence.length
          ? new Date(inv.dueDate.getTime() + cadence[nextCadenceIndex] * 86_400_000)
          : null;

        await db.update(net30InvoicesTable)
          .set({
            dunningStep: nextStep,
            lastDunningAt: now,
            nextDunningAt,
            updatedAt: new Date(),
          })
          .where(eq(net30InvoicesTable.id, inv.id));
      } catch (err) {
        errors++;
        logger.warn({ err, invoiceId: inv.id }, '[net30-dunning] Error processing invoice dunning');
      }
    }
  } catch (err) {
    logger.error({ err }, '[net30-dunning] Fatal error in dunning pass');
    errors++;
  }

  return { invoicesProcessed, remindersDispatched, errors };
}
