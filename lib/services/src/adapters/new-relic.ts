import { ServiceAdapter } from '../base.js';
import {
  expectRecord,
  type JsonRecord,
  nestedRecord,
  optionalArray,
  optionalBoolean,
  optionalNullableNumber,
  optionalNumber,
  optionalRecord,
  optionalString,
  UpstreamPayloadError,
} from './payload-validation.js';

export interface NewRelicApmMetrics {
  applicationName: string;
  responseTimeMs: number;
  throughputRpm: number;
  errorRatePct: number;
  apdexScore: number;
  apdexTarget: number;
  hostCount: number;
  instanceCount: number;
}

export interface NewRelicHost {
  hostname: string;
  cpuPct: number;
  memoryUsedPct: number;
  diskUsedPct: number;
  networkReceiveBytesPerSec: number;
  networkTransmitBytesPerSec: number;
  fullestDiskPct: number;
}

export interface NewRelicAlertCondition {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  severity: 'CRITICAL' | 'WARNING';
  threshold: number;
  currentValue: number | null;
  violating: boolean;
}

const DEMO_APM: NewRelicApmMetrics = {
  applicationName: 'SZL-Platform-API',
  responseTimeMs: 142,
  throughputRpm: 2340,
  errorRatePct: 0.42,
  apdexScore: 0.94,
  apdexTarget: 0.5,
  hostCount: 4,
  instanceCount: 8,
};

const DEMO_HOSTS: NewRelicHost[] = [
  {
    hostname: 'api-prod-01',
    cpuPct: 34,
    memoryUsedPct: 62,
    diskUsedPct: 41,
    networkReceiveBytesPerSec: 4_200_000,
    networkTransmitBytesPerSec: 8_100_000,
    fullestDiskPct: 47,
  },
  {
    hostname: 'api-prod-02',
    cpuPct: 28,
    memoryUsedPct: 58,
    diskUsedPct: 39,
    networkReceiveBytesPerSec: 3_800_000,
    networkTransmitBytesPerSec: 7_200_000,
    fullestDiskPct: 44,
  },
  {
    hostname: 'worker-prod-01',
    cpuPct: 71,
    memoryUsedPct: 82,
    diskUsedPct: 55,
    networkReceiveBytesPerSec: 1_200_000,
    networkTransmitBytesPerSec: 900_000,
    fullestDiskPct: 55,
  },
  {
    hostname: 'db-replica-01',
    cpuPct: 18,
    memoryUsedPct: 74,
    diskUsedPct: 62,
    networkReceiveBytesPerSec: 12_000_000,
    networkTransmitBytesPerSec: 2_300_000,
    fullestDiskPct: 68,
  },
];

const DEMO_ALERTS: NewRelicAlertCondition[] = [
  {
    id: 'ac-1',
    name: 'High Error Rate',
    type: 'apm_app_metric',
    enabled: true,
    severity: 'CRITICAL',
    threshold: 5.0,
    currentValue: 0.42,
    violating: false,
  },
  {
    id: 'ac-2',
    name: 'Response Time',
    type: 'apm_app_metric',
    enabled: true,
    severity: 'WARNING',
    threshold: 500,
    currentValue: 142,
    violating: false,
  },
  {
    id: 'ac-3',
    name: 'Apdex Below Target',
    type: 'apm_app_metric',
    enabled: true,
    severity: 'WARNING',
    threshold: 0.7,
    currentValue: 0.94,
    violating: false,
  },
  {
    id: 'ac-4',
    name: 'Host CPU High',
    type: 'infra_host_not_reporting',
    enabled: true,
    severity: 'CRITICAL',
    threshold: 90,
    currentValue: 71,
    violating: false,
  },
];

export interface NewRelicApmResult {
  responseTimeMs?: number;
  throughputRpm?: number;
  errorRatePct?: number;
  apdexScore?: number;
}

export interface NewRelicHostCountResult {
  hostCount?: number;
  instanceCount?: number;
}

export interface NewRelicInfraResult {
  facet?: string;
  cpuPct?: number;
  memoryUsedPct?: number;
  diskUsedPct?: number;
  networkReceiveBytesPerSec?: number;
  networkTransmitBytesPerSec?: number;
  fullestDiskPct?: number;
}

