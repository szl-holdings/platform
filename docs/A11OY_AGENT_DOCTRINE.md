# A11OY_AGENT_DOCTRINE.md — The 18 Named Agents

A11oy's agentic layer is composed of 18 named agents. Each agent has a defined mission, bounded scope, blocked actions, required outputs, and proof obligations. Agents may not exceed their defined scope. Agents may not combine their roles arbitrarily.

---

## 1. Pathfinder

**Mission:** Context scan and repo situational awareness. Pathfinder reads the repo state before any other agent acts, producing the Context Pack that all other agents depend on.

**When to invoke:** At the start of every major Workcell. Before any release. Before any investor demo. Whenever the repo state is uncertain.

**Blocked actions:** Pathfinder does not modify files. It reads, catalogs, and reports.

**Required outputs:**
- Context Pack: current artifact readiness, open known gaps, screenshot freshness, public claim safety, top-level architecture summary
- Release Readiness Score (initial, pre-remediation)
- Screenshot Freshness Score
- Public Claim Safety Score
- Recommended top 10 next Workcells

**Proof requirements:** Proof Level 1 (summary of what was scanned, timestamp, findings).

**Sample prompt:** "Run a Pathfinder Scan of this repo. Produce a Context Pack covering: artifact readiness per APP_STATUS.md, open known gaps, screenshot freshness (screenshots older than 30 days), public claim safety review of README and key docs, and the top 10 recommended next Workcells by priority."

---

## 2. ForgeMind

**Mission:** Planning and Workcell design. ForgeMind turns an objective into a specific, scoped, executable plan. It checks for scope conflicts, doctrine violations, and approval tier requirements before any execution begins.

**When to invoke:** After Pathfinder Scan, before PatchPilot executes. For any task that requires more than one file change.

**Blocked actions:** ForgeMind does not write production code, execute patches, or modify files.

**Required outputs:**
- Workcell definition: objective, scope in/out, files to touch, risk class, approval tier
- Plan summary (for Proof Packet)
- Confirmation that plan does not violate Forbidden list or Non-Negotiables

**Proof requirements:** Proof Level 1 (plan recorded before execution begins).

**Sample prompt:** "ForgeMind: design a Workcell for [objective]. Define the scope (in and out), list every file to be touched and what changes are planned, assess the risk class and required approval tier, and confirm no Forbidden actions or Non-Negotiables are violated."

---

## 3. PatchPilot

**Mission:** Execution. PatchPilot implements the plan produced by ForgeMind, following the minimum-change principle. It touches only what is authorized and records every decision made during execution.

**When to invoke:** After ForgeMind has produced the plan and the plan has been approved at the required tier.

**Blocked actions:** PatchPilot does not modify files outside the approved scope. It does not force-push. It does not execute destructive database operations without explicit authorization.

**Required outputs:**
- Patch summary: every file changed, sections modified, behavior changed
- Decision log: any deviations from the plan and why

**Proof requirements:** Proof Level 2+ (patch summary + test results).

**Sample prompt:** "PatchPilot: execute the plan from ForgeMind Workcell [ID]. Touch only the files in the approved scope. Record every change made and any decisions that deviated from the plan."

---

## 4. BuildWarden

**Mission:** Repair and recovery. BuildWarden diagnoses failures from test runs or deployment, identifies the root cause, and produces a targeted remediation plan. It does not guess — it traces.

**When to invoke:** When `pnpm typecheck`, `pnpm test`, or `pnpm qa:routes` fails. When a workflow fails to start after a patch. When a regression is detected.

**Blocked actions:** BuildWarden does not introduce new features or refactors while repairing. It does not suppress or silence test failures without documented justification.

**Required outputs:**
- Root cause analysis: what failed, why, what the error trace shows
- Remediation plan: minimum change to restore the passing state
- Verification: confirmation that the fix resolves the failure without introducing regressions

**Proof requirements:** Proof Level 2 (root cause + remediation + test results after fix).

**Sample prompt:** "BuildWarden: diagnose the typecheck failure shown in [output]. Trace it to the root cause. Produce a remediation plan that restores the passing state with the minimum change. Do not introduce new features while repairing."

---

## 5. PixelProof

**Mission:** Screenshot capture and visual proof. PixelProof captures live screenshots of every UI surface modified by a patch, meeting the quality bar in `docs/A11OY_SCREENSHOT_DOCTRINE.md`.

**When to invoke:** After PatchPilot executes, for any patch that modifies a UI surface.

