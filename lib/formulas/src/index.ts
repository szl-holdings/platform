/**
 * @szl-holdings/formulas — canonical, thesis-sourced formula library.
 *
 * The single import surface for the entire monorepo. Every scoring
 * heuristic, governance threshold, risk calculation, and routing
 * decision in production must come from here.
 *
 * The thesis (`docs/thesis/v10-canonical.md`) is the source of truth.
 * This package is the typed, auditable runtime mirror of that source.
 */
export * from './registry.js';
export * from './instrument.js';
export * from './governance.js';
export * from './risk.js';
export * from './scoring.js';
export * from './routing.js';
export * from './evolution.js';

// Re-export the underlying Lutar formula corpus for convenience so
// callsites can `import { lutarInvariant5 } from '@szl-holdings/formulas'`
// without reaching into `@workspace/lutar-formulas` directly.
export {
  lutarInvariant,
  lutarInvariant5,
  verifyLutarBound,
  defaultWeights,
  defaultWeights5,
  type LutarAxes,
  type LutarAxes5,
  type LutarReport,
  type LutarReport5,
} from '@workspace/lutar-formulas/lutar';
export {
  OMEGA_MODES,
  isSimplex,
  lOmega,
  routerSignatures,
  type OmegaWeights,
  type ModelSpec,
  type QuerySpec,
} from '@workspace/lutar-formulas/omega';
export { propeller } from '@workspace/lutar-formulas/propeller';
export { xi, dialogEntropy, sigmoid } from '@workspace/lutar-formulas/xi';
export { routeWithXi, type RouterDecision, type RouterModel, type RouterRequest } from '@workspace/lutar-formulas/router';
