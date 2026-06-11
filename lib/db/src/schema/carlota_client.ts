import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth.js';
import { organizationsTable } from './organizations.js';

export const clientAccountsTable = pgTable('client_accounts', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  primaryContactUserId: integer('primary_contact_user_id').references(() => usersTable.id, {
    onDelete: 'set null',
  }),
  status: text('status', { enum: ['active', 'inactive', 'onboarding'] })
    .notNull()
    .default('onboarding'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const clientDocumentsTable = pgTable('client_documents', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  clientAccountId: integer('client_account_id')
    .notNull()
    .references(() => clientAccountsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  fileUrl: text('file_url'),
  fileType: text('file_type'),
  visibility: text('visibility', { enum: ['private', 'client', 'internal'] })
    .notNull()
    .default('client'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const clientUpdatesTable = pgTable('client_updates', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  clientAccountId: integer('client_account_id')
    .notNull()
    .references(() => clientAccountsTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  summary: text('summary'),
  bodyRichtext: text('body_richtext'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const clientMessagesTable = pgTable('client_messages', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  clientAccountId: integer('client_account_id')
    .notNull()
    .references(() => clientAccountsTable.id, { onDelete: 'cascade' }),
  senderUserId: integer('sender_user_id').references(() => usersTable.id, { onDelete: 'set null' }),
  subject: text('subject'),
  bodyRichtext: text('body_richtext').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const insertClientAccountSchema = createInsertSchema(clientAccountsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClientAccount = z.infer<typeof insertClientAccountSchema>;
export type ClientAccount = typeof clientAccountsTable.$inferSelect;

export const insertClientDocumentSchema = createInsertSchema(clientDocumentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClientDocument = z.infer<typeof insertClientDocumentSchema>;
export type ClientDocument = typeof clientDocumentsTable.$inferSelect;

export const insertClientUpdateSchema = createInsertSchema(clientUpdatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClientUpdate = z.infer<typeof insertClientUpdateSchema>;
export type ClientUpdate = typeof clientUpdatesTable.$inferSelect;

export const insertClientMessageSchema = createInsertSchema(clientMessagesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertClientMessage = z.infer<typeof insertClientMessageSchema>;
export type ClientMessage = typeof clientMessagesTable.$inferSelect;
