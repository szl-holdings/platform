/**
 * @szl-holdings/contracts
 *
 * Zod request/response shapes for all internal APIs and webhooks.
 * TS types are inferred from schemas — never hand-written in parallel.
 *
 * Usage:
 *   import { loginBodySchema, type LoginBody } from "@szl-holdings/contracts/auth";
 *   import { createWorkflowBodySchema } from "@szl-holdings/contracts/continuum";
 */

export * from './admin';
export * from './agentic-rag';
export * from './ai';
export * from './continuum';
export * from './auth';
export * from './common';
export * from './governance';
export * from './webhooks';
