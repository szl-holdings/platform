# Fly V7 — Replit Payload (machine-to-machine handoff)

**Mission:** Doctrine Sweep V2 + Hygiene Fix + BP Fix + CITATION.cff Fix + PR Triage on `szl-holdings` GitHub org.
**Operator:** Lutar, Stephen P. — ORCID 0009-0001-0110-4173 — SZL Holdings.
**Status:** All 5 specialists landed. Zero live-repo mutations. Per-item `confirm_action` required for every push.

---

## Directory layout

```
00_README/                          ← entry point (this file + PM rollup)
  README.md
  PM_OVERWATCH_FLY_V7_ROLLUP.md
01_doctrine/                        ← immutable doctrine V6 spec
  DOCTRINE_V6.md
02_specialists/                     ← outputs from the 5 specialists
  doctrine/    doctrine_sweep_v2_report.md
  hygiene/     HYGIENE_FIX_REPORT.md + per-repo SECURITY/CONTRIBUTING/COC + PR bodies
  bp_fix/      BP_FIX_REPORT.md + 6 PUT payloads + workflow snapshots
  citation_fix/ CITATION_FIX_REPORT.md + 13 drafted CITATION.cff + PR bodies
  pr_triage/   PR_TRIAGE_REPORT.md + all_prs_final.json + raw per-repo JSON
03_manifests/                       ← MANIFEST.json (file hashes, totals, summary)
04_thread_context/                  ← THREAD_TRANSCRIPT.md (user messages + prior sessions)
05_apply_scripts/                   ← bash scripts to execute each tier
```

---

## Headline numbers

| Metric | Value |
|---|---|
| Files scanned for doctrine | 582 |
| Local auto-fixes applied | 10 |
| Live-repo doctrine escalations | 30+ |
| Hygiene files drafted | 6 |
| BP PUT payloads ready | 6 |
| CITATION.cff drafts ready | 13 |
| Open PRs triaged | 68 |
| MERGE candidates | 12 (Dependabot) |
| CLOSE candidates (doctrine) | 18 |

---

## Execution order

1. Read `00_README/PM_OVERWATCH_FLY_V7_ROLLUP.md` — full executive summary, risk register, tier definitions.
2. Confirm the 3 pending PM decisions (Glasswing/Mythos, BP review-count, GitHub display name).
3. Use `05_apply_scripts/` in numeric order. Each script requires `confirm_action`. Scripts 01–02 need PR numbers filled from `02_specialists/pr_triage/all_prs_final.json` first.
4. Per-action verification belongs in `02_specialists/{specialist}/*REPORT.md`.

---

## Doctrine V6 (immutable — see `01_doctrine/DOCTRINE_V6.md`)

- Byline: `Lutar, Stephen P.` — never `Jr.`, never `Stephen Paul`
- ORCID: `0009-0001-0110-4173`
- Replay root: `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b`
- 9-axis Λ-gate ≥ 0.90, moralGrounding + measurabilityHonesty ≥ 0.95
- Public-only ingestion; license allowlist: Apache-2.0 / MIT / BSD-3 / CC-BY
- 8 forbidden text patterns (Mythos exception: third-party Anthropic model name only)
- **User override preserved:** historical git author "Stephen Paul Lutar Jr." on 75 commits is intentional and NOT remediated

---

## Standing stop-gates (always require explicit confirm_action)

- Zenodo DOI mint
- arXiv submission
- npm publish if version exists
- Branch protection edits (each one)
- New schedule_cron
- Force push to default branch
- Any push to live `szl-holdings/*` repository

---

## Provenance

- Generated: 2026-05-15 (EDT)
- Manifest: `03_manifests/MANIFEST.json` includes SHA-256 of every file
- Companion payload: prior `szl_holdings_replit_payload.zip` (921 KB, SHA-256 `0b06aac45b19f3e6d3af281d1ed7f3d90429da23912da621fc7bbc919b0f45d9`) covers thesis/runtime/AGI/ops context
