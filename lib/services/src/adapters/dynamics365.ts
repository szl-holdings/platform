import { ServiceAdapter } from '../base.js';

export interface DynamicsAccount {
  id: string;
  name: string;
  industry: string;
  revenue: number | null;
  employees: number | null;
  city: string;
  country: string;
  modifiedOn: string;
}

export interface DynamicsContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  accountId: string | null;
  accountName: string | null;
  modifiedOn: string;
}

export interface DynamicsOpportunity {
  id: string;
  name: string;
  stage: string;
  probability: number;
  estimatedRevenue: number;
  estimatedCloseDate: string;
  accountId: string | null;
  accountName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  modifiedOn: string;
}

export interface DynamicsLead {
  id: string;
  topic: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  leadScore: number | null;
  status: string;
  modifiedOn: string;
}

export interface DynamicsCase {
  id: string;
  title: string;
  severity: string;
  status: string;
  priority: string;
  accountId: string | null;
  accountName: string | null;
  modifiedOn: string;
  escalated: boolean;
}

export interface DynamicsActivity {
  id: string;
  subject: string;
  activityType: string;
  status: string;
  scheduledEnd: string | null;
  regardingId: string | null;
  regardingType: string | null;
  modifiedOn: string;
}

export interface DynamicsSyncSignal {
  entityType: 'account' | 'contact' | 'opportunity' | 'lead' | 'case' | 'activity';
  entityId: string;
  eventType: 'create' | 'update' | 'delete';
  signalTitle: string;
  signalBody: string;
  severity: 'info' | 'warning' | 'critical';
  metadata: Record<string, unknown>;
  occurredAt: string;
}

const MOCK_ACCOUNTS: DynamicsAccount[] = [
  {
    id: 'dyn-acc-001',
    name: 'Northwind Traders',
    industry: 'Manufacturing',
    revenue: 125000000,
    employees: 850,
    city: 'Seattle',
    country: 'US',
    modifiedOn: '2026-03-28T14:00:00Z',
  },
  {
    id: 'dyn-acc-002',
    name: 'Fabrikam Inc',
    industry: 'Technology',
    revenue: 380000000,
    employees: 2200,
    city: 'Chicago',
    country: 'US',
    modifiedOn: '2026-03-29T09:30:00Z',
  },
  {
    id: 'dyn-acc-003',
    name: 'Contoso Ltd',
    industry: 'Financial Services',
    revenue: 92000000,
    employees: 450,
    city: 'London',
    country: 'GB',
    modifiedOn: '2026-03-27T16:45:00Z',
  },
];

const MOCK_CONTACTS: DynamicsContact[] = [
  {
    id: 'dyn-con-001',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@northwindtraders.com',
    phone: '+1-206-555-0142',
    jobTitle: 'VP of Operations',
    accountId: 'dyn-acc-001',
    accountName: 'Northwind Traders',
    modifiedOn: '2026-03-28T10:00:00Z',
  },
  {
    id: 'dyn-con-002',
    firstName: 'James',
    lastName: 'Holden',
    email: 'j.holden@fabrikam.com',
    phone: '+1-312-555-0198',
    jobTitle: 'Chief Technology Officer',
    accountId: 'dyn-acc-002',
    accountName: 'Fabrikam Inc',
    modifiedOn: '2026-03-29T08:15:00Z',
  },
];

const MOCK_OPPORTUNITIES: DynamicsOpportunity[] = [
  {
    id: 'dyn-opp-001',
    name: 'Northwind — Enterprise Platform License',
    stage: 'Proposal',
    probability: 60,
    estimatedRevenue: 240000,
    estimatedCloseDate: '2026-05-15',
    accountId: 'dyn-acc-001',
    accountName: 'Northwind Traders',
    ownerId: 'usr-001',
    ownerName: 'Alex Rivera',
    modifiedOn: '2026-03-29T11:00:00Z',
  },
  {
    id: 'dyn-opp-002',
    name: 'Fabrikam — Vessels Maritime Module',
    stage: 'Negotiation',
    probability: 80,
    estimatedRevenue: 95000,
    estimatedCloseDate: '2026-04-30',
    accountId: 'dyn-acc-002',
    accountName: 'Fabrikam Inc',
    ownerId: 'usr-002',
    ownerName: 'Jordan Lee',
    modifiedOn: '2026-03-30T09:00:00Z',
  },
  {
    id: 'dyn-opp-003',
    name: 'Contoso — Terra Intelligence Subscription',
    stage: 'Closed Won',
    probability: 100,
    estimatedRevenue: 48000,
    estimatedCloseDate: '2026-03-20',
    accountId: 'dyn-acc-003',
    accountName: 'Contoso Ltd',
    ownerId: 'usr-001',
    ownerName: 'Alex Rivera',
    modifiedOn: '2026-03-20T17:00:00Z',
  },
];

