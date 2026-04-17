# Prism Counsel — Proof Chain Specification

> **DEPRECATED:** PRISM Counsel has been retired and consolidated into the Aegis legal workspace. Proof chain capabilities are now part of Aegis. This document is preserved for historical reference only.

**Version:** 1.0  
**Date:** April 2026  
**Scope:** Engineering + legal product reference

---

## What Is the Proof Chain?

The Proof Chain is Prism Counsel's mechanism for anchoring every AI output to a verifiable, auditable record. Every piece of AI-generated content — extracted text, classifications, analysis, recommendations, drafts — is assigned a Proof Chain entry that records:

- **What** was generated (content + SHA-256 hash)
- **From what** (source references, documents, prior outputs)
- **By which model** (provider, model version, lane)
- **With what confidence** (extraction confidence, source coverage)
- **Under what privilege state** (attorney-client, work product, none)
- **At what review state** (pending, reviewed, approved, rejected)
- **Whether it is export-safe** (only after attorney approval)

The Proof Chain is not a blockchain or cryptographic ledger — it is a structured, append-only database record system that enables trust verification, review accountability, and export safety enforcement.

---

## Proof Chain Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  AI OUTPUT GENERATION                                            │
│                                                                  │
│  Document extracted  → extraction lane → confidence score       │
│  Copilot answer      → reasoning lane → source references       │
│  Classification      → classification lane → label + confidence │
│  Chronology draft    → reasoning lane → source citations        │
│  Demand section      → reasoning lane → damages + medical refs  │
└──────────────────────┬───────────────────────────────────────────┘
                       │ every output calls proofChain.record()
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  PROOF CHAIN ENTRY                                               │
│                                                                  │
│  outputHash (SHA-256)     ← integrity anchor                    │
│  sourceReferences[]       ← what this was derived from          │
│  modelLane + provider     ← routing record                      │
│  modelVersion             ← version accountability              │
│  extractionConfidence     ← quality signal                      │
│  privilegeState           ← access control                      │
│  reviewState              ← workflow position                   │
│  approvalState            ← sign-off record                     │
│  exportSafe               ← gate for export pipeline            │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  REVIEW WORKFLOW                                                 │
│                                                                  │
│  pending_review → assigned reviewer notified                    │
│  reviewed       → routed to signoff queue                       │
│  approved       → exportSafe = true, can be included in export  │
│  needs_revision → returned to author with notes                 │
│  archived       → retained but excluded from active exports     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Proof Chain Entry Schema

```typescript
interface ProofChainEntry {
  id: number;                     // Auto-increment primary key
  orgId: number;                  // Tenant isolation
  matterId?: number;              // Associated matter (if applicable)
  
  // Output identity
  outputType: OutputType;
  outputContent: string;          // The actual generated content
  outputHash: string;             // SHA-256(outputContent) — immutable once set
  
  // Source provenance
  sourceReferences: SourceRef[];  // What inputs were used
  sourceClass?: string;           // High-level source category
  
  // Model accountability
  extractionConfidence?: number;  // 0.0-1.0
  modelLane?: string;             // embedding | retrieval | classification | extraction | reasoning | forecast | policy_guardrail
  modelProvider?: string;         // openai | huggingface | azure | internal
  modelVersion?: string;          // Specific model name/version string
  
  // Actor record
  actorType: "system" | "user" | "service";
  actorId?: number;               // User ID if human-initiated
  
  // Review and approval
  reviewState: ReviewState;       // pending_review | reviewed | approved | needs_revision | archived
  reviewedBy?: number;
  reviewedAt?: Date;
  approvalState: ApprovalState;   // none | pending | approved | rejected
  approvedBy?: number;
  approvedAt?: Date;
  
  // Access control
  privilegeState: PrivilegeState; // none | attorney_client | work_product | both
  exportSafe: boolean;            // Only true after approvalState=approved
  
  // Timestamps
  generationTimestamp: Date;
  createdAt: Date;
}

type OutputType = 
  | "document_extracted"
  | "copilot_answer"
  | "classification"
  | "chronology_draft"
  | "demand_section"
  | "review_memo"
  | "export_packet";

type ReviewState = "pending_review" | "reviewed" | "approved" | "needs_revision" | "archived";
type ApprovalState = "none" | "pending" | "approved" | "rejected";
type PrivilegeState = "none" | "attorney_client" | "work_product" | "both";
```

---

## Source Reference Structure

Source references record what inputs were used to produce an output:

```typescript
interface SourceRef {
  type: "document" | "communication" | "pressure_score" | "forecast" | "worldline_signal" | "prior_proof_chain_entry";
  id: string | number;          // DB record ID or document hash
  label: string;                // Human-readable source label
  extractionConfidence?: number;
  dateRange?: { from: Date; to: Date };
  relevanceScore?: number;      // How relevant this source was to the output
  quote?: string;               // Exact text cited from source (if applicable)
}
```

**Example source references for a chronology draft:**
```json
[
  {
    "type": "document",
    "id": 42,
    "label": "Ambulance report 2025-03-15",
    "extractionConfidence": 0.92,
    "quote": "Patient transported from scene at 14:32"
  },
  {
    "type": "document",
    "id": 51,
    "label": "ER discharge summary 2025-03-15",
    "extractionConfidence": 0.88,
    "quote": "Admitted with C3-C5 cervical strain"
  },
  {
    "type": "communication",
    "id": 7,
    "label": "Adjuster email 2025-04-02",
    "quote": "We are reviewing your client's medical records"
  }
]
```

---

## Retrieval Abstraction

The Proof Chain is integrated with the retrieval system. When a retrieval result is used as input to a reasoning call, the retrieved documents are included in `sourceReferences` on the resulting Proof Chain entry. This enables full traceability:

