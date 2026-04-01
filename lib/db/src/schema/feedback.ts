import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const feedbackTable = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  type: text("type", { enum: ["nps", "contextual"] }).notNull(),
  score: integer("score"),
  sentiment: text("sentiment", { enum: ["positive", "negative", "neutral"] }),
  comment: text("comment"),
  appName: text("app_name"),
  pageUrl: text("page_url"),
  userRole: text("user_role"),
  dismissed: boolean("dismissed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const feedbackSurveyPrefsTable = pgTable("feedback_survey_prefs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  lastNpsSurveyAt: timestamp("last_nps_survey_at"),
  npsSnoozedUntil: timestamp("nps_snoozed_until"),
  npsOptOut: boolean("nps_opt_out").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedbackTable).omit({ id: true, createdAt: true });
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbackTable.$inferSelect;

export const insertFeedbackSurveyPrefsSchema = createInsertSchema(feedbackSurveyPrefsTable).omit({ id: true, updatedAt: true });
export type InsertFeedbackSurveyPrefs = z.infer<typeof insertFeedbackSurveyPrefsSchema>;
export type FeedbackSurveyPrefs = typeof feedbackSurveyPrefsTable.$inferSelect;
