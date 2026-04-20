import {
  type ApprovalCreatedHook,
  type ApprovalRequest,
  setApprovalCreatedHook,
} from '@szl-holdings/covenant-policy';
import {
  db,
  notificationPreferencesTable,
  notificationsTable,
  orgMembersTable,
  rolesTable,
  userRolesTable,
  usersTable,
} from '@szl-holdings/db';
import { and, eq, inArray } from 'drizzle-orm';
import { hasEmailProviderConfigured, sendEmail } from './email';
import { logger } from './logger';

const APPROVALS_URL = '/alloy/operator/approvals';

const SUPER_ADMIN_ROLES = ['super_admin', 'admin'] as const;
const FALLBACK_OPERATOR_ROLES = ['ops', 'compliance'] as const;

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_ALERT_CHANNEL = process.env.SLACK_ALERT_CHANNEL || '#alerts';

type ApprovalSeverity = 'warning' | 'critical';

interface RecipientUser {
  id: number;
  email: string | null;
  displayName: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  slackEnabled: boolean;
}

function severityFor(approval: ApprovalRequest): ApprovalSeverity {
  if (approval.priority === 'critical') return 'critical';
  const tier = (approval.payload as { tier?: string } | null)?.tier;
  if (tier && /tier[\s_-]?8|tier-8|tier8/i.test(tier)) return 'critical';
  if (approval.actionClass === 'human-approval-mandatory') return 'critical';
  return 'warning';
}

/**
 * Resolve the set of operator user IDs that should be notified about a new
 * approval request.
 *
 * Tenant safety: when `approval.orgId` is set, recipients are STRICTLY
 * restricted to members of that organization. There is no cross-tenant
 * fallback to "all users with the role". Global super-admin notification is
 * intentionally only used when the approval has no organization (orgId
 * null) — i.e. the request is platform-wide and there is no tenant boundary
 * to leak across.
 */
async function resolveApproverUserIds(approval: ApprovalRequest): Promise<number[]> {
  const wantedRoles = new Set<string>(FALLBACK_OPERATOR_ROLES);
  if (approval.requiredApproverRole) wantedRoles.add(approval.requiredApproverRole);

  let candidateIds: number[] = [];

  try {
    const roleRows = await db
      .select({ id: rolesTable.id, name: rolesTable.name })
      .from(rolesTable)
      .where(
        inArray(
          rolesTable.name,
          Array.from(wantedRoles) as Array<typeof rolesTable.$inferSelect.name>,
        ),
      );

    if (roleRows.length > 0) {
      const userRows = await db
        .select({ userId: userRolesTable.userId })
        .from(userRolesTable)
        .where(
          inArray(
            userRolesTable.roleId,
            roleRows.map((r) => r.id),
          ),
        );
      candidateIds = Array.from(new Set(userRows.map((r) => r.userId)));
    }

    if (approval.orgId != null) {
      // Strict org-scoping: only org members are eligible recipients. NEVER
      // fall back to all role-holders globally — that would leak approval
      // metadata across tenants.
      if (candidateIds.length === 0) return [];
      const memberRows = await db
        .select({ userId: orgMembersTable.userId })
        .from(orgMembersTable)
        .where(
          and(
            eq(orgMembersTable.orgId, approval.orgId),
            inArray(orgMembersTable.userId, candidateIds),
          ),
        );
      candidateIds = memberRows.map((r) => r.userId);
    } else {
      // Platform-scoped (no org): include super_admin/admin as the on-call
      // safety net since there is no tenant to scope to.
      const adminRoleRows = await db
        .select({ id: rolesTable.id })
        .from(rolesTable)
        .where(
          inArray(
            rolesTable.name,
            SUPER_ADMIN_ROLES as unknown as Array<typeof rolesTable.$inferSelect.name>,
          ),
        );
      if (adminRoleRows.length > 0) {
        const adminUserRows = await db
          .select({ userId: userRolesTable.userId })
          .from(userRolesTable)
          .where(
            inArray(
              userRolesTable.roleId,
              adminRoleRows.map((r) => r.id),
            ),
          );
        const adminIds = adminUserRows.map((r) => r.userId);
        candidateIds = Array.from(new Set([...candidateIds, ...adminIds]));
      }
    }

    if (approval.assignedApproverId != null) {
      // Verify the assigned approver is in-org before adding (defense in
      // depth — the assigner could in theory pass a cross-tenant user).
      if (approval.orgId != null) {
        const [member] = await db
          .select({ userId: orgMembersTable.userId })
          .from(orgMembersTable)
          .where(
            and(
              eq(orgMembersTable.orgId, approval.orgId),
              eq(orgMembersTable.userId, approval.assignedApproverId),
            ),
          );
        if (member && !candidateIds.includes(member.userId)) {
          candidateIds.push(member.userId);
        }
      } else if (!candidateIds.includes(approval.assignedApproverId)) {
        candidateIds.push(approval.assignedApproverId);
      }
    }

    return candidateIds;
  } catch (err) {
    logger.warn(
      { err, approvalId: approval.id },
      '[approval-notifications] Failed to resolve approver users',
    );
    return [];
  }
}

