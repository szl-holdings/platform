# Hygiene Fix Report — FLY V7

**Author:** Lutar, Stephen P. · ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173) · SZL Holdings
**Contact:** stephen@szlholdings.com
**GitHub:** @stephenlutar2-hash
**Date:** 2026-05-17
**Status:** LOCAL DRAFTS ONLY — no live repo mutations

---

## Summary

Two repos were missing all 3 standard community health files each. This run drafted 6 files total (3 per repo), validated them against all identity and forbidden-pattern requirements, and prepared PR bodies for 2 proposed pull requests.

**Repos addressed:**
- `szl-holdings/vsp-otel`
- `szl-holdings/agi-forecast`

**Files per repo:**
- `SECURITY.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`

---

## Drafted File Inventory

### szl-holdings/vsp-otel

| File | Path | Lines | Key Attributes |
|---|---|---|---|
| `SECURITY.md` | `evolution_pod/fly_v7/hygiene/vsp-otel/SECURITY.md` | 59 | 72 h SLA, stephen@szlholdings.com, PGP optional, CVSS v3.1, vsp-otel scope (receipt hashing, Λ-gate span emission, ρ-closure) |
| `CONTRIBUTING.md` | `evolution_pod/fly_v7/hygiene/vsp-otel/CONTRIBUTING.md` | 100 | DCO sign-off, GPG-signed commits, doctrine-V6 Λ ≥ 0.90, Apache-2.0/MIT/BSD-3/CC-BY only, PR template, review by @stephenlutar2-hash |
| `CODE_OF_CONDUCT.md` | `evolution_pod/fly_v7/hygiene/vsp-otel/CODE_OF_CONDUCT.md` | 53 | Contributor Covenant v2.1, enforcement contact stephen@szlholdings.com |
| `PR_BODY.md` | `evolution_pod/fly_v7/hygiene/vsp-otel/PR_BODY.md` | 39 | Proposed PR description |

### szl-holdings/agi-forecast

| File | Path | Lines | Key Attributes |
|---|---|---|---|
| `SECURITY.md` | `evolution_pod/fly_v7/hygiene/agi-forecast/SECURITY.md` | 59 | 72 h SLA, stephen@szlholdings.com, PGP optional, CVSS v3.1, agi-forecast scope (gauge provenance, forecast receipts, Brier-score ledger) |
| `CONTRIBUTING.md` | `evolution_pod/fly_v7/hygiene/agi-forecast/CONTRIBUTING.md` | 100 | DCO sign-off, GPG-signed commits, doctrine-V6 Λ ≥ 0.90, Apache-2.0/MIT/BSD-3/CC-BY only, PR template, review by @stephenlutar2-hash |
| `CODE_OF_CONDUCT.md` | `evolution_pod/fly_v7/hygiene/agi-forecast/CODE_OF_CONDUCT.md` | 53 | Contributor Covenant v2.1, enforcement contact stephen@szlholdings.com |
| `PR_BODY.md` | `evolution_pod/fly_v7/hygiene/agi-forecast/PR_BODY.md` | 39 | Proposed PR description |

---

## Diff Summary

All 6 files are **net-new additions** (no deletions, no modifications to existing files).

### vsp-otel
```
+ SECURITY.md        (59 lines)  — vulnerability reporting, 72 h SLA, PGP optional
+ CONTRIBUTING.md   (100 lines)  — DCO, signed commits, Λ ≥ 0.90, PR template
+ CODE_OF_CONDUCT.md (53 lines)  — Contributor Covenant v2.1
```

### agi-forecast
```
+ SECURITY.md        (59 lines)  — vulnerability reporting, 72 h SLA, PGP optional
+ CONTRIBUTING.md   (100 lines)  — DCO, signed commits, Λ ≥ 0.90, PR template
+ CODE_OF_CONDUCT.md (53 lines)  — Contributor Covenant v2.1
```

---

## Validation Results

### Forbidden Pattern Check (8 patterns)

| Pattern | vsp-otel files | agi-forecast files |
|---|---|---|
| `Jr.` | PASS — not found | PASS — not found |
| `AlloyScape` | PASS — not found | PASS — not found |
| `Glass Wing` | PASS — not found | PASS — not found |
| `Glasswing` | PASS — not found | PASS — not found |
| `Mythos` (outside Anthropic) | PASS — not found | PASS — not found |
| `Stephen Paul` | PASS — not found | PASS — not found |
| `Perplexity Computer` | PASS — not found | PASS — not found |
| `anonymous` | PASS — not found | PASS — not found |

### Identity Check

| Requirement | SECURITY.md | CONTRIBUTING.md | CODE_OF_CONDUCT.md |
|---|---|---|---|
| Author byline `Lutar, Stephen P.` | PASS | PASS | N/A (community doc) |
| ORCID `0009-0001-0110-4173` | PASS | PASS | N/A |
| Email `stephen@szlholdings.com` | PASS | PASS | PASS |