```
User asks: "What is missing before mediation?"
    ↓
Retrieval: fetches related proof chain entries and documents for this matter
    ↓
Reasoning: GPT-4o processes context + retrieved content
    ↓
Proof Chain entry created:
    outputType: copilot_answer
    sourceReferences: [
        { type: "proof_chain_entry", id: 18, label: "Medical records extraction" },
        { type: "proof_chain_entry", id: 22, label: "Demand letter draft" },
        { type: "pressure_score", id: "evidence", label: "Evidence pressure 0.72" }
    ]
    modelLane: reasoning
    modelProvider: openai
    modelVersion: gpt-4o-2024-11-20
    extractionConfidence: 0.81
```

---

## Matter Context Builder

When assembling context for a reasoning call, the Matter Context Builder pulls from the Proof Chain to include:

1. **Approved exports** — Prior work that has been reviewed and approved
2. **Pending reviews** — Work that exists but hasn't been approved (shown as context, flagged as unverified)
3. **Source coverage** — Which documents and communications have been processed
4. **Evidence gaps** — Identified missing source materials

The context assembly does not include rejected or archived entries in reasoning context unless explicitly requested by an operator.

---

## Source Map

The Source Map is a per-matter view of which source materials have been processed and their coverage status:

```typescript
interface SourceMap {
  matterId: number;
  totalDocuments: number;
  processedDocuments: number;       // extraction completed
  highConfidenceDocuments: number;  // confidence >= 0.80
  lowConfidenceDocuments: number;   // confidence < 0.60 — needs review
  proofChainCoverage: number;       // % of documents with proof chain entries
  reviewBacklog: number;            // entries pending review
  approvedForExport: number;        // entries with exportSafe=true
  privilegedMaterials: number;      // entries with non-"none" privilegeState
  lastUpdated: Date;
}
```

---

## Contradiction Detector

The reasoning lane is instructed to flag contradictions as part of document and chronology analysis. Contradictions are stored as flagged outputs in the Proof Chain with:

```typescript
interface ContradictionFlag {
  proofChainEntryId: number;
  description: string;
  sourceA: SourceRef;    // First source making a claim
  sourceB: SourceRef;    // Second source with conflicting claim
  severity: "critical" | "moderate" | "minor";
  reviewState: ReviewState;
}
```

Contradictions are surfaced in:
- The Matter Twin's `openQuestions.flaggedContradictions` field
- The Copilot `document` mode when analyzing documents
- The Review Queue when generating any external-facing document draft

---

## Confidence Presentation

Confidence is surfaced at multiple levels:

| Level | What it represents |
|-------|-------------------|
| Entry-level `extractionConfidence` | Quality of the AI extraction or generation |
| Source `relevanceScore` | How relevant a cited source was to the output |
| Matter-level `healthScore` | Overall matter readiness (0-100) derived from pressure dimensions |
| Forecast-level `confidence` | How confident the forecast model is in its score |
| Copilot response confidence | Stated in response footer: `*Confidence: 0.81*` |

**Presentation rules:**
- Confidence is always shown alongside AI-generated content in the UI
- Confidence below 0.60 triggers a visible warning indicator
- "High confidence" (>= 0.80) does not suppress the review requirement — it is informational only
- Confidence scores are NOT shown as percentage certainty to end users; they are shown as relative signals

---

## Integrity Verification

The `outputHash` field enables integrity verification of any Proof Chain entry at any future time:

```typescript
async function verifyIntegrity(proofChainId: number): Promise<VerificationResult> {
  const entry = await getEntry(proofChainId);
  const currentHash = sha256(entry.outputContent);
  const hashValid = currentHash === entry.outputHash;
  
  return {
    valid: hashValid,
    details: {
      hashMatch: hashValid,
      hasSourceReferences: entry.sourceReferences.length > 0,
      reviewState: entry.reviewState,
      approvalState: entry.approvalState,
      exportSafe: entry.exportSafe,
      privilegeState: entry.privilegeState,
    }
  };
}
```

If `hashMatch` is false, the content has been modified after generation. This is an integrity violation and should be treated as a data corruption incident.

---

## Audit Packet Generation

The Proof Chain service can generate an audit packet for any matter:

```typescript
interface AuditPacket {
  matterId: number;
  totalEntries: number;
  byType: Record<OutputType, number>;
  reviewStates: Record<ReviewState, number>;
  approvalStates: Record<ApprovalState, number>;
  exportSafeCount: number;
  modelLanesUsed: string[];
  providersUsed: string[];
  generatedAt: string;
}
```

Audit packets are used for:
- Internal matter review sessions
- Demonstrating AI governance compliance to clients or oversight bodies
- Identifying review backlogs before trial or mediation prep

---

## Export Safety Gate

The export pipeline enforces Proof Chain approval before any content is included in an exported document:

```
Export request received
    ↓
Identify all proof chain entries to be included
    ↓
For each entry: check exportSafe flag
    ↓
If any entry exportSafe=false:
    → Export blocked
    → User shown list of entries requiring approval
    → Approval workflow triggered for blocked entries
    ↓
If all entries exportSafe=true:
    → Export proceeds
    → Export event logged in audit trail
    → ProofChainEntry created for the export packet itself
```

This gate is enforced at the API level — it cannot be bypassed through the UI.

---

*See also:*
- *[Matter Twin Specification](prism-counsel-matter-twin-spec.md)*
- *[Alloy Control Plane Architecture](prism-counsel-alloy-control-plane.md)*
- *[Model Routing Strategy](prism-counsel-model-routing.md)*
- *[Trust Center](../trust/prism-counsel-trust-center.md)*
