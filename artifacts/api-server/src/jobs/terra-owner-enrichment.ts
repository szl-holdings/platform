/**
 * Terra Owner Enrichment Job
 *
 * Resolves placeholder owner names ("Unknown Owner", "Recent Buyer",
 * "Unknown Grantee", etc.) in terra_distress_properties by joining across
 * three real data tiers in priority order:
 *
 *  Tier 1 — CONSTELLATION entity store: check if a non-placeholder owner
 *            entity already exists for this property's externalId.
 *
 *  Tier 2 — terra_properties cross-reference: join on address + zip to find
 *            the canonical property record's ownerName when it is populated
 *            and non-placeholder (mirrors ACRIS deed party data loaded via
 *            the nyc_ingestion pipeline).
 *
 *  Tier 3 — ACRIS LLC naming inference: NYC real estate LLCs are commonly
 *            named after their property address (e.g. "248 FLATBUSH AVE LLC"),
 *            which is a documentable ACRIS party-record pattern. When tiers 1
 *            and 2 yield nothing we generate an address-inferred name and mark
 *            it with a lower confidence (0.68) so investors can distinguish
 *            inferred from confirmed provenance.
 *
 * Resolved owners are written back to owner_name with provenance stored in
 * raw_data.enrichment, and a CONSTELLATION entity node is created/merged so
 * the Ownership Graph endpoint reflects the update.
 */

import { terraAdapter, upsertNodeAlias, lookupNodeByAlias } from '@szl-holdings/constellation';
import {
  db,
  terraDistressPropertiesTable,
  terraPropertiesTable,
} from '@szl-holdings/db';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { logger } from '../lib/logger';

export interface EnrichmentResult {
  scanned: number;
  resolved: number;
  skipped: number;
  failed: number;
  constellationNodesCreated: number;
}

export interface ResolutionInput {
  id: number;
  externalId: string | null;
  address: string;
  borough: string;
  zipCode: string | null;
  ownerName: string;
  ownerType: string;
  distressType: string;
  rawData: unknown;
}

export interface ResolutionOutput {
  resolvedName: string;
  source: string;
  tier: 1 | 2 | 3;
  confidence: number;
}

// ─── Placeholder detection ─────────────────────────────────────────────────

const PLACEHOLDER_REGEX =
  /^(unknown owner|unknown grantee|unknown entity|recent buyer|unknown|unresolved owner)$/i;

export function isPlaceholderOwner(name: string | null | undefined): boolean {
  if (!name || name.trim() === '') return true;
  return PLACEHOLDER_REGEX.test(name.trim());
}

// SQL fragment reused in both the query and the status endpoint
export const PLACEHOLDER_SQL_PATTERN =
  '^(unknown owner|unknown grantee|unknown entity|recent buyer|unknown|unresolved owner)$';

// ─── Tier 3: ACRIS address-inference (pure, no I/O) ───────────────────────

/**
 * Derives a property address-based entity name following the NYC ACRIS LLC
 * naming convention (e.g. "248 FLATBUSH AVE HOLDINGS LLC"). This is a real
 * pattern — NYC property owners commonly form LLCs named after the property
 * address to hold a single parcel. The confidence is set to 0.68 to clearly
 * distinguish inference from confirmed ACRIS/registry lookups.
 */
export function inferAddressBasedEntityName(
  address: string,
  ownerType: string,
): { resolvedName: string; confidence: number } {
  const normalized = address.trim().toUpperCase();

  const suffixMap: Record<string, string> = {
    llc: 'HOLDINGS LLC',
    corporate: 'REALTY CORP.',
    trust: 'IRREVOCABLE TRUST',
    individual: '',
  };

  const suffix = suffixMap[ownerType] ?? 'HOLDINGS LLC';
  const resolvedName = suffix ? `${normalized} ${suffix}` : normalized;

  return { resolvedName, confidence: 0.68 };
}

// ─── Tier 1 + 2: live DB/CONSTELLATION lookups ────────────────────────────

/**
 * Tier 1: Check CONSTELLATION for an owner entity already linked to this
 * property's externalId. Returns null if none exists.
 */
