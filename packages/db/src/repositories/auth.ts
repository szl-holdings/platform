/**
 * Auth repository — typed query helpers for the auth domain.
 * Uses @szl-holdings/db as the single relational entry point.
 */
import { db, usersTable, sessionsTable } from "@szl-holdings/db";
import { eq, and, gt } from "drizzle-orm";

export type UserRow = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type SessionRow = typeof sessionsTable.$inferSelect;

export const authRepo = {
  async findUserById(id: number): Promise<UserRow | undefined> {
    const [row] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    return row;
  },

  async findUserByEmail(email: string): Promise<UserRow | undefined> {
    const [row] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    return row;
  },

  async findUserByReplitId(replitId: string): Promise<UserRow | undefined> {
    const [row] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.replitId, replitId))
      .limit(1);
    return row;
  },

  async upsertUser(data: NewUser): Promise<UserRow> {
    const [row] = await db
      .insert(usersTable)
      .values(data)
      .onConflictDoUpdate({
        target: usersTable.email,
        set: {
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) throw new Error("Failed to upsert user");
    return row;
  },

  async findActiveSession(token: string): Promise<SessionRow | undefined> {
    const [row] = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.token, token), gt(sessionsTable.expiresAt, new Date())))
      .limit(1);
    return row;
  },

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  },
};
