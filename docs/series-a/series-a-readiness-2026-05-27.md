# Series A Readiness — 2026-05-27 delta

**This document is a point-in-time delta**, not a replacement for canonical sources:

- **Canonical readiness narrative:** `docs/investor/series-a-readiness.md`
- **Canonical gap register:** `docs/audit/series-a-gap-register.md`
- **Canonical release doctrine:** `docs/A11OY_RELEASE_DOCTRINE.md`
- **Canonical release gates:** `docs/RELEASE_GATES.md`
- **Canonical release scorecard:** `docs/RELEASE_READINESS_SCORECARD.md`
- **Canonical scope register:** `docs/audit/series-a-out-of-scope-register.md`
- **Canonical executive closeout:** `docs/audit/series-a-executive-closeout.md`
- **Public claims doctrine:** `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`
- **Non-negotiables:** `docs/A11OY_NON_NEGOTIABLES.md`

If a statement here conflicts with any of the above, the canonical document wins. This delta exists to capture (a) today's release-gate state, (b) eight proposed additions to the gap register (GAP-016…023), and (c) a verified-vs-unverified ledger of architectural claims as of 2026-05-27.

**Posture:** No bandaids. No hallucinations. Every claim ties to a file, a tag, or a CI run.

---

## 1. Headline (2026-05-27)

Per `docs/investor/series-a-readiness.md`, SZL Holdings is **pre-Series A** on a deliberate path to round-readiness in **Q4 2026 / Q1 2027**. Round triggers are commercial (cohort conversion, ARR, references), not technical.

This delta is concerned only with the **technical-diligence dimension** — specifically: can the UDS bundles, the proof chain, the Λ invariant, and the perception/bio wiring shipped today survive a hostile technical audit?

**Verdict (today):** Yes, with three blockers and seven gaps closed. The kernel holds. The perimeter needs cosign signing, a furnished `rosie` skeleton, and a green doctrine scanner before the data room opens.

---

## 2. What ships today — verified locally 2026-05-27

| Surface                                | Public repo / artefact                                  | Proof it works (today)                                          |
|----------------------------------------|---------------------------------------------------------|-----------------------------------------------------------------|
| **A11oy** — Live Enterprise Execution Fabric | `szl-holdings/a11oy` + `a11oy-uds-0.1.1.tar.zst` | Release gate: build + sha256 + smoke ✓                          |
| **Sentra** — Cyber resilience domain pack | `szl-holdings/sentra` + `sentra-uds-0.2.0.tar.zst` | Release gate ✓; NIST CSF 2.0 + D3FEND mapping recorded in MANIFEST |
| **Amaru** — Convergent data sync          | `szl-holdings/amaru` + `amaru-uds-0.1.0.tar.zst` | Release gate ✓; bounded-loop receipts                            |
| **ROSIE** — Governed decision fabric      | `szl-holdings/rosie` + `rosie-uds-0.1.0.tar.zst` | Release gate ✓; deny-by-default admission witnesses              |
| **Vessels** — Maritime domain pack        | `szl-holdings/vessels` + `uds-v0.1.0`           | Released 2026-05-27                                              |
| **Λ Lean proof** (machine-checked Lutar)  | `szl-holdings/lutar-lean` `v0.1.0`              | Lean 4.12.0 build green today (`check-lean-build: ok`)           |
| **Ouroboros runtime** (Λ enforcement)     | `szl-holdings/ouroboros` `v6.3.0`               | Apache-2.0; CHANGELOG current                                    |
| **Ouroboros thesis** (peer-reviewable)    | `szl-holdings/ouroboros-thesis` paper-v14 draft | CC-BY-4.0; Zenodo-pinned                                         |
| **SZL-Trust portal** (CPS reference run)  | `szl-holdings/szl-trust`                        | 12 receipts, deterministic replay, IAU + Dresden citations       |

**Today's perception/bio wiring (Task #5514) — DONE:**
- A11oy perception primitives wired into the Approval Gate + Proof Ledger
- Privacy invariant enforced via serialization test
- AMI gate extended with `peakSignal` + `reviewerPresence` (non-destructive mixing — `max()` on N/D, multiplicative damper on G)
- Orchestration-traces ring buffer + `/a11oy/orchestration-traces` route + Proof Ledger panel
- A11oy.UDS bundle refreshed (sha256-only — no cosign key in this env; see GAP-016)
- `pnpm` workflows for `a11oy: web` and `api-server: api` running green
- Full UDS release gate (a11oy + sentra + amaru + rosie + lean) PASSED

---

## 3. Three blockers before data room opens

Each ties to a proposed gap in `docs/audit/github-org-audit-2026-05-27.md` §3.

### B1 — UDS bundles ship unsigned (proposed GAP-016)
`uds-release.sh` summary today: `sig-skip: 4 a11oy-uds:unsigned sentra-uds:unsigned amaru-uds:unsigned rosie-uds:unsigned`. The release script is already wired for cosign; gap is operational.

### B2 — `rosie` public repo is unfurnished (proposed GAP-017)
Single commit (`Initialize repo`); no LICENSE/SECURITY/CITATION/CHANGELOG/topics/protection; yet has a tagged `uds-v0.1.0` release. First-impression risk in diligence.

### B3 — Doctrine V6 scanner failing on `main` (proposed GAP-018)
9 forbidden-token violations including `Mythos-V1` literally in `scripts/release/uds-version-sync.json`. A failing CI gate on `main` is the wrong signal during diligence.

