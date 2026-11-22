# W17 merge sweep adjudication - 2026-11-22

Owner directive (11-22): convene all seats as one (Kimi, ChatGPT-6, Astra 6.2, Sol 6, Claude), get all PRs and merges green, merge if green. Explicit green-merge authority granted. Fail-closed doctrine retained throughout.

## Seat roster (measured)
- Kimi kimi-k3.1-pro:cloud - GOVERNING (ruling + ruling2)
- Astra 6.2 (cleanup seat), Sol 6.1 (efficiency seat) - seated
- GPT-6: codex NOT on PATH (3rd reproduction, honest negative) -> GLM glm-5.3:cloud WATCHER substitute, disclosed
- Claude: NO rail on device (honest negative) -> mistral-large-4:cloud REVIEWER 5th seat, disclosed

## Sweep (crew_w17.py v3, GraphQL paged 25/page + per-candidate REST)
119 open PRs estate-wide: 62 BLOCKED|UNVERIFIED (signature/review wall, owner-gated, NOT merged), 27 CLEAN|pending, 14 BEHIND, 11 DIRTY, 5 UNSTABLE. All 5 seats + Kimi ruling 1: go=[] under legacy combined status instrument (empty GO = honest fail-closed).

## Stage 2 correct-instrument verification (verify_w17.py)
Per-candidate commit check-runs at exact head SHA: 27/27 ALL_SUCCESS_AT_HEAD, not_green=0.
Kimi ruling2 (w17_kimi_ruling2_out.txt -> w17_merge_plan_v2.json): merge_now=27, hold=0. Protocol: one at a time in listed order, fresh revalidation before each merge, receipt-hold on drift, never force or bypass protection.

## Merge execution (merge_w17_v2.py, merge_w17_v3.py)
- merge_w17.py v1 held all 27 on a case bug (compared mergeable_state 'CLEAN' vs REST lowercase 'clean'). Honest fail-closed hold, zero merges, fixed and disclosed.
- Sweep2: 22 MERGED (squash, each at its verified head with all-success check-runs).
- 5 held state=unknown (GitHub async mergeability recompute after sibling merge in same repo). Retry pass with fresh revalidation: 4 MERGED (atlas#63, specdecode#12, billing#13, estate-cards#4).
- 1 receipt-hold: curation-atlas#65 head drift 0db82ba1c2 -> c217bb2a49 between verification and merge. Checks no longer bind to new head; requires fresh verification in a future lap. NOT merged.

FINAL: 26/27 merged, 1 honest drift-hold. Zero force-merges, zero protection bypasses, zero rerun-to-green. Every merge receipted in w17_merge_receipts2.jsonl with head SHA + result SHA.

## Kimi bandaid flags (not merged - BLOCKED class, owner-gated)
szl-org-health#420 (probe-bound enlargement), holographic-unify#62 (retry-on-stale-readback rerun-to-green vector), szl-org-health#419 (failure-precedence reorder masking SHA drift).

## Platform findings (measured)
1. GitHub REST mergeable_state is lowercase (clean/dirty/unknown), not the GraphQL-cased values.
2. After a merge into repo X, sibling open PRs of X report mergeable_state=unknown until GitHub recomputes; wait + revalidate, never treat unknown as green or dirty.
3. curation-atlas#65 head SHA moved during the sweep window (external push or dependabot rebase) - head-binding verification is mandatory.

## Owners gates unchanged
F5 scoped HF token NOT minted; MC canary ratification EXPIRED 2026-11-22T04:00Z unserved (no fresh sentence before any MC fire); MC key rotation recommended; zero MC spend/launches this lap.
