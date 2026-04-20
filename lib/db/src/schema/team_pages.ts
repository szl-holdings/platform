import { pgTable, text, serial, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

/**
 * Append-only audit log of team-page events fired from the deployments
 * operator console (#2433).
 *
 * The page action drops a row in `notifications` for the on-call recipient,
 * but that table is per-user and gets pruned/marked-read — it can't answer
 * "show me the last 10 pages for team Platform" from a third party's seat.
 * Operators want that view to spot noisy pagers and confirm the right
 * person was reached.
 *
 * Self-paged no-ops (actor IS the on-call) are NEVER inserted here, so the
 * history never shows useless self-pages.
 */
export const teamPagesTable = pgTable(
  "team_pages",
  {
    id: serial("id").primaryKey(),
    team: text("team").notNull(),
    /**
     * The user who initiated the page (the "pager"). Nullable so that
     * `ON DELETE SET NULL` can fire if the user is deleted later — the
     * audit row is preserved even if the referenced principal goes away.
     * Inserts always supply a non-null actor; the column only becomes
     * NULL if the referenced user row is removed.
     */
    actorId: integer("actor_id").references(() => usersTable.id, { onDelete: "set null" }),
    /** The on-call user who received the page. Nullable for the same reason as `actorId`. */
    recipientId: integer("recipient_id").references(() => usersTable.id, { onDelete: "set null" }),
    /** Operator-facing urgency vocabulary, mirrors the request body. */
    urgency: text("urgency", { enum: ["info", "warning", "critical"] })
      .notNull()
      .default("warning"),
    /** Optional context the pager provided. Trimmed/capped at the route. */
    message: text("message"),
    /**
     * Whether an in-app notification row was inserted for the recipient.
     * False when the recipient has opted out of in-app, OR when the page
     * was muted as a duplicate (see `mutedAsDuplicate`). External channels
     * may still have been attempted in the opt-out case; this flag is only
     * the in-app outcome.
     */
    inAppDelivered: boolean("in_app_delivered").notNull().default(true),
    /**
     * True when this page was suppressed as a duplicate of a recent page
     * from the same actor → same recipient at the same urgency, within a
     * short window (~5 minutes). The audit row is still appended so the
     * full history is preserved, but no new in-app notification is created
     * and external channels are not re-dispatched.
     */
    mutedAsDuplicate: boolean("muted_as_duplicate").notNull().default(false),
    /**
     * When `mutedAsDuplicate` is true, the id of the original team_pages
     * row that this page collapsed into. Nullable for non-duplicates and
     * for legacy rows. Self-references team_pages.id; preserved with
     * SET NULL on delete so pruning the original keeps later rows valid.
     */
    duplicateOfPageId: integer("duplicate_of_page_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    teamCreatedAtIdx: index("team_pages_team_created_at_idx").on(t.team, t.createdAt),
    createdAtIdx: index("team_pages_created_at_idx").on(t.createdAt),
  }),
);

export const insertTeamPageSchema = createInsertSchema(teamPagesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTeamPage = z.infer<typeof insertTeamPageSchema>;
export type TeamPage = typeof teamPagesTable.$inferSelect;
