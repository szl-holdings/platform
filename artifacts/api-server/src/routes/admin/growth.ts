import { contactSubmissionsTable, db, leadStatusTable } from '@szl-holdings/db';
import { and, desc, eq, gte, ilike, isNull, lt, or, sql } from 'drizzle-orm';
import type { IRouter } from 'express';
import { logger } from '../../lib/logger.js';

const PRODUCT_KEYS: { label: string; patterns: string[] }[] = [
  { label: 'Counsel', patterns: ['prism', 'counsel', 'legal'] },
  { label: 'Vessels', patterns: ['vessels', 'vessel', 'maritime'] },
  { label: 'Terra', patterns: ['terra', 'real-estate', 'realestate'] },
  { label: 'Aegis', patterns: ['aegis', 'enterprise', 'compliance'] },
  { label: 'Lyte', patterns: ['lyte', 'decisioning'] },
];

function classifyProduct(formKey: string): string {
  const lower = formKey.toLowerCase();
  for (const p of PRODUCT_KEYS) {
    if (p.patterns.some((pat) => lower.includes(pat))) return p.label;
  }
  return 'Other';
}

export function register(router: IRouter): void {
  router.get('/admin/inquiries', async (_req, res) => {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const isDemoForm = or(
        ilike(contactSubmissionsTable.formKey, '%demo%'),
        ilike(contactSubmissionsTable.message, '%demo%'),
        ilike(contactSubmissionsTable.preferredTimeline, '%demo%'),
      )!;

      const [thisWeekRows, lastWeekCount, allOpenRows, unrespondedRows, recentRows] =
        await Promise.all([
          db
            .select({
              id: contactSubmissionsTable.id,
              formKey: contactSubmissionsTable.formKey,
              fullName: contactSubmissionsTable.fullName,
              email: contactSubmissionsTable.email,
              company: contactSubmissionsTable.company,
              createdAt: contactSubmissionsTable.createdAt,
              status: leadStatusTable.status,
            })
            .from(contactSubmissionsTable)
            .leftJoin(
              leadStatusTable,
              eq(leadStatusTable.contactSubmissionId, contactSubmissionsTable.id),
            )
            .where(and(gte(contactSubmissionsTable.createdAt, weekAgo), isDemoForm))
            .orderBy(desc(contactSubmissionsTable.createdAt)),

          db
            .select({ count: sql<number>`count(*)::int` })
            .from(contactSubmissionsTable)
            .where(
              and(
                gte(contactSubmissionsTable.createdAt, twoWeeksAgo),
                lt(contactSubmissionsTable.createdAt, weekAgo),
                isDemoForm,
              ),
            )
            .then((r) => r[0]?.count ?? 0),

          db
            .select({ count: sql<number>`count(*)::int` })
            .from(contactSubmissionsTable)
            .where(eq(contactSubmissionsTable.status, 'open'))
            .then((r) => r[0]?.count ?? 0),

          db
            .select({
              id: contactSubmissionsTable.id,
              formKey: contactSubmissionsTable.formKey,
              fullName: contactSubmissionsTable.fullName,
              email: contactSubmissionsTable.email,
              company: contactSubmissionsTable.company,
              message: contactSubmissionsTable.message,
              createdAt: contactSubmissionsTable.createdAt,
              status: leadStatusTable.status,
            })
            .from(contactSubmissionsTable)
            .leftJoin(
              leadStatusTable,
              eq(leadStatusTable.contactSubmissionId, contactSubmissionsTable.id),
            )
            .where(
              and(
                eq(contactSubmissionsTable.status, 'open'),
                lt(contactSubmissionsTable.createdAt, fortyEightHoursAgo),
                or(isNull(leadStatusTable.status), eq(leadStatusTable.status, 'new'))!,
              ),
            )
            .orderBy(desc(contactSubmissionsTable.createdAt))
            .limit(20),

          db
            .select({
              id: contactSubmissionsTable.id,
              formKey: contactSubmissionsTable.formKey,
              fullName: contactSubmissionsTable.fullName,
              email: contactSubmissionsTable.email,
              company: contactSubmissionsTable.company,
              message: contactSubmissionsTable.message,
              createdAt: contactSubmissionsTable.createdAt,
              status: leadStatusTable.status,
            })
            .from(contactSubmissionsTable)
            .leftJoin(
              leadStatusTable,
              eq(leadStatusTable.contactSubmissionId, contactSubmissionsTable.id),
            )
            .orderBy(desc(contactSubmissionsTable.createdAt))
            .limit(10),
        ]);

      const thisWeekCount = thisWeekRows.length;

      const lastWeekCountNum =
        typeof lastWeekCount === 'number' ? lastWeekCount : Number(lastWeekCount);
      const weekOverWeekDelta = thisWeekCount - lastWeekCountNum;

      const byProduct: Record<string, number> = {};
      for (const row of thisWeekRows) {
        const label = classifyProduct(row.formKey ?? '');
        byProduct[label] = (byProduct[label] ?? 0) + 1;
      }

      const productBreakdown = Object.entries(byProduct)
        .map(([product, count]) => ({ product, count }))
        .sort((a, b) => b.count - a.count);

      res.json({
        thisWeek: {
          count: thisWeekCount,
          delta: weekOverWeekDelta,
          submissions: thisWeekRows.map((r) => ({
            id: r.id,
            formKey: r.formKey,
            product: classifyProduct(r.formKey ?? ''),
            fullName: r.fullName,
            email: r.email,
            company: r.company,
            createdAt: r.createdAt,
            status: r.status ?? 'new',
          })),
        },
        openTotal: typeof allOpenRows === 'number' ? allOpenRows : Number(allOpenRows),
        unresponded: unrespondedRows.map((r) => ({
          id: r.id,
          formKey: r.formKey,
          product: classifyProduct(r.formKey ?? ''),
          fullName: r.fullName,
          email: r.email,
          company: r.company,
          message: r.message,
          createdAt: r.createdAt,
          status: r.status ?? 'new',
          hoursAgo: Math.round((now.getTime() - new Date(r.createdAt as Date).getTime()) / 3600000),
        })),
        productBreakdown,
        recent: recentRows.map((r) => ({
          id: r.id,
          formKey: r.formKey,
          product: classifyProduct(r.formKey ?? ''),
          fullName: r.fullName,
          email: r.email,
          company: r.company,
          createdAt: r.createdAt,
          status: r.status ?? 'new',
        })),
      });
    } catch (err) {
      logger.error({ err }, '[admin/inquiries] GET failed');
      res.status(500).json({ error: 'Failed to fetch growth data' });
    }
  });
}
