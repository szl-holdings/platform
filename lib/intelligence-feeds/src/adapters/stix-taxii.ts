/**
 * STIX/TAXII Threat Intelligence Feed Adapter
 *
 * Compatible with MISP, OpenCTI, and any TAXII 2.1 server.
 * Ingests: indicators, threat actors, campaigns, attack patterns, malware, tools.
 * Normalizes to: ThreatActor, Indicator, Campaign entities with
 *   "targets", "uses", "attributed-to", "indicates", "mitigates" relationships.
 *
 * Public feeds used when no private TAXII server is configured:
 * - MISP OSINT feeds (public threat intel)
 * - AlienVault OTX (pulse-based IOC feeds)
 */

import { BaseFeedAdapter, type FeedAdapterConfig, type NormalizedFeedPayload } from "../feed-adapter.js";

interface STIXObject {
  type: string;
  id: string;
  name?: string;
  description?: string;
  labels?: string[];
  aliases?: string[];
  pattern?: string;
  pattern_type?: string;
  confidence?: number;
  valid_from?: string;
  valid_until?: string;
  created?: string;
  modified?: string;
  indicator_types?: string[];
  threat_actor_types?: string[];
  malware_types?: string[];
  attack_patterns?: string[];
  kill_chain_phases?: Array<{ kill_chain_name: string; phase_name: string }>;
  external_references?: Array<{ source_name: string; url?: string; external_id?: string }>;
  x_mitre_id?: string;
  relationship_type?: string;
  source_ref?: string;
  target_ref?: string;
}

interface TAXIIBundle {
  type: "bundle";
  id: string;
  objects: STIXObject[];
}

export function createSTIXConfig(overrides: Partial<FeedAdapterConfig> = {}): FeedAdapterConfig {
  return {
    id: "stix-taxii",
    name: "STIX/TAXII Threat Intelligence Feed",
    domain: "security",
    pollIntervalMs: 15 * 60 * 1000,
    rateLimit: { requestsPerMinute: 20, burstAllowed: 5 },
    retryPolicy: { maxRetries: 3, backoffBaseMs: 3000, maxBackoffMs: 60000 },
    timeout: 45000,
    enabled: true,
    ...overrides,
  };
}

function stixTypeToOntologyType(stixType: string): "threat" | "signal" | "organization" | "person" | "asset" {
  switch (stixType) {
    case "threat-actor": return "threat";
    case "campaign": return "threat";
    case "malware": return "threat";
    case "attack-pattern": return "threat";
    case "tool": return "asset";
    case "indicator": return "signal";
    case "intrusion-set": return "threat";
    case "identity": return "organization";
    default: return "signal";
  }
}

function stixRelationshipToOntologyRel(stixRelType: string): string {
  const mapping: Record<string, string> = {
    "uses": "operates",
    "targets": "threatens",
    "attributed-to": "affiliated_with",
    "indicates": "monitors",
    "mitigates": "monitors",
    "impersonates": "affiliated_with",
    "delivers": "operates",
    "drops": "operates",
    "communicates-with": "connected_to",
    "related-to": "connected_to",
    "subtechnique-of": "affiliated_with",
    "detects": "monitors",
    "consists-of": "affiliated_with",
  };
  return mapping[stixRelType] ?? "connected_to";
}

function extractMitreId(obj: STIXObject): string | null {
  if (obj.x_mitre_id) return obj.x_mitre_id;
  const extRef = obj.external_references?.find(r => r.source_name === "mitre-attack");
  return extRef?.external_id ?? null;
}

function computeConfidenceScore(obj: STIXObject): number {
  if (obj.confidence !== undefined) return Math.min(1, obj.confidence / 100);
  if (obj.labels?.includes("malicious-activity")) return 0.85;
  if (obj.labels?.includes("anomalous-activity")) return 0.65;
  if (obj.labels?.includes("benign")) return 0.2;
  return 0.5;
}

export class STIXTAXIIFeedAdapter extends BaseFeedAdapter {
  private readonly taxiiServer: string | null;
  private readonly taxiiCollection: string;
  private readonly apiKey: string | null;
  private readonly mispUrl: string | null;
  private readonly otxApiKey: string | null;

