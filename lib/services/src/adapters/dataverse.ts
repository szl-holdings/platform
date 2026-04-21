import { ServiceAdapter, type ServiceStatus } from "../base.js";

export interface DataverseAccount {
  id: string;
  name: string;
  accountNumber?: string | undefined;
  primaryContactId?: string | undefined;
  telephone1?: string | undefined;
  emailAddress1?: string | undefined;
  websiteUrl?: string | undefined;
  revenue?: number | undefined;
  numberofemployees?: number | undefined;
  statecode: number;
  createdOn: string;
  modifiedOn: string;
}

export interface DataverseContact {
  id: string;
  fullName: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  emailAddress1?: string | undefined;
  telephone1?: string | undefined;
  jobTitle?: string | undefined;
  accountId?: string | undefined;
  accountName?: string | undefined;
  statecode: number;
  createdOn: string;
  modifiedOn: string;
}

export interface DataverseLead {
  id: string;
  fullName: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  companyName?: string | undefined;
  emailAddress1?: string | undefined;
  telephone1?: string | undefined;
  subject?: string | undefined;
  statecode: number;
  statuscode: number;
  estimatedvalue?: number | undefined;
  estimatedclosedate?: string | undefined;
  leadqualitycode?: number | undefined;
  createdOn: string;
  modifiedOn: string;
}

export interface DataverseOpportunity {
  id: string;
  name: string;
  accountId?: string | undefined;
  accountName?: string | undefined;
  contactId?: string | undefined;
  estimatedvalue?: number | undefined;
  estimatedclosedate?: string | undefined;
  statecode: number;
  statuscode: number;
  stepname?: string | undefined;
  probability?: number | undefined;
  closeprobability?: number | undefined;
  description?: string | undefined;
  createdOn: string;
  modifiedOn: string;
}

export interface DataverseActivity {
  id: string;
  subject: string;
  activityType: string;
  regardingObjectId?: string | undefined;
  regardingObjectName?: string | undefined;
  scheduledstart?: string | undefined;
  scheduledend?: string | undefined;
  statecode: number;
  statuscode: number;
  description?: string | undefined;
  createdOn: string;
  modifiedOn: string;
}

export interface DataverseConnectionStatus {
  connected: boolean;
  orgUrl?: string | undefined;
  tenantId?: string | undefined;
  error?: string | undefined;
}

export interface DataverseSyncResult {
  entity: string;
  count: number;
  errors: number;
  timestamp: string;
}

export interface DataverseLyteSignal {
  id: string;
  type: "stale_opportunity" | "pipeline_anomaly" | "deal_stage_conflict" | "high_value_lead" | "overdue_activity";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  entityType: string;
  entityId: string;
  entityName: string;
  orgUrl: string;
  tenantId: string;
  detectedAt: string;
  metadata: Record<string, unknown>;
}

const MOCK_ACCOUNTS: DataverseAccount[] = [
  {
    id: "acc-001",
    name: "Northwind Traders",
    accountNumber: "NW-001",
    telephone1: "+1-206-555-0100",
    emailAddress1: "contact@northwind.com",
    websiteUrl: "https://northwind.com",
    revenue: 5000000,
    numberofemployees: 120,
    statecode: 0,
    createdOn: "2025-01-15T09:00:00Z",
    modifiedOn: "2026-03-20T14:30:00Z",
  },
  {
    id: "acc-002",
    name: "Contoso Maritime",
    accountNumber: "CM-002",
    telephone1: "+1-212-555-0200",
    emailAddress1: "ops@contoso-maritime.com",
    revenue: 12000000,
    numberofemployees: 340,
    statecode: 0,
    createdOn: "2025-03-01T10:00:00Z",
    modifiedOn: "2026-03-28T11:00:00Z",
  },
];

const MOCK_CONTACTS: DataverseContact[] = [
  {
    id: "con-001",
    fullName: "James Whitmore",
    firstName: "James",
    lastName: "Whitmore",
    emailAddress1: "j.whitmore@northwind.com",
    telephone1: "+1-206-555-0101",
    jobTitle: "Procurement Director",
    accountId: "acc-001",
    accountName: "Northwind Traders",
    statecode: 0,
    createdOn: "2025-01-20T09:00:00Z",
    modifiedOn: "2026-03-15T10:00:00Z",
  },
  {
    id: "con-002",
    fullName: "Elena Vasquez",
    firstName: "Elena",
    lastName: "Vasquez",
    emailAddress1: "e.vasquez@contoso-maritime.com",
    telephone1: "+1-212-555-0201",
    jobTitle: "Fleet Operations Manager",
    accountId: "acc-002",
    accountName: "Contoso Maritime",
    statecode: 0,
    createdOn: "2025-03-05T10:00:00Z",
    modifiedOn: "2026-03-29T09:00:00Z",
  },
];

