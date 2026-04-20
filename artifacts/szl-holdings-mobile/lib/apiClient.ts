import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AUTH_TOKEN_KEY, recordSessionRevocation } from '@/context/AuthContext';

let _cachedToken: string | null = null;

const SESSION_REVOCATION_CODES = new Set(['SESSION_REVOKED', 'REFRESH_TOKEN_REPLAY']);

function pickRevocationCode(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const code = record['code'];
  if (typeof code === 'string' && SESSION_REVOCATION_CODES.has(code)) return code;
  return null;
}

function pickServerMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const error = record['error'];
  if (typeof error === 'string' && error.trim()) return error;
  const message = record['message'];
  if (typeof message === 'string' && message.trim()) return message;
  return null;
}

async function handleAuthRevocation(res: Response): Promise<boolean> {
  if (res.status !== 401) return false;
  let body: unknown = null;
  try {
    body = await res.clone().json();
  } catch {
    return false;
  }
  const code = pickRevocationCode(body);
  if (!code) return false;
  const message = pickServerMessage(body) ?? undefined;
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }
  _cachedToken = null;
  recordSessionRevocation({ code, message });
  return true;
}

const APP_MODE = (process.env.EXPO_PUBLIC_APP_MODE ?? 'sandbox').toLowerCase() as
  | 'demo'
  | 'sandbox'
  | 'production';
const SANDBOX_API_BASE = (process.env.EXPO_PUBLIC_SANDBOX_API_BASE ?? '').replace(/\/$/, '');

export function getApiBase(): string {
  if (APP_MODE === 'sandbox' && SANDBOX_API_BASE) return SANDBOX_API_BASE;
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : '';
}

const DEMO_WRITE_WHITELIST = ['/api/auth', '/api/oidc', '/api/admin/seed/reset-demo'];
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const DEMO_POST_FIXTURE_PATHS = ['/api/cross-domain-query', '/api/cortex/whatif'];

