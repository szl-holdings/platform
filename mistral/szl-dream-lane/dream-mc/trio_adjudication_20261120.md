# Trio adjudication: house-the-400 on Massed Compute (round mc-20261120)

Date: 2026-11-20 ~21:50Z. Same ask, three rails, verbatim outputs preserved below.

Rails:
- Kimi (handler) = kimi-k3.1-pro:cloud via laptop Ollama, 63.8s, 3163 chars
- Mistral (parallel brain) = mistral-large-latest via estate deployment szl-dream-lane-worker, execution 7847f769b83858cea5de88ae937c5edd28cd90fd02b65ca0a18924750f8b8315, trace 22963a7c7ed333c6fe3820e994dd5a68, completed 21:49:48Z
- Astra (watcher seat, advisory) = treyleo16/gpt-6-astra:latest via laptop Ollama, 1.8s, 1819 chars
- GPT-6 watcher ruling (captured by sibling lap): house-400 = host + train stack400 on MC A6000 tier 1, Blackwell optional acceleration

## Ruling

**D1 (claim fencing) - UNANIMOUS: strictly additive claim files.** All three sided with the additive design over shared-file fencing: `claims/<run_id>/<model_index>.<worker_id>.attempt<N>.json`, no read-modify-write anywhere, index taken iff any claim file exists. Kimi fused her heartbeat/TTL in as diagnostic-only (a re-attempt after expiry is a NEW attempt<N+1> file; expiry never silently steals). Dedupe rule: group by model_index, max attempt N wins, tie resolved by lexicographically greatest worker_id with a DUPLICATE_CLAIM alert, conflicting payload/receipt fingerprints in the selected attempt mean QUARANTINE_INDEX (no content chosen silently). Falsifier: two-worker race plus killed-worker TTL rehearsal must reconstruct the same winner and alert on duplicates. Implemented in aggregate_claims.py; rehearsal verdict in rehearsal_receipt.jsonl.

**D2 (scale ladder) - UNANIMOUS: FUSE.** Ladder `1 -> 2x3 -> 5x4 -> 8-10 -> 15 -> 25 -> steady-to-400`, promotion only on verified receipts, the 8-10 step inserted (Mistral) to expose batch-commit breakage before the jump to 15. From 5x4 onward: local append + fsync before upload, one batch HF commit per cycle (per-model receipts inside one complete receipts.jsonl), TERM-trap flush, resume-from-local, commit plan must stay under ~320 HF commits/hour. Falsifiers: SIGTERM rehearsal losing a durable receipt stops promotion; HF commit failure rate over 10% stops promotion (Astra); a direct 5x4->15 run with zero failed commits and <60s local-to-HF lag over 30 min falsifies the 8-10 step as unnecessary (Mistral).

**D3 (watchdog) - UNANIMOUS: BUILD.** Mistral WATCHDOG_SPEC W1-W6, laptop-side, alert-only, GET-only, 30s poll, new standalone file, no writes to campaign code, claims, receipts, deployments or sibling config. Amendments adopted: stage-transition receipts are the only beacons (never per-poll commits, respects the 320/hr ceiling); W5 alerts only when active progress is expected; W6 critical; alert dedup at most 1 per 600s per key with recovery notices; no auto-remediation. Implemented in watchdog.py with fixture selftest exercising the same evaluate() used live. Second zero-spend artifact: aggregate_claims.py dry-run (Astra + Mistral), delivered together.

**MC first wave - 3/3 WAIT: `WAIT:HF_TOKEN,GATE_OWNER_SIGNOFF`.** No MC spend fires tonight. Converged shape in mc_first_wave_gate.json: one NEW A6000 spot from $0.35/hr and NOT the 4 running nodes (they are sibling production lanes: cuda-dev d1a50da9, high-ram 5e78da67, mcp-production-v7 4353a0cd, frontier-gate-1 072a4c0b). Kimi minority position (reuse 5e78da67 after exclusivity proof) overridden by no-stomp doctrine; Astra reuse-all position likewise. Wave = Step-B equivalent 2x3 six jobs, max 2 concurrent, worker v7 image digest pinned (PIN_PENDING). Hard ceiling $10 all-in, 4h runtime cap, auto-terminate on wall-clock AND spend, cleanup = terminate + delete volumes. Affordability: wave est $1.40-$4.00 <= $18.95 (balance $28.95 minus $10 reserve), auto-recharge never fires. Blockers: no scoped HF token with write:SZLHOLDINGS/stack400-runs exists (F5 zero-touch is insufficient), and the gate file needs the owner one-line signoff. Single owner action that flips WAIT to GO: mint the scoped HF token + sign the gate file. Next launch lap starts on one A6000 spot.