const MOCK_LEADS: DataverseLead[] = [
  {
    id: "lead-001",
    fullName: "Robert Kline",
    firstName: "Robert",
    lastName: "Kline",
    companyName: "Atlantic Logistics",
    emailAddress1: "r.kline@atlantic-logistics.com",
    subject: "Fleet management platform inquiry",
    statecode: 0,
    statuscode: 1,
    estimatedvalue: 85000,
    leadqualitycode: 1,
    createdOn: "2026-01-10T09:00:00Z",
    modifiedOn: "2026-03-25T14:00:00Z",
  },
  {
    id: "lead-002",
    fullName: "Patricia Okafor",
    firstName: "Patricia",
    lastName: "Okafor",
    companyName: "Gulf Marine Services",
    emailAddress1: "p.okafor@gulfmarine.com",
    subject: "Maritime intelligence solution",
    statecode: 0,
    statuscode: 1,
    estimatedvalue: 120000,
    leadqualitycode: 2,
    createdOn: "2026-02-01T11:00:00Z",
    modifiedOn: "2026-03-30T09:00:00Z",
  },
];

const MOCK_OPPORTUNITIES: DataverseOpportunity[] = [
  {
    id: "opp-001",
    name: "Northwind — Fleet Monitoring Suite",
    accountId: "acc-001",
    accountName: "Northwind Traders",
    estimatedvalue: 250000,
    estimatedclosedate: "2026-06-30",
    statecode: 0,
    statuscode: 1,
    stepname: "Proposal/Price Quote",
    probability: 60,
    closeprobability: 60,
    description: "Full fleet monitoring and compliance suite",
    createdOn: "2026-01-15T10:00:00Z",
    modifiedOn: "2026-03-28T12:00:00Z",
  },
  {
    id: "opp-002",
    name: "Contoso Maritime — Operations Platform",
    accountId: "acc-002",
    accountName: "Contoso Maritime",
    estimatedvalue: 480000,
    estimatedclosedate: "2026-04-15",
    statecode: 0,
    statuscode: 1,
    stepname: "Needs Analysis",
    probability: 35,
    closeprobability: 35,
    description: "End-to-end maritime operations intelligence",
    createdOn: "2026-02-20T09:00:00Z",
    modifiedOn: "2026-03-31T08:00:00Z",
  },
];

const MOCK_ACTIVITIES: DataverseActivity[] = [
  {
    id: "act-001",
    subject: "Demo call — Fleet Monitoring",
    activityType: "phonecall",
    regardingObjectId: "opp-001",
    regardingObjectName: "Northwind — Fleet Monitoring Suite",
    scheduledstart: "2026-04-05T14:00:00Z",
    scheduledend: "2026-04-05T15:00:00Z",
    statecode: 0,
    statuscode: 1,
    createdOn: "2026-03-25T10:00:00Z",
    modifiedOn: "2026-03-25T10:00:00Z",
  },
  {
    id: "act-002",
    subject: "Follow-up email — Proposal review",
    activityType: "email",
    regardingObjectId: "opp-002",
    regardingObjectName: "Contoso Maritime — Operations Platform",
    scheduledstart: "2026-04-02T09:00:00Z",
    statecode: 0,
    statuscode: 1,
    createdOn: "2026-03-29T09:00:00Z",
    modifiedOn: "2026-03-29T09:00:00Z",
  },
];

export class DataverseAdapter extends ServiceAdapter {
  readonly name = "dynamics365-dataverse";
  readonly description = "Dynamics 365 Online / Dataverse — CRM entity sync (Accounts, Contacts, Leads, Opportunities, Activities) via Dataverse Web API v9.2";
  readonly requiredEnvVars = [
    "DATAVERSE_ORG_URL",
    "DATAVERSE_TENANT_ID",
    "DATAVERSE_CLIENT_ID",
    "DATAVERSE_CLIENT_SECRET",
  ];

  private tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

  override get status(): ServiceStatus {
    const missing = this.missingEnvVars;
    if (missing.length === 0) return "LIVE_CONFIGURED";
    return "MOCKED_DEMO_MODE";
  }