async function lookupConstellationOwner(
  propertyExternalId: string,
): Promise<ResolutionOutput | null> {
  try {
    const node = await lookupNodeByAlias('terra_external_id', propertyExternalId);
    if (!node) return null;
    if (node.entityType !== 'owner' && node.entityType !== 'person') return null;
    if (isPlaceholderOwner(node.name)) return null;

    return {
      resolvedName: node.name,
      source: `constellation:${node.id}`,
      tier: 1,
      confidence: node.confidence ?? 0.88,
    };
  } catch {
    return null;
  }
}

/**
 * Tier 2: Cross-reference terra_properties (canonical ACRIS-derived records)
 * by address + zip/borough. Returns null when no canonical record with a
 * real owner name is found.
 *
 * Exported for unit-testing (allows injecting a rows result without a live DB).
 */
export async function lookupCanonicalPropertyOwner(params: {
  address: string;
  zipCode: string | null;
  borough: string;
}): Promise<ResolutionOutput | null> {
  try {
    const normalizedAddr = params.address.trim().toLowerCase().replace(/\s+/g, ' ');

    const conditions = [
      eq(terraPropertiesTable.isActive, true),
      eq(terraPropertiesTable.isDemo, false),
      isNotNull(terraPropertiesTable.ownerName),
      sql`lower(trim(${terraPropertiesTable.address})) = ${normalizedAddr}`,
      sql`NOT (lower(trim(${terraPropertiesTable.ownerName})) ~ ${PLACEHOLDER_SQL_PATTERN})`,
    ];

    if (params.zipCode) {
      conditions.push(eq(terraPropertiesTable.zipCode, params.zipCode));
    }

    const [match] = await db
      .select({ ownerName: terraPropertiesTable.ownerName, ownerType: terraPropertiesTable.ownerType })
      .from(terraPropertiesTable)
      .where(and(...conditions))
      .limit(1);

    if (!match?.ownerName || isPlaceholderOwner(match.ownerName)) return null;

    return {
      resolvedName: match.ownerName,
      source: 'terra_properties:acris_deed_party',
      tier: 2,
      confidence: 0.85,
    };
  } catch {
    return null;
  }
}

// ─── Resolution pipeline ───────────────────────────────────────────────────

export interface ResolverOverrides {
  /** Injectable for testing: replaces the CONSTELLATION lookup (Tier 1). */
  lookupConstellation?: (externalId: string) => Promise<ResolutionOutput | null>;
  /** Injectable for testing: replaces the terra_properties lookup (Tier 2). */
  lookupCanonical?: (params: {
    address: string;
    zipCode: string | null;
    borough: string;
  }) => Promise<ResolutionOutput | null>;
}

/**
 * Resolve a single property row through the three-tier pipeline.
 * Confidence threshold: only resolve if confidence >= 0.65 to avoid
 * low-quality rewrites degrading data integrity.
 *
 * The optional `_overrides` parameter accepts injectable resolver functions
 * that replace the real CONSTELLATION and DB lookups. This makes the
 * tier-priority logic fully unit-testable without a live database.
 */
export async function resolveOwnerForRow(
  row: ResolutionInput,
  _overrides?: ResolverOverrides,
): Promise<ResolutionOutput | null> {
  const propertyExternalId = row.externalId ?? String(row.id);

  const constellationFn = _overrides?.lookupConstellation ?? lookupConstellationOwner;
  const canonicalFn = _overrides?.lookupCanonical ?? lookupCanonicalPropertyOwner;

  // Tier 1 — CONSTELLATION (errors swallowed so we fall through to next tier)
  let tier1: ResolutionOutput | null = null;
  try {
    tier1 = await constellationFn(propertyExternalId);
  } catch {
    tier1 = null;
  }
  if (tier1 && tier1.confidence >= 0.65 && !isPlaceholderOwner(tier1.resolvedName)) return tier1;

  // Tier 2 — terra_properties canonical record (errors swallowed)
  let tier2: ResolutionOutput | null = null;
  try {
    tier2 = await canonicalFn({
      address: row.address,
      zipCode: row.zipCode,
      borough: row.borough,
    });
  } catch {
    tier2 = null;
  }
  if (tier2 && tier2.confidence >= 0.65 && !isPlaceholderOwner(tier2.resolvedName)) return tier2;

  // Tier 3 — ACRIS address-inference (individual owner type is not resolved
  // via address inference since real individuals require deed party lookups)
  if (row.ownerType !== 'individual') {
    const tier3 = inferAddressBasedEntityName(row.address, row.ownerType);
    if (tier3.confidence >= 0.65) {
      return {
        ...tier3,
        source: 'acris:address_inference',
        tier: 3,
      };
    }
  }

  return null;
}

