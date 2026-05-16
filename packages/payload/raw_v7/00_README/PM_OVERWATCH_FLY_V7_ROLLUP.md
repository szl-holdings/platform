# Fly V7 — PM-Overwatch Roll-Up

**Author:** Lutar, Stephen P. (ORCID 0009-0001-0110-4173, SZL Holdings)
**Run date:** 2026-05-15 17:36 EDT
**Mission:** Doctrine Sweep V2 + Hygiene Fix + BP Fix + CITATION.cff Fix + PR Triage
**Mode:** Propose-only. Zero live-repo mutations. All actions await per-item `confirm_action`.

---

## Specialist Outcomes — All 5 Landed ✓

| # | Specialist | Status | Deliverable |
|---|---|---|---|
| 1 | Doctrine V7 Sweep | ✅ | `fly_v7/doctrine_sweep_v2_report.md` (582 files scanned) |
| 2 | Hygiene Fix | ✅ | `fly_v7/hygiene/HYGIENE_FIX_REPORT.md` (6 files drafted) |
| 3 | BP Fix | ✅ | `fly_v7/bp_fix/BP_FIX_REPORT.md` (6 PUT payloads) |
| 4 | CITATION.cff Fix | ✅ | `fly_v7/citation_fix/CITATION_FIX_REPORT.md` (13 files drafted) |
| 5 | PR Triage | ✅ | `fly_v7/pr_triage/PR_TRIAGE_REPORT.md` (68 PRs analyzed) |

---

## Headline Numbers

| Metric | Value |
|---|---|
| Files scanned for doctrine | **582** |
| Doctrine auto-fixes applied (local) | **10** in 9 files |
| Live-repo doctrine escalations | **30+** files across `.github`, `ouroboros-thesis`, `platform` |
| Hygiene files drafted | **6** (vsp-otel + agi-forecast) |
| BP fix payloads ready | **6** |
| CITATION.cff drafts ready | **13** |
| Open PRs triaged | **68** |
| Routine merges proposed | **12** Dependabot bumps |
| Doctrine-violation PRs proposed for close | **18** |

---

## Roll-Up — What's Ready to Push (Awaiting confirm_action)

### Tier 1 — Safe & Routine (single confirm_action covers batch)
- **12 Dependabot MERGE PRs** — codeql-action 4.35.4→4.35.5, harden-runner 2.19.1→2.19.3. CI green, mergeable=clean across amaru, a11oy, sentra, terra, vessels, counsel, carlota-jo.
- **2 Hygiene PRs** (vsp-otel + agi-forecast) — SECURITY.md / CONTRIBUTING.md / CODE_OF_CONDUCT.md. Validated, no forbidden patterns.
- **13 CITATION.cff email-add PRs** — single-field addition, YAML-validated.

### Tier 2 — Doctrine Cleanup (high-value, low-risk)
- **18 PR CLOSEs** — 13 `polish/hygiene-and-doctrine-sweep` PRs + 5 feature PRs containing the 8 forbidden patterns in PR bodies. These could be merged accidentally (CI green) and would inject the forbidden patterns into history. **Close before anything else.**

### Tier 3 — One-Way Doors (need per-item confirm_action)
- **6 Branch Protection PUTs** — flagged risks below.
- **GitHub profile rename** — `gh api -X PATCH /user -f name='Lutar, Stephen P.'` to remove "Stephen Paul Lutar Jr." from display name.
- **Live-repo doctrine remediation PRs** — 25+ files across `.github`, `ouroboros-thesis` v1–v12 papers, `platform`. Each repo gets its own PR after Stephen reviews scope.

### Tier 4 — PM Decision Required (do NOT proceed without explicit ruling)
- **`Glasswing` / `Mythos` in `platform`** — 25+ and 30+ files respectively. These appear to be live product feature names in active code. Wholesale replacement would rename shipping products. Doctrine exceptions may be warranted. **Stephen must rule before any action.**
- **BP review-count deadlock** — self-only CODEOWNERS + platform self-approve ban + `required_approving_review_count: 1` = no merge path. Either add a second collaborator OR drop `require_code_owner_reviews` to `false`. Affects all 6 BP repos.
- **vsp-otel / agi-forecast have no CODEOWNERS file** — proposed payload sets `require_code_owner_reviews: true` but no file exists. Either create file first or relax the flag.

---

## Risk Register

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | 13 `polish/hygiene-and-doctrine-sweep` PRs are CI-green and could be merged by accident — they contain all 8 forbidden patterns | High — would inject doctrine violations into default branch | CLOSE all 13 immediately upon confirm_action |
| R2 | BP review-count + self-only CODEOWNERS = merge deadlock if applied as-is | Medium — would block Stephen's own future PRs | Add 2nd collaborator OR drop `require_code_owner_reviews` |
| R3 | `Glasswing` / `Mythos` are live product names in `platform` | Medium — wholesale rename could break shipping product | Wait for Stephen's ruling on doctrine exceptions |
| R4 | GitHub display name contains 2 forbidden patterns ("Stephen Paul" + "Jr.") | Medium — appears in every commit/PR view | PATCH /user via gh api with confirm_action |
| R5 | vsp-otel / agi-forecast have no CI workflow yet | Low — `checks: []` only enforces branch-up-to-date | Land hygiene PR first, then add CI workflow, then re-apply BP |
| R6 | `required_signatures` cannot be set via BP PUT endpoint | Low — separate POST call needed | Follow-on ticket |

---

## Recommended Execution Order

When Stephen returns and approves, execute in this order to maximize safety:

1. **CLOSE 18 doctrine-violation PRs** (Tier 2) — removes the loaded gun
2. **MERGE 12 Dependabot PRs** (Tier 1) — clean baseline
3. **Open 2 Hygiene PRs + 13 CITATION.cff PRs** (Tier 1) — additive, low risk
4. **PM ruling on Glasswing/Mythos** (Tier 4) — unblocks live-repo doctrine work
5. **PATCH GitHub display name** (Tier 3) — single command, immediate effect
6. **PM ruling on BP review-count strategy** (Tier 4) — choose: add collaborator OR drop code-owner requirement
7. **Apply 6 BP PUTs** (Tier 3) — one-way doors, one per confirm_action
8. **Open live-repo doctrine remediation PRs** (Tier 3) — per repo, scoped to text-only

---

## Reference Files

- Doctrine: `/home/user/workspace/evolution_pod/fly_v7/doctrine_sweep_v2_report.md`
- Hygiene: `/home/user/workspace/evolution_pod/fly_v7/hygiene/HYGIENE_FIX_REPORT.md`
- BP: `/home/user/workspace/evolution_pod/fly_v7/bp_fix/BP_FIX_REPORT.md`
- CITATION: `/home/user/workspace/evolution_pod/fly_v7/citation_fix/CITATION_FIX_REPORT.md`
- PR Triage: `/home/user/workspace/evolution_pod/fly_v7/pr_triage/PR_TRIAGE_REPORT.md`

---

## Standing Stop-Gates (preserved)
- Zenodo DOI mint
- arXiv submission
- npm publish if version exists
- Branch protection edits (each one)
- New schedule_cron
- Force push to default branch

All Fly V7 work respects these gates. Nothing was pushed.

— PM-Overwatch · Fly V7 complete · awaiting Stephen's go/no-go per tier
