export type AnalyticsGranularity = "minute" | "hour" | "day" | "week" | "month";
export type AttributionModel = "first_touch" | "last_touch" | "linear" | "time_decay";
export type AnomalyType = "spike" | "drop" | "trend_change" | "seasonal_deviation" | "missing";
export type AnomalySeverity = "low" | "medium" | "high" | "critical";
export type VisualizationType = "line" | "bar" | "area" | "number" | "table" | "heatmap" | "funnel";
export type CalculationType = "count" | "sum" | "avg" | "min" | "max" | "distinct_count" | "rate" | "ratio" | "percentile";

// ---------------------------------------------------------------------------
// Event Tracking
// ---------------------------------------------------------------------------

export interface AnalyticsEventContext {
  userId?: string;
  sessionId?: string;
  tenantId?: string;
  organizationId?: number;
  deviceType?: string;
  platform?: string;
  url?: string;
  referrer?: string;
  country?: string;
  userAgent?: string;
}

export interface TrackEventPayload {
  eventName: string;
  domain: string;
  sourceApp: string;
  properties?: Record<string, unknown>;
  dimensions?: Record<string, string>;
  numericValue?: number;
  occurredAt?: Date;
  context?: AnalyticsEventContext;
  serverSide?: boolean;
}

// ---------------------------------------------------------------------------
// Metric Definitions
// ---------------------------------------------------------------------------

export interface FilterCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
  value: unknown;
}

export interface MetricDefinitionInput {
  metricId: string;
  domain: string;
  name: string;
  description?: string;
  calculationType: CalculationType;
  eventName?: string;
  numericField?: string;
  filterConditions?: FilterCondition[];
  dimensions?: string[];
  unit?: string;
  granularities?: AnalyticsGranularity[];
  visualizationType?: VisualizationType;
  thresholdWarning?: number;
  thresholdCritical?: number;
  thresholdDirection?: "above" | "below";
}

// ---------------------------------------------------------------------------
// Aggregated Metrics
// ---------------------------------------------------------------------------

export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  sampleCount: number;
  dimensions?: Record<string, string>;
}

export interface MetricQueryResult {
  metricId: string;
  domain: string;
  granularity: AnalyticsGranularity;
  periodStart: Date;
  periodEnd: Date;
  dataPoints: MetricDataPoint[];
  currentValue: number;
  previousValue?: number;
  changePercent?: number;
  trend?: "up" | "down" | "stable";
}

// ---------------------------------------------------------------------------
// Attribution
// ---------------------------------------------------------------------------

export interface AttributionTouchpoint {
  journeyId: string;
  entityId: string;
  entityType: string;
  domain: string;
  touchpointType: string;
  channel?: string;
  content?: string;
  campaignId?: string;
  properties?: Record<string, unknown>;
  occurredAt: Date;
}

export interface AttributionResult {
  journeyId: string;
  entityId: string;
  outcomeType: string;
  outcomeValue?: number;
  model: AttributionModel;
  touchpoints: Array<{
    touchpointType: string;
    channel?: string;
    content?: string;
    position: number;
    credit: number;
    creditPercent: number;
    occurredAt: Date;
  }>;
  totalTouchpoints: number;
}

// ---------------------------------------------------------------------------
// Cohort Analysis
// ---------------------------------------------------------------------------

export interface CohortDefinitionInput {
  cohortId: string;
  domain: string;
  name: string;
  description?: string;
  entityType: string;
  entryConditions?: FilterCondition[];
  entryEventName?: string;
  analysisType?: "retention" | "ltv" | "engagement" | "conversion";
  windowDays?: number;
}

export interface CohortPeriod {
  label: string;
  periodIndex: number;
  cohortSize: number;
  activeEntities: number;
  retentionRate: number;
  avgValue?: number;
}

export interface CohortAnalysisResult {
  cohortId: string;
  domain: string;
  analysisType: string;
  cohorts: Array<{
    cohortLabel: string;
    cohortDate: Date;
    size: number;
    periods: CohortPeriod[];
  }>;
  overallRetentionRate: number;
}

// ---------------------------------------------------------------------------
// Funnel Analysis
// ---------------------------------------------------------------------------

export interface FunnelStepDefinition {
  id: string;
  name: string;
  eventName: string;
  conditions?: FilterCondition[];
}

export interface FunnelDefinitionInput {
  funnelId: string;
  domain: string;
  name: string;
  description?: string;
  steps: FunnelStepDefinition[];
  windowHours?: number;
}

export interface FunnelStepResult {
  stepId: string;
  stepName: string;
  eventName: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
  avgTimeToStep?: number;
  segments?: Record<string, number>;
}

export interface FunnelAnalysisResult {
  funnelId: string;
  domain: string;
  periodStart: Date;
  periodEnd: Date;
  totalEntries: number;
  totalCompletions: number;
  overallConversionRate: number;
  steps: FunnelStepResult[];
}

// ---------------------------------------------------------------------------
// Anomaly Detection
// ---------------------------------------------------------------------------

export interface AnomalyRecord {
  anomalyId: string;
  metricId: string;
  domain: string;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  detectedAt: Date;
  periodStart: Date;
  observedValue: number;
  expectedValue: number;
  deviationPercent: number;
  zScore?: number;
  context?: Record<string, unknown>;
  potentialCauses?: string[];
  isResolved: boolean;
}

// ---------------------------------------------------------------------------
// Query API
// ---------------------------------------------------------------------------

export interface MetricQueryParams {
  metricId: string;
  domain?: string;
  granularity?: AnalyticsGranularity;
  from: Date;
  to: Date;
  dimensions?: Record<string, string>;
  limit?: number;
}

export interface BulkQueryParams {
  metrics: string[];
  domain?: string;
  granularity?: AnalyticsGranularity;
  from: Date;
  to: Date;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardWidget {
  id: string;
  type: "metric_card" | "time_series" | "funnel" | "cohort" | "anomaly_feed" | "table";
  metricId?: string;
  funnelId?: string;
  cohortId?: string;
  title?: string;
  width?: number;
  height?: number;
  row?: number;
  col?: number;
  config?: Record<string, unknown>;
}

export interface DashboardDefinitionInput {
  dashboardId: string;
  domain: string;
  name: string;
  description?: string;
  layout: DashboardWidget[];
  defaultTimeRange?: string;
  isPublic?: boolean;
}
