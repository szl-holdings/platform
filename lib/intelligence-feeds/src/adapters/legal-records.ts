/**
 * Legal Records Feed Adapter — CourtListener / PACER
 *
 * Ingests federal case filings, party information, and docket entries.
 * Normalizes into Case and Party entities linked to existing PRISM Counsel matters.
 *
 * Sources:
 * - CourtListener REST API (free, public)
 * - PACER (requires credentials — optional)
 *
 * Entity types produced: case, person, organization
 * Relationship types: litigates, affiliated_with, connected_to, registered_in
 */

import { BaseFeedAdapter, type FeedAdapterConfig, type NormalizedFeedPayload } from "../feed-adapter.js";
import { getEnv } from "@szl-holdings/env";

interface CourtListenerCase {
  id: number;
  case_name?: string;
  case_name_short?: string;
  docket_number?: string;
  date_filed?: string;
  date_terminated?: string;
  court?: string;
  nature_of_suit?: string;
  cause?: string;
  jury_demand?: string;
  pacer_case_id?: string;
  absolute_url?: string;
  parties?: CourtListenerParty[];
}

interface CourtListenerParty {
  name?: string;
  type?: string;
  extra_info?: string;
  attorneys?: Array<{ name?: string; roles?: string[] }>;
}

interface CourtListenerSearchResult {
  count: number;
  next?: string | null;
  results: CourtListenerCase[];
}

export function createLegalRecordsConfig(overrides: Partial<FeedAdapterConfig> = {}): FeedAdapterConfig {
  return {
    id: "legal-records-courtlistener",
    name: "Legal Records — CourtListener / PACER",
    domain: "legal",
    pollIntervalMs: 60 * 60 * 1000,
    rateLimit: { requestsPerMinute: 30, burstAllowed: 10 },
    retryPolicy: { maxRetries: 3, backoffBaseMs: 3000, maxBackoffMs: 60000 },
    timeout: 30000,
    enabled: true,
    ...overrides,
  };
}

function classifyCaseNature(nature: string | undefined): string {
  if (!nature) return "civil";
  const n = nature.toLowerCase();
  if (n.includes("bankrupt")) return "bankruptcy";
  if (n.includes("criminal") || n.includes("felon")) return "criminal";
  if (n.includes("patent") || n.includes("trademark") || n.includes("copyright")) return "ip";
  if (n.includes("contract") || n.includes("fraud")) return "commercial";
  if (n.includes("antitrust")) return "antitrust";
  if (n.includes("securities")) return "securities";
  if (n.includes("labor") || n.includes("employ")) return "employment";
  if (n.includes("immigration")) return "immigration";
  if (n.includes("environment")) return "environmental";
  return "civil";
}

function computeCaseSeverity(cas: CourtListenerCase): number {
  let score = 0.3;
  const nature = (cas.nature_of_suit ?? "").toLowerCase();
  if (nature.includes("criminal") || nature.includes("fraud")) score += 0.4;
  if (nature.includes("securities") || nature.includes("antitrust")) score += 0.3;
  if (nature.includes("patent") || nature.includes("contract")) score += 0.1;
  if (!cas.date_terminated) score += 0.1;
  return Math.min(1, score);
}

export class LegalRecordsFeedAdapter extends BaseFeedAdapter {
  private readonly apiToken: string | null;
  private readonly baseUrl: string;
  private readonly searchQueries: string[];
  /** Map from caseNumber → PRISM matter ID for cross-linking discovered cases */
  private prismMatterIndex: Map<string, { id: number; title: string; matterType: string }> = new Map();

  constructor(config?: Partial<FeedAdapterConfig>) {
    super(createLegalRecordsConfig(config));
    this.apiToken = getEnv().COURTLISTENER_API_TOKEN ?? null;
    this.baseUrl = "https://www.courtlistener.com/api/rest/v3";
    this.searchQueries = this.buildSearchQueries();
  }

  async connect(): Promise<void> {
    if (!this.apiToken) {
      console.warn("[LegalRecords] No CourtListener API token — rate limits will apply to public requests");
    }
    this.health.status = "healthy";
    await this.loadPrismMatterIndex();
  }

