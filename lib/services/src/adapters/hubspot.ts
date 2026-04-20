/**
 * [STUB] HubSpot CRM Adapter
 *
 * Status: Hybrid stub — returns hard-coded mock data until HUBSPOT_ACCESS_TOKEN
 * is set in the environment.  When live, `testConnection()` calls the real
 * HubSpot API, but `listContacts()` and `listDeals()` always return mock data
 * regardless of the `isLive` flag (TODO: replace the mock returns with real
 * HubSpot API calls once the prod token is provisioned).
 *
 * Activation:
 *   1. Create a Private App in your HubSpot portal.
 *   2. Set HUBSPOT_ACCESS_TOKEN=<token> in the environment / Replit secrets.
 *   3. Replace the `return [...MOCK_CONTACTS]` / `return [...MOCK_DEALS]` lines
 *      in `listContacts()` and `listDeals()` with real `hsRequest()` calls.
 *
 * Tracking: docs/audit/2026-04/mock-and-gap-report.md § HubSpot
 */
import { ServiceAdapter } from '../base.js';

export interface HubSpotContact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  lifecycleStage: string;
  lastActivity: string;
}

export interface HubSpotDeal {
  id: string;
  name: string;
  stage: string;
  amount: number;
  closeDate: string;
  contactId: string;
}

const MOCK_CONTACTS: HubSpotContact[] = [
  {
    id: 'hs_001',
    email: 'john.smith@acme.com',
    firstName: 'John',
    lastName: 'Smith',
    company: 'ACME Corp',
    lifecycleStage: 'customer',
    lastActivity: '2026-03-24T10:00:00Z',
  },
  {
    id: 'hs_002',
    email: 'jane.doe@globex.com',
    firstName: 'Jane',
    lastName: 'Doe',
    company: 'Globex Inc',
    lifecycleStage: 'lead',
    lastActivity: '2026-03-22T14:00:00Z',
  },
];

const MOCK_DEALS: HubSpotDeal[] = [
  {
    id: 'deal_001',
    name: 'Enterprise License - ACME',
    stage: 'contractsent',
    amount: 75000,
    closeDate: '2026-04-15',
    contactId: 'hs_001',
  },
  {
    id: 'deal_002',
    name: 'Platform Onboarding - Globex',
    stage: 'qualifiedtobuy',
    amount: 25000,
    closeDate: '2026-05-01',
    contactId: 'hs_002',
  },
];

export class HubSpotAdapter extends ServiceAdapter {
  readonly name = 'hubspot';
  readonly description = 'HubSpot CRM contacts, deals, and pipelines';
  readonly requiredEnvVars = ['HUBSPOT_ACCESS_TOKEN'];

  private get accessToken(): string | undefined {
    return process.env['HUBSPOT_ACCESS_TOKEN'];
  }

  private async hsRequest(path: string): Promise<unknown> {
    const response = await fetch(`https://api.hubapi.com${path}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`HubSpot API error: ${response.status}`);
    return response.json();
  }

  protected async performHealthCheck(): Promise<void> {
    const result = await this.testConnection();
    if (!result.connected) throw new Error('HubSpot connection verification failed');
  }

  async testConnection(): Promise<{ connected: boolean; portalId?: string }> {
    if (!this.isLive) return { connected: false };
    try {
      const data = (await this.hsRequest('/account-info/v3/details')) as { portalId: number };
      return { connected: true, portalId: String(data.portalId) };
    } catch {
      return { connected: false };
    }
  }

  async listContacts(): Promise<HubSpotContact[]> {
    if (!this.isLive) return [...MOCK_CONTACTS];
    return [...MOCK_CONTACTS];
  }

  async listDeals(): Promise<HubSpotDeal[]> {
    if (!this.isLive) return [...MOCK_DEALS];
    return [...MOCK_DEALS];
  }

  async sync(): Promise<{ synced: number; timestamp: string }> {
    const contacts = await this.listContacts();
    const deals = await this.listDeals();
    return { synced: contacts.length + deals.length, timestamp: new Date().toISOString() };
  }
}
