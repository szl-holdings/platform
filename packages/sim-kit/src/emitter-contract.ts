/**
 * Particle-emitter contract — the typed shape every visual layer
 * (Canvas / WebGL / WebGPU / React) consumes so a cluster event
 * triggers the same emission across consumers.
 *
 * Cosmetic effects MUST NOT emit receipts; the *cluster event* that
 * drives them is the receipt-bearing object (`cluster.event.v1`).
 * The doctrine scanner check is "no `*.particle*` source file may
 * import `szl-receipts`". This file declares only the contract.
 */

export interface ClusterEvent {
  readonly clusterId: string;
  readonly members: readonly { entityRef: string }[];
  readonly centroid: readonly [number, number];
  readonly size: number;
  readonly label: string;
  readonly triggeredBy: 'pop' | 'merge' | 'spawn' | 'dissipate';
}

export interface ParticleEmission {
  readonly origin: readonly [number, number];
  readonly count: number;
  readonly colour: string;
  readonly lifetimeMs: number;
  readonly spreadRadius: number;
}

export type EmitterFn = (event: ClusterEvent) => readonly ParticleEmission[];
