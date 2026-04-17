import {
  pgTable,
  serial,
  text,
  jsonb,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const constellationSavedViewsTable = pgTable(
  "constellation_saved_views",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(),
    name: text("name").notNull(),
    filters: jsonb("filters").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("constellation_saved_views_user_domain_name_uq").on(
      t.userId,
      t.domain,
      t.name,
    ),
    index("constellation_saved_views_user_domain_idx").on(t.userId, t.domain),
  ],
);

export type InsertConstellationSavedView =
  typeof constellationSavedViewsTable.$inferInsert;
export type ConstellationSavedView =
  typeof constellationSavedViewsTable.$inferSelect;
