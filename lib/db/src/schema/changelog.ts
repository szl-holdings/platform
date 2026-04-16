import {
  pgTable, text, serial, timestamp, jsonb, index,
} from "drizzle-orm/pg-core";

export const changelogEntriesTable = pgTable(
  "changelog_entries",
  {
    id: serial("id").primaryKey(),
    version: text("version").notNull(),
    title: text("title").notNull(),
    date: timestamp("date").notNull().defaultNow(),
    category: text("category", {
      enum: ["feature", "improvement", "bugfix", "security", "breaking"],
    }).notNull().default("feature"),
    body: text("body").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]),
    published: text("published", { enum: ["true", "false"] }).notNull().default("true"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("changelog_date_idx").on(t.date),
    index("changelog_category_idx").on(t.category),
  ],
);
