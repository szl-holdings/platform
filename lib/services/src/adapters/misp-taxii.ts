import { ServiceAdapter } from '../base.js';
import {
  expectRecord,
  optionalArray,
  optionalBoolean,
  optionalNullableString,
  optionalNumber,
  optionalString,
  optionalStringArray,
  UpstreamPayloadError,
} from './payload-validation.js';

export interface TaxiiCollection {
  id: string;
  title: string;
  description: string;
  canRead: boolean;
  canWrite: boolean;
  mediaTypes: string[];
}

export interface StixIndicator {
  id: string;
  type: string;
  specVersion: string;
  created: string;
  modified: string;
  name: string;
  description: string;
  pattern: string;
  patternType: string;
  validFrom: string;
  validUntil: string | null;
  confidence: number;
  labels: string[];
  killChainPhases: string[];
  externalReferences: { sourceName: string; url: string }[];
}

export interface TaxiiIngestionResult {
  collectionId: string;
  collectionTitle: string;
  objectsIngested: number;
  indicators: StixIndicator[];
  lastPolled: string;
  source: 'live' | 'demo';
}

const DEMO_COLLECTIONS: TaxiiCollection[] = [
  {
    id: 'col-001',
    title: 'MISP Community Threat Feed',
    description: 'Community-curated threat indicators from MISP Galaxy',
    canRead: true,
    canWrite: false,
    mediaTypes: ['application/stix+json;version=2.1'],
  },
  {
    id: 'col-002',
    title: 'FS-ISAC Financial Sector',
    description: 'Financial Services ISAC threat intelligence feed',
    canRead: true,
    canWrite: false,
    mediaTypes: ['application/stix+json;version=2.1'],
  },
  {
    id: 'col-003',
    title: 'CISA Automated Indicator Sharing',
    description: 'DHS CISA AIS feed — automated threat indicator sharing',
    canRead: true,
    canWrite: false,
    mediaTypes: ['application/stix+json;version=2.1'],
  },
];

const DEMO_INDICATORS: StixIndicator[] = [
  {
    id: 'indicator--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f',
    type: 'indicator',
    specVersion: '2.1',
    created: '2025-03-28T14:00:00Z',
    modified: '2025-03-29T08:00:00Z',
    name: 'APT29 Cobalt Strike C2 Beacon',
    description:
      'Cobalt Strike beacon communicating with known APT29 infrastructure — stage-2 implant observed in financial sector intrusions',
    pattern:
      "[network-traffic:dst_ref.type = 'ipv4-addr' AND network-traffic:dst_ref.value = '185.220.101.34']",
    patternType: 'stix',
    validFrom: '2025-03-28T14:00:00Z',
    validUntil: '2025-06-28T14:00:00Z',
    confidence: 95,
    labels: ['malicious-activity', 'apt29', 'cobalt-strike'],
    killChainPhases: ['command-and-control'],
    externalReferences: [
      { sourceName: 'MITRE ATT&CK', url: 'https://attack.mitre.org/techniques/T1071/001/' },
    ],
  },
  {
    id: 'indicator--d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f90',
    type: 'indicator',
    specVersion: '2.1',
    created: '2025-03-27T09:30:00Z',
    modified: '2025-03-29T10:00:00Z',
    name: 'LockBit 3.0 Ransomware Hash',
    description:
      'SHA-256 hash of LockBit 3.0 ransomware payload — actively deployed via RDP brute force',
    pattern:
      "[file:hashes.'SHA-256' = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad']",
    patternType: 'stix',
    validFrom: '2025-03-27T09:30:00Z',
    validUntil: null,
    confidence: 99,
    labels: ['malicious-activity', 'lockbit', 'ransomware'],
    killChainPhases: ['actions-on-objectives'],
    externalReferences: [
      {
        sourceName: 'CISA',
        url: 'https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-165a',
      },
    ],
  },
  {
    id: 'indicator--1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    type: 'indicator',
    specVersion: '2.1',
    created: '2025-03-26T16:00:00Z',
    modified: '2025-03-28T12:00:00Z',
    name: 'Volt Typhoon Living-off-the-Land C2 Domain',
    description:
      'Domain used by Volt Typhoon for LOLBin proxy tunneling — targets critical infrastructure (water, energy, telecom)',
    pattern: "[domain-name:value = 'update-service.cloudfront-cdn.net']",
    patternType: 'stix',
    validFrom: '2025-03-26T16:00:00Z',
    validUntil: '2025-09-26T16:00:00Z',
    confidence: 91,
    labels: ['malicious-activity', 'volt-typhoon', 'apt'],
    killChainPhases: ['command-and-control'],
    externalReferences: [
      {
        sourceName: 'CISA',
        url: 'https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-038a',
      },
    ],
  },
  {
    id: 'indicator--7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b',
    type: 'indicator',
    specVersion: '2.1',
    created: '2025-03-25T11:00:00Z',
    modified: '2025-03-29T06:00:00Z',
    name: 'QakBot Phishing Payload URL',
    description:
      'URL distributing QakBot via HTML smuggling — targets financial services with invoice-themed lures',
    pattern: "[url:value = 'https://invoice-docs.sharepoint-update.com/dl/Q4-2025.html']",
    patternType: 'stix',
    validFrom: '2025-03-25T11:00:00Z',
    validUntil: '2025-04-25T11:00:00Z',
    confidence: 88,
    labels: ['malicious-activity', 'qakbot', 'phishing'],
    killChainPhases: ['delivery'],
    externalReferences: [{ sourceName: 'Abuse.ch', url: 'https://urlhaus.abuse.ch/' }],
  },
  {
    id: 'indicator--ab12cd34-ef56-7890-ab12-cd34ef567890',
    type: 'indicator',
    specVersion: '2.1',
    created: '2025-03-24T08:00:00Z',
    modified: '2025-03-28T14:00:00Z',
    name: 'BlackCat/ALPHV Exfil IP',
    description:
      'IP address used by BlackCat ransomware group for data exfiltration — SFTP-based staging',
    pattern:
      "[network-traffic:dst_ref.type = 'ipv4-addr' AND network-traffic:dst_ref.value = '91.215.85.142']",
    patternType: 'stix',
    validFrom: '2025-03-24T08:00:00Z',
    validUntil: '2025-06-24T08:00:00Z',
    confidence: 93,
    labels: ['malicious-activity', 'blackcat', 'alphv', 'ransomware'],
    killChainPhases: ['exfiltration'],
    externalReferences: [
      {
        sourceName: 'FBI Flash',
        url: 'https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-353a',
      },
    ],
  },
];

