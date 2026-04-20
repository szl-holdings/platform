/**
 * @szl-holdings/db-repository
 *
 * Typed repository classes over @szl-holdings/db.
 * Each repository encapsulates all DB access for a single domain
 * so routes and jobs never write raw Drizzle queries inline.
 *
 * Usage:
 *   import { authRepository } from "@szl-holdings/db-repository/auth";
 *   import { alloyRepository } from "@szl-holdings/db-repository/alloy";
 */

export { AuthRepository, authRepository } from "./auth";
export { AlloyRepository, alloyRepository } from "./alloy";
export { AuditRepository, auditRepository, type AuditEntry } from "./audit";
export { VesselsRepository, vesselsRepository } from "./vessels";
export { TerraRepository, terraRepository } from "./terra";
export { FirestormRepository, firestormRepository } from "./firestorm";
