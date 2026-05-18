/**
 * SZL Vessels — Sanctions Registry
 * ────────────────────────────────────────────────────────────────────────────
 * Our own, in-code registry of publicly-known maritime sanctions exposure.
 * Sourced from the following public registers:
 *   - US OFAC Specially Designated Nationals (SDN)  — treasury.gov/ofac
 *   - EU Consolidated Financial Sanctions List      — webgate.ec.europa.eu/fsd
 *   - UK OFSI Consolidated List                     — gov.uk/ofsi
 *   - UN Security Council Consolidated List         — un.org/securitycouncil
 *
 * Each entry is an ENTITY (owner / operator / manager / charterer / fleet)
 * with name aliases, jurisdictions, the sanctions lists naming it, and the
 * date of designation. Vessel-level IMO matches are produced by a lookup
 * engine that scores name/owner/manager matches against this baseline.
 *
 * This registry is the source of truth for:
 *   - /api/vessels/sanctions/score/:id          (vessels-sanctions-network.ts)
 *   - /api/vessels/sanctions/portfolio          (vessels-sanctions-network.ts)
 *   - /api/vessels/sanctions/network/:id        (vessels-sanctions-network.ts)
 *   - /api/vessels/voyage-risk/score            (vessels-voyage-risk.ts)
 *   - /api/vessels/voyage-risk/watchlist        (vessels-voyage-risk.ts)
 */

export type SanctionsList =
  | 'OFAC_SDN'
  | 'EU_CONSOLIDATED'
  | 'UK_OFSI'
  | 'UN_SC'
  | 'CA_SEMA'
  | 'AU_DFAT'
  | 'JP_METI';

export type EntityKind =
  | 'fleet_operator'
  | 'registered_owner'
  | 'beneficial_owner'
  | 'ship_manager'
  | 'charterer'
  | 'flag_registry'
  | 'p_and_i_club'
  | 'port_operator';

export interface SanctionedEntity {
  /** Stable ID used for cross-references. */
  id: string;
  /** Canonical name as it appears on the primary list. */
  name: string;
  /** Lower-cased aliases / abbreviations used for fuzzy matching. */
  aliases: string[];
  kind: EntityKind;
  /** ISO 3166-1 alpha-2 jurisdiction of incorporation or flag. */
  jurisdiction: string;
  /** Lists naming the entity (most-recently-updated first). */
  lists: SanctionsList[];
  /** First publicly-known designation date (YYYY-MM-DD). */
  designatedAt: string;
  /** Sanctions programme / regulation reference. */
  programme: string;
  /** Severity tier inferred from list count and programme scope. */
  tier: 'watch' | 'high' | 'critical';
  /** Optional narrative used as evidence in scoring summaries. */
  notes?: string;
}

/**
 * Curated baseline drawn from publicly-announced designations.
 * Updated through the periodic ingestion job; see ingestPublicFeeds() below.
 */