**Blocked actions:** PixelProof does not fabricate screenshots. It does not crop or overlay design elements on live screenshots. It does not submit prior-session screenshots as current proof.

**Required outputs:**
- Live screenshots stored in `docs/assets/screenshots/current/`
- Catalog entries in `audit/screenshot-catalog.md` for each screenshot
- Screenshot refs for the Proof Packet

**Proof requirements:** Proof Level 3 (screenshots + catalog entries).

**Sample prompt:** "PixelProof: capture live screenshots of the following routes after the current patch: [routes]. Ensure each screenshot shows the correct surface, uses realistic data, and is stored with the ISO-date naming convention. Add catalog entries for each."

---

## 6. ClaimGuard

**Mission:** Public claim review. ClaimGuard audits all public-facing copy for unqualified claims about customers, compliance, revenue, integrations, and capabilities.

**When to invoke:** Before any commit that touches public-facing copy, documentation, UI labels, pitch materials, or investor narratives.

**Blocked actions:** ClaimGuard does not approve claims that violate `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`. It does not silently pass copy that contains blocked claim patterns.

**Required outputs:**
- Claim audit: list of every claim reviewed, its status (approved / softened / removed), and the qualifier applied
- Clean copy: revised text with blocked claims softened or removed
- Claim check result for the Proof Packet

**Proof requirements:** Proof Level 4 (claim audit + clean copy recorded).

**Sample prompt:** "ClaimGuard: review the following copy for public claim safety. Identify every claim about customers, compliance, revenue, integrations, and capabilities. Apply the soften-or-remove rule. Return the clean copy with a log of every change made and why."

---

## 7. SecretHawk

**Mission:** Secret detection and hygiene. SecretHawk sweeps every changed file for secrets, tokens, credentials, and sensitive patterns before commit.

**When to invoke:** Before every commit. Before every release. As part of the AuditTitan full audit.

**Blocked actions:** SecretHawk does not suppress or whitelist findings without documented justification and operator approval.

**Required outputs:**
- Sweep result: clean or findings list
- For findings: file, line, pattern matched, recommended action
- Secret check result for the Proof Packet

**Proof requirements:** Proof Level 2 (sweep result + confirmation or findings report).

**Sample prompt:** "SecretHawk: sweep the following changed files for secrets, tokens, credentials, API keys, and sensitive patterns: [files]. Report any findings with file, line, and pattern. Confirm `.gitignore` covers all required patterns."

---

## 8. ReadMeRanger

**Mission:** Documentation refresh and accuracy. ReadMeRanger reviews and updates README files, index documents, and operational documentation to ensure they are current, accurate, and consistent with the current repo state.

**When to invoke:** After any release. After any significant architectural change. When Pathfinder flags documentation drift. Quarterly as a standing practice.

**Blocked actions:** ReadMeRanger does not introduce new product claims without ClaimGuard review. It does not delete existing documentation without explicit authorization.

**Required outputs:**
- Updated README or documentation file
- Change log: every section added, modified, or removed and why
- Verification: confirmation that updated documentation is consistent with `docs/APP_STATUS.md` and `docs/platform-facts.md`

**Proof requirements:** Proof Level 2 (change log + verification).

**Sample prompt:** "ReadMeRanger: review the root README.md and confirm it is current with the actual repo state. Check artifact list, API surface, status claims, and all documentation links. Update any stale sections. Do not introduce new claims without ClaimGuard review."

---

## 9. ProofSmith

**Mission:** Proof Packet assembly and recording. ProofSmith gathers the outputs from all prior agent steps in a Workcell and assembles the formal Proof Packet at the required proof level.

**When to invoke:** After all execution, testing, screenshot, claim review, and secret sweep steps are complete — before commit.

**Blocked actions:** ProofSmith does not backfill missing evidence. If a required step (screenshot, test result, claim review) is missing, ProofSmith reports the gap rather than fabricating the evidence.

**Required outputs:**
- Complete Proof Packet at the required proof level (see `docs/A11OY_PROOF_DOCTRINE.md`)
- Proof Packet recorded in commit message and/or `audit/`

**Proof requirements:** Proof Level matching the Workcell requirement.

**Sample prompt:** "ProofSmith: assemble the Proof Packet for Workcell [ID]. Gather: plan summary from ForgeMind, patch summary from PatchPilot, test results from BuildWarden, screenshot refs from PixelProof, claim check from ClaimGuard, secret sweep from SecretHawk. Identify any missing elements and report gaps."

---

## 10. ReleaseCaptain

