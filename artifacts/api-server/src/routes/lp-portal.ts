import { hashIp } from '@szl-holdings/audit';
import { bodyShape } from '@szl-holdings/contracts/common';
import {
  db,
  type FundAccreditedInvestor,
  fundAccreditedInvestorsTable,
  fundLpActivityEventsTable,
  fundLpCapitalAccountsTable,
  fundLpDataRoomDocsTable,
  fundLpMessagesTable,
  fundLpReportsTable,
  fundNavRecordsTable,
} from '@szl-holdings/db';
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { type IRouter, type Request, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, parseIdParam } from '../middlewares/auth';

const router: IRouter = Router();

// LP portal endpoints power the marketing demo at /fund/lp-portal AND the real
// authenticated LP experience. Auth is optional: unauthenticated requests are
// scoped to demo rows (is_demo = true). Authenticated LPs see only their own
// account; GP-tier users (admin/exec/ops/super_admin/compliance) see all rows.

const optionalAuth = authMiddleware({ required: false });

const GP_ROLES = new Set(['super_admin', 'admin', 'exec', 'ops', 'compliance']);

interface LpScope {
  isAuthenticated: boolean;
  isGp: boolean;
  isDemoOnly: boolean;
  selfLpId: number | null;
}

async function resolveScope(req: Request): Promise<LpScope> {
  const user = req.user;
  if (!user) return { isAuthenticated: false, isGp: false, isDemoOnly: true, selfLpId: null };
  const isGp = user.roles.some((r) => GP_ROLES.has(r));
  let selfLpId: number | null = null;
  if (user.email) {
    const [match] = await db
      .select({ id: fundAccreditedInvestorsTable.id })
      .from(fundAccreditedInvestorsTable)
      .where(eq(fundAccreditedInvestorsTable.contactEmail, user.email));
    if (match) selfLpId = match.id;
  }
  return {
    isAuthenticated: true,
    isGp,
    isDemoOnly: !isGp && selfLpId === null,
    selfLpId,
  };
}

async function loadLp(lpId: number, scope: LpScope): Promise<FundAccreditedInvestor | null> {
  const [lp] = await db
    .select()
    .from(fundAccreditedInvestorsTable)
    .where(eq(fundAccreditedInvestorsTable.id, lpId));
  if (!lp) return null;
  if (scope.isGp) return lp;
  if (scope.selfLpId === lp.id) return lp;
  // demo-only access: only return rows flagged is_demo (stored in metadata)
  const isDemo = (lp.metadata as { is_demo?: boolean } | null)?.is_demo === true;
  if (scope.isDemoOnly && isDemo) return lp;
  return null;
}

function tierFor(lp: FundAccreditedInvestor): 'qualified_lp' | 'all_lp' {
  return lp.qualifiedEligiblePerson ? 'qualified_lp' : 'all_lp';
}

function visibleTiers(lp: FundAccreditedInvestor): Array<'public' | 'all_lp' | 'qualified_lp'> {
  return tierFor(lp) === 'qualified_lp'
    ? ['public', 'all_lp', 'qualified_lp']
    : ['public', 'all_lp'];
}

// ─── LP ROSTER ────────────────────────────────────────────────────────────────

router.get('/lp-portal/lps', optionalAuth, async (req, res) => {
  try {
    const scope = await resolveScope(req);
    let rows: FundAccreditedInvestor[];
    if (scope.isGp) {
      rows = await db
        .select()
        .from(fundAccreditedInvestorsTable)
        .orderBy(asc(fundAccreditedInvestorsTable.lpName));
    } else if (scope.selfLpId) {
      rows = await db
        .select()
        .from(fundAccreditedInvestorsTable)
        .where(eq(fundAccreditedInvestorsTable.id, scope.selfLpId));
    } else {
      // demo only
      rows = await db
        .select()
        .from(fundAccreditedInvestorsTable)
        .orderBy(asc(fundAccreditedInvestorsTable.lpName));
      rows = rows.filter((r) => (r.metadata as { is_demo?: boolean } | null)?.is_demo === true);
    }
    sendSuccess(
      res,
      rows.map((r) => ({
        id: r.id,
        name: r.lpName,
        contact: r.contactEmail,
        tier: tierFor(r),
        joinDate: (r.metadata as { join_date?: string } | null)?.join_date ?? null,
        isDemo: (r.metadata as { is_demo?: boolean } | null)?.is_demo === true,
      })),
      200,
      { scope: { isGp: scope.isGp, isDemoOnly: scope.isDemoOnly, selfLpId: scope.selfLpId } },
    );
  } catch (err) {
    handleRouteError(res, err, 'Failed to list LPs');
  }
});