**Q4 joint next step (24h checkable):** scoped HF write token minted + mc-first-wave.json gate file signed, one canary additive claim-file write verified, then GO_MC_FIRST_WAVE. Parallel: this commit itself is the machine-readable adjudication record, with aggregate_claims.py + watchdog.py selftests green in rehearsal_receipt.jsonl.

## Verbatim rail outputs

### Kimi (handler, kimi-k3.1-pro:cloud) - 63.8s - 3163 chars

1. **D1-Fuse, with Mistral's storage model mandatory.** Use immutable, additive `claims/<run_id>/<model_index>.<worker_id>.attempt<N>.json`; no read-modify-write or CAS assumption. Add Kimi's heartbeat/TTL: only an unexpired claim at the greatest attempt blocks scheduling; expiry permits attempt `N+1`. Retain everything and alert on duplicates. **Aggregation:** group by `model_index`; select greatest `N`; within that attempt select the lexicographically smallest full claim path, then independently validate its receipt. If same-attempt payloads/receipt hashes conflict, or the selected receipt is invalid, quarantine that index-never silently choose content. **Falsifier:** a two-worker race plus killed-worker/TTL rehearsal fails if retained files cannot reconstruct the same winner or duplicate execution is not alerted.

   **D2-Fuse.** Ladder: `1 -> 2x3 -> 5x4 -> 8-10 -> 15 -> 25 -> steady-to-400`, promotion only on verified receipts. From `5x4`, append and fsync locally before upload; each batch HF commit contains per-model receipts plus one complete `receipts.jsonl` snapshot. Add TERM-trap flush and resume-from-local. **Falsifier:** SIGTERM during rehearsal loses any locally durable receipt, or the batch plan exceeds 320 HF commits/hour; either stops promotion.

   **D3-Side with Mistral:** W1-W6, 30-second polling, alert-only and read-only. **Falsifier:** synthetic fixtures for each W1-W6 condition produce any missed alert, false state mutation, or non-GET request.

2. **WAIT:OWNER_SPEND_CONSENT+SCOPED_HF_TOKEN+GATES.** Reuse **only instance `5e78da67` (2xA6000 96GB high-RAM)**, after proving ownership, idleness, and absence of sibling work; run **2 workers x 3 models**. Do not touch the production/frontier instances or buy a new SKU.

   Cost: **$0 new-instance spend**; measured account-wide burn remains **$2.85/hour**. A **2-hour bounded window** therefore costs **$5.70 gross existing-pool compute**, not wave-attributable marginal cost; storage/egress remain unmeasured.

   Minimum gates: explicit owner authorization; **$10 all-in hard ceiling**; verified budget immediately before launch; 2-hour workload self-termination; instance auto-terminate only if exclusivity is proven; pinned image digest/command; scoped least-privilege HF token with write test; ownership-scoped cleanup; no-sibling verification. Auto-recharge must be disabled unless separately authorized. **Affordability:** all committed costs must fit within **$18.95 = $28.95-$10 reserve**, without counting future recharges.

3. **Yes.** Vibe builds W1-W6 as a new standalone laptop watchdog file plus fixtures, without editing campaign code, claims, receipts, deployments, or sibling configuration. Amend W5 to alert only when active progress is expected; make W6 critical; add alert deduplication/recovery notices. No auto-remediation.

4. **Within 24 hours:** publish one joint commit and machine-readable rehearsal receipt covering claim race/TTL, SIGTERM batch recovery, deterministic aggregation, commit-rate projection, and all W1-W6 fixtures. Green means zero lost durable receipts, reproducible winners, and watchdog GET-only behavior; then reconsider GO.

### Astra (watcher seat, treyleo16/gpt-6-astra:latest) - 1.8s - 1819 chars

