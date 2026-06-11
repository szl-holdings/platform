import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth.js';
import { organizationsTable } from './organizations.js';
import { vesselsTable } from './vessels.js';

export const vesselsPscInspectionsTable = pgTable(
  'vessels_psc_inspections',
  {
    id: serial('id').primaryKey(),
    vesselId: integer('vessel_id')
      .notNull()
      .references(() => vesselsTable.id, { onDelete: 'cascade' }),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    port: text('port').notNull(),
    portCountry: text('port_country'),
    mouRegime: text('mou_regime').notNull(),
    inspectionDate: timestamp('inspection_date').notNull(),
    result: text('result', {
      enum: ['passed', 'deficiency', 'detained'],
    }).notNull(),
    deficienciesCount: integer('deficiencies_count').notNull().default(0),
    deficiencyCategories: jsonb('deficiency_categories').$type<string[]>().notNull().default([]),
    detained: boolean('detained').notNull().default(false),
    detentionDays: integer('detention_days'),
    inspector: text('inspector'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('vessels_psc_inspections_vessel_idx').on(table.vesselId),
    index('vessels_psc_inspections_org_idx').on(table.orgId),
    index('vessels_psc_inspections_date_idx').on(table.inspectionDate),
  ],
);

export const vesselsPscChecklistItemsTable = pgTable(
  'vessels_psc_checklist_items',
  {
    id: serial('id').primaryKey(),
    vesselId: integer('vessel_id')
      .notNull()
      .references(() => vesselsTable.id, { onDelete: 'cascade' }),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    status: text('status', {
      enum: ['pass', 'fail', 'action_required'],
    })
      .notNull()
      .default('pass'),
    note: text('note'),
    sortOrder: integer('sort_order').notNull().default(0),
    updatedBy: integer('updated_by').references(() => usersTable.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('vessels_psc_checklist_vessel_idx').on(table.vesselId),
    index('vessels_psc_checklist_org_idx').on(table.orgId),
  ],
);

export const insertVesselsPscInspectionSchema = createInsertSchema(
  vesselsPscInspectionsTable,
).omit({
  id: true,
  createdAt: true,
});
export type InsertVesselsPscInspection = z.infer<typeof insertVesselsPscInspectionSchema>;
export type VesselsPscInspection = typeof vesselsPscInspectionsTable.$inferSelect;

export const insertVesselsPscChecklistItemSchema = createInsertSchema(
  vesselsPscChecklistItemsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVesselsPscChecklistItem = z.infer<typeof insertVesselsPscChecklistItemSchema>;
export type VesselsPscChecklistItem = typeof vesselsPscChecklistItemsTable.$inferSelect;
