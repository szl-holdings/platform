/**
 * Admin Onboarding Status API
 *
 * GET  /api/admin/onboarding-status       — list all orgs with their onboarding wizard state
 *   Query params:
 *     status   — filter by completion status: "complete" | "in_progress" | "not_started"
 *     org      — search by org name or slug (partial match)
 *     limit    — max rows (default: 100, max: 500)
 *     offset   — pagination offset (default: 0)
 *
 * GET  /api/admin/onboarding-stalled      — list orgs stalled mid-onboarding
 *   Query params:
 *     thresholdDays — days since last update (default: ONBOARDING_STALL_THRESHOLD_DAYS or 3)
 *
 * POST /api/admin/onboarding-stall-check  — manually trigger stall check and notify admins
 *   Body (optional):
 *     thresholdDays — override the default threshold
 */

import { db, organizationsTable, pool } from '@szl-holdings/db';
import { and, ilike, or } from 'drizzle-orm';
import type { IRouter, Request, Response } from 'express';
import {
  handleRouteError,
  sendBadRequest,
  sendForbidden,
  sendSuccess,
} from '../../lib/api-response.js';
import { logger } from '../../lib/logger.js';
import { readLimiter, writeLimiter } from '../../middlewares/rate-limiters.js';

const WIZARD_STEPS = ['profile', 'team', 'notifications', 'integrations'] as const;
const TOTAL_STEPS = WIZARD_STEPS.length;

function requireAdminAccess(req: Request, res: Response): boolean {
  const roles = req.user?.roles ?? [];
  if (!roles.includes('super_admin') && !roles.includes('admin')) {
    sendForbidden(res, 'Admin role required');
    return false;
  }
  return true;
}

