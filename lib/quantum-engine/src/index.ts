export type { AnnealingConfig, AnnealingProblem, AnnealingResult } from './quantum-annealing.js';
export { solveQuantumAnnealing } from './quantum-annealing.js';

export type {
  OptimizationProblem,
  QAOAConfig,
  QAOAResult,
} from './qaoa-optimizer.js';
export { solveQAOA } from './qaoa-optimizer.js';

export type {
  AmplitudeSamplerConfig,
  AmplitudeSamplerResult,
  AmplitudeWeightedSample,
  CorrelatedVariable,
} from './amplitude-sampler.js';
export { amplitudeSample, buildCorrelationMatrix } from './amplitude-sampler.js';

export type {
  CorrelationAlert,
  DomainVariable,
  TensorCorrelationConfig,
  TensorCorrelationResult,
} from './tensor-correlation.js';
export { discoverCorrelations } from './tensor-correlation.js';

export type {
  AmplifiedDecision,
  AmplifierResult,
  EnsembleAmplifierConfig,
  ModelOutput,
} from './ensemble-amplifier.js';
export { amplifyDecision } from './ensemble-amplifier.js';

export type {
  PolicyOptimizationConfig,
  PolicyOptimizationResult,
  PolicyRule,
} from './policy-optimizer.js';
export { optimizePolicies } from './policy-optimizer.js';

export type { BenchmarkResult, QuantumReadinessStatus } from './benchmarks.js';
export { runQuantumBenchmarks } from './benchmarks.js';
