/**
 * @szl-holdings/db-repository
 *
 * Typed repository classes over @szl-holdings/db.
 * Each repository encapsulates all DB access for a single domain
 * so routes and jobs never write raw Drizzle queries inline.
 *
 * Usage:
 *   import { authRepository } from "@szl-holdings/db-repository/auth";
 *   import { continuumRepository } from "@szl-holdings/db-repository/continuum";
 */

export { AlloyRepository, alloyRepository } from './continuum';
export { type AuditEntry, AuditRepository, auditRepository } from './audit';
export { AuthRepository, authRepository } from './auth';
export {
  EvalRegistryRepository,
  evalRegistryRepository,
  type EvalBenchmarkRow,
  type EvalCommunitySubmissionRow,
  type EvalResultRow,
  type EvalVerificationTokenRow,
  type LeaderboardRow,
} from './eval-registry';
export { AegisRepository, firestormRepository } from './firestorm';
export { TerraRepository, terraRepository } from './terra';
export { VesselsRepository, vesselsRepository } from './vessels';