async function loadRecipients(userIds: number[]): Promise<RecipientUser[]> {
  if (userIds.length === 0) return [];

  let userRows: Array<{ id: number; email: string | null; displayName: string }> = [];
  try {
    userRows = await db
      .select({ id: usersTable.id, email: usersTable.email, displayName: usersTable.displayName })
      .from(usersTable)
      .where(and(inArray(usersTable.id, userIds), eq(usersTable.isActive, true)));
  } catch (err) {
    logger.warn({ err }, '[approval-notifications] Failed to load recipient users');
    return [];
  }

  let prefRows: Array<{
    userId: number;
    inAppEnabled: boolean;
    emailEnabled: boolean;
    slackEnabled: boolean;
  }> = [];
  try {
    prefRows = await db
      .select({
        userId: notificationPreferencesTable.userId,
        inAppEnabled: notificationPreferencesTable.inAppEnabled,
        emailEnabled: notificationPreferencesTable.emailEnabled,
        slackEnabled: notificationPreferencesTable.slackEnabled,
      })
      .from(notificationPreferencesTable)
      .where(inArray(notificationPreferencesTable.userId, userIds));
  } catch (err) {
    logger.warn(
      { err },
      '[approval-notifications] Failed to load notification preferences — assuming defaults',
    );
  }

  const prefsByUser = new Map(prefRows.map((p) => [p.userId, p]));

  return userRows.map((u) => {
    const p = prefsByUser.get(u.id);
    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      inAppEnabled: p?.inAppEnabled ?? true,
      emailEnabled: p?.emailEnabled ?? true,
      slackEnabled: p?.slackEnabled ?? false,
    };
  });
}

function buildSubject(approval: ApprovalRequest, severity: ApprovalSeverity): string {
  const tag = severity === 'critical' ? 'CRITICAL' : 'PENDING';
  const role = approval.requiredApproverRole ? ` [${approval.requiredApproverRole}]` : '';
  return `[Guardian ${tag}]${role} ${approval.title}`;
}

function buildPlaintext(
  approval: ApprovalRequest,
  severity: ApprovalSeverity,
  userName: string,
): string {
  const tier = (approval.payload as { tier?: string; reason?: string } | null)?.tier;
  const reason = (approval.payload as { reason?: string } | null)?.reason;
  const lines = [
    `Hello ${userName},`,
    ``,
    `A new Guardian approval request is awaiting your review.`,
    ``,
    `Title:    ${approval.title}`,
    `Severity: ${severity.toUpperCase()}`,
    `Priority: ${approval.priority}`,
    `Resource: ${approval.resourceType}/${approval.resourceId}`,
    `Action:   ${approval.actionClass}`,
    ...(tier ? [`Tier:     ${tier}`] : []),
    ...(approval.requiredApproverRole ? [`Approver: ${approval.requiredApproverRole}`] : []),
    ...(approval.description ? [``, `Description: ${approval.description}`] : []),
    ...(reason ? [`Guardian reason: ${reason}`] : []),
    ``,
    `Open the operator queue: ${process.env.VITE_APP_URL || ''}${APPROVALS_URL}?approval=${approval.id}`,
    ``,
    `Approval #${approval.id} · created ${approval.createdAt.toISOString()}`,
  ];
  return lines.join('\n');
}

