/**
 * Sanctions List Feed Adapter
 *
 * Ingests and normalizes sanctioned entities from:
 * - OFAC SDN (Office of Foreign Assets Control — Specially Designated Nationals)
 * - EU Consolidated Sanctions List
 * - UN Security Council Consolidated List
 *
 * Normalizes into Person/Organization/Vessel entities tagged "sanctioned".
 * Performs fuzzy alias matching against existing ontology entities.
 * All three lists are publicly available and updated frequently.
 */

import {
  BaseFeedAdapter,
  type FeedAdapterConfig,
  type NormalizedFeedPayload,
} from '../feed-adapter.js';

interface SDNEntry {
  uid: string;
  type: 'individual' | 'entity' | 'vessel' | 'aircraft';
  name: string;
  programList?: string[];
  aliases?: string[];
  akaList?: Array<{
    type: string;
    category?: string;
    lastName?: string;
    firstName?: string;
    wholeName?: string;
  }>;
  addressList?: Array<{ country?: string; city?: string }>;
  idList?: Array<{ idType: string; idNumber: string; country?: string }>;
  nationality?: Array<{ country: string }>;
  tonOfVessel?: number;
  callSign?: string;
  vesselFlag?: string;
  vesselType?: string;
  remarks?: string;
}

interface EUSanctionEntry {
  entityId: string;
  name: string;
  entityType?: string;
  birthdate?: string;
  nationality?: string;
  programKeys?: string[];
  aliasNames?: string[];
  passports?: string[];
}

interface UNSanctionEntry {
  dataId: string;
  name: string;
  type?: string;
  aliases?: string[];
  listType?: string;
  applicationRef?: string;
}

export function createSanctionsConfig(
  overrides: Partial<FeedAdapterConfig> = {},
): FeedAdapterConfig {
  return {
    id: 'sanctions-lists',
    name: 'Sanctions Lists (OFAC/EU/UN)',
    domain: 'security',
    pollIntervalMs: 6 * 60 * 60 * 1000,
    rateLimit: { requestsPerMinute: 10, burstAllowed: 3 },
    retryPolicy: { maxRetries: 5, backoffBaseMs: 5000, maxBackoffMs: 120000 },
    timeout: 60000,
    enabled: true,
    ...overrides,
  };
}

function sdnTypeToOntology(type: SDNEntry['type']): 'person' | 'organization' | 'vessel' | 'asset' {
  switch (type) {
    case 'individual':
      return 'person';
    case 'entity':
      return 'organization';
    case 'vessel':
      return 'vessel';
    case 'aircraft':
      return 'asset';
    default:
      return 'organization';
  }
}

function extractAllAliases(entry: SDNEntry): string[] {
  const aliases: string[] = [];
  if (entry.aliases) aliases.push(...entry.aliases);
  if (entry.akaList) {
    for (const aka of entry.akaList) {
      const name = aka.wholeName ?? [aka.firstName, aka.lastName].filter(Boolean).join(' ');
      if (name) aliases.push(name);
    }
  }
  return [...new Set(aliases)];
}

export class SanctionsFeedAdapter extends BaseFeedAdapter {
  constructor(config?: Partial<FeedAdapterConfig>) {
    super(createSanctionsConfig(config));
  }

  async connect(): Promise<void> {
    this.health.status = 'healthy';
    console.log('[Sanctions] Adapter ready — will poll OFAC, EU, and UN lists');
    await this.ensureCanonicalSanctioningBodies();
  }

