/**
 * @szl-holdings/db-repository
 *
 * Query/repository layer organized by domain.
 * Single relational entry point — wraps @szl-holdings/db.
 *
 * Usage:
 *   import { authRepo } from "@szl-holdings/db-repository/auth";
 *   import { auditRepo } from "@szl-holdings/db-repository/audit";
 *   import { db } from "@szl-holdings/db"; // raw db access when needed
 */

export { db, pool } from '@szl-holdings/db';
export * from '@szl-holdings/db/schema';
export { alloyRepo } from './repositories/alloy';
export type { AuditLogRow, NewAuditLog } from './repositories/audit';
export { auditRepo } from './repositories/audit';
export type { NewUser, SessionRow, UserRow } from './repositories/auth';
export { authRepo } from './repositories/auth';
export { firestormRepo } from './repositories/firestorm';
export { terraRepo } from './repositories/terra';
export { vesselsRepo } from './repositories/vessels';
