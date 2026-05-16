# CITATION.cff Email Fix Report
**FLY V7 — CITATION.cff FIX SPECIALIST**
**Generated:** 2026-05-17
**Author identity:** Stephen P. Lutar · stephen@szlholdings.com · https://orcid.org/0009-0001-0110-4173 · SZL Holdings

---

## 1. Full Inventory — 16 Repos (email field status)

| # | Repo | email in `authors:` block | Notes |
|---|------|--------------------------|-------|
| 1 | amaru | ❌ MISSING | Also missing in `preferred-citation` authors |
| 2 | a11oy | ❌ MISSING | Also missing in `preferred-citation` authors |
| 3 | sentra | ❌ MISSING | Also missing in `preferred-citation` authors |
| 4 | terra | ❌ MISSING | Also missing in `preferred-citation` authors |
| 5 | vessels | ❌ MISSING | Also missing in `preferred-citation` authors |
| 6 | counsel | ❌ MISSING | Also missing in `preferred-citation` authors |
| 7 | carlota-jo | ❌ MISSING | Also missing in `preferred-citation` authors |
| 8 | ouroboros | ❌ MISSING | Also missing in `preferred-citation` authors |
| 9 | ouroboros-thesis | ❌ MISSING | Also missing in `preferred-citation` authors |
| 10 | lutar-lean | ❌ MISSING | Also missing in `preferred-citation` authors |
| 11 | vsp-otel | ❌ MISSING | No `preferred-citation` block |
| 12 | agi-forecast | ❌ MISSING | No `preferred-citation` block |
| 13 | .github | ❌ MISSING in `authors:` | Has email in `contact:` block only — `authors:` block is missing it |
| 14 | szl-trust | ✅ PRESENT | email: stephen@szlholdings.com |
| 15 | szl-cookbook | ✅ PRESENT | email: stephen@szlholdings.com |
| 16 | szl-brand | ✅ PRESENT | email: stephen@szlholdings.com |

---

## 2. Repos Requiring Fix (12 total)

1. `amaru`
2. `a11oy`
3. `sentra`
4. `terra`
5. `vessels`
6. `counsel`
7. `carlota-jo`
8. `ouroboros`
9. `ouroboros-thesis`
10. `lutar-lean`
11. `vsp-otel`
12. `agi-forecast`

> **Note on `.github`:** The `.github` repo has `email: stephen@szlholdings.com` in the `contact:` block but is **missing** it in the `authors:` block. The fix adds it to `authors:` (the canonical author object) while preserving the existing `contact:` entry. This brings it into conformance with the other 15 repos' author metadata standard. If the parent agent decides `.github` already satisfies the standard via `contact:`, it can be excluded, leaving 12 repos to fix.

---

## 3. Drafted File Paths

All files YAML-validated: `python3 -c "import yaml; yaml.safe_load(open(...))"` — **13/13 PASS, 0 FAIL**

| Repo | Drafted CITATION.cff | PR Body |
|------|---------------------|---------|
| amaru | `citation_fix/amaru_CITATION.cff` | `citation_fix/amaru_PR_BODY.md` |
| a11oy | `citation_fix/a11oy_CITATION.cff` | `citation_fix/a11oy_PR_BODY.md` |
| sentra | `citation_fix/sentra_CITATION.cff` | `citation_fix/sentra_PR_BODY.md` |
| terra | `citation_fix/terra_CITATION.cff` | `citation_fix/terra_PR_BODY.md` |
| vessels | `citation_fix/vessels_CITATION.cff` | `citation_fix/vessels_PR_BODY.md` |
| counsel | `citation_fix/counsel_CITATION.cff` | `citation_fix/counsel_PR_BODY.md` |
| carlota-jo | `citation_fix/carlota-jo_CITATION.cff` | `citation_fix/carlota-jo_PR_BODY.md` |
| ouroboros | `citation_fix/ouroboros_CITATION.cff` | `citation_fix/ouroboros_PR_BODY.md` |
| ouroboros-thesis | `citation_fix/ouroboros-thesis_CITATION.cff` | `citation_fix/ouroboros-thesis_PR_BODY.md` |
| lutar-lean | `citation_fix/lutar-lean_CITATION.cff` | `citation_fix/lutar-lean_PR_BODY.md` |
| vsp-otel | `citation_fix/vsp-otel_CITATION.cff` | `citation_fix/vsp-otel_PR_BODY.md` |
| agi-forecast | `citation_fix/agi-forecast_CITATION.cff` | `citation_fix/agi-forecast_PR_BODY.md` |
| .github | `citation_fix/.github_CITATION.cff` | `citation_fix/.github_PR_BODY.md` |

