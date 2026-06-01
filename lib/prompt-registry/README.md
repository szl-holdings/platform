# Prompt Registry

**Version:** 1.0  
**Date:** April 25, 2026  
**Owner:** Platform Engineering  
**Zone:** Inference (read-only at runtime) + Eval (authoring)

---

## Purpose

The Prompt Registry is the single source of truth for all versioned prompts used across the SZL Holdings platform. It provides:

- **Version pinning** — production inference always resolves a specific prompt version, never `latest`
- **Rollback controls** — any prompt version can be reactivated in under 5 minutes
- **Audit trail** — every prompt change and resolution is logged
- **Scope enforcement** — prompts declare which data scopes they are permitted to access

---

## Registry Structure

### Prompt Entry Schema

```typescript
interface PromptEntry {
  id: string;                  // e.g. "maritime-delay-analysis"
  version: string;             // semver: "1.2.0"
  status: "active" | "deprecated" | "rollback-candidate" | "archived";
  lane: "vessels" | "aegis" | "terra" | "lyte" | "counsel" | "command" | "core";
  model_requirement: string;   // e.g. "gpt-4o" | "claude-3-5-sonnet" | "any"
  allowed_data_scopes: string[];
  prohibited_data_scopes: string[];
  max_tokens: number;
  temperature: number;
  prompt_template: string;     // Handlebars/mustache template
  system_message: string;
  evaluation_score: number;    // 0–1, from last eval run
  last_evaluated: string;      // ISO 8601
  evaluation_run_id: string;   // links to run-ledger
  created_at: string;
  created_by: string;
  changelog: string;
}
```

---

## Current Prompt Inventory

| ID | Version | Status | Lane | Eval Score | Last Evaluated |
|----|---------|--------|------|-----------|---------------|
| `maritime-delay-analysis` | 1.3.0 | active | vessels | 0.91 | 2026-04-20 |
| `port-risk-assessment` | 2.1.0 | active | vessels | 0.88 | 2026-04-20 |
| `security-incident-triage` | 1.2.0 | active | aegis | 0.94 | 2026-04-21 |
| `threat-intelligence-synthesis` | 1.1.0 | active | aegis | 0.89 | 2026-04-21 |
| `property-risk-assessment` | 1.4.0 | active | terra | 0.87 | 2026-04-19 |
| `market-signal-analysis` | 1.0.0 | active | terra | 0.85 | 2026-04-19 |
| `signal-fusion` | 3.0.0 | active | lyte | 0.93 | 2026-04-22 |
| `recommendation-synthesis` | 2.2.0 | active | lyte | 0.91 | 2026-04-22 |
| `contract-clause-analysis` | 1.1.0 | active | counsel | 0.90 | 2026-04-18 |
| `legal-risk-summary` | 1.0.0 | active | counsel | 0.86 | 2026-04-18 |
| `executive-briefing-synthesis` | 2.0.0 | active | command | 0.92 | 2026-04-22 |
| `cross-domain-cascade-router` | 1.5.0 | active | core | 0.95 | 2026-04-23 |
| `policy-gate-evaluator` | 1.0.0 | active | core | 0.97 | 2026-04-23 |
| `hallucination-detector` | 0.9.0 | rollback-candidate | core | 0.78 | 2026-04-24 |

---

## Version Lifecycle

```
DRAFT → EVAL → STAGING → ACTIVE → DEPRECATED → ARCHIVED
                              ↑
                         ROLLBACK-CANDIDATE
```

- **DRAFT:** Authored, not yet evaluated
- **EVAL:** Being tested in eval-os; not available for production inference
- **STAGING:** Passed eval threshold (score ≥ 0.85); available for canary inference
- **ACTIVE:** Full production traffic
- **ROLLBACK-CANDIDATE:** Score dropped below 0.82 in most recent eval; flagged for review
- **DEPRECATED:** Superseded by newer version; still resolvable but not recommended
- **ARCHIVED:** No longer resolvable; historical record only

---

## Rollback Procedure

### Trigger Conditions

A prompt rollback is triggered when:
- Eval score drops below 0.80 on two consecutive eval runs
- A P1 or P0 incident is linked to a prompt regression
- A human analyst flags consistent hallucination or policy violation in production output

### Rollback Steps

1. **Identify** the last version with `status: "active"` and eval score ≥ 0.85 in the registry inventory above.

2. **Update the registry entry** to mark the current active version as deprecated and the rollback version as active. Registry entries are TypeScript/JSON data — update the `status` field in the registry source and redeploy, or use the planned registry admin API (Phase 8 implementation):
   ```typescript
   // Direct registry update (current implementation — edit registry data + redeploy)
   // Planned Phase 8 CLI: pnpm registry:prompt set-status <id>@<version> deprecated
   ```

3. **Restart inference workers** (picks up new active version on next request):
   ```bash
   # In Replit — restart the api-server workflow
   # In Azure — restart szl-api-prod App Service
   ```

4. **Verify** by checking first 10 production responses use the rollback version hash.

5. **Log** the rollback in `docs/FIX_LOG.md` with:
   - Rolled-back version
   - Restored version
   - Trigger event
   - Timestamp
   - Operator identity

**Expected rollback time:** < 5 minutes (registry update + worker restart)

---

## Runtime Resolution

At inference time, the Policy Engine resolves prompts via:

```typescript
// Simplified resolution logic
const prompt = await promptRegistry.resolve({
  id: 'maritime-delay-analysis',
  // version: '1.3.0'  ← explicit pin (preferred)
  // or status: 'active'  ← resolves current active version
});
```

**Production rule:** All production inference calls **must** pin an explicit version or resolve `active`. The `latest` tag is never used in production.

---

## Evaluation Requirements

Before a prompt advances from EVAL → STAGING, it must pass:

| Criterion | Threshold | Evaluator |
|-----------|-----------|-----------|
| Correctness | ≥ 0.85 | Command Arena |
| Hallucination resistance | ≥ 0.90 | eval-os harness |
| Policy adherence | 1.00 | Covenant Policy Engine |
| Latency (p95) | < 2000ms | eval-os runner |
| Evidence completeness | ≥ 0.80 | eval-os harness |

Evaluation results are stored in `lib/run-ledger` and linked to the registry entry.

---

## Access Control

| Role | Read | Author | Promote to Active | Rollback |
|------|------|--------|------------------|---------|
| `exec` | ✓ | — | — | — |
| `ops` | ✓ | — | — | ✓ (emergency) |
| `platform-engineer` | ✓ | ✓ | ✓ | ✓ |
| `compliance` | ✓ | — | — | — |

Promotion to `active` and rollbacks are audit-logged in `proof-chain`.