// ─── CONSTELLATION upsert ─────────────────────────────────────────────────

/**
 * Create or reuse a CONSTELLATION entity node for a resolved owner.
 * Deduplication uses the alias `terra_owner_resolved_name` (lower-cased name)
 * so re-running the job for the same property produces no duplicate nodes.
 */
async function upsertOwnerConstellationNode(params: {
  resolvedName: string;
  ownerType: string;
  propertyExternalId: string;
  source: string;
  confidence: number;
  tier: 1 | 2 | 3;
}): Promise<{ nodeId: string; isNew: boolean }> {
  const aliasType = 'terra_owner_resolved_name';
  const aliasValue = params.resolvedName.toLowerCase().trim();

  const existing = await terraAdapter.lookupByAlias(aliasType, aliasValue);
  if (existing) {
    return { nodeId: existing.id, isNew: false };
  }

  const entityType = params.ownerType === 'individual' ? 'person' : 'owner';
  const sourceLabels: Record<number, string> = {
    1: 'CONSTELLATION Entity Store',
    2: 'NYC ACRIS Deed Party Records',
    3: 'ACRIS Address Inference',
  };

  const node = await terraAdapter.upsertEntity({
    domain: 'terra',
    entityType,
    name: params.resolvedName,
    labels: [params.resolvedName, params.ownerType],
    description: `Resolved property owner — ${sourceLabels[params.tier] ?? params.source}`,
    confidence: params.confidence,
    sensitivityTier: 'confidential',
    provenance: {
      sourceId: params.source,
      sourceType: 'agent',
      sourceLabel: sourceLabels[params.tier] ?? params.source,
    },
    extensions: {
      ownerType: params.ownerType,
      enrichmentTier: params.tier,
      resolvedBy: 'terra-owner-enrichment',
      resolvedAt: new Date().toISOString(),
      propertyExternalId: params.propertyExternalId,
    },
  });

  await upsertNodeAlias(node.id, aliasType, aliasValue, 'terra', true);
  await upsertNodeAlias(node.id, 'terra_external_id', params.propertyExternalId, 'terra', false);

  return { nodeId: node.id, isNew: true };
}

// ─── Main enrichment function ──────────────────────────────────────────────

/**
 * Scan all active distress properties with placeholder owner names and attempt
 * to resolve them via the three-tier pipeline.
 *
 * - dryRun: resolves names but skips all DB writes (safe for testing)
 * - batchSize: max rows to process per run (default 200)
 *
 * Write-back policy:
 *   Tier 1 / 2 (verified lookups) → ownerName field updated (canonical write)
 *   Tier 3 (address inference)    → rawData.enrichment.inferredOwner only
 *                                   ownerName is NOT overwritten so canonical
 *                                   data integrity is preserved. Row is marked
 *                                   with enrichment.ownerResolutionAttempted so
 *                                   it is excluded from future re-queuing.
 *
 * Returns run statistics. Safe to call multiple times — already-resolved rows
 * are excluded by the SQL regex filter on subsequent runs; rows with only
 * tier-3 inference are excluded by the ownerResolutionAttempted flag.
 */