// ─── CAPITAL ACCOUNT ─────────────────────────────────────────────────────────

router.get('/lp-portal/lps/:id/capital-account', optionalAuth, async (req, res) => {
  try {
    const lpId = parseIdParam(req.params.id);
    const scope = await resolveScope(req);
    const lp = await loadLp(lpId, scope);
    if (!lp) {
      sendForbidden(res, "Not authorized for this LP's capital account");
      return;
    }

    const [acct] = await db
      .select()
      .from(fundLpCapitalAccountsTable)
      .where(eq(fundLpCapitalAccountsTable.lpId, lp.id))
      .orderBy(desc(fundLpCapitalAccountsTable.updatedAt))
      .limit(1);

    if (!acct) {
      sendNotFound(res, 'Capital account');
      return;
    }

    const meta = (acct.metadata as { units_held?: number } | null) ?? {};
    sendSuccess(res, {
      lpId: lp.id,
      lpName: lp.lpName,
      tier: tierFor(lp),
      contact: lp.contactEmail,
      joinDate: (lp.metadata as { join_date?: string } | null)?.join_date ?? null,
      commitmentCents: acct.commitmentCents,
      calledCents: acct.calledCents,
      uncalledCents: acct.uncalledCents,
      distributionsCents: acct.distributionsCents,
      currentNavCents: acct.currentNavCents,
      ownershipPct: acct.ownershipPct ? Number(acct.ownershipPct) : null,
      unitsHeld: meta.units_held ?? null,
      managementFeesPaidCents: acct.managementFeesPaidCents,
      carriedInterestPaidCents: acct.carriedInterestPaidCents,
      vintage: acct.vintage,
      updatedAt: acct.updatedAt,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load capital account');
  }
});

// ─── NAV HISTORY ─────────────────────────────────────────────────────────────

router.get('/lp-portal/nav-history', optionalAuth, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(fundNavRecordsTable)
      .orderBy(desc(fundNavRecordsTable.navDate))
      .limit(8);
    const ordered = rows
      .slice()
      .reverse()
      .map((r) => {
        const meta = (r.metadata as { period?: string; nav_per_unit?: number } | null) ?? {};
        const distributedDelta = 0; // simplified; consumer derives per-period delta
        return {
          id: r.id,
          navDate: r.navDate,
          period: meta.period ?? r.navDate,
          navPerUnit: meta.nav_per_unit ?? null,
          totalNavCents: r.totalNavCents,
          distributedCents: r.distributedCents,
          netIrr: r.netIrr ? Number(r.netIrr) : null,
          tvpi: r.tvpi ? Number(r.tvpi) : null,
          dpi: r.dpi ? Number(r.dpi) : null,
          distributedDelta,
        };
      });
    sendSuccess(res, ordered);
  } catch (err) {
    handleRouteError(res, err, 'Failed to load NAV history');
  }
});

// ─── DATA ROOM DOCUMENTS (server-side permission filtering) ──────────────────

router.get(
  '/lp-portal/lps/:id/documents',
  optionalAuth,
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const lpId = parseIdParam(req.params.id);
      const scope = await resolveScope(req);
      const lp = await loadLp(lpId, scope);
      if (!lp) {
        sendForbidden(res, "Not authorized for this LP's documents");
        return;
      }

      const tiers = visibleTiers(lp);
      const folder = req.query.folder as string | undefined;

      const conditions = [inArray(fundLpDataRoomDocsTable.permissionTier, tiers)];
      if (scope.isDemoOnly) conditions.push(eq(fundLpDataRoomDocsTable.isDemo, true));
      if (folder && folder !== 'All') conditions.push(eq(fundLpDataRoomDocsTable.folder, folder));

      const rows = await db
        .select()
        .from(fundLpDataRoomDocsTable)
        .where(and(...conditions))
        .orderBy(desc(fundLpDataRoomDocsTable.createdAt));

      // Total restricted = all docs the LP is NOT seeing (gp_only / co_investor or wrong tier)
      const totalDocsConditions = scope.isDemoOnly
        ? [eq(fundLpDataRoomDocsTable.isDemo, true)]
        : [];
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(fundLpDataRoomDocsTable)
        .where(totalDocsConditions.length ? and(...totalDocsConditions) : sql`true`);

      sendSuccess(
        res,
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          folder: r.folder,
          type: r.fileType,
          size: r.sizeLabel,
          uploaded: r.uploadedAt,
          permission: r.permissionTier,
          watermarked: r.watermarked,
        })),
        200,
        { totalAvailable: total, visibleTiers: tiers, accessTier: tierFor(lp) },
      );
    } catch (err) {
      handleRouteError(res, err, 'Failed to load data room documents');
    }
  },
);

