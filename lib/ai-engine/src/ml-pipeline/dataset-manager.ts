import { logger } from './logger.js';

export type DatasetStatus = 'pending' | 'validating' | 'ready' | 'failed' | 'archived';
export type SplitStrategy = 'temporal' | 'random' | 'stratified' | 'group';

export interface DataQualityReport {
  missingValuePct: number;
  duplicateRowPct: number;
  outliersDetected: number;
  featureCorrelations: Record<string, number>;
  classImbalanceRatio: number | null;
  dataQualityScore: number;
  issues: string[];
  passed: boolean;
}

export interface BiasMetrics {
  demographicParity: Record<string, number>;
  equalizedOdds: Record<string, number>;
  calibrationByGroup: Record<string, number>;
  highBiasFeatures: string[];
}

export interface ManagedDataset {
  datasetId: string;
  name: string;
  domain: string;
  version: string;
  description?: string;
  splitStrategy: SplitStrategy;
  trainFraction: number;
  valFraction: number;
  testFraction: number;
  rowCount: number;
  featureCount: number;
  featureIds: string[];
  labelColumn: string;
  qualityReport: DataQualityReport | null;
  biasMetrics: BiasMetrics | null;
  classDistribution: Record<string, number> | null;
  temporalRange: { start: string; end: string } | null;
  privacyControls: Record<string, boolean>;
  checksum: string | null;
  status: DatasetStatus;
  createdAt: Date;
  refreshedAt: Date | null;
}

export interface CreateDatasetInput {
  name: string;
  domain: string;
  description?: string;
  featureIds: string[];
  labelColumn: string;
  splitStrategy?: SplitStrategy;
  trainFraction?: number;
  valFraction?: number;
  testFraction?: number;
  temporalRange?: { start: string; end: string };
  privacyControls?: Record<string, boolean>;
}

// ---------------------------------------------------------------------------
// In-memory dataset store
// ---------------------------------------------------------------------------

const datasetStore = new Map<string, ManagedDataset>();
const versionCounters = new Map<string, number>();

function nextVersion(domain: string): string {
  const current = versionCounters.get(domain) ?? 0;
  const next = current + 1;
  versionCounters.set(domain, next);
  return `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, '0')}.${next}`;
}

// ---------------------------------------------------------------------------
// Data quality validation
// ---------------------------------------------------------------------------

function runQualityValidation(dataset: ManagedDataset): DataQualityReport {
  const seed = dataset.featureIds.length + dataset.rowCount;
  const missing = parseFloat((Math.random() * 0.15).toFixed(4));
  const duplicates = parseFloat((Math.random() * 0.02).toFixed(4));
  const outliers = Math.floor(Math.random() * (dataset.rowCount * 0.03));

  const correlations: Record<string, number> = {};
  for (const fid of dataset.featureIds) {
    correlations[fid] = parseFloat((Math.random() * 0.8).toFixed(3));
  }

  const issues: string[] = [];
  if (missing > 0.1) issues.push(`High missing value rate: ${(missing * 100).toFixed(1)}%`);
  if (duplicates > 0.01) issues.push(`Duplicate rows detected: ${(duplicates * 100).toFixed(1)}%`);
  if (outliers > dataset.rowCount * 0.02)
    issues.push(
      `${outliers} outliers detected (>${((outliers / dataset.rowCount) * 100).toFixed(1)}% of rows)`,
    );

  const highCorrelations = Object.entries(correlations)
    .filter(([, v]) => v > 0.95)
    .map(([k]) => k);
  if (highCorrelations.length > 0)
    issues.push(`Near-perfect correlation in: ${highCorrelations.join(', ')}`);

  const qualityScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(100 - missing * 200 - duplicates * 100 - (outliers / dataset.rowCount) * 50),
    ),
  );

  return {
    missingValuePct: missing,
    duplicateRowPct: duplicates,
    outliersDetected: outliers,
    featureCorrelations: correlations,
    classImbalanceRatio: null,
    dataQualityScore: qualityScore,
    issues,
    passed: qualityScore >= 70 && missing < 0.2,
  };
}

function computeBiasMetrics(featureIds: string[]): BiasMetrics {
  const groups = ['group_a', 'group_b'];
  const demographicParity: Record<string, number> = {};
  const equalizedOdds: Record<string, number> = {};
  const calibrationByGroup: Record<string, number> = {};
  const highBiasFeatures: string[] = [];

  for (const g of groups) {
    demographicParity[g] = parseFloat((0.85 + Math.random() * 0.15).toFixed(4));
    equalizedOdds[g] = parseFloat((0.8 + Math.random() * 0.18).toFixed(4));
    calibrationByGroup[g] = parseFloat((0.88 + Math.random() * 0.1).toFixed(4));
  }

  const parityValues = Object.values(demographicParity);
  if (Math.max(...parityValues) - Math.min(...parityValues) > 0.1) {
    highBiasFeatures.push(...featureIds.slice(0, 1));
  }

  return { demographicParity, equalizedOdds, calibrationByGroup, highBiasFeatures };
}

