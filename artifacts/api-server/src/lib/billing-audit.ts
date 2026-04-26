/**
 * billing-audit.ts
 *
 * Thin writer for the billing_audit_log table. Every billing-mutating
 * API call (checkout, portal, cancel, update, refund) MUST call
 * writeBillingAudit so compliance and forensic review have a complete,
 * immutable trail with:
 *   - actor (user id + email)
 *   - tenant (org id)
 *   - action verb + resource type + resource id
 *   - before/after snapshots
 *   - Stripe correlation IDs (event, customer, subscription, invoice)
 *   - idempotency key used for the Stripe call
 */

import { billingAuditLogTable, db } from '@szl-holdings/db';
import type { Request } from 'express';
import { logger } from './logger';

export interface BillingAuditParams {
  req?: Request;
  orgId?: number | null;
  actorId?: number | null;
  actorEmail?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  stripeEventId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeInvoiceId?: string | null;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * writeBillingAudit — fire-and-forget audit write. Never throws; a failed
 * audit write is logged as a warning but does NOT fail the calling route.
 */
export async function writeBillingAudit(params: BillingAuditParams): Promise<void> {
  try {
    const ipAddress =
      params.req?.ip ??
      (params.req?.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      null;
    const userAgent = params.req?.headers?.['user-agent'] ?? null;

    await db.insert(billingAuditLogTable).values({
      orgId: params.orgId ?? null,
      actorId: params.actorId ?? null,
      actorEmail: params.actorEmail ?? null,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId ?? null,
      before: params.before ?? null,
      after: params.after ?? null,
      stripeEventId: params.stripeEventId ?? null,
      stripeCustomerId: params.stripeCustomerId ?? null,
      stripeSubscriptionId: params.stripeSubscriptionId ?? null,
      stripeInvoiceId: params.stripeInvoiceId ?? null,
      idempotencyKey: params.idempotencyKey ?? null,
      ipAddress: typeof ipAddress === 'string' ? ipAddress : null,
      userAgent: typeof userAgent === 'string' ? userAgent : null,
      metadata: params.metadata ?? null,
    });
  } catch (err) {
    logger.warn({ err, action: params.action, orgId: params.orgId }, '[billing-audit] Failed to write audit log row — non-fatal');
  }
}

/**
 * Convenience helper to extract actor fields from a request's authenticated
 * user object.
 */
export function actorFromReq(req: Request): {
  actorId: number | null;
  actorEmail: string | null;
} {
  const user = req.user as { id?: number; email?: string } | undefined;
  return {
    actorId: user?.id ?? null,
    actorEmail: user?.email ?? null,
  };
}
