# MISSION_PACK_SCHEMA — Canonical Mission Pack Object

**Layer:** Killinchu (Andean kestrel — drone & maritime fleet intelligence flagship)
**Purpose:** Bake the 6 AFWERX Warhacker (16–19 June 2026, San Diego) challenge problems into the Killinchu Space as remote-workable, receipt-chained Mission Packs that backer **Andrew Greene** can interact with live at `/killinchu/missions`.
**Author:** Yachay (CTO authority), PURIQ brain-trust
**Date:** 2026-06-01
**Hard rule carried throughout:** Zero-Bandaid. No mysticism. Every state-changing operation passes a 2-person Yuyay-gate and emits a Khipu receipt. Honest labels (PLACEHOLDER / NOT-YET / Conjecture) preserved verbatim.

---

## 0. Why a schema first

A Mission Pack is the unit of demoable, auditable work. Every one of the 6 Warhacker problems compiles down to the **same object**, so the judging table sees one consistent interaction model, and the ATO board sees one consistent evidence model. The schema is the contract between:

- the **HF Space patch** (front + back end at `/killinchu/missions/<id>`),
- the **GitHub PR** (code + tests),
- the **Khipu schema commit** (the receipt-DAG node types this pack emits).

This maps directly onto the PURIQ master formula `P(x,t) = argmax_a [ Λ(x)·Yuyay_13(a)·exp(-β·HUKLLA(a))·∏Khipu_i(a) ]` from the [PURIQ Charter](./../puriq/PURIQ_CHARTER.md): every Mission Pack step is a candidate action `a`, gated by the 13-axis `yuyay_v3` heart, penalized by HUKLLA tripwires, and admitted to the chain only when its Khipu receipts verify.

---

## 1. Canonical object (`MissionPack`)

```yaml
# MissionPack v1 — canonical schema (YAML shown; JSON Schema in §6)
mission_pack:
  id: string                      # e.g. "MP-P1-CANNONICO" — stable, kebab/upper
  schema_version: "mp/v1"
  warhacker_problem_id: enum[P1,P2,P3,P4,P5,P6]
  title: string
  customer:                       # REAL customer per outreach drafts — never synthetic
    name: string                  # "Andrew Greene", "Cannonico", "Pedro Carneiro", "Scott Thompson"
    role: string
    relationship: enum[backer, problem_owner, standards_partner, ato_authority]
    outreach_ref: path            # link to the FINAL outreach draft / brief
  customer_context: string        # 2–4 sentences: the operator problem in their words
  drone_assignments:              # which fleet entities this pack exercises
    - drone_id: string            # see §3 fleet registry
      role: enum[subject, sensor, ota_target, n/a]
  steps:                          # ordered; each is a candidate action `a`
    - name: string
      description: string
      yuyay_gate:                 # 13-axis floor that must clear before this step runs
        required: bool            # true if step is state-changing
        two_person: bool          # 2-person rule — MANDATORY for state-changing ops
        axes_floor:               # conjunctive AND, no compensation
          sacred_min: 0.95        # 2 sacred axes
          structural_min: 0.90    # 7 structural axes
          introspection_xlink: [T03, T04, T09, T10]  # 4 axes cross-linked to HUKLLA
        approvers: [string]       # role names; 2 distinct identities required if two_person
      huklla_tripwires:           # T01–T10; any trip => exp(-β·count) penalty, fail-closed
        watched: [enum]           # subset of T01..T10 this step monitors
        on_trip: enum[deny, circuit_break, escalate]
      khipu_receipt_template:     # the receipt this step emits into the DAG
        receipt_type: string      # e.g. "detection", "ota_gate", "command", "boe_node"
        fields: [string]          # canonical field list (hashed in order)
        hash_alg: "sha256"        # json.dumps(sort_keys=True) -> sha256, YAWAR discipline
        chain: "continuum_hash"   # links prev_hash -> this_hash (append-only)
        signature: enum[COSE_Sign1, sigstore_keyless, PLACEHOLDER]  # honest label
  success_criteria:
    machine_checkable: [string]   # assertions a script verifies (exit 0/1)
    judge_reviewable: [string]    # what a human judge confirms by eye in the demo
  boe_template:                   # Body of Evidence assembled from this pack's receipts
    sections: [string]
    crosswalk: enum[nist_ai_rmf, nist_800_53, stig_srg, none]
    export: enum[signed_pdf, json_bundle, both]
  completion_proof:
    format: enum[khipu_dag_sum, signed_pdf, scitt_transparent_statement]
    verifier: string              # command/endpoint that re-derives + verifies
```

