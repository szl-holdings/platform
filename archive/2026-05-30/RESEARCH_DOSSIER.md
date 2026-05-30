# Alloy Codex — Research Dossier
## Prompt Kernel Library: Distilled from 21 Leading 2026 AI Tools

**Compiled:** April 25, 2026  
**Library:** `@szl/alloy/prompts`  
**Version:** 1.0.0  
**Kernels:** 16  
**Verticals Wired:** 11 (10 web + 1 design sandbox)

---

## Executive Summary

The Alloy Codex Prompt Kernel Library is a versioned, governed collection of 16 AI prompt templates distilled from the interaction patterns, output contracts, and evidence standards of 21 leading AI products in 2026. Each kernel encodes a reusable "agent behavior" — a role, an output contract, a refusal policy, an evaluation rubric, and few-shot examples — that can be composed across SZL's 12 verticals.

This dossier documents the research basis for each kernel design decision.

---

## Research Methodology

Kernels were designed by:
1. **Pattern extraction** — identifying the core interaction pattern each leading AI tool excels at (e.g., Perplexity → cited research, Granola → ambient meeting recap, Clay → contact enrichment).
2. **Contract inversion** — specifying what the model *must* produce and what it *must refuse*, making failure modes explicit.
3. **Rubric derivation** — translating the tool's implicit quality bar into weighted, measurable criteria.
4. **Evidence grounding** — specifying minimum citation/document counts to prevent hallucination.
5. **Vertical mapping** — matching each kernel to the SZL product domains where it creates highest leverage.

---

## The 21 Source Tools

| # | Tool | Category | Key Pattern Extracted |
|---|---|---|---|
| 1 | **Perplexity** | Search / Research | Numbered inline citations, source-grounded synthesis |
| 2 | **Claude (Anthropic)** | General AI | Structured reasoning, artifacts, cowork collaboration |
| 3 | **Granola** | Meeting AI | Ambient audio capture → structured action recap |
| 4 | **Fireflies** | Meeting AI | Speaker-attributed transcript → meeting intelligence |
| 5 | **Otter.ai** | Meeting AI | Real-time transcription → searchable knowledge |
| 6 | **Superhuman** | Email / Productivity | Intent-classified actions from unstructured voice/text |
| 7 | **Motion** | Scheduling AI | Autonomous task prioritization and schedule reordering |
| 8 | **Julius AI** | Data Analysis | Natural language → chart + insight generation |
| 9 | **Noteable** | Data Science | Executable notebook cells from NL prompts |
| 10 | **Hex** | Analytics | Collaborative data app generation from SQL/NL |
| 11 | **Clay** | CRM Enrichment | Multi-source contact enrichment with confidence scoring |
| 12 | **Salesforce Einstein** | CRM AI | Conversation summarization → CRM field updates |
| 13 | **Apollo** | Sales Intelligence | ICP scoring, outreach personalization at scale |
| 14 | **HubSpot Breeze** | CRM / Marketing AI | Meeting-to-deal pipeline updates, AI assistant flows |
| 15 | **Gamma** | Presentation AI | Brief → structured slide narrative with visual hierarchy |
| 16 | **Beautiful.ai** | Presentation AI | Auto-layout, theme-consistent deck generation |
| 17 | **Tome** | Storytelling AI | Narrative arc construction for pitches and reports |
| 18 | **Gong** | Revenue Intelligence | Call transcript → CRM opportunity and forecast update |
| 19 | **Recorded Future** | Threat Intelligence | OSINT fusion → actor-attributed threat briefs |
| 20 | **Harvey AI** | Legal AI | Contract risk extraction, clause classification |
| 21 | **Runway ML** | Video AI | Scene-level storyboard → prompt-driven video generation |

---

## Kernel Design Decisions

### 1. `research-and-cite`
**Pattern Source:** Perplexity, Claude Cowork  
**Core Insight:** Perplexity's value proposition is not search — it is *citable synthesis*. Every claim carries a [Source N] anchor that can be verified. Claude Cowork extends this to multi-document workspaces.  
**Design Decision:** Mandate `[Source N]` inline citations for every factual claim. Flag unverifiable claims as `[UNVERIFIED]` rather than suppressing them.  
**Refusal Trigger:** No sources provided → refuse rather than synthesize from training data.

### 2. `ambient-capture-recap`
**Pattern Source:** Granola, Fireflies, Otter  
**Core Insight:** Granola's killer feature is capturing meetings *without* explicit recording prompts — the user leaves the app running and gets a structured recap. The value is zero-friction capture.  
**Design Decision:** Template accepts raw transcript chunks (no pre-processing required), extracts structured sections (key decisions, action items, open questions), and attributes items to speakers.

