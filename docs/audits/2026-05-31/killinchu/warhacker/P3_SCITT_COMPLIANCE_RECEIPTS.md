# MISSION PACK P3 — SCITT Compliance Receipts

**id:** `MP-P3-SCITT`
**warhacker_problem_id:** P3
**schema:** `mp/v1` (see [MISSION_PACK_SCHEMA.md](./MISSION_PACK_SCHEMA.md))
**Theme:** every OTA, every command, every detection becomes a **SCITT-format compliance receipt** — a COSE_Sign1 Signed Statement, registered to a Transparency Service, returning a Receipt that upgrades it to a Transparent Statement. The live receipt log is served at `/killinchu/scitt`.
**Author:** Yachay · 2026-06-01

---

## 1. Customer & context

| field | value |
|---|---|
| customer.name | SCITT Working Group (IETF) / DoD supply-chain stakeholders |
| customer.role | standards body whose format we conform to; the receipts are the evidence DoD authorizers ask for |
| customer.relationship | standards_partner |
| customer.outreach_ref | [03_SCITT_EMAIL_FINAL.md](./../../03_SCITT_EMAIL_FINAL.md) *(outreach draft per task spec)* |

**customer_context:** The Killinchu Khipu DAG already produces append-only, hash-chained receipts. P3 maps that internal format onto the **interoperable** IETF SCITT format so a third party — an ATO board, an allied partner, a different Transparency Service — can verify our receipts without trusting our code. Per the [SCITT architecture (draft-22)](https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/), a Verifiable Data Structure MUST support **Append-Only, Non-equivocation, and Replayability** — exactly the YAWAR ledger discipline (`json.dumps(sort_keys=True)`→`sha256`, `continuum_hash`, replay hash `bacf5443…631fc5`), so the bridge is natural, not bolted on.

---

## 2. drone_assignments
| drone_id | role | what gets receipted |
|---|---|---|
| `shahed-136` | subject | every **detection** statement |
| `skydio-x10` | ota_target | every **OTA** and **command** statement |
| `tb2-bayraktar` | subject | every **command** and detection statement |

---

## 3. The Khipu → SCITT bridge

| Killinchu (Khipu) | SCITT term (draft-22) | Encoding |
|---|---|---|
| Receipt payload (canonical JSON of a detection/OTA/command) | **Statement** about an Artifact | CBOR/JSON payload |
| Signed receipt | **Signed Statement** | `Signed_Statement = #6.18(COSE_Sign1)`; payload = the Statement |
| Issuer (`SZLHOLDINGS`) bound in protected header | **Issuer Claim** (CWT Claims, label 1) per [RFC 9597] | COSE protected header |
| Subject (the drone/event id) | **Subject Claim** (label 2) | COSE protected header |
| `continuum_hash` chain membership | inclusion in the **Verifiable Data Structure** | Merkle log |
| Registration response | **Receipt** (inclusion proof) | COSE_Sign1, stored in unprotected header field `receipts: 394` |
| Signed receipt + its Receipt | **Transparent Statement** | `Transparent_Statement = #6.18(COSE_Sign1)` |

