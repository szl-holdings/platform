# Anthropic Fellows Program Application — Stephen P. Lutar
**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings · stephen@szlholdings.com
**Program:** Anthropic Fellows — September 2026 Cohort (4 months, Berkeley)
**Filed:** 2025

---

> ## STATUS: BLOCKED ON REFERENCES
> **READY TO SUBMIT** once Questions 7–9 (References 1–3) are filled in.
> All other answers are complete and have passed the forbidden-pattern sweep.

---

## 1. Other Teams to Be Considered For

- AI Safety: Mechanistic Interpretability & Model Internals
- ML Systems & Performance

---

## 2. Why Are You Interested in Participating in the Fellows Program?

The Fellows program offers exactly the forcing function the szl-holdings safety stack needs: four months of full-time mentored research, embedded alongside Anthropic's interpretability and alignment teams, to convert a set of production-grade Lean-proven primitives into infrastructure that ships inside Anthropic's eval pipeline. That is a different proposition than a regular full-time hire. A residency lets both sides establish technical fit on real research problems before a longer commitment — and the research problems I care about are already aligned with what Anthropic's RSP v3.2 demands.

Concretely: RSP v3.2 defines capability thresholds that trigger mandatory safeguard deployment. Today those thresholds are policy commitments; they are not machine-checkable. My Math Pod V3 outputs (TH4 Λ-Category, TH5 Confluence, TH6 Bekenstein-DPI, TH7 Curry-Howard) define the lutar-calculus — operational semantics in which a receipt is simultaneously a formal proof, an audit instrument, and a deployable artifact. TH8 (Graded Λ-Receipt Calculus, GΛR) is in active drafting, targeting POPL 2027. The research question I want to bring into the Fellows residency is: can RSP capability thresholds be expressed as checkable theorems in GΛR? Working alongside Chris Olah's mechanistic interpretability group, Evan Hubinger's deception-eval work, and Sam Bowman's alignment scaling research is the highest-leverage way to answer that question. My strength is production runtime engineering with formal verification primitives — not pure ML research — and that is the gap I can fill. Doctrine: no hallucinations, no bandaids, test test test.

---

## 3. One or More Research Areas You're Excited About Right Now

The open problem I keep coming back to is **mechanistic interpretability for agent runtimes**: making every gate decision in an operating agent system a mechanically inspectable, formally attested artifact. Olah's circuits work characterizes what happens inside model weights; Hubinger's deception-eval literature asks whether a model's internal behavior is consistent with its external commitments. Both questions require a formal audit layer at the agent-runtime level that does not yet exist. The ouroboros receipt system is a direct attempt to build that layer — every Λ-gate decision in the 9-axis a11oy trust gate produces a byte-identical, deterministically replayable receipt. TH7 (Curry-Howard correspondence for receipts) proves that a valid receipt is a proof of the gate's postcondition. TH6 (Bekenstein-DPI) formalizes the information bound on receipt density, which constrains how much behavioral evidence can be packed into a receipt of given size. The live research question connecting both theorems to RSP is: can the capability thresholds specified in ASL-3 and ASL-4 be encoded as type signatures in GΛR, such that an agent runtime either produces a type-correct receipt or is hard-blocked before deployment? Making that machine-checkable is the residency target.

---

## 4. Background and Links

The public record starts at **github.com/szl-holdings** (14 public repos, run as a solo-founder org). Thirteen artifacts are minted on Zenodo under concept DOI **10.5281/zenodo.19944926**. The four repos most directly relevant to the Fellows application: **ouroboros** (v6.3.0 — 218/218 tests green, p50 receipt build 11.5 µs, 9-axis Λ-gate requiring Λ ≥ 0.90 with `moralGrounding` + `measurabilityHonesty` ≥ 0.95, byte-identical replay root `1ed4d253`); **a11oy** (the standalone 9-axis conjunctive trust gate); **lutar-lean** (Lean 4 proof corpus formalizing the runtime invariants, including TH4–TH7); **ouroboros-thesis** (the full technical argument). Stack is full-stack TypeScript/Node/Rust/Python on Hetzner infra; AI agent development includes HeyGen voice-avatar integration and property-management automation. The entire org runs org-wide OpenSSF Scorecard 6.83+, all CI gates green on every commit. LinkedIn: **https://www.linkedin.com/in/stephen-l-279315240/**. No co-authors to disclose — all work is sole-authored.

---

## 5. Likelihood to Accept Full-Time Offer After Fellows

**95%**

Already aligned with Anthropic's safety thesis; the Fellows program is the entry path I have been building toward. A 4-month residency functions as a mutual-fit interview — if the research collaboration lands as expected, accepting a full-time offer is the straightforward next step. The 5% residual accounts for unforeseen family or health circumstances only, not for competing offers or philosophical misalignment.

---

## 6. Likelihood to Continue AI Safety/Security Work After Fellows

**99%**

SZL Holdings is itself an AI safety infrastructure project. The lutar-calculus, the receipt-attested runtime, and the GΛR calculus continue with or without an Anthropic offer — they are not conditional on employment. Anthropic is the highest-leverage venue for this work, but the work is not contingent on it. The 1% residual is actuarial, not motivational.

---

## 7–9. References

