import { logger } from "./logger.js";

export type FeatureDataType = "numeric" | "categorical" | "boolean" | "text" | "embedding" | "time_series";

export interface FeatureDefinition {
  featureId: string;
  name: string;
  domain: string;
  description: string;
  dataType: FeatureDataType;
  computationQuery?: string;
  dependencies: string[];
  version: number;
  isActive: boolean;
  freshnessIntervalSeconds: number;
  tags: string[];
}

export interface ComputedFeature {
  featureId: string;
  entityId: string;
  entityType: string;
  value: unknown;
  computedAt: Date;
  expiresAt: Date | null;
  isStale: boolean;
}

export interface FeatureVector {
  entityId: string;
  entityType: string;
  features: Record<string, unknown>;
  computedAt: Date;
  staleFeatures: string[];
}

export interface FeatureFreshnessReport {
  featureId: string;
  totalEntities: number;
  staleCount: number;
  stalePct: number;
  oldestComputedAt: Date | null;
  status: "fresh" | "degraded" | "stale";
}

// ---------------------------------------------------------------------------
// In-memory feature cache (keyed by `${featureId}:${entityType}:${entityId}`)
// ---------------------------------------------------------------------------

const featureCache = new Map<string, ComputedFeature>();

// ---------------------------------------------------------------------------
// Pre-defined feature catalogs per domain
// ---------------------------------------------------------------------------