### 3. `voice-to-action`
**Pattern Source:** Superhuman, Motion, Claude  
**Core Insight:** Superhuman's AI triage classifies inbound messages into intent buckets instantly. Motion's "auto-schedule" turns intent into calendar blocks. The pattern: *intent classification → prioritized action list*.  
**Design Decision:** Classify input into categories (immediate/schedule/delegate/archive/ignore), assign urgency scores, and output structured JSON-like action items with assignees.

### 4. `contact-enrichment`
**Pattern Source:** Clay, Salesforce Einstein, Apollo  
**Core Insight:** Clay's multi-source waterfall enrichment sets the standard — it queries 10+ data providers and assigns confidence scores per field. Single-source enrichment is insufficient.  
**Design Decision:** Template accepts a base contact record and a list of enrichment signals. Output includes confidence scores (high/medium/low) and source attribution per field.

### 5. `deck-from-brief`
**Pattern Source:** Gamma, Beautiful.ai, Tome  
**Core Insight:** Gamma pioneered "brief to deck" — a one-paragraph brief becomes a 10-slide structured narrative. The key is maintaining a logical arc (problem → insight → solution → proof → call to action) rather than bullet-dumping.  
**Design Decision:** Template enforces a narrative arc structure. Each slide gets a headline, supporting points, and a speaker note. Output is JSON-serializable for downstream rendering.

### 6. `decision-intelligence`
**Pattern Source:** Claude Cowork, Julius AI, Motion  
**Core Insight:** The highest-value decision AI output is not a recommendation — it is a *ranked recommendation with explicit dissent flags*. Motion's autonomous prioritization and Julius's quantitative analysis informed the multi-criteria structure.  
**Design Decision:** Apply MCDA framework. Weight criteria explicitly. Surface the strongest counterargument to the top recommendation. Include confidence percentage and risk flags.

### 7. `deep-analytics`
**Pattern Source:** Julius AI, Noteable, Hex  
**Core Insight:** Julius AI's approach — "ask a question, get a chart + narrative" — separates the analytical layer (what the numbers say) from the insight layer (what they mean for decisions). Hex adds the collaborative data app layer.  
**Design Decision:** Template produces (1) a data summary, (2) key findings in plain language, (3) chart specifications (type, axes, series), and (4) recommended next analyses.

### 8. `conversational-crm`
**Pattern Source:** Salesforce Einstein, HubSpot Breeze  
**Core Insight:** HubSpot Breeze's AI assistant can answer "what's the status of Acme Corp?" from conversation history. Salesforce Einstein surfaces the next-best action based on deal stage signals.  
**Design Decision:** Template accepts CRM context (account, contacts, deal stage, last interactions) and produces a natural-language status summary plus a ranked next-action list.

### 9. `doc-to-action`
**Pattern Source:** Claude Artifacts, Notion AI  
**Core Insight:** Claude's Artifacts feature transforms documents into interactive outputs. Notion AI's "extract action items from this doc" captures the simpler, high-frequency pattern.  
**Design Decision:** Template extracts structured actions, deadlines, owners, and dependencies from unstructured documents. Outputs a machine-readable task list with priority scores.

### 10. `meeting-to-crm-update`
**Pattern Source:** Gong, Salesloft, HubSpot Breeze  
**Core Insight:** Gong's core value is automatic call transcript → CRM field update. It extracts: next steps, objections raised, competitors mentioned, deal risk signals, and forecast category change recommendations.  
**Design Decision:** Template produces a complete CRM update payload — field-by-field — plus a narrative call summary. Includes objection handling notes and recommended follow-up sequence.

### 11. `threat-intel-briefing`
**Pattern Source:** Recorded Future, Tanium, CrowdStrike  
**Core Insight:** Recorded Future pioneered the machine-speed threat brief — OSINT signals from 200+ sources fused into an actor-attributed, sector-specific risk brief. The key elements: actor profile, TTPs, infrastructure indicators, recommended countermeasures.  
**Design Decision:** Template enforces actor attribution with confidence levels. Includes MITRE ATT&CK TTP codes. Separates confirmed indicators from inferred patterns. Produces a prioritized countermeasure list.

### 12. `video-storyboard`
**Pattern Source:** Runway ML, Sora, HeyGen  
**Core Insight:** Runway ML's scene-level control enables "brief → shot list → video" workflows. The missing piece in most tools is structured scene metadata that can drive both human editors and AI generation systems.  
**Design Decision:** Template produces a per-scene storyboard (scene number, visual description, camera motion, dialogue/VO, duration, transition) in a format consumable by both video AI APIs and human directors.

### 13. `legal-risk-extract`
**Pattern Source:** Harvey AI, Lexis+ AI  
**Core Insight:** Harvey AI's contract review AI excels at clause-level risk classification — each clause is tagged with risk category (liability, indemnification, IP, termination), severity, and fallback language.  
**Design Decision:** Template accepts contract text and extracts: clause inventory, risk matrix (severity × likelihood), missing standard clauses, and priority negotiation targets.

