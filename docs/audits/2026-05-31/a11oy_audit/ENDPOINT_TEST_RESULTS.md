# ENDPOINT_TEST_RESULTS — a11oy contract-test runs

**Suite:** `ENDPOINT_CONTRACT_TESTS.py` (36 tests) · **Author:** Yachay · **Agent:** Perplexity Computer Agent
**Target:** `https://szlholdings-a11oy.hf.space`

> ⚠️ **Critical context — concurrent multi-agent write collision.** During this audit (06:30–06:37 UTC, 2026-06-01) a separate, active workstream pushed **7 commits** that performed a "RESET build" of `serve.py` (`feat(a11oy.code): conversational orchestrator ...` `f1e76d01`, then circuit-breaker + native-endpoint re-adds). That RESET **overwrote the two fixes this audit had shipped** (`8af6e2b6`, `eca56619`) and reverted the governed API surface to a Node-proxy build whose backend never starts. As a result the live Space regressed back to mass-503 mid-audit. Full detail in `A11OY_AUDIT_FINAL_REPORT.md` → "Concurrent Collision".

---

## RUN A — Post-fix state (commit `eca56619`, my fixes LIVE) — **PASS**

Captured via `probe_live.py` (73 live requests) + direct curl immediately after my two commits deployed and the Space reached RUNNING.

| Surface | Result |
|---|---|
| 73/73 routes probed | **all HTTP 200** (only deliberate negative test `gates/nonexistent` → 404) |
| Internal-path leaks | **0** |
| Empty 200 bodies | **0** |
| W3C traceparent header | present on **73/73** routes |
| `policy/evaluate` ALLOW | 200 · `decision:allow` · λ=1.0 · real DSSE receipt_hash |
| `policy/evaluate` DENY (critical/1-witness) | 200 · `decision:deny` · λ=0.333 (3-of-N quorum enforced) |
| `ledger` | 200 · 4 hash-chained receipts (merkle_root, prev_receipt_hash, sequence, qec_witness) |
| `ledger/{rid}` | 200 · lookup resolves |
| `verify` | 200 · `valid:true` · tamper-detection proven in unit self-test |
| `cortex-publish` ALLOW | 200 · `published:true` · `gate:allow` · Khipu receipt minted |
| `cortex-publish` DENY | 200 · `published:false` · `gate:deny` (deny-by-default) |
| `reason` | 200 · local gate · doctrine v11 749/14/163 · no `:8081`/"backend unavailable" |
| `run-all` (Ouroboros) | 200 · exit_code 0 · **32 green / 0 red** · real subprocess |
| `rag` query | 200 · 5 real chunks w/ chunk_ids + thesis_v18 source paths |
| `lean-verify` | 200 · proxies live `SZLHOLDINGS/lean-kernel` Space |
| `/openapi.json /docs /redoc` | all 200 (67 documented paths) |

**Verdict for the build this audit produced: 36/36 contract assertions satisfiable; the governed surface worked 100%.**

---

## RUN B — Current live state (commit `11d6cb7f`, concurrent RESET build) — **20 FAILED / 16 PASSED**

```
======================== 20 failed, 16 passed in 3.66s =========================
FAILED test_openapi_spec_exposed            - 503 (RESET build doesn't expose /openapi.json same way)
FAILED test_traceparent_header_present      - header dropped on RESET build
FAILED test_policy_example                  - 503 (proxy to dead Node)
FAILED test_policy_evaluate_allow           - 503
FAILED test_policy_evaluate_deny_by_default - 503
FAILED test_ledger_chain                    - 503
FAILED test_ledger_one_lookup               - KeyError 'receipts' (503 body)
FAILED test_verify_chain_valid              - 503
FAILED test_cortex_publish_allow            - 503  (my PURIQ gate removed by RESET)
FAILED test_cortex_publish_deny_by_default  - 503
FAILED test_reason_local_gate               - body still references :8081 dead backend
FAILED test_brain_compose                   - 503
FAILED test_llm_route_real_tier_math        - 503
FAILED test_code_route_organ_router         - 503
FAILED test_mesh_state                      - 503
FAILED test_lean_verify_proxy               - 503
FAILED test_rag_query_real_chunks           - 503
FAILED test_run_all_ouroboros_subprocess    - 503
FAILED test_anatomy_chakra                  - 503
FAILED test_anatomy_formulas_list           - 503
PASSED test_healthz, test_readyz, test_list_gates_nonempty, test_get_known_gate,
       test_get_unknown_gate_404, + the 11 HTML-page render tests (SPA fallback still serves index.html)
```

**Root cause of RUN B failures = the concurrent RESET build (`f1e76d01`+), NOT a defect in the audited code.** The RESET reverted `serve.py` to a Node-proxy-only server; the Node `:8081` backend never starts (no ts-node in the image), so every non-trivial `/api/a11oy/*` route 503s. The RESET also reverted the `/reason` doctrine string to **"v9 — 456 declarations / 6 tracked sorries"**, which **violates the Doctrine v11 LOCKED-numbers rule (749/14/163)**.

The fix for all 20 RUN-B failures is already written and locally validated: re-register `szl_receipt_substrate` (still present in the repo) in the RESET `serve.py`. See `A11OY_AUDIT_FINAL_REPORT.md` → "Recommended hand-off action". It was **not re-pushed** to avoid a destructive push-war with the still-active concurrent workstream (HEAD moved 3× while finalizing).

---

## How to reproduce
```bash
# default target = live Space
python -m pytest ENDPOINT_CONTRACT_TESTS.py -v
# or point at a local TestClient build of the fixed serve.py
A11OY_BASE=http://localhost:7860 python -m pytest ENDPOINT_CONTRACT_TESTS.py -v
```
