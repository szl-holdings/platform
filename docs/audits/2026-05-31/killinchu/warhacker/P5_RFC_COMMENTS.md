# MISSION PACK P5 — Live RFC Comments as Receipted Civic Engineering

**id:** `MP-P5-RFC`
**warhacker_problem_id:** P5
**schema:** `mp/v1` (see [MISSION_PACK_SCHEMA.md](./MISSION_PACK_SCHEMA.md))
**Theme:** comment on the relevant draft RFCs (SCITT, COSE, in-toto, supply-chain) directly from the Killinchu Space, signed by `SZLHOLDINGS`, posted to the IETF datatracker — the whole workflow shown as a Khipu-receipted **civic-engineering action**.
**Author:** Yachay · 2026-06-01

---

## 1. Customer & context

| field | value |
|---|---|
| customer.name | IETF working groups (SCITT, COSE, SCITT-adjacent supply-chain) |
| customer.role | the standards bodies whose drafts our compliance receipts depend on |
| customer.relationship | standards_partner |
| customer.outreach_ref | [05_RFC_COMMENTS_FINAL.md](./../../05_RFC_COMMENTS_FINAL.md) |

**customer_context:** SZL's compliance posture ([P3](./P3_SCITT_COMPLIANCE_RECEIPTS.md)) rides on draft RFCs that are still in flight. The credible way to be a standards participant — not just a consumer — is to file substantive comments on those drafts. P5 turns that into an auditable workflow: a comment is drafted, gated, signed as `SZLHOLDINGS`, posted to the [IETF datatracker](https://datatracker.ietf.org), and the entire act is receipted so anyone can verify *what we said, when, and that two people approved it*. This is the "civic engineering" framing — public-good contribution that is itself governed.

> Honest scope: posting to the IETF datatracker is performed via the datatracker's documented comment/mailing-list mechanisms; **this pack produces the spec + draft comments + the receipted workflow, it does NOT auto-post during the build** (per the task's DO-NOT-PUSH rule). Posting is a human-approved action behind the 2-person gate at demo time.

---

## 2. drone_assignments
None directly — this is a standards-engagement pack. `drone_assignments: [{drone_id: "n/a", role: "n/a"}]`. It is included in the Killinchu Space because the receipts it produces feed the same Khipu DAG and `/killinchu/scitt` log as the drone packs.

---

## 3. Target drafts (the comment surface)

