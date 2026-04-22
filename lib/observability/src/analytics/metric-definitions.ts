import type {
  CalculationType,
  FilterCondition,
  MetricDefinitionInput,
} from './types.js';

// ---------------------------------------------------------------------------
// Metric Definition Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, MetricDefinitionInput>();

export function registerMetric(definition: MetricDefinitionInput): void {
  _registry.set(definition.metricId, definition);
}

export function getMetric(metricId: string): MetricDefinitionInput | undefined {
  return _registry.get(metricId);
}

export function listMetrics(domain?: string): MetricDefinitionInput[] {
  const all = Array.from(_registry.values());
  return domain ? all.filter((m) => m.domain === domain) : all;
}

export function unregisterMetric(metricId: string): void {
  _registry.delete(metricId);
}

// ---------------------------------------------------------------------------
// Built-in Domain Metrics
// ---------------------------------------------------------------------------

const BUILT_IN_METRICS: MetricDefinitionInput[] = [
  // --- Vessels ---
  {
    metricId: 'vessels.active_voyages',
    domain: 'vessels',
    name: 'Active Voyages',
    description: 'Number of voyages currently in progress',
    calculationType: 'count',
    eventName: 'voyage_started',
    filterConditions: [{ field: 'status', operator: 'eq', value: 'active' }],
    dimensions: ['vessel_class', 'route', 'flag_state'],
    unit: 'voyages',
    granularities: ['hour', 'day', 'week', 'month'],
    visualizationType: 'line',
  },
  {
    metricId: 'vessels.avg_voyage_duration_hours',
    domain: 'vessels',
    name: 'Avg Voyage Duration',
    description: 'Average voyage duration in hours, grouped by route and vessel class',
    calculationType: 'avg',
    eventName: 'voyage_completed',
    numericField: 'duration_hours',
    dimensions: ['route', 'vessel_class'],
    unit: 'hours',
    granularities: ['day', 'week', 'month'],
    visualizationType: 'bar',
  },
  {
    metricId: 'vessels.fuel_efficiency',
    domain: 'vessels',
    name: 'Fuel Efficiency',
    description: 'Average fuel consumption per nautical mile',
    calculationType: 'avg',
    eventName: 'telemetry_report',
    numericField: 'fuel_per_nm',
    dimensions: ['vessel_class', 'route'],
    unit: 't/nm',
    granularities: ['day', 'week', 'month'],
    visualizationType: 'line',
  },
  // --- Lyte (MSP/AIOps) ---
  {
    metricId: 'lyte.incident_resolution_time',
    domain: 'lyte',
    name: 'Mean Time to Resolve',
    description: 'Average time to resolve incidents in minutes',
    calculationType: 'avg',
    eventName: 'incident_resolved',
    numericField: 'resolution_time_minutes',
    dimensions: ['severity', 'tenant_id'],
    unit: 'minutes',
    granularities: ['hour', 'day', 'week'],
    visualizationType: 'line',
    thresholdWarning: 60,
    thresholdCritical: 240,
    thresholdDirection: 'above',
  },
  {
    metricId: 'lyte.tenant_health_score',
    domain: 'lyte',
    name: 'Tenant Health Score',
    description: 'Composite health score across all monitored tenants',
    calculationType: 'avg',
    eventName: 'health_check_completed',
    numericField: 'health_score',
    dimensions: ['tenant_id', 'plan'],
    unit: 'score',
    granularities: ['hour', 'day'],
    visualizationType: 'number',
    thresholdWarning: 70,
    thresholdCritical: 50,
    thresholdDirection: 'below',
  },
  {
    metricId: 'lyte.alert_volume',
    domain: 'lyte',
    name: 'Alert Volume',
    description: 'Total number of alerts fired',
    calculationType: 'count',
    eventName: 'alert_triggered',
    dimensions: ['severity', 'tenant_id', 'alert_type'],
    unit: 'alerts',
    granularities: ['minute', 'hour', 'day'],
    visualizationType: 'bar',
  },
  // --- Carlota Jo (Consulting) ---
  {
    metricId: 'carlota_jo.client_health_score',
    domain: 'carlota_jo',
    name: 'Client Health Score',
    description: 'Composite engagement and value score per client',
    calculationType: 'avg',
    eventName: 'client_health_computed',
    numericField: 'health_score',
    dimensions: ['client_id', 'engagement_tier'],
    unit: 'score',
    granularities: ['day', 'week', 'month'],
    visualizationType: 'line',
  },
  {
    metricId: 'carlota_jo.pipeline_conversion_rate',
    domain: 'carlota_jo',
    name: 'Pipeline Conversion Rate',
    description: 'Ratio of prospects converted to active clients',
    calculationType: 'ratio',
    eventName: 'deal_stage_changed',
    dimensions: ['source_channel', 'service_line'],
    unit: '%',
    granularities: ['week', 'month'],
    visualizationType: 'number',
  },
  // --- SZL Holdings ---
  {
    metricId: 'szl.portfolio_irr',
    domain: 'szl',
    name: 'Portfolio IRR',
    description: 'Internal rate of return across the investment portfolio',
    calculationType: 'avg',
    eventName: 'irr_computed',
    numericField: 'irr_percent',
    dimensions: ['fund', 'deal_type', 'geography'],
    unit: '%',
    granularities: ['month'],
    visualizationType: 'number',
  },
  {
    metricId: 'szl.deal_source_quality',
    domain: 'szl',
    name: 'Deal Source Quality',
    description: 'Average deal quality score by source channel',
    calculationType: 'avg',
    eventName: 'deal_scored',
    numericField: 'quality_score',
    dimensions: ['source_channel'],
    unit: 'score',
    granularities: ['month'],
    visualizationType: 'bar',
  },
  // --- Terra (Real Estate) ---
  {
    metricId: 'terra.distress_signal_count',
    domain: 'terra',
    name: 'Distress Signals Detected',
    description: 'Count of distressed property signals identified',
    calculationType: 'count',
    eventName: 'distress_signal_detected',
    dimensions: ['borough', 'asset_class', 'signal_type'],
    unit: 'signals',
    granularities: ['day', 'week', 'month'],
    visualizationType: 'bar',
  },
  {
    metricId: 'terra.avg_cap_rate',
    domain: 'terra',
    name: 'Average Cap Rate',
    description: 'Average capitalization rate across tracked properties',
    calculationType: 'avg',
    eventName: 'property_valued',
    numericField: 'cap_rate',
    dimensions: ['borough', 'asset_class'],
    unit: '%',
    granularities: ['week', 'month'],
    visualizationType: 'line',
  },
  // --- Distribution OS (Content) ---
  {
    metricId: 'distribution_os.content_virality_score',
    domain: 'distribution_os',
    name: 'Content Virality Score',
    description: 'Predicted virality score for published content',
    calculationType: 'avg',
    eventName: 'content_published',
    numericField: 'virality_score',
    dimensions: ['content_type', 'platform', 'author'],
    unit: 'score',
    granularities: ['hour', 'day', 'week'],
    visualizationType: 'line',
  },
  {
    metricId: 'distribution_os.engagement_rate',
    domain: 'distribution_os',
    name: 'Engagement Rate',
    description: 'Average engagement rate (likes + shares + comments / impressions)',
    calculationType: 'avg',
    eventName: 'content_engagement',
    numericField: 'engagement_rate',
    dimensions: ['content_type', 'platform'],
    unit: '%',
    granularities: ['hour', 'day'],
    visualizationType: 'area',
  },
  // --- Platform-wide ---
  {
    metricId: 'platform.active_users',
    domain: 'platform',
    name: 'Daily Active Users',
    description: 'Distinct users who performed at least one action',
    calculationType: 'distinct_count',
    eventName: 'user_action',
    dimensions: ['app', 'platform'],
    unit: 'users',
    granularities: ['hour', 'day', 'week', 'month'],
    visualizationType: 'line',
  },
  {
    metricId: 'platform.api_error_rate',
    domain: 'platform',
    name: 'API Error Rate',
    description: 'Percentage of API requests returning 5xx',
    calculationType: 'rate',
    eventName: 'api_request',
    filterConditions: [{ field: 'statusCode', operator: 'gte', value: 500 }],
    dimensions: ['sourceApp'],
    unit: '%',
    granularities: ['minute', 'hour', 'day'],
    visualizationType: 'line',
    thresholdWarning: 1,
    thresholdCritical: 5,
    thresholdDirection: 'above',
  },
];