All paths are under: `/home/user/workspace/evolution_pod/fly_v7/`

---

## 4. Exact `gh` Command Stubs — AWAITING confirm_action

> **STATUS: NO MUTATIONS MADE. These commands are staged only.**
> Each block below is the exact sequence to push the fix for one repo.
> All commands require explicit `confirm_action` approval before execution.

---

### amaru

```bash
# 1. Get current file SHA (required for update API)
SHA=$(gh api /repos/szl-holdings/amaru/contents/CITATION.cff --jq '.sha')

# 2. Push updated file directly via API (creates/updates on default branch — use for branch via API below)
# Create branch first
gh api /repos/szl-holdings/amaru/git/refs \
  --method POST \
  --field ref="refs/heads/chore/citation-email-amaru" \
  --field sha="$(gh api /repos/szl-holdings/amaru/git/ref/heads/main --jq '.object.sha')"

# 3. Update CITATION.cff on the new branch
gh api /repos/szl-holdings/amaru/contents/CITATION.cff \
  --method PUT \
  --field message="chore: add email to CITATION.cff author block" \
  --field content="$(base64 -w 0 /home/user/workspace/evolution_pod/fly_v7/citation_fix/amaru_CITATION.cff)" \
  --field sha="$SHA" \
  --field branch="chore/citation-email-amaru"

# 4. Open PR
gh pr create \
  --repo szl-holdings/amaru \
  --head chore/citation-email-amaru \
  --base main \
  --title "chore: add email to CITATION.cff author block" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/citation_fix/amaru_PR_BODY.md
```

---

### a11oy

```bash
SHA=$(gh api /repos/szl-holdings/a11oy/contents/CITATION.cff --jq '.sha')

gh api /repos/szl-holdings/a11oy/git/refs \
  --method POST \
  --field ref="refs/heads/chore/citation-email-a11oy" \
  --field sha="$(gh api /repos/szl-holdings/a11oy/git/ref/heads/main --jq '.object.sha')"

gh api /repos/szl-holdings/a11oy/contents/CITATION.cff \
  --method PUT \
  --field message="chore: add email to CITATION.cff author block" \
  --field content="$(base64 -w 0 /home/user/workspace/evolution_pod/fly_v7/citation_fix/a11oy_CITATION.cff)" \
  --field sha="$SHA" \
  --field branch="chore/citation-email-a11oy"

gh pr create \
  --repo szl-holdings/a11oy \
  --head chore/citation-email-a11oy \
  --base main \
  --title "chore: add email to CITATION.cff author block" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/citation_fix/a11oy_PR_BODY.md
```

---

### sentra

```bash
SHA=$(gh api /repos/szl-holdings/sentra/contents/CITATION.cff --jq '.sha')

gh api /repos/szl-holdings/sentra/git/refs \
  --method POST \
  --field ref="refs/heads/chore/citation-email-sentra" \
  --field sha="$(gh api /repos/szl-holdings/sentra/git/ref/heads/main --jq '.object.sha')"

gh api /repos/szl-holdings/sentra/contents/CITATION.cff \
  --method PUT \
  --field message="chore: add email to CITATION.cff author block" \
  --field content="$(base64 -w 0 /home/user/workspace/evolution_pod/fly_v7/citation_fix/sentra_CITATION.cff)" \
  --field sha="$SHA" \
  --field branch="chore/citation-email-sentra"

gh pr create \
  --repo szl-holdings/sentra \
  --head chore/citation-email-sentra \
  --base main \
  --title "chore: add email to CITATION.cff author block" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/citation_fix/sentra_PR_BODY.md
```

