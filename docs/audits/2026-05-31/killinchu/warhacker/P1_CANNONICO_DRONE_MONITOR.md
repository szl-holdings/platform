# MISSION PACK P1 — Cannonico Drone Monitor

**id:** `MP-P1-CANNONICO`
**warhacker_problem_id:** P1
**schema:** `mp/v1` (see [MISSION_PACK_SCHEMA.md](./MISSION_PACK_SCHEMA.md))
**Killinchu native fit:** this is the flagship's core mission — detect → identify → classify → track → assemble Body of Evidence, every step Khipu-receipted.
**Author:** Yachay · 2026-06-01

---

## 1. Customer & context

| field | value |
|---|---|
| customer.name | Cannonico |
| customer.role | Warhacker problem owner (mission sponsor) |
| customer.relationship | problem_owner |
| customer.outreach_ref | [00_WARHACKER_2026_FULL_BRIEF.md §4](./../../phd_warhacker/00_WARHACKER_2026_FULL_BRIEF.md) |

**customer_context:** Cannonico submitted the accepted Warhacker problem: *"AI oversight for autonomous drones — monitoring AI behavior in real time, catching when AI exceeds authorized parameters, backed by tamper-evident records."* Per the [full Warhacker brief](./../../phd_warhacker/00_WARHACKER_2026_FULL_BRIEF.md), SZL's wedge — a formally-verified governance gate for agentic AI — aligns directly with this problem. P1 is the literal implementation: Killinchu watches the drone-autonomy decision loop, gates every action through the 13-axis Yuyay heart, and produces a tamper-evident Khipu record.

---

## 2. drone_assignments

| drone_id | platform | role | why |
|---|---|---|---|
| `shahed-136` | Shahed-136 loitering munition | **subject** | the adversary, Remote-ID-OFF — the hard detection case |
| `skydio-x10` | Skydio X10 | **sensor** | own-fleet autonomous quad providing terrestrial RF/optical detection |
| `tb2-bayraktar` | Bayraktar TB2 | **subject** | cooperative-large ISR platform; ADS-B identity confirms the classifier on a known-good track |

Space-layer cueing per the [Constellation Survey](./satellites/CONSTELLATION_SURVEY_2026.md): RF/SIGINT geolocation (HawkEye 360-class) is the only modality that finds the Remote-ID-off `shahed-136` in flight; optical/SAR provide launch-site pattern-of-life for tip-and-cue. The honest bottom line from that survey is carried into the demo: space gives **tip-and-cue and pattern-of-life, not a closed-loop fire-control track** — terrestrial RF DF and the `skydio-x10` sensor close the loop.

---

## 3. Steps (each Khipu-receipted)

Each step is a candidate action `a` in `P(x,t) = argmax_a [ Λ(x)·Yuyay_13(a)·exp(-β·HUKLLA(a))·∏Khipu_i(a) ]`. Detection/identification/classification are read-only (no Yuyay 2-person gate; receipt only). **Track-engage handoff and BoE export are state-changing** and require the 2-person Yuyay gate.

### Step 1 — `detect`
- **description:** Fuse `skydio-x10` terrestrial RF DF + RF/SIGINT space cue into a candidate track. Emit a detection event when an emitter geolocation crosses the watch boundary.
- **yuyay_gate:** `required: false`, `two_person: false` (read-only sensing). Axis floor still evaluated for display: `empiricalGrounding` (axis 3 ≥ 0.90) and `claimCalibration` (axis 9 ≥ 0.90) must clear before the track is *shown* — a detection that cannot ground its evidence is not surfaced, matching the [Killinchu flagship rule](./../puriq/integration/HATUN_WILLAY_PER_FLAGSHIP.md).
- **huklla_tripwires:** watches `T03` (evidence integrity), `T09` (claim-calibration drift); `on_trip: deny` (suppress the unfounded track).
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"detection","fields":["ts","sensor_id","emitter_geo","rf_band","snr","cue_source","axis3","axis9"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}
  ```

### Step 2 — `identify`
- **description:** Match the detection to a fleet-registry platform. ADS-B match confirms `tb2-bayraktar`; absence of cooperative ID + acoustic/RF fingerprint flags `shahed-136`.
- **yuyay_gate:** `required: false`, `two_person: false`. Floor: axis 3 ≥ 0.90 (the platform-match must be evidence-grounded, not guessed).
- **huklla_tripwires:** `T03`, `T04` (model-integrity of the identifier); `on_trip: escalate` (low-confidence ID is escalated, never auto-asserted).
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"identification","fields":["ts","detection_hash","platform_id","match_method","confidence","ads_b_present"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}
  ```

