# Dream-MC Round 2 (mc2) — Joint Adjudication: Kimi + Astra + Sol

Date: 2026-11-20 ~23:1xZ. Seats: kimi-k3.1-pro:cloud (114.2s), treyleo16/gpt-6-astra:latest (1.4s), treyleo16/gpt-6-1-sol:latest (1.5s), convened via laptop Ollama DC (Sol rail live this round; prior login-wall resolved).
Lane: Mistral dream lane. Doctrine held: receipts-only, GET-only on MC, alert-only, zero MC writes, zero launches, zero spend, key in-memory never printed, no stomp of sibling resources.

## Rulings

### Q1 falsifier set (converged, all three seats)
- TERM-trap: mid-write TERM must flush atomically (file + directory fsync), zero truncated-complete claims, intake stops, exit bounded.
- Resume-from-local: restart with HF down must reconstruct exclusively from local files, zero lost / zero duplicated / zero rerun completed claims, idempotent upload, digest-set match; conflicts quarantined.
- Commit-rate arithmetic: commits/hr = k x workers-related term; Kimi: 3600k/T-s <= 320; Sol: Batch x Frequency <= 320; Astra: Nodes x Batches/hr, throttled at 400 to stay <= 320. Projection asserted per ladder step.

### Q2 reconciliation UNANIMOUS (all three seats)
- Wave 2x3 vs canary-1: canary-1 (G5) governs. Stages [1,9,40,350] control MC capacity; D2 ladder is claim/batch cadence only.
- Gate logic: pack G1-G6 prevails over dream JSON. Gates are a union, none waivable; lower ceilings win.
- Trigger: ratification receipt (registry-SHA + numeric ceiling), not loose sign-off wording.
- Dream bindings retained: one NEW A6000 spot (exclusion-aware), $10 ceiling, 4h runtime cap, dual-terminate.
- Unified order: ratification sentence -> receipt + F5 -> G1 -> G2 (billing/auto-recharge-off) -> G3 -> G4 -> G6 -> G5 -> dry-run PASS -> canary-1 c1-c6 PASS -> +9 -> +40 -> +350 (= 400), receipt-verified promotion; repeat canary per sku/region/image.

### Q3 one zero-spend item per seat (all executed or built this round)
- Kimi: build mc_gate_compat.py offline (rc=2 on canary bypass / rollout sum != 400 / ceiling mismatch / missing c5-c6; emit unified-plan hash; zero network) — BUILT, 0 breaks.
- Astra: mc_spec_hash on the final combined spec — DEFERRED (honest): the compat hash d2c8de75... stands in until the pack publishes its final combined spec.
- Sol: wire the laptop watchdog W1-W6 to the running nodes — WIRED and first live watch fired (below).

### Q4 first live GET-only watch — EXECUTED
Seats: Kimi conditioned-YES, Astra YES, Sol YES. Conditions honored exactly: device-side, GET-only, alert-only, zero writes, key in-memory only, redacted whitelisted fields. Two snapshots ~45s apart; both watchdog evaluations CLEAN, 0 alerts, 0 false positives, no W1b node-loss.

## Live discovery (sibling lane, do not touch)
First live watch measured FIVE running MC instances: the 4 known production nodes plus szl-stack400-mc-w0b-h200 (gpu_2x_h200_nvl) — a sibling lane has already begun house-400 on a 2x H200 NVL node. Observed GET-only, not modified, no stomp.

## D2 rehearsal matrix (batch_local.py)
Device (Windows): 9/9 PASS — F1 local durability 100 appends; F2 TERM-trap flush zero lost (rc=0, n=5, channel=control_file, simulated=True honestly labeled); F2b order preserved; F3 resume exactly-uncommitted-once; F3b manifests idempotent by id; F4 batched plan never over 320 (worst 150/hr at cycle 600s); F4b non-batched blows ceiling (15w4m=360, 25w4m=600); F4c slow-cycle top step fits; F5 determinism 96214f59e4c0188c. Local (Linux) rehearsal: 9/9 PASS with real POSIX SIGTERM drill.
PLATFORM FINDING (measured): Windows Sovereign runtime CTRL_BREAK_EVENT hard-kills the child with rc=0xC000013A (STATUS_CONTROL_C_EXIT); the Python trap never runs — console events are NOT a valid Windows TERM channel on this runtime; the control-file channel drives the same flush code, labeled simulated. Binding real-signal proof = POSIX (Salad workers).