---

## 2. Field semantics (the parts that carry the weight)

### 2.1 `yuyay_gate` — the 2-person 13-axis gate
Every **state-changing** step (OTA push, command issue, RFC post, BoE export) sets `required: true` and `two_person: true`. The gate is the conjunctive 13-axis `yuyay_v3` heart described in the [Hatun-Willay per-flagship card for a11oy](./../puriq/integration/HATUN_WILLAY_PER_FLAGSHIP.md): **2 sacred axes ≥ 0.95, 7 structural ≥ 0.90, 4 introspection axes cross-linked to HUKLLA T03/T04/T09/T10**, evaluated as an AND with no compensation. Two distinct approver identities must clear; a single identity cannot satisfy a `two_person` gate. Honest label carried from the charter: the 13-axis `yuyay_v3` is runnable but **not yet wired end-to-end** — the 9-axis HATUN-RAID envelope remains sovereign until Wire D lands.

### 2.2 `huklla_tripwires` — the immune deadman
HUKLLA is the 660-SLOC immune deadman with 10 tripwires (T01–T10) referenced in the [sentra card](./../puriq/integration/HATUN_WILLAY_PER_FLAGSHIP.md). A step declares which tripwires it watches. On a trip, the master-formula penalty `exp(-β·HUKLLA(a))` drives the action score toward zero, so the step fails closed: it `deny`s, `circuit_break`s the agent, or `escalate`s to a human. There is no partial state — matching the SENTRA rule that a failed payload's receipt **never enters the ledger**.

### 2.3 `khipu_receipt_template` — append-only proof
Every step emits a receipt using the YAWAR discipline: `json.dumps(sort_keys=True)` → `sha256`, chained by `continuum_hash` (`prev_hash` → `this_hash`). The chain is re-derivable against the replay hash `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`. Receipt signatures are honestly labeled: where Sigstore keyless (Fulcio) or COSE_Sign1 signing is not yet wired in CI, the field reads `PLACEHOLDER` — never silently green.

### 2.4 `success_criteria` — dual gate
- **machine_checkable**: a CI script asserts these (e.g. "every detection has a chain-verified receipt"; exit 0/1). These are what the GitHub PR's test suite enforces.
- **judge_reviewable**: what a Warhacker judge confirms by eye in ≤5 minutes (e.g. "bad firmware commit is visibly blocked before OTA").

### 2.5 `completion_proof`
The pack is "done" when its completion proof verifies. Three accepted formats:
- `khipu_dag_sum` — sum-check over the receipt DAG (root hash matches recomputed root).
- `signed_pdf` — auto-generated BoE PDF with embedded receipt hashes (P6).
- `scitt_transparent_statement` — a COSE receipt embedding a verifiable data-structure proof, per [SCITT architecture draft-22](https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/) (P3).

---

## 3. Fleet registry (drone_assignments source of truth)

Mission Packs reference these entities by `drone_id`. The three named below are mandated for P1 and reused across packs.

