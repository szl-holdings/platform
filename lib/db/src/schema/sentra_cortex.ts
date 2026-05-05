import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const sentraCortexProofLog = pgTable('sentra_cortex_proof_log', {
  id: serial('id').primaryKey(),
  proofId: text('proof_id').notNull().unique(),
  pathId: text('path_id').notNull(),
  action: text('action', { enum: ['approve', 'deny', 'stage'] }).notNull(),
  newStatus: text('new_status').notNull(),
  operator: text('operator').notNull().default('sentra-operator'),
  constitutionalCite: text('constitutional_cite'),
  alloyWorkflowId: integer('alloy_workflow_id'),
  alloyApprovalId: integer('alloy_approval_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
