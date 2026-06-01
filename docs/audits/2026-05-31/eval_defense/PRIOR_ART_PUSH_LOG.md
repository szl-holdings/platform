# PRIOR-ART PUSH LOG & SUBMISSION INSTRUCTIONS

**Task 4 — Defensive Publication.** Prepared by **Yachay** (Evaluation & Defense), SZL Holdings.
Disclosure date: **2026-06-01 (EDT)**.

---

## 1. GitHub publication (DONE — public, timestamped)

The disclosure is published as a **public** repository, which is itself a valid
prior-art act: it creates a publicly accessible, version-controlled, timestamped
record of the methods.

| Field | Value |
|-------|-------|
| Repository | **https://github.com/szl-holdings/prior-art-disclosures** |
| Organization | `szl-holdings` |
| Visibility | **public** (required — a defensive publication must be publicly accessible to bar third-party claims) |
| Default branch | `master` |
| Commit SHA | `01028b010d7f238df351f0a726cdf3287f2808b6` |
| Committed | 2026-06-01 (EDT) |
| Files | `main.tex`, `main.pdf` (2 pp.), `IEEEtran.cls`, `README.md` |
| Author | Yachay <stephenlutar2@gmail.com> |

> **Why public.** A private repo establishes *authorship date* internally but is **not**
> publicly accessible and therefore does **not** create enforceable prior art against a
> third-party patent. Defensive publication only works if the public can find it. The repo
> was therefore created `--public` by design. (This is the one deliberate departure from
> the default-private rule, justified by the express purpose of the task.)

The disclosure is also mirrored into the foundation-proofs tree at:
`foundation_proofs/prior_art_defense/` (main.tex, main.pdf, IEEEtran.cls).

---

## 2. Formal defensive-publication services (manual submission — instructions)

GitHub publication is sufficient to establish prior art, but the strongest defensive
posture pairs it with one or more **indexed, examiner-searchable** disclosure venues.
Patent examiners routinely search these databases; GitHub is not part of standard
examiner prior-art search corpora. **Recommended: do at least one of (a) or (c).**

### (a) IP.com — Prior Art Database / Defensive Publication  — ~US$295
The de-facto standard for defensive publications; indexed and surfaced in examiner
searches (USPTO/EPO).
1. Go to **https://priorart.ip.com** → "Publish a Disclosure".
2. Create/Sign in to an IP.com account (Disclosure Publication).
3. Upload `main.pdf` as the disclosure body; set title to the paper title; set the
   author/assignee to **SZL Holdings**; publication date today.
4. Add keywords: *agentic AI, action-selection gate, hash-chained receipts, Khipu DAG,
   provenance, formal verification, Lean, SLSA, safety tripwire.*
5. Pay the single-disclosure fee (**~US$295**) → receive a permanent IP.com Disclosure
   Number (`IPCOMxxxxxxxxx`). Record that number back into this log.

### (b) Research Disclosure (Questel) — ~US$170
Long-established (since 1960) printed+online disclosure journal cited by examiners.
1. Go to **https://www.researchdisclosure.com** → "Submit a disclosure".
2. Upload `main.pdf`; provide title, abstract, and SZL Holdings as discloser.
3. Pay (**~US$170**) → assigned a Research Disclosure database number + issue/month.

### (c) arXiv — FREE
Free, permanent, publicly indexed, strong timestamp; widely searched. Cross-listing
cs.AI / cs.CR is ideal for this material.
1. Account at **https://arxiv.org** (endorsement may be required for `cs.AI` if the
   submitter has no prior arXiv history — request endorsement or co-submit with an
   endorsed author).
2. Submit `main.tex` + `IEEEtran.cls` (arXiv compiles TeX) or the `main.pdf`.
3. Categories: primary **cs.AI**, cross-list **cs.CR** (crypto/provenance) and **cs.LO**
   (logic/formal methods).
4. License: choose a non-exclusive license that permits public distribution.
5. On acceptance, record the arXiv ID (`arXiv:25xx.xxxxx`) back into this log.

> **Spend note (eval-budget context).** These are *publication* fees, not eval-compute
> spend; they are **not** charged against the US$100 eval cap. They require a human to
> complete payment/account steps, so they are documented here as instructions rather than
> executed by the agent.

---

## 3. Patent strategy — FILE 3, PUBLISH the rest (per disclosure §VII)

The disclosure (`main.tex` §VII) records the deliberate dual strategy: **file** narrow,
defensible, novel claims; **publish defensively** the broad method so no competitor can
fence it.

### FILE (provisional → utility) — 3 claim families

| ID | Title | Core claim | Rationale to file |
|----|-------|-----------|-------------------|
| **P-A** | Sovereignty-Selectable Inference | Routing an inference request to a model/runtime selected by a per-request *sovereignty* attribute, with the routing decision bound into a verifiable receipt. | Novel framing; commercially central; route-by-sovereignty fence. **Speculative-decoding slice folded into P-A** (drafted around blocking prior art — see below). |
| **P-B** | Gate-Minted Capability Token | A capability token minted only upon passing a conjunctive multi-axis admissibility gate (Yuyay 13-axis), token scope cryptographically bound to the gate result. | Concrete, narrow, enforceable; ties capability issuance to gate pass. |
| **P-C** | Theorem-Bound Tool Output | Constraining a tool/agent output to satisfy a machine-checked theorem (Lean-verified invariant) before the output is admitted/emitted. | Differentiates from generic guardrails; anchored to the 13 PROVED theorems. |

### PUBLISH DEFENSIVELY (do **not** file — bar others via this disclosure)
- The **broad master action-selection formula** `P(x,t)` (too broad to defend; publish to block).
- The **route-by-sovereignty fence** in its generic form.
- The **Khipu DAG** hash-chained-receipt architecture in its generic form.
- The **speculative-decoding** technique standalone — **blocked by prior art** and therefore
  folded into P-A only as a dependent embodiment, not claimed independently:
  - **US 12,229,192 B2** — blocking prior art on speculative decoding.
  - **US 2025/0384043 A1** — blocking published application.

### Honesty guardrails carried into any filing
- **Λ-uniqueness is Conjecture 1**, not a theorem — must not be claimed as proven.
- Provenance is **SLSA L1** (asserted honestly; "L3" is banned from all materials).
- 13 theorems are **sorry-free / PROVED**; 163 raw sorries remain **open obligations** and
  must be disclosed as such in any patent specification's enablement discussion.

---

## 4. Status checklist

- [x] Disclosure drafted (IEEEtran, 2 pp.) — `main.tex` / `main.pdf`
- [x] PDF compiled & verified clean
- [x] Public GitHub repo created & pushed — `szl-holdings/prior-art-disclosures` @ `01028b0`
- [x] Mirrored into `foundation_proofs/prior_art_defense/`
- [ ] IP.com defensive publication (manual, ~$295) — **instructions above**
- [ ] arXiv cross-list cs.AI/cs.CR/cs.LO (free) — **instructions above**
- [ ] (optional) Research Disclosure (~$170) — **instructions above**
- [ ] Provisional filings P-A / P-B / P-C — counsel action

---

*Prepared by **Yachay** — Evaluation & Defense, SZL Holdings — 2026-06-01.*
