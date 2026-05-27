/**
 * @szl-holdings/ising-calibration-kit
 *
 * SZL re-expression of NVIDIA Ising. See ./receipts.ts JSDoc for full
 * lineage attribution to the upstream NVIDIA work
 * (Chamberland/Olle/Li/Thornton/Baratta arXiv:2604.12841 and the
 * Quantum-Calibration-Agent-Blueprint by @ShuxiangCao et al.).
 */

export {
  ISING_RECEIPT_CLASSES,
  canonicalJson,
  digestBody,
  makeRef,
  parseRef,
  verifyRef,
} from "./receipts.js";
export type { IsingReceiptClass, IsingReceiptRef } from "./receipts.js";

export { composePredecoderResult } from "./predecoder.js";
export type {
  CascadePolicy,
  GlobalDecoderReceipt,
  LocalDecodeOutput,
  PredecodeInput,
  PredecoderResult,
} from "./predecoder.js";

export { composeCalibrationChain } from "./calibration.js";
export type {
  CalibrationChain,
  CalibrationPolicy,
  DeclaredWeights,
  Experiment,
  Measurement,
} from "./calibration.js";

export {
  assertNoiseModelAligned,
  composeNoiseDivergence,
  jensenShannonDivergence,
  symmetricKL,
} from "./noise-model.js";
export type {
  NoiseDivergenceWitness,
  NoiseModelSnapshot,
} from "./noise-model.js";
