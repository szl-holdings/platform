# PRAXIS — Deferred Third-Party Leaders

This document records the third-party agent projects that were evaluated during the PRAXIS Leaders Foundation task (Task #3707) and **not adopted**. The rationale is captured here so future contributors understand the decisions and can revisit them with updated context.

---

## AutoHedge

**Repo:** `autohedge` (various)
**Reason not adopted:** Regulatory — autonomous trading and hedging strategies must meet MiFID II, SEC, and FINRA requirements before any AI-assisted execution. PRAXIS is not currently licenced or reviewed for financial execution decisions. Any integration would require regulatory counsel sign-off and a dedicated policy tier. Revisit after Counsel × Fincept Terminal integration is complete and the legal team has reviewed the execution risk surface.

---

## Vibe-Trading

**Repo:** `vibe-trading` (various)
**Reason not adopted:** Regulatory + strategic — "vibe-based" trading strategies rely on sentiment signals and social data in ways that may constitute market manipulation or unlicensed investment advice depending on jurisdiction. The license terms vary across forks, and the upstream provenance is inconsistent. Revisit only after a full legal review and a clear definition of what "advisory" vs "execution" means under SZL Holdings' regulatory posture.

---

## Open-Generative-AI

**Repo:** `open-generative-ai` (various community forks)
**Reason not adopted:** License — the project has fragmented licensing across its modules (GPL, AGPL, proprietary components) with no single SPDX identifier. Bundling would require a full license audit by legal. Additionally, the upstream maintenance is inconsistent. We prefer projects with clear MIT/Apache-2.0 licensing and active maintainers. Revisit if the project consolidates under a clear permissive license.

---

## ClawRouter

**Repo:** `ClawRouter` (various)
**Reason not adopted:** Strategic infrastructure decision — replacing the PRAXIS LLM router is an architectural change that requires a dedicated spike, performance benchmarks against the current `@szl-holdings/ai-control-plane` model router, and approval from the platform team. ClawRouter is interesting (dynamic routing based on cost + latency) but the switching cost and risk surface of replacing a core component mid-platform is too high for this task scope. Tracked separately as a strategic infra decision. Revisit after the AI control plane roadmap review.

---

## Cloudflare Agents (pattern reference — not deferred)

**Note:** Cloudflare Agents was _not_ deferred — it is captured in the active registry as a `pattern-reference`. The durable, hibernating per-session agent model it demonstrates directly informs the PRAXIS Workcell roadmap. No runtime swap is planned in this task, but the pattern is documented in the registry for future architecture decisions.

---

*Last reviewed: Task #3707 — PRAXIS Leaders Foundation*
*Owner: Platform Engineering*
