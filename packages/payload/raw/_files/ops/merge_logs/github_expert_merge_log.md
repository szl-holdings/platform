# GitHub Expert: Merge Execution Log
**Date:** 2026-05-15  
**Operator:** stephenlutar2-hash (org admin)  
**Mission:** Land 3 stuck PRs for SZL Holdings

---

## Pre-Merge Verification

All 3 PRs confirmed:
- `mergeStateStatus: BLOCKED`
- `reviewDecision: REVIEW_REQUIRED`
- `reviews: []`
- `mergeable: MERGEABLE`
- CI: 100% green (verified via `gh pr checks`)

---

## PR #12 — szl-holdings/lutar-lean

**Title:** feat(doctrine-v3): MoralGrounding + MeasurabilityHonesty theorems (zero sorry)  
**Branch:** (squash merged to main)

### Step 1: Relax protection
```
PUT /repos/szl-holdings/lutar-lean/branches/main/protection
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false
}
```
**Result:** HTTP 200 — enforce_admins disabled, required_approving_review_count set to 0

**Note:** `required_status_checks` must be `null` (not empty object `{}`) when no checks are configured. Passing `{"strict": true, "contexts": [], "checks": []}` returns HTTP 422 "No subschema in anyOf matched".

### Step 2: Merge
```
gh pr merge 12 --repo szl-holdings/lutar-lean --squash --admin
```
**Result:** Exit 0 — SUCCESS

**Verification:**
```json
{"mergeCommit": {"oid": "fcae1aed26a3d8b7fec8aa3dcbd4f334220efa09"}, "mergedAt": "2026-05-15T19:04:05Z", "state": "MERGED"}
```

### Step 3: Restore protection
```
PUT /repos/szl-holdings/lutar-lean/branches/main/protection
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1,
    "require_last_push_approval": false
  },
  ...all other fields restored to original...
}
```
**Result:** HTTP 200 — protection fully restored

---

## PR #20 — szl-holdings/a11oy

**Title:** feat(knowledge): Math Pod V3 — a11oy-knowledge v0.4.0 (TH4–TH7 + A10/A11/A14 + unified extension)  
**Branch:** (squash merged to main)

### Step 1: Relax classic branch protection
```
PUT /repos/szl-holdings/a11oy/branches/main/protection
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      {"context": "Analyze (actions)", "app_id": 15368},
      {"context": "CodeQL", "app_id": 57789},
      {"context": "docs / External link check", "app_id": 15368},
      {"context": "docs / Markdown lint", "app_id": 15368},
      {"context": "docs / Required files present", "app_id": 15368},
      {"context": "docs / Validate CITATION.cff", "app_id": 15368},
      {"context": "secrets / TruffleHog Secret Scan", "app_id": 15368}
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": true,
  ...other fields preserved...
}
```
**Result:** HTTP 200

**Note:** Must send `checks` array only (no `contexts` alongside it) — sending both returns HTTP 422.

**Ruleset note:** a11oy ruleset `16195484` already had `required_approving_review_count: 0` and `current_user_can_bypass: always`. No ruleset change needed. Only classic BP relaxation required.

### Step 2: Merge
```
gh pr merge 20 --repo szl-holdings/a11oy --squash --admin
```
**Result:** Exit 0 — SUCCESS

**Verification:**
```json
{"mergeCommit": {"oid": "3d0f98412ee6738102634b47f7d8618a6e4cd2b5"}, "mergedAt": "2026-05-15T19:06:01Z", "state": "MERGED"}
```

### Step 3: Restore protection
```
PUT /repos/szl-holdings/a11oy/branches/main/protection
{enforce_admins: true, required_approving_review_count: 1, require_code_owner_reviews: true, ...restored...}
```
**Result:** HTTP 200 — protection fully restored

---

## PR #40 — szl-holdings/ouroboros-thesis

**Title:** feat(thesis): Math Pod V3 + arXiv-ready main.tex.md + Unified Extension v0.4.0  
**Branch:** math-pod-v3/arxiv-thesis → main (squash merge)

### Step 1: Relax classic branch protection
```
PUT /repos/szl-holdings/ouroboros-thesis/branches/main/protection
{
  "required_status_checks": {
    "strict": true,
    "checks": [5 doc/CI checks preserved]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": true,
  ...other fields preserved...
}
```
**Result:** HTTP 200

### Step 2: Relax ruleset 16195489 (series-a-default-branch)
Required because `current_user_can_bypass: pull_requests_only` (not `always`) — classic BP relaxation alone insufficient.

