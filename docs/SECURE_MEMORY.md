# SZL Holdings — Secure Memory

## Overview

Memory in the governed decision operating system is not a convenience feature — it is a governed subsystem with tenant boundaries, sensitivity tiers, approval requirements, and poisoning defenses.

## Memory Classification

| Class | Scope | Retention | Governance |
|-------|-------|-----------|-----------|
| Ephemeral Session | Single request/session | Session duration | Minimal — auto-cleared on session end |
| Workflow Memory | Single decision workflow | Workflow completion + retention period | Proof chain recorded, replay-visible |
| Entity Memory | Persistent per entity | Indefinite with TTL review | Tenant-scoped, sensitivity-tiered |
| Approved Canonical | Platform-wide reference | Indefinite | Requires explicit approval to write or modify |

## Security Model

### Tenant Boundaries
- All memory operations are scoped to the requesting tenant's organization
- Cross-tenant memory access is explicitly denied
- Memory queries inherit the caller's RBAC permissions

### Sensitivity Tiers

| Tier | Examples | Access Requirements |
|------|----------|-------------------|
| Public | Product descriptions, public entity data | Any authenticated user |
| Internal | Analysis results, recommendation history | Member role + tenant scope |
| Confidential | Financial data, legal matter details | Admin role + domain authorization |
| Restricted | Security incidents, personnel data | Super admin + explicit grant |

### Write Governance
- Ephemeral and workflow memory: write freely within scope
- Entity memory: requires authenticated session + tenant scope
- Approved canonical memory: requires explicit approval gate
- All writes are logged with actor identity, timestamp, and source

### Poisoning Defenses

| Defense | Description |
|---------|------------|
| Source tagging | Every memory entry carries its origin (model, human, extraction, system) |
| Confidence scoring | AI-generated memory entries carry confidence scores |
| Contradiction detection | New entries are checked against existing canonical memory |
| Write audit trail | Full provenance chain for every memory modification |
| TTL enforcement | Stale memory entries are flagged for review |

### Context Manipulation Detection
- Memory retrieval patterns are monitored for anomalies
- Unusually high retrieval rates trigger investigation
- Memory injection attempts (via prompt manipulation) are logged and blocked

## Replay Visibility

All memory operations within a decision workflow are captured in the Trace Graph:
- What memory was read (with content hash)
- What memory was written (with content hash)
- How memory influenced the decision
- Which model/tool performed the memory operation

This ensures that decision replay includes the full memory context, enabling auditors to verify that the decision was made with the correct information.

## Implementation

| Component | Location |
|-----------|----------|
| Memory scoping | Tenant middleware (`tenant-scope.ts`) |
| Entity memory | Domain-specific schema tables |
| Workflow memory | Decision Fabric correlation context |
| Skill memory | `packages/skill-library` |
| Proof chain integration | `lib/proof-chain` |