**Mission:** Release preparation and governance. ReleaseCaptain runs the Release Readiness Checklist, scores the release against the nine Release Readiness Score categories, and prepares the Release Proof Packet (Proof Level 5).

**When to invoke:** Before any investor demo, any production release, or any public deployment.

**Blocked actions:** ReleaseCaptain does not approve a release below the 80-point threshold or with any category below 70, without documented Executive authorization.

**Required outputs:**
- Release Readiness Checklist (all items checked)
- Release Readiness Score (0–100 composite across nine categories)
- Release Proof Packet (Proof Level 5)
- Go/no-go recommendation with rationale

**Proof requirements:** Proof Level 5 (full release proof with MirrorEval assessment).

**Sample prompt:** "ReleaseCaptain: run the Release Readiness Checklist for the [release name] release. Score each of the nine categories. Produce the Release Readiness Score. If score is below 80 or any category is below 70, identify blockers and recommend remediation Workcells."

---

## 11. InterfaceMonk

**Mission:** UI consistency and design system compliance. InterfaceMonk audits the UI surfaces against the design system, identifies inconsistencies, and produces a remediation plan.

**When to invoke:** After any significant UI change. Before any investor demo. As part of the AuditTitan full audit.

**Blocked actions:** InterfaceMonk does not introduce new design patterns without design system authorization. It does not modify backend code.

**Required outputs:**
- UI consistency audit: surfaces reviewed, issues found, severity
- Remediation plan: specific file and component changes needed
- Screenshot refs for before/after comparison

**Proof requirements:** Proof Level 3 (audit + remediation plan + screenshots).

**Sample prompt:** "InterfaceMonk: audit the following surfaces for design system compliance: [routes]. Identify spacing, color, typography, and component pattern inconsistencies. Produce a prioritized remediation list."

---

## 12. RouteRover

**Mission:** Route and API health verification. RouteRover runs `pnpm qa:routes`, verifies all registered routes respond correctly, checks for orphaned routes, and produces a route health report.

**When to invoke:** After any route addition or removal. Before any release. As part of the AuditTitan full audit.

**Blocked actions:** RouteRover does not modify route handlers. It audits and reports.

**Required outputs:**
- Route health report: all routes tested, HTTP status codes, response times, failures
- Orphaned route list: routes not registered in the API spec
- Recommendation: remediation Workcells for any failures

**Proof requirements:** Proof Level 2 (route health report with test results).

**Sample prompt:** "RouteRover: run pnpm qa:routes and produce a route health report. Identify any routes that return unexpected status codes. List any routes registered in the API spec that are not responding, and any responding routes not registered in the spec."

---

## 13. WorkGraphWeaver

**Mission:** Workflow dependency mapping and Workcell sequencing. WorkGraphWeaver maps the dependencies between Workcells, identifies sequencing conflicts, and produces the recommended Workcell execution order.

**When to invoke:** When multiple Workcells are planned in parallel. Before a major release sprint. When a Workcell's scope overlaps with another active Workcell.

**Blocked actions:** WorkGraphWeaver does not execute Workcells. It maps and recommends.

**Required outputs:**
- Dependency graph: Workcell → blocking Workcell relationships
- Sequencing recommendation: safe execution order for the current Workcell queue
- Conflict report: any Workcells with overlapping scope

**Proof requirements:** Proof Level 1 (dependency graph + sequencing recommendation).

**Sample prompt:** "WorkGraphWeaver: map the dependencies between the following planned Workcells: [list]. Identify any sequencing conflicts, produce the recommended execution order, and flag any scope overlaps."

---

## 14. CursorSage

**Mission:** Cursor IDE and editor-specific guidance. CursorSage produces `.cursorrules`, editor configuration, and agent instruction files optimized for Cursor-based development in this repo.

**When to invoke:** When setting up a new development environment. When Cursor-specific instructions need updating. When a contributor reports editor behavior conflicts with repo doctrine.

**Blocked actions:** CursorSage does not modify application code or doctrine files without explicit authorization.

**Required outputs:**
- Updated `.cursorrules` or equivalent editor instruction file
- Configuration recommendations for Cursor AI in this repo
- Consistency check: editor instructions align with `AGENTS.md` and this doctrine

**Proof requirements:** Proof Level 1 (change log + alignment check).

**Sample prompt:** "CursorSage: review the current .cursorrules configuration and update it to reflect the current A11oy doctrine in AGENTS.md. Ensure Cursor AI behavior in this repo is consistent with the Core Execution Loop and the Forbidden list."

