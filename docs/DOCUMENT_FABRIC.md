# SZL Holdings — Document Fabric

## Overview

The Document Fabric is a governed document intelligence layer that parses, classifies, extracts, normalizes, and connects documents to entities, obligations, workflows, approvals, and evidence bundles.

Documents are not storage objects — they are decision inputs with governance requirements.

## Architecture

### Source Document Registry

Every document entering the platform is registered with:
- Document ID and content hash
- Classification (contract, report, disclosure, evidence, correspondence)
- Source system and ingestion timestamp
- Owning domain and tenant
- Retention policy and sensitivity tier

### Extraction Pipeline

```
DOCUMENT INGESTION
       ↓
┌─────────────────┐
│  Classification  │  Contract? Report? Disclosure? Evidence?
└────────┬────────┘
         ↓
┌─────────────────┐
│  Field Extraction│  Dates, parties, amounts, obligations, clauses
└────────┬────────┘
         ↓
┌─────────────────┐
│  Normalization   │  Standardize fields across document types
└────────┬────────┘
         ↓
┌─────────────────┐
│  Entity Linking  │  Connect extracted entities to the semantic entity layer
└────────┬────────┘
         ↓
┌─────────────────┐
│  Evidence Spans  │  Mark source text anchors for traceability
└────────┘────────┘
         ↓
     GOVERNED DOCUMENT ENTITY
```

### Normalized Fields

| Field Type | Examples | Domains |
|-----------|----------|---------|
| Dates | Deadlines, effective dates, expiry | Counsel, Terra |
| Parties | Counterparties, signatories, beneficiaries | All |
| Amounts | Contract value, penalty amounts, thresholds | All |
| Obligations | Performance requirements, delivery conditions | Counsel, Carlota Jo |
| Clauses | Force majeure, termination, indemnity | Counsel |
| Entities | Vessels, properties, incidents | Domain-specific |

### Evidence Spans

Every extracted field carries a source anchor:
- Document ID
- Page/section reference
- Character offset range
- Extraction confidence score
- Model/tool that performed extraction

This ensures that any downstream decision referencing a document field can trace back to the exact source text.

## Integration with Platform Primitives

| Primitive | Document Fabric Integration |
|-----------|---------------------------|
| Proof Chain | Document hash and extraction metadata recorded as evidence |
| Policy Engine | Document access governed by sensitivity tier and tenant scope |
| Decision Replay | Document references preserved in full trace for replay |
| Event Fabric | Document ingestion and extraction emit correlation events |
| Outcome Graph | Document-derived obligations linked to decision outcomes |

## Implementation

Current implementation in `lib/shared-ui/src/document-engine/`:
- `DocumentEnginePanel.tsx` — document viewing and management UI
- `templates.ts` — document generation templates
- Domain-specific extensions in Counsel and Terra domain packs
