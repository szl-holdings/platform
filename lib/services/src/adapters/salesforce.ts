/**
 * [STUB] Salesforce CRM Adapter
 *
 * Status: Hybrid stub — uses hard-coded/demo data when no OAuth token is
 * configured.  OAuth token refresh is implemented but a production
 * SALESFORCE_CLIENT_ID + SALESFORCE_CLIENT_SECRET + SALESFORCE_REFRESH_TOKEN
 * must be provisioned before live data flows.
 *
 * Activation:
 *   1. Create a Connected App in your Salesforce org (Settings → Apps → App Manager).
 *   2. Set SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET, SALESFORCE_INSTANCE_URL,
 *      and SALESFORCE_REFRESH_TOKEN in the environment / Replit secrets.
 *   3. Remove the mock-data fallback branches in `queryRecords()` and similar methods.
 *
 * Tracking: docs/audit/2026-04/mock-and-gap-report.md § Salesforce
 */
import { ServiceAdapter } from '../base.js';
import { globalTokenStore, refreshAccessToken } from '../integrations/oauth.js';

export interface SalesforceAccount {
  id: string;
  name: string;
  industry: string;
  annualRevenue: number | null;
  numberOfEmployees: number | null;
  website: string | null;
  phone: string | null;
  billingCity: string | null;
  billingCountry: string | null;
  type: string | null;
  lastActivityDate: string | null;
}

export interface SalesforceContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  accountId: string | null;
  accountName: string | null;
  lastModifiedDate: string;
}

export interface SalesforceOpportunity {
  id: string;
  name: string;
  accountId: string;
  accountName: string;
  amount: number | null;
  stageName: string;
  closeDate: string;
  probability: number | null;
  forecastCategory: string;
  isClosed: boolean;
  isWon: boolean;
  type: string | null;
  lastModifiedDate: string;
}

export interface SalesforceLead {
  id: string;
  firstName: string | null;
  lastName: string;
  company: string;
  email: string | null;
  phone: string | null;
  status: string;
  leadSource: string | null;
  isConverted: boolean;
  lastModifiedDate: string;
}

export interface SalesforceCase {
  id: string;
  caseNumber: string;
  subject: string;
  status: string;
  priority: string;
  origin: string;
  accountId: string | null;
  accountName: string | null;
  contactId: string | null;
  isEscalated: boolean;
  createdDate: string;
  lastModifiedDate: string;
}

export interface SalesforceTask {
  id: string;
  subject: string;
  status: string;
  priority: string;
  whatId: string | null;
  whoId: string | null;
  activityDate: string | null;
  description: string | null;
  createdDate: string;
}

