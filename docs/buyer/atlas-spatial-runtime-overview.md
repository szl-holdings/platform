# ATLAS Spatial Runtime — Buyer Overview

**For:** Enterprise buyers, CISOs, COOs, and domain operators  
**Date:** April 2026

---

## What is ATLAS?

ATLAS is the intelligence layer inside the SZL Holdings platform that **makes your operational data behave like a living model** — not a static dashboard.

Where traditional tools show you what happened, ATLAS shows you:

- **What the situation looks like right now**, across every domain you operate in
- **How far it has drifted from normal**, with a quantified drift score
- **What could happen next**, through scenario branches with probability-weighted outcomes
- **What happened before**, through precise replay of any past operational state

ATLAS is not a new product. It is the spatial memory layer that every SZL platform already uses — Aegis for security operations, Vessels for maritime fleet management, Terra for real estate intelligence, and Prism Counsel for matter management.

---

## Why It Matters

### The Problem with Traditional Dashboards

A dashboard tells you what your data looks like at a single point in time. It cannot tell you:
- Whether what you're seeing is normal or represents significant drift from baseline
- What options you have, and what each option is likely to produce
- Whether the decision you're about to make has been made before — and what happened

### What ATLAS Adds

ATLAS adds three capabilities that dashboards cannot provide:

**1. Scene Memory**  
Every operational entity (a vessel, a security incident, a property, a legal matter) has a maintained "scene" — a typed, versioned representation of its current state. ATLAS tracks how that scene evolves over time, flags when it drifts from baseline, and preserves a complete history.

**2. Worldline Branching**  
When a scene reaches a decision point, ATLAS creates branches: alternative paths with different assumptions and actions. Each branch carries probability-weighted outcome projections. Decision-makers see not just "what is" but "what could be" — with the evidence to support each path.

**3. Proof Chain Integration**  
Every ATLAS output carries provenance: what model generated it, what data it was based on, what confidence score was assigned, and who approved it. The full decision chain is immutable and auditable.

---

## Domain Applications

### Aegis — Security Operations

**Without ATLAS:** SOC analysts see a static incident list. Context switching between alerts loses the thread of an evolving attack.

**With ATLAS:** Every security incident is a scene. Drift Guard detects when an incident is evolving faster than expected. Scenario Forge generates containment branches — "isolate now vs. monitor" — with probability-weighted impact assessments. Approved branches execute via Alloy with a full audit trail.

**Demo scenario:** Ransomware incident branching — network isolation path vs. monitor-and-contain, with outcome projections and approval chain.

### Vessels — Maritime Intelligence

**Without ATLAS:** Fleet managers see vessel positions and voyage status. Sanctions alerts and weather events appear as separate notifications without operational context.

**With ATLAS:** Every voyage is a scene. ATLAS detects when sanctions exposure or weather severity is pushing a voyage outside its baseline corridor. Scenario Forge proposes reroute options with fuel cost and ETA projections for each path.

**Demo scenario:** Sanctions-flagged vessel reroute — Cape of Good Hope alternative with probability-weighted ETA and cost outcomes.

### Terra — Real Estate Intelligence

**Without ATLAS:** Analysts see distress filings and property scores as individual records. Due diligence is manual and disconnected from market context.

**With ATLAS:** Each property is a scene. ATLAS tracks distress progression — lis pendens, tax arrears accumulation, days on market — and flags when a property crosses acquisition thresholds. Scenario Forge models acquisition paths with IRR projections under different market conditions.

**Demo scenario:** Pre-foreclosure acquisition — direct acquisition vs. wait, with three-scenario IRR projection.

### Prism Counsel — Matter Management

**Without ATLAS:** Matter status is tracked in spreadsheets or basic matter management tools. Settlement vs. trial decisions are made without structured outcome modeling.

**With ATLAS:** Every matter is a scene. ATLAS tracks pressure signals — approaching deadlines, discovery escalation, client pressure score — and flags when a matter needs strategic attention. Scenario Forge models resolution paths with expected cost outcomes.

**Demo scenario:** Settlement vs. trial branching — accelerated settlement path with outcome projections.

---

## What ATLAS Is Not

- **Not a visualization engine.** ATLAS is a data layer. Domain-specific dashboards surface ATLAS outputs — ATLAS itself has no UI.
- **Not autonomous.** Every branch execution requires human approval. ATLAS proposes; humans decide.
- **Not a replacement for live data.** ATLAS is as good as the signals it ingests. Live data feeds improve ATLAS fidelity; demo mode uses seeded scenarios.

---

## Deployment

ATLAS operates within the SZL Holdings platform — no separate deployment is required. Feature flags allow per-domain enablement:

| Capability | Flag | Default |
|-----------|------|---------|
| Full ATLAS layer | `ENABLE_ATLAS_SPATIAL_RUNTIME` | On |
| AI branch proposals | `ENABLE_SCENARIO_FORGE` | On |
| OpenUSD visualization (future) | `ENABLE_OPENUSD_EXPORTS` | Off |
| Executive-safe output mode | `ENABLE_EXECUTIVE_SAFE_MODE` | Off |

---

*See also: [Architecture](../architecture/atlas-spatial-runtime.md) · [Trust Controls](../trust/atlas-spatial-runtime-controls.md) · [Investor Moat](../investor/atlas-spatial-runtime-moat.md)*
