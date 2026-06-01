# AGENTS — artifacts/carlota-jo

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the Carlota Jo advisory artifact.

## What This Is

Carlota Jo is the advisory and client portal domain pack. It surfaces brand, strategy, and operations advisory engagements with a client-facing booking and delivery interface. All client-facing content passes through the same Proof Chain and Covenant Policy governance as every other domain.

## Domain Vocabulary

| Canonical term | Do not use |
|---------------|-----------|
| Engagement | Project, assignment |
| Advisor | Consultant (Carlota Jo is an advisor, not a consulting firm) |
| Client | Customer |
| Booking | Appointment, meeting |
| Deliverable | Output, report |

## Critical Rules

- **Client-facing content must pass export safety before delivery.** Use `assertExportSafe()` from `lib/proof-chain` before generating any client document or communication. The `client_communication_review` policy template applies here.
- **Never surface internal governance metadata directly to clients.** The client portal view must not show proof chain IDs, policy evaluation results, or internal confidence scores — only the governed output.
- Do not add new engagement types without updating `EngagementEntity` in `@workspace/ontology`.

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/` | Route pages |
| `src/pages/DecisionCenter.tsx` | Governance surface (operator view) |
| `src/pages/ClientPortal.tsx` | Client-facing portal |
