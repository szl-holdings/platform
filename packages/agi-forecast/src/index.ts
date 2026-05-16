export {
  GAUGE_VARIABLES,
  getVariable,
  publicVariables,
  manualVariables,
  type GaugeVariable,
  type PublicVariable,
  type ManualVariable,
  type Provenance,
  type Cadence,
} from './gauge-registry';

export {
  ingestMetr,
  ingestEpoch,
  ingestArc,
  ingestApollo,
  ingestAisi,
  ingestRsp,
  ingestFsf,
  ingestGpqa,
  ingestMmlu,
  ingestSweBench,
  ingestHumanEval,
  ingestMath,
  ingestGithubStargazers,
} from './ingestors';
export type { IngestResult, IngestSuccess, IngestFailure } from './ingestors';

export {
  buildDailySummary,
  canonicalize,
  deriveMetrics,
  CAPABILITY_SIGNAL_IDS,
  SAFETY_SIGNAL_IDS,
  type ForecastSummary,
  type VariableSnapshot,
  type HistoryEntry,
  type DerivedMetrics,
} from './forecast-summary';

export {
  createBrierLedger,
  recordPrediction,
  score,
  brierLedger,
  type BrierEntry,
  type BrierLedger,
} from './brier-ledger';

export { LICENSE_ALLOWLIST, assertAllowedLicense, type AllowedLicense } from './licenses';
