-- WorkGraph: Governed Workspace Intelligence Layer
-- Alloy Phase 5 — Semantic workspace graph for emails, docs, meetings, chats, approvals

CREATE TABLE IF NOT EXISTS work_graph_nodes (
  id              SERIAL PRIMARY KEY,
  node_id         TEXT NOT NULL UNIQUE,
  tenant_id       INTEGER NOT NULL,
  type            TEXT NOT NULL CHECK (type IN (
    'email','document','spreadsheet','chat_message','calendar_event',
    'meeting_summary','task','approval','outcome','workcell','contact','file','slide'
  )),
  title           TEXT NOT NULL,
  summary         TEXT,
  owner           TEXT,
  owner_role      TEXT,
  project         TEXT,
  source_system   TEXT NOT NULL,
  source_url      TEXT,
  data_class      TEXT NOT NULL DEFAULT 'internal' CHECK (data_class IN (
    'public','internal','confidential','restricted','legal','finance','security','personal','regulated'
  )),
  sensitivity     REAL NOT NULL DEFAULT 0.5,
  confidence      REAL NOT NULL DEFAULT 0.8,
  visibility      TEXT NOT NULL DEFAULT 'team' CHECK (visibility IN ('owner_only','team','org','public')),
  source_permission_state TEXT NOT NULL DEFAULT 'accessible' CHECK (
    source_permission_state IN ('accessible','inherited','restricted','blocked')
  ),
  evidence_refs   JSONB DEFAULT '[]',
  freshness       TEXT NOT NULL DEFAULT 'fresh' CHECK (freshness IN ('fresh','stale','expired')),
  risk_level      TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  demo_mode       BOOLEAN NOT NULL DEFAULT TRUE,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wgn_tenant_idx        ON work_graph_nodes (tenant_id);
CREATE INDEX IF NOT EXISTS wgn_type_idx          ON work_graph_nodes (type);
CREATE INDEX IF NOT EXISTS wgn_owner_idx         ON work_graph_nodes (owner);
CREATE INDEX IF NOT EXISTS wgn_project_idx       ON work_graph_nodes (project);
CREATE INDEX IF NOT EXISTS wgn_source_system_idx ON work_graph_nodes (source_system);
CREATE INDEX IF NOT EXISTS wgn_data_class_idx    ON work_graph_nodes (data_class);
CREATE INDEX IF NOT EXISTS wgn_freshness_idx     ON work_graph_nodes (freshness);
CREATE INDEX IF NOT EXISTS wgn_risk_level_idx    ON work_graph_nodes (risk_level);
CREATE INDEX IF NOT EXISTS wgn_created_at_idx    ON work_graph_nodes (created_at);

-- ─── WorkGraph Edges ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS work_graph_edges (
  id          SERIAL PRIMARY KEY,
  edge_id     TEXT NOT NULL UNIQUE,
  tenant_id   INTEGER NOT NULL,
  from_node_id TEXT NOT NULL,
  to_node_id   TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN (
    'references','blocks','resolves','assigns','triggers','approves','links_to','follows_up'
  )),
  strength    REAL NOT NULL DEFAULT 1.0,
  confidence  REAL NOT NULL DEFAULT 0.8,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wge_tenant_idx    ON work_graph_edges (tenant_id);
CREATE INDEX IF NOT EXISTS wge_from_node_idx ON work_graph_edges (from_node_id);
CREATE INDEX IF NOT EXISTS wge_to_node_idx   ON work_graph_edges (to_node_id);
CREATE INDEX IF NOT EXISTS wge_type_idx      ON work_graph_edges (type);

-- ─── Work Objects ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS work_objects (
  id               SERIAL PRIMARY KEY,
  work_object_id   TEXT NOT NULL UNIQUE,
  tenant_id        INTEGER NOT NULL,
  title            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open','in_progress','blocked','pending_approval','complete','archived'
  )),
  owner            TEXT,
  project          TEXT,
  node_ids         JSONB DEFAULT '[]',
  outcome_id       TEXT,
  workcell_id      TEXT,
  approval_state   TEXT NOT NULL DEFAULT 'not_required' CHECK (approval_state IN (
    'not_required','pending','approved','rejected','escalated'
  )),
  proof_packet_id  TEXT,
  risk_level       TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  decision_latency_ms INTEGER,
  sla_deadline_at  TIMESTAMP,
  demo_mode        BOOLEAN NOT NULL DEFAULT TRUE,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wo_tenant_idx         ON work_objects (tenant_id);
CREATE INDEX IF NOT EXISTS wo_owner_idx          ON work_objects (owner);
CREATE INDEX IF NOT EXISTS wo_project_idx        ON work_objects (project);
CREATE INDEX IF NOT EXISTS wo_status_idx         ON work_objects (status);
CREATE INDEX IF NOT EXISTS wo_approval_state_idx ON work_objects (approval_state);
CREATE INDEX IF NOT EXISTS wo_risk_level_idx     ON work_objects (risk_level);
CREATE INDEX IF NOT EXISTS wo_created_at_idx     ON work_objects (created_at);

-- ─── WorkGraph Skill Runs ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS work_graph_skill_runs (
  id              SERIAL PRIMARY KEY,
  run_id          TEXT NOT NULL UNIQUE,
  tenant_id       INTEGER NOT NULL,
  skill_id        TEXT NOT NULL,
  skill_name      TEXT NOT NULL,
  triggered_by    TEXT,
  input_node_ids  JSONB DEFAULT '[]',
  output_summary  TEXT,
  mirror_eval_score REAL,
  approval_class  TEXT NOT NULL DEFAULT 'auto' CHECK (approval_class IN (
    'auto','review','finance','legal','security','executive'
  )),
  approval_state  TEXT NOT NULL DEFAULT 'not_required' CHECK (approval_state IN (
    'not_required','pending','approved','rejected'
  )),
  proof_packet_id TEXT,
  proof_required  BOOLEAN NOT NULL DEFAULT FALSE,
  demo_mode       BOOLEAN NOT NULL DEFAULT TRUE,
  status          TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('running','complete','failed','blocked')),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wgsr_tenant_idx        ON work_graph_skill_runs (tenant_id);
CREATE INDEX IF NOT EXISTS wgsr_skill_id_idx      ON work_graph_skill_runs (skill_id);
CREATE INDEX IF NOT EXISTS wgsr_approval_state_idx ON work_graph_skill_runs (approval_state);
CREATE INDEX IF NOT EXISTS wgsr_created_at_idx    ON work_graph_skill_runs (created_at);

-- ─── WorkGraph Answer Log ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS work_graph_answer_log (
  id                   SERIAL PRIMARY KEY,
  answer_id            TEXT NOT NULL UNIQUE,
  tenant_id            INTEGER NOT NULL,
  requesting_user_id   TEXT,
  question             TEXT NOT NULL,
  answer_text          TEXT,
  confidence           REAL,
  evidence_node_ids    JSONB DEFAULT '[]',
  permission_notes     JSONB DEFAULT '[]',
  missing_context      JSONB DEFAULT '[]',
  proof_ready          BOOLEAN NOT NULL DEFAULT FALSE,
  demo_mode            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wgal_tenant_idx          ON work_graph_answer_log (tenant_id);
CREATE INDEX IF NOT EXISTS wgal_requesting_user_idx ON work_graph_answer_log (requesting_user_id);
CREATE INDEX IF NOT EXISTS wgal_created_at_idx      ON work_graph_answer_log (created_at);
