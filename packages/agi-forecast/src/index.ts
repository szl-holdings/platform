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

export { ingestMetr, ingestEpoch, ingestArc } from './ingestors';
export type { IngestResult, IngestSuccess, IngestFailure } from './ingestors';

export {
  buildDailySummary,
  canonicalize,
  type ForecastSummary,
  type VariableSnapshot,
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
