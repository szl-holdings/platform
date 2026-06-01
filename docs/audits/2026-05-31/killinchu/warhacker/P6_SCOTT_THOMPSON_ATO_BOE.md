# MISSION PACK P6 — Scott Thompson ATO Body of Evidence

**id:** `MP-P6-THOMPSON`
**warhacker_problem_id:** P6
**schema:** `mp/v1` (see [MISSION_PACK_SCHEMA.md](./MISSION_PACK_SCHEMA.md))
**Theme:** the **Authority-To-Operate Body of Evidence** the ATO board needs — Khipu DAG sum-checked, signed PDF auto-generated, NIST AI RMF crosswalk, and STIG/SRG control mapping (CCI → NIST 800-53). **Click-to-export.**
**Author:** Yachay · 2026-06-01

---

## 1. Customer & context

| field | value |
|---|---|
| customer.name | Scott Thompson |
| customer.role | ATO authority / authorizing official (the board that says "fielded or not") |
| customer.relationship | ato_authority |
| customer.outreach_ref | [06_THOMPSON_ATO_FINAL.md](./../../06_THOMPSON_ATO_FINAL.md) *(outreach draft per task spec)* |

**customer_context:** An Authorizing Official does not authorize a demo — they authorize a system whose evidence package they can defend. The Body of Evidence (BoE) is that package: the artifact set proving controls are implemented and assessed. P6 makes Killinchu *generate the BoE automatically from a mission run's receipts*, sum-check the Khipu DAG, crosswalk to [NIST AI RMF](./P4_NIST_AI_RMF.md) and to STIG/SRG controls (CCI → NIST 800-53), and export a single signed PDF. This is the ATO-accelerating documentation Defense Unicorns explicitly rewards (per the [Warhacker brief](./../../phd_warhacker/00_WARHACKER_2026_FULL_BRIEF.md): "ATO-ready out of the box").

---

## 2. drone_assignments
| drone_id | role | BoE contribution |
|---|---|---|
| `skydio-x10` | ota_target | OTA + command receipts (CM/SA controls) |
| `shahed-136` | subject | detection/classification receipts (AI-decision controls) |
| `tb2-bayraktar` | subject | command receipts |

P6 is the **aggregator pack**: it consumes the receipts produced by P1–P5 and assembles them into one defensible BoE.

---

## 3. The control crosswalk (CCI → NIST 800-53 → STIG/SRG → AI RMF)