interface TaxiiDiscovery {
  title?: string;
  api_roots?: string[];
}

interface RawCollection {
  id?: string;
  title?: string;
  description?: string;
  can_read?: boolean;
  can_write?: boolean;
  media_types?: string[];
}

interface StixObject {
  id?: string;
  type?: string;
  spec_version?: string;
  created?: string;
  modified?: string;
  name?: string;
  description?: string;
  pattern?: string;
  pattern_type?: string;
  valid_from?: string;
  valid_until?: string | null;
  confidence?: number;
  labels?: string[];
  kill_chain_phases?: Array<{ phase_name?: string }>;
  external_references?: Array<{ source_name?: string; url?: string }>;
}

interface StixBundle {
  id?: string;
  objects?: StixObject[];
}

export function parseTaxiiDiscovery(payload: unknown): TaxiiDiscovery {
  const record = expectRecord(payload, 'TAXII discovery');
  const title = optionalString(record, 'title', 'TAXII discovery');
  const apiRoots = optionalStringArray(record, 'api_roots', 'TAXII discovery');
  if (title === undefined && apiRoots === undefined) {
    throw new UpstreamPayloadError('TAXII discovery', 'expected title or api_roots');
  }
  return { title, api_roots: apiRoots };
}

export function parseTaxiiCollections(payload: unknown): RawCollection[] | undefined {
  const record = expectRecord(payload, 'TAXII collections');
  const collections = optionalArray(record, 'collections', 'TAXII collections');
  return collections?.map((value, index) => {
    const collection = expectRecord(value, `TAXII collections[${index}]`);
    return {
      id: optionalString(collection, 'id', `TAXII collections[${index}]`),
      title: optionalString(collection, 'title', `TAXII collections[${index}]`),
      description: optionalString(collection, 'description', `TAXII collections[${index}]`),
      can_read: optionalBoolean(collection, 'can_read', `TAXII collections[${index}]`),
      can_write: optionalBoolean(collection, 'can_write', `TAXII collections[${index}]`),
      media_types: optionalStringArray(collection, 'media_types', `TAXII collections[${index}]`),
    };
  });
}

