import type { SourceConnector, ConnectionCheckResult, FieldDescriptor, ReadBatchResult } from '../connector-protocol';

const API_RESOURCE_SCHEMAS: Record<string, FieldDescriptor[]> = {
  'terra/deals': [
    { name: 'id', label: 'ID', type: 'uuid' },
    { name: 'name', label: 'Name', type: 'string', required: true },
    { name: 'stage', label: 'Stage', type: 'string' },
    { name: 'dealValue', label: 'Deal Value', type: 'number' },
    { name: 'propertyAddress', label: 'Property Address', type: 'string' },
    { name: 'closeDate', label: 'Close Date', type: 'date' },
    { name: 'status', label: 'Status', type: 'string' },
    { name: 'updatedAt', label: 'Updated At', type: 'datetime' },
  ],
  'vessels/positions': [
    { name: 'id', label: 'ID', type: 'uuid' },
    { name: 'vesselName', label: 'Vessel Name', type: 'string', required: true },
    { name: 'imo', label: 'IMO Number', type: 'string' },
    { name: 'mmsi', label: 'MMSI', type: 'string' },
    { name: 'lat', label: 'Latitude', type: 'number' },
    { name: 'lng', label: 'Longitude', type: 'number' },
    { name: 'status', label: 'Status', type: 'string' },
    { name: 'updatedAt', label: 'Updated At', type: 'datetime' },
  ],
  'vessels/alerts': [
    { name: 'id', label: 'ID', type: 'uuid' },
    { name: 'vesselName', label: 'Vessel Name', type: 'string' },
    { name: 'alertType', label: 'Alert Type', type: 'string' },
    { name: 'severity', label: 'Severity', type: 'string' },
    { name: 'message', label: 'Message', type: 'string' },
    { name: 'createdAt', label: 'Created At', type: 'datetime' },
  ],
  'counsel/matters': [
    { name: 'id', label: 'ID', type: 'uuid' },
    { name: 'name', label: 'Name', type: 'string', required: true },
    { name: 'matterNumber', label: 'Matter Number', type: 'string' },
    { name: 'status', label: 'Status', type: 'string' },
    { name: 'leadCounsel', label: 'Lead Counsel', type: 'string' },
    { name: 'practiceArea', label: 'Practice Area', type: 'string' },
    { name: 'updatedAt', label: 'Updated At', type: 'datetime' },
  ],
};

interface FetchResult {
  ok: boolean;
  status: number;
  data: Record<string, unknown>[];
}

async function fetchInternalApi(resource: string, params?: Record<string, string>): Promise<FetchResult> {
  const port = process.env.PORT || '3000';
  const baseUrl = `http://localhost:${port}/api`;
  const url = new URL(`${baseUrl}/${resource}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ok: false, status: res.status, data: [] };
    }

    const body = await res.json() as unknown;
    let data: Record<string, unknown>[] = [];
    if (Array.isArray(body)) data = body;
    else if (body && typeof body === 'object' && Array.isArray((body as Record<string, unknown>).data)) data = (body as Record<string, unknown>).data as Record<string, unknown>[];
    else if (body && typeof body === 'object' && Array.isArray((body as Record<string, unknown>).items)) data = (body as Record<string, unknown>).items as Record<string, unknown>[];

    return { ok: true, status: res.status, data };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

const ALLOWED_RESOURCES = new Set(Object.keys(API_RESOURCE_SCHEMAS));

function validateResource(resource: string): string {
  const cleaned = resource.trim().replace(/^\/+|\/+$/g, '');
  if (!ALLOWED_RESOURCES.has(cleaned)) {
    throw new Error(`Resource "${cleaned}" is not in the allowlist. Allowed: ${[...ALLOWED_RESOURCES].join(', ')}`);
  }
  return cleaned;
}

export const internalApiSource: SourceConnector = {
  type: 'api_resource',

  async checkConnection(config: Record<string, unknown>): Promise<ConnectionCheckResult> {
    const start = Date.now();
    const rawResource = (config.resource as string) || 'terra/deals';
    let resource: string;
    try {
      resource = validateResource(rawResource);
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Invalid resource',
        latencyMs: Date.now() - start,
      };
    }
    try {
      const result = await fetchInternalApi(resource, { limit: '1' });
      if (!result.ok) {
        return {
          success: false,
          message: `Internal API returned HTTP ${result.status} for ${resource}`,
          latencyMs: Date.now() - start,
        };
      }
      return {
        success: true,
        message: `Internal API reachable (${resource}), returned ${result.data.length} records`,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Internal API unreachable',
        latencyMs: Date.now() - start,
      };
    }
  },

  async discover(config: Record<string, unknown>): Promise<{ fields: FieldDescriptor[] }> {
    const resource = validateResource((config.resource as string) || 'terra/deals');
    const schema = API_RESOURCE_SCHEMAS[resource];
    if (schema) return { fields: schema };

    try {
      const result = await fetchInternalApi(resource, { limit: '1' });
      if (result.ok && result.data.length > 0) {
        const firstRow = result.data[0];
        return {
          fields: Object.keys(firstRow).map(k => ({
            name: k,
            label: k,
            type: typeof firstRow[k] === 'number' ? 'number' : 'string',
          })),
        };
      }
    } catch { /* fall through */ }
    return { fields: [] };
  },

  async previewRows(config: Record<string, unknown>, limit = 10): Promise<{ fields: string[]; rows: Array<Record<string, unknown>>; totalRows: number }> {
    const resource = validateResource((config.resource as string) || 'terra/deals');
    try {
      const result = await fetchInternalApi(resource, { limit: String(limit) });
      if (!result.ok) {
        return { fields: API_RESOURCE_SCHEMAS[resource]?.map(f => f.name) ?? [], rows: [], totalRows: 0 };
      }
      const fields = result.data.length > 0 ? Object.keys(result.data[0]) : (API_RESOURCE_SCHEMAS[resource]?.map(f => f.name) ?? []);
      return { fields, rows: result.data.slice(0, limit), totalRows: result.data.length };
    } catch {
      return { fields: API_RESOURCE_SCHEMAS[resource]?.map(f => f.name) ?? [], rows: [], totalRows: 0 };
    }
  },

  async readBatch(config: Record<string, unknown>, options: {
    batchSize: number;
    cursor?: string | null;
    fullRefresh?: boolean;
  }): Promise<ReadBatchResult> {
    const resource = validateResource((config.resource as string) || 'terra/deals');
    const params: Record<string, string> = { limit: String(options.batchSize + 1) };
    if (!options.fullRefresh && options.cursor) {
      params.after = options.cursor;
    }

    const result = await fetchInternalApi(resource, params);
    if (!result.ok) {
      throw new Error(`Internal API returned HTTP ${result.status}`);
    }

    const hasMore = result.data.length > options.batchSize;
    const batch = hasMore ? result.data.slice(0, options.batchSize) : result.data;
    const lastRow = batch[batch.length - 1];
    const newCursor = lastRow ? String(lastRow.id ?? lastRow.updatedAt ?? '') : options.cursor ?? null;

    return { rows: batch, cursor: newCursor, hasMore };
  },

  async readRowById(config: Record<string, unknown>, primaryKey: string, primaryKeyValue: string): Promise<Record<string, unknown> | null> {
    const resource = validateResource((config.resource as string) || 'terra/deals');
    try {
      const result = await fetchInternalApi(resource, { [primaryKey]: primaryKeyValue, limit: '100' });
      if (!result.ok || result.data.length === 0) return null;
      const match = result.data.find(row => String(row[primaryKey]) === primaryKeyValue);
      return match ?? null;
    } catch {
      return null;
    }
  },
};
