-- LP portal: data room documents, GP/LP messages, and activity audit log.
-- Migration 0053 — connects the LP portal at /fund/lp-portal to live tables.

CREATE TABLE IF NOT EXISTS "fund_lp_data_room_docs" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "folder" text NOT NULL,
  "file_type" text NOT NULL DEFAULT 'pdf',
  "size_label" text NOT NULL DEFAULT '0 MB',
  "uploaded_at" text NOT NULL,
  "permission_tier" text NOT NULL DEFAULT 'all_lp',
  "watermarked" boolean NOT NULL DEFAULT false,
  "source_uri" text,
  "uploaded_by" text,
  "is_demo" boolean NOT NULL DEFAULT false,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_lp_docs_folder_idx" ON "fund_lp_data_room_docs" ("folder");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_lp_docs_perm_idx" ON "fund_lp_data_room_docs" ("permission_tier");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_lp_docs_demo_idx" ON "fund_lp_data_room_docs" ("is_demo");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "fund_lp_messages" (
  "id" serial PRIMARY KEY NOT NULL,
  "lp_id" integer NOT NULL REFERENCES "fund_accredited_investors"("id") ON DELETE CASCADE,
  "from_role" text NOT NULL,
  "author_name" text NOT NULL,
  "body" text NOT NULL,
  "is_demo" boolean NOT NULL DEFAULT false,
  "metadata" jsonb,
  "sent_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_lp_messages_lp_idx" ON "fund_lp_messages" ("lp_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_lp_messages_sent_idx" ON "fund_lp_messages" ("sent_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "fund_lp_activity_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "lp_id" integer NOT NULL REFERENCES "fund_accredited_investors"("id") ON DELETE CASCADE,
  "action" text NOT NULL,
  "target" text NOT NULL,
  "document_id" integer REFERENCES "fund_lp_data_room_docs"("id") ON DELETE SET NULL,
  "report_id" integer REFERENCES "fund_lp_reports"("id") ON DELETE SET NULL,
  "ip_address" text,
  "user_agent" text,
  "is_demo" boolean NOT NULL DEFAULT false,
  "metadata" jsonb,
  "occurred_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_lp_activity_lp_idx" ON "fund_lp_activity_events" ("lp_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_lp_activity_occurred_idx" ON "fund_lp_activity_events" ("occurred_at");
--> statement-breakpoint

-- ─── Demo seed: 3 LPs, capital accounts, NAV records, reports, docs, messages ──

INSERT INTO "fund_accredited_investors"
  ("lp_name", "lp_type", "accreditation_basis", "verification_method", "verification_status", "contact_email", "qualified_eligible_person", "metadata")
VALUES
  ('Meridian Capital', 'entity', 'qualified_purchaser', 'third_party_verification', 'verified', 'j.harrow@meridiancap.com', true, '{"is_demo":true,"join_date":"Jan 2024"}'::jsonb),
  ('Astor Family Office', 'family_office', 'net_worth_1m', 'letter_from_cpa', 'verified', 'office@astorfamily.com', false, '{"is_demo":true,"join_date":"Mar 2024"}'::jsonb),
  ('Blackrock Endowment', 'entity', 'qualified_purchaser', 'third_party_verification', 'verified', 'endowment@brk.org', true, '{"is_demo":true,"join_date":"Jan 2024"}'::jsonb)
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO "fund_lp_capital_accounts"
  ("lp_id", "commitment_cents", "called_cents", "uncalled_cents", "distributions_cents", "current_nav_cents", "ownership_pct", "vintage", "metadata")
SELECT inv.id,
       v.commitment_cents, v.called_cents, v.uncalled_cents, v.distributions_cents, v.current_nav_cents,
       v.ownership_pct::numeric, '2024',
       jsonb_build_object('is_demo', true, 'units_held', v.units_held)
FROM (VALUES
  ('j.harrow@meridiancap.com',  120000000, 74400000, 45600000, 11280000, 101040000, 9.4,  7205),
  ('office@astorfamily.com',     50000000, 31000000, 19000000,  4700000,  42100000, 3.9,  3002),
  ('endowment@brk.org',         250000000,155000000, 95000000, 23500000, 210500000,19.5, 15010)
) AS v(email, commitment_cents, called_cents, uncalled_cents, distributions_cents, current_nav_cents, ownership_pct, units_held)
JOIN "fund_accredited_investors" inv ON inv.contact_email = v.email
WHERE NOT EXISTS (
  SELECT 1 FROM "fund_lp_capital_accounts" lca WHERE lca.lp_id = inv.id
);
--> statement-breakpoint

INSERT INTO "fund_nav_records"
  ("nav_date", "total_nav_cents", "called_capital_cents", "uncalled_commitments_cents", "distributed_cents", "unrealized_value_cents", "gross_irr", "net_irr", "tvpi", "dpi", "rvpi", "metadata")
VALUES
  ('2025-03-31', 353640000, 260400000, 139600000,         0, 353640000, 22.1, 18.4, 1.48, 0.18, 1.30, '{"is_demo":true,"period":"Q1 2025","nav_per_unit":1.040}'::jsonb),
  ('2025-06-30', 390370000, 260400000, 139600000,  10200000, 380170000, 25.2, 21.3, 1.66, 0.30, 1.36, '{"is_demo":true,"period":"Q2 2025","nav_per_unit":1.148}'::jsonb),
  ('2025-09-30', 421300000, 260400000, 139600000,  15300000, 406000000, 27.7, 24.1, 1.82, 0.41, 1.41, '{"is_demo":true,"period":"Q3 2025","nav_per_unit":1.239}'::jsonb),
  ('2025-12-31', 448510000, 260400000, 139600000,  17850000, 430660000, 30.3, 26.8, 1.98, 0.52, 1.46, '{"is_demo":true,"period":"Q4 2025","nav_per_unit":1.319}'::jsonb),
  ('2026-03-31', 476740000, 260400000, 139600000,  22950000, 453790000, 31.9, 28.4, 2.10, 0.62, 1.48, '{"is_demo":true,"period":"Q1 2026","nav_per_unit":1.402}'::jsonb)
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO "fund_lp_reports"
  ("report_type", "reporting_period", "period_start", "period_end", "status", "net_irr", "tvpi", "dpi", "fund_nav", "metadata")
VALUES
  ('quarterly', 'Q1 2026', '2026-01-01', '2026-03-31', 'distributed', 28.4, 2.10, 0.62, 4767400.00, '{"is_demo":true,"size_label":"3.6 MB","nav_per_unit":1.402}'::jsonb),
  ('quarterly', 'Q4 2025', '2025-10-01', '2025-12-31', 'distributed', 26.8, 1.98, 0.52, 4485100.00, '{"is_demo":true,"size_label":"3.4 MB","nav_per_unit":1.319}'::jsonb),
  ('quarterly', 'Q3 2025', '2025-07-01', '2025-09-30', 'distributed', 24.1, 1.82, 0.41, 4213000.00, '{"is_demo":true,"size_label":"3.2 MB","nav_per_unit":1.239}'::jsonb),
  ('quarterly', 'Q2 2025', '2025-04-01', '2025-06-30', 'distributed', 21.3, 1.66, 0.30, 3903700.00, '{"is_demo":true,"size_label":"3.0 MB","nav_per_unit":1.148}'::jsonb),
  ('quarterly', 'Q1 2025', '2025-01-01', '2025-03-31', 'distributed', 18.4, 1.48, 0.18, 3536400.00, '{"is_demo":true,"size_label":"2.9 MB","nav_per_unit":1.040}'::jsonb)
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO "fund_lp_data_room_docs"
  ("name", "folder", "file_type", "size_label", "uploaded_at", "permission_tier", "watermarked", "is_demo")
VALUES
  ('SZL Fund II — Investment Memorandum.pdf', 'Fund Overview', 'pdf', '4.2 MB', 'Apr 12, 2026', 'all_lp', true, true),
  ('Fund II Pitch Deck — LP Edition.pptx', 'Fund Overview', 'pptx', '12.8 MB', 'Apr 10, 2026', 'all_lp', true, true),
  ('Team Biographies & Track Record.pdf', 'Fund Overview', 'pdf', '2.1 MB', 'Mar 28, 2026', 'all_lp', false, true),
  ('Investment Committee Charter.pdf', 'Fund Overview', 'pdf', '0.8 MB', 'Mar 1, 2026', 'qualified_lp', false, true),
  ('Fund II — Q1 2026 Financial Statements.pdf', 'Financial Statements', 'pdf', '3.6 MB', 'Apr 14, 2026', 'qualified_lp', true, true),
  ('2025 Audited Financial Statements.pdf', 'Financial Statements', 'pdf', '5.1 MB', 'Mar 15, 2026', 'qualified_lp', true, true),
  ('NAV Methodology & Valuation Policy.pdf', 'Financial Statements', 'pdf', '1.2 MB', 'Jan 10, 2026', 'qualified_lp', false, true),
  ('Vessels — Q1 2026 Board Update.pdf', 'Portfolio Updates', 'pdf', '2.8 MB', 'Apr 13, 2026', 'all_lp', true, true),
  ('Aegis — Q1 2026 Operational Report.pdf', 'Portfolio Updates', 'pdf', '3.2 MB', 'Apr 11, 2026', 'all_lp', true, true),
  ('Terra — Q1 2026 KPI Dashboard.xlsx', 'Portfolio Updates', 'xlsx', '1.4 MB', 'Apr 10, 2026', 'all_lp', true, true),
  ('Lyte — Q1 2026 Product Roadmap Update.pptx', 'Portfolio Updates', 'pptx', '6.4 MB', 'Apr 9, 2026', 'all_lp', false, true),
  ('SZL Fund II — 2025 ESG Annual Report.pdf', 'ESG & Impact', 'pdf', '4.1 MB', 'Apr 1, 2026', 'all_lp', false, true),
  ('Portfolio DEI Metrics — 2025.xlsx', 'ESG & Impact', 'xlsx', '1.6 MB', 'Mar 28, 2026', 'all_lp', false, true),
  ('Limited Partnership Agreement — Fund II.pdf', 'Legal & Compliance', 'pdf', '8.2 MB', 'Jan 15, 2026', 'gp_only', false, true)
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO "fund_lp_messages" ("lp_id", "from_role", "author_name", "body", "is_demo", "sent_at")
SELECT inv.id, m.from_role, m.author, m.body, true, m.sent_at::timestamp
FROM (VALUES
  ('j.harrow@meridiancap.com', 'lp', 'Meridian Capital', 'Could you share more color on the Aegis-Vessels maritime cyber bundle pipeline for Q2?', '2026-04-11 14:33:00'),
  ('j.harrow@meridiancap.com', 'gp', 'SZL GP Team', 'Absolutely — pipeline currently sits at $15.6M with 4 enterprise opportunities in late-stage diligence. We''ll include a deep-dive in the Q1 letter shipping next week.', '2026-04-11 17:08:00')
) AS m(email, from_role, author, body, sent_at)
JOIN "fund_accredited_investors" inv ON inv.contact_email = m.email
WHERE NOT EXISTS (
  SELECT 1 FROM "fund_lp_messages" lm WHERE lm.lp_id = inv.id AND lm.body = m.body
);
--> statement-breakpoint

INSERT INTO "fund_lp_activity_events" ("lp_id", "action", "target", "is_demo", "occurred_at")
SELECT inv.id, e.action, e.target, true, e.occurred_at::timestamp
FROM (VALUES
  ('j.harrow@meridiancap.com', 'downloaded', 'Fund II — Q1 2026 Financial Statements.pdf', '2026-04-17 08:00:00'),
  ('j.harrow@meridiancap.com', 'viewed',     'SZL Fund II — Investment Memorandum.pdf',    '2026-04-16 16:18:00'),
  ('j.harrow@meridiancap.com', 'downloaded', 'Q1 2026 LP Report.pdf',                       '2026-04-14 10:02:00'),
  ('j.harrow@meridiancap.com', 'viewed',     'Vessels — Q1 2026 Board Update.pdf',          '2026-04-13 09:41:00'),
  ('j.harrow@meridiancap.com', 'messaged_gp','Question on Aegis cyber bundle traction',     '2026-04-11 14:33:00')
) AS e(email, action, target, occurred_at)
JOIN "fund_accredited_investors" inv ON inv.contact_email = e.email
WHERE NOT EXISTS (
  SELECT 1 FROM "fund_lp_activity_events" la WHERE la.lp_id = inv.id AND la.target = e.target AND la.action = e.action
);
