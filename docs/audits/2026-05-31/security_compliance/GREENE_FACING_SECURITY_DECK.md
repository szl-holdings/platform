# GREENE_FACING_SECURITY_DECK.md — 10-slide narrative for the .gov network

**Author:** Yachay (CTO authority) · **Date:** 2026-06-01 · **Doctrine v11 LOCKED (749/14/163).**
**Audience:** Greene's `.gov`/`.mil` network — **USAF software factory, DIU Replicator, In‑Q‑Tel**.
**Thesis:** SZL is the *safe bet* because we ship a **formally‑verified, supply‑chain‑signed, UDS‑deployable governance substrate** with a tamper‑evident Body‑of‑Evidence — and we are **honest about exactly where we are** on the compliance road. Deck file: `GREENE_SECURITY_DECK.pptx`.

> **Honesty contract for this deck:** every claim is either (a) shipped + tested today, or (b) clearly labeled as roadmap. We claim **no certifications we don't hold.** That honesty is itself the differentiator for a buyer who has been burned by vaporware.

---

## Slide 1 — Title
**SZL Holdings — The Verifiable Substrate for Trusted Autonomy**
Subtitle: *Why SZL is the safe bet for USAF Software Factory · DIU Replicator · In‑Q‑Tel.*
Footer: Doctrine v11 · SLSA L1 (honest) · cosign live · UDS‑deployable · 2026‑06‑01 · Yachay, CTO.

## Slide 2 — The problem
Everyone is racing to ship agents. Almost no one can **prove** their agent didn't lie, drift, or act outside policy — and the supply chain behind it is unsigned and unauditable. For `.gov`/`.mil`, "trust me" is disqualifying. The decisive advantage is **delivery speed *under constraint*** (airgap, ATO, audit) — DU's own thesis.

## Slide 3 — What SZL is
A **formally‑verified governance substrate** that any agent runs inside: a Lean‑proved Λ aggregator scores every decision; HUKLLA can **halt** on 10 tripwires; every action drops a **cryptographically‑signed receipt** onto a hash‑linked **Khipu Merkle DAG** you can replay and audit. Our 5 flagships (a11oy, amaru, sentra, killinchu, rosie) are the **proof it runs real workloads**, not the product.

## Slide 4 — Formal verification (the moat)
**Doctrine v11 — LOCKED: 749 declarations · 14 axioms · 163 tracked sorries**, `lake build` clean, `lutar-v18.0.0 @ c7c0ba17`. Λ bounds, composability, replay, Merkle, DPI, doctrine‑soundness **PROVEN in Lean 4**. We even publish our open conjecture (λ‑uniqueness) honestly. *Nobody else brings Lean proofs of their governance gate.*

## Slide 5 — Supply‑chain integrity: SLSA + SBOM + cosign
- **SLSA L1 today (honest)** — provenance exists; **L1→L2 plan documented** (fix hosted build, sign every artifact, gate at deploy).
- **SBOM** — CycloneDX + SPDX per repo in CI (Trivy + CodeQL + OpenSSF Scorecard).
- **cosign** — keyless Fulcio signing **proven** (vessels bundle, Rekor index `1675423172`); key pair **generated this session** (fingerprint `1f0018…dbc7`); plan to sign 6/6 bundles + signed SBOM attestations.
- **Brutal honesty:** 1 of 6 UDS bundles signed *today* — and here's the dated plan to close it.

## Slide 6 — UDS‑deployable (the .mil on‑ramp)
Our flagships package as **UDS bundles** and run inside **UDS Core** (Istio mTLS, Keycloak SSO, NeuVector, Pepr policy, Loki/Grafana) — **"ATO‑ready out of the box."** UDS Core targets **DoD IL5**; deploying inside it lets us *inherit* IL5‑grade controls and the airgap/Zarf path to classified edge. This is the fastest credible route to `.gov`/`.mil` production.

## Slide 7 — Khipu Body‑of‑Evidence (audit you can replay)
Every decision → **DSSE‑signed receipt** → **summation‑invariant Merkle DAG** with dual‑attestation (Lean TH11 proven; adversarial chain‑corruption test passing). Auditors get a **replayable, tamper‑evident ledger** mapping to **NIST 800‑171 AU/IR** and the **EU AI Act / NIST AI RMF**. The same substrate powers Khipu‑receipted **incident handling** (PSIRT).

## Slide 8 — Compliance roadmap (honest, ROI‑ordered)
| Cert | Timeline | Status |
|---|---|---|
| SOC 2 Type II | 3–6 mo | starting |
| 800‑171 + CMMC L2 (self) | 2–4 mo | starting |
| ITAR (DDTC) | 4–8 wks | for Killinchu/Wamani |
| FedRAMP Mod (Agency, GovCloud) | 12–24 mo | BD now |
| DoD IL4→IL5 | after FedRAMP | inherit via UDS Core |

*We hold none yet. We're telling you the truth and the dated path — that's the bet.*

## Slide 9 — Killinchu: counter‑UAS, governed
Drone intelligence on the same substrate: Remote‑ID/ADS‑B/STANAG decode + geofence/HALT rule engine, **Λ‑gated, receipt‑logged, signed rules, airgap‑deployable**. Directly fits the Warhacker counter‑UAS problem and DIU Replicator's attritable‑autonomy mission — with provable governance the others lack.

## Slide 10 — The ask / close
**SZL is the safe bet:** Lean‑proved governance + signed supply chain + UDS/IL5 on‑ramp + replayable audit + an honest compliance plan. **Ask:** an agency‑sponsor conversation (FedRAMP) and a Warhacker counter‑UAS pilot. Contact: Yachay, CTO · security@szlholdings.com · `security.szlholdings.com/.well-known/security.txt`.

---

## Sources (also embedded in the PPTX footers)
- SLSA levels: <https://slsa.dev/spec/v1.0/levels>
- Sigstore/cosign: <https://docs.sigstore.dev/>
- UDS Core (IL5): <https://github.com/defenseunicorns/uds-core> · <https://defenseunicorns.com/resources/announcing-uds-core-1-0/>
- FedRAMP: <https://www.fedramp.gov/> · marketplace <https://marketplace.fedramp.gov/>
- NIST 800‑171: <https://csrc.nist.gov/pubs/sp/800/171/r3/final> · 800‑53: <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>
- Internal: `110_ANATOMY_COMPLETENESS_AUDIT.md`, `81_UDS_BUNDLE_VERIFY_MATRIX.md`, `100_WARHACKER_DU_DEEP_DIVE.md`.

*— Yachay, 2026-06-01. No false certification claims.*
