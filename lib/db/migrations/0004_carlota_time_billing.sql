-- Migration: Carlota Jo time tracking & invoice persistence
-- Apply via: pnpm --filter @szl-holdings/db run push
-- Backfills the default seed data previously hard-coded in
-- artifacts/carlota-jo/src/data/operationalData.ts so existing demos keep
-- showing the same baseline content.

CREATE TABLE IF NOT EXISTS "carlota_time_entries" (
  "id"            TEXT PRIMARY KEY,
  "date"          TEXT NOT NULL,
  "engagement"    TEXT NOT NULL,
  "phase"         TEXT NOT NULL,
  "deliverable"   TEXT NOT NULL,
  "hours"         NUMERIC(6, 2) NOT NULL,
  "rate_type"     TEXT NOT NULL,
  "rate"          INTEGER NOT NULL DEFAULT 0,
  "description"   TEXT NOT NULL DEFAULT '',
  "billable"      BOOLEAN NOT NULL DEFAULT TRUE,
  "approved"      BOOLEAN NOT NULL DEFAULT FALSE,
  "invoice_id"    TEXT,
  "created_at"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "carlota_invoices" (
  "id"            TEXT PRIMARY KEY,
  "client"        TEXT NOT NULL,
  "engagement"    TEXT NOT NULL,
  "amount"        NUMERIC(12, 2) NOT NULL,
  "status"        TEXT NOT NULL DEFAULT 'draft',
  "due_date"      TEXT NOT NULL,
  "issued_date"   TEXT NOT NULL,
  "items"         INTEGER NOT NULL DEFAULT 0,
  "entry_ids"     JSONB NOT NULL DEFAULT '[]'::jsonb,
  "sent_at"       TIMESTAMP,
  "created_at"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Backfill default time entries
INSERT INTO "carlota_time_entries" (id, date, engagement, phase, deliverable, hours, rate_type, rate, description, billable, approved) VALUES
  ('t1', 'Apr 15, 2026', 'Luminary Brands', 'Strategy Development', 'Competitive positioning report', 3.5, 'premium', 350, 'Deep competitor analysis across 8 market players', TRUE, TRUE),
  ('t2', 'Apr 15, 2026', 'Vertex Capital', 'Discovery', 'Stakeholder interviews', 2.0, 'standard', 275, 'CTO and CFO interview sessions', TRUE, TRUE),
  ('t3', 'Apr 14, 2026', 'Luminary Brands', 'Strategy Development', 'Executive presentation', 4.0, 'premium', 350, 'Deck build for board-level strategy review', TRUE, FALSE),
  ('t4', 'Apr 14, 2026', 'Internal', 'Business Development', 'Proposal — Solaris Health', 2.5, 'non-billable', 0, 'Proposal development and pricing review', FALSE, TRUE),
  ('t5', 'Apr 13, 2026', 'Aurelius PE', 'Masterclass Series', 'Session 4 facilitation', 6.0, 'fixed', 4200, 'Full-day portfolio value creation masterclass', TRUE, TRUE),
  ('t6', 'Apr 12, 2026', 'Vertex Capital', 'Discovery', 'Data room review', 3.0, 'standard', 275, 'Financial and operational data analysis', TRUE, TRUE),
  ('t7', 'Apr 11, 2026', 'Luminary Brands', 'Roadmap', '90-day action plan', 2.5, 'premium', 350, 'KPI framework and implementation timeline', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Backfill default invoices
INSERT INTO "carlota_invoices" (id, client, engagement, amount, status, due_date, issued_date, items, entry_ids) VALUES
  ('INV-2026-009', 'Aurelius Private Equity', 'Portfolio Strategy Masterclass', 16800, 'paid', 'Apr 7, 2026', 'Mar 24, 2026', 4, '[]'::jsonb),
  ('INV-2026-010', 'Luminary Brands', 'Growth Strategy Phase 2', 14875, 'sent', 'Apr 22, 2026', 'Apr 8, 2026', 12, '[]'::jsonb),
  ('INV-2026-011', 'Vertex Capital Partners', 'M&A Advisory Discovery', 8250, 'draft', 'Apr 30, 2026', 'Apr 15, 2026', 6, '[]'::jsonb),
  ('INV-2026-008', 'Oasis Wellness', 'Digital Strategy Q1', 6200, 'overdue', 'Mar 31, 2026', 'Mar 15, 2026', 8, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;
