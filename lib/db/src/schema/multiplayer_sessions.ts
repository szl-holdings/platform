import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";
import { organizationsTable } from "./organizations";

/**
 * command_sessions — live multiplayer command sessions.
 *
 * Tracks active collaborative sessions across the ecosystem.
 * Session presence is managed via WebSocket channels; this table
 * provides persistence, session metadata, and activity history.
 */
export const commandSessionsTable = pgTable("command_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  title: text("title").notNull().default("Command Session"),
  appId: text("app_id").notNull().default("command"),
  isActive: boolean("is_active").notNull().default(true),
  participantUserIds: jsonb("participant_user_ids").notNull().default([]),
  metadata: jsonb("metadata").default({}),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
}, (table) => [
  index("command_sessions_session_id_idx").on(table.sessionId),
  index("command_sessions_org_idx").on(table.orgId),
  index("command_sessions_app_idx").on(table.appId),
  index("command_sessions_active_idx").on(table.isActive),
]);

export const commandSessionCommentsTable = pgTable("command_session_comments", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  authorUserId: integer("author_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  authorLabel: text("author_label").notNull(),
  entityId: text("entity_id"),
  entityType: text("entity_type"),
  body: text("body").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("cmd_session_comments_session_idx").on(table.sessionId),
  index("cmd_session_comments_entity_idx").on(table.entityId, table.entityType),
]);

export const insertCommandSessionSchema = createInsertSchema(commandSessionsTable).omit({ id: true, createdAt: true, lastActivityAt: true });
export type InsertCommandSession = z.infer<typeof insertCommandSessionSchema>;
export type CommandSession = typeof commandSessionsTable.$inferSelect;

export const insertCommandSessionCommentSchema = createInsertSchema(commandSessionCommentsTable).omit({ id: true, createdAt: true });
export type InsertCommandSessionComment = z.infer<typeof insertCommandSessionCommentSchema>;
export type CommandSessionComment = typeof commandSessionCommentsTable.$inferSelect;
