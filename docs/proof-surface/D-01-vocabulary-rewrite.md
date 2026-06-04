# Track D-01 — Buyer Copy Rewrite Guide

**Document ID:** COPY-D-01
**Audience:** Anyone touching customer-facing copy on `szlholdings.com`, in product, in pitch decks, in emails
**Goal:** Replace "command" / "AGI" / generic-AI vocabulary with regulated-monitoring vocabulary that NYSTEC, primes, and government buyers can accept without internal pushback.

---

## 1. The single most expensive word on our site today

**"Command."** It appears across pages — `command-center.tsx`, `command-newsletter.tsx`, `helm-console.tsx`, `core-command.tsx`, `decisioning-command.tsx`, `pipeline-command.tsx`, `nexus-command.tsx`, `revenue-fusion.tsx` — and it is the single biggest reason a procurement reviewer puts down our pitch deck.

"Command" reads as either (a) a NORAD knockoff or (b) tech-startup grandiosity. Neither is what a state CIO wants to hand to a legislative oversight committee.

The replacement vocabulary is **regulated monitoring** vocabulary: words that already live in NIST, NYS DFS Part 500, FedRAMP, HIPAA, SOC 2, and ISO 27001 documents.

## 2. Vocabulary substitution table

Apply these substitutions globally in marketing copy. Internal product code names can stay (SP-001 etc.); the *user-visible labels* are what we change.

| Before | After |
|---|---|
| Command Center | Operations Console |
| Command Surface | Operator Workspace |
| Decisioning Command | Decision Workspace |
| Pipeline Command | Pipeline Operations |
| Revenue Fusion | Revenue Operations |
| Helm Console | Operations Console |
| Threat Command | Threat Operations |
| Aegis Home | Operations Home |
| Adversary Engine | Threat-Modeling Engine |
| Action Queue | Approval Queue |
| AGI Convergence | (delete entirely) |
| AI Studio | Content Studio |
| Brain / Cortex | (delete; use product name) |
| Autopilot | Supervised Automation |
| Wartime / Battlestation | (delete entirely) |
| Magic / Wizard | Guided Workflow |
| Self-improving AI | Continuous-evaluation AI |
| Reasoning Engine | Workflow Engine |
| Decisioning AI | Recommendation System |

## 3. Claim substitution table

The vocabulary swap is necessary; it is not sufficient. Many *claims* across the site need to be tightened so they survive cross-examination by an auditor.

| Before (claim) | After (claim) |
|---|---|
| "Self-healing infrastructure" | "Detected-and-reverted incidents are anchored to the evidence ledger" |
| "Autonomous AI agents" | "Supervised agents that take action only within an approved policy envelope" |
| "Replaces your security team" | "Augments your security team with documented playbooks" |
| "Trained on the entire internet" | "Deployed with model providers documented in our sub-processor list; no SZL-side training on customer data" |
| "Solves AI hallucinations" | "Constrains model outputs to retrieved evidence and surfaces faithfulness scores per response" |
| "Predicts the future" | "Surfaces probabilistic forecasts with documented model and evaluation methodology" |
| "Plugs into anything" | "Integrates with the listed source and destination connectors" |
| "Bank-grade security" | "AWS GovCloud (US) deployment available; SOC 2 Type II report planned 2027-Q4" |
| "FedRAMP-authorized" anywhere it is currently said | "Not yet FedRAMP-authorized; roadmap published" |

## 4. Page-by-page rewrite priority list

Pages identified from `artifacts/szl-holdings/src/pages/` master list, prioritized by buyer visibility:

### P0 — touched in the first NYSTEC walkthrough

- `landing.tsx` — primary marketing landing
- `solutions.tsx` — primary buyer landing for products
- `how-it-works.tsx` — top of buyer evaluation
- `trust.tsx` — trust hub (replaced by `/governance` per Track C)
- `security.tsx` — security overview
- `pricing.tsx` — pricing
- `contact.tsx` — contact form
- `about.tsx` — about
- `governance.tsx` — replaced by Track C-01

### P1 — touched during evaluation