export function register(router: IRouter): void {
  router.get(
    '/admin/onboarding-status',
    readLimiter,
    async (req: Request, res: Response) => {
      try {
        if (!requireAdminAccess(req, res)) return;

        const {
          status: statusFilter,
          org: orgSearch,
          limit: limitStr = '100',
          offset: offsetStr = '0',
        } = req.query as Record<string, string | undefined>;

        if (
          statusFilter !== undefined &&
          !['complete', 'in_progress', 'not_started'].includes(statusFilter)
        ) {
          sendBadRequest(res, "status must be one of: complete, in_progress, not_started");
          return;
        }

        const limitNum = Math.min(Math.max(1, parseInt(limitStr ?? '100', 10) || 100), 500);
        const offsetNum = Math.max(parseInt(offsetStr ?? '0', 10) || 0, 0);

        let orgQuery = db
          .select({
            id: organizationsTable.id,
            name: organizationsTable.name,
            slug: organizationsTable.slug,
            plan: organizationsTable.plan,
            status: organizationsTable.status,
            createdAt: organizationsTable.createdAt,
          })
          .from(organizationsTable)
          .$dynamic();

        if (orgSearch) {
          orgQuery = orgQuery.where(
            and(
              or(
                ilike(organizationsTable.name, `%${orgSearch}%`),
                ilike(organizationsTable.slug, `%${orgSearch}%`),
              ),
            ) as ReturnType<typeof and>,
          );
        }

        const orgs = await orgQuery;

        if (orgs.length === 0) {
          sendSuccess(res, {
            totals: { orgs: 0, complete: 0, inProgress: 0, notStarted: 0 },
            rows: [],
            pagination: { limit: limitNum, offset: offsetNum, total: 0, hasMore: false },
          });
          return;
        }

        const orgIds = orgs.map((o) => o.id);

        const { rows: wizardRows } = await pool.query<{
          org_id: number;
          current_step: string;
          completed_steps: string[];
          completed_at: string | null;
          updated_at: string;
        }>(
          `SELECT org_id, current_step, completed_steps, completed_at, updated_at
           FROM onboarding_wizard_state
           WHERE org_id = ANY($1::int[])`,
          [orgIds],
        );

        const wizardByOrg = new Map(wizardRows.map((r) => [r.org_id, r]));

        type OrgStatus = 'complete' | 'in_progress' | 'not_started';

        const allRows = orgs.map((org) => {
          const wizard = wizardByOrg.get(org.id);
          const completedSteps: string[] = wizard?.completed_steps ?? [];
          const currentStep: string = wizard?.current_step ?? 'profile';
          const completedAt: string | null = wizard?.completed_at ?? null;
          const lastUpdatedAt: string | null = wizard?.updated_at ?? null;
          const progress = Math.round((completedSteps.length / TOTAL_STEPS) * 100);

          let orgStatus: OrgStatus;
          if (completedAt) {
            orgStatus = 'complete';
          } else if (wizard && completedSteps.length > 0) {
            orgStatus = 'in_progress';
          } else {
            orgStatus = 'not_started';
          }

          return {
            orgId: org.id,
            orgName: org.name,
            orgSlug: org.slug,
            plan: org.plan,
            orgStatus: org.status,
            createdAt: org.createdAt.toISOString(),
            onboarding: {
              status: orgStatus,
              progress,
              completedSteps,
              currentStep,
              completedAt,
              lastUpdatedAt,
              totalSteps: TOTAL_STEPS,
            },
          };
        });

        const filteredRows =
          statusFilter
            ? allRows.filter((r) => r.onboarding.status === statusFilter)
            : allRows;

        const totalComplete = allRows.filter((r) => r.onboarding.status === 'complete').length;
        const totalInProgress = allRows.filter((r) => r.onboarding.status === 'in_progress').length;
        const totalNotStarted = allRows.filter((r) => r.onboarding.status === 'not_started').length;

        filteredRows.sort((a, b) => {
          const statusOrder: Record<string, number> = {
            in_progress: 0,
            not_started: 1,
            complete: 2,
          };
          return (statusOrder[a.onboarding.status] ?? 3) - (statusOrder[b.onboarding.status] ?? 3);
        });

        const paginatedRows = filteredRows.slice(offsetNum, offsetNum + limitNum);

        sendSuccess(res, {
          totals: {
            orgs: allRows.length,
            complete: totalComplete,
            inProgress: totalInProgress,
            notStarted: totalNotStarted,
          },
          rows: paginatedRows,
          pagination: {
            limit: limitNum,
            offset: offsetNum,
            total: filteredRows.length,
            hasMore: offsetNum + limitNum < filteredRows.length,
          },
        });
      } catch (err) {
        handleRouteError(res, err, 'Failed to fetch onboarding status');
      }
    },
  );

  router.get(
    '/admin/onboarding-stalled',
    readLimiter,
    async (req: Request, res: Response) => {
      try {
        if (!requireAdminAccess(req, res)) return;

        const thresholdStr = (req.query as Record<string, string | undefined>).thresholdDays;
        const envThreshold = Number(process.env.ONBOARDING_STALL_THRESHOLD_DAYS);
        const thresholdDays = thresholdStr
          ? Math.max(1, parseInt(thresholdStr, 10) || 3)
          : Number.isFinite(envThreshold) && envThreshold > 0
            ? envThreshold
            : 3;

        const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);

        const { rows: stalledOrgs } = await pool.query<{
          org_id: number;
          org_name: string;
          org_slug: string;
          current_step: string;
          completed_steps: string[];
          updated_at: string;
        }>(
          `SELECT ow.org_id,
                  o.name AS org_name,
                  o.slug AS org_slug,
                  ow.current_step,
                  ow.completed_steps,
                  ow.updated_at
           FROM onboarding_wizard_state ow
           INNER JOIN organizations o ON o.id = ow.org_id
           WHERE ow.completed_at IS NULL
             AND jsonb_array_length(ow.completed_steps) > 0
             AND ow.updated_at < $1
           ORDER BY ow.updated_at ASC`,
          [cutoff],
        );

        const rows = stalledOrgs.map((s) => ({
          orgId: s.org_id,
          orgName: s.org_name,
          orgSlug: s.org_slug,
          currentStep: s.current_step,
          completedSteps: s.completed_steps,
          daysSinceUpdate: Math.round(
            (Date.now() - new Date(s.updated_at).getTime()) / (24 * 60 * 60 * 1000),
          ),
          lastUpdatedAt: s.updated_at,
          totalSteps: TOTAL_STEPS,
          progress: Math.round((s.completed_steps.length / TOTAL_STEPS) * 100),
        }));

        sendSuccess(res, { thresholdDays, stalledCount: rows.length, rows });
      } catch (err) {
        handleRouteError(res, err, 'Failed to fetch stalled onboarding orgs');
      }
    },
  );

  router.post(
    '/admin/onboarding-stall-check',
    writeLimiter,
    async (req: Request, res: Response) => {
      try {
        if (!requireAdminAccess(req, res)) return;

        const body = (req.body ?? {}) as { thresholdDays?: number };
        const thresholdDays =
          typeof body.thresholdDays === 'number' && body.thresholdDays > 0
            ? body.thresholdDays
            : undefined;

        const { runOnboardingStallCheck } = await import(
          '../../jobs/onboarding-stall-check'
        );
        const result = await runOnboardingStallCheck(thresholdDays);

        logger.info(
          { stalledCount: result.stalledCount, adminsNotified: result.adminsNotified },
          '[admin] Manual onboarding stall check triggered',
        );

        sendSuccess(res, result);
      } catch (err) {
        handleRouteError(res, err, 'Failed to run onboarding stall check');
      }
    },
  );
}