---

## Style Notes

Files were adapted from `szl-holdings/ouroboros` and `szl-holdings/sentra` equivalents (both verified to carry all 3 hygiene files). Key differences from sibling repos:

1. **Contact email in SECURITY.md:** Changed from `security@szlholdings.com` (ouroboros/sentra) to `stephen@szlholdings.com` per task specification.
2. **Response SLA:** Explicit **72 h** acknowledgement SLA added to SECURITY.md (sibling repos reference "2 business days" — here the task requires 72 h).
3. **CONTRIBUTING.md model:** Upgraded from source-available/proprietary (ouroboros/sentra model) to open-source Apache-2.0 contribution model, matching the `Apache-2.0` license declared in each repo's `CITATION.cff`.
4. **Doctrine-V6 gate:** Added `Λ ≥ 0.90` conjunctive threshold and 9-axis Λ-vector PR template field — not present in sibling repos.
5. **Scope sections in SECURITY.md:** Repo-specific language distinguishing vsp-otel (receipt hashing, Λ-gate span emission, ρ-closure) vs agi-forecast (gauge provenance, forecast receipts, Brier-score ledger).

---

## Proposed PR Commands

**IMPORTANT: These commands push to live repos. Run only after explicit confirmation.**

### PR 1 — szl-holdings/vsp-otel

```bash
# Step 1: Clone and create branch
gh repo clone szl-holdings/vsp-otel /tmp/vsp-otel-hygiene
cd /tmp/vsp-otel-hygiene
git checkout -b chore/add-hygiene-files

# Step 2: Copy drafted files
cp /home/user/workspace/evolution_pod/fly_v7/hygiene/vsp-otel/SECURITY.md .
cp /home/user/workspace/evolution_pod/fly_v7/hygiene/vsp-otel/CONTRIBUTING.md .
cp /home/user/workspace/evolution_pod/fly_v7/hygiene/vsp-otel/CODE_OF_CONDUCT.md .

# Step 3: Commit (GPG-sign + DCO sign-off)
git add SECURITY.md CONTRIBUTING.md CODE_OF_CONDUCT.md
git commit -S -s -m "chore: add SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md

Add three standard community health files per FLY V7 hygiene remediation.
Closes GitHub Community Standards checklist gaps.

Signed-off-by: Lutar, Stephen P. <stephen@szlholdings.com>"

# Step 4: Push and open PR
git push origin chore/add-hygiene-files

gh pr create \
  --repo szl-holdings/vsp-otel \
  --base main \
  --head chore/add-hygiene-files \
  --title "chore: add SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/hygiene/vsp-otel/PR_BODY.md \
  --reviewer stephenlutar2-hash
```

### PR 2 — szl-holdings/agi-forecast

```bash
# Step 1: Clone and create branch
gh repo clone szl-holdings/agi-forecast /tmp/agi-forecast-hygiene
cd /tmp/agi-forecast-hygiene
git checkout -b chore/add-hygiene-files

# Step 2: Copy drafted files
cp /home/user/workspace/evolution_pod/fly_v7/hygiene/agi-forecast/SECURITY.md .
cp /home/user/workspace/evolution_pod/fly_v7/hygiene/agi-forecast/CONTRIBUTING.md .
cp /home/user/workspace/evolution_pod/fly_v7/hygiene/agi-forecast/CODE_OF_CONDUCT.md .

# Step 3: Commit (GPG-sign + DCO sign-off)
git add SECURITY.md CONTRIBUTING.md CODE_OF_CONDUCT.md
git commit -S -s -m "chore: add SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md

Add three standard community health files per FLY V7 hygiene remediation.
Closes GitHub Community Standards checklist gaps.

Signed-off-by: Lutar, Stephen P. <stephen@szlholdings.com>"

# Step 4: Push and open PR
git push origin chore/add-hygiene-files

gh pr create \
  --repo szl-holdings/agi-forecast \
  --base main \
  --head chore/add-hygiene-files \
  --title "chore: add SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md" \
  --body-file /home/user/workspace/evolution_pod/fly_v7/hygiene/agi-forecast/PR_BODY.md \
  --reviewer stephenlutar2-hash
```

---

## Full Workspace Path Index

```
/home/user/workspace/evolution_pod/fly_v7/hygiene/
├── HYGIENE_FIX_REPORT.md              ← this file
├── vsp-otel/
│   ├── SECURITY.md
│   ├── CONTRIBUTING.md
│   ├── CODE_OF_CONDUCT.md
│   └── PR_BODY.md
└── agi-forecast/
    ├── SECURITY.md
    ├── CONTRIBUTING.md
    ├── CODE_OF_CONDUCT.md
    └── PR_BODY.md
```

---

*Generated by FLY V7 Hygiene Fix Specialist — NO LIVE REPO MUTATIONS MADE*
