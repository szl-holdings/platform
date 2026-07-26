import { ServiceAdapter } from '../base.js';
import {
  expectRecord,
  optionalArray,
  optionalNumber,
  optionalRecord,
  optionalString,
  UpstreamPayloadError,
} from './payload-validation.js';

export interface NvdCve {
  id: string;
  sourceIdentifier: string;
  published: string;
  lastModified: string;
  vulnStatus: string;
  description: string;
  cvssV3Score: number | null;
  cvssV3Severity: string | null;
  cvssVector: string | null;
  weaknesses: string[];
  references: { url: string; source: string }[];
  exploitabilityScore: number | null;
  impactScore: number | null;
}

export interface NvdSearchResult {
  totalResults: number;
  resultsPerPage: number;
  startIndex: number;
  vulnerabilities: NvdCve[];
  fetchedAt: string;
  source: 'live' | 'cache' | 'demo';
}

interface CacheEntry {
  data: NvdSearchResult;
  fetchedAt: number;
}

interface NvdDescription {
  lang?: string;
  value?: string;
}

interface NvdCvssMetric {
  cvssData?: {
    baseScore?: number;
    baseSeverity?: string;
    vectorString?: string;
  };
  exploitabilityScore?: number;
  impactScore?: number;
}

interface NvdWeakness {
  description?: NvdDescription[];
}

interface NvdRawCve {
  id?: string;
  sourceIdentifier?: string;
  published?: string;
  lastModified?: string;
  vulnStatus?: string;
  descriptions?: NvdDescription[];
  metrics?: {
    cvssMetricV31?: NvdCvssMetric[];
    cvssMetricV30?: NvdCvssMetric[];
  };
  weaknesses?: NvdWeakness[];
  references?: Array<{ url?: string; source?: string }>;
}

export interface NvdResponse {
  totalResults?: number;
  resultsPerPage?: number;
  startIndex?: number;
  vulnerabilities?: Array<{ cve?: NvdRawCve }>;
}

function parseDescriptions(value: unknown, context: string): NvdDescription[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new UpstreamPayloadError(context, 'expected an array');
  }
  return value.map((description, index) => {
    const itemContext = `${context}[${index}]`;
    const record = expectRecord(description, itemContext);
    return {
      lang: optionalString(record, 'lang', itemContext),
      value: optionalString(record, 'value', itemContext),
    };
  });
}

function parseMetrics(value: unknown, context: string): NvdRawCve['metrics'] {
  if (value === undefined) return undefined;
  const record = expectRecord(value, context);
  const parseMetricArray = (
    key: 'cvssMetricV31' | 'cvssMetricV30',
  ): NvdCvssMetric[] | undefined => {
    const metrics = optionalArray(record, key, context);
    return metrics?.map((metric, index) => {
      const metricContext = `${context}.${key}[${index}]`;
      const metricRecord = expectRecord(metric, metricContext);
      const cvssData = optionalRecord(metricRecord, 'cvssData', metricContext);
      return {
        cvssData: cvssData
          ? {
              baseScore: optionalNumber(cvssData, 'baseScore', `${metricContext}.cvssData`),
              baseSeverity: optionalString(cvssData, 'baseSeverity', `${metricContext}.cvssData`),
              vectorString: optionalString(cvssData, 'vectorString', `${metricContext}.cvssData`),
            }
          : undefined,
        exploitabilityScore: optionalNumber(metricRecord, 'exploitabilityScore', metricContext),
        impactScore: optionalNumber(metricRecord, 'impactScore', metricContext),
      };
    });
  };
  return {
    cvssMetricV31: parseMetricArray('cvssMetricV31'),
    cvssMetricV30: parseMetricArray('cvssMetricV30'),
  };
}

