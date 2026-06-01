-- Migration 0070: Drop duplicate unique indexes
-- azure_tenants.azure_tenant_id has both a column-level UNIQUE constraint
-- (auto-named azure_tenants_azure_tenant_id_key) AND a named uniqueIndex
-- (azure_tenants_tenant_id_idx). The named index is redundant.
--
-- scim_tokens.token_hash has both a column-level UNIQUE constraint and a
-- named uniqueIndex (scim_tokens_hash_idx). The named index is redundant.
--
-- Both DROP statements are IF EXISTS — safe to re-run.

--> statement-breakpoint
DROP INDEX IF EXISTS azure_tenants_tenant_id_idx;
--> statement-breakpoint
DROP INDEX IF EXISTS scim_tokens_hash_idx;
