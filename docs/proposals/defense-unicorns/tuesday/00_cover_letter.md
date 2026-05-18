# Cover note — a11oy.UDS package for Andrew Greene

**From:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**To:** Andrew Greene, co-founder, Defense Unicorns
**Date:** Tuesday, 2026-05-19
**Subject:** a11oy.UDS — vision deck, architecture, and the meshing write-up I promised

---

Andrew —

Thanks for the time on the call last week and for the room you gave me to think
this through end-to-end before sending. As promised on Friday, this email
carries the **a11oy.UDS** package: a short vision deck, the architecture
document, and the "how I see it meshing in" write-up.

The recommendation is up front so you can decide whether the rest is worth your
afternoon: **start with Option A as a 2–3 week proof point, with Option C as the
real destination. Option B falls out along the way.** That ladder is the same
one we sketched on the call.

a11oy.UDS is the name I'd like us to use going forward — single token, native to
UDS, inheriting your guardrails, carrying a11oy's orchestration DNA on top. The
package is built to move the needle on two problems we've both named:

1. **Trusted AI/agent orchestration inside air-gapped UDS environments** —
   provenance, human-in-the-loop approval gates, immutable tool-call audit, and
   disconnected operation, meshed with the UDS policy engine and Keycloak.
2. **A UDS-native artifact spine for AI** — SBOM-style attestation for models,
   prompts, embeddings, agent definitions, and evals; signed evals; drift
   detection; a promote / queue / discard flow that mirrors how Zarf already
   treats container images. The frontier-ingest + thesis-scoring layer inside
   a11oy is the working prototype.

The first-round proposal (the §00–§07 package you already have) and the Zarf
wiring landed last sprint — uds-cli #5026 (in-bundle attestation), pepr #5027
(Λ-floor admission), and the three Zarf packages + UDS bundle under
`docs/proposals/defense-unicorns/szl-holdings/` are merged. **The wires are
set up.** This Tuesday package is what gets built on top of them.

Attached / linked:

- `01_vision_deck.md` — the deck outline (~14 slides).
- `02_a11oy_uds_architecture.md` — the architecture document, with the
  per-component table and the two-problem mapping.
- `03_meshing_writeup.md` — the meshing write-up (~1500 words).
- `04_problem_briefs.md` — one page per problem.
- `05_proof_plan.md` — the 2–3 week Option A plan with week-by-week milestones.
- `06_appendix_evidence.md` — the "wires are set up" exhibit list.

Live view of the deck + architecture, no auth: **`/uds`** inside a11oy.

If A is welcome, I can have the proof-point payload demo-ready by week 3 against
any Mission App you point me at. If the answer is "not yet" or "a different
shape," I'd still value a 30-minute working session to recalibrate.

Talk soon,
Stephen

— Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