const MOCK_LEADS: DynamicsLead[] = [
  {
    id: 'dyn-lead-001',
    topic: 'Interested in Alloy Workflow Automation',
    firstName: 'Patricia',
    lastName: 'Vance',
    email: 'pvance@horizonlogistics.com',
    company: 'Horizon Logistics',
    leadScore: 87,
    status: 'New',
    modifiedOn: '2026-03-30T14:00:00Z',
  },
  {
    id: 'dyn-lead-002',
    topic: 'Fleet intelligence evaluation',
    firstName: 'Marcus',
    lastName: 'Webb',
    email: 'm.webb@blueoceanshipping.com',
    company: 'Blue Ocean Shipping',
    leadScore: 72,
    status: 'Contacted',
    modifiedOn: '2026-03-29T10:30:00Z',
  },
];

const MOCK_CASES: DynamicsCase[] = [
  {
    id: 'dyn-case-001',
    title: 'API Rate Limit Issues in Production',
    severity: '2 - High',
    status: 'In Progress',
    priority: '1 - High',
    accountId: 'dyn-acc-001',
    accountName: 'Northwind Traders',
    modifiedOn: '2026-03-30T08:00:00Z',
    escalated: true,
  },
  {
    id: 'dyn-case-002',
    title: 'Data export format question',
    severity: '4 - Low',
    status: 'Active',
    priority: '4 - Low',
    accountId: 'dyn-acc-002',
    accountName: 'Fabrikam Inc',
    modifiedOn: '2026-03-28T13:00:00Z',
    escalated: false,
  },
];

const MOCK_ACTIVITIES: DynamicsActivity[] = [
  {
    id: 'dyn-act-001',
    subject: 'Follow-up call — Enterprise License renewal',
    activityType: 'phonecall',
    status: 'Scheduled',
    scheduledEnd: '2026-04-02T15:00:00Z',
    regardingId: 'dyn-opp-001',
    regardingType: 'opportunity',
    modifiedOn: '2026-03-30T09:00:00Z',
  },
  {
    id: 'dyn-act-002',
    subject: 'Demo: Vessels Maritime Module',
    activityType: 'appointment',
    status: 'Completed',
    scheduledEnd: '2026-03-28T10:00:00Z',
    regardingId: 'dyn-opp-002',
    regardingType: 'opportunity',
    modifiedOn: '2026-03-28T11:30:00Z',
  },
];

export class Dynamics365Adapter extends ServiceAdapter {
  readonly name = 'dynamics365';
  readonly description =
    'Microsoft Dynamics 365 CRM/ERP — Accounts, Contacts, Opportunities, Leads, Cases via Dataverse OData v4';
  readonly requiredEnvVars = [
    'DYNAMICS_TENANT_ID',
    'DYNAMICS_CLIENT_ID',
    'DYNAMICS_CLIENT_SECRET',
    'DYNAMICS_ORG_URL',
  ];

  private tokenCache: { token: string; expiresAt: number } | null = null;

  private get tenantId(): string | undefined {
    return process.env['DYNAMICS_TENANT_ID'];
  }

  private get clientId(): string | undefined {
    return process.env['DYNAMICS_CLIENT_ID'];
  }

  private get clientSecret(): string | undefined {
    return process.env['DYNAMICS_CLIENT_SECRET'];
  }

  private get orgUrl(): string | undefined {
    return process.env['DYNAMICS_ORG_URL'];
  }

