# MISSION PACK P2 — Carneiro Vibe-Coding Governance (Drone Firmware OTA)

**id:** `MP-P2-CARNEIRO`
**warhacker_problem_id:** P2
**schema:** `mp/v1` (see [MISSION_PACK_SCHEMA.md](./MISSION_PACK_SCHEMA.md))
**Theme:** vibe-coding governance applied to the **drone FIRMWARE OTA workflow** — the Khipu DAG catches a bad commit *before* the over-the-air push, with full "which model wrote which code" provenance from the a11oy.code router.
**Author:** Yachay · 2026-06-01

---

## 1. Customer & context

| field | value |
|---|---|
| customer.name | Pedro Carneiro |
| customer.role | AI-governance partner (vibe-coding governance) |
| customer.relationship | standards_partner |
| customer.outreach_ref | [02_CARNEIRO_EMAIL_FINAL.md](./../../02_CARNEIRO_EMAIL_FINAL.md) *(outreach draft — to be filed under round2/ per task spec)* |

**customer_context:** "Vibe coding" — generating code by prompting an LLM — is now how a lot of firmware actually gets written, and nobody can answer *which model wrote which line, and who approved the push.* Carneiro's problem: governance for AI-authored code, specifically for the highest-stakes target — **drone firmware delivered over-the-air**. A bad OTA push can brick or hijack a fleet. P2 shows the Khipu DAG intercepting a bad AI-authored commit before it reaches the OTA channel, with per-commit model attribution.

> Note: the `02_CARNEIRO_EMAIL_FINAL.md` outreach draft is referenced per the task's existing-drafts list; this pack assumes that draft frames Carneiro as the vibe-coding-governance customer. If the filed draft differs, update `customer.role` to match — the pack mechanics are unchanged.

---

## 2. drone_assignments

| drone_id | platform | role | why |
|---|---|---|---|
| `skydio-x10` | Skydio X10 | **ota_target** | autonomous quad whose autonomy/flight firmware is the OTA payload |
| `tb2-bayraktar` | Bayraktar TB2 | **ota_target** | second fleet type — proves multi-platform OTA gating |

---

## 3. The workflow being governed

```
prompt -> a11oy.code router -> model writes firmware patch -> commit
        -> Khipu DAG governance gate (THIS PACK)  -> [PASS] sign+stage OTA  | [FAIL] block, never push
```

Every commit carries a provenance receipt that records, per the [a11oy.code router spec](./../puriq/llms/A11OY_CODE_ROUTER_SPEC.md): the **router tier** (T3 code-specialized: Codestral 25.01 primary, Qwen3-Coder / DeepSeek V3 fallbacks), the **selected model**, the **license class** (GREEN/AMBER/RED), and the **routing reason**. This is the "which model wrote which code" auditable record. The router "does not decide; it generates options and emits a Khipu receipt for every call" — decision (admit/block) is the Yuyay gate downstream.

---

## 4. Steps (each Khipu-receipted)

