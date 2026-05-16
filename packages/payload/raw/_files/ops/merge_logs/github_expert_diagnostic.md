# GitHub Expert: PR Unblock Diagnostic
**Date:** 2026-05-15  
**Operator:** stephenlutar2-hash (org admin)  
**Repos:** szl-holdings/lutar-lean, szl-holdings/a11oy, szl-holdings/ouroboros-thesis

---

## 1. Token / Identity

- **Bearer:** `stephenlutar2-hash` (User, not app/bot)
- **Org role:** `admin` on `szl-holdings` (active)
- **Token scopes:** `codespace, gist, notifications, project, read:org, repo, user, workflow`
- **Note:** `admin:org` scope NOT present → `/orgs/szl-holdings/rulesets` returns 404 (not a ruleset blocker; no org-level rulesets apply to these repos)

---

## 2. Exact Blocking State Per Repo

### szl-holdings/lutar-lean (PR #12)

**Protection type:** Classic branch protection ONLY (rulesets: `[]`)

**Blocking factors:**
- `required_pull_request_reviews.required_approving_review_count: 1`
- `required_pull_request_reviews.require_code_owner_reviews: true`
- `enforce_admins: true` (admins not exempt)
- Self-approve blocked at platform level: "Can not approve your own pull request"
- CODEOWNERS: `* @stephenlutar2-hash` — all files owned by the PR author → no external code owner can approve

**required_status_checks:** `null` (no CI checks required in classic BP)  
**required_signatures:** `enabled: true`  
**required_linear_history:** `true`  
**PR state:** `BLOCKED`, `REVIEW_REQUIRED`, `reviews: []`

---

### szl-holdings/a11oy (PR #20)

**Protection type:** Classic branch protection + 3 repo rulesets

**Rulesets:**
- `15812916` "Protect default branch": deletion, non_fast_forward, required_linear_history — `current_user_can_bypass: always`
- `15812921` "Protect release tags": tag protection only (irrelevant for PR merge)
- `16195484` "series-a-default-branch": pull_request rule with `required_approving_review_count: 0`, `require_code_owner_review: false`, `require_last_push_approval: false` — `current_user_can_bypass: always`

**Key insight:** The ruleset `16195484` already permits merge with 0 reviews and user can bypass. But classic BP still enforces `required_approving_review_count: 1` + `require_code_owner_reviews: true` + `enforce_admins: true`.

**Blocking factor:** Classic branch protection (not rulesets).

**Classic BP required_status_checks:** 7 checks (Analyze, CodeQL, docs/*, secrets/TruffleHog) — all passing.  
**PR state:** `BLOCKED`, `REVIEW_REQUIRED`, `reviews: []`

---

### szl-holdings/ouroboros-thesis (PR #40)

**Protection type:** Classic branch protection + 3 repo rulesets

**Rulesets:**
- `15812874` "Protect default branch": deletion, non_fast_forward, required_linear_history — `current_user_can_bypass: always`
- `15812877` "Protect release tags": tag protection only
- `16195489` "series-a-default-branch": pull_request rule with `required_approving_review_count: 1`, `require_last_push_approval: true`, `require_code_owner_review: false` — `current_user_can_bypass: pull_requests_only` (NOT always)

**Blocking factors:**
1. Classic BP: `required_approving_review_count: 1`, `require_code_owner_reviews: true`, `enforce_admins: true`
2. Ruleset `16195489`: `required_approving_review_count: 1` AND `require_last_push_approval: true`, bypass only `pull_requests_only` (not `always`) — admin cannot fully bypass

**PR state:** `BLOCKED`, `REVIEW_REQUIRED`, `reviews: []`  
**Notable:** `require_last_push_approval` = true means last push to the branch must be approved (not just any push), tightening the review requirement further.

---

## 3. CODEOWNERS Analysis

All 3 repos have identical CODEOWNERS pattern:
```
* @stephenlutar2-hash
```
All code owned exclusively by the PR author → `require_code_owner_reviews: true` is structurally unmergeable without a second collaborator, unless review count is set to 0 or code owner requirement is disabled.

---

## 4. Root Cause Summary (ranked by confidence)

1. **[HIGH] Self-only code ownership + self-approve forbidden**: All CODEOWNERS point to `@stephenlutar2-hash`. GitHub platform-level blocks self-approval. No external reviewer exists. This makes `require_code_owner_reviews: true` + `required_approving_review_count ≥ 1` structurally impossible to satisfy.

2. **[HIGH] enforce_admins: true on all repos**: Admin bypass via `--admin` CLI flag is blocked by classic BP `enforce_admins`. Must disable this field during merge window.

3. **[HIGH] ouroboros-thesis ruleset 16195489 adds additional layer**: `required_approving_review_count: 1` + `require_last_push_approval: true` in a ruleset where `current_user_can_bypass = pull_requests_only`, not `always`. Classic BP relaxation alone insufficient — ruleset must also be updated.

4. **[MEDIUM] Malformed PATCH in earlier attempt**: Previous 404 on `/branches/main/protection` was likely the wrong endpoint or missing `required_signatures` field. The correct approach is `PUT` (full replacement) with all required fields; confirmed working in this session.

5. **[LOW] required_signatures: true**: Commits must be GPG/SSH-signed. Squash merge commits are signed by GitHub itself when merged via API/web, so this does not block API-level merges.

---

## 5. Chosen Unblock Path

**Selected: Option B (Temporary PUT with `required_approving_review_count: 0` + `require_code_owner_reviews: false` + `enforce_admins: false`) + Ruleset update for ouroboros-thesis.**

**Rationale:**
- Lightest effective touch: only relaxes the review requirement fields, preserves all other protections (required_signatures, linear_history, status_checks, conversation_resolution, force_push/deletion blocks)
- No new collaborators needed, no org-level changes
- Full restoration to original state after each merge
- For ouroboros-thesis: also updates ruleset `16195489` to set `required_approving_review_count: 0`, `require_last_push_approval: false`, and `bypass_mode: always` during merge window, then restores fully

**Why not --admin alone:** `enforce_admins: true` in classic BP nullifies the `--admin` CLI flag. Must disable `enforce_admins` first.

**Why not disable protection entirely:** More destructive than needed; targeted field changes are cleaner and easier to verify.