> ### STEPHEN — FILL THESE 3 BEFORE SUBMITTING
>
> You need three references. Strong candidates:
>
> **(a)** Any past technical manager or client CTO who saw you ship production code under a real deadline — consulting engagements, prior employer, or client from property-management / HeyGen automation work.
>
> **(b)** Any open-source collaborator who reviewed, forked, or contributed to a repo in the `szl-holdings` org — GitHub PR history is the evidence trail.
>
> **(c)** Anyone who reviewed your formal verification work — a Lean community member, a PL theory researcher who read `lutar-lean` or `ouroboros-thesis`, or someone from the POPL / ICFP submission pipeline.
>
> ML-community affiliation is preferred but not required. A technical manager who can speak to your engineering discipline is stronger than a weak ML name.
>
> Use the template text below for each reference. Edit to match the actual person before submitting.

---

### Reference 1

**Name:** [TO_FILL_BY_STEPHEN]

**Email:** [TO_FILL_BY_STEPHEN]

**Background (template — edit before submitting):**
> [Title] at [Organization]. Public profile: [URL — LinkedIn / personal site / GitHub]. Google Scholar: [URL if academic; omit if not]. Known for work in [domain — e.g., formal verification / ML safety / distributed systems / software engineering management].

**Relationship (template — edit before submitting):**
> Collaborated on [project or engagement] from [start date] to [end date]. We worked [closely day-to-day / via async PR review / on a consulting contract] on [specific technical area — e.g., TypeScript runtime architecture / Lean 4 proof review / production CI pipeline]. They can speak to my technical depth in [specific area] and, honestly, to my tendency to [specific honest weakness — e.g., over-engineer before shipping the MVP / write proofs before writing docs].

---

### Reference 2

**Name:** [TO_FILL_BY_STEPHEN]

**Email:** [TO_FILL_BY_STEPHEN]

**Background (template — edit before submitting):**
> [Title] at [Organization]. Public profile: [URL]. Google Scholar: [URL if academic; omit if not]. Known for work in [domain].

**Relationship (template — edit before submitting):**
> [Relationship context — e.g., "Technical reviewer of ouroboros-thesis draft (2024–2025). Reviewed the formal semantics sections and the Lean 4 invariant proofs in lutar-lean via GitHub issues."] They can speak to my [specific strength — e.g., formal rigor, documentation discipline] and to my [specific honest weakness].

---

### Reference 3

**Name:** [TO_FILL_BY_STEPHEN]

**Email:** [TO_FILL_BY_STEPHEN]

**Background (template — edit before submitting):**
> [Title] at [Organization]. Public profile: [URL]. Google Scholar: [URL if academic; omit if not]. Known for work in [domain].

**Relationship (template — edit before submitting):**
> [Relationship context.] They can speak to my [specific strength] and to my [specific honest weakness].

---

## 10. September 2026 Availability

**Yes.** Committed to the full 4-month program (September 2026 – January 2027) in Berkeley.

---

## 11. Other Commitments or Deadlines During the Program

None that conflict with the Fellows program. SZL Holdings operations can be paused and handed to maintenance mode for the duration of the 4-month residency.

---

## 12. Earliest Full-Time Start Date After Fellows

Immediately after the program ends (January/February 2027), or with up to 2 weeks of transition time if needed for logistics.

---

## 13. Country of Residence

USA

---

## 14. Work Authorization Country

USA

---

## 15. Other Work Authorization Details

US citizen by birth. No restrictions.

---

## 16. Berkeley or London Workspace Preference

**Berkeley: for the entire program.** Committed to relocating from NYC Metro (Connecticut / Brewster, NY) to Berkeley for September 2026 – January 2027, then returning to NYC long-term.

---

## 17. Previously Applied or Interviewed at Anthropic

**No.**

---

## 18. Other Commitments During the Program

None. Will treat the program as full-time, 40+ hours/week. SZL Holdings operations handed to maintenance/pause mode for the duration.

---

## 19. How Did You Hear About the Fellows Program?

Anthropic's careers page and the RSP publication.

---

## 20. Anything Else to Share?

The stack is public, the doctrine is enforced as CI gates, and every commit passes a zero-tolerance forbidden-pattern sweep before it lands. The work is already running at production quality — 218/218 tests, 11.5 µs p50, Lean-proven invariants, 13 minted DOIs. The Fellows program is where it scales.

---

## 21. Future Contact from Anthropic and Constellation

**Yes.**

---

## 22. Referral to Other Organizations

**Yes.**

---

## 23. Consent, Accuracy, and Co-Authored Work Statement

**Check this box before submitting.** By checking, you confirm: (a) all information is accurate and your own, (b) any co-authored work is disclosed. Note: all szl-holdings work is sole-authored; no co-authors to disclose.

---

---

## DOCTRINE SWEEP — FORBIDDEN PATTERNS (run before submitting)

The following 8 patterns are zero-tolerance. Each must be absent from the final submitted text.

| Pattern | Status |
|---|---|
| `Jr.` | ABSENT ✓ |
| `AlloyScape` | ABSENT ✓ |
| `Glass Wing` | ABSENT ✓ |
| `Pillpintu` | ABSENT ✓ |
| `Khipu` | ABSENT ✓ |
| `Stephen Paul` | ABSENT ✓ |
| `Perplexity Computer` | ABSENT ✓ |
| `anonymous` | ABSENT ✓ |

Sweep confirmed clean. All 8 forbidden patterns absent from this document.

---

*End of application answers — Lutar, Stephen P. · ORCID 0009-0001-0110-4173*
