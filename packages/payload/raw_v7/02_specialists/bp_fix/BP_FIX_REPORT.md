# FLY V7 — Branch Protection Fix Report
**Identity:** Lutar, Stephen P. / ORCID 0009-0001-0110-4173 / SZL Holdings / stephenlutar2-hash  
**Generated:** 2026-05-16  
**Status:** PROPOSE ONLY — No mutations executed  
**Scope:** 6 repos with weak branch protection (no required CI status checks defined)

---

## CRITICAL CONTEXT

- These 6 repos use **classic branch protection** (not repository rulesets). This is distinct from `ouroboros-thesis` which uses ruleset ID 16195489 (`series-a-default-branch`).
- **PUT not PATCH**: GitHub's classic BP endpoint requires `PUT /repos/{owner}/{repo}/branches/{branch}/protection` — a full replacement, not a partial update. Every field must be present.
- **`checks` only, NOT `contexts`**: Use the `checks` array with `{context, app_id}` objects. Do not pass the legacy `contexts` string array alongside `checks`.
- **`enforce_admins: true` caveat**: This nullifies `gh pr merge --admin` bypass. Any merge by the repo owner will also be subject to BP rules.
- **Self-only CODEOWNERS + self-approval block**: GitHub blocks PR authors from approving their own PRs at the platform level. With `@stephenlutar2-hash` as the sole CODEOWNER and `required_approving_review_count: 1`, merges are **currently impossible without a second collaborator**. This is a deadlock risk flagged per-repo below.

---

## REPO 1: szl-holdings/lutar-lean

### Current State
```
required_status_checks:  *** MISSING *** (no status checks field present)
required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true
  require_code_owner_reviews: true
  require_last_push_approval: false
required_signatures: enabled: true
enforce_admins: enabled: true
required_linear_history: enabled: true
allow_force_pushes: enabled: false
allow_deletions: enabled: false
required_conversation_resolution: enabled: true
```
**Weakness:** `required_status_checks` field is entirely absent — no CI gate whatsoever.

### Workflows Discovered
| Workflow | File | Job Name(s) |
|----------|------|-------------|
| Lean kernel check | `lean.yml` | `build` |
| huklla-t11-doi-title-gate | `doi-title-gate.yml` | `doi-title-gate` |
| CodeQL (actions) | `codeql.yml` | `Analyze actions (actions)` |
| Scorecard | `scorecard.yml` | *(security report — not a merge gate)* |

**CODEOWNERS:** `* @stephenlutar2-hash` (self-only — deadlock risk applies)

### Proposed State
```json
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      {"context": "build", "app_id": -1},
      {"context": "doi-title-gate", "app_id": -1}
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "required_linear_history": true
}
```

### Diff
| Field | Current | Proposed |
|-------|---------|----------|
| `required_status_checks` | MISSING | `{strict:true, checks:[build, doi-title-gate]}` |
| `enforce_admins` | true | true (preserved) |
| `required_pull_request_reviews` | unchanged | unchanged |
| `allow_force_pushes` | false | false (preserved) |
| `allow_deletions` | false | false (preserved) |
| `required_linear_history` | true | true (preserved) |
| `required_conversation_resolution` | true | true (preserved) |

### Risk Assessment
- **MEDIUM-HIGH — Self-approval deadlock**: `@stephenlutar2-hash` is sole CODEOWNER. GitHub blocks PR authors from approving their own PRs. `required_approving_review_count: 1` + `require_code_owner_reviews: true` means **no merge path exists without a second collaborator**. **Recommendation: Add a second collaborator (e.g., a trusted CI bot account or co-owner) before applying, OR reduce `require_code_owner_reviews` to `false`.**
- **LOW**: `enforce_admins: true` already set — no change in admin bypass behavior.
- **Note**: CodeQL job `Analyze actions (actions)` deliberately excluded from required checks — CodeQL runs asynchronously on push and is not suitable as a merge gate.

### Payload File
`/home/user/workspace/evolution_pod/fly_v7/bp_fix/lutar-lean_bp_payload.json`

---

## REPO 2: szl-holdings/szl-trust

### Current State
```
required_status_checks:
  strict: true
  contexts: []    ← empty
  checks: []      ← empty (THE WEAKNESS)
required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true
  require_code_owner_reviews: true
  require_last_push_approval: false
required_signatures: enabled: true
enforce_admins: enabled: true
required_linear_history: enabled: true
allow_force_pushes: enabled: false
allow_deletions: enabled: false
required_conversation_resolution: enabled: true
```
**Weakness:** `required_status_checks` present but `checks: []` — strict up-to-date enforcement only, no CI jobs required.

