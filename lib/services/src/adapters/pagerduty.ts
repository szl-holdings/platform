import { ServiceAdapter } from '../base.js';

export interface PagerDutyService {
  id: string;
  name: string;
  status: 'active' | 'warning' | 'critical' | 'maintenance' | 'disabled';
  escalationPolicyId: string;
  escalationPolicyName: string;
  acknowledgementTimeout: number | null;
  autoResolveTimeout: number | null;
  description: string | null;
}

export interface PagerDutyIncident {
  id: string;
  incidentNumber: number;
  title: string;
  status: 'triggered' | 'acknowledged' | 'resolved';
  urgency: 'high' | 'low';
  priority: string | null;
  service: { id: string; name: string };
  assignedTo: Array<{ id: string; name: string; email: string }>;
  escalationPolicy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  description: string;
  body: string | null;
  alertCount: number;
  selfUrl: string;
  htmlUrl: string;
}

export interface PagerDutyEscalationPolicy {
  id: string;
  name: string;
  description: string | null;
  numLoops: number;
  rules: Array<{
    escalationDelayInMinutes: number;
    targets: Array<{ id: string; type: string; name: string }>;
  }>;
}

export interface PagerDutyOnCallEntry {
  escalationPolicyId: string;
  escalationPolicyName: string;
  escalationLevel: number;
  user: { id: string; name: string; email: string };
  schedule: { id: string; name: string } | null;
  start: string | null;
  end: string | null;
}

export interface PagerDutyWebhookEvent {
  id: string;
  eventType:
    | 'incident.triggered'
    | 'incident.acknowledged'
    | 'incident.resolved'
    | 'incident.escalated'
    | string;
  incident: PagerDutyIncident;
  logEntries: Array<{ id: string; type: string; createdAt: string; summary: string }>;
  createdOn: string;
  accountId: string;
}

export interface PagerDutyConnectionStatus {
  connected: boolean;
  accountName?: string | undefined;
  accountId?: string | undefined;
  userId?: string | undefined;
  userEmail?: string | undefined;
}

const _MOCK_SERVICES: PagerDutyService[] = [
  {
    id: 'P1SVC01',
    name: 'Lyte Command Center — Production',
    status: 'active',
    escalationPolicyId: 'P1ESC01',
    escalationPolicyName: 'SRE On-Call',
    acknowledgementTimeout: 1800,
    autoResolveTimeout: 14400,
    description: 'Production services for the Lyte AIOps platform',
  },
  {
    id: 'P1SVC02',
    name: 'Vessels Maritime — AIS Pipeline',
    status: 'warning',
    escalationPolicyId: 'P1ESC02',
    escalationPolicyName: 'Maritime Operations',
    acknowledgementTimeout: 600,
    autoResolveTimeout: 7200,
    description: 'AIS vessel tracking ingestion pipeline',
  },
  {
    id: 'P1SVC03',
    name: 'Aegis SOC — Sentinel Alerts',
    status: 'active',
    escalationPolicyId: 'P1ESC03',
    escalationPolicyName: 'Security Operations',
    acknowledgementTimeout: 300,
    autoResolveTimeout: null,
    description: 'Security operations center — Sentinel agent alerts',
  },
];

