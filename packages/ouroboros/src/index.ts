export type {
  ConsistencyFn,
  DeltaFn,
  ExitReason,
  LoopConfig,
  LoopStep,
  LoopTrace,
  StepFn,
  StepResult,
} from './types.js';

export { runLoop } from './loop-kernel.js';
export type { RunLoopArgs } from './loop-kernel.js';

export {
  numericConsistency,
  setConsistency,
  stringConsistency,
  vectorConsistency,
} from './consistency.js';

export { allocateDepth } from './depth-allocator.js';
export type { AllocatorInput, AllocatorOutput } from './depth-allocator.js';
