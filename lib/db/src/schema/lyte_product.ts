import { pgTable, text, serial, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";
import { lyteSignalsTable } from "./lyte";

export const lyteSignalCommentsTable = pgTable("lyte_signal_comments", {
  id: serial("id").primaryKey(),
  signalId: integer("signal_id").references(() => lyteSignalsTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id").references(() => usersTable.id, { onDelete: "set null" }),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  commentType: text("comment_type", { enum: ["comment", "state_change", "assignment", "escalation", "resolution"] }).notNull().default("comment"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("lyte_signal_comments_signal_idx").on(table.signalId),
]);

export const lyteSignalTimelineTable = pgTable("lyte_signal_timeline", {
  id: serial("id").primaryKey(),
  signalId: integer("signal_id").notNull().references(() => lyteSignalsTable.id, { onDelete: "cascade" }),
  eventType: text("event_type", { enum: ["created", "acknowledged", "assigned", "escalated", "resolved", "dismissed", "commented", "status_changed"] }).notNull(),
  fromState: text("from_state"),
  toState: text("to_state"),
  actorName: text("actor_name"),
  actorId: integer("actor_id").references(() => usersTable.id, { onDelete: "set null" }),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("lyte_signal_timeline_signal_idx").on(table.signalId),
]);

export const insertLyteSignalCommentSchema = createInsertSchema(lyteSignalCommentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLyteSignalComment = z.infer<typeof insertLyteSignalCommentSchema>;
export type LyteSignalComment = typeof lyteSignalCommentsTable.$inferSelect;

export const insertLyteSignalTimelineSchema = createInsertSchema(lyteSignalTimelineTable).omit({ id: true, createdAt: true });
export type InsertLyteSignalTimeline = z.infer<typeof insertLyteSignalTimelineSchema>;
export type LyteSignalTimeline = typeof lyteSignalTimelineTable.$inferSelect;