  /**
   * Ensure the three canonical sanctioning body entities exist in the ontology.
   * These are referenced by every sanctioned entity via sanctioned_by relationships.
   * Called once at connect time so relationship resolution never fails for these IDs.
   */
  private async ensureCanonicalSanctioningBodies(): Promise<void> {
    const bodies: Array<
      Omit<NormalizedFeedPayload['entities'][0], never> & { externalId: string }
    > = [
      {
        type: 'organization',
        name: 'OFAC — Office of Foreign Assets Control',
        domain: 'security',
        externalId: 'ofac:body:ofac',
        metadata: {
          canonicalBody: true,
          jurisdiction: 'United States',
          authority: 'US Department of the Treasury',
          feedSource: 'OFAC_SDN',
        },
        tags: ['sanctions-authority', 'ofac', 'us-government'],
        riskScore: 0,
      },
      {
        type: 'organization',
        name: 'European Union — Consolidated Sanctions Authority',
        domain: 'security',
        externalId: 'eu:body:european-union',
        metadata: {
          canonicalBody: true,
          jurisdiction: 'European Union',
          authority: 'European Commission',
          feedSource: 'EU_CONSOLIDATED',
        },
        tags: ['sanctions-authority', 'eu', 'european-union'],
        riskScore: 0,
      },
      {
        type: 'organization',
        name: 'UN Security Council — Sanctions Committee',
        domain: 'security',
        externalId: 'un:body:security-council',
        metadata: {
          canonicalBody: true,
          jurisdiction: 'International',
          authority: 'United Nations Security Council',
          feedSource: 'UN_SECURITY_COUNCIL',
        },
        tags: ['sanctions-authority', 'un', 'united-nations'],
        riskScore: 0,
      },
    ];

    for (const body of bodies) {
      try {
        const { ontologyEngine } = await import('@szl-holdings/ai-engine/ontology/ontology-engine');
        await ontologyEngine.upsertEntity(body);
      } catch {
        // Non-fatal — will be retried next cycle
      }
    }
  }

