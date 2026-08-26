# P0 Series A Product Wiring — Current-Main Successor Proof Packet

Generated: 2026-08-26

## Verdict

`CLEAN_CURRENT_MAIN_SUCCESSOR / EXACT_HEAD_CI_REVIEW_PENDING`

This packet records the no-rewrite reconstruction of Platform PR #656 on the
then-current protected `main`. It carries the reviewed Series A product and
historical evidence delta while preserving every protected-main change. It does
not claim merge, deployment, production runtime, or current screenshot proof.

## Provenance

| Field | Evidence |
|---|---|
| Repository | `szl-holdings/platform` |
| Successor branch | `codex/series-a-proof-successor-v3-20260826` |
| Protected base | `f8f7a4132cc8bb6038cbc878136cbc9d0ec5ca8f` |
| Protected base tree | `343edc716cbef93d8a4a2fb6b5127532f3efa00f` |
| Predecessor pull request | #656 |
| Predecessor head | `0ca011c41184f809bddf184ca494f08224f71791` |
| Predecessor tree | `c95f16f12a193da6227704c3f576dfe2d0650b11` |
| Product-source commit | `69285dd8450fc86db5ec5ba59986d36333d79f75` |
| Superseded capture run | `32364821536` |

No force push, amended predecessor, direct-main write, or history deletion is
part of this reconstruction.

## Conflict resolution

Fifteen paths changed on both lineages.

- The protected-main exact-head screenshot workflow, proof packet, tests, and
  truth-surface changes remain intact.
- The Series A screenshot workflow is additive, so the canonical workflow count
  advances from 46 to 47 across all governed truth surfaces.
- The protected-main Hugging Face model count and generated truth values remain
  intact.
- The current exact-head evidence row in `audit/README.md` remains, and this
  successor packet is added beside it.
- The protected-main truth-snapshot lifecycle section in
  `docs/operations/known-gaps.md` remains, and the Series A candidate boundary
  is added as a separate fail-closed section.
- Every other predecessor path had no protected-main overlap and is carried
  byte-for-byte from the reviewed #656 head.

## Carried product boundary

The source adds `/a11oy/start` while preserving the 12-step
`/a11oy/investor-demo` route. Six buyer-oriented views use the shared
`Observe -> Gate -> Act -> Prove` grammar. Missing GraphQL and Omnia server
operations remain explicitly unavailable.

The five imported PNGs and capture metadata remain superseded historical
evidence. They do not close current screenshot proof because visual review found
the sticky header displaced after tab-induced scrolling.

## Promotion boundary

The successor must remain unmerged until its exact head has terminal-green
hosted CI, no unresolved actionable review thread, and normal protected-branch
eligibility. A fresh repaired screenshot run, direct visual inspection, and
artifact import remain separate evidence gates. Deployment and exact deployed
SHA readback remain separate production gates.
