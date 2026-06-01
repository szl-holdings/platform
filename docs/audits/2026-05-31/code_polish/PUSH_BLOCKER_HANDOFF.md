# Code-Polish Push — BLOCKED on Sandbox OOM (handoff for parent agent)

**Author:** Yachay / Perplexity Computer Agent
**Time:** 2026-06-01 ~07:06 EDT

## TL;DR
All fixes are READY and VALIDATED locally. The **push is blocked by a hard
environmental OOM condition**, not by any code problem. Every forked process —
including `huggingface_hub`, `curl`, a stdlib-only `urllib` script, and even
bare `true`/`sleep`/`grep` — is being **SIGKILLed by the OOM killer**.

## Root cause (measured, not guessed)
`/proc/meminfo` at the time of the block:
- MemTotal: 8,157,072 kB (~8 GB)
- **MemFree: ~116 MB**
- **MemAvailable: ~343 MB**
- Cached: ~6.8 GB

A co-resident **Kubernetes "szl-airgap" cluster** is consuming the memory:
`kube-apiserver` (~253 MB RSS), `kube-controller-manager` (~103 MB),
`kubelet` (~93 MB), `kube-scheduler` (~64 MB), `containerd` (~58 MB),
`etcd` (~46 MB), plus `envd` (~206 MB). Combined with the `asi-supervise`
wrapper, there is essentially zero headroom. New processes are OOM-killed
on fork/exec. I could **not** drop caches (not root) and `pkill` itself
was killed mid-run.

This is non-deterministic: trivial commands sometimes succeed in a brief
low-pressure window (e.g. `gen_edits_spec.py` and one `whoami` succeeded),
but burst memory needs (any non-trivial import) reliably trigger the killer.

## What IS done and ready (no further compute needed)
- `edits_spec.json` — **GENERATED** (24,573 bytes). Contains all surgical
  (old,new) string pairs for BUG-1..4 + reliability logging + dead-code/style,
  keyed per flagship. Verified written.
- `/tmp/clean_<flagship>/` trees — **PRESENT and survived** (a11oy, amaru,
  sentra, killinchu, rosie). All additive files confirmed on disk:
  - every flagship: `pyproject.toml`, `.pre-commit-config.yaml`,
    `tests/test_live_wires_async.py`
  - a11oy/amaru/sentra/rosie: `tests/test_formulas.py`
  - a11oy only: `tests/test_receipt_substrate.py`
- `safe_push.py` — **READY**. Concurrency-safe: fetches current HEAD of each
  target file, applies idempotent string replacements, uploads ONLY changed
  files + additive files via a single `create_commit` per flagship (no full
  snapshot → cannot clobber concurrent edits). Loads `edits_spec.json`.
- HF token VALIDATED earlier this session: `whoami → betterwithage`
  (org SZLHOLDINGS). Token path: `.secret/hf_token`.

## The ONLY remaining action (when memory frees up)
Run, flagship-by-flagship to minimize peak memory:
```
cd .../code_polish
python3 safe_push.py a11oy
python3 safe_push.py amaru
python3 safe_push.py sentra
python3 safe_push.py killinchu
python3 safe_push.py rosie
```
Results (commit oid + head_after SHA per flagship) land in `push_results.json`.
Those SHAs feed the "HF SHA after push" column in `TOP_15_BUGS_FIXED.md`.

`lite_sha.py` (stdlib-only) can capture before-SHAs into `head_shas_before.json`
once a process can run.

## Recommended remediation for the OOM (for parent / founder)
The push cannot proceed while the szl-airgap K8s cluster is co-resident in
this 8 GB sandbox. Options:
1. **Pause/scale-down the K8s airgap cluster** (or run it elsewhere) to free
   ~600 MB+ of RSS, then re-run `safe_push.py`.
2. Run the push from a **separate sandbox/session** that is not co-located
   with the cluster (the clean trees + edits_spec are in the shared workspace
   under `code_polish/`, except `/tmp/clean_*` which is sandbox-local and may
   need regeneration via `redownload_clean.py` + `apply_fixes.py`).
3. Wait for a low-pressure window and retry per-flagship (works
   intermittently but unreliable).

## HARD RULES still in force for whoever runs the push
- HfApi DIRECT push, **NEVER GitHub Actions**.
- ADDITIVE only — preserve all GREEN routes.
- Doctrine v11 LOCKED numbers preserved (749/14/163 · 13-axis · replay
  `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5` ·
  A2=IsHomogeneous · A4=IsBounded · SLSA L1 · Λ-uniqueness Conjecture 1).
- Do NOT touch IP-HOLD PRs (a11oy#57, amaru#46, sentra#45).
- Sign as Yachay; "Perplexity Computer Agent" in git trailers.

## Remaining deliverable docs (blocked only on push SHAs, otherwise writable)
- `TOP_15_BUGS_FIXED.md` (needs HF SHAs from push_results.json)
- `STYLE_ENFORCEMENT_LOG.md`, `TYPE_SAFETY_LOG.md`, `DEAD_CODE_PURGE_LOG.md`,
  `PERFORMANCE_PROFILING_REPORT.md`, `TEST_COVERAGE_DELTA.md`,
  `POLISH_FINAL_REPORT.md`
These can be drafted now (content known) and have SHAs filled in post-push.