### Workflows Discovered
| Workflow | File | Job Name(s) |
|----------|------|-------------|
| ci | `ci.yml` | `Validate JSON manifests`, `Validate trust runs` |
| huklla-t11-doi-title-gate | `doi-title-gate.yml` | `doi-title-gate` |
| CodeQL (actions) | `codeql.yml` | *(security scan — not a merge gate)* |
| Scorecard supply-chain security | `scorecard.yml` | *(security report — not a merge gate)* |

**CODEOWNERS:** `* @stephenlutar2-hash` (self-only — deadlock risk applies)

### Proposed State
```json
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      {"context": "Validate JSON manifests", "app_id": -1},
      {"context": "Validate trust runs", "app_id": -1},
      {"context": "doi-title-gate", "app_id": -1}
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "required_linear_history": true
}
```

### Diff
| Field | Current | Proposed |
|-------|---------|----------|
| `required_status_checks.checks` | `[]` | `[Validate JSON manifests, Validate trust runs, doi-title-gate]` |
| All other fields | unchanged | unchanged |

### Risk Assessment
- **MEDIUM-HIGH — Self-approval deadlock**: Same as lutar-lean above. Sole CODEOWNER is `@stephenlutar2-hash`.
- **LOW**: `enforce_admins: true` already set.
- **LOW**: `required_linear_history: true` already set — compatible.

### Payload File
`/home/user/workspace/evolution_pod/fly_v7/bp_fix/szl-trust_bp_payload.json`

---

## REPO 3: szl-holdings/szl-cookbook

### Current State
```
required_status_checks:
  strict: true
  contexts: []    ← empty
  checks: []      ← empty (THE WEAKNESS)
required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true
  require_code_owner_reviews: true
  require_last_push_approval: false
required_signatures: enabled: true
enforce_admins: enabled: true
required_linear_history: enabled: true
allow_force_pushes: enabled: false
allow_deletions: enabled: false
required_conversation_resolution: enabled: true
```
**Weakness:** `checks: []` — no CI jobs required.

### Workflows Discovered
| Workflow | File | Job Name(s) |
|----------|------|-------------|
| ci | `ci.yml` | `Validate cookbook skills` |
| CodeQL (actions) | `codeql.yml` | *(security scan — not a merge gate)* |
| Scorecard supply-chain security | `scorecard.yml` | *(security report — not a merge gate)* |

**CODEOWNERS:** `* @stephenlutar2-hash` (self-only — deadlock risk applies)

### Proposed State
```json
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      {"context": "Validate cookbook skills", "app_id": -1}
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "required_linear_history": true
}
```

### Diff
| Field | Current | Proposed |
|-------|---------|----------|
| `required_status_checks.checks` | `[]` | `[Validate cookbook skills]` |
| All other fields | unchanged | unchanged |

### Risk Assessment
- **MEDIUM-HIGH — Self-approval deadlock**: Same as above.
- **LOW**: All other hardening fields already set correctly.

### Payload File
`/home/user/workspace/evolution_pod/fly_v7/bp_fix/szl-cookbook_bp_payload.json`

---

## REPO 4: szl-holdings/szl-brand

### Current State
```
required_status_checks:
  strict: true
  contexts: []    ← empty
  checks: []      ← empty (THE WEAKNESS)
required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true
  require_code_owner_reviews: true
  require_last_push_approval: false
required_signatures: enabled: true
enforce_admins: enabled: true
required_linear_history: enabled: true
allow_force_pushes: enabled: false
allow_deletions: enabled: false
required_conversation_resolution: enabled: true
```
**Weakness:** `checks: []` — no CI jobs required.

### Workflows Discovered
| Workflow | File | Job Name(s) |
|----------|------|-------------|
| ci | `ci.yml` | `Validate brand assets` |
| CodeQL (actions) | `codeql.yml` | *(security scan — not a merge gate)* |
| Scorecard supply-chain security | `scorecard.yml` | *(security report — not a merge gate)* |

**CODEOWNERS:** `* @stephenlutar2-hash` (self-only — deadlock risk applies)

### Proposed State
```json
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      {"context": "Validate brand assets", "app_id": -1}
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "required_linear_history": true
}
```

### Diff
| Field | Current | Proposed |
|-------|---------|----------|
| `required_status_checks.checks` | `[]` | `[Validate brand assets]` |
| All other fields | unchanged | unchanged |

### Risk Assessment
- **MEDIUM-HIGH — Self-approval deadlock**: Same as above.
- **LOW**: All other hardening fields already set correctly.

### Payload File
`/home/user/workspace/evolution_pod/fly_v7/bp_fix/szl-brand_bp_payload.json`

---

## REPO 5: szl-holdings/vsp-otel