The Transparency Service we run for the demo is the Killinchu `/killinchu/scitt` endpoint; its identity is a public key Relying Parties use to validate Receipts. Signatures use **COSE_Sign1** per [RFC 9052](https://www.rfc-editor.org/info/rfc9052) with algorithms from [RFC 9053](https://www.rfc-editor.org/info/rfc9053). The REST surface follows [SCRAPI draft-09](https://datatracker.ietf.org/doc/draft-ietf-scitt-scrapi/).

Honest label: our COSE signing key is a **demo key**; the Sigstore-keyless production path is **PLACEHOLDER** until CI signing is wired — disclosed, not hidden.

---

## 4. Steps (each Khipu-receipted AND SCITT-registered)

### Step 1 — `build_signed_statement`
- **description:** Take a Killinchu event (detection / OTA stage / command). Build the Statement payload; wrap in a COSE_Sign1 with protected-header CWT Claims (Issuer=`SZLHOLDINGS`, Subject=event id).
- **yuyay_gate:** `required: false`, `two_person: false` (encoding step). Floor: axis 3 ≥ 0.90 (statement must reference a real, grounded event).
- **huklla_tripwires:** `T03`; `on_trip: deny` (no statement for a non-existent event).
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"signed_statement","fields":["ts","event_hash","issuer","subject","cose_protected_b64","alg","payload_hash"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"COSE_Sign1"}
  ```

### Step 2 — `register_statement`
- **description:** Submit the Signed Statement to the Transparency Service. The TS runs the **mandatory registration checks** (cryptographically verify the COSE signature; confirm Issuer bound in protected header) + the local **Registration Policy**, then appends to the Verifiable Data Structure and returns a Receipt. Registration is **state-changing** (it extends the append-only log).
- **yuyay_gate:** `required: true`, `two_person: true`. Approvers `[ts_operator, compliance_lead]` — two identities to extend the public log.
- **huklla_tripwires:** `T03` (append-only integrity), `T06` (supply-chain), `T09` (non-equivocation); `on_trip: deny`.
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"scitt_registration","fields":["ts","signed_statement_hash","registration_policy_id","vds_leaf_index","receipt_cose_b64","ts_pubkey_kid","approver_a","approver_b"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"COSE_Sign1"}
  ```

### Step 3 — `emit_transparent_statement`
- **description:** Attach the Receipt to the Signed Statement's COSE unprotected header (`receipts: 394`) → Transparent Statement. Publish to `/killinchu/scitt` log view.
- **yuyay_gate:** `required: false`, `two_person: false` (publishing an already-registered statement).
- **huklla_tripwires:** `T03`; `on_trip: deny`.
- **khipu_receipt_template:**
  ```json
  {"receipt_type":"transparent_statement","fields":["ts","registration_hash","transparent_statement_cose_b64","inclusion_proof_verified"],
   "hash_alg":"sha256","chain":"continuum_hash","signature":"COSE_Sign1"}
  ```

---

## 5. The live endpoint `/killinchu/scitt`

```
GET  /api/killinchu/scitt              -> log view: paginated Transparent Statements (type, subject, issuer, leaf index, verified ✓)
GET  /api/killinchu/scitt/{leaf}       -> single Transparent Statement (COSE bytes + decoded headers)
POST /api/killinchu/scitt/entries      -> register a Signed Statement (SCRAPI-style); 2-person Yuyay gate enforced
GET  /api/killinchu/scitt/{leaf}/receipt -> the Receipt (COSE_Sign1 inclusion proof) for offline verification
GET  /api/killinchu/scitt/checkpoint   -> signed VDS root + size (consistency/replay)
```
Every detection from [P1](./P1_CANNONICO_DRONE_MONITOR.md), every OTA stage from [P2](./P2_CARNEIRO_VIBE_CODING_GOVERNANCE.md), and every command flows into this log automatically. The log view shows the three required VDS properties live: **Append-Only** (leaf index only grows), **Non-equivocation** (one root per checkpoint), **Replayability** (recompute root → matches).

---

## 6. success_criteria

**machine_checkable:**
1. Every P1 detection, P2 OTA stage, and command has a corresponding `scitt_registration` receipt with a non-empty `receipt_cose_b64`.
2. Each emitted Receipt's inclusion proof verifies against the published checkpoint root (`inclusion_proof_verified=true`).
3. The COSE_Sign1 protected header of every Signed Statement contains Issuer (label 1)=`SZLHOLDINGS` and a Subject (label 2).
4. The VDS is append-only: leaf indices are strictly increasing; a recomputed root equals the checkpoint root (replayability).
5. A tampered Signed Statement fails COSE signature verification at `register_statement` and is **rejected** (no leaf created).

**judge_reviewable:**
1. `/killinchu/scitt` shows a growing log; each row has a green "verified" check.
2. Clicking a row shows decoded COSE headers naming `SZLHOLDINGS` as Issuer.
3. Downloading a Receipt and verifying it with an independent COSE tool succeeds (interoperability).

---

## 7. boe_template (P3)
- **sections:** Cover · SCITT conformance summary · Transparent-Statement manifest · Checkpoint/replay proof · COSE header decode samples · Honest-label appendix (demo key, PLACEHOLDER keyless) · 2-person signatures.
- **crosswalk:** `nist_800_53` (AU-10 Non-repudiation, AU-9 Protection of Audit Information, SR-4 Provenance).
- **export:** `both`

## 8. completion_proof
- **format:** `scitt_transparent_statement`
- **verifier:** `GET /api/killinchu/scitt/{leaf}/receipt` + offline COSE inclusion-proof check against `/checkpoint`. Independent of Killinchu code — any SCITT-conformant verifier works.

---

## 9. DEMO SCRIPT (≈3 minutes)
| t | Action | Judge sees |
|---|---|---|
| 0:00 | Open `/killinchu/scitt`. | Live log; rows for prior P1/P2 events, each with leaf index + verified ✓. |
| 0:30 | Trigger a detection in P1 (or replay one). | A new row appears: `signed_statement` → `scitt_registration` (2 approvers) → `transparent_statement`. |
| 1:05 | Click the new row. | Decoded COSE_Sign1: Issuer `SZLHOLDINGS`, Subject = drone event id, alg, inclusion proof. |
| 1:35 | Click **Download Receipt**, verify in an external COSE tool. | External tool confirms the inclusion proof — interoperable, not self-attested. |
| 2:05 | Click **Checkpoint** → **Recompute root**. | Recomputed root == checkpoint root (replayability shown). |
| 2:30 | Submit a tampered Signed Statement to `POST /entries`. | **Rejected** — "COSE signature verification failed; no leaf created" (non-equivocation / fail-closed). |
| 3:00 | End. | — |

---

## 10. Ship artifacts
- **HF Space patch:** `/api/killinchu/scitt/*` endpoints + log-view UI + COSE header decoder.
- **GitHub PR:** Khipu→COSE_Sign1 encoder, minimal Transparency Service (Merkle VDS), SCRAPI-style register endpoint with 2-person gate, inclusion-proof verifier, rejection test.
- **Khipu schema commit:** receipt types `signed_statement, scitt_registration, transparent_statement`.

## 11. Standards anchors
[SCITT architecture draft-22](https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/) (Signed/Transparent Statement, Receipt, registration steps, VDS Append-Only/Non-equivocation/Replayability), [SCRAPI draft-09](https://datatracker.ietf.org/doc/draft-ietf-scitt-scrapi/) (REST), [COSE RFC 9052](https://www.rfc-editor.org/info/rfc9052) + [RFC 9053](https://www.rfc-editor.org/info/rfc9053) (COSE_Sign1, algorithms), CWT Claims header per RFC 9597.

— Signed **Yachay** · 2026-06-01 · No mysticism. No bandaid.
