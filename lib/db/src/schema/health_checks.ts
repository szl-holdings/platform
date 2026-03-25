import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const healthChecksTable = pgTable("health_checks", {
  id: serial("id").primaryKey(),
  service: text("service").notNull(),
  status: text("status", { enum: ["healthy", "degraded", "down"] }).notNull(),
  responseTimeMs: integer("response_time_ms"),
  details: jsonb("details"),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});

export const insertHealthCheckSchema = createInsertSchema(healthChecksTable).omit({ id: true, checkedAt: true });
export type InsertHealthCheck = z.infer<typeof insertHealthCheckSchema>;
export type HealthCheck = typeof healthChecksTable.$inferSelect;
