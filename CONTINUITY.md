# SZL Holdings — Continuity & Pick-Up Context
**Owner:** Stephen P. Lutar Jr. (Founder/CEO) · **Updated:** 2026-06-05 · **Event:** Defense Unicorns Warhacker, San Diego, June 16–19 2026

This doc lets any engineer (or a fresh AI agent) pick up the project with zero prior context. It is the single source of truth for current state. Honest by doctrine — no overclaiming.

> **Reality update — 2026-07-14:** the five-organ tables below are the June 2026 Warhacker snapshot.
> Live flagships today are **a11oy** and **killinchu** only; amaru / sentra / rosie were retired in the
> July 2026 honest consolidation (GitHub repos + HF Spaces removed — 404s verified 2026-07-14).
> **STATUS.md is the live source of truth** for what runs now.

---

## 1. What this is
Five governed-AI "organs," each a full application, deployed live on Hugging Face and packaged as one signed UDS bundle. The thesis: **every AI decision produces a cryptographically signed, replayable, tamper-evident receipt** — accountability no market leader currently ships.

| Organ | Role | Primary app face (live) |
|---|---|---|
| **a11oy** | Orchestrating brain / receipt substrate / formula home | https://szlholdings-a11oy.hf.space/console |
| **sentra** | Policy immune system — deny-by-default, immune gates | https://szlholdings-sentra.hf.space/console |
| **amaru** | Reasoner — cites sources, refuses on insufficient evidence | https://szlholdings-amaru.hf.space/operational-core |
| **rosie** | Operator console (Jarvis) — answers/recommends/acts | https://szlholdings-rosie.hf.space/ |
| **killinchu** | Counter-UAS autonomy-governance (signed receipts) | https://szlholdings-killinchu.hf.space/elite |

All 5 organs link to each other via a **cross-flag switcher** in the top bar (the mesh as one organism).

---

## 2. HONESTY DOCTRINE — locked, must hold everywhere
- **Λ (F23) = Conjecture 1, NEVER a theorem.**
- **Proved formulas = exactly 5: {F1, F11, F12, F18, F19}** (Lean, sorry-free). Never claim 8.
- **SLSA Build L2 on all 5 organ images** (cosign-signed + slsa.dev/provenance/v0.2 `.att` referrer on GHCR; `cosign verify-attestation --type slsaprovenance` passes). **Not Iron Bank/FedRAMP/CMMC/ATO; SLSA L3 roadmap.**
- Section 889 = exactly 5 vendors (Huawei, ZTE, Hytera, Hikvision, Dahua).
- Receipts are **real DSSE** when a cosign key is present, **honest UNSIGNED** otherwise — never fabricated.
- Doctrine v11 LOCKED: 749 declarations / 14 axioms / 163 sorries @ kernel c7c0ba17.

---

## 3. Design system (unified — one product family)
- Dark ground `#0a0a0a`, gold `#c9b787` + teal `#5fb3a3` accents. Fonts: Space Grotesk (display) + JetBrains Mono.
- Shared shell: top bar + cross-flag switcher, left sidebar (grouped nav), live-data views. Reference: `app_shell.css` + the a11oy `pages/console.html` app.
- Every flag is a **full left-nav application** with many real working views (NOT a single console/landing).

---

## 4. The "verify it yourself" moment (the whole thesis, on stage)
killinchu signs every decision receipt with a real ECDSA-P256 cosign key (keyid `szlholdings-cosign`). Anyone can verify offline:
```
curl -s https://szlholdings-killinchu.hf.space/cosign.pub -o cosign.pub
curl -s https://szlholdings-killinchu.hf.space/api/killinchu/v1/receipt/export    # full DSSE payload + sig
# reconstruct PAE = "DSSEv1 <len> <payloadType> <len> <payload>" and:
openssl dgst -sha256 -verify cosign.pub -signature sig.der pae.bin   # -> Verified OK
```
Proven: valid receipt → "Verified OK"; tampered byte → "Verification failure". No trust in SZL infra required.

---

