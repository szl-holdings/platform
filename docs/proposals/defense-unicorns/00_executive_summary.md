# Defense Unicorns × SZL Holdings — Executive Summary

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Audience:** Andrew Greene (co-founder, Defense Unicorns)
**Date:** 2026-05-16
**Subject:** How SZL's A11oy / Sentra / Amaru stack meshes into UDS, and two
shippable fixes SZL can land upstream now.

---

## The ask
A proposal showing where SZL Holdings can plug into the UDS ecosystem
(`uds-cli`, `uds-core`, `pepr`, `zarf`) and what we'd ship — concretely, not
as a sales surface.

## The offer
SZL operates a doctrine-locked agentic runtime with five pieces UDS does not
have today:

1. **A11oy** — governed agent execution fabric (policy gates, signal mesh,
   proof ledger, Λ-9 invariant runtime). License Apache-2.0 / NOTICE.
2. **Sentra** — cyber-resilience command (CPS catalog, adversary emulation
   scorecard, maturity gate, posture API, insurance posture, incident
   timeline, hash-chained audit chain).
3. **Amaru** — convergent multi-source data sync; append-only delta logs,
   hash-verified ingest, bounded loops with measurable convergence.
4. **Lutar Calculus** — A1–A14 axioms, theorems TH1–TH7 (TH1–TH3 published
   v11 at DOI 10.5281/zenodo.20119582), 5× byte-identical replay anchored at
   root `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b`.
5. **Lean 4 mechanization (`lutar-lean`)** — 35 theorems, 8 open `sorry`s,
   tracking closure under issue #4940.

## The meshing thesis
UDS already owns the **distribution substrate** (Zarf packages, UDS bundles)
and the **cluster substrate** (`uds-core`, Pepr admission). It does *not*
own a portable, in-bundle, hash-chained **attestation substrate** that
operates without a registry round-trip, and it does not own a runtime
**Λ-floor admission gate** for agent / model invocations.

SZL ships those two pieces today, in production, behind a public proof
ledger. Meshing them into UDS gives the field the missing primitive without
forcing UDS to absorb the doctrine machinery.

## The two fixes (detail in §05)
- **Fix A — Portable in-bundle attestation manifest.** Adds a hash-chained
  SHA-256 attestation block to `uds-cli bundle create` outputs, verifiable
  offline against a `uds-bundle.attestations.jsonl` sidecar without a
  registry round-trip. Built on SZL's a11oy-code proof ledger
  (`~/.a11oy-code/proof.jsonl`).
- **Fix B — Doctrine V6 Λ-floor Pepr admission module.** A Pepr module
  that enforces the 9-axis Λ-floor (0.90 conjunctive AND, moralGrounding
  ≥ 0.95, measurabilityHonesty ≥ 0.95) on any agent / model invocation
  inside a UDS cluster. Proof-of-work is SZL's existing OPA gateway test
  pack (`platform/agent-gateway/tests/gateway-opa-live.test.ts` + pinned
  OPA installer).

Both fixes ship as draft PRs against the right upstream repos within
≤ 14 days of Andrew's go-ahead.

## The meshing planes (detail in §04)
1. **Bundle** — A11oy / Sentra / Amaru as Zarf packages, top-level UDS
   bundle. `zarf.yaml` and `uds-bundle.yaml` skeletons under `./skeletons/`.
2. **Policy** — SZL OPA gateway test pack contributed as a Pepr /
   OPA-Gatekeeper module consumable by `uds-core`.
3. **Proof ledger** — `~/.a11oy-code/proof.jsonl` exposed as a SLSA-aligned
   attestation source UDS clusters can verify.
4. **Doctrine gate** — Λ-floor + 9-axis AND as a CI gate, mirroring
   Sentra's `MATURITY_GATE_BLOCKED` pattern.
5. **Recalibration memo** — `POST /api/helios/memos/generate` as a
   fleet-level "what-changed" feed for UDS operators.

## What I'd like back from Andrew
A 30-minute working session at Warhacker (brief in §06) to walk one bundle
through the proposed attestation manifest live, then a thumbs-up to open
the two PRs.

## Provenance
Every claim above is sourced from `packages/payload/raw/` (Doctrine V6
canonical payload) or from a public UDS / Defense Unicorns source listed in
§07. Nothing in this proposal is rounded, marketed, or aspirational.
