import { pgTable, text, uuid, timestamp, integer, boolean, real, jsonb, index, serial } from "drizzle-orm/pg-core";

export const analyticsSessionsTable = pgTable(
  "analytics_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visitorId: text("visitor_id").notNull(),
    sessionStart: timestamp("session_start").notNull().defaultNow(),
    sessionEnd: timestamp("session_end"),
    pageCount: integer("page_count").notNull().default(1),
    durationSeconds: integer("duration_seconds"),
    bounced: boolean("bounced").notNull().default(true),
    entryPath: text("entry_path"),
    exitPath: text("exit_path"),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmTerm: text("utm_term"),
    utmContent: text("utm_content"),
    channel: text("channel"),
    deviceType: text("device_type"),
    browser: text("browser"),
    os: text("os"),
    viewportWidth: integer("viewport_width"),
    viewportHeight: integer("viewport_height"),
    timezone: text("timezone"),
    language: text("language"),
    appName: text("app_name"),
    converted: boolean("converted").notNull().default(false),
    conversionCount: integer("conversion_count").notNull().default(0),
    country: text("country"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    visitorIdx: index("analytics_sessions_visitor_idx").on(t.visitorId),
    sessionStartIdx: index("analytics_sessions_start_idx").on(t.sessionStart),
    channelIdx: index("analytics_sessions_channel_idx").on(t.channel),
    convertedIdx: index("analytics_sessions_converted_idx").on(t.converted),
    appNameIdx: index("analytics_sessions_app_name_idx").on(t.appName),
    utmSourceIdx: index("analytics_sessions_utm_source_idx").on(t.utmSource),
  }),
);

export const analyticsPageViewsTable = pgTable(
  "analytics_page_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").references(() => analyticsSessionsTable.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    path: text("path").notNull(),
    title: text("title"),
    referrer: text("referrer"),
    enterAt: timestamp("enter_at").notNull().defaultNow(),
    exitAt: timestamp("exit_at"),
    durationSeconds: integer("duration_seconds"),
    scrollDepthPct: integer("scroll_depth_pct"),
    clickCount: integer("click_count").notNull().default(0),
    viewportWidth: integer("viewport_width"),
    viewportHeight: integer("viewport_height"),
    appName: text("app_name"),
    properties: jsonb("properties").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    sessionIdx: index("analytics_page_views_session_idx").on(t.sessionId),
    visitorIdx: index("analytics_page_views_visitor_idx").on(t.visitorId),
    pathIdx: index("analytics_page_views_path_idx").on(t.path),
    enterAtIdx: index("analytics_page_views_enter_at_idx").on(t.enterAt),
    appNameIdx: index("analytics_page_views_app_name_idx").on(t.appName),
  }),
);

export const analyticsConversionsTable = pgTable(
  "analytics_conversions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").references(() => analyticsSessionsTable.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    goalId: integer("goal_id"),
    goalName: text("goal_name").notNull(),
    triggerEvent: text("trigger_event"),
    value: real("value"),
    currency: text("currency"),
    properties: jsonb("properties").$type<Record<string, unknown>>().default({}),
    path: text("path"),
    timeToConversionSeconds: integer("time_to_conversion_seconds"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    sessionIdx: index("analytics_conversions_session_idx").on(t.sessionId),
    visitorIdx: index("analytics_conversions_visitor_idx").on(t.visitorId),
    goalNameIdx: index("analytics_conversions_goal_name_idx").on(t.goalName),
    createdAtIdx: index("analytics_conversions_created_at_idx").on(t.createdAt),
  }),
);

export const analyticsGoalsTable = pgTable(
  "analytics_goals",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    triggerEvent: text("trigger_event").notNull(),
    urlMatch: text("url_match"),
    propertyConditions: jsonb("property_conditions").$type<Record<string, unknown>>().default({}),
    active: boolean("active").notNull().default(true),
    value: real("value"),
    currency: text("currency").default("USD"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    activeIdx: index("analytics_goals_active_idx").on(t.active),
    triggerEventIdx: index("analytics_goals_trigger_event_idx").on(t.triggerEvent),
  }),
);

export type AnalyticsSession = typeof analyticsSessionsTable.$inferSelect;
export type NewAnalyticsSession = typeof analyticsSessionsTable.$inferInsert;
export type AnalyticsPageView = typeof analyticsPageViewsTable.$inferSelect;
export type NewAnalyticsPageView = typeof analyticsPageViewsTable.$inferInsert;
export type AnalyticsConversion = typeof analyticsConversionsTable.$inferSelect;
export type NewAnalyticsConversion = typeof analyticsConversionsTable.$inferInsert;
export type AnalyticsGoal = typeof analyticsGoalsTable.$inferSelect;
export type NewAnalyticsGoal = typeof analyticsGoalsTable.$inferInsert;