  async getAccessToken(
    tenantId: string,
    clientId: string,
    clientSecret: string,
    resource: string,
  ): Promise<string> {
    const cacheKey = `${tenantId}:${clientId}:${resource}`;
    const cached = this.tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() + 60_000) {
      return cached.token;
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: `${resource}/.default`,
    });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error(`Dataverse token request failed: HTTP ${res.status}`);
    }

    const data = await res.json() as { access_token: string; expires_in: number };
    this.tokenCache.set(cacheKey, {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    });
    return data.access_token;
  }

  private async dataverseFetch(
    orgUrl: string,
    path: string,
    tenantId?: string,
    clientId?: string,
    clientSecret?: string,
    options: RequestInit = {},
  ): Promise<unknown> {
    const tid = tenantId ?? process.env["DATAVERSE_TENANT_ID"]!;
    const cid = clientId ?? process.env["DATAVERSE_CLIENT_ID"]!;
    const csec = clientSecret ?? process.env["DATAVERSE_CLIENT_SECRET"]!;
    const orgResource = orgUrl.replace(/\/$/, "");

    const token = await this.getAccessToken(tid, cid, csec, orgResource);
    const url = `${orgResource}/api/data/v9.2${path}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });

    if (!res.ok) {
      throw new Error(`Dataverse API error: HTTP ${res.status} for ${path}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  protected override async performHealthCheck(): Promise<void> {
    const orgUrl = process.env["DATAVERSE_ORG_URL"]!;
    await this.dataverseFetch(orgUrl, "/WhoAmI");
  }

  async testConnection(
    orgUrl?: string,
    tenantId?: string,
    clientId?: string,
    clientSecret?: string,
  ): Promise<DataverseConnectionStatus> {
    if (!this.isLive && !orgUrl) return { connected: false };
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    try {
      await this.dataverseFetch(url, "/WhoAmI", tenantId, clientId, clientSecret);
      return { connected: true, orgUrl: url, ...(tenantId ?? process.env["DATAVERSE_TENANT_ID"] ? { tenantId: tenantId ?? process.env["DATAVERSE_TENANT_ID"]! } : {}) };
    } catch (err) {
      return {
        connected: false,
        orgUrl: url,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async listAccounts(orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<DataverseAccount[]> {
    if (!this.isLive && !orgUrl) return MOCK_ACCOUNTS;
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const data = await this.dataverseFetch(
      url,
      "/accounts?$select=accountid,name,accountnumber,primarycontactid,telephone1,emailaddress1,websiteurl,revenue,numberofemployees,statecode,createdon,modifiedon&$top=100",
      tenantId, clientId, clientSecret,
    ) as { value: Array<Record<string, unknown>> };
    return (data.value ?? []).map(r => ({
      id: String(r.accountid ?? ""),
      name: String(r.name ?? ""),
      accountNumber: r.accountnumber ? String(r.accountnumber) : undefined,
      telephone1: r.telephone1 ? String(r.telephone1) : undefined,
      emailAddress1: r.emailaddress1 ? String(r.emailaddress1) : undefined,
      websiteUrl: r.websiteurl ? String(r.websiteurl) : undefined,
      revenue: r.revenue ? Number(r.revenue) : undefined,
      numberofemployees: r.numberofemployees ? Number(r.numberofemployees) : undefined,
      statecode: Number(r.statecode ?? 0),
      createdOn: String(r.createdon ?? new Date().toISOString()),
      modifiedOn: String(r.modifiedon ?? new Date().toISOString()),
    }));
  }

  async getAccount(accountId: string, orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<DataverseAccount | null> {
    if (!this.isLive && !orgUrl) return MOCK_ACCOUNTS.find(a => a.id === accountId) ?? null;
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const data = await this.dataverseFetch(url, `/accounts(${accountId})`, tenantId, clientId, clientSecret) as Record<string, unknown>;
    return {
      id: String(data.accountid ?? accountId),
      name: String(data.name ?? ""),
      accountNumber: data.accountnumber ? String(data.accountnumber) : undefined,
      telephone1: data.telephone1 ? String(data.telephone1) : undefined,
      emailAddress1: data.emailaddress1 ? String(data.emailaddress1) : undefined,
      websiteUrl: data.websiteurl ? String(data.websiteurl) : undefined,
      revenue: data.revenue ? Number(data.revenue) : undefined,
      numberofemployees: data.numberofemployees ? Number(data.numberofemployees) : undefined,
      statecode: Number(data.statecode ?? 0),
      createdOn: String(data.createdon ?? new Date().toISOString()),
      modifiedOn: String(data.modifiedon ?? new Date().toISOString()),
    };
  }

  async listContacts(orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<DataverseContact[]> {
    if (!this.isLive && !orgUrl) return MOCK_CONTACTS;
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const data = await this.dataverseFetch(
      url,
      "/contacts?$select=contactid,fullname,firstname,lastname,emailaddress1,telephone1,jobtitle,_parentcustomerid_value,statecode,createdon,modifiedon&$top=100",
      tenantId, clientId, clientSecret,
    ) as { value: Array<Record<string, unknown>> };
    return (data.value ?? []).map(r => ({
      id: String(r.contactid ?? ""),
      fullName: String(r.fullname ?? ""),
      firstName: r.firstname ? String(r.firstname) : undefined,
      lastName: r.lastname ? String(r.lastname) : undefined,
      emailAddress1: r.emailaddress1 ? String(r.emailaddress1) : undefined,
      telephone1: r.telephone1 ? String(r.telephone1) : undefined,
      jobTitle: r.jobtitle ? String(r.jobtitle) : undefined,
      accountId: r["_parentcustomerid_value"] ? String(r["_parentcustomerid_value"]) : undefined,
      statecode: Number(r.statecode ?? 0),
      createdOn: String(r.createdon ?? new Date().toISOString()),
      modifiedOn: String(r.modifiedon ?? new Date().toISOString()),
    }));
  }

  async getContact(contactId: string, orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<DataverseContact | null> {
    if (!this.isLive && !orgUrl) return MOCK_CONTACTS.find(c => c.id === contactId) ?? null;
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const data = await this.dataverseFetch(url, `/contacts(${contactId})`, tenantId, clientId, clientSecret) as Record<string, unknown>;
    return {
      id: String(data.contactid ?? contactId),
      fullName: String(data.fullname ?? ""),
      firstName: data.firstname ? String(data.firstname) : undefined,
      lastName: data.lastname ? String(data.lastname) : undefined,
      emailAddress1: data.emailaddress1 ? String(data.emailaddress1) : undefined,
      telephone1: data.telephone1 ? String(data.telephone1) : undefined,
      jobTitle: data.jobtitle ? String(data.jobtitle) : undefined,
      accountId: data["_parentcustomerid_value"] ? String(data["_parentcustomerid_value"]) : undefined,
      statecode: Number(data.statecode ?? 0),
      createdOn: String(data.createdon ?? new Date().toISOString()),
      modifiedOn: String(data.modifiedon ?? new Date().toISOString()),
    };
  }

  async updateContact(contactId: string, patch: { firstName?: string; lastName?: string; emailAddress1?: string; telephone1?: string; jobTitle?: string }, orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<{ success: boolean }> {
    if (!this.isLive && !orgUrl) return { success: true };
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const body: Record<string, unknown> = {};
    if (patch.firstName !== undefined) body.firstname = patch.firstName;
    if (patch.lastName !== undefined) body.lastname = patch.lastName;
    if (patch.emailAddress1 !== undefined) body.emailaddress1 = patch.emailAddress1;
    if (patch.telephone1 !== undefined) body.telephone1 = patch.telephone1;
    if (patch.jobTitle !== undefined) body.jobtitle = patch.jobTitle;
    await this.dataverseFetch(url, `/contacts(${contactId})`, tenantId, clientId, clientSecret, { method: "PATCH", body: JSON.stringify(body) });
    return { success: true };
  }

  async deleteContact(contactId: string, orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<{ success: boolean }> {
    if (!this.isLive && !orgUrl) return { success: true };
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    await this.dataverseFetch(url, `/contacts(${contactId})`, tenantId, clientId, clientSecret, { method: "DELETE" });
    return { success: true };
  }

  async listLeads(orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<DataverseLead[]> {
    if (!this.isLive && !orgUrl) return MOCK_LEADS;
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const data = await this.dataverseFetch(
      url,
      "/leads?$select=leadid,fullname,firstname,lastname,companyname,emailaddress1,telephone1,subject,statecode,statuscode,estimatedvalue,estimatedclosedate,leadqualitycode,createdon,modifiedon&$top=100",
      tenantId, clientId, clientSecret,
    ) as { value: Array<Record<string, unknown>> };
    return (data.value ?? []).map(r => ({
      id: String(r.leadid ?? ""),
      fullName: String(r.fullname ?? ""),
      firstName: r.firstname ? String(r.firstname) : undefined,
      lastName: r.lastname ? String(r.lastname) : undefined,
      companyName: r.companyname ? String(r.companyname) : undefined,
      emailAddress1: r.emailaddress1 ? String(r.emailaddress1) : undefined,
      telephone1: r.telephone1 ? String(r.telephone1) : undefined,
      subject: r.subject ? String(r.subject) : undefined,
      statecode: Number(r.statecode ?? 0),
      statuscode: Number(r.statuscode ?? 1),
      estimatedvalue: r.estimatedvalue ? Number(r.estimatedvalue) : undefined,
      estimatedclosedate: r.estimatedclosedate ? String(r.estimatedclosedate) : undefined,
      leadqualitycode: r.leadqualitycode ? Number(r.leadqualitycode) : undefined,
      createdOn: String(r.createdon ?? new Date().toISOString()),
      modifiedOn: String(r.modifiedon ?? new Date().toISOString()),
    }));
  }

  async getLead(leadId: string, orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<DataverseLead | null> {
    if (!this.isLive && !orgUrl) return MOCK_LEADS.find(l => l.id === leadId) ?? null;
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const data = await this.dataverseFetch(url, `/leads(${leadId})`, tenantId, clientId, clientSecret) as Record<string, unknown>;
    return {
      id: String(data.leadid ?? leadId),
      fullName: String(data.fullname ?? ""),
      firstName: data.firstname ? String(data.firstname) : undefined,
      lastName: data.lastname ? String(data.lastname) : undefined,
      companyName: data.companyname ? String(data.companyname) : undefined,
      emailAddress1: data.emailaddress1 ? String(data.emailaddress1) : undefined,
      telephone1: data.telephone1 ? String(data.telephone1) : undefined,
      subject: data.subject ? String(data.subject) : undefined,
      statecode: Number(data.statecode ?? 0),
      statuscode: Number(data.statuscode ?? 1),
      estimatedvalue: data.estimatedvalue ? Number(data.estimatedvalue) : undefined,
      estimatedclosedate: data.estimatedclosedate ? String(data.estimatedclosedate) : undefined,
      leadqualitycode: data.leadqualitycode ? Number(data.leadqualitycode) : undefined,
      createdOn: String(data.createdon ?? new Date().toISOString()),
      modifiedOn: String(data.modifiedon ?? new Date().toISOString()),
    };
  }

  async updateLead(leadId: string, patch: { companyName?: string; emailAddress1?: string; telephone1?: string; subject?: string; estimatedvalue?: number; statuscode?: number }, orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<{ success: boolean }> {
    if (!this.isLive && !orgUrl) return { success: true };
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const body: Record<string, unknown> = {};
    if (patch.companyName !== undefined) body.companyname = patch.companyName;
    if (patch.emailAddress1 !== undefined) body.emailaddress1 = patch.emailAddress1;
    if (patch.telephone1 !== undefined) body.telephone1 = patch.telephone1;
    if (patch.subject !== undefined) body.subject = patch.subject;
    if (patch.estimatedvalue !== undefined) body.estimatedvalue = patch.estimatedvalue;
    if (patch.statuscode !== undefined) body.statuscode = patch.statuscode;
    await this.dataverseFetch(url, `/leads(${leadId})`, tenantId, clientId, clientSecret, { method: "PATCH", body: JSON.stringify(body) });
    return { success: true };
  }

  async deleteLead(leadId: string, orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<{ success: boolean }> {
    if (!this.isLive && !orgUrl) return { success: true };
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    await this.dataverseFetch(url, `/leads(${leadId})`, tenantId, clientId, clientSecret, { method: "DELETE" });
    return { success: true };
  }

  async listOpportunities(orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<DataverseOpportunity[]> {
    if (!this.isLive && !orgUrl) return MOCK_OPPORTUNITIES;
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const data = await this.dataverseFetch(
      url,
      "/opportunities?$select=opportunityid,name,_parentaccountid_value,_parentcontactid_value,estimatedvalue,estimatedclosedate,statecode,statuscode,stepname,probability,closeprobability,description,createdon,modifiedon&$top=100",
      tenantId, clientId, clientSecret,
    ) as { value: Array<Record<string, unknown>> };
    return (data.value ?? []).map(r => ({
      id: String(r.opportunityid ?? ""),
      name: String(r.name ?? ""),
      accountId: r["_parentaccountid_value"] ? String(r["_parentaccountid_value"]) : undefined,
      contactId: r["_parentcontactid_value"] ? String(r["_parentcontactid_value"]) : undefined,
      estimatedvalue: r.estimatedvalue ? Number(r.estimatedvalue) : undefined,
      estimatedclosedate: r.estimatedclosedate ? String(r.estimatedclosedate) : undefined,
      statecode: Number(r.statecode ?? 0),
      statuscode: Number(r.statuscode ?? 1),
      stepname: r.stepname ? String(r.stepname) : undefined,
      probability: r.probability ? Number(r.probability) : undefined,
      closeprobability: r.closeprobability ? Number(r.closeprobability) : undefined,
      description: r.description ? String(r.description) : undefined,
      createdOn: String(r.createdon ?? new Date().toISOString()),
      modifiedOn: String(r.modifiedon ?? new Date().toISOString()),
    }));
  }

  async getOpportunity(opportunityId: string, orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<DataverseOpportunity | null> {
    if (!this.isLive && !orgUrl) return MOCK_OPPORTUNITIES.find(o => o.id === opportunityId) ?? null;
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const data = await this.dataverseFetch(url, `/opportunities(${opportunityId})`, tenantId, clientId, clientSecret) as Record<string, unknown>;
    return {
      id: String(data.opportunityid ?? opportunityId),
      name: String(data.name ?? ""),
      accountId: data["_parentaccountid_value"] ? String(data["_parentaccountid_value"]) : undefined,
      contactId: data["_parentcontactid_value"] ? String(data["_parentcontactid_value"]) : undefined,
      estimatedvalue: data.estimatedvalue ? Number(data.estimatedvalue) : undefined,
      estimatedclosedate: data.estimatedclosedate ? String(data.estimatedclosedate) : undefined,
      statecode: Number(data.statecode ?? 0),
      statuscode: Number(data.statuscode ?? 1),
      stepname: data.stepname ? String(data.stepname) : undefined,
      probability: data.probability ? Number(data.probability) : undefined,
      closeprobability: data.closeprobability ? Number(data.closeprobability) : undefined,
      description: data.description ? String(data.description) : undefined,
      createdOn: String(data.createdon ?? new Date().toISOString()),
      modifiedOn: String(data.modifiedon ?? new Date().toISOString()),
    };
  }

  async updateOpportunity(opportunityId: string, patch: { name?: string; estimatedvalue?: number; estimatedclosedate?: string; stepname?: string; probability?: number; description?: string }, orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<{ success: boolean }> {
    if (!this.isLive && !orgUrl) return { success: true };
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.name = patch.name;
    if (patch.estimatedvalue !== undefined) body.estimatedvalue = patch.estimatedvalue;
    if (patch.estimatedclosedate !== undefined) body.estimatedclosedate = patch.estimatedclosedate;
    if (patch.stepname !== undefined) body.stepname = patch.stepname;
    if (patch.probability !== undefined) body.probability = patch.probability;
    if (patch.description !== undefined) body.description = patch.description;
    await this.dataverseFetch(url, `/opportunities(${opportunityId})`, tenantId, clientId, clientSecret, { method: "PATCH", body: JSON.stringify(body) });
    return { success: true };
  }

  async deleteOpportunity(opportunityId: string, orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<{ success: boolean }> {
    if (!this.isLive && !orgUrl) return { success: true };
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    await this.dataverseFetch(url, `/opportunities(${opportunityId})`, tenantId, clientId, clientSecret, { method: "DELETE" });
    return { success: true };
  }

  async listActivities(orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<DataverseActivity[]> {
    if (!this.isLive && !orgUrl) return MOCK_ACTIVITIES;
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const data = await this.dataverseFetch(
      url,
      "/activitypointers?$select=activityid,subject,activitytypecode,_regardingobjectid_value,scheduledstart,scheduledend,statecode,statuscode,description,createdon,modifiedon&$top=100",
      tenantId, clientId, clientSecret,
    ) as { value: Array<Record<string, unknown>> };
    return (data.value ?? []).map(r => ({
      id: String(r.activityid ?? ""),
      subject: String(r.subject ?? ""),
      activityType: String(r.activitytypecode ?? ""),
      regardingObjectId: r["_regardingobjectid_value"] ? String(r["_regardingobjectid_value"]) : undefined,
      scheduledstart: r.scheduledstart ? String(r.scheduledstart) : undefined,
      scheduledend: r.scheduledend ? String(r.scheduledend) : undefined,
      statecode: Number(r.statecode ?? 0),
      statuscode: Number(r.statuscode ?? 1),
      description: r.description ? String(r.description) : undefined,
      createdOn: String(r.createdon ?? new Date().toISOString()),
      modifiedOn: String(r.modifiedon ?? new Date().toISOString()),
    }));
  }

  async getActivity(activityId: string, activityType: string, orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<DataverseActivity | null> {
    if (!this.isLive && !orgUrl) return MOCK_ACTIVITIES.find(a => a.id === activityId) ?? null;
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const entitySet = activityType === "phonecall" ? "phonecalls" : activityType === "email" ? "emails" : activityType === "appointment" ? "appointments" : "tasks";
    const data = await this.dataverseFetch(url, `/${entitySet}(${activityId})`, tenantId, clientId, clientSecret) as Record<string, unknown>;
    return {
      id: String(data.activityid ?? activityId),
      subject: String(data.subject ?? ""),
      activityType,
      regardingObjectId: data["_regardingobjectid_value"] ? String(data["_regardingobjectid_value"]) : undefined,
      scheduledstart: data.scheduledstart ? String(data.scheduledstart) : undefined,
      scheduledend: data.scheduledend ? String(data.scheduledend) : undefined,
      statecode: Number(data.statecode ?? 0),
      statuscode: Number(data.statuscode ?? 1),
      description: data.description ? String(data.description) : undefined,
      createdOn: String(data.createdon ?? new Date().toISOString()),
      modifiedOn: String(data.modifiedon ?? new Date().toISOString()),
    };
  }

  async updateActivity(activityId: string, activityType: string, patch: { subject?: string; description?: string; scheduledstart?: string; scheduledend?: string; statuscode?: number }, orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<{ success: boolean }> {
    if (!this.isLive && !orgUrl) return { success: true };
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const entitySet = activityType === "phonecall" ? "phonecalls" : activityType === "email" ? "emails" : activityType === "appointment" ? "appointments" : "tasks";
    const body: Record<string, unknown> = {};
    if (patch.subject !== undefined) body.subject = patch.subject;
    if (patch.description !== undefined) body.description = patch.description;
    if (patch.scheduledstart !== undefined) body.scheduledstart = patch.scheduledstart;
    if (patch.scheduledend !== undefined) body.scheduledend = patch.scheduledend;
    if (patch.statuscode !== undefined) body.statuscode = patch.statuscode;
    await this.dataverseFetch(url, `/${entitySet}(${activityId})`, tenantId, clientId, clientSecret, { method: "PATCH", body: JSON.stringify(body) });
    return { success: true };
  }

  async deleteActivity(activityId: string, activityType: string, orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<{ success: boolean }> {
    if (!this.isLive && !orgUrl) return { success: true };
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const entitySet = activityType === "phonecall" ? "phonecalls" : activityType === "email" ? "emails" : activityType === "appointment" ? "appointments" : "tasks";
    await this.dataverseFetch(url, `/${entitySet}(${activityId})`, tenantId, clientId, clientSecret, { method: "DELETE" });
    return { success: true };
  }

  async createContact(
    data: { firstName: string; lastName: string; emailAddress1?: string; telephone1?: string; jobTitle?: string; accountId?: string },
    orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string,
  ): Promise<{ id: string; success: boolean }> {
    if (!this.isLive && !orgUrl) return { id: `mock-contact-${Date.now()}`, success: true };
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    try {
      const body: Record<string, unknown> = {
        firstname: data.firstName,
        lastname: data.lastName,
        emailaddress1: data.emailAddress1 ?? "",
        telephone1: data.telephone1 ?? "",
        jobtitle: data.jobTitle ?? "",
      };
      if (data.accountId) {
        body["parentcustomerid_account@odata.bind"] = `/accounts(${data.accountId})`;
      }
      const res = await this.dataverseFetch(url, "/contacts", tenantId, clientId, clientSecret, {
        method: "POST",
        body: JSON.stringify(body),
      }) as Record<string, unknown> | null;
      return { id: String(res?.contactid ?? `created-${Date.now()}`), success: true };
    } catch (err) {
      throw new Error(`Failed to create Dataverse contact: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async createLead(
    data: {
      firstName: string;
      lastName: string;
      companyName?: string;
      emailAddress1?: string;
      subject?: string;
      estimatedvalue?: number;
    },
    orgUrl?: string,
    tenantId?: string,
    clientId?: string,
    clientSecret?: string,
  ): Promise<{ id: string; success: boolean }> {
    if (!this.isLive && !orgUrl) {
      return { id: `mock-lead-${Date.now()}`, success: true };
    }
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    try {
      const res = await this.dataverseFetch(url, "/leads", tenantId, clientId, clientSecret, {
        method: "POST",
        body: JSON.stringify({
          firstname: data.firstName,
          lastname: data.lastName,
          companyname: data.companyName ?? "",
          emailaddress1: data.emailAddress1 ?? "",
          subject: data.subject ?? `Lead: ${data.firstName} ${data.lastName}`,
          estimatedvalue: data.estimatedvalue,
        }),
      }) as Record<string, unknown> | null;
      const id = String(res?.leadid ?? `created-${Date.now()}`);
      return { id, success: true };
    } catch (err) {
      throw new Error(`Failed to create Dataverse lead: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async updateOpportunityStage(
    opportunityId: string,
    stageName: string,
    orgUrl?: string,
    tenantId?: string,
    clientId?: string,
    clientSecret?: string,
  ): Promise<{ success: boolean }> {
    if (!this.isLive && !orgUrl) {
      return { success: true };
    }
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    try {
      await this.dataverseFetch(url, `/opportunities(${opportunityId})`, tenantId, clientId, clientSecret, {
        method: "PATCH",
        body: JSON.stringify({ stepname: stageName }),
      });
      return { success: true };
    } catch (err) {
      throw new Error(`Failed to update opportunity stage: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async createActivity(
    data: {
      subject: string;
      activityType: "phonecall" | "email" | "task" | "appointment";
      regardingObjectId?: string;
      regardingObjectType?: string;
      description?: string;
      scheduledstart?: string;
    },
    orgUrl?: string,
    tenantId?: string,
    clientId?: string,
    clientSecret?: string,
  ): Promise<{ id: string; success: boolean }> {
    if (!this.isLive && !orgUrl) {
      return { id: `mock-activity-${Date.now()}`, success: true };
    }
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    const entityPath = data.activityType === "phonecall" ? "/phonecalls"
      : data.activityType === "email" ? "/emails"
      : data.activityType === "appointment" ? "/appointments"
      : "/tasks";
    try {
      const body: Record<string, unknown> = {
        subject: data.subject,
        description: data.description,
        scheduledstart: data.scheduledstart,
      };
      if (data.regardingObjectId && data.regardingObjectType) {
        body["regardingobjectid_opportunity@odata.bind"] = `/opportunities(${data.regardingObjectId})`;
      }
      const res = await this.dataverseFetch(url, entityPath, tenantId, clientId, clientSecret, {
        method: "POST",
        body: JSON.stringify(body),
      }) as Record<string, unknown> | null;
      const id = String(res?.activityid ?? `created-${Date.now()}`);
      return { id, success: true };
    } catch (err) {
      throw new Error(`Failed to create Dataverse activity: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async logNote(
    regardingObjectId: string,
    regardingObjectType: string,
    noteText: string,
    orgUrl?: string,
    tenantId?: string,
    clientId?: string,
    clientSecret?: string,
  ): Promise<{ id: string; success: boolean }> {
    if (!this.isLive && !orgUrl) {
      return { id: `mock-note-${Date.now()}`, success: true };
    }
    const url = orgUrl ?? process.env["DATAVERSE_ORG_URL"]!;
    try {
      const res = await this.dataverseFetch(url, "/annotations", tenantId, clientId, clientSecret, {
        method: "POST",
        body: JSON.stringify({
          notetext: noteText,
          [`objectid_${regardingObjectType}@odata.bind`]: `/${regardingObjectType}s(${regardingObjectId})`,
        }),
      }) as Record<string, unknown> | null;
      const id = String(res?.annotationid ?? `created-${Date.now()}`);
      return { id, success: true };
    } catch (err) {
      throw new Error(`Failed to log note in Dataverse: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async generateLyteSignals(
    orgUrl?: string,
    tenantId?: string,
    clientId?: string,
    clientSecret?: string,
  ): Promise<DataverseLyteSignal[]> {
    const signals: DataverseLyteSignal[] = [];
    const url = orgUrl ?? (this.isLive ? process.env["DATAVERSE_ORG_URL"]! : "mock");
    const tid = tenantId ?? process.env["DATAVERSE_TENANT_ID"] ?? "mock-tenant";

    const opportunities = await this.listOpportunities(orgUrl, tenantId, clientId, clientSecret);
    const now = new Date();

    for (const opp of opportunities) {
      if (opp.estimatedclosedate) {
        const closeDate = new Date(opp.estimatedclosedate);
        const daysUntilClose = (closeDate.getTime() - now.getTime()) / 86400000;

        if (opp.statecode === 0 && daysUntilClose < 0) {
          signals.push({
            id: `sig-overdue-${opp.id}`,
            type: "stale_opportunity",
            title: `Overdue opportunity: ${opp.name}`,
            description: `Opportunity "${opp.name}" has a close date of ${opp.estimatedclosedate} which is ${Math.abs(Math.round(daysUntilClose))} days overdue and is still open.`,
            severity: "high",
            entityType: "opportunity",
            entityId: opp.id,
            entityName: opp.name,
            orgUrl: url,
            tenantId: tid,
            detectedAt: now.toISOString(),
            metadata: {
              estimatedvalue: opp.estimatedvalue,
              stepname: opp.stepname,
              probability: opp.probability,
              daysOverdue: Math.abs(Math.round(daysUntilClose)),
            },
          });
        }

        if (opp.statecode === 0 && daysUntilClose < 7 && daysUntilClose >= 0 && (opp.probability ?? 0) < 30) {
          signals.push({
            id: `sig-pipeline-${opp.id}`,
            type: "pipeline_anomaly",
            title: `Low-probability deal closing soon: ${opp.name}`,
            description: `Opportunity "${opp.name}" is closing in ${Math.round(daysUntilClose)} days but has only ${opp.probability}% probability. Review for realistic close date.`,
            severity: "medium",
            entityType: "opportunity",
            entityId: opp.id,
            entityName: opp.name,
            orgUrl: url,
            tenantId: tid,
            detectedAt: now.toISOString(),
            metadata: {
              estimatedvalue: opp.estimatedvalue,
              probability: opp.probability,
              daysUntilClose: Math.round(daysUntilClose),
            },
          });
        }
      }

      if (opp.statecode === 0 && !opp.stepname) {
        signals.push({
          id: `sig-stage-${opp.id}`,
          type: "deal_stage_conflict",
          title: `Opportunity missing stage: ${opp.name}`,
          description: `Opportunity "${opp.name}" is active but has no sales stage assigned. This blocks pipeline reporting accuracy.`,
          severity: "low",
          entityType: "opportunity",
          entityId: opp.id,
          entityName: opp.name,
          orgUrl: url,
          tenantId: tid,
          detectedAt: now.toISOString(),
          metadata: { estimatedvalue: opp.estimatedvalue },
        });
      }
    }

    const leads = await this.listLeads(orgUrl, tenantId, clientId, clientSecret);
    for (const lead of leads) {
      if (lead.statecode === 0 && (lead.estimatedvalue ?? 0) > 100000) {
        signals.push({
          id: `sig-lead-${lead.id}`,
          type: "high_value_lead",
          title: `High-value lead: ${lead.fullName}`,
          description: `Lead from ${lead.companyName ?? "unknown company"} with estimated value $${(lead.estimatedvalue ?? 0).toLocaleString()} — requires priority attention.`,
          severity: "medium",
          entityType: "lead",
          entityId: lead.id,
          entityName: lead.fullName,
          orgUrl: url,
          tenantId: tid,
          detectedAt: now.toISOString(),
          metadata: {
            companyName: lead.companyName,
            estimatedvalue: lead.estimatedvalue,
            subject: lead.subject,
          },
        });
      }
    }

    return signals;
  }

  async sync(orgUrl?: string, tenantId?: string, clientId?: string, clientSecret?: string): Promise<DataverseSyncResult[]> {
    const [accounts, contacts, leads, opportunities, activities] = await Promise.all([
      this.listAccounts(orgUrl, tenantId, clientId, clientSecret),
      this.listContacts(orgUrl, tenantId, clientId, clientSecret),
      this.listLeads(orgUrl, tenantId, clientId, clientSecret),
      this.listOpportunities(orgUrl, tenantId, clientId, clientSecret),
      this.listActivities(orgUrl, tenantId, clientId, clientSecret),
    ]);

    const timestamp = new Date().toISOString();
    return [
      { entity: "accounts", count: accounts.length, errors: 0, timestamp },
      { entity: "contacts", count: contacts.length, errors: 0, timestamp },
      { entity: "leads", count: leads.length, errors: 0, timestamp },
      { entity: "opportunities", count: opportunities.length, errors: 0, timestamp },
      { entity: "activities", count: activities.length, errors: 0, timestamp },
    ];
  }
}
