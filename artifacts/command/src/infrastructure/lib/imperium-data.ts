export type Classification = 'OPEN' | 'RESTRICTED' | 'CONFIDENTIAL' | 'SOVEREIGN';
export type ThreatLevel = 'CLEAR' | 'ELEVATED' | 'ACTIVE' | 'CRITICAL';
export type AquilaScore = number;

export interface Sentinel {
  id: string;
  name: string;
  type: string;
  classification: Classification;
  status: 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
  aquilaScore: AquilaScore;
  region?: string;
  cpu?: number;
  memory?: number;
  latencyMs?: number;
  cost?: number;
  tags?: Record<string, string>;
}

export interface Century {
  id: string;
  name: string;
  label: string;
  classification: Classification;
  sentinels: Sentinel[];
  aquilaScore: AquilaScore;
  type:
    | 'container-app'
    | 'static-web-app'
    | 'database'
    | 'cache'
    | 'storage'
    | 'messaging'
    | 'keyvault'
    | 'network'
    | 'monitoring';
}

export interface Cohort {
  id: string;
  name: string;
  label: string;
  classification: Classification;
  centuries: Century[];
  aquilaScore: AquilaScore;
  costPerMonth: number;
}

export interface Legion {
  id: string;
  name: string;
  label: string;
  region: string;
  aquilaScore: AquilaScore;
  cohorts: Cohort[];
  threatLevel: ThreatLevel;
  costPerMonth: number;
}

export interface Imperium {
  id: string;
  name: string;
  totalResources: number;
  aquilaScore: AquilaScore;
  threatLevel: ThreatLevel;
  legions: Legion[];
  classificationSummary: Record<Classification, number>;
  totalCostPerMonth: number;
  lastUpdated: Date;
}

const FRONTEND_APPS = [
  'rosie',
  'aegis',
  'beacon',
  'lutar',
  'nimbus',
  'firestorm',
  'dreamera',
  'dreamscape',
  'zeus',
  'apps-showcase',
  'readiness-report',
  'career',
  'vessels',
  'inca',
  'lyte',
  'carlota-jo',
  'szl-holdings',
  'alloyscape',
];

function staticWebAppSentinel(app: string): Sentinel {
  const scores: Record<string, number> = {
    rosie: 97,
    aegis: 94,
    beacon: 91,
    lutar: 99,
    nimbus: 88,
    firestorm: 92,
    dreamera: 85,
    dreamscape: 87,
    zeus: 90,
    'apps-showcase': 82,
    'readiness-report': 89,
    career: 93,
    vessels: 95,
    inca: 83,
    lyte: 96,
    'carlota-jo': 91,
    'szl-holdings': 98,
    alloyscape: 84,
  };
  return {
    id: `swa-${app}`,
    name: `szlholdings-${app}`,
    type: 'Static Web App',
    classification: 'OPEN',
    status: 'ACTIVE',
    aquilaScore: scores[app] || 88,
    latencyMs: Math.floor(Math.random() * 30) + 15,
    cost: 9,
    tags: { environment: 'production', app },
  };
}