### Step 3 — `classify_intent`
- **description:** The autonomy classifier scores intent (benign transit / ISR / hostile loiter / attack run). This is the **AI behavior Cannonico wants watched** — the classifier's output is the agentic decision under oversight.
- **yuyay_gate:** `required: false`, `two_person: false` (classification is advisory). All 13 axes evaluated and displayed; a classification that clears the conjunctive AND is marked "gate-clean," one that does not is shown with the **specific blocking axis** named (Rosie-style).
- **huklla_tripwires:** `T03`, `T04`, `T09`, `T10` (the four introspection-linked tripwires — exactly the AI-exceeds-authorized-parameters case); `on_trip: circuit_break` (the classifier is circuit-broken and the call escalates to human if a tripwire fires).
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"classification","fields":["ts","identification_hash","intent_label","intent_score","yuyay_vector_13","blocking_axis","model_id","router_tier"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}
  ```
  `model_id`/`router_tier` record which a11oy.code tier produced the classification (T6 multimodal for EO/IR, per the [router spec](./../puriq/llms/A11OY_CODE_ROUTER_SPEC.md)) — auditable provenance of the AI decision.

### Step 4 — `track`
- **description:** Maintain the track (CesiumJS `SampledPositionProperty` + `trackedEntity`, recipe #11 from the 3D survey cited in the [Killinchu card](./../puriq/integration/HATUN_WILLAY_PER_FLAGSHIP.md)). If intent ≥ hostile AND a hand-off-to-effector is proposed, that hand-off is **state-changing**.
- **yuyay_gate:** `required: true`, `two_person: true` for any engage/hand-off. Floor: 2 sacred ≥ 0.95, 7 structural ≥ 0.90, 4 introspection cross-linked to HUKLLA. **Approvers:** `[mission_commander, oversight_officer]` — two distinct identities. A single identity cannot authorize an engagement hand-off. (The demo stops at "hand-off proposed + gate shown"; Killinchu never fires — it is the oversight layer, not the effector.)
- **huklla_tripwires:** all of `T03,T04,T09,T10` plus `T01` (authority-bound) ; `on_trip: deny`.
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"track_handoff","fields":["ts","classification_hash","track_id","proposed_action","gate_required","two_person","approver_a","approver_b","gate_result"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}
  ```