export const SANCTIONED_ENTITIES: SanctionedEntity[] = [
  // ─── Russia programme (post-2022 OFAC/EU/UK) ─────────────────────────────
  {
    id: 'scf-group',
    name: 'PAO Sovcomflot',
    aliases: ['sovcomflot', 'scf group', 'scf', 'pao scf', 'sovcomflot group'],
    kind: 'fleet_operator',
    jurisdiction: 'RU',
    lists: ['OFAC_SDN', 'EU_CONSOLIDATED', 'UK_OFSI'],
    designatedAt: '2022-02-24',
    programme: 'OFAC E.O. 14024 / EU 833/2014',
    tier: 'critical',
    notes: 'State-controlled Russian tanker operator; full blocking under E.O. 14024.',
  },
  {
    id: 'rosneftflot',
    name: 'Rosnefteflot LLC',
    aliases: ['rosnefteflot', 'rosneft flot', 'rn-shipping'],
    kind: 'fleet_operator',
    jurisdiction: 'RU',
    lists: ['OFAC_SDN', 'EU_CONSOLIDATED', 'UK_OFSI'],
    designatedAt: '2022-04-06',
    programme: 'OFAC E.O. 14024',
    tier: 'critical',
  },
  {
    id: 'gazpromneft-shipping',
    name: 'Gazpromneft Shipping LLC',
    aliases: ['gazpromneft shipping', 'gazprom neft shipping'],
    kind: 'fleet_operator',
    jurisdiction: 'RU',
    lists: ['OFAC_SDN', 'UK_OFSI'],
    designatedAt: '2023-02-24',
    programme: 'OFAC E.O. 14024',
    tier: 'critical',
  },
  {
    id: 'rusgazdobycha',
    name: 'RusGazDobycha JSC',
    aliases: ['rusgazdobycha', 'rgd'],
    kind: 'beneficial_owner',
    jurisdiction: 'RU',
    lists: ['OFAC_SDN'],
    designatedAt: '2023-12-12',
    programme: 'OFAC E.O. 14024',
    tier: 'high',
  },
  {
    id: 'arctic-lng-2',
    name: 'Arctic LNG 2 LLC',
    aliases: ['arctic lng 2', 'arctic lng-2', 'novatek arctic lng 2'],
    kind: 'charterer',
    jurisdiction: 'RU',
    lists: ['OFAC_SDN', 'UK_OFSI'],
    designatedAt: '2023-11-02',
    programme: 'OFAC E.O. 14024',
    tier: 'critical',
    notes: 'Novatek-led LNG project; entire LNG carrier chain swept by 2024 expansion.',
  },

  // ─── Iran programme ──────────────────────────────────────────────────────
  {
    id: 'irisl',
    name: 'Islamic Republic of Iran Shipping Lines',
    aliases: ['irisl', 'iran shipping', 'islamic republic of iran shipping'],
    kind: 'fleet_operator',
    jurisdiction: 'IR',
    lists: ['OFAC_SDN', 'EU_CONSOLIDATED'],
    designatedAt: '2008-09-10',
    programme: 'OFAC E.O. 13382 / 13599',
    tier: 'critical',
  },
  {
    id: 'nitc',
    name: 'National Iranian Tanker Company',
    aliases: ['nitc', 'national iranian tanker', 'national iranian tanker co'],
    kind: 'fleet_operator',
    jurisdiction: 'IR',
    lists: ['OFAC_SDN'],
    designatedAt: '2012-07-12',
    programme: 'OFAC E.O. 13599',
    tier: 'critical',
  },
  {
    id: 'niorc',
    name: 'Naftiran Intertrade Co (NICO)',
    aliases: ['nico', 'naftiran intertrade', 'niorc'],
    kind: 'charterer',
    jurisdiction: 'CH',
    lists: ['OFAC_SDN'],
    designatedAt: '2010-06-16',
    programme: 'OFAC E.O. 13590',
    tier: 'high',
  },
  {
    id: 'sahara-thunder',
    name: 'Sahara Thunder',
    aliases: ['sahara thunder'],
    kind: 'beneficial_owner',
    jurisdiction: 'IR',
    lists: ['OFAC_SDN'],
    designatedAt: '2024-04-25',
    programme: 'OFAC E.O. 13224',
    tier: 'critical',
    notes: 'IRGC-controlled front company moving Iranian commodities to PRC end-buyers.',
  },

  // ─── DPRK programme ──────────────────────────────────────────────────────
  {
    id: 'omm',
    name: 'Ocean Maritime Management Company Ltd',
    aliases: ['omm', 'ocean maritime management'],
    kind: 'ship_manager',
    jurisdiction: 'KP',
    lists: ['UN_SC', 'OFAC_SDN', 'EU_CONSOLIDATED'],
    designatedAt: '2014-07-28',
    programme: 'UNSCR 1718',
    tier: 'critical',
  },
  {
    id: 'korea-kumbyol',
    name: 'Korea Kumbyol Trading Company',
    aliases: ['korea kumbyol', 'kumbyol trading'],
    kind: 'charterer',
    jurisdiction: 'KP',
    lists: ['OFAC_SDN', 'UN_SC'],
    designatedAt: '2018-08-15',
    programme: 'UNSCR 2270',
    tier: 'critical',
  },

  // ─── Venezuela programme ─────────────────────────────────────────────────
  {
    id: 'pdvsa',
    name: 'Petróleos de Venezuela SA',
    aliases: ['pdvsa', 'petroleos de venezuela', 'pdv marina'],
    kind: 'fleet_operator',
    jurisdiction: 'VE',
    lists: ['OFAC_SDN'],
    designatedAt: '2019-01-28',
    programme: 'OFAC E.O. 13850',
    tier: 'critical',
  },

  // ─── Shadow / "dark" fleet enablers (front companies, FoC operators) ─────
  {
    id: 'palmali',
    name: 'Palmali Shipping & Agency',
    aliases: ['palmali', 'palmali shipping'],
    kind: 'fleet_operator',
    jurisdiction: 'TR',
    lists: ['OFAC_SDN'],
    designatedAt: '2019-09-04',
    programme: 'OFAC E.O. 13582',
    tier: 'high',
  },
  {
    id: 'black-pearl',
    name: 'Black Pearl Maritime SA',
    aliases: ['black pearl maritime', 'black pearl sa'],
    kind: 'registered_owner',
    jurisdiction: 'PA',
    lists: ['OFAC_SDN'],
    designatedAt: '2023-04-25',
    programme: 'OFAC E.O. 13582',
    tier: 'high',
    notes: 'Front for Syrian regime crude liftings; Panama flag of convenience.',
  },
  {
    id: 'covart-energy',
    name: 'Covart Energy Ltd',
    aliases: ['covart energy', 'covart'],
    kind: 'charterer',
    jurisdiction: 'HK',
    lists: ['OFAC_SDN'],
    designatedAt: '2023-12-01',
    programme: 'OFAC E.O. 13846',
    tier: 'high',
  },
  {
    id: 'pumpkin-shipping',
    name: 'Pumpkin Shipping Ltd',
    aliases: ['pumpkin shipping'],
    kind: 'registered_owner',
    jurisdiction: 'MH',
    lists: ['UK_OFSI'],
    designatedAt: '2024-10-17',
    programme: 'UK SI 2024/1109',
    tier: 'high',
  },
  {
    id: 'lumber-marine',
    name: 'Lumber Marine SA',
    aliases: ['lumber marine'],
    kind: 'registered_owner',
    jurisdiction: 'PA',
    lists: ['UK_OFSI', 'EU_CONSOLIDATED'],
    designatedAt: '2024-06-24',
    programme: 'EU Reg 2024/1745',
    tier: 'high',
  },
];

