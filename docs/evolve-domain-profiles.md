# AEEP Domain Profile Model

## Principle

A domain profile scopes all retrieval, memory, workflow, and policy behavior to a specific
business domain. Profiles are versioned, have named index namespaces, and define the
set of agent roles and starter workflows relevant to that domain.

---

## 6 Domain Profiles

| Profile ID | Display Name | Default Policy Tier | Primary Workflows |
|---|---|---|---|
| `lyte` | Lyte | medium | investigate_signal, prepare_executive_brief, generate_operational_digest |
| `vessels` | Vessels | medium | ingest_source, investigate_signal, generate_operational_digest |
| `terra` | Terra | medium | ingest_source, review_property_risk, prepare_executive_brief |
| `aegis` | Aegis | high | prepare_executive_brief, investigate_signal, generate_operational_digest |
| `prism` | PRISM | high | compile_case_timeline, investigate_signal, ingest_source |
| `carlota` | Carlota | low | ingest_source, prepare_executive_brief, generate_operational_digest |

---

## Profile Structure

```typescript
DomainProfile {
  profileId: DomainProfileId
  displayName: string
  description: string
  version: string               // Semver — bumped on index schema changes
  accent: string                // Token reference for UI accent
  active: boolean
  defaultPolicyTier: PolicyTier
  primaryWorkflows: WorkflowId[]
  indexNamespaces: IndexNamespace[]
  memoryScopes: MemoryScope[]
  agentRoles: AgentRoleId[]
}
```

---

## IndexNamespace

Each profile defines one or more namespaces in the vector index:

```typescript
IndexNamespace {
  namespaceId: string
  description: string
  primaryEmbeddingModel: string   // e.g. "text-embedding-3-small"
  chunkSizeTokens: number
  chunkOverlapTokens: number
  refreshCronUtc?: string         // e.g. "0 */4 * * *"
}
```

---

## Profile Namespaces Summary

| Profile | Namespace | Chunk Size | Refresh |
|---|---|---|---|
| lyte | lyte-signals | 512 | Every 4h |
| lyte | lyte-briefs | 1024 | On demand |
| vessels | vessels-ais | 256 | Every 30m |
| vessels | vessels-ports | 512 | Daily |
| vessels | vessels-intelligence | 1024 | On demand |
| terra | terra-properties | 512 | Daily |
| terra | terra-market | 256 | Weekday mornings |
| terra | terra-zoning | 512 | On demand |
| aegis | aegis-portfolio | 512 | On demand |
| aegis | aegis-governance | 1024 | On demand |
| prism | prism-matters | 512 | On demand |
| prism | prism-precedent | 1024 | On demand |
| prism | prism-correspondence | 256 | On demand |
| carlota | carlota-engagements | 512 | On demand |
| carlota | carlota-knowledge | 1024 | On demand |

---

## Profile Version Rotation

When index schema changes require a full reindex:
1. Bump `version` in profile definition
2. Run `rotate_profile_version` workflow (policy tier: critical)
3. Approval required from operator + owner
4. Old namespace snapshotted, new namespace populated, health verified

---

## Profile Selection in Runs

Pass `profileId` when creating a WorkflowRun:

```typescript
const run = createWorkflowRun(STARTER_WORKFLOWS.investigate_signal, {
  profileId: "vessels",
  triggeredBy: "user:operator-1",
});
```

All retrieval queries and memory operations in that run are automatically scoped to
the profile's namespaces and memory scopes.