function buildHtml(
  approval: ApprovalRequest,
  severity: ApprovalSeverity,
  userName: string,
): string {
  const color = severity === 'critical' ? '#dc2626' : '#d97706';
  const bg = severity === 'critical' ? '#fee2e2' : '#fff7ed';
  const tier = (approval.payload as { tier?: string } | null)?.tier;
  const reason = (approval.payload as { reason?: string } | null)?.reason;
  const link = `${process.env.VITE_APP_URL || ''}${APPROVALS_URL}?approval=${approval.id}`;
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:0">
<div style="max-width:560px;margin:0 auto;padding:32px 16px">
  <div style="background:#fff;border-radius:12px;padding:36px;border:1px solid #e5e7eb">
    <div style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px;background:${bg};color:${color}">
      ${severity.toUpperCase()} — Guardian approval needed
    </div>
    <h2 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 10px">${approval.title}</h2>
    <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 16px">Hello ${userName}, a new Guardian approval request is waiting for your review.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#374151;margin-bottom:16px">
      <tr><td style="padding:4px 0;color:#6b7280">Priority</td><td style="padding:4px 0"><strong>${approval.priority}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#6b7280">Resource</td><td style="padding:4px 0;font-family:monospace">${approval.resourceType}/${approval.resourceId}</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280">Action</td><td style="padding:4px 0">${approval.actionClass}</td></tr>
      ${tier ? `<tr><td style="padding:4px 0;color:#6b7280">Tier</td><td style="padding:4px 0;font-family:monospace">${tier}</td></tr>` : ''}
      ${approval.requiredApproverRole ? `<tr><td style="padding:4px 0;color:#6b7280">Approver</td><td style="padding:4px 0;font-family:monospace">${approval.requiredApproverRole}</td></tr>` : ''}
    </table>
    ${approval.description ? `<p style="font-size:13px;color:#4b5563;line-height:1.6;margin:0 0 12px">${approval.description}</p>` : ''}
    ${reason ? `<p style="font-size:13px;color:#4b5563;line-height:1.6;margin:0 0 12px"><strong>Guardian reason:</strong> ${reason}</p>` : ''}
    <p style="margin:20px 0 0"><a href="${link}" style="display:inline-block;padding:10px 18px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px">Review approval</a></p>
    <div style="font-size:11px;color:#9ca3af;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb">SZL Holdings · Approval #${approval.id} · ${approval.createdAt.toISOString()}</div>
  </div>
</div>
</body></html>`;
}

async function dispatchEmails(
  recipients: RecipientUser[],
  approval: ApprovalRequest,
  severity: ApprovalSeverity,
): Promise<number> {
  if (!hasEmailProviderConfigured()) return 0;

  const targets = recipients.filter((r) => r.emailEnabled && r.email);
  if (targets.length === 0) return 0;

  const subject = buildSubject(approval, severity);
  let sent = 0;

  await Promise.allSettled(
    targets.map(async (r) => {
      const result = await sendEmail({
        to: r.email!,
        subject,
        html: buildHtml(approval, severity, r.displayName),
        text: buildPlaintext(approval, severity, r.displayName),
      });
      if (result.success) sent++;
      else
        logger.warn(
          { userId: r.id, error: result.error },
          '[approval-notifications] Email delivery failed',
        );
    }),
  );

  return sent;
}

async function dispatchSlack(
  recipients: RecipientUser[],
  approval: ApprovalRequest,
  severity: ApprovalSeverity,
): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL && !SLACK_BOT_TOKEN) return false;
  const slackTargets = recipients.filter((r) => r.slackEnabled);
  if (slackTargets.length === 0) return false;

  const emoji = severity === 'critical' ? ':rotating_light:' : ':warning:';
  const tier = (approval.payload as { tier?: string } | null)?.tier;
  const link = `${process.env.VITE_APP_URL || ''}${APPROVALS_URL}?approval=${approval.id}`;
  const mentionList = slackTargets.map((r) => r.displayName).join(', ');
  const lines = [
    `${emoji} *Guardian approval needed* — ${approval.title}`,
    `${approval.resourceType}/${approval.resourceId} · ${approval.actionClass}${tier ? ` · ${tier}` : ''}`,
    approval.requiredApproverRole ? `Approver role: \`${approval.requiredApproverRole}\`` : null,
    `For: ${mentionList}`,
    `<${link}|Open approval queue>`,
  ].filter(Boolean);
  const text = lines.join('\n');

  try {
    if (SLACK_WEBHOOK_URL) {
      const res = await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        logger.warn({ status: res.status }, '[approval-notifications] Slack webhook post failed');
        return false;
      }
    } else if (SLACK_BOT_TOKEN) {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
        body: JSON.stringify({ channel: SLACK_ALERT_CHANNEL, text }),
      });
      if (!res.ok) {
        logger.warn(
          { status: res.status },
          '[approval-notifications] Slack bot post failed (HTTP)',
        );
        return false;
      }
      // Slack returns HTTP 200 with { ok: false, error: "..." } on
      // application errors (invalid channel, missing scope, rate limit,
      // etc.) — treat those as failures.
      let body: { ok?: boolean; error?: string } = {};
      try {
        body = (await res.json()) as { ok?: boolean; error?: string };
      } catch {
        logger.warn('[approval-notifications] Slack bot post: non-JSON response');
        return false;
      }
      if (!body.ok) {
        logger.warn({ slackError: body.error }, '[approval-notifications] Slack bot post rejected');
        return false;
      }
    }
    return true;
  } catch (err) {
    logger.warn({ err }, '[approval-notifications] Slack dispatch error');
    return false;
  }
}

