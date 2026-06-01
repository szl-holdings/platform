# MISSION PACK P4 — NIST AI RMF for Drone Autonomy Decisions

**id:** `MP-P4-NISTRMF`
**warhacker_problem_id:** P4
**schema:** `mp/v1` (see [MISSION_PACK_SCHEMA.md](./MISSION_PACK_SCHEMA.md))
**Theme:** every drone-autonomy decision is evaluated through the **NIST AI RMF** (GOVERN / MAP / MEASURE / MANAGE). Each Yuyay axis maps to a NIST risk category; an **RMF profile is auto-generated from a single mission run**.
**Author:** Yachay · 2026-06-01

---

## 1. Customer & context

| field | value |
|---|---|
| customer.name | NIST AI RMF program (framework owner) / DoD authorizers who require RMF alignment |
| customer.role | the risk framework the ATO board uses to judge "is this AI safe to field" |
| customer.relationship | standards_partner |
| customer.outreach_ref | [04_NIST_EMAIL_FINAL.md](./../../04_NIST_EMAIL_FINAL.md) + [04_NIST_AI_RMF_HOOKS.md](./../../phd_warhacker/04_NIST_AI_RMF_HOOKS.md) |

**customer_context:** The existing [NIST AI RMF hooks brief](./../../phd_warhacker/04_NIST_AI_RMF_HOOKS.md) maps SZL components (a11oy/sentra/amaru) to RMF subcategories but flags every function as **PARTIAL** — "monitoring exists; formal metrics definition needed." P4 closes that gap for Killinchu specifically: it shows the drone-autonomy decision from [P1](./P1_CANNONICO_DRONE_MONITOR.md) flowing through all four RMF functions, and auto-generates the RMF profile from the receipts of one run. The framework is [NIST AI 100-1](https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf) (RMF 1.0) plus the [AI 600-1 GenAI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence).

---

## 2. drone_assignments
| drone_id | role | RMF exercise |
|---|---|---|
| `shahed-136` | subject | the high-risk decision (hostile classification → MAP-1.5 negative impact, MANAGE-2.2 enforcement) |
| `tb2-bayraktar` | subject | the benign baseline (MEASURE comparison) |
| `skydio-x10` | sensor | autonomy-stack telemetry feeding MEASURE drift metrics |

---

## 3. Yuyay-axis → NIST AI RMF crosswalk

The 13-axis `yuyay_v3` heart is conjunctive (AND, no compensation): score is 0 unless **all 13** clear their floors — 2 sacred ≥ 0.95, 7 structural ≥ 0.90, 4 introspection cross-linked to HUKLLA T03/T04/T09/T10 (per [Doctrine v12 §2](./../puriq/doctrine/PURIQ_DOCTRINE_v12.md)). The receipt-schema axis names are `{moralGrounding, measurabilityHonesty, epistemicHumility, harmAvoidance, logicalCoherence, citationIntegrity, noveltyContribution, reproducibility, stakeholderAlignment}` plus the four introspection axes (per the platform `AxesSchema`). The crosswalk:

| # | Yuyay axis | class | floor | NIST AI RMF category | RMF rationale |
|---|---|---|---|---|---|
| 1 | moralGrounding | sacred | 0.95 | **GOVERN 1.1 / GOVERN 4.1** | documented risk policy + culture of risk awareness — the action must be policy-grounded |
| 2 | measurabilityHonesty | sacred | 0.95 | **MEASURE 2.6** (transparency/explainability) | the decision must be honestly measurable, not asserted |
| 3 | empiricalGrounding | structural | 0.90 | **MAP 1.1** (context established) | the track/classification must be grounded in real sensor evidence |
| 4 | harmAvoidance | structural | 0.90 | **MAP 1.5 / MANAGE 1.1** (negative impacts; risk prioritization) | the engagement decision must weigh harm; hostile path is the MAP-1.5 output |
| 5 | logicalCoherence | structural | 0.90 | **MEASURE 1.2** (methods appropriate) | the inference chain detection→intent must be coherent |
| 6 | citationIntegrity | structural | 0.90 | **MAP 4.1 / GOVERN 6.1** (third-party component risk) | every model/data source is attributed (links to P2 provenance) |
| 7 | noveltyContribution | structural | 0.90 | **MEASURE 3.2** (evolution tracked) | flags out-of-distribution / novel behavior for tracking |
| 8 | reproducibility | structural | 0.90 | **MEASURE 2.1 / MEASURE 3.1** (validity; tracking) | the decision must replay to the same result (replay hash) |
| 9 | claimCalibration | structural | 0.90 | **MEASURE 2.3** (security/resilience) + **MANAGE 1.1** | confidence must be calibrated, not over-claimed |
| 10 | introspection-T03 | introspection | xlink T03 | **MEASURE 2.6 / AU evidence** | self-check of evidence integrity (HUKLLA T03) |
| 11 | introspection-T04 | introspection | xlink T04 | **MEASURE 1.1** (metrics) + GenAI confabulation | self-check of model integrity (HUKLLA T04) — catches confabulation |
| 12 | introspection-T09 | introspection | xlink T09 | **MEASURE 2.2** (safety) | self-check against non-equivocation (HUKLLA T09) |
| 13 | introspection-T10 | introspection | xlink T10 | **MANAGE 4.1** (incident response) | STOP/undo absorbing halt = circuit-breaker (HUKLLA T10) |

