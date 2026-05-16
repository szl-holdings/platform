# SZL Holdings — Replit Payload

**Author:** Lutar, Stephen P. · ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173) · SZL Holdings
**Generated:** 2026-05-15
**Replay root:** `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b`
**License:** CC-BY-4.0 (text) + Apache-2.0 (code)

---

## Machine-to-Machine Handoff

This is a complete machine-readable payload of the SZL Holdings stack: thesis lineage TH1–TH8, ouroboros runtime, V5 evolution (VSP + Forecast Gauge), 16-repo GitHub org inventory, and operations.

## Entry Points

| File | Purpose |
|---|---|
| `payload.json` | Master payload — schema, identity, doctrine, component map, file integrity (SHA-256 for every file) |
| `dev1_thesis/thesis_payload.json` | TH1–TH8 lineage, theorems verbatim, arXiv + Zenodo packages |
| `dev2_runtime/runtime_payload.json` | 8-region anatomy, 13-DOI ledger, benchmarks, clone URLs |
| `dev3_agi_v5/agi_v5_payload.json` | V5 proposal, VSP spec, Forecast Gauge (12 gauges), 60-leader recon |
| `dev4_ops/ops_payload.json` | 5 crons, credentials, connectors, Anthropic apps, push queue |
| `github_pro/github_inventory.json` | 16-repo full audit (metadata, BP, CI, scorecard, alerts, hygiene) |
| `github_pro/clone_manifest.json` | Clone URLs + latest SHAs (use this to materialize repos in Replit) |
| `github_pro/github_audit_report.md` | Human-readable narrative audit |

## How to Consume (Machine)

```python
import json

with open('payload.json') as f:
    master = json.load(f)

# Each component points to its own sub-payload
for name, comp in master['components'].items():
    with open(comp['payload_file']) as f:
        sub = json.load(f)
    print(f"{name}: {comp['description']}")
```

## File Integrity

`payload.json` contains a `file_integrity` map with SHA-256 + size for every file in this bundle (312 files, ~3.4 MB). Verify any file with:

```bash
sha256sum <file>
# compare to file_integrity[<relative_path>].sha256 in payload.json
```

## Component Owners

- **PM-Lead** — Lutar, Stephen P. — orchestration + final assembly
- **GitHub Pro** — 16-repo inventory + audit
- **Dev-1 Thesis** — TH1–TH8 packaging
- **Dev-2 Runtime** — ouroboros stack + anatomy + DOI ledger
- **Dev-3 AGI/V5** — V5 + VSP + Forecast Gauge + recon
- **Dev-4 Ops** — crons, credentials, applications, merge logs

## Doctrine V6

| Field | Value |
|---|---|
| Byline canonical | Lutar, Stephen P. |
| ORCID | 0009-0001-0110-4173 |
| License allowlist | Apache-2.0 · MIT · BSD-3-Clause · CC-BY-4.0 |
| Ingestion policy | PUBLIC_ONLY |
| Byte-identical replays | 5 |
| Λ axes | 9 (conjunctive AND) |
| Λ floor | 0.90 |
| moralGrounding floor | 0.95 |
| measurabilityHonesty floor | 0.95 |

## Push Queue Status

**Ready (one-way doors, awaiting confirm_action):**
- `PUSH_2_ZENODO_MINT` — v14 deposit
- `PUSH_1_ARXIV_SUBMIT` — SHA `13ca4a06...`

**Blocked:**
- `PUSH_4_OUROBOROS_v6_4_0_rc` — TS runtime code not implemented
- `PUSH_6_NPM_PUBLISH_a11oy_knowledge` — npm token not in env

## Anthropic Applications

- **Regular role** — READY (326w "Why Anthropic" + 185w cover note)
- **Fellows (Sept 2026 Berkeley)** — 97% ready, blocked on 3 references for Q7–Q9

## Active Crons (5)

| ID | Schedule (UTC) | Name |
|---|---|---|
| `488505a8` | `0 11 * * *` | daily_health_pulse |
| `6a09e1d2` | `0 13 * * 1,4` | scorecard_remediate |
| `ab29919e` | `0 13 1 * *` | series_a_deep_audit |
| `cd08b398` | `0 13 * * 2,5` | scorecard_verify |
| `fff8f098` | `0 12 * * 1` | series_a_hygiene |

---

**Verified:** 2026-05-15 · **Replay-root:** `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b`