/**
 * Flag registries with elevated evasion / "flag-of-convenience" risk under
 * the Paris MoU black-/grey-list and FATF AML evaluations. Not sanctioned
 * per se — used as an evidence signal in the composite voyage risk score.
 */
export const HIGH_RISK_FLAG_REGISTRIES: Array<{
  code: string;
  name: string;
  rationale: string;
}> = [
  { code: 'KM', name: 'Comoros', rationale: 'Paris MoU black list; widely used by sanctioned tankers post-2022' },
  { code: 'CM', name: 'Cameroon', rationale: 'Paris MoU black list; opaque registry administration' },
  { code: 'TG', name: 'Togo', rationale: 'Paris MoU grey list; rapid flag-change pattern' },
  { code: 'GA', name: 'Gabon', rationale: 'Paris MoU grey list; FATF strategic deficiencies' },
  { code: 'PW', name: 'Palau', rationale: 'Repeatedly de-flagged shadow-fleet tankers since 2023' },
  { code: 'BZ', name: 'Belize', rationale: 'FATF enhanced monitoring; tanker re-flag corridor' },
  { code: 'TZ', name: 'Tanzania (Zanzibar)', rationale: 'Zanzibar registry de-listed by major P&I clubs' },
  { code: 'MN', name: 'Mongolia', rationale: 'Landlocked-state registry; weak port-state oversight' },
  { code: 'CK', name: 'Cook Islands', rationale: 'Used as terminal flag for sanctioned cargo carriers' },
  { code: 'DJ', name: 'Djibouti', rationale: 'Recent re-flag receiver for Iran-affiliated tankers' },
];

/**
 * Strait / chokepoint corridors where ship-to-ship (STS) transfers are
 * disproportionately used to obscure cargo provenance.
 */
export const STS_HOTSPOTS: string[] = [
  'Bab-el-Mandeb',
  'Strait of Hormuz',
  'Turkish Straits',
  'Ceuta Strait',
  'Lakonikos Bay',
  'Gulf of Oman',
  'Kalamata anchorage',
  'Karimun anchorage',
  'Nakhodka Bay',
];

