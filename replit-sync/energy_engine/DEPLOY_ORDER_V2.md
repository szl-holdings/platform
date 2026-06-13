# DEPLOY ORDER V2 — from 26 open PRs to a live, MEASURED joule on the RTX 5000

2026-06-13. CTO/program-manager finisher. **No PR is merged yet — this is the order to merge them in.**
The organism is BUILT and WIRED in source but DEPLOYED nowhere. This doc is the Forge/box-executable
sequence: how to land 26 PRs without breaking a seam, and the shortest path to the first real number.

Doctrine held throughout: meter REAL flow, never energy-from-nothing; SAMPLE until a real meter feeds the
field; source claims match the signal; Λ=Conjecture 1; locked-8 untouched; no key committed; half-state forbidden.

---

## INTEGRATION VERDICT — do the pieces fit?

**Yes, with three documented gaps (none blocking the demo slice; two are 1-line field/URL fixes).**

The seams checked (by reading PR diffs + the energy_engine copies — nothing merged):

| Seam | Status |
|---|---|
| scheduler #357 energy gate ← energy_signal #356 | FITS — #357 stacks on #356, imports the PowerPosture |
| energy_signal #356 ← real sources #369 | FITS — #369 is disjoint new files under `energy_signal/`, extends #356's off-peak clock as the always-real window floor; aggregator fuses NVML+aWATTar/CAISO |
| organ-bus #367 → brain #363 / immune #362 / nervous #364 / heart-blood #334 | FITS BY CONTRACT — #367 reaches organs over **HTTP** (amaru.szl.ai / sentra.szl.ai), not by importing the Python modules. Honest-degrades (immune unreachable→DENY, brain unreachable→DEFER). |
| unified status #335 aggregates mind+organs+energy+swarm | FITS — concurrent honest probes, degrade to reachable:false, sovereign only from /code/healthz |
| hologram #336 + dashboards read status | **GAP 1 (wiring)** — hologram polls endpoints DIRECTLY (`/code/healthz`, `/v1/energy/budget`, per-organ probes), does NOT consume #335's `/v1/engine/status` |
| status #335 reads the real budget #328 | **GAP 2 (field-name mismatch)** — see below |
| status #335 / organ-bus #367 reach amaru/sentra | **GAP 3 (routing)** — those hosts are unrouted; organs read reachable:false until deployed |

### GAP 1 — hologram #336 does not consume the unified status #335
`hologram.html` `pollData()` fans out to `/code/healthz`, `/v1/energy/budget`, each organ probe, `/v1/gates`
directly. It works and is honest (dims to unknown on null), but it bypasses the single aggregator #335 was
built to be. **Fix (small, post-merge):** repoint `pollData()` at `GET /api/a11oy/v1/engine/status` and map
the one payload to mind/organs/energy/swarm. Until then the two surfaces can drift.

### GAP 2 — budget #328 field names ≠ status #335 expected names
#335 `_energy_from_budget` reads `window`, `source`, `joules`, `joules_label`. The live #328 budget endpoint
emits `energy_source`, `joules_est`, `joules_est_label`, and has **no `window` field**. Result: #335 would
show `window:null, source:null, joules.value:null` from a live #328 — but the label defaults to `"sample"`,
so it is **honest-degrading, not a doctrine break** (it under-claims, never over-claims). **Fix (1-line):**
either add aliases to #335's reader (`source` ← `energy_source`, `joules` ← `joules_est`, `joules_label` ←
`joules_est_label`) or have #328 also emit the canonical names. Add `window` to #328 from the off-peak clock.

### GAP 3 — organ hosts unrouted
Both #335 and #367 probe `amaru.szl.ai` / `sentra.szl.ai` (or same-origin proxy paths). Those are not routed
in the deploy target yet, so every organ reads `reachable:false`. This is **correct honest behavior**, not a
bug — but it means "6/6 organs green" is impossible until the proxy/routing lands (Phase 2).

---

## PHASE 0 — MERGE SEQUENCE (all 26, grouped + ordered)

**Rule:** stacked PRs merge base-first; never merge a child before its parent or the diff inverts. Three repos
carry the organism. Within a repo, merge in dependency order; across repos there is no hard ordering except
that the **lutar keystone** (the kernel-checked EnergyBudgetWitness) should land before anything claims to
honor a proven bound.

### Group K — lutar (the proof keystone) — MERGE FIRST
- **#239** EnergyBudgetWitness (Lean, kernel-checked, 0-sorry) — keystone; everything energy-honest cites it.
- **#240, #241** — the dependent lutar PRs; rebase onto main after #239, then merge in their stacked order.
  > Founder convention: lowercase the PR title before merge.

### Group P — platform `apps/agentic-gpu/` (stacked on `feat/agentic-gpu-scheduler`, NOT on main)
Merge the stack base→tip. The base branch `feat/agentic-gpu-scheduler` must land on main first (it carries the
`apps/agentic-gpu/` tree that none of these can exist without).
1. **#356** energy_signal (PowerPosture aggregator + off-peak clock) — base of the energy stack.
2. **#369** real energy sources (NVML/aWATTar/CAISO + real_aggregator) — stacks on #356.
3. **#357** scheduler/daemon/energy-gate — stacks on #356; rebase past #369 so the gate sees the real aggregator.
4. **#362** immune (Neyman-Pearson 8 gates), **#363** brain (PAC-Bayes belief), **#364** nervous (Shannon alarm)
   — organ modules; base `feat/agentic-gpu-scheduler`; rebase onto the merged tip, merge in any order (disjoint).
5. **#367** organ-bus (HTTP pipeline immune→brain→run→heart/blood→nervous) — rebase last; depends on the organ
   contracts existing.
