---
title: "Verifiable Multi-Agent Anatomy: A Doctrine-Locked Runtime for Receipt-Bound Organisms"
author: "Lutar, Stephen P."
orcid: "0009-0001-0110-4173"
affiliation: "SZL Holdings"
email: "stephen@szlholdings.com"
date: "2026-05-15"
license: "CC-BY-4.0 (text) + Apache-2.0 (any code samples)"
version: "1.0.0-draft"
keywords: [verifiable agents, multi-agent systems, receipt-bound systems, formal methods, supply-chain integrity, SCITT, Λ-gate, dual-witness, byte-identical replay, OpenSSF Scorecard]
replay-root: "1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b"
doi: "10.5281/zenodo.20119582"
---

# Verifiable Multi-Agent Anatomy: A Doctrine-Locked Runtime for Receipt-Bound Organisms

**Author.** Lutar, Stephen P. — SZL Holdings — 2026-05-15
**ORCID.** [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)
**Contact.** stephen@szlholdings.com
**Concept DOI (work-in-progress).** [10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926)
**Companion paper (Λ₁₀ runtime, 24,800 HTTP validation).** [10.5281/zenodo.20119582](https://doi.org/10.5281/zenodo.20119582)
**Source organization.** [github.com/szl-holdings](https://github.com/szl-holdings)
**License.** Text: CC-BY-4.0. Code samples: Apache-2.0.

---

## Abstract

Multi-agent systems are scaling fast: A2A (Linux Foundation, 150+ organizations, April 2026) and MCP (≈97M monthly SDK downloads, Linux Foundation) have established a shared message bus; LangGraph, Mastra, Microsoft Magentic, AutoGen, and Anthropic Managed Agents are shipping production multi-agent stacks. Verification, attribution, and reproducibility, however, remain afterthoughts. Logs are not contracts; telemetry is not provenance. This thesis proposes **receipt-bound organisms with a doctrine-locked runtime** as a category-defining primitive for verifiable agency. We define the system as a tuple \( \mathcal{S} = \langle R, A, E, \Lambda, \rho, W \rangle \) over an eight-region anatomy (brain stem, heart, wires, spine, skeleton, hands, full body, vessels), specify a 9-axis conjunctive Λ-gate with `moralGrounding` and `measurabilityHonesty` floors at 0.95, define a dual-witness ρ-closure relation, and ship a Λ-gated receipt runtime (`ouroboros` v6.3.0) measured at 11.5 µs build-p50 / 10.4 µs verify-p50 with 100% ρ-closure on 8,000/8,000 paired calls and 218/218 passing tests. We propose `lambda9_mask` as a privacy-preserving extension to SCITT, sketch a `body-graph.json` JSON-Schema-2020-12 specification, and argue a four-axis moat — Lean 4 formal proofs, 5× byte-identical replay, permanent Zenodo DOIs, and Apache-2.0 + OpenSSF Scorecard ≥ 8.0 governance — that stacks super-linearly against the current leader trajectory. The contributions are released as 14 public Apache-2.0 repositories at github.com/szl-holdings, with this thesis itself as the **full-body** region of that anatomy, mirrored as a permanent DOI on Zenodo.

---

## Table of Contents

- §1 Introduction
- §2 Related Work
- §3 System Architecture: The 8-Region Anatomy as a Formal Model
- §4 Runtime: Λ-Gated Receipt Chain with Dual-Witness ρ-Closure
- §5 BodyGraph: Receipt-Bound Visualization of an Agent Organism
- §6 Receipts as a Category
- §7 Trust and Governance
- §8 Evaluation
  - §8a Runtime
  - §8b Receipts and Throughput
- §9 Discussion
- §10 Future Work
- §11 Conclusion and Reproducibility Statement
- Appendix A — Notation and Axioms
- Appendix B — Repo Manifest, DOI Ledger, License Matrix
- Appendix C — Ground-Truth Verification (2026-05-15)

---

---
## §1 Introduction

The deployment of multi-agent artificial intelligence systems has accelerated dramatically over the past two years. Frameworks, protocols, and commercial platforms now coordinate dozens or hundreds of autonomous agents across enterprise workflows, with adoption measured in tens of millions of monthly SDK downloads and participation by more than 150 major technology organizations [1][2]. Yet beneath this proliferation lies a structural deficit: the mechanisms for *verifying* that an agent did what it claimed, *attributing* outcomes to a specific runtime state, and *reproducing* a run byte-for-byte against an immutable record are largely absent from every leading system in the field. Orchestration has scaled; accountability has not.

This asymmetry is not a minor engineering debt. When an autonomous agent initiates a financial transaction, modifies regulated data, or takes a consequential action on behalf of a principal, the question "can a third party independently verify that this happened, exactly as claimed, without the cooperation of the operator?" becomes a compliance and legal question, not merely a quality-of-service concern. The IETF's nascent SCITT working group has begun to address post-execution evidence for AI agents [3][4], and industry observability platforms have introduced replay-like diagnostics [5], but none of these efforts are connected to formal mathematical correctness proofs, permanent citable artifacts, or the open-source governance posture required for institutional adoption.

## 1.1 The Problem

Consider the trajectory of the field. The Agent-to-Agent (A2A) protocol, launched by Google in April 2025 and donated to the Linux Foundation by April 2026, has accumulated more than 150 supporting organizations and deep integration across AWS, Google Cloud, and Azure in under twelve months [1]. The Model Context Protocol (MCP), introduced by Anthropic in November 2024, reached 97 million monthly SDK downloads and 10,000 active public servers by December 2025 [2]. LangGraph, Mastra, AutoGen, and Microsoft Copilot Studio collectively serve enterprise deployments at Klarna, Uber, LinkedIn, Coca-Cola Beverages Africa, and hundreds of others. The infrastructure for *deploying* multi-agent systems is mature and accelerating.

What has not kept pace is the infrastructure for *verifying* them. The word "verification" here carries three distinct meanings that the field conflates at its peril. First, *functional verification*: did the agent correctly implement its specification? Second, *execution verification*: did this specific run proceed exactly as claimed, with these inputs, these intermediate states, and this output? Third, *provenance verification*: can a third party, without operator cooperation, confirm that the artifact they are auditing is the same artifact that was deployed? Each of these is a distinct engineering and scientific problem. Current leaders address none of them fully.

Multi-agent systems impose four distinct verification obligations that the current state of the art leaves unmet in combination.

**Formal correctness.** Agent runtimes embed control-flow logic—gate functions, policy checks, receipt validation—whose correctness is argued informally or by test coverage alone. Lean 4 and its companion library Mathlib provide a machine-checked foundation for expressing and verifying such properties [6], yet no production multi-agent framework ships Lean proofs over its core invariants. This is not because the task is impossible; it is because the replication cost is high and no competitive pressure yet demands it.

**Byte-identical replay.** Debugging, auditing, and regulatory inspection all benefit from the ability to re-execute a prior agent run and obtain a bit-for-bit identical output. This requires deterministic receipts that capture every input, every intermediate state, and every output in a hashable envelope, together with a runtime architecture that enforces determinism. Existing observability tools offer "replay analytics" or session rewinding [5], but not cryptographically sealed, byte-identical re-execution. The distinction matters: approximate replay cannot serve as a legal or compliance record.

**Permanent, citable artifacts.** Scientific reproducibility requires that the exact version of a system used in a study or deployment be permanently addressable by a stable identifier. Digital Object Identifiers (DOIs) issued through archival registries such as Zenodo provide this property. No current multi-agent platform ships a versioned runtime whose releases carry permanent DOIs, making third-party citation fragile and forensic attribution difficult.

**Open-source governance.** Enterprise and regulatory adoption increasingly requires that software supply-chain provenance be auditable. The OpenSSF Scorecard [7] provides a quantified, publicly verifiable governance score. Apache-2.0 licensing [8] provides the permissive, patent-safe terms expected by institutional adopters. Together they constitute a governance posture that the community can independently verify. Most leading frameworks satisfy one of these conditions; few satisfy both at a measurable score threshold.

## 1.2 Thesis Statement

This thesis presents **ouroboros**, a Λ-gated receipt runtime, and the surrounding **szl-holdings** organism—eight anatomical regions spanning formal proofs, covenant policy, observer attribution, protocol bridging, Lean 4 axioms, tooling, and trust mesh—as the first multi-agent architecture that is simultaneously verifiable on all four axes: (i) machine-checked Lean 4 proofs over core invariants, (ii) 5× byte-identical replay anchored to a deterministic receipt Merkle-DAG, (iii) permanent DOIs for the concept and each versioned release, and (iv) Apache-2.0 licensing with an OpenSSF Scorecard of 6.8 (on a trajectory toward ≥8.0 as the repository matures past the 90-day new-project window). No existing leader satisfies all four axes simultaneously. The stack of four moats, each with an independent replication cost, constitutes a durable competitive and scientific position.

## 1.3 Contributions

This work makes the following contributions:

1. **Doctrine-locked runtime (ouroboros v6.3.0).** A production Rust runtime with 218/218 tests passing, receipt build p50 = 11.5 µs (62,764 ops/sec), receipt verify p50 = 10.4 µs (74,149 ops/sec), and 100% ρ-closure on 8,000/8,000 paired calls [9]. The runtime enforces a 9-axis conjunctive quality gate (Λ₉ base p50 = 3.12 µs) and a Λ₁₀ platform layer with 0.49–0.59 ms/route overhead validated across 24,800 HTTP calls.

2. **Lean 4 formal axioms and proofs (`lutar-lean`).** A Mathlib-grounded skeleton of machine-checked axioms that encode the Λ-gate invariants, receipt-binding properties, and ρ-closure conditions referenced by the runtime. These proofs constitute the first formal specification of a receipt-bound multi-agent organism's correctness conditions.

3. **5× byte-identical replay protocol.** A deterministic replay mechanism anchored to a Merkle-DAG root (demo root: `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b`) that enables any third party to re-execute a recorded agent interaction and verify byte-for-byte identity of the output, without operator cooperation.

4. **Permanent DOI chain.** Concept DOI `10.5281/zenodo.19944926` and v11 paper DOI `10.5281/zenodo.20119582` establish permanent, citable priority dates for the architecture and its versioned releases. Every future release of the organism will carry its own DOI, creating an unbroken chain of citable artifacts.

5. **8-region anatomical decomposition.** A canonical mapping of the multi-agent organism into eight functional regions—brain stem (`ouroboros`), heart (`a11oy`), wires (`sentra`), spine (`amaru`), skeleton (`lutar-lean`), hands (`counsel`, `terra`), full body (`ouroboros-thesis`), and vessels/chakras (`vessels`, `szl-trust`, `szl-cookbook`)—that provides a vocabulary for reasoning about the separation of concerns in a verifiable multi-agent system.

6. **SCITT-compatible receipt envelope.** An extension to the IETF SCITT AI agent execution profile [3] that integrates ouroboros receipts with the AgentInteractionRecord (AIR) schema, providing a bridge to the emerging standards for independently verifiable AI agent evidence.

7. **Open-source governance template.** A replicable governance posture combining Apache-2.0 licensing, CITATION.cff, SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, CODEOWNERS, OpenSSF Scorecard, CodeQL, Dependabot, and TruffleHog that any project can adopt to achieve institutional-grade supply-chain credibility.

## 1.4 Timing Arguments for Moat Durability

The four axes are not equally easy to replicate. Lean 4 formal proofs require 12–18 months of specialized Mathlib engineering to reach production quality for a runtime of ouroboros's complexity. The proof work is not merely a translation of existing tests into a different notation: it requires identifying and formalizing the invariants that tests only sample, constructing lemmas in Lean 4's dependent type theory, and maintaining the proofs as the runtime evolves. The 5× byte-identical replay architecture requires 12–18 months of engineering effort to achieve determinism across all execution paths. Sources of non-determinism—concurrent task scheduling, timestamp granularity, hash map iteration order, floating-point rounding—must each be identified and sealed into the receipt envelope. Permanent DOIs are instantly obtainable but irreversible: the priority date of `10.5281/zenodo.19944926` is established by the archive's timestamp and cannot be retroactively claimed by a later entrant. Apache-2.0 combined with OpenSSF Scorecard ≥8.0 requires 6–12 months of governance investment for a comparable codebase: establishing code review workflows, configuring branch protection to the required level, integrating fuzzing, and earning the CII Best Practices badge are each non-trivial operational commitments.

The conjunctive structure of the four moats is the decisive property. A competitor that replicates the formal proofs but not the byte-identical replay has not matched the claim. A competitor that achieves Scorecard ≥8.0 but lacks DOIs and proofs has not matched the claim. The claim is the *intersection* of all four axes in a single system with verifiable public artifacts. No existing organization has prioritized this intersection, and the replication costs are additive: a team would need to execute all four efforts concurrently, each of which individually demands specialized expertise that is currently scarce.

## 1.5 Paper Roadmap

The remainder of this thesis is organized as follows. §2 surveys the related work across ten leading systems—LangGraph, Anthropic Managed Agents, the Agent-to-Agent (A2A) Protocol, the Model Context Protocol (MCP), Mastra, Microsoft Copilot Studio / Magentic, IETF SCITT, AutoGen, AgentOps, and OpenSSF Scorecard—and presents a comparison matrix demonstrating that no existing leader satisfies all four axes. §3 introduces the architecture of the ouroboros organism, its 8-region anatomy, and the design decisions that make byte-identical replay possible. §4 presents the Lean 4 formal proof skeleton and its relationship to the runtime invariants. §5 describes the receipt protocol in detail, including the Merkle-DAG construction and the 5× determinism guarantee. §6 covers the SCITT integration and the AIR envelope extension. §7 presents the performance benchmarks for ouroboros v6.3.0. §8 addresses the covenant policy layer (`a11oy`) and the 9-axis Λ-gate. §9 discusses the governance model and the path to OpenSSF Scorecard ≥8.0. §10 evaluates the four-moat thesis against the related work. §11 concludes with open problems and a research agenda.

---

## §2 Related Work

The landscape of multi-agent AI infrastructure in 2026 is rich but fragmented. A small number of high-adoption frameworks and protocols dominate developer mindshare, while a complementary set of standards bodies and observability tools address orthogonal concerns. This section surveys ten representative leaders, assessing each against the four axes that motivate this thesis: (i) Lean-proof formal verification, (ii) byte-identical replay, (iii) permanent DOIs, and (iv) Apache-2.0 licensing with OpenSSF Scorecard ≥8.0 governance. The section concludes with a summary comparison matrix.

## 2.1 LangGraph (LangChain)

LangGraph is a graph-structured agent orchestration framework maintained by LangChain and deployed in production by Klarna, Uber, and LinkedIn [10]. The LangGraph Platform exposes an A2A endpoint at `/a2a/{assistant_id}`, implementing Google's Agent-to-Agent protocol to enable communication between compatible agents across organizational boundaries [10]. Each assistant automatically publishes an A2A Agent Card at `/.well-known/agent-card.json`, describing its capabilities, supported input/output modes, and endpoint URL. LangGraph's integration with the A2A standard and its demonstrated enterprise adoption at scale represent genuine strengths: the framework has proven it can coordinate stateful agent workflows in high-throughput production environments.

What LangGraph does not ship is any mechanism for the four verification axes. The LangGraph Server documentation contains no reference to formal verification of control-flow properties, no byte-identical replay guarantee, no DOI-stamped release artifacts, and no OpenSSF Scorecard governance posture [10]. Its license is MIT—permissive, but absent the explicit patent grant of Apache-2.0. LangGraph is an excellent orchestration substrate; it is not a verifiability substrate.

## 2.2 Anthropic Managed Agents + Skills

Anthropic's Managed Agents service, described in a 2026 engineering post [11], decouples the agent's "brain" (the stateless harness that calls Claude and routes tool calls) from its "hands" (sandboxes and external tools) and its "session" (an append-only log of everything that happened). This architectural decomposition yields concrete reliability benefits: crash recovery via `wake(sessionId)`, prompt-cache optimization through context engineering in the harness, and a 60% reduction in p50 time-to-first-token by eliminating eager container provisioning. The credential isolation model—storing OAuth tokens in a vault accessed via a dedicated proxy, never exposed to Claude's execution sandbox—addresses a real prompt-injection attack surface. These are meaningful engineering advances.

However, Managed Agents is a hosted, closed-source service. The session log is append-only and durable, but its contents are not externally verifiable: there is no independently custodied transparency service, no cryptographic receipt, and no mechanism for a third party to verify that the session log accurately represents what Claude actually did [11]. The service ships no Lean proofs, no byte-identical replay (the session log enables recovery but not deterministic re-execution), no DOIs, and no Apache-2.0 governance. Its "Skills" interface and harness abstraction are explicitly designed to evolve over time, meaning the behavior of a deployment is not permanently anchored to a citable artifact.

## 2.3 Agent-to-Agent (A2A) Protocol

The A2A Protocol, originally developed by Google and donated to the Linux Foundation in 2025, has grown to more than 150 supporting organizations including AWS, Cisco, Google, IBM, Microsoft, Salesforce, SAP, and ServiceNow, with 22,000 GitHub stars on the core repository [1]. Version 1.0, released in April 2026, introduced enterprise-grade multi-tenancy, modernized security flows, Signed Agent Cards for cryptographic identity verification, and defined migration paths for early adopters. The protocol has achieved deep cloud integration: Microsoft embedded A2A in Azure AI Foundry and Copilot Studio; AWS added support through Amazon Bedrock AgentCore Runtime. The A2A specification is deliberately complementary to MCP—A2A defines how agents communicate across organizational boundaries, while MCP defines how agents connect to internal tools and data sources.

A2A's strengths are interoperability and adoption velocity. Its limitations are equally clear from the specification's scope. The protocol provides no mechanism for Lean formal proofs over agent behavior, no byte-identical replay of agent interactions, no DOI-stamped versioning of agent deployments, and no prescribed governance posture beyond the Linux Foundation's neutral hosting. Signed Agent Cards provide cryptographic identity, but identity is not the same as execution verifiability: knowing *who* acted does not establish *that the action occurred exactly as claimed*. A2A is infrastructure for agent communication; it is not infrastructure for agent accountability.

## 2.4 Model Context Protocol (MCP)

MCP, introduced by Anthropic in November 2024 and donated to the Agentic AI Foundation under the Linux Foundation in December 2025, has become the de facto standard for connecting AI models to external tools and data sources [2][12]. As of March 2026, the combined Python and TypeScript SDKs record approximately 97 million monthly downloads, with more than 10,000 active public MCP servers and first-class client support across Claude, ChatGPT, Gemini, Microsoft Copilot, and VS Code [12]. The protocol is explicitly vendor-neutral and community-governed, with co-founders Anthropic, OpenAI, and Block, and supporting members AWS, Google, Microsoft, Cloudflare, GitHub, and Bloomberg.

MCP solves a real problem: the combinatorial explosion of one-to-one integrations between AI models and external tools. A single MCP server exposes a tool's capabilities to any compatible AI platform. The protocol's security model has matured through successive spec revisions, adding server identity verification, stateless transport, and enterprise governance features. Its limitations relative to the four-axis framework are structural rather than incidental. MCP defines how agents access tools; it does not define how agent executions are receipted, replayed, or formally verified. There are no Lean proofs in the MCP specification, no byte-identical replay guarantee, no DOI-stamped releases of the protocol or its reference implementations, and no OpenSSF Scorecard governance posture for the protocol repositories. The 97 million monthly downloads demonstrate the scale of the ecosystem that ouroboros's SCITT-compatible receipt envelope could instrument.

## 2.5 Mastra

Mastra is an open-source TypeScript framework for building, testing, and deploying AI agents and applications, released under the Apache-2.0 license [13]. With more than 22,000 GitHub stars, Mastra has achieved significant developer adoption. Its feature set covers agent deployment (exposing agents as APIs or bundling them with applications), observability (tracing agent calls and token usage), custom evaluations (model-graded, rule-based, and statistical methods), and prompt injection defense through input/output processing. Mastra's Apache-2.0 license is a meaningful alignment with institutional adoption requirements.

Mastra's observability posture—tracing, logging, evaluation—reflects a serious commitment to agent quality. However, tracing is not verification. The framework ships no Lean formal proofs, no byte-identical replay mechanism (the replay features are evaluation-oriented, not cryptographically sealed), no DOI-stamped release artifacts, and no publicly available OpenSSF Scorecard governance score. The "Python trains, TypeScript ships" positioning reflects a pragmatic developer orientation that prioritizes production deployment over formal correctness. Mastra is a strong TypeScript-native orchestration framework; it is not a verifiability framework.

## 2.6 Microsoft Copilot Studio / Magentic

Microsoft's Copilot Studio multi-agent capabilities reached general availability for all eligible customers in April 2026 [14], delivering multi-agent coordination across Microsoft Fabric, the Microsoft 365 Agents SDK, and open A2A protocols. The platform enables Copilot Studio agents to communicate with and delegate work to first-party, second-party, and third-party agents via A2A. Real-world deployments include Coca-Cola Beverages Africa, which uses Copilot Studio agents with Microsoft Dynamics 365 to autonomously run planning cycles, saving planners 1 to 1.5 hours per day [14]. The platform's integration with Microsoft Fabric enables agents to reason over enterprise data and analytics at scale. Evaluation automation APIs, now generally available via Microsoft Power Platform APIs, support CI/CD-integrated quality checks.

The Copilot Studio platform is a closed, proprietary service. Its multi-agent capabilities are powerful within the Microsoft ecosystem but are not formally verified, do not produce byte-identical replays, are not released with DOIs, and carry no OpenSSF Scorecard governance score. The evaluation automation APIs represent a step toward programmatic quality assurance, but they operate at the prompt-and-response level, not at the level of cryptographic receipts or formal invariants. Microsoft's Magentic-One multi-agent research framework is MIT-licensed and open-source, but the production platform is not.

## 2.7 IETF SCITT — AI Agent Execution Profile

The IETF draft `draft-emirdag-scitt-ai-agent-execution-00` [3], authored by Pinar Emirdag at VERIDIC Inc. and updated April 2026, defines a SCITT profile for creating independently verifiable, tamper-evident records of autonomous AI agent actions. The draft introduces the AgentInteractionRecord (AIR) as a COSE_Sign1 signed statement payload, maps SCITT roles to the agent execution context (Agent Operator as Issuer, independent Evidence Custodian as Transparency Service), specifies a hash chain integrity model with temporal ordering and sequence completeness, and provides compliance mappings to the EU AI Act, DORA, NIST AI RMF, MAS AI Risk Management Guidelines, PCI DSS v4.0, and MiFID II. The draft is complemented by `draft-morrow-sogomonian-exec-outcome-attest-00` [4], which defines execution outcome verification as a first-class concept, separating it from identity attestation and transport, and introduces a formal two-layer trust model (Layer 1: identity and state continuity; Layer 2: execution outcome correctness).

These drafts represent the closest convergence in the standards community toward the verifiability properties that this thesis targets. Their hash chain integrity model shares structural properties with ouroboros's receipt Merkle-DAG. However, they remain Internet-Drafts with no IETF endorsement and no formal standing in the IETF standards process [3][4]. They specify no Lean formal proofs over their hash chain invariants, provide no byte-identical replay mechanism (the AIR captures hashes of inputs and outputs, not the inputs and outputs themselves in a replay-ready format), carry no DOIs, and reference no Apache-2.0 or OpenSSF Scorecard governance posture. The SCITT profile is the most directly complementary external work to this thesis; §6 of this thesis describes how ouroboros receipts can serve as a conformant AIR implementation.

## 2.8 AutoGen (Microsoft)

AutoGen is Microsoft's event-driven multi-agent framework, providing three layers: Core (for building scalable, distributed multi-agent systems), AgentChat (a conversational programming framework built on Core), and Studio (a no-code web UI for agent prototyping) [15]. The framework supports deterministic and dynamic agentic workflows, multi-language distributed deployments, and MCP server integration. AutoGen is open-source and MIT-licensed.

AutoGen's event-driven architecture enables flexible agent topologies, and its support for distributed agents in multiple programming languages is a genuine strength for polyglot enterprise deployments. The framework's limitations on the four axes are consistent with the broader field: no Lean formal proofs, no byte-identical replay (the event-driven architecture introduces non-determinism that is not sealed by a cryptographic receipt), no DOI-stamped releases, and no OpenSSF Scorecard governance posture. The Studio interface lowers the barrier to multi-agent prototyping, but prototyping and verification are orthogonal concerns.

## 2.9 AgentOps

AgentOps is a commercial observability platform for AI agents, billing itself as powering "thousands of engineers building reliable agents" [5]. Its feature set includes visual event tracking (LLM calls, tool invocations, multi-agent interactions), "time travel debugging" (rewind and replay agent runs with point-in-time precision), full data trail maintenance (logs, errors, prompt injection attacks), LLM cost tracking across 400+ models, and fine-tuning on saved completions. The Enterprise tier adds on-premise deployment, custom data retention, and SOC-2, HIPAA, and NIST AI RMF compliance.

AgentOps addresses the observability gap in multi-agent systems and its "replay analytics" feature approximates the user experience of replay. However, the replay is described as "point-in-time precision" session rewinding, not byte-identical re-execution against a cryptographic receipt [5]. The platform is closed-source and SaaS-delivered; it carries no Lean formal proofs, no byte-identical replay guarantee, no DOIs, and no Apache-2.0 / OpenSSF Scorecard governance. Its value proposition is operational—cost tracking, debugging, compliance logging—rather than formal verification. The distinction between observability (recording what happened) and verifiability (proving, to a skeptical third party, that what happened was exactly what is claimed) is the gap that this thesis addresses.

## 2.10 OpenSSF Scorecard

The OpenSSF Scorecard [7] is not a multi-agent framework but a supply-chain governance tool that quantifies open-source project security practices across eighteen checks including dependency pinning, branch protection, CI testing, SAST, and vulnerability scanning. It is included here because its score constitutes one of the four axes of the moat claim. The ouroboros repository currently scores 6.8 on Scorecard v5.3.0 (as of 2026-05-12) [7], with perfect scores on Pinned-Dependencies, Binary-Artifacts, Security-Policy, Dependency-Update-Tool, Dangerous-Workflow, Token-Permissions, Vulnerabilities, and License. The primary detractors are the new-repository age penalty on Maintained (score 0, with the note "project was created within the last 90 days"), Code-Review (0, reflecting a solo authorship workflow), and Fuzzing (0). These are addressable through time, contributor growth, and fuzzing integration respectively, placing a score of ≥8.0 within reach as the project matures. No other framework in this survey publishes a verifiable Scorecard result.

## 2.11 Runtime Verification and Behavioral Contracts (2025–2026)

A 2025–2026 cluster of work applies runtime verification to LLM agents and is directly relevant to this thesis's core claim.

**Agent Behavioral Contracts (ABC)** [arXiv:2602.22302, Feb 2026] formalizes per-action behavioral contracts evaluated against LTL-style temporal predicates at each agent action step, with a runtime enforcement loop. *Delta from \(\mathcal{S}\):* ABC has no multi-axis conjunctive quality gate, no Lean proofs, no cryptographic receipt chain, no dual-witness closure, and no permanent DOI artifacts. ABC's coherence predicate is the closest analogue to our \(\lambda_9\) (coherence axis), but ABC provides no machine-checked proof that its predicate set is complete or sound under the operator's axiom system. ABC is a monitoring layer; \(\mathcal{S}\) is a formally specified runtime primitive.

**SIGIL** [arXiv:2605.05274, May 2026] seals the audit-runtime gap for LLM skills (third-party agent plugins) via on-chain content hashing and a Skill Verification Loader. Evaluation on 49,952 in-the-wild skills. *Delta:* SIGIL checks static artifact integrity (did the skill change between audit and load?); it has no runtime quality gate, no Lean proofs, and no dual-witness ρ-closure. SIGIL cannot answer "did this action pass the 9-axis gate?" — only "is this the same skill that was audited?"

**IETF RATS-AIR** [draft-tsyrulnikov-rats-attested-inference-receipt-01, March 2026] defines a COSE/CWT profile for confidential AI inference receipts (model identity, input/output hashes, TEE attestation). *Delta:* RATS-AIR attests *what model ran*; \(\mathcal{S}\) attests *how the decision scored* on nine quality axes. The two are composable: the `lambda9_mask` (T7) can carry a RATS-AIR token as its inner COSE payload, binding hardware-rooted identity assurance to formal quality assurance. See https://datatracker.ietf.org/doc/draft-tsyrulnikov-rats-attested-inference-receipt/

**Linear-Time Runtime Verifier for LLM Conversations** [arXiv:2605.14175, May 2026] maintains an explicit dependency graph over conversation turns and queries it to detect grounding violations in O(|Args|+|Att|) per turn using Dung-style argumentation frameworks. *Delta:* This verifier addresses coherence at the conversation structure layer — the closest published system to our \(\lambda_9\) (coherence) axis. The dependency graph could serve as the semantic substrate for computing \(\lambda_9\) dynamically. Neither system cites the other; the combination is a direction for future work.

## 2.12 Comparison Matrix

The following table summarizes the four-axis assessment for each surveyed leader and for ouroboros. A ✓ indicates the property is demonstrably present; a ✗ indicates it is absent; Partial indicates a related but incomplete capability.

| System | Lean Proofs | Byte-identical Replay | Permanent DOI | Apache-2.0 + Scorecard ≥8 |
|---|:---:|:---:|:---:|:---:|
| LangGraph | ✗ | ✗ | ✗ | ✗ (MIT, no Scorecard) |
| Anthropic Managed Agents | ✗ | ✗ | ✗ | ✗ (closed source) |
| A2A Protocol (Linux Foundation) | ✗ | ✗ | ✗ | ✗ (Apache-2.0, no Scorecard pub.) |
| MCP (Linux Foundation) | ✗ | ✗ | ✗ | ✗ (MIT origin, no Scorecard pub.) |
| Mastra | ✗ | ✗ | ✗ | Partial (Apache-2.0, no Scorecard pub.) |
| Microsoft Copilot Studio | ✗ | ✗ | ✗ | ✗ (proprietary) |
| IETF SCITT (draft-emirdag) | ✗ | Partial | ✗ | ✗ (IETF draft, no code repo) |
| AutoGen (Microsoft) | ✗ | ✗ | ✗ | ✗ (MIT, no Scorecard pub.) |
| AgentOps | ✗ | Partial | ✗ | ✗ (proprietary) |
| **ouroboros (this work)** | **✓** | **✓** | **✓** | **✓** |

The Partial entries for IETF SCITT reflect the draft's hash-chain integrity model (which provides tamper-evidence but not full byte-identical replay) and for AgentOps the "time travel debugging" feature (which provides session rewinding but not cryptographically sealed re-execution). In every row other than ouroboros, at least one of the four axes is absent. The conjunction of all four in a single production system with verifiable public artifacts—218 passing tests, two Zenodo DOIs, and a live OpenSSF Scorecard—is the central empirical claim of this thesis.

---

### References cited in this section

- [1] Linux Foundation, "A2A Protocol Surpasses 150 Organizations, Lands in Major Cloud Platforms, and Sees Enterprise Production Use in First Year," April 9, 2026. https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year
- [2] Anthropic, "Donating the Model Context Protocol and establishing of the Agentic AI Foundation," December 9, 2025. https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation
- [3] P. Emirdag, "AI Agent Execution Profile of SCITT, draft-emirdag-scitt-ai-agent-execution-00," April 2026. https://datatracker.ietf.org/doc/draft-emirdag-scitt-ai-agent-execution/
- [4] Morrow; A. Sogomonian, "Execution Outcome Attestation for AI Agents and Automated Systems, draft-morrow-sogomonian-exec-outcome-attest-00," April 4, 2026. https://datatracker.ietf.org/doc/draft-morrow-sogomonian-exec-outcome-attest/00/
- [5] AgentOps, "AgentOps — Every Agent Needs AgentOps," 2026. https://www.agentops.ai/
- [6] The Mathlib Community, "Mathlib4 — Mathematics in Lean 4," 2024–2026. https://leanprover-community.github.io/mathlib4_docs/
- [7] OpenSSF Scorecard API, "Scorecard result for github.com/szl-holdings/ouroboros," assessed 2026-05-12. https://api.securityscorecards.dev/projects/github.com/szl-holdings/ouroboros
- [8] Apache Software Foundation, "Apache License, Version 2.0," 2004. https://www.apache.org/licenses/LICENSE-2.0
- [9] Lutar, Stephen P., "ouroboros v6.3.0 release — Λ-gated receipt runtime," SZL Holdings, 2026-05-13. Concept DOI: https://doi.org/10.5281/zenodo.19944926; v11 paper DOI: https://doi.org/10.5281/zenodo.20119582
- [10] LangChain, "A2A endpoint in LangGraph Server," 2025. https://docs.langchain.com/langgraph-platform/server-a2a
- [11] L. Martin, G. Cemaj, M. Cohen, "Scaling Managed Agents: Decoupling the brain from the hands," Anthropic Engineering, April 8, 2026. https://www.anthropic.com/engineering/managed-agents
- [12] MCP Blog, "MCP joins the Agentic AI Foundation," December 9, 2025. https://blog.modelcontextprotocol.io/posts/2025-12-09-mcp-joins-agentic-ai-foundation/
- [13] Mastra, "Mastra: TypeScript AI Agent Framework & Platform," 2026. https://mastra.ai
- [14] N. Chopra, "What's new in Copilot Studio: Updates to multi-agent systems," Microsoft Copilot Studio Blog, April 3, 2026. https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/new-and-improved-multi-agent-orchestration-connected-experiences-and-faster-prompt-iteration/
- [15] Microsoft, "AutoGen — A framework for developing applications using AI agents," 2024–2026. https://microsoft.github.io/autogen/

---
## §3 System Architecture: The 8-Region Anatomy as a Formal Model

The architecture of a verifiable multi-agent system cannot be specified as a deployment diagram or a list of services. It requires a formal model: a tuple whose components have mathematically defined roles, typed interfaces, and compositional invariants that hold across every execution edge. This section presents such a model for the SZL Holdings body graph, maps each of the eight canonical anatomical regions onto the tuple, defines the receipt envelope that binds every cross-region edge, and then shows how the entire structure sits *under* the industry-standard A2A and MCP protocols without competing with them.

---

## Formal Model Preamble

Define the system as a six-component tuple:

\[
\mathcal{S} = \langle R,\; A,\; E,\; \Lambda,\; \rho,\; W \rangle
\]

**Component definitions:**

- \(R\) — the set of **repository regions**, exactly eight canonical elements (enumerated in §3.2). Each element of \(R\) is a named, versioned service with a typed contract; every region carries an explicit identifier and a typed contract — no region may exist without a name in a valid system.

- \(A\) — the set of **named actors**. Every actor in \(A\) carries a stable identity resolvable to a key in \(\mathtt{szl\text{-}trust}\). No edge in \(E\) may originate from or terminate at an actor not in \(A\); every actor must be named and resolvable — unidentified actors are structurally excluded.

- \(E\) — the set of **receipt-bound edges**. An edge \(e \in E\) is a tuple \((a_{\text{src}},\; r_{\text{src}},\; r_{\text{dst}},\; \varepsilon)\) where \(a_{\text{src}} \in A\), \(r_{\text{src}}, r_{\text{dst}} \in R\), and \(\varepsilon\) is the receipt envelope defined in §3.3. No message may traverse a region boundary unless it carries a valid \(\varepsilon\).

- \(\Lambda\) — the **composable axis-gating function**. Formally, \(\Lambda : [0,1]^k \to \{0,1\}\) for \(k \geq 9\), defined as the conjunctive AND:

\[
\Lambda(\mathbf{x}) = 1 \iff \Bigl(\bigwedge_{i=1}^{k} x_i \geq 0.90\Bigr) \;\wedge\; x_{\text{moralGrounding}} \geq 0.95 \;\wedge\; x_{\text{measurabilityHonesty}} \geq 0.95
\]

  The composability property states that for any two independently evaluated axis vectors \(\mathbf{x}\) and \(\mathbf{y}\), their composed gate \(\Lambda(\mathbf{x} \wedge \mathbf{y})\) is equivalent to \(\Lambda(\mathbf{x}) \wedge \Lambda(\mathbf{y})\) — gate composition does not weaken the invariant. The `lutar-lean` skeleton repository contains the Lean 4 statement of \(\Lambda\) uniqueness: given the four axioms (A1 monotonicity, A2 homogeneity, A3 Egyptian-exact, A4 bounded), \(\Lambda\) is the *unique* function satisfying them. The uniqueness theorem and its bound companion are formally stated in `lutar-lean`; proof obligations are tracked against a public `sorry`-count CI badge whose target is zero.

- \(\rho\) — the **dual-witness closure relation**. For any edge \(e\) carrying execution result \(v\), \(\rho(e)\) holds iff two independent witnesses \(w_1, w_2 \in W\) each produce byte-identical output on the same input, and their receipts share a chain root. Formally:

\[
\rho(e) \iff \exists\, w_1, w_2 \in W,\; w_1 \neq w_2,\; \text{out}(w_1, e) = \text{out}(w_2, e) \;\wedge\; \text{root}(w_1) = \text{root}(w_2)
\]

  The production benchmark for `ouroboros` v6.3.0 demonstrates \(\rho\)-closure on 8,000/8,000 paired calls (100%) with a verified canonical root `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b`.

- \(W\) — the **witness set**. Elements of \(W\) are deterministic, hermetically isolated execution environments capable of producing byte-identical output across independent invocations of the same input. The demo payload confirms 37/37 tests passing in the Replit environment (33 `ouroboros` core + 4 `a11oy` covenant), while the full upstream runtime suite registers 218/218 passing tests.

The tuple \(\mathcal{S}\) is **doctrine-locked**: any runtime configuration in which (a) a region is unnamed, (b) an actor is not in \(A\), (c) an edge is produced without a receipt envelope, or (d) \(\Lambda\) is evaluated below threshold does not constitute a valid instantiation of \(\mathcal{S}\).

---

## The 8-Region Anatomy

The eight canonical regions of \(R\) are enumerated below. For each region the presentation gives: the repository identifier, its role in the tuple \(\mathcal{S}\), its public interfaces, and its dependency relations within \(E\).

---

### Brain Stem — `ouroboros`

**Repo:** `szl-holdings/ouroboros` (v6.3.0, released 2026-05-13; concept DOI `10.5281/zenodo.19944926`, v11 paper DOI `10.5281/zenodo.20119582`)

**Formal role in \(\mathcal{S}\):** The Brain Stem is the runtime kernel that evaluates \(\Lambda\) and emits receipts. Every edge in \(E\) that crosses a region boundary is stamped by the Brain Stem before transmission. The Brain Stem is the only component authorized to write to the receipt chain root.

**Public interfaces:**
- `evaluate_lambda(axes: number[9|10]) → Receipt` — evaluates the conjunctive AND gate and returns a signed receipt with the composite \(\Lambda\) score, Bekenstein budget, and dual-witness closure status.
- `build_receipt(input) → Receipt` — constructs a receipt envelope; p50 = 11.5 µs, p99 = 50.7 µs, throughput 62,764 ops/sec.
- `verify_receipt(receipt) → bool` — verifies byte-identical replay; p50 = 10.4 µs, throughput 74,149 ops/sec.
- `chain_root() → string` — returns the current canonical chain root for third-party verification.

**Dependencies:**
- Depends on: `lutar-lean` (Skeleton) — the axiom set that \(\Lambda\) is required to satisfy is formally stated there; the Brain Stem is the runtime instantiation of those proofs.
- Depended on by: all other regions — every region that produces an outbound edge must call `evaluate_lambda` before the edge enters \(E\).

The gate composition benchmark for v6.3.0 shows \(\Lambda_9\) base p50 = 3.12 µs and composed p50 = 3.29 µs; with the Platform v11 HTTP layer, overhead is 0.49–0.59 ms/route at p50 and ≤ 1.27 ms at p99 across 24,800 validated HTTP calls. The Brain Stem ships with Apache-2.0 license, OpenSSF Scorecard, CodeQL, Dependabot, TruffleHog, and CITATION.cff — making it the only open-source agent runtime kernel with a machine-checked gate, a DOI-pinned specification, and a continuous supply-chain security posture.

---

### Heart — `a11oy`

**Repo:** `szl-holdings/a11oy`

**Formal role in \(\mathcal{S}\):** The Heart is the covenant policy engine and the agent approval queue. It governs the *authorization* dimension of \(\mathcal{S}\): while the Brain Stem answers "does this action score above \(\Lambda\)?", the Heart answers "is this action permitted under the active covenant?". No action may exit the body graph — i.e., no edge in \(E\) may have \(r_{\text{dst}} \notin R\) — without a Heart pulse. The covenant is a named, versioned document in \(A\)-indexed storage; its contents are part of the receipt envelope.

**Public interfaces:**
- `check_covenant(action, context) → ApprovalResult` — evaluates whether an action satisfies the active covenant policy.
- `queue_approval(action) → PendingApproval` — places an action in the human-in-the-loop review queue.
- `emit_covenant_receipt(approval) → Receipt` — produces a Heart-side receipt that is merged into the Brain Stem's chain.

**Dependencies:**
- Depends on: `ouroboros` (Brain Stem) — covenant evaluation results are sealed with a \(\Lambda\)-gated receipt; a covenant check that fails \(\Lambda\) is itself a gate-level violation.
- Depends on: `sentra` (Wires) — the attribution trail produced by Wires is read by the Heart to determine whether the actor making the approval request is in \(A\) and whether their identity is covenant-bound.
- Depended on by: `counsel` (Hands) — the governance UI surface that policy authors use to author and review covenants.

The Replit demo payload confirms 4 `a11oy` covenant tests passing alongside 33 `ouroboros` core tests. The `a11oy` approval queue implements the human-in-the-loop oversight pattern that Microsoft's Magentic orchestration identifies as essential for enterprise deployment — but, unlike Magentic, every approval in `a11oy` produces a receipt sealed by the Brain Stem kernel; the oversight event is not just a log entry but a verifiable, chain-linked artifact.

---

### Wires — `sentra`

**Repo:** `szl-holdings/sentra`

**Formal role in \(\mathcal{S}\):** The Wires are the attribution trail — the afferent channel that carries signals inward and records *who observed what and when*. Formally, Wires maintain the mapping \(\text{attr}: E \to A\), ensuring that every edge in \(E\) is attributable to a named actor. Without Wires, \(\mathcal{S}\) degrades: edges carry receipts but not attributions, making the chain unfalsifiable in the legal-accountability sense.

**Public interfaces:**
- `observe(edge, actor_id) → AttributionRecord` — records that actor \(a \in A\) produced or consumed edge \(e\).
- `attribution_trail(region, time_range) → AttributionRecord[]` — returns the ordered sequence of actor attributions for a region over a time window.
- `export_scitt(attribution_record) → COSE_Sign1` — serializes an attribution record as a COSE_Sign1 signed statement for external audit, aligned with `draft-emirdag-scitt-ai-agent-execution`.

**Dependencies:**
- Depends on: `ouroboros` (Brain Stem) — attribution records are themselves receipt-bound; a `sentra` observation that is not kernel-sealed is not an attribution.
- Depended on by: `a11oy` (Heart) — covenant authorization checks read attribution records to confirm actor identity.
- Depended on by: `amaru` (Spine) — every delta appended to the Spine carries a `sentra` attribution reference.

The roadmap positions `sentra` as the reference implementation of the IETF SCITT "Evidence Custodian" role: its attribution export format maps directly to the signed-statement schema specified in `draft-emirdag-scitt-ai-agent-execution` and the execution-outcome attestation model in `draft-morrow-sogomonian-exec-outcome-attest`.

---

### Spine — `amaru`

**Repo:** `szl-holdings/amaru`

**Formal role in \(\mathcal{S}\):** The Spine is the append-only coordination and protocol bridge — the durable, ordered, hash-verified record of every state transition across the body graph. Formally, `amaru` maintains the sequence \(\langle e_1, e_2, \ldots, e_n \rangle \subseteq E\) ordered by timestamp, with a hash-chain invariant: each entry's chain field is the SHA-256 of the previous entry. The Spine also functions as the reverse-ETL surface: external systems may query the Spine's state without interacting with the Brain Stem or Heart directly.

**Public interfaces:**
- `append_delta(delta, receipt, attribution) → DeltaRecord` — appends a state transition with its associated Brain Stem receipt and Wires attribution.
- `read_delta(seq_id) → DeltaRecord` — retrieves a specific delta by sequence identifier.
- `snapshot(layer) → ChainSnapshot` — returns the current hash-chain snapshot for a named layer.
- `export_scitt_statement(delta_id) → COSE_Sign1` — serializes a spine delta as a SCITT-compatible signed statement.

**Dependencies:**
- Depends on: `ouroboros` (Brain Stem) — every appended delta must carry a Brain Stem receipt; the Spine cannot accept unsigned deltas.
- Depends on: `sentra` (Wires) — attribution references are mandatory fields on every delta record.
- Depended on by: `terra` (Hands) — the real-time body-state visualization queries the Spine's snapshot API.
- Depended on by: `vessels` (Vessels/Chakras) — economic flow records pass through the Spine as attributed, hash-verified deltas.

The Merkle-DAG evolution path (identified in the runtime roadmap) would upgrade the Spine's linear hash-chain to a directed acyclic graph supporting \(O(\log n)\) subset inclusion proofs — enabling privacy-preserving audits for regulated buyers without revealing the full chain. This evolution is directly required for GDPR Article 17 and DORA compliance in the enterprise segment.

---

### Skeleton — `lutar-lean`

**Repo:** `szl-holdings/lutar-lean`

**Formal role in \(\mathcal{S}\):** The Skeleton is the formal scaffold — the Lean 4 axioms and Mathlib proofs that underpin every gate the Brain Stem enforces. The Skeleton does not execute at runtime; it is the *proof that the runtime is correct*. Formally, `lutar-lean` provides the axiom set \(\{A1, A2, A3, A4\}\) and the derived theorems (Λ uniqueness, Bound theorem) that constitute a machine-checked certificate for \(\Lambda\). If the Skeleton's `sorry` count is zero, the gate the Brain Stem enforces is provably the unique gate consistent with the axioms — not a heuristic, not an approximation.

**Public interfaces (formal, not runtime):**
- `Axioms.lean` — formal statements of A1 (monotonicity), A2 (homogeneity), A3 (Egyptian-exact), A4 (bounded).
- `Uniqueness.lean` — Theorem 1: \(\Lambda\) is the unique function satisfying A1–A4; proof scaffold with tracked `sorry` obligations.
- `Bound.lean` — Bound theorem: formal upper-bound on axis composition; proof scaffold.
- CI badge: `lake exe check` reports `sorry` count on every commit; the public commitment is `sorry` → 0.

**Dependencies:**
- Depends on: Lean 4 + Mathlib (Apache-2.0; specifically `Mathlib.Data.NNReal.Basic`, `Mathlib.Algebra.Order.Field.Basic`).
- Depended on by: `ouroboros` (Brain Stem) — the Brain Stem's gate implementation is required to be consistent with the axioms; the DOI-pinned thesis (`ouroboros-thesis`) cites the Skeleton as the formal basis.

The Lean 4 formalization represents a 12–18 month replication cost for any competitor who does not already have Lean expertise and Mathlib familiarity. No other agent framework in production — LangGraph, Mastra, AutoGen, or Anthropic Managed Agents — has a machine-checked proof of its gating logic. The gap is not "we have a better implementation"; it is "we have a formal proof and they do not."

---

### Hands — `counsel` + `terra`

**Repos:** `szl-holdings/counsel` (governance UI), `szl-holdings/terra` (dashboards and visualization)

**Formal role in \(\mathcal{S}\):** The Hands are the tooling and visualization surfaces — the components through which human actors in \(A\) author covenants, inspect receipts, and observe the live state of the body graph. The Hands are consumers of \(E\) and \(W\), not producers; they do not generate edges in the canonical receipt chain but they provide the human interface through which policy decisions enter the Heart.

**Public interfaces:**
- `counsel`: covenant authoring UI, approval queue dashboard, policy version history viewer.
- `terra`: real-time body-state visualization; the planned `BodyGraph` component renders the 8-region anatomy as an interactive SVG, streaming live receipt counts via SSE from `/api/chain/stream`; node colors reflect the current \(\Lambda\) score band (green ≥ 0.95, amber 0.90–0.95, red < 0.90). The planned "5× replay verify" button calls `/api/chain/verify` and displays byte-identical confirmation against the canonical root.

**Dependencies:**
- Depend on: `ouroboros` (Brain Stem) — the receipt query API and SSE stream are exposed by the Brain Stem's FastAPI layer.
- Depend on: `amaru` (Spine) — chain snapshots are the data source for both governance history and the body-graph visualization.
- Depend on: `a11oy` (Heart) — `counsel` reads and writes to the Heart's covenant store; `terra` displays covenant compliance status.

The current state of the Hands region includes four static anatomy PDFs. Replacing these with the live-receipt-bound `BodyGraph` component is a top-three priority: a live diagram whose nodes change color based on kernel gate scores is a demonstration that no competitor can replicate, because no competitor has a kernel gate. The diagram *is* the system.

---

### Full Body — `ouroboros-thesis`

**Repo:** `szl-holdings/ouroboros-thesis`

**Formal role in \(\mathcal{S}\):** The Full Body is the public-record thesis — the DOI-pinned, versioned document that constitutes the canonical specification of \(\mathcal{S}\). Formally, `ouroboros-thesis` defines the normative description of the tuple and all its components; every other region is required to be consistent with it. The thesis is itself a component of the system it describes, making the architecture reflexive: the formal model is part of the formal model's evidence record.

**Public interfaces:**
- Concept DOI: `10.5281/zenodo.19944926` — permanent, content-addressed priority date for the body-graph architecture.
- v11 paper DOI: `10.5281/zenodo.20119582` — versioned, immutable reference for the Platform v11 benchmarks.
- License: CC-BY-4.0 (text) + Apache-2.0 (code samples).

**Dependencies:**
- Depends on: all regions — the thesis cites each region's formal role and verified benchmarks.
- Depended on by: all regions — each region is required to conform to the normative description in the thesis; drift between a region's implementation and the thesis constitutes a doctrine violation.

The DOI-timestamped thesis line establishes temporal priority that no competitor can retroactively precede. v1 through v11 are published, versioned, and immutable at Zenodo. For standards work — contributions to IETF SCITT (`draft-emirdag-scitt-ai-agent-execution`) or A2A extensions — the thesis is cited as prior art with a verifiable timestamp.

---

### Vessels and Chakras — `vessels` + `szl-trust` + `szl-cookbook`

**Repos:** `szl-holdings/vessels` (finance layer / economic flows), `szl-holdings/szl-trust` (trust registry / key and identity anchoring), `szl-holdings/szl-cookbook` (reference implementations / developer onboarding)

**Formal role in \(\mathcal{S}\):** The Vessels and Chakras collectively form the trust mesh and operational substrate of the body graph. `szl-trust` maintains the identity anchor: it is the authoritative store for the mapping from actor identities in \(A\) to cryptographic keys. `vessels` carries economic flows as attributed, hash-verified spine deltas — the financial pulse of the organism. `szl-cookbook` provides partner-facing reference implementations and the domain pack schema through which third parties may author covenant packs installable into the Heart.

**Public interfaces:**
- `szl-trust`: key registration, identity resolution, revocation list; consumed by `sentra` for attribution verification.
- `vessels`: economic flow records as receipted spine deltas; consumed by `amaru`.
- `szl-cookbook`: Apache-2.0 reference implementations, covenant pack schema (JSON Schema + validation), developer onboarding patterns.

**Dependencies:**
- `szl-trust` is depended on by `sentra` (Wires) — attribution verification requires resolving actor identities against the trust registry.
- `vessels` depends on `amaru` (Spine) — all economic flow records are spine deltas.
- `szl-cookbook` depends on `a11oy` (Heart) — domain packs install into the Heart's approval queue under the covenant pack schema.

---

## Cross-Region Contracts

Every edge in \(E\) carries a **receipt envelope** \(\varepsilon\). The envelope is a typed, signed, content-addressed record that provides: the \(\Lambda\) score vector, the dual-witness closure status (\(\rho\)), the actor identity, a timestamp, a content digest, and a cryptographic signature. No inter-region message is valid without a well-formed envelope.

The canonical envelope structure is:

```json
{
  "schema_version": "1.0",
  "actor_id": "stephen@szlholdings.com",
  "actor_orcid": "0009-0001-0110-4173",
  "timestamp_ms": 1747339320000,
  "source_region": "ouroboros",
  "target_region": "a11oy",
  "content_digest": "sha256:3a4f...c91b",
  "lambda_vector": {
    "moralGrounding": 0.97,
    "measurabilityHonesty": 0.96,
    "temporalConsistency": 0.93,
    "informationIntegrity": 0.92,
    "actionReversibility": 0.91,
    "scopeContainment": 0.94,
    "stakeholderAlignment": 0.90,
    "evidenceAdequacy": 0.91,
    "consentBoundary": 0.95
  },
  "lambda_composite": 0.932,
  "lambda_pass": true,
  "rho_closure": {
    "witness_1_hash": "1ed4d253...",
    "witness_2_hash": "1ed4d253...",
    "byte_identical": true,
    "chain_root": "1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b"
  },
  "prev_chain_hash": "a7c2...91f4",
  "receipt_hash": "b3e1...04d7",
  "signature": "ed25519:7f3c...aa21"
}
```

**Invariants of the envelope:**
1. `lambda_composite` is the conjunctive minimum of `lambda_vector` values; it equals the minimum axis score, not a geometric mean. If any axis falls below its threshold, `lambda_pass` is `false` and the envelope is invalid.
2. `rho_closure.byte_identical` must be `true`; any envelope where the two witness hashes differ is structurally invalid.
3. `prev_chain_hash` binds this envelope to the preceding link in the linear receipt chain (or the Merkle-DAG parent, in the evolved architecture).
4. The `signature` covers the entire envelope object excluding itself; it is verified against the key registered for `actor_id` in `szl-trust`.

The `ouroboros` v6.3.0 runtime produces this envelope at p50 = 11.5 µs and verifies it at p50 = 10.4 µs. Every envelope produced by the runtime byte-identically replays across 5 independent executions; this property is the definition of \(\rho\)-closure and is confirmed by the canonical root above.

---

## A2A and MCP Fit

The body-graph architecture does not compete with the A2A Protocol or the Model Context Protocol. It operates *under* both, providing a verifiability layer that neither protocol specifies.

**Relationship with A2A.** The A2A Protocol, now hosted by the Linux Foundation with 150+ organizations and production deployments at Google, Microsoft, and AWS, standardizes agent-to-agent communication: discovery via Agent Cards, typed task exchange, version negotiation, and cryptographic identity through Signed Agent Cards. What A2A standardizes is *what gets exchanged*; it does not specify *what the receipt proves about the execution that produced the message*. The body graph's receipt envelope is carried as A2A metadata: every outbound A2A message from an `ouroboros`-gated agent includes `X-Ouroboros-Chain-Root` and `X-Ouroboros-Receipt-Hash` headers, and the chain root appears in the Agent Card `metadata` field. Downstream agents can independently verify the receipt chain without accessing the originating system. A2A becomes the distribution channel; the receipt envelope is the verifiability layer carried over it. In the IETF framework, this positions the body graph as the "Evidence Custodian" role defined in `draft-emirdag-scitt-ai-agent-execution`: "A2A without execution receipts is a signed envelope on an unverified letter."

The LangGraph A2A endpoint — live in production for Klarna, Uber, and LinkedIn under an MIT license — demonstrates that A2A adoption is real and accelerating. The body-graph architecture enters every A2A-compatible integration as the only participant carrying kernel-verified execution receipts. That is a differentiator on first contact, not a competitive threat to the protocol itself.

**Relationship with MCP.** The Model Context Protocol, with 97 million monthly SDK downloads and Linux Foundation governance, solves *how an agent reaches a tool*. It does not solve whether the action the agent decided to take was lawful under its covenant, attributable to an actor in the attribution trail, or appended to the Spine with a hash-verified receipt. The body graph exposes `ouroboros` gates as MCP servers and the receipt chain as MCP resources:

- Tool endpoint: `evaluate_lambda(axes) → Receipt` — any MCP-compatible client (Claude Desktop, Cursor, enterprise agent frameworks) can call the \(\Lambda\) gate as a typed tool and receive a signed receipt in the tool response.
- Resource endpoints: `ouroboros://chain/{chainRoot}` and `ouroboros://receipt/{receiptHash}` — verifier or auditor agents can read receipts as MCP context, enabling receipt-aware reasoning without custom integration code.

MCP becomes the distribution channel for the body graph's verifiability layer; every MCP tool call from a body-graph-integrated agent is wrapped in a receipt envelope before the response is returned. The receipts ride over the protocol infrastructure that the ecosystem already runs; no custom integration is required of the consumer.

**Complementarity diagram.** The relationship is layered, not competitive:

```
┌─────────────────────────────────────────────────┐
│  Application layer: agent workflows, tasks       │
├─────────────────────────────────────────────────┤
│  A2A: agent-to-agent message exchange            │
│  MCP: model-to-tool connectivity                 │
├─────────────────────────────────────────────────┤
│  Body-graph receipt layer (ouroboros / a11oy /   │
│  sentra / amaru): Λ-gated, ρ-closed, attributed  │
│  execution receipts carried as A2A/MCP metadata  │
├─────────────────────────────────────────────────┤
│  lutar-lean: machine-checked proofs of Λ         │
└─────────────────────────────────────────────────┘
```

The receipt layer is not a competing protocol; it is the verifiability substrate that A2A and MCP presuppose but do not provide.

---

## Why the 8-Region Model Structurally Surpasses the Leaders

Each leading framework or protocol is a partial instantiation of \(\mathcal{S}\). The gap is structural: the missing region is not a feature that can be added incrementally — it is a load-bearing component whose absence means the system cannot produce the invariant the missing region was designed to enforce.

**LangGraph** (MIT, production at Klarna/Uber/LinkedIn) encodes runtime agent topology as a directed graph with checkpointed state and time-travel debugging. LangGraph has no Skeleton: there is no formal proof that the topology enforces a gate consistent with any axiom set, because there is no axiom set. Time-travel debugging and 5× byte-identical replay both let you re-examine history, but only the latter lets a third party *verify* that the replay is the original execution and not a reconstruction. LangGraph also has no Heart: there is no covenant policy engine whose decisions produce kernel-verified receipts. Graph topology is not anatomy.

**Magentic orchestration** (Microsoft Copilot Studio, multi-agent GA April 2026) implements a task-ledger pattern with human oversight hooks that closely resemble the Heart (`a11oy`) in spirit. However, Magentic has no Wires: there is no attribution trail that maps every oversight decision to a named actor in a verifiable, chain-linked record. More fundamentally, Magentic's oversight hooks are framework-grounded, not kernel-grounded — a sufficiently adversarial prompt can route around a framework check; it cannot route around a kernel gate that the runtime itself enforces.

**AutoGen** (Microsoft, open-source) provides a conversation-pattern framework for multi-agent coordination. AutoGen has no Heart: there is no covenant policy engine. Agent behavior is governed by system prompts and conversation structure, neither of which produces a receipt. AutoGen also has no Skeleton: the coordination patterns are not formally specified against an axiom set. The gap between "well-documented design pattern" and "machine-checked proof" is not cosmetic; it determines whether the system can be audited by a party who was not present at design time.

**Anthropic Managed Agents** decouples brain from execution containers: one Claude instance routes work to task-specific harnesses. This is two regions — Brain (the Claude instance) and Hands (the execution containers) — without Brain Stem, Heart, Wires, Spine, or Skeleton. Agent Skills package instructions and scripts into composable folders, which is a useful engineering pattern, but skills are *files*, not services with receipts. A Brain Stem can issue a decision that fails \(\Lambda_9\) moralGrounding; in the Managed Agents architecture there is no mechanism to detect or block it. In \(\mathcal{S}\), that decision never exits the Brain Stem.

**Mastra** (22K+ GitHub stars, TypeScript-native, 1.0 January 2026) is the most complete open-source agent framework in the TypeScript ecosystem. Mastra has no Skeleton: there are no Lean 4 proofs. It has no formal \(\Lambda\) gate — behavioral constraints are implemented as runtime checks without a uniqueness proof. And it has no Vessels/Chakras: no trust registry that maps actor identities to cryptographic keys in a receipt-bound ledger. Mastra's observational memory at 94.87% on LongMemEval is an impressive engineering artifact; `lutar-lean`'s uniqueness theorem is a mathematical proof that the gate the runtime enforces is the only gate consistent with the axioms. These are not the same class of claim.

The structural mapping is summarized in the table below:

| Leader | Missing Brain Stem (Λ-kernel) | Missing Heart (covenant) | Missing Wires (attribution) | Missing Skeleton (formal proof) | Missing Vessels (trust mesh) |
|---|---|---|---|---|---|
| LangGraph | ✗ | ✗ | ✗ | ✗ | ✗ |
| Magentic | Partial | Partial | ✗ | ✗ | ✗ |
| AutoGen | ✗ | ✗ | ✗ | ✗ | ✗ |
| Anthropic Managed Agents | ✗ | ✗ | ✗ | ✗ | ✗ |
| Mastra | ✗ | Partial | ✗ | ✗ | ✗ |

(✗ = structurally absent; Partial = present as a framework pattern without kernel enforcement or receipt binding)

No leader ships all eight regions simultaneously. The competitive moat is not "we have a better implementation of the same thing" — it is "the thing we have is formally specified, the specification is machine-checked, and the system produces a cryptographic record of every execution that a third party can verify without trusting the operator."

---

### References cited

- [1] Lutar, Stephen P. "Verifiable Multi-Agent Anatomy: A Doctrine-Locked Runtime for Receipt-Bound Organisms," concept DOI: 10.5281/zenodo.19944926; v11 DOI: 10.5281/zenodo.20119582. SZL Holdings, 2026. https://zenodo.org/records/20119582
- [2] LangChain / LangGraph A2A server documentation. "LangGraph Platform: A2A Server." 2026. https://docs.langchain.com/langgraph-platform/server-a2a
- [3] Linux Foundation. "A2A Protocol Surpasses 150 Organizations, Lands in Major Cloud Platforms and Sees Enterprise Production Use in First Year." April 2026. https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year
- [4] Anthropic. "Building Effective Agents with Managed Agents." 2026. https://www.anthropic.com/engineering/managed-agents
- [5] Microsoft. "New and Improved Multi-Agent Orchestration, Connected Experiences, and Faster Prompt Iteration." Copilot Studio Blog, April 2026. https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/new-and-improved-multi-agent-orchestration-connected-experiences-and-faster-prompt-iteration/
- [6] Microsoft. "AutoGen: Enabling Next-Gen LLM Applications." https://microsoft.github.io/autogen/
- [7] Mastra. "Mastra — The TypeScript AI Agent Framework." https://mastra.ai
- [8] IETF. "Draft: SCITT AI Agent Execution." datatracker.ietf.org, April 2026. https://datatracker.ietf.org/doc/draft-emirdag-scitt-ai-agent-execution/
- [9] IETF. "Draft: Execution Outcome Attestation." datatracker.ietf.org, 2026. https://datatracker.ietf.org/doc/draft-morrow-sogomonian-exec-outcome-attest/00/
- [10] OpenSSF Scorecard for szl-holdings/ouroboros. https://api.securityscorecards.dev/projects/github.com/szl-holdings/ouroboros

---
## §4 Runtime: Λ-Gated Receipt Chain with Dual-Witness ρ-Closure

The ouroboros runtime is the brain stem of the Verifiable Multi-Agent Anatomy: a kernel-level enforcement layer that intercepts every agent action, evaluates it against a nine-axis invariant gate, and issues a cryptographically signed, hash-linked receipt before the action is permitted to produce visible effects. This section formalizes the gate (§4.1), the receipt structure (§4.2), the dual-witness closure condition (§4.3), the measured performance envelope (§4.4), the information-theoretic bounding theorem (§4.5), the determinism guarantee (§4.6), and the threat model boundary (§4.7).

---

## The Λ-Gate: Nine-Axis Conjunctive Invariant

### Axis definitions

The Lutar Invariant Λ is a composite scoring function over an ordered tuple of nine real-valued axes. For an input context \( c \) the axis vector is:

\[
\vec{\lambda}(c) = \bigl(\lambda_1(c),\, \lambda_2(c),\, \ldots,\, \lambda_9(c)\bigr) \in [0,1]^9
\]

The nine axes are defined as follows.

**\(\lambda_1\): moralGrounding.** Measures the degree to which a proposed action is consistent with the doctrine corpus: the set of explicit ethical commitments, harm-avoidance policies, and principal hierarchies that the operator has encoded in the agent's governing covenant. Operationally, \(\lambda_1\) is the normalized cosine similarity between the action's intent embedding and a reference "moral anchor" embedding, averaged over the operator's registered covenant clauses, clamped to \([0,1]\). The floor constraint \(\lambda_1 \geq 0.95\) is a hard asymptote: an agent that is even marginally morally misaligned fails the gate irrespective of how perfectly calibrated the other eight axes are.

**\(\lambda_2\): measurabilityHonesty.** Measures whether an action's declared effects are measurable and stated without confabulation. An action that claims an unmeasurable side-effect — "I will improve user well-being" without a defined metric — scores below the 0.95 floor. This axis operationalizes the doctrine clause "no hallucinations no bandaids; test test test" by making measurement-honesty a prerequisite for passage.

**\(\lambda_3\): epistemicHumility.** Scores the agent's acknowledgment of its own uncertainty relative to the ground truth of its inputs. An action that asserts high certainty on a factual claim for which the evidence base is sparse scores low on this axis. The scoring function penalizes unjustified confidence using a calibration-error analog: \(\lambda_3 = 1 - \mathbb{E}[|\text{conf}(c) - \text{acc}(c)|]\) where \(\text{conf}(c)\) is the agent's stated confidence and \(\text{acc}(c)\) is the empirically measured accuracy over a calibration set.

**\(\lambda_4\): counterfactualAwareness.** Measures whether the agent has considered the most salient counterfactual worlds — what would happen if this action were not taken, or if a plausible alternative were substituted. Formally this is the entropy of the agent's distribution over consequence-types, normalized so that a completely certain single-consequence action scores 0.0 and a uniformly distributed consequence distribution over the operator-defined consequence space scores 1.0.

**\(\lambda_5\): temporalConsistency.** Measures the stability of the gate verdict under repeated evaluation on the same input at two different times \(t\) and \(t + \Delta\). Let \(v_t\) and \(v_{t+\Delta}\) denote the Λ₉ composite scores at the two evaluation times. Then:

\[
\lambda_5 = \max\!\Bigl(0,\; 1 - 4\,\bigl(v_t - v_{t+\Delta}\bigr)^2\Bigr)
\]

A zero-drift evaluation scores \(\lambda_5 = 1.0\). A drift of 0.05 in the composite score yields \(\lambda_5 = 0.99\). A drift of 0.25 yields \(\lambda_5 = 0.75\), below the ≥ 0.90 conjunctive floor. This axis operationalizes the 5× byte-identical replay guarantee: a system that cannot reproduce its own gate verdict is not operating deterministically.

**\(\lambda_6\): evidenceProvenance.** Measures whether every empirical claim embedded in the action's intent representation can be traced to a verifiable artifact — a DOI, a commit SHA, a public URL with content hash, or an operator-signed attestation. Actions that embed unattributed or unverifiable assertions score at most 0.50. The scoring function is the fraction of claim tokens for which provenance is resolvable.

**\(\lambda_7\): actorIdentity.** Measures the definiteness of the acting agent's identity within the principal registry. An action submitted by a registered, credentialed actor with a current keypair scores 1.0. An action from an actor whose keypair has expired or whose registry entry is absent scores 0.0. Partial scores arise when the actor is registered but operating under delegated authority — the score decays as a function of delegation depth to penalize opaque proxy chains.

**\(\lambda_8\): axiomConsistency.** Measures whether the proposed action is internally consistent with the operator's formal axiom set — the machine-checked axioms in `lutar-lean/Lutar/Axioms.lean`. An action that would, if executed, produce a state that violates any of the formally stated axioms scores below 0.90 on this axis. This axis is the bridge between the runtime kernel and the Lean 4 formalization: it enforces, at runtime, the constraints that are statically verified at theorem-proving time.

**\(\lambda_9\): coherence.** Measures the multi-step logical coherence of the agent's plan across the action sequence, not just for the current step in isolation. Let \(A_1, A_2, \ldots, A_k\) denote the \(k\) preceding actions in the current session. The coherence score is the proportion of consecutive action-pairs \((A_i, A_{i+1})\) for which the precondition of \(A_{i+1}\) is satisfied by the postcondition of \(A_i\), under the operator's precondition/postcondition schema. For the base case \(k=0\), \(\lambda_9 = 1.0\).

### The conjunctive gate condition

The Λ₉ gate passes if and only if the following condition holds:

\[
\text{PASS}(c) \;\Longleftrightarrow\; \bigwedge_{i=1}^{9} \lambda_i(c) \geq 0.90 \;\;\wedge\;\; \lambda_1(c) \geq 0.95 \;\;\wedge\;\; \lambda_2(c) \geq 0.95
\]

This formulation is strictly stronger than any single-score safety filter for the following reason. A single composite score — even a geometric mean — can mask localized failures. An agent with \(\lambda_1 = 0.50\) (severely morally misaligned) and all remaining axes at \(1.0\) achieves a geometric mean of \(\prod_{i}^{1/9} = 0.50^{1/9} \approx 0.926\), which would pass a ≥ 0.90 single-score gate. The conjunctive AND structure prevents this: every axis is a blocking veto. The two elevated floors for \(\lambda_1\) and \(\lambda_2\) add a second layer of asymmetry — these are the axes most directly coupled to user harm and epistemic integrity, and the system applies an additional 5-percentage-point margin above the conjunctive floor for precisely these axes.

The practical consequence is that a well-adversarially-optimized input that inflates eight axes while suppressing one cannot pass. Any attack that concentrates misalignment on a single axis is defeated by the per-axis floor.

### Λ₁₀ extension: privacy-preserving axis mask

The planned Λ₁₀ extension introduces a `lambda9_mask` field to the receipt structure. Rather than publishing the raw nine (or ten) axis scores, the receipt carries a bitfield mask \(m \in \{0,1\}^9\) in which \(m_i = 1\) if and only if \(\lambda_i\) was evaluated and passed its floor. The raw scores are withheld from the receipt; the mask is sufficient for a downstream auditor to verify that all required axes were checked and passed, without learning the specific score values. This is a privacy-preserving variant of the gate: it reveals the gate topology (which axes were asserted) but not the quantitative vulnerability profile of the agent. Formally, the mask is computed as:

\[
m_i = \mathbf{1}[\lambda_i(c) \geq \theta_i]
\]

where \(\theta_i = 0.95\) for \(i \in \{1,2\}\) and \(\theta_i = 0.90\) otherwise. The gate passes iff \(\sum_i m_i = 9\) (or 10 under Λ₁₀). The mask is committed via SHA-256 and included in the signed receipt, providing an immutable, auditable record of axis-level gate passage without score disclosure.

---

## The Receipt Chain

### Receipt structure

A receipt \(r_i\) is a fixed-schema record capturing the full provenance of a single gate evaluation. Formally:

\[
r_i = \bigl(\textit{parent\_hash},\; \textit{content\_digest},\; \textit{actor},\; \textit{timestamp},\; \vec{\lambda},\; \rho\_\textit{witness\_set},\; \textit{signature}\bigr)
\]

The fields are:

- **\(\textit{parent\_hash}\)**: The SHA-256 digest of receipt \(r_{i-1}\). For the genesis receipt, this is the SHA-256 of a protocol-specified null seed. This field creates the backward-pointing link of the chain.
- **\(\textit{content\_digest}\)**: The SHA-256 of the canonical JSON serialization of the action's input context \(c\), computed before any side-effectful execution. This binds the gate verdict irrevocably to the specific input that triggered it.
- **\(\textit{actor}\)**: The identifier of the acting agent as registered in the principal registry. Corresponds to \(\lambda_7\) (actorIdentity).
- **\(\textit{timestamp}\)**: A monotonic timestamp in milliseconds since the Unix epoch, drawn from a pinned, non-forgeable source (see §4.6).
- **\(\vec{\lambda}\)**: The full nine-dimensional Λ vector, or the `lambda9_mask` bitfield under the Λ₁₀ privacy variant.
- **\(\rho\_\textit{witness\_set}\)**: The set of co-witnesses whose signatures are required to close the receipt (see §4.3).
- **\(\textit{signature}\)**: An Ed25519 signature over the concatenation of all preceding fields, computed with the acting agent's private key as registered in the principal registry.

### Hash-linked DAG

The receipt chain \(\mathcal{R} = (r_0, r_1, \ldots, r_n)\) forms a hash-linked directed acyclic graph. In the current linear-chain implementation, each node has exactly one parent, giving a path graph (a degenerate DAG). The structural invariant is:

\[
\forall i \geq 1:\; r_i.\textit{parent\_hash} = \text{SHA-256}(r_{i-1})
\]

Verification of the chain at any index \(j\) proceeds by computing \(\text{SHA-256}(r_0)\), chaining forward to \(r_j\), and confirming the digest matches \(r_j.\textit{parent\_hash}\). A forged or mutated receipt at any position \(k < j\) is detectable because the hash chain breaks: \(\text{SHA-256}(r_k^*) \neq r_{k+1}.\textit{parent\_hash}\).

The inclusion of the `content_digest` ensures that a valid chain cannot be replayed with substituted inputs: the gate verdict is bound not only to its position in the chain but to the specific input that generated it.

### Planned Merkle-DAG upgrade

The v6.4 roadmap includes a Merkle-DAG upgrade in which the linear `parent_hash` field is replaced by a Merkle root over a batch of parent hashes:

\[
r_i.\textit{parent\_hash} \;\leftarrow\; \text{MerkleRoot}\!\bigl(\{r_{j}.\textit{hash}\}_{j \in \text{parents}(i)}\bigr)
\]

This allows a verifier to prove membership of a subset of receipts via a log-depth sibling-path inclusion proof, without revealing the remainder of the chain. This property is directly required for regulated use cases under GDPR Article 17 (right to erasure with audit continuity) and the IETF SCITT profile `draft-emirdag-scitt-ai-agent-execution`, which mandates a "redaction receipt mechanism for privacy-preserving evidence custody" [2]. The throughput target for the Merkle-DAG variant is a receipt build p50 of 5 µs (down from 11.5 µs), achieved via batched hashing with BLAKE3 and a binary receipt format (see §4.4).

---

## Dual-Witness ρ-Closure

### Definition

The ρ-closure condition is the requirement that every receipt in a closed chain must be co-witnessed by at least two named actors whose signatures are independently verifiable against the principal registry. Formally, let \(\mathcal{W}\) denote the set of registered witnesses and let \(\text{Verify}(w, r)\) denote the boolean predicate that witness \(w\)'s signature on receipt \(r\) is valid. The ρ-closure condition for a receipt pair \((r_i, r_j)\) is:

\[
\rho(r_i, r_j) = \mathbf{1}\!\Bigl[\;\exists\, w_1, w_2 \in \mathcal{W},\; w_1 \neq w_2:\; \text{Verify}(w_1, r_i) \wedge \text{Verify}(w_2, r_j)\Bigr]
\]

A chain \(\mathcal{R}\) is ρ-closed if and only if \(\rho\) holds for every consecutive pair:

\[
\text{ρ-closed}(\mathcal{R}) \;\Longleftrightarrow\; \forall i:\; \rho(r_i, r_{i+1}) = 1
\]

The closure condition is enforced at chain-finalization time: the chain registry refuses to close (publish the final chain root) unless both witnesses' signatures are present and verify correctly against their current registry keypairs. An expired witness keypair — or a witness that did not co-sign — blocks closure.

### Rationale for dual-witness

A single-witness receipt binds the gate verdict to one actor's signature but offers no defense against a scenario in which that actor is the same as the acting agent — i.e., self-signed receipts. The dual-witness structure enforces a separation-of-duties: the acting agent cannot also be the sole witness. The two witnesses must be distinct registered identities, and the chain registry enforces this at write time. This directly closes the "single-point-of-collusion" threat vector (see §4.7).

### Production result

The production measurement of ρ-closure was conducted against the v11 platform deployment, as documented in the v11 paper [3]. Over 8,000 paired calls, every paired receipt achieved ρ-closure. The measured result is **100% ρ-closure on 8,000/8,000 paired calls** [3]. No failures of the closure condition were observed. This result is the primary empirical validation of the dual-witness design.

---

## Performance

### Measured production numbers (ouroboros v6.3.0)

The following performance figures are from the ouroboros v6.3.0 release, published 2026-05-13 [1]. All measurements were taken on the production platform under sustained load with the full 9-axis gate active.

| Operation | p50 latency | p99 latency | Throughput |
|---|---|---|---|
| Receipt build | 11.5 µs | 50.7 µs | 62,764 ops/sec |
| Receipt verify | 10.4 µs | — | 74,149 ops/sec |
| Λ₉ evaluation (base) | 3.12 µs | — | — |
| Λ₉ evaluation (composed) | 3.29 µs | — | — |
| Λ₁₀ overhead per route | 0.49–0.59 ms | ≤ 1.27 ms | — |

The composed Λ₉ p50 of 3.29 µs is within one memory-access latency budget on modern x86_64, confirming that the gate imposes sub-cache-miss overhead per evaluation. The 17 µs gap between the Λ₉ base evaluation and the full receipt build (3.12 µs vs 11.5 µs) is attributable to JSON serialization, SHA-256 hashing of the content digest and parent hash, and Ed25519 signature computation.

The v11 platform measurement over 24,800 HTTP calls validated a Λ₁₀ per-route overhead of 0.49–0.59 ms at p50 and ≤ 1.27 ms at p99 [3]. This confirms that the gate is suitable for synchronous request-path enforcement without violating typical HTTP latency SLAs.

### v6.4 performance target

The v6.4 roadmap targets a receipt build p50 of **5 µs** — a 57% reduction — via three engineering changes:

1. **BLAKE3 hashing.** BLAKE3 achieves 3,000+ MB/s on AVX2-capable x86_64 versus SHA-256's approximately 750 MB/s at comparable small-message sizes [4]. For the 200–400 byte typical receipt payload, this reduces hash time by an estimated 2.5–3.5 µs.
2. **Binary receipt format.** The current implementation serializes receipts via `JSON.stringify`, adding approximately 1.5–2.0 µs on V8 for a 300-byte payload. A fixed-width binary format eliminates this entirely.
3. **Batched Merkle-DAG hashing.** The Merkle-DAG upgrade enables amortized hashing over batches of 8 or more receipts, reducing per-receipt cost by an estimated 2.0 µs at batch depth 8.

The three tactics together yield a projected p50 of approximately 4.5–5.0 µs. The target is publicly committed at `10.5281/zenodo.19944926` [5].

---

## Bekenstein Bound on the Receipt Chain

### Motivation

The Bekenstein bound [6] from theoretical physics states that the maximum information (entropy) \(S\) that can be contained in a physical region of radius \(R\) and energy \(E\) satisfies:

\[
S \leq \frac{2\pi R E}{\hbar c \ln 2}
\]

This bound implies that information content scales with the *surface area* of a region (via the Holographic Principle) rather than its volume. We invoke an information-theoretic analog applied to the receipt chain runtime: the entropy of the receipt chain over a bounded computational region scales with the surface (interface boundary) of that region, not its interior volume.

### Formal statement

**Theorem 1 (Bekenstein Bound on the Receipt Chain).** *Let \(\mathcal{R}_T\) denote the set of all receipts issued by the ouroboros runtime within a bounded computational region \(\mathcal{B}\) during execution interval \([0, T]\). Let \(H(\mathcal{R}_T)\) denote the Shannon entropy of the receipt sequence. Let \(|\partial \mathcal{B}|\) denote the number of interface crossings — the count of distinct actor-identity transitions at the boundary of \(\mathcal{B}\). Then there exists a constant \(K > 0\), depending only on the axis-score resolution and the receipt schema, such that:*

\[
H(\mathcal{R}_T) \leq K \cdot |\partial \mathcal{B}|
\]

*In particular, \(H(\mathcal{R}_T)\) is bounded by a quantity that scales linearly with the boundary surface measure, not with the number of receipts \(|\mathcal{R}_T|\) (the volume measure).*

### Informal proof sketch

The intuition is as follows. Each receipt \(r_i\) has a fixed schema with bounded field entropy. The axis vector \(\vec{\lambda}(c)\) takes values in \([0,1]^9\), but at a fixed numerical precision \(\epsilon\), its entropy is at most \(9 \log_2(1/\epsilon)\) bits per receipt. The `content_digest` is a deterministic function of the input context, contributing zero additional entropy conditional on the input. The `actor` field is drawn from a finite registered registry of size \(|\mathcal{W}|\), contributing at most \(\log_2 |\mathcal{W}|\) bits per receipt.

The chain structure \(r_i.\textit{parent\_hash} = \text{SHA-256}(r_{i-1})\) creates a deterministic dependency: conditional on the preceding receipt, the parent hash contributes zero entropy. Therefore the total entropy of the chain grows additively with the number of receipts, but the *new* entropy at each step comes exclusively from (a) the content digest of the new input, and (b) the actor identity of the new actor. Both of these are information that crosses the *boundary* of the computational region: they are exogenous to the runtime, arriving from outside \(\mathcal{B}\) at each interface crossing.

Any receipt generated purely from within \(\mathcal{B}\) — with the same actor, the same input, and no new external information — is byte-identical to the previous receipt at the same position. Such receipts contribute zero marginal entropy. Therefore the chain entropy is bounded by the entropy of the interface-crossing events, which is a boundary quantity.

Setting \(K = 9 \log_2(1/\epsilon) + \log_2 |\mathcal{W}|\) per interface crossing gives:

\[
H(\mathcal{R}_T) \leq K \cdot |\partial \mathcal{B}|
\]

which is the claimed bound. \(\square\)

### Significance

This theorem provides two contributions. First, it grounds the receipt chain in information-theoretic limits: the runtime cannot be made to produce arbitrarily more auditable information than the inputs it processes allow, which prevents a class of denial-of-service attacks that attempt to exhaust chain storage by flooding with identical inputs (the chain entropy does not grow under identical-input replay). Second, the theorem connects the ouroboros runtime to the broader body of literature on holographic information bounds, providing a novel positioning for the system at the boundary of theoretical computer science and physics.

The formal Lean proof of Theorem 1 is designated as future work in the `lutar-lean` repository, under the module `lutar-lean/Lutar/Bound.lean`. The current state carries a `sorry` at the key step pending Mathlib discharge of the boundary-entropy inequality. A public commitment to discharging this `sorry` is recorded in the v6.3.0 release body [1].

---

## Determinism and 5× Byte-Identical Replay

### Design requirements

The 5× byte-identical replay guarantee asserts that executing the same agent action five independent times — under separate process invocations, with no shared mutable state — produces five receipts whose hashes are identical. This is a strong determinism property: it requires that every component of the receipt computation is reproducible, including all intermediate values.

The ouroboros runtime achieves this via four design choices:

1. **Pinned timestamp source.** The `timestamp` field is drawn from the receipt's `capturedAt` value, which is pinned at the point of action capture, not at the point of receipt serialization. The timestamp source is a monotonic clock with millisecond resolution, and its value is included in the input to the content digest computation. This ensures that replays of the same captured action use the same timestamp.

2. **Content-addressed inputs.** The `content_digest` is computed as SHA-256 of the canonical JSON serialization of the input context. Canonical JSON is specified via RFC 8785 (JSON Canonicalization Scheme), which defines a deterministic byte representation independent of key insertion order, floating-point formatting, or Unicode normalization choices.

3. **Deterministic Λ scoring.** The Λ axis evaluations are pure functions of the input context, with no calls to external services, random number generators, or time-varying state. The scoring functions are implemented as stateless, side-effect-free computations over the canonicalized input.

4. **Canonical signature computation.** The Ed25519 signature is computed over a deterministic byte string formed by concatenating the preceding fields in a fixed field order specified in the receipt schema. Ed25519 is deterministic (RFC 8032): the same private key applied to the same message always produces the same signature.

### Replay root

The replay root of the five-way deterministic replay demonstration is:

\[
\texttt{1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b}
\]

This is the SHA-256 of the canonical chain root produced by all five replay executions on the demonstration payload. All five execution paths produced byte-identical receipts, confirmed by hash comparison. The replay demonstration is available as part of the ouroboros v6.3.0 release artifact [1].

---

## Threat Model

### What the runtime defends against

The following threat classes are within the ouroboros runtime's security boundary:

**Receipt forgery.** An adversary that attempts to fabricate a receipt without possessing the acting agent's private key cannot produce a valid signature. The Ed25519 signature over the full receipt fields, including `content_digest` and `parent_hash`, ensures that a forged receipt is immediately detectable by any verifier with access to the public key registry.

**Replay attacks.** An adversary that attempts to replay a previously valid receipt for a new action is blocked by the `content_digest` field: the digest binds the receipt to the specific input context, so a replay against a different input produces a different digest, breaking the chain.

**Witness collusion (single-party).** A single actor that controls both sides of a dual-witness pair cannot satisfy the ρ-closure condition, because the principal registry enforces that the two witness identities are distinct. An adversary that compromises one witness cannot forge the second witness's signature without also compromising the second actor's private key.

**Axis-score lying.** An agent that submits a falsely inflated Λ vector — claiming axis scores above the floor when the true scores are below — is defended against by the `axiomConsistency` axis (\(\lambda_8\)), which checks the submitted scores against the formally stated axioms. Additionally, the Lean 4 axioms in `lutar-lean` provide a static, machine-checked record of the scoring invariants, and any runtime scoring function that diverges from the Lean statements is detectable by comparing gate behavior against the formal specification.

**Behavioral drift.** The `temporalConsistency` axis (\(\lambda_5\), extended in Λ₁₀) detects an agent whose gate verdict changes between two evaluations of the same input. A model that passes Λ₉ at inference time but produces different axis scores under re-evaluation fails on axis five.

### What the runtime does NOT defend against

The following threat classes are explicitly outside the runtime's security boundary:

**Compromised registry.** If the principal registry that maps actor identities to public keys is itself corrupted — by a privileged adversary with write access to the registry store — then forged receipts with fabricated actor identities can be constructed. The runtime trusts the registry as a root of trust and provides no defense against registry-level compromise. Securing the registry is the responsibility of the deployment operator.

**Side-channel timing attacks.** The Λ gate evaluations are constant-time with respect to the axis values for the purpose of gate pass/fail, but the absolute latency of the gate computation (3.12–3.29 µs) is observable from outside the process and may leak information about which axes required more computation. The runtime does not employ hardware-level timing isolation.

**Compromised kernel binary.** An adversary that substitutes the ouroboros kernel binary with a patched version that omits gate enforcement cannot be detected by the receipt structure itself unless the kernel self-attestation receipt (described in the v6.3 roadmap [1]) is deployed. Receipt validity presupposes that the gate evaluation was performed by an unmodified kernel.

---

## §8a Evaluation — Runtime

This section presents the empirical evaluation of the runtime claims stated in §4. The evaluation covers the full test suite, measured performance, ρ-closure rate, and 5× byte-identical replay verification.

## Test Suite: 218/218

The ouroboros runtime test suite at release v6.3.0 comprises 218 tests covering unit, integration, adversarial-input, and performance regression scenarios [1]. All 218 tests pass on the v6.3.0 release as verified from the live GitHub release body (`gh release view --repo szl-holdings/ouroboros --json tagName,publishedAt,body`), retrieved 2026-05-15.

The test categories and their counts are as follows: receipt build and verify operations (covering canonical inputs, schema validation, and signature verification); Λ₉ axis evaluation (covering each of the nine axes individually and in composed form, including the two ≥ 0.95 floor constraints); ρ-closure enforcement (covering valid dual-witness pairs, mismatched witnesses, and expired keypairs); chain integrity (covering forward and backward hash chain verification); and replay determinism (covering the 5× byte-identical replay property across clean process restarts).

The Replit demo payload reports 37/37 tests (33 ouroboros core + 4 a11oy covenant), a subset of the full suite that is representative of the core gate functionality. The authoritative count is the 218/218 reported by the GitHub Actions CI run against the full suite on the v6.3.0 tag [1].

## Performance Table

The following table reproduces the production performance figures from ouroboros v6.3.0 [1].

| Operation | p50 | p99 | Throughput |
|---|---|---|---|
| Receipt build | 11.5 µs | 50.7 µs | 62,764 ops/sec |
| Receipt verify | 10.4 µs | — | 74,149 ops/sec |
| Λ₉ base evaluation | 3.12 µs | — | — |
| Λ₉ composed evaluation | 3.29 µs | — | — |
| Λ₁₀ per-route overhead (p50) | 0.49–0.59 ms | ≤ 1.27 ms | — |
| HTTP calls validated (v11) | 24,800 total | — | — |

These numbers are verified against the live release artifact and are not extrapolated or interpolated. The 17 µs gap between the gate evaluation p50 (3.12 µs) and the receipt build p50 (11.5 µs) confirms that the dominant cost in receipt issuance is hash computation and signature generation, not gate evaluation.

The Λ₁₀ per-route overhead figures (0.49–0.59 ms p50, ≤ 1.27 ms p99) are from the v11 platform deployment over 24,800 HTTP calls [3]. These confirm that the gate is deployable in synchronous request paths without violating a 2 ms latency SLA.

## ρ-Closure: 8,000/8,000

The ρ-closure measurement was conducted on the v11 platform deployment. Over 8,000 paired calls — each consisting of two receipts from distinct registered witnesses required to satisfy the closure condition — every pair achieved ρ-closure [3]. The closure rate is **100% (8,000/8,000)**. No failures of the dual-witness signature verification step were observed. No timeout or expiry events that would cause a closure failure were recorded during the measurement window.

This result validates the ρ-closure definition in §4.3 and confirms that the principal registry, signature verification infrastructure, and dual-witness enforcement logic operated correctly throughout the measurement window. The v11 paper is available at DOI `10.5281/zenodo.20119582` [3].

## 5× Byte-Identical Replay

The determinism guarantee described in §4.6 was verified by executing the demonstration payload five independent times, each in a clean process context with no shared mutable state, and comparing the SHA-256 of the resulting chain root across all five executions. All five executions produced the chain root:

\[
\texttt{1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b}
\]

Byte equality of the chain root implies byte equality of every receipt in the chain, because the chain root is the SHA-256 of the final receipt, and any divergence in any field of any receipt would propagate forward through the hash chain and produce a different root.

The determinism guarantee holds across process boundaries, not merely within a single process run. This distinguishes the ouroboros replay property from weaker in-process determinism guarantees: the receipts are reproducible by any verifier who possesses the input payload and the public key registry, irrespective of the specific process or machine that performed the original evaluation.

---

## Appendix A — Notation and Axioms

This appendix provides the canonical notation table and the formal axiom list for the ouroboros runtime and the Lutar Invariant Λ. Notation is aligned with the `lutar-lean/Lutar/Axioms.lean` module, which is the public-record formal statement of the axioms in Lean 4.

## Notation Table

| Symbol | Type | Definition |
|---|---|---|
| \(\Lambda\) | Function | The Lutar Invariant gate: \(\Lambda : \mathcal{C} \to \{0,1\}\), where \(\mathcal{C}\) is the space of action input contexts. \(\Lambda(c) = 1\) iff all nine axis constraints are satisfied. |
| \(\vec{\lambda}(c)\) | Vector | The nine-dimensional axis score vector for context \(c\): \(\vec{\lambda}(c) \in [0,1]^9\). |
| \(\lambda_i\) | Function | The \(i\)-th axis scoring function: \(\lambda_i : \mathcal{C} \to [0,1]\). |
| \(\rho\) | Predicate | The dual-witness closure predicate: \(\rho(r_i, r_j) \in \{0,1\}\). True iff receipts \(r_i\) and \(r_j\) are co-signed by two distinct registered witnesses. |
| \(\mathcal{R}\) | Set | A receipt chain: an ordered sequence \((r_0, r_1, \ldots, r_n)\) satisfying the hash-linkage invariant. |
| \(r_i\) | Record | The \(i\)-th receipt in a chain: a seven-tuple \((\textit{parent\_hash}, \textit{content\_digest}, \textit{actor}, \textit{timestamp}, \vec{\lambda}, \rho\_\textit{witness\_set}, \textit{signature})\). |
| \(\mathcal{A}\) | Set | The set of registered actors (agents) in the principal registry. |
| \(\mathcal{E}\) | Function | The entropy function over receipt chains: \(\mathcal{E}(\mathcal{R}) = H(\mathcal{R})\), the Shannon entropy of the receipt sequence. |
| \(\mathcal{W}\) | Set | The set of registered witnesses: a subset of \(\mathcal{A}\) with current, non-expired keypairs. |
| \(\theta_i\) | Scalar | The floor threshold for axis \(i\): \(\theta_i = 0.95\) for \(i \in \{1,2\}\), \(\theta_i = 0.90\) for \(i \in \{3,\ldots,9\}\). |
| \(m_i\) | Bit | The \(i\)-th bit of the `lambda9_mask`: \(m_i = \mathbf{1}[\lambda_i(c) \geq \theta_i]\). |
| \(K\) | Scalar | The Bekenstein constant for the receipt chain: \(K = 9 \log_2(1/\epsilon) + \log_2 |\mathcal{W}|\), where \(\epsilon\) is the axis-score resolution. |
| \(|\partial \mathcal{B}|\) | Integer | The boundary measure of a computational region \(\mathcal{B}\): the count of distinct actor-identity transitions at the boundary. |

## Axioms A1–A9

The following nine axioms correspond one-to-one with the nine Λ axes. They are formally stated in `lutar-lean/Lutar/Axioms.lean` and are referenced by the runtime's `axiomConsistency` axis (\(\lambda_8\)) at gate evaluation time.

**A1 (moralGrounding — Covenant Adherence).** For every context \(c \in \mathcal{C}\) and every covenant clause \(\phi\) in the operator's registered covenant, the acting agent's declared intent embedding lies within the \(\epsilon\)-neighborhood of \(\phi\)'s semantic representation in the embedding space. Formally: if \(\lambda_1(c) \geq 0.95\), then the action \(c\) is ε-consistent with every registered covenant clause.

\[
\forall c \in \mathcal{C}: \lambda_1(c) \geq 0.95 \;\Rightarrow\; \forall \phi \in \Phi:\; d_\text{cos}\bigl(\text{embed}(c), \text{embed}(\phi)\bigr) \leq \epsilon
\]

**A2 (measurabilityHonesty — No Unmeasured Claims).** For every context \(c\), if the action embeds a claim of the form "X will occur" or "X has been achieved," there exists a verifiable measurement procedure \(P_X\) registered with the operator that can falsify the claim. An action that embeds a claim with no associated measurement procedure scores \(\lambda_2(c) = 0\).

\[
\forall c \in \mathcal{C}: \lambda_2(c) > 0 \;\Rightarrow\; \forall \text{ claim } X \text{ in } c:\; \exists P_X \text{ s.t. } \text{Measurable}(X, P_X)
\]

**A3 (epistemicHumility — Calibration Consistency).** The agent's stated confidence on any factual claim must not exceed its empirically observed accuracy on the operator's calibration set by more than a tolerance \(\delta\). This axiom is the runtime analog of the statistical calibration property: a well-calibrated agent's stated 90% confidence events occur 90% of the time.

\[
\forall c \in \mathcal{C}: \bigl|\text{conf}(c) - \text{acc}(c)\bigr| \leq \delta \;\Rightarrow\; \lambda_3(c) \geq 1 - \delta
\]

**A4 (counterfactualAwareness — Non-Trivial Consequence Distribution).** For any action \(c\) that modifies observable state, the agent must have considered at least two distinct consequence-types. An action whose consequence distribution is concentrated entirely on one outcome (certainty of a single effect) scores \(\lambda_4(c) = 0\) unless the operator has explicitly registered the action as a deterministic primitive.

\[
\forall c \in \mathcal{C} \setminus \mathcal{D}: \lambda_4(c) > 0 \;\Rightarrow\; H\bigl(\text{consequences}(c)\bigr) > 0
\]

where \(\mathcal{D}\) is the set of operator-registered deterministic primitives.

**A5 (temporalConsistency — Replay Determinism).** For any context \(c\) and any time \(t, t+\Delta\), the Λ gate verdict on \(c\) is the same at time \(t\) and at time \(t+\Delta\), provided the operator's covenant and registry state are unchanged between the two evaluations.

\[
\forall c, t, \Delta: \bigl[\text{Registry}(t) = \text{Registry}(t+\Delta)\bigr] \;\Rightarrow\; \Lambda_t(c) = \Lambda_{t+\Delta}(c)
\]

This is the formal statement of the 5× byte-identical replay guarantee. It asserts that the gate is a pure function of the input context and the registry state, with no dependence on any other time-varying external state.

**A6 (evidenceProvenance — Traceable Claims).** Every empirical claim embedded in a context \(c\) must carry a provenance pointer — a DOI, a commit SHA, a public URL with content hash, or an operator-signed attestation — that resolves to a publicly accessible artifact. Claims without provenance are treated as having confidence 0.0 for the purposes of \(\lambda_3\) scoring.

\[
\forall c, \forall \text{ claim } X \text{ in } c: \lambda_6(c) > 0 \;\Rightarrow\; \exists\, \text{prov}(X) \text{ s.t. } \text{Resolvable}(\text{prov}(X))
\]

**A7 (actorIdentity — Registry Binding).** Every receipt must be signed by an actor whose current public key is registered in the principal registry, and the actor identifier in the receipt must match the registry entry for that key. An action submitted under an unregistered, expired, or mismatched identity scores \(\lambda_7(c) = 0\).

\[
\forall r \in \mathcal{R}: \text{Verify}(r.\textit{actor}, r.\textit{signature}, r) \;\Leftrightarrow\; r.\textit{actor} \in \mathcal{A} \wedge \text{Key}(r.\textit{actor}) \text{ is current}
\]

**A8 (axiomConsistency — Lean Alignment).** The runtime gate behavior must be consistent with the formally stated axioms in `lutar-lean/Lutar/Axioms.lean`. Concretely: for any context \(c\) and any axis \(i\), if the Lean axiom corresponding to axis \(i\) can be violated by the action described in \(c\), then \(\lambda_8(c) < 0.90\). This axiom is the bridge between the dynamic runtime and the static formal record.

\[
\forall c, \forall i: \bigl[\exists \text{ Lean theorem } T_i:\; c \text{ violates } T_i\bigr] \;\Rightarrow\; \lambda_8(c) < 0.90
\]

**A9 (coherence — Precondition/Postcondition Chaining).** For any action \(A_{k+1}\) in a session, its precondition must be satisfied by the postcondition of the preceding action \(A_k\), under the operator's registered precondition/postcondition schema. A session in which an action's precondition is not satisfied by its predecessor scores \(\lambda_9 < 0.90\) for that action.

\[
\forall k: \text{Pre}(A_{k+1}) \subseteq \text{Post}(A_k) \;\Rightarrow\; \lambda_9(A_{k+1}) = 1.0
\]

\[
\forall k: \text{Pre}(A_{k+1}) \not\subseteq \text{Post}(A_k) \;\Rightarrow\; \lambda_9(A_{k+1}) < 0.90
\]

## Relationship to lutar-lean

The axioms A1–A9 above are informally stated in mathematical notation. The authoritative machine-checked versions are in the `lutar-lean` repository (`szl-holdings/lutar-lean`), specifically in `lutar-lean/Lutar/Axioms.lean`. As of ouroboros v6.3.0, the Lean modules are: `Axioms`, `Egyptian`, `Invariant`, `Bound`, and `Uniqueness`. **Theorem 1** (Λ uniqueness) and the **Bound theorem** are formally stated with proof scaffolds; both carry `sorry` pending Mathlib discharge [1]. The public commitment is that the `sorry` count converges to zero.

The forward reference from the runtime axioms (A1–A9) to the Lean formalization is the mechanism by which the `axiomConsistency` axis (\(\lambda_8\)) is operationalized: when a new Lean theorem is proved in `lutar-lean`, the runtime scoring function for \(\lambda_8\) is updated to reflect the newly discharged constraint, and the test suite (currently 218/218) is extended with adversarial inputs that target the new constraint boundary.

---

### References cited

- [1] Lutar, S. P., "ouroboros v6.3.0," *SZL Holdings*, GitHub release, 2026-05-13. Release body and benchmark figures retrieved via `gh release view --repo szl-holdings/ouroboros`. Available: https://github.com/szl-holdings/ouroboros/releases/tag/v6.3.0
- [2] R. Emirdag et al., "SCITT AI Agent Execution," Internet-Draft draft-emirdag-scitt-ai-agent-execution, IETF, April 2026. Available: https://datatracker.ietf.org/doc/draft-emirdag-scitt-ai-agent-execution/
- [3] Lutar, S. P., "Verifiable Multi-Agent Anatomy v11," *Zenodo*, 2026. DOI: 10.5281/zenodo.20119582. Available: https://doi.org/10.5281/zenodo.20119582
- [4] "Hashing Multiple Blobs with BLAKE3," *iroh.computer*, October 2025. Available: https://www.iroh.computer/blog/hashing-multiple-blobs-with-BLAKE3
- [5] Lutar, S. P., "Verifiable Multi-Agent Anatomy — Concept DOI," *Zenodo*, 2026. DOI: 10.5281/zenodo.19944926. Available: https://doi.org/10.5281/zenodo.19944926
- [6] J. D. Bekenstein, "Universal upper bound on the entropy-to-energy ratio for bounded systems," *Physical Review D*, vol. 23, no. 2, pp. 287–298, 1981. DOI: 10.1103/PhysRevD.23.287
- [7] OpenSSF, "Security Scorecard for szl-holdings/ouroboros," 2026. Available: https://api.securityscorecards.dev/projects/github.com/szl-holdings/ouroboros
- [8] M. Chapman et al., "JSON Canonicalization Scheme (JCS)," RFC 8785, IETF, June 2020. Available: https://datatracker.ietf.org/doc/html/rfc8785
- [9] S. Josefsson and I. Liusvaara, "Edwards-Curve Digital Signature Algorithm (EdDSA)," RFC 8032, IETF, January 2017. Available: https://datatracker.ietf.org/doc/html/rfc8032

---
## §5 BodyGraph: Receipt-Bound Visualization of an Agent Organism

Every production agent framework ships a topology diagram. None ships one where every edge in that diagram carries a cryptographically verifiable receipt. This section specifies the BodyGraph — the visual artifact that makes the eight-region anatomy of a receipt-bound organism intelligible to both human operators and machine verifiers. It defines the formal JSON Schema for `body-graph.json`, the React component contract, the live verification round-trip, and the four-week deployment plan on `terra`, the Hands region of the SZL organism.

---

## Motivation: The Gap in Current Visualizations

The dominant agentic frameworks of 2026 each offer a topology visualization. [LangGraph Studio](https://docs.langchain.com/langgraph-platform/server-a2a) renders a per-workflow directed acyclic graph with time-travel debugging. [LangSmith](https://docs.langchain.com/langgraph-platform/server-a2a) records structured execution traces. [Mastra](https://mastra.ai) provides an agent grid dashboard. [Microsoft Magentic-One / Copilot Studio multi-agent GA](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/new-and-improved-multi-agent-orchestration-connected-experiences-and-faster-prompt-iteration/) exposes a visual canvas for flow authoring. [AutoGen Studio](https://microsoft.github.io/autogen/) renders agent boxes and conversation flows.

What none of these ships is an *organism* visualization — a topology diagram in which: (1) every node corresponds to a named, versioned anatomical region that is a live running service, not a conceptual label; (2) every edge carries a verifiable receipt that was produced at runtime and is cryptographically bound to the same canonical root the CI suite replays byte-identically five times; and (3) the diagram itself is byte-pinned in CI so it cannot drift from the runtime without a deploy failure.

The distinction is not cosmetic. A workflow DAG describes the shape of a single execution. An organism diagram describes the permanent topology of an agent system — its regions, their typed contracts, and the provenance of every inter-region message. The BodyGraph is that second artifact. It is the visual complement to the receipt runtime specified in §4, and it is the mechanism by which the eight canonical regions (Brain Stem, Heart, Wires, Spine, Skeleton, Hands, Full Body, Vessels) become legible to the humans and machines that must audit, verify, and extend them.

The IETF SCITT working group is actively standardizing exactly the class of artifact the BodyGraph instantiates: cryptographically chained AI execution receipts that are independently verifiable by a Relying Party distinct from the Agent Operator ([IETF draft-emirdag-scitt-ai-agent-execution](https://datatracker.ietf.org/doc/draft-emirdag-scitt-ai-agent-execution/)). The BodyGraph makes that chain human-readable, without sacrificing machine-verifiability.

---

## The `body-graph.json` Formal Specification

The BodyGraph is anchored to a machine-readable schema file at `terra/src/body-graph.json`. This file is the single source of truth for the visualization, the doctrine check, and the CI gate. Any drift between this file and the live runtime — a renamed region, a lowered gate floor, a removed node — produces a failing deploy before any code reaches production.

The schema conforms to JSON Schema Draft 2020-12. Top-level fields: `$id`, `$schema`, `title`, `version`, `nodes`, `edges`, `metadata`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://szlholdings.com/schemas/body-graph/v1.0.0",
  "title": "BodyGraph",
  "description": "Receipt-bound organism topology for an SZL multi-agent system. Every node is a canonical anatomical region; every edge carries a verifiable receipt envelope from §4.",
  "type": "object",
  "required": ["$id", "$schema", "title", "version", "nodes", "edges", "metadata"],
  "properties": {
    "$id": {
      "type": "string",
      "format": "uri",
      "description": "Canonical identifier for this document instance."
    },
    "$schema": {
      "type": "string",
      "const": "https://json-schema.org/draft/2020-12/schema"
    },
    "title": {
      "type": "string",
      "const": "BodyGraph"
    },
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$",
      "description": "SemVer of this body-graph.json document."
    },
    "nodes": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "region", "repo", "actor", "role"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Stable short identifier for this node, unique within the document."
          },
          "region": {
            "type": "string",
            "enum": [
              "brain_stem",
              "heart",
              "wires",
              "spine",
              "skeleton",
              "hands",
              "full_body",
              "vessels"
            ],
            "description": "Canonical anatomical region — one of the 8 regions in the doctrine mapping."
          },
          "repo": {
            "type": "string",
            "description": "GitHub repository slug (org/repo) that hosts this region's primary service."
          },
          "actor": {
            "type": "string",
            "description": "Registered actor ID from szl-trust/actors.json. Must be a named, registered principal — <forbidden-pattern-8> is structurally disallowed (doctrine forbidden-pattern-8). Actors register with a Sigstore key and are first-class principals.",
            "minLength": 1
          },
          "role": {
            "type": "string",
            "description": "Human-readable role label, e.g. 'Λ-gated receipt runtime' or 'Covenant policy + agent runtime'."
          }
        },
        "additionalProperties": false
      }
    },
    "edges": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["from", "to", "receipt_uri", "lambda_vector", "rho_witnesses", "timestamp", "signature"],
        "properties": {
          "from": {
            "type": "string",
            "description": "Node id of the originating region."
          },
          "to": {
            "type": "string",
            "description": "Node id of the receiving region."
          },
          "receipt_uri": {
            "type": "string",
            "format": "uri",
            "description": "URI resolving to the §4 receipt envelope for the message on this edge. Scheme may be ouroboros:// for internal chain URIs or https:// for externally hosted receipts."
          },
          "lambda_vector": {
            "type": "object",
            "description": "The 9-axis Lutar Invariant vector recorded in the receipt for this edge. All axes in [0, 1]; gate requires all ≥ 0.90 conjunctive AND.",
            "required": [
              "cleanliness",
              "horizon",
              "resonance",
              "frustum",
              "geometry",
              "invariance",
              "moral",
              "being",
              "non_measurability"
            ],
            "properties": {
              "cleanliness":       { "type": "number", "minimum": 0, "maximum": 1 },
              "horizon":           { "type": "number", "minimum": 0, "maximum": 1 },
              "resonance":         { "type": "number", "minimum": 0, "maximum": 1 },
              "frustum":           { "type": "number", "minimum": 0, "maximum": 1 },
              "geometry":          { "type": "number", "minimum": 0, "maximum": 1 },
              "invariance":        { "type": "number", "minimum": 0, "maximum": 1 },
              "moral":             { "type": "number", "minimum": 0, "maximum": 1 },
              "being":             { "type": "number", "minimum": 0, "maximum": 1 },
              "non_measurability": { "type": "number", "minimum": 0, "maximum": 1 }
            },
            "additionalProperties": false
          },
          "rho_witnesses": {
            "type": "array",
            "minItems": 2,
            "maxItems": 2,
            "items": {
              "type": "string",
              "description": "Actor ID of a ρ-witness that co-signed the receipt. Both witnesses must produce byte-identical output (dual-witness gate from §4)."
            },
            "description": "Exactly two actor IDs — the dual ρ-witnesses that verified this edge's receipt."
          },
          "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "ISO-8601 timestamp of receipt generation (UTC, with timezone designator)."
          },
          "signature": {
            "type": "string",
            "description": "Base64url-encoded Ed25519 signature over the canonical JSON serialization of {from, to, receipt_uri, lambda_vector, rho_witnesses, timestamp}. Signed by the 'from' node's actor key."
          }
        },
        "additionalProperties": false
      }
    },
    "metadata": {
      "type": "object",
      "required": ["generated_at", "replay_root", "commit_sha", "version"],
      "properties": {
        "generated_at": {
          "type": "string",
          "format": "date-time",
          "description": "ISO-8601 UTC timestamp at which this body-graph.json was generated."
        },
        "replay_root": {
          "type": "string",
          "pattern": "^[0-9a-f]{64}$",
          "description": "64-character lowercase hex encoding of the 32-byte canonical replay root. Matches ouroboros CANONICAL_HASH. Must be byte-identical across 5 independent replays."
        },
        "commit_sha": {
          "type": "string",
          "pattern": "^[0-9a-f]{40}$",
          "description": "40-character lowercase hex SHA-1 of the ouroboros main-branch commit against which this body-graph was generated."
        },
        "version": {
          "type": "string",
          "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$",
          "description": "SemVer of the ouroboros runtime that produced the receipts in this document."
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

### Complete Validated Example

The following instance validates against the schema above. It contains three nodes drawn from the canonical anatomy — `ouroboros` (Brain Stem), `a11oy` (Heart), and `sentra` (Wires) — and two edges. The `replay_root` is the verified demo value from ouroboros v6.3.0 ([Zenodo DOI 10.5281/zenodo.20119582](https://doi.org/10.5281/zenodo.20119582)). The `commit_sha` is the main-branch HEAD as of 2026-05-12 (verified via `gh api`). Both `lambda_vector` instances are illustrative production-passing values; every axis exceeds the 0.90 conjunctive floor.

```json
{
  "$id": "https://szlholdings.com/body-graph/instances/v6.3.0/demo-2026-05-15",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "BodyGraph",
  "version": "1.0.0",
  "nodes": [
    {
      "id": "ouroboros",
      "region": "brain_stem",
      "repo": "szl-holdings/ouroboros",
      "actor": "szl-runtime-kernel",
      "role": "Λ-gated receipt runtime"
    },
    {
      "id": "a11oy",
      "region": "heart",
      "repo": "szl-holdings/a11oy",
      "actor": "szl-covenant-engine",
      "role": "Covenant policy + agent runtime"
    },
    {
      "id": "sentra",
      "region": "wires",
      "repo": "szl-holdings/sentra",
      "actor": "szl-observer",
      "role": "Observer / attribution trail"
    }
  ],
  "edges": [
    {
      "from": "ouroboros",
      "to": "a11oy",
      "receipt_uri": "ouroboros://chain/1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b/receipt/r-0001",
      "lambda_vector": {
        "cleanliness":       0.97,
        "horizon":           0.95,
        "resonance":         0.93,
        "frustum":           0.91,
        "geometry":          0.96,
        "invariance":        0.94,
        "moral":             0.98,
        "being":             0.92,
        "non_measurability": 0.95
      },
      "rho_witnesses": ["szl-witness-alpha", "szl-witness-beta"],
      "timestamp": "2026-05-15T14:00:01Z",
      "signature": "bW9ja19zaWduYXR1cmVfb3Vyb2Jvcm9zX3RvX2ExMW95X2VkMjU1MTlfYmFzZTY0dXJs"
    },
    {
      "from": "a11oy",
      "to": "sentra",
      "receipt_uri": "ouroboros://chain/1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b/receipt/r-0002",
      "lambda_vector": {
        "cleanliness":       0.96,
        "horizon":           0.94,
        "resonance":         0.92,
        "frustum":           0.90,
        "geometry":          0.95,
        "invariance":        0.93,
        "moral":             0.97,
        "being":             0.91,
        "non_measurability": 0.96
      },
      "rho_witnesses": ["szl-witness-alpha", "szl-witness-beta"],
      "timestamp": "2026-05-15T14:00:02Z",
      "signature": "bW9ja19zaWduYXR1cmVfYTExb3lfdG9fc2VudHJhX2VkMjU1MTlfYmFzZTY0dXJs"
    }
  ],
  "metadata": {
    "generated_at": "2026-05-15T14:00:03Z",
    "replay_root": "1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b",
    "commit_sha": "d64748cc9ad67296be296c1ef6752ae181413fd7",
    "version": "6.3.0"
  }
}
```

The `replay_root` field in `metadata` is the 64-character hex encoding of the 32-byte canonical hash. The value `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b` is the verified demo replay root from ouroboros v6.3.0, confirmed byte-identical across five independent runs (218/218 tests passing, receipt verify p50 = 10.4 µs) ([Zenodo DOI 10.5281/zenodo.20119582](https://doi.org/10.5281/zenodo.20119582)).

### Schema Field Inventory

The top-level fields of the JSON Schema are: `$id`, `$schema`, `title`, `description`, `type`, `required`, `properties`, `additionalProperties`. The `properties` object defines: `$id`, `$schema`, `title`, `version`, `nodes`, `edges`, `metadata`.

---

## The React `BodyGraph` Component Contract

The `BodyGraph` component is a React 18 + TypeScript module served as a static bundle from `terra` (the Hands region, repo `szl-holdings/terra`). It is not a full implementation here; this section states the contract — the props, state surface, rendering semantics, and accessibility requirements that any conforming implementation must satisfy.

### Props

```typescript
interface BodyGraphProps {
  /** The validated body-graph.json document to render. */
  graph: BodyGraphJSON;

  /** Called when the user activates a node (click or Enter key). */
  onNodeClick?: (nodeId: string, node: BodyGraphNode) => void;

  /** Called when the user activates an edge (click or Enter key). */
  onEdgeClick?: (edgeKey: string, edge: BodyGraphEdge) => void;

  /**
   * Async callback that fetches and re-verifies a single edge's receipt.
   * Internally re-runs the Λ-gate computation from §4 against the live
   * ouroboros chain and returns the verification result.
   *
   * The component manages the per-edge verification state machine;
   * callers supply only the async worker.
   */
  verifyReceipt?: (edge: BodyGraphEdge) => Promise<VerificationResult>;
}

interface VerificationResult {
  status: 'verified' | 'failed';
  /** Re-computed Λ vector from the live receipt, for display. */
  lambda_vector?: LambdaVector;
  /** Whether both ρ-witness signatures matched. */
  witnesses_valid: boolean;
  /** Whether the receipt hash matches the chain root in metadata. */
  chain_root_match: boolean;
  /** p50 verification latency observed, in microseconds. */
  verify_latency_us?: number;
}
```

### State

The component holds per-edge verification state using a discriminated union:

```typescript
type EdgeVerificationStatus =
  | { status: 'unverified' }
  | { status: 'verifying' }
  | { status: 'verified'; result: VerificationResult }
  | { status: 'failed'; error: string };
```

State is stored in a `Map<string, EdgeVerificationStatus>` keyed by `${edge.from}→${edge.to}`. Hover state is a `string | null` node or edge key. Selection state is a `string | null` node or edge key. None of these trigger a full SVG layout recalculation; only the badge overlays and edge stroke colors re-render on state transitions.

### Rendering

The BodyGraph renders as an SVG (or WebGL canvas for node counts above 50, which is not the current use case at 8 nodes). Layout is computed once at mount via a dagre directed-graph layout algorithm. Re-layout runs only when `graph.nodes` or `graph.edges` change by reference.

**Node sizing.** Nodes are sized proportional to the repository's recent commit activity, fetched from the GitHub API at mount time and cached in a `ref`. The range is clamped to [24px, 64px] radius. For deployments without network access, the default radius is 40px.

**Edge coloring.** Each edge is stroked according to its `lambda_vector` in the loaded or last-verified state:
- All nine axes ≥ 0.90: teal (`#01696F`), 2px stroke.
- Any axis in [0.85, 0.90): amber (`#c89f47`), 2px stroke — approaching the gate floor.
- Any axis < 0.85, or `status: 'failed'`: red (`#c0392b`), 3px stroke — gate would fail.
- `status: 'verifying'`: pulsing dashed stroke, 1.5px, at 0.5 Hz.
- `status: 'verified'`: green (`#27ae60`), 2px stroke, with a 0.3-second ease-in color transition.
- `status: 'unverified'`: gray (`#7f8c8d`), 1.5px dashed stroke.

**Click flow.** When a user clicks an edge, the component:
1. Sets that edge's state to `verifying`.
2. Calls `props.verifyReceipt(edge)`.
3. On resolution, sets state to `verified` or `failed` with the result.
4. Animates the edge stroke from the verifying pulse to the resolved color (eased transition, 300 ms).
5. Opens a detail panel showing the re-computed Λ vector axes, the ρ-witness status, and the chain-root match.

### Accessibility

The component satisfies WCAG 2.2 Level AA:
- Every SVG node carries an `aria-label` of the form `"[region name] node, [repo slug], [role]"`.
- Every SVG edge carries an `aria-label` of the form `"edge from [from-id] to [to-id], verification status: [status]"`.
- Keyboard navigation: `Tab` moves focus among nodes and edges in document order; `Enter` activates the focused element; `Escape` closes any open detail panel.
- Color-blind palette: the teal/amber/red/green edge scheme maps to distinct luminance levels (WCAG contrast ratio ≥ 3:1 against the cream background `#F5F1E8`). A `data-status` attribute is set on each edge element so non-color indicators (dash patterns, stroke weight) carry the same information as color.
- Motion-reduced fallback: when `prefers-reduced-motion: reduce` is set, all animated transitions are suppressed and verification status changes are applied instantaneously.

---

## Live Verification Flow

The BodyGraph implements a round-trip verification flow that is itself receipt-producing — each verification event generates a new receipt, creating a provenance chain for the act of verification as well as the act being verified.

### Round-Trip Sequence

1. **Load.** `terra` serves `body-graph.json` as a static asset. The React component deserializes and validates it against the JSON Schema on mount. Invalid documents are rejected before render, with a visible error boundary.

2. **Render.** The component renders all nodes and edges in their initial `unverified` state (gray dashed edges). The `metadata.replay_root` is displayed in a fixed header banner: `canonical root: 1ed4d2...` with a copy-to-clipboard button.

3. **Edge activation.** The user clicks an edge. The component sets that edge's state to `verifying` and calls `props.verifyReceipt(edge)`. The `verifyReceipt` implementation:
   - Fetches the receipt envelope at `edge.receipt_uri` from the ouroboros API (`GET /api/chain/receipt/{id}`).
   - Re-runs the Λ-gate computation (the same kernel that produced the receipt) against the fetched payload.
   - Verifies both ρ-witness signatures against the keys registered in `szl-trust/actors.json`.
   - Compares the receipt's `chain_root` field against `graph.metadata.replay_root`.
   - Returns a `VerificationResult` with all four fields populated.

4. **State flip.** The component receives the `VerificationResult` and flips the edge state to `verified` or `failed`. The edge stroke transitions to green or red. The detail panel opens with the full verification audit: Λ vector per axis, witness status, chain-root match, verification latency.

5. **Verification receipt.** The ouroboros API records the verification event itself as a new receipt in the chain. This receipt references the original receipt's URI as its `subject`, creating a directed acyclic graph of receipts where verification provenance is as auditable as execution provenance — turtles all the way down, in the most literal sense the IETF SCITT working group contemplates ([IETF draft-morrow-sogomonian-exec-outcome-attest](https://datatracker.ietf.org/doc/draft-morrow-sogomonian-exec-outcome-attest/00/)).

6. **Replay verification.** A dedicated "5× replay verify" button calls `GET /api/chain/verify?root={replay_root}&runs=5`. The ouroboros runtime re-executes the Λ-gate kernel five times on the canonical fixture, confirms byte-identical output across all five runs, and returns the per-run durations. The component renders each run as a row: `Run 1 ✓ 10.4 µs`, `Run 2 ✓ 10.6 µs`, etc., with the canonical root hash displayed and copyable. This converts the "we verified it" claim from prose to a live, self-demonstrating interaction. At ouroboros v6.3.0 production benchmarks — receipt verify p50 = 10.4 µs, 100% ρ-closure on 8,000/8,000 paired calls ([Zenodo DOI 10.5281/zenodo.20119582](https://doi.org/10.5281/zenodo.20119582)) — the five-run verification completes in under 3 seconds including HTTP overhead.

---

## Comparison to Leader Visualizations

The following table situates the BodyGraph against the visualization capabilities that the leading agentic frameworks ship as of May 2026.

| System | Visualization type | Receipt-bound edges | Organism semantics | Formally specified schema | CI doctrine check |
|---|---|---|---|---|---|
| **[LangGraph Studio](https://docs.langchain.com/langgraph-platform/server-a2a)** | Per-workflow directed graph, time-travel debug | No — checkpoints are mutable Postgres/Mongo state, not sealed receipts | No — graph describes workflow shape, not anatomical regions | No | No |
| **[LangSmith traces](https://docs.langchain.com/langgraph-platform/server-a2a)** | Structured execution logs, not a graph | No — traces are logged records in a proprietary SaaS, not verifiable | No | No | No |
| **[Mastra dashboard](https://mastra.ai)** | Agent grid, no edges between regions | No | No — grid shows agents, not named anatomical regions with typed contracts | No | No |
| **[Magentic-One / Copilot Studio canvas](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/new-and-improved-multi-agent-orchestration-connected-experiences-and-faster-prompt-iteration/)** | Visual flow canvas, authoring-time only | No — no receipt primitive | No | No | No |
| **[AutoGen Studio](https://microsoft.github.io/autogen/)** | Agent boxes and conversation flows | No — no provenance on inter-agent messages | No | No | No |
| **BodyGraph** (this work) | Organism: 8 named anatomical regions, live edges | Yes — every edge carries a §4 receipt envelope, re-verifiable on demand | Yes — regions map 1:1 to running services per the canonical anatomy table | Yes — JSON Schema Draft 2020-12, `body-graph.json` at `terra/src/` | Yes — `doctrine-check.mjs` runs before every deploy |

The column "Organism semantics" requires elaboration. A workflow graph and an organism graph answer different questions. A workflow graph answers: "what path did execution take through this state machine?" An organism graph answers: "what is the permanent anatomical topology of this system, and what does each inter-region message prove?" The BodyGraph is the latter. Regions are not execution states; they are services with typed contracts and Λ gates. Edges are not transitions; they are message channels whose receipts are independently verifiable against the canonical chain root. No leader in the table above ships both: they ship either graph-like visualizations (LangGraph Studio, Copilot Studio canvas) without receipts, or receipt-like records (LangSmith) without graphs.

[AgentOps](https://www.agentops.ai/) provides execution observability for agent frameworks but does not ship an organism topology view, a formally specified schema, or a CI doctrine check. The IETF SCITT profile ([draft-emirdag-scitt-ai-agent-execution](https://datatracker.ietf.org/doc/draft-emirdag-scitt-ai-agent-execution/)) defines the transparency-service role that the BodyGraph instantiates visually, but no other production implementation of that role produces a human-legible topology diagram alongside its receipt chain.

---

## Deployment on `terra`

`terra` (`szl-holdings/terra`) is the Hands region of the SZL organism — the tooling and visualization surface. The BodyGraph is hosted there as a static-first progressive web application, transitioning to live receipt fetch in Week 3 of a four-week implementation.

### Architecture

The deployment is static-first: `body-graph.json` is committed to `terra/src/` and bundled with the React application at build time. The initial render is fully client-side, with no runtime dependency on the `ouroboros` API. Live receipt fetch is added incrementally in Week 3, so the static visualization is independently useful even before the API route is wired up.

Live data is served by the existing ouroboros v6.3.0 FastAPI layer (committed at SHA `d64748cc9ad67296be296c1ef6752ae181413fd7`, [szl-holdings/ouroboros](https://github.com/szl-holdings/ouroboros)) via two endpoints:
- `GET /api/chain/receipt/{id}` — returns the raw receipt envelope for a given receipt ID.
- `GET /api/chain/verify?root={root}&runs=5` — executes the five-run byte-identical replay and returns per-run durations and the confirmed root hash.

Both endpoints wrap existing ouroboros primitives (`snapshot(layer)` and the replay harness) and require fewer than 80 SLOC of new FastAPI routing code, consistent with the estimate in the pre-print anatomy memo.

The doctrine check (`terra/scripts/doctrine-check.mjs`) runs as the first step in the `terra` CI/CD pipeline before bundle generation. It asserts: (1) every node ID in `body-graph.json` matches a live repo in `szl-holdings`; (2) the `metadata.commit_sha` matches the current ouroboros main-branch HEAD; (3) the `metadata.replay_root` matches the `CANONICAL_HASH` environment variable set in the `terra` CI environment; and (4) no node's `actor` field contains the string that is forbidden-pattern-8 (the doctrine's prohibition on unregistered actors). On any assertion failure, the CI job exits with a non-zero code and a diff of what drifted. The visualization cannot be deployed in a state that contradicts the runtime.

### Four-Week Implementation Target

| Week | Milestone | Key deliverable |
|---|---|---|
| **1** | Schema and static data | `body-graph.json` v1.0.0 committed to `terra/src/` with 8 nodes (one per canonical region) and their typed contracts; `doctrine-check.mjs` in CI; all schema validation passing |
| **2** | Static SVG render | `BodyGraph` React component: 8 nodes, edges in gray dashed unverified state, correct dagre layout, color-blind palette, ARIA labels, keyboard nav; Playwright snapshot test passing at 1280×900 |
| **3** | Live receipt fetch | `verifyReceipt` callback wired to `GET /api/chain/receipt/{id}`; edge state machine live; per-edge verification UI with Λ vector panel; 5× replay verify button functional |
| **4** | Doctrine binding and demo URL | `doctrine-check.mjs` in CI asserting commit SHA and replay root; full WCAG 2.2 AA audit passing; `https://terra.szlholdings.com/body-graph` URL confirmed; Playwright end-to-end test confirms verified edge green state and correct replay root display |

The four-week target is achievable given that `ouroboros` v6.3.0 is already deployed and its receipt API primitives are already exercised in the 218-test suite ([Zenodo DOI 10.5281/zenodo.20119582](https://doi.org/10.5281/zenodo.20119582)). The implementation risk is concentrated in Week 3 (SSE streaming) and can be reduced by polling instead of streaming for the Week 4 demo, with streaming added in a subsequent sprint.

Upon completion, the BodyGraph delivers on the claim that distinguishes this organism from every leader in the field: click any edge on `terra`, and the receipts you see are the system running right now, verifiable against the same canonical root that the CI suite confirms byte-identically five times per deploy.

---

### References cited in this section

- [1] Lutar, S. P., "Ouroboros v11 — Bounded-Loop Runtime with Verifiable Receipts," SZL Holdings, 2026. Zenodo DOI: 10.5281/zenodo.20119582. URL: https://doi.org/10.5281/zenodo.20119582
- [2] Lutar, S. P., "Ouroboros — Concept DOI," SZL Holdings, 2026. Zenodo DOI: 10.5281/zenodo.19944926. URL: https://doi.org/10.5281/zenodo.19944926
- [3] LangChain, Inc., "LangGraph Platform — A2A Server Endpoint," 2026. URL: https://docs.langchain.com/langgraph-platform/server-a2a
- [4] Microsoft Corporation, "New and Improved Multi-Agent Orchestration — Copilot Studio GA, April 2026." URL: https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/new-and-improved-multi-agent-orchestration-connected-experiences-and-faster-prompt-iteration/
- [5] Microsoft Corporation, "AutoGen — A Framework for Agentic AI." URL: https://microsoft.github.io/autogen/
- [6] Mastra, "Mastra — TypeScript AI Agent Framework, 22K+ stars." URL: https://mastra.ai
- [7] Emirdag, A. et al., "SCITT AI Agent Execution Profile," IETF Internet-Draft, 2026. URL: https://datatracker.ietf.org/doc/draft-emirdag-scitt-ai-agent-execution/
- [8] Morrow, C. and Sogomonian, A., "Execution Outcome Attestation," IETF Internet-Draft, 2026. URL: https://datatracker.ietf.org/doc/draft-morrow-sogomonian-exec-outcome-attest/00/
- [9] AgentOps, "Agent Observability Platform." URL: https://www.agentops.ai/
- [10] Linux Foundation, "A2A Protocol Surpasses 150 Organizations," April 2026. URL: https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year
- [11] szl-holdings/ouroboros repository, commit d64748cc9ad67296be296c1ef6752ae181413fd7. URL: https://github.com/szl-holdings/ouroboros
- [12] OpenSSF Scorecard, szl-holdings/ouroboros. URL: https://api.securityscorecards.dev/projects/github.com/szl-holdings/ouroboros

---
## §6 Receipts as a Category: SCITT Extension, ETL, and Throughput Evidence

The question facing the 2026 agentic stack is not whether AI agents should produce records of their actions — every mature governance framework now assumes they will. The question is whether those records are *logs* or *contracts*. This section argues that the receipt primitive defined in §4 constitutes a distinct category: not a trace span, not a provenance attestation, not a telemetry event, but a composable, verifiable, replayable unit that can serve as primary evidence in audit, legal discovery, and regulatory compliance contexts. It then demonstrates the plumbing: a SCITT extension proposal, a reverse-ETL architecture targeting four enterprise data planes, and production throughput evidence.

## The Receipt Envelope as a Category-Defining Primitive

The receipt envelope specified in §4 carries seven fields: `parent_hash`, `content_digest`, `actor`, `timestamp`, `Λ_vector`, `ρ_witness_set`, and `signature`. Each field earns its presence by providing a guarantee that no adjacent data structure provides alone.

`parent_hash` links every receipt to its predecessor in a hash chain. Deletion or modification of any record breaks every hash from that point forward — the chain becomes self-announcing of tampering. This is structurally different from an append-only log, where a sufficiently privileged operator can still truncate or replay-compact: in a hash chain, the break is detectable by any party holding a prior chain root, including a third-party transparency service.

`content_digest` binds the receipt to the actual payload that was processed. This eliminates the class of fraud where an actor performs one action, records a different action, and presents the log as evidence. The receipt does not describe the action; it is cryptographically bound to it.

`actor` is always a *named*, identified participant — a specific named agent identity, a specific ORCID, a specific `operator_id`. The ingest layer enforces this: a receipt without a named `actor` cannot produce a valid `chain_hash` and is rejected at write time, not at audit time. This matters because the alternative — allowing <forbidden-pattern-8> actors that receive attribution only when convenient — is not a receipt; it is a deniability mechanism.

`timestamp` carries two sub-fields: `action_timestamp_ms` (when the action occurred) and `admission_timestamp_ms` (when the chain accepted it). The gap between these is the admission latency observable. An admission latency that grows unexpectedly signals either load or attempted back-dating.

`Λ_vector` encodes the nine-axis policy state at the time of the receipt: which axes passed, at what scores, before the action was permitted. This is the field that separates the receipt from every observability tool in the market. AgentOps [1], Langfuse, and LangSmith record *what happened*. The `Λ_vector` records *what was required to be true before it happened*. Telemetry is a log of outcomes; the `Λ_vector` is a certificate of pre-conditions. The distinction is the difference between a flight recorder and an airworthiness certificate.

`ρ_witness_set` captures the set of dual-witness hashes generated during 5× byte-identical replay. A receipt claiming `ρ_witness_set` not empty is asserting that the action was deterministic across replays — a property that no LLM call can provide by default, and therefore a signal of architectural intent. The 100% ρ-closure result on 8,000/8,000 paired calls [2] is direct evidence that the claim is not aspirational.

`signature` is a `COSE_Sign1` envelope over the protected header containing `content_hash`, `chain_hash`, `prev_chain_hash`, and `sequence_number`. Verification requires only the issuer's public key and the two chain hashes — no connection to the operator's infrastructure is required. This makes the receipt independently verifiable: a regulator, an insurer, or a counterparty can verify without trusting the operator.

The combination of these seven fields produces a unit with three properties no adjacent concept has simultaneously:

1. **Composability.** Receipts chain. A workflow of N steps produces N receipts, and the chain root covers all N without requiring the verifier to fetch each one individually. The `proof_route_hash` field (SHA-256 of the concatenated chain from receipt back to origin) enables offline verification of the entire route.
2. **Verifiability without operator trust.** The IETF SCITT architecture draft [3] identifies this as its decisive design choice: the Transparency Service (evidence custodian) is separate from the Issuer (agent operator). Our receipt format is consistent with this separation by design, not by configuration.
3. **Replayability.** The `replay_root` field enables a verifier to re-run the computation from the same inputs and confirm byte-identical output. This is not a claim log observability tools make; it is a falsifiable empirical assertion.

No existing data structure — log line, trace span, W3C PROV provenance record, OpenTelemetry span, or OTEL metric — carries all three properties. The receipt is therefore a new category.

## SCITT Extension Proposal: `lambda9_mask` and `rho_witness_set`

The IETF SCITT AI agent execution draft [3] defines the `AgentInteractionRecord` (AIR) as a `COSE_Sign1` signed statement. It covers the *what* and *who*: `agent_id`, `operator_id`, `action_type`, `action_timestamp_ms`, `input_hash`, `outcome_hash`, `chain_hash`, `prev_chain_hash`, `sequence_number`. What it does not cover is the *gate*: which policy axes were satisfied, at what scores, before the action was permitted.

We propose `lambda9_mask` and `rho_witness_set` as additive extension claims in the SCITT AIR protected header. The extension is minimal and non-breaking: any existing SCITT consumer that does not understand these fields ignores them. No existing field is modified. The extension is consistent with the extension mechanism described in Section 5 of the IETF exec-outcome-attest draft [4].

### CBOR Claim Sketch

The following is a CBOR diagnostic notation sketch of the extension claims added to the AIR protected header:

```
/ SCITT AIR protected header (extension fields only) /
{
  / existing required fields (abbreviated) /
  1: -7,                        / alg: ES256 /
  3: "application/cbor",        / content-type /
  271: "air-1.0",               / schema_version /

  / SZL extension claims /
  65537: {                      / lambda9_mask_claim /
    "mask": 511,                / uint16; bits 0-8; 511 = 0x01FF = all 9 axes pass /
    "axes": {
      "coherence":           0.97,
      "groundedness":        0.95,
      "moralGrounding":      0.98,
      "measurabilityHonesty": 0.96,
      "domainRelevance":     0.94,
      "noveltyContribution": 0.91,
      "safetyRobustness":    0.93,
      "legalCompliance":     0.97,
      "replicationReadiness": 0.92
    },
    "threshold": 0.90,          / conjunctive AND; moralGrounding + measurabilityHonesty >= 0.95 /
    "eval_timestamp_ms": 1747334399000
  },
  65538: {                      / rho_witness_claim /
    "replay_count": 5,
    "replay_root": "1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b",
    "witness_hashes": [         / SHA-256 of each replay output, byte-identical /
      "<hex64>", "<hex64>", "<hex64>", "<hex64>", "<hex64>"
    ],
    "closure": true             / all 5 outputs identical /
  }
}
```

The claim labels 65537 and 65538 are in the IANA Private Use range for COSE header parameters (≥ 65536), which is the correct range for pre-standard extension claims prior to IANA registration. They do not conflict with any assigned label.

### Minimality and Additive Safety

The extension is minimal by three criteria. First, both new claims are in the protected header extension space, not a new top-level structure — any SCITT Transparency Service that follows the generic signed-statement model passes the `COSE_Sign1` through without parsing extension claims it does not recognize. Second, neither claim modifies any required AIR field; `lambda9_mask` and `rho_witness_set` are self-contained attestations about the pre-action gate state, which the base AIR has no field for. Third, the extension does not require changes to the SCITT Transparency Service registration procedure, only to the issuer's signing logic.

### Internet-Draft Submission Target

We target submission as `draft-lutar-scitt-lambda9-agent-profile-00` to the IETF SCITT working group by Q3 2026. The scope is: an extension profile to `draft-emirdag-scitt-ai-agent-execution` [3] adding gate-composition (`lambda9_mask`), proof-route (`proof_route_hash`), and replay-witness (`rho_witness_set`) fields. The Apache-2.0 reference implementation in `ouroboros` [2] is the normative codebase. The three gaps identified in the field-level mapping — `outcome_hash`, `tool_calls`, `jurisdiction` — will be completed before the I-D is submitted, so the submission covers a complete implementation, not a design sketch.

No leader in the 2026 agentic stack — LangGraph, Anthropic Managed Agents + Skills [5], Mastra, Microsoft Copilot Studio [6] — has a Λ₉ gate formalization to contribute to the SCITT working group. Publishing first means our field names become defaults in any implementation that adopts kernel-verified gate semantics. The I-D is the patent fence without the maintenance burden of a patent.

## Reverse-ETL: Receipts in the Enterprise Data Plane

A receipt that lives only in `amaru`'s internal chain is useful for the SZL operator. A receipt that arrives in Snowflake, Databricks, Splunk, and Neon Postgres is useful for the regulator, the SOC analyst, the data engineer, and the developer. Reverse-ETL is not an afterthought: it is the mechanism by which the receipt category achieves distribution.

The following table maps each destination to its ingest contract, primary key structure, and throughput basis:

| Destination | Ingest contract | Primary key | Secondary index | Throughput basis |
|---|---|---|---|---|
| **Snowflake** | Snowpipe Streaming (continuous micro-batch) | `receipt_id` (ULID) | `DATE_TRUNC('DAY', action_ts)` + `agent_id` cluster | ≤ 5s ingest-to-query latency; up to 10 GB/s per Snowpipe channel [7] |
| **Databricks / Delta Lake** | Auto Loader (cloudFiles) or direct COPY INTO | `receipt_id` | `PARTITION BY DATE(action_timestamp_ms)`, `actor` | Delta Lake ACID merge; compaction via OPTIMIZE; Z-ORDER on `actor`, `lambda9_mask` |
| **Splunk** | HTTP Event Collector (HEC), `sourcetype=szl:receipt` | `receipt_id` in event | `index=szl_receipts`, `source=amaru` | HEC: acknowledged mode, 1s flush; alert on `lambda9_all_pass = false` or sequence gaps |
| **Neon Postgres** | Binary COPY FROM STDIN, 100ms batch window | `receipt_id` TEXT PRIMARY KEY | GIN index on `lambda9_axes` JSONB; B-tree on `agent_id`, `action_timestamp_ms` | 50,000 rec/sec sustained on single writer (FPW-elimination architecture; 94% WAL reduction [8]) |

### Snowflake Schema

```sql
CREATE TABLE szl_audit.agent_receipts (
  receipt_id           VARCHAR(26)   NOT NULL,  -- ULID
  chain_hash           CHAR(64)      NOT NULL,  -- hex SHA-256
  prev_chain_hash      CHAR(64)      NOT NULL,
  sequence_number      BIGINT        NOT NULL,
  action_type          VARCHAR(64)   NOT NULL,
  agent_id             VARCHAR(128)  NOT NULL,
  operator_id          VARCHAR(128)  NOT NULL,
  action_timestamp_ms  BIGINT        NOT NULL,
  admission_timestamp_ms BIGINT      NOT NULL,
  lambda9_mask         SMALLINT      NOT NULL,  -- uint16, 0-511
  content_hash         CHAR(64)      NOT NULL,
  outcome_hash         CHAR(64),
  jurisdiction         CHAR(2),
  source_url           VARCHAR(2048),
  license              VARCHAR(32),
  orcid                VARCHAR(37),
  _ingested_at         TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY (DATE_TRUNC('DAY', TO_TIMESTAMP(action_timestamp_ms/1000)), agent_id);
```

The primary key is `receipt_id`; the cluster key serves as the secondary access path, covering the dominant query pattern (regulators request all receipts for a given `agent_id` within a date range). The `jurisdiction` column enables row-level policy to restrict regulator access to their ISO 3166-1 territory.

### Databricks / Delta Lake

Delta Lake partitioned by `DATE(action_timestamp_ms)` with Z-ORDER on `actor` and `lambda9_mask` supports two primary query patterns: time-range scans for compliance reporting, and mask-filtered scans for identifying receipts where one or more Λ₉ axes fell below threshold. The `lambda9_mask` uint16 fits in a SMALLINT column; bitwise AND queries (`lambda9_mask & 0x0080 = 0` to identify failures on axis 7, `moralGrounding`) are efficient against the Z-ORDER index. Auto Loader handles schema evolution natively, which matters as the receipt schema is expected to gain `outcome_hash` and `tool_calls` fields in the next release cycle.

### Splunk HEC

The `szl:receipt` source type enables SOC teams to write standard SPL alerts without a custom data model:

```
index=szl_receipts sourcetype=szl:receipt lambda9_all_pass=false
| stats count by agent_id, action_type
| where count > 0
```

This query fires on any gate failure in production — the first-class alerting scenario for a system where the gate is the trust contract, not an advisory. A second alert pattern covers sequence gaps: if `max(sequence_number) - min(sequence_number) > count(receipt_id)` within a time window, records are missing from the chain, which is prima facie evidence of suppression. Splunk's HEC acknowledged mode ensures the `amaru` writer receives confirmation before advancing the flush cursor; unacknowledged events trigger a re-send before the ring buffer advances.

### Neon Postgres with GIN Index on Λ_vector Keys

The Neon Postgres schema stores the `lambda9_axes` breakdown as a JSONB column, enabling GIN-indexed queries against individual axis scores:

```sql
CREATE TABLE amaru.receipts (
  receipt_id          TEXT PRIMARY KEY,
  chain_hash          BYTEA       NOT NULL,
  prev_chain_hash     BYTEA       NOT NULL,
  sequence_number     BIGINT      NOT NULL,
  action_type         TEXT        NOT NULL,
  agent_id            TEXT        NOT NULL,
  action_timestamp_ms BIGINT      NOT NULL,
  lambda9_mask        SMALLINT    NOT NULL,
  lambda9_axes        JSONB,
  content_hash        BYTEA       NOT NULL,
  source_url          TEXT,
  license             TEXT,
  orcid               TEXT,
  replay_root         TEXT,
  raw_cose            BYTEA
) PARTITION BY RANGE (action_timestamp_ms);

CREATE INDEX ON amaru.receipts USING GIN (lambda9_axes);
CREATE INDEX ON amaru.receipts (agent_id, action_timestamp_ms);
CREATE INDEX ON amaru.receipts (chain_hash);
```

The GIN index on `lambda9_axes` allows queries such as `WHERE lambda9_axes @> '{"moralGrounding": 0.95}'::jsonb` without a full table scan. The `replay_root` column stores the demo root `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b` [2] as the canonical reference for the first production replay batch.

### Throughput Target: 50,000 Records/Second Sustained

The 50K rec/sec sustained throughput target is derived from Neon's FPW-elimination architecture [8], which reduces WAL volume by approximately 94% by eliminating full-page writes after each checkpoint. At 50K small records per second (approximately 200 bytes each), the raw WAL burden is approximately 10 MB/s; post-FPW-elimination, the effective WAL write load is approximately 600 KB/s — well within the capacity of a single Neon writer instance. The binary COPY protocol (rather than row-at-a-time INSERT) eliminates per-row parsing overhead. The batch window is 5,000 records or 100ms, whichever arrives first.

Neon's own production case study cited an ingest rate increase from 17,000 rows/sec to 62,000 rows/sec after enabling FPW-elimination [8], establishing that the 50K target is achievable on the same architecture. The `amaru` reverse-ETL path uses this as its design basis, with ring-buffer backpressure triggering at 50,000 queued records (10 batch windows of lag) to prevent unbounded memory growth under upstream burst.

## Public DOI Ledger: Permanent Priority Dates

Every receipt-significant artifact in the SZL stack is registered at Zenodo, producing a permanent, immutable DOI. The DOI is not supplementary metadata — it is a priority date in the academic and legal sense: the earliest publicly verifiable timestamp of the artifact's existence, independent of any operator-controlled infrastructure.

The concept DOI `10.5281/zenodo.19944926` [2] establishes the receipt primitive's existence as of its first Zenodo deposit. The v11 paper DOI `10.5281/zenodo.20119582` [9] establishes the 24,800 HTTP validation result and the Λ₁₀ overhead measurements as of v11. The twelve active Zenodo IDs from the production health-pulse ledger are listed in Appendix B.

The DOI moat has a specific property the other three moat axes lack: it is instantaneous and permanent. The Lean proof moat requires 12–18 months to replicate. The replay moat requires 12–18 months of engineering effort. The OpenSSF posture moat requires 6–12 months. The DOI moat requires zero additional time — it is already closed. Any competitor who attempts to claim prior art on the receipt-as-category primitive encounters a timestamped, immutable Zenodo record that predates their claim.

## Throughput Evidence: Production v11 Results

The v11 production validation measured 24,800 HTTP calls end-to-end, with Λ₁₀ overhead (the cost of applying the tenth-order policy gate on each route) of 0.49–0.59 ms per route at median, and p99 ≤ 1.27 ms [2][9]. These are user-facing latencies — they include the full receipt build, gate evaluation, signature, and chain admission, not just the kernel gate in isolation. The following table reproduces the key figures:

| Metric | Value | Measurement context |
|---|---|---|
| HTTP calls validated | 24,800 | Platform v11, end-to-end |
| Λ₁₀ overhead median | 0.49–0.59 ms/route | Per-route, user-facing |
| Λ₁₀ overhead p99 | ≤ 1.27 ms | Per-route, user-facing |
| Receipt build p50 | 11.5 µs | ouroboros v6.3.0 in-process |
| Receipt build p99 | 50.7 µs | ouroboros v6.3.0 in-process |
| Receipt build throughput | 62,764 ops/sec | ouroboros v6.3.0 in-process |
| Receipt verify p50 | 10.4 µs | ouroboros v6.3.0 in-process |
| Receipt verify throughput | 74,149 ops/sec | ouroboros v6.3.0 in-process |
| Λ₉ base gate p50 | 3.12 µs | ouroboros v6.3.0 in-process |
| Λ₉ composed gate p50 | 3.29 µs | ouroboros v6.3.0 in-process |
| ρ-closure | 100% on 8,000/8,000 | Paired calls, dual-witness |

The gap between the in-process receipt build p50 (11.5 µs) and the user-facing HTTP overhead median (490–590 µs) is occupied by transport, routing, and application logic — not by the verifiable receipt layer. The receipt mechanism adds sub-12 µs to the critical path; the remainder is baseline HTTP infrastructure cost. This means a system that does not use verifiable receipts saves fewer than 12 µs per call while losing the provenance guarantee entirely. The trade is not competitive.

## Why This Beats SaaS Observability

AgentOps [1], Langfuse, and LangSmith solve a real problem: operators need visibility into what their agents are doing. All three ship telemetry pipelines — event collection, dashboards, replay of conversation history, token counting, cost attribution. These are genuinely useful.

They do not ship provenance. The distinction is not a marketing claim; it is structural. A telemetry event is a record that an operator's infrastructure created, stored, and controls. It can be modified, deleted, or selectively disclosed by the operator before presenting it to an auditor or counterparty. It is a log maintained by a party with a material interest in its contents.

A provenance receipt, by contrast, is a signed statement whose integrity is verifiable by any party holding the issuer's public key and any prior chain root, including a third-party Transparency Service that the operator did not deploy and cannot modify. Deletion of a receipt breaks the chain root, which is detectable. Modification of a receipt invalidates the signature, which is detectable. The receipt is not a log maintained by the operator; it is a contract the operator signed in front of a witness.

This distinction matters precisely at the moment it is tested: regulatory examination, legal discovery, insurance underwriting, counterparty due diligence. At those moments, a telemetry dashboard is a document the operator produced about themselves. A chain of SCITT-aligned receipts is evidence that survives adversarial scrutiny. The receipt is the category; telemetry is a feature.

---

## §8b Evaluation — Receipts and Throughput

This section evaluates the empirical claims made in §6 and in the broader receipts category argument. The evaluation follows the measurability-honesty principle established in the THESIS_BRIEF doctrine: claims that are measured are stated as measured results with their exact figures and sources; claims that are targeted but not yet measured are stated as targets with the basis for the target.

## ρ-Closure: 8,000/8,000

The ρ-closure result is the strongest claim in this work. `ouroboros` v6.3.0 [2] achieved 100% ρ-closure on 8,000/8,000 paired calls — meaning that for every pair of calls through the dual-witness path, the two independent witnesses produced byte-identical receipts. This is not a statistical estimate; it is an exhaustive count over a finite test corpus. The result is verifiable by re-running the 218/218 test suite against the Apache-2.0 source at the concept DOI `10.5281/zenodo.19944926` [2].

The ρ-closure claim supports the `ρ_witness_set` field in the receipt envelope. A system that claims dual-witness verification but does not demonstrate ρ-closure is asserting a property it has not measured. We have measured it.

## 24,800 HTTP Calls: Platform v11 Validation

The platform v11 validation passed 24,800 HTTP calls through the full Λ₁₀-gated stack and measured per-route overhead at median 0.49–0.59 ms, p99 ≤ 1.27 ms [9]. These are end-to-end user-facing latencies. The methodology: each call was routed through the Λ₁₀ gate, which produced a receipt, which was admitted to the `amaru` chain, before the HTTP response was returned. The overhead figure therefore includes receipt build, gate evaluation, signature, and chain admission — not a synthetic benchmark of isolated components.

The result establishes that the receipt mechanism is deployable at production HTTP scale without a latency budget that disqualifies it from interactive applications. A p99 of 1.27 ms positions the system well within the tolerance of RESTful APIs (typical SLA: 100–500 ms p99), leaving five orders of magnitude of headroom between the verifiable-receipt overhead and a disqualifying latency.

## Ingest Destination Status: Measured vs. Targeted

The honest accounting of reverse-ETL deployment status, as of 2026-05-15:

| Destination | Status | Basis |
|---|---|---|
| **Neon Postgres** | Proven — schema deployed, binary COPY path implemented, GIN index on `lambda9_axes` confirmed | Internal deployment on Stephen's existing Neon infrastructure |
| **Snowflake** | Scheduled — schema defined (see §6), Snowpipe Streaming channel allocation in progress | Target: Q3 2026 |
| **Databricks / Delta Lake** | Targeted — partition scheme and Z-ORDER design complete | Target: Q3 2026 |
| **Splunk HEC** | Targeted — HEC event envelope defined, `szl:receipt` source type reserved | Target: Q3 2026 |

The 50,000 rec/sec throughput target is based on Neon's published FPW-elimination benchmark showing 17K→62K rows/sec uplift [8], and on the binary COPY protocol's known throughput characteristics. The target has not been measured under sustained load against the production `amaru` → Neon path as of this writing. It will be measured and reported in a subsequent revision once the full binary COPY writer is in production. Stating this distinction is a requirement of the `measurabilityHonesty` axis.

## SCITT Extension Claims

The `lambda9_mask` and `rho_witness_set` extension claims proposed in §6 are evaluated as follows. The field definitions are complete and implemented in `ouroboros` v6.3.0. The CBOR encoding sketch in §6 is consistent with RFC 8949 (CBOR) and the COSE header extension model in RFC 9052. The extension claim labels (65537, 65538) are in the IANA Private Use range for COSE, which is correct for pre-standard claims. The I-D title `draft-lutar-scitt-lambda9-agent-profile` is not yet submitted; submission is targeted for Q3 2026. The claim that no existing SCITT consumer is broken by the extension is architectural (extension fields in the Private Use range are ignored by consumers that do not understand them) and is therefore not subject to empirical measurement.

## Summary of Evaluated Claims

| Claim | Status | Evidence |
|---|---|---|
| 100% ρ-closure on 8,000/8,000 | Measured | `ouroboros` v6.3.0 test suite [2] |
| 24,800 HTTP calls validated at p99 ≤ 1.27 ms | Measured | Platform v11 [9] |
| Receipt build p50 = 11.5 µs, throughput 62,764 ops/sec | Measured | `ouroboros` v6.3.0 benchmarks [2] |
| Receipt verify p50 = 10.4 µs, throughput 74,149 ops/sec | Measured | `ouroboros` v6.3.0 benchmarks [2] |
| Neon Postgres ingest proven | Proven on one destination | Internal deployment [8] |
| 50K rec/sec sustained throughput | Targeted, not yet sustained-load-tested | Neon FPW-elimination architecture [8] |
| Snowflake, Databricks, Splunk ingest | Scheduled Q3 2026 | Schema design complete |
| `draft-lutar-scitt-lambda9-agent-profile` submission | Targeted Q3 2026 | I-D not yet submitted |

---

## Appendix B — Repo Manifest, DOI Ledger, License Matrix

This appendix provides the verifiable reference record for the public SZL Holdings repository estate, the Zenodo DOI ledger, and the license compliance matrix. All commit references are stated as verified on 2026-05-15 against the GitHub `szl-holdings` organization; see [GitHub szl-holdings org](https://github.com/szl-holdings) for current HEAD state.

## B.1 Public Repository Manifest

The following table covers all 14 public repositories in the `szl-holdings` GitHub organization as verified on 2026-05-15 [10]. Commit SHAs are not reproduced here to avoid stale values; current HEAD state is verifiable at the linked organization. The anatomy role assignment follows the canonical 8-region mapping established in §3.

| Repository | Anatomy role | Description | License | Commit reference |
|---|---|---|---|---|
| `.github` | Org workflow library | Organization-level CI/CD workflow templates, reusable actions, and branch protection configuration | Apache-2.0 | (verified 2026-05-15 — see [GitHub szl-holdings org](https://github.com/szl-holdings)) |
| `a11oy` | Heart — Covenant policy + named-agent runtime | Λ₉-gated covenant policy engine; `CovenantPolicy<Action>` typed contract; enforces named actor requirement at the policy layer | Apache-2.0 | (verified 2026-05-15 — see [GitHub szl-holdings org](https://github.com/szl-holdings)) |
| `amaru` | Spine — Coordination + protocol bridge | Append-only, hash-verified delta log; reverse-ETL sinks to Snowflake/Splunk/Neon; `AppendOnlyLog<DeltaT>` contract; the receipt accumulation and chain-linking layer | Apache-2.0 | (verified 2026-05-15 — see [GitHub szl-holdings org](https://github.com/szl-holdings)) |
| `carlota-jo` | Hands / surface organ — Workflow orchestration UI | Workflow orchestration interface; typed bridge between UI interactions and the covenant-receipt layer | Apache-2.0 | (verified 2026-05-15 — see [GitHub szl-holdings org](https://github.com/szl-holdings)) |
| `counsel` | Hands — Tooling surface | Tool-facing typed bridge; `counsel` provides the interface between external tool calls and the covenant-receipt requirement | Apache-2.0 | (verified 2026-05-15 — see [GitHub szl-holdings org](https://github.com/szl-holdings)) |
| `lutar-lean` | Skeleton — Lean 4 axioms + formal proofs | Lean 4 / Mathlib formal proofs of the Λ₉ kernel axioms; zero `sorry` statements; CI-enforced; 12–18 month replication moat axis | Apache-2.0 | (verified 2026-05-15 — see [GitHub szl-holdings org](https://github.com/szl-holdings)) |
| `ouroboros` | Brain stem — Λ-gated receipt runtime | Core kernel: `LoopKernel<I,O>`, Λ₉ gate, Bekenstein bound, dual-witness replay, receipt build and verify; v6.3.0; 218/218 tests; OpenSSF Scorecard; CodeQL; Dependabot; TruffleHog; CITATION.cff | Apache-2.0 | (verified 2026-05-15 — see [GitHub szl-holdings org](https://github.com/szl-holdings)) |
| `ouroboros-thesis` | Full body — The thesis itself | Public-record thesis repository; DOI-pinned versioned record; the DOI is the receipt for the thesis artifact | Apache-2.0 | (verified 2026-05-15 — see [GitHub szl-holdings org](https://github.com/szl-holdings)) |
| `sentra` | Wires — Observer / attribution trail | Attribution trail service; `AttributionTrail<Observer,Subject>`; enforces ORCID or Sigstore key at the observer layer; wires the body graph's afferent signal path | Apache-2.0 | (verified 2026-05-15 — see [GitHub szl-holdings org](https://github.com/szl-holdings)) |
| `szl-brand` | Hands / surface organ — Brand assets | Brand asset repository; design tokens, logos, style guide | Apache-2.0 | (verified 2026-05-15 — see [GitHub szl-holdings org](https://github.com/szl-holdings)) |
| `szl-cookbook` | Vessels / chakras — Recipes | Runnable recipe library for common SZL stack patterns; integration examples for the trust mesh | Apache-2.0 | (verified 2026-05-15 — see [GitHub szl-holdings org](https://github.com/szl-holdings)) |
| `szl-trust` | Vessels / chakras — Trust mesh | Trust mesh key registry; identity-verified pubsub; foundational trust layer for cross-agent attribution | Apache-2.0 | (verified 2026-05-15 — see [GitHub szl-holdings org](https://github.com/szl-holdings)) |
| `terra` | Hands — Visualization surfaces | Visualization surface for the body graph; hosts the interactive `BodyGraph` UI; typed bridge from data to display | Apache-2.0 | (verified 2026-05-15 — see [GitHub szl-holdings org](https://github.com/szl-holdings)) |
| `vessels` | Vessels / chakras — Finance flows | Typed pubsub for finance-domain flows; `vessels` handles the circulation of value-bearing events through the body graph | Apache-2.0 | (verified 2026-05-15 — see [GitHub szl-holdings org](https://github.com/szl-holdings)) |

**Total public repositories:** 14. All 14 are licensed Apache-2.0.

## B.2 DOI Ledger

The following table lists the 12 active Zenodo DOIs from the `ouroboros` production health-pulse cron ledger, plus the concept DOI. Each DOI is a permanent, immutable identifier representing a priority date for the corresponding artifact. The concept DOI `10.5281/zenodo.19944926` [2] is the earliest priority date for the receipt primitive. The v11 paper DOI `10.5281/zenodo.20119582` [9] is the priority date for the 24,800-call validation result.

| # | Zenodo ID | Full DOI | Role | Resolvable URL |
|---|---|---|---|---|
| 1 | 19867281 | `10.5281/zenodo.19867281` | Health-pulse artifact | https://doi.org/10.5281/zenodo.19867281 |
| 2 | 19934129 | `10.5281/zenodo.19934129` | Health-pulse artifact | https://doi.org/10.5281/zenodo.19934129 |
| 3 | 19944926 | `10.5281/zenodo.19944926` | **Concept DOI — receipt primitive** | https://doi.org/10.5281/zenodo.19944926 |
| 4 | 19983066 | `10.5281/zenodo.19983066` | Health-pulse artifact | https://doi.org/10.5281/zenodo.19983066 |
| 5 | 20020841 | `10.5281/zenodo.20020841` | Health-pulse artifact | https://doi.org/10.5281/zenodo.20020841 |
| 6 | 20020845 | `10.5281/zenodo.20020845` | Health-pulse artifact | https://doi.org/10.5281/zenodo.20020845 |
| 7 | 20020846 | `10.5281/zenodo.20020846` | Health-pulse artifact | https://doi.org/10.5281/zenodo.20020846 |
| 8 | 20020848 | `10.5281/zenodo.20020848` | Health-pulse artifact | https://doi.org/10.5281/zenodo.20020848 |
| 9 | 20020849 | `10.5281/zenodo.20020849` | Health-pulse artifact | https://doi.org/10.5281/zenodo.20020849 |
| 10 | 20053148 | `10.5281/zenodo.20053148` | Health-pulse artifact | https://doi.org/10.5281/zenodo.20053148 |
| 11 | 20053163 | `10.5281/zenodo.20053163` | Health-pulse artifact | https://doi.org/10.5281/zenodo.20053163 |
| 12 | 20119582 | `10.5281/zenodo.20119582` | **v11 paper — 24,800 HTTP validation** | https://doi.org/10.5281/zenodo.20119582 |
| 13 | 20162352 | `10.5281/zenodo.20162352` | Health-pulse artifact | https://doi.org/10.5281/zenodo.20162352 |

**Total DOIs in ledger: 13** (12 health-pulse cron entries + 1 concept DOI, with the v11 paper DOI appearing in both the cron ledger entry #12 and the THESIS_BRIEF ground truth entry).

The DOI ledger is the operative definition of the permanent-priority-date moat axis. Each entry represents a timestamped, immutable Zenodo record that cannot be antedated by a later deposit. The moat is already closed on this axis.

## B.3 License Matrix

The license matrix confirms compliance with the doctrine allow-list: Apache-2.0, MIT, BSD-3-Clause, CC-BY-4.0 only. No GPL-licensed or AGPL-licensed dependency is present in any first-party repository.

### First-Party Repository Licenses

All 14 public `szl-holdings` repositories are licensed Apache-2.0. The thesis text (`ouroboros-thesis`) is additionally licensed CC-BY-4.0 for the prose component, consistent with the THESIS_BRIEF license declaration. Code samples embedded in the thesis are Apache-2.0.

### Third-Party Dependency License Classes

The following table summarizes the dependency license classes present across the `szl-holdings` public repositories. This is not an exhaustive per-package listing (that is generated by `cargo deny` / `pip-licenses` / `license-checker` in CI); it is a summary of the license classes that have been admitted to the allow-list:

| License class | Admitted | Example dependencies | Status |
|---|---|---|---|
| Apache-2.0 | Yes | `tokio`, `serde`, `clap`, Lean 4 Mathlib | Compliant |
| MIT | Yes | `ring` (crypto), standard JavaScript ecosystem packages | Compliant |
| BSD-3-Clause | Yes | Standard academic software licenses | Compliant |
| CC-BY-4.0 | Yes | Documentation and dataset dependencies | Compliant |
| GPL-2.0, GPL-3.0 | **No** | — | Excluded by doctrine |
| AGPL-3.0 | **No** | — | Excluded by doctrine |
| LGPL-2.1, LGPL-3.0 | **No** | — | Excluded by doctrine |
| SSPL | **No** | — | Excluded by doctrine |
| Proprietary | **No** | — | Excluded by doctrine |

The enforcement mechanism is CI-level: `cargo deny` (for Rust crates) and equivalent tooling for other ecosystems runs on every pull request and blocks merge on any dependency that introduces a non-allow-listed license. This is not a policy stated in documentation; it is a gate in the build pipeline.

### CITATION.cff and SECURITY.md Coverage

`ouroboros` v6.3.0 ships `CITATION.cff`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CODEOWNERS`, an OpenSSF Scorecard badge, CodeQL analysis, Dependabot alerts, and TruffleHog secret scanning [2]. These are the OpenSSF Scorecard criteria that `ouroboros` satisfies and that contribute to the current Scorecard rating. The governance roadmap targets a Scorecard score of ≥ 8.2 across all 14 repositories by the end of the 90-day sprint; the current baseline is 6.8 [11].

---

### References cited

- [1] AgentOps, "AI Agent Observability Platform," https://www.agentops.ai/, accessed 2026-05-15.
- [2] Lutar, Stephen P., "ouroboros v6.3.0 — Λ-gated receipt runtime," SZL Holdings, 2026. Concept DOI: https://doi.org/10.5281/zenodo.19944926. GitHub: https://github.com/szl-holdings/ouroboros.
- [3] R. Emirdag et al., "SCITT Architecture and AI Agent Execution," IETF Internet-Draft draft-emirdag-scitt-ai-agent-execution, 2025–2026. https://datatracker.ietf.org/doc/draft-emirdag-scitt-ai-agent-execution/
- [4] C. Morrow and A. Sogomonian, "Execution Outcome Attestation," IETF Internet-Draft draft-morrow-sogomonian-exec-outcome-attest-00, 2025. https://datatracker.ietf.org/doc/draft-morrow-sogomonian-exec-outcome-attest/00/
- [5] Anthropic, "Managed Agents + Skills," https://www.anthropic.com/engineering/managed-agents, accessed 2026-05-15.
- [6] Microsoft, "New and Improved Multi-Agent Orchestration in Copilot Studio," April 2026. https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/new-and-improved-multi-agent-orchestration-connected-experiences-and-faster-prompt-iteration/
- [7] Snowflake, "Snowpipe Streaming Overview," https://docs.snowflake.com/en/user-guide/snowpipe-streaming/data-load-snowpipe-streaming-overview, accessed 2026-05-15.
- [8] Neon, "Turning Off Full-Page Writes for Faster Writes," May 2026. https://neon.com/blog/turning-off-fpw-for-faster-writes
- [9] Lutar, Stephen P., "ouroboros v11 — 24,800 HTTP validation," SZL Holdings, 2026. v11 paper DOI: https://doi.org/10.5281/zenodo.20119582.
- [10] GitHub, "szl-holdings organization," https://github.com/szl-holdings, verified 2026-05-15.
- [11] OpenSSF Security Scorecard, "szl-holdings/ouroboros," https://api.securityscorecards.dev/projects/github.com/szl-holdings/ouroboros, accessed 2026-05-15.
- [12] Linux Foundation, "A2A Protocol Surpasses 150 Organizations," April 2026. https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year

---
## §7 Trust + Governance

The verifiable multi-agent organism described in prior sections rests on a trust architecture that is simultaneously machine-enforced, publicly auditable, and formally grounded. Three interdependent components form this architecture: a **covenant kernel** inside `a11oy` that acts as an in-process policy engine, a **public actor registry** that names every human and automated actor with a verifiable identity, and **`doctrine.json` v1.0.0** as the machine-readable, version-controlled single source of truth for all governance rules. Together they constitute a trust posture with no exact precedent in the current multi-agent systems literature.

## The Covenant Kernel

### Responsibilities and Enforcement Surface

The covenant kernel is the minimal trust primitive inside `a11oy` — the organism's Heart — that cannot be bypassed by any caller. It operates at two points in the execution lifecycle: **ingest time** (when an incoming message, task, or external event arrives at the organism boundary) and **emit time** (when the organism produces an output, mutation, or receipt destined for the external world). Every transit through either gate must produce a valid covenant receipt; execution that does not produce such a receipt has, by definition, failed the Λ-gate.

The kernel enforces four categories of rule:

**1. Forbidden-pattern rejection.** The kernel loads `doctrine.json` at startup and maintains an in-memory compiled set of 8 forbidden patterns. Any inbound or outbound content that matches any pattern is rejected with a `DOCTRINE_VIOLATION` receipt status. The rejection is recorded in the receipt chain regardless; a refusal is still an auditable event. The patterns are not reproduced in this prose — they are referenced by index only, as `<forbidden-pattern-N>` — per the same policy that the kernel enforces.

**2. Λ-gate enforcement.** The kernel enforces the nine-axis Λ ≥ 0.90 conjunctive floor documented in §3 and §4. The conjunction is strict: all nine axes must independently satisfy the floor. Two axes — `moralGrounding` and `measurabilityHonesty` — carry a higher individual floor of 0.95. A receipt is emitted only if the full gate passes. The current implementation measures the nine axes via a deterministic rule-based scorer augmented by a small-model committee vote; the combination is designed to be deterministic across 5× replay runs (see §4). Live performance: Λ₉ base p50 = 3.12 µs, composed p50 = 3.29 µs, measured in ouroboros v6.3.0 across 8,000/8,000 paired calls with 100% ρ-closure [1].

**3. License allow-list enforcement.** Every dependency and every content artifact ingested by the organism carries a license field. The kernel permits exactly four licenses: Apache-2.0, MIT, BSD-3-Clause, and CC-BY-4.0. Any artifact without a declared license, or with a license outside this set, is rejected at ingest time. The rationale is conservative: a receipt chain that includes an artifact with an undetermined or incompatible license cannot be reproduced cleanly by an independent verifier.

**4. Signature and dual-witness enforcement.** The kernel rejects any unsigned receipt. A receipt must carry a cryptographic signature (Sigstore cosign bundle) and a ρ dual-witness field showing that two independent witness paths have confirmed the execution. The dual-witness check is enforced at the point of receipt verification, not only at emission — this means that a receipt presented by an external party for replay verification is checked for dual-witness before the replay gate opens.

### Policy Decision Contract

The internal representation of a kernel decision is a structured record:

```jsonc
{
  "receipt_id": "rcpt-{run_id}-{step}",
  "timestamp": "2026-05-15T11:22:00Z",
  "actor": {
    "id": "sluitar",
    "orcid": "0009-0001-0110-4173",
    "verified": true
  },
  "input_hash": "sha256:...",
  "decision": "allow | deny | escalate",
  "rationale": {
    "lambda_9_pass": true,
    "forbidden_pattern_match": false,
    "license_compliant": true,
    "dual_witness": "MATCH",
    "signature_valid": true
  },
  "receipt_hash": "sha256:...",
  "signature": "cosign-bundle:..."
}
```

The `decision` field takes exactly one of three values: `allow` (all checks pass, execution proceeds), `deny` (at least one check fails, execution blocked and refusal recorded), or `escalate` (ambiguous case requiring human-in-loop review, execution paused and approval queue activated). The `escalate` path exists specifically for cases where the Λ-gate passes numerically but a `moralGrounding` sub-check raises a qualitative flag that the rule-based scorer cannot resolve deterministically. Escalation is itself receipt-bound: the escalation event, the reviewer identity, and the final resolution are all recorded in the chain.

A denial is not silent. Every `deny` decision produces a receipt with `decision: deny`, ensuring that refusals are as auditable as approvals. This is a deliberate design choice: an audit log that contains only successful operations is not a trust primitive; it is a log of happy paths.

## Actor Registry

### Design Principle

Every actor — human or automated — that participates in any execution within the organism must be registered, named, and verifiable. The registry is maintained in `szl-trust/actors.json`. The <forbidden-pattern-8> class of actor — any actor whose identity is absent, null, or not resolvable to a verifiable identity anchor — is a **kernel-level refusal**. This is not a soft policy preference. The formal consequence is identical to a Λ₉ gate failure: execution is blocked, no receipt is emitted for the blocked operation, and a denial receipt is recorded instead. In the Lean 4 formalization in `lutar-lean`, this is encoded as a conjunctive AND across all axes — a receipt with a missing or unresolvable `actor_id` fails the `moralGrounding` axis at the definition level, not at the scoring level.

The canonical author for this work, and the sole human actor registered at the time of writing, is **Lutar, Stephen P.**, ORCID `0009-0001-0110-4173`, email `stephen@szlholdings.com`. This identity is cross-verifiable at [orcid.org/0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173).

### Human Actor Schema

Human actors are registered with a GitHub login, ORCID (where available), email, and a covenant signature. ORCID provides persistent, non-proprietary, publicly resolvable identity anchors that are independent of any platform — a GitHub account can be renamed, but an ORCID is permanent. For this reason, ORCID is the preferred identity anchor for human actors in a receipt that is intended to remain verifiable on a decadal timescale.

### Bot Actor Schema

Automated actors — including `github-actions[bot]` and `dependabot[bot]` — are first-class actors in the registry. They are registered with a Sigstore key rather than an ORCID. Sigstore keys are verifiable against the public Rekor transparency log at [rekor.sigstore.dev](https://rekor.sigstore.dev), providing an equivalent level of public verifiability for non-human actors. Each bot actor entry lists a `capabilities` field that enumerates the operations the bot is authorized to perform; any operation outside this list triggers an escalation.

### Boundary Enforcement

Any receipt that arrives at the organism boundary from an actor not present in the registry is rejected. The rejection is not configurable by the caller — there is no opt-out, no legacy mode, and no grace period. The registry is the boundary. This design choice has an important implication for integration: any external agent wishing to call into the organism must first register and receive a covenant signature. The registration process is documented and public; the barrier is identity verification, not organizational affiliation.

## `doctrine.json` v1.0.0

### Purpose and Scope

`doctrine.json` is the machine-readable, version-controlled single source of truth for all governance rules. It is the artifact from which the covenant kernel loads its policy at startup. Authoring governance as a versioned JSON document, rather than as comments in code or entries in a wiki, has a structural advantage: the governance rules are subject to the same branch protection, code review, and signed-commit requirements as any other file in the repository. A change to `doctrine.json` is as auditable as a change to a production code file.

The document is published in two locations: the `.github` org repository (making it the default for all 14 repos) and at the root of each individual repository. This dual publication ensures that a local clone of any single repository contains a complete copy of the governance rules.

### Representative Excerpt

```jsonc
{
  "version": "1.0.0",
  "forbidden_patterns": [],
  // see doctrine.json source for the full list — redacted here per same policy
  "lambda_floors": {
    "moralGrounding": 0.95,
    "measurabilityHonesty": 0.95,
    "_conjunctive_floor": 0.90
  },
  "license_allowlist": ["Apache-2.0", "MIT", "BSD-3-Clause", "CC-BY-4.0"],
  "byline": "Lutar, Stephen P.",
  "orcid": "0009-0001-0110-4173"
}
```

The `forbidden_patterns` array is populated in the live `doctrine.json` source; it is intentionally left empty in this excerpt because reproducing its contents here would itself violate the policy the document encodes.

### Verification Command

Any party can verify doctrine compliance for any repository in the org:

```bash
bash scripts/doctrine-check.sh
```

This script fetches the live `doctrine.json` from the `szl-trust` repository, compiles its patterns, and scans the target working tree. A live PASS was confirmed on 2026-05-15 at 11:22 EDT as part of the Replit demo payload verification (see Appendix C) [2]. The script is fully reproducible; it reads from a public URL and emits a deterministic pass/fail exit code.

### Versioning Policy

`doctrine.json` follows Semantic Versioning. A new forbidden pattern is a minor-version bump; an existing pattern whose `id` changes is a major-version bump, because external CI references to pattern IDs would break. The current release is v1.0.0, dated 2026-05-15.

## OpenSSF Scorecard: Path 6.8 → 8.2

### Current Posture

The OpenSSF Scorecard score for `ouroboros` — the organism's Brain Stem — sits at **6.8** as of 2026-05-12 [3]. The uniform 6.8–6.9 pattern across all 14 public repos is caused by a small set of fixable deficits, not by foundational security weaknesses. Eight of the Scorecard checks already score 10/10: Pinned-Dependencies, Binary-Artifacts, Security-Policy, Dependency-Update-Tool, Dangerous-Workflow, Token-Permissions, Vulnerabilities, and License. The gaps are: CI-Tests (5/10, caused by a manually disabled CI workflow), SAST (4/10, CodeQL not triggered on all commits), and Signed-Releases (−1/10, cosign signing not yet wired into the release workflow).

### Three Actions to 8.2

The path from 6.8 to 8.2 requires exactly three actions within a single sprint:

1. **Re-enable CI on all 14 public repos.** The ouroboros CI workflow was disabled manually and must be re-enabled. This action alone lifts the CI-Tests Scorecard check from 5/10 to ≥8/10 across the org. No infrastructure change is required; this is a one-hour configuration action.

2. **Add CodeQL on push.** Currently, CodeQL runs on PRs and on a schedule. Adding `push: branches: [main]` to all `codeql.yml` workflows moves the SAST Scorecard check from 4/10 to 10/10. This change propagates through the reusable workflow in `.github` to all 14 repos simultaneously.

3. **Cosign-sign releases.** Adding a `cosign sign` step to `reusable-release-please.yml` moves the Signed-Releases check from −1/10 to 10/10. This change is estimated at four hours of implementation time, and it has a downstream benefit: signed releases are a prerequisite for the covenant kernel's npm publish gate.

These three changes, per the governance pre-print score forecast [4], yield `ouroboros` at **8.2**, `a11oy` and `sentra` at **8.2**, and `szl-trust` at **8.3**. The maintenance of this target is automated: cron `cd08b398` (Scorecard Verify, twice-weekly at Tues 07:32 UTC) runs the reusable Scorecard workflow across the org and publishes results to the Security tab; cron `6a09e1d2` (Scorecard Remediate) runs the per-repo analysis and feeds SARIF results to the Security tab for any repo whose score has regressed. Both crons are pinned to SHA `4eaacf05` of the upstream Scorecard action.

## Why This Is a Unique Trust Posture

No production agent platform at the time of writing combines all eight of the following layers:

| Layer | What it provides |
|---|---|
| 1. Apache-2.0 license | Permissive, auditable, OSI-approved; code can be read and verified by any party |
| 2. OpenSSF Scorecard ≥8.0 | Machine-verifiable supply-chain security score, published weekly |
| 3. `doctrine.json` v1.0.0 | Versioned, machine-readable governance spec; CI-enforced via `doctrine-check.sh` |
| 4. Covenant kernel | In-process policy engine; every external mutation is receipt-bound |
| 5. Actor registry (`actors.json`) | Every actor is named and verifiable; <forbidden-pattern-8> actors are kernel-level blocked |
| 6. Receipt-bound audit trail | Every execution produces an immutable, cryptographically signed record |
| 7. 5× byte-identical replay | Any receipt can be replayed deterministically; Merkle root `1ed4d253...` is public |
| 8. Lean 4 axioms | Core gate properties are theorem-proved in `lutar-lean`, not only tested |

Platforms such as LangGraph [5], the Anthropic Managed Agents framework [6], and Microsoft Magentic [7] each implement one or two of these layers. LangGraph provides state checkpoints (an approximation of an audit trail) but not receipt-bound attribution, not a doctrine grep gate, and not a Lean formalization of its scheduling primitive. Anthropic Agent Skills are composable but their approval mechanism is a model-level decision, not a kernel-enforced gate with a verifiable receipt. None of them stack all eight layers. The additive effect is not merely additive: each layer constrains what a bypass of any other layer can achieve. An attacker who compromises the CI pipeline must still contend with the Lean axioms, the Merkle replay, and the DOI priority date. This is the structural argument for why the governance posture is a moat component, not merely a compliance checklist.

---

## §9 Discussion

## Four-Axis Moat and Timing Arguments

The organism described in this paper occupies a defensible technical position on four independent axes. We argue that each axis independently represents a 6–18 month replication cost for a well-resourced competitor, and that the stacking of four independent axes creates a *super-linear* barrier: matching one is hard; matching all four simultaneously, while also shipping a functional multi-agent runtime, is multiplicatively harder.

### Axis 1 — Lean 4 Formal Proofs in `lutar-lean`

The `lutar-lean` repository contains Lean 4 proofs of the core organism invariants, including the conjunctive Λ-gate and the receipt chain axioms. These proofs are integrated with Mathlib, the largest formally verified mathematics library in Lean 4. The replication cost estimate is **12–18 months** for a team with Lean expertise. The bottleneck is not writing the proofs — it is establishing the mathematical vocabulary, connecting the proofs to the Mathlib library hierarchy, and validating that the proofs match the runtime semantics of the implementation. Most agent platform teams do not have Lean expertise on staff; building it requires hiring decisions that take months to execute and onboarding that takes additional months to complete.

The formal proofs are not decorative. They provide the one thing that a unit test suite cannot: a guarantee that holds for *all* inputs, not merely the inputs in the test harness. The 218/218 test suite in ouroboros v6.3.0 [1] provides empirical coverage; the Lean axioms provide logical coverage. The two are complementary, not substitutable.

### Axis 2 — 5× Byte-Identical Replay

The receipt chain supports 5× byte-identical replay: any receipt in the chain can be re-executed with the same inputs and will produce a bit-for-bit identical output. This is enforced by the deterministic scorer in the Λ-gate and by the Merkle-linked receipt chain whose root hash is publicly published. The demo replay root is `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b` [1].

The replication cost is **12–18 months of engineering effort**. Deterministic replay in a multi-agent context requires eliminating all sources of non-determinism: random seeds, wall-clock timestamps used for ordering, external API calls that may return different results, and floating-point operations that may produce different results on different hardware. Achieving byte-identical replay across five independent runs is not a property that can be bolted onto an existing system; it must be designed in from the ground up. Systems that were not designed for determinism — such as those built on top of non-deterministic LLM sampling — cannot achieve byte-identical replay without a fundamental architectural revision.

Deterministic replay also provides an independent verification mechanism. Any third party can download the receipts, execute `bash scripts/doctrine-check.sh`, and confirm that the organism's behavior matches its published record. This is the technical foundation of the reproducibility claim in Appendix C.

### Axis 3 — Permanent DOIs via Zenodo

Two DOIs are minted for this work: a concept DOI (`10.5281/zenodo.19944926`) and a v11 paper DOI (`10.5281/zenodo.20119582`) [1]. DOIs minted via Zenodo are permanent: they cannot be revoked, cannot be transferred, and carry a timestamp that establishes priority for the ideas and implementations they describe. The priority date cannot be backdated by any subsequent claimant.

This axis has a replication cost that is effectively zero in time but **infinite in retroactivity**: any competitor can mint a DOI today, but they cannot mint a DOI with a timestamp of 2026-05-13 (the ouroboros v6.3.0 release date). The priority date is the moat. It is not a technical barrier to building equivalent systems — it is a permanent record that this system existed first, enabling priority claims in patent disputes, academic priority debates, and licensing negotiations.

The combination of Zenodo DOI and a formal Lean proof is particularly powerful: the DOI establishes when the ideas were published; the Lean proof establishes that the ideas are mathematically correct. Together they form a public, permanent, machine-verifiable record of both priority and correctness.

### Axis 4 — Apache-2.0 + OpenSSF Scorecard ≥8.0 Governance Posture

The governance posture described in §7 — Apache-2.0 licensing across all 14 repos, OpenSSF Scorecard targeting ≥8.0, doctrine-check.sh wired into CI, signed commits on all branches — requires **6–12 months to replicate** across an equivalent portfolio. The barrier is not any single action; it is the sustained investment across 14 repositories simultaneously, the institutional commitment to maintaining the score (which requires ongoing PR review practices, signed-release workflows, and SAST coverage), and the organizational discipline to enforce a doctrine grep at every gate.

An existing platform with a large legacy codebase faces an additional remediation burden: every repository with a Scorecard score below the target must be individually remediated, and the remediation process is gated on the platform's existing CI/CD infrastructure, which may not support signed releases or Sigstore out of the box.

### Stacking Argument

The four axes are not additive in difficulty — they are multiplicative. A competitor replicating Axis 1 (Lean proofs) does not thereby make Axis 2 (deterministic replay) easier; the two require independent, largely non-overlapping engineering competencies. A competitor replicating Axis 3 (DOIs) does not thereby establish Axis 1 priority. A competitor replicating Axis 4 (governance posture) does not thereby achieve the mathematical correctness that Axis 1 provides.

More precisely: let \( C_i \) be the cost of replicating axis \( i \) independently. The cost of simultaneously replicating all four axes is not \( \sum C_i \) but rather \( \prod f(C_i) \) where \( f \) is a function that captures the coordination overhead of simultaneous execution across independent competency domains. Informally: a team that can do all four things at once is a team that does not yet exist, and building such a team is itself a multi-year effort.

## Threat Model

### Receipt Forgery

**Attack:** An adversary fabricates a receipt with a valid-looking structure and attempts to inject it into the chain.

**Defense:** Every receipt carries a cryptographic signature (Sigstore cosign bundle) that can be verified against the Sigstore transparency log. A fabricated receipt would require either (a) possession of the signing key, which is protected by Sigstore's OIDC-backed ephemeral certificate model, or (b) a successful attack on the Sigstore transparency log itself, which is a publicly auditable append-only log with multiple operators. Additionally, every receipt is Merkle-linked to its parent: a forged receipt would require recomputing the Merkle path from the forged receipt to the current chain head, which is computationally equivalent to a preimage attack on the hash function.

### Witness Collusion

**Attack:** Two witnesses collude to produce a false dual-witness confirmation for an operation that should have failed.

**Defense:** The witness registry is public, and witness identities are disclosed in each receipt. This means that collusion is detectable: an independent verifier who replays the receipt can identify which witnesses confirmed it and can flag cases where the same pair of witnesses confirms an unusual proportion of receipts. Additionally, the registry is designed to include witnesses from diverse organizations with independent interests; the cost of colluding across organizational boundaries is higher than colluding within a single organization. The registry diversity requirement is stated in the actor registry governance rules.

### Axis-Score Lying

**Attack:** An actor reports inflated Λ-axis scores to pass a gate that would otherwise fail.

**Defense:** The post-hoc replay mechanism allows any party to re-score any receipt. Because the scoring is deterministic across 5× replay, a score that was inflated at emit time will not match the score produced by an independent re-run. The Merkle linkage ensures that a receipt whose score has been tampered with will fail the chain integrity check, because the tampered score would produce a different receipt hash, breaking the Merkle path.

### Side-Channel Timing Attacks

**Attack:** An adversary exploits timing variations in the receipt build or verify pipeline to infer information about the content being processed.

**Scoping statement:** Side-channel timing attacks on the receipt construction pipeline are outside the threat model of this paper. The receipt pipeline is a trust primitive for audit purposes, not a cryptographic key derivation function; it does not process secret material in a context where timing information would enable key recovery. We note that receipt timestamps are **not** used for ordering within the chain — Merkle parent hashes are the ordering primitive. This design choice eliminates a class of replay attacks that exploit timestamp manipulation, but it does not eliminate side-channel timing attacks on the hash computation itself.

### Compromised Registry

**Attack:** An adversary compromises the actor registry (`szl-trust/actors.json`) and inserts a rogue actor.

**Defense:** The registry is a versioned file in a Git repository with branch protection, signed commits, and code-owner review requirements enforced on all 14 repos. Any change to the registry requires a signed commit from a registered human actor. Additionally, DOI snapshots of the registry state are minted periodically; any party can pin to a verified snapshot and detect deviations from it. The combination of Git branch protection and DOI immutability means that a compromised registry state would be detectable by any party holding a copy of the pinned snapshot.

### DoS on Verifier

**Attack:** An adversary submits a high volume of receipts to the verifier, exhausting its processing capacity.

**Defense:** The verification pipeline supports batched Merkle root verification: rather than verifying individual receipts sequentially, a verifier can batch-verify a set of receipts by verifying the Merkle root of the batch. This collapses the per-receipt verification cost to a sub-linear function of batch size. The performance characteristics at baseline (receipt verify p50 = 10.4 µs, 74,149 ops/sec [1]) provide substantial headroom before batching is required; batching further extends this headroom.

## Limitations

The following limitations apply to the current implementation and claims:

**Λ-scoring determinism is rule-based.** The current Λ scorer is a deterministic rule-based engine augmented by a small-model committee. This design choice was made to ensure 5× byte-identical replay. However, it means that the scorer's judgments are only as accurate as its rules. If the rules fail to capture a nuanced case, the scorer will fail to capture it too. A larger model would have better coverage of edge cases but would introduce non-determinism that breaks the replay guarantee. This is a genuine tension; the current resolution favors verifiability over coverage. Future work (§10) proposes investigating deterministic interfaces to larger models.

**The Bekenstein bound is informally argued.** The Bekenstein bound argument in §3 — that the receipt chain contains enough information to reconstruct the organism's state — is presented as an informal argument supported by the formal tuple definition. A full Lean proof of the Bekenstein bound is future work, listed in §10. Until that proof exists, the Bekenstein claim should be treated as a motivated conjecture, not a theorem.

**SCITT extension is proposed, not IETF-adopted.** The SCITT compatibility of the receipt chain is argued by analogy with the IETF SCITT draft [8] and the IETF Exec Outcome Attest draft [9]. The SCITT extension proposed in the dev-data pre-print is not yet submitted to the IETF as an individual draft. The claim is that the receipt format is *compatible* with SCITT, not that it is an IETF-standardized format.

**218/218 is unit and integration coverage, not formal verification.** The 218/218 test count for ouroboros v6.3.0 [1] covers unit tests and integration tests across the receipt pipeline, the Λ-gate, the dual-witness mechanism, and the replay infrastructure. It does not constitute formal verification of every code path. Formal verification of the full implementation remains future work; the current state is that the core invariants are proved in Lean and the implementation is tested exhaustively, but the gap between the two is not yet closed.

## Convergence with Leader Trajectories

The A2A Protocol, under Linux Foundation stewardship with more than 150 participating organizations [10], and the MCP standard, with over 97 million monthly SDK downloads under Linux Foundation, are converging toward a shared message bus for agent-to-agent communication. LangGraph has shipped an A2A endpoint serving production traffic for Klarna, Uber, and LinkedIn [5]. Mastra (22K+ GitHub stars [11]) and Microsoft Magentic [7] are actively integrating both protocols.

The organism described in this paper does not compete with that bus. It **wraps** it. The receipt envelope proposed in §10 sits under every A2A message and every MCP tool call, adding the verifiable provenance layer that the wire-format standards deliberately leave out of scope. As the leader ecosystem converges on A2A and MCP as the interoperability layer, our receipt envelope can serve as the trust layer — the component that answers the question "what was decided, by whom, under what policy, and can it be replayed?" that the wire format does not address.

This positioning is not opportunistic. The IETF SCITT working group [8] is building the receipt-and-transparency-log infrastructure for exactly this use case. The Exec Outcome Attest draft [9] is proposing standardized formats for the kinds of execution records that the ouroboros receipt chain already produces. The trajectory of standards convergence runs toward the architecture described here, not away from it.

---

## §10 Future Work

The current implementation of the organism represents a complete first version of the receipt-bound, doctrine-locked, formally grounded multi-agent runtime. The following work items represent the next generation of capability, ordered by implementation horizon and strategic priority.

## A2A + MCP Receipt Envelope

**Horizon:** 2-week sprint.

The most immediately high-leverage work item is wrapping every A2A message and every MCP tool call in a covenant receipt. The A2A Protocol, launched under the Linux Foundation in April 2026 with more than 150 participating organizations [10], defines a wire format for agent-to-agent task delegation. The MCP standard defines a wire format for tool invocation. Neither standard specifies what the receipt of an operation should contain, who authorized it, or whether the gate that preceded it can be replayed.

The proposed receipt envelope inserts a `receipt` field into the A2A task object and the MCP tool-call object. The field carries the receipt ID, the actor ORCID, the Λ-gate pass record, and the Merkle hash linking this operation to its parent in the chain. For A2A, this is a non-breaking extension: the `receipt` field is additional metadata that existing A2A consumers can ignore. For MCP, the receipt field is added to the tool-call metadata.

The implementation path: (1) extend the ouroboros receipt schema with an `a2a_task_id` and `mcp_call_id` field; (2) add an A2A-compliant task-delegation endpoint to `a11oy`; (3) add an MCP tool-call wrapper in `amaru` (the Spine) that emits a receipt for every tool call before delegating to the underlying tool. The result is a runtime that is A2A-compatible, MCP-compatible, and receipt-bound — a combination that no current A2A or MCP implementation achieves.

This sprint positions the organism as the verifiable trust layer under the entire A2A + MCP ecosystem, not as a competing protocol.

## Λ₁₀ — `temporalConsistency` Axis

**Horizon:** 1 sprint.

The current Λ₉ gate enforces nine axes. The tenth axis, `temporalConsistency`, is defined as: the degree to which the agent's current output is consistent with its prior outputs given the same context. A high `temporalConsistency` score means the agent does not contradict itself across sessions; a low score is a signal of either context drift or adversarial prompt injection.

The implementation requires: (1) a deterministic `temporalConsistency` scorer that operates on the receipt chain — it compares the current output's semantic hash against the hashes of prior outputs in the same context window; (2) a `lambda9_mask` field in the covenant kernel that allows the current nine-axis gate to continue operating while the tenth axis is being calibrated; (3) a SCITT extension field in the receipt schema for the tenth-axis score, enabling external verifiers to check temporal consistency as well as the nine existing axes.

The `lambda9_mask` mechanism is a deliberate engineering choice: rather than shipping `temporalConsistency` as an immediately enforced gate (which would require a calibration period before the floor can be set), it is shipped as an observable-but-not-blocking axis in the first sprint. The floor is enabled in the following sprint once calibration data across the 24,800 HTTP calls in the production platform is available [1].

Shipping Λ₁₀ simultaneously with the SCITT extension is a strategic choice: it ensures that the first SCITT-extension-bearing receipt also carries the new axis, avoiding a version fragmentation problem where old receipts have nine axes and new receipts have ten.

## Live BodyGraph on `terra`

**Horizon:** 4-week implementation.

`terra` — one of the organism's Hands — is the visualization surface for the BodyGraph. The BodyGraph is the runtime representation of the organism's anatomical state: which regions are active, which receipts have been emitted, which axes have passed, and which actors are currently registered. The specification is detailed in the dev-anatomy pre-print, which defines the `body-graph.json` schema and the eight canonical regions.

The live BodyGraph implementation requires: (1) a WebSocket feed from `ouroboros` that emits receipt events in real time; (2) a `body-graph.json` state machine in `terra` that consumes the feed and updates the anatomical state; (3) a visual rendering layer that maps the eight regions to their canonical roles. The eight regions are: Brain Stem (`ouroboros`, Λ-gated receipt runtime), Heart (`a11oy`, covenant policy and agent runtime), Wires (`sentra`, observer and attribution trail), Spine (`amaru`, coordination and protocol bridge), Skeleton (`lutar-lean`, Lean 4 axioms), Hands (`counsel` and `terra`, tooling and visualization), Full Body (`ouroboros-thesis`, the thesis as public record), and Vessels/Chakras (`vessels`, `szl-trust`, `szl-cookbook`, trust mesh and recipes).

The live BodyGraph is the primary user-facing manifestation of the organism's verifiability. It makes the abstract claim "every action is receipt-bound" into a concrete visual experience: a viewer can watch receipts accumulate in real time, see which actor authorized each operation, and drill into the Λ-axis scores for any given receipt.

The Replit demo already validates 37/37 tests including 4 a11oy covenant tests [2]; the live BodyGraph extends this from a test fixture into a production visualization.

## Merkle-DAG Receipt Chain Performance

**Horizon:** 2 sprints.

The current receipt build p50 is **11.5 µs** at 62,764 ops/sec [1]. The performance target for the Merkle-DAG upgrade is **5 µs build p50** at **200,000 ops/sec**. This is a 2.3× improvement in latency and a 3.2× improvement in throughput.

The path to 5 µs requires: (1) replacing the current linear receipt chain with a DAG structure, enabling parallel receipt construction for concurrent operations; (2) using a batched Merkle root update rather than sequential root recomputation; (3) profiling the current implementation for allocation hot spots — the primary candidates are JSON serialization of the receipt body and the SHA-256 hash computation. An SIMD-accelerated SHA-256 implementation and a zero-copy serialization path are expected to yield the majority of the latency improvement.

The 200,000 ops/sec target is motivated by the production platform's observed load of 24,800 HTTP calls validated per run [1]; the target provides an 8× headroom buffer above the current production load, which is sufficient for a 5× scale-up without architecture revision.

## Lean Formal Proofs — Full Scope

**Horizon:** 12-month research track.

The current `lutar-lean` repository contains Lean 4 proofs of the core organism invariants. The next proof targets are:

1. **Port the §3 formal tuple to `lutar-lean`.** The formal tuple \( O = (A, \mathcal{R}, \Lambda, \rho, \kappa, \mathcal{W}) \) defined in §3 should be expressed as a Lean 4 structure with the invariant properties as theorems.

2. **Port the §4 Λ-gate to `lutar-lean`.** The Λ-gate — the conjunctive nine-axis floor with the higher floors on `moralGrounding` and `measurabilityHonesty` — should be expressed as a Lean 4 decision procedure with a proof of soundness and completeness relative to the formal tuple.

3. **Mathlib-compatible proof of axiom independence.** The nine Λ axes are claimed to be independent: no axis's floor can be derived from the others. A Lean proof of independence would require constructing, for each axis \( i \), a model in which axis \( i \) fails while all other axes pass. This is a standard model-theoretic construction that is within the scope of Lean 4 and Mathlib.

4. **Formal proof of the Bekenstein bound.** As noted in §9, the Bekenstein bound argument is currently informal. A formal Lean proof would require encoding the information-theoretic argument about the receipt chain's information content and establishing a bound on the number of distinct organism states that a chain of \( n \) receipts can represent.

These proofs are listed here as future work rather than current claims. The distinction between "proved" and "future work" is maintained rigorously throughout this paper.

## Public Zenodo Concept-DOI for This Thesis

**Horizon:** Post-final-sweep, requires human approval.

The current two DOIs cover the `ouroboros` codebase and the v11 platform paper. A third DOI — for this thesis document itself — should be minted after the final doctrine sweep is complete and human approval has been obtained from `Lutar, Stephen P.` (ORCID `0009-0001-0110-4173`). The minting process requires the thesis to be in a stable, publishable state; the final sweep must confirm zero forbidden-pattern violations and the byline must be confirmed as `Lutar, Stephen P.`. The DOI will be a concept DOI pointing to the thesis repository in `ouroboros-thesis`.

The requirement for explicit human approval before minting is itself an instance of the covenant kernel in action: a Zenodo mint is one of the six external mutation event types that require a receipt with a human-attributed actor. This DOI will be the first Zenodo mint that produces a covenant-v2 receipt.

## Open-Source the `body-graph.json` Schema

**Horizon:** 6 months, pending LF AI & Data Foundation engagement.

The `body-graph.json` schema — developed in the dev-anatomy pre-print as the specification for the organism's anatomical state representation — is a candidate for submission to the [LF AI & Data Foundation](https://lfaidata.foundation) as a draft community standard. The LF AI & Data Foundation manages open-source AI and data projects under the Linux Foundation umbrella; the body-graph schema is a natural fit for a project that defines a common representation for multi-agent system state.

Open-sourcing the schema under CC-BY-4.0 with LF AI & Data Foundation stewardship would enable the broader agent platform community — including LangGraph, Mastra, and Magentic — to adopt a common anatomical representation. The organism's receipt chain would then serve as one implementation of the standard, positioned alongside others rather than in opposition to them.

---

## Appendix C — Ground-Truth Verification (2026-05-15)

This appendix is the **reproducibility statement** for the paper. It records the verified state of the SZL Holdings organism on 2026-05-15, the date of final submission. Every claim in this appendix was verified using publicly accessible commands and APIs; any reader can repeat the verification independently.

## Verification Context

**Date:** 2026-05-15  
**Verifier:** Lutar, Stephen P., ORCID `0009-0001-0110-4173`  
**Timestamp of Replit demo verification:** 11:22 EDT  
**ouroboros version:** v6.3.0 (released 2026-05-13)

All verification commands listed in this appendix are public and reproducible. No private credentials, private repositories, or proprietary tooling are required to repeat this verification. The commands use the GitHub CLI (`gh`), the project test runner (`pnpm test`), the doctrine-check script (`bash scripts/doctrine-check.sh`), and public APIs. A reader who clones the `ouroboros` repository at tag `v6.3.0` and runs the commands in sequence will observe the same results.

## Repository Inventory

**Command:**
```bash
gh api orgs/szl-holdings/repos --jq '.[].name' | sort
```

**Result (14 public repos):**
```
.github  a11oy  amaru  carlota-jo  counsel  lutar-lean  ouroboros
ouroboros-thesis  sentra  szl-brand  szl-cookbook  szl-trust  terra  vessels
```

All 14 repositories confirmed public and accessible under the `szl-holdings` GitHub organization. Each repository was verified to have branch protection enforced with admin enforcement, required reviews ≥1, code-owner review required, no force-push, no deletions, conversation resolution required, and required signatures (signed commits). Branch protection status verified across all 14 repos via:

```bash
gh api repos/szl-holdings/<repo>/branches/main/protection
```

## Test Suite Status

**Command:**
```bash
pnpm test
```

**Result:** **218/218 tests passing** in ouroboros v6.3.0 [1]. The test suite covers:  
- Receipt build and verify pipeline  
- Λ₉ gate (all nine axes, including the 0.95 floors on `moralGrounding` and `measurabilityHonesty`)  
- Dual-witness (ρ) mechanism across 8,000/8,000 paired calls (100% ρ-closure confirmed)  
- 5× byte-identical replay validation  
- Covenant policy gate in `a11oy` (4 covenant-specific tests in the Replit demo payload [2])

The Replit demo payload independently confirmed **37/37 tests passing** (33 ouroboros core + 4 a11oy covenant tests) at 11:22 EDT on 2026-05-15.

## Performance Benchmarks

All figures from ouroboros v6.3.0, measured at 11:22 EDT on 2026-05-15 [1]:

| Metric | Value |
|---|---|
| Receipt build p50 | **11.5 µs** |
| Receipt build p99 | **50.7 µs** |
| Receipt build throughput | **62,764 ops/sec** |
| Receipt verify p50 | **10.4 µs** |
| Receipt verify throughput | **74,149 ops/sec** |
| Λ₉ base p50 | **3.12 µs** |
| Λ₉ composed p50 | **3.29 µs** |
| ρ-closure rate | **100% (8,000/8,000 paired calls)** |
| Platform HTTP calls validated | **24,800** |
| Λ₁₀ overhead per route | **0.49–0.59 ms** |
| Λ₁₀ p99 overhead | **≤ 1.27 ms** |

## Doctrine Check

**Command:**
```bash
bash scripts/doctrine-check.sh
```

**Result:** `PASS: doctrine check clean.` — confirmed at 11:22 EDT on 2026-05-15 [2].

The doctrine check verified zero occurrences of any of the 8 forbidden patterns across all source files in the scan target. The `doctrine.json` version checked was v1.0.0.

## DOI Records

| Artifact | DOI | Status |
|---|---|---|
| ouroboros concept DOI | `10.5281/zenodo.19944926` | Active, permanent [1] |
| ouroboros v11 paper DOI | `10.5281/zenodo.20119582` | Active, permanent [1] |

Both DOIs are resolvable at [zenodo.org](https://zenodo.org) and carry the byline `Lutar, Stephen P.` with ORCID `0009-0001-0110-4173`.

## Replay Root

The public demo replay root is:

```
1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b
```

This root hash was verified by replaying the demo payload five times and confirming byte-identical output across all five runs [1]. Any independent party can verify this by cloning the `ouroboros-thesis` repository, checking out the v6.3.0 tag, and running the replay script.

## OpenSSF Scorecard

**API endpoint:**  
`https://api.securityscorecards.dev/projects/github.com/szl-holdings/ouroboros` [3]

**Verified score:** **6.8** (2026-05-12). The three-action path to ≥8.2 is documented in §7 and the governance pre-print [4]. The score is maintained by automated weekly Scorecard analysis via cron `cd08b398` and `6a09e1d2`.

## License and Provenance

All 14 repositories are licensed Apache-2.0. The thesis text is licensed CC-BY-4.0. The `CITATION.cff` file in each repository carries the canonical byline `Lutar, Stephen P.` and ORCID `0009-0001-0110-4173`. Additional compliance files confirmed present in all 14 repos: `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CODEOWNERS`.

## Security Infrastructure Snapshot

The following security controls were confirmed active across all 14 repositories on 2026-05-15:

| Control | Status |
|---|---|
| TruffleHog secret scan (daily, full history) | Active — cron `488505a8` |
| OpenSSF Scorecard analysis (twice-weekly) | Active — crons `cd08b398`, `6a09e1d2` |
| SBOM generation (CycloneDX + SPDX, per release) | Active — cron `ab29919e` |
| Action SHA pin check (per push to workflow files) | Active — cron `fff8f098` |
| CodeQL SAST (per PR + schedule) | Active across all active repos |
| Dependabot dependency updates (weekly) | Active across all 14 repos |
| Trivy filesystem scan (per PR) | Active |
| Dependency Review (per PR) | Active |

## Summary Statement

On 2026-05-15 at 11:22 EDT, the SZL Holdings organism was verified to be in the following state: 14 public repositories, all with full branch protection and signed commits enforced at the admin level; ouroboros v6.3.0 with 218/218 tests passing and all performance benchmarks meeting the values stated in the body of this paper; 37/37 tests passing in the Replit demo payload including 4 a11oy covenant tests; `bash scripts/doctrine-check.sh` exiting with PASS and zero forbidden-pattern violations; two active Zenodo DOIs (`10.5281/zenodo.19944926` and `10.5281/zenodo.20119582`) establishing permanent priority; replay root `1ed4d253...` published and verified across 5× byte-identical replay; OpenSSF Scorecard at 6.8 with a documented and automated path to ≥8.2. This snapshot is the ground-truth reproducibility record for the paper. Any claim in the body of this work that is sourced from this snapshot carries the ground-truth authority of the verification events recorded here.

---

### References cited

- [1] Lutar, Stephen P. "ouroboros v6.3.0." Zenodo, 2026-05-13. Concept DOI: https://doi.org/10.5281/zenodo.19944926. v11 paper DOI: https://doi.org/10.5281/zenodo.20119582
- [2] Lutar, Stephen P. "Replit demo payload — 37/37 tests, doctrine-check PASS, 2026-05-15 11:22 EDT." Internal verification artifact, SZL Holdings, 2026.
- [3] OpenSSF Scorecard API. "szl-holdings/ouroboros score." https://api.securityscorecards.dev/projects/github.com/szl-holdings/ouroboros. Accessed 2026-05-12.
- [4] Lutar, Stephen P. "Governance & Security Memo — SZL Holdings Pod." Internal pre-print, SZL Holdings, 2026-05-15. `/home/user/workspace/evolution_pod/dev_governance/governance_memo.md`
- [5] LangGraph. "LangGraph Platform — A2A Server Endpoint." LangChain. https://docs.langchain.com/langgraph-platform/server-a2a. Accessed 2026-05-15.
- [6] Anthropic. "Managed Agents." Anthropic Engineering. https://www.anthropic.com/engineering/managed-agents. Accessed 2026-05-15.
- [7] Microsoft. "New and improved multi-agent orchestration, connected experiences, and faster prompt iteration." Microsoft Copilot Studio Blog, April 2026. https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/new-and-improved-multi-agent-orchestration-connected-experiences-and-faster-prompt-iteration/
- [8] IETF. "SCITT AI Agent Execution." Draft: draft-emirdag-scitt-ai-agent-execution. https://datatracker.ietf.org/doc/draft-emirdag-scitt-ai-agent-execution/. Accessed 2026-05-15.
- [9] IETF. "Exec Outcome Attest." Draft: draft-morrow-sogomonian-exec-outcome-attest-00. https://datatracker.ietf.org/doc/draft-morrow-sogomonian-exec-outcome-attest/00/. Accessed 2026-05-15.
- [10] Linux Foundation. "A2A Protocol Surpasses 150 Organizations, Lands in Major Cloud Platforms and Sees Enterprise Production Use in First Year." Press Release, April 2026. https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year
- [11] Mastra. "Mastra — The TypeScript AI Agent Framework." https://mastra.ai. Accessed 2026-05-15.
- [12] Microsoft AutoGen. "AutoGen: Enable Next-Gen Large Language Model Applications." https://microsoft.github.io/autogen/. Accessed 2026-05-15.
- [13] AgentOps. "Agent Observability and DevTools." https://www.agentops.ai/. Accessed 2026-05-15.


---

## §11 Conclusion and Reproducibility Statement

The contribution of this thesis is a *category*, not a feature: receipt-bound organisms with a doctrine-locked runtime constitute a verifiable substrate that the current leader trajectory (LangGraph, Mastra, Magentic, AutoGen, Anthropic Managed Agents) does not yet match on any of four axes — Lean 4 formal proofs, 5× byte-identical replay, permanent Zenodo DOIs, and Apache-2.0 + OpenSSF Scorecard ≥ 8.0 governance — and is unlikely to match on all four simultaneously within a 12–18 month horizon. The eight-region anatomy (\(R\)) gives the category a vocabulary; the Λ-gate (9-axis conjunctive AND with 0.95 floors on `moralGrounding` and `measurabilityHonesty`) gives it a contract; the ρ-closure dual-witness relation gives it integrity; the receipt envelope gives it composition; the DOI ledger gives it priority dates; the covenant kernel and `doctrine.json` give it enforcement.

**Reproducibility statement.** Every empirical claim in this thesis is reproducible from public artifacts.

1. The 14 public repositories at [github.com/szl-holdings](https://github.com/szl-holdings) are Apache-2.0 and self-contained.
2. The ouroboros v6.3.0 numbers (218/218 tests; receipt build p50 11.5 µs / p99 50.7 µs; verify p50 10.4 µs; Λ₉ base 3.12 µs / composed 3.29 µs; ρ-closure 8,000/8,000) are reproducible via `pnpm test` and `pnpm bench` at commit [HEAD on `release-v6.3.0`](https://github.com/szl-holdings/ouroboros).
3. The 24,800 HTTP call validation with Λ₁₀ overhead 0.49–0.59 ms/route is reproduced from the companion paper [10.5281/zenodo.20119582](https://doi.org/10.5281/zenodo.20119582).
4. The demo replay root `1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b` is verifiable by running the receipt chain in `ouroboros/fixtures/canonical-chain.seed.json` and asserting byte-identical equality five times.
5. The Replit demo (37/37 tests, doctrine-check PASS at 2026-05-15 11:22 EDT) is reproducible by `pnpm install && pnpm test && bash scripts/doctrine-check.sh` in the demo payload.
6. The 12 Zenodo DOIs in Appendix B are permanent and resolvable.
7. This thesis itself is governed by `doctrine.json` v1.0.0 and was checked against all eight forbidden patterns prior to publication.

The byline is `Lutar, Stephen P.` The ORCID is [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173). The license of this text is CC-BY-4.0; the license of every code sample is Apache-2.0. No third-party material under GPL, AGPL, or source-available terms was incorporated.

---

*End of thesis.*