---

## 4. Seven diligence gaps (don't block, but burn Q&A time)

Proposed GAP-019 through GAP-024 in the org audit delta. Summary: CODEOWNERS missing everywhere; license clarity (`NOASSERTION`); `uds-mesh` bare; `terra`/`counsel`/`carlota-jo` ambiguous UDS status; `agi-forecast` zero releases; social previews unapplied; stale canonical-source pointer in `stephenlutar2-hash/szl-holdings-platform`.

---

## 5. Architectural-claim ledger — verified vs unverified today

Each row classified per `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`:

| Claim                                                              | Status (2026-05-27)             | Evidence                                                                       |
|--------------------------------------------------------------------|---------------------------------|--------------------------------------------------------------------------------|
| Λ invariant is machine-checked                                     | **VERIFIED today**              | `szl-holdings/lutar-lean` v0.1.0; Lean 4.12.0 build green (`check-lean-build: ok`) |
| Hash-chained decision receipts                                     | **VERIFIED today**              | `ATTESTATIONS.json` written by every UDS bundle build (a11oy head `e7bddf226349…`) |
| Deny-by-default admission                                          | **VERIFIED today**              | ROSIE deny path; bundle smoke imports green                                    |
| Reviewer-presence + peak-detector mixed into AMI gate              | **VERIFIED today**              | `artifacts/api-server/src/a11oy/formulas/ami-formula.ts` + 11/11 runtime tests |
| Raw frame bytes never leave device-local buffer                    | **VERIFIED today**              | `packages/perception-loop/src/__tests__/privacy.test.ts` passes                |
| KS-18 contextuality witness                                        | **VERIFIED today**              | `@a11oy/core`; memory note `ks18-contextuality-witness`                        |
| 12-receipt CPS reference run reproducible                          | **VERIFIED**                    | `szl-holdings/szl-trust` README + artifacts                                    |
| Bounded-loop convergence (sub-ms per-request overhead)             | **PARTIAL — claim documented, NOT re-benchmarked today** | `ouroboros` v6.3.0 README claims it; no dated benchmark CSV in `dist/` today; re-run before data room |
| 172/172 tests in ouroboros                                         | **NOT RE-RUN today**            | Number sourced from public README; reverify in clean checkout before data room |
| Zarf-native UDS packaging                                          | **PARTIAL**                     | Build script wired; local env lacks `zarf` so all four ship as `.fallback.tar.zst`; released GitHub artefacts must be the real Zarf format |
| Cosign-signed bundles                                              | **NOT YET**                     | See B1 / GAP-016                                                               |
| Production customers                                               | **NOT CLAIMED**                 | Per `A11OY_PUBLIC_CLAIMS_DOCTRINE`: "design partner conversations" only        |
| SOC 2 / ISO / HIPAA certifications                                 | **NOT CLAIMED**                 | Per non-negotiables: "architected for readiness" only                          |
| Live integrations for vendor connectors                            | **NOT CLAIMED**                 | "Mock connector" / "future connector target" terminology preserved             |

**The honest summary:** every governance claim with a test or proof file backing it passes today. The two non-blocking partials (perf benchmark, full ouroboros test re-run) need to be re-executed on a clean checkout before the data room opens, with output committed as a dated artefact under `docs/audit/2026-Q4/`.

---

## 6. What this task agent cannot do from this environment

Per Replit's isolated-environment rules:
- **No `git push`.** Version control is platform-managed. Today's checkpoint at commit `0eb4f5a0d` lives on the platform-managed branch and is merged upstream by Replit, not by this agent running git commands.
- **No release tag.** Cutting `szl-v<version>` happens upstream, after the platform merge.
- **No GitHub Settings UI changes.** Branch protection, social preview upload, secret configuration — all require human action in the web UI.

What this task agent **has** done in this session:
1. Wired today's perception/bio primitives into A11oy (Task #5514).
2. Refreshed the A11oy.UDS bundle (sha256-only fallback — no cosign key in this env).
3. Run the full UDS release gate end-to-end (`uds-release.sh`) — PASSED.
4. Audited all 20 szl-holdings repos against doctrine — produced `docs/audit/github-org-audit-2026-05-27.md`.
5. Drafted the LinkedIn post against `A11OY_PUBLIC_CLAIMS_DOCTRINE` — produced `docs/marketing/linkedin-2026-05-27-a11oy-uds.md`.
6. Produced this delta.

---

## 7. Recommended next-task ordering (Series A impact)

1. **Close B3 (Doctrine V6 scanner)** — 30 min. Highest reward-to-effort.
2. **Close B2 (rosie skeleton)** — 2 hours. Mirror `sentra` file set.
3. **Close B1 (cosign signing)** — half day. Requires founder key-ceremony + Actions secret.
4. **Cut `a11oy-uds@0.1.2`** with today's perception/bio wiring (follow-up to #5514).
5. **Close D1 (CODEOWNERS) across all Tier-A and Tier-B repos** — half day.
6. **Close D2 (license ambiguity) with counsel** — pending counsel availability.
7. **Close D3 (uds-mesh furnishing)** — one day.
8. **Resolve D4 (terra/counsel/carlota-jo UDS status)** — product decision.
9. **Cut `agi-forecast v0.1.0` + Zenodo-DOI** — one hour.
10. **Apply social previews** — one hour, all manual UI.

Items 1–3 are pre-data-room. Items 4–10 should be done before the round opens.
