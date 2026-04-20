import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth';

export const commentsTable = pgTable(
  'comments',
  {
    id: serial('id').primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    authorId: integer('author_id').references(() => usersTable.id, { onDelete: 'set null' }),
    authorName: text('author_name').notNull().default('Anonymous'),
    authorInitials: text('author_initials').notNull().default('??'),
    content: text('content').notNull(),
    mentions: jsonb('mentions').$type<string[]>().default([]),
    parentId: integer('parent_id'),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('comments_entity_idx').on(table.entityType, table.entityId),
    index('comments_author_idx').on(table.authorId),
    index('comments_created_idx').on(table.createdAt),
  ],
);

export const insertCommentSchema = createInsertSchema(commentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;
