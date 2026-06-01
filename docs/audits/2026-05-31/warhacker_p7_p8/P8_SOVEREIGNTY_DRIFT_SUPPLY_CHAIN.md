# MISSION PACK P8 — Sovereignty-Drift Supply Chain

**id:** `MP-P8-SOVEREIGNTY-DRIFT`
**warhacker_problem_id:** P8
**schema:** `mp/v1` (see [MISSION_PACK_SCHEMA.md](./MISSION_PACK_SCHEMA.md))
**Theme:** **"Buy American" is a policy with no machine-checkable definition for AI.** DoD requires domestic / allied sourcing across the stack, but no one can prove sovereignty *per inference* across the chain silicon → weights → fine-tune → inference infrastructure → jurisdiction. The gap between the policy and any verifiable artifact is **sovereignty drift**: a system that *was* compliant silently routes a query to an Amber-licensed model on foreign infrastructure and nobody has a receipt. P8 implements **Sovereignty-Selectable Inference** (Innovation #4 from [NOVEL_INNOVATIONS_15.md](./../../NOVEL_INNOVATIONS_15.md)): toggle **Sovereign mode** and every inference is forced to GREEN-license-only models on US/EU/on-prem infrastructure — and **emits a Khipu receipt that proves the sovereignty of that exact inference**. The Lean obligation `sovereign_never_amber` makes the toggle a checked invariant, not a setting.
**Author:** Yachay · 2026-06-01

---

## 1. Customer & context

| field | value |
|---|---|
| customer.name | DoD CIO supply-chain / NDAA-Section-848 owner *(primary candidate)* — alt: In-Q-Tel, or DIU acquisition |
| customer.role | the official accountable for proving DoD AI procurement meets domestic-sourcing and FEOC restrictions |
| customer.relationship | acquisition_authority / oversight |
| customer.outreach_ref | warm-intro via Andrew Greene → Defense Unicorns / ex-IC orbit ([UDS_ALLIES_ECOSYSTEM.md](./../../UDS_ALLIES_ECOSYSTEM.md)); In-Q-Tel and DIU both reachable through the same network |

**customer_context:** The FY2026 NDAA tightened domestic-sourcing dramatically and, for the first time, **codified DFARS 252.225-7052 under Section 848** to bar critical minerals mined/refined/separated in non-allied nations, with a 5-year runway ([Crowell & Moring, FY2026 NDAA analysis](https://www.crowell.com/en/insights/client-alerts/the-fy-2026-national-defense-authorization-act)). Section 232 semiconductor tariffs took effect Jan 14, 2026 — the first time chip-level provenance carries a tariff line, and the proclamation's exemptions (US data centers, US public-sector use) turn provenance into a *priced* compliance question ([Morgan Lewis, Feb 2026](https://www.morganlewis.com/pubs/2026/02/section-232-investigations-prompt-trade-negotiation)). Meanwhile **Section 162** demands sUAS supply-chain illumination down to disassembling DJI hardware ([Wiley, FY2026 NDAA](https://www.wiley.law/alert-NDAA-Provisions-Impacting-Governments-Contractors-and-Their-Supply-Chains)). For *AI*, none of this is machine-checkable: a model that "was American" can route to an Amber-licensed weight on foreign cloud mid-session. P8 closes that gap with a per-inference, signed sovereignty proof. This is SZL's most direct defense wedge — ranked **#1** of the 15 novel innovations.

**Candidate customer shortlist** (pick one for the booth card):
1. **DoD CIO / Section-848 supply-chain owner** — accountable for the domestic-sourcing proof; P8 is the artifact they currently lack for AI.
2. **In-Q-Tel** — invests in exactly this kind of verifiable-sovereignty primitive; warm intro via the ex-IC orbit around Greene.
3. **DIU acquisition** — buys autonomy software at Replicator scale; sovereignty-by-inference is a fielding differentiator.

---

## 2. drone_assignments

| drone_id | platform | role | sovereignty relevance |
|---|---|---|---|
| `skydio-x10` | Skydio X10 | **sensor** | a Blue-UAS / NDAA-compliant US platform — the "GREEN" end of the hardware spectrum; its EO/IR query should route to a GREEN model in Sovereign mode. |
| `tb2-bayraktar` | Bayraktar TB2 | **ota_target** | allied (NATO) platform — tests the *allied-but-not-domestic* edge of the sourcing rules (DFARS 252.225-7036 FTA path). |
| `shahed-136` | Shahed-136 | **subject** | adversary platform — analyzing it must **never** route the query to a model or infra subject to a foreign adversary; the hardest sovereignty case and the one Section 848/FEOC rules exist for. |

P8 is primarily a **stack** mission (silicon→weights→infra), but it is demonstrated *on a drone query* so it lives in the same Killinchu console as P1–P7. Roles use the canonical enum `subject | sensor | ota_target | n/a`.

---

## 3. The sovereignty crosswalk (policy → machine-checkable receipt field)

Sovereign mode (`governance_tier = sovereign`) forces, **per inference**: license-class ∈ {GREEN} (Apache-2.0 / MIT / NVIDIA-Open and equivalents only), `infra_jurisdiction` ∈ {us, eu, onprem}, and `provider_region` outside any FEOC. The Khipu receipt carries the proof. HUKLLA `T08` (license/AUP) + `T08b` (jurisdiction) are the tripwires; the Lean obligation `sovereign_never_amber` is the checked invariant.

| Policy / authority | what it requires | P8 receipt field that evidences it |
|---|---|---|
| **NDAA Section 848** (FY2026, codifies [DFARS 252.225-7052](https://www.crowell.com/en/insights/client-alerts/the-fy-2026-national-defense-authorization-act)) — no critical-mineral/component sourcing from non-allied nations | chain-of-origin not from FEOC | `silicon_origin`, `provider_region ∉ FEOC` |
| **Section 162 / supply-chain illumination** ([Wiley](https://www.wiley.law/alert-NDAA-Provisions-Impacting-Governments-Contractors-and-Their-Supply-Chains)) — sUAS supply-chain resiliency, FEOC disassembly | illuminate the stack | `model_provenance_chain` (weights→fine-tune→serve) |
| **FAR 52.204-25 / Section 889** (Pub. L. 115-232) — no covered telecom (Huawei, ZTE, Hytera, Hikvision, Dahua) ([acquisition.gov](https://www.acquisition.gov/far/52.204-25)) | exclude covered entities | `feoc_check`, `covered_entity_screen` |
| **DFARS 252.225-7001** Buy American & Balance of Payments ([acquisition.gov](https://www.acquisition.gov/dfars/252.225-7001-buy-american-and-balance-payments-program)) | domestic end-product preference | `infra_jurisdiction == us` |
| **DFARS 252.225-7036** Buy American—FTA—BoP (60%→65%→75% domestic-content thresholds 2024→2029) ([acquisition.gov](https://www.acquisition.gov/dfars/252.225-7036-buy-american%E2%80%94free-trade-agreements%E2%80%94balance-payments-program)) | allied-content path | `infra_jurisdiction ∈ {us, eu}` + `domestic_content_class` |
| **Section 232** semiconductor proclamation (Jan 14, 2026; 25% tariff, US-data-center/public-sector exemptions) ([Morgan Lewis](https://www.morganlewis.com/pubs/2026/02/section-232-investigations-prompt-trade-negotiation)) | chip provenance is now priced | `silicon_origin`, `section232_exempt_basis` |
| **NIST 800-171 / 800-53 Rev 5** SR-3/SR-4 supply-chain provenance ([800-53](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final), [800-171](https://csrc.nist.gov/pubs/sp/800/171/r3/final)) | document provenance | full `model_provenance_chain` + DAG hash |
| **FedRAMP** authorization boundary | infra inside an authorized US boundary | `infra_jurisdiction`, `fedramp_boundary_ref` |

Honest label: P8's `silicon_origin` field is **declarative-with-attestation** at demo time — it records the attested chain (e.g. a vendor SBOM/in-toto statement), it does **not** physically assay the die. Stated on screen. The sovereignty enforcement that is fully machine-checked today is **license-class and jurisdiction routing**; deeper silicon assay is roadmap.

---

## 4. Steps (each Khipu-receipted)

### Step 1 — `inference_request`
- **description:** An operator query arrives (e.g. "classify this `shahed-136` EO frame"). The router records the request and the **current governance_tier** (default vs. sovereign).
- **yuyay_gate:** `required: false`, `two_person: false`. Axes evaluated for display.
- **huklla_tripwires:** watches `T08` (license/AUP); `on_trip: escalate`.
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"inference_request","fields":["ts","query_hash","governance_tier","requested_capability","drone_id"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}
  ```

### Step 2 — `sovereignty_route`
- **description:** The `a11oy.code` router selects a model + infra. In **default** tier it may pick the best-capability model regardless of license/region. In **sovereign** tier it is **forced** to GREEN-license-only models on `{us, eu, onprem}` infrastructure outside any FEOC. The selected route and the alternatives rejected are both recorded.
- **yuyay_gate:** `required: true` in sovereign tier. Floor: axis 6 `citationIntegrity` ≥ 0.90 (the license/region claim must be sourced).
- **huklla_tripwires:** `T08` (license/AUP), `T08b` (jurisdiction); `on_trip: deny` — in sovereign tier a route to an Amber-licensed or FEOC-region model is **blocked** (`sovereign_never_amber`).
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"sovereignty_route","fields":["ts","inference_request_hash","governance_tier","selected_model_id","license_class","infra_jurisdiction","provider_region","feoc_check","rejected_alternatives"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"COSE_Sign1"}
  ```

### Step 3 — `provenance_attest`
- **description:** Assemble the `model_provenance_chain` (silicon_origin → base-weights license → fine-tune lineage → serving infra) and screen against the FEOC / Section-889 covered-entity list. Mark each link IMPLEMENTED (attested) / PARTIAL / NOT-AVAILABLE — PARTIAL carries the honest label, never falsely IMPLEMENTED.
- **yuyay_gate:** `required: true`. Floor: axis 2 `measurabilityHonesty` ≥ 0.95, axis 6 `citationIntegrity` ≥ 0.90.
- **huklla_tripwires:** `T03` (evidence integrity), `T08` (license); `on_trip: escalate`.
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"provenance_attest","fields":["ts","sovereignty_route_hash","silicon_origin","weights_license","finetune_lineage","serving_infra","covered_entity_screen","section232_exempt_basis","attestation_refs"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"COSE_Sign1"}
  ```

### Step 4 — `sovereignty_proof_export`
- **description:** Emit the signed per-inference sovereignty proof: the inference ran on `{model, license=GREEN, jurisdiction, region ∉ FEOC}` and here is the receipt chain that proves it. **State-changing** (authoritative export).
- **yuyay_gate:** `required: true`, `two_person: true`. Approvers `[security_officer, contracting_compliance_lead]` — two distinct identities to issue the sovereignty attestation.
- **huklla_tripwires:** `T01` (authority), `T03` (integrity), `T08/T08b` (license/jurisdiction), `T10` (STOP); `on_trip: deny`.
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"sovereignty_proof","fields":["ts","provenance_attest_hash","governance_tier","root_hash","dag_sum_check","sovereign_invariant_pass","approver_a","approver_b","signature_block"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"COSE_Sign1"}
  ```
  `sovereign_invariant_pass` is the runtime check of the Lean obligation `sovereign_never_amber`. Honest label: production Sigstore-keyless signing is **PLACEHOLDER**; demo uses a COSE demo key; `silicon_origin` is attestation-based, not a physical assay.

---

## 5. success_criteria

**machine_checkable** (CI asserts, exit 0/1):
1. In **default** tier, a query is allowed to route to a non-GREEN / non-US model (baseline behavior recorded).
2. Flipping to **sovereign** tier on the *same query* changes `selected_model_id`, forces `license_class == GREEN` and `infra_jurisdiction ∈ {us,eu,onprem}`, and the `sovereignty_route` receipt **changes** — provable in the side-by-side receipts.
3. A seeded attempt to route to an Amber-licensed model in sovereign tier is **denied**; `sovereign_invariant_pass == false` would block export (proves `sovereign_never_amber`).
4. The `shahed-136` query in sovereign tier never selects a model whose `provider_region` is in the FEOC list (`feoc_check == clear`).
5. Every IMPLEMENTED provenance link points to ≥ 1 `attestation_refs` entry; PARTIAL/NOT-AVAILABLE links are reported honestly.
6. A 1-byte tamper forces the DAG sum-check to **FAIL**; export requires `approver_a != approver_b`.

**judge_reviewable** (human confirms by eye):
1. Toggle **Sovereign mode** and watch the model **route change live** — a different model is selected for the identical query.
2. Two receipts side by side show the license/jurisdiction fields flip from (e.g.) Amber/foreign to GREEN/US.
3. An attempt to force an Amber model in sovereign mode is visibly **refused**.
4. The exported sovereignty proof names two approvers and re-verifies offline.

---

## 6. boe_template (P8 specialization)
- **sections:** Cover (honest-label banner — `silicon_origin` is attested-not-assayed; locked numbers 749/14/163) · Per-inference sovereignty summary · Provenance chain (silicon→weights→fine-tune→serve) · NDAA/DFARS/Section-889 crosswalk (§3) · FEOC / covered-entity screen result · Section 232 chip-provenance note · NIST 800-53 SR-3/SR-4 mapping · Honest-label appendix · 2-person signatures.
- **crosswalk:** `nist_800_53` (SR family, primary) + `ndaa_dfars` + `far_889`. Rolls up into [P6](./P6_SCOTT_THOMPSON_ATO_BOE.md) (SR-3/SR-4 supply-chain rows).
- **export:** `signed_pdf` (primary) + `json_bundle`.

## 7. completion_proof
- **format:** `scitt_transparent_statement` (sovereignty proof registered as a SCITT signed statement) with `khipu_dag_sum` fallback.
- **verifier:** `GET /api/killinchu/missions/MP-P8-SOVEREIGNTY-DRIFT/verify` → recomputes root, checks `sovereign_invariant_pass`, returns `{dag_sum_check, sovereign_invariant_pass, root_hash}`. Offline-capable against replay hash `bacf5443…631fc5`.

The click-to-verify contract:
```
GET  /api/killinchu/missions/MP-P8-SOVEREIGNTY-DRIFT                 -> inference console + Sovereign-mode toggle + route panel
POST /api/killinchu/missions/MP-P8-SOVEREIGNTY-DRIFT/route           -> route a query, return model+license+region + receipt
POST /api/killinchu/missions/MP-P8-SOVEREIGNTY-DRIFT/export          -> 2-person gate -> signed sovereignty proof
GET  /api/killinchu/missions/MP-P8-SOVEREIGNTY-DRIFT/verify          -> re-derive root + re-check sovereign invariant (offline)
```

---

## 8. FOUR-MINUTE DEMO SCRIPT (judging table)

> Target: 4:00 flat. Runs airgapped on the local clone — a small GREEN model and a stub "Amber/foreign" route are both pre-loaded so the route change is real, not mocked.

| t (mm:ss) | Action | What the judge sees | Receipt |
|---|---|---|---|
| 0:00 | Open `/killinchu/missions` → click **P8 Sovereignty-Drift Supply Chain**. | Inference console; a **Sovereign mode** toggle (OFF); route panel idle. | — |
| 0:25 | In **default** mode, send "classify this `shahed-136` EO frame." | Router picks the best-capability model — panel shows `license=Amber`, `region=foreign-cloud`. | `inference_request` + `sovereignty_route` (default). |
| 1:00 | Point out the drift risk: "this query just left American soil and nobody had a receipt." | The receipt **already captured it** — drift is now evidence, not invisible. | (same receipt). |
| 1:25 | Flip **Sovereign mode ON**. Re-send the identical query. | Route **changes live**: `selected_model_id` switches to a GREEN model, `license=GREEN (Apache-2.0)`, `infra_jurisdiction=us`, `feoc_check=clear`. | new `sovereignty_route` (sovereign). |
| 1:55 | Show the two receipts side by side. | License/region fields visibly flipped; `rejected_alternatives` lists the Amber model that *was* picked. | diff view. |
| 2:25 | Try to force the Amber model while sovereign. | **Refused** — banner: "`sovereign_never_amber` invariant — route blocked." | denial logged. |
| 2:45 | Click **Attest provenance**. | Chain renders: silicon→weights→fine-tune→serve, FEOC screen `clear`, Section-889 `clear`; PARTIAL links honestly flagged. | `provenance_attest`. |
| 3:10 | Click **Export sovereignty proof** → 2-approver gate; A then B sign. | Signed proof; cover shows honest-label banner (silicon attested-not-assayed). | `sovereignty_proof`. |
| 3:35 | Click **Tamper test** → **Verify**. | Banner **red**; "DAG sum-check **FAIL**." Export refused. | tamper logged. |
| 4:00 | End. One line: "'Buy American' for AI is now a toggle that proves itself per inference, with a court-admissible receipt." | — | — |

**Demo invariants (hard):** runs airgapped; the route change is a *real* model swap, not a label flip; the Amber-in-sovereign attempt must visibly fail closed; on-screen banner states silicon_origin is attestation-based and the signature is a demo key.

---

## 9. Standards anchors

- **NDAA FY2026 Section 848** — codifies [DFARS 252.225-7052](https://www.crowell.com/en/insights/client-alerts/the-fy-2026-national-defense-authorization-act) (no critical minerals/components from non-allied nations; Berry-Amendment lineage, 10 U.S.C. § 4862; 5-yr runway); **Section 162** sUAS supply-chain illumination + FEOC disassembly per [Wiley](https://www.wiley.law/alert-NDAA-Provisions-Impacting-Governments-Contractors-and-Their-Supply-Chains).
- **FAR 52.204-25 / Section 889** (Pub. L. 115-232) — prohibition on covered telecom (Huawei, ZTE, Hytera, Hikvision, Dahua) — [acquisition.gov](https://www.acquisition.gov/far/52.204-25).
- **DFARS 252.225-7001** Buy American & Balance of Payments — [acquisition.gov](https://www.acquisition.gov/dfars/252.225-7001-buy-american-and-balance-payments-program); **DFARS 252.225-7036** Buy American—FTA—BoP (60/65/75% domestic-content thresholds) — [acquisition.gov](https://www.acquisition.gov/dfars/252.225-7036-buy-american%E2%80%94free-trade-agreements%E2%80%94balance-payments-program).
- **Section 232 Trade Expansion Act** semiconductor proclamation, Jan 14 2026 (25% tariff on H200/MI325X-class chips; US data-center / public-sector exemptions) — [Morgan Lewis](https://www.morganlewis.com/pubs/2026/02/section-232-investigations-prompt-trade-negotiation), [White House proclamation](https://www.whitehouse.gov/presidential-actions/2026/01/adjusting-imports-of-semiconductors-semiconductor-manufacturing-equipment-and-their-derivative-products-into-the-united-states/).
- **NIST 800-53 Rev 5** SR-3/SR-4 supply-chain provenance — [csrc](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final); **NIST 800-171** — [csrc](https://csrc.nist.gov/pubs/sp/800/171/r3/final).
- **Receipt formats:** [SCITT architecture draft-22](https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/), [COSE RFC 9052](https://www.rfc-editor.org/info/rfc9052), [in-toto v1.1](https://github.com/in-toto/attestation/blob/main/spec/README.md), [SLSA v1.0](https://slsa.dev/spec/v1.0/) (honest label: SZL is SLSA **L1**, not L3).
- **Innovation basis:** Sovereignty-Selectable Inference, #4 of [NOVEL_INNOVATIONS_15.md](./../../NOVEL_INNOVATIONS_15.md) (regional GREEN models incl. EuroLLM, Salamandra/Latxa, Sailor 2).

— Signed **Yachay** · 2026-06-01 · No mysticism. No bandaid.
