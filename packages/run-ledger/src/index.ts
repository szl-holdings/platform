/**
 * @workspace/run-ledger
 *
 * Governed Run Ledger — assembles one auditable artifact per material run and
 * evaluates quality gates before marking the run complete.
 *
 * Usage:
 *   import { RunLedgerBuilder, defaultRunLedgerStore, buildLedgerFromRun } from "@workspace/run-ledger";
 *   import { evaluateQualityGate } from "@workspace/run-ledger/quality-gate";
 */

export * from "./ledger.js";
export * from "./quality-gate.js";

export const RUN_LEDGER_VERSION = "1.0.0" as const;