  private async acquireToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 60000) {
      return this.tokenCache.token;
    }
    const tokenEndpoint = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId!,
      client_secret: this.clientSecret!,
      scope: `${this.orgUrl}/.default`,
    });
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MSAL token acquisition failed: ${response.status} — ${text}`);
    }
    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return data.access_token;
  }

  private async odataRequest<T>(entitySet: string, query?: string): Promise<T[]> {
    const token = await this.acquireToken();
    const url = `${this.orgUrl}/api/data/v9.2/${entitySet}${query ? `?${query}` : ''}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Prefer: 'odata.include-annotations=*',
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Dataverse OData error ${response.status}: ${text}`);
    }
    const json = (await response.json()) as { value: T[] };
    return json.value;
  }

  private async odataCreate(
    entitySet: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const token = await this.acquireToken();
    const url = `${this.orgUrl}/api/data/v9.2/${entitySet}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Dataverse create error ${response.status}: ${text}`);
    }
    return (await response.json()) as Record<string, unknown>;
  }

  protected override async performHealthCheck(): Promise<void> {
    await this.acquireToken();
    const url = `${this.orgUrl}/api/data/v9.2/WhoAmI`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${await this.acquireToken()}`,
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    });
    if (!response.ok) throw new Error(`Dynamics 365 WhoAmI check failed: ${response.status}`);
  }

  async listAccounts(): Promise<DynamicsAccount[]> {
    if (!this.isLive) return [...MOCK_ACCOUNTS];
    const raw = await this.odataRequest<Record<string, unknown>>(
      'accounts',
      '$select=accountid,name,industrycode,revenue,numberofemployees,address1_city,address1_country,modifiedon&$top=50&$orderby=modifiedon desc',
    );
    return raw.map((r) => ({
      id: String(r['accountid'] ?? ''),
      name: String(r['name'] ?? ''),
      industry: String(
        r['industrycode@OData.Community.Display.V1.FormattedValue'] ?? r['industrycode'] ?? '',
      ),
      revenue: r['revenue'] != null ? Number(r['revenue']) : null,
      employees: r['numberofemployees'] != null ? Number(r['numberofemployees']) : null,
      city: String(r['address1_city'] ?? ''),
      country: String(r['address1_country'] ?? ''),
      modifiedOn: String(r['modifiedon'] ?? ''),
    }));
  }

  async listContacts(): Promise<DynamicsContact[]> {
    if (!this.isLive) return [...MOCK_CONTACTS];
    const raw = await this.odataRequest<Record<string, unknown>>(
      'contacts',
      '$select=contactid,firstname,lastname,emailaddress1,telephone1,jobtitle,_parentcustomerid_value&$top=50&$orderby=modifiedon desc',
    );
    return raw.map((r) => ({
      id: String(r['contactid'] ?? ''),
      firstName: String(r['firstname'] ?? ''),
      lastName: String(r['lastname'] ?? ''),
      email: String(r['emailaddress1'] ?? ''),
      phone: r['telephone1'] ? String(r['telephone1']) : null,
      jobTitle: r['jobtitle'] ? String(r['jobtitle']) : null,
      accountId: r['_parentcustomerid_value'] ? String(r['_parentcustomerid_value']) : null,
      accountName: r['_parentcustomerid_value@OData.Community.Display.V1.FormattedValue']
        ? String(r['_parentcustomerid_value@OData.Community.Display.V1.FormattedValue'])
        : null,
      modifiedOn: String(r['modifiedon'] ?? ''),
    }));
  }

  async listOpportunities(): Promise<DynamicsOpportunity[]> {
    if (!this.isLive) return [...MOCK_OPPORTUNITIES];
    const raw = await this.odataRequest<Record<string, unknown>>(
      'opportunities',
      '$select=opportunityid,name,stepname,closeprobability,estimatedvalue,estimatedclosedate,_parentaccountid_value,_ownerid_value,modifiedon&$top=50&$orderby=modifiedon desc',
    );
    return raw.map((r) => ({
      id: String(r['opportunityid'] ?? ''),
      name: String(r['name'] ?? ''),
      stage: String(r['stepname'] ?? ''),
      probability: Number(r['closeprobability'] ?? 0),
      estimatedRevenue: Number(r['estimatedvalue'] ?? 0),
      estimatedCloseDate: String(r['estimatedclosedate'] ?? ''),
      accountId: r['_parentaccountid_value'] ? String(r['_parentaccountid_value']) : null,
      accountName: r['_parentaccountid_value@OData.Community.Display.V1.FormattedValue']
        ? String(r['_parentaccountid_value@OData.Community.Display.V1.FormattedValue'])
        : null,
      ownerId: r['_ownerid_value'] ? String(r['_ownerid_value']) : null,
      ownerName: r['_ownerid_value@OData.Community.Display.V1.FormattedValue']
        ? String(r['_ownerid_value@OData.Community.Display.V1.FormattedValue'])
        : null,
      modifiedOn: String(r['modifiedon'] ?? ''),
    }));
  }

  async listLeads(): Promise<DynamicsLead[]> {
    if (!this.isLive) return [...MOCK_LEADS];
    const raw = await this.odataRequest<Record<string, unknown>>(
      'leads',
      '$select=leadid,subject,firstname,lastname,emailaddress1,companyname,leadsourcecode,statuscode,modifiedon&$top=50&$orderby=modifiedon desc',
    );
    return raw.map((r) => ({
      id: String(r['leadid'] ?? ''),
      topic: String(r['subject'] ?? ''),
      firstName: String(r['firstname'] ?? ''),
      lastName: String(r['lastname'] ?? ''),
      email: String(r['emailaddress1'] ?? ''),
      company: String(r['companyname'] ?? ''),
      leadScore: null,
      status: String(
        r['statuscode@OData.Community.Display.V1.FormattedValue'] ?? r['statuscode'] ?? '',
      ),
      modifiedOn: String(r['modifiedon'] ?? ''),
    }));
  }

  async listCases(): Promise<DynamicsCase[]> {
    if (!this.isLive) return [...MOCK_CASES];
    const raw = await this.odataRequest<Record<string, unknown>>(
      'incidents',
      '$select=incidentid,title,severitycode,statecode,prioritycode,_customerid_value,isescalated,modifiedon&$top=50&$orderby=modifiedon desc',
    );
    return raw.map((r) => ({
      id: String(r['incidentid'] ?? ''),
      title: String(r['title'] ?? ''),
      severity: String(
        r['severitycode@OData.Community.Display.V1.FormattedValue'] ?? r['severitycode'] ?? '',
      ),
      status: String(
        r['statecode@OData.Community.Display.V1.FormattedValue'] ?? r['statecode'] ?? '',
      ),
      priority: String(
        r['prioritycode@OData.Community.Display.V1.FormattedValue'] ?? r['prioritycode'] ?? '',
      ),
      accountId: r['_customerid_value'] ? String(r['_customerid_value']) : null,
      accountName: r['_customerid_value@OData.Community.Display.V1.FormattedValue']
        ? String(r['_customerid_value@OData.Community.Display.V1.FormattedValue'])
        : null,
      modifiedOn: String(r['modifiedon'] ?? ''),
      escalated: r['isescalated'] === true,
    }));
  }

  async listActivities(): Promise<DynamicsActivity[]> {
    if (!this.isLive) return [...MOCK_ACTIVITIES];
    const raw = await this.odataRequest<Record<string, unknown>>(
      'activitypointers',
      '$select=activityid,subject,activitytypecode,statecode,scheduledend,_regardingobjectid_value,modifiedon&$top=50&$orderby=modifiedon desc',
    );
    return raw.map((r) => ({
      id: String(r['activityid'] ?? ''),
      subject: String(r['subject'] ?? ''),
      activityType: String(r['activitytypecode'] ?? ''),
      status: String(
        r['statecode@OData.Community.Display.V1.FormattedValue'] ?? r['statecode'] ?? '',
      ),
      scheduledEnd: r['scheduledend'] ? String(r['scheduledend']) : null,
      regardingId: r['_regardingobjectid_value'] ? String(r['_regardingobjectid_value']) : null,
      regardingType: r['_regardingobjectid_value@Microsoft.Dynamics.CRM.lookuplogicalname']
        ? String(r['_regardingobjectid_value@Microsoft.Dynamics.CRM.lookuplogicalname'])
        : null,
      modifiedOn: String(r['modifiedon'] ?? ''),
    }));
  }

  buildSignalFromOpportunityChange(
    opp: DynamicsOpportunity,
    previousStage?: string,
  ): DynamicsSyncSignal {
    const isNewClose = opp.stage === 'Closed Won';
    const isHighValue = opp.estimatedRevenue >= 100000;
    return {
      entityType: 'opportunity',
      entityId: opp.id,
      eventType: 'update',
      signalTitle: `Dynamics CRM — Opportunity Stage Change: ${opp.name}`,
      signalBody: previousStage
        ? `Opportunity "${opp.name}" moved from "${previousStage}" to "${opp.stage}". Estimated revenue: $${opp.estimatedRevenue.toLocaleString()}. Close date: ${opp.estimatedCloseDate}.`
        : `Opportunity "${opp.name}" is now in stage "${opp.stage}". Estimated revenue: $${opp.estimatedRevenue.toLocaleString()}.`,
      severity: isNewClose || isHighValue ? 'warning' : 'info',
      metadata: {
        entityType: 'opportunity',
        opportunityId: opp.id,
        opportunityName: opp.name,
        stage: opp.stage,
        previousStage: previousStage ?? null,
        estimatedRevenue: opp.estimatedRevenue,
        probability: opp.probability,
        accountId: opp.accountId,
        accountName: opp.accountName,
        source: 'dynamics365',
      },
      occurredAt: opp.modifiedOn,
    };
  }

  buildSignalFromCaseEscalation(cas: DynamicsCase): DynamicsSyncSignal {
    return {
      entityType: 'case',
      entityId: cas.id,
      eventType: 'update',
      signalTitle: `Dynamics CRM — Case Escalated: ${cas.title}`,
      signalBody: `Support case "${cas.title}" has been escalated. Severity: ${cas.severity}. Account: ${cas.accountName ?? 'Unknown'}.`,
      severity: 'critical',
      metadata: {
        entityType: 'case',
        caseId: cas.id,
        caseTitle: cas.title,
        severity: cas.severity,
        status: cas.status,
        priority: cas.priority,
        accountId: cas.accountId,
        accountName: cas.accountName,
        escalated: cas.escalated,
        source: 'dynamics365',
      },
      occurredAt: cas.modifiedOn,
    };
  }

  buildSignalFromLeadScoreThreshold(lead: DynamicsLead, threshold: number): DynamicsSyncSignal {
    return {
      entityType: 'lead',
      entityId: lead.id,
      eventType: 'update',
      signalTitle: `Dynamics CRM — Lead Score Threshold Crossed: ${lead.firstName} ${lead.lastName}`,
      signalBody: `Lead "${lead.firstName} ${lead.lastName}" at ${lead.company} has crossed the scoring threshold of ${threshold} (current score: ${lead.leadScore ?? 'N/A'}). Status: ${lead.status}.`,
      severity: 'warning',
      metadata: {
        entityType: 'lead',
        leadId: lead.id,
        leadName: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        company: lead.company,
        leadScore: lead.leadScore,
        threshold,
        status: lead.status,
        source: 'dynamics365',
      },
      occurredAt: lead.modifiedOn,
    };
  }

  async pushActivityRecord(params: {
    subject: string;
    description: string;
    regardingEntitySet: string;
    regardingId: string;
    activityType?: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isLive) {
      return {
        activityid: `mock-${Date.now()}`,
        subject: params.subject,
        description: params.description,
        createdOn: new Date().toISOString(),
        _demo: true,
      };
    }
    const entitySet = params.activityType === 'phonecall' ? 'phonecalls' : 'tasks';
    const payload: Record<string, unknown> = {
      subject: params.subject,
      description: params.description,
    };
    if (params.regardingId) {
      payload[`regardingobjectid_${params.regardingEntitySet}@odata.bind`] =
        `/${params.regardingEntitySet}(${params.regardingId})`;
    }
    return this.odataCreate(entitySet, payload);
  }

  async getMockSyncSignals(): Promise<DynamicsSyncSignal[]> {
    const opps = await this.listOpportunities();
    const cases = await this.listCases();
    const leads = await this.listLeads();

    const signals: DynamicsSyncSignal[] = [];

    const recentOpp = opps.find((o) => o.stage === 'Negotiation');
    if (recentOpp) {
      signals.push(this.buildSignalFromOpportunityChange(recentOpp, 'Proposal'));
    }

    const escalatedCase = cases.find((c) => c.escalated);
    if (escalatedCase) {
      signals.push(this.buildSignalFromCaseEscalation(escalatedCase));
    }

    const highScoreLead = leads.find((l) => (l.leadScore ?? 0) >= 80);
    if (highScoreLead) {
      signals.push(this.buildSignalFromLeadScoreThreshold(highScoreLead, 80));
    }

    return signals;
  }
}
