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

import { a11oyFixtures } from './a11oy.js';
import { aegisFixtures } from './aegis.js';
import { conduitFixtures } from './conduit.js';
import { counselFixtures } from './counsel.js';
import { lyteFixtures } from './lyte.js';
import { sentraFixtures } from './sentra.js';
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

  // Sentra — Cyber Resilience Command
  { path: '/api/sentra/alerts', data: { alerts: sentraFixtures.alerts, source: 'seed' } },
  { path: '/api/sentra/incidents', data: { incidents: sentraFixtures.incidents, source: 'seed' } },
  { path: '/api/sentra/summary', data: sentraFixtures.summary },
  { path: '/api/sentra/agents', data: { agents: sentraFixtures.agents, source: 'seed' } },
  { path: '/api/sentra/remediation/cases', data: { cases: sentraFixtures.remediationCases, source: 'seed' } },
  { path: '/api/sentra/remediation/metrics', data: sentraFixtures.remediationMetrics },

  // Aegis sub-routes (used by Sentra via apiFetch)
  { path: '/api/aegis/incidents', data: sentraFixtures.aegisIncidents },
  {
    path: '/api/aegis/scenarios',
    data: [
      {
        id: 'scen-001',
        name: 'Ransomware — Dual Extortion',
        category: 'Ransomware',
        severity: 'critical',
        status: 'active',
        lastRun: '2026-04-25T14:00:00Z',
        score: 88,
        description: 'Simulates a Conti-lineage ransomware campaign targeting file servers, encrypting data and threatening public release.',
      },
      {
        id: 'scen-002',
        name: 'Supply Chain Compromise — npm Inject',
        category: 'Supply Chain',
        severity: 'high',
        status: 'active',
        lastRun: '2026-04-22T09:30:00Z',
        score: 74,
        description: 'Adversary inserts malicious payload into a widely-used open-source dependency.',
      },
      {
        id: 'scen-003',
        name: 'Insider Threat — Privileged Account Misuse',
        category: 'Insider Threat',
        severity: 'high',
        status: 'active',
        lastRun: '2026-04-20T11:00:00Z',
        score: 67,
        description: 'Privileged user exfiltrates sensitive data using legitimate credentials outside business hours.',
      },
      {
        id: 'scen-004',
        name: 'OT/ICS — Modbus Protocol Abuse',
        category: 'OT/ICS',
        severity: 'critical',
        status: 'draft',
        lastRun: null,
        score: null,
        description: 'Attacker pivots from IT to OT network and manipulates Modbus registers on industrial controllers.',
      },
    ],
  },
  {
    path: '/api/aegis/assessments',
    data: [
      {
        id: 'asmt-001',
        framework: 'NIST CSF 2.0',
        completedAt: '2026-04-15T00:00:00Z',
        score: 72,
        maturity: 'Managed',
        gaps: 14,
        findings: 38,
        status: 'complete',
      },
      {
        id: 'asmt-002',
        framework: 'CIS Controls v8',
        completedAt: '2026-03-28T00:00:00Z',
        score: 68,
        maturity: 'Defined',
        gaps: 18,
        findings: 41,
        status: 'complete',
      },
      {
        id: 'asmt-003',
        framework: 'SOC 2 Type II Readiness',
        completedAt: null,
        score: null,
        maturity: null,
        gaps: null,
        findings: null,
        status: 'in_progress',
      },
    ],
  },
  {
    path: '/api/aegis/simulations',
    data: [
      {
        id: 'sim-001',
        name: 'Purple Team — Lateral Movement',
        type: 'purple_team',
        status: 'completed',
        startedAt: '2026-04-18T09:00:00Z',
        completedAt: '2026-04-18T17:00:00Z',
        detectionRate: 0.78,
        blockedActions: 14,
        totalActions: 18,
        ttd: 312,
      },
      {
        id: 'sim-002',
        name: 'Red Team — Initial Access via Phishing',
        type: 'red_team',
        status: 'completed',
        startedAt: '2026-04-10T08:00:00Z',
        completedAt: '2026-04-11T16:00:00Z',
        detectionRate: 0.61,
        blockedActions: 8,
        totalActions: 13,
        ttd: 870,
      },
      {
        id: 'sim-003',
        name: 'Tabletop — Ransomware Response',
        type: 'tabletop',
        status: 'scheduled',
        startedAt: '2026-05-12T10:00:00Z',
        completedAt: null,
        detectionRate: null,
        blockedActions: null,
        totalActions: null,
        ttd: null,
      },
    ],
  },
  {
    path: '/api/aegis/findings',
    data: [
      {
        id: 'fnd-001',
        title: 'MFA Not Enforced on 6 Admin Accounts',
        severity: 'critical',
        category: 'Identity & Access',
        source: 'CIS Controls Assessment',
        status: 'open',
        createdAt: '2026-04-15T00:00:00Z',
        cveId: null,
        asset: 'AD / IAM',
        remediation: 'Enforce MFA on all privileged accounts via Conditional Access policy.',
      },
      {
        id: 'fnd-002',
        title: 'Unpatched CVE-2024-3400 on Palo Alto NGFW',
        severity: 'critical',
        category: 'Vulnerability Management',
        source: 'Vulnerability Scanner',
        status: 'in_progress',
        createdAt: '2026-04-12T00:00:00Z',
        cveId: 'CVE-2024-3400',
        asset: 'fw-prod-edge-01',
        remediation: 'Apply PAN-OS hotfix per vendor advisory.',
      },
      {
        id: 'fnd-003',
        title: 'Secrets Stored in Git History',
        severity: 'high',
        category: 'Secrets Management',
        source: 'Purple Team Exercise',
        status: 'open',
        createdAt: '2026-04-18T00:00:00Z',
        cveId: null,
        asset: 'github.com/szl-holdings/api-server',
        remediation: 'Rotate all exposed credentials. Implement pre-commit secret scanning.',
      },
      {
        id: 'fnd-004',
        title: 'Log Retention Below 12-Month Policy Threshold',
        severity: 'medium',
        category: 'Compliance',
        source: 'SOC 2 Readiness',
        status: 'open',
        createdAt: '2026-04-20T00:00:00Z',
        cveId: null,
        asset: 'SIEM / CloudWatch',
        remediation: 'Extend log retention to 12 months in SIEM and cloud logging buckets.',
      },
    ],
  },

  // Conduit — Reverse ETL sync platform
  { path: '/api/conduit/stats', data: conduitFixtures.stats },
  { path: '/api/conduit/connections', data: conduitFixtures.connections },
  { path: '/api/conduit/syncs', data: conduitFixtures.syncs },
  { path: '/api/conduit/sync-runs', data: conduitFixtures.syncRunsEnvelope },
  { path: '/api/conduit/templates', data: conduitFixtures.templates },

  // A11oy — Brand Orchestration Layer
  { path: '/api/a11oy/fabric/all',       data: a11oyFixtures.fabricAll },
  { path: '/api/a11oy/fabric/kpis',      data: a11oyFixtures.fabricKpis },
  { path: '/api/a11oy/fabric/signals',   data: a11oyFixtures.fabricSignals },
  { path: '/api/a11oy/fabric/risks',     data: a11oyFixtures.fabricRisks },
  { path: '/api/a11oy/fabric/decisions', data: a11oyFixtures.fabricDecisions },
  { path: '/api/a11oy/fabric/outcomes',  data: a11oyFixtures.fabricOutcomes },
  { path: '/api/a11oy/fabric/evidence',  data: a11oyFixtures.fabricEvidence },
  { path: '/api/a11oy/fabric/twins',     data: a11oyFixtures.fabricTwins },
  { path: '/api/a11oy/fabric/verticals', data: a11oyFixtures.fabricVerticals },
  { path: '/api/a11oy/fabric/agents',    data: a11oyFixtures.fabricAgents },
  { path: '/api/a11oy/fabric/roadmap',   data: a11oyFixtures.fabricRoadmap },
  { path: '/api/a11oy/fabric/products',  data: a11oyFixtures.fabricProducts },
  { path: '/api/a11oy/fabric/proofs',    data: a11oyFixtures.fabricProofs },
  { path: '/api/a11oy/now',              data: a11oyFixtures.fabricNow },
  { path: '/api/a11oy/dashboard',        data: a11oyFixtures.dashboardSnapshot },
  { path: '/api/a11oy/pages/identity',   data: a11oyFixtures.pagesIdentity },
  { path: '/api/a11oy/pages/rag',        data: a11oyFixtures.pagesRag },

  // Counsel — Legal Matter Command
  { path: '/api/counsel/matters', data: counselFixtures.matters },
  { path: '/api/counsel/matter-brief', data: counselFixtures.matterBrief },
  { path: '/api/counsel/obligations', data: counselFixtures.obligations },
  { path: '/api/counsel/forecast', data: counselFixtures.forecast },

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
        {
          id: 6,
          title: 'Legal Brief Deadline — 14 Days',
          body: 'Greenfield v. Apex: pre-trial brief due in 14 days — R. Calloway assigned',
          type: 'alert',
          read: false,
          createdAt: '2026-04-27T00:30:00Z',
        },
        {
          id: 7,
          title: 'Conduit Sync Failed',
          body: 'Customer Tickets → Zendesk sync failed: authentication error',
          type: 'signal',
          read: false,
          createdAt: '2026-04-27T11:18:00Z',
        },
      ],
      unreadCount: 6,
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
      activeMatters: 4,
      legalExposureM: 8.4,
      activeSyncs: 5,
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
        {
          id: 'au006',
          action: 'matter.escalate',
          actor: 'counsel-ai',
          target: 'matter:M-GRF-2026-001',
          at: '2026-04-27T09:00:00Z',
          result: 'success',
        },
        {
          id: 'au007',
          action: 'sync.run',
          actor: 'conduit-scheduler',
          target: 'sync:sync-001',
          at: '2026-05-04T06:00:18Z',
          result: 'success',
        },
      ],
      total: 7,
    },
  },
];
