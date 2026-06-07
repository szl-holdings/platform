import { z } from 'zod';

export const ANOMALY_FABRIC_VERSION = '1.0.0' as const;

export type AnomalyMode = 'streaming' | 'batch';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyKind =
  | 'spike'
  | 'drop'
  | 'drift'
  | 'pattern-break'
  | 'seasonal-deviation'
  | 'outlier'
  | 'threshold-breach'
  | 'distribution-shift';

export const TelemetryPointSchema = z.object({
  metricName: z.string(),
  value: z.number(),
  timestamp: z.string().datetime(),
  lane: z.string().optional(),
  entityId: z.string().optional(),
  tags: z.record(z.string(), z.string()).default({}),
});

export type TelemetryPoint = z.infer<typeof TelemetryPointSchema>;

export const AnomalyEventSchema = z.object({
  id: z.string().describe('Unique anomaly event ID'),
  mode: z.enum(['streaming', 'batch']),
  kind: z.enum([
    'spike',
    'drop',
    'drift',
    'pattern-break',
    'seasonal-deviation',
    'outlier',
    'threshold-breach',
    'distribution-shift',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  metricName: z.string(),
  lane: z.string().optional(),
  entityId: z.string().optional(),
  observedValue: z.number(),
  expectedRange: z.object({
    lower: z.number(),
    upper: z.number(),
    baseline: z.number(),
  }),
  zScore: z.number().optional().describe('Z-score relative to rolling window baseline'),
  confidence: z.number().min(0).max(1),
  detectedAt: z.string().datetime(),
  windowStart: z.string().datetime().optional(),
  windowEnd: z.string().datetime().optional(),
  tags: z.record(z.string(), z.string()).default({}),
  suppressed: z.boolean().default(false).describe('True if a suppression rule matched'),
  correlatedHeads: z.array(z.string()).default([]).describe('Forecast head names that are affected'),
});

export type AnomalyEvent = z.infer<typeof AnomalyEventSchema>;

export const StreamingDetectionInputSchema = z.object({
  point: TelemetryPointSchema,
  windowSizeMs: z.number().default(300_000).describe('Rolling window in milliseconds (default 5 min)'),
  sensitivitySigma: z.number().default(2.5).describe('Sigma threshold for spike/drop detection'),
  lane: z.string().optional(),
});

export type StreamingDetectionInput = z.infer<typeof StreamingDetectionInputSchema>;

export const BatchDetectionInputSchema = z.object({
  points: z.array(TelemetryPointSchema).min(1),
  lane: z.string().optional(),
  jobId: z.string().optional().describe('Batch job identifier for tracing'),
  sensitivitySigma: z.number().default(2.5),
  distributionShiftThreshold: z.number().default(0.15).describe('KL-divergence threshold for distribution-shift detection'),
});

export type BatchDetectionInput = z.infer<typeof BatchDetectionInputSchema>;

export const AnomalyDetectionResultSchema = z.object({
  anomalies: z.array(AnomalyEventSchema),
  processedCount: z.number(),
  anomalyRate: z.number().min(0).max(1),
  processingMs: z.number(),
  mode: z.enum(['streaming', 'batch']),
  jobId: z.string().optional(),
});

export type AnomalyDetectionResult = z.infer<typeof AnomalyDetectionResultSchema>;

export interface AnomalyDetectionService {
  detectStreaming(input: StreamingDetectionInput): Promise<AnomalyDetectionResult>;
  detectBatch(input: BatchDetectionInput): Promise<AnomalyDetectionResult>;
}

export interface AnomalyStore {
  persist(anomaly: AnomalyEvent): Promise<void>;
  query(filter: {
    lane?: string;
    severity?: AnomalySeverity;
    since?: string;
    entityId?: string;
    limit?: number;
  }): Promise<AnomalyEvent[]>;
}