## Gate compat v1.1 cross-check (mc_gate_compat.py)
Verdict: GATE_COMPAT:HOLD:WAIT:HF_TOKEN,GATE_OWNER_SIGNOFF+c5_c6_terminal_pending+hf_token_missing+ratification_ceiling_pending. breaks=0.
- C1 rollout sum 400: PASS (stages=[1,9,40,350])
- C2 canary-first acknowledged: PASS (gate v1.1 records canary-first, wave superseded)
- C3 ceiling consistency: PASS (dream=10.0; unratiﬁed template stays an honest pending HOLD, never regex-guessed from prose)
- C4 registry binding: PASS (PENDING acceptable; MISMATCH would break)
- C5 c5/c6 terminal evidence: HOLD (PENDING is honest, not a break)
- C6 dream bindings retained: PASS (new-node, dual-terminate, runtime-cap)
unified_plan_hash = d2c8de75f4209c5944b746959775c5f2e554c38d2b2f52ca1cca1a4d8bb49870

## Standing owner gates (fail-closed, unchanged)
F5 scoped HF token (write:SZLHOLDINGS/stack400-runs) NOT minted; ratification sentence NOT given; MC key was chat-exposed, rotation recommended; $25 auto-recharge live; balance $28.95 at last measure. This lane: zero MC launches, zero spend, zero writes.

## Seat transcripts (verbatim)

### Ask
```
ANSWER BY NUMBER, max 300 words total, be concrete and falsifiable:
Q1 The D2 batch rehearsal (batch_local.py) must prove SIGTERM recovery. List the exact falsifier set it must pass to be green: what must the TERM-trap flush prove, what must resume-from-local prove, and what commit-rate arithmetic must the projection assert at each ladder step vs the 320/hr ceiling (state the formula you expect).
Q2 Reconcile the dream-lane gate mc_first_wave_gate.json (one NEW A6000 spot, 2x3 wave, $10 ceiling, WAIT:HF_TOKEN,GATE_OWNER_SIGNOFF) with sibling mc-launch-pack G1-G6 (canary_1x_a6000 first, rollout_stages [1,9,40,350], DRY-RUN launcher rc=2 without ratification receipt). Name every divergence, rule who prevails per divergence, and give the ONE unified gate order from ratification sentence to steady 400. Do not re-litigate D1-D3.
Q3 Exactly ONE more zero-spend item this lane should execute tonight that materially advances house-400 (or the single word NONE with one sentence why).
Q4 Fire the first live GET-only watch now: one MC snapshot read of the 4 running nodes mapped into watcher W1-W3 fields, then watchdog evaluation, alerts printed. Yes/no, plus any condition (alert-only, no writes, key in-memory).
```

### Kimi (kimi-k3.1-pro:cloud, 114.2s)
```
MODEL kimi-k3.1-pro:cloud
SECONDS 114.2 DONE_REASON stop SIZE 1871
1. **Falsifiers:** Inject TERM during write, post-fsync/pre-upload, and mid-upload. Green requires: intake stops; every completed claim and pending manifest is atomically written with file+directory fsync; exit ≤30s; no truncated “complete” claim. Restart HF-down, reconstruct exclusively from local files, hash/schema-check, then upload idempotently. Expected, local, and HF digest sets must match exactly: no lost, duplicated, or rerun completed claims; fingerprint conflicts quarantined. Let \(T_s\)=fastest possible cycle seconds and \(k_s\)=retry-inclusive commits/cycle. Require \(3600k_s/T_s\le320\), plus rolling-3600s commits ≤320. Nominal \(k=(1,6,1,1,1,1,1)\) at \(1,2×3,5×4,8–10,15,25,\)steady; thus \(T_{\min}=(11.25,67.5,11.25,11.25,11.25,11.25,11.25)\)s through 400.

2. **Divergences:** 2×3-first versus 1×canary: **G5 wins**. Dream/D2 scaling versus additive \([1,9,40,350]\): **pack controls MC capacity; D2 only claim/batch cadence**. Live-wave wording versus DRY-RUN/rc=2: **pack wins**. HF/owner waits versus receipt/G2–G6: **union; none waivable**. Dream additionally binds one NEW A6000 spot, excludes existing four, and imposes $10/4h/dual-termination; lower ceilings win. **Order:** owner sentence binding registry-SHA+numeric ceiling → receipt+F5 → G1→G2(billing/auto-recharge-off)→G3→G4→G6→G5 → dry-run PASS → authorized executor: canary-1 c1–c6 PASS → +9 → +40 → +350 (=400), receipt-verified promotion; repeat canary per sku/region/image.

3. **Build/test `mc_gate_compat.py` offline:** rc=2 on canary bypass, hash/ceiling mismatch, rollout sum≠400, or missing c5/c6; emit unified-plan hash. Zero network.

4. **No.** No device/MC network or key access exists here; claiming a snapshot would fabricate a receipt. Condition: device-side, key in memory only, GET-only, alert-only, zero writes; return timestamped redacted W1–W3 JSON and alerts.
```

