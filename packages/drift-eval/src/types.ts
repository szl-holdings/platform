import { z } from 'zod';

export const DRIFT_EVAL_VERSION = '1.0.0' as const;

export type DriftKind = 'concept' | 'data' | 'performance' | 'label';
export type EvalOutcome = 'champion' | 'challenger' | 'tie' | 'insufficient-data';

export const ModelSnapshotSchema = z.object({
  modelId: z.string(),
  modelVersion: z.string(),
  headName: z.string(),
  adapterId: z.string(),
  capturedAt: z.string().datetime(),
  metrics: z.object({
    mae: z.number().optional().describe('Mean Absolute Error'),
    mape: z.number().optional().describe('Mean Absolute Percentage Error'),
    rmse: z.number().optional().describe('Root Mean Squared Error'),
    calibrationScore: z.number().min(0).max(1).optional().describe('Interval calibration quality (0–1)'),
    coverageRate: z.number().min(0).max(1).optional().describe('Fraction of actuals inside predicted interval'),
    sharpness: z.number().optional().describe('Average interval width (lower = sharper)'),
    customMetrics: z.record(z.string(), z.number()).default({}),
  }),
  sampleCount: z.number(),
});

export type ModelSnapshot = z.infer<typeof ModelSnapshotSchema>;

export const DriftResultSchema = z.object({
  id: z.string(),
  headName: z.string(),
  driftKind: z.enum(['concept', 'data', 'performance', 'label']),
  detectedAt: z.string().datetime(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  baselineSnapshot: ModelSnapshotSchema,
  currentSnapshot: ModelSnapshotSchema,
  driftScore: z.number().min(0).max(1).describe('Normalized drift magnitude (0 = no drift, 1 = full drift)'),
  affectedMetrics: z.array(z.string()),
  recommendation: z.enum(['monitor', 'retrain', 'rollback', 'promote-challenger']),
  notes: z.string().optional(),
});

export type DriftResult = z.infer<typeof DriftResultSchema>;

export const ChampionChallengerResultSchema = z.object({
  id: z.string(),
  headName: z.string(),
  evaluatedAt: z.string().datetime(),
  champion: ModelSnapshotSchema,
  challenger: ModelSnapshotSchema,
  outcome: z.enum(['champion', 'challenger', 'tie', 'insufficient-data']),
  winnerModelId: z.string().optional(),
  improvementDelta: z.number().optional().describe('Positive = challenger is better; negative = champion is better'),
  confidenceLevel: z.number().min(0).max(1),
  sampleCount: z.number(),
  primaryMetric: z.string().describe('Metric used as the primary comparison criterion'),
  notes: z.string().optional(),
});

export type ChampionChallengerResult = z.infer<typeof ChampionChallengerResultSchema>;

export const EvalRegistryEntrySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('drift'), payload: DriftResultSchema }),
  z.object({ type: z.literal('champion-challenger'), payload: ChampionChallengerResultSchema }),
]);

export type EvalRegistryEntry = z.infer<typeof EvalRegistryEntrySchema>;

export interface EvalRegistry {
  persist(entry: EvalRegistryEntry): Promise<void>;
  queryDrift(filter: {
    headName?: string;
    severity?: string;
    since?: string;
    limit?: number;
  }): Promise<DriftResult[]>;
  queryChampionChallenger(filter: {
    headName?: string;
    outcome?: EvalOutcome;
    since?: string;
    limit?: number;
  }): Promise<ChampionChallengerResult[]>;
  latestSnapshot(headName: string): Promise<ModelSnapshot | undefined>;
  saveSnapshot(snapshot: ModelSnapshot): Promise<void>;
}

export interface ScheduledJobConfig {
  headName: string;
  driftIntervalMs: number;
  ccIntervalMs: number;
}
