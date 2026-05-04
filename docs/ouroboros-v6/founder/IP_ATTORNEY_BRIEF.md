# IP Attorney Brief — Ouroboros v4.6
### Stephen P. Lutar · May 1, 2026 · ATTORNEY-CLIENT PRIVILEGED ON RECEIPT

**For:** Counsel of record (TBD) — registered USPTO patent agent or attorney
**From:** Stephen P. Lutar, sole inventor, stephenlutar2@gmail.com, ORCID 0009-0001-0110-4173
**Re:** Ouroboros runtime trust system; 60 method primitives; Lutar Invariant Λ family; trademark, provisional patent, ITAR/EAR posture
**Posture:** Time-critical. Read the timeline section first.

---

## 1. Executive summary in one paragraph

I have built a runtime trust system that compounds four to nine inspectable scalars into a single witness-anchored verdict. The system is implemented twice (TypeScript reference and Python SDK), covered by 612 TypeScript and 107+ Python passing tests, and has 60 named method primitives organised into 18 modules. The mathematical core is the Lutar Invariant Λ, a weighted geometric mean with Egyptian unit-fraction weights. The first thesis was published to Zenodo around March 2025, which started the United States one-year on-sale bar; that bar has now expired for any utility patent that reads on what the v2 thesis already disclosed. This brief asks you to file what is still filable and to lock down everything else with trademarks, trade-secret discipline, and ITAR/EAR review.

## 2. Inventor and ownership

- Sole inventor: Stephen P. Lutar.
- Ownership: SZL Holdings (sole-member entity controlled by inventor) by assignment to be drafted.
- No prior employer claim. No prior contractor claim. No co-inventors.
- All 60 primitives, the Λ family, the integrations adapters, and the unified-philosophy gate were authored solely by the inventor between February 2025 and May 1, 2026.

## 3. Timeline that defines what is still filable

| Date | Event | Effect on US filing window |
|---|---|---|
| ~March 2025 | Zenodo v2 thesis published (DOI 10.5281/zenodo.19944926) | Started 35 USC 102(b) one-year on-sale / public-disclosure bar |
| ~March 2026 | One-year bar expired for v2 disclosures | Cannot obtain US utility patent that reads on v2 content |
| May 1, 2026 (today) | v4.6 thesis written; 40 new primitives (21-60) NOT YET PUBLISHED | These are still patentable in the US if filed before any further public disclosure |
| Today + 1 to 14 days | File provisional applications on every primitive 21-60 | Locks in priority before Zenodo v3, GitHub release, or arXiv companion |
| Today + 30 days | First public-facing publication (Zenodo v3 + GitHub release) | After this date the new bars start ticking |

**Translation in plain English: the things published in March 2025 are out of reach for US utility patents. The 40 new primitives added since then are still patentable, but only if we file before the next public push, which is queued and pending your green light.**

## 4. What to file and in what order

### 4a. Provisional patent applications — file within 14 days

File one omnibus provisional that names every primitive 21-60 plus the unified-philosophy gate. The omnibus form is acceptable for provisionals under 35 USC 111(b); it preserves a one-year window during which we can carve out separate non-provisionals.

Specific method-claim framings I want preserved:

1. **Λ_k weighted-geometric-mean trust scalar with Egyptian unit-fraction weights** — already disclosed in v2 for k=4 and v3 for k=5, but the v4.6 extensions to k=6, 7, 8, 9 with axes I (Invariance), M (Moral), B (Being), N (Non-measurability) are NEW and should be claimed.
2. **Dual-use review primitive (Oppenheimer module)** — a method for routing a proposed action through a Bohr-style dual-use review with named witness, civilian-impact assessment, and abort-on-veto behaviour.
3. **Hermetic seal primitive (Emerald module)** — a method for binding a payload digest to its provenance metadata in a single SHA-256 envelope such that any byte-level change to either field invalidates the seal.
4. **Polygraphic redundancy primitive (Trithemius module)** — a method for accepting a transmitted message only when a quorum of independent symbolic decoders agrees on the plaintext.
5. **Vanishing-point coherence primitive (Da Vinci module)** — a method for verifying the geometric coherence of a projective reconstruction by checking that all declared orthogonal lines pass within tolerance ε of a single declared vanishing point.
6. **Synoptic-witness primitive (Socrates module)** — a method for binding three independent observers to a single SHA-256 commitment such that any retroactive divergence is detectable.
7. **Mint-forensics primitive (Newton module)** — a method for coin-clipping detection by combining mass-deviation thresholds with cryptographic registration receipts.
8. **Fluxions receipt primitive (Newton module)** — a method for issuing a derivative-evaluation receipt that includes both the symbolic derivative form and its numerical evaluation under a named tolerance.
9. **Lara-gap primitive** — a method for declaring and propagating non-measurability in a numerical pipeline, derived from the Jamneshan-Shalom-Tao counter-example to the Erdős infinite-sumset conjecture.
10. **Unified-philosophy gate (integrations adapter)** — a system claim that runs hermetic seal + shadow registry + triangulation + key-separation + polygraphic + φ-verification in cascade and routes the action to PROCEED, QUARANTINE, or ABORT.

