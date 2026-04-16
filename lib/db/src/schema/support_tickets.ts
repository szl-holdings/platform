import { pgTable, serial, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { organizationsTable } from "./organizations";

export const supportTicketsTable = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  ticketRef: text("ticket_ref").notNull().unique(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "set null" }),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  submitterName: text("submitter_name").notNull(),
  submitterEmail: text("submitter_email").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  category: text("category", {
    enum: ["billing", "technical", "account", "feature_request", "security", "data_privacy", "other"],
  }).notNull().default("other"),
  priority: text("priority", {
    enum: ["low", "medium", "high", "urgent"],
  }).notNull().default("medium"),
  status: text("status", {
    enum: ["open", "in_progress", "waiting_on_customer", "resolved", "closed"],
  }).notNull().default("open"),
  assignedToId: integer("assigned_to_id").references(() => usersTable.id, { onDelete: "set null" }),
  assignedToName: text("assigned_to_name"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const supportTicketCommentsTable = pgTable("support_ticket_comments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => supportTicketsTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id").references(() => usersTable.id, { onDelete: "set null" }),
  authorName: text("author_name").notNull(),
  authorRole: text("author_role", { enum: ["customer", "agent", "admin"] }).notNull().default("customer"),
  body: text("body").notNull(),
  isInternal: boolean("is_internal").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const supportKnowledgeArticlesTable = pgTable("support_knowledge_articles", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  tags: text("tags").array().notNull().default([]),
  isPublished: boolean("is_published").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
