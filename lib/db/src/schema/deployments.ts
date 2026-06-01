import { index, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const deploymentsTable = pgTable(
  'deployments',
  {
    id: serial('id').primaryKey(),
    appId: text('app_id').notNull(),
    appName: text('app_name').notNull(),
    version: text('version').notNull(),
    environment: text('environment', {
      enum: ['development', 'staging', 'production'],
    }).notNull(),
    status: text('status', {
      enum: ['active', 'deploying', 'rolled-back', 'failed', 'inactive'],
    })
      .notNull()
      .default('active'),
    deployedAt: timestamp('deployed_at').notNull().defaultNow(),
    deployedBy: text('deployed_by').notNull().default('system'),
    commitSha: text('commit_sha'),
    notes: text('notes'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('deployments_app_env_idx').on(t.appId, t.environment),
    index('deployments_deployed_at_idx').on(t.deployedAt),
    index('deployments_status_idx').on(t.status),
  ],
);

export const insertDeploymentSchema = createInsertSchema(deploymentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type Deployment = typeof deploymentsTable.$inferSelect;
