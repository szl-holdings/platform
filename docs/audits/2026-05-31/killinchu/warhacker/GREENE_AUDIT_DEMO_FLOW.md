# GREENE AUDIT DEMO FLOW — Andrew Greene's 5-Minute Walk

**Audience:** Andrew Greene — Defense Unicorns co-founder, "Unicorn Engineer," SZL backer; pre-approved for Warhacker (16–19 June 2026, San Diego). Per the [Greene brief](./../../phd_warhacker/02_ANDREW_GREENE_BRIEF.md), he is an engineer (Kubernetes/Helm/Zarf deep), opposed to security theater, and cares about software that *gets used* and is *mission-ready, ATO-ready out of the box*. **Pitch architecture, not business value.**
**Surface:** `/killinchu/missions` (Killinchu HF Space).
**Author:** Yachay · 2026-06-01
**Tone:** tradecraft-grade auditability. Every click is a founder-asked feature. No mysticism.

---

## 0. Pre-flight (before Greene touches the keyboard)
- Space loaded at `/killinchu/missions`; all 6 Mission Packs green/ready (per [WARHACKER_TIMING_PLAN](./WARHACKER_TIMING_PLAN.md) MVP cut).
- Runs airgapped — pre-seeded P1 run + recorded RF cue (no live constellation dependency), per the [Constellation Survey](./satellites/CONSTELLATION_SURVEY_2026.md) honest note that space gives tip-and-cue, not a live fire-control track.
- KhipuKnot 3D visualizer warm (Three.js, from the rosie-3d **KhipuKnot Reidemeister R1/R2/R3** pattern cited in the [anatomy-3d card](./../puriq/integration/HATUN_WILLAY_PER_FLAGSHIP.md)).
- One honest line ready if asked about signing: "`λ_receipt` Sigstore keyless is PLACEHOLDER until CI signing lands; the chain hash is real today."

---

## 1. THE FLOW (5:00 target)