  /**
   * Load active PRISM Counsel matters from the database and build a lookup index
   * (caseNumber → matter record) so ingested CourtListener cases can be cross-linked
   * to existing PRISM matters via metadata and ontology relationships.
   */
  private async loadPrismMatterIndex(): Promise<void> {
    try {
      const { db, pcMattersTable } = await import("@szl-holdings/db");
      const matters = await db
        .select({
          id: pcMattersTable.id,
          title: pcMattersTable.title,
          caseNumber: pcMattersTable.caseNumber,
          matterType: pcMattersTable.matterType,
        })
        .from(pcMattersTable)
        .limit(500);

      this.prismMatterIndex.clear();
      for (const m of matters) {
        if (m.caseNumber) {
          this.prismMatterIndex.set(m.caseNumber.toLowerCase(), { id: m.id, title: m.title, matterType: m.matterType });
        }
      }
      console.log(`[LegalRecords] Loaded ${this.prismMatterIndex.size} PRISM Counsel matters for cross-linking`);
    } catch {
      console.warn("[LegalRecords] Could not load PRISM Counsel matter index — cross-linking disabled for this cycle");
    }
  }

  async healthCheck(): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const res = await fetch("https://www.courtlistener.com/api/rest/v3/dockets/?limit=1", {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(this.apiToken ? { Authorization: `Token ${this.apiToken}` } : {}),
        },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`CourtListener responded ${res.status}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  async poll(): Promise<NormalizedFeedPayload> {
    const allEntities: NormalizedFeedPayload["entities"] = [];
    const allRelationships: NormalizedFeedPayload["relationships"] = [];
    const fetchedAt = new Date().toISOString();
    let totalRecords = 0;

    for (const query of this.searchQueries) {
      try {
        await this.rateLimiter.acquire();
        const result = await this.fetchCases(query);
        if (result) {
          allEntities.push(...result.entities);
          allRelationships.push(...result.relationships);
          totalRecords += result.recordCount;
        }
      } catch (err) {
        console.warn(`[LegalRecords] Query "${query}" failed:`, err instanceof Error ? err.message : err);
      }
    }

    return {
      entities: allEntities,
      relationships: allRelationships,
      feedId: this.config.id,
      feedName: this.config.name,
      sourceUrl: this.baseUrl,
      fetchedAt,
      recordCount: totalRecords,
    };
  }

  normalize(rawData: unknown): NormalizedFeedPayload {
    const cases = Array.isArray(rawData) ? rawData as CourtListenerCase[] : [];
    return this.normalizeCases(cases, "raw-input");
  }

  private async fetchCases(query: string): Promise<NormalizedFeedPayload | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const params = new URLSearchParams({
        q: query,
        order_by: "date_filed desc",
        format: "json",
        page_size: "20",
      });

      const headers: Record<string, string> = { "Accept": "application/json" };
      if (this.apiToken) headers["Authorization"] = `Token ${this.apiToken}`;

      const url = `${this.baseUrl}/dockets/?${params.toString()}`;
      const response = await fetch(url, { signal: controller.signal, headers });

      if (!response.ok) {
        if (response.status === 429) throw new Error("Rate limited by CourtListener");
        throw new Error(`CourtListener HTTP ${response.status}`);
      }

      const data = await response.json() as CourtListenerSearchResult;
      return this.normalizeCases(data.results ?? [], url);
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeCases(cases: CourtListenerCase[], sourceUrl: string): NormalizedFeedPayload {
    const fetchedAt = new Date().toISOString();
    const entities: NormalizedFeedPayload["entities"] = [];
    const relationships: NormalizedFeedPayload["relationships"] = [];

    for (const cas of cases) {
      const caseName = cas.case_name_short ?? cas.case_name ?? `Case ${cas.docket_number ?? cas.id}`;
      const caseExternalId = `courtlistener:docket:${cas.id}`;
      const caseNature = classifyCaseNature(cas.nature_of_suit);
      const severity = computeCaseSeverity(cas);

      // Check for PRISM Counsel matter cross-link
      const docketNorm = (cas.docket_number ?? "").toLowerCase().replace(/\s+/g, "");
      const prismMatch = docketNorm ? this.prismMatterIndex.get(docketNorm) : undefined;

      entities.push({
        type: "case",
        name: caseName,
        domain: "legal",
        externalId: caseExternalId,
        metadata: {
          caseId: cas.id,
          docketNumber: cas.docket_number ?? null,
          court: cas.court ?? null,
          dateFiled: cas.date_filed ?? null,
          dateTerminated: cas.date_terminated ?? null,
          active: !cas.date_terminated,
          natureOfSuit: cas.nature_of_suit ?? null,
          cause: cas.cause ?? null,
          juryDemand: cas.jury_demand ?? null,
          pacerCaseId: cas.pacer_case_id ?? null,
          courtListenerUrl: cas.absolute_url ? `https://www.courtlistener.com${cas.absolute_url}` : null,
          caseNature,
          feedSource: "CourtListener",
          ...(prismMatch ? {
            prismCounselMatterId: prismMatch.id,
            prismCounselMatterTitle: prismMatch.title,
            prismCounselMatterType: prismMatch.matterType,
            prismCounselLinked: true,
          } : {}),
        },
        tags: [
          "legal", "court-record", caseNature,
          cas.date_terminated ? "closed" : "active",
          cas.court ? `court:${cas.court}` : "court:unknown",
          ...(prismMatch ? ["prism-counsel-linked"] : []),
        ],
        riskScore: severity,
      });

      // If this case matches a PRISM matter, create an entity for the PRISM matter
      // and a relationship tying the external court case to the internal matter.
      if (prismMatch) {
        const prismEntityExternalId = `prism:matter:${prismMatch.id}`;
        entities.push({
          type: "case",
          name: `PRISM: ${prismMatch.title}`,
          domain: "legal",
          externalId: prismEntityExternalId,
          metadata: {
            prismMatterId: prismMatch.id,
            matterType: prismMatch.matterType,
            system: "prism-counsel",
            feedSource: "PRISM_COUNSEL_DB",
          },
          tags: ["legal", "prism-counsel", "internal-matter", prismMatch.matterType],
        });
        relationships.push({
          fromExternalId: caseExternalId,
          toExternalId: prismEntityExternalId,
          type: "connected_to",
          strength: "strong",
          metadata: {
            linkType: "court_case_to_prism_matter",
            prismMatterId: prismMatch.id,
            feedSource: "CourtListener",
          },
        });
      }

      if (cas.court) {
        const courtExternalId = `courtlistener:court:${cas.court}`;
        entities.push({
          type: "jurisdiction",
          name: `Court: ${cas.court.toUpperCase()}`,
          domain: "legal",
          externalId: courtExternalId,
          metadata: {
            courtCode: cas.court,
            feedSource: "CourtListener",
          },
          tags: ["court", "jurisdiction", `court:${cas.court}`],
        });

        relationships.push({
          fromExternalId: caseExternalId,
          toExternalId: courtExternalId,
          type: "registered_in",
          strength: "strong",
          metadata: { feedSource: "CourtListener" },
        });
      }

      if (cas.parties) {
        for (const party of cas.parties) {
          if (!party.name) continue;

          const partyType = this.classifyPartyType(party.type);
          const partyExternalId = `courtlistener:party:${this.dedup.hash(`${party.name}:${cas.court ?? ""}`)}`;

          entities.push({
            type: partyType,
            name: party.name.trim(),
            domain: "legal",
            externalId: partyExternalId,
            metadata: {
              partyType: party.type ?? "unknown",
              extraInfo: party.extra_info ?? null,
              feedSource: "CourtListener",
            },
            tags: ["legal-party", partyType, party.type ? `role:${party.type.toLowerCase()}` : "role:unknown"],
          });

          relationships.push({
            fromExternalId: partyExternalId,
            toExternalId: caseExternalId,
            type: "litigates",
            strength: "strong",
            metadata: {
              partyRole: party.type ?? "unknown",
              feedSource: "CourtListener",
            },
          });
        }
      }
    }

    return {
      entities,
      relationships,
      feedId: this.config.id,
      feedName: this.config.name,
      sourceUrl,
      fetchedAt,
      recordCount: cases.length,
    };
  }

  private classifyPartyType(partyType: string | undefined): "person" | "organization" {
    const t = (partyType ?? "").toLowerCase();
    if (t.includes("corp") || t.includes("inc") || t.includes("llc") || t.includes("ltd")) return "organization";
    if (t.includes("plaintiff") || t.includes("defendant") || t.includes("individual")) return "person";
    return "organization";
  }

  private buildSearchQueries(): string[] {
    const envQueries = getEnv().LEGAL_FEED_SEARCH_QUERIES;
    if (envQueries) {
      try {
        return JSON.parse(envQueries) as string[];
      } catch {
        return envQueries.split(",").map(q => q.trim());
      }
    }

    return [
      "securities fraud",
      "sanctions violation",
      "money laundering",
      "wire fraud",
      "OFAC",
      "maritime fraud",
    ];
  }
}
