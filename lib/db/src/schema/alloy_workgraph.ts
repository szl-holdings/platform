import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// ─── WorkGraph Nodes ──────────────────────────────────────────────────────────
// Semantic nodes derived from workspace sources (emails, docs, meetings, etc.)

export const workGraphNodes = pgTable(
  'work_graph_nodes',
  {
    id: serial('id').primaryKey(),
    nodeId: text('node_id').notNull().unique(),
    tenantId: integer('tenant_id').notNull(),
    type: text('type', {
      enum: [
        'email', 'document', 'spreadsheet', 'chat_message', 'calendar_event',
        'meeting_summary', 'task', 'approval', 'outcome', 'workcell',
        'contact', 'file', 'slide',
      ],
    }).notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    owner: text('owner'),
    ownerRole: text('owner_role'),
    project: text('project'),
    sourceSystem: text('source_system').notNull(),
    sourceUrl: text('source_url'),
    dataClass: text('data_class', {
      enum: ['public', 'internal', 'confidential', 'restricted', 'legal', 'finance', 'security', 'personal', 'regulated'],
    }).notNull().default('internal'),
    sensitivity: real('sensitivity').notNull().default(0.5),
    confidence: real('confidence').notNull().default(0.8),
    visibility: text('visibility', {
      enum: ['owner_only', 'team', 'org', 'public'],
    }).notNull().default('team'),
    sourcePermissionState: text('source_permission_state', {
      enum: ['accessible', 'inherited', 'restricted', 'blocked'],
    }).notNull().default('accessible'),
    evidenceRefs: jsonb('evidence_refs').default([]),
    freshness: text('freshness', {
      enum: ['fresh', 'stale', 'expired'],
    }).notNull().default('fresh'),
    riskLevel: text('risk_level', {
      enum: ['low', 'medium', 'high', 'critical'],
    }).notNull().default('low'),
    demoMode: boolean('demo_mode').notNull().default(true),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('wgn_tenant_idx').on(t.tenantId),
    index('wgn_type_idx').on(t.type),
    index('wgn_owner_idx').on(t.owner),
    index('wgn_project_idx').on(t.project),
    index('wgn_source_system_idx').on(t.sourceSystem),
    index('wgn_data_class_idx').on(t.dataClass),
    index('wgn_freshness_idx').on(t.freshness),
    index('wgn_risk_level_idx').on(t.riskLevel),
    index('wgn_created_at_idx').on(t.createdAt),
  ],
);

// ─── WorkGraph Edges ──────────────────────────────────────────────────────────
// Typed semantic relationships between nodes

export const workGraphEdges = pgTable(
  'work_graph_edges',
  {
    id: serial('id').primaryKey(),
    edgeId: text('edge_id').notNull().unique(),
    tenantId: integer('tenant_id').notNull(),
    fromNodeId: text('from_node_id').notNull(),
    toNodeId: text('to_node_id').notNull(),
    type: text('type', {
      enum: ['references', 'blocks', 'resolves', 'assigns', 'triggers', 'approves', 'links_to', 'follows_up'],
    }).notNull(),
    strength: real('strength').notNull().default(1.0),
    confidence: real('confidence').notNull().default(0.8),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('wge_tenant_idx').on(t.tenantId),
    index('wge_from_node_idx').on(t.fromNodeId),
    index('wge_to_node_idx').on(t.toNodeId),
    index('wge_type_idx').on(t.type),
  ],
);

// ─── Work Objects ─────────────────────────────────────────────────────────────
// Work units that link multiple nodes to an owner, status, and outcome

export const workObjects = pgTable(
  'work_objects',
  {
    id: serial('id').primaryKey(),
    workObjectId: text('work_object_id').notNull().unique(),
    tenantId: integer('tenant_id').notNull(),
    title: text('title').notNull(),
    status: text('status', {
      enum: ['open', 'in_progress', 'blocked', 'pending_approval', 'complete', 'archived'],
    }).notNull().default('open'),
    owner: text('owner'),
    project: text('project'),
    nodeIds: jsonb('node_ids').default([]),
    outcomeId: text('outcome_id'),
    workcellId: text('workcell_id'),
    approvalState: text('approval_state', {
      enum: ['not_required', 'pending', 'approved', 'rejected', 'escalated'],
    }).notNull().default('not_required'),
    proofPacketId: text('proof_packet_id'),
    riskLevel: text('risk_level', {
      enum: ['low', 'medium', 'high', 'critical'],
    }).notNull().default('low'),
    decisionLatencyMs: integer('decision_latency_ms'),
    slaDeadlineAt: timestamp('sla_deadline_at'),
    demoMode: boolean('demo_mode').notNull().default(true),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('wo_tenant_idx').on(t.tenantId),
    index('wo_owner_idx').on(t.owner),
    index('wo_project_idx').on(t.project),
    index('wo_status_idx').on(t.status),
    index('wo_approval_state_idx').on(t.approvalState),
    index('wo_risk_level_idx').on(t.riskLevel),
    index('wo_created_at_idx').on(t.createdAt),
  ],
);

// ─── WorkGraph Skill Runs ─────────────────────────────────────────────────────
// Audit records for every Skills Studio run (even in demo mode)

export const workGraphSkillRuns = pgTable(
  'work_graph_skill_runs',
  {
    id: serial('id').primaryKey(),
    runId: text('run_id').notNull().unique(),
    tenantId: integer('tenant_id').notNull(),
    skillId: text('skill_id').notNull(),
    skillName: text('skill_name').notNull(),
    triggeredBy: text('triggered_by'),
    inputNodeIds: jsonb('input_node_ids').default([]),
    outputSummary: text('output_summary'),
    mirrorEvalScore: real('mirror_eval_score'),
    approvalClass: text('approval_class', {
      enum: ['auto', 'review', 'finance', 'legal', 'security', 'executive'],
    }).notNull().default('auto'),
    approvalState: text('approval_state', {
      enum: ['not_required', 'pending', 'approved', 'rejected'],
    }).notNull().default('not_required'),
    proofPacketId: text('proof_packet_id'),
    proofRequired: boolean('proof_required').notNull().default(false),
    demoMode: boolean('demo_mode').notNull().default(true),
    status: text('status', {
      enum: ['running', 'complete', 'failed', 'blocked'],
    }).notNull().default('complete'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('wgsr_tenant_idx').on(t.tenantId),
    index('wgsr_skill_id_idx').on(t.skillId),
    index('wgsr_approval_state_idx').on(t.approvalState),
    index('wgsr_created_at_idx').on(t.createdAt),
  ],
);

// ─── WorkGraph Answer Log ──────────────────────────────────────────────────────
// Audit log of every Answer Engine query + response

export const workGraphAnswerLog = pgTable(
  'work_graph_answer_log',
  {
    id: serial('id').primaryKey(),
    answerId: text('answer_id').notNull().unique(),
    tenantId: integer('tenant_id').notNull(),
    requestingUserId: text('requesting_user_id'),
    question: text('question').notNull(),
    answerText: text('answer_text'),
    confidence: real('confidence'),
    evidenceNodeIds: jsonb('evidence_node_ids').default([]),
    permissionNotes: jsonb('permission_notes').default([]),
    missingContext: jsonb('missing_context').default([]),
    proofReady: boolean('proof_ready').notNull().default(false),
    demoMode: boolean('demo_mode').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('wgal_tenant_idx').on(t.tenantId),
    index('wgal_requesting_user_idx').on(t.requestingUserId),
    index('wgal_created_at_idx').on(t.createdAt),
  ],
);
