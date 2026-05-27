/**
 * @szl-holdings/sim-kit
 *
 * Dependency-free sim kernel. Verlet step + label+radius cluster detect
 * + emitter contract + monotone-checked scoring. Re-expressed from
 * spherepop (docs/research/perception-bio-synthesis-2026.md §4).
 */

export { step } from './verlet-step.js';
export type { Particle, VerletOptions } from './verlet-step.js';

export { detectClusters } from './cluster-detect.js';
export type { Cluster, ClusterDetectOptions } from './cluster-detect.js';

export type { ClusterEvent, ParticleEmission, EmitterFn } from './emitter-contract.js';

export { score } from './scoring.js';
export type { ClusterPopRecord, ScoreOptions } from './scoring.js';

export const SIM_KIT_VERSION = '0.1.0' as const;
export const CLUSTER_EVENT_RECEIPT_CLASS = 'cluster.event.v1' as const;
