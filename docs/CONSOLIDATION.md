# SZL Holdings GitHub Estate Consolidation Plan

> **Status: NOT APPLIED — founder-gated.** This document records a reversible proposal and an observed evidence snapshot. It does not authorize or perform any repository visibility, archive, rename, license, tag, release, branch-protection, or deletion change.

## Snapshot boundary

- **Observed at:** `2026-07-26T01:30:42.617Z`
- **Organization:** `szl-holdings`
- **MEASURED:** 57 repositories: 54 public, 3 private, 12 archived, and 45 active.
- **MEASURED:** every observed default branch was `main` and every repository had an exact 40-character default-head SHA.
- **Drift warning:** GitHub state may change after the observed timestamp. Any later execution workcell must refresh the complete inventory, exact heads, open pull requests, rulesets, and repository notices before proposing an action.

### Claim labels

- **MEASURED** — observed from the live GitHub API at an exact default-head SHA.
- **REPORTED** — stated by a repository README at the recorded head; not independently re-proven here.
- **MODELED** — a proposed estate disposition or substitution that still requires a founder decision.
- **UNKNOWN** — the named repository or sufficient evidence was absent from the observed inventory.

## Option B proposal — NOT APPLIED

Option B targets nine public survivor slots. Six slots are presently usable without a visibility or archive decision; three remain founder-gated.

| Slot | Observed repository | Observed state | Proposed disposition | Gate | Claim |
|---|---|---|---|---|---|
| Platform | `szl-holdings/platform` | public, active | KEEP | none beyond refreshed preflight | MEASURED |
| Command product | `szl-holdings/a11oy` | public, active | KEEP | none beyond refreshed preflight | MEASURED |
| Agent loop | `szl-holdings/ouroboros` | public, active | KEEP | none beyond refreshed preflight | MEASURED |
| Formal proof | `szl-holdings/lutar-lean` | public, active | KEEP | none beyond refreshed preflight | MEASURED |
| Trust | `szl-holdings/szl-trust` | public, archived; README reports migration to `docs-site` | decide unarchive or replace | **FOUNDER DECISION 1** | MODELED |
| Organization profile | `szl-holdings/.github` | public, active | KEEP | none beyond refreshed preflight | MEASURED |
| Cyber / SENTRA | exact `sentra` repository absent | `immune` is public-active and its description reports SENTRA/GATE admission | decide create, restore, or substitute `immune` | **FOUNDER DECISION 2** | MODELED |
| Defense / maritime | exact `vessels` repository absent; `killinchu` public-active | use payload-permitted `killinchu` substitution | refreshed preflight only | MEASURED |
| Revenue / insurance | exact `insurance` repository absent; `david-leads` private-active | decide disclosure or another public revenue-adjacent substitute | **FOUNDER DECISION 3** | MODELED |

### Founder decision record

| Decision | Allowed choices | Selected choice | Founder approval reference |
|---|---|---|---|
| 1 — trust slot | unarchive `szl-trust`; choose a different public-active trust surface; defer slot | **NOT DECIDED** | **REQUIRED** |
| 2 — SENTRA slot | create/restore `sentra`; substitute `immune`; choose another cyber surface; defer slot | **NOT DECIDED** | **REQUIRED** |
| 3 — revenue slot | authorize disclosure of `david-leads`; choose another public revenue surface; defer slot | **NOT DECIDED** | **REQUIRED** |

No decision may be inferred from this document or from an earlier broad authorization. Each selected choice must be recorded before an execution PR or organization-setting change begins.

## Evidence-supported replacement and mirror relationships

