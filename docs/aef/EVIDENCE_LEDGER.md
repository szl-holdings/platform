# AEF Evidence Ledger

The evidence ledger is the authoritative audit record for every retrieval operation executed through the Alloy Embedding Fabric. It records what was asked, what was found, what scores were assigned, which policies applied, and which profile was active at the time.

## Why an Evidence Ledger

SZL's governance doctrine holds that every AI-assisted decision must be traceable to its inputs. For retrieval-augmented systems, this means it must be possible to reconstruct — at any future point — the exact set of documents that influenced an agent's output on a specific request.

The evidence ledger satisfies this requirement. It is not a log of system events. It is a structured, queryable archive of retrieval evidence that can be produced in an audit review, submitted as supporting material in a legal matter, or used to investigate why an AI agent reached a particular conclusion.

## Data Model

Each ledger entry records the following:

```typescript
interface EvidenceLedgerEntry {
  entryId: string;            // Unique ledger entry ID
  requestId: string;          // Correlates to the API request
  tenantId: string;           // Tenant that made the retrieval request
  profileId: string;          // Domain profile used
  profileVersion: string;     // Exact version of the profile
  query: string;              // The original query text
  queryEncoded?: boolean;     // Whether the query was encoded via prompt template
  retrievedAt: string;        // ISO 8601 timestamp
  chunksConsidered: ChunkRecord[];   // All chunks evaluated
  chunksReturned: ChunkRecord[];     // Chunks included in the response
  boostRulesApplied: string[];       // Boost rule IDs that fired
  policyDecision: PolicyDecisionRecord;
  metadataFiltersApplied: Record<string, unknown>;
  processingMs: number;
  sequenceNumber: number;     // Monotonic within tenant
  previousEntryHash?: string; // Hash of the prior entry (tamper-evident chain)
}

interface ChunkRecord {
  chunkId: string;
  sourceRef: string;
  denseScore?: number;
  keywordScore?: number;
  fusedScore: number;
  boostedScore?: number;
  rerankScore?: number;
  finalScore: number;
  included: boolean;
  exclusionReason?: string;
}
```

## Adapters

The ledger ships two adapters:

### In-Memory Adapter

Used in development and test environments. Holds entries in process memory — data does not survive restarts. Suitable for local development and CI smoke tests.

```typescript
import { createInMemoryLedger } from "@workspace/aef-evidence-ledger/store";
const ledger = createInMemoryLedger();
```

### JSONL Filesystem Adapter

Appends each entry as a newline-delimited JSON record to a rotating log file. Suitable for Replit Reserved VM deployments where the filesystem persists across restarts.

```typescript
import { createFsLedger } from "@workspace/aef-evidence-ledger/fs-store";
const ledger = createFsLedger({ dir: "./data/aef-evidence/", rotateEveryMb: 100 });
```

## Querying the Ledger

The `@workspace/aef-evidence-ledger/query` export provides a simple query interface:

```typescript
import { queryLedger } from "@workspace/aef-evidence-ledger/query";

// Retrieve all entries for a specific request
const entries = await queryLedger(ledger, {
  requestId: "req-abc123",
  tenantId: "szl-tenant-prod",
});

// Retrieve entries for a domain over a time window
const domainEntries = await queryLedger(ledger, {
  tenantId: "szl-tenant-prod",
  profileId: "prism_legal_matter",
  after: "2024-06-01T00:00:00Z",
  before: "2024-07-01T00:00:00Z",
});
```

## Integrity Verification

The ledger's tamper-evident chain can be verified by replaying entries in sequence order and confirming that each entry's `previousEntryHash` matches the SHA-256 hash of the prior entry's serialised content.

```bash
pnpm tsx scripts/verify-evidence-chain.ts --tenantId szl-tenant-prod
```

## Retention and Deletion

Evidence ledger entries are subject to per-profile retention rules. The `evidenceRetentionDays` value in each profile's `retentionRules` determines how long entries are available for query. After this period, entries are archived (moved to cold storage) rather than deleted.

**Exception**: if a profile's `deletionRequired` flag is true, content fields (query text, chunk text, source references) are purged from expired entries. The structural envelope (entryId, tenantId, profileId, version, timestamp, sequence number, and entry hash) is retained as part of the audit trail for the period defined by `auditTrailRetentionDays`.

## Evidence in Legal and Audit Contexts

When a retrieval evidence report is required for legal or audit purposes, export the relevant entries using the query interface and present the chain of `entryId` → `previousEntryHash` relationships. This chain demonstrates that the records have not been modified since they were written.

For Counsel matters, evidence ledger exports can be included as exhibits in discovery production under the e-discovery protocol agreed with opposing counsel.

## Evidence Ledger and the Proof Chain

AEF's evidence ledger is one component of SZL's broader proof chain architecture. The proof chain records the full lifecycle of a governed decision: the retrieval evidence, the agent's reasoning, the human approval (if required), and the final outcome. The `proofId` field on `BriefEntity` objects and similar domain entities links back to the relevant proof chain record.
