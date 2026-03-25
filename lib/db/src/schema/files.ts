import { pgTable, text, serial, timestamp, integer, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";
import { organizationsTable } from "./organizations";

export const filesTable = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  storageUrl: text("storage_url").notNull(),
  storageKey: text("storage_key").notNull(),
  category: text("category", { enum: ["document", "image", "video", "audio", "archive", "other"] }).notNull().default("other"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const assetsTable = pgTable("assets", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull().references(() => filesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  tags: text("tags").array(),
  linkedEntity: text("linked_entity"),
  linkedEntityId: text("linked_entity_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFileSchema = createInsertSchema(filesTable).omit({ id: true, createdAt: true });
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof filesTable.$inferSelect;

export const insertAssetSchema = createInsertSchema(assetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assetsTable.$inferSelect;