// ─── QUARTERLY REPORTS ───────────────────────────────────────────────────────

router.get('/lp-portal/lps/:id/reports', optionalAuth, async (req, res) => {
  try {
    const lpId = parseIdParam(req.params.id);
    const scope = await resolveScope(req);
    const lp = await loadLp(lpId, scope);
    if (!lp) {
      sendForbidden(res, "Not authorized for this LP's reports");
      return;
    }

    const conditions = [
      eq(fundLpReportsTable.reportType, 'quarterly' as const),
      or(
        eq(fundLpReportsTable.status, 'distributed' as const),
        eq(fundLpReportsTable.status, 'approved' as const),
      )!,
    ];
    const rows = await db
      .select()
      .from(fundLpReportsTable)
      .where(and(...conditions))
      .orderBy(desc(fundLpReportsTable.periodEnd))
      .limit(20);

    sendSuccess(
      res,
      rows.map((r) => {
        const meta = (r.metadata as { size_label?: string; nav_per_unit?: number } | null) ?? {};
        return {
          id: r.id,
          period: r.reportingPeriod,
          generated: r.distributedAt
            ? new Date(r.distributedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : new Date(r.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
          navPerUnit: meta.nav_per_unit ?? null,
          irr: r.netIrr ? Number(r.netIrr) : null,
          tvpi: r.tvpi ? Number(r.tvpi) : null,
          dpi: r.dpi ? Number(r.dpi) : null,
          size: meta.size_label ?? '—',
        };
      }),
    );
  } catch (err) {
    handleRouteError(res, err, 'Failed to load quarterly reports');
  }
});

// ─── ACTIVITY LOG (audit trail) ──────────────────────────────────────────────

const ACTION_LABELS: Record<string, 'Viewed' | 'Downloaded' | 'Messaged GP'> = {
  viewed: 'Viewed',
  downloaded: 'Downloaded',
  messaged_gp: 'Messaged GP',
};

function relativeTime(d: Date): string {
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'Yesterday';
  if (day < 7)
    return d.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

router.get('/lp-portal/lps/:id/activity', optionalAuth, async (req, res) => {
  try {
    const lpId = parseIdParam(req.params.id);
    const scope = await resolveScope(req);
    const lp = await loadLp(lpId, scope);
    if (!lp) {
      sendForbidden(res, "Not authorized for this LP's activity");
      return;
    }

    const rows = await db
      .select()
      .from(fundLpActivityEventsTable)
      .where(eq(fundLpActivityEventsTable.lpId, lp.id))
      .orderBy(desc(fundLpActivityEventsTable.occurredAt))
      .limit(100);

    sendSuccess(
      res,
      rows.map((r) => ({
        id: r.id,
        action: ACTION_LABELS[r.action] ?? r.action,
        target: r.target,
        time: relativeTime(new Date(r.occurredAt)),
        occurredAt: r.occurredAt,
      })),
    );
  } catch (err) {
    handleRouteError(res, err, 'Failed to load activity');
  }
});

router.post(
  '/lp-portal/lps/:id/activity',
  optionalAuth,
  validateBody(
    bodyShape({
      documentId: z.unknown().optional(),
      reportId: z.unknown().optional(),
      target: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const lpId = parseIdParam(req.params.id);
      const scope = await resolveScope(req);
      const lp = await loadLp(lpId, scope);
      if (!lp) {
        sendForbidden(res, "Not authorized for this LP's activity");
        return;
      }

      const body = req.body as
        | { action?: string; target?: string; documentId?: number; reportId?: number }
        | undefined;
      const actionRaw = (body?.action ?? '').toLowerCase();
      const action = (
        ['viewed', 'downloaded', 'messaged_gp', 'logged_in'].includes(actionRaw) ? actionRaw : null
      ) as 'viewed' | 'downloaded' | 'messaged_gp' | 'logged_in' | null;
      if (!action || !body?.target) {
        sendBadRequest(res, 'action and target are required');
        return;
      }

      const isDemo =
        scope.isDemoOnly || (lp.metadata as { is_demo?: boolean } | null)?.is_demo === true;

      const [inserted] = await db
        .insert(fundLpActivityEventsTable)
        .values({
          lpId: lp.id,
          action,
          target: String(body.target).slice(0, 280),
          documentId: typeof body.documentId === 'number' ? body.documentId : null,
          reportId: typeof body.reportId === 'number' ? body.reportId : null,
          ipAddress: hashIp(
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null,
          ),
          userAgent: (req.headers['user-agent'] as string) || null,
          isDemo,
        })
        .returning();

      sendSuccess(
        res,
        {
          id: inserted.id,
          action: ACTION_LABELS[inserted.action] ?? inserted.action,
          target: inserted.target,
          time: 'Just now',
          occurredAt: inserted.occurredAt,
        },
        201,
      );
    } catch (err) {
      handleRouteError(res, err, 'Failed to log activity');
    }
  },
);

// ─── GP MESSAGES ─────────────────────────────────────────────────────────────

router.get('/lp-portal/lps/:id/messages', optionalAuth, async (req, res) => {
  try {
    const lpId = parseIdParam(req.params.id);
    const scope = await resolveScope(req);
    const lp = await loadLp(lpId, scope);
    if (!lp) {
      sendForbidden(res, "Not authorized for this LP's messages");
      return;
    }

    const rows = await db
      .select()
      .from(fundLpMessagesTable)
      .where(eq(fundLpMessagesTable.lpId, lp.id))
      .orderBy(asc(fundLpMessagesTable.sentAt))
      .limit(200);

    sendSuccess(
      res,
      rows.map((r) => ({
        id: r.id,
        from: r.fromRole,
        author: r.authorName,
        body: r.body,
        time: relativeTime(new Date(r.sentAt)),
        sentAt: r.sentAt,
      })),
    );
  } catch (err) {
    handleRouteError(res, err, 'Failed to load messages');
  }
});

router.post(
  '/lp-portal/lps/:id/messages',
  optionalAuth,
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const lpId = parseIdParam(req.params.id);
      const scope = await resolveScope(req);
      const lp = await loadLp(lpId, scope);
      if (!lp) {
        sendForbidden(res, "Not authorized for this LP's messages");
        return;
      }

      const body = req.body as { body?: string; from?: 'lp' | 'gp' } | undefined;
      const text = body?.body?.toString().trim();
      if (!text) {
        sendBadRequest(res, 'body is required');
        return;
      }

      // Authenticated GP can post as gp; everyone else posts as lp.
      const fromRole: 'lp' | 'gp' = scope.isGp && body?.from === 'gp' ? 'gp' : 'lp';
      const authorName = fromRole === 'gp' ? 'SZL GP Team' : lp.lpName;
      const isDemo =
        scope.isDemoOnly || (lp.metadata as { is_demo?: boolean } | null)?.is_demo === true;

      const [inserted] = await db
        .insert(fundLpMessagesTable)
        .values({
          lpId: lp.id,
          fromRole,
          authorName,
          body: text.slice(0, 4000),
          isDemo,
        })
        .returning();

      // Also log as activity
      await db.insert(fundLpActivityEventsTable).values({
        lpId: lp.id,
        action: 'messaged_gp',
        target: text.length > 60 ? `${text.slice(0, 57)}...` : text,
        isDemo,
      });

      sendSuccess(
        res,
        {
          id: inserted.id,
          from: inserted.fromRole,
          author: inserted.authorName,
          body: inserted.body,
          time: 'Just now',
          sentAt: inserted.sentAt,
        },
        201,
      );
    } catch (err) {
      handleRouteError(res, err, 'Failed to send message');
    }
  },
);

export default router;