---

### terra

```bash
SHA=$(gh api /repos/szl-holdings/terra/contents/CITATION.cff --jq '.sha')

gh api /repos/szl-holdings/terra/git/refs \
  --method POST \
  --field ref="refs/heads/chore/citation-email-terra" \
  --field sha="$(gh api /repos/szl-holdings/terra/git/ref/heads/main --jq '.object.sha')"

gh api /repos/szl-holdings/terra/contents/CITATION.cff \
  --method PUT \
  --field message="chore: add email to CITATION.cff author block" \
  --field content="$(base64 -w 0 /home/user/workspace/evolution_pod/fly_v7/citation_fix/terra_CITATION.cff)" \
  --field sha="$SHA" \
  --field branch="chore/citation-email-terra"

gh pr create \
  --repo szl-holdings/terra \
  --head chore/citation-email-terra \
  --base main \
  --title "chore: add email to CITATION.cff author block" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/citation_fix/terra_PR_BODY.md
```

---

### vessels

```bash
SHA=$(gh api /repos/szl-holdings/vessels/contents/CITATION.cff --jq '.sha')

gh api /repos/szl-holdings/vessels/git/refs \
  --method POST \
  --field ref="refs/heads/chore/citation-email-vessels" \
  --field sha="$(gh api /repos/szl-holdings/vessels/git/ref/heads/main --jq '.object.sha')"

gh api /repos/szl-holdings/vessels/contents/CITATION.cff \
  --method PUT \
  --field message="chore: add email to CITATION.cff author block" \
  --field content="$(base64 -w 0 /home/user/workspace/evolution_pod/fly_v7/citation_fix/vessels_CITATION.cff)" \
  --field sha="$SHA" \
  --field branch="chore/citation-email-vessels"

gh pr create \
  --repo szl-holdings/vessels \
  --head chore/citation-email-vessels \
  --base main \
  --title "chore: add email to CITATION.cff author block" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/citation_fix/vessels_PR_BODY.md
```

---

### counsel

```bash
SHA=$(gh api /repos/szl-holdings/counsel/contents/CITATION.cff --jq '.sha')

gh api /repos/szl-holdings/counsel/git/refs \
  --method POST \
  --field ref="refs/heads/chore/citation-email-counsel" \
  --field sha="$(gh api /repos/szl-holdings/counsel/git/ref/heads/main --jq '.object.sha')"

gh api /repos/szl-holdings/counsel/contents/CITATION.cff \
  --method PUT \
  --field message="chore: add email to CITATION.cff author block" \
  --field content="$(base64 -w 0 /home/user/workspace/evolution_pod/fly_v7/citation_fix/counsel_CITATION.cff)" \
  --field sha="$SHA" \
  --field branch="chore/citation-email-counsel"

gh pr create \
  --repo szl-holdings/counsel \
  --head chore/citation-email-counsel \
  --base main \
  --title "chore: add email to CITATION.cff author block" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/citation_fix/counsel_PR_BODY.md
```

---

### carlota-jo

```bash
SHA=$(gh api /repos/szl-holdings/carlota-jo/contents/CITATION.cff --jq '.sha')

gh api /repos/szl-holdings/carlota-jo/git/refs \
  --method POST \
  --field ref="refs/heads/chore/citation-email-carlota-jo" \
  --field sha="$(gh api /repos/szl-holdings/carlota-jo/git/ref/heads/main --jq '.object.sha')"

gh api /repos/szl-holdings/carlota-jo/contents/CITATION.cff \
  --method PUT \
  --field message="chore: add email to CITATION.cff author block" \
  --field content="$(base64 -w 0 /home/user/workspace/evolution_pod/fly_v7/citation_fix/carlota-jo_CITATION.cff)" \
  --field sha="$SHA" \
  --field branch="chore/citation-email-carlota-jo"

gh pr create \
  --repo szl-holdings/carlota-jo \
  --head chore/citation-email-carlota-jo \
  --base main \
  --title "chore: add email to CITATION.cff author block" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/citation_fix/carlota-jo_PR_BODY.md
```

