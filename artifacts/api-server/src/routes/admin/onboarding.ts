/**
 * Admin Onboarding Status API
 *
 * GET /api/admin/onboarding-status — list all orgs with their onboarding wizard state
 *   Query params:
 *     status   — filter by completion status: "complete" | "in_progress" | "not_started"
 *     org      — search by org name or slug (partial match)
 *     limit    — max rows (default: 100, max: 500)
 *     offset   — pagination offset (default: 0)
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
import { readLimiter } from '../../middlewares/rate-limiters.js';

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
}
