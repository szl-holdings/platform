# WARHACKER TIMING PLAN — Ship Before June 16

**Hard cutoff:** Warhacker Day 0 = **16 June 2026**, Downtown San Diego (per the [Warhacker brief](./../../phd_warhacker/00_WARHACKER_2026_FULL_BRIEF.md)). Today = 2026-06-01. **15 days to cutoff.**
**Author:** Yachay · 2026-06-01
**Doctrine:** Zero-Bandaid. Each Mission Pack ships as three coordinated artifacts: an **HF Space patch** + a **GitHub PR** + a **Khipu schema commit**. DO NOT push to HF or GitHub during this build — produce spec + patch files only; push is a human-gated action.

---

## 0. The three milestones (from the task)

| Milestone | Date | Days out | Bar |
|---|---|---|---|
| **MVP Mission Packs** | **June 10** | 9 days | all 6 packs interactable at `/killinchu/missions`; happy-path demos run; receipts emit + chain-verify |
| **Full polish** | **June 14** | 13 days | tamper tests, 2-person gates, signed exports, KhipuKnot 3D, all machine-checkable criteria green |
| **Dress rehearsal** | **June 15** | 14 days | full Greene 5-min flow + 4-min P1 demo run end-to-end, airgapped, twice clean |
| **Cutoff / travel** | **June 16** | 15 days | freeze; on-site |

---

## 1. Per-pack ship matrix (each = HF patch + GitHub PR + Khipu schema commit)

| Pack | HF Space patch | GitHub PR | Khipu schema commit | MVP (Jun 10) | Polish (Jun 14) |
|---|---|---|---|---|---|
| **P1 Cannonico** | `/api/killinchu/missions/MP-P1-CANNONICO` + map/side-rail | classifier-provenance wiring, tamper harness, 5 assertions | `detection, identification, classification, track_handoff, boe_node` | detect→classify→track happy path | 2-person engage gate + tamper fail + 4-min script |
| **P2 Carneiro** | `/MP-P2-CARNEIRO` + commit-attr UI | router→Khipu provenance, SENTRA firmware sigs, gate-block test | `commit_attribution, ota_gate, ota_stage` | bad-commit blocked | override 2-person + in-toto/SLSA L1 export |
| **P3 SCITT** | `/api/killinchu/scitt/*` + log view | COSE_Sign1 encoder, Merkle TS, SCRAPI register, verifier | `signed_statement, scitt_registration, transparent_statement` | log view + register | inclusion-proof verify + reject-tampered |
| **P4 NIST RMF** | `/MP-P4-NISTRMF` + 4-function panel | crosswalk-as-code, drift+confabulation eval, profile gen | `rmf_govern, rmf_map, rmf_measure, rmf_manage, rmf_profile` | profile auto-gen | confabulation circuit-break + crosswalk tooltips |
| **P5 RFC** | `/MP-P5-RFC` + comment editor | COSE signer (Issuer=SZLHOLDINGS), citation validator, staged-post | `rfc_comment_draft, rfc_comment_signed, rfc_comment_posted, civic_action_registered` | draft+sign | staged-post gate (no live POST) + SCITT register |
| **P6 ATO BoE** | `/MP-P6-THOMPSON/*` + control matrix + PDF | receipt collector, sum-check, CCI/800-53/STIG crosswalk, PDF render | `boe_collect, boe_sumcheck, boe_crosswalk, boe_export` | matrix + JSON export | signed PDF + tamper-blocks-export + KhipuKnot |

---

## 2. Day-by-day plan