export const DOMAIN_FEATURE_CATALOG: Record<string, FeatureDefinition[]> = {
  vessels: [
    { featureId: "vessels.fuel_consumption_7d_avg", name: "7-Day Avg Fuel Consumption", domain: "vessels", description: "Rolling 7-day average daily fuel consumption (metric tonnes)", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 3600, tags: ["fuel", "time_series"] },
    { featureId: "vessels.speed_variance", name: "Speed Variance", domain: "vessels", description: "Variance in vessel speed over the past 30 days", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 7200, tags: ["performance"] },
    { featureId: "vessels.days_since_last_maintenance", name: "Days Since Last Maintenance", domain: "vessels", description: "Calendar days since most recent scheduled maintenance", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 86400, tags: ["maintenance"] },
    { featureId: "vessels.route_deviation_score", name: "Route Deviation Score", domain: "vessels", description: "Normalised score (0–1) measuring deviation from optimal route", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 3600, tags: ["route"] },
    { featureId: "vessels.port_call_frequency", name: "Port Call Frequency", domain: "vessels", description: "Number of port calls in the past 90 days", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 86400, tags: ["operations"] },
    { featureId: "vessels.sanctions_risk_score", name: "Sanctions Risk Score", domain: "vessels", description: "Composite sanctions exposure score (0–100)", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 86400, tags: ["risk", "compliance"] },
    { featureId: "vessels.cargo_utilisation", name: "Cargo Utilisation Rate", domain: "vessels", description: "Average cargo utilisation across last 5 voyages", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 86400, tags: ["economics"] },
  ],
  terra: [
    { featureId: "terra.days_on_market", name: "Days on Market", domain: "terra", description: "Current days a property has been listed", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 86400, tags: ["listing"] },
    { featureId: "terra.price_per_sqft", name: "Price Per Sq Ft", domain: "terra", description: "Asking or last-sale price per square foot", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 86400, tags: ["valuation"] },
    { featureId: "terra.neighborhood_cap_rate", name: "Neighborhood Cap Rate", domain: "terra", description: "Median cap rate for comparable properties in the same sub-market", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 604800, tags: ["valuation", "investment"] },
    { featureId: "terra.price_reduction_count", name: "Price Reduction Count", domain: "terra", description: "Number of price reductions since listing", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 86400, tags: ["distress"] },
    { featureId: "terra.zoning_class", name: "Zoning Classification", domain: "terra", description: "Primary zoning code (residential / commercial / industrial / mixed)", dataType: "categorical", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 2592000, tags: ["property"] },
    { featureId: "terra.vacancy_rate_submarket", name: "Sub-Market Vacancy Rate", domain: "terra", description: "Current vacancy rate in the property's sub-market (%)", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 604800, tags: ["market"] },
    { featureId: "terra.walk_score", name: "Walk Score", domain: "terra", description: "Walk score (0–100) for location accessibility", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 2592000, tags: ["location"] },
  ],
  prism: [
    { featureId: "prism.case_age_days", name: "Case Age (Days)", domain: "prism", description: "Days since case was filed", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 86400, tags: ["case"] },
    { featureId: "prism.filing_jurisdiction", name: "Filing Jurisdiction", domain: "prism", description: "Federal / state court and district", dataType: "categorical", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 0, tags: ["court"] },
    { featureId: "prism.opposing_counsel_win_rate", name: "Opposing Counsel Win Rate", domain: "prism", description: "Historical win rate of opposing law firm in similar matters", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 604800, tags: ["counsel"] },
    { featureId: "prism.discovery_volume_pages", name: "Discovery Volume (Pages)", domain: "prism", description: "Total pages of discovery material exchanged", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 86400, tags: ["discovery"] },
    { featureId: "prism.motion_grant_rate_judge", name: "Judge Motion Grant Rate", domain: "prism", description: "Historical rate at which the assigned judge grants motions", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 604800, tags: ["judge"] },
    { featureId: "prism.settlement_demand_to_claimed_ratio", name: "Settlement-to-Claimed Ratio", domain: "prism", description: "Ratio of current settlement demand to amount claimed", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 86400, tags: ["settlement"] },
  ],
  aegis: [
    { featureId: "aegis.failed_auth_rate_1h", name: "Failed Auth Rate (1 h)", domain: "aegis", description: "Authentication failure events per minute in past hour", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 300, tags: ["auth", "anomaly"] },
    { featureId: "aegis.lateral_movement_score", name: "Lateral Movement Score", domain: "aegis", description: "Behavioural score indicating lateral movement patterns (0–100)", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 300, tags: ["threat"] },
    { featureId: "aegis.data_exfil_bytes_delta", name: "Data Exfil Bytes Delta", domain: "aegis", description: "Percentage change in outbound bytes vs 30-day baseline", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 300, tags: ["exfil"] },
    { featureId: "aegis.privilege_escalation_events", name: "Privilege Escalation Events", domain: "aegis", description: "Count of privilege escalation events in past 24 h", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 3600, tags: ["privilege"] },
    { featureId: "aegis.ioc_match_count", name: "IOC Match Count", domain: "aegis", description: "Number of indicator-of-compromise matches from threat feed", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 900, tags: ["ioc"] },
    { featureId: "aegis.user_baseline_deviation", name: "User Baseline Deviation", domain: "aegis", description: "Mahalanobis distance from user's established behavioural baseline", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 1800, tags: ["ueba"] },
  ],
  szl: [
    { featureId: "szl.revenue_growth_yoy", name: "Revenue Growth YoY", domain: "szl", description: "Year-over-year revenue growth rate (%)", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 2592000, tags: ["financials"] },
    { featureId: "szl.gross_margin", name: "Gross Margin", domain: "szl", description: "Gross profit margin (%)", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 2592000, tags: ["financials"] },
    { featureId: "szl.burn_multiple", name: "Burn Multiple", domain: "szl", description: "Ratio of net burn to net new ARR", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 2592000, tags: ["efficiency"] },
    { featureId: "szl.ndr", name: "Net Dollar Retention", domain: "szl", description: "Net dollar retention rate (%)", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 2592000, tags: ["saas_metrics"] },
    { featureId: "szl.months_runway", name: "Months of Runway", domain: "szl", description: "Projected cash runway at current burn rate (months)", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 604800, tags: ["capital"] },
    { featureId: "szl.sector_momentum_score", name: "Sector Momentum Score", domain: "szl", description: "Sector-level deal activity momentum (0–100)", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 604800, tags: ["market"] },
  ],
  lyte: [
    { featureId: "lyte.p99_latency_ms", name: "P99 Latency (ms)", domain: "lyte", description: "99th-percentile response latency over the past hour", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 60, tags: ["performance"] },
    { featureId: "lyte.error_rate_pct", name: "Error Rate (%)", domain: "lyte", description: "Percentage of requests returning 5xx in past 5 min", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 60, tags: ["reliability"] },
    { featureId: "lyte.cpu_utilisation_avg", name: "Avg CPU Utilisation (%)", domain: "lyte", description: "Average CPU utilisation across fleet for past 15 min", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 60, tags: ["capacity"] },
    { featureId: "lyte.incident_rate_7d", name: "7-Day Incident Rate", domain: "lyte", description: "Incidents per day over the past 7 days", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 3600, tags: ["incidents"] },
    { featureId: "lyte.slo_compliance_pct", name: "SLO Compliance (%)", domain: "lyte", description: "Percentage of SLO targets currently met", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 300, tags: ["slo"] },
    { featureId: "lyte.deployment_frequency_7d", name: "7-Day Deployment Frequency", domain: "lyte", description: "Number of deployments in past 7 days", dataType: "numeric", dependencies: [], version: 1, isActive: true, freshnessIntervalSeconds: 3600, tags: ["devops"] },
  ],
};