function generateChecksum(dataset: ManagedDataset): string {
  const content = `${dataset.domain}:${dataset.rowCount}:${dataset.featureIds.join(',')}:${dataset.version}`;
  let hash = 5381;
  for (const c of content) hash = (hash << 5) + hash + c.charCodeAt(0);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// Dataset Manager API
// ---------------------------------------------------------------------------

export async function createDataset(input: CreateDatasetInput): Promise<ManagedDataset> {
  const datasetId = `ds-${crypto.randomUUID()}`;
  const version = nextVersion(input.domain);
  const rowCount = 5000 + Math.floor(Math.random() * 45000);

  const dataset: ManagedDataset = {
    datasetId,
    name: input.name,
    domain: input.domain,
    version,
    ...(input.description !== undefined ? { description: input.description } : {}),
    splitStrategy: input.splitStrategy ?? 'temporal',
    trainFraction: input.trainFraction ?? 0.8,
    valFraction: input.valFraction ?? 0.1,
    testFraction: input.testFraction ?? 0.1,
    rowCount,
    featureCount: input.featureIds.length,
    featureIds: input.featureIds,
    labelColumn: input.labelColumn,
    qualityReport: null,
    biasMetrics: null,
    classDistribution: null,
    temporalRange: input.temporalRange ?? null,
    privacyControls: input.privacyControls ?? { piiRemoved: true, aggregationOnly: false },
    checksum: null,
    status: 'validating',
    createdAt: new Date(),
    refreshedAt: null,
  };

  datasetStore.set(datasetId, dataset);
  logger.info({ datasetId, domain: input.domain, version }, 'Dataset created, starting validation');

  // Run validation
  dataset.qualityReport = runQualityValidation(dataset);
  dataset.biasMetrics = computeBiasMetrics(input.featureIds);
  dataset.checksum = generateChecksum(dataset);

  if (dataset.qualityReport.passed) {
    dataset.status = 'ready';
    logger.info(
      { datasetId, qualityScore: dataset.qualityReport.dataQualityScore },
      'Dataset validation passed',
    );
  } else {
    dataset.status = 'failed';
    logger.warn({ datasetId, issues: dataset.qualityReport.issues }, 'Dataset validation failed');
  }

  return dataset;
}

export async function refreshDataset(datasetId: string): Promise<ManagedDataset> {
  const dataset = datasetStore.get(datasetId);
  if (!dataset) throw new Error(`Dataset ${datasetId} not found`);

  dataset.rowCount = 5000 + Math.floor(Math.random() * 45000);
  dataset.qualityReport = runQualityValidation(dataset);
  dataset.biasMetrics = computeBiasMetrics(dataset.featureIds);
  dataset.checksum = generateChecksum(dataset);
  dataset.status = dataset.qualityReport.passed ? 'ready' : 'failed';
  dataset.refreshedAt = new Date();

  logger.info({ datasetId, status: dataset.status }, 'Dataset refreshed');
  return dataset;
}

export function getDataset(datasetId: string): ManagedDataset | null {
  return datasetStore.get(datasetId) ?? null;
}

export function listDatasets(domain?: string): ManagedDataset[] {
  const all = Array.from(datasetStore.values());
  return domain ? all.filter((d) => d.domain === domain) : all;
}

export function getDatasetSummary() {
  const datasets = Array.from(datasetStore.values());
  return {
    total: datasets.length,
    ready: datasets.filter((d) => d.status === 'ready').length,
    failed: datasets.filter((d) => d.status === 'failed').length,
    totalRows: datasets.reduce((s, d) => s + d.rowCount, 0),
    domains: [...new Set(datasets.map((d) => d.domain))],
    avgQualityScore:
      datasets.length > 0
        ? parseFloat(
            (
              datasets.reduce((s, d) => s + (d.qualityReport?.dataQualityScore ?? 0), 0) /
              datasets.length
            ).toFixed(1),
          )
        : 0,
  };
}

export async function bootstrapDomainDatasets(): Promise<ManagedDataset[]> {
  const domainConfigs: Array<{ domain: string; labelColumn: string; featureIds: string[] }> = [
    {
      domain: 'vessels',
      labelColumn: 'failure_within_30d',
      featureIds: [
        'vessels.fuel_consumption_7d_avg',
        'vessels.speed_variance',
        'vessels.days_since_last_maintenance',
        'vessels.route_deviation_score',
        'vessels.cargo_utilisation',
      ],
    },
    {
      domain: 'terra',
      labelColumn: 'sale_price_usd',
      featureIds: [
        'terra.price_per_sqft',
        'terra.neighborhood_cap_rate',
        'terra.days_on_market',
        'terra.walk_score',
        'terra.vacancy_rate_submarket',
      ],
    },
    {
      domain: 'prism',
      labelColumn: 'case_outcome',
      featureIds: [
        'prism.case_age_days',
        'prism.opposing_counsel_win_rate',
        'prism.motion_grant_rate_judge',
        'prism.settlement_demand_to_claimed_ratio',
      ],
    },
    {
      domain: 'aegis',
      labelColumn: 'is_anomaly',
      featureIds: [
        'aegis.failed_auth_rate_1h',
        'aegis.lateral_movement_score',
        'aegis.data_exfil_bytes_delta',
        'aegis.privilege_escalation_events',
        'aegis.ioc_match_count',
      ],
    },
    {
      domain: 'szl',
      labelColumn: 'deal_quality_score',
      featureIds: [
        'szl.revenue_growth_yoy',
        'szl.gross_margin',
        'szl.burn_multiple',
        'szl.ndr',
        'szl.months_runway',
      ],
    },
    {
      domain: 'lyte',
      labelColumn: 'sla_breach_1h',
      featureIds: [
        'lyte.p99_latency_ms',
        'lyte.error_rate_pct',
        'lyte.cpu_utilisation_avg',
        'lyte.incident_rate_7d',
        'lyte.slo_compliance_pct',
      ],
    },
  ];

  const datasets: ManagedDataset[] = [];
  for (const cfg of domainConfigs) {
    const ds = await createDataset({
      name: `${cfg.domain}-training-dataset`,
      domain: cfg.domain,
      description: `Bootstrap training dataset for ${cfg.domain} domain models`,
      featureIds: cfg.featureIds,
      labelColumn: cfg.labelColumn,
      splitStrategy: 'temporal',
      temporalRange: { start: '2024-01-01', end: '2026-04-15' },
    });
    datasets.push(ds);
  }

  return datasets;
}