export const IMPERIUM_DATA: Imperium = {
  id: 'imperium-szlholdings',
  name: 'SZL HOLDINGS PLATFORM',
  totalResources: 58,
  aquilaScore: 91,
  threatLevel: 'ELEVATED',
  totalCostPerMonth: 4280,
  lastUpdated: new Date(),
  classificationSummary: {
    OPEN: 20,
    RESTRICTED: 16,
    CONFIDENTIAL: 14,
    SOVEREIGN: 8,
  },
  legions: [
    {
      id: 'legion-eastus',
      name: 'REGION I — PRIMARY',
      label: 'East US — Primary',
      region: 'eastus',
      aquilaScore: 93,
      threatLevel: 'ELEVATED',
      costPerMonth: 3100,
      cohorts: [
        {
          id: 'cohort-compute',
          name: 'GROUP — COMPUTE',
          label: 'Compute & API',
          classification: 'RESTRICTED',
          aquilaScore: 94,
          costPerMonth: 1200,
          centuries: [
            {
              id: 'century-containerapp',
              name: 'CLUSTER — API',
              label: 'Container App Environment',
              classification: 'RESTRICTED',
              type: 'container-app',
              aquilaScore: 94,
              sentinels: [
                {
                  id: 'sentinel-api-primary',
                  name: 'szlholdings-api (primary)',
                  type: 'Container App — Replica 1',
                  classification: 'RESTRICTED',
                  status: 'ACTIVE',
                  aquilaScore: 96,
                  cpu: 38,
                  memory: 52,
                  latencyMs: 142,
                  cost: 280,
                },
                {
                  id: 'sentinel-api-replica-2',
                  name: 'szlholdings-api (replica-2)',
                  type: 'Container App — Replica 2',
                  classification: 'RESTRICTED',
                  status: 'ACTIVE',
                  aquilaScore: 94,
                  cpu: 41,
                  memory: 48,
                  latencyMs: 138,
                  cost: 280,
                },
                {
                  id: 'sentinel-cae-env',
                  name: 'szlholdings-cae-env',
                  type: 'Container Apps Environment',
                  classification: 'RESTRICTED',
                  status: 'ACTIVE',
                  aquilaScore: 98,
                  cost: 120,
                },
              ],
            },
          ],
        },
        {
          id: 'cohort-frontend',
          name: 'GROUP — FRONTEND',
          label: 'Frontend Static Web Apps',
          classification: 'OPEN',
          aquilaScore: 91,
          costPerMonth: 162,
          centuries: [
            {
              id: 'century-swa-primary',
              name: 'CLUSTER — WEB APPS A',
              label: 'Primary Web Apps (Group A)',
              classification: 'OPEN',
              type: 'static-web-app',
              aquilaScore: 94,
              sentinels: FRONTEND_APPS.slice(0, 9).map(staticWebAppSentinel),
            },
            {
              id: 'century-swa-secondary',
              name: 'CLUSTER — WEB APPS B',
              label: 'Secondary Web Apps (Group B)',
              classification: 'OPEN',
              type: 'static-web-app',
              aquilaScore: 89,
              sentinels: FRONTEND_APPS.slice(9).map(staticWebAppSentinel),
            },
          ],
        },
        {
          id: 'cohort-data',
          name: 'GROUP — DATA',
          label: 'Data Services',
          classification: 'CONFIDENTIAL',
          aquilaScore: 97,
          costPerMonth: 890,
          centuries: [
            {
              id: 'century-postgres',
              name: 'CLUSTER — POSTGRES',
              label: 'PostgreSQL Flexible Server',
              classification: 'CONFIDENTIAL',
              type: 'database',
              aquilaScore: 98,
              sentinels: [
                {
                  id: 'sentinel-pg-primary',
                  name: 'szlholdings-pg (primary)',
                  type: 'PostgreSQL 16 — Primary',
                  classification: 'CONFIDENTIAL',
                  status: 'ACTIVE',
                  aquilaScore: 99,
                  cpu: 22,
                  memory: 44,
                  latencyMs: 3,
                  cost: 420,
                },
                {
                  id: 'sentinel-pg-standby',
                  name: 'szlholdings-pg (standby)',
                  type: 'PostgreSQL 16 — HA Standby',
                  classification: 'CONFIDENTIAL',
                  status: 'ACTIVE',
                  aquilaScore: 99,
                  cpu: 18,
                  memory: 40,
                  latencyMs: 3,
                  cost: 0,
                },
                {
                  id: 'sentinel-pg-db',
                  name: 'szlholdings (database)',
                  type: 'PostgreSQL Database',
                  classification: 'CONFIDENTIAL',
                  status: 'ACTIVE',
                  aquilaScore: 97,
                  cost: 0,
                },
              ],
            },
            {
              id: 'century-redis',
              name: 'CLUSTER — REDIS',
              label: 'Azure Cache for Redis',
              classification: 'CONFIDENTIAL',
              type: 'cache',
              aquilaScore: 95,
              sentinels: [
                {
                  id: 'sentinel-redis-primary',
                  name: 'szlholdings-redis (primary)',
                  type: 'Redis Standard C1 — Primary',
                  classification: 'CONFIDENTIAL',
                  status: 'ACTIVE',
                  aquilaScore: 96,
                  memory: 62,
                  latencyMs: 0.8,
                  cost: 55,
                },
                {
                  id: 'sentinel-redis-replica',
                  name: 'szlholdings-redis (replica)',
                  type: 'Redis Standard C1 — Replica',
                  classification: 'CONFIDENTIAL',
                  status: 'ACTIVE',
                  aquilaScore: 95,
                  memory: 58,
                  latencyMs: 0.9,
                  cost: 0,
                },
              ],
            },
            {
              id: 'century-storage',
              name: 'CLUSTER — BLOB STORAGE',
              label: 'Storage Accounts',
              classification: 'CONFIDENTIAL',
              type: 'storage',
              aquilaScore: 97,
              sentinels: [
                {
                  id: 'sentinel-storage-main',
                  name: 'szlholdings-stor (main)',
                  type: 'Storage Account (ZRS)',
                  classification: 'CONFIDENTIAL',
                  status: 'ACTIVE',
                  aquilaScore: 98,
                  cost: 24,
                },
                {
                  id: 'sentinel-storage-prism',
                  name: 'szlholdings-prism-blob',
                  type: 'Blob Storage — PRISM Documents (ZRS)',
                  classification: 'CONFIDENTIAL',
                  status: 'ACTIVE',
                  aquilaScore: 97,
                  cost: 18,
                },
              ],
            },
            {
              id: 'century-messaging',
              name: 'CLUSTER — SERVICE BUS',
              label: 'Service Bus',
              classification: 'RESTRICTED',
              type: 'messaging',
              aquilaScore: 96,
              sentinels: [
                {
                  id: 'sentinel-sb-namespace',
                  name: 'szlholdings-sb',
                  type: 'Service Bus Namespace (Standard)',
                  classification: 'RESTRICTED',
                  status: 'ACTIVE',
                  aquilaScore: 97,
                  cost: 10,
                },
                {
                  id: 'sentinel-sb-queues',
                  name: '9 queues + 1 topic',
                  type: 'Service Bus Queues & Topics',
                  classification: 'RESTRICTED',
                  status: 'ACTIVE',
                  aquilaScore: 96,
                  cost: 0,
                },
              ],
            },
          ],
        },
        {
          id: 'cohort-sovereign',
          name: 'GROUP — SECURITY',
          label: 'Security-Protected Resources',
          classification: 'SOVEREIGN',
          aquilaScore: 99,
          costPerMonth: 320,
          centuries: [
            {
              id: 'century-keyvault',
              name: 'CLUSTER — KEY VAULT',
              label: 'Key Vault',
              classification: 'SOVEREIGN',
              type: 'keyvault',
              aquilaScore: 100,
              sentinels: [
                {
                  id: 'sentinel-kv',
                  name: 'szlholdings-kv',
                  type: 'Azure Key Vault (Standard + Purge Protection)',
                  classification: 'SOVEREIGN',
                  status: 'ACTIVE',
                  aquilaScore: 100,
                  cost: 15,
                  tags: { purgeProtection: 'enabled', rbac: 'enabled' },
                },
              ],
            },
            {
              id: 'century-network',
              name: 'CLUSTER — NETWORKING',
              label: 'Network Infrastructure',
              classification: 'SOVEREIGN',
              type: 'network',
              aquilaScore: 98,
              sentinels: [
                {
                  id: 'sentinel-vnet',
                  name: 'szlholdings-vnet',
                  type: 'Virtual Network (10.0.0.0/16)',
                  classification: 'SOVEREIGN',
                  status: 'ACTIVE',
                  aquilaScore: 99,
                  cost: 0,
                },
                {
                  id: 'sentinel-cae-subnet',
                  name: 'container-apps subnet',
                  type: 'VNet Subnet — Container Apps (10.0.0.0/23)',
                  classification: 'SOVEREIGN',
                  status: 'ACTIVE',
                  aquilaScore: 99,
                  cost: 0,
                },
                {
                  id: 'sentinel-pg-subnet',
                  name: 'postgres subnet',
                  type: 'VNet Subnet — PostgreSQL (10.0.2.0/24)',
                  classification: 'SOVEREIGN',
                  status: 'ACTIVE',
                  aquilaScore: 99,
                  cost: 0,
                },
                {
                  id: 'sentinel-pe-subnet',
                  name: 'private-endpoints subnet',
                  type: 'VNet Subnet — Private Endpoints (10.0.3.0/24)',
                  classification: 'SOVEREIGN',
                  status: 'ACTIVE',
                  aquilaScore: 98,
                  cost: 0,
                },
                {
                  id: 'sentinel-cae-nsg',
                  name: 'szlholdings-vnet-cae-nsg',
                  type: 'Network Security Group — Container Apps',
                  classification: 'SOVEREIGN',
                  status: 'ACTIVE',
                  aquilaScore: 97,
                  cost: 0,
                },
                {
                  id: 'sentinel-pg-nsg',
                  name: 'szlholdings-vnet-pg-nsg',
                  type: 'Network Security Group — PostgreSQL',
                  classification: 'SOVEREIGN',
                  status: 'ACTIVE',
                  aquilaScore: 98,
                  cost: 0,
                },
              ],
            },
            {
              id: 'century-frontdoor',
              name: 'CLUSTER — GATEWAY',
              label: 'Front Door & WAF',
              classification: 'SOVEREIGN',
              type: 'network',
              aquilaScore: 97,
              sentinels: [
                {
                  id: 'sentinel-frontdoor',
                  name: 'szlholdings-fd',
                  type: 'Azure Front Door Premium',
                  classification: 'SOVEREIGN',
                  status: 'ACTIVE',
                  aquilaScore: 98,
                  latencyMs: 18,
                  cost: 220,
                },
                {
                  id: 'sentinel-waf',
                  name: 'szlholdingswaf',
                  type: 'WAF Policy (Prevention + DRS 2.1 + Bot 1.1)',
                  classification: 'SOVEREIGN',
                  status: 'ACTIVE',
                  aquilaScore: 99,
                  cost: 0,
                },
                {
                  id: 'sentinel-fd-endpoint',
                  name: 'szlholdings-fd-endpoint',
                  type: 'Front Door Endpoint (szlholdings.com)',
                  classification: 'SOVEREIGN',
                  status: 'ACTIVE',
                  aquilaScore: 97,
                  latencyMs: 18,
                  cost: 0,
                },
              ],
            },
            {
              id: 'century-monitoring',
              name: 'CLUSTER — MONITORING',
              label: 'Monitoring & Observability',
              classification: 'RESTRICTED',
              type: 'monitoring',
              aquilaScore: 96,
              sentinels: [
                {
                  id: 'sentinel-loganalytics',
                  name: 'szlholdings-logs',
                  type: 'Log Analytics Workspace (90-day retention)',
                  classification: 'RESTRICTED',
                  status: 'ACTIVE',
                  aquilaScore: 97,
                  cost: 45,
                },
                {
                  id: 'sentinel-appinsights',
                  name: 'szlholdings-ai',
                  type: 'Application Insights (100% sampling)',
                  classification: 'RESTRICTED',
                  status: 'ACTIVE',
                  aquilaScore: 95,
                  cost: 30,
                },
                {
                  id: 'sentinel-alerting',
                  name: 'szlholdings-ops-alerts',
                  type: 'Alert Action Group + 4 alert rules',
                  classification: 'RESTRICTED',
                  status: 'ACTIVE',
                  aquilaScore: 96,
                  cost: 5,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'legion-dr',
      name: 'REGION II — STANDBY',
      label: 'Geo-Redundant Backup Region',
      region: 'westus2',
      aquilaScore: 88,
      threatLevel: 'CLEAR',
      costPerMonth: 1180,
      cohorts: [
        {
          id: 'cohort-dr-data',
          name: 'GROUP — STANDBY',
          label: 'Geo-Redundant Data',
          classification: 'CONFIDENTIAL',
          aquilaScore: 97,
          costPerMonth: 860,
          centuries: [
            {
              id: 'century-pg-geo',
              name: 'CLUSTER — POSTGRES GEO',
              label: 'PostgreSQL Geo-Redundant Backup',
              classification: 'CONFIDENTIAL',
              type: 'database',
              aquilaScore: 99,
              sentinels: [
                {
                  id: 'sentinel-pg-geo',
                  name: 'szlholdings-pg (geo-backup)',
                  type: 'PostgreSQL 16 — Geo-Redundant Backup',
                  classification: 'CONFIDENTIAL',
                  status: 'ACTIVE',
                  aquilaScore: 99,
                  cost: 420,
                  region: 'westus2',
                },
              ],
            },
            {
              id: 'century-docintell',
              name: 'CLUSTER — INTELLIGENCE',
              label: 'Document Intelligence (AI)',
              classification: 'RESTRICTED',
              type: 'container-app',
              aquilaScore: 92,
              sentinels: [
                {
                  id: 'sentinel-docintell',
                  name: 'szlholdings-docintell',
                  type: 'Azure Document Intelligence (S0)',
                  classification: 'RESTRICTED',
                  status: 'ACTIVE',
                  aquilaScore: 93,
                  cost: 200,
                  region: 'westus2',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export function getClassificationColor(classification: Classification): string {
  const map: Record<Classification, string> = {
    OPEN: '#4ade80',
    RESTRICTED: '#fb923c',
    CONFIDENTIAL: '#f87171',
    SOVEREIGN: '#c9a227',
  };
  return map[classification];
}

export function getThreatColor(threat: ThreatLevel): string {
  const map: Record<ThreatLevel, string> = {
    CLEAR: '#4ade80',
    ELEVATED: '#facc15',
    ACTIVE: '#fb923c',
    CRITICAL: '#ef4444',
  };
  return map[threat];
}

export function getAquilaColor(score: number): string {
  if (score >= 95) return '#4ade80';
  if (score >= 88) return '#a3e635';
  if (score >= 75) return '#facc15';
  if (score >= 60) return '#fb923c';
  return '#ef4444';
}

export function getAquilaLabel(score: number): string {
  if (score >= 95) return 'OPTIMUS';
  if (score >= 88) return 'FORTIS';
  if (score >= 75) return 'MEDIOCRIS';
  if (score >= 60) return 'INFIRMUS';
  return 'CRITICUS';
}

export function flattenLegionResources(imperium: Imperium): Sentinel[] {
  return imperium.legions.flatMap((l) =>
    l.cohorts.flatMap((c) => c.centuries.flatMap((ct) => ct.sentinels)),
  );
}

export const SUPPLY_ROUTES = [
  {
    id: 'route-fd-api',
    from: 'Front Door (szlholdings.com)',
    to: 'Container App API',
    latencyMs: 18,
    throughputRps: 847,
    errorRate: 0.002,
    status: 'ACTIVE' as const,
    protocol: 'HTTPS/2',
    classification: 'SOVEREIGN' as Classification,
  },
  {
    id: 'route-fd-swa',
    from: 'Front Door (szlholdings.com)',
    to: 'Static Web Apps (×18)',
    latencyMs: 12,
    throughputRps: 3200,
    errorRate: 0.0004,
    status: 'ACTIVE' as const,
    protocol: 'HTTPS/CDN',
    classification: 'OPEN' as Classification,
  },
  {
    id: 'route-api-pg',
    from: 'Container App API',
    to: 'PostgreSQL (VNet Private)',
    latencyMs: 3,
    throughputRps: 420,
    errorRate: 0.0,
    status: 'ACTIVE' as const,
    protocol: 'PostgreSQL/TLS',
    classification: 'CONFIDENTIAL' as Classification,
  },
  {
    id: 'route-api-redis',
    from: 'Container App API',
    to: 'Redis Cache (Private Endpoint)',
    latencyMs: 0.8,
    throughputRps: 1840,
    errorRate: 0.0,
    status: 'ACTIVE' as const,
    protocol: 'Redis/TLS 6380',
    classification: 'CONFIDENTIAL' as Classification,
  },
  {
    id: 'route-api-kv',
    from: 'Container App API',
    to: 'Key Vault (Private Endpoint)',
    latencyMs: 4,
    throughputRps: 12,
    errorRate: 0.0,
    status: 'ACTIVE' as const,
    protocol: 'HTTPS/RBAC',
    classification: 'SOVEREIGN' as Classification,
  },
  {
    id: 'route-api-sb',
    from: 'Container App API',
    to: 'Service Bus (AMQP)',
    latencyMs: 8,
    throughputRps: 95,
    errorRate: 0.001,
    status: 'ACTIVE' as const,
    protocol: 'AMQP 1.0 / TLS',
    classification: 'RESTRICTED' as Classification,
  },
  {
    id: 'route-api-storage',
    from: 'Container App API',
    to: 'Blob Storage (Private Endpoint)',
    latencyMs: 11,
    throughputRps: 38,
    errorRate: 0.0,
    status: 'ACTIVE' as const,
    protocol: 'HTTPS/Storage',
    classification: 'CONFIDENTIAL' as Classification,
  },
  {
    id: 'route-api-docintell',
    from: 'Container App API',
    to: 'Document Intelligence',
    latencyMs: 1200,
    throughputRps: 2,
    errorRate: 0.012,
    status: 'ACTIVE' as const,
    protocol: 'HTTPS/Cognitive',
    classification: 'RESTRICTED' as Classification,
  },
  {
    id: 'route-pg-loganalytics',
    from: 'PostgreSQL',
    to: 'Log Analytics',
    latencyMs: 50,
    throughputRps: 4,
    errorRate: 0.0,
    status: 'ACTIVE' as const,
    protocol: 'Azure Monitor',
    classification: 'RESTRICTED' as Classification,
  },
  {
    id: 'route-api-loganalytics',
    from: 'Container App API',
    to: 'App Insights / Log Analytics',
    latencyMs: 45,
    throughputRps: 22,
    errorRate: 0.0,
    status: 'ACTIVE' as const,
    protocol: 'OTLP / Azure Monitor',
    classification: 'RESTRICTED' as Classification,
  },
];

export const SENATE_PROPOSALS = [
  {
    id: 'senate-001',
    title: 'Scale Container App to maxReplicas: 20',
    description:
      'Increase maximum horizontal scaling limit from 10 to 20 replicas to support projected Q2 load growth.',
    type: 'SCALING',
    classification: 'RESTRICTED' as Classification,
    status: 'PENDING_VOTE' as const,
    proposedBy: 'AI Ops — Compute Cluster',
    proposedAt: new Date(Date.now() - 3600000 * 2),
    votes: { aye: 2, nay: 0, veto: false, required: 3 },
    impact: 'HIGH',
    costDelta: '+$560/mo',
  },
  {
    id: 'senate-002',
    title: 'Rotate Key Vault secrets (90-day cycle)',
    description:
      'Automated 90-day rotation of all application secrets in szlholdings-kv per SOC-2 compliance schedule.',
    type: 'SECURITY',
    classification: 'SOVEREIGN' as Classification,
    status: 'APPROVED' as const,
    proposedBy: 'Security Center — Auto-Hardening',
    proposedAt: new Date(Date.now() - 3600000 * 48),
    votes: { aye: 3, nay: 0, veto: false, required: 3 },
    impact: 'MEDIUM',
    costDelta: '$0',
  },
  {
    id: 'senate-003',
    title: 'Enable WAF Rate-Limit: 500 req/min',
    description:
      'Reduce WAF rate limit threshold from 1000 to 500 req/min following reconnaissance patterns in Aegis threat feed.',
    type: 'SECURITY',
    classification: 'SOVEREIGN' as Classification,
    status: 'PENDING_VOTE' as const,
    proposedBy: 'Security Center — Threat Protocol',
    proposedAt: new Date(Date.now() - 3600000),
    votes: { aye: 1, nay: 1, veto: false, required: 3 },
    impact: 'HIGH',
    costDelta: '$0',
  },
  {
    id: 'senate-004',
    title: 'Migrate PostgreSQL to GeneralPurpose D4s_v3',
    description:
      'Upgrade from D2s_v3 to D4s_v3 (4 vCores) to resolve P95 connection pool saturation alerts.',
    type: 'SCALING',
    classification: 'CONFIDENTIAL' as Classification,
    status: 'VETOED' as const,
    proposedBy: 'AI Ops — Data Cluster',
    proposedAt: new Date(Date.now() - 3600000 * 72),
    votes: { aye: 2, nay: 0, veto: true, required: 3 },
    impact: 'HIGH',
    costDelta: '+$280/mo',
    vetoBy: 'Approver: Stephen L.',
    vetoReason: 'Defer until Q3 capacity review',
  },
  {
    id: 'senate-005',
    title: 'Enable VNet for Service Bus (Premium SKU)',
    description:
      'Upgrade Service Bus to Premium for VNet injection, eliminating the single public-facing messaging endpoint.',
    type: 'NETWORK',
    classification: 'SOVEREIGN' as Classification,
    status: 'PENDING_VOTE' as const,
    proposedBy: 'Security Perimeter — Network Hardening',
    proposedAt: new Date(Date.now() - 3600000 * 6),
    votes: { aye: 0, nay: 0, veto: false, required: 3 },
    impact: 'MEDIUM',
    costDelta: '+$600/mo',
  },
];

export const CENTURION_PROFILES = [
  {
    id: 'centurion-compute',
    name: 'API MONITOR',
    century: 'CLUSTER — API',
    cohort: 'GROUP — COMPUTE',
    aquilaScore: 94,
    status: 'ACTIVE' as const,
    readinessReport:
      'Container App scaling at 41% CPU utilization. 2 active replicas. P95 latency 142ms — within SLA. HTTP scaling rule active at concurrentRequests=25. No anomalies detected.',
    recommendation:
      'Increase concurrentRequests threshold to 35 to reduce premature scale-out events during low-medium traffic. Projected 18% cost reduction.',
    scalingRecommendation: { currentMin: 2, currentMax: 10, recommendedMin: 2, recommendedMax: 12 },
    failureProbability: 0.03,
    failurePrediction:
      'No imminent failure risk. Memory utilization trending +2%/week — monitor in 30 days.',
    metrics: { cpu: 41, memory: 50, replicaCount: 2, p95Latency: 142, requestsPerSec: 847 },
  },
  {
    id: 'centurion-data',
    name: 'DB MONITOR',
    century: 'CLUSTER — POSTGRES',
    cohort: 'GROUP — DATA',
    aquilaScore: 98,
    status: 'ACTIVE' as const,
    readinessReport:
      'PostgreSQL running at 22% CPU. HA Standby synchronized. Connection pool at 38% capacity. Backup status: geo-redundant backup current. Last successful backup: 6 hours ago.',
    recommendation:
      'Connection pool capacity comfortable. Consider enabling PgBouncer connection pooling at API layer for future growth beyond 500 concurrent connections.',
    scalingRecommendation: { currentMin: 2, currentMax: 2, recommendedMin: 2, recommendedMax: 2 },
    failureProbability: 0.005,
    failurePrediction:
      'Storage growth at 12GB/month. Projected to reach 128GB capacity in ~8 months. Auto-grow enabled.',
    metrics: { cpu: 22, memory: 44, connectionPoolPct: 38, backupAge: 6, storagePct: 35 },
  },
  {
    id: 'centurion-cache',
    name: 'CACHE MONITOR',
    century: 'CLUSTER — REDIS',
    cohort: 'GROUP — DATA',
    aquilaScore: 95,
    status: 'ACTIVE' as const,
    readinessReport:
      'Redis C1 Standard at 62% memory utilization. Replica synchronized. Cache hit rate 94.2%. maxmemory-policy: allkeys-lru active. No eviction pressure.',
    recommendation:
      'Cache hit rate excellent. Consider upgrading to Premium P1 for 6GB capacity if growth continues — current 62% utilization leaves 2.2GB headroom.',
    scalingRecommendation: { currentMin: 1, currentMax: 1, recommendedMin: 1, recommendedMax: 1 },
    failureProbability: 0.01,
    failurePrediction:
      'Memory utilization at 62% with stable trend. No upgrade needed within 90 days.',
    metrics: { memory: 62, hitRate: 94.2, evictedKeys: 0, connectedClients: 24 },
  },
  {
    id: 'centurion-frontend',
    name: 'WEB MONITOR',
    century: 'CLUSTER — WEB APPS A',
    cohort: 'GROUP — FRONTEND',
    aquilaScore: 91,
    status: 'ACTIVE' as const,
    readinessReport:
      '18 Static Web Apps active via Front Door CDN. Average latency 12ms globally. WAF blocking 847 requests/day. Cache hit rate 98.3% for hashed assets.',
    recommendation:
      'Static asset caching excellent. Consider enabling preloading headers for critical JS bundles. Identify the 3 apps with health scores below 88 for bundle optimization review.',
    scalingRecommendation: {
      currentMin: 18,
      currentMax: 18,
      recommendedMin: 18,
      recommendedMax: 18,
    },
    failureProbability: 0.005,
    failurePrediction: 'No failure risk. CDN infrastructure managed by Azure Front Door.',
    metrics: { activeApps: 18, avgLatency: 12, cacheHitRate: 98.3, wafBlocks: 847 },
  },
  {
    id: 'centurion-security',
    name: 'SECURITY MONITOR',
    century: 'CLUSTER — GATEWAY',
    cohort: 'GROUP — SECURITY',
    aquilaScore: 97,
    status: 'ACTIVE' as const,
    readinessReport:
      'Front Door Premium active. WAF in Prevention mode. DRS 2.1 + Bot Manager 1.1 active. Rate limit: 1000 req/min. 3 managed rule sets active. Custom domain SSL: valid.',
    recommendation:
      'Reduce WAF rate limit to 500 req/min based on threat intelligence reconnaissance patterns. Enable geo-filtering for high-risk regions.',
    scalingRecommendation: { currentMin: 1, currentMax: 1, recommendedMin: 1, recommendedMax: 1 },
    failureProbability: 0.008,
    failurePrediction: 'No failure risk. Certificate renewal managed automatically.',
    metrics: { wafBlocks: 847, rateLimit: 1000, activeManagedRules: 3, sslDaysRemaining: 245 },
  },
];

export type GeoLayer = 'SIGINT' | 'INFRASTRUCTURE' | 'PERSONNEL' | 'WEATHER';
export type GeoThreat = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NOMINAL';

export interface GeoPin {
  id: string;
  layer: GeoLayer;
  lat: number;
  lng: number;
  label: string;
  sublabel: string;
  classification: Classification;
  threat: GeoThreat;
  detail: {
    summary: string;
    source: string;
    timestamp: string;
    confidence: number;
    tags: string[];
  };
}

export const GEO_PINS: GeoPin[] = [
  {
    id: 'geo-infra-useast',
    layer: 'INFRASTRUCTURE',
    lat: 37.4316,
    lng: -78.6569,
    label: 'Legio I — US East',
    sublabel: 'Primary compute region',
    classification: 'SOVEREIGN',
    threat: 'NOMINAL',
    detail: {
      summary:
        'Container App + PostgreSQL HA cluster. 32 resources active. Aquila Score 94. Zero P1/P2 incidents in 24h.',
      source: 'Azure Monitor / Internal',
      timestamp: 'T-00:04',
      confidence: 100,
      tags: ['PRIMARY', 'HA', 'SOVEREIGN'],
    },
  },
  {
    id: 'geo-infra-uswest',
    layer: 'INFRASTRUCTURE',
    lat: 47.6062,
    lng: -120.7104,
    label: 'Legio II — US West 2',
    sublabel: 'Failover & DR region',
    classification: 'RESTRICTED',
    threat: 'NOMINAL',
    detail: {
      summary:
        'Geo-redundant PostgreSQL backup active. Static Web App secondary endpoints warm. RTO < 15 min confirmed.',
      source: 'Azure Site Recovery',
      timestamp: 'T-00:12',
      confidence: 98,
      tags: ['FAILOVER', 'DR', 'GEO-REDUNDANT'],
    },
  },
  {
    id: 'geo-infra-westeurope',
    layer: 'INFRASTRUCTURE',
    lat: 52.3702,
    lng: 4.8952,
    label: 'Legio III — West Europe',
    sublabel: 'GDPR-compliant EU dataplane',
    classification: 'CONFIDENTIAL',
    threat: 'NOMINAL',
    detail: {
      summary:
        'EU data residency zone. GDPR-scoped data processing only. Automated compliance scan last run T-02:00.',
      source: 'Azure Policy / Compliance',
      timestamp: 'T-00:08',
      confidence: 99,
      tags: ['GDPR', 'EU-RESIDENCY', 'COMPLIANT'],
    },
  },
  {
    id: 'geo-infra-seasia',
    layer: 'INFRASTRUCTURE',
    lat: 1.3521,
    lng: 103.8198,
    label: 'Legio IV — Southeast Asia',
    sublabel: 'APAC CDN edge node',
    classification: 'OPEN',
    threat: 'NOMINAL',
    detail: {
      summary:
        'Front Door CDN edge pop active. Average latency 8ms to APAC clients. No anomalies. Cache hit rate 97.1%.',
      source: 'Azure Front Door Analytics',
      timestamp: 'T-00:06',
      confidence: 97,
      tags: ['CDN', 'APAC', 'EDGE'],
    },
  },
  {
    id: 'geo-sigint-001',
    layer: 'SIGINT',
    lat: 55.7558,
    lng: 37.6173,
    label: 'SIGINT-001 — Moscow',
    sublabel: 'Auth endpoint probe cluster',
    classification: 'CONFIDENTIAL',
    threat: 'HIGH',
    detail: {
      summary:
        'Distributed credential stuffing campaign originating from 14 IPs in Moscow ASN. WAF rate-limiting engaged. 412 blocked requests in last hour.',
      source: 'WAF Threat Feed / Aegis SIEM',
      timestamp: 'T-00:22',
      confidence: 87,
      tags: ['BRUTEFORCE', 'CREDENTIAL-STUFFING', 'WAF-BLOCKED'],
    },
  },
  {
    id: 'geo-sigint-002',
    layer: 'SIGINT',
    lat: 39.9042,
    lng: 116.4074,
    label: 'SIGINT-002 — Beijing',
    sublabel: 'SQLi probe — /api/graphql',
    classification: 'CONFIDENTIAL',
    threat: 'MEDIUM',
    detail: {
      summary:
        'Automated SQL injection probes against GraphQL endpoint. DRS 2.1 rule set blocking. Pattern matches APT-41 tooling signature.',
      source: 'WAF DRS 2.1 / Threat Intel',
      timestamp: 'T-00:18',
      confidence: 72,
      tags: ['SQLI', 'APT-41', 'GRAPHQL'],
    },
  },
  {
    id: 'geo-sigint-003',
    layer: 'SIGINT',
    lat: 51.5074,
    lng: -0.1278,
    label: 'SIGINT-003 — London',
    sublabel: 'Bot crawler — static assets',
    classification: 'RESTRICTED',
    threat: 'LOW',
    detail: {
      summary:
        'Automated crawling of static asset endpoints by known bot ASN. Bot Manager 1.1 applied rate-limit. No data exfiltration risk.',
      source: 'Bot Manager / CDN Logs',
      timestamp: 'T-00:35',
      confidence: 95,
      tags: ['BOT', 'CRAWLER', 'RATE-LIMITED'],
    },
  },
  {
    id: 'geo-sigint-004',
    layer: 'SIGINT',
    lat: -23.5505,
    lng: -46.6333,
    label: 'SIGINT-004 — São Paulo',
    sublabel: 'Reconnaissance scan — port sweep',
    classification: 'RESTRICTED',
    threat: 'MEDIUM',
    detail: {
      summary:
        'Port sweep against external IP range. Front Door absorbing all traffic. No internal exposure. Geo-filter recommendation pending senate vote.',
      source: 'Azure Network Watcher',
      timestamp: 'T-01:02',
      confidence: 81,
      tags: ['PORT-SCAN', 'RECON', 'CONTAINED'],
    },
  },
  {
    id: 'geo-personnel-001',
    layer: 'PERSONNEL',
    lat: 40.7128,
    lng: -74.006,
    label: 'EXEC — New York',
    sublabel: 'Authorized administrator',
    classification: 'SOVEREIGN',
    threat: 'NOMINAL',
    detail: {
      summary:
        'C-suite executive access via Zero Trust NAC. MFA verified. Session duration 2h 14m. Read-only mode active.',
      source: 'Entra ID / Conditional Access',
      timestamp: 'T-00:02',
      confidence: 100,
      tags: ['C-SUITE', 'MFA-VERIFIED', 'READ-ONLY'],
    },
  },
  {
    id: 'geo-personnel-002',
    layer: 'PERSONNEL',
    lat: 34.0522,
    lng: -118.2437,
    label: 'DEVOPS — Los Angeles',
    sublabel: 'Infrastructure engineer',
    classification: 'RESTRICTED',
    threat: 'NOMINAL',
    detail: {
      summary:
        'Senior DevOps engineer. Active deployment pipeline session. Azure RBAC: Contributor on Compute RG. Approved change window.',
      source: 'Entra ID / Azure RBAC',
      timestamp: 'T-00:08',
      confidence: 100,
      tags: ['DEVOPS', 'CONTRIBUTOR', 'CHANGE-WINDOW'],
    },
  },
  {
    id: 'geo-personnel-003',
    layer: 'PERSONNEL',
    lat: 48.8566,
    lng: 2.3522,
    label: 'ANALYST — Paris',
    sublabel: 'Security analyst — read-only',
    classification: 'CONFIDENTIAL',
    threat: 'NOMINAL',
    detail: {
      summary:
        'SOC analyst reviewing threat telemetry. Reader role on Aegis SIEM workspace. Session started 14 min ago. No anomalies.',
      source: 'Entra ID / Aegis Access Log',
      timestamp: 'T-00:14',
      confidence: 100,
      tags: ['SOC', 'READER', 'NOMINAL'],
    },
  },
  {
    id: 'geo-weather-001',
    layer: 'WEATHER',
    lat: 38.9072,
    lng: -77.0369,
    label: 'WEATHER-DC — Thunderstorm risk',
    sublabel: 'AZ-1 availability concern',
    classification: 'OPEN',
    threat: 'LOW',
    detail: {
      summary:
        'Severe thunderstorm watch in DC metro. Azure US East AZ-1 colocation may experience power fluctuation. HA failover pre-warmed to AZ-2.',
      source: 'NOAA API / Azure Health',
      timestamp: 'T-00:30',
      confidence: 78,
      tags: ['WEATHER', 'AZ-RISK', 'PRE-WARMED'],
    },
  },
  {
    id: 'geo-weather-002',
    layer: 'WEATHER',
    lat: 35.6762,
    lng: 139.6503,
    label: 'WEATHER-Tokyo — Seismic alert',
    sublabel: 'APAC edge node monitoring',
    classification: 'OPEN',
    threat: 'LOW',
    detail: {
      summary:
        'M4.2 earthquake registered near Tokyo. Azure Japan East CDN edge operating normally. No infrastructure impact detected.',
      source: 'JMA / Azure Health Advisories',
      timestamp: 'T-01:15',
      confidence: 90,
      tags: ['SEISMIC', 'MONITORING', 'NO-IMPACT'],
    },
  },
];

export type DirectiveStatus = 'ACTIVE' | 'CASCADING' | 'SUSPENDED' | 'ARCHIVED';
export type DirectivePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Directive {
  id: string;
  title: string;
  body: string;
  priority: DirectivePriority;
  status: DirectiveStatus;
  classification: Classification;
  issuedBy: string;
  issuedAt: Date;
  cascadedTo: string[];
  tags: string[];
  cascadeCount: number;
}

export const INITIAL_DIRECTIVES: Directive[] = [
  {
    id: 'dir-001',
    title: 'ELEVATED PROTOCOL — Elevated WAF Posture',
    body: 'All API endpoints must operate under heightened WAF scrutiny. Rate limits reduced to 500 req/min. Security perimeter Centurions report anomalies immediately.',
    priority: 'CRITICAL',
    status: 'ACTIVE',
    classification: 'SOVEREIGN',
    issuedBy: 'Praetorianus — Security Center',
    issuedAt: new Date(Date.now() - 3600000 * 4),
    cascadedTo: ['GROUP — SECURITY', 'GROUP — COMPUTE', 'GROUP — DATA'],
    tags: ['WAF', 'SECURITY', 'PROTOCOL'],
    cascadeCount: 3,
  },
  {
    id: 'dir-002',
    title: 'REDIS WATCH — Memory Threshold Alert at 70%',
    body: 'Cache tier must page Centurion AI when Redis memory utilization exceeds 70%. Prepare Premium P1 upgrade request for senate review if threshold is breached.',
    priority: 'HIGH',
    status: 'ACTIVE',
    classification: 'CONFIDENTIAL',
    issuedBy: 'Centurion AI — Cache Monitor',
    issuedAt: new Date(Date.now() - 3600000 * 12),
    cascadedTo: ['GROUP — DATA'],
    tags: ['REDIS', 'CAPACITY', 'ALERT'],
    cascadeCount: 1,
  },
  {
    id: 'dir-003',
    title: 'COST CONTAINMENT — Q2 Spend Cap',
    body: 'Monthly cloud spend must not exceed $4,500 without senate approval. All scaling proposals require cost-impact analysis. AI Ops recommendations must include projected cost delta.',
    priority: 'MEDIUM',
    status: 'CASCADING',
    classification: 'RESTRICTED',
    issuedBy: 'Executive Console — CFO Directive',
    issuedAt: new Date(Date.now() - 3600000 * 72),
    cascadedTo: ['GROUP — COMPUTE', 'GROUP — FRONTEND'],
    tags: ['COST', 'Q2', 'GOVERNANCE'],
    cascadeCount: 2,
  },
  {
    id: 'dir-004',
    title: 'DR READINESS — Failover Drill Scheduled',
    body: 'Standby region (West US 2) must be warm-tested within 7 days. RTO target < 15 minutes. All Centurion agents must confirm readiness status.',
    priority: 'MEDIUM',
    status: 'SUSPENDED',
    classification: 'RESTRICTED',
    issuedBy: 'Legatus Console — CTO Office',
    issuedAt: new Date(Date.now() - 3600000 * 96),
    cascadedTo: [],
    tags: ['DR', 'FAILOVER', 'READINESS'],
    cascadeCount: 0,
  },
];

export type CoalitionStatus = 'ACTIVE' | 'OBSERVING' | 'SUSPENDED' | 'TERMINATED';

export interface CoalitionPartner {
  id: string;
  name: string;
  role: string;
  domain: string;
  trustScore: number;
  status: CoalitionStatus;
  classification: Classification;
  lastContact: Date;
  notes: string;
  alerts: number;
}

export const INITIAL_COALITION: CoalitionPartner[] = [
  {
    id: 'cp-001',
    name: 'Azure Security Center',
    role: 'Threat Intelligence Feed',
    domain: 'Security',
    trustScore: 98,
    status: 'ACTIVE',
    classification: 'SOVEREIGN',
    lastContact: new Date(Date.now() - 60000 * 5),
    notes: 'Primary threat feed. Feeds WAF and Praetorian. SLA: 99.99%.',
    alerts: 2,
  },
  {
    id: 'cp-002',
    name: 'Aegis SIEM',
    role: 'Security Information & Event Management',
    domain: 'Security',
    trustScore: 95,
    status: 'ACTIVE',
    classification: 'CONFIDENTIAL',
    lastContact: new Date(Date.now() - 60000 * 2),
    notes: 'SIEM ingesting WAF logs, App Insights, and PostgreSQL audit stream.',
    alerts: 0,
  },
  {
    id: 'cp-003',
    name: 'Firestorm — Risk Engine',
    role: 'Real-Time Risk Scoring',
    domain: 'Finance',
    trustScore: 87,
    status: 'ACTIVE',
    classification: 'CONFIDENTIAL',
    lastContact: new Date(Date.now() - 60000 * 30),
    notes: 'Cross-domain risk signals from Firestorm integrated via Service Bus.',
    alerts: 1,
  },
  {
    id: 'cp-004',
    name: 'Vessels — Maritime Intelligence',
    role: 'Operational Domain Signal',
    domain: 'Operations',
    trustScore: 82,
    status: 'OBSERVING',
    classification: 'RESTRICTED',
    lastContact: new Date(Date.now() - 3600000 * 2),
    notes: 'Fleet telemetry aggregated. Observing mode pending API upgrade.',
    alerts: 0,
  },
  {
    id: 'cp-005',
    name: 'PRISM Counsel',
    role: 'Legal & Compliance Advisory',
    domain: 'Legal',
    trustScore: 91,
    status: 'ACTIVE',
    classification: 'CONFIDENTIAL',
    lastContact: new Date(Date.now() - 3600000 * 1),
    notes: 'SOC-2 compliance reports and GDPR advisory integrated.',
    alerts: 0,
  },
  {
    id: 'cp-006',
    name: 'Entra ID — Identity Provider',
    role: 'Zero Trust Identity Fabric',
    domain: 'Security',
    trustScore: 99,
    status: 'ACTIVE',
    classification: 'SOVEREIGN',
    lastContact: new Date(Date.now() - 60000 * 1),
    notes: 'Conditional Access + MFA enforcement for all admin sessions.',
    alerts: 0,
  },
];

export type ReserveStatus = 'NOMINAL' | 'REDUCED' | 'CRITICAL' | 'DEPLETED';

export interface ReservePool {
  id: string;
  name: string;
  category: string;
  totalCapacity: number;
  currentLevel: number;
  unit: string;
  status: ReserveStatus;
  classification: Classification;
  lastDrawdown?: Date;
  notes: string;
}

export interface DrawdownRequest {
  id: string;
  poolId: string;
  amount: number;
  justification: string;
  requestedBy: string;
  requestedAt: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const INITIAL_RESERVES: ReservePool[] = [
  {
    id: 'res-compute',
    name: 'COMPUTE RESERVE',
    category: 'Infrastructure',
    totalCapacity: 20,
    currentLevel: 10,
    unit: 'replicas',
    status: 'NOMINAL',
    classification: 'RESTRICTED',
    lastDrawdown: new Date(Date.now() - 3600000 * 48),
    notes: 'Container App max-replica headroom. Current burst capacity available.',
  },
  {
    id: 'res-budget',
    name: 'CONTINGENCY BUDGET',
    category: 'Finance',
    totalCapacity: 10000,
    currentLevel: 7400,
    unit: 'USD/mo',
    status: 'NOMINAL',
    classification: 'CONFIDENTIAL',
    notes: 'Monthly cloud spend contingency above baseline $4,280 cap.',
  },
  {
    id: 'res-storage',
    name: 'STORAGE HEADROOM',
    category: 'Infrastructure',
    totalCapacity: 128,
    currentLevel: 83,
    unit: 'GB',
    status: 'NOMINAL',
    classification: 'CONFIDENTIAL',
    lastDrawdown: new Date(Date.now() - 3600000 * 24),
    notes: 'PostgreSQL storage pool. Auto-grow enabled.',
  },
  {
    id: 'res-redis',
    name: 'CACHE CAPACITY',
    category: 'Infrastructure',
    totalCapacity: 6,
    currentLevel: 2.28,
    unit: 'GB',
    status: 'REDUCED',
    classification: 'CONFIDENTIAL',
    notes: 'Redis C1 Standard headroom. 62% consumed. Upgrade to P1 queued.',
  },
  {
    id: 'res-waf',
    name: 'WAF RATE HEADROOM',
    category: 'Security',
    totalCapacity: 1000,
    currentLevel: 153,
    unit: 'req/min blocked',
    status: 'NOMINAL',
    classification: 'SOVEREIGN',
    lastDrawdown: new Date(Date.now() - 3600000 * 1),
    notes: 'WAF rate-limit buffer. Current blocks well within tolerance.',
  },
  {
    id: 'res-oncall',
    name: 'ON-CALL CAPACITY',
    category: 'Personnel',
    totalCapacity: 4,
    currentLevel: 3,
    unit: 'engineers',
    status: 'NOMINAL',
    classification: 'RESTRICTED',
    notes: 'On-call roster headroom. One engineer on approved leave.',
  },
];

export const INITIAL_DRAWDOWNS: DrawdownRequest[] = [
  {
    id: 'dd-001',
    poolId: 'res-compute',
    amount: 4,
    justification: 'Q2 load test required additional burst replicas for 48h window.',
    requestedBy: 'Centurion AI — Compute Monitor',
    requestedAt: new Date(Date.now() - 3600000 * 48),
    status: 'APPROVED',
  },
  {
    id: 'dd-002',
    poolId: 'res-budget',
    amount: 600,
    justification: 'Senate proposal: VNet-inject Service Bus (Premium SKU) pending approval.',
    requestedBy: 'Security Perimeter — Network Hardening',
    requestedAt: new Date(Date.now() - 3600000 * 6),
    status: 'PENDING',
  },
];

export const INTELLIGENCE_BRIEFS = {
  cost: {
    title: 'COST INTELLIGENCE',
    classification: 'RESTRICTED' as Classification,
    totalMonthly: 4280,
    trend: '+3.2%',
    topConsumers: [
      { resource: 'PostgreSQL Flexible Server', cost: 420, trend: '+0%' },
      { resource: 'Azure Front Door Premium', cost: 220, trend: '+0%' },
      { resource: 'Container App (×2 replicas)', cost: 560, trend: '+12%' },
      { resource: 'Redis Standard C1', cost: 55, trend: '+0%' },
      { resource: 'Document Intelligence', cost: 200, trend: '+8%' },
    ],
    optimization:
      'Container App scaling is the primary cost driver. Implementing recommended threshold adjustment could reduce monthly spend by $92.',
    forecast90Days: 4580,
  },
  capacity: {
    title: 'CAPACITY INTELLIGENCE',
    classification: 'RESTRICTED' as Classification,
    bottlenecks: [
      { resource: 'PostgreSQL Storage', current: 35, limit: 100, unit: 'GB', daysToCapacity: 240 },
      { resource: 'Redis Memory', current: 62, limit: 100, unit: '%', daysToCapacity: 120 },
      { resource: 'Container App CPU', current: 41, limit: 100, unit: '%', daysToCapacity: null },
      {
        resource: 'Service Bus Connections',
        current: 28,
        limit: 100,
        unit: '%',
        daysToCapacity: null,
      },
    ],
    projectedGrowth: '12% month-over-month based on 90-day trend analysis.',
  },
  threat: {
    title: 'THREAT INTELLIGENCE',
    classification: 'CONFIDENTIAL' as Classification,
    currentLevel: 'ELEVATED' as ThreatLevel,
    summary:
      'Elevated reconnaissance activity detected against /api/auth endpoints. WAF successfully blocked 847 malicious requests in last 24h. Bot Manager flagging 3.2% of traffic as automated.',
    indicators: [
      {
        type: 'Reconnaissance',
        severity: 'MEDIUM',
        description: 'SQL injection probes against /api/graphql (blocked by WAF DRS 2.1)',
        count: 234,
      },
      {
        type: 'Bot Traffic',
        severity: 'LOW',
        description: 'Automated crawlers hitting static assets — rate limited',
        count: 612,
      },
      {
        type: 'Auth Bruteforce',
        severity: 'LOW',
        description: 'Distributed login attempts from 12 IPs — WAF rate-limit engaged',
        count: 42,
      },
    ],
    wafStatus: 'ACTIVE — Prevention Mode',
    vnetIsolation: 'COMPLETE — All data services on private endpoints',
    lastAssessed: new Date(),
  },
  operational: {
    title: 'OPERATIONAL INTELLIGENCE',
    classification: 'RESTRICTED' as Classification,
    summary:
      'All 58 resources ACTIVE. Zero P1/P2 incidents in last 24 hours. API P95 latency at 142ms (SLA: 500ms). PostgreSQL HA active. 3 change proposals pending review.',
    uptime: '99.98%',
    incidentsToday: 0,
    p95Latency: 142,
    apiSlaCompliance: 100,
    pendingGovernance: 3,
  },
};
