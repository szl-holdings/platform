# @workspace/aef-domain-profiles

Versioned domain profile registry for the Alloy Embedding Fabric. Each profile controls how embedding, retrieval, reranking, chunking, and retention behaves for a specific vertical.

## Included Profiles

| Profile ID | Vertical | Domain |
|---|---|---|
| `vessels_maritime_risk` | Vessels Maritime Intelligence | maritime |
| `lyte_governance_ops` | Lyte Decision Intelligence | compliance |
| `terra_real_estate_intel` | Terra Real Estate Intelligence | real-estate |
| `aegis_security_incident` | Aegis Cyber/Security | cyber |
| `prism_legal_matter` | PRISM Counsel | legal |
| `carlota_private_advisory` | Carlota Jo Consulting | advisory |

## Usage

```typescript
import { createDefaultProfileRegistry } from "@workspace/aef-domain-profiles";

const registry = createDefaultProfileRegistry();
const profile = registry.resolve("vessels_maritime_risk");

// Staged rollout — activate v2.0.0 for specific tenants only
registry.stageForTenants("vessels_maritime_risk", "2.0.0", ["tenant-abc"]);

// Rollback to previous version
const previousVersion = registry.rollback("vessels_maritime_risk");
```

## Authoring a New Profile

```typescript
import { DomainProfileSchema } from "@workspace/aef-domain-profiles";

const myProfile = DomainProfileSchema.parse({
  profileId: "my_new_domain",
  version: "1.0.0",
  domain: "compliance",
  displayName: "My New Domain",
  description: "Custom domain profile",
  priorityTerms: ["important-term", "key-phrase"],
  boostTerms: [{ term: "exact-match-term", boost: 3.0, exactMatch: true }],
  exactMatchFieldClasses: ["contract_id", "policy_ref"],
  denseWeight: 0.65,
  keywordWeight: 0.35,
  maxResults: 10,
  maxCandidates: 150,
  truncationPolicy: { strategy: "truncate", maxTokens: 512 },
  retentionDays: 365,
  provenanceRequired: true,
  defaultMetadataFilters: {},
  rerankEnabled: true,
  metadata: {},
});
```
