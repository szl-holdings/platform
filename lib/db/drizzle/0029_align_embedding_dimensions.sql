-- ─── Align all vector embeddings to 1024 dimensions (BAAI/bge-m3 default) ────
--
-- rag_knowledge_chunks.embedding was vector(1536); changing to vector(1024)
-- to match the default HF embedding model (BGE-M3, 1024 dims).
-- Existing 1536-dim embeddings are incompatible and are set to NULL
-- so rows will be re-queued for re-embedding automatically.

-- Drop the existing HNSW index (created in 0017) before changing the column type
DROP INDEX IF EXISTS rag_chunks_embedding_hnsw_idx;

-- Nullify any existing embeddings with the wrong dimension
-- (prevents "vector dimension mismatch" errors after ALTER)
UPDATE rag_knowledge_chunks SET embedding = NULL WHERE embedding IS NOT NULL;

-- Change the column type from vector(1536) to vector(1024)
ALTER TABLE rag_knowledge_chunks
  ALTER COLUMN embedding TYPE vector(1024)
  USING NULL;

-- Recreate the ANN index with the correct dimension
CREATE INDEX IF NOT EXISTS rag_chunks_embedding_hnsw_idx
  ON rag_knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- Also update the IVFFlat index on kg_entities in case the migration
-- runs after migration 0019 was applied with vector(1536) instead of vector(1024).
-- (Safe to run even if column is already vector(1024).)
DROP INDEX IF EXISTS kg_entities_embedding_idx;
UPDATE kg_entities SET embedding = NULL, embedding_model = NULL WHERE embedding IS NOT NULL;
ALTER TABLE kg_entities ALTER COLUMN embedding TYPE vector(1024) USING NULL;
CREATE INDEX IF NOT EXISTS kg_entities_embedding_idx ON kg_entities
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);