export function parseStixBundle(payload: unknown): StixBundle {
  const record = expectRecord(payload, 'STIX bundle');
  const rawObjects = optionalArray(record, 'objects', 'STIX bundle');
  const objects = rawObjects?.map((value, index) => {
    const object = expectRecord(value, `STIX bundle.objects[${index}]`);
    const killChainPhases = optionalArray(
      object,
      'kill_chain_phases',
      `STIX bundle.objects[${index}]`,
    )?.map((phase, phaseIndex) => {
      const phaseRecord = expectRecord(
        phase,
        `STIX bundle.objects[${index}].kill_chain_phases[${phaseIndex}]`,
      );
      return {
        phase_name: optionalString(
          phaseRecord,
          'phase_name',
          `STIX bundle.objects[${index}].kill_chain_phases[${phaseIndex}]`,
        ),
      };
    });
    const externalReferences = optionalArray(
      object,
      'external_references',
      `STIX bundle.objects[${index}]`,
    )?.map((reference, referenceIndex) => {
      const referenceRecord = expectRecord(
        reference,
        `STIX bundle.objects[${index}].external_references[${referenceIndex}]`,
      );
      return {
        source_name: optionalString(
          referenceRecord,
          'source_name',
          `STIX bundle.objects[${index}].external_references[${referenceIndex}]`,
        ),
        url: optionalString(
          referenceRecord,
          'url',
          `STIX bundle.objects[${index}].external_references[${referenceIndex}]`,
        ),
      };
    });

    return {
      id: optionalString(object, 'id', `STIX bundle.objects[${index}]`),
      type: optionalString(object, 'type', `STIX bundle.objects[${index}]`),
      spec_version: optionalString(object, 'spec_version', `STIX bundle.objects[${index}]`),
      created: optionalString(object, 'created', `STIX bundle.objects[${index}]`),
      modified: optionalString(object, 'modified', `STIX bundle.objects[${index}]`),
      name: optionalString(object, 'name', `STIX bundle.objects[${index}]`),
      description: optionalString(object, 'description', `STIX bundle.objects[${index}]`),
      pattern: optionalString(object, 'pattern', `STIX bundle.objects[${index}]`),
      pattern_type: optionalString(object, 'pattern_type', `STIX bundle.objects[${index}]`),
      valid_from: optionalString(object, 'valid_from', `STIX bundle.objects[${index}]`),
      valid_until: optionalNullableString(object, 'valid_until', `STIX bundle.objects[${index}]`),
      confidence: optionalNumber(object, 'confidence', `STIX bundle.objects[${index}]`),
      labels: optionalStringArray(object, 'labels', `STIX bundle.objects[${index}]`),
      kill_chain_phases: killChainPhases,
      external_references: externalReferences,
    };
  });
  return {
    id: optionalString(record, 'id', 'STIX bundle'),
    objects,
  };
}

export class MispTaxiiAdapter extends ServiceAdapter {
  readonly name = 'misp-taxii';
  readonly description =
    'MISP/TAXII 2.1 — threat intelligence indicators via TAXII collections (STIX 2.1 format)';
  readonly requiredEnvVars = ['TAXII_SERVER_URL', 'TAXII_API_KEY'];

  protected override rateLimitPerMinute = 20;

  private get serverUrl(): string {
    return (process.env.TAXII_SERVER_URL ?? '').replace(/\/$/, '');
  }

  private get apiKey(): string {
    return process.env.TAXII_API_KEY ?? '';
  }

