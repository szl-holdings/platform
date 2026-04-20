/**
 * Auth domain — table/relation definitions.
 * Source of truth: lib/db/src/schema/auth.ts
 */
export {
  usersTable,
  sessionsTable,
  rolesTable,
  userRolesTable,
  mfaSecretsTable,
} from "@szl-holdings/db/schema";

export {
  organizationsTable,
  orgMembersTable,
} from "@szl-holdings/db/schema";

export { apiKeysTable } from "@szl-holdings/db/schema";
