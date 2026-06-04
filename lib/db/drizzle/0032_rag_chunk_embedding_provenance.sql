-- Migration 0023: Add embedding model provenance to rag_knowledge_chunks
-- Enables model-change re-embedding detection (scheduleReembeddingOnModelChange)
-- to identify stale chunks whose embedding was produced by an older model.

ALTER TABLE rag_knowledge_chunks
  ADD COLUMN IF NOT EXISTS embedding_model text,
  ADD COLUMN IF NOT EXISTS embedding_at timestamptz;

CREATE INDEX IF NOT EXISTS rag_chunks_embedding_model_idx
  ON rag_knowledge_chunks (embedding_model)
  WHERE embedding_model IS NOT NULL;