  private get authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/taxii+json;version=2.1',
      'Content-Type': 'application/taxii+json;version=2.1',
    };
  }

  private _discoveredApiRoot: string | null = null;

  private async discoverApiRoot(): Promise<string> {
    if (this._discoveredApiRoot) return this._discoveredApiRoot;

    const res = await this.resilientFetch(`${this.serverUrl}/taxii2/`, {
      headers: this.authHeaders,
      maxRetries: 1,
      timeoutMs: 10_000,
    });
    if (!res.ok) throw new Error(`TAXII discovery HTTP ${res.status}`);
    const json = parseTaxiiDiscovery(await res.json());
    if (!json.title && !json.api_roots) throw new Error('Invalid TAXII discovery response');

    const roots: string[] = json.api_roots ?? [];
    if (roots.length > 0) {
      const root = roots[0]?.replace(/\/$/, '');
      this._discoveredApiRoot = root.startsWith('http')
        ? root
        : `${this.serverUrl}/${root.replace(/^\//, '')}`;
    } else {
      this._discoveredApiRoot = `${this.serverUrl}/taxii2`;
    }
    return this._discoveredApiRoot;
  }

  protected override async performHealthCheck(): Promise<void> {
    await this.discoverApiRoot();
  }

  async getCollections(apiRoot?: string): Promise<TaxiiCollection[]> {
    if (!this.isLive) return [...DEMO_COLLECTIONS];

    try {
      const root = apiRoot
        ? `${this.serverUrl}/${apiRoot.replace(/^\//, '')}`
        : await this.discoverApiRoot();
      const res = await this.resilientFetch(`${root}/collections/`, {
        headers: this.authHeaders,
      });

      if (!res.ok) return [...DEMO_COLLECTIONS];
      const collections = parseTaxiiCollections(await res.json());
      if (!Array.isArray(collections)) return [...DEMO_COLLECTIONS];

      return collections.map((c) => ({
        id: c.id ?? '',
        title: c.title ?? 'Unknown',
        description: c.description ?? '',
        canRead: c.can_read ?? true,
        canWrite: c.can_write ?? false,
        mediaTypes: c.media_types ?? ['application/stix+json;version=2.1'],
      }));
    } catch {
      return [...DEMO_COLLECTIONS];
    }
  }

  async pollIndicators(
    collectionId?: string,
    addedAfter?: string,
    limit = 50,
  ): Promise<TaxiiIngestionResult> {
    if (!this.isLive) {
      return {
        collectionId: collectionId ?? 'col-001',
        collectionTitle: 'MISP Community Threat Feed',
        objectsIngested: DEMO_INDICATORS.length,
        indicators: [...DEMO_INDICATORS],
        lastPolled: new Date().toISOString(),
        source: 'demo',
      };
    }

    let colId = collectionId;
    try {
      const root = await this.discoverApiRoot();

      if (!colId) {
        const cols = await this.getCollections();
        const readable = cols.find((c) => c.canRead);
        colId = readable?.id ?? 'default';
      }

      let url = `${root}/collections/${colId}/objects/?type=indicator&limit=${limit}`;
      if (addedAfter) url += `&added_after=${addedAfter}`;

      const res = await this.resilientFetch(url, {
        headers: {
          ...this.authHeaders,
          Accept: 'application/stix+json;version=2.1',
        },
      });

      if (!res.ok) {
        return {
          collectionId: colId,
          collectionTitle: 'Unknown',
          objectsIngested: DEMO_INDICATORS.length,
          indicators: [...DEMO_INDICATORS],
          lastPolled: new Date().toISOString(),
          source: 'demo',
        };
      }

      const bundle = parseStixBundle(await res.json());
      const objects = bundle?.objects ?? [];

      const indicators: StixIndicator[] = objects
        .filter((o) => o.type === 'indicator')
        .map((o) => ({
          id: o.id ?? '',
          type: o.type ?? 'indicator',
          specVersion: o.spec_version ?? '2.1',
          created: o.created ?? '',
          modified: o.modified ?? '',
          name: o.name ?? '',
          description: o.description ?? '',
          pattern: o.pattern ?? '',
          patternType: o.pattern_type ?? 'stix',
          validFrom: o.valid_from ?? '',
          validUntil: o.valid_until ?? null,
          confidence: o.confidence ?? 50,
          labels: o.labels ?? [],
          killChainPhases: (o.kill_chain_phases ?? []).map((p) => p.phase_name ?? ''),
          externalReferences: (o.external_references ?? []).map((r) => ({
            sourceName: r.source_name ?? '',
            url: r.url ?? '',
          })),
        }));

      return {
        collectionId: colId,
        collectionTitle: bundle?.id ?? colId,
        objectsIngested: indicators.length,
        indicators,
        lastPolled: new Date().toISOString(),
        source: 'live',
      };
    } catch {
      return {
        collectionId: colId ?? 'col-001',
        collectionTitle: 'Unknown',
        objectsIngested: DEMO_INDICATORS.length,
        indicators: [...DEMO_INDICATORS],
        lastPolled: new Date().toISOString(),
        source: 'demo',
      };
    }
  }
}
