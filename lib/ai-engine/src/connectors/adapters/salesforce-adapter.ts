import { getEnv } from '@szl-holdings/env';
import { type ConnectorAuthConfig, type ConnectorRateLimitConfig, type ConnectorToolDefinition, BaseConnectorAdapter } from '../connector-interface.js';

export class SalesforceConnectorAdapter extends BaseConnectorAdapter {
  connectorId = 'salesforce';
  displayName = 'Salesforce CRM';
  description = 'Salesforce CRM — query accounts, create leads, manage opportunities';
  category = 'crm' as const;
  vendor = 'Salesforce';
  version = '1.0.0';
  docsUrl = 'https://developer.salesforce.com/docs/apis';

  authConfig: ConnectorAuthConfig = {
    type: 'bearer',
    envVarNames: ['SALESFORCE_ACCESS_TOKEN', 'SALESFORCE_INSTANCE_URL'],
  };

  rateLimit: ConnectorRateLimitConfig = {
    requestsPerMinute: 100,
    requestsPerDay: 100000,
  };

  tools: ConnectorToolDefinition[] = [
    {
      name: 'query_soql',
      description: 'Run a SOQL query against Salesforce',
      inputSchema: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: { records: { type: 'array' }, totalSize: { type: 'number' } },
      },
      costEstimate: 'free',
    },
    {
      name: 'create_record',
      description: 'Create a Salesforce record (Lead, Account, Opportunity, Case, etc.)',
      inputSchema: {
        type: 'object',
        required: ['objectType', 'fields'],
        properties: {
          objectType: { type: 'string' },
          fields: { type: 'object' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: { id: { type: 'string' }, success: { type: 'boolean' } },
      },
      costEstimate: 'free',
    },
    {
      name: 'update_record',
      description: 'Update a Salesforce record by ID',
      inputSchema: {
        type: 'object',
        required: ['objectType', 'recordId', 'fields'],
        properties: {
          objectType: { type: 'string' },
          recordId: { type: 'string' },
          fields: { type: 'object' },
        },
      },
      outputSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
      costEstimate: 'free',
    },
  ];

  private get instanceUrl(): string {
    return getEnv().SALESFORCE_INSTANCE_URL ?? '';
  }

  async execute(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    const token = getEnv().SALESFORCE_ACCESS_TOKEN ?? '';
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    if (toolName === 'query_soql') {
      const params = new URLSearchParams({ q: input.query as string });
      const resp = await fetch(`${this.instanceUrl}/services/data/v57.0/query?${params}`, {
        headers,
      });
      const data = (await resp.json()) as { records: unknown[]; totalSize: number };
      return { records: data.records, totalSize: data.totalSize };
    }

    if (toolName === 'create_record') {
      const resp = await fetch(
        `${this.instanceUrl}/services/data/v57.0/sobjects/${input.objectType}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(input.fields),
        },
      );
      return resp.json();
    }

    if (toolName === 'update_record') {
      const resp = await fetch(
        `${this.instanceUrl}/services/data/v57.0/sobjects/${input.objectType}/${input.recordId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(input.fields),
        },
      );
      return { success: resp.ok };
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }
}