**Function-level rollup (how the four RMF functions are satisfied):**
- **GOVERN** — axes 1, 6 + the 2-person Yuyay gate provide accountability (GOVERN 2.2/2.3 independent audit + human oversight).
- **MAP** — axes 3, 4, 6 scope context, harms, and third-party risk (MAP 1.1/1.5/4.1).
- **MEASURE** — axes 2, 5, 7, 8, 9, 10–12 + amaru drift metrics (MEASURE 1–3).
- **MANAGE** — axes 4, 9, 13 + HUKLLA circuit-breaker drive prioritization, enforcement, and incident halt (MANAGE 1.1/2.2/4.1).

---

## 4. Steps (each Khipu-receipted)

### Step 1 — `rmf_govern_bind`
- **description:** Bind the mission run to the active governance policy version + the 2-person approver roster. Establishes GOVERN accountability for this run.
- **yuyay_gate:** `required: false`, `two_person: false` (binding context). Floor: axis 1 ≥ 0.95.
- **huklla_tripwires:** `T01` (authority); `on_trip: deny`.
- **khipu_receipt_template:** `{"receipt_type":"rmf_govern","fields":["ts","policy_version","approver_roster","govern_subcats"],"hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}`

### Step 2 — `rmf_map_scope`
- **description:** From the P1 detection/identification, record the MAP context: subject platform, mission scope, potential negative impacts (MAP-1.5), third-party model components (MAP-4.1).
- **yuyay_gate:** `required: false`. Floor: axes 3, 4 ≥ 0.90.
- **huklla_tripwires:** `T03`; `on_trip: escalate`.
- **khipu_receipt_template:** `{"receipt_type":"rmf_map","fields":["ts","detection_hash","subject","mission_scope","negative_impacts","third_party_models","map_subcats"],"hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}`

### Step 3 — `rmf_measure_eval`
- **description:** Evaluate the autonomy decision: capture the 13-axis vector, amaru behavioral-drift z-score, confabulation check (GenAI 600-1). Map each axis to its MEASURE subcategory.
- **yuyay_gate:** `required: false`. All 13 axes evaluated; blocking axis named if any sub-floor.
- **huklla_tripwires:** `T03,T04,T09,T10`; `on_trip: circuit_break`.
- **khipu_receipt_template:** `{"receipt_type":"rmf_measure","fields":["ts","classification_hash","yuyay_vector_13","drift_zscore","confabulation_flag","measure_subcats"],"hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}`

### Step 4 — `rmf_manage_treat`
- **description:** Risk treatment: prioritize (severity), document response (deny/flag/escalate), and on any tripwire engage the MANAGE-4.1 circuit-breaker. This is **state-changing** (it can halt the agent).
- **yuyay_gate:** `required: true`, `two_person: true`. Approvers `[oversight_officer, risk_owner]`.
- **huklla_tripwires:** `T10` (absorbing halt); `on_trip: circuit_break`.
- **khipu_receipt_template:** `{"receipt_type":"rmf_manage","fields":["ts","measure_hash","severity","response_action","circuit_breaker_engaged","residual_risk","approver_a","approver_b","manage_subcats"],"hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}`