// ---------------------------------------------------------------------------
// Feature Store API
// ---------------------------------------------------------------------------

function cacheKey(featureId: string, entityType: string, entityId: string): string {
  return `${featureId}:${entityType}:${entityId}`;
}

export function storeFeature(feature: ComputedFeature): void {
  const key = cacheKey(feature.featureId, feature.entityType, feature.entityId);
  featureCache.set(key, { ...feature });
}

export function getFeature(featureId: string, entityType: string, entityId: string): ComputedFeature | null {
  const entry = featureCache.get(cacheKey(featureId, entityType, entityId));
  if (!entry) return null;
  const stale = entry.expiresAt ? entry.expiresAt < new Date() : false;
  return { ...entry, isStale: stale };
}

export function getFeatureVector(entityId: string, entityType: string, featureIds: string[]): FeatureVector {
  const features: Record<string, unknown> = {};
  const staleFeatures: string[] = [];

  for (const fid of featureIds) {
    const feat = getFeature(fid, entityType, entityId);
    if (feat) {
      features[fid] = feat.value;
      if (feat.isStale) staleFeatures.push(fid);
    }
  }

  return { entityId, entityType, features, computedAt: new Date(), staleFeatures };
}

export function computeFeature(
  definition: FeatureDefinition,
  entityId: string,
  entityType: string,
  rawValue: unknown
): ComputedFeature {
  const now = new Date();
  const expiresAt = definition.freshnessIntervalSeconds > 0
    ? new Date(now.getTime() + definition.freshnessIntervalSeconds * 1000)
    : null;

  const feature: ComputedFeature = {
    featureId: definition.featureId,
    entityId,
    entityType,
    value: rawValue,
    computedAt: now,
    expiresAt,
    isStale: false,
  };

  storeFeature(feature);
  logger.debug({ featureId: definition.featureId, entityId, entityType }, "Feature computed and stored");
  return feature;
}

export function checkFreshness(domain?: string): FeatureFreshnessReport[] {
  const byFeature = new Map<string, { total: number; stale: number; oldest: Date | null }>();

  for (const [, feat] of featureCache) {
    const def = Object.values(DOMAIN_FEATURE_CATALOG)
      .flat()
      .find((d) => d.featureId === feat.featureId);
    if (domain && def?.domain !== domain) continue;

    const existing = byFeature.get(feat.featureId) ?? { total: 0, stale: 0, oldest: null };
    existing.total++;
    if (feat.isStale) existing.stale++;
    if (!existing.oldest || feat.computedAt < existing.oldest) existing.oldest = feat.computedAt;
    byFeature.set(feat.featureId, existing);
  }

  return Array.from(byFeature.entries()).map(([featureId, stats]) => {
    const stalePct = stats.total > 0 ? stats.stale / stats.total : 0;
    const status: FeatureFreshnessReport["status"] = stalePct === 0 ? "fresh" : stalePct < 0.2 ? "degraded" : "stale";
    return { featureId, totalEntities: stats.total, staleCount: stats.stale, stalePct, oldestComputedAt: stats.oldest, status };
  });
}

export function getDomainFeatureDefinitions(domain: string): FeatureDefinition[] {
  return DOMAIN_FEATURE_CATALOG[domain] ?? [];
}

export function getAllFeatureDefinitions(): FeatureDefinition[] {
  return Object.values(DOMAIN_FEATURE_CATALOG).flat();
}

export function getFeatureStoreSummary() {
  const totalCached = featureCache.size;
  const staleCount = Array.from(featureCache.values()).filter(f => f.isStale).length;
  const domains = Object.keys(DOMAIN_FEATURE_CATALOG);
  const totalDefinitions = getAllFeatureDefinitions().length;
  return { totalCached, staleCount, domains, totalDefinitions, stalePct: totalCached > 0 ? staleCount / totalCached : 0 };
}
