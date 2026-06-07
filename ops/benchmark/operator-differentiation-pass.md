# Operator Differentiation Pass

**Last updated:** April 2026
**Purpose:** Define operator UX patterns that make Lyte/Command feel like a governed decision cockpit

---

## Competitive Operator UX Benchmarks

### Linear
- Command palette (⌘K) for universal access to any action
- Keyboard-first navigation — every action has a shortcut
- Information density without visual noise — clean typography, subtle borders
- Real-time sync — changes appear instantly across views
- Issue status as a first-class visual element (colored badges)
- Minimal chrome — maximize content area

### Rippling
- "Operating system for business" — compound platform with shared data layer
- Information density is extreme but organized — tables, filters, bulk actions
- Unified employee record as the system of record
- Platform-level capabilities (identity, permissions, workflows) shared across apps
- HRIS data flows into IT, finance, benefits automatically — no re-entry

### Vercel
- Deployment log as a real-time narrative — each step visible
- Zero-config defaults with progressive disclosure of advanced settings
- Preview deployments as proof of change
- Clean error states with actionable guidance
- Dashboard shows the one thing that matters: deployment status

### Cloudflare
- Dashboard is simultaneously simple (for basic users) and deep (for operators)
- Every feature has an API equivalent — dashboard is the UI for the API
- Analytics are inline with controls — not a separate analytics tab
- Security events shown as a timeline with severity filtering
- Workers/Pages/R2/D1 — platform products that compose

---

## SZL Operator UX Principles

### 1. Evidence-First, Not Dashboard-First
Every panel in Lyte/Command should answer: "What evidence supports this state?" Not just "what is the current state?"

| Dashboard Pattern | SZL Governed Pattern |
|-------------------|---------------------|
| "Active alerts: 7" | "Active alerts: 7 — 3 correlated across Aegis+Vessels (confidence: 87%)" |
| "Revenue: $2.4M" | "Revenue: $2.4M — 12% above Monte Carlo p50 prediction" |
| "Workflow running" | "Workflow running — approved by J. Van den Berg, policy: maritime-critical-v2" |

### 2. Decision-Ready, Not Information-Rich
Every view should lead to a decision. Information without a decision path is noise.

Inspired by Linear's approach: every list item is actionable. Every detail view has a clear "next step."

SZL adaptation:
- Signal list → each signal has "Correlate" or "Dismiss" action
- Recommendation card → "Approve," "Reject," "Simulate First," "Escalate"
- Outcome card → "Close loop" or "Flag discrepancy"

### 3. Command Palette as Governance Interface
Inspired by Linear's ⌘K pattern, but for governed operations:

```
⌘K → "approve incident-2026-0341"
⌘K → "simulate voyage MV Nordic Pioneer"
⌘K → "escalate to exec-level approval"
⌘K → "export proof chain for correlationId:abc123"
⌘K → "show decisions by J. Van den Berg last 7 days"
```

Every command in the palette is a governed action — it goes through the same Policy → Proof → Outcome pipeline as any UI-driven action.

### 4. Audit Timeline as Primary Navigation
Inspired by Cloudflare's security event timeline:
- Every decision, action, and outcome is a timeline entry
- Filter by domain, actor, severity, time range
- Expandable detail for each entry showing full receipt
- Correlation ID links related entries across domains

### 5. Loading/Error/Empty States as Trust Signals
Inspired by Vercel's deployment states:

| State | Pattern |
|-------|---------|
| Loading | "Running Monte Carlo simulation (5,000 iterations)..." with progress |
| Error | "Policy evaluation failed — Covenant engine returned error. Escalating to manual review." with actionable recovery |
| Empty | "No signals detected in Aegis domain for the last 24 hours. Last signal: 26 hours ago." with context |
| Success | "Decision approved. Proof chain ID: PC-20260416-abc1. Execution complete in 4m 12s." with receipt link |

---

## Operator Demo Flow

For live demonstrations:

1. **Signal arrival** — Show a real domain signal appearing in the signal feed (Aegis intrusion detection)
2. **Cross-domain correlation** — Show the system automatically linking Aegis + Vessels signals
3. **Recommendation** — Show the AI recommendation with confidence score and source attribution
4. **Simulation** — Run a live Monte Carlo simulation with visible iteration counter
5. **Policy gate** — Show the Covenant Policy evaluation with matched policies
6. **Execution** — Show the workflow executing with step-by-step progress
7. **Proof** — Show the proof chain record with SHA-256 hash
8. **Outcome** — Show predicted vs. actual metrics with variance
9. **Learning** — Show confidence calibration updating based on outcome

Total demo time: 3-5 minutes for the full loop.

---

## Competitive Positioning Statement

> "Most platforms show you a dashboard. SZL shows you a decision cockpit — where every signal has context, every recommendation has evidence, every action has a receipt, and every outcome feeds back into the next decision."