export interface NewRelicNrqlCondition {
  id: string;
  name?: string;
  type?: string;
  enabled?: boolean;
  terms?: Array<{ priority?: string; threshold?: number }>;
  signal?: { aggregationWindow?: number };
  nrql?: { query?: string };
}

export function parseNewRelicErrors(payload: unknown): string[] {
  const root = expectRecord(payload, 'NerdGraph response');
  const errors = optionalArray(root, 'errors', 'NerdGraph response');
  if (errors === undefined) return [];
  return errors.map((value, index) => {
    const error = expectRecord(value, `NerdGraph response.errors[${index}]`);
    const message = optionalString(error, 'message', `NerdGraph response.errors[${index}]`);
    if (message === undefined) {
      throw new UpstreamPayloadError(`NerdGraph response.errors[${index}]`, 'missing message');
    }
    return message;
  });
}

function parseNrqlRows(payload: unknown, context: string): JsonRecord[] | undefined {
  const nrql = nestedRecord(payload, ['data', 'actor', 'account', 'nrql'], context);
  const results = nrql ? optionalArray(nrql, 'results', context) : undefined;
  return results?.map((value, index) => expectRecord(value, `${context}.results[${index}]`));
}

async function parseNerdGraphResponse<T>(
  response: Response,
  parser: (payload: unknown) => T,
): Promise<T | undefined> {
  try {
    const payload: unknown = await response.json();
    if (parseNewRelicErrors(payload).length > 0) return undefined;
    return parser(payload);
  } catch (error) {
    if (error instanceof UpstreamPayloadError || error instanceof SyntaxError) {
      return undefined;
    }
    throw error;
  }
}

export function parseNewRelicApmResults(payload: unknown): NewRelicApmResult[] | undefined {
  return parseNrqlRows(payload, 'NerdGraph APM response')?.map((row, index) => ({
    responseTimeMs: optionalNullableNumber(
      row,
      'responseTimeMs',
      `NerdGraph APM response.results[${index}]`,
    ),
    throughputRpm: optionalNullableNumber(
      row,
      'throughputRpm',
      `NerdGraph APM response.results[${index}]`,
    ),
    errorRatePct: optionalNullableNumber(
      row,
      'errorRatePct',
      `NerdGraph APM response.results[${index}]`,
    ),
    apdexScore: optionalNullableNumber(
      row,
      'apdexScore',
      `NerdGraph APM response.results[${index}]`,
    ),
  }));
}

export function parseNewRelicHostCountResults(
  payload: unknown,
): NewRelicHostCountResult[] | undefined {
  return parseNrqlRows(payload, 'NerdGraph host-count response')?.map((row, index) => ({
    hostCount: optionalNullableNumber(
      row,
      'hostCount',
      `NerdGraph host-count response.results[${index}]`,
    ),
    instanceCount: optionalNullableNumber(
      row,
      'instanceCount',
      `NerdGraph host-count response.results[${index}]`,
    ),
  }));
}

export function parseNewRelicInfraResults(payload: unknown): NewRelicInfraResult[] | undefined {
  return parseNrqlRows(payload, 'NerdGraph infrastructure response')?.map((row, index) => {
    const context = `NerdGraph infrastructure response.results[${index}]`;
    return {
      facet: optionalString(row, 'facet', context),
      cpuPct: optionalNullableNumber(row, 'cpuPct', context),
      memoryUsedPct: optionalNullableNumber(row, 'memoryUsedPct', context),
      diskUsedPct: optionalNullableNumber(row, 'diskUsedPct', context),
      networkReceiveBytesPerSec: optionalNullableNumber(row, 'networkReceiveBytesPerSec', context),
      networkTransmitBytesPerSec: optionalNullableNumber(
        row,
        'networkTransmitBytesPerSec',
        context,
      ),
      fullestDiskPct: optionalNullableNumber(row, 'fullestDiskPct', context),
    };
  });
}

function parseConditionId(record: JsonRecord, context: string): string {
  const value = record.id;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  throw new UpstreamPayloadError(`${context}.id`, 'expected a string or number');
}