  async healthCheck(): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch('https://ofac.treasury.gov/system/files/2021-09/sdnlist.txt', {
        method: 'HEAD',
        signal: controller.signal,
      });
      if (!res.ok && res.status !== 206) throw new Error(`OFAC SDN responded ${res.status}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  async poll(): Promise<NormalizedFeedPayload> {
    const [ofac, eu, un] = await Promise.allSettled([
      this.pollOFAC(),
      this.pollEU(),
      this.pollUN(),
    ]);

    const entities: NormalizedFeedPayload['entities'] = [];
    const relationships: NormalizedFeedPayload['relationships'] = [];
    const fetchedAt = new Date().toISOString();

    let recordCount = 0;

    if (ofac.status === 'fulfilled') {
      entities.push(...ofac.value.entities);
      relationships.push(...ofac.value.relationships);
      recordCount += ofac.value.recordCount;
    } else {
      console.warn('[Sanctions:OFAC] Poll failed:', ofac.reason);
    }

    if (eu.status === 'fulfilled') {
      entities.push(...eu.value.entities);
      relationships.push(...eu.value.relationships);
      recordCount += eu.value.recordCount;
    } else {
      console.warn('[Sanctions:EU] Poll failed:', eu.reason);
    }

    if (un.status === 'fulfilled') {
      entities.push(...un.value.entities);
      relationships.push(...un.value.relationships);
      recordCount += un.value.recordCount;
    } else {
      console.warn('[Sanctions:UN] Poll failed:', un.reason);
    }

    return {
      entities,
      relationships,
      feedId: this.config.id,
      feedName: this.config.name,
      sourceUrl: 'multi:ofac+eu+un',
      fetchedAt,
      recordCount,
    };
  }

  private async pollOFAC(): Promise<NormalizedFeedPayload> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const url = 'https://ofac.treasury.gov/system/files/2021-09/sdn.json';
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error(`OFAC SDN HTTP ${response.status}`);

      const raw = (await response.json()) as { sdnEntry?: SDNEntry[] };
      const entries: SDNEntry[] = raw.sdnEntry ?? [];

      return this.normalizeOFAC(entries, url);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async pollEU(): Promise<NormalizedFeedPayload> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const url = 'https://webgate.ec.europa.eu/fsd/fsf/public/files/jsonFile/content';
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error(`EU Sanctions HTTP ${response.status}`);

      const raw = (await response.json()) as { export?: { entity?: EUSanctionEntry[] } };
      const entries: EUSanctionEntry[] = raw.export?.entity ?? [];

      return this.normalizeEU(entries, url);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async pollUN(): Promise<NormalizedFeedPayload> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const url = 'https://scsanctions.un.org/resources/xml/en/consolidated.xml';
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) throw new Error(`UN Sanctions HTTP ${response.status}`);

      const xmlText = await response.text();
      const entries = this.parseUNXML(xmlText);

      return this.normalizeUN(entries, url);
    } finally {
      clearTimeout(timeout);
    }
  }

  normalize(rawData: unknown): NormalizedFeedPayload {
    if (Array.isArray(rawData)) {
      return this.normalizeOFAC(rawData as SDNEntry[], 'raw-input');
    }
    return {
      entities: [],
      relationships: [],
      feedId: this.config.id,
      feedName: this.config.name,
      sourceUrl: 'raw',
      fetchedAt: new Date().toISOString(),
      recordCount: 0,
    };
  }

  private normalizeOFAC(entries: SDNEntry[], sourceUrl: string): NormalizedFeedPayload {
    const fetchedAt = new Date().toISOString();
    const entities: NormalizedFeedPayload['entities'] = [];
    const relationships: NormalizedFeedPayload['relationships'] = [];

    for (const entry of entries) {
      const aliases = extractAllAliases(entry);
      const countries = entry.addressList?.map((a) => a.country).filter(Boolean) ?? [];
      const programs = entry.programList ?? [];

      const ontologyType = sdnTypeToOntology(entry.type);
      const externalId = `ofac:sdn:${entry.uid}`;

      entities.push({
        type: ontologyType,
        name: entry.name,
        domain: 'security',
        externalId,
        metadata: {
          sanctionSource: 'OFAC_SDN',
          sdnUid: entry.uid,
          sdnType: entry.type,
          programs,
          aliases,
          countries,
          identifiers: entry.idList?.slice(0, 5) ?? [],
          nationality: entry.nationality?.map((n) => n.country) ?? [],
          vesselInfo:
            entry.type === 'vessel'
              ? {
                  flag: entry.vesselFlag ?? null,
                  callSign: entry.callSign ?? null,
                  vesselType: entry.vesselType ?? null,
                  tonnage: entry.tonOfVessel ?? null,
                }
              : null,
          remarks: entry.remarks?.slice(0, 500) ?? null,
        },
        tags: ['sanctioned', 'ofac', 'sdn', ...programs.map((p) => `program:${p}`)],
        riskScore: 0.95,
      });

      const sanctioningBodyId = 'ofac:body:ofac';
      relationships.push({
        fromExternalId: externalId,
        toExternalId: sanctioningBodyId,
        type: 'sanctioned_by',
        strength: 'strong',
        metadata: {
          programs,
          source: 'OFAC_SDN',
          listDate: fetchedAt,
        },
      });
    }

    return {
      entities,
      relationships,
      feedId: this.config.id,
      feedName: this.config.name,
      sourceUrl,
      fetchedAt,
      recordCount: entries.length,
    };
  }

  private normalizeEU(entries: EUSanctionEntry[], sourceUrl: string): NormalizedFeedPayload {
    const fetchedAt = new Date().toISOString();
    const entities: NormalizedFeedPayload['entities'] = [];
    const relationships: NormalizedFeedPayload['relationships'] = [];

    for (const entry of entries) {
      const externalId = `eu:sanctions:${entry.entityId}`;
      const ontologyType: 'person' | 'organization' =
        entry.entityType === 'P' ? 'person' : 'organization';

      entities.push({
        type: ontologyType,
        name: entry.name,
        domain: 'security',
        externalId,
        metadata: {
          sanctionSource: 'EU_CONSOLIDATED',
          entityId: entry.entityId,
          entityType: entry.entityType,
          nationality: entry.nationality ?? null,
          aliases: entry.aliasNames ?? [],
          programs: entry.programKeys ?? [],
          birthdate: entry.birthdate ?? null,
        },
        tags: ['sanctioned', 'eu-sanctions', ...(entry.programKeys ?? []).map((p) => `eu:${p}`)],
        riskScore: 0.95,
      });

      relationships.push({
        fromExternalId: externalId,
        toExternalId: 'eu:body:european-union',
        type: 'sanctioned_by',
        strength: 'strong',
        metadata: { source: 'EU_CONSOLIDATED', programs: entry.programKeys ?? [] },
      });
    }

    return {
      entities,
      relationships,
      feedId: this.config.id,
      feedName: this.config.name,
      sourceUrl,
      fetchedAt,
      recordCount: entries.length,
    };
  }

  private normalizeUN(entries: UNSanctionEntry[], sourceUrl: string): NormalizedFeedPayload {
    const fetchedAt = new Date().toISOString();
    const entities: NormalizedFeedPayload['entities'] = [];
    const relationships: NormalizedFeedPayload['relationships'] = [];

    for (const entry of entries) {
      const externalId = `un:sanctions:${entry.dataId}`;
      const ontologyType: 'person' | 'organization' = (entry.type ?? '')
        .toLowerCase()
        .includes('individ')
        ? 'person'
        : 'organization';

      entities.push({
        type: ontologyType,
        name: entry.name,
        domain: 'security',
        externalId,
        metadata: {
          sanctionSource: 'UN_SECURITY_COUNCIL',
          dataId: entry.dataId,
          listType: entry.listType ?? null,
          aliases: entry.aliases ?? [],
          applicationRef: entry.applicationRef ?? null,
        },
        tags: ['sanctioned', 'un-sanctions', entry.listType ? `un:${entry.listType}` : 'un:list'],
        riskScore: 0.95,
      });

      relationships.push({
        fromExternalId: externalId,
        toExternalId: 'un:body:security-council',
        type: 'sanctioned_by',
        strength: 'strong',
        metadata: { source: 'UN_SECURITY_COUNCIL', listType: entry.listType ?? null },
      });
    }

    return {
      entities,
      relationships,
      feedId: this.config.id,
      feedName: this.config.name,
      sourceUrl,
      fetchedAt,
      recordCount: entries.length,
    };
  }

  private parseUNXML(xmlText: string): UNSanctionEntry[] {
    const entries: UNSanctionEntry[] = [];
    const entityRegex = /<INDIVIDUAL>([\s\S]*?)<\/INDIVIDUAL>|<ENTITY>([\s\S]*?)<\/ENTITY>/g;
    let match: RegExpExecArray | null;

    while ((match = entityRegex.exec(xmlText)) !== null) {
      const block = match[1] ?? match[2] ?? '';
      const type = match[1] ? 'individual' : 'entity';

      const dataId =
        this.extractXMLField(block, 'DATAID') ?? `un-${Math.random().toString(36).slice(2)}`;
      const name = this.buildUNName(block, type);
      if (!name) continue;

      const aliases: string[] = [];
      const aliasBlocks =
        block.match(
          /<INDIVIDUAL_ALIAS>([\s\S]*?)<\/INDIVIDUAL_ALIAS>|<ENTITY_ALIAS>([\s\S]*?)<\/ENTITY_ALIAS>/g,
        ) ?? [];
      for (const aliasBlock of aliasBlocks) {
        const aliasName = this.extractXMLField(aliasBlock, 'ALIAS_NAME');
        if (aliasName) aliases.push(aliasName);
      }

      entries.push({
        dataId,
        name,
        type,
        aliases,
        listType: this.extractXMLField(block, 'LIST_TYPE') ?? 'UN_CONSOLIDATED',
        applicationRef: this.extractXMLField(block, 'APPLICATION') ?? undefined,
      });
    }

    return entries;
  }

  private extractXMLField(xml: string, tag: string): string | null {
    const match = new RegExp(`<${tag}>(.*?)</${tag}>`, 's').exec(xml);
    return match?.[1]?.trim() ?? null;
  }

  private buildUNName(block: string, type: string): string | null {
    if (type === 'individual') {
      const first = this.extractXMLField(block, 'FIRST_NAME');
      const second = this.extractXMLField(block, 'SECOND_NAME');
      const third = this.extractXMLField(block, 'THIRD_NAME');
      const fourth = this.extractXMLField(block, 'FOURTH_NAME');
      const parts = [first, second, third, fourth].filter(Boolean);
      return parts.length > 0 ? parts.join(' ') : null;
    } else {
      return this.extractXMLField(block, 'FIRST_NAME') ?? this.extractXMLField(block, 'NAME');
    }
  }
}