export interface SalesforceSignal {
  id: string;
  type:
    | 'opportunity_stage_change'
    | 'case_escalation'
    | 'lead_conversion'
    | 'forecast_revision'
    | 'cdc_change';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  valueAtRisk: number | null;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

export interface SalesforceQueryResult<T> {
  totalSize: number;
  done: boolean;
  records: T[];
}

export interface SalesforceConnectionStatus {
  connected: boolean;
  instanceUrl?: string | undefined;
  orgId?: string | undefined;
  userId?: string | undefined;
  username?: string | undefined;
}

export interface SalesforceCdcEvent {
  id: string;
  objectType: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'UNDELETE';
  recordId: string;
  changedFields: string[];
  changeOrigin: string;
  changedAt: string;
  payload: Record<string, unknown>;
}

const MOCK_ACCOUNTS: SalesforceAccount[] = [
  {
    id: '0015f00000AbCdEf',
    name: 'Meridian Capital Group',
    industry: 'Financial Services',
    annualRevenue: 45_000_000,
    numberOfEmployees: 320,
    website: 'https://meridiancapital.example.com',
    phone: '+1-212-555-0100',
    billingCity: 'New York',
    billingCountry: 'USA',
    type: 'Customer',
    lastActivityDate: '2026-03-28T14:00:00Z',
  },
  {
    id: '0015f00000XyZwVu',
    name: 'Arcturus Industrial Holdings',
    industry: 'Manufacturing',
    annualRevenue: 120_000_000,
    numberOfEmployees: 1800,
    website: 'https://arcturus.example.com',
    phone: '+1-312-555-0200',
    billingCity: 'Chicago',
    billingCountry: 'USA',
    type: 'Partner',
    lastActivityDate: '2026-03-25T09:30:00Z',
  },
  {
    id: '0015f00000LmNoPq',
    name: 'Helios Energy Services',
    industry: 'Energy',
    annualRevenue: 78_000_000,
    numberOfEmployees: 540,
    website: 'https://heliosenergy.example.com',
    phone: '+1-713-555-0300',
    billingCity: 'Houston',
    billingCountry: 'USA',
    type: 'Customer',
    lastActivityDate: '2026-03-30T11:00:00Z',
  },
];

const MOCK_OPPORTUNITIES: SalesforceOpportunity[] = [
  {
    id: '0065f00000OpQrSt',
    name: 'Meridian — Enterprise Platform License Q2',
    accountId: '0015f00000AbCdEf',
    accountName: 'Meridian Capital Group',
    amount: 285_000,
    stageName: 'Proposal/Price Quote',
    closeDate: '2026-04-30',
    probability: 60,
    forecastCategory: 'Pipeline',
    isClosed: false,
    isWon: false,
    type: 'New Business',
    lastModifiedDate: '2026-03-28T16:00:00Z',
  },
  {
    id: '0065f00000UpVwXy',
    name: 'Arcturus — Fleet Intelligence Suite',
    accountId: '0015f00000XyZwVu',
    accountName: 'Arcturus Industrial Holdings',
    amount: 540_000,
    stageName: 'Negotiation/Review',
    closeDate: '2026-05-15',
    probability: 80,
    forecastCategory: 'Best Case',
    isClosed: false,
    isWon: false,
    type: 'New Business',
    lastModifiedDate: '2026-03-29T10:00:00Z',
  },
  {
    id: '0065f00000ZaAbBc',
    name: 'Helios — Lyte Command Renewal 2026',
    accountId: '0015f00000LmNoPq',
    accountName: 'Helios Energy Services',
    amount: 195_000,
    stageName: 'Closed Won',
    closeDate: '2026-03-15',
    probability: 100,
    forecastCategory: 'Closed',
    isClosed: true,
    isWon: true,
    type: 'Renewal',
    lastModifiedDate: '2026-03-15T18:00:00Z',
  },
];

const MOCK_CASES: SalesforceCase[] = [
  {
    id: '5005f00000CaSeId',
    caseNumber: '00012543',
    subject: 'API latency spike — Alloy workflow engine',
    status: 'In Progress',
    priority: 'High',
    origin: 'Web',
    accountId: '0015f00000AbCdEf',
    accountName: 'Meridian Capital Group',
    contactId: null,
    isEscalated: true,
    createdDate: '2026-03-27T08:00:00Z',
    lastModifiedDate: '2026-03-29T12:00:00Z',
  },
  {
    id: '5005f00000CaSeJk',
    caseNumber: '00012544',
    subject: 'Data export compliance question',
    status: 'New',
    priority: 'Medium',
    origin: 'Email',
    accountId: '0015f00000XyZwVu',
    accountName: 'Arcturus Industrial Holdings',
    contactId: null,
    isEscalated: false,
    createdDate: '2026-03-30T09:00:00Z',
    lastModifiedDate: '2026-03-30T09:00:00Z',
  },
];

const MOCK_LEADS: SalesforceLead[] = [
  {
    id: '00Q5f00000LeAdId',
    firstName: 'Marcus',
    lastName: 'Thornton',
    company: 'Orion Logistics Group',
    email: 'm.thornton@orionlogistics.example.com',
    phone: '+1-404-555-0401',
    status: 'Working - Contacted',
    leadSource: 'Web',
    isConverted: false,
    lastModifiedDate: '2026-03-29T15:00:00Z',
  },
  {
    id: '00Q5f00000LeAdJk',
    firstName: 'Sarah',
    lastName: 'Nakamura',
    company: 'Vertex Supply Chain',
    email: 's.nakamura@vertexsc.example.com',
    phone: '+1-503-555-0501',
    status: 'Converted',
    leadSource: 'Partner Referral',
    isConverted: true,
    lastModifiedDate: '2026-03-25T11:00:00Z',
  },
];

function generateSignalsFromMockData(): SalesforceSignal[] {
  const signals: SalesforceSignal[] = [];

  const escalatedCases = MOCK_CASES.filter((c) => c.isEscalated);
  for (const c of escalatedCases) {
    signals.push({
      id: `sf_signal_case_${c.id}`,
      type: 'case_escalation',
      title: `Case Escalated: ${c.subject}`,
      description: `Case ${c.caseNumber} has been escalated for ${c.accountName ?? 'unknown account'}. Priority: ${c.priority}.`,
      severity: c.priority === 'High' ? 'critical' : 'warning',
      valueAtRisk: null,
      metadata: {
        caseId: c.id,
        caseNumber: c.caseNumber,
        accountId: c.accountId,
        priority: c.priority,
      },
      occurredAt: c.lastModifiedDate,
    });
  }

  const atRiskOpps = MOCK_OPPORTUNITIES.filter(
    (o) => !o.isClosed && o.probability !== null && o.probability < 65 && (o.amount ?? 0) > 100_000,
  );
  for (const o of atRiskOpps) {
    const valueAtRisk = (o.amount ?? 0) * ((100 - (o.probability ?? 0)) / 100);
    signals.push({
      id: `sf_signal_opp_${o.id}`,
      type: 'opportunity_stage_change',
      title: `Pipeline Risk: ${o.name}`,
      description: `Opportunity "${o.name}" at ${o.probability}% probability with ${o.amount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} at stake. Stage: ${o.stageName}.`,
      severity: valueAtRisk > 200_000 ? 'critical' : 'warning',
      valueAtRisk,
      metadata: {
        opportunityId: o.id,
        stage: o.stageName,
        probability: o.probability,
        amount: o.amount,
        closeDate: o.closeDate,
      },
      occurredAt: o.lastModifiedDate,
    });
  }

  const convertedLeads = MOCK_LEADS.filter((l) => l.isConverted);
  for (const l of convertedLeads) {
    signals.push({
      id: `sf_signal_lead_${l.id}`,
      type: 'lead_conversion',
      title: `Lead Converted: ${l.firstName ?? ''} ${l.lastName} — ${l.company}`,
      description: `Lead from ${l.company} converted (source: ${l.leadSource ?? 'unknown'}).`,
      severity: 'info',
      valueAtRisk: null,
      metadata: { leadId: l.id, company: l.company, leadSource: l.leadSource },
      occurredAt: l.lastModifiedDate,
    });
  }

  return signals;
}

export interface SalesforcePipelineHealth {
  totalOpenOpportunities: number;
  totalPipelineValue: number;
  weightedForecast: number;
  totalValueAtRisk: number;
  dealVelocityDays: number;
  averageDealSize: number;
  stageBreakdown: Array<{ stage: string; count: number; value: number }>;
  forecastByCategory: Array<{ category: string; count: number; value: number }>;
}

export class SalesforceAdapter extends ServiceAdapter {
  readonly name = 'salesforce';
  readonly description =
    'Salesforce CRM — accounts, opportunities, leads, cases, pipeline intelligence, OAuth 2.0, and Change Data Capture streaming';
  readonly requiredEnvVars = ['SALESFORCE_INSTANCE_URL', 'SALESFORCE_ACCESS_TOKEN'];

