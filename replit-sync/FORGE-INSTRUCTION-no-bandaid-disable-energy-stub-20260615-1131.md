# SZL Forge — ORDER (2026-06-15 11:31 EDT): NO BANDAIDS — disable the energy stub fallback on the LIVE box

Founder: "no bandaids." Deep-dive done. The energy meter IS live + climbing (385,839 J MEASURED, sample_total:0.0,
stub_mode:false, rtx-betterwithage computing, receipts 2,238+). GOOD. The `local-stub` in by_node is HISTORICAL
residue (3,637 earlier sample jobs when no GPU was reachable) — NOT currently active, NOT billable. The code
(szl_energy_operator.py) is honest: stub does real CPU work, energy ALWAYS labeled SAMPLE, never billed, announced
loudly. This is NOT a hidden bandaid.

## THE ONE NO-BANDAID HARDENING
The operator constructor defaults `allow_stub: bool = True` (line ~407). On the LIVE box that means a future GPU
dropout would SILENTLY resume unmetered SAMPLE/stub jobs instead of failing loud. For a sovereign production demo
the correct posture is: GPU reachable -> MEASURE; GPU gone -> DEGRADED + fail loud; NEVER quietly fall to an
unmetered stub. So:

1. **On the LIVE box deployment, start the energy operator with `allow_stub=False`** (env or constructor —
   whichever the box launch path uses; add A11OY_ENERGY_ALLOW_STUB=0 support if not present). Keep allow_stub=True
   available ONLY for true offline sandbox/CI (where there is genuinely no GPU), never on a11oy.net.
2. With allow_stub=False: if NO GPU node is reachable, the operator must report DEGRADED honestly and mint NO
   jobs — never a local-stub job. (rtx-betterwithage is reachable now, so normal operation is unaffected.)
3. **Clear the stale `local-stub` entry from the LIVE by_node/node_status** so the status payload reflects only
   real nodes (rtx-betterwithage computing, chaski standby). Do NOT reset the billable joules_measured_total
   (385,839) or the measured_jobs/receipts — only drop the phantom stub node from the node map. The historical
   3,637 sample_jobs stay in the honest historical record but local-stub should not appear as a live node.

## PROVE (paste): /api/a11oy/v1/energy/operator/status -> by_node has NO local-stub (only rtx-betterwithage
[+chaski standby]); allow_stub false on the live process; joules_measured_total still climbing + MEASURED;
sample_total stays 0.0; kill the GPU briefly in a test -> status shows DEGRADED (NOT a stub job). Re-enable GPU -> resumes MEASURED.

## DOCTRINE: never bill SAMPLE; never fake a node computing; GPU-gone => DEGRADED + loud, never silent stub;
never reset measured totals/receipts; never commit a key; honest BLOCKED beats fake green. This is a box-side
launch-flag + status-map change in szl_energy_operator.py path; byte-identical GitHub<->HF if the module changes;
ast.parse before push. Reversible.
