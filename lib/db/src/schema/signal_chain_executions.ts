import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const signalChainExecutionsTable = pgTable("signal_chain_executions", {
  id: serial("id").primaryKey(),
  chainId: text("chain_id").notNull(),
  triggerDomain: text("trigger_domain").notNull(),
  payloadSnapshot: jsonb("payload_snapshot"),
  outcomes: jsonb("outcomes"),
  triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
  status: text("status", { enum: ["running", "completed", "failed"] }).notNull().default("completed"),
});

export const insertSignalChainExecutionSchema = createInsertSchema(signalChainExecutionsTable).omit({
  id: true,
  triggeredAt: true,
});
export type InsertSignalChainExecution = z.infer<typeof insertSignalChainExecutionSchema>;
export type SignalChainExecution = typeof signalChainExecutionsTable.$inferSelect;