function parseRawCve(value: unknown, context: string): NvdRawCve {
  const record = expectRecord(value, context);
  const rawWeaknesses = optionalArray(record, 'weaknesses', context);
  const rawReferences = optionalArray(record, 'references', context);
  return {
    id: optionalString(record, 'id', context),
    sourceIdentifier: optionalString(record, 'sourceIdentifier', context),
    published: optionalString(record, 'published', context),
    lastModified: optionalString(record, 'lastModified', context),
    vulnStatus: optionalString(record, 'vulnStatus', context),
    descriptions: parseDescriptions(record.descriptions, `${context}.descriptions`),
    metrics: parseMetrics(record.metrics, `${context}.metrics`),
    weaknesses: rawWeaknesses?.map((weakness, index) => {
      const weaknessContext = `${context}.weaknesses[${index}]`;
      const weaknessRecord = expectRecord(weakness, weaknessContext);
      return {
        description: parseDescriptions(
          weaknessRecord.description,
          `${weaknessContext}.description`,
        ),
      };
    }),
    references: rawReferences?.map((reference, index) => {
      const referenceContext = `${context}.references[${index}]`;
      const referenceRecord = expectRecord(reference, referenceContext);
      return {
        url: optionalString(referenceRecord, 'url', referenceContext),
        source: optionalString(referenceRecord, 'source', referenceContext),
      };
    }),
  };
}

export function parseNvdHealth(payload: unknown): number {
  const record = expectRecord(payload, 'NVD health response');
  const totalResults = optionalNumber(record, 'totalResults', 'NVD health response');
  if (totalResults === undefined) {
    throw new Error('NVD health response: missing totalResults');
  }
  return totalResults;
}

export function parseNvdResponse(payload: unknown): NvdResponse {
  const record = expectRecord(payload, 'NVD response');
  const rawVulnerabilities = optionalArray(record, 'vulnerabilities', 'NVD response');
  return {
    totalResults: optionalNumber(record, 'totalResults', 'NVD response'),
    resultsPerPage: optionalNumber(record, 'resultsPerPage', 'NVD response'),
    startIndex: optionalNumber(record, 'startIndex', 'NVD response'),
    vulnerabilities: rawVulnerabilities?.map((value, index) => {
      const context = `NVD response.vulnerabilities[${index}]`;
      const vulnerability = expectRecord(value, context);
      const rawCve = optionalRecord(vulnerability, 'cve', context);
      return {
        cve: rawCve ? parseRawCve(rawCve, `${context}.cve`) : undefined,
      };
    }),
  };
}

export class NVDAdapter extends ServiceAdapter {
  readonly name = 'nvd';
  readonly description =
    'NIST National Vulnerability Database — CVE data, CVSS scores, and exploit status. Free, no key required (NVD API key optional for higher rate limits).';
  readonly requiredEnvVars: string[] = [];

  protected override rateLimitPerMinute = 5;
  protected override circuitBreakerThreshold = 3;

  private _cache = new Map<string, CacheEntry>();
  private readonly _cacheTtlMs = 600_000;
  private _etags = new Map<string, string>();

  override get supportsMockMode(): boolean {
    return true;
  }
  override get status(): import('../base.js').ServiceStatus {
    return 'LIVE_CONFIGURED';
  }

  private get apiKey(): string | undefined {
    return process.env.NVD_API_KEY || undefined;
  }

  protected override async performHealthCheck(): Promise<void> {
    const res = await this.resilientFetch(
      'https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=1&cvssV3Severity=CRITICAL',
      {
        headers: this.apiKey ? { apiKey: this.apiKey } : {},
        maxRetries: 1,
        timeoutMs: 12_000,
      },
    );
    if (!res.ok) throw new Error(`NVD HTTP ${res.status}`);
    parseNvdHealth(await res.json());
  }

  private _getCacheKey(params: Record<string, string>): string {
    return Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
  }