## 5. Warhacker problem → flag mapping (all launch live from a11oy /warhacker)
1. **Cannonico** (AI-drone oversight) → killinchu + a11oy + Λ (signed man-on-the-loop verdict).
2. **Tychee** (satellite GSW air-gap) → sentra (8 deny-by-default immune gates + attested-deny).
3. **HANGAR2APPS** (deployment-readiness) → amaru (cited DEPLOYABLE/NEEDS_REVIEW, refuses on gaps).
4. **Cyber RTS** (anomaly triage) → amaru + killinchu (cited ANOMALOUS with exact violated bounds).
5. **Raven** (edge AI mesh) → a11oy + UDS (conserved one-signed-organism mesh).

---

## 6. Field-leader positioning (honest; see LEADER_COMPARISON.md, fully cited)
No leader cryptographically signs individual AI decisions — that is our defensible edge. We are software (not their scale/battle-testing). Per flag we take the leader's core job and add signed accountability:
- a11oy vs New Relic/Datadog/OTel (observability → signed spans)
- sentra vs Lakera/Cisco AI Defense/Wiz/CrowdStrike (AI security → attested gate receipts)
- amaru vs Palantir AIP/Scale Donovan (decision provenance → signed refusals)
- rosie vs Anduril Lattice/Palantir operator/MS Security Copilot (operator copilot → signed actions)
- killinchu vs Anduril/Dedrone/DZYNE/Fortem (counter-UAS → signed-decision governance layer)

---

## 7. UDS / Zarf deploy (build the environment)
- Bundle: `ghcr.io/szl-holdings/szl-uds-bundle:uds-v0.2.1` (also `uds-v0.2.0`, `latest`). UDSBundle, uds-cli v0.32.0, all 5 organs pinned `0.2.0@sha256:…`, cosign-signed.
- All 5 organ images on GHCR with `.att` (SLSA prov v0.2) + `.sig`.
- Deploy: `uds deploy oci://ghcr.io/szl-holdings/szl-uds-bundle:uds-v0.2.1 --confirm` (after `docker login ghcr.io`).
- Full build manual (Windows tower + Hetzner): `SZL_Build_Deploy_Manual.docx` in the workspace.
- On a real cluster the cross-organ mesh resolves in-cluster via `SZL_ORGAN_BASE_*` env vars.

---

## 8. Access / how to operate the repos (org admin)
- GitHub: org `szl-holdings`, 41 repos. The 5 organ repos = a11oy, sentra, amaru, rosie, killinchu (killinchu private).
- Hugging Face: org `SZLHOLDINGS`, push via the commit API + factory restart to deploy.
- KEY LESSON: a `000` from a script to `*.hf.space` is transient egress flakiness, NOT a crashed app — retry 3–6×.
- Health paths: a11oy/sentra/rosie/killinchu = `/api/health`; amaru = `/healthz`.

---

## 9. Where the detailed state lives (workspace/team/)
- `FLEET_STATE_VERIFIED.md` — running eyes-on verification log (most current truth).
- `LEADER_COMPARISON.md` — cited field-leader comparison.
- `ENDPOINT_CONTRACTS.md` — exact live endpoint contracts per organ (1,220 lines).
- `UNIFIED_APP_SPEC.md` — the full-application spec + vision (mesh, Warhacker, leader-grade).
- `GITHUB_AUDIT_REPORT.md` — repo-by-repo audit + categorized repo map.
- `COSIGN_L2_GROUND_TRUTH.md` — the container-image L2 build-attestation evidence (verifiable via `cosign verify-attestation`; bundle-level attestation = roadmap).

---

## 10. Status (2026-06-05)
- a11oy: full unified application shipped + eyes-on verified (Command Center, Superpowers, Warhacker, Observability, Wires, Mesh, Formulas, Evidence, LLM Router — all real data).
- sentra/amaru/rosie/killinchu: being rebuilt into the same unified full-application standard (real endpoints, cross-flag switcher, leader-grade views).
- Cosign verify-it-yourself: live + cryptographically proven.
- UDS bundle: signed, 5 organs, deployable.
- GitHub: audited + organized; honesty fixes applied.
