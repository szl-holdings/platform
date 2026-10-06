<!--
  platform README — investor-readable rewrite · 2026-06-30
  Honesty doctrine LOCKED. Sign-off: Stephen Lutar <stephenlutar2@gmail.com>
  Solo-builder provenance + Conventional Commits. No codenames in UI prose.
-->

<div align="center">

# platform
<!-- szl:header v1 -->
<!-- badges: add this repo's CI / release / status badges here -->
[![org: szl-holdings](https://img.shields.io/badge/org-szl--holdings-black)](https://github.com/szl-holdings)
[![doctrine](https://img.shields.io/badge/doctrine-control%20before%20action%20%C2%B7%20evidence%20after-blue)](https://a-11-oy.com)

**Control before action. Evidence after.**

Part of the [szl-holdings](https://github.com/szl-holdings) estate ·
Product: [a-11-oy.com](https://a-11-oy.com) ·
Proof: [a11oy.net](https://a11oy.net)
<!-- /szl:header -->

### The SZL governed-inference monorepo — building policy-gated, evidence-bearing AI paths.

[![CI](https://github.com/szl-holdings/platform/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/szl-holdings/platform/actions/workflows/ci.yml)
[![Tests](https://github.com/szl-holdings/platform/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/szl-holdings/platform/actions/workflows/tests.yml)
[![CodeQL](https://github.com/szl-holdings/platform/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/szl-holdings/platform/actions/workflows/codeql.yml)
[![SBOM](https://github.com/szl-holdings/platform/actions/workflows/sbom.yml/badge.svg?branch=main)](https://github.com/szl-holdings/platform/actions/workflows/sbom.yml)
[![SLSA L1](https://img.shields.io/badge/SLSA-L1%20honest-22c55e?style=flat-square)](https://slsa.dev/spec/v1.0/levels)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-0B1F3A.svg?style=flat-square)](./LICENSE)
[![Doctrine v11](https://img.shields.io/badge/Doctrine-v11_LOCKED-3b82f6?style=flat-square)](https://github.com/szl-holdings/.github/tree/main/doctrine)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.20434276.svg)](https://doi.org/10.5281/zenodo.20434276)

[Product endpoint](https://a-11-oy.com) · [Hugging Face Org](https://huggingface.co/SZLHOLDINGS) · [SZL Holdings](https://github.com/szl-holdings)

</div>

---

> **Current evidence boundary — 2026-10-06:** a bounded TLS-verified read of
> `a-11-oy.com` returned HTTP 503 with the Hugging Face Space error marker;
> `a11oy.net` returned its static proof-registry homepage. The current local
> hardening commits are not a deployment receipt. GitHub settings, live
> Hugging Face completeness, end-to-end signing, substrate adapters, and
> production operation remain unverified. See the
> [current prepublication audit](audit/SZL_ESTATE_PREPUBLISH_AUDIT_2026-10-05.md).

## What this is

This is the SZL Holdings platform monorepo — a TypeScript/pnpm workspace containing the **a11oy** Command Center, the governed-inference runtime, domain verticals, and all shared infrastructure.

The target governed path sends an AI action through policy, evidence binding,
trust scoring (Λ), approval, and a verifiable receipt. The repository contains
implemented and tested pieces of that path, deterministic demos, historical
receipts, and still-unconnected scaffolds. It does **not** establish that every
current route or deployment enforces the complete path. Some local fallback
envelopes are explicitly placeholders rather than cryptographic signatures.

**The seven-layer target contract:**

1. **Sense** — ingest live signals across connected domains
2. **Structure** — correlate signals into outcomes across people, revenue, infrastructure, security, and market data
3. **Correlate** — score baseline drift and build an outcome graph
4. **Explain** — route to AI reasoning with policy-governed model selection
5. **Recommend** — generate governed recommendations with confidence intervals and source citations
6. **Approve** — enforce human approval gates; no consequential action bypasses this layer
7. **Execute** — run durable workflows and seal a signed proof record

**Target invariant:** a consequential action must not reach layer 7 without its
required layer 6 approval. Enforcement must be proven per executable route and
exact deployed revision; it is not inferred from this architecture statement.

---

## The Command Center — a11oy

**[a-11-oy.com](https://a-11-oy.com)** is the intended product endpoint for
this monorepo. The latest bounded observation returned HTTP 503, so the list
below describes product design and repository surfaces, not current hosted
availability:

- Deny-by-default safety gates with five transparent classifiers (cyber, bio, reasoning extraction, prompt injection, self-harm)
- Trust scoring with confidence intervals (ceiling 0.97 — never 100% by doctrine)
- A decision-feed design with governed receipt records; complete live signing
  coverage remains unverified
- Governed agentic coding — plan-and-act with quorum approval before any write
- Sovereign deployment: runs on your own hardware, air-gapped if needed

---

## Honest posture

| Claim | Status |
|---|---|
| Signed DSSE receipts on every governed action | **UNVERIFIED END TO END** — tested receipt paths exist; placeholder signing and unobserved deployments remain |
| 8 formulas locked-proven in Lean 4 (lutar-lean) | **LOCKED · kernel c7c0ba17** |
| Λ trust aggregator — unconditional uniqueness | **Conjecture 1 · OPEN** — statement-only, machine-checked false as stated; conditional uniqueness = **Theorem U** (axiom-free, modulo ≈Λ under IA; strict only under Anchored/Normalized) |
| SLSA supply-chain | **L1 honest · L2 build-attested · L3 roadmap** |
| FedRAMP / ATO / CMMC | **ROADMAP — not claimed today** |
| OpenSSF Scorecard | [![](https://api.securityscorecards.dev/projects/github.com/szl-holdings/platform/badge)](https://securityscorecards.dev/viewer/?uri=github.com/szl-holdings/platform) |

---

## Quick start

```bash
corepack enable
pnpm install
pnpm run dev
```

See [`media/WALKTHROUGH.md`](./media/WALKTHROUGH.md) for the full monorepo orientation.

---

## Domain verticals

<!-- BEGIN: portfolio-table (generated by scripts/generate-readme-product-table.js) -->

| Product | Domain | Status |
|---------|--------|--------|
| **Sentra** | Cyber resilience command — exposure mapping, recovery readiness, incident command, control drift detection | Active |
| **Counsel** | Legal matter command — agentic matter management, obligation tracking, exposure quantification, court filing integration | Active |
| **Aegis** | Security and defense intelligence — SOC command, advanced security modules, SOAR playbooks, threat intelligence | Removed — source directory deleted (Task #1548). Domain backend active; security features consolidated into artifacts/sentra. |
| **Vessels** | Maritime fleet intelligence — AIS tracking, S&P workflow, demurrage, freight, voyage P&L | Active |
| **Terra** | Real estate intelligence — distress pipeline, ownership graph, deal workflow, AI analysis | Active |
| **Carlota Jo** | Premium advisory operations — UHNW client portal, service catalog, engagement management | Active |
| **Pulse** | AI executive briefing — narrative intelligence reports synthesized from live platform signals | Removed — source directory deleted; briefing capability consolidated into a11oy substrate. |
| **IMPERIUM** | Cloud sovereignty — multi-cloud governance, policy enforcement, cloud estate visibility | Archived (Task #920) |

<!-- END: portfolio-table -->

---

## Security

The repository configures CodeQL, Dependabot, secret scanning, SBOM generation,
and OpenSSF Scorecard workflows. Their presence in source does not prove that
every protected branch, promoted artifact, or current run is covered. Report
vulnerabilities via the [security policy](SECURITY.md).

---

<div align="center">
<sub>SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1 · SLSA L1 honest · L2 build-attested · L3 roadmap · No production ATO claimed · DOI <a href="https://doi.org/10.5281/zenodo.20434276">10.5281/zenodo.20434276</a></sub>
</div>