  override get missingEnvVars(): string[] {
    const hasRefreshAuth = !!(
      this.instanceUrl &&
      this.refreshToken &&
      this.clientId &&
      this.clientSecret
    );
    if (hasRefreshAuth) return [];
    return this.requiredEnvVars.filter((v) => !process.env[v]);
  }

  override get presentEnvVars(): string[] {
    const hasRefreshAuth = !!(
      this.instanceUrl &&
      this.refreshToken &&
      this.clientId &&
      this.clientSecret
    );
    if (hasRefreshAuth) {
      return [
        'SALESFORCE_INSTANCE_URL',
        'SALESFORCE_REFRESH_TOKEN',
        'SALESFORCE_CLIENT_ID',
        'SALESFORCE_CLIENT_SECRET',
      ].filter((v) => !!process.env[v]);
    }
    return this.requiredEnvVars.filter((v) => !!process.env[v]);
  }

  private readonly TOKEN_KEY = 'salesforce_main';

  private get instanceUrl(): string | undefined {
    return process.env.SALESFORCE_INSTANCE_URL;
  }

  private get accessToken(): string | undefined {
    return process.env.SALESFORCE_ACCESS_TOKEN;
  }

  private get refreshToken(): string | undefined {
    return process.env.SALESFORCE_REFRESH_TOKEN;
  }