6. **#358** swarm/registry, **#360** energy-proportional admission, **#361** vllm metrics, **#366** yarqa router
   — rebase onto the tip; merge after the organs+bus (they consume node/posture signals). Disjoint → any order.

### Group A — a11oy (the Space that serves + proxies)
- **#328** energy budget endpoint — base of the a11oy energy stack (keystone for the Space).
- **#329** (depends on #328), **#331** energy-provenance-chain (stacks on #328) — merge after #328.
- **#334** heart+blood (receipt σ-bus + DSSE Merkle ledger) — the OPEN heart-blood PR (the earlier #333 is CLOSED/superseded — do NOT merge #333); stacks on #331; merge after #331.
- **#335** unified status API — merge after #328 (so it has a real budget to read); apply GAP-2 alias fix here.
- **#330, #332** dashboards, **#336** hologram — merge LAST in this repo (read surfaces); apply GAP-1 fix to #336.

> Anything not enumerated above among the 26 that is a doc/vision/aux PR: merge anytime, no code seam. Count is
> approximate per repo; reconcile the exact list against `gh pr list` per repo at merge time.

---

## PHASE 1 — FIRST MEASURED JOULE (the demo slice — smallest set that yields one real number)

**Goal:** one live receipt carrying a `joules` figure labeled **MEASURED**, shown on the hologram/dashboard.

Merge ONLY: **#356 + #357 + #369** (platform energy stack) and **#328 + #329** (a11oy budget), plus the lutar
keystone **#239** for the honored bound. Then on the **RTX 5000 @ betterwithage**:

1. Land `feat/agentic-gpu-scheduler` → main; merge #356, #369, #357 (rebased) in that order.
2. Merge a11oy #328, #329; apply the GAP-2 field alias so #335 (or the budget consumer) reads canonical names.
3. **Deploy the resident daemon on the box.** It runs the #357 proactive loop; the energy gate reads the #356
   aggregator, which now calls #369's `real_aggregator.current_real_posture()`.
4. **NVML goes MEASURED on-box.** `nvml_provider.read_gpu_power()` shells to `nvidia-smi` on the RTX 5000 →
   real `power.draw_W`; `joules = power_draw_W × task_seconds`. THIS is the first measured number.
5. The daemon writes **one live receipt** carrying that measured joule figure with `joules_label:"measured"`.
6. Surface it: `/api/a11oy/v1/engine/status` (#335) reports `energy.joules.label == "measured"`; the hologram
   #336 / dashboard #332 render it. (For the demo, #336 may keep its direct `/v1/energy/budget` probe — GAP 1
   does not block the number from appearing; wire #336→#335 right after.)

**Acceptance:** a receipt + a status payload both showing a MEASURED joule produced by NVML on the box, while
the price signal is whatever aWATTar/CAISO honestly returns (already proven live: real curtailed price off-box).

> Milestone already in hand: in THIS env, `real_aggregator` live-fetched a **real aWATTar curtailed price**
> (`measured_price:true`) while NVML stayed SAMPLE off-box → overall `measured:false`. The half-state was
> refused by construction. On-box, NVML flips MEASURED → overall MEASURED. The only unchecked item is on-box NVML.

---

## PHASE 2 — FULL BODY (organ-bus + swarm + sponge)

1. Route `amaru.szl.ai` / `sentra.szl.ai` (or same-origin proxy paths) so the organ endpoints in #335/#367
   resolve (closes GAP 3). Until this, organs are honestly `reachable:false`.
2. Merge organs #362/#363/#364, organ-bus #367, heart+blood #334 (NOT the closed #333). The bus pipeline runs admission→belief→
   run→receipt/ledger→alarm; #335 now reads real organ statuses.
3. Merge swarm #358, energy-proportional #360, vllm metrics #361, yarqa #366. The router sends work to the node
   on live surplus; the batch sponge floods Bekenstein-gated work when surplus flows, drains to reactive-only otherwise.
4. Apply GAP 1: repoint hologram #336 `pollData()` at #335 so all surfaces read one aggregated truth.

---

## PHASE 3 — WHAT STAYS SAMPLE (honest until a real meter lands)

- **Price/window off-box:** when no provider key is set and the clock is the only signal, window is the REAL
  off-peak clock fact but the price stays SAMPLE. aWATTar/CAISO (no key) flip price→MEASURED when reachable.
- **Carbon (`carbon_moer`):** SAMPLE until WattTime (free tier) is keyed. No carbon claim before then.
- **Heart/blood signing:** tamper-EVIDENT with a SAMPLE placeholder HMAC, NOT "signed," until a real signing
  key is provisioned via env/secret store. The receipt says so.
- **Swarm "10 supercomputers":** only consented, probe-confirmed nodes count; everything else is SAMPLE capacity.
- **Λ-uniqueness:** stays a CONJECTURE. Only `lambda_unique_conditional` (explicit hypotheses) is a real
  conditional theorem. The skeleton says "Conjecture 1" plainly — never "theorem."

These remain SAMPLE/ESTIMATE-labeled by construction. Relabeling MEASURED requires the named real meter.

---

## PHASE 4 — EVOLVE

- Add keyed providers (ENTSO-E, Tibber, GridStatus.io, EIA, WattTime) → broaden MEASURED coverage region by region.
- Provision the real signing key → heart/blood goes from tamper-evident to truly signed; anchor DSSE to Cardano.
- Add a PDU/wall-meter alongside NVML → whole-box joules, not just GPU draw.
- Drive the proactive loop continuously (LIVE_FLOW_HARVEST): follow surplus around the clock; the swarm router
  chases the node sitting on live surplus.
- Promote conditional Lean theorems toward discharging hypotheses; never restate the conjecture as proven.