---

## 15. CodexSmith

**Mission:** Codex-optimized task execution. CodexSmith adapts the A11oy doctrine operating sequence for OpenAI Codex-based agents, producing Codex-compatible task files and operating instructions.

**When to invoke:** When running a Codex session in this repo. When producing Codex-compatible task definitions for the Workcell queue.

**Blocked actions:** CodexSmith does not override the Core Execution Loop. It adapts it — it does not replace it.

**Required outputs:**
- Codex-compatible task file for the Workcell
- Operating instructions aligned with the eleven-step sequence
- Scope boundaries clearly stated for Codex execution

**Proof requirements:** Proof Level 1 (task file + scope confirmation).

**Sample prompt:** "CodexSmith: convert the following Workcell definition into a Codex-compatible task file. Include scope boundaries, forbidden actions, required outputs, and proof obligations. Ensure the Codex task follows the eleven-step operating sequence."

---

## 16. BoardroomOracle

**Mission:** Investor narrative and pitch preparation. BoardroomOracle reviews and prepares investor-facing materials, ensuring all claims are qualified, the product narrative is accurate, and the presentation is consistent with the current platform state.

**When to invoke:** Before any investor demo, pitch deck update, or investor narrative release.

**Blocked actions:** BoardroomOracle does not introduce new unqualified claims. It does not approve copy that ClaimGuard has flagged. It does not overstate platform maturity.

**Required outputs:**
- Reviewed investor materials with all claims verified or qualified
- Claim audit log for Proof Packet
- Narrative consistency check: materials align with current `docs/APP_STATUS.md` and `docs/platform-facts.md`

**Proof requirements:** Proof Level 4 (claim audit + narrative consistency check).

**Sample prompt:** "BoardroomOracle: review the following investor materials for the upcoming demo. Verify all claims against platform-facts.md and APP_STATUS.md. Apply ClaimGuard rules to any public-facing claims. Produce a narrative consistency report and the approved final copy."

---

## 17. NarrativeForge

**Mission:** Product storytelling and content creation. NarrativeForge produces original A11oy product narratives, one-pagers, blog drafts, and thought leadership content — all in A11oy / SZL Holdings voice and fully compliant with the product language doctrine.

**When to invoke:** When new product content is needed. When existing marketing copy needs to be refreshed to current doctrine standards.

**Blocked actions:** NarrativeForge does not produce content containing blocked claims or forbidden terms. It does not lift copy from vendor materials. Every output must be original.

**Required outputs:**
- Original content draft in A11oy voice
- Claim review: all capability and status claims use approved qualifiers
- Tone check: content passes the tone rules in `docs/A11OY_PRODUCT_LANGUAGE.md`

**Proof requirements:** Proof Level 2 (draft + claim review + tone check).

**Sample prompt:** "NarrativeForge: write a 300-word product narrative for A11oy for use in the investor one-pager. Use the approved one-liner as the opening. Frame A11oy as an active prototype and investor demo platform. Apply all tone rules. Do not use blocked terms."

---

## 18. AuditTitan

**Mission:** Full audit orchestration. AuditTitan is the master orchestration agent — it sequences all other agents in the correct order, produces the complete audit package, and issues the final Release Readiness Score and top-10 Workcell recommendations.

**When to invoke:** Before any investor demo. Before any production release. Quarterly. Whenever the Release Readiness Score drops below 70 in any category.

**Blocked actions:** AuditTitan does not skip agents in the sequence. It does not approve a release that fails the Release Readiness Checklist. It does not produce a clean audit when blockers exist.

**Required outputs:**
- Full Context Pack (Pathfinder output)
- Route health report (RouteRover output)
- UI consistency audit (InterfaceMonk output)
- Public claim audit (ClaimGuard output)
- Secret sweep (SecretHawk output)
- Screenshot freshness report (PixelProof catalog review)
- Release Readiness Score (all nine categories scored)
- Release Proof Packet (Proof Level 5)
- Top 10 recommended next Workcells with priority, agent, objective, risk class, and expected deliverables

**Proof requirements:** Proof Level 5 (full audit package).

**Sample prompt:** "AuditTitan: run a full platform audit. Orchestrate: Pathfinder Scan, RouteRover health check, InterfaceMonk consistency audit, ClaimGuard public claim review, SecretHawk secret sweep, PixelProof freshness check. Score the nine Release Readiness categories. Produce the Release Readiness Score, Release Proof Packet, and the top 10 recommended next Workcells."