---

### ouroboros

```bash
SHA=$(gh api /repos/szl-holdings/ouroboros/contents/CITATION.cff --jq '.sha')

gh api /repos/szl-holdings/ouroboros/git/refs \
  --method POST \
  --field ref="refs/heads/chore/citation-email-ouroboros" \
  --field sha="$(gh api /repos/szl-holdings/ouroboros/git/ref/heads/main --jq '.object.sha')"

gh api /repos/szl-holdings/ouroboros/contents/CITATION.cff \
  --method PUT \
  --field message="chore: add email to CITATION.cff author block" \
  --field content="$(base64 -w 0 /home/user/workspace/evolution_pod/fly_v7/citation_fix/ouroboros_CITATION.cff)" \
  --field sha="$SHA" \
  --field branch="chore/citation-email-ouroboros"

gh pr create \
  --repo szl-holdings/ouroboros \
  --head chore/citation-email-ouroboros \
  --base main \
  --title "chore: add email to CITATION.cff author block" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/citation_fix/ouroboros_PR_BODY.md
```

---

### ouroboros-thesis

```bash
SHA=$(gh api /repos/szl-holdings/ouroboros-thesis/contents/CITATION.cff --jq '.sha')

gh api /repos/szl-holdings/ouroboros-thesis/git/refs \
  --method POST \
  --field ref="refs/heads/chore/citation-email-ouroboros-thesis" \
  --field sha="$(gh api /repos/szl-holdings/ouroboros-thesis/git/ref/heads/main --jq '.object.sha')"

gh api /repos/szl-holdings/ouroboros-thesis/contents/CITATION.cff \
  --method PUT \
  --field message="chore: add email to CITATION.cff author block" \
  --field content="$(base64 -w 0 /home/user/workspace/evolution_pod/fly_v7/citation_fix/ouroboros-thesis_CITATION.cff)" \
  --field sha="$SHA" \
  --field branch="chore/citation-email-ouroboros-thesis"

gh pr create \
  --repo szl-holdings/ouroboros-thesis \
  --head chore/citation-email-ouroboros-thesis \
  --base main \
  --title "chore: add email to CITATION.cff author block" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/citation_fix/ouroboros-thesis_PR_BODY.md
```

---

### lutar-lean

```bash
SHA=$(gh api /repos/szl-holdings/lutar-lean/contents/CITATION.cff --jq '.sha')

gh api /repos/szl-holdings/lutar-lean/git/refs \
  --method POST \
  --field ref="refs/heads/chore/citation-email-lutar-lean" \
  --field sha="$(gh api /repos/szl-holdings/lutar-lean/git/ref/heads/main --jq '.object.sha')"

gh api /repos/szl-holdings/lutar-lean/contents/CITATION.cff \
  --method PUT \
  --field message="chore: add email to CITATION.cff author block" \
  --field content="$(base64 -w 0 /home/user/workspace/evolution_pod/fly_v7/citation_fix/lutar-lean_CITATION.cff)" \
  --field sha="$SHA" \
  --field branch="chore/citation-email-lutar-lean"

gh pr create \
  --repo szl-holdings/lutar-lean \
  --head chore/citation-email-lutar-lean \
  --base main \
  --title "chore: add email to CITATION.cff author block" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/citation_fix/lutar-lean_PR_BODY.md
```

---

### vsp-otel

```bash
SHA=$(gh api /repos/szl-holdings/vsp-otel/contents/CITATION.cff --jq '.sha')

gh api /repos/szl-holdings/vsp-otel/git/refs \
  --method POST \
  --field ref="refs/heads/chore/citation-email-vsp-otel" \
  --field sha="$(gh api /repos/szl-holdings/vsp-otel/git/ref/heads/main --jq '.object.sha')"

gh api /repos/szl-holdings/vsp-otel/contents/CITATION.cff \
  --method PUT \
  --field message="chore: add email to CITATION.cff author block" \
  --field content="$(base64 -w 0 /home/user/workspace/evolution_pod/fly_v7/citation_fix/vsp-otel_CITATION.cff)" \
  --field sha="$SHA" \
  --field branch="chore/citation-email-vsp-otel"

gh pr create \
  --repo szl-holdings/vsp-otel \
  --head chore/citation-email-vsp-otel \
  --base main \
  --title "chore: add email to CITATION.cff author block" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/citation_fix/vsp-otel_PR_BODY.md
```

