import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  sessionsTable,
  apiKeysTable,
} from "@szl-holdings/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendNoContent, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { z } from "zod";
import { validateBody } from "../lib/validation";
import { gdprLimiter } from "../middlewares/rate-limiters";
import { hashEmail } from "./contact";

const router: IRouter = Router();

const erasureBodySchema = z.object({
  confirmation: z.literal("DELETE MY DATA", {
    errorMap: () => ({ message: 'confirmation must equal exactly "DELETE MY DATA"' }),
  }),
  reason: z.string().max(500).optional(),
});

/**
 * GDPR Right-to-Erasure (Article 17)
 *
 * Strategy: hard-delete the user row inside a transaction.
 * All FK-linked tables configured with `onDelete: "cascade"` (sessions, user_roles,
 * api_keys, notifications, push_tokens, invitations, etc.) are purged automatically
 * by the database. Tables configured with `onDelete: "set null"` (feedback) are
 * de-identified automatically. Audit log entries are retained under the legitimate
 * interest/legal obligation exception but de-identified by the cascade null-out.
 *
 * Contact form submissions (platform_contact_requests) have no user_id FK but are
 * purged deterministically: the user's plaintext email is HMAC-hashed with the same
 * FIELD_ENCRYPTION_KEY used for AES-256-GCM encryption, matching the emailHash stored
 * at submission time. Rows matching that hash are hard-deleted before user row deletion.
 */
router.post("/gdpr/erasure", authMiddleware(), gdprLimiter, validateBody(erasureBodySchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    logger.info({ userId }, "[gdpr] Right-to-erasure requested — initiating atomic hard delete");

    const emailHash = userEmail ? hashEmail(userEmail) : null;

    await db.transaction(async (tx) => {
      if (emailHash) {
        await tx.execute(
          sql`DELETE FROM platform_contact_requests WHERE email_hash = ${emailHash}`
        );
      }
      await tx.delete(usersTable).where(eq(usersTable.id, userId));
    });

    logger.info({ userId, ip: req.ip, reason: "gdpr_erasure", action: "user_hard_deleted" }, "[gdpr] AUDIT: user data erased under GDPR Article 17 — contact submissions and user row deleted atomically; all FK-cascaded tables purged by DB engine");

    sendNoContent(res);
  } catch (err) {
    logger.error({ err }, "[gdpr] Erasure failed");
    handleRouteError(res, err, "Data erasure failed");
  }
});

