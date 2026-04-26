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

export { AlloyRepository, alloyRepository } from './alloy';
export { type AuditEntry, AuditRepository, auditRepository } from './audit';
export { AuthRepository, authRepository } from './auth';
export { AegisRepository, firestormRepository } from './firestorm';
export { TerraRepository, terraRepository } from './terra';
export { VesselsRepository, vesselsRepository } from './vessels';
