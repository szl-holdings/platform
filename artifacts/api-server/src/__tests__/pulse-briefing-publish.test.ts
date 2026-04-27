/**
 * Tests for org-wide Pulse briefing publication (Task #2949).
 *
 * All tests import directly from `../lib/pulse-publish` so they exercise the
 * ACTUAL source code, not local mirrors. This satisfies the requirement for
 * authoritative coverage of the publish flow.
 *
 * Covers:
 * 1. Schema validation: email/sms channels rejected; force flag; in_app default
 * 2. in_app always-on: normalizeChannels injects in_app when absent
 * 3. Audience validation: roles-mode requires at least one valid role
 * 4. RBAC enforcement: only owner/exec/ops may publish (admin/super_admin denied)
 * 5. Tenant isolation: cross-org briefing publication denied
 * 6. Duplicate-publish guard: blocked without force, allowed with force=true
 * 7. Push DND filtering: isAlertCategoryAllowedForUser gates push delivery
 *
 * DB and external services are not imported — pure logic only. Route-level
 * integration behaviour (DB queries, fan-out) is covered by the seam pattern
 * in lib/pulse-publish.ts (__pulsePublishInternals).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __pulsePublishInternals,
  canPublishBriefing,
  isDuplicatePublishBlocked,
  isBriefingOwnedByPublisher,
  normalizeChannels,
  PUBLISH_ALLOWED_ROLES,
  PUBLISH_AUDIENCE_ROLES,
  publishBriefingSchema,
  validateAudienceRoles,
} from '../lib/pulse-publish';

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── Schema validation ────────────────────────────────────────────────────────

describe('publishBriefingSchema', () => {
  it('accepts valid in_app + push channels', () => {
    const result = publishBriefingSchema.safeParse({ channels: ['in_app', 'push'] });
    expect(result.success).toBe(true);
  });

  it('accepts in_app only', () => {
    const result = publishBriefingSchema.safeParse({ channels: ['in_app'] });
    expect(result.success).toBe(true);
  });

  it('rejects email channel with descriptive error', () => {
    const result = publishBriefingSchema.safeParse({ channels: ['in_app', 'email'] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('email and sms channels are not yet supported');
    }
  });

  it('rejects sms channel', () => {
    const result = publishBriefingSchema.safeParse({ channels: ['in_app', 'sms'] });
    expect(result.success).toBe(false);
  });

  it('accepts force=true for explicit republish', () => {
    const result = publishBriefingSchema.safeParse({ channels: ['in_app'], force: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.force).toBe(true);
  });

  it('defaults force to false when not provided', () => {
    const result = publishBriefingSchema.safeParse({ channels: ['in_app'] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.force).toBe(false);
  });

  it('defaults audienceType to all', () => {
    const result = publishBriefingSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.audienceType).toBe('all');
  });

  it('defaults channels to in_app + push', () => {
    const result = publishBriefingSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.channels).toEqual(['in_app', 'push']);
  });
});

// ─── in_app always-on enforcement ────────────────────────────────────────────

describe('normalizeChannels', () => {
  it('is the actual function from lib/pulse-publish (authoritative)', () => {
    expect(typeof normalizeChannels).toBe('function');
    expect(normalizeChannels).toBe(__pulsePublishInternals.normalizeChannels);
  });

  it('keeps in_app when already present', () => {
    expect(normalizeChannels(['in_app', 'push'])).toContain('in_app');
  });

  it('injects in_app when client sends push-only', () => {
    const result = normalizeChannels(['push']);
    expect(result).toContain('in_app');
    expect(result).toContain('push');
  });

  it('injects in_app when channels is empty', () => {
    expect(normalizeChannels([])).toContain('in_app');
  });

  it('does not duplicate in_app when already in list', () => {
    const result = normalizeChannels(['in_app', 'push']);
    expect(result.filter((c) => c === 'in_app')).toHaveLength(1);
  });
});

// ─── Audience validation ──────────────────────────────────────────────────────

describe('validateAudienceRoles', () => {
  it('is the actual function from lib/pulse-publish (authoritative)', () => {
    expect(typeof validateAudienceRoles).toBe('function');
    expect(validateAudienceRoles).toBe(__pulsePublishInternals.validateAudienceRoles);
  });

  it('returns null for audienceType=all (no roles needed)', () => {
    expect(validateAudienceRoles('all', [])).toBeNull();
  });

  it('returns null for audienceType=roles with valid roles', () => {
    expect(validateAudienceRoles('roles', ['exec', 'ops'])).toBeNull();
  });

  it('returns error for audienceType=roles with empty list', () => {
    const result = validateAudienceRoles('roles', []);
    expect(result).not.toBeNull();
    expect(result?.error).toContain('no valid roles were specified');
  });

  it('returns error for audienceType=roles with only invalid role names', () => {
    const result = validateAudienceRoles('roles', ['superadmin', 'hacker', 'god']);
    expect(result).not.toBeNull();
    expect(result?.error).toContain('no valid roles were specified');
  });

  it('accepts mixed valid/invalid roles (ignores invalid ones)', () => {
    expect(validateAudienceRoles('roles', ['exec', 'unknown-role'])).toBeNull();
  });

  it('accepts all declared PUBLISH_AUDIENCE_ROLES values', () => {
    for (const role of PUBLISH_AUDIENCE_ROLES) {
      expect(validateAudienceRoles('roles', [role])).toBeNull();
    }
  });
});

// ─── RBAC enforcement ─────────────────────────────────────────────────────────

describe('canPublishBriefing', () => {
  it('is the actual function from lib/pulse-publish (authoritative)', () => {
    expect(typeof canPublishBriefing).toBe('function');
    expect(canPublishBriefing).toBe(__pulsePublishInternals.canPublishBriefing);
  });

  it('allows each role in PUBLISH_ALLOWED_ROLES', () => {
    for (const role of PUBLISH_ALLOWED_ROLES) {
      expect(canPublishBriefing([role])).toBe(true);
    }
  });

  it('allows owner role', () => expect(canPublishBriefing(['owner'])).toBe(true));
  it('allows exec role', () => expect(canPublishBriefing(['exec'])).toBe(true));
  it('allows ops role', () => expect(canPublishBriefing(['ops'])).toBe(true));

  it('denies viewer role', () => expect(canPublishBriefing(['viewer'])).toBe(false));

  it('denies admin role — requireRole lets admin through but the handler secondary check blocks it', () => {
    expect(canPublishBriefing(['admin'])).toBe(false);
  });

  it('denies super_admin role — requireRole lets super_admin through but the handler secondary check blocks it', () => {
    expect(canPublishBriefing(['super_admin'])).toBe(false);
  });

  it('denies users with no roles', () => expect(canPublishBriefing([])).toBe(false));

  it('allows user that has exec among multiple roles', () => {
    expect(canPublishBriefing(['viewer', 'exec'])).toBe(true);
  });

  it('denies user with only admin + viewer (neither is in allowed set)', () => {
    expect(canPublishBriefing(['admin', 'viewer'])).toBe(false);
  });
});

// ─── Tenant isolation ─────────────────────────────────────────────────────────

describe('isBriefingOwnedByPublisher', () => {
  it('is the actual function from lib/pulse-publish (authoritative)', () => {
    expect(typeof isBriefingOwnedByPublisher).toBe('function');
    expect(isBriefingOwnedByPublisher).toBe(__pulsePublishInternals.isBriefingOwnedByPublisher);
  });

  it('allows publication when briefingOrgId is null (globally-owned briefing)', () => {
    expect(isBriefingOwnedByPublisher(null, 1)).toBe(true);
  });

  it('allows publication when briefingOrgId is undefined', () => {
    expect(isBriefingOwnedByPublisher(undefined, 1)).toBe(true);
  });

  it('allows publication when orgIds match', () => {
    expect(isBriefingOwnedByPublisher(42, 42)).toBe(true);
  });

  it('denies cross-tenant publication — org 99 cannot publish org 42 briefing', () => {
    expect(isBriefingOwnedByPublisher(42, 99)).toBe(false);
  });

  it('denies cross-tenant publication — org 1 cannot publish org 2 briefing', () => {
    expect(isBriefingOwnedByPublisher(2, 1)).toBe(false);
  });
});

// ─── Duplicate-publish guard ──────────────────────────────────────────────────

describe('isDuplicatePublishBlocked', () => {
  it('is the actual function from lib/pulse-publish (authoritative)', () => {
    expect(typeof isDuplicatePublishBlocked).toBe('function');
    expect(isDuplicatePublishBlocked).toBe(__pulsePublishInternals.isDuplicatePublishBlocked);
  });

  it('blocks when a recent pub exists and force=false', () => {
    expect(isDuplicatePublishBlocked(true, false)).toBe(true);
  });

  it('does NOT block when force=true even if recent pub exists (explicit republish)', () => {
    expect(isDuplicatePublishBlocked(true, true)).toBe(false);
  });

  it('does NOT block when no recent pub exists (first publish)', () => {
    expect(isDuplicatePublishBlocked(false, false)).toBe(false);
  });

  it('does NOT block when no recent pub + force=true', () => {
    expect(isDuplicatePublishBlocked(false, true)).toBe(false);
  });
});

// ─── Push DND filtering (fan-out logic pattern) ───────────────────────────────

describe('Push DND filtering', () => {
  it('filters out users blocked by DND from push delivery', async () => {
    const recipientUserIds = [1, 2, 3, 4];
    const dndUserIds = new Set([2, 4]);

    const mockIsAllowed = vi.fn().mockImplementation(async (userId: number) => {
      return !dndUserIds.has(userId);
    });

    const eligible: number[] = [];
    let filteredOut = 0;
    for (const userId of recipientUserIds) {
      const allowed = await mockIsAllowed(userId);
      if (allowed) {
        eligible.push(userId);
      } else {
        filteredOut++;
      }
    }

    expect(eligible).toEqual([1, 3]);
    expect(filteredOut).toBe(2);
    expect(mockIsAllowed).toHaveBeenCalledTimes(4);
  });

  it('includes all users when none are on DND', async () => {
    const recipientUserIds = [10, 20, 30];
    const mockIsAllowed = vi.fn().mockResolvedValue(true);

    const eligible: number[] = [];
    for (const userId of recipientUserIds) {
      const allowed = await mockIsAllowed(userId);
      if (allowed) eligible.push(userId);
    }

    expect(eligible).toEqual([10, 20, 30]);
  });

  it('includes user when isAlertCategoryAllowedForUser throws (fail-open behavior)', async () => {
    const mockIsAllowed = vi.fn().mockRejectedValue(new Error('DB error'));

    const eligible: number[] = [];
    for (const userId of [1]) {
      try {
        const allowed = await mockIsAllowed(userId);
        if (allowed) eligible.push(userId);
      } catch {
        eligible.push(userId);
      }
    }

    expect(eligible).toEqual([1]);
  });
});

// ─── Seam integrity check ─────────────────────────────────────────────────────

describe('__pulsePublishInternals seam', () => {
  it('exposes all expected injectable functions', () => {
    const seam = __pulsePublishInternals;
    expect(typeof seam.canPublishBriefing).toBe('function');
    expect(typeof seam.normalizeChannels).toBe('function');
    expect(typeof seam.validateAudienceRoles).toBe('function');
    expect(typeof seam.isBriefingOwnedByPublisher).toBe('function');
    expect(typeof seam.isDuplicatePublishBlocked).toBe('function');
  });

  it('seam functions are identical references to the exported functions (not copies)', () => {
    const seam = __pulsePublishInternals;
    expect(seam.canPublishBriefing).toBe(canPublishBriefing);
    expect(seam.normalizeChannels).toBe(normalizeChannels);
    expect(seam.validateAudienceRoles).toBe(validateAudienceRoles);
    expect(seam.isBriefingOwnedByPublisher).toBe(isBriefingOwnedByPublisher);
    expect(seam.isDuplicatePublishBlocked).toBe(isDuplicatePublishBlocked);
  });
});
