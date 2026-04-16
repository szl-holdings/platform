import { pgTable, text, serial, timestamp, integer, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const exportJobsTable = pgTable("export_jobs", {
  id: serial("id").primaryKey(),
  exportId: text("export_id").notNull().unique(),
  name: text("name").notNull(),
  dataSource: text("data_source").notNull(),
  format: text("format", { enum: ["csv", "pdf"] }).notNull().default("csv"),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).notNull().default("pending"),
  triggeredByUserId: integer("triggered_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  triggeredByEmail: text("triggered_by_email"),
  filterParams: text("filter_params"),
  rowCount: integer("row_count"),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  downloadToken: text("download_token"),
  expiresAt: timestamp("expires_at"),
  errorMessage: text("error_message"),
  scheduleFrequency: text("schedule_frequency", { enum: ["once", "daily", "weekly", "monthly"] }).notNull().default("once"),
  nextRunAt: timestamp("next_run_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertExportJobSchema = createInsertSchema(exportJobsTable).omit({ id: true, createdAt: true });
export type InsertExportJob = z.infer<typeof insertExportJobSchema>;
export type ExportJob = typeof exportJobsTable.$inferSelect;
