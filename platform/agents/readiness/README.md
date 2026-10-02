# SZL Production-Readiness Agent Fleet

Eight self-contained readiness agents that continuously prove the SZL governed-AI
mesh is production-ready — and a ninth role, the **verifier of verifiers**, that
re-checks the other eight so no agent can fake a green.

Doctrine **v11 (LOCKED): 749 / 14 / 163** (declarations / unique axioms / tracked
sorries). Author: **Yachay <yachay@szlholdings.dev>**.

> Built per the Production-Readiness Process research report. **Additive only** —
> these agents are read-only against flagships and repos; they never mutate them.

## The fleet

| # | Agent | Cadence | Emits |
|---|-------|---------|-------|
| 1 | [`readiness-reliability`](./readiness-reliability/) | hourly | GREEN/AMBER/RED per flagship (healthz, khipu/sign, p99) |
| 2 | [`readiness-security`](./readiness-security/) | hourly | per-repo control verdict + missing-controls list |
| 3 | [`readiness-observability`](./readiness-observability/) | hourly | Wire D trace-continuity matrix |
| 4 | [`readiness-operability`](./readiness-operability/) | daily | per-flagship operability score (0..4) |
| 5 | [`readiness-compliance`](./readiness-compliance/) | daily | NIST AI RMF + EU AI Act Art. 12 matrix |
| 6 | [`readiness-docs`](./readiness-docs/) | daily | per-repo docs completeness score (0..7) |
| 7 | [`readiness-dr`](./readiness-dr/) | daily | backup-and-restore proof receipts |
| 8 | [`readiness-audit-rift`](./readiness-audit-rift/) | daily (last) | meta-audit: flags any over-claiming agent |

### Schedule (UTC)
- **Hourly**: reliability `0 * * * *`, security `20 * * * *`, observability `40 * * * *`.
- **Daily**: operability `30 3`, compliance `10 4`, docs `30 4`, dr `10 5`.
- **Daily, after the others** (`10 6`): audit-rift — so it always sees fresh peer receipts.
- All eight share one per-asset lock, `hf-write/dataset/SZLHOLDINGS/readiness-runs`.
  GitHub cancels a pending run only when a third run joins the group, so start
  times are kept at least 10 minutes apart (`_lib/test_khipu_publish.py` enforces this).

## Layout
```
platform/agents/readiness/
├── README.md                 ← you are here
├── dashboard.html            ← green/amber/red matrix (reads readiness-runs)
├── _lib/khipu.py             ← shared: registry, Khipu signing, HF publish
├── readiness-<name>/
│   ├── prompt.md             ← the agent's task prompt
│   ├── executor.py           ← Python entry point (wraps the invocation)
│   └── README.md             ← what it does / when it runs / what it emits
└── (workflows live at .github/workflows/<name>.yml)
```
Each agent's GitHub Actions workflow is shipped at
`.github/workflows/readiness-<name>.yml` (one cron-scheduled job per agent).

## Receipts
Every run emits a **Khipu receipt** — a DSSE-style envelope over a canonical JSON
payload, Ed25519-signed with the fleet key (`KHIPU_SIGNING_KEY_B64`). Receipts are
appended to the runs dataset:

```
SZLHOLDINGS/readiness-runs
  receipts/<agent>/<UTC-date>/<UTC-timestamp>.json
  dr-dumps/<flagship>/<ts>.ndjson      (READINESS-DR backups)
```

If the signing key is absent or invalid, the envelope is honestly marked
`signed:false` and is **not uploaded**. A receipt signed by a different key is
also rejected against the configured fleet signing key — never a fabricated signature (Doctrine
v11 LOCKED 749/14/163 §2 anti-fake-green). If `HF_TOKEN` is absent or rejected,
`published:false` is recorded. Inside GitHub Actions either signing or
publication failure fails the run (`khipu.require_published`); a successful
run proves transport of a verified signed receipt, not that every runtime
probe passed. A local run without credentials remains unsigned/unpublished and
prints a warning.

## Dashboard
`dashboard.html` is a static, read-only viewer. It lists the latest receipt for
each agent from `SZLHOLDINGS/readiness-runs`. Because no trusted public signer
key is pinned in the browser, it marks fetched verdicts and signing claims
`UNVERIFIED` even if the receipt asserts GREEN and `signed:true`. The audit-rift
agent separately verifies peer receipts against its configured fleet key.
Open the dashboard directly, or host it on the docs site. No build step or
browser secret is needed; it only reads public dataset files.

## Running locally
```bash
pip install huggingface_hub pynacl
export HF_TOKEN=...                  # to publish receipts
export KHIPU_SIGNING_KEY_B64=...     # 32-byte ed25519 seed, base64 (to sign)
export A11OY_URL=... AMARU_URL=... SENTRA_URL=... KILLINCHU_URL=... ROSIE_URL=...
export OTEL_COLLECTOR_URL=...        # for observability
python platform/agents/readiness/readiness-reliability/executor.py
```
With no env set, each agent still runs and emits an honest `SKIPPED` /
unsigned, unpublished receipt — useful for local dry-runs, not a passing
GitHub Actions readiness result.

## Required GitHub configuration
- **Secrets**: `HF_TOKEN`, `KHIPU_SIGNING_KEY_B64`.
- **Variables**: `A11OY_URL`, `AMARU_URL`, `SENTRA_URL`, `KILLINCHU_URL`,
  `ROSIE_URL`, `OTEL_COLLECTOR_URL`.

## Honesty contract
1. **NO FABRICATION** — missing inputs → `SKIPPED`/`NO-RECEIPT`, not green.
2. **ADDITIVE / read-only** — agents never write to flagships or other repos.
3. **Independently audited** — agent 8 re-derives a sample of every claim.
4. **Doctrine v11 verbatim** — 749/14/163, stamped into every receipt.

---
Author: **Yachay <yachay@szlholdings.dev>** · Doctrine v11 (LOCKED) · 749/14/163