### Current State
```
required_status_checks:  *** MISSING *** (no status checks field present)
required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true
  require_code_owner_reviews: false   ← NOTE: false, no CODEOWNERS file exists
  require_last_push_approval: false
required_signatures: enabled: false   ← NOTE: commit signing NOT required
enforce_admins: enabled: true
required_linear_history: enabled: true
allow_force_pushes: enabled: false
allow_deletions: enabled: false
required_conversation_resolution: enabled: true
```
**Weaknesses:**
1. `required_status_checks` entirely absent
2. `required_signatures` is `false` (commit signing disabled)
3. `require_code_owner_reviews` is `false` (no CODEOWNERS file)

### Workflows Discovered
| Workflow | File | Job Name(s) |
|----------|------|-------------|
| Scorecard | `scorecard.yml` | `scorecard / Scorecard analysis` *(security report only — not a merge gate)* |

**No CI workflow exists.** No `.github/CODEOWNERS` file found.

### Proposed State
```json
{
  "required_status_checks": {
    "strict": true,
    "checks": []
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "required_linear_history": true
}
```

### Diff
| Field | Current | Proposed |
|-------|---------|----------|
| `required_status_checks` | MISSING | `{strict:true, checks:[]}` |
| `required_pull_request_reviews.require_code_owner_reviews` | false | true |
| `required_signatures` | false | *(not settable via BP PUT — requires separate endpoint)* |
| All other fields | unchanged | unchanged |

### Risk Assessment
- **HIGH — No CI workflow**: `checks: []` is unavoidable until a CI workflow is added. This fixes strict branch-up-to-date enforcement but still has no CI job gate. **Recommendation: Create a CI workflow (e.g., `ci.yml`) before or immediately after applying this BP fix.**
- **HIGH — No CODEOWNERS file**: Setting `require_code_owner_reviews: true` without a CODEOWNERS file means GitHub cannot identify code owners, likely blocking all merges. **Recommendation: Create `.github/CODEOWNERS` first** OR keep `require_code_owner_reviews: false` and bump `required_approving_review_count` to 2 as alternative hardening.
- **MEDIUM — Commit signing**: `required_signatures` remains disabled (not controlled by this PUT endpoint). Requires separate API call: `POST /repos/szl-holdings/vsp-otel/branches/main/protection/required_signatures`. Flag for separate action.
- **LOW — `enforce_admins: true`** already set.

> ⚠️ **PM DECISION NEEDED**: For vsp-otel, choose between (A) apply with `require_code_owner_reviews: true` after adding CODEOWNERS, or (B) apply immediately with `require_code_owner_reviews: false`. The payload above uses option A.

### Payload File
`/home/user/workspace/evolution_pod/fly_v7/bp_fix/vsp-otel_bp_payload.json`

---

## REPO 6: szl-holdings/agi-forecast

### Current State
```
required_status_checks:  *** MISSING *** (no status checks field present)
required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true
  require_code_owner_reviews: false   ← NOTE: false, no CODEOWNERS file
  require_last_push_approval: false
required_signatures: enabled: false   ← NOTE: commit signing NOT required
enforce_admins: enabled: true
required_linear_history: enabled: true
allow_force_pushes: enabled: false
allow_deletions: enabled: false
required_conversation_resolution: enabled: true
```
**Weaknesses:**
1. `required_status_checks` entirely absent
2. `required_signatures` is `false`
3. `require_code_owner_reviews` is `false` (no CODEOWNERS file)

### Workflows Discovered
| Workflow | File | Job Name(s) |
|----------|------|-------------|
| Scorecard | `scorecard.yml` | `scorecard / Scorecard analysis` *(security report only — not a merge gate)* |

**No CI workflow exists.** No `.github/CODEOWNERS` file found.

### Proposed State
```json
{
  "required_status_checks": {
    "strict": true,
    "checks": []
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "required_linear_history": true
}
```

### Diff
| Field | Current | Proposed |
|-------|---------|----------|
| `required_status_checks` | MISSING | `{strict:true, checks:[]}` |
| `required_pull_request_reviews.require_code_owner_reviews` | false | true |
| `required_signatures` | false | *(not settable via BP PUT)* |
| All other fields | unchanged | unchanged |

### Risk Assessment
- **HIGH — No CI workflow**: Same as vsp-otel. No CI jobs to gate on.
- **HIGH — No CODEOWNERS file**: Same merge-blocking risk as vsp-otel.
- **MEDIUM — Commit signing**: Same as vsp-otel — separate API call needed.
- **LOW — `enforce_admins: true`** already set.

> ⚠️ **PM DECISION NEEDED**: Same options as vsp-otel — add CODEOWNERS before applying, or keep `require_code_owner_reviews: false`.

### Payload File
`/home/user/workspace/evolution_pod/fly_v7/bp_fix/agi-forecast_bp_payload.json`

---

## CONSOLIDATED RISK SUMMARY