### Step 5 — `rmf_profile_generate`
- **description:** Sum-check the four receipts and emit the **auto-generated RMF profile** for this run: a table of every touched subcategory with PASS/PARTIAL/N-A and the receipt hash that evidences it.
- **yuyay_gate:** `required: true`, `two_person: true` (export). Approvers `[compliance_lead, risk_owner]`.
- **huklla_tripwires:** `T03`; `on_trip: deny`.
- **khipu_receipt_template:** `{"receipt_type":"rmf_profile","fields":["ts","govern_hash","map_hash","measure_hash","manage_hash","profile_root","subcat_count","approver_a","approver_b"],"hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}`

---

## 5. success_criteria

**machine_checkable:**
1. The auto-generated RMF profile names ≥ 1 subcategory under each of GOVERN, MAP, MEASURE, MANAGE, each tied to a real receipt hash.
2. Every Yuyay axis in the run resolves to its mapped RMF category per §3 (crosswalk completeness).
3. A run where the classifier confabulates (seeded) sets `confabulation_flag=true` (GenAI 600-1) and trips T04 → `circuit_breaker_engaged=true`.
4. The `rmf_profile` root re-derives (DAG sum-check PASS).
5. Honest labels are preserved: any subcategory the run cannot evidence is marked **PARTIAL/N-A**, never falsely PASS.

**judge_reviewable:**
1. One mission run produces a one-page RMF profile with all four functions populated.
2. The blocking axis (if any) is named and shown mapped to its NIST category.
3. The GenAI confabulation case visibly trips the circuit-breaker (MANAGE-4.1).

---

## 6. boe_template (P4)
- **sections:** Cover · RMF profile (4 functions) · Yuyay↔RMF crosswalk · MEASURE metrics (drift z-score, confabulation) · GenAI 600-1 hooks · Honest-label appendix (PARTIAL items disclosed) · 2-person signatures.
- **crosswalk:** `nist_ai_rmf`
- **export:** `both`

## 7. completion_proof
- **format:** `khipu_dag_sum`
- **verifier:** `GET /api/killinchu/missions/MP-P4-NISTRMF/verify` → returns the profile + `{dag_sum_check, functions_covered:[GOVERN,MAP,MEASURE,MANAGE]}`.

---

## 8. DEMO SCRIPT (≈3 minutes)
| t | Action | Judge sees |
|---|---|---|
| 0:00 | Open P4 on the existing Shahed-136 classification from P1. | RMF panel, four function columns empty. |
| 0:30 | Click **Run RMF**. | GOVERN→MAP→MEASURE→MANAGE fill in; each cell links to a receipt. |
| 1:10 | Hover a Yuyay axis. | Tooltip shows its NIST subcategory mapping (e.g. claimCalibration → MEASURE 2.3). |
| 1:40 | Click **Generate profile**. | One-page profile; 2-approver export gate. |
| 2:05 | Switch to the seeded **confabulation** run. | `confabulation_flag=true`, T04 trips, circuit-breaker engaged (MANAGE-4.1) — visibly halted. |
| 2:40 | Click **Verify**. | DAG PASS; all four functions covered; PARTIAL items honestly listed. |
| 3:00 | End. | — |

---

## 9. Ship artifacts
- **HF Space patch:** `/api/killinchu/missions/MP-P4-NISTRMF` + RMF four-function panel + crosswalk tooltips + profile export.
- **GitHub PR:** Yuyay→RMF crosswalk table as code, drift-zscore + confabulation evaluator, profile generator, confabulation-circuit-break test.
- **Khipu schema commit:** receipt types `rmf_govern, rmf_map, rmf_measure, rmf_manage, rmf_profile`.

## 10. Standards anchors
[NIST AI 100-1 (RMF 1.0)](https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf), [NIST AI 600-1 GenAI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence), [AI RMF Playbook](https://airc.nist.gov/docs/AI_RMF_Playbook.pdf). Crosswalk anchored to the [existing NIST AI RMF hooks brief](./../../phd_warhacker/04_NIST_AI_RMF_HOOKS.md).

— Signed **Yachay** · 2026-06-01 · No mysticism. No bandaid.
