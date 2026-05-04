# Executive Summary — SZL Holdings Platform
## growth capital Investor Brief

**Produced:** Phase D, April 2026
**Audience:** growth capital investors, technical due diligence reviewers, enterprise evaluators
**Scope:** Platform thesis, architecture credibility, product status, trust posture, and readiness gaps

---

## The Problem

Enterprise operations have an accountability gap that neither dashboards nor AI copilots have closed. Dashboards show what happened. Alerts surface what is wrong. AI tools add recommendation volume. None of them tell operators what to do next, who is responsible, whether a recommended action is safe to execute, or whether the last recommended action produced the expected outcome.

The consequence: consequential decisions are made without governance. AI recommendations are accepted or ignored without audit trails. The same signal triggers three different responses across three teams with no shared record of why.

---

## What SZL Holdings Builds

SZL Holdings builds the **governed decision layer** — the infrastructure between signal detection and action execution.

```
Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome
```

Every step is instrumented. Every decision is attributed. Every AI recommendation carries source citations and confidence scores. Every consequential action requires human confirmation. The outcome is logged against the recommendation that preceded it — closing the loop that AI copilots leave open.

This is not a dashboard. It is not a copilot. It is an operating system for governed enterprise decisions.

---

## Platform Architecture

**Three core components:**

**Lyte** — The command surface. Operators observe signals, review AI recommendations, run simulations, and make governed decisions. It runs the PRISM framework (People, Revenue, Infrastructure, Security, Market) across all connected domains.

**Alloy** — The execution fabric. Signal normalization, workflow orchestration, approval controls, human-in-the-loop gates, and the immutable audit trail. This is what makes AI-assisted operations durable and accountable.

**CORTEX** — Unified mobile command (iOS and Android). All domain workspaces with biometric authentication and offline-capable sync.

**Six structural platform primitives** differentiate this from dashboards, copilots, and workflow tools:

| Primitive | Function |
|-----------|----------|
| Outcome Graph | Closed-loop tracking: recommendation to decision to outcome |
| Proof Chain | Immutable audit trail with provenance on every AI output |
| Covenant Policy | Human-in-the-loop enforced at the policy layer |
| Decision Simulation | Probabilistic simulation with confidence intervals before action |
| Workflow Engine | Durable multi-step orchestration with agent coordination |
| Event Fabric | Cross-domain signal backbone normalizing events across domain packs |

---

## Product Portfolio (Current State)