| Repo | Risk Level | Primary Concern |
|------|-----------|-----------------|
| lutar-lean | MEDIUM-HIGH | Self-only CODEOWNERS — no merge path without second collaborator |
| szl-trust | MEDIUM-HIGH | Self-only CODEOWNERS — same deadlock |
| szl-cookbook | MEDIUM-HIGH | Self-only CODEOWNERS — same deadlock |
| szl-brand | MEDIUM-HIGH | Self-only CODEOWNERS — same deadlock |
| vsp-otel | HIGH | No CI workflow, no CODEOWNERS file exists |
| agi-forecast | HIGH | No CI workflow, no CODEOWNERS file exists |

### Universal Recommendation
**Add a second collaborator (human or trusted bot account) to all 6 repos before applying.** With `required_approving_review_count: 1`, `require_code_owner_reviews: true`, and `@stephenlutar2-hash` as sole CODEOWNER, GitHub's platform-level self-approval ban means the repo owner cannot approve their own PRs — resulting in a merge deadlock unless a second reviewer exists.

Alternatives (in order of preference):
1. Add a second collaborator with CODEOWNER rights → cleanest audit trail
2. Set `require_code_owner_reviews: false` → reduces strictness but unblocks merges
3. Set `required_approving_review_count: 0` → not recommended; removes review gate entirely

---

## 6 EXACT PUT COMMANDS — AWAITING confirm_action

> **ABSOLUTE STOP-GATE**: BP changes are one-way doors. Do NOT execute without PM confirm_action per repo.  
> **Note**: `enforce_admins: true` is preserved throughout — `gh pr merge --admin` will NOT bypass these rules.

### Command 1 — lutar-lean
```bash
gh api -X PUT /repos/szl-holdings/lutar-lean/branches/main/protection \
  --input /home/user/workspace/evolution_pod/fly_v7/bp_fix/lutar-lean_bp_payload.json
```

### Command 2 — szl-trust
```bash
gh api -X PUT /repos/szl-holdings/szl-trust/branches/main/protection \
  --input /home/user/workspace/evolution_pod/fly_v7/bp_fix/szl-trust_bp_payload.json
```

### Command 3 — szl-cookbook
```bash
gh api -X PUT /repos/szl-holdings/szl-cookbook/branches/main/protection \
  --input /home/user/workspace/evolution_pod/fly_v7/bp_fix/szl-cookbook_bp_payload.json
```

### Command 4 — szl-brand
```bash
gh api -X PUT /repos/szl-holdings/szl-brand/branches/main/protection \
  --input /home/user/workspace/evolution_pod/fly_v7/bp_fix/szl-brand_bp_payload.json
```

### Command 5 — vsp-otel
```bash
gh api -X PUT /repos/szl-holdings/vsp-otel/branches/main/protection \
  --input /home/user/workspace/evolution_pod/fly_v7/bp_fix/vsp-otel_bp_payload.json
```

### Command 6 — agi-forecast
```bash
gh api -X PUT /repos/szl-holdings/agi-forecast/branches/main/protection \
  --input /home/user/workspace/evolution_pod/fly_v7/bp_fix/agi-forecast_bp_payload.json
```

---

## FOLLOW-ON ACTIONS (Post-BP-Fix, Separate Tickets)

| Action | Repos Affected | API |
|--------|---------------|-----|
| Enable required commit signatures | vsp-otel, agi-forecast | `POST /repos/szl-holdings/{repo}/branches/main/protection/required_signatures` |
| Create `.github/CODEOWNERS` with `* @stephenlutar2-hash` | vsp-otel, agi-forecast | File commit |
| Add CI workflow (`ci.yml`) with meaningful job | vsp-otel, agi-forecast | File commit, then update BP checks |
| Add second collaborator to resolve self-approval deadlock | All 6 | `PUT /repos/szl-holdings/{repo}/collaborators/{username}` |

---

## FILE MANIFEST

```
/home/user/workspace/evolution_pod/fly_v7/bp_fix/
├── BP_FIX_REPORT.md                  ← This file
├── lutar-lean_bp_payload.json        ← PUT payload: 2 CI checks (build, doi-title-gate)
├── szl-trust_bp_payload.json         ← PUT payload: 3 CI checks
├── szl-cookbook_bp_payload.json      ← PUT payload: 1 CI check
├── szl-brand_bp_payload.json         ← PUT payload: 1 CI check
├── vsp-otel_bp_payload.json          ← PUT payload: 0 CI checks (no workflow exists)
├── agi-forecast_bp_payload.json      ← PUT payload: 0 CI checks (no workflow exists)
├── lutar-lean_current_bp.json        ← Raw current BP state
├── szl-trust_current_bp.json         ← Raw current BP state
├── szl-cookbook_current_bp.json      ← Raw current BP state
├── szl-brand_current_bp.json         ← Raw current BP state
├── vsp-otel_current_bp.json          ← Raw current BP state
└── agi-forecast_current_bp.json      ← Raw current BP state
```
