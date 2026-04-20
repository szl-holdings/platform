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

export { db, pool } from "@szl-holdings/db";
export * from "@szl-holdings/db/schema";

export { authRepo } from "./repositories/auth";
export { alloyRepo } from "./repositories/alloy";
export { auditRepo } from "./repositories/audit";
export { vesselsRepo } from "./repositories/vessels";
export { terraRepo } from "./repositories/terra";
export { firestormRepo } from "./repositories/firestorm";

export type { UserRow, NewUser, SessionRow } from "./repositories/auth";
export type { AuditLogRow, NewAuditLog } from "./repositories/audit";