1. **D-Adjudication**
   - **D1 (Fencing):** Side with **Mistral**. Additive files `claims/<run_id>/<model_index>.<worker_id>.attempt<N>`. Aggregation Rule: Group by `model_index`, sort by `attempt` DESC, take top 1. Falsifier: Any observed `read-modify-write` collision or partial JSON write in shared files.
   - **D2 (Ladder):** Fuse. Follow Mistral's ladder (insert 8-10 rep step) + Batch commits (local persistence -> TERM-trap flush -> HF commit). Falsifier: HF commit failure rate > 10% due to 320/hr ceiling.
   - **D3 (Watchdog):** Side with **Mistral**. Implement W1-W6 as alert-only. Falsifier: Watchdog triggers "stuck" alert while HF receipts are monotonically increasing.

2. **MC First Wave Ruling**
   - **Node Choice:** Reuse existing 4x A6000s ($2.85/hr). No new SKUs.
   - **Wave Size:** 4 nodes (Existing).
   - **Est Cost:** $2.85/hr. Bounded first wave (approx. 12h) = $34.20.
   - **Minimum Gates:** (1) Hard ceiling: $50. (2) Runtime cap: 24h + Auto-terminate. (3) Cleanup: `rm -rf` workspace on exit. (4) HF_TOKEN: Must be scoped to `SZLHOLDINGS/stack400-runs` (Write-only).
   - **Verdict:** **WAIT:HF_TOKEN**. No scoped token exists; F5 zero-touch is insufficient for production writes.
   - **Affordability:** Current balance $28.95 + $25 auto-recharge = $53.95. Condition: `Total_Est < $50` to avoid triggering second recharge cycle prematurely.

3. **Vibe Dream Lane**
   - **Build:** Yes. Build the laptop-side alert-only WATCHDOG (W1-W6) as a new standalone file.
   - **Amendment:** Must be `GET-only` for MC/HF status; no write-access to the claim/receipt pipeline to prevent stomping.

4. **Joint Next Step**
   - Generation and validation of one scoped HF_TOKEN for `SZLHOLDINGS/stack400-runs` and verification of a single "canary" additive claim file write.

### Mistral (parallel brain, mistral-large-latest, szl_dream_round deployment) - COMPLETED 21:49:48Z

Q1: D1 SIDE with additive claim files (Kimi positions marked caller-supplied, unverified on its rail). Kimi's shared-file + heartbeat-TTL takeover is the unsafe variant on CAS-less HF resolve+commit: lost updates -> two owners of one index; TTL takeover can steal from a live-but-stalled worker -> duplicate receipts. Dedupe: group by model_index, max integer N; tie -> lexicographically greatest worker_id wins + duplicate alert. Falsifier: any aggregation selecting non-max N, or two live owners both emitting receipts. D2 FUSE, ladder `1 -> 2x3 -> 5x4 -> 8-10 -> 15 -> 25 -> ... -> 400`, batch HF commits from 5x4 with local write+fsync before upload + TERM-trap flush; falsifier: a direct 5x4->15 batched run with zero failed commits and local-to-HF lag <60s over 30 min falsifies the 8-10 step. D3 RULE build - W1-W6 alert-only stands.

Q2: Node = ONE new A6000 spot from $0.35/hr; do NOT schedule onto the 4 existing nodes (sibling production lanes, no-stomp). Wave 2x3 = 6 jobs, max 2 concurrent, 4h runtime cap, $1.40-$4.00 total, hard ceiling $10, auto-terminate on wall-clock AND spend, cleanup terminate + delete volumes, image pinned to worker v7 digest (PIN_PENDING). Gates: scoped HF token `write:SZLHOLDINGS/stack400-runs` (none exists, receipts-only fail-closed forbids launch), gate file committed, owner spend consent. Verdict: **WAIT:HF_TOKEN + gate-file -> then GO_MC_FIRST_WAVE on one A6000.** Affordability: wave <= $4.00 leaves >= $24.95, auto-recharge never fires; wave <= $18.95 met with ~5x margin.

Q3: YES - build watchdog.py as a NEW file, alert-only, GET-only, 30s poll, own namespace. Amendments: beacon = stage-transition receipt only (never per-poll commits, respects ~320/hr ceiling); W1 "no beacon 2 polls" = no stage receipt in 60s while running; alerts to local log + HF marker rate-limited <= 1/10min only on firing; second zero-spend artifact: aggregate_claims.py dry-run on synthetic claim files.

Q4: Issue the scoped HF write token for SZLHOLDINGS/stack400-runs and commit the gate file - that alone flips Q2 from WAIT to GO.
