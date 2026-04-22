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

  router.use('/worldline', _writeLimiter);
  router.use(lazyMatch('/worldline', () => import('../worldline'), 'worldline'));
}