async function persistInAppNotifications(
  recipients: RecipientUser[],
  approval: ApprovalRequest,
  severity: ApprovalSeverity,
): Promise<number[]> {
  const targets = recipients.filter((r) => r.inAppEnabled);
  if (targets.length === 0) return [];

  const type = severity === 'critical' ? 'action_required' : 'warning';
  const title =
    severity === 'critical'
      ? `Guardian approval required (critical): ${approval.title}`
      : `Guardian approval pending: ${approval.title}`;
  const message = approval.description?.trim()
    ? approval.description.trim()
    : `${approval.actionClass} on ${approval.resourceType}/${approval.resourceId} is awaiting operator review.`;

  try {
    await db.insert(notificationsTable).values(
      targets.map((r) => ({
        userId: r.id,
        type: type as 'action_required' | 'warning',
        channel: 'in_app' as const,
        title,
        message,
        actionUrl: `${APPROVALS_URL}?approval=${approval.id}`,
      })),
    );
    return targets.map((r) => r.id);
  } catch (err) {
    logger.warn(
      { err, approvalId: approval.id },
      '[approval-notifications] Failed to persist in-app notifications',
    );
    return [];
  }
}

const approvalCreatedHook: ApprovalCreatedHook = async (approval) => {
  try {
    const severity = severityFor(approval);
    const userIds = await resolveApproverUserIds(approval);
    if (userIds.length === 0) {
      logger.info(
        {
          approvalId: approval.id,
          orgId: approval.orgId,
          requiredApproverRole: approval.requiredApproverRole,
        },
        '[approval-notifications] No eligible operator recipients — skipping',
      );
      return;
    }

    const recipients = await loadRecipients(userIds);
    if (recipients.length === 0) return;

    const [persistedIds, emailsSent, slackSent] = await Promise.all([
      persistInAppNotifications(recipients, approval, severity),
      dispatchEmails(recipients, approval, severity),
      dispatchSlack(recipients, approval, severity),
    ]);

    // No websocket broadcast: approval metadata (IDs, recipient user IDs,
    // severity, org) must not be published on the shared notifications
    // channel since any subscribed client can observe it. Per-user
    // discovery happens via /api/notifications (auth-scoped to the calling
    // user) and the operator-approvals page polling the approval queue
    // every 15s — both paths enforce server-side authorization.

    logger.info(
      {
        approvalId: approval.id,
        orgId: approval.orgId,
        priority: approval.priority,
        severity,
        requiredApproverRole: approval.requiredApproverRole,
        recipientCount: recipients.length,
        inAppPersisted: persistedIds.length,
        emailsSent,
        slackSent,
      },
      '[approval-notifications] On-call operators notified of new approval request',
    );
  } catch (err) {
    logger.warn({ err, approvalId: approval.id }, '[approval-notifications] Hook failed');
  }
};

let registered = false;

export function registerApprovalNotificationHook(): void {
  if (registered) return;
  setApprovalCreatedHook(approvalCreatedHook);
  registered = true;
  logger.info('[approval-notifications] Registered approval-created notification hook');
}

// Exported for testing.
export const __test__ = { resolveApproverUserIds, severityFor };
