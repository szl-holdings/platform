/**
 * @szl-holdings/db-schema
 *
 * Single source of truth for Drizzle table/relation definitions,
 * organized by domain. Re-exports from @szl-holdings/db for
 * consumers that want domain-namespaced imports without going through
 * the monolithic lib/db/src/schema/index.ts.
 *
 * Usage:
 *   import { usersTable, sessionsTable } from "@szl-holdings/db-schema/auth";
 *   import { continuumWorkflowsTable } from '@szl-holdings/db-schema/continuum'";
 */

export * from '@szl-holdings/db/schema';