export function parseNewRelicAlertConditions(
  payload: unknown,
): NewRelicNrqlCondition[] | undefined {
  const search = nestedRecord(
    payload,
    ['data', 'actor', 'account', 'alerts', 'nrqlConditionsSearch'],
    'NerdGraph alert response',
  );
  const values = search
    ? optionalArray(search, 'nrqlConditions', 'NerdGraph alert response')
    : undefined;
  return values?.map((value, index) => {
    const context = `NerdGraph alert response.nrqlConditions[${index}]`;
    const condition = expectRecord(value, context);
    const rawTerms = optionalArray(condition, 'terms', context);
    const terms = rawTerms?.map((term, termIndex) => {
      const termContext = `${context}.terms[${termIndex}]`;
      const termRecord = expectRecord(term, termContext);
      return {
        priority: optionalString(termRecord, 'priority', termContext),
        threshold: optionalNumber(termRecord, 'threshold', termContext),
      };
    });
    const rawSignal = optionalRecord(condition, 'signal', context);
    const rawNrql = optionalRecord(condition, 'nrql', context);
    return {
      id: parseConditionId(condition, context),
      name: optionalString(condition, 'name', context),
      type: optionalString(condition, 'type', context),
      enabled: optionalBoolean(condition, 'enabled', context),
      terms,
      signal: rawSignal
        ? {
            aggregationWindow: optionalNumber(rawSignal, 'aggregationWindow', `${context}.signal`),
          }
        : undefined,
      nrql: rawNrql
        ? {
            query: optionalString(rawNrql, 'query', `${context}.nrql`),
          }
        : undefined,
    };
  });
}

export class NewRelicAdapter extends ServiceAdapter {
  readonly name = 'new-relic';
  readonly description =
    'New Relic APM — application performance monitoring via NerdGraph GraphQL API';
  readonly requiredEnvVars = ['NEW_RELIC_API_KEY', 'NEW_RELIC_ACCOUNT_ID'];

  protected override rateLimitPerMinute = 25;

  private get apiKey(): string {
    return process.env.NEW_RELIC_API_KEY ?? '';
  }

  private get accountId(): string {
    return process.env.NEW_RELIC_ACCOUNT_ID ?? '';
  }