  constructor(config?: Partial<FeedAdapterConfig>) {
    super(createSTIXConfig(config));
    this.taxiiServer = process.env.TAXII_SERVER_URL ?? null;
    this.taxiiCollection = process.env.TAXII_COLLECTION ?? "default";
    this.apiKey = process.env.TAXII_API_KEY ?? null;
    this.mispUrl = process.env.MISP_URL ?? null;
    this.otxApiKey = process.env.OTX_API_KEY ?? null;
  }

  async connect(): Promise<void> {
    if (!this.taxiiServer && !this.mispUrl && !this.otxApiKey) {
      console.warn("[STIX/TAXII] No server configured — will use public MISP feed");
    }
    this.health.status = "healthy";
  }

  async healthCheck(): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      if (this.taxiiServer) {
        const res = await fetch(`${this.taxiiServer}/taxii/`, {
          method: "GET",
          headers: { Accept: "application/taxii+json;version=2.1", ...(this.otxApiKey ? { Authorization: `Bearer ${this.otxApiKey}` } : {}) },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`TAXII server responded ${res.status}`);
      } else if (this.mispUrl) {
        const res = await fetch(`${this.mispUrl}/events/index?limit=1`, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`MISP responded ${res.status}`);
      } else {
        const res = await fetch("https://otx.alienvault.com/api/v1/pulses/activity?limit=1", {
          method: "GET",
          headers: { "X-OTX-API-KEY": this.otxApiKey ?? "public" },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`OTX responded ${res.status}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  async poll(): Promise<NormalizedFeedPayload> {
    if (this.taxiiServer) {
      return this.pollTAXII();
    }
    if (this.otxApiKey) {
      return this.pollOTX();
    }
    return this.pollPublicMISP();
  }

  private async pollTAXII(): Promise<NormalizedFeedPayload> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const url = `${this.taxiiServer}/taxii2/collections/${this.taxiiCollection}/objects/?limit=500`;
      const headers: Record<string, string> = {
        "Accept": "application/taxii+json;version=2.1",
        "Content-Type": "application/taxii+json;version=2.1",
      };
      if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

      const response = await fetch(url, { signal: controller.signal, headers });
      if (!response.ok) throw new Error(`TAXII error: ${response.status} ${response.statusText}`);

      const bundle = await response.json() as TAXIIBundle | { objects: STIXObject[] };
      const objects: STIXObject[] = (bundle as TAXIIBundle).objects ?? [];
      return this.normalizeBundle(objects, url);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async pollOTX(): Promise<NormalizedFeedPayload> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const url = "https://otx.alienvault.com/api/v1/pulses/subscribed?limit=50&page=1";
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "X-OTX-API-KEY": this.otxApiKey!,
          "Accept": "application/json",
        },
      });
      if (!response.ok) throw new Error(`OTX error: ${response.status}`);

      const data = await response.json() as { results?: Array<{ name: string; id: string; description: string; tags: string[]; indicators: Array<{ type: string; indicator: string; description?: string }> }> };
      const objects: STIXObject[] = [];

      for (const pulse of data.results ?? []) {
        objects.push({
          type: "campaign",
          id: `campaign--otx-${pulse.id}`,
          name: pulse.name,
          description: pulse.description,
          labels: pulse.tags,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        });

        for (const indicator of pulse.indicators ?? []) {
          const pattern = this.otxIndicatorToSTIXPattern(indicator.type, indicator.indicator);
          if (!pattern) continue;
          objects.push({
            type: "indicator",
            id: `indicator--otx-${pulse.id}-${this.dedup.hash(indicator.indicator)}`,
            name: `${indicator.type}: ${indicator.indicator}`,
            description: indicator.description,
            pattern,
            pattern_type: "stix",
            labels: ["malicious-activity"],
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
          });
        }
      }

      return this.normalizeBundle(objects, url);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async pollPublicMISP(): Promise<NormalizedFeedPayload> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const url = "https://www.circl.lu/doc/misp/feed-osint/manifest.json";
      const response = await fetch(url, { signal: controller.signal, headers: { "Accept": "application/json" } });
      if (!response.ok) throw new Error(`MISP manifest error: ${response.status}`);

      const manifest = await response.json() as Record<string, { url?: string; date?: string; tag?: string[] }>;
      const entries = Object.entries(manifest).slice(0, 20);

      const objects: STIXObject[] = [];
      for (const [eventId, meta] of entries) {
        if (!eventId) continue;
        const name = meta.tag?.join(", ") || `MISP Event ${eventId}`;
        objects.push({
          type: "campaign",
          id: `campaign--misp-${eventId}`,
          name,
          description: `MISP OSINT event — tags: ${meta.tag?.join(", ") ?? "none"}`,
          labels: meta.tag ?? [],
          created: meta.date ?? new Date().toISOString(),
          modified: new Date().toISOString(),
        });
      }

      return this.normalizeBundle(objects, url);
    } finally {
      clearTimeout(timeout);
    }
  }

  normalize(rawData: unknown): NormalizedFeedPayload {
    const bundle = rawData as TAXIIBundle;
    return this.normalizeBundle(bundle.objects ?? [], "raw-input");
  }

  private normalizeBundle(objects: STIXObject[], sourceUrl: string): NormalizedFeedPayload {
    const fetchedAt = new Date().toISOString();
    const entities: NormalizedFeedPayload["entities"] = [];
    const relationships: NormalizedFeedPayload["relationships"] = [];

    const stixToExternalId = new Map<string, string>();

    const mainObjects = objects.filter(o => o.type !== "relationship" && o.type !== "bundle");
    const relObjects = objects.filter(o => o.type === "relationship");

    for (const obj of mainObjects) {
      const externalId = `stix:${obj.id}`;
      stixToExternalId.set(obj.id, externalId);

      const confidence = computeConfidenceScore(obj);
      const mitreId = extractMitreId(obj);
      const ontologyType = stixTypeToOntologyType(obj.type);
      const name = obj.name ?? obj.pattern ?? `${obj.type}:${obj.id.slice(-8)}`;
      const killChainPhases = obj.kill_chain_phases?.map(kc => `${kc.kill_chain_name}:${kc.phase_name}`).join(", ");

      entities.push({
        type: ontologyType,
        name,
        domain: "security",
        externalId,
        metadata: {
          stixType: obj.type,
          stixId: obj.id,
          description: obj.description ?? null,
          labels: obj.labels ?? [],
          aliases: obj.aliases ?? [],
          pattern: obj.pattern ?? null,
          patternType: obj.pattern_type ?? null,
          confidence,
          validFrom: obj.valid_from ?? null,
          validUntil: obj.valid_until ?? null,
          mitreId,
          killChainPhases: killChainPhases ?? null,
          indicatorTypes: obj.indicator_types ?? null,
          threatActorTypes: obj.threat_actor_types ?? null,
          malwareTypes: obj.malware_types ?? null,
          externalReferences: obj.external_references?.slice(0, 5) ?? [],
          feedSource: "STIX/TAXII",
        },
        tags: [
          "stix",
          obj.type,
          ...(obj.labels ?? []),
          ...(mitreId ? [mitreId] : []),
        ].filter(Boolean),
        riskScore: ontologyType === "threat" ? Math.max(0.5, confidence) : confidence * 0.5,
      });
    }

    for (const rel of relObjects) {
      if (!rel.source_ref || !rel.target_ref || !rel.relationship_type) continue;
      const fromExternalId = stixToExternalId.get(rel.source_ref);
      const toExternalId = stixToExternalId.get(rel.target_ref);
      if (!fromExternalId || !toExternalId) continue;

      const relType = stixRelationshipToOntologyRel(rel.relationship_type);
      relationships.push({
        fromExternalId,
        toExternalId,
        type: relType as NormalizedFeedPayload["relationships"][0]["type"],
        strength: "moderate",
        metadata: {
          stixRelType: rel.relationship_type,
          feedSource: "STIX/TAXII",
          createdAt: rel.created ?? fetchedAt,
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
      recordCount: objects.length,
    };
  }

  private otxIndicatorToSTIXPattern(type: string, value: string): string | null {
    const typeMap: Record<string, string> = {
      IPv4: `[ipv4-addr:value = '${value}']`,
      domain: `[domain-name:value = '${value}']`,
      hostname: `[domain-name:value = '${value}']`,
      URL: `[url:value = '${value}']`,
      FileHash_MD5: `[file:hashes.'MD5' = '${value}']`,
      FileHash_SHA1: `[file:hashes.'SHA-1' = '${value}']`,
      FileHash_SHA256: `[file:hashes.'SHA-256' = '${value}']`,
      email: `[email-message:from_ref.value = '${value}']`,
      CVE: `[vulnerability:name = '${value}']`,
    };
    return typeMap[type] ?? null;
  }
}