const MOCK_INCIDENTS: PagerDutyIncident[] = [
  {
    id: 'Q1INC001',
    incidentNumber: 4821,
    title: 'API p99 latency > 800ms — Lyte production',
    status: 'acknowledged',
    urgency: 'high',
    priority: 'P1',
    service: { id: 'P1SVC01', name: 'Lyte Command Center — Production' },
    assignedTo: [{ id: 'U1USR01', name: 'Dan Jones', email: 'dan.jones@szl.example.com' }],
    escalationPolicy: { id: 'P1ESC01', name: 'SRE On-Call' },
    createdAt: '2026-03-30T06:00:00Z',
    updatedAt: '2026-03-30T06:45:00Z',
    acknowledgedAt: '2026-03-30T06:12:00Z',
    resolvedAt: null,
    description: 'API p99 latency exceeds SLA threshold of 800ms for > 5 minutes',
    body: 'Alert fired from Prometheus: api_request_duration_p99 > 0.8 for 5m',
    alertCount: 3,
    selfUrl: 'https://api.pagerduty.example.com/incidents/Q1INC001',
    htmlUrl: 'https://szl.pagerduty.example.com/incidents/Q1INC001',
  },
  {
    id: 'Q1INC002',
    incidentNumber: 4820,
    title: 'AIS feed stale — vessel ETA accuracy degraded',
    status: 'triggered',
    urgency: 'high',
    priority: 'P2',
    service: { id: 'P1SVC02', name: 'Vessels Maritime — AIS Pipeline' },
    assignedTo: [{ id: 'U1USR02', name: 'Bob Martinez', email: 'bob.martinez@szl.example.com' }],
    escalationPolicy: { id: 'P1ESC02', name: 'Maritime Operations' },
    createdAt: '2026-03-30T05:30:00Z',
    updatedAt: '2026-03-30T05:30:00Z',
    acknowledgedAt: null,
    resolvedAt: null,
    description: 'AIS feed age > 30 minutes — vessel positions may be stale',
    body: null,
    alertCount: 1,
    selfUrl: 'https://api.pagerduty.example.com/incidents/Q1INC002',
    htmlUrl: 'https://szl.pagerduty.example.com/incidents/Q1INC002',
  },
  {
    id: 'Q1INC003',
    incidentNumber: 4815,
    title: 'CVE-2024-3400 detection — PAN-OS endpoint',
    status: 'resolved',
    urgency: 'high',
    priority: 'P1',
    service: { id: 'P1SVC03', name: 'Aegis SOC — Sentinel Alerts' },
    assignedTo: [{ id: 'U1USR03', name: 'Alice Chen', email: 'alice.chen@szl.example.com' }],
    escalationPolicy: { id: 'P1ESC03', name: 'Security Operations' },
    createdAt: '2026-03-28T14:00:00Z',
    updatedAt: '2026-03-28T19:30:00Z',
    acknowledgedAt: '2026-03-28T14:08:00Z',
    resolvedAt: '2026-03-28T19:30:00Z',
    description:
      'Sentinel detected exploitation attempt against CVE-2024-3400 (PAN-OS GlobalProtect)',
    body: null,
    alertCount: 7,
    selfUrl: 'https://api.pagerduty.example.com/incidents/Q1INC003',
    htmlUrl: 'https://szl.pagerduty.example.com/incidents/Q1INC003',
  },
];

const MOCK_ESCALATION_POLICIES: PagerDutyEscalationPolicy[] = [
  {
    id: 'P1ESC01',
    name: 'SRE On-Call',
    description: 'Primary SRE escalation for platform infrastructure',
    numLoops: 2,
    rules: [
      {
        escalationDelayInMinutes: 15,
        targets: [{ id: 'U1USR01', type: 'user', name: 'Dan Jones' }],
      },
      {
        escalationDelayInMinutes: 30,
        targets: [{ id: 'S1SCH01', type: 'schedule', name: 'SRE Weekly Rotation' }],
      },
    ],
  },
  {
    id: 'P1ESC02',
    name: 'Maritime Operations',
    description: 'Fleet monitoring and AIS pipeline team',
    numLoops: 1,
    rules: [
      {
        escalationDelayInMinutes: 10,
        targets: [{ id: 'U1USR02', type: 'user', name: 'Bob Martinez' }],
      },
    ],
  },
  {
    id: 'P1ESC03',
    name: 'Security Operations',
    description: 'SOC and Sentinel alert response team',
    numLoops: 3,
    rules: [
      {
        escalationDelayInMinutes: 5,
        targets: [{ id: 'U1USR03', type: 'user', name: 'Alice Chen' }],
      },
      {
        escalationDelayInMinutes: 15,
        targets: [{ id: 'S1SCH02', type: 'schedule', name: 'SOC On-Call' }],
      },
    ],
  },
];

const MOCK_ON_CALLS: PagerDutyOnCallEntry[] = [
  {
    escalationPolicyId: 'P1ESC01',
    escalationPolicyName: 'SRE On-Call',
    escalationLevel: 1,
    user: { id: 'U1USR01', name: 'Dan Jones', email: 'dan.jones@szl.example.com' },
    schedule: { id: 'S1SCH01', name: 'SRE Weekly Rotation' },
    start: '2026-03-28T08:00:00Z',
    end: '2026-04-04T08:00:00Z',
  },
  {
    escalationPolicyId: 'P1ESC03',
    escalationPolicyName: 'Security Operations',
    escalationLevel: 1,
    user: { id: 'U1USR03', name: 'Alice Chen', email: 'alice.chen@szl.example.com' },
    schedule: { id: 'S1SCH02', name: 'SOC On-Call' },
    start: '2026-03-30T00:00:00Z',
    end: '2026-04-01T00:00:00Z',
  },
];

