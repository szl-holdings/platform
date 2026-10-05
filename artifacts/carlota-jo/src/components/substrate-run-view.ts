export type RunMode = 'dry-run' | 'live';
export type PanelStatus =
  | 'idle'
  | 'running'
  | 'completed'
  | 'dry-run-complete'
  | 'pending-approval'
  | 'failed'
  | 'cancelled'
  | 'unknown';

export interface StageTrace {
  stageId: string;
  stageName: string;
  stageType: string;
  status: string;
  confidence: number | null;
}

export type RetrieverSource = 'adapter' | 'synthetic' | 'inline' | 'dry-run';
export interface RetrieverSourceMeta {
  source: RetrieverSource;
  adapterId: string | null;
}

export interface RunResult {
  runId: string | null;
  requestedMode: RunMode;
  status: PanelStatus;
  reportedStatus: string;
  mode: string;
  finalConfidence: number | null;
  stages: StageTrace[];
  retriever: RetrieverSourceMeta | null;
  error: string | null;
}

const RUN_STATUSES = new Set<PanelStatus>([
  'running',
  'completed',
  'dry-run-complete',
  'pending-approval',
  'failed',
  'cancelled',
]);
const RETRIEVER_SOURCES = new Set<RetrieverSource>(['adapter', 'synthetic', 'inline', 'dry-run']);

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function confidence(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
    ? value
    : null;
}

export function parsePipelineRun(value: unknown, requestedMode: RunMode): RunResult {
  const run = asRecord(value);
  const reportedStatus = typeof run.status === 'string' ? run.status : 'missing';
  const mode = typeof run.mode === 'string' ? run.mode : 'missing';
  const rawStages = Array.isArray(run.stageResults) ? run.stageResults.map(asRecord) : [];
  const stages = rawStages
    .filter((stage) => typeof stage.stageId === 'string' && stage.stageId.length > 0)
    .map((stage): StageTrace => ({
      stageId: stage.stageId as string,
      stageName:
        typeof stage.stageName === 'string' ? stage.stageName : (stage.stageId as string),
      stageType: typeof stage.stageType === 'string' ? stage.stageType : 'Stage',
      status: typeof stage.status === 'string' ? stage.status : 'unknown',
      confidence: confidence(stage.confidence),
    }));
  const retrieve = rawStages.find((stage) => stage.stageType === 'Retrieve');
  const output = asRecord(retrieve?.output);
  const source = output.retrieverSource;
  const retriever =
    typeof source === 'string' && RETRIEVER_SOURCES.has(source as RetrieverSource)
      ? {
          source: source as RetrieverSource,
          adapterId: typeof output.retrieverAdapterId === 'string' ? output.retrieverAdapterId : null,
        }
      : null;

  // An HTTP-success response is only an acknowledgement. Trust the run state and
  // mode together; a mismatched or unrecognised report cannot prove completion.
  let status: PanelStatus = RUN_STATUSES.has(reportedStatus as PanelStatus)
    ? (reportedStatus as PanelStatus)
    : 'unknown';
  if (
    mode !== requestedMode ||
    (status === 'completed' && mode !== 'live') ||
    (status === 'dry-run-complete' && mode !== 'dry-run') ||
    (status === 'pending-approval' && mode === 'dry-run')
  ) {
    status = 'unknown';
  }

  return {
    runId: typeof run.runId === 'string' && run.runId.length > 0 ? run.runId : null,
    requestedMode,
    status,
    reportedStatus,
    mode,
    finalConfidence: confidence(run.finalConfidence),
    stages,
    retriever,
    error: typeof run.error === 'string' && run.error.length > 0 ? run.error : null,
  };
}
