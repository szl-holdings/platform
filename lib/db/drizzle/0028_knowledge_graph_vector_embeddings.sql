-- Knowledge Graph & Vector Embedding Infrastructure
-- Enables pgvector for semantic similarity search and graph traversal

-- Ensure pgvector extension is available
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Knowledge Graph Entities ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kg_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  domain TEXT NOT NULL,
  sub_domain TEXT,
  description TEXT,
  canonical_id TEXT,
  source_ids JSONB DEFAULT '[]',
  properties JSONB DEFAULT '{}',
  embedding vector(1024),
  embedding_model TEXT,
  embedding_at TIMESTAMPTZ,
  confidence REAL DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kg_entities_type_idx ON kg_entities (entity_type);
CREATE INDEX IF NOT EXISTS kg_entities_domain_idx ON kg_entities (domain);
CREATE INDEX IF NOT EXISTS kg_entities_canonical_idx ON kg_entities (canonical_id);
CREATE INDEX IF NOT EXISTS kg_entities_name_idx ON kg_entities (name);
CREATE INDEX IF NOT EXISTS kg_entities_active_idx ON kg_entities (is_active);
CREATE UNIQUE INDEX IF NOT EXISTS kg_entities_natural_key_idx ON kg_entities (name, entity_type, domain);

-- Vector index for ANN semantic search on entities
CREATE INDEX IF NOT EXISTS kg_entities_embedding_idx ON kg_entities
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- ─── Knowledge Graph Relationships ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kg_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  to_entity_id UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  strength REAL DEFAULT 1.0,
  confidence REAL DEFAULT 1.0,
  from_domain TEXT NOT NULL,
  to_domain TEXT NOT NULL,
  is_cross_domain BOOLEAN DEFAULT false,
  direction TEXT DEFAULT 'directed',
  properties JSONB DEFAULT '{}',
  evidence_ids JSONB DEFAULT '[]',
  detected_by TEXT,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kg_rel_unique UNIQUE (from_entity_id, to_entity_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS kg_rel_from_idx ON kg_relationships (from_entity_id);
CREATE INDEX IF NOT EXISTS kg_rel_to_idx ON kg_relationships (to_entity_id);
CREATE INDEX IF NOT EXISTS kg_rel_type_idx ON kg_relationships (relationship_type);
CREATE INDEX IF NOT EXISTS kg_rel_cross_domain_idx ON kg_relationships (is_cross_domain);
CREATE INDEX IF NOT EXISTS kg_rel_from_domain_idx ON kg_relationships (from_domain);
CREATE INDEX IF NOT EXISTS kg_rel_to_domain_idx ON kg_relationships (to_domain);

-- ─── Embedding Model Registry ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS embedding_model_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  dimensions INTEGER NOT NULL,
  max_input_tokens INTEGER DEFAULT 8192,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  api_endpoint TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS emb_model_provider_idx ON embedding_model_registry (provider);
CREATE INDEX IF NOT EXISTS emb_model_active_idx ON embedding_model_registry (is_active);

-- Seed default embedding models
INSERT INTO embedding_model_registry (model_id, provider, display_name, dimensions, is_default, is_active)
VALUES
  ('BAAI/bge-m3', 'huggingface', 'BGE-M3 (HuggingFace)', 1024, true, true),
  ('sentence-transformers/all-MiniLM-L6-v2', 'huggingface', 'all-MiniLM-L6-v2 (HuggingFace)', 384, false, true),
  ('text-embedding-3-small', 'openai', 'text-embedding-3-small (OpenAI)', 1536, false, true),
  ('text-embedding-3-large', 'openai', 'text-embedding-3-large (OpenAI)', 3072, false, true)
ON CONFLICT (model_id) DO NOTHING;

-- ─── Embedding Tasks Queue ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS embedding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_table TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_column TEXT DEFAULT 'embedding',
  content_column TEXT DEFAULT 'content',
  model_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 5,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT embedding_tasks_target_unique UNIQUE (target_table, target_id, target_column)
);

CREATE INDEX IF NOT EXISTS emb_tasks_status_idx ON embedding_tasks (status);
CREATE INDEX IF NOT EXISTS emb_tasks_table_idx ON embedding_tasks (target_table);
CREATE INDEX IF NOT EXISTS emb_tasks_scheduled_idx ON embedding_tasks (scheduled_at);

-- ─── Cross-Domain Link Events ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kg_cross_domain_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID REFERENCES kg_relationships(id) ON DELETE CASCADE,
  from_domain TEXT NOT NULL,
  to_domain TEXT NOT NULL,
  link_type TEXT NOT NULL,
  detected_by TEXT,
  trigger_event TEXT,
  trigger_entity_id TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS kg_xdomain_from_idx ON kg_cross_domain_links (from_domain);
CREATE INDEX IF NOT EXISTS kg_xdomain_to_idx ON kg_cross_domain_links (to_domain);
CREATE INDEX IF NOT EXISTS kg_xdomain_type_idx ON kg_cross_domain_links (link_type);

-- ─── Vector Index on RAG Knowledge Chunks ──────────────────────────────────────
-- The rag_knowledge_chunks table already exists; add an ANN vector index if not present

CREATE INDEX IF NOT EXISTS rag_chunks_embedding_idx ON rag_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