### Step 1 — `attribute_commit`
- **description:** For each AI-authored commit, record provenance from the router: tier, model, license class, prompt hash, diff hash.
- **yuyay_gate:** `required: false`, `two_person: false` (recording, not changing state). Floor displayed: axis 4 (model-integrity) ≥ 0.90.
- **huklla_tripwires:** `T04` (model-integrity), `T03` (evidence); `on_trip: escalate` (unattributable commit is escalated — no anonymous code reaches the gate).
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"commit_attribution","fields":["ts","commit_sha","diff_hash","prompt_hash","router_tier","model_id","license_class","routing_reason"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}
  ```

### Step 2 — `governance_gate` (the DAG check that catches the bad commit)
- **description:** Run the commit through the governance DAG: SENTRA inline screen (six threat signatures incl. `eval(`, `subprocess`, `../../etc` — directly relevant to firmware injection) + SLSA provenance check + 13-axis Yuyay evaluation. A bad commit (e.g. an unauthorized `subprocess` call to a hardcoded C2 address, or a diff that fails the autonomy-bounds policy) trips here.
- **yuyay_gate:** `required: true`, `two_person: false` for the *gate decision itself* (the gate is automated and fails closed); BUT an **override** to push a gate-failed commit requires `two_person: true`, approvers `[firmware_lead, security_officer]`. There is no silent override.
- **huklla_tripwires:** `T03,T04,T09,T10` + `T06` (supply-chain); `on_trip: deny` — matching SENTRA's rule that a failed payload's receipt **never enters the ledger** and there is no partial state.
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"ota_gate","fields":["ts","commit_attribution_hash","sentra_result","slsa_level","yuyay_vector_13","blocking_axis","gate_result","override_used","approver_a","approver_b"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}
  ```

### Step 3 — `sign_and_stage_ota`
- **description:** Only a PASS commit is signed (in-toto attestation + cosign keyless) and staged to the OTA channel for the `ota_target` drones. Staging is **state-changing**.
- **yuyay_gate:** `required: true`, `two_person: true`. Approvers `[firmware_lead, mission_commander]`.
- **huklla_tripwires:** `T01` (authority), `T06` (supply-chain); `on_trip: deny`.
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"ota_stage","fields":["ts","ota_gate_hash","artifact_hash","intoto_predicate","slsa_level","cosign_sig","target_drones","approver_a","approver_b"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}
  ```
  Honest label: `cosign_sig` / Sigstore keyless is **PLACEHOLDER** until CI signing is wired (carried from the [a11oy card](./../puriq/integration/HATUN_WILLAY_PER_FLAGSHIP.md)); SLSA level is reported honestly as **L1** ("SLSA L3" is BANNED).

---

## 5. success_criteria

**machine_checkable:**
1. Every commit has a `commit_attribution` receipt naming a concrete `model_id` and `license_class` (no `unknown`).
2. The seeded **bad commit** (hardcoded-C2 `subprocess`) trips `ota_gate` with `gate_result=BLOCK` and `blocking_axis` named, AND no `ota_stage` receipt is written for it.
3. A clean commit produces `gate_result=PASS` → exactly one `ota_stage` receipt with a non-empty `intoto_predicate`.
4. Any `override_used=true` has `approver_a != approver_b`.
5. The provenance chain re-derives "which model wrote the staged firmware" from receipts alone.

**judge_reviewable:**
1. The screen shows, per commit, the model that wrote it and its license class.
2. The bad commit is **visibly blocked before OTA** — it never reaches the staging lane.
3. Pushing the bad commit anyway requires two named approvers (and the demo does not do so).

---

## 6. boe_template (P2)
- **sections:** Cover · OTA-governance summary · Commit provenance table · Gate decisions · in-toto/SLSA provenance · Honest-label appendix · 2-person signatures.
- **crosswalk:** `nist_800_53` (CM-3 Configuration Change Control, SA-10 Developer Configuration Management, SA-11 Developer Testing; SI-7 software integrity) — see [P6](./P6_SCOTT_THOMPSON_ATO_BOE.md) for the full crosswalk.
- **export:** `both`

## 7. completion_proof
- **format:** `khipu_dag_sum`
- **verifier:** `GET /api/killinchu/missions/MP-P2-CARNEIRO/verify` → confirms (a) bad commit has no `ota_stage` descendant, (b) every `ota_stage` has a PASS `ota_gate` parent.

---

## 8. DEMO SCRIPT (≈3 minutes)

| t | Action | Judge sees |
|---|---|---|
| 0:00 | Open P2. Two pending commits: `C-good` and `C-bad`. | Commit list with model attribution column. |
| 0:25 | Expand `C-good`. | "Codestral 25.01 (T3, GREEN/Apache-2.0) wrote this, routing reason: code-edit." |
| 0:45 | Expand `C-bad`. | Attribution shows model + the diff adds `subprocess.call` to a hardcoded IP. |
| 1:05 | Run **Governance gate** on both. | `C-good` → PASS (green); `C-bad` → **BLOCK**, blocking axis named, SENTRA signature `subprocess` flagged. |
| 1:35 | Try to **stage** `C-bad`. | Refused — "gate FAILED; override needs 2 approvers." Demo declines override. |
| 1:55 | **Stage** `C-good`. | 2-approver modal → both sign → `ota_stage` receipt with in-toto predicate, SLSA L1 (honest). |
| 2:20 | Click **OTA targets**. | `skydio-x10`, `tb2-bayraktar` listed as recipients of the signed artifact. |
| 2:40 | Click **Verify chain**. | "Staged firmware authored by Codestral 25.01; bad commit blocked, never staged. DAG PASS." |
| 3:00 | End. | — |

---

## 9. Ship artifacts
- **HF Space patch:** `/api/killinchu/missions/MP-P2-CARNEIRO` + commit-attribution UI + gate lane animation.
- **GitHub PR:** router→Khipu provenance emitter, SENTRA firmware-signature pack, gate-block test with the seeded bad commit.
- **Khipu schema commit:** receipt types `commit_attribution, ota_gate, ota_stage`.

## 10. Standards anchors
[in-toto Attestation Framework v1.1](https://github.com/in-toto/attestation/blob/main/spec/README.md) (commit/build predicate), [SLSA v1.0](https://slsa.dev/spec/v1.0/) (provenance, honest L1), [COSE RFC 9052](https://www.rfc-editor.org/info/rfc9052) (signature structure), NIST 800-53r5 CM/SA/SI families ([SP 800-53r5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)).

— Signed **Yachay** · 2026-06-01 · No mysticism. No bandaid.