| Product | Domain | Status |
|---------|--------|--------|
| Lyte | Command surface — PRISM framework | Active |
| Alloy | Execution fabric and audit trail | Active |
| CORTEX | Unified mobile command | Active (pre-release) |
| Aegis | Security and defense intelligence | Active (web UI archived; API active) |
| Vessels | Maritime fleet intelligence | Active |
| Terra | Real estate intelligence | Active |
| Carlota Jo | Premium advisory operations | Active |
| Pulse | AI executive briefing | Active |
| Command Portal | Cross-domain real-time hub | Active |
| PRISM Counsel | Legal matter command | Archived (Task #634) |
| IMPERIUM | Cloud sovereignty | Archived (Task #920) |

Active domain packs share the Lyte + Alloy foundation and route intelligence through the PRISM Bus, a cross-domain event system. A maritime anomaly can surface a security flag. A legal filing can trigger a distress property signal. The architecture compounds with each new vertical.

---

## Technology Posture

- **Language:** TypeScript throughout (strict mode, no untyped `any` without justification)
- **Frontend:** React 19, Vite, Tailwind CSS 4, Framer Motion
- **Mobile:** Expo SDK 53 / React Native, NativeWind
- **Backend:** Express 5, Node.js 22
- **Database:** PostgreSQL 16, Drizzle ORM
- **AI:** Multi-provider (Anthropic, OpenAI, Gemini) with evidence-backed retrieval and schema-validated outputs
- **Auth:** OIDC/PKCE, role-based RBAC (11 roles), SCIM 2.0
- **Infrastructure:** Azure (App Service, PostgreSQL Flexible Server, Key Vault)
- **Monorepo:** pnpm workspace with shared libraries, cross-package TypeScript references

**CI/CD gates:** lint, typecheck, build, unit tests, integration tests, CodeQL (pinned SHA), dependency review, Gitleaks secret scan.

---

## Trust and Security Architecture

Security is structural, not policy-based:

- **Authentication:** OIDC/PKCE — no password storage. All routes require authentication via the global auth enforcer middleware.
- **Authorization:** 11-role RBAC with org-scoped isolation. All database queries include org_id scoping. Cross-tenant access returns 404 to prevent information leakage, not 403.
- **AI governance:** Advisory agents only. Covenant Policy enforces approval gates at the Alloy workflow layer. Agents cannot bypass human confirmation regardless of confidence score.
- **Audit trail:** Proof Chain writes an immutable event for every consequential action — actor, role, timestamp, decision context, and AI provenance.
- **Secrets:** No secrets committed to source control. All credentials injected via environment variables. `.env` files are gitignored. Gitleaks scheduled scan active.
- **Dependency hygiene:** Dependabot (weekly, grouped), automated `pnpm audit` gate in CI.

---

## Known Gaps (Honest Disclosure)

The following are documented in `docs/operations/known-gaps.md` and `audit/investor/risk-register.md`:

| Gap | Status | Severity |
|-----|--------|----------|
| Stripe revenue activation | In progress — partially live on Vessels, Lyte, Terra, Carlota Jo | Medium |
| Enterprise SSO / SCIM 2.0 provisioning | Planned — not GA | Medium |
| Redis session store for production | Planned — currently in-process sessions | Medium |
| Sentry error tracking | Planned — not integrated | Low |
| CORTEX mobile app store submission | Pre-release — TestFlight / Play Internal Testing pending | Low |
| Some README screenshots may not reflect latest UI | Post-redesign screenshot capture planned as follow-up | Low |

No gap affects the core governance infrastructure (Proof Chain, Covenant Policy, Outcome Graph, Workflow Engine, RBAC). The platform is functional and demonstrable at current state.

---

## Public Readiness Signal

The public GitHub surface is configured to demonstrate:

- CI, CodeQL, and security workflow badges (live, linked to Actions) — verified present
- Dependabot (weekly, grouped, npm + GitHub Actions) — `.github/dependabot.yml` verified present and current
- Branch protection on `master`/`main` with required reviews and status checks — configured per `GITHUB_SETTINGS_APPLIED.json`; operator verification required before investor outreach (see `audit/investor/manual-next-steps.md` M-01)
- Secret scanning with push protection — configured per `GITHUB_SETTINGS_APPLIED.json`; operator verification required (see M-02)
- Responsible disclosure policy (`SECURITY.md`) with 48-hour acknowledgement SLA — verified present
- Honest gap disclosure (`docs/operations/known-gaps.md`) — verified present
- Machine-generated, validated platform metrics (`docs/platform-facts.md`) — verified present; regenerate with `pnpm metrics:generate` before outreach
- Professional issue and PR templates (`.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md`) — verified present
- CODEOWNERS declaration with owner assignment for all critical paths — verified present

---

## Investment Case Summary

SZL Holdings is building the governance layer that enterprise AI deployments require but do not yet have. The platform is founder-built, production-grade, and demonstrable. It addresses a real accountability gap that existing dashboards and copilots do not close.

The architecture is differentiated by the six platform primitives — particularly Proof Chain (immutable attribution), Covenant Policy (structural human-in-the-loop), and Outcome Graph (closed-loop learning). These are not features; they are structural constraints that cannot be bolted on to existing workflow or observability tools.

The domain packs (Vessels, Terra, Aegis, Carlota Jo) demonstrate that the governance infrastructure generalizes across verticals. Each new pack is structured, not bespoke — it runs on the same Lyte + Alloy foundation with domain-specific intelligence layered on top.

**For design partner conversations, enterprise evaluation, and investment introductions:**
Contact: stephen@szlholdings.com | inquiries@szlholdings.com

---

*For the full risk register, see `audit/investor/risk-register.md`.
For the manual checklist of items requiring action outside the repo, see `audit/investor/manual-next-steps.md`.
For the complete public readiness scorecard, see `audit/investor/public-readiness-scorecard.md`.*