| t (mm:ss) | Greene clicks | What renders | The founder-asked feature it proves |
|---|---|---|---|
| **0:00** | Opens **`/killinchu/missions`** | A board of **all 6 Mission Packs** (P1 Cannonico, P2 Carneiro, P3 SCITT, P4 NIST RMF, P5 RFC, P6 ATO BoE), each a tile with customer name + status. | "One Space, the whole Warhacker problem set, remote-workable." |
| **0:25** | Reads the tiles | Each tile names a **real customer** (Cannonico, Carneiro, SCITT WG, NIST, IETF, Scott Thompson) and a status chip. | "Every pack ties to a real problem owner — no science projects." (Greene's exact bar.) |
| **0:45** | Clicks **P1 Cannonico** (10-second peek) | The drone monitor: Shahed-136 track, 13-axis classify, 2-person engage gate, tamper test. | "Native fit — Killinchu already does the Cannonico problem." (Back out after a glance.) |
| **1:20** | Returns to board, clicks **P6 ATO Body of Evidence** | The BoE builder: live control matrix (AU-10, CM-3, SI-7, AC-6, IR-4 green), run selector. | "ATO-ready out of the box" — the DU judging criterion verbatim. |
| **1:50** | Clicks a control cell (e.g. **CM-3**) | Drills into the **`ota_gate` receipt** that evidences it — actual hash, model attribution, gate result. | "Evidence is a receipt, not prose. Click the control, see the proof." |
| **2:20** | Clicks **"Khipu DAG"** view | **Three.js KhipuKnot** renders: each receipt a knot on the chain; Reidemeister R1/R2/R3 invariant holds = chain intact. Rotatable. | "The audit trail is a verifiable knot — drift one byte and the invariant breaks." |
| **3:00** | Clicks **"Export BoE"** | Sumcheck **PASS** → **2-person Yuyay gate** modal (2 distinct approver slots). | "No state change without two humans — structural, not policy-configured." (Mirrors DU's own human-gated-autonomy posture.) |
| **3:25** | Both approvers sign | Gate clears; PDF renders with honest-label cover (749/14/163 locked numbers, PLACEHOLDER labels). | "Two-person rule enforced; honest labels on the cover — no security theater." |
| **3:45** | **Signed PDF downloads** | `Killinchu_ATO_BoE_<id>.pdf` lands in his downloads: cover, receipt manifest, DAG sum-check, RMF + STIG/SRG-CCI crosswalk. | "Click-to-export the exact package an ATO board defends." |
| **4:15** | Clicks **"Tamper test"** then **Export** again | Banner flips **red**; sumcheck **FAIL**; export **refused**. | "Tamper-evident, fails closed — the tradecraft bar." |
| **4:40** | Clicks **"Verify"** on the good export | `embedded_root` re-derives from the live receipt log → "authentic & complete," offline-verifiable. | "Verify our logs, don't trust them — re-derivable against the replay hash." |
| **5:00** | Done. | — | One sentence: "Six real problems, one Space, every action receipted and two-person-gated, ATO BoE one click away." |

---

## 2. Why each click maps to a founder-asked feature

| Founder ask (from briefs) | Click in this flow |
|---|---|
| "Build something that gets used / mission-ready" ([Greene brief](./../../phd_warhacker/02_ANDREW_GREENE_BRIEF.md)) | 0:00 board of 6 live packs tied to real customers |
| "ATO-ready out of the box" ([Warhacker brief](./../../phd_warhacker/00_WARHACKER_2026_FULL_BRIEF.md)) | 1:20 P6 control matrix; 3:45 signed PDF |
| 2-person Yuyay gate before any state-changing op (task hard rule) | 3:00 export gate (2 distinct approvers) |
| Khipu DAG visualization (Three.js KhipuKnot, rosie-3d pattern) | 2:20 KhipuKnot view |
| Tamper-evident records (Cannonico's stated need) | 4:15 tamper test fails closed |
| "Verify our logs, don't trust them" (amaru posture) | 4:40 offline re-derivation |
| Honest labels, no bandaid (Zero-Bandaid Law) | 3:25 PLACEHOLDER labels on PDF cover |

---

## 3. KhipuKnot 3D spec (the 2:20 moment)
- **Source pattern:** rosie-3d KhipuKnot — a Reidemeister-knot (R1/R2/R3 move invariant) glyph per receipt, drawn from the cited 46-leader 3D survey ([anatomy-3d card](./../puriq/integration/HATUN_WILLAY_PER_FLAGSHIP.md)).
- **Mapping:** each Khipu receipt = one knot; `prev_hash`→`this_hash` = the cord between knots; a broken/mutated receipt **fails the Reidemeister invariant** and the cord renders severed + red (visual tamper-evidence, matching the anatomy-3d "flip green→red on one byte of drift" rule).
- **Tech:** Three.js scene, InstancedMesh for the cord, one knot mesh per receipt; click a knot → open the receipt JSON. LOD via `<Detailed>` (recipe #12) for large DAGs.
- **Honest label in-frame:** "13-axis `yuyay_v3` runnable, not yet wired end-to-end; signature PLACEHOLDER."

---

## 4. If Greene pushes (engineer pressure-test) — ready answers
- *"Is the signature real?"* — "Hash chain is real and re-derivable today; Sigstore keyless is PLACEHOLDER until CI signing lands. Labeled on the cover."
- *"Does this actually package with UDS?"* — "BoE export + receipts are the ATO-accelerating docs; the UDS bundle path is the `du-upstream-contributions` repo you green-lit; SBOM via `uds zarf package create`, in-toto on top." ([Greene brief §7](./../../phd_warhacker/02_ANDREW_GREENE_BRIEF.md))
- *"SLSA level?"* — "L1, honest. 'SLSA L3' is banned in our doctrine until provenance is actually L3."
- *"What's not done?"* — Point at the honest-label appendix; never claim more than the receipts show.

---

— Signed **Yachay** · 2026-06-01 · No mysticism. Tradecraft-grade auditability. No bandaid.