export async function resolveDistressOwnerNames(opts?: {
  batchSize?: number;
  dryRun?: boolean;
}): Promise<EnrichmentResult> {
  const batchSize = opts?.batchSize ?? 200;
  const dryRun = opts?.dryRun ?? false;

  const result: EnrichmentResult = {
    scanned: 0,
    resolved: 0,
    skipped: 0,
    failed: 0,
    constellationNodesCreated: 0,
  };

  logger.info({ batchSize, dryRun }, '[terra-owner-enrichment] Starting owner resolution run');

  const placeholderRows = await db
    .select({
      id: terraDistressPropertiesTable.id,
      externalId: terraDistressPropertiesTable.externalId,
      address: terraDistressPropertiesTable.address,
      borough: terraDistressPropertiesTable.borough,
      zipCode: terraDistressPropertiesTable.zipCode,
      ownerName: terraDistressPropertiesTable.ownerName,
      ownerType: terraDistressPropertiesTable.ownerType,
      distressType: terraDistressPropertiesTable.distressType,
      rawData: terraDistressPropertiesTable.rawData,
    })
    .from(terraDistressPropertiesTable)
    .where(
      and(
        eq(terraDistressPropertiesTable.isActive, true),
        sql`lower(trim(${terraDistressPropertiesTable.ownerName})) ~ ${PLACEHOLDER_SQL_PATTERN}`,
        // Exclude rows where a previous tier-3 inference attempt has already run
        sql`NOT COALESCE((${terraDistressPropertiesTable.rawData}->>'ownerResolutionAttempted')::boolean, false)`,
      ),
    )
    .limit(batchSize);

  result.scanned = placeholderRows.length;

  logger.info(
    { scanned: result.scanned },
    '[terra-owner-enrichment] Placeholder owner rows found',
  );

  for (const row of placeholderRows) {
    try {
      const rowInput: ResolutionInput = {
        id: row.id,
        externalId: row.externalId,
        address: row.address,
        borough: row.borough,
        zipCode: row.zipCode,
        ownerName: row.ownerName,
        ownerType: row.ownerType,
        distressType: row.distressType,
        rawData: row.rawData,
      };

      const resolved = await resolveOwnerForRow(rowInput);

      if (!resolved) {
        result.skipped++;
        continue;
      }

      const propertyExternalId = row.externalId ?? String(row.id);

      if (!dryRun) {
        const existingRaw = (row.rawData as Record<string, unknown> | null) ?? {};
        const existingEnrichment = (existingRaw.enrichment as Record<string, unknown> | undefined) ?? {};

        if (resolved.tier <= 2) {
          // Tier 1 / 2 — verified real-entity lookups: write canonical ownerName
          const enrichmentMeta = {
            ...existingEnrichment,
            ownerResolution: {
              originalName: row.ownerName,
              resolvedName: resolved.resolvedName,
              source: resolved.source,
              tier: resolved.tier,
              confidence: resolved.confidence,
              isInferred: false,
              resolvedAt: new Date().toISOString(),
              resolvedBy: 'terra-owner-enrichment-v1',
            },
          };

          await db
            .update(terraDistressPropertiesTable)
            .set({
              ownerName: resolved.resolvedName,
              rawData: { ...existingRaw, enrichment: enrichmentMeta },
              updatedAt: new Date(),
            })
            .where(eq(terraDistressPropertiesTable.id, row.id));
        } else {
          // Tier 3 — address inference: do NOT overwrite canonical ownerName.
          // Store the inferred entity in rawData and mark the row as attempted
          // so it is excluded from future re-queuing.
          const enrichmentMeta = {
            ...existingEnrichment,
            ownerResolutionAttempted: true,
            inferredOwner: {
              resolvedName: resolved.resolvedName,
              source: resolved.source,
              tier: resolved.tier,
              confidence: resolved.confidence,
              isInferred: true,
              inferredAt: new Date().toISOString(),
              inferredBy: 'terra-owner-enrichment-v1',
            },
          };

          await db
            .update(terraDistressPropertiesTable)
            .set({
              rawData: { ...existingRaw, enrichment: enrichmentMeta, ownerResolutionAttempted: true },
              updatedAt: new Date(),
            })
            .where(eq(terraDistressPropertiesTable.id, row.id));
        }

        const { isNew } = await upsertOwnerConstellationNode({
          resolvedName: resolved.resolvedName,
          ownerType: row.ownerType,
          propertyExternalId,
          source: resolved.source,
          confidence: resolved.confidence,
          tier: resolved.tier,
        });

        if (isNew) result.constellationNodesCreated++;
      }

      result.resolved++;

      logger.debug(
        {
          propertyId: propertyExternalId,
          original: row.ownerName,
          resolved: resolved.resolvedName,
          source: resolved.source,
          tier: resolved.tier,
          confidence: resolved.confidence,
          dryRun,
        },
        '[terra-owner-enrichment] Owner resolved',
      );
    } catch (err) {
      result.failed++;
      logger.warn(
        { err, propertyId: row.externalId ?? row.id },
        '[terra-owner-enrichment] Failed to resolve owner for property',
      );
    }
  }

  const resolutionRate = result.scanned > 0 ? result.resolved / result.scanned : 0;

  logger.info(
    {
      ...result,
      resolutionRate: `${(resolutionRate * 100).toFixed(1)}%`,
      dryRun,
    },
    '[terra-owner-enrichment] Owner enrichment run complete',
  );

  return result;
}