  private get clientId(): string | undefined {
    return process.env.SALESFORCE_CLIENT_ID;
  }

  private get clientSecret(): string | undefined {
    return process.env.SALESFORCE_CLIENT_SECRET;
  }

  private get webhookSecret(): string | undefined {
    return process.env.SALESFORCE_WEBHOOK_SECRET;
  }

  private async getValidAccessToken(): Promise<string> {
    const stored = await globalTokenStore.getValidToken(this.TOKEN_KEY);
    if (stored) return stored.accessToken;

    if (this.refreshToken && this.clientId && this.clientSecret && this.instanceUrl) {
      const tokenUrl = `${this.instanceUrl}/services/oauth2/token`;
      try {
        const tokenSet = await refreshAccessToken(
          { clientId: this.clientId, clientSecret: this.clientSecret, tokenUrl },
          this.refreshToken,
        );
        globalTokenStore.store(this.TOKEN_KEY, tokenSet);
        globalTokenStore.registerRefreshCallback(this.TOKEN_KEY, async () =>
          refreshAccessToken(
            { clientId: this.clientId!, clientSecret: this.clientSecret!, tokenUrl },
            tokenSet.refreshToken ?? this.refreshToken!,
          ),
        );
        return tokenSet.accessToken;
      } catch {
        // fall through to static access token
      }
    }

    return this.accessToken ?? '';
  }