### Step 5 — `boe_assemble`
- **description:** Sum-check the detection→identification→classification→track receipt chain and assemble the Body of Evidence for this engagement decision.
- **yuyay_gate:** `required: true`, `two_person: true` (export is state-changing). Approvers `[oversight_officer, compliance_lead]`.
- **huklla_tripwires:** `T03` (no receipt may be missing or mutated); `on_trip: deny` (a broken chain blocks export — fail closed).
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"boe_node","fields":["ts","root_hash","receipt_count","dag_sum_check","rmf_crosswalk_ref","approver_a","approver_b"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}
  ```

---

## 4. success_criteria

**machine_checkable** (CI asserts, exit 0/1):
1. Every step emitted a Khipu receipt whose `prev_hash` equals the prior step's `this_hash` (chain-verified).
2. The `boe_node` root hash re-derives to the same value when recomputed independently (`khipu_dag_sum` PASS).
3. Any `track_handoff` with `proposed_action=engage` has `two_person=true` AND `approver_a != approver_b`.
4. A simulated tampered classification (1 byte flipped) causes the DAG sum-check to FAIL (proves tamper-evidence).
5. The Remote-ID-off `shahed-136` track carries a `cue_source=rf_sigint` (proves the RF modality, not optical, found it).

**judge_reviewable** (human confirms by eye in the demo):
1. A drone appears on the Killinchu map and the detection receipt is one click away.
2. The classifier's 13-axis vector is visible; a blocked classification names its blocking axis.
3. The engage hand-off visibly **requires two approvers** and stops there — Killinchu does not fire.
4. Clicking "tamper" flips the banner red and the export is refused.

---

## 5. boe_template (P1 specialization)

- **sections:** Cover · Engagement-decision summary · Receipt manifest (5 receipts) · DAG sum-check · NIST AI RMF crosswalk (links to [P4](./P4_NIST_AI_RMF.md)) · Honest-label appendix · 2-person signatures.
- **crosswalk:** `nist_ai_rmf`
- **export:** `both` (signed PDF + JSON bundle)

## 6. completion_proof
- **format:** `khipu_dag_sum`
- **verifier:** `GET /api/killinchu/missions/MP-P1-CANNONICO/verify` → recomputes root hash, returns `{dag_sum_check: PASS|FAIL, root_hash}`. Re-derivable offline against replay hash `bacf5443…631fc5`.

---

## 7. FOUR-MINUTE DEMO SCRIPT (judging table)

> Target: 4:00 flat. One operator at the keyboard, one narrating. Pre-seeded with a recorded RF/SIGINT cue so it runs airgapped (no live constellation dependency at the table).

| t (mm:ss) | Action | What the judge sees | Receipt |
|---|---|---|---|
| 0:00 | Open `/killinchu/missions` → click **P1 Cannonico Drone Monitor**. | Map with FAA UAS zones; 3 fleet entities idle. | — |
| 0:20 | Press **Inject cue** (pre-seeded HawkEye-360-class RF geolocation). | A new track blooms on the map at the emitter location. | `detection` receipt appears in side rail. |
| 0:50 | Click the track → **Identify**. ADS-B silent. | Panel: "No cooperative ID. Acoustic+RF fingerprint → **Shahed-136**, conf 0.86." | `identification` receipt. |
| 1:20 | Click **Classify intent**. | 13-axis vector renders; label "**hostile loiter**, score 0.81"; gate marked clean (all axes above floor). | `classification` receipt with `yuyay_vector_13`, `router_tier=T6`, `model_id`. |
| 1:55 | Show contrast: click `tb2-bayraktar` (ADS-B on) → classify → "benign ISR." | Same pipeline, cooperative ID, different intent — proves the classifier discriminates. | second `classification` receipt. |
| 2:25 | On the Shahed track, click **Propose hand-off**. | Modal: "Engagement hand-off is state-changing. **2 approvers required.**" Two approver slots. | gate opens; nothing fires. |
| 2:50 | Approver A signs; try to export with only A. | **Refused** — "two distinct identities required." | no `track_handoff` written. |
| 3:05 | Approver B signs. | `track_handoff` receipt written; banner: "Hand-off authorized — Killinchu is oversight only, no effector fired." | `track_handoff` receipt. |
| 3:25 | Click **Assemble BoE** → **Verify**. | "DAG sum-check **PASS**, 5 receipts, root `…`." | `boe_node` receipt. |
| 3:45 | Click **Tamper test** (flip 1 byte in the classification receipt) → **Verify** again. | Banner flips **red**; "DAG sum-check **FAIL** — receipt mutated." Export refused. | tamper logged. |
| 4:00 | End. One line: "Detect to tamper-evident BoE, every step receipted, engagement gated by two humans." | — | — |

**Demo invariants (hard):** runs airgapped; no effector ever fires; the only state changes are gated by 2 approvers; the tamper test must visibly fail closed.

---

## 8. Ship artifacts (per WARHACKER_TIMING_PLAN)
- **HF Space patch:** `/api/killinchu/missions/MP-P1-CANNONICO` + map UI + side-rail receipt viewer.
- **GitHub PR:** classifier-provenance wiring (records `router_tier`/`model_id`), tamper-test harness, 5 machine-checkable assertions as tests.
- **Khipu schema commit:** receipt types `detection, identification, classification, track_handoff, boe_node`.

---

## 9. Standards anchors
NIST AI RMF [AI 100-1](https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf) (MAP-1.5 negative-impact path = the hostile-classify path) and [AI 600-1](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) (confabulation control); receipts target [SCITT architecture draft-22](https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/) signed-statement format (see [P3](./P3_SCITT_COMPLIANCE_RECEIPTS.md)).

— Signed **Yachay** · 2026-06-01 · No mysticism. No bandaid.
