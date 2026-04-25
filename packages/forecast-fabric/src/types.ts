import { z } from 'zod';

export const FORECAST_FABRIC_VERSION = '1.0.0' as const;

export type Lane =
  | 'lyte'
  | 'aegis'
  | 'vessels'
  | 'terra'
  | 'counsel'
  | 'carlota-jo'
  | 'imperium';

export const ALL_LANES: Lane[] = [
  'lyte',
  'aegis',
  'vessels',
  'terra',
  'counsel',
  'carlota-jo',
  'imperium',
];

export const HeadNameSchema = z.enum([
  'lyte:bottlenecks',
  'lyte:margin-risk',
  'lyte:ownership-drift',
  'lyte:escalation-risk',
  'aegis:alert-surge',
  'aegis:analyst-overload',
  'aegis:control-drift',
  'aegis:severity-clustering',
  'vessels:route-anomaly',
  'vessels:sanctions-adjacency',
  'vessels:dark-activity',
  'vessels:insurance-exception',
  'terra:distress',
  'terra:deal-likelihood',
  'terra:neighborhood-momentum',
  'terra:lead-conversion',
  'counsel:deadline-slippage',
  'counsel:filing-defect',
  'counsel:recovery',
  'counsel:staffing-pressure',
  'carlota-jo:demand-spikes',
  'carlota-jo:vendor-failure',
  'carlota-jo:booking-conflict',
  'imperium:cost-drift',
  'imperium:policy-drift',
  'imperium:tenant-saturation',
  'imperium:infra-health',
]);

export type HeadName = z.infer<typeof HeadNameSchema>;

export const ALL_HEAD_NAMES: HeadName[] = HeadNameSchema.options;

export const ForecastIntervalSchema = z.object({
  point: z.number().describe('Point estimate (median / best-guess value)'),
  lower: z.number().describe('Lower bound of confidence interval'),
  upper: z.number().describe('Upper bound of confidence interval'),
  confidence: z.number().min(0).max(1).describe('Calibrated confidence level (0–1)'),
  horizon: z.string().describe('Forecast horizon label, e.g. "7d", "30d", "90d"'),
  unit: z.string().optional().describe('Unit of measurement'),
});

export type ForecastInterval = z.infer<typeof ForecastIntervalSchema>;

export const ForecastProvenanceSchema = z.object({
  headName: HeadNameSchema,
  modelId: z.string().describe('Unique model identifier for this head'),
  modelVersion: z.string().describe('SemVer model version string'),
  adapterId: z.string().describe('Provider adapter that produced this forecast'),
  generatedAt: z.string().datetime().describe('ISO-8601 timestamp of generation'),
  inputHash: z.string().optional().describe('SHA-256 hash of canonical input for reproducibility'),
  championScore: z.number().min(0).max(1).optional().describe('Champion eval score at generation time'),
});

export type ForecastProvenance = z.infer<typeof ForecastProvenanceSchema>;

export const ForecastOutputSchema = z.object({
  headName: HeadNameSchema,
  lane: z.string(),
  label: z.string().describe('Human-readable forecast label'),
  intervals: z.array(ForecastIntervalSchema).min(1).describe('One or more horizon intervals'),
  provenance: ForecastProvenanceSchema,
  signals: z.record(z.string(), z.unknown()).optional().describe('Contributing input signals for explainability'),
  alertThreshold: z.number().optional().describe('Alert threshold; intervals.upper exceeding this triggers anomaly flag'),
  thresholdBreached: z.boolean().optional(),
});

export type ForecastOutput = z.infer<typeof ForecastOutputSchema>;

export const ForecastInputSchema = z.object({
  headName: HeadNameSchema,
  tenantId: z.string().optional(),
  entityId: z.string().optional().describe('Primary entity being forecast (asset, vessel, matter, etc.)'),
  context: z.record(z.string(), z.unknown()).default({}).describe('Arbitrary lane-specific context signals'),
  requestedHorizons: z.array(z.string()).default(['7d', '30d', '90d']),
  asOf: z.string().datetime().optional().describe('Point-in-time for the forecast; defaults to now'),
});

export type ForecastInput = z.infer<typeof ForecastInputSchema>;

export interface HeadDefinition {
  name: HeadName;
  lane: Lane;
  label: string;
  description: string;
  defaultAdapterId: string;
  horizons: string[];
  alertThreshold?: number;
}

export interface ModelAdapter {
  id: string;
  name: string;
  invoke(input: ForecastInput, head: HeadDefinition): Promise<ForecastOutput>;
}

export interface ForecastHeadRegistry {
  register(head: HeadDefinition): void;
  get(name: HeadName): HeadDefinition | undefined;
  list(): HeadDefinition[];
  listByLane(lane: Lane): HeadDefinition[];
}

export interface AdapterRegistry {
  register(adapter: ModelAdapter): void;
  get(id: string): ModelAdapter | undefined;
  list(): ModelAdapter[];
}
