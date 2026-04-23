/**
 * Auth/session privacy contributor.
 *
 * Covers: user profile, active sessions, API keys, user roles.
 * Deletion: hard-delete of the user row; sessions, api_keys, and user_roles
 * are removed via ON DELETE CASCADE by the database engine.
 *
 * This contributor MUST be registered last so the user row cascade fires
 * after all other domain contributors have cleaned up non-cascaded data.
 */

import {
  apiKeysTable,
  db,
  sessionsTable,
  userRolesTable,
  usersTable,
} from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import type { PrivacyContributor, PrivacyUserContext } from '../privacy-registry';

export const authContributor: PrivacyContributor = {
  domain: 'auth',

  async exportForUser({ userId }: PrivacyUserContext) {
    const [user] = await db
      .select({
        id: usersTable.id,
        displayName: usersTable.displayName,
        email: usersTable.email,
        avatarUrl: usersTable.avatarUrl,
        bio: usersTable.bio,
        platformRole: usersTable.platformRole,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
        lastLoginAt: usersTable.lastLoginAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const sessions = await db
      .select({
        id: sessionsTable.id,
        createdAt: sessionsTable.createdAt,
        expiresAt: sessionsTable.expiresAt,
        ipAddress: sessionsTable.ipAddress,
        userAgent: sessionsTable.userAgent,
      })
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, userId));

    const apiKeys = await db
      .select({
        id: apiKeysTable.id,
        name: apiKeysTable.name,
        createdAt: apiKeysTable.createdAt,
      })
      .from(apiKeysTable)
      .where(eq(apiKeysTable.userId, userId));

    const roles = await db
      .select({ roleId: userRolesTable.roleId })
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, userId));

    return { user: user ?? null, sessions, apiKeys, roles };
  },

  async deleteForUser({ userId }: PrivacyUserContext) {
    await db.delete(usersTable).where(eq(usersTable.id, userId));
  },
};