Frame every claim as a "method for computing a runtime trust verdict in a distributed system, comprising …" so the Alice / Mayo abstract-idea exception does not apply. We are claiming a technical application that produces a concrete output (a routing decision), not the underlying mathematics.

### 4b. Trademarks — file this week (USPTO TEAS Plus)

| Mark | International class | Use status |
|---|---|---|
| OUROBOROS | 9 (software), 42 (SaaS) | In use in commerce since Mar 2025 |
| LUTAR INVARIANT | 9, 42 | In use since Mar 2025 |
| BLANCA, LARA, NEWTON, EMERALD, JUNG, THEOSOPHY, TRITHEMIUS, DAVINCI (as module names) | 9, 42 | Intent-to-use; first commercial use will be the v4.6 release |
| SZL HOLDINGS | 9, 42, 41 | In use since 2024 |

Goal: file before v4.6 public release so we have priority on the module names as source identifiers.

### 4c. Copyright registrations — file within 30 days

USCO eFile registration on every package source tree. Copyright attaches at creation, but registration is required to recover statutory damages and attorneys' fees in infringement suits. Cost: $65 per work; we can group-register up to 10 works for a single fee under the new computer-program rules.

### 4d. Trade secret — implement now

Any module whose internals we choose NOT to publish in v4.6 should be marked CONFIDENTIAL — TRADE SECRET in source comments, kept out of the public Zenodo zip, and held under SZL Holdings access controls. Candidate trade secrets:

- The Sentra HSM accumulator internal driver (already partial trade secret).
- Future Λ_10 axis if and when added.
- Customer-specific tuning constants for Λ axes.

### 4e. ITAR / EAR review — required for Oppenheimer module

The Oppenheimer module includes a dual-use-review primitive that explicitly references nuclear / weapons / civilian-impact accountability. Even if the implementation is general-purpose ledger code, the framing draws ITAR (22 CFR 120-130) and EAR (15 CFR 730-774) attention. I want a written export-control opinion before any non-US distribution, and I want the public Zenodo bundle to ship with an EAR99 self-classification declaration if and only if you concur that EAR99 is correct.

## 5. Defensive publication strategy for what we cannot patent

For the v2 content already barred from US utility patents, the strategy is defensive publication: ensure the prior art is timestamped, citeable, and discoverable so no one else can patent it against us. Steps already taken or queued:

- Zenodo v2 (Mar 2025, DOI assigned).
- arXiv companion (queued).
- GitHub public commits with cryptographic timestamps.
- ORCID-linked author identity (0009-0001-0110-4173).
- Substack and Medium posts with publication dates.

Please confirm this stack is sufficient defensive publication under USPTO MPEP 2128 standards.

## 6. Foreign filing consideration

If we file the omnibus US provisional within 14 days, we then have 12 months to file PCT or direct-national in EP, JP, KR, IL, CA, AU. I would like the PCT route by default. Confirm cost estimate: roughly $4-7k for the PCT plus regional fees of $5-15k per region at national-stage entry around month 30.

## 7. Litigation and licensing posture

- Defensive-first. We do not intend to sue first.
- Open licence on the runtime SDK under MIT or Apache-2.0, with a separate commercial licence for enterprise SLAs.
- Reserve patent rights against bad-faith reimplementation by a competitor with funding (defensive triggering only).
- Standard-essential? Probably not yet, but if the Λ scalar is adopted by NIST or NSA as a runtime trust standard, we will need a FRAND policy on file. Please draft a placeholder FRAND statement we can publish as part of the v4.6 release.

## 8. Concrete asks of you, the attorney

Please confirm in writing within 7 days:

1. You can file an omnibus provisional covering the 40 new primitives within 14 days of engagement.
2. You can file the trademark applications listed in §4b within the same 14 days.
3. You will issue an ITAR/EAR opinion on the Oppenheimer module within 30 days.
4. You concur with the defensive-publication stack in §5 or you specify what else is needed.
5. Your fee structure for: (a) the omnibus provisional, (b) the trademark suite, (c) the ITAR/EAR opinion, (d) ongoing prosecution.

## 9. Materials available for your review

All on request, all under attorney-client privilege upon engagement:

- Full source: https://github.com/szl-holdings (private repos accessible upon NDA).
- v4.6 thesis: /home/user/workspace/ouroboros-unified-payload/OUROBOROS_THESIS_V4.md.
- Test results: 612 TypeScript + 107+ Python passing.
- Zenodo v2 DOI: 10.5281/zenodo.19944926.
- This brief as PDF on request.

## 10. Bottom line

The v2 window is closed. The v4.6 window is open and small. I want a provisional filed before the next public publication. I want trademarks filed this week. I want an ITAR/EAR letter on the dual-use module. I am ready to engage and pay.

Stephen P. Lutar
stephenlutar2@gmail.com
ORCID 0009-0001-0110-4173
