/**
 * Demo Fixtures Registry
 *
 * Aggregates domain-specific fixture modules into a single map keyed by
 * API path prefix.  The demo-fixture-store imports this registry so all
 * GET requests in demo mode are served realistic data without touching
 * the live database.
 *
 * To add a new domain:
 *   1. Create artifacts/api-server/src/lib/demo-fixtures/<domain>.ts
 *   2. Add an entry to the FIXTURE_REGISTRY below.
 */

import { aegisFixtures } from './aegis.js';
import { lyteFixtures } from './lyte.js';
import { terraFixtures } from './terra.js';
import { vesselFixtures } from './vessels.js';

export interface FixtureEntry {
  path: string;
  status?: number;
  data: unknown;
}

export const FIXTURE_REGISTRY: FixtureEntry[] = [
  { path: '/api/vessels', data: vesselFixtures },
  { path: '/api/aegis/alerts', data: aegisFixtures },
  { path: '/api/terra', data: terraFixtures },
  { path: '/api/lyte', data: lyteFixtures },

  {
    path: '/api/health',
    data: { status: 'ok', mode: 'demo', version: '0.0.0', uptime: 99.98 },
  },
  {
    path: '/api/healthz',
    data: { status: 'ok', mode: 'demo' },
  },
  {
    path: '/api/notifications',
    data: {
      notifications: [
        {
          id: 1,
          title: 'Fleet Risk Score Updated',
          body: 'MV Constellation risk score increased to 45',
          type: 'alert',
          read: false,
          createdAt: '2026-04-27T01:00:00Z',
        },
        {
          id: 2,
          title: 'New Distressed Property Signal',
          body: 'Industrial property in Orlando flagged as REO',
          type: 'signal',
          read: false,
          createdAt: '2026-04-26T23:00:00Z',
        },
        {
          id: 3,
          title: 'Governance Approval Required',
          body: 'Bulk export request awaiting executive sign-off',
          type: 'approval',
          read: true,
          createdAt: '2026-04-26T21:00:00Z',
        },
        {
          id: 4,
          title: 'Critical Security Alert',
          body: 'Lateral movement detected on srv-prod-db-01 — immediate review required',
          type: 'alert',
          read: false,
          createdAt: '2026-04-27T01:16:00Z',
        },
        {
          id: 5,
          title: 'Vessel Entered High-Risk Zone',
          body: 'MV Deep Horizon II transiting Gulf offshore area with elevated weather risk',
          type: 'signal',
          read: false,
          createdAt: '2026-04-26T19:30:00Z',
        },
      ],
      unreadCount: 4,
    },
  },
  {
    path: '/api/dashboard/metrics',
    data: {
      revenue: { current: 4280000, previous: 3950000, change: 8.4 },
      activeVessels: 12,
      openAlerts: 6,
      distressedProperties: 12,
      governanceScore: 94.2,
      aiDecisionsToday: 127,
      humansInTheLoop: 3,
    },
  },
  {
    path: '/api/audit',
    data: {
      events: [
        {
          id: 'au001',
          action: 'entity.update',
          actor: 'demo-user',
          target: 'vessel:v001',
          at: '2026-04-27T01:10:00Z',
          result: 'success',
        },
        {
          id: 'au002',
          action: 'alert.acknowledge',
          actor: 'demo-user',
          target: 'alert:a004',
          at: '2026-04-26T22:05:00Z',
          result: 'success',
        },
        {
          id: 'au003',
          action: 'report.export',
          actor: 'demo-user',
          target: 'fleet-summary',
          at: '2026-04-26T20:30:00Z',
          result: 'success',
        },
        {
          id: 'au004',
          action: 'property.flag',
          actor: 'terra-ai',
          target: 'property:t010',
          at: '2026-04-26T18:00:00Z',
          result: 'success',
        },
        {
          id: 'au005',
          action: 'alert.escalate',
          actor: 'soc-analyst-01',
          target: 'alert:a006',
          at: '2026-04-26T18:50:00Z',
          result: 'success',
        },
      ],
      total: 5,
    },
  },
];
