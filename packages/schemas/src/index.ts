/**
 * @szl-holdings/schemas
 *
 * Domain schemas reused by API routes, DB-adjacent parsing,
 * queue payloads, and LLM structured outputs.
 *
 * Usage:
 *   import { vesselSchema, type Vessel } from "@szl-holdings/schemas/vessels";
 *   import { aiTraceSchema } from "@szl-holdings/schemas/ai";
 */

export * from './ai';
export * from './continuum';
export * from './entities';
export * from './firestorm';
export * from './terra';
export * from './vessels';
