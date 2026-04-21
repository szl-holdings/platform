import { boolean, index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth';
import { organizationsTable } from './organizations';

export const orgInvitationsTable = pgTable(
  'org_invitations',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    invitedByUserId: integer('invited_by_user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    acceptedByUserId: integer('accepted_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    email: text('email').notNull(),
    role: text('role', { enum: ['admin', 'member', 'viewer'] })
      .notNull()
      .default('member'),
    token: text('token').notNull().unique(),
    status: text('status', { enum: ['pending', 'accepted', 'expired', 'revoked'] })
      .notNull()
      .default('pending'),
    expiresAt: timestamp('expires_at').notNull(),
    acceptedAt: timestamp('accepted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('org_invitations_email_idx').on(t.email),
    index('org_invitations_org_id_idx').on(t.orgId),
    index('org_invitations_status_idx').on(t.status),
  ],
);

export const insertOrgInvitationSchema = createInsertSchema(orgInvitationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOrgInvitation = z.infer<typeof insertOrgInvitationSchema>;
export type OrgInvitation = typeof orgInvitationsTable.$inferSelect;
