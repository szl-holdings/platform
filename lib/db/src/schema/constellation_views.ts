import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { usersTable } from './auth';
import { organizationsTable } from './organizations';

/**
 * Saved Constellation views.
 *
 * A view is owned by a single user (`userId`). Visibility controls who can see
 * and apply it:
 *   - "private": only the owner can list/apply/edit/delete the view.
 *   - "org":     every member of `orgId` can list/apply the view; only the
 *                owner or an org admin/owner can rename/delete it.
 *
 * Uniqueness is scoped per visibility:
 *   - private views are unique per (user_id, domain, name)
 *   - org-shared views are unique per (org_id, domain, name)
 *
 * The two scopes are intentionally independent so that a user can keep their
 * own "Distressed properties" private view even after promoting a similarly
 * named one to the org.
 */
export const constellationSavedViewsTable = pgTable(
  'constellation_saved_views',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    orgId: integer('org_id').references(() => organizationsTable.id, {
      onDelete: 'cascade',
    }),
    visibility: text('visibility', { enum: ['private', 'org'] })
      .notNull()
      .default('private'),
    domain: text('domain').notNull(),
    name: text('name').notNull(),
    filters: jsonb('filters').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('constellation_saved_views_user_domain_name_uq')
      .on(t.userId, t.domain, t.name)
      .where(sql`${t.visibility} = 'private'`),
    uniqueIndex('constellation_saved_views_org_domain_name_uq')
      .on(t.orgId, t.domain, t.name)
      .where(sql`${t.visibility} = 'org'`),
    index('constellation_saved_views_user_domain_idx').on(t.userId, t.domain),
    index('constellation_saved_views_org_domain_idx').on(t.orgId, t.domain),
  ],
);

export type InsertConstellationSavedView = typeof constellationSavedViewsTable.$inferInsert;
export type ConstellationSavedView = typeof constellationSavedViewsTable.$inferSelect;
