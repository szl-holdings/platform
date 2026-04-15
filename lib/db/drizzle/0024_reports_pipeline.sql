-- Reports pipeline: composable template engine, report generations, approvals, distributions, schedules

CREATE TABLE IF NOT EXISTS report_templates (
  id serial PRIMARY KEY,
  template_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  domain text NOT NULL DEFAULT 'general' CHECK (domain IN ('szl_holdings', 'carlota_jo', 'aegis', 'terra', 'vessels', 'lyte', 'prism', 'general')),
  report_type text NOT NULL,
  blocks jsonb NOT NULL DEFAULT '[]',
  brand_theme text NOT NULL DEFAULT 'szl' CHECK (brand_theme IN ('szl', 'carlota', 'aegis', 'terra', 'vessels', 'lyte', 'prism', 'neutral')),
  is_schedulable boolean NOT NULL DEFAULT false,
  conditional_rules jsonb DEFAULT '[]',
  data_requirements jsonb DEFAULT '[]',
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_by_user_id integer REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS report_templates_domain_idx ON report_templates(domain);
CREATE INDEX IF NOT EXISTS report_templates_is_active_idx ON report_templates(is_active);
CREATE INDEX IF NOT EXISTS report_templates_is_schedulable_idx ON report_templates(is_schedulable);

CREATE TABLE IF NOT EXISTS report_generations (
  id serial PRIMARY KEY,
  report_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  template_id uuid,
  template_version integer DEFAULT 1,
  title text NOT NULL,
  domain text NOT NULL DEFAULT 'general',
  report_type text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'distributed', 'archived')),
  brand_theme text NOT NULL DEFAULT 'szl',
  data_snapshot jsonb,
  snapshot_at timestamp,
  rendered_blocks jsonb,
  narrative_sections jsonb,
  pdf_buffer text,
  pdf_size_bytes integer,
  formats jsonb DEFAULT '[]',
  generation_duration_ms integer,
  scheduled_run_id text,
  parent_report_id uuid,
  version_number integer NOT NULL DEFAULT 1,
  notes text,
  generated_by_user_id integer REFERENCES users(id) ON DELETE SET NULL,
  generated_at timestamp NOT NULL DEFAULT NOW(),
  created_at timestamp NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS report_generations_domain_idx ON report_generations(domain);
CREATE INDEX IF NOT EXISTS report_generations_status_idx ON report_generations(status);
CREATE INDEX IF NOT EXISTS report_generations_report_type_idx ON report_generations(report_type);
CREATE INDEX IF NOT EXISTS report_generations_generated_at_idx ON report_generations(generated_at DESC);
CREATE INDEX IF NOT EXISTS report_generations_template_id_idx ON report_generations(template_id);
CREATE INDEX IF NOT EXISTS report_generations_parent_report_id_idx ON report_generations(parent_report_id);

CREATE TABLE IF NOT EXISTS report_approvals (
  id serial PRIMARY KEY,
  approval_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  requested_by_user_id integer REFERENCES users(id) ON DELETE SET NULL,
  reviewer_user_id integer REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  annotations jsonb DEFAULT '[]',
  comment text,
  requested_at timestamp NOT NULL DEFAULT NOW(),
  reviewed_at timestamp,
  created_at timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS report_approvals_report_id_idx ON report_approvals(report_id);
CREATE INDEX IF NOT EXISTS report_approvals_status_idx ON report_approvals(status);

CREATE TABLE IF NOT EXISTS report_distributions (
  id serial PRIMARY KEY,
  distribution_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'webhook', 'dashboard', 'download')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'failed')),
  sent_at timestamp,
  opened_at timestamp,
  error_message text,
  distributed_by_user_id integer REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS report_distributions_report_id_idx ON report_distributions(report_id);
CREATE INDEX IF NOT EXISTS report_distributions_status_idx ON report_distributions(status);
CREATE INDEX IF NOT EXISTS report_distributions_recipient_email_idx ON report_distributions(recipient_email);

CREATE TABLE IF NOT EXISTS report_schedules (
  id serial PRIMARY KEY,
  schedule_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_id uuid NOT NULL,
  domain text NOT NULL DEFAULT 'general',
  frequency text NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'on_demand')),
  is_active boolean NOT NULL DEFAULT true,
  data_config jsonb DEFAULT '{}',
  recipient_emails jsonb DEFAULT '[]',
  auto_approve boolean NOT NULL DEFAULT false,
  last_run_at timestamp,
  next_run_at timestamp,
  last_status text,
  run_count integer NOT NULL DEFAULT 0,
  fail_count integer NOT NULL DEFAULT 0,
  created_by_user_id integer REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS report_schedules_template_id_idx ON report_schedules(template_id);
CREATE INDEX IF NOT EXISTS report_schedules_domain_idx ON report_schedules(domain);
CREATE INDEX IF NOT EXISTS report_schedules_is_active_idx ON report_schedules(is_active);
CREATE INDEX IF NOT EXISTS report_schedules_next_run_at_idx ON report_schedules(next_run_at ASC);