export function registerBuiltInMetrics(): void {
  for (const metric of BUILT_IN_METRICS) {
    registerMetric(metric);
  }
}

// ---------------------------------------------------------------------------
// Calculation helpers (run in-memory on raw event arrays)
// ---------------------------------------------------------------------------

export interface RawDataPoint {
  value: number;
  timestamp: Date;
  dimensions?: Record<string, string>;
  [key: string]: unknown;
}

export function applyFilters(rows: RawDataPoint[], conditions: FilterCondition[]): RawDataPoint[] {
  if (!conditions || conditions.length === 0) return rows;
  return rows.filter((row) => conditions.every((cond) => matchesCondition(row, cond)));
}

function matchesCondition(row: RawDataPoint, cond: FilterCondition): boolean {
  const val = row[cond.field];
  switch (cond.operator) {
    case 'eq':
      return val === cond.value;
    case 'neq':
      return val !== cond.value;
    case 'gt':
      return typeof val === 'number' && val > (cond.value as number);
    case 'gte':
      return typeof val === 'number' && val >= (cond.value as number);
    case 'lt':
      return typeof val === 'number' && val < (cond.value as number);
    case 'lte':
      return typeof val === 'number' && val <= (cond.value as number);
    case 'in':
      return Array.isArray(cond.value) && (cond.value as unknown[]).includes(val);
    case 'contains':
      return typeof val === 'string' && val.includes(String(cond.value));
    default:
      return true;
  }
}

export function calculate(values: number[], type: CalculationType): number {
  if (values.length === 0) return 0;
  switch (type) {
    case 'count':
      return values.length;
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'distinct_count':
      return new Set(values).size;
    case 'rate':
      return (values.filter((v) => v > 0).length / values.length) * 100;
    case 'ratio':
      return values.length >= 2 ? values[0]! / values[1]! : 0;
    case 'percentile': {
      const sorted = [...values].sort((a, b) => a - b);
      const p95idx = Math.floor(sorted.length * 0.95);
      return sorted[p95idx] ?? sorted[sorted.length - 1] ?? 0;
    }
    default:
      return values.length;
  }
}
