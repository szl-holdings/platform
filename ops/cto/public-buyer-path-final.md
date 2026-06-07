# Public Buyer Path — Final

**Status:** Final  
**Date:** April 16, 2026  
**Authority:** CTO Pass Phase A

---

## Overview

Five distinct buyer paths are now implemented on the public site. Each path has a clear entry point, a logical content sequence, and a conversion action. This document locks the intended journey for each audience type.

---

## Path 1: Executive Buyer

**Entry point:** Homepage hero → "Explore the platform" (`/platform`)  
**Or:** Homepage audience strip → "Executive buyer" tile → `/platform`

**Content sequence:**
1. `/platform` — Platform overview: Lyte, Alloy, the value loop, operating architecture
2. `/lyte` — Lyte operator console: specific capabilities, approval queue, ownership gap tracking
3. `/roi` — ROI calculator: quantify the cost of execution latency
4. `/demo` — Request a demo: conversion action

**Conversion action:** Request a demo  
**Secondary:** Become a design partner (`/design-partner`)

**What they need to see:**
- The problem is real and specific (not "AI for operations")
- The platform delivers visibility before damage compounds
- The company is credible and builder-led

---

## Path 2: Technical Evaluator

**Entry point:** Nav → Platform → Architecture  
**Or:** Homepage audience strip → "Technical evaluator" tile → `/architecture`

**Content sequence:**
1. `/architecture` — Eight-layer architecture, component responsibilities
2. `/alloy-fabric` — Alloy execution fabric: connector mesh, workflow routing, proof chain
3. `/docs` — Documentation: control plane, worldline event fabric, proof chain design
4. `/docs/architecture` — Deep architecture docs
5. `/trust/architecture` — Trust architecture: how data flows, where controls live

**Conversion action:** Request a demo (technical) or contact (`/contact`)

**What they need to see:**
- The platform has a real, defensible architecture — not a wrapper
- Each component has a single responsibility
- The proof chain is a genuine audit mechanism, not a log
- Integration surface is well-defined (connector mesh, SCIM, SSO, GraphQL)

---

## Path 3: Security Reviewer

**Entry point:** Nav → Trust → Trust Center  
**Or:** Homepage audience strip → "Security reviewer" tile → `/trust`  
**Or:** Homepage trust section → "View the Trust Center"

**Content sequence:**
1. `/trust` — Trust center index: full diligence overview
2. `/trust/security` — Security controls and posture
3. `/trust/ai` — AI governance: model accountability, source attribution, no hallucination policy
4. `/trust/governance` — Compliance architecture: policy routing, governance-grade audit
5. `/docs/proof-chain` — Proof chain technical design

**Conversion action:** Contact security team (`/contact`) or request a demo

**What they need to see:**
- Human-in-the-loop controls on every consequential action
- Source attribution on all model outputs
- Immutable audit trace for every action and inference
- Policy routing is architectural, not a compliance retrofit
- AI governance is built into Alloy's action primitive

---

## Path 4: Design Partner

**Entry point:** Nav → Company → Design Partners  
**Or:** Homepage hero → "Become a design partner"  
**Or:** Homepage audience strip → "Design partner" tile → `/design-partner`

**Content sequence:**
1. `/design-partner` — Design partner program: what it means, what you get, how to apply
2. `/founder` — Founder page: who runs design-partner conversations
3. `/operating-doctrine` — How SZL builds: first-principles, no fake traction
4. `/demo` — Request a demo or apply

**Conversion action:** Apply to become a design partner (form on `/design-partner`)  
**Secondary:** Contact directly (`/contact`)

**What they need to see:**
- The program is founder-led and personal
- Design partners get direct access, not a sales process
- The architecture is real and ready to instrument
- No fake traction, no generic AI platform pitch

---

## Path 5: Investor

**Entry point:** Nav → Company → Investor Relations  
**Or:** Homepage audience strip → "Investor" tile → `/investor`

**Content sequence:**
1. `/investor` — Investor hub: market thesis, stage, and data room access request
2. `/company` — Company overview: mission, discipline, founder-led
3. `/founder` — Founder background and approach
4. `/operating-doctrine` — Operating philosophy: how capital will be deployed
5. `/architecture` — Technical moat: eight-layer architecture, proof chain

**Conversion action:** Request data room access (form on `/investor`)  
**Secondary:** Contact directly (`/contact`)

**What they need to see:**
- The market is real and the timing is right (execution latency has a cost in every domain)
- The architecture creates genuine moat (not a wrapper, not an integration)
- The founder is credible and runs every investor conversation personally
- The company is at design-partner stage — no fake traction, no inflated metrics
- Domain packs create a compounding land-and-expand model

---

## Cross-Path: Trust Discovery

Trust is discoverable from every path:
- **Nav:** Trust dropdown is always visible in the main navigation
- **Homepage:** Trust section with proof points (human-in-the-loop, source attribution, audit trace, policy routing) + "View the Trust Center" CTA
- **Investor path:** Architecture link from investor hub leads to proof chain docs
- **Technical path:** Trust architecture is the final step in the technical evaluator sequence
- **Security path:** The primary dedicated path, fully implemented

---

## CTA Hierarchy on Homepage

| Priority | CTA | Audience | Destination |
|---|---|---|---|
| 1st | Request a demo | All, especially executive buyers | `/demo` |
| 2nd | Explore the platform | Executive + technical evaluators | `/platform` |
| 3rd | Become a design partner | Active prospects | `/design-partner` |
| Audience strip | 5 × audience tiles | Rapid self-sorting | Each path entry |

---

## What Is Not Implemented in Phase A

- Gated content (data room, detailed diligence pack) — Phase B / Trust system
- Account-based personalization
- Conversion tracking / funnel analytics by audience segment
- Demo scheduling integration (Calendly or equivalent)
- Design partner application backend beyond contact form
