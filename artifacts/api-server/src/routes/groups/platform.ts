import type { IRouter } from 'express';
import { lazyMatch, lazyMount, lazyRegisterMatch } from '../../lib/lazy-router';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../../middlewares/sliding-window-limiter';
import { tenantScope } from '../../middlewares/tenant-scope';

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use('/audit', tenantScope({ required: true }));
  router.use('/tenant-health', tenantScope({ required: true }));
  router.use('/settings', tenantScope({ required: true }));
  router.use('/changelog', tenantScope({ required: true }));
  router.use('/aegis/sync', tenantScope({ required: true }));
  router.use('/vessels/sync', tenantScope({ required: true }));
  router.use('/alloy/sync', tenantScope({ required: true }));
  router.use('/compliance', tenantScope({ required: true }));
  router.use('/approvals', tenantScope({ required: true }));
  router.use('/proof-chain', tenantScope({ required: true }));
  router.use('/audit-chain', tenantScope({ required: true }));
  router.use('/worldline', tenantScope({ required: true }));
  router.use('/dataverse', tenantScope({ required: true }));

  // required: false — pre-membership bootstrap flows that must be reachable before
  // an org context exists.  Each prefix has a specific reason:
  //   /orgs       — org look-up for invitation acceptance and org discovery; the
  //                 user may not yet be a member of any org.
  //   /user       — password-reset and email-verification are public/pre-auth flows
  //                 that arrive via a signed token, not a session.
  //   /onboarding — the onboarding wizard runs before the user has completed org
  //                 creation, so no orgSlug is available yet.
  // Handler-level auth guards (authMiddleware + membership checks) are applied
  // inside each mounted router to prevent unauthenticated data access.
  router.use('/orgs', tenantScope({ required: false }));
  router.use('/user', tenantScope({ required: false }));
  router.use('/onboarding', tenantScope({ required: false }));

  router.use('/audit', _readLimiter);
  router.use(lazyMatch('/audit', () => import('../audit'), 'audit'));

  router.use('/admin/tenants', _writeLimiter);
  router.use(
    lazyRegisterMatch(
      ['/admin/tenants', '/tenants'],
      () => import('../tenant-provisioning'),
      'tenant-provisioning',
    ),
  );

  router.use('/dataverse', _readLimiter);
  router.use(
    '/dataverse',
    lazyMount(() => import('../dataverse'), 'dataverse'),
  );

  router.use(lazyMatch('/scim', () => import('../scim'), 'scim'));

  router.use('/orgs', _readLimiter);
  router.use('/orgs', _writeLimiter);
  router.use('/user', _readLimiter);
  router.use('/user', _writeLimiter);
  router.use(lazyMatch(['/orgs', '/user'], () => import('../org-settings'), 'org-settings'));

  router.use('/onboarding', _writeLimiter);
  router.use(lazyMatch('/onboarding', () => import('../onboarding'), 'onboarding'));

  router.use('/orgs', _writeLimiter);
  router.use(lazyMatch('/orgs', () => import('../invitations'), 'invitations'));

  router.use('/tenant-health', _readLimiter);
  router.use('/tenant-health', _writeLimiter);
  router.use(lazyMatch('/tenant-health', () => import('../tenant-health'), 'tenant-health'));

  router.use('/settings', _readLimiter);
  router.use('/settings', _writeLimiter);
  router.use(lazyMatch('/settings', () => import('../unified-settings'), 'unified-settings'));

  router.use('/changelog', _readLimiter);
  router.use('/changelog', _writeLimiter);
  router.use(lazyMatch('/changelog', () => import('../changelog'), 'changelog'));

  router.use('/aegis/sync', _readLimiter);
  router.use('/vessels/sync', _readLimiter);
  router.use('/alloy/sync', _readLimiter);
  router.use(
    lazyMatch(['/aegis', '/vessels', '/alloy'], () => import('../delta-sync'), 'delta-sync'),
  );
  router.use(lazyMatch('/changes', () => import('../changes'), 'changes'));

  router.use(lazyMatch('/gdpr', () => import('../gdpr'), 'gdpr'));
  router.use(lazyMatch('/privacy', () => import('../privacy'), 'privacy'));

  router.use('/compliance', _readLimiter);
  router.use('/compliance', _writeLimiter);
  router.use(lazyMatch('/compliance', () => import('../compliance'), 'compliance'));

  router.use('/approvals', _writeLimiter);
  router.use(lazyMatch(['/approvals', '/audit-log'], () => import('../approvals'), 'approvals'));

  router.use('/proof-chain', _readLimiter);
  router.use(lazyMatch('/proof-chain', () => import('../proof-chain'), 'proof-chain'));

  router.use('/audit-chain', _readLimiter);
  router.use('/audit-chain', _writeLimiter);
  router.use(lazyMatch('/audit-chain', () => import('../audit-chain'), 'audit-chain'));
  // Hybrid attestation surfaces (backfill, coverage, quarantine, per-event verify).
  // Mounted as a sibling lazy module so it shares /audit-chain prefix without
  // forcing the legacy router to evaluate first.
  router.use(
    lazyMatch('/audit-chain', () => import('../audit-chain-attestations'), 'audit-chain-attestations'),
  );

  // Identity Registry — operator surface for platform DID lifecycle and key custody.
  // Owns /identity-registry/dids, /identity-registry/key-custody, /identity-registry/audit-summary.
  router.use('/identity-registry', _readLimiter);
  router.use('/identity-registry', _writeLimiter);
  router.use(lazyMatch('/identity-registry', () => import('../identity-registry'), 'identity-registry'));

  router.use('/worldline', _writeLimiter);
  router.use(lazyMatch('/worldline', () => import('../worldline'), 'worldline'));
}