router.get("/gdpr/export", authMiddleware(), gdprLimiter, async (req, res) => {
  try {
    const userId = req.user!.id;

    const [user] = await db
      .select({
        id: usersTable.id,
        displayName: usersTable.displayName,
        email: usersTable.email,
        avatarUrl: usersTable.avatarUrl,
        bio: usersTable.bio,
        platformRole: usersTable.platformRole,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
        lastLoginAt: usersTable.lastLoginAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const sessions = await db
      .select({
        id: sessionsTable.id,
        createdAt: sessionsTable.createdAt,
        expiresAt: sessionsTable.expiresAt,
        ipAddress: sessionsTable.ipAddress,
        userAgent: sessionsTable.userAgent,
      })
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, userId));

    const apiKeys = await db
      .select({
        id: apiKeysTable.id,
        name: apiKeysTable.name,
        createdAt: apiKeysTable.createdAt,
      })
      .from(apiKeysTable)
      .where(eq(apiKeysTable.userId, userId));

    let activityLogs: unknown[] = [];
    try {
      const { queryAuditEvents } = await import("@szl-holdings/audit");
      const events = await queryAuditEvents({ userId, limit: 1000 });
      activityLogs = events ?? [];
    } catch (_err) {
      logger.warn({ userId }, "[gdpr] Could not load audit events for export (non-fatal)");
    }

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      requestedBy: userId,
      dataSubject: user ?? null,
      sessions,
      apiKeys,
      activityLogs,
      dataProcessingBasis: {
        legalBasis: "legitimate_interest",
        purpose: "Platform service delivery and security",
        retentionPeriod: "Data retained for 36 months from last activity, then purged",
        thirdPartyProcessors: [
          { name: "Replit", purpose: "Infrastructure hosting", dataAccess: "Platform environment" },
          { name: "Stripe", purpose: "Payment processing", dataAccess: "Billing data only (handled by Stripe)" },
        ],
      },
    };

    try {
      const { logActivity } = await import("../lib/activity-logger");
      await logActivity(req, "read", "user_export", String(userId));
    } catch (_logErr) {
      logger.warn({ userId }, "[gdpr] Export audit log failed (non-fatal)");
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="user-data-export-${userId}-${Date.now()}.json"`);
    res.status(200).json(exportPayload);
  } catch (err) {
    logger.error({ err }, "[gdpr] Export failed");
    handleRouteError(res, err, "Data export failed");
  }
});

router.get("/gdpr/data-processing-records", authMiddleware(), gdprLimiter, async (_req, res) => {
  try {
    const records = {
      controller: {
        name: "SZL Holdings",
        contact: "privacy@szlholdings.com",
        address: "On file with DPA",
      },
      processingActivities: [
        {
          id: "auth",
          name: "Authentication & Session Management",
          legalBasis: "Contract performance",
          dataCategories: ["identity", "authentication_tokens", "ip_addresses"],
          retentionPeriod: "30 days for sessions, 36 months for audit logs",
          recipients: ["Internal systems only"],
          crossBorderTransfer: false,
          erasurePolicy: "Hard-deleted via CASCADE on user deletion",
        },
        {
          id: "analytics",
          name: "Usage Analytics & Observability",
          legalBasis: "Legitimate interest",
          dataCategories: ["usage_patterns", "performance_metrics", "error_logs"],
          retentionPeriod: "90 days",
          recipients: ["Internal engineering and operations teams"],
          crossBorderTransfer: false,
        },
        {
          id: "notifications",
          name: "Push Notifications",
          legalBasis: "Consent",
          dataCategories: ["device_tokens", "notification_preferences"],
          retentionPeriod: "Until consent withdrawn or account deleted",
          recipients: ["Expo push notification service"],
          crossBorderTransfer: true,
          safeguards: "Standard Contractual Clauses",
          erasurePolicy: "Hard-deleted via CASCADE on user deletion",
        },
        {
          id: "billing",
          name: "Billing & Payments",
          legalBasis: "Contract performance",
          dataCategories: ["billing_contact", "payment_method_references"],
          retentionPeriod: "7 years (legal requirement)",
          recipients: ["Stripe Inc."],
          crossBorderTransfer: true,
          safeguards: "Standard Contractual Clauses, Stripe DPA",
        },
        {
          id: "documents",
          name: "Legal & Business Documents",
          legalBasis: "Contract performance",
          dataCategories: ["document_content", "metadata", "signatories"],
          retentionPeriod: "7 years or as required by applicable law",
          recipients: ["Internal systems only"],
          crossBorderTransfer: false,
        },
        {
          id: "contact_requests",
          name: "Contact & Demo Requests",
          legalBasis: "Legitimate interest",
          dataCategories: ["name_encrypted", "email_encrypted", "company", "inquiry_content"],
          retentionPeriod: "24 months",
          recipients: ["Internal sales and customer success teams"],
          crossBorderTransfer: false,
          encryptionAtRest: true,
          encryptionScheme: "AES-256-GCM with per-context HMAC-SHA256 key derivation",
        },
        {
          id: "api_keys",
          name: "API Access Credentials",
          legalBasis: "Contract performance",
          dataCategories: ["key_hash", "key_prefix", "scopes"],
          retentionPeriod: "Until revoked or account deleted",
          recipients: ["Internal systems only"],
          crossBorderTransfer: false,
          erasurePolicy: "Hard-deleted via CASCADE on user deletion",
        },
      ],
      userRights: [
        "Right of access (GET /api/gdpr/export)",
        "Right to erasure (POST /api/gdpr/erasure) — triggers hard-delete with DB cascade",
        "Right to rectification (contact support)",
        "Right to data portability (GET /api/gdpr/export)",
        "Right to object to processing (contact support)",
      ],
      supervisoryAuthority: "National data protection authority of your country of residence",
      updatedAt: "2025-04-01T00:00:00Z",
    };

    sendSuccess(res, records);
  } catch (err) {
    handleRouteError(res, err, "Failed to retrieve data processing records");
  }
});

export default router;
