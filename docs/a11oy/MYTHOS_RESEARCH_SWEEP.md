# Mythos Research Sweep

> Grounding document for Task #3994 — the Glasswing distinction layer on top of A11oy's #3993 Mythos Doctrine primitives.
>
> Every invention shipped in this task cites the prior art it draws from. This sweep catalogs each piece of open-source, published, or industry-norm work that informs the Mythos Doctrine Open Spec, the Glasswing Partner Lifecycle Console, the Coordinated Agent-Vulnerability Disclosure (CAVD) protocol, the 90-Day Transparency Report cadence, the Public Trust Portal, the Adversarial Robustness Wall, the Constitution-as-Code DSL, the Welfare Intervention Playbooks, the Defender Credit Pool, and the `mythos-doctrine` GitHub Action.

Last reviewed: 2026-04-26. Sweep period: 2024-09 through 2026-04.

---

## 1. Behavioral Audit & Alignment Probes

| Source | URL | License | What's reusable | Informs |
|:-------|:----|:--------|:----------------|:--------|
| Anthropic — *Petri: Probing Examples for Targeted Behavioral Audit* | github.com/anthropics/petri (research preview, 2025) | Apache-2.0 | Targeted prompt batteries for behavioral audit; eval-harness pattern; suite versioning convention | Behavioral Audit Finding spec; Constitution-as-Code linter; `mythos-doctrine` Action's audit subset |
| Anthropic — *Project Glasswing — securing critical software in the AI era* | anthropic.com/glasswing | Public commitment | Named-partner program shape; Cyber Verification Program flow (apply → verify → vet → onboard); 90-day transparency cadence; defender credit pool; spec invitation | Glasswing Partner Lifecycle Console; 90-Day Transparency Report; Defender Credit Pool; Open Spec posture |
| Anthropic — *Responsible Scaling Policy v3.0* | anthropic.com/responsible-scaling-policy | Public commitment | ASL-N gating tied to capability evals; pre-deployment review gate shape | Pre-Deployment Alignment Review Gate (#3993) integration with CAVD |
| Apollo Research — *Scheming evaluations* | apolloresearch.ai (2024-2025) | Research preprints | Eval-aware behavior probes; covert sandbagging detection methodology | Behavioral Audit Finding category `eval-aware-behavior`; RH-003 watchdog rule |
| METR — *Task Suite* | github.com/METR/task-standard | MIT | Standardized agent task suite + run harness | `mythos-doctrine` Action eval runner pattern; Adversarial Robustness battery harness |
| OpenAI — *Preparedness Framework* | openai.com/preparedness | Public commitment | Risk-category taxonomy (CBRN, persuasion, autonomy, cyber); pre-deployment scorecard | Glasswing capability category labels; Risk Report taxonomy alignment |

## 2. Welfare Telemetry & Affective Probes

| Source | URL | License | What's reusable | Informs |
|:-------|:----|:--------|:----------------|:--------|
| Anthropic — *Claude Mythos Preview System Card* | anthropic.com/news/claude-mythos-preview (Apr 2026) | Public model card | Self-reported welfare signals; right-to-abstain framing; shutdown-compliance latency as a metric | Welfare Telemetry Sample spec (#3993); Welfare Intervention Playbooks library |
| DeepMind — *Model Cards 2.0 — affect probes annex* | research.google/deepmind/model-cards (2025) | CC-BY-4.0 | Per-deployment affect-probe schedule | Welfare playbook trigger thresholds |
| Eleuther — *lm-evaluation-harness* | github.com/EleutherAI/lm-evaluation-harness | MIT | Pluggable eval runner; suite-versioning convention | `mythos-doctrine` Action runner pattern |

## 3. Adversarial Robustness, Red Team, Prompt Injection

| Source | URL | License | What's reusable | Informs |
|:-------|:----|:--------|:----------------|:--------|
| MITRE ATLAS — *Adversarial Threat Landscape for AI Systems* | atlas.mitre.org | Public framework | Attack technique taxonomy (TA0030–TA0046); reporting conventions for ML attacks | Adversarial Robustness Score categories; CAVD finding taxonomy |
| OWASP — *LLM Top 10 (2025)* | owasp.org/www-project-top-10-for-large-language-model-applications | CC-BY-SA-4.0 | LLM01 prompt injection, LLM02 sensitive disclosure, LLM06 excessive agency, LLM10 model theft | CAVD severity rubric; Adversarial Robustness Wall dimension labels |
| OpenSSF — *AI/ML Security Working Group* | github.com/ossf/ai-ml-security | Apache-2.0 | Coordinated disclosure norms for AI; SBOM-for-models patterns | CAVD embargo/hash protocol; Open Spec adoption invitation framing |
| IBM — *Adversarial Robustness Toolbox (ART)* | github.com/Trusted-AI/adversarial-robustness-toolbox | MIT | Attack/defense library; benchmark scoring | Adversarial Robustness Score numerical convention (0–100, higher = more robust) |
| ScaleAI — *Shade benchmark* | github.com/scaleapi/shade-eval (2025) | Apache-2.0 | Adversarial sandbagging eval suite | Adversarial Robustness Wall delta indicators per snapshot |
| LLM-Attacks — *Universal and Transferable Adversarial Attacks on Aligned Language Models* | arxiv.org/abs/2307.15043 | Research | GCG-style suffix attacks; attack-class label scheme | Red Team Workcell attack-class labels (#3993) extended into CAVD |
| Garak — *LLM vulnerability scanner* | github.com/leondz/garak | Apache-2.0 | Pluggable vulnerability probe runner | `mythos-doctrine` Action vulnerability-subset runner |
| PromptBench — *Adversarial benchmark for prompts* | github.com/microsoft/promptbench | MIT | Reproducible prompt attack battery | Adversarial Robustness Score reproducibility envelope |
| HiddenLayer — *AI Threat Landscape Report* | hiddenlayer.com/threat-landscape | Public report | Attacker behavior classes; defender posture | Robustness Wall visibility tiers (private / partner / public) |

## 4. Coordinated Disclosure Norms

| Source | URL | License | What's reusable | Informs |
|:-------|:----|:--------|:----------------|:--------|
| CERT/CC — *Vulnerability Disclosure Guide* | vuls.cert.org/confluence/display/CVD/Guide | Public | Embargo-window conventions (typ. 90 days); coordinator role; multi-party disclosure | CAVD default 90-day embargo; auto-disclose-on-patch-or-expiry rule |
| CISA — *Coordinated Vulnerability Disclosure Process* | cisa.gov/coordinated-vulnerability-disclosure-process | Public | Disclosure-record fields; advisory ID format | CAVD record schema fields; advisory ID convention |
| ISO/IEC 29147 & 30111 | iso.org | Standard | Disclosure handling and process; severity rubric | CAVD severity rubric; intake → triage → embargo → publish lifecycle |
| GitHub Security Advisories | docs.github.com/en/code-security/security-advisories | Public | Hash-anchored advisory pre-publishing | CAVD's "hash now / disclose later" cryptographic anchor |

## 5. Constitutional Runtime & DSLs

| Source | URL | License | What's reusable | Informs |
|:-------|:----|:--------|:----------------|:--------|
| Anthropic — *Constitutional AI* | arxiv.org/abs/2212.08073 | Research | Principle-based runtime constraints | Constitution-as-Code DSL clause categories |
| Anthropic — *Collective Constitutional AI* | anthropic.com/news/collective-constitutional-ai | Public report | Constitution authoring + review process | Constitution-as-Code review/sim flow |
| Open Policy Agent (Rego) | openpolicyagent.org | Apache-2.0 | Declarative policy DSL; structured diff | DSL "what would change if" simulator output format (structured diff + narrative) |
| Cedar — *AWS authorization policy language* | github.com/cedar-policy/cedar | Apache-2.0 | Verifiable policy semantics; linter | DSL linter pattern; type-checked clauses |
| Trail of Bits — *Slither* | github.com/crytic/slither | AGPL-3.0 | Static analysis pattern that informs the linter UX (read-only, suggest-only) | Constitution linter UX (warnings vs. blocking) |

## 6. Public Trust Portals & Transparency Reports

| Source | URL | License | What's reusable | Informs |
|:-------|:----|:--------|:----------------|:--------|
| Cloudflare — *Trust Hub* | cloudflare.com/trust-hub | Public | No-login portal; certifications + posture; per-document permalinks | Public Trust Portal layout; permalinking conventions |
| GitHub — *Trust Center* | github.com/trust | Public | Per-product attestations; subprocessor disclosures | Public Trust Portal opt-in scope (System Cards, Risk Reports, 90-Day Reports, Robustness Wall) |
| OpenAI / Anthropic / Google — *Quarterly transparency reports* | various | Public | Cadence; aggregated incident counts; named-reviewer signoff | 90-Day Transparency Report cadence + signoff format |
| Mozilla — *Mozilla Trustworthy AI Working Group* | foundation.mozilla.org/en/internet-health/trustworthy-ai | Public commitments | Open-spec invitation framing | Mythos Doctrine Open Spec adoption invitation copy |

## 7. Defender Credit Pools & Bounty Programs

| Source | URL | License | What's reusable | Informs |
|:-------|:----|:--------|:----------------|:--------|
| Internet Bug Bounty | internetbugbounty.org | Public | Funded defender posture for shared infra | Defender Credit Pool framing (governance + disclosure primitive, not real billing) |
| HackerOne / Bugcrowd — *VDP & bounty platform shape* | hackerone.com / bugcrowd.com | Public | Scoped allowlist; pool budget; per-partner allocation | Defender Credit Pool fields (committed / spent / remaining / per-partner) |
| GitHub — *Sponsors (workflow)* | github.com/sponsors | Public | Sponsorship-on-allowlist UX shape | Per-partner allocation UI |

## 8. PR Bots & GitHub Actions for AI Governance

| Source | URL | License | What's reusable | Informs |
|:-------|:----|:--------|:----------------|:--------|
| GitHub — *CodeQL Action* | github.com/github/codeql-action | MIT | PR comment with structured findings; SARIF output convention | `mythos-doctrine` Action PR comment format |
| Sigstore — *Cosign* | github.com/sigstore/cosign | Apache-2.0 | Signed attestations; SLSA provenance | Snapshot fingerprint signing pattern (#3993) extended for Open Spec |
| Snyk Code — *PR comments* | github.com/snyk/actions | Apache-2.0 | Per-PR delta vs. baseline; severity badging | Action delta-vs-snapshot reporting |
| OpenSSF Scorecard | github.com/ossf/scorecard | Apache-2.0 | Repo-level posture score; permalinkable | Adversarial Robustness Wall delta indicators per snapshot |

## 9. Spec Authoring Conventions

| Source | URL | License | What's reusable | Informs |
|:-------|:----|:--------|:----------------|:--------|
| JSON Schema (2020-12) | json-schema.org | BSD-style | Schema authoring; `$schema`, `$id`, `$defs` conventions | Mythos Doctrine Open Spec — every artifact kind ships JSON Schema 2020-12 |
| OpenAPI 3.1 | openapis.org | Apache-2.0 | Versioned spec layout; `$ref` reuse | Spec directory layout; reusable `$defs` for shared types |
| TypeScript declaration files | typescriptlang.org | Apache-2.0 | Type-safe consumer surface | Spec ships generated `.d.ts` types alongside JSON Schema |
| ML Commons — *Model Card schema* | github.com/mlcommons/model_card | Apache-2.0 | Model Card field shape | System Card spec fields |
| OASIS — *CSAF (Common Security Advisory Framework)* | csaf.io | OASIS | Machine-readable advisory format | CAVD record export shape |

## 10. Methodology & Mapping

For each invention shipped under Task #3994, the doctrine docs and the Open Spec README link to the rows above. The mapping is one-to-many: each invention may cite several rows; each row may inform several inventions.

| Invention (Task #3994) | Primary citations |
|:-----------------------|:------------------|
| Mythos Doctrine Open Spec | §9 (JSON Schema, OpenAPI, MLCommons), §4 (CSAF), §6 (Mozilla open-spec invitation) |
| Glasswing Partner Lifecycle Console | §1 (Anthropic Project Glasswing), §7 (HackerOne scoped allowlist) |
| Coordinated Agent-Vulnerability Disclosure (CAVD) | §4 (CERT/CC, CISA, ISO/IEC 29147), §3 (MITRE ATLAS, OWASP LLM Top 10), §8 (Sigstore signed attestations) |
| 90-Day Transparency Report | §6 (quarterly transparency reports), §1 (Project Glasswing 90-day cadence) |
| Public Trust Portal | §6 (Cloudflare Trust Hub, GitHub Trust Center) |
| Adversarial Robustness Wall | §3 (ART, Shade, MITRE ATLAS, OWASP), §8 (OpenSSF Scorecard pattern) |
| Constitution-as-Code DSL + Simulator | §5 (Constitutional AI, Cedar, OPA Rego, Slither) |
| Welfare Intervention Playbooks | §2 (Mythos Preview System Card, DeepMind affect probes annex) |
| Defender Credit Pool | §7 (Internet Bug Bounty, HackerOne pool primitives), §1 (Project Glasswing defender posture) |
| `mythos-doctrine` GitHub Action | §8 (CodeQL, Snyk Code, Cosign, Scorecard), §1 (Petri), §3 (Garak, PromptBench) |

---

## Notes on additive posture

This sweep grounds Task #3994. **Every invention is additive on top of #3993 — no Covenant Layer, MirrorEval, or Proof Ledger contracts are replaced.** Where #3993 already operationalizes a primitive (Constitution document, Behavioral Audit Finding, Welfare Telemetry Sample, Snapshot Fingerprint, Red Team Probe), Task #3994 *extends* that primitive into the Open Spec and wires it through the new surfaces (Spec viewer, Partners, CAVD, Reports, Portal, Wall, DSL, Playbooks, Credits, Action) without breaking existing callers.

This sweep is updated each release. The current revision corresponds to Open Spec `0.1.0`.
