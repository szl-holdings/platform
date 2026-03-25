import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dreamscapeProjectsTable = pgTable("dreamscape_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  clientName: text("client_name"),
  type: text("type", { enum: ["brand_identity", "web_design", "ui_ux", "motion_graphics", "illustration", "packaging"] }).notNull(),
  status: text("status", { enum: ["concept", "in_progress", "review", "approved", "delivered", "archived"] }).notNull().default("concept"),
  mood: text("mood"),
  colorPalette: jsonb("color_palette"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dreamscapeAssetsTable = pgTable("dreamscape_assets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => dreamscapeProjectsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: ["image", "vector", "video", "font", "mockup", "other"] }).notNull(),
  fileUrl: text("file_url"),
  thumbnailUrl: text("thumbnail_url"),
  width: integer("width"),
  height: integer("height"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dreamscapeReviewsTable = pgTable("dreamscape_reviews", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => dreamscapeProjectsTable.id, { onDelete: "cascade" }),
  assetId: integer("asset_id").references(() => dreamscapeAssetsTable.id, { onDelete: "set null" }),
  reviewerName: text("reviewer_name").notNull(),
  comment: text("comment").notNull(),
  status: text("status", { enum: ["pending", "approved", "changes_requested", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDreamscapeProjectSchema = createInsertSchema(dreamscapeProjectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDreamscapeProject = z.infer<typeof insertDreamscapeProjectSchema>;
export type DreamscapeProject = typeof dreamscapeProjectsTable.$inferSelect;

export const insertDreamscapeAssetSchema = createInsertSchema(dreamscapeAssetsTable).omit({ id: true, createdAt: true });
export type InsertDreamscapeAsset = z.infer<typeof insertDreamscapeAssetSchema>;
export type DreamscapeAsset = typeof dreamscapeAssetsTable.$inferSelect;

export const insertDreamscapeReviewSchema = createInsertSchema(dreamscapeReviewsTable).omit({ id: true, createdAt: true });
export type InsertDreamscapeReview = z.infer<typeof insertDreamscapeReviewSchema>;
export type DreamscapeReview = typeof dreamscapeReviewsTable.$inferSelect;
