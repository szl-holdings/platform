import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const vesselsBillsOfLadingTable = pgTable('vessels_bills_of_lading', {
  id: text('id').primaryKey(),
  vesselName: text('vessel_name').notNull(),
  imo: text('imo').notNull().default(''),
  voyageId: text('voyage_id').notNull().default(''),
  shipper: text('shipper').notNull(),
  consignee: text('consignee').notNull(),
  notifyParty: text('notify_party').notNull().default(''),
  cargo: text('cargo').notNull(),
  quantity: text('quantity').notNull().default(''),
  quantityMt: numeric('quantity_mt', { precision: 16, scale: 2 }).notNull().default('0'),
  unit: text('unit').notNull().default('MT'),
  originPort: text('origin_port').notNull(),
  destinationPort: text('destination_port').notNull(),
  status: text('status').notNull().default('issued'),
  lcRef: text('lc_ref').notNull().default(''),
  lcIssuer: text('lc_issuer').notNull().default(''),
  lcAmount: numeric('lc_amount', { precision: 18, scale: 2 }).notNull().default('0'),
  lcStatus: text('lc_status').notNull().default('pending'),
  autoLcRelease: boolean('auto_lc_release').notNull().default(true),
  transferCount: integer('transfer_count').notNull().default(0),
  deliveryConfirmed: boolean('delivery_confirmed').notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  insertedAt: timestamp('inserted_at').notNull().defaultNow(),
});

export const vesselsBolChainEventsTable = pgTable(
  'vessels_bol_chain_events',
  {
    id: serial('id').primaryKey(),
    bolId: text('bol_id')
      .notNull()
      .references(() => vesselsBillsOfLadingTable.id, { onDelete: 'cascade' }),
    sequence: integer('sequence').notNull(),
    eventType: text('event_type').notNull(),
    actor: text('actor').notNull(),
    eventTimestamp: text('event_timestamp').notNull(),
    confirmed: boolean('confirmed').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    bolSeqIdx: uniqueIndex('vessels_bol_chain_events_bol_seq_idx').on(t.bolId, t.sequence),
    bolIdx: index('vessels_bol_chain_events_bol_idx').on(t.bolId),
  }),
);

export const insertVesselsBillOfLadingSchema = createInsertSchema(vesselsBillsOfLadingTable);
export type InsertVesselsBillOfLading = z.infer<typeof insertVesselsBillOfLadingSchema>;
export type VesselsBillOfLading = typeof vesselsBillsOfLadingTable.$inferSelect;

export const insertVesselsBolChainEventSchema = createInsertSchema(vesselsBolChainEventsTable).omit(
  { id: true, createdAt: true },
);
export type InsertVesselsBolChainEvent = z.infer<typeof insertVesselsBolChainEventSchema>;
export type VesselsBolChainEvent = typeof vesselsBolChainEventsTable.$inferSelect;
