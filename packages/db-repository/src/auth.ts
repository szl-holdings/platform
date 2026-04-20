/**
 * Auth Repository — typed access to user, session, and org tables.
 */
import {
  db,
  organizationsTable,
  orgMembershipsTable,
  sessionsTable,
  usersTable,
} from '@szl-holdings/db';
import { and, eq, gt } from 'drizzle-orm';

export class AuthRepository {
  async findUserById(id: number) {
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findUserByEmail(email: string) {
    const rows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    return rows[0] ?? null;
  }

  async findActiveSession(token: string) {
    const now = new Date();
    const rows = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.token, token), gt(sessionsTable.expiresAt, now)))
      .limit(1);
    return rows[0] ?? null;
  }

  async listOrgsForUser(userId: number) {
    return db
      .select({ org: organizationsTable, membership: orgMembershipsTable })
      .from(orgMembershipsTable)
      .innerJoin(organizationsTable, eq(orgMembershipsTable.orgId, organizationsTable.id))
      .where(eq(orgMembershipsTable.userId, userId));
  }
}

export const authRepository = new AuthRepository();
