-- Migration: Add tenant_id column and index to rag_knowledge_chunks
-- Applied via: drizzle-kit push (db:push)
-- Verified applied: psql confirmed tenant_id TEXT + rag_chunks_tenant_id_idx present
--
-- Purpose: Enable DB-level tenant isolation for RAG retrieval paths.
-- All semantic/keyword/hybrid search queries now include WHERE tenant_id = $N
-- with no IS NULL fallback (fail-closed). Callers that omit tenantId receive
-- an empty result set rather than cross-tenant data.
--
-- To apply on a fresh environment: run `pnpm --filter @szl-holdings/db run push`

ALTER TABLE rag_knowledge_chunks
  ADD COLUMN IF NOT EXISTS tenant_id TEXT;

CREATE INDEX IF NOT EXISTS rag_chunks_tenant_id_idx
  ON rag_knowledge_chunks (tenant_id);
