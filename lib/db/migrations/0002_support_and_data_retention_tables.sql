-- Migration: Create support portal and data retention tables
-- Applied via: pnpm --filter @szl-holdings/db run push
-- Purpose: Enterprise trust surfaces — support ticket tracking, knowledge base,
--          data retention policies, and purge audit trail (Task #681)

-- Support ticket table
CREATE TABLE IF NOT EXISTS support_tickets (
  id                SERIAL PRIMARY KEY,
  ticket_ref        TEXT NOT NULL UNIQUE,
  org_id            INTEGER REFERENCES organizations (id) ON DELETE SET NULL,
  user_id           INTEGER REFERENCES users (id) ON DELETE SET NULL,
  submitter_name    TEXT NOT NULL,
  submitter_email   TEXT NOT NULL,
  subject           TEXT NOT NULL,
  description       TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'other'
                      CHECK (category IN ('billing','technical','account','feature_request','security','data_privacy','other')),
  priority          TEXT NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('low','medium','high','urgent')),
  status            TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','in_progress','waiting_on_customer','resolved','closed')),
  assigned_to_id    INTEGER REFERENCES users (id) ON DELETE SET NULL,
  assigned_to_name  TEXT,
  resolved_at       TIMESTAMPTZ,
  closed_at         TIMESTAMPTZ,
  metadata          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_tickets_org_id_idx    ON support_tickets (org_id);
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx   ON support_tickets (user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx    ON support_tickets (status);
CREATE INDEX IF NOT EXISTS support_tickets_created_at_idx ON support_tickets (created_at DESC);

-- Support ticket comments / replies
CREATE TABLE IF NOT EXISTS support_ticket_comments (
  id          SERIAL PRIMARY KEY,
  ticket_id   INTEGER NOT NULL REFERENCES support_tickets (id) ON DELETE CASCADE,
  author_id   INTEGER REFERENCES users (id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'customer'
                CHECK (author_role IN ('customer','agent','admin')),
  body        TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_ticket_comments_ticket_id_idx ON support_ticket_comments (ticket_id);

-- Knowledge base articles
CREATE TABLE IF NOT EXISTS support_knowledge_articles (
  id           SERIAL PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  category     TEXT NOT NULL,
  summary      TEXT NOT NULL,
  body         TEXT NOT NULL,
  tags         TEXT[] NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  view_count   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id             SERIAL PRIMARY KEY,
  org_id         INTEGER REFERENCES organizations (id) ON DELETE CASCADE,
  table_name     TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  purge_strategy TEXT NOT NULL DEFAULT 'delete'
                   CHECK (purge_strategy IN ('delete','anonymize','archive')),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at    TIMESTAMPTZ,
  next_run_at    TIMESTAMPTZ,
  description    TEXT,
  created_by     INTEGER REFERENCES users (id) ON DELETE SET NULL,
  updated_by     INTEGER REFERENCES users (id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS data_retention_policies_org_id_idx ON data_retention_policies (org_id);
-- Unique: only one global policy per table (orgId IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS data_retention_policies_global_table_idx
  ON data_retention_policies (table_name)
  WHERE org_id IS NULL;
-- Unique: only one per-org policy per table
CREATE UNIQUE INDEX IF NOT EXISTS data_retention_policies_org_table_idx
  ON data_retention_policies (table_name, org_id)
  WHERE org_id IS NOT NULL;

-- Data retention audit log
CREATE TABLE IF NOT EXISTS data_retention_audit_log (
  id            SERIAL PRIMARY KEY,
  policy_id     INTEGER REFERENCES data_retention_policies (id) ON DELETE SET NULL,
  org_id        INTEGER REFERENCES organizations (id) ON DELETE SET NULL,
  table_name    TEXT NOT NULL,
  action        TEXT NOT NULL
                  CHECK (action IN ('policy_created','policy_updated','policy_deleted','purge_started','purge_completed','purge_failed','manual_trigger')),
  actor_id      INTEGER REFERENCES users (id) ON DELETE SET NULL,
  actor_name    TEXT,
  affected_rows INTEGER,
  details       JSONB,
  status        TEXT NOT NULL DEFAULT 'success'
                  CHECK (status IN ('success','failure','partial')),
  error_message TEXT,
  executed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS data_retention_audit_log_policy_id_idx  ON data_retention_audit_log (policy_id);
CREATE INDEX IF NOT EXISTS data_retention_audit_log_org_id_idx     ON data_retention_audit_log (org_id);
CREATE INDEX IF NOT EXISTS data_retention_audit_log_executed_at_idx ON data_retention_audit_log (executed_at DESC);