| Draft | datatracker | comment angle (substantive, from our implementation) |
|---|---|---|
| SCITT Architecture | [draft-ietf-scitt-architecture-22](https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/) | implementation feedback on Receipt placement in the unprotected header (`receipts: 394`) and the mandatory registration checks from a working Transparency Service (our P3 build) |
| SCITT Reference APIs | [draft-ietf-scitt-scrapi-09](https://datatracker.ietf.org/doc/draft-ietf-scitt-scrapi/) | feedback on the REST registration flow and error semantics encountered building `/killinchu/scitt/entries` |
| COSE (structures) | [RFC 9052](https://www.rfc-editor.org/info/rfc9052) / errata + bis work | CWT-Claims header usage (Issuer label 1 / Subject label 2) interop notes |
| in-toto Attestation | [in-toto attestation v1.1](https://github.com/in-toto/attestation/blob/main/spec/README.md) | predicate-field feedback from the P2 firmware-OTA provenance use case |
| Supply-chain / SLSA | [SLSA v1.0](https://slsa.dev/spec/v1.0/) | honest-level (L1) provenance reporting feedback |

Every comment cites our concrete implementation as the evidence base — exactly the "we built it, here's what we learned" posture Warhacker rewards.

---

## 4. Steps (each Khipu-receipted)

### Step 1 — `draft_comment`
- **description:** Author a comment against a target draft. Records draft id, section, comment text, the implementation receipt(s) it cites as evidence.
- **yuyay_gate:** `required: false`, `two_person: false` (drafting). Floor: axis 6 (citationIntegrity) ≥ 0.90 — a comment must cite real evidence, not opinion.
- **huklla_tripwires:** `T03` (evidence), `T06` (supply-chain context); `on_trip: escalate`.
- **khipu_receipt_template:** `{"receipt_type":"rfc_comment_draft","fields":["ts","draft_id","section","comment_text_hash","cited_receipt_hashes","author"],"hash_alg":"sha256","chain":"continuum_hash","signature":"PLACEHOLDER"}`

### Step 2 — `sign_comment`
- **description:** Sign the comment as `SZLHOLDINGS` (COSE_Sign1, same Issuer binding as P3 — Issuer Claim label 1 = `SZLHOLDINGS`). Signing is **state-changing** (it creates an attributable public artifact).
- **yuyay_gate:** `required: true`, `two_person: true`. Approvers `[standards_lead, cto_yachay]` — two identities to put SZL's name on a public-record comment.
- **huklla_tripwires:** `T01` (authority to speak for SZL), `T09` (non-equivocation — no contradictory public statements); `on_trip: deny`.
- **khipu_receipt_template:** `{"receipt_type":"rfc_comment_signed","fields":["ts","comment_draft_hash","issuer","cose_sign1_b64","alg","approver_a","approver_b"],"hash_alg":"sha256","chain":"continuum_hash","signature":"COSE_Sign1"}`

### Step 3 — `post_to_datatracker`
- **description:** Post the signed comment to the IETF datatracker for the target draft (document comment / WG mailing-list submission), and record the resulting datatracker URL / message-id. **State-changing and external** — gated and human-confirmed; never auto-posted during build.
- **yuyay_gate:** `required: true`, `two_person: true`. Approvers `[standards_lead, cto_yachay]`. A `confirm_action`-style human confirmation is required before the external POST.
- **huklla_tripwires:** `T01`, `T09`, `T10` (STOP available); `on_trip: deny`.
- **khipu_receipt_template:** `{"receipt_type":"rfc_comment_posted","fields":["ts","comment_signed_hash","datatracker_url","message_id","post_confirmed_by","approver_a","approver_b"],"hash_alg":"sha256","chain":"continuum_hash","signature":"COSE_Sign1"}`

### Step 4 — `register_civic_action`
- **description:** Register the posted comment as a SCITT Transparent Statement in `/killinchu/scitt` (reusing the [P3](./P3_SCITT_COMPLIANCE_RECEIPTS.md) Transparency Service) so the civic action is itself transparently logged.
- **yuyay_gate:** `required: true`, `two_person: false` (registration of an already-approved artifact; the public-statement gate already passed at step 2/3).
- **huklla_tripwires:** `T03`; `on_trip: deny`.
- **khipu_receipt_template:** `{"receipt_type":"civic_action_registered","fields":["ts","comment_posted_hash","scitt_leaf_index","receipt_cose_b64"],"hash_alg":"sha256","chain":"continuum_hash","signature":"COSE_Sign1"}`

---

## 5. success_criteria

**machine_checkable:**
1. Every signed comment's COSE_Sign1 Issuer Claim (label 1) = `SZLHOLDINGS`.
2. Every comment cites ≥ 1 real implementation receipt hash (no uncited opinion comments).
3. No `rfc_comment_posted` receipt exists without a preceding `rfc_comment_signed` with two distinct approvers.
4. Each posted comment has a `civic_action_registered` SCITT leaf whose inclusion proof verifies.
5. During build, `post_confirmed_by` is empty and `datatracker_url` is null (DO-NOT-PUSH honored).

**judge_reviewable:**
1. The Killinchu Space shows a comment drafted against a named draft (e.g. SCITT architecture-22), citing our own P3 receipts.
2. Signing as `SZLHOLDINGS` visibly requires two approvers.
3. The "post" step shows a human-confirmation gate and is *not* executed automatically.
4. The civic action appears in the `/killinchu/scitt` log as a Transparent Statement.

---

## 6. boe_template (P5)
- **sections:** Cover · Comment manifest (draft, section, citation) · Signature/approver record · Datatracker post record (or "staged, not posted") · SCITT registration of the civic action · Honest-label appendix · 2-person signatures.
- **crosswalk:** `none` (civic-engagement evidence, not a control mapping) — though it supports GOVERN-5.1 external-stakeholder engagement under [P4](./P4_NIST_AI_RMF.md).
- **export:** `both`

## 7. completion_proof
- **format:** `scitt_transparent_statement`
- **verifier:** the comment's SCITT receipt verifies via `/killinchu/scitt/{leaf}/receipt`.

---

## 8. DEMO SCRIPT (≈2.5 minutes)
| t | Action | Judge sees |
|---|---|---|
| 0:00 | Open P5; pick **draft-ietf-scitt-architecture-22**. | Comment editor with the draft section selector. |
| 0:30 | Show a drafted comment citing our P3 `scitt_registration` receipt. | "Implementation feedback: Receipt in unprotected header `394` — here's our working TS evidence." |
| 1:00 | Click **Sign as SZLHOLDINGS**. | 2-approver gate; both sign → COSE_Sign1 with Issuer label 1 = SZLHOLDINGS. |
| 1:30 | Click **Post to datatracker**. | Human-confirmation modal appears; demo shows it **staged, not auto-posted** (DO-NOT-PUSH). |
| 2:00 | Click **Register civic action**. | Appears as a Transparent Statement in `/killinchu/scitt`. |
| 2:30 | End. | — |

---

## 9. Ship artifacts
- **HF Space patch:** `/api/killinchu/missions/MP-P5-RFC` + comment editor + datatracker-link recorder.
- **GitHub PR:** COSE_Sign1 comment signer (Issuer=SZLHOLDINGS), citation-integrity validator, staged-post workflow (no live POST in CI), SCITT registration hook.
- **Khipu schema commit:** receipt types `rfc_comment_draft, rfc_comment_signed, rfc_comment_posted, civic_action_registered`.

## 10. Standards anchors
[SCITT architecture draft-22](https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/), [SCRAPI draft-09](https://datatracker.ietf.org/doc/draft-ietf-scitt-scrapi/), [COSE RFC 9052](https://www.rfc-editor.org/info/rfc9052), [in-toto attestation v1.1](https://github.com/in-toto/attestation/blob/main/spec/README.md), [SLSA v1.0](https://slsa.dev/spec/v1.0/), [IETF datatracker](https://datatracker.ietf.org).

— Signed **Yachay** · 2026-06-01 · No mysticism. No bandaid.