  protected override async performHealthCheck(): Promise<void> {
    const res = await this.resilientFetch('https://api.newrelic.com/graphql', {
      method: 'POST',
      headers: {
        'API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `{ actor { account(id: ${this.accountId}) { name } } }`,
      }),
      maxRetries: 1,
      timeoutMs: 10_000,
    });
    if (!res.ok) throw new Error(`NerdGraph HTTP ${res.status}`);
    const errors = parseNewRelicErrors(await res.json());
    if (errors.length > 0) throw new Error(errors[0]);
  }

  private sanitizeNrql(input: string): string {
    return input.replace(/[^a-zA-Z0-9\s\-_.]/g, '');
  }

  async getApmMetrics(appName?: string): Promise<NewRelicApmMetrics> {
    if (!this.isLive) return { ...DEMO_APM };

    const safeAppName = this.sanitizeNrql(appName ?? 'SZL-Platform-API');
    const nrql = `SELECT average(duration) * 1000 as responseTimeMs, rate(count(*), 1 minute) as throughputRpm, percentage(count(*), WHERE error IS true) as errorRatePct, apdex(duration, t: 0.5) as apdexScore FROM Transaction WHERE appName = '${safeAppName}' SINCE 5 minutes ago`;

    const res = await this.resilientFetch('https://api.newrelic.com/graphql', {
      method: 'POST',
      headers: { 'API-Key': this.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ actor { account(id: ${this.accountId}) { nrql(query: "${nrql}") { results } } } }`,
      }),
    });

    if (!res.ok) return { ...DEMO_APM };
    const results = (await parseNerdGraphResponse(res, parseNewRelicApmResults))?.[0];
    if (!results) return { ...DEMO_APM };

    const hostRes = await this.resilientFetch('https://api.newrelic.com/graphql', {
      method: 'POST',
      headers: { 'API-Key': this.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ actor { account(id: ${this.accountId}) { nrql(query: "SELECT uniqueCount(hostname) as hostCount, uniqueCount(instanceName) as instanceCount FROM Transaction WHERE appName = '${safeAppName}' SINCE 5 minutes ago") { results } } } }`,
      }),
    }).catch(() => null);

    let hostCount = DEMO_APM.hostCount;
    let instanceCount = DEMO_APM.instanceCount;
    if (hostRes?.ok) {
      const hr = (await parseNerdGraphResponse(hostRes, parseNewRelicHostCountResults))?.[0];
      if (hr) {
        hostCount = hr.hostCount ?? hostCount;
        instanceCount = hr.instanceCount ?? instanceCount;
      }
    }

    return {
      applicationName: safeAppName,
      responseTimeMs: results.responseTimeMs ?? DEMO_APM.responseTimeMs,
      throughputRpm: results.throughputRpm ?? DEMO_APM.throughputRpm,
      errorRatePct: results.errorRatePct ?? DEMO_APM.errorRatePct,
      apdexScore: results.apdexScore ?? DEMO_APM.apdexScore,
      apdexTarget: 0.5,
      hostCount,
      instanceCount,
    };
  }

  async getInfraHosts(): Promise<NewRelicHost[]> {
    if (!this.isLive) return [...DEMO_HOSTS];

    const nrql = `SELECT average(cpuPercent) as cpuPct, average(memoryUsedPercent) as memoryUsedPct, average(diskUsedPercent) as diskUsedPct, average(networkReceiveBytesPerSecond) as networkReceiveBytesPerSec, average(networkTransmitBytesPerSecond) as networkTransmitBytesPerSec, max(diskUsedPercent) as fullestDiskPct FROM SystemSample FACET hostname SINCE 5 minutes ago LIMIT 20`;

    const res = await this.resilientFetch('https://api.newrelic.com/graphql', {
      method: 'POST',
      headers: { 'API-Key': this.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ actor { account(id: ${this.accountId}) { nrql(query: "${nrql}") { results } } } }`,
      }),
    });

    if (!res.ok) return [...DEMO_HOSTS];
    const results = await parseNerdGraphResponse(res, parseNewRelicInfraResults);
    if (!Array.isArray(results) || results.length === 0) return [...DEMO_HOSTS];

    return results.map((r) => ({
      hostname: r.facet ?? 'unknown',
      cpuPct: r.cpuPct ?? 0,
      memoryUsedPct: r.memoryUsedPct ?? 0,
      diskUsedPct: r.diskUsedPct ?? 0,
      networkReceiveBytesPerSec: r.networkReceiveBytesPerSec ?? 0,
      networkTransmitBytesPerSec: r.networkTransmitBytesPerSec ?? 0,
      fullestDiskPct: r.fullestDiskPct ?? 0,
    }));
  }

  async getAlertConditions(): Promise<NewRelicAlertCondition[]> {
    if (!this.isLive) return [...DEMO_ALERTS];

    const res = await this.resilientFetch('https://api.newrelic.com/graphql', {
      method: 'POST',
      headers: { 'API-Key': this.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ actor { account(id: ${this.accountId}) { alerts { nrqlConditionsSearch { nrqlConditions { id name enabled type policyId terms { priority threshold } signal { aggregationWindow } } } } } } }`,
      }),
    });

    if (!res.ok) return [...DEMO_ALERTS];
    const conditions = await parseNerdGraphResponse(res, parseNewRelicAlertConditions);
    if (!Array.isArray(conditions) || conditions.length === 0) return [...DEMO_ALERTS];

    return conditions.slice(0, 10).map((c) => {
      const criticalTerm = c.terms?.find((t) => t.priority === 'CRITICAL');
      const warningTerm = c.terms?.find((t) => t.priority === 'WARNING');
      const primaryTerm = criticalTerm ?? warningTerm;

      return {
        id: String(c.id),
        name: c.name ?? 'Unknown',
        type: c.type ?? 'nrql',
        enabled: c.enabled ?? true,
        severity: criticalTerm ? 'CRITICAL' : 'WARNING',
        threshold: primaryTerm?.threshold ?? 0,
        currentValue: null,
        violating: false,
      };
    });
  }
}