---

### agi-forecast

```bash
SHA=$(gh api /repos/szl-holdings/agi-forecast/contents/CITATION.cff --jq '.sha')

gh api /repos/szl-holdings/agi-forecast/git/refs \
  --method POST \
  --field ref="refs/heads/chore/citation-email-agi-forecast" \
  --field sha="$(gh api /repos/szl-holdings/agi-forecast/git/ref/heads/main --jq '.object.sha')"

gh api /repos/szl-holdings/agi-forecast/contents/CITATION.cff \
  --method PUT \
  --field message="chore: add email to CITATION.cff author block" \
  --field content="$(base64 -w 0 /home/user/workspace/evolution_pod/fly_v7/citation_fix/agi-forecast_CITATION.cff)" \
  --field sha="$SHA" \
  --field branch="chore/citation-email-agi-forecast"

gh pr create \
  --repo szl-holdings/agi-forecast \
  --head chore/citation-email-agi-forecast \
  --base main \
  --title "chore: add email to CITATION.cff author block" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/citation_fix/agi-forecast_PR_BODY.md
```

---

### .github

> **Note:** The `.github` repo has `email:` in its `contact:` block already. This PR adds it to `authors:` to match the org-wide standard.

```bash
SHA=$(gh api /repos/szl-holdings/.github/contents/CITATION.cff --jq '.sha')

gh api /repos/szl-holdings/.github/git/refs \
  --method POST \
  --field ref="refs/heads/chore/citation-email-.github" \
  --field sha="$(gh api /repos/szl-holdings/.github/git/ref/heads/main --jq '.object.sha')"

gh api /repos/szl-holdings/.github/contents/CITATION.cff \
  --method PUT \
  --field message="chore: add email to CITATION.cff author block" \
  --field content="$(base64 -w 0 /home/user/workspace/evolution_pod/fly_v7/citation_fix/.github_CITATION.cff)" \
  --field sha="$SHA" \
  --field branch="chore/citation-email-.github"

gh pr create \
  --repo szl-holdings/.github \
  --head "chore/citation-email-.github" \
  --base main \
  --title "chore: add email to CITATION.cff author block" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/citation_fix/.github_PR_BODY.md
```

---

## 5. Change Summary (what was added to each file)

**For repos with `preferred-citation` block** (amaru, a11oy, sentra, terra, vessels, counsel, carlota-jo, ouroboros, ouroboros-thesis, lutar-lean):
- Added `email: stephen@szlholdings.com` under the `authors:` list item
- Added `email: stephen@szlholdings.com` under the `preferred-citation.authors:` list item
- Position: after `name-particle: P.`, before `affiliation:`

**For repos without `preferred-citation` block** (vsp-otel, agi-forecast):
- Added `email: stephen@szlholdings.com` under the `authors:` list item
- Position: after `name-particle: P.`, before `affiliation:`

**For `.github`** (has `contact:` block):
- Added `email: stephen@szlholdings.com` under the `authors:` list item
- Position: after `name-particle: P.`, before `affiliation:`
- Existing `contact:` block with email was preserved unchanged

---

## 6. Forbidden Pattern Compliance Check

All 13 drafted files verified free of forbidden patterns:
- ❌ "Jr." — not present in any file
- ❌ "AlloyScape" — not present
- ❌ "Glass Wing" / "Glasswing" — not present
- ❌ "Mythos" — not present
- ❌ "Stephen Paul" — not present (uses `given-names: Stephen` + `name-particle: P.`)
- ❌ "Perplexity Computer" — not present
- ❌ "anonymous" — not present

Byline format used throughout: `family-names: Lutar` / `given-names: Stephen` / `name-particle: P.`

---

*Report generated by FLY V7 — CITATION.cff FIX SPECIALIST. No mutations made to live repos.*