```
PUT /repos/szl-holdings/ouroboros-thesis/rulesets/16195489
{
  "bypass_actors": [{"actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "always"}],
  "rules": [
    ...deletion, non_fast_forward, required_linear_history preserved...,
    {"type": "pull_request", "parameters": {
      "required_approving_review_count": 0,
      "dismiss_stale_reviews_on_push": true,
      "require_code_owner_review": false,
      "require_last_push_approval": false,
      "required_review_thread_resolution": true,
      "allowed_merge_methods": ["squash", "rebase"]
    }},
    ...required_status_checks preserved...
  ]
}
```
**Result:** HTTP 200 — `current_user_can_bypass: always`

### Step 3: Merge
```
gh pr merge 40 --repo szl-holdings/ouroboros-thesis --squash --admin
```
**Result:** Exit 0 — SUCCESS

**Verification:**
```json
{"mergeCommit": {"oid": "060eb8c8c8a1957b2e1682bf01e99e9ef0dafa4c"}, "mergedAt": "2026-05-15T19:08:23Z", "state": "MERGED"}
```

### Step 4: Restore classic branch protection
```
PUT /repos/szl-holdings/ouroboros-thesis/branches/main/protection
{enforce_admins: true, required_approving_review_count: 1, require_code_owner_reviews: true, require_last_push_approval: true, ...restored...}
```
**Result:** HTTP 200

### Step 5: Restore ruleset 16195489
```
PUT /repos/szl-holdings/ouroboros-thesis/rulesets/16195489
{
  "bypass_actors": [{"actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "pull_request"}],
  "rules": [
    ...pull_request with required_approving_review_count: 1, require_last_push_approval: true...
  ]
}
```
**Result:** HTTP 200 — `current_user_can_bypass: pull_requests_only` (restored)

---

## Protection State After Restore (Verified Read)

### lutar-lean/main
| Field | Before | After |
|-------|--------|-------|
| enforce_admins | true | **true** ✓ |
| required_approving_review_count | 1 | **1** ✓ |
| require_code_owner_reviews | true | **true** ✓ |
| dismiss_stale_reviews | true | **true** ✓ |
| require_last_push_approval | false | **false** ✓ |
| required_signatures | true | **true** ✓ |
| required_linear_history | true | **true** ✓ |
| allow_force_pushes | false | **false** ✓ |
| allow_deletions | false | **false** ✓ |
| required_conversation_resolution | true | **true** ✓ |

### a11oy/main
| Field | Before | After |
|-------|--------|-------|
| enforce_admins | true | **true** ✓ |
| required_approving_review_count | 1 | **1** ✓ |
| require_code_owner_reviews | true | **true** ✓ |
| dismiss_stale_reviews | true | **true** ✓ |
| require_last_push_approval | false | **false** ✓ |
| required_signatures | true | **true** ✓ |
| required_linear_history | true | **true** ✓ |
| allow_force_pushes | false | **false** ✓ |
| allow_deletions | false | **false** ✓ |
| required_conversation_resolution | true | **true** ✓ |

### ouroboros-thesis/main (classic BP)
| Field | Before | After |
|-------|--------|-------|
| enforce_admins | true | **true** ✓ |
| required_approving_review_count | 1 | **1** ✓ |
| require_code_owner_reviews | true | **true** ✓ |
| dismiss_stale_reviews | true | **true** ✓ |
| require_last_push_approval | true | **true** ✓ |
| required_signatures | true | **true** ✓ |
| required_linear_history | true | **true** ✓ |
| allow_force_pushes | false | **false** ✓ |
| allow_deletions | false | **false** ✓ |
| required_conversation_resolution | true | **true** ✓ |

### ouroboros-thesis ruleset 16195489
| Field | Before | After |
|-------|--------|-------|
| enforcement | active | **active** ✓ |
| bypass_mode | pull_request | **pull_request** ✓ |
| current_user_can_bypass | pull_requests_only | **pull_requests_only** ✓ |
| required_approving_review_count | 1 | **1** ✓ |
| require_last_push_approval | true | **true** ✓ |
| require_code_owner_review | false | **false** ✓ |

---

## Doctrine Sweep Results

### Patterns checked:
`Jr.` | `AlloyScape` | `Glass Wing` | `Pillpintu` | `Khipu` | `Stephen Paul` | `Perplexity Computer` | `anonymous`

### szl-holdings/lutar-lean (post-merge main)
| Pattern | Result |
|---------|--------|
| Jr. | CLEAN |
| AlloyScape | CLEAN |
| Glass Wing | CLEAN |
| Pillpintu | CLEAN |
| Khipu | CLEAN |
| Stephen Paul | CLEAN |
| Perplexity Computer | CLEAN |
| anonymous | CLEAN |

**Verdict: CLEAN**

### szl-holdings/a11oy (post-merge main)
| Pattern | Result |
|---------|--------|
| Jr. | HIT — see below |
| AlloyScape | CLEAN |
| Glass Wing | CLEAN |
| Pillpintu | CLEAN |
| Khipu | CLEAN |
| Stephen Paul | HIT — see below |
| Perplexity Computer | CLEAN |
| anonymous | CLEAN |

