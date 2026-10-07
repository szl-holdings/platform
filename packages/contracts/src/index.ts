/**
 * @szl-holdings/contracts
 *
 * Zod request/response shapes for all internal APIs and webhooks.
 * TS types are inferred from schemas — never hand-written in parallel.
 *
 * Usage:
 *   import { loginBodySchema, type LoginBody } from "@szl-holdings/contracts/auth";
 *   import { createWorkflowBodySchema } from "@szl-holdings/contracts/alloy";
 */

export * from './admin.js';
export * from './ai.js';
export * from './alloy.js';
export * from './auth.js';
export * from './common.js';
export * from './decision-genome.js';
export * from './governance.js';
export * from './webhooks.js';