| # | From | To | Relationship | Evidence head | Claim |
|---:|---|---|---|---|---|
| 1 | `szl-holdings/developers` | `szl-holdings/docs-site` | README_DEPRECATED_MIGRATED_TO | `95b888c09bce8871353959250a5c5de6826a0af8` | REPORTED |
| 2 | `szl-holdings/szl-cookbook` | `szl-holdings/docs-site` | README_DEPRECATED_MIGRATED_TO | `ad3d958786fb4e6852991e5e5e98bd43cc109ef2` | REPORTED |
| 3 | `szl-holdings/szl-trust` | `szl-holdings/docs-site` | README_DEPRECATED_MIGRATED_TO | `1f021cc6204d3eea272e246a8d81405511e924a1` | REPORTED |
| 4 | `szl-holdings/governed-inference-meter` | `szl-holdings/szl-energy-attest` | README_DEPRECATED_CONSOLIDATED_INTO | `10e9a9fd4b762826b9c11bf8d212638d94c96555` | REPORTED |
| 5 | `szl-holdings/szl-governed-norm` | `szl-holdings/szl-lambda-gate` | README_DEPRECATED_CONSOLIDATED_INTO | `3ef27eb7ebf491b0a6ce69be170ecef4c37885a2` | REPORTED |
| 6 | `szl-holdings/szl-otel-mesh` | `szl-holdings/szl-mesh` | README_MOVED_TO_ACTIVE_SUCCESSOR | `172f52ecfc2cc7babac78bffde79517b38fcdb42` | REPORTED |
| 7 | `szl-holdings/platform:services/vsp-otel` | `szl-holdings/vsp-otel` | README_NON_CANONICAL_PARTIAL_MIRROR_OF | `ce7a37c35e7cfe84b36ea38f3dcd2ddaffb0b087` | REPORTED |
| 8 | `szl-holdings/szl-otel-mesh` | `szl-holdings/vsp-otel` | README_SUPERSEDED_BY | `ce7a37c35e7cfe84b36ea38f3dcd2ddaffb0b087` | REPORTED |

### OTel successor conflict

`szl-otel-mesh` reports `szl-mesh` as its active successor, while `vsp-otel` reports that `szl-otel-mesh` is superseded by `vsp-otel`. The `vsp-otel` README also reports `platform/services/vsp-otel` as a non-canonical partial mirror. Both exact-head README claims are retained. No canonical successor is selected until the owner or maintainers reconcile the conflict.

## Reversible execution design

This is a plan, not an execution record.

1. **Refresh and freeze evidence.** Re-query the 57-repository inventory, default heads, open PRs, branch rules, releases, issues, package consumers, and README notices. Stop on drift that changes a disposition.
2. **Resolve founder gates.** Record the three choices above and the OTel canonical-successor decision. A missing decision is a hard stop.
3. **Prepare per-repository proof.** For any future archive, visibility, or rename proposal, capture the previous setting, exact head, release/tag list, open PRs/issues, dependency consumers, replacement pointer, and a tested restoration command.
4. **Apply one reversible mutation per authorized workcell.** Do not batch unrelated settings. Never delete repositories or rewrite history.
5. **Verify and observe.** Re-run links, package consumers, CI, and organization inventory after every authorized change. Record actual outcomes separately from this proposal.

### Restoration command templates — documentation only

> **DO NOT RUN FROM THIS PR.** These templates exist solely for a future rollback packet after an authorized mutation. Replace angle-bracket placeholders with captured pre-change values and re-authenticate interactively.

```bash
# Restore an archived repository to its prior unarchived state.
gh api --method PATCH "repos/szl-holdings/<repo>" -f archived=false

# Restore the exact prior visibility recorded in the mutation proof packet.
gh api --method PATCH "repos/szl-holdings/<repo>" -f visibility='<public|private|internal>'

# Restore the exact prior repository name after an authorized rename.
gh api --method PATCH "repos/szl-holdings/<current-name>" -f name='<prior-name>'
```

Restoration does not guarantee that external links, package consumers, or integrations recover automatically; the rollback proof packet must verify those surfaces.

## Hard stops

- no deletion, transfer, history rewrite, or force-push;
- no visibility, archive, rename, license, tag, release, ruleset, or branch-protection change from this PR;
- no publication of `david-leads` or another private repository without a specific founder disclosure decision;
- no substitution inferred from name similarity alone;
- no successor selection while the OTel README conflict is unresolved;
- no execution against stale inventory or stale heads.

## Proof

The documentation proof packet is recorded at [audit/series-a-w2-consolidation-proof.md](../audit/series-a-w2-consolidation-proof.md).



