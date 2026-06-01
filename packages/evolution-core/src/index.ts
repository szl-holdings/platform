/**
 * Precision Evolution Runtime (PER) — Main Entry Point
 *
 * Re-exports all subsystem modules. Import specific sub-paths
 * (e.g., @szl-holdings/evolution-core/capability) for tree-shaking.
 */

export * from './types.js';
export * from './capability/index.js';
export * from './control-plane/index.js';
export * from './reward/index.js';
export * from './drift/index.js';
export * from './governance/index.js';
export * from './calibration/index.js';
export * from './rollout/index.js';
export * from './simulation/index.js';
export * from './adapters/index.js';
