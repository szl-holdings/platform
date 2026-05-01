import type { Distribution } from "./distributions.js";

export type Domain = "vessels" | "terra" | "szl" | "prism" | "aegis" | "nexus" | "lyte" | "generic";

export interface InputVariable {
  id: string;
  label: string;
  description?: string;
  distribution: Distribution;
  unit?: string;
  format?: "currency" | "percentage" | "number" | "years";
  correlation?: Record<string, number>;
}

export type CalculationFn = (inputs: Record<string, number>, iteration: number) => Record<string, number>;

export interface OutputMetric {
  id: string;
  label: string;
  description?: string | undefined;
  unit?: string | undefined;
  format?: "currency" | "percentage" | "number" | "years" | undefined;
  higherIsBetter?: boolean | undefined;
  thresholds?: {
    excellent?: number | undefined;
    good?: number | undefined;
    poor?: number | undefined;
  } | undefined;
}

export interface ScenarioConstraint {
  id: string;
  description: string;
  check: (outputs: Record<string, number>) => boolean;
}

export interface ScenarioDefinition {
  id: string;
  version: string;
  title: string;
  description: string;
  domain: Domain;
  tags?: string[];
  inputs: InputVariable[];
  calculate: CalculationFn;
  outputs: OutputMetric[];
  constraints?: ScenarioConstraint[];
  metadata?: Record<string, unknown>;
}

export interface ScenarioVariant {
  id: string;
  label: string;
  description?: string;
  overrides: Partial<Record<string, Partial<InputVariable>>>;
}

export interface ScenarioLibraryEntry {
  scenario: ScenarioDefinition;
  variants: ScenarioVariant[];
  createdAt: string;
  updatedAt: string;
}

export type ScenarioLibrary = Record<string, ScenarioLibraryEntry>;

/**
 * Quantum-inspired sampling configuration.
 *
 * When enabled, replaces uniform pseudo-random sampling with a Halton-sequence
 * quasi-Monte Carlo sampler combined with amplitude-inspired importance weights.
 * This achieves O((log N)^d / N) convergence vs classical O(1/√N), particularly
 * beneficial for correlated multi-variable scenarios with ≥3 input dimensions.
 */
export interface QuantumSamplingConfig {
  enabled: boolean;
  amplificationIterations?: number;
  correlationThreshold?: number;
  importanceBias?: number;
}

export interface RunConfig {
  iterations: number;
  seed?: number;
  batchSize?: number;
  timeoutMs?: number;
  sensitivitySamples?: number;
  snapshotInterval?: number;
  quantumSampling?: QuantumSamplingConfig;
}

export interface PartialOutputSnapshot {
  outputId: string;
  outputLabel: string;
  count: number;
  mean: number;
  p25: number;
  p50: number;
  p75: number;
  min: number;
  max: number;
}

export type PartialResultCallback = (
  validIterations: number,
  totalIterations: number,
  snapshots: PartialOutputSnapshot[]
) => void;

export const DEFAULT_RUN_CONFIG: RunConfig = {
  iterations: 10_000,
  batchSize: 1_000,
  sensitivitySamples: 200,
  snapshotInterval: 0,
};