The BoE crosswalk uses the DoD [STIG-to-800-53 mapping](https://csrc.nist.gov/csrc/media/projects/forum/documents/stig-mapping-to-nist-800-53.xlsx) (CCI = Control Correlation Identifier, the atomic unit a STIG/SRG check maps to). Representative mappings the Killinchu BoE auto-populates from receipts:

| Killinchu evidence (receipt) | CCI (example) | NIST 800-53 Rev 5 control | STIG/SRG family | AI RMF tie |
|---|---|---|---|---|
| `scitt_registration` (P3) | CCI-000166 | **AU-10** Non-repudiation | Audit (SRG-APP-000080) | MEASURE 2.6 |
| `signed_statement` / chain (P3) | CCI-001493/4 | **AU-9** Protection of Audit Information | Audit | GOVERN 4.2 |
| `ota_gate` / `ota_stage` (P2) | CCI-001744 | **CM-3** Configuration Change Control | Config Mgmt (SRG-APP-000516) | MANAGE 2.2 |
| `commit_attribution` (P2) | CCI-003114 | **SA-10** Developer Configuration Mgmt | SW Dev | MAP 4.1 |
| `ota_stage` in-toto/SLSA (P2) | CCI-002696 | **SI-7** Software/Firmware/Info Integrity | SI (SRG-APP-000131) | MEASURE 2.1 |
| `track_handoff` 2-person gate (P1) | CCI-000213 | **AC-3 / AC-6** Access/Least Privilege | Access Control | GOVERN 2.3 |
| `rmf_manage` circuit-breaker (P4) | CCI-002824 | **IR-4 / SI-4** Incident Handling / Monitoring | Incident Response | MANAGE 4.1 |
| `commit_attribution` license_class (P2) | CCI-002420 | **SR-3 / SR-4** Supply Chain / Provenance | Supply Chain Risk | GOVERN 6.1 |

For CUI handling, [NIST 800-171](https://csrc.nist.gov/pubs/sp/800/171/r3/final) requirements (3.1.x access, 3.3.x audit, 3.14.x integrity) crosswalk onto the same receipts. Every cell is **evidenced by a receipt hash**, never asserted prose.

---

## 4. Steps (each Khipu-receipted)

### Step 1 — `collect_receipts`
- **description:** Gather all receipts from the selected mission run(s) across P1–P5 into the BoE candidate set.
- **yuyay_gate:** `required: false`, `two_person: false` (collection). Floor: axis 8 (reproducibility) ≥ 0.90 — every collected receipt must replay.
- **huklla_tripwires:** `T03`; `on_trip: deny` (a missing/mutated receipt blocks collection).
- **khipu_receipt_template:** `{"receipt_type":"boe_collect","fields":["ts","run_ids","receipt_hashes","receipt_count"],"hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}`

### Step 2 — `dag_sum_check`
- **description:** Recompute the Khipu DAG root over the collected receipts; compare to recorded root. PASS is required to proceed (fail-closed).
- **yuyay_gate:** `required: false`. Floor: axis 8 ≥ 0.90.
- **huklla_tripwires:** `T03`; `on_trip: deny`.
- **khipu_receipt_template:** `{"receipt_type":"boe_sumcheck","fields":["ts","collect_hash","recomputed_root","recorded_root","result"],"hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}`

### Step 3 — `build_crosswalk`
- **description:** Map every receipt to its CCI / 800-53 / STIG-SRG / AI-RMF entry per §3; mark each control IMPLEMENTED (evidenced) / PARTIAL / NOT-APPLICABLE. PARTIAL items carry the honest label, never falsely IMPLEMENTED.
- **yuyay_gate:** `required: false`. Floor: axes 2 (measurabilityHonesty ≥ 0.95), 6 (citationIntegrity ≥ 0.90).
- **huklla_tripwires:** `T03,T09`; `on_trip: escalate`.
- **khipu_receipt_template:** `{"receipt_type":"boe_crosswalk","fields":["ts","sumcheck_hash","control_rows","implemented_count","partial_count","na_count"],"hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}`

### Step 4 — `export_signed_pdf`
- **description:** Render the BoE PDF (cover, run summary, receipt manifest, DAG sum-check, RMF crosswalk, STIG/SRG-CCI crosswalk, honest-label appendix, signatures), embed the receipt hashes, and sign it. **State-changing** (produces the authoritative export).
- **yuyay_gate:** `required: true`, `two_person: true`. Approvers `[iso_security_officer, authorizing_official_delegate]`. Two distinct identities to issue the BoE.
- **huklla_tripwires:** `T01` (authority), `T03` (integrity), `T10` (STOP available); `on_trip: deny`.
- **khipu_receipt_template:** `{"receipt_type":"boe_export","fields":["ts","crosswalk_hash","pdf_sha256","embedded_root","signature_block","approver_a","approver_b"],"hash_alg":"sha256","chain":"continuum_hash","signature":"COSE_Sign1"}`
  Honest label: the PDF signature uses a **demo key**; production Sigstore-keyless signing is **PLACEHOLDER** until CI signing is wired — stated on the PDF cover, not hidden.

---

## 5. The click-to-export contract

```
GET  /api/killinchu/missions/MP-P6-THOMPSON              -> BoE builder UI (run selector + live control matrix)
POST /api/killinchu/missions/MP-P6-THOMPSON/sumcheck     -> recompute DAG root, return PASS/FAIL
POST /api/killinchu/missions/MP-P6-THOMPSON/export       -> 2-person Yuyay gate -> signed PDF stream (application/pdf)
GET  /api/killinchu/missions/MP-P6-THOMPSON/{export_id}/verify -> re-verify embedded root vs receipts
```
One click on **Export BoE** runs sumcheck → crosswalk → render → 2-person gate → signed PDF download. The PDF's `embedded_root` lets any auditor re-verify it against the live receipt log offline.

---

## 6. success_criteria

**machine_checkable:**
1. `dag_sum_check.result == PASS` is a hard precondition for export; a tampered receipt forces FAIL and blocks export.
2. The exported PDF's `pdf_sha256` matches the `boe_export` receipt, and `embedded_root` matches the recomputed DAG root.
3. Every IMPLEMENTED control row links to ≥ 1 receipt hash; no IMPLEMENTED row is unevidenced.
4. The crosswalk covers all four AI-RMF functions and the STIG/SRG-CCI families in §3.
5. Export requires `approver_a != approver_b` (2-person Yuyay gate).
6. PARTIAL/NA counts are reported; honest labels (demo-key, PLACEHOLDER keyless, SLSA L1) appear on the cover.

**judge_reviewable:**
1. One click produces a downloadable signed PDF.
2. The control matrix shows green IMPLEMENTED cells each linking to a receipt.
3. A tamper test blocks the export with a visible FAIL.
4. The signature page shows two named approvers.

---

## 7. boe_template (P6 — this IS the BoE pack)
- **sections:** Cover (with honest-label banner + locked numbers 749/14/163) · Mission-run summary · Full receipt manifest (all P1–P5 receipts) · Khipu DAG sum-check (root match) · NIST AI RMF crosswalk · STIG/SRG → CCI → 800-53 crosswalk · 800-171 CUI mapping · Honest-label appendix · 2-person signature block.
- **crosswalk:** `stig_srg` (primary) + `nist_ai_rmf` + `nist_800_53`.
- **export:** `signed_pdf` (primary) + `json_bundle`.

## 8. completion_proof
- **format:** `signed_pdf`
- **verifier:** `GET …/{export_id}/verify` re-derives `embedded_root` from the live receipts; PASS ⇒ the PDF is authentic and complete.

---

## 9. DEMO SCRIPT (≈3 minutes — the centerpiece of the Greene flow)
| t | Action | Judge sees |
|---|---|---|
| 0:00 | Open **P6 ATO Body of Evidence**. | Run selector + live control matrix (mostly green IMPLEMENTED). |
| 0:30 | Select the P1+P2+P3 run. | Matrix fills: AU-10, CM-3, SI-7, AC-6, IR-4 cells link to receipts. |
| 1:00 | Click a control cell (e.g. CM-3). | Drills into the `ota_gate` receipt that evidences it. |
| 1:30 | Click **Export BoE**. | Sumcheck PASS → 2-approver gate → both sign. |
| 2:00 | Signed PDF downloads. | PDF cover shows honest-label banner + locked numbers; crosswalk pages populated. |
| 2:25 | Run **Tamper test** then **Export** again. | Sumcheck **FAIL**; export refused — fail-closed. |
| 2:50 | Click **Verify** on the good export. | `embedded_root` re-derives; "authentic & complete." |
| 3:00 | End. | — |

---

## 10. Ship artifacts
- **HF Space patch:** `/api/killinchu/missions/MP-P6-THOMPSON/*` + control-matrix UI + PDF export stream.
- **GitHub PR:** receipt collector across P1–P5, DAG sum-check, CCI/800-53/STIG-SRG crosswalk engine, PDF renderer with embedded-root + signature block, tamper-blocks-export test.
- **Khipu schema commit:** receipt types `boe_collect, boe_sumcheck, boe_crosswalk, boe_export`.

## 11. Standards anchors
[NIST 800-53 Rev 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final), [NIST 800-171](https://csrc.nist.gov/pubs/sp/800/171/r3/final), [DoD STIG→800-53 / CCI mapping](https://csrc.nist.gov/csrc/media/projects/forum/documents/stig-mapping-to-nist-800-53.xlsx), [NIST AI 100-1](https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf), [SCITT architecture draft-22](https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/), [in-toto v1.1](https://github.com/in-toto/attestation/blob/main/spec/README.md), [SLSA v1.0](https://slsa.dev/spec/v1.0/), [COSE RFC 9052](https://www.rfc-editor.org/info/rfc9052).

— Signed **Yachay** · 2026-06-01 · No mysticism. No bandaid.