- `solutions-aegis.tsx`, `solutions-aegis-trust.tsx` (Sentra solutions)
- `solutions-prism-counsel.tsx`, `solutions-prism-counsel-trust.tsx` (paused, but live)
- `solutions-vessels.tsx`, `solutions-vessels-trust.tsx` (paused, but live)
- `solutions-terra.tsx`, `solutions-terra-trust.tsx` (paused, but live)
- `pilot-aegis.tsx`, `pilot-prism-counsel.tsx`, `pilot-terra.tsx`, `pilot-vessels.tsx`
- `case-studies.tsx`
- `roadmap.tsx`, `public-roadmap.tsx`
- `developers.tsx`, `api-page.tsx`
- `architecture-page.tsx`, `platform-architecture.tsx`

### P2 — touched only by careful researchers

- `command-center.tsx` → rewrite or remove from public navigation
- `helm-console.tsx` → rewrite or move to `/internal/`
- `pipeline-command.tsx` → `/operations/pipeline.tsx` (renamed)
- `decisioning-command.tsx` → `/decisions.tsx`
- `aeep-command.tsx`, `nexus-command.tsx`, `core-command.tsx` → either rename or de-link from public nav

### P3 — keep but rename

Internal-only operator pages (admin-*, ops-*, atlas-approvals, action-queue, etc.) keep their current vocabulary because their audience is SZL operators, not buyers.

## 5. Hero rewrites for the P0 pages

Drop-in copy.

### 5.1 `landing.tsx` — hero

**Before (current style):**
> "The AI Command Center for the modern enterprise."

**After:**
> "Audit-grade AI for regulated work.
>
> A11oy is the agent fabric. Sentra is its cyber-resilience surface. Amaru is its data-sync surface. Every decision they make is anchored in an append-only evidence ledger you can replay back to its primary source."

CTAs: "Watch the 90-second demo" → `/demo` · "Read our governance posture" → `/governance` · "Email procurement" → mailto

### 5.2 `solutions.tsx` — hero

> "Three products. One audit trail.
>
> A11oy orchestrates the agents. Sentra defends the environment they run in. Amaru keeps the data they consume coherent across systems. Every action is anchored, classified, and replayable — by you, in public, at our `/replay-attestation` endpoint."

### 5.3 `how-it-works.tsx` — three-step block

> 1. **Ingest from the source.** Katzilla pulls authoritative data (Federal Register, FDA, FEMA, Census, BLS, FRED, CourtListener) and hash-anchors every record.
>
> 2. **Run an A11oy agent.** Each step records inputs, decision, output, and a BLAKE3 anchor. Replay any production run deterministically.
>
> 3. **Route the result through Amaru.** Records are classified (Public / Internal / PII / CUI), policy-checked, and sent to your warehouse, ERP, or analytics layer with a logged hop history.
>
> Sentra watches the whole chain and surfaces playbook-driven response when the chain breaks.

### 5.4 `security.tsx` — opening paragraph

> "Security at SZL Holdings means three things together: append-only evidence, deterministic replay, and supervised action. We don't ship 'autonomous AI.' We ship AI whose every action is recorded, replayable, and reversible — and whose policy envelope you control."

### 5.5 `pricing.tsx` — first sentence

> "We don't price by tokens. We price by the auditable workflows our agents complete on your behalf, with the evidence to prove the work."

### 5.6 `contact.tsx` — replacement form-side copy

> "Procurement officers, prime contractors, and NYSTEC reviewers — please include your agency or prime in the subject line so we can route to the right document set. We will respond within one business day with the relevant trust documents and a calendar link for a 30-minute walkthrough."

## 6. Rewriting steps (for the team or for Replit)

For each P0 page:

1. Search for every occurrence of words in §2 and §3.
2. Replace with the substituted form.
3. Update any visual elements that reinforce the old vocabulary (e.g., red "WARTIME" banners → remove).
4. Update meta tags (`<title>`, `<meta name="description">`) to match.
5. Update Open Graph image alt-text to match.
6. Run `pnpm build` and visually QA on the resulting deploy.
7. Update internal links from old slugs to new slugs (e.g., `/command-center` → `/operations/console`); add 301 redirects for old slugs to preserve any inbound links.

## 7. Acceptance criteria

- Zero occurrences of the words in §2 column 1 anywhere in the public-facing route surface.
- Hero copy on every P0 page matches §5.
- Procurement reviewer can read all P0 pages and produce a summary that does not require explanation.
- Pages still build and deploy without runtime errors.
- 301 redirects preserve any external inbound SEO.

## 8. Honest disclosure

This is a vocabulary change, not a product change. The product still does what it does. We are removing the *language* that misleads procurement reviewers about what we do — and replacing it with vocabulary they recognize.