**Hits:**
- `packages/a11oy-knowledge/src/knowledge.json:1522` — `"clause": "Byline must be 'Lutar, Stephen P.' — never 'Jr.' or 'Stephen Paul'"`

**Assessment: NOT a violation.** This hit is inside a doctrine enforcement rule definition itself — it references the forbidden strings as the *things being forbidden*, not as the author byline. This is a self-referential doctrine clause, not a prohibited usage. The PR #20 changed files are clean.

**Verdict: CLEAN (doctrine reference, not a byline violation)**

### szl-holdings/ouroboros-thesis (post-merge main)
| Pattern | Result |
|---------|--------|
| Jr. | HIT — multiple pre-existing files |
| AlloyScape | HIT — 1 pre-existing file |
| Glass Wing | CLEAN |
| Pillpintu | CLEAN |
| Khipu | CLEAN |
| Stephen Paul | HIT — multiple pre-existing files |
| Perplexity Computer | HIT — 1 pre-existing file |
| anonymous | CLEAN |

**Hits (all pre-existing, NOT in PR #40 changed files):**

**Jr.** — Found in pre-existing paper versions v2–v12, v2/submission/, v2/blog/, etc.:
- `v2/submission/ZENODO_PLAYBOOK.md:124` — `Stephen P. Lutar Jr.` in pandoc render command
- `v2/submission/SUBMISSION_CHECKLIST.md:10` — `Stephen P. Lutar Jr.`
- `v2/submission/ARXIV_PLAYBOOK.md:45` — `Stephen P. Lutar Jr.`
- `v2/study/consent-form.md:3`, `PROTOCOL.md:4`, `RELEASE_NOTES.md:117`, `blog/companion-post.md:7`, `PAYLOAD.md`
- `papers/v2/ through v12/` — all historical paper versions
- `ouroboros-thesis-v2.md`, `ouroboros-runtime-contract.v2.json`, `ouroboros-runtime-contract.v3.json`, `docs/publications/THESIS_PUBLICATIONS.md`

**Stephen Paul** — Found in `papers/v3/ through v8/`: `Stephen Paul Lutar Jr.` (combined violation of both forbidden forms)

**AlloyScape** — `docs/research/ouroboros-runtime-contract.v3.json:136` — listed in a context array

**Perplexity Computer** — `papers/v3/AUDIT.md:4` — `**Auditor:** Perplexity Computer (this session)`

**PR #40 changed files (doctrine sweep of new content only):**
- `arxiv_pkg/ancillary/replay-evidence.json` — CLEAN
- `arxiv_pkg/ancillary/repo-manifest.json` — CLEAN
- `arxiv_pkg/refs.bib` — CLEAN
- `phd_thesis/main.tex.md` — CLEAN
- `zenodo_pkg/deposit.json` — CLEAN

**Verdict: PRE-EXISTING violations in historical paper versions. PR #40 itself introduces NO new doctrine violations. The violations require a separate remediation PR to correct historical files (v2–v12) — not blocking for this merge.**

---

## Hard-Stops Remaining (DO NOT EXECUTE)

1. **Zenodo deposit / DOI mint** — `.zenodo.json` and `zenodo_pkg/deposit.json` exist in ouroboros-thesis. No deposit executed.
2. **arXiv submission** — `ARXIV_SUBMISSION.md` files exist across paper versions. No arXiv upload executed.
3. **npm publish** — Not applicable to these repos.

---

## Actions Stephen Needs to Take Manually

1. **Remediate pre-existing doctrine violations in ouroboros-thesis** (all in historical paper versions v2–v12):
   - Change `Stephen P. Lutar Jr.` → `Lutar, Stephen P.` in academic bylines
   - Change `Stephen Paul Lutar Jr.` → `Lutar, Stephen P.` (papers/v3–v8)
   - Review `AlloyScape` mention in `ouroboros-runtime-contract.v3.json:136`
   - Review `Perplexity Computer` mention in `papers/v3/AUDIT.md:4`
   - These are in historical/archival files and may require coordinated remediation PR

2. **Add a second collaborator to szl-holdings org** to enable future PRs to be properly reviewed without needing protection relaxation each time. Currently all CODEOWNERS point exclusively to `@stephenlutar2-hash`, creating a structurally unmergeable state for any self-authored PR.

---

## Summary

| PR | Repo | Merge SHA | Merged At | Status |
|----|------|-----------|-----------|--------|
| #12 | lutar-lean | `fcae1aed` | 2026-05-15T19:04:05Z | MERGED ✓ |
| #20 | a11oy | `3d0f9841` | 2026-05-15T19:06:01Z | MERGED ✓ |
| #40 | ouroboros-thesis | `060eb8c8` | 2026-05-15T19:08:23Z | MERGED ✓ |

All branch protections verified restored to original state.
