/**
 * Core logic helpers for org-wide Pulse briefing publication (Task #2949).
 *
 * Extracted into a separate module so the route-handler seam can be exercised
 * in tests without mounting the full express router.
 *
 * Republish semantics
 * -------------------
 * By design there is NO database-level unique constraint on (org_id, briefing_id)
 * in `pulse_briefing_publications`. The table is a history log; an org may
 * legitimately publish the same briefing multiple times (e.g. after editing the
 * headline, or to add a new audience segment). The accidental-republish guard is
 * application-level: a 409 is returned when a publication for the same
 * (org_id, briefing_id) exists within the last 5 minutes, unless the caller
 * explicitly sets `force: true`. Passing `force: true` is the stated "explicit
 * republish" signal — it is how callers express intentional re-delivery.
 */

import { z } from 'zod';

// ─── RBAC ─────────────────────────────────────────────────────────────────────

/**
 * Roles that may publish a Pulse briefing org-wide.
 *
 * Intentionally narrower than the global `requireRole` list — admin and
 * super_admin are excluded even though `requireRole()` would let them through.
 * The publish handler enforces this via a secondary check after the middleware.
 */
export const PUBLISH_ALLOWED_ROLES = new Set(['owner', 'exec', 'ops'] as const);

/** Returns true when at least one of the user's roles is allowed to publish. */
export function canPublishBriefing(roles: readonly string[]): boolean {
  return roles.some((r) => PUBLISH_ALLOWED_ROLES.has(r as 'owner' | 'exec' | 'ops'));
}

// ─── Schema ───────────────────────────────────────────────────────────────────

/** Roles that may appear in an audience filter */
export const PUBLISH_AUDIENCE_ROLES = ['exec', 'ops', 'admin', 'owner', 'viewer'] as const;
export type PublishAudienceRole = (typeof PUBLISH_AUDIENCE_ROLES)[number];

export const publishBriefingSchema = z.object({
  audienceType: z.enum(['all', 'roles']).default('all'),
  audienceRoles: z.array(z.string()).default([]),
  channels: z
    .array(z.enum(['in_app', 'push', 'email', 'sms']))
    .default(['in_app', 'push'])
    .refine(
      (chs) => !chs.includes('email') && !chs.includes('sms'),
      { message: 'email and sms channels are not yet supported. Please use in_app and push only.' },
    ),
  headlineOverride: z.string().max(200).optional(),
  messageOverride: z.string().max(500).optional(),
  /**
   * When true the 5-minute duplicate-publish guard is bypassed.
   * This is the caller's explicit signal that they intend to republish —
   * it should only be presented to users via a "Republish" UI action.
   */
  force: z.boolean().optional().default(false),
});

export type PublishBriefingInput = z.infer<typeof publishBriefingSchema>;

// ─── Channel normalisation ────────────────────────────────────────────────────

/**
 * Ensures in_app is always present in the channel list.
 * in_app is a v1 requirement that cannot be disabled — even if a client sends
 * a push-only payload, in-app delivery is added server-side.
 */
export function normalizeChannels(channels: string[]): string[] {
  return channels.includes('in_app') ? channels : ['in_app', ...channels];
}

// ─── Audience validation ──────────────────────────────────────────────────────

/**
 * Validates the audience spec *before* any DB queries or fan-out begin.
 * Returns an error object when the spec is invalid, null when it is valid.
 */
export function validateAudienceRoles(
  audienceType: 'all' | 'roles',
  audienceRoles: string[],
): { error: string } | null {
  if (audienceType !== 'roles') return null;
  const valid = audienceRoles.filter((r): r is PublishAudienceRole =>
    PUBLISH_AUDIENCE_ROLES.includes(r as PublishAudienceRole),
  );
  if (valid.length === 0) {
    return {
      error:
        'audienceType is "roles" but no valid roles were specified. Provide at least one of: exec, ops, admin, owner, viewer.',
    };
  }
  return null;
}

// ─── Tenant ownership check ───────────────────────────────────────────────────

/**
 * Returns true when a publisher in `publisherOrgId` is allowed to publish
 * a briefing that belongs to `briefingOrgId`.
 *
 * Rules:
 *  - briefingOrgId null/undefined → globally-owned briefing, anyone can publish it
 *  - otherwise → briefing must belong to the publisher's org
 */
export function isBriefingOwnedByPublisher(
  briefingOrgId: number | null | undefined,
  publisherOrgId: number,
): boolean {
  if (briefingOrgId === null || briefingOrgId === undefined) return true;
  return briefingOrgId === publisherOrgId;
}

// ─── Duplicate-publish guard ──────────────────────────────────────────────────

/**
 * Returns true when a duplicate-publish should be blocked.
 *
 * @param hasRecentPub  Whether a publication exists within the guard window
 * @param force         When true the caller explicitly requested a republish
 */
export function isDuplicatePublishBlocked(hasRecentPub: boolean, force: boolean): boolean {
  return hasRecentPub && !force;
}

// ─── Testable seam (for unit tests only) ─────────────────────────────────────

export interface PulsePublishInternals {
  canPublishBriefing: typeof canPublishBriefing;
  normalizeChannels: typeof normalizeChannels;
  validateAudienceRoles: typeof validateAudienceRoles;
  isBriefingOwnedByPublisher: typeof isBriefingOwnedByPublisher;
  isDuplicatePublishBlocked: typeof isDuplicatePublishBlocked;
}

/**
 * Injectable seam for tests. Tests import this object and can override
 * individual functions to inject fakes without re-implementing business logic.
 *
 * @internal — do not use in production code outside pulse.ts
 */
export const __pulsePublishInternals: PulsePublishInternals = {
  canPublishBriefing,
  normalizeChannels,
  validateAudienceRoles,
  isBriefingOwnedByPublisher,
  isDuplicatePublishBlocked,
};