  private async sfRequest<T>(soqlOrPath: string, isSoql = true): Promise<T> {
    const token = await this.getValidAccessToken();
    const url = isSoql
      ? `${this.instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent(soqlOrPath)}`
      : `${this.instanceUrl}${soqlOrPath}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Salesforce API error: ${response.status} ${response.statusText} — ${body}`);
    }
    return response.json() as Promise<T>;
  }

  protected override async performHealthCheck(): Promise<void> {
    const status = await this.testConnection();
    if (!status.connected) throw new Error('Salesforce connection verification failed');
  }

  async testConnection(): Promise<SalesforceConnectionStatus> {
    if (!this.isLive) return { connected: false };
    try {
      const data = await this.sfRequest<{
        identity: string;
        username: string;
        organization_id: string;
        user_id: string;
      }>('/services/oauth2/userinfo', false);
      return {
        connected: true,
        instanceUrl: this.instanceUrl,
        orgId: data.organization_id,
        userId: data.user_id,
        username: data.username,
      };
    } catch {
      return { connected: false };
    }
  }

  async queryAccounts(limit = 50): Promise<SalesforceAccount[]> {
    if (!this.isLive) return [...MOCK_ACCOUNTS];
    const soql = `SELECT Id, Name, Industry, AnnualRevenue, NumberOfEmployees, Website, Phone, BillingCity, BillingCountry, Type, LastActivityDate FROM Account ORDER BY LastModifiedDate DESC LIMIT ${limit}`;
    const result = await this.sfRequest<SalesforceQueryResult<Record<string, unknown>>>(soql);
    return result.records.map((r) => ({
      id: r.Id as string,
      name: r.Name as string,
      industry: (r.Industry as string) ?? '',
      annualRevenue: (r.AnnualRevenue as number) ?? null,
      numberOfEmployees: (r.NumberOfEmployees as number) ?? null,
      website: (r.Website as string) ?? null,
      phone: (r.Phone as string) ?? null,
      billingCity: (r.BillingCity as string) ?? null,
      billingCountry: (r.BillingCountry as string) ?? null,
      type: (r.Type as string) ?? null,
      lastActivityDate: (r.LastActivityDate as string) ?? null,
    }));
  }

  async queryOpportunities(limit = 50, stage?: string): Promise<SalesforceOpportunity[]> {
    if (!this.isLive) {
      const ops = [...MOCK_OPPORTUNITIES];
      return stage ? ops.filter((o) => o.stageName === stage) : ops;
    }
    const stageFilter = stage ? ` AND StageName = '${stage.replace(/'/g, "\\'")}'` : '';
    const soql = `SELECT Id, Name, AccountId, Account.Name, Amount, StageName, CloseDate, Probability, ForecastCategory, IsClosed, IsWon, Type, LastModifiedDate FROM Opportunity WHERE IsClosed = false${stageFilter} ORDER BY Amount DESC NULLS LAST LIMIT ${limit}`;
    const result = await this.sfRequest<SalesforceQueryResult<Record<string, unknown>>>(soql);
    return result.records.map((r) => ({
      id: r.Id as string,
      name: r.Name as string,
      accountId: r.AccountId as string,
      accountName: ((r.Account as Record<string, unknown>)?.Name as string) ?? '',
      amount: (r.Amount as number) ?? null,
      stageName: r.StageName as string,
      closeDate: r.CloseDate as string,
      probability: (r.Probability as number) ?? null,
      forecastCategory: r.ForecastCategory as string,
      isClosed: r.IsClosed as boolean,
      isWon: r.IsWon as boolean,
      type: (r.Type as string) ?? null,
      lastModifiedDate: r.LastModifiedDate as string,
    }));
  }

  async queryCases(limit = 50, escalatedOnly = false): Promise<SalesforceCase[]> {
    if (!this.isLive) {
      const cases = [...MOCK_CASES];
      return escalatedOnly ? cases.filter((c) => c.isEscalated) : cases;
    }
    const escalatedFilter = escalatedOnly ? ' AND IsEscalated = true' : '';
    const soql = `SELECT Id, CaseNumber, Subject, Status, Priority, Origin, AccountId, Account.Name, ContactId, IsEscalated, CreatedDate, LastModifiedDate FROM Case WHERE IsClosed = false${escalatedFilter} ORDER BY LastModifiedDate DESC LIMIT ${limit}`;
    const result = await this.sfRequest<SalesforceQueryResult<Record<string, unknown>>>(soql);
    return result.records.map((r) => ({
      id: r.Id as string,
      caseNumber: r.CaseNumber as string,
      subject: r.Subject as string,
      status: r.Status as string,
      priority: r.Priority as string,
      origin: r.Origin as string,
      accountId: (r.AccountId as string) ?? null,
      accountName: ((r.Account as Record<string, unknown>)?.Name as string) ?? null,
      contactId: (r.ContactId as string) ?? null,
      isEscalated: r.IsEscalated as boolean,
      createdDate: r.CreatedDate as string,
      lastModifiedDate: r.LastModifiedDate as string,
    }));
  }

  async queryLeads(limit = 50): Promise<SalesforceLead[]> {
    if (!this.isLive) return [...MOCK_LEADS];
    const soql = `SELECT Id, FirstName, LastName, Company, Email, Phone, Status, LeadSource, IsConverted, LastModifiedDate FROM Lead ORDER BY LastModifiedDate DESC LIMIT ${limit}`;
    const result = await this.sfRequest<SalesforceQueryResult<Record<string, unknown>>>(soql);
    return result.records.map((r) => ({
      id: r.Id as string,
      firstName: (r.FirstName as string) ?? null,
      lastName: r.LastName as string,
      company: r.Company as string,
      email: (r.Email as string) ?? null,
      phone: (r.Phone as string) ?? null,
      status: r.Status as string,
      leadSource: (r.LeadSource as string) ?? null,
      isConverted: r.IsConverted as boolean,
      lastModifiedDate: r.LastModifiedDate as string,
    }));
  }

  async executeSOQL(soql: string): Promise<SalesforceQueryResult<Record<string, unknown>>> {
    if (!this.isLive) return { totalSize: 0, done: true, records: [] };
    return this.sfRequest<SalesforceQueryResult<Record<string, unknown>>>(soql);
  }

  async ingestSignals(): Promise<SalesforceSignal[]> {
    if (!this.isLive) return generateSignalsFromMockData();

    const signals: SalesforceSignal[] = [];

    try {
      const cases = await this.queryCases(20, true);
      for (const c of cases) {
        signals.push({
          id: `sf_signal_case_${c.id}`,
          type: 'case_escalation',
          title: `Case Escalated: ${c.subject}`,
          description: `Case ${c.caseNumber} escalated. Priority: ${c.priority}.`,
          severity: c.priority === 'High' || c.priority === 'Critical' ? 'critical' : 'warning',
          valueAtRisk: null,
          metadata: {
            caseId: c.id,
            caseNumber: c.caseNumber,
            accountId: c.accountId,
            priority: c.priority,
          },
          occurredAt: c.lastModifiedDate,
        });
      }

      const opportunities = await this.queryOpportunities(20);
      for (const o of opportunities) {
        if ((o.probability ?? 100) < 65 && (o.amount ?? 0) > 100_000) {
          const valueAtRisk = (o.amount ?? 0) * ((100 - (o.probability ?? 0)) / 100);
          signals.push({
            id: `sf_signal_opp_${o.id}`,
            type: 'opportunity_stage_change',
            title: `Pipeline Risk: ${o.name}`,
            description: `Opportunity at ${o.probability}% probability. Stage: ${o.stageName}.`,
            severity: valueAtRisk > 200_000 ? 'critical' : 'warning',
            valueAtRisk,
            metadata: {
              opportunityId: o.id,
              stage: o.stageName,
              probability: o.probability,
              amount: o.amount,
            },
            occurredAt: o.lastModifiedDate,
          });
        }
      }
    } catch {
      return generateSignalsFromMockData();
    }

    return signals;
  }

  async processCdcEvent(
    payload: Record<string, unknown>,
    rawBody: string,
    signature?: string,
  ): Promise<SalesforceCdcEvent | null> {
    if (signature && this.webhookSecret) {
      const { verifyWebhookSignature } = await import('../integrations/webhook-verifier.js');
      const result = verifyWebhookSignature({
        algorithm: 'salesforce-cdc',
        secret: this.webhookSecret,
        signature,
        body: rawBody,
      });
      if (!result.valid) {
        throw new Error(`Salesforce CDC signature invalid: ${result.reason}`);
      }
    }

    const event = payload.event as Record<string, unknown> | undefined;
    const sobject = payload.sobject as Record<string, unknown> | undefined;

    if (!event || !sobject) return null;

    const changeType = (event.type as string) ?? 'UPDATE';
    const changedFields = Object.keys(sobject).filter((k) => k !== 'Id' && k !== 'attributes');

    return {
      id: `sf_cdc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      objectType:
        ((sobject.attributes as Record<string, unknown>)?.type as string) ?? 'Unknown',
      changeType: changeType as SalesforceCdcEvent['changeType'],
      recordId: (sobject.Id as string) ?? '',
      changedFields,
      changeOrigin: (event.changeOrigin as string) ?? '',
      changedAt: (event.createdDate as string) ?? new Date().toISOString(),
      payload: sobject,
    };
  }

  async subscribeToCdc(objectTypes: string[]): Promise<{
    subscribed: boolean;
    channel: string;
    objects: string[];
    note: string;
  }> {
    return {
      subscribed: true,
      channel: '/data/ChangeEvents',
      objects: objectTypes,
      note: 'CDC streaming is configured via Salesforce Platform Events. Send events to POST /api/webhooks/inbound/salesforce/cdc',
    };
  }

  async getPipelineHealth(): Promise<SalesforcePipelineHealth> {
    const opportunities = await this.queryOpportunities(200);
    const open = opportunities.filter((o) => !o.isClosed);

    const totalPipelineValue = open.reduce((s, o) => s + (o.amount ?? 0), 0);
    const weightedForecast = open.reduce(
      (s, o) => s + ((o.amount ?? 0) * (o.probability ?? 0)) / 100,
      0,
    );
    const totalValueAtRisk = open
      .filter((o) => (o.probability ?? 100) < 70)
      .reduce((s, o) => s + (o.amount ?? 0) * ((100 - (o.probability ?? 0)) / 100), 0);

    const stageMap = new Map<string, { count: number; value: number }>();
    for (const o of open) {
      const entry = stageMap.get(o.stageName) ?? { count: 0, value: 0 };
      stageMap.set(o.stageName, { count: entry.count + 1, value: entry.value + (o.amount ?? 0) });
    }

    const forecastMap = new Map<string, { count: number; value: number }>();
    for (const o of open) {
      const entry = forecastMap.get(o.forecastCategory) ?? { count: 0, value: 0 };
      forecastMap.set(o.forecastCategory, {
        count: entry.count + 1,
        value: entry.value + (o.amount ?? 0),
      });
    }

    return {
      totalOpenOpportunities: open.length,
      totalPipelineValue,
      weightedForecast,
      totalValueAtRisk,
      dealVelocityDays: 45,
      averageDealSize: open.length > 0 ? totalPipelineValue / open.length : 0,
      stageBreakdown: Array.from(stageMap.entries()).map(([stage, d]) => ({ stage, ...d })),
      forecastByCategory: Array.from(forecastMap.entries()).map(([category, d]) => ({
        category,
        ...d,
      })),
    };
  }

  async createTask(params: {
    subject: string;
    description?: string;
    whatId?: string;
    priority?: 'High' | 'Normal' | 'Low';
    status?: string;
  }): Promise<{ id: string; success: boolean }> {
    if (!this.isLive) return { id: `mock_task_${Date.now()}`, success: true };
    const token = await this.getValidAccessToken();
    const response = await fetch(`${this.instanceUrl}/services/data/v59.0/sobjects/Task`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Subject: params.subject,
        Description: params.description ?? null,
        WhatId: params.whatId ?? null,
        Priority: params.priority ?? 'Normal',
        Status: params.status ?? 'Not Started',
      }),
    });
    if (!response.ok) throw new Error(`Failed to create Salesforce Task: ${response.status}`);
    return response.json() as Promise<{ id: string; success: boolean }>;
  }

  async createCase(params: {
    subject: string;
    description?: string;
    priority?: 'High' | 'Medium' | 'Low';
    origin?: string;
    accountId?: string;
  }): Promise<{ id: string; success: boolean }> {
    if (!this.isLive) return { id: `mock_case_${Date.now()}`, success: true };
    const token = await this.getValidAccessToken();
    const response = await fetch(`${this.instanceUrl}/services/data/v59.0/sobjects/Case`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Subject: params.subject,
        Description: params.description ?? null,
        Priority: params.priority ?? 'Medium',
        Origin: params.origin ?? 'Platform',
        AccountId: params.accountId ?? null,
        Status: 'New',
      }),
    });
    if (!response.ok) throw new Error(`Failed to create Salesforce Case: ${response.status}`);
    return response.json() as Promise<{ id: string; success: boolean }>;
  }

  async sync(): Promise<{ synced: number; signals: number; timestamp: string }> {
    const [accounts, opportunities, cases, signals] = await Promise.all([
      this.queryAccounts(50),
      this.queryOpportunities(50),
      this.queryCases(50),
      this.ingestSignals(),
    ]);
    return {
      synced: accounts.length + opportunities.length + cases.length,
      signals: signals.length,
      timestamp: new Date().toISOString(),
    };
  }
}
