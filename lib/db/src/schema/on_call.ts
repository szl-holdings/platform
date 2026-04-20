/**
 * On-call schedules (#2432).
 *
 * Replaces the deterministic ISO-week auto-rotation in
 * `artifacts/api-server/src/routes/teams.ts` with a real PagerDuty-style
 * schedule store: per-team rotation cadence + explicit member ordering, plus
 * one-off overrides/swaps that take priority over the rotation.
 *
 * Resolution order at query time (see `pickOnCallFromSchedule`):
 *   1. Active override in `on_call_shifts` whose [start_at, end_at) covers
 *      the moment we're asking about.
 *   2. Configured rotation in `on_call_schedules` (member_order +
 *      rotation_interval_hours + handoff_anchor).
 *   3. Fallback to the legacy weekly auto-rotation across active members.
 *
 * Tables intentionally use `serial` ids and a `text` team key to match the
 * shape of the existing `users.team` column — there is no separate `teams`
 * table to FK against.
 */
import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

/**
 * One row per team that has a configured rotation. Teams without a row fall
 * back to the legacy ISO-week auto-rotation across active members.
 *
 * `member_order` is an array of `users.id` values — the rotation walks them
 * in order, advancing by one slot every `rotation_interval_hours` starting
 * at `handoff_anchor`. A user appearing in `member_order` who is no longer
 * an active team member is skipped at resolution time.
 */
export const onCallSchedulesTable = pgTable(
  "on_call_schedules",
  {
    id: serial("id").primaryKey(),
    team: text("team").notNull(),
    /** Rotation cadence in hours. 168=weekly, 24=daily, 12=12h, 0=disabled. */
    rotationIntervalHours: integer("rotation_interval_hours").notNull().default(168),
    /** Ordered array of user ids defining the rotation. JSONB for flexibility. */
    memberOrder: jsonb("member_order").$type<number[]>().notNull().default([]),
    /** Anchor moment for slot 0; subsequent slots advance every interval. */
    handoffAnchor: timestamp("handoff_anchor", { withTimezone: true }).notNull().defaultNow(),
    /** IANA timezone label for display ("UTC", "America/Los_Angeles", ...). */
    timezone: text("timezone").notNull().default("UTC"),
    /**
     * Minutes before a hand-off boundary at which to nudge the next on-call
     * user. 0 disables the warning entirely (the moment-of-handoff
     * notification still fires). See task #2482.
     */
    warningMinutes: integer("warning_minutes").notNull().default(30),
    updatedBy: integer("updated_by").references(() => usersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    teamUnique: uniqueIndex("on_call_schedules_team_unique").on(t.team),
  }),
);

/**
 * One-off overrides / swaps. Anything whose [start_at, end_at) covers the
 * moment we're asking about wins over the rotation. Most-recently-created
 * row wins on overlap so a late swap reliably overrides an earlier one.
 *
 * `kind` is reserved for future use (e.g. recurring shift definitions) but
 * defaults to `override` for the v1 contract.
 */
export const onCallShiftsTable = pgTable(
  "on_call_shifts",
  {
    id: serial("id").primaryKey(),
    team: text("team").notNull(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["override", "shift"] }).notNull().default("override"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    note: text("note"),
    createdBy: integer("created_by").references(() => usersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    teamRangeIdx: index("on_call_shifts_team_range_idx").on(t.team, t.startAt, t.endAt),
  }),
);

export const insertOnCallScheduleSchema = createInsertSchema(onCallSchedulesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOnCallSchedule = z.infer<typeof insertOnCallScheduleSchema>;
export type OnCallSchedule = typeof onCallSchedulesTable.$inferSelect;

export const insertOnCallShiftSchema = createInsertSchema(onCallShiftsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOnCallShift = z.infer<typeof insertOnCallShiftSchema>;
export type OnCallShift = typeof onCallShiftsTable.$inferSelect;

/**
 * Dedup ledger for the on-call hand-off scheduler (#2482).
 *
 * One row per (team, handoff_at, kind, user_id) combination. The unique
 * index lets the minutely scheduler insert with `onConflictDoNothing` to
 * avoid double-notifying on overlapping ticks or after a restart.
 *
 * `kind` is one of:
 *   - `warning` — fired N minutes before the hand-off (per schedule's
 *     `warningMinutes`).
 *   - `handoff` — fired at the hand-off moment.
 */
export const onCallHandoffNotificationsTable = pgTable(
  "on_call_handoff_notifications",
  {
    id: serial("id").primaryKey(),
    team: text("team").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    handoffAt: timestamp("handoff_at", { withTimezone: true }).notNull(),
    kind: text("kind", { enum: ["warning", "handoff"] }).notNull(),
    /** notifications.id of the in-app row inserted, if any. */
    notificationId: integer("notification_id"),
    inAppDelivered: boolean("in_app_delivered").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    dedupIdx: uniqueIndex("on_call_handoff_notifications_dedup").on(
      t.team,
      t.handoffAt,
      t.kind,
      t.userId,
    ),
  }),
);

export type OnCallHandoffNotification = typeof onCallHandoffNotificationsTable.$inferSelect;
