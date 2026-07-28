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

export * from './admin';
export * from './ai';
export * from './alloy';
export * from './auth';
export * from './common';
export * from './decision-genome';
export * from './governance';
export * from './webhooks';