export class PagerDutyAdapter extends ServiceAdapter {
  readonly name = 'pagerduty';
  readonly description =
    'PagerDuty — incident management, on-call scheduling, and escalation policies';
  readonly requiredEnvVars = ['PAGERDUTY_API_TOKEN'];

  private get apiToken(): string | undefined {
    return process.env.PAGERDUTY_API_TOKEN;
  }

  private get webhookSecret(): string | undefined {
    return process.env.PAGERDUTY_WEBHOOK_SECRET;
  }

  private async pdRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`https://api.pagerduty.com${path}`, {
      ...options,
      headers: {
        Authorization: `Token token=${this.apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.pagerduty+json;version=2',
        ...options?.headers,
      },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`PagerDuty API error: ${response.status} ${response.statusText} — ${body}`);
    }
    return response.json() as Promise<T>;
  }

  protected override async performHealthCheck(): Promise<void> {
    const status = await this.testConnection();
    if (!status.connected) throw new Error('PagerDuty connection verification failed');
  }

  async testConnection(): Promise<PagerDutyConnectionStatus> {
    if (!this.isLive) return { connected: false };
    try {
      const data = await this.pdRequest<{
        user: { id: string; name: string; email: string; account?: { id: string; name: string } };
      }>('/users/me');
      return {
        connected: true,
        userId: data.user.id,
        userEmail: data.user.email,
        accountName: data.user.account?.name,
        accountId: data.user.account?.id,
      };
    } catch {
      return { connected: false };
    }
  }

  async listIncidents(params?: {
    status?: Array<'triggered' | 'acknowledged' | 'resolved'>;
    urgency?: 'high' | 'low';
    limit?: number;
  }): Promise<PagerDutyIncident[]> {
    if (!this.isLive) {
      let incidents = [...MOCK_INCIDENTS];
      if (params?.status) {
        incidents = incidents.filter((i) => params.status?.includes(i.status));
      }
      if (params?.urgency) {
        incidents = incidents.filter((i) => i.urgency === params.urgency);
      }
      return incidents.slice(0, params?.limit ?? 25);
    }

    const query = new URLSearchParams({
      limit: String(params?.limit ?? 25),
      sort_by: 'created_at:desc',
    });
    if (params?.status?.length) {
      params.status.forEach((s) => query.append('statuses[]', s));
    }
    if (params?.urgency) {
      query.append('urgencies[]', params.urgency);
    }

    const data = await this.pdRequest<{
      incidents: Array<{
        id: string;
        incident_number: number;
        title: string;
        status: string;
        urgency: string;
        priority?: { name: string };
        service: { id: string; name: string };
        assignments?: Array<{ assignee: { id: string; summary: string; email?: string } }>;
        escalation_policy: { id: string; name: string };
        created_at: string;
        updated_at: string;
        acknowledged_at?: string;
        resolved_at?: string;
        description?: string;
        body?: { details?: string };
        alert_counts?: { all: number };
        self: string;
        html_url: string;
      }>;
    }>(`/incidents?${query.toString()}`);

    return data.incidents.map((i) => ({
      id: i.id,
      incidentNumber: i.incident_number,
      title: i.title,
      status: i.status as PagerDutyIncident['status'],
      urgency: i.urgency as PagerDutyIncident['urgency'],
      priority: i.priority?.name ?? null,
      service: { id: i.service.id, name: i.service.name },
      assignedTo: (i.assignments ?? []).map((a) => ({
        id: a.assignee.id,
        name: a.assignee.summary,
        email: a.assignee.email ?? '',
      })),
      escalationPolicy: { id: i.escalation_policy.id, name: i.escalation_policy.name },
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      acknowledgedAt: i.acknowledged_at ?? null,
      resolvedAt: i.resolved_at ?? null,
      description: i.description ?? i.title,
      body: i.body?.details ?? null,
      alertCount: i.alert_counts?.all ?? 0,
      selfUrl: i.self,
      htmlUrl: i.html_url,
    }));
  }

  private static mapApiIncident(
    i: {
      id: string;
      incident_number: number;
      title: string;
      status: string;
      urgency: string;
      priority?: { name: string };
      service: { id: string; name?: string };
      assignments?: Array<{ assignee: { id: string; summary: string; email?: string } }>;
      escalation_policy?: { id: string; name?: string };
      created_at: string;
      updated_at: string;
      acknowledged_at?: string;
      resolved_at?: string;
      description?: string;
      body?: { details?: string };
      alert_counts?: { all: number };
      self?: string;
      html_url?: string;
    },
    bodyOverride?: string,
  ): PagerDutyIncident {
    return {
      id: i.id,
      incidentNumber: i.incident_number,
      title: i.title,
      status: i.status as PagerDutyIncident['status'],
      urgency: i.urgency as PagerDutyIncident['urgency'],
      priority: i.priority?.name ?? null,
      service: { id: i.service.id, name: i.service.name ?? '' },
      assignedTo: (i.assignments ?? []).map((a) => ({
        id: a.assignee.id,
        name: a.assignee.summary,
        email: a.assignee.email ?? '',
      })),
      escalationPolicy: {
        id: i.escalation_policy?.id ?? '',
        name: i.escalation_policy?.name ?? '',
      },
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      acknowledgedAt: i.acknowledged_at ?? null,
      resolvedAt: i.resolved_at ?? null,
      description: i.description ?? i.title,
      body: bodyOverride ?? i.body?.details ?? null,
      alertCount: i.alert_counts?.all ?? 0,
      selfUrl: i.self ?? '',
      htmlUrl: i.html_url ?? '',
    };
  }

  async createIncident(params: {
    title: string;
    serviceId: string;
    fromEmail: string;
    urgency?: 'high' | 'low';
    escalationPolicyId?: string;
    body?: string;
    priority?: string;
  }): Promise<PagerDutyIncident> {
    if (!this.isLive) {
      const mockId = `QMOCK${Date.now()}`;
      return {
        id: mockId,
        incidentNumber: Math.floor(Math.random() * 9000) + 1000,
        title: params.title,
        status: 'triggered',
        urgency: params.urgency ?? 'high',
        priority: params.priority ?? null,
        service: { id: params.serviceId, name: 'Mock Service' },
        assignedTo: [],
        escalationPolicy: { id: params.escalationPolicyId ?? 'PESC_MOCK', name: 'Default' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        acknowledgedAt: null,
        resolvedAt: null,
        description: params.title,
        body: params.body ?? null,
        alertCount: 0,
        selfUrl: `https://api.pagerduty.example.com/incidents/${mockId}`,
        htmlUrl: `https://szl.pagerduty.example.com/incidents/${mockId}`,
      };
    }