  private _getCached(key: string): NvdSearchResult | null {
    const entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > this._cacheTtlMs) {
      this._cache.delete(key);
      return null;
    }
    return { ...entry.data, source: 'cache' };
  }

  async searchCves(
    opts: {
      keyword?: string;
      severity?: string;
      startIndex?: number;
      resultsPerPage?: number;
      lastModStartDate?: string;
      lastModEndDate?: string;
    } = {},
  ): Promise<NvdSearchResult> {
    const params: Record<string, string> = {};
    if (opts.keyword) params.keywordSearch = opts.keyword;
    if (opts.severity) params.cvssV3Severity = opts.severity;
    if (opts.startIndex) params.startIndex = String(opts.startIndex);
    params.resultsPerPage = String(opts.resultsPerPage ?? 20);
    if (opts.lastModStartDate) params.lastModStartDate = opts.lastModStartDate;
    if (opts.lastModEndDate) params.lastModEndDate = opts.lastModEndDate;

    const cacheKey = this._getCacheKey(params);
    const cached = this._getCached(cacheKey);
    if (cached) return cached;

    try {
      const qs = new URLSearchParams(params).toString();
      const headers: Record<string, string> = {};
      if (this.apiKey) headers.apiKey = this.apiKey;
      const cachedEtag = this._etags.get(cacheKey);
      if (cachedEtag) headers['If-None-Match'] = cachedEtag;

      const res = await this.resilientFetch(
        `https://services.nvd.nist.gov/rest/json/cves/2.0?${qs}`,
        { headers, timeoutMs: 15_000, acceptStatuses: [304] },
      );

      if (res.status === 304 && this._cache.has(cacheKey)) {
        const entry = this._cache.get(cacheKey);
        if (entry) {
          entry.fetchedAt = Date.now();
          return { ...entry.data, source: 'cache' as const };
        }
      }

      if (!res.ok) throw new Error(`NVD HTTP ${res.status}`);

      const json = parseNvdResponse(await res.json());

      const vulnerabilities: NvdCve[] = (json.vulnerabilities ?? []).map((v) => {
        const cve = v.cve ?? {};
        const metrics = cve.metrics?.cvssMetricV31?.[0] ?? cve.metrics?.cvssMetricV30?.[0];
        return {
          id: cve.id ?? '',
          sourceIdentifier: cve.sourceIdentifier ?? '',
          published: cve.published ?? '',
          lastModified: cve.lastModified ?? '',
          vulnStatus: cve.vulnStatus ?? '',
          description: cve.descriptions?.find((d) => d.lang === 'en')?.value ?? '',
          cvssV3Score: metrics?.cvssData?.baseScore ?? null,
          cvssV3Severity: metrics?.cvssData?.baseSeverity ?? null,
          cvssVector: metrics?.cvssData?.vectorString ?? null,
          weaknesses: (cve.weaknesses ?? []).flatMap(
            (w) => w.description?.map((d) => d.value).filter((v): v is string => v != null) ?? [],
          ),
          references: (cve.references ?? []).map((r) => ({
            url: r.url ?? '',
            source: r.source ?? '',
          })),
          exploitabilityScore: metrics?.exploitabilityScore ?? null,
          impactScore: metrics?.impactScore ?? null,
        };
      });

      const result: NvdSearchResult = {
        totalResults: json.totalResults ?? 0,
        resultsPerPage: json.resultsPerPage ?? 20,
        startIndex: json.startIndex ?? 0,
        vulnerabilities,
        fetchedAt: new Date().toISOString(),
        source: 'live',
      };

      this._cache.set(cacheKey, { data: result, fetchedAt: Date.now() });
      const etag = res.headers.get('etag');
      if (etag) this._etags.set(cacheKey, etag);
      if (this._cache.size > 50) {
        const oldest = [...this._cache.entries()].sort(
          (a, b) => a[1].fetchedAt - b[1].fetchedAt,
        )[0];
        if (oldest) this._cache.delete(oldest[0]);
      }

      return result;
    } catch {
      return {
        totalResults: 0,
        resultsPerPage: 0,
        startIndex: 0,
        vulnerabilities: [],
        fetchedAt: new Date().toISOString(),
        source: 'demo',
      };
    }
  }

  async getCriticalCves(limit = 15): Promise<NvdSearchResult> {
    return this.searchCves({ severity: 'CRITICAL', resultsPerPage: limit });
  }

  async getRecentlyModified(days = 7): Promise<NvdSearchResult> {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - days * 86_400_000).toISOString();
    return this.searchCves({
      lastModStartDate: start,
      lastModEndDate: end,
      resultsPerPage: 20,
    });
  }
}
