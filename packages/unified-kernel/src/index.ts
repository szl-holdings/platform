/**
 * @szl-holdings/unified-kernel — public entry.
 *
 * One importable package. One signed artifact. One unified kernel. The 19 theses
 * are not cited here — they ARE the modules re-exported below, and they execute
 * on every kernel.start().
 *
 * Author: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> (ORCID 0009-0001-0110-4173)
 */

// Bootloader.
export { start, verifyInitReceipt } from "./kernel.ts";
export type { KernelStartOptions } from "./kernel.ts";

// Shared types.
export type {
  CheckResult,
  KernelReceipt,
  KernelStatus,
  KernelHandle,
  ModuleDescriptor,
  ModuleHandle,
  ModuleRegistry,
  ThesisId,
} from "./types.ts";
export { NotYetError } from "./types.ts";

// Thesis modules (the software).
export * as invariants from "./invariants/index.ts"; // T01
export * as loop from "./loop/index.ts"; // T02 (wired ouroboros v6.3.0)
export * as lambdaAxis from "./lambda_axis/index.ts"; // T03
export * as ledger from "./ledger/index.ts"; // T04
export * as gates from "./gates/index.ts"; // T05
export * as memory from "./memory/index.ts"; // T07 + T08
export * as khipu from "./khipu/index.ts"; // T09
export * as qec from "./qec/index.ts"; // T10
export * as doctrine from "./doctrine/index.ts"; // T11
export * as forecast from "./forecast/index.ts"; // T12
export * as mesh from "./mesh/index.ts"; // T13 + T16
export * as anatomy from "./anatomy/index.ts"; // T14
export * as slsa from "./slsa/index.ts"; // T15
export * as rag from "./rag/index.ts"; // T17
export * as tamper from "./tamper/index.ts"; // T18
export * as lean from "./lean/index.ts"; // T19
export * as codex from "./codex/index.ts"; // codex-kernel v1.0.2 contracts
