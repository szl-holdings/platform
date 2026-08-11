export { canonicalJson, digestObject, newId, sha256Hex } from './canonical.js';
export {
  assertCompatibility,
  evaluateCompatibility,
  type CompatibilityMismatch,
  type CompatibilityResult,
} from './compatibility.js';
export {
  assertMasterKey,
  constantTimeEqualHex,
  decryptEnvelope,
  encryptEnvelope,
  signDigest,
  verifyDigest,
  type EncryptedEnvelope,
} from './crypto.js';
export { CognitiveEpochManager, type CognitiveEpochManagerConfig } from './epoch-manager.js';
export { assertStateNative, StateNativeError, type StateNativeErrorCode } from './errors.js';
export {
  AlloyKernelRuntime,
  kernelRequestDigest,
  type AlloyKernelRuntimeDependencies,
} from './kernel-runtime.js';
export {
  assertKernelExecutionReceipt,
  createKernelExecutionReceipt,
  verifyKernelExecutionReceipt,
} from './receipt.js';
export { ReasoningVault, type ReasoningVaultConfig } from './reasoning-vault.js';
export { AlloyStateBus, highestSensitivity, type AlloyStateBusConfig } from './state-bus.js';
export { InMemoryStateTransportAdapter } from './transport.js';
export type * from './types.js';
