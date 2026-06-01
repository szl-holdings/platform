-- AEF pgvector chunk store for the shipping /v1/hybrid-search route.
--
-- One row per chunk holds the text, its bge-m3 embedding (1024-dim), and the
-- metadata the route returns. The dense arm uses cosine ANN over `embedding`;
-- the keyword arm uses Postgres full-text search over `text`. Both arms are
-- tenant-scoped (fail-closed: no tenant => no rows).
--
-- Dimension note: `vector(1024)` must match the embedder (HF_EMBED_MODEL /
-- VECTOR_DIM). If you change the model dimension, change this column to match
-- and re-ingest.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS aef_rag_chunks (
  chunk_id    TEXT PRIMARY KEY,
  source_id   TEXT NOT NULL,
  tenant_id   TEXT NOT NULL,
  profile_id  TEXT,
  model       TEXT NOT NULL,
  dimensions  INTEGER NOT NULL,
  embedding   vector(1024),
  text        TEXT NOT NULL DEFAULT '',
  title       TEXT,
  page        INTEGER,
  section     TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  indexed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant scoping is on every query; index it.
CREATE INDEX IF NOT EXISTS aef_rag_chunks_tenant_idx
  ON aef_rag_chunks (tenant_id);

-- Dense ANN index (cosine). Tune `lists` to dataset size.
CREATE INDEX IF NOT EXISTS aef_rag_chunks_embedding_cos_idx
  ON aef_rag_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Keyword FTS index over the chunk text.
CREATE INDEX IF NOT EXISTS aef_rag_chunks_text_fts_idx
  ON aef_rag_chunks
  USING gin (to_tsvector('english', text));