    const payload: Record<string, unknown> = {
      incident: {
        type: 'incident',
        title: params.title,
        service: { id: params.serviceId, type: 'service_reference' },
        urgency: params.urgency ?? 'high',
        ...(params.escalationPolicyId
          ? {
              escalation_policy: {
                id: params.escalationPolicyId,
                type: 'escalation_policy_reference',
              },
            }
          : {}),
        ...(params.body ? { body: { type: 'incident_body', details: params.body } } : {}),
      },
    };

    const data = await this.pdRequest<{
      incident: {
        id: string;
        incident_number: number;
        title: string;
        status: string;
        urgency: string;
        priority?: { name: string };
        service: { id: string; name?: string };
        escalation_policy?: { id: string; name?: string };
        created_at: string;
        updated_at: string;
        self?: string;
        html_url?: string;
      };
    }>('/incidents', {
      method: 'POST',
      headers: { From: params.fromEmail },
      body: JSON.stringify(payload),
    });

    return PagerDutyAdapter.mapApiIncident(data.incident, params.body);
  }

  async acknowledgeIncident(incidentId: string, userEmail: string): Promise<void> {
    if (!this.isLive) return;
    await this.pdRequest(`/incidents/${incidentId}`, {
      method: 'PUT',
      headers: { From: userEmail },
      body: JSON.stringify({
        incident: { type: 'incident', status: 'acknowledged' },
      }),
    });
  }

  async resolveIncident(incidentId: string, userEmail: string): Promise<void> {
    if (!this.isLive) return;
    await this.pdRequest(`/incidents/${incidentId}`, {
      method: 'PUT',
      headers: { From: userEmail },
      body: JSON.stringify({
        incident: { type: 'incident', status: 'resolved' },
      }),
    });
  }

  async listEscalationPolicies(): Promise<PagerDutyEscalationPolicy[]> {
    if (!this.isLive) return [...MOCK_ESCALATION_POLICIES];
    const data = await this.pdRequest<{
      escalation_policies: Array<{
        id: string;
        name: string;
        description?: string;
        num_loops: number;
        escalation_rules: Array<{
          escalation_delay_in_minutes: number;
          targets: Array<{ id: string; type: string; summary: string }>;
        }>;
      }>;
    }>('/escalation_policies?limit=25');

    return data.escalation_policies.map((ep) => ({
      id: ep.id,
      name: ep.name,
      description: ep.description ?? null,
      numLoops: ep.num_loops,
      rules: ep.escalation_rules.map((r) => ({
        escalationDelayInMinutes: r.escalation_delay_in_minutes,
        targets: r.targets.map((t) => ({ id: t.id, type: t.type, name: t.summary })),
      })),
    }));
  }

  async getOnCallSchedule(escalationPolicyId?: string): Promise<PagerDutyOnCallEntry[]> {
    if (!this.isLive) {
      if (escalationPolicyId) {
        return MOCK_ON_CALLS.filter((oc) => oc.escalationPolicyId === escalationPolicyId);
      }
      return [...MOCK_ON_CALLS];
    }

    const query = new URLSearchParams({ limit: '25' });
    if (escalationPolicyId) {
      query.append('escalation_policy_ids[]', escalationPolicyId);
    }

    const data = await this.pdRequest<{
      oncalls: Array<{
        escalation_policy: { id: string; name: string };
        escalation_level: number;
        user: { id: string; name: string; email: string };
        schedule?: { id: string; name: string };
        start?: string;
        end?: string;
      }>;
    }>(`/oncalls?${query.toString()}`);

    return data.oncalls.map((oc) => ({
      escalationPolicyId: oc.escalation_policy.id,
      escalationPolicyName: oc.escalation_policy.name,
      escalationLevel: oc.escalation_level,
      user: { id: oc.user.id, name: oc.user.name, email: oc.user.email },
      schedule: oc.schedule ? { id: oc.schedule.id, name: oc.schedule.name } : null,
      start: oc.start ?? null,
      end: oc.end ?? null,
    }));
  }

  async handleWebhookEvent(
    payload: Record<string, unknown>,
    rawBody: string,
    signature?: string,
  ): Promise<PagerDutyWebhookEvent | null> {
    if (this.webhookSecret) {
      if (!signature) {
        throw new Error(
          'PagerDuty webhook signature required: X-PagerDuty-Signature header missing',
        );
      }
      const { verifyWebhookSignature } = await import('../integrations/webhook-verifier.js');
      const result = verifyWebhookSignature({
        algorithm: 'hmac-sha256',
        secret: this.webhookSecret,
        signature,
        body: rawBody,
      });
      if (!result.valid) {
        throw new Error(`PagerDuty webhook signature invalid: ${result.reason}`);
      }
    }

    const messages = payload.messages as Array<Record<string, unknown>> | undefined;
    if (!messages || !Array.isArray(messages) || messages.length === 0) return null;

    const msg = messages[0]!;
    const eventType = (msg.event as string | undefined) ?? 'unknown';
    const incident = msg.incident as Record<string, unknown> | undefined;

    if (!incident) return null;

    const serviceObj = incident.service as { id?: string; name?: string } | undefined;
    return {
      id: `pd_wh_${Date.now()}`,
      eventType: eventType as PagerDutyWebhookEvent['eventType'],
      incident: {
        id: (incident.id as string | undefined) ?? '',
        incidentNumber: (incident.incident_number as number | undefined) ?? 0,
        title: (incident.title as string | undefined) ?? '',
        status: ((incident.status as string | undefined) ??
          'triggered') as PagerDutyIncident['status'],
        urgency: ((incident.urgency as string | undefined) ??
          'high') as PagerDutyIncident['urgency'],
        priority: null,
        service: { id: serviceObj?.id ?? '', name: serviceObj?.name ?? '' },
        assignedTo: [],
        escalationPolicy: { id: '', name: '' },
        createdAt: (incident.created_at as string | undefined) ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        acknowledgedAt: null,
        resolvedAt: null,
        description: (incident.title as string | undefined) ?? '',
        body: null,
        alertCount: 0,
        selfUrl: (incident.self as string | undefined) ?? '',
        htmlUrl: (incident.html_url as string | undefined) ?? '',
      },
      logEntries: [],
      createdOn: new Date().toISOString(),
      accountId: '',
    };
  }

  async getActiveIncidentSummary(): Promise<{
    total: number;
    triggered: number;
    acknowledged: number;
    highUrgency: number;
    services: string[];
  }> {
    const incidents = await this.listIncidents({ status: ['triggered', 'acknowledged'] });
    return {
      total: incidents.length,
      triggered: incidents.filter((i) => i.status === 'triggered').length,
      acknowledged: incidents.filter((i) => i.status === 'acknowledged').length,
      highUrgency: incidents.filter((i) => i.urgency === 'high').length,
      services: [...new Set(incidents.map((i) => i.service.name))],
    };
  }
}