const MOBILE_DEMO_FIXTURES: Record<string, unknown> = {
  '/api/vessels': {
    vessels: [
      {
        id: 'V001',
        name: 'MSC Horizon',
        status: 'underway',
        flag: 'Panama',
        type: 'Container',
        lat: 25.77,
        lng: -80.19,
        speed: 14.2,
        heading: 320,
        eta: '2026-05-02T08:00:00Z',
      },
      {
        id: 'V002',
        name: 'Atlantic Guardian',
        status: 'anchored',
        flag: 'Liberia',
        type: 'Tanker',
        lat: 36.14,
        lng: -5.35,
        speed: 0,
        heading: 0,
        eta: '2026-04-30T14:00:00Z',
      },
      {
        id: 'V003',
        name: 'Nordic Star',
        status: 'docked',
        flag: 'Norway',
        type: 'Bulk Carrier',
        lat: 59.91,
        lng: 10.73,
        speed: 0,
        heading: 180,
        eta: null,
      },
    ],
    total: 3,
  },
  '/api/aegis/alerts': {
    alerts: [
      {
        id: 'A001',
        severity: 'high',
        title: 'Geo-fence breach',
        description: 'MSC Horizon entered exclusion zone',
        createdAt: '2026-04-18T06:30:00Z',
        resolved: false,
      },
      {
        id: 'A002',
        severity: 'medium',
        title: 'AIS signal lost',
        description: 'Nordic Star AIS transponder offline for 3h',
        createdAt: '2026-04-17T22:15:00Z',
        resolved: false,
      },
    ],
    total: 2,
  },
  '/api/notifications': {
    notifications: [
      {
        id: 'N001',
        type: 'alert',
        title: 'CORTEX demo mode active',
        read: false,
        createdAt: '2026-04-18T00:00:00Z',
      },
      {
        id: 'N002',
        type: 'info',
        title: 'Vessel ETA updated',
        read: true,
        createdAt: '2026-04-17T18:00:00Z',
      },
    ],
    unread: 1,
  },
  '/api/dashboard/metrics': {
    vessels: { total: 3, underway: 1, anchored: 1, docked: 1 },
    alerts: { total: 2, high: 1, medium: 1, low: 0 },
    period: 'last_24h',
  },
  '/api/healthz': { status: 'ok', mode: 'demo', timestamp: new Date().toISOString() },
  '/api/cortex/command-feed': {
    signals: [
      {
        id: 'S001',
        domain: 'intelligence',
        severity: 'high',
        title: 'Port of Rotterdam throughput down 18%',
        source: 'CORTEX',
        time: '2m ago',
      },
      {
        id: 'S002',
        domain: 'fleet',
        severity: 'medium',
        title: 'MSC Horizon ETA delay — weather routing',
        source: 'Vessels',
        time: '7m ago',
      },
      {
        id: 'S003',
        domain: 'defense',
        severity: 'high',
        title: 'Credential spray attempt — 3 accounts',
        source: 'Aegis SOC',
        time: '14m ago',
      },
      {
        id: 'S004',
        domain: 'properties',
        severity: 'low',
        title: 'NYC distressed portfolio — 2 new targets',
        source: 'Terra',
        time: '22m ago',
      },
      {
        id: 'S005',
        domain: 'portfolio',
        severity: 'info',
        title: 'Q1 2026 investor letter delivered',
        source: 'SZL Holdings',
        time: '1h ago',
      },
    ],
    summaries: [
      {
        domain: 'defense',
        label: 'Defense',
        icon: '🛡',
        accent: '#ef4444',
        activeCount: 3,
        criticalCount: 1,
        status: 'degraded',
        route: '/(shell)/defense',
      },
      {
        domain: 'fleet',
        label: 'Fleet',
        icon: '⚓',
        accent: '#0ea5e9',
        activeCount: 1,
        criticalCount: 0,
        status: 'operational',
        route: '/(shell)/fleet',
      },
      {
        domain: 'intelligence',
        label: 'CORTEX',
        icon: '◈',
        accent: '#8b7ac8',
        activeCount: 5,
        criticalCount: 2,
        status: 'operational',
        route: '/(shell)/intelligence',
      },
      {
        domain: 'properties',
        label: 'Properties',
        icon: '🏛',
        accent: '#c87941',
        activeCount: 2,
        criticalCount: 0,
        status: 'operational',
        route: '/(shell)/properties',
      },
      {
        domain: 'portfolio',
        label: 'Portfolio',
        icon: '◆',
        accent: '#c9a84c',
        activeCount: 0,
        criticalCount: 0,
        status: 'operational',
        route: '/(shell)/portfolio',
      },
    ],
  },
  '/api/cortex/intelligence-feed': {
    signals: [
      {
        id: 'I001',
        type: 'supply_chain',
        title: 'Port of Rotterdam — 18% throughput decline correlates with crude futures spike',
        summary:
          'Vessel dwell times at Rotterdam increased 22h on average. Three SZL-chartered vessels on affected routes. Estimated $340K exposure if delay exceeds 5 days.',
        severity: 'high',
        category: 'maritime_economics',
        confidence: 0.87,
        affectedDomains: ['vessels', 'szl'],
        affectedEntities: [
          { id: 'V001', name: 'MSC Horizon', domain: 'vessels', type: 'vessel' },
          { id: 'V002', name: 'Atlantic Guardian', domain: 'vessels', type: 'vessel' },
        ],
        recommendedActions: [
          'Activate climate routing bypass via Suez for V001',
          'Notify charter counterparties of potential force majeure',
          'Hedge crude exposure with 30-day forward contracts',
        ],
        timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
        status: 'active',
        hasActionDrafts: true,
      },
      {
        id: 'I002',
        type: 'cyber_threat',
        title: 'Credential spray campaign targeting executive accounts — 3 blocked attempts',
        summary:
          'Aegis SOC detected a coordinated credential spray from AS15169 (Google Cloud) originating in Romania. Three executive accounts targeted. All attempts blocked. MFA enforcement confirmed.',
        severity: 'high',
        category: 'cybersecurity',
        confidence: 0.94,
        affectedDomains: ['firestorm', 'szl'],
        recommendedActions: [
          'Force password rotation for targeted accounts',
          'Review access logs for the past 72h',
          'Escalate to Tier 2 SOC for attribution analysis',
        ],
        timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
        status: 'active',
        hasActionDrafts: false,
      },
      {
        id: 'I003',
        type: 'real_estate',
        title: 'NYC distressed portfolio — 2 new acquisition targets identified by Terra AI',
        summary:
          'Terra scanner identified two Midtown properties with 40%+ LTV distress indicators. Estimated acquisition opportunity: $12M combined. Loan maturity within 90 days.',
        severity: 'medium',
        category: 'real_estate_intelligence',
        confidence: 0.79,
        affectedDomains: ['terra', 'szl'],
        recommendedActions: [
          'Commission title search on 34 W 47th St and 210 E 86th St',
          'Request broker market comps',
        ],
        timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
        status: 'active',
        hasActionDrafts: false,
      },
    ],
    stats: { total: 3, active: 3, critical: 0, high: 2 },
  },
  '/api/cortex/action-drafts': {
    drafts: [
      {
        id: 'D001',
        alertId: 'I001',
        alertTitle: 'Port of Rotterdam — throughput decline',
        domain: 'vessels',
        type: 'notification',
        title: 'Notify charter counterparties of potential delay',
        content:
          'Dear Charter Operations Team,\n\nCORTEX has detected a significant throughput decline at Port of Rotterdam (18% below 30-day average). MSC Horizon and Atlantic Guardian are on affected routes. We are evaluating climate routing alternatives and will advise within 4 hours. Please review demurrage clauses on both charters.\n\nSZL Holdings — Maritime Operations',
        recipient: 'charter-ops@szlholdings.com',
        priority: 'high',
        status: 'pending',
        generatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
      },
    ],
    pendingCount: 1,
  },
  '/api/investor-analytics/metrics': {
    data: {
      summary: {
        mrr: 142000,
        arr: 1704000,
        mrrGrowth: 12.4,
        totalCustomers: 38,
        customerGrowth: 8.6,
        churnRate: 1.2,
        nrr: 118,
        ltvCacRatio: 4.8,
        cacPayback: 14,
        activeUsers30d: 284,
        activeUsers7d: 197,
      },
      timeSeries: [
        {
          month: 'Oct 2025',
          mrr: 98000,
          revenue: 98000,
          customers: 26,
          newCustomers: 4,
          churnRate: 1.8,
          canceledSubs: 0,
        },
        {
          month: 'Nov 2025',
          mrr: 107000,
          revenue: 107000,
          customers: 29,
          newCustomers: 4,
          churnRate: 1.5,
          canceledSubs: 1,
        },
        {
          month: 'Dec 2025',
          mrr: 114000,
          revenue: 114000,
          customers: 31,
          newCustomers: 3,
          churnRate: 1.4,
          canceledSubs: 1,
        },
        {
          month: 'Jan 2026',
          mrr: 121000,
          revenue: 121000,
          customers: 33,
          newCustomers: 3,
          churnRate: 1.3,
          canceledSubs: 1,
        },
        {
          month: 'Feb 2026',
          mrr: 130000,
          revenue: 130000,
          customers: 35,
          newCustomers: 3,
          churnRate: 1.2,
          canceledSubs: 1,
        },
        {
          month: 'Mar 2026',
          mrr: 142000,
          revenue: 142000,
          customers: 38,
          newCustomers: 4,
          churnRate: 1.2,
          canceledSubs: 1,
        },
      ],
      activeSubscriptions: 38,
      planDistribution: [
        { plan: 'Enterprise', count: 8 },
        { plan: 'Professional', count: 18 },
        { plan: 'Growth', count: 12 },
      ],
    },
  },
  '/api/cortex/whatif': {
    scenarioId: 'WI001',
    query: 'What if Port of Rotterdam closes?',
    summary:
      'A Rotterdam closure would trigger a 3–7 day rerouting cascade across all SZL-chartered vessels. Estimated additional cost: $420K–$680K depending on duration. Suez and English Channel alternatives are viable but add 2–3 days to ETAs.',
    affectedDomains: ['vessels', 'szl', 'terra'],
    overallRisk: 'high',
    confidence: 0.83,
    timeHorizon: '7–14 days',
    cascades: [
      {
        domain: 'vessels',
        impact: 'critical',
        description:
          'All three chartered vessels must reroute via Suez. MSC Horizon faces 3-day delay. Atlantic Guardian demurrage triggers at 48h.',
        estimatedExposure: '$420K–$680K',
        affectedEntities: ['MSC Horizon', 'Atlantic Guardian'],
        mitigationOptions: [
          'Activate climate routing via Suez',
          'Notify charter counterparties',
          'Evaluate force majeure clauses',
        ],
      },
      {
        domain: 'szl',
        impact: 'high',
        description:
          'Portfolio cash flow delayed. Quarterly revenue recognition affected if delay exceeds billing cycle.',
        estimatedExposure: '$120K deferred',
        affectedEntities: ['SZL Holdings Q2 Revenue'],
        mitigationOptions: ['Invoke supply chain insurance', 'Adjust Q2 guidance proactively'],
      },
      {
        domain: 'terra',
        impact: 'low',
        description:
          'NYC deal closings unaffected. No direct maritime exposure in current property pipeline.',
        estimatedExposure: 'Negligible',
        affectedEntities: [],
        mitigationOptions: ['Monitor macroeconomic secondary effects'],
      },
    ],
  },
  '/api/lyte/cognitive/interventions': {
    count: 5,
    totalSignalsEvaluated: 47,
    totalVaR: 2840000,
    evaluatedAt: new Date().toISOString(),
    interventions: [
      {
        id: 'INT001',
        domain: 'vessels',
        title: 'Reroute MSC Horizon via Suez before Rotterdam dwell breaches charter SLA',
        summary:
          'Port of Rotterdam dwell time is up 22h on a 3-day trend. MSC Horizon is 36h from arrival; rerouting via Suez avoids a projected 5-day delay and force-majeure exposure on the charter.',
        urgency: 'critical',
        confidence: 0.91,
        valueAtRisk: 680000,
        sourceSignalCount: 6,
        evidence: [
          { label: 'Rotterdam throughput', value: '-18% vs 30d avg', source: 'Vessels' },
          { label: 'Charter demurrage trigger', value: '48h', source: 'Counsel' },
          { label: 'Crude futures', value: '+4.2%', source: 'Lyte' },
        ],
        plannerAssessment: {
          riskLevel: 'high',
          requiredApproval: true,
          approvalReason: 'Reroute changes counterparty obligations',
        },
      },
      {
        id: 'INT002',
        domain: 'aegis',
        title: 'Force credential rotation for 3 executive accounts targeted by spray campaign',
        summary:
          'Aegis SOC blocked a credential spray from a Romanian Google Cloud ASN against three exec accounts. MFA held, but reuse risk on related SaaS tenants warrants immediate rotation.',
        urgency: 'urgent',
        confidence: 0.94,
        valueAtRisk: 540000,
        sourceSignalCount: 9,
        evidence: [
          { label: 'Blocked attempts', value: '112 in 14 min', source: 'Aegis' },
          { label: 'Targeted accounts', value: '3 exec, 1 finance', source: 'Aegis' },
          { label: 'Source ASN', value: 'AS15169 / RO', source: 'Aegis' },
        ],
        plannerAssessment: { riskLevel: 'medium', requiredApproval: false, approvalReason: null },
      },
      {
        id: 'INT003',
        domain: 'terra',
        title: 'Open diligence on 34 W 47th St — 90-day loan maturity, 42% LTV distress',
        summary:
          'Terra surfaced a Midtown asset with a hard 90-day maturity and 42% LTV distress. Comparable trades suggest a $7.2M acquisition window before the lender forces sale.',
        urgency: 'moderate',
        confidence: 0.78,
        valueAtRisk: 720000,
        sourceSignalCount: 4,
        evidence: [
          { label: 'LTV distress', value: '42%', source: 'Terra' },
          { label: 'Maturity window', value: '87 days', source: 'Terra' },
          { label: 'Comp basis', value: '$1,180/sf', source: 'Terra' },
        ],
        plannerAssessment: {
          riskLevel: 'medium',
          requiredApproval: true,
          approvalReason: 'Capital allocation > $5M threshold',
        },
      },
      {
        id: 'INT004',
        domain: 'lyte',
        title: 'Hedge crude exposure with 30-day forward — covers maritime delay scenario',
        summary:
          'Lyte models a 0.62 correlation between Rotterdam dwell and crude futures. A $2.1M 30-day forward closes the hedging gap surfaced by the cross-domain risk fusion.',
        urgency: 'moderate',
        confidence: 0.82,
        valueAtRisk: 480000,
        sourceSignalCount: 5,
        evidence: [
          { label: 'Hedge gap', value: '$2.1M unhedged', source: 'Lyte' },
          { label: 'Correlation', value: '0.62 dwell↔crude', source: 'Lyte' },
        ],
        plannerAssessment: { riskLevel: 'low', requiredApproval: false, approvalReason: null },
      },
      {
        id: 'INT005',
        domain: 'prism',
        title: 'Pre-draft force majeure notice for Atlantic Guardian charter counterparty',
        summary:
          'PRISM detected charter language permitting force majeure notification at 48h dwell. Pre-drafting the notice preserves optionality without committing — saves 6h if invoked.',
        urgency: 'low',
        confidence: 0.88,
        valueAtRisk: 420000,
        sourceSignalCount: 3,
        evidence: [
          { label: 'Clause', value: '§14.3 Force Majeure', source: 'PRISM' },
          { label: 'Trigger window', value: '48h dwell', source: 'PRISM' },
        ],
        plannerAssessment: { riskLevel: 'low', requiredApproval: false, approvalReason: null },
      },
    ],
  },
  '/api/lyte/cognitive/value-at-risk': {
    periodDays: 30,
    totalVaR: 2840000,
    actionVaR: 1620000,
    signalVaR: 1220000,
    criticalExposure: 680000,
    highExposure: 1260000,
    fetchedAt: new Date().toISOString(),
    byDomain: {
      vessels: { var: 980000, count: 4, items: 12 },
      terra: { var: 720000, count: 3, items: 7 },
      aegis: { var: 540000, count: 5, items: 9 },
      lyte: { var: 320000, count: 2, items: 6 },
      prism: { var: 180000, count: 2, items: 4 },
      szl: { var: 100000, count: 1, items: 3 },
    },
  },
  '/api/cross-domain-query': {
    success: true,
    result: {
      query: 'Brief me on compound risks this week',
      fusedAnswer:
        'Three compound risk vectors are active this week. Maritime throughput pressure at Rotterdam is correlated with crude futures exposure in the SZL portfolio. Simultaneously, Aegis SOC is tracking a credential spray campaign that targeted executive accounts — all blocked, but attribution is ongoing. Terra has flagged two NYC acquisition opportunities with 90-day loan maturity windows. Combined P&L exposure: ~$340K downside on maritime delays; ~$12M upside on real estate if executed within the window.',
      overallRisk: 'high',
      confidence: 0.86,
      domainResults: [
        {
          domain: 'vessels',
          domainLabel: 'Fleet (Vessels)',
          relevanceScore: 0.91,
          insight:
            'Port congestion affecting two chartered vessels. Delay exposure $340K if >5 days.',
          signals: [
            {
              title: 'Rotterdam throughput -18%',
              summary: 'Dwell time +22h average across all vessel classes.',
              severity: 'high',
              timestamp: Date.now() - 8 * 60000,
            },
          ],
        },
        {
          domain: 'firestorm',
          domainLabel: 'Defense (Aegis)',
          relevanceScore: 0.88,
          insight:
            'Credential spray blocked. Attribution analysis in progress. No breach confirmed.',
          signals: [
            {
              title: 'Credential spray — 3 accounts',
              summary:
                'Originating from Romanian IP via Google Cloud ASN. MFA blocked all attempts.',
              severity: 'high',
              timestamp: Date.now() - 14 * 60000,
            },
          ],
        },
        {
          domain: 'terra',
          domainLabel: 'Properties (Terra)',
          relevanceScore: 0.74,
          insight:
            'Two NYC distressed targets surfaced. Combined opportunity $12M. 90-day maturity window.',
          signals: [
            {
              title: '2 new acquisition targets',
              summary: 'Midtown properties with 40%+ LTV distress indicators.',
              severity: 'medium',
              timestamp: Date.now() - 22 * 60000,
            },
          ],
        },
      ],
      correlations: [
        {
          title: 'Maritime delay → Crude futures → Portfolio hedging gap',
          domains: ['vessels', 'szl'],
          description:
            'Port congestion correlates with a 4.2% spike in crude futures. Current portfolio has insufficient hedging to cover 10-day delay scenario.',
          confidence: 0.82,
        },
      ],
      timeHorizon: '7 days',
      affectedDomains: ['vessels', 'firestorm', 'terra', 'szl'],
    },
  },
};