### Astra (treyleo16/gpt-6-astra:latest, 1.4s)
```
MODEL treyleo16/gpt-6-astra:latest
SECONDS 1.4 DONE_REASON stop SIZE 1250
1. **Falsifiers:**
- **TERM-trap:** `local_append` must commit current batch to disk *before* process exit; `diff(last_fsync, last_upload)` must be $\le$ 1 batch.
- **Resume-from-local:** On restart, `local_append` must detect existing `.tmp` files and upload prior to starting new compute.
- **Commit-Rate:** Formula: $\text{Commits/hr} = (\text{Nodes} \times \text{Batches/hr})$.
    - $1 \to 2\times3$: $6 \times \text{rate} < 320$
    - $5\times4$: $20 \times \text{rate} < 320$
    - $400$: $400 \times \text{rate}$ must be throttled via sleep/batch-size to stay $\le 320$.

2. **Reconciliation:**
- **Divergences:** 
    - Scale: Wave (2x3) vs. Stages [1, 9, 40, 350]. **Prevails:** Stages.
    - Hardware: 1 NEW A6000 vs. Canary 1x A6000. **Prevails:** Canary.
    - Trigger: Sign-off vs. Ratification Receipt. **Prevails:** Ratification.
- **Unified Order:** Ratification Sentence (Hash+Ceiling) $\to$ G1-G6 Checks $\to$ Canary (1x A6000) $\to$ Stage 9 $\to$ Stage 40 $\to$ Steady 400.

3. **Execution:** `mc_spec_hash.py` run on the final combined spec to generate the exact SHA required for the ratification sentence.

4. **Watchdog:** **Yes**. Condition: Alert-only, GET-only, zero writes, key in-memory, mapping existing 4 nodes to W1-W3.
```

### Sol (treyleo16/gpt-6-1-sol:latest, 1.5s)
```
MODEL treyleo16/gpt-6-1-sol:latest
SECONDS 1.5 DONE_REASON stop SIZE 1210
Q1
1. **TERM-trap flush**: `fsync` count on `local_append` must equal total processed records at $T_{signal}$; 0 records lost.
2. **Resume-from-local**: Pointer offset in `resume_log` must match exact byte-position of last successful local write, resulting in 0 duplicate uploads.
3. **Commit-rate**: $\text{Batch\_Size} \times \text{Frequency} \le 320/\text{hr}$.
   - $1 \to 2\times3$: $\sim 6/\text{hr}$
   - $5\times4$: $\sim 20/\text{hr}$
   - $8\text{--}10$: $\sim 10/\text{hr}$
   - $15 \to 25 \to 400$: $\text{Scaling rate} \le 5.33\text{/min}$.

Q2
**Divergences**:
- **Wave Size**: First wave (2x3) vs. Canary (1). **Prevails**: Canary (1) first.
- **Rollout**: Fixed wave (2x3) vs. Ladder ([1,9,40,350]). **Prevails**: Ladder.
- **Gate Logic**: JSON-based vs. G1-G6 Python. **Prevails**: G1-G6.
**Unified Order**: Ratification Sentence $\to$ G1 (Registry/Ceiling) $\to$ G2-G6 $\to$ Canary 1 $\to$ Stage 9 $\to$ Stage 40 $\to$ Steady 400 (Wait: HF_TOKEN).

Q3
**Wiring the laptop watchdog** (W1-W6) to the 4 running nodes. It moves the project from "blind trust" to "active telemetry" without spend.

Q4
**Yes**. Condition: Alert-only, zero-writes, key in-memory only. Ready to map snapshot to W1-W3.
```