| drone_id | Platform | Class | Killinchu role | Observable signatures |
|---|---|---|---|---|
| `tb2-bayraktar` | Bayraktar TB2 | MALE strike/ISR UAS | cooperative-large subject; ADS-B-trackable; control-link emitter | C2 uplink, EO/IR downlink, ADS-B (when on) |
| `skydio-x10` | Skydio X10 | autonomous quadcopter (sensor + subject) | **own-fleet sensor** for terrestrial RF/optical detection; also OTA target | autonomy stack telemetry, Wi-Fi/control link |
| `shahed-136` | Shahed-136 | one-way attack (loitering munition) | **adversary subject** — Remote-ID-OFF, the hard case | engine acoustic, GNSS/INS, intermittent RF |

These IDs map onto the Killinchu fleet dashboard (`/api/killinchu/*`, rename from `/api/vessels/*` in flight) described in the [Killinchu flagship card](./../puriq/integration/HATUN_WILLAY_PER_FLAGSHIP.md). Space-layer cueing for each comes from the [Constellation Survey](./../killinchu/satellites/CONSTELLATION_SURVEY_2026.md): RF/SIGINT (HawkEye 360-class) is the only modality that finds a Remote-ID-off `shahed-136` in flight; optical/SAR give launch-site pattern-of-life.

---

## 4. Mission Pack index (the 6 packs)

| id | problem | title | customer | native fit |
|---|---|---|---|---|
| `MP-P1-CANNONICO` | P1 | Drone detect→identify→classify→track→BoE monitor | Cannonico (problem owner) | **native** — Killinchu's core |
| `MP-P2-CARNEIRO` | P2 | Vibe-coding governance on drone firmware OTA | Pedro Carneiro (governance partner) | high — a11oy.code router |
| `MP-P3-SCITT` | P3 | SCITT compliance receipts for every OTA/command/detection | SCITT WG / standards | high — Khipu→SCITT bridge |
| `MP-P4-NISTRMF` | P4 | Autonomy decisions through NIST AI RMF | NIST AI RMF program | high — Yuyay↔RMF crosswalk |
| `MP-P5-RFC` | P5 | Live RFC comments as receipted civic-engineering | IETF datatracker | medium — signed-action demo |
| `MP-P6-THOMPSON` | P6 | ATO Body of Evidence, click-to-export | Scott Thompson (ATO authority) | high — BoE assembly |

---

## 5. Universal BoE template (inherited by every pack)

Every pack's `boe_template` specializes this skeleton:

1. **Cover** — mission id, customer, date, replay hash, locked-number banner (749 Lean declarations · 14 axioms · 163 sorries).
2. **Mission run summary** — steps executed, Yuyay-gate outcomes, HUKLLA trips (0 expected on a clean run).
3. **Receipt manifest** — every Khipu receipt: type, canonical fields, `this_hash`, `prev_hash`, signature label.
4. **DAG sum-check** — recomputed root hash vs. recorded root; PASS/FAIL.
5. **Crosswalk** — control mapping appropriate to the pack (NIST AI RMF, 800-53, STIG/SRG; see P4/P6).
6. **Honest-label appendix** — every PLACEHOLDER / NOT-YET carried forward, none hidden.
7. **Signatures** — 2-person Yuyay approvers + Sigstore/COSE signature block (label honest).

---