function getDemoFixture(path: string): unknown | null {
  const key = Object.keys(MOBILE_DEMO_FIXTURES).find(
    (k) => path === k || path.startsWith(k + '/') || path.startsWith(k + '?'),
  );
  return key ? MOBILE_DEMO_FIXTURES[key] : null;
}

export function getCachedAuthToken(): string | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return _cachedToken;
}

export async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    const t = typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_TOKEN_KEY) : null;
    _cachedToken = t;
    return t;
  }
  const t = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  _cachedToken = t;
  return t;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = ((init?.method ?? 'GET') as string).toUpperCase();
  const isApiPath = path.startsWith('/api/');

  if (APP_MODE === 'demo' && isApiPath) {
    if (method === 'GET') {
      const fixture = getDemoFixture(path);
      if (fixture !== null) return fixture as T;
      return {
        demo: true,
        data: [],
        items: [],
        total: 0,
        message: 'No demo data configured for this endpoint.',
      } as unknown as T;
    }
    if (method === 'POST' && DEMO_POST_FIXTURE_PATHS.some((p) => path.startsWith(p))) {
      const fixture = getDemoFixture(path);
      if (fixture !== null) return fixture as T;
    }
    if (MUTATING_METHODS.has(method) && !DEMO_WRITE_WHITELIST.some((p) => path.startsWith(p))) {
      return {
        ok: true,
        demo: true,
        message: 'This is a demo environment. No data was written.',
      } as unknown as T;
    }
  }

  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${getApiBase()}${path}`, { ...init, headers });
  if (!res.ok) {
    await handleAuthRevocation(res);
    throw new Error(`API error ${res.status}: ${path}`);
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export async function apiFetchRaw(path: string, init?: RequestInit): Promise<Response> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${getApiBase()}${path}`, { ...init, headers });
  if (!res.ok) {
    await handleAuthRevocation(res);
  }
  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' });
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'DELETE' });
}

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const result = await apiFetch<{ data?: T; errors?: unknown[] }>('/api/graphql', {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
  });
  if (result.errors?.length) {
    throw new Error(`GraphQL error: ${JSON.stringify(result.errors[0])}`);
  }
  return result.data as T;
}