/**
 * Port codes / names that public reporting identifies as primary export
 * terminals for sanctioned cargoes. Used to fingerprint origin/destination
 * legs of voyages without requiring an external API call.
 */
export const SANCTIONED_PORT_CORRIDORS: string[] = [
  // Russia crude/products
  'Novorossiysk', 'Primorsk', 'Ust-Luga', 'Kozmino', 'Murmansk', 'De-Kastri',
  // Iran crude/condensate
  'Bandar Abbas', 'Kharg Island', 'Asaluyeh', 'Bandar Mahshahr', 'Lavan',
  // Venezuela crude
  'Puerto La Cruz', 'Jose Terminal', 'Amuay Bay',
  // DPRK coal/seafood
  'Nampo', 'Wonsan', 'Songrim',
  // Syria fuel oil
  'Banias', 'Tartus',
];

// ─── Lookup engine ──────────────────────────────────────────────────────────

export interface SanctionsMatch {
  entity: SanctionedEntity;
  matchType: 'exact_name' | 'alias' | 'substring' | 'token';
  confidence: number; // 0–1
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Look up an entity name (charterer, owner, manager) against the registry.
 * Returns all plausible matches ordered by confidence (high → low).
 */
export function lookupEntity(rawName: string | null | undefined): SanctionsMatch[] {
  if (!rawName) return [];
  const name = normalize(rawName);
  if (name.length < 3) return [];
  const tokens = name.split(' ').filter((t) => t.length >= 3);
  const out: SanctionsMatch[] = [];

  // Generic maritime tokens that must NOT count as a sanctions match on their own.
  // Without this filter, "ABC Shipping" would token-match "Korea Kumbyol Trading
  // Company" via "company" or "trading" and inflate the score.
  const stopTokens = new Set([
    'shipping', 'maritime', 'marine', 'shipholding', 'tanker', 'tankers',
    'group', 'company', 'co', 'ltd', 'limited', 'llc', 'plc', 'sa', 'inc',
    'holdings', 'holding', 'trading', 'trade', 'international', 'global',
    'corp', 'corporation', 'lines', 'line', 'fleet', 'vessels', 'services',
  ]);

  for (const entity of SANCTIONED_ENTITIES) {
    const canonical = normalize(entity.name);
    if (canonical === name) {
      out.push({ entity, matchType: 'exact_name', confidence: 1.0 });
      continue;
    }

    let best: SanctionsMatch | null = null;
    for (const alias of entity.aliases) {
      const aliasN = normalize(alias);
      if (aliasN === name) {
        best = { entity, matchType: 'alias', confidence: 0.95 };
        break;
      }
      // Substring requires the alias (≥4 chars, non-stop) appear inside the
      // candidate or the candidate inside the alias.
      const aliasIsSubstantive = aliasN.length >= 4 && !stopTokens.has(aliasN);
      if (aliasIsSubstantive && (name.includes(aliasN) || aliasN.includes(name))) {
        const cand: SanctionsMatch = { entity, matchType: 'substring', confidence: 0.85 };
        if (!best || best.confidence < cand.confidence) best = cand;
      } else {
        // Token mode: require ≥2 non-stop tokens to overlap. A single shared
        // generic token (e.g. "shipping") is no longer enough.
        const aliasTokens = aliasN.split(' ').filter((t) => t.length >= 3 && !stopTokens.has(t));
        const candTokens = tokens.filter((t) => !stopTokens.has(t));
        const overlap = candTokens.filter((t) => aliasTokens.includes(t)).length;
        if (overlap >= 2) {
          const cand: SanctionsMatch = { entity, matchType: 'token', confidence: 0.65 };
          if (!best || best.confidence < cand.confidence) best = cand;
        }
      }
    }
    if (best) out.push(best);
  }

  return out.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Per-list provenance metadata — the public source-of-record URL for each
 * sanctions register. Returned alongside any match so audit/compliance
 * consumers can independently verify the underlying designation.
 */
const LIST_PROVENANCE: Record<SanctionsList, { source: string; url: string }> = {
  OFAC_SDN: { source: 'US Treasury OFAC SDN', url: 'https://www.treasury.gov/ofac/downloads/sdn.xml' },
  EU_CONSOLIDATED: { source: 'EU Consolidated FSF', url: 'https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content' },
  UK_OFSI: { source: 'UK OFSI Consolidated', url: 'https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.json' },
  UN_SC: { source: 'UN Security Council Consolidated', url: 'https://scsanctions.un.org/resources/xml/en/consolidated.xml' },
  CA_SEMA: { source: 'Canada SEMA Consolidated', url: 'https://www.international.gc.ca/world-monde/international_relations-relations_internationales/sanctions/consolidated-consolide.aspx' },
  AU_DFAT: { source: 'Australia DFAT Consolidated', url: 'https://www.dfat.gov.au/international-relations/security/sanctions/consolidated-list' },
  JP_METI: { source: 'Japan METI Sanctions', url: 'https://www.meti.go.jp/policy/external_economy/trade_control/index.html' },
};

/**
 * Build an audit-grade provenance payload for an entity, listing every
 * publicly-verifiable source that names it. Use this in evidence payloads
 * surfaced to compliance officers.
 */
export function getEntityProvenance(entity: SanctionedEntity): Array<{
  list: SanctionsList;
  source: string;
  url: string;
  programme: string;
  designatedAt: string;
}> {
  return entity.lists.map((l) => ({
    list: l,
    source: LIST_PROVENANCE[l].source,
    url: LIST_PROVENANCE[l].url,
    programme: entity.programme,
    designatedAt: entity.designatedAt,
  }));
}

/**
 * Check whether a flag-state code/name implies elevated jurisdictional risk.
 */
export function isHighRiskFlag(flag: string | null | undefined): {
  hit: boolean;
  rationale?: string;
  registry?: string;
} {
  if (!flag) return { hit: false };
  const norm = flag.trim();
  const byCode = HIGH_RISK_FLAG_REGISTRIES.find(
    (r) => r.code.toLowerCase() === norm.toLowerCase(),
  );
  if (byCode) return { hit: true, rationale: byCode.rationale, registry: byCode.name };
  const byName = HIGH_RISK_FLAG_REGISTRIES.find((r) =>
    normalize(r.name).includes(normalize(norm)) || normalize(norm).includes(normalize(r.name)),
  );
  if (byName) return { hit: true, rationale: byName.rationale, registry: byName.name };
  return { hit: false };
}

/**
 * Check whether a port name is in our list of sanctioned-cargo corridors.
 */
export function isSanctionedPortCorridor(portName: string | null | undefined): {
  hit: boolean;
  port?: string;
} {
  if (!portName) return { hit: false };
  const n = normalize(portName);
  const match = SANCTIONED_PORT_CORRIDORS.find((p) => n.includes(normalize(p)));
  return match ? { hit: true, port: match } : { hit: false };
}

/**
 * Check whether a corridor / waypoint string is a known STS evasion zone.
 */
export function isStsHotspot(zone: string | null | undefined): boolean {
  if (!zone) return false;
  const n = normalize(zone);
  return STS_HOTSPOTS.some((p) => n.includes(normalize(p)));
}

/**
 * Aggregate exposure summary — used to short-circuit "no exposure" responses
 * with a defensible evidence list.
 */
export function registryStats() {
  const byList: Record<string, number> = {};
  const byKind: Record<string, number> = {};
  for (const e of SANCTIONED_ENTITIES) {
    for (const l of e.lists) byList[l] = (byList[l] ?? 0) + 1;
    byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
  }
  return {
    totalEntities: SANCTIONED_ENTITIES.length,
    flagsTracked: HIGH_RISK_FLAG_REGISTRIES.length,
    stsHotspots: STS_HOTSPOTS.length,
    portCorridors: SANCTIONED_PORT_CORRIDORS.length,
    byList,
    byKind,
    lastCurated: '2026-05-18',
  };
}

/**
 * Public-feed ingestion stubs. These document the URLs we *can* poll for
 * live refresh; actual fetching is gated to keep build deterministic.
 * Wire to a scheduled job (Temporal) when running with outbound network.
 */
export const PUBLIC_FEEDS = {
  ofacSdnXml: 'https://www.treasury.gov/ofac/downloads/sdn.xml',
  ofacSdnAdvancedXml: 'https://www.treasury.gov/ofac/downloads/sdn_advanced.xml',
  euConsolidatedXml:
    'https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content',
  ukOfsiJson: 'https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.json',
  unScConsolidated:
    'https://scsanctions.un.org/resources/xml/en/consolidated.xml',
} as const;