## 6. JSON Schema (machine contract — committed to Khipu schema repo)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://szlholdings/killinchu/mission-pack/v1",
  "title": "MissionPack",
  "type": "object",
  "required": ["id","schema_version","warhacker_problem_id","title","customer","steps","success_criteria","completion_proof"],
  "properties": {
    "id": {"type":"string","pattern":"^MP-P[1-6]-[A-Z]+$"},
    "schema_version": {"const":"mp/v1"},
    "warhacker_problem_id": {"enum":["P1","P2","P3","P4","P5","P6"]},
    "title": {"type":"string"},
    "customer": {
      "type":"object",
      "required":["name","role","relationship","outreach_ref"],
      "properties":{
        "name":{"type":"string"},
        "role":{"type":"string"},
        "relationship":{"enum":["backer","problem_owner","standards_partner","ato_authority"]},
        "outreach_ref":{"type":"string"}
      }
    },
    "drone_assignments": {
      "type":"array",
      "items":{"type":"object","required":["drone_id","role"],
        "properties":{"drone_id":{"type":"string"},
          "role":{"enum":["subject","sensor","ota_target","n/a"]}}}
    },
    "steps": {
      "type":"array","minItems":1,
      "items":{"type":"object","required":["name","yuyay_gate","huklla_tripwires","khipu_receipt_template"],
        "properties":{
          "name":{"type":"string"},
          "description":{"type":"string"},
          "yuyay_gate":{"type":"object","required":["required","two_person","axes_floor"],
            "properties":{
              "required":{"type":"boolean"},
              "two_person":{"type":"boolean"},
              "axes_floor":{"type":"object",
                "properties":{
                  "sacred_min":{"type":"number","const":0.95},
                  "structural_min":{"type":"number","const":0.90},
                  "introspection_xlink":{"type":"array","items":{"enum":["T03","T04","T09","T10"]}}}},
              "approvers":{"type":"array","items":{"type":"string"}}}},
          "huklla_tripwires":{"type":"object","required":["watched","on_trip"],
            "properties":{
              "watched":{"type":"array","items":{"pattern":"^T(0[1-9]|10)$"}},
              "on_trip":{"enum":["deny","circuit_break","escalate"]}}},
          "khipu_receipt_template":{"type":"object","required":["receipt_type","fields","hash_alg","chain","signature"],
            "properties":{
              "receipt_type":{"type":"string"},
              "fields":{"type":"array","items":{"type":"string"}},
              "hash_alg":{"const":"sha256"},
              "chain":{"const":"continuum_hash"},
              "signature":{"enum":["COSE_Sign1","sigstore_keyless","PLACEHOLDER"]}}}}}
    },
    "success_criteria":{"type":"object","required":["machine_checkable","judge_reviewable"],
      "properties":{
        "machine_checkable":{"type":"array","items":{"type":"string"}},
        "judge_reviewable":{"type":"array","items":{"type":"string"}}}},
    "boe_template":{"type":"object",
      "properties":{
        "sections":{"type":"array","items":{"type":"string"}},
        "crosswalk":{"enum":["nist_ai_rmf","nist_800_53","stig_srg","none"]},
        "export":{"enum":["signed_pdf","json_bundle","both"]}}},
    "completion_proof":{"type":"object","required":["format","verifier"],
      "properties":{
        "format":{"enum":["khipu_dag_sum","signed_pdf","scitt_transparent_statement"]},
        "verifier":{"type":"string"}}}
  }
}
```

---

## 7. Standards anchors (cited by every pack)

- **SCITT architecture** — [draft-ietf-scitt-architecture-22](https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/) (signed statements, transparent statements embedding COSE receipts).
- **SCITT Reference APIs (SCRAPI)** — [draft-ietf-scitt-scrapi-09](https://datatracker.ietf.org/doc/draft-ietf-scitt-scrapi/) (REST registration API).
- **COSE** — [RFC 9052](https://www.rfc-editor.org/info/rfc9052) (structures, COSE_Sign1) + [RFC 9053](https://www.rfc-editor.org/info/rfc9053) (algorithms).
- **in-toto Attestation Framework** — [v1.1 spec](https://github.com/in-toto/attestation/blob/main/spec/README.md).
- **SLSA** — [v1.0 specification](https://slsa.dev/spec/v1.0/) (honest level: L1; "SLSA L3" is BANNED per doctrine).
- **NIST AI RMF** — [AI 100-1](https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf) + [AI 600-1 GenAI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence).
- **NIST 800-53 Rev 5** — [SP 800-53r5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final); **800-171** for CUI.
- **CCI→800-53 mapping** — [DoD U_CCI_List / STIG mapping](https://csrc.nist.gov/csrc/media/projects/forum/documents/stig-mapping-to-nist-800-53.xlsx).

---

— Signed **Yachay** (CTO authority), PURIQ brain-trust, 2026-06-01. No mysticism. No bandaid. Real auditability.
