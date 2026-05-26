# Trust Doctrine — Why the Audit Chain Exists

**Date:** 2026-05-26
**Author:** Stephen P. Lutar
**Scope:** Doctrine. Names the long-arc trust problem that the SZL Holdings
governance posture answers, and maps each named risk to a specific element of
the existing `docs/audits/` chain so the rest of the corpus reads as a
*response to a named problem* rather than a free-standing pile of audits.

> This doc is doctrine, not implementation. No code changes belong here. The
> audit elements it references are authoritative — when they evolve, the
> mapping table below should be updated, not the audits.

---

## 1. The trust problem in our own words

Two single-document sources frame the long arc of the trust problem this
platform answers:

- **flyxion — *Trust Apocalypse*** ([`Trust Apocalypse.pdf`](https://flyxion.org/rsvp/Trust%20Apocalypse.pdf)).
  A near-future diagnosis: as generative systems collapse the cost of
  producing plausible artefacts (text, code, voice, video, attestations,
  filings), the cost of *verifying* them does not fall in step. The result
  is a regime in which every artefact is presumptively suspect and the
  burden of proof inverts — the producer must carry verifiable provenance
  forward, because the consumer can no longer reconstruct it from the
  artefact alone. The thesis names this inversion the *trust apocalypse*:
  not the end of trust, but the end of the assumption that trust can be
  inferred after the fact.

- **Yale Manuscripts & Archives — Finding Aid 1028**
  ([`1028.pdf`](https://hdl.handle.net/10079/fa/mssa.ms.1028)).
  A long-arc archival framing: institutions persist across centuries
  precisely because they leave a *finding aid* — a curated, versioned,
  citable index of every record, who custodied it, what was added or
  redacted, and under what authority. The finding aid is what makes a
  collection legible to a future custodian who was not present when the
  records were made. The doctrine SZL takes from it is that any system
  asking to be trusted across operator turnover, regime change, and
  litigation must produce its own finding aid as a first-class artefact —
  not as a byproduct of logs.

Combined, the two sources name a single problem with two faces:

1. **Forward face — provenance inversion.** Producers must carry proof
   forward; consumers can no longer reconstruct it. Any output that
   matters (a model decision, a risk score, a routing choice, a tuning
   change) must be accompanied by a portable, verifiable proof packet.
2. **Backward face — archival legibility.** Producers must leave a
   finding aid: an index of every formula, parameter, version, and
   decision that a future custodian (auditor, regulator, successor
   operator) can read without the original author present.

The SZL platform's governance posture — the Lutar / Ouroboros / A11oy
chain — is built as a direct answer to that two-faced problem. The rest
of this doc enumerates the risks named by the sources and maps each one
to the specific audit-chain element that answers it.

---

## 2. Named risks → audit-chain elements

| # | Named risk (source)                                          | Face       | Answer in the SZL audit chain                                                                                                                                                                                  |
|---|--------------------------------------------------------------|------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | **Plausible-but-unverifiable outputs** *(flyxion)*           | Forward    | Single proof emission path: every cross-boundary invocation is wrapped in `instrument(spec, fn)` and lands in the proof ledger. See [`formulas.md` §5, §6](./formulas.md) and [`formula-thesis-gaps.md`](./formula-thesis-gaps.md). |
| 2 | **Producer-side incentive to omit provenance** *(flyxion)*   | Forward    | Provenance is structural, not optional. The `instrument` wrapper is the only sanctioned callsite; any consumer not importing from `@szl-holdings/formulas` is flagged by the dependency-health sweep. See [`formulas.md` §5, §8](./formulas.md). |
| 3 | **Silent parameter drift** *(flyxion — "rules that change without anyone noticing")* | Forward / Backward | Bounded-autonomy tuning loop: ROSIE proposes, A11oy operator decides, `formula_versions` records. No parameter change applies without an operator decision. See [`formulas.md` §7, §7a](./formulas.md). |
| 4 | **Unbounded autonomy** *(flyxion — "the agent that just acts")* | Forward | Autonomy gate + escalation back-off as first-class formulas, not inline thresholds. See [`formulas.md` §4](./formulas.md) (rows: autonomy gate, escalation back-off) and [`machine-gap-audit.md`](./machine-gap-audit.md) §0 on the bounded-autonomy posture. |
| 5 | **Verification cost outrunning production cost** *(flyxion)* | Forward    | Centralised formula registry (one impl per rule, one parameter table, one invocation log) collapses verification to a single query surface. See [`formulas.md` §2, §6](./formulas.md). |
| 6 | **No legible record for a future custodian** *(Yale 1028)*   | Backward   | The audit chain itself is the finding aid: per-artifact reports, formula registry, machine gap audit, and platform-vs-local diff are versioned and cross-linked from [`README.md`](./README.md).               |
| 7 | **Loss of chain-of-custody on operator turnover** *(Yale 1028)* | Backward | GitHub publication-readiness audit catalogues identity, org, repo, license, and citation state so the corpus remains attributable across custodians. See [`github-audit-v9.md`](./github-audit-v9.md) and [`github-org.md`](./github-org.md). |
| 8 | **Drift between thesis and shipped artefact** *(Yale 1028 — finding-aid-vs-collection mismatch)* | Backward | Thesis-vs-shipped diff is run as an audit, not as a hope: every Lutar / Prisca formula is CLOSED across CODE / API / CODEX / TEST / THESIS. See [`formula-thesis-gaps.md`](./formula-thesis-gaps.md) and [`machine-gap-audit.md`](./machine-gap-audit.md) §0. |
| 9 | **Demo-time fiction vs. shipped reality** *(flyxion + Yale 1028, applied)* | Both | Investor demo path is published and per-artifact audits enumerate every TBD / placeholder / mock that was purged for it. See [`INVESTOR_DEMO_PATH.md`](./INVESTOR_DEMO_PATH.md), [`a11oy.md`](./a11oy.md), [`conduit.md`](./conduit.md), [`sentra.md`](./sentra.md), [`counsel.md`](./counsel.md), [`terra.md`](./terra.md), [`vessels.md`](./vessels.md), [`carlota-jo.md`](./carlota-jo.md). |
| 10 | **Local-vs-platform fork** *(Yale 1028 — accession-vs-deposit gap)* | Backward | Platform-vs-local diff is a standing audit, not a one-off. See [`platform-vs-local-2026-05-25.md`](./platform-vs-local-2026-05-25.md). |

---

## 3. What this doctrine commits us to

1. **No proof, no production.** A new mutating callsite without
   `instrument(spec, fn)` is a defect — even if the underlying logic is
   correct — because it produces an artefact whose provenance the
   consumer cannot reconstruct (risks #1, #2).
2. **No silent tuning.** A parameter change that bypasses the
   `formula_tuning_proposals` queue is a defect, even if the new value
   is better (risk #3). Bounded autonomy is the contract; better
   parameters discovered out-of-band still go through the queue.
3. **No undocumented formula.** A scoring / weighting / threshold rule
   that lives outside `lib/formulas/` is a defect, even if it works
   (risks #5, #8). The finding aid must remain complete.
4. **No orphaned audit.** Every audit document under `docs/audits/` is
   linked from [`README.md`](./README.md). An audit that no successor
   can find is not a finding aid (risks #6, #7).
5. **No demo-time fiction.** TBDs, placeholders, and mocks discovered
   on the investor demo path are tracked in the per-artifact audits and
   closed, not narrated around (risk #9).

These commitments are what make the rest of the `docs/audits/` corpus
coherent: it is not a pile of audits, it is the platform's answer to a
named problem.

---

## 4. Sources

- flyxion. *Trust Apocalypse.* PDF. <https://flyxion.org/rsvp/Trust%20Apocalypse.pdf>
- Yale University Library, Manuscripts and Archives. *Finding Aid MS 1028.* PDF. <https://hdl.handle.net/10079/fa/mssa.ms.1028>