### 14. `cold-outreach`
**Pattern Source:** Superhuman, Apollo, Clay  
**Core Insight:** Apollo's AI personalization + Clay's enrichment data + Superhuman's writing tone combine into the ideal cold outreach system. The key: *why this person, why now, why us* — never generic value props.  
**Design Decision:** Template requires ICP profile, prospect research signals, and sender context. Produces: subject line variants (3), email body (150–200 words), follow-up sequence (3 touches), and personalization rationale.

### 15. `maritime-risk-brief`
**Pattern Source:** Windward, Pole Star, Kpler  
**Core Insight:** Windward's vessel behavior AI detects dark activity (AIS manipulation, STS transfers) by analyzing movement patterns against geopolitical risk overlays. Kpler adds commodity flow context. The output is a vessel-specific risk brief.  
**Design Decision:** Template accepts vessel IMO, route data, and contextual signals (sanctions lists, geopolitical overlays, weather). Produces a structured risk brief: sanctions exposure, dark activity indicators, route risk score, and recommended actions.

### 16. `executive-briefing`
**Pattern Source:** Perplexity, Granola, Claude  
**Core Insight:** The C-suite brief format pioneered by Perplexity Pages and refined by Claude's long-form synthesis: structured, scannable, citation-backed. Granola adds the "from meeting content" ingestion path.  
**Design Decision:** Template accepts multi-source inputs (meeting recaps, reports, signals). Produces a 5-section executive brief: situation summary, key decisions, risks & opportunities, recommended actions, and open questions.

---

## Vertical Coverage Matrix

| Vertical | Kernel(s) Wired | Page Wired |
|---|---|---|
| **Sentra** (TENAX) | `threat-intel-briefing` | `threat-overview.tsx` |
| **Counsel** | `ambient-capture-recap` | `decision-center.tsx` |
| **Terra** (DOMAINE) | `contact-enrichment` | `agent-insights.tsx` |
| **Vessels** (SEXTANT) | `maritime-risk-brief` | `maritime-intelligence.tsx` |
| **Pulse** (LUMINA) | `executive-briefing` | `BriefingEngine.tsx` |
| **Lyte** (KORA) | `decision-intelligence` | `decision-center.tsx` |
| **Command** | `voice-to-action` | `decision-center.tsx` |
| **Aegis** (PARAGON) | `research-and-cite` | `agent-insights.tsx` |
| **Carlota Jo** | `conversational-crm` | `ai-advisory.tsx` |
| **SZL Holdings** | `meeting-to-crm-update` | `alloy-page.tsx` |
| **PRAXIS Sandbox** | `deck-from-brief` | `PromptRegistry.tsx` |

---

## Governance Standards

### Versioning
- SemVer on each kernel (`major.minor.patch`)
- Breaking changes (renamed template variables, removed codex fields) → major bump
- New optional fields → minor bump
- Documentation/example updates → patch bump

### Evidence Standards
- Kernels in `intelligence` and `legal` domains require minimum citation counts
- `research-and-cite`: ≥2 citations required
- `threat-intel-briefing`: ≥1 source and actor attribution required
- `legal-risk-extract`: ≥1 contract document required

### Refusal Policy Design
Every kernel declares explicit refusal triggers to prevent silent hallucination:
- Missing required evidence → refuse with escalation target
- Out-of-scope requests → redirect to appropriate kernel
- Stale/unverifiable data → flag and offer partial output

### Evaluation Rubric Standards
- Weights per kernel must sum to ≤1.0
- Each criterion has a `passingThreshold` (0–1)
- Rubric is designed to be computable via keyword matching + semantic scoring

---

## Future Roadmap

| Priority | Kernel ID | Domain | Rationale |
|---|---|---|---|
| High | `regulatory-compliance-scan` | legal | Maps contract/policy text to regulatory frameworks |
| High | `supply-chain-risk-brief` | logistics | Commodity + geopolitical risk for supply chain ops |
| Medium | `investor-update-draft` | finance | Quarterly update from KPI data |
| Medium | `technical-due-diligence` | finance | Code/architecture review → investment risk summary |
| Low | `product-roadmap-synthesis` | strategy | Research + user feedback → prioritized roadmap |

---

*Alloy Codex Prompt Kernel Library — Confidential — SZL Holdings*  
*Built with patterns from: Perplexity, Claude, Granola, Fireflies, Otter, Superhuman, Motion, Julius AI, Noteable, Hex, Clay, Salesforce Einstein, Apollo, HubSpot Breeze, Gamma, Beautiful.ai, Tome, Gong, Recorded Future, Harvey AI, Runway ML*
