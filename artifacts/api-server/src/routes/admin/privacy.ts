/**
 * Admin Privacy Endpoints — GDPR-ready per-user data export and deletion.
 *
 * POST /admin/privacy/users/:id/export
 *   Collect all personal data for a user via the registry, bundle as JSON,
 *   store the bundle under a signed download token in export_jobs, and return
 *   a signed URL that expires in 24 hours.
 *
 * DELETE /admin/privacy/users/:id
 *   Hard-delete the user and all their PII across all registered domains.
 *   Writes a GDPR audit event recording the actor and the target.
 *
 * GET /admin/privacy/users/:id/export/:token
 *   Redeem a previously-issued signed export URL and stream the JSON bundle.
 *
 * Both mutating endpoints require the caller to have at least the "admin"
 * platform role (enforced globally by admin/index.ts).
 */

import { hashIp } from '@szl-holdings/audit';
import {
  auditEventsTable,
  db,
  exportJobsTable,
  usersTable,
} from '@szl-holdings/db';
import { and, eq, gt } from 'drizzle-orm';
import type { IRouter } from 'express';
import { randomBytes } from 'node:crypto';
import { sendBadRequest, sendError, sendNotFound } from '../../lib/api-response.js';
import { logger } from '../../lib/logger.js';
import { requireRole } from '../../middlewares/auth.js';
import { registerAllPrivacyContributors } from '../../services/privacy-contributors/index.js';
import { composeDeleteForUser, composeExportForUser } from '../../services/privacy-registry.js';

registerAllPrivacyContributors();

const EXPORT_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function parseUserId(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isNaN(n) || n < 1 ? null : n;
}

export function register(router: IRouter): void {
  /**
   * POST /admin/privacy/users/:id/export
   * Produce a signed JSON export bundle for the given user.
   */
  router.post('/admin/privacy/users/:id/export', requireRole('admin'), async (req, res) => {
    const targetId = parseUserId(req.params.id as string);
    if (targetId === null) {
      sendBadRequest(res, 'Invalid user ID');
      return;
    }

    try {
      const [targetUser] = await db
        .select({ id: usersTable.id, email: usersTable.email, displayName: usersTable.displayName })
        .from(usersTable)
        .where(eq(usersTable.id, targetId))
        .limit(1);

      if (!targetUser) {
        sendNotFound(res, 'User not found');
        return;
      }

      const bundle = await composeExportForUser(targetId, targetUser.email);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        requestedByAdmin: req.user?.id ?? null,
        dataSubjectId: targetId,
        dataSubjectEmail: targetUser.email,
        data: bundle,
      };

      const downloadToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + EXPORT_TOKEN_TTL_MS);

      await db.insert(exportJobsTable).values({
        exportId: `gdpr-admin-${targetId}-${Date.now()}`,
        name: `GDPR export for user ${targetId}`,
        dataSource: 'gdpr_admin_export',
        format: 'csv',
        status: 'completed',
        triggeredByUserId: req.user?.id ?? null,
        triggeredByEmail: req.user?.email ?? null,
        filterParams: JSON.stringify(exportPayload),
        downloadToken,
        expiresAt,
        completedAt: new Date(),
      });

      await db.insert(auditEventsTable).values({
        userId: req.user?.id ?? null,
        action: 'gdpr.export.requested',
        entityType: 'user',
        entityId: String(targetId),
        newValues: {
          targetUserId: targetId,
          targetEmail: targetUser.email,
          requestedByAdmin: req.user?.id ?? null,
          expiresAt: expiresAt.toISOString(),
        },
        ipAddress: hashIp(req.ip ?? null),
        userAgent: req.headers['user-agent'] ?? null,
        product: 'admin',
      });

      logger.info(
        { actorId: req.user?.id, targetId },
        '[admin-privacy] GDPR export prepared',
      );

      res.status(201).json({
        message: 'Export bundle created',
        targetUserId: targetId,
        downloadUrl: `/api/admin/privacy/users/${targetId}/export/${downloadToken}`,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (err) {
      logger.error({ err, targetId }, '[admin-privacy] Export failed');
      sendError(res, 'Export failed', 500, 'EXPORT_FAILED');
    }
  });

  /**
   * GET /admin/privacy/users/:id/export/:token
   * Redeem a signed export URL and stream the JSON bundle.
   */
  router.get('/admin/privacy/users/:id/export/:token', requireRole('admin'), async (req, res) => {
    const targetId = parseUserId(req.params.id as string);
    const token = req.params.token as string;

    if (targetId === null || !token || token.length < 32) {
      sendBadRequest(res, 'Invalid request');
      return;
    }

    try {
      const [job] = await db
        .select({
          id: exportJobsTable.id,
          downloadToken: exportJobsTable.downloadToken,
          expiresAt: exportJobsTable.expiresAt,
          filterParams: exportJobsTable.filterParams,
        })
        .from(exportJobsTable)
        .where(
          and(
            eq(exportJobsTable.downloadToken, token),
            gt(exportJobsTable.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!job) {
        sendNotFound(res, 'Export token not found or expired');
        return;
      }

      const payload = job.filterParams ? (JSON.parse(job.filterParams as string) as Record<string, unknown>) : {};

      if (payload['dataSubjectId'] !== targetId) {
        sendNotFound(res, 'Export token not found or expired');
        return;
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="gdpr-export-user-${targetId}-${Date.now()}.json"`,
      );
      res.status(200).json(payload);
    } catch (err) {
      logger.error({ err, targetId }, '[admin-privacy] Export download failed');
      sendError(res, 'Download failed', 500, 'DOWNLOAD_FAILED');
    }
  });

  /**
   * DELETE /admin/privacy/users/:id
   * Hard-delete a user and all their PII across all registered domains.
   */
  router.delete('/admin/privacy/users/:id', requireRole('admin'), async (req, res) => {
    const targetId = parseUserId(req.params.id as string);
    if (targetId === null) {
      sendBadRequest(res, 'Invalid user ID');
      return;
    }

    if (targetId === req.user?.id) {
      sendBadRequest(res, 'Admins cannot delete their own account via this endpoint');
      return;
    }

    try {
      const [targetUser] = await db
        .select({ id: usersTable.id, email: usersTable.email, displayName: usersTable.displayName })
        .from(usersTable)
        .where(eq(usersTable.id, targetId))
        .limit(1);

      if (!targetUser) {
        sendNotFound(res, 'User not found');
        return;
      }

      await composeDeleteForUser(targetId, targetUser.email);

      await db.insert(auditEventsTable).values({
        userId: req.user?.id ?? null,
        action: 'gdpr.erasure.admin',
        entityType: 'user',
        entityId: String(targetId),
        newValues: {
          targetUserId: targetId,
          targetEmail: targetUser.email,
          requestedByAdmin: req.user?.id ?? null,
          method: 'admin_hard_delete',
          deletedAt: new Date().toISOString(),
        },
        ipAddress: hashIp(req.ip ?? null),
        userAgent: req.headers['user-agent'] ?? null,
        product: 'admin',
      });

      logger.info(
        { actorId: req.user?.id, targetId },
        '[admin-privacy] AUDIT: admin-triggered GDPR erasure completed',
      );

      res.status(200).json({
        message: 'User data erased',
        targetUserId: targetId,
        deletedAt: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err, targetId }, '[admin-privacy] Admin deletion failed');
      sendError(res, 'Deletion failed', 500, 'DELETE_FAILED');
    }
  });
}
