/**
 * Geo-Intel pin persistence
 *
 * Stores the mutable state of geospatial intelligence pins surfaced on the
 * Command map. SIGINT pins continue to be derived from `sentra_incidents`
 * and INFRASTRUCTURE pins are computed live; this table holds the pins
 * that an operator can directly mutate (PERSONNEL, WEATHER, and any
 * ad-hoc layers added at runtime). The in-memory store in
 * `services/geo-intel-store.ts` hydrates from this table on boot and
 * writes through on every mutation so threat-level changes, new ephemeral
 * pins, and removals survive API server restarts.
 */

import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const geoIntelPinsTable = pgTable(
  'geo_intel_pins',
  {
    id: text('id').primaryKey(),
    layer: text('layer').notNull(),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    label: text('label').notNull(),
    sublabel: text('sublabel').notNull(),
    classification: text('classification').notNull(),
    threat: text('threat').notNull(),
    stale: boolean('stale').notNull().default(false),
    detailSummary: text('detail_summary').notNull(),
    detailSource: text('detail_source').notNull(),
    detailTimestamp: text('detail_timestamp').notNull(),
    detailConfidence: integer('detail_confidence').notNull(),
    detailTags: jsonb('detail_tags').notNull().default([]).$type<string[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('geo_intel_pins_layer_idx').on(t.layer),
    index('geo_intel_pins_threat_idx').on(t.threat),
  ],
);

export type GeoIntelPinRow = typeof geoIntelPinsTable.$inferSelect;
export type GeoIntelPinInsert = typeof geoIntelPinsTable.$inferInsert;