| Date | Focus | Exit check |
|---|---|---|
| **Jun 1–2** | Schema lock + Khipu receipt-type commits for all 6 packs; `/killinchu/missions` board shell. | board lists 6 tiles; schema validates |
| **Jun 3** | P1 happy path (detect→identify→classify→track) + receipts chain-verify. | P1 4-min script runs minus gates/tamper |
| **Jun 4** | P3 Transparency Service (COSE_Sign1 + Merkle VDS + `/killinchu/scitt` log). | a P1 detection registers + shows in log |
| **Jun 5** | P2 commit-attribution + governance gate (bad commit blocked). | seeded bad commit blocked, never staged |
| **Jun 6** | P4 RMF profile auto-gen from a P1 run + Yuyay↔RMF crosswalk. | one run → 4-function profile |
| **Jun 7** | P6 receipt collector + sum-check + crosswalk + JSON export. | control matrix populated from receipts |
| **Jun 8** | P5 comment editor + COSE signer (Issuer=SZLHOLDINGS) + staged-post. | comment drafted, signed, staged (not posted) |
| **Jun 9** | 2-person Yuyay gate wired into all state-changing ops across packs. | every state change shows 2-approver gate |
| **Jun 10** | **MVP CUT** — all 6 interactable, happy paths green. | demo all 6 end-to-end once |
| **Jun 11** | Tamper tests across P1/P3/P6 (fail-closed everywhere). | each tamper test flips red + blocks |
| **Jun 12** | Signed exports: P6 PDF render + embedded-root verify; P2 in-toto/SLSA L1. | signed PDF downloads + re-verifies |
| **Jun 13** | KhipuKnot 3D (Three.js, Reidemeister R1/R2/R3) for the Greene flow. | knot view renders + severs on tamper |
| **Jun 14** | **FULL POLISH** — all machine-checkable criteria green; honest-label audit. | CI: all pack assertions pass; labels honest |
| **Jun 15** | **DRESS REHEARSAL** — Greene 5-min flow + P1 4-min, airgapped, twice clean. | two clean run-throughs, timed |
| **Jun 16** | **FREEZE + travel.** | no commits after freeze |

---

## 3. Critical path & dependencies
- **P3 Transparency Service is on the critical path** — P1/P2/P5 register into it and P6 crosswalks AU-10/AU-9 from it. Build P3 early (Jun 4) so the others have a sink.
- **P6 depends on P1–P5 receipts** — it is the aggregator; it can only be fully exercised once the others emit. Its skeleton (Jun 7) can use P1+P3 receipts before the rest land.
- **2-person Yuyay gate (Jun 9) is cross-cutting** — one shared gate component used by every state-changing op; build once, wire everywhere.
- **KhipuKnot 3D (Jun 13) is polish, not MVP** — if it slips, the demo degrades gracefully to the 2D receipt manifest (no tradecraft claim lost; honest fallback).

---

## 4. Risk register (honest)
| Risk | Likelihood | Mitigation |
|---|---|---|
| Sigstore keyless not wired by cutoff | High | Ship with **PLACEHOLDER** label on PDF cover + hash-chain real today; never claim signed-keyless. |
| 13-axis `yuyay_v3` not end-to-end wired | High | Carry honest label "runnable, not yet end-to-end"; 9-axis HATUN-RAID remains sovereign for the gate. |
| Live constellation/RF feed unavailable at table | Medium | Pre-seed recorded RF cue; demo runs airgapped (matches [Constellation Survey](./satellites/CONSTELLATION_SURVEY_2026.md) tip-and-cue reality). |
| KhipuKnot 3D perf on venue laptop | Medium | LOD `<Detailed>` + cap knot count; 2D fallback. |
| P5 datatracker POST policy/late approval | Medium | Staged-not-posted by default (DO-NOT-PUSH); post only with human confirm + 2-person gate. |
| Late Warhacker registration confirmation | Medium | Greene is pre-approved per task; keep [Greene brief](./../../phd_warhacker/02_ANDREW_GREENE_BRIEF.md) DM line warm. |

---

## 5. Definition of Done (all packs)
1. Interactable at `/killinchu/missions/<id>`.
2. Every step emits a chain-verified Khipu receipt.
3. Every state-changing op behind a 2-person Yuyay gate.
4. All `machine_checkable` success criteria pass in CI.
5. Tamper test fails closed and is visible.
6. Completion proof (`khipu_dag_sum` / `signed_pdf` / `scitt_transparent_statement`) verifies offline.
7. Honest labels (PLACEHOLDER / NOT-YET / Conjecture / SLSA L1) preserved, none hidden.
8. Three artifacts staged (HF patch + GitHub PR + Khipu schema commit) — **staged, not pushed** until human-gated.

---

— Signed **Yachay** · 2026-06-01 · 15 days to San Diego. No mysticism. No bandaid.
