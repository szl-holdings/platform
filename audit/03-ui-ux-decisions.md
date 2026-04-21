# SZL Holdings — UI/UX Overhaul Decisions

**Audit date:** 2026-04-21  
**Scope:** Strategic design and positioning decisions to guide the next task's implementation work. This is a decision record, not a design specification.

**Truth Label Key (applies to all factual claims in this document):**
- **VERIFIED** — confirmed from filesystem, grep, or direct file inspection
- **PARTIALLY VERIFIED** — partially confirmed; runtime or integration behavior not checked
- **UNVERIFIED** — asserted but not checked in this audit
- **BROKEN** — claim is contradicted by primary-source evidence

---

## Decision Context

The investor repositioning payload (attached_assets) is explicit: stop dark/gaming aesthetics, stop portfolio sprawl, stop vanity language. Move to enterprise/institutional restraint. This document captures the specific decisions that follow from an audit of the current UI state and the repositioning mandate.

---

## Current UI State (Observed)

| Artifact | Files | Dominant aesthetic | Auth pattern | Production-ready? | Audit Status |
|----------|-------|-------------------|--------------|-------------------|--------------|
| `szl-holdings` | 469 src | Corporate with heavy data panels | Redirect helper | NOT RUNNING | **VERIFIED** — file count from `find`; workflow status from system log |
| `command` | 281 src | CORTEX hub — complex multi-panel | Replit OIDC | NOT RUNNING | **VERIFIED** |
| `aegis` | 212 src | Cybersecurity command center | Replit OIDC | NOT RUNNING | **VERIFIED** |
| `carlota-jo` | 89 src | Premium advisory, lightest | Shared auth hook | NOT RUNNING | **VERIFIED** |
| `vessels` | 130 src | Maritime fleet dashboard | Replit OIDC | NOT RUNNING | **VERIFIED** |
| `terra` | 116 src | Real estate intelligence | Replit OIDC | NOT RUNNING | **VERIFIED** |
| `sentra` | 22 src | Agent mesh defense | Replit OIDC | NOT RUNNING | **VERIFIED** |
| `pulse` | 23 src | AI briefing, single-page | Local useAuth | NOT RUNNING | **VERIFIED** |
| `counsel` | 14 src | Legal skeleton | Replit OIDC | NOT RUNNING | **VERIFIED** |
| `lyte-command-center` | 23 src | Decision intelligence | Replit OIDC | NOT RUNNING | **VERIFIED** |

---

## Non-Negotiable Design Directives (from investor payload)

1. **One primary platform narrative** — not a portfolio of apps
2. **Two proof modules maximum** on any homepage or landing surface
3. **No gaming/cyberpunk/sci-fi aesthetic** — enterprise restraint only
4. **No hype language** — replace claims with verifiable proof statements
5. **Restrained premium visual system** — closer to New Relic / Figma / Bloomberg Terminal than a startup dashboard
6. **Clear enterprise buyer, clear pain, clear outcome, clear proof** on every surface

---

## Specific Design Decisions

### Decision D-01: Homepage narrative anchor

**Decision:** Replace the "ecosystem of apps" framing on `szl-holdings` homepage with a single governed operational intelligence platform narrative.  
**Rationale:** Investors see a portfolio of unrelated apps and cannot identify what to buy. The architectural reality (shared Alloy execution fabric) supports a unified platform story.  
**Implementation signal:** One hero section, one value proposition, two proof module cards (Command/Alloy + Vessels).

---

### Decision D-02: Navigation reduction on corporate site

**Decision:** Reduce `szl-holdings` nav to: Platform · How It Works · Proof · Contact.  
**Rationale:** Current navigation exposes every sub-product and every internal tool, which fragments attention and signals product sprawl.  
**Implementation signal:** Sub-products appear in "Platform" dropdown only; no separate mega-nav per domain.

---

### Decision D-03: Color and typography system

**Decision:** Move all artifacts toward a neutral institutional palette. Acceptable base: near-black (#0D0F12 or equivalent), warm off-white text (#F5F4F0 or equivalent), one accent (cool blue-grey #4A6FA5 range). No neon, no gradient-heavy hero images, no particle systems.  
**Rationale:** Current palette across several artifacts reads as cybersecurity-game aesthetic, not enterprise SaaS.  
**Implementation signal:** Update `@workspace/shared-ui` CSS variables as the single change point; do not hard-code per-artifact.

---

### Decision D-04: Lyte / Command — single entry point

**Decision:** `lyte-command-center` and `command` should surface as tabs within one authenticated experience, not two separate preview paths.  
**Rationale:** Having `/lyte/` and `/command/` as separate artifacts creates confusion about what the product hierarchy is. The CORTEX hub is the container; Lyte is one module within it.  
**Implementation signal:** Either consolidate into one artifact or make `/lyte/` redirect into `/command/` with the Lyte module pre-selected.  
**Dependency:** Resolve after runtime blockers (B-01, G-R01) are fixed.

---

### Decision D-05: Pulse — promote or retire

**Decision:** Pulse (`/pulse/`) is either the executive summary layer within Command or a standalone investor demo — decide and implement one path only.  
**Rationale:** Pulse has 23 src files, local auth, no E2E tests. As a standalone artifact it adds confusion. As a Command module it has clear value. As an investor demo it needs public-access mode.  
**Options:**  
  A. Merge Pulse into Command as a "Briefing" tab (preferred)  
  B. Make Pulse a fully public demo URL with no auth gate (investor demo mode)  
**Implementation signal:** Decision A requires auth pattern unification. Decision B requires adding `DEMO_MODE` flag and hardening the mock fallback path.

---

### Decision D-06: Counsel — skeleton or real

**Decision:** Counsel (`/counsel/`) is a 14-file skeleton. Either scaffold it as a real Legal Matter Command module or remove it from the public surface.  
**Rationale:** An empty skeleton at a live URL damages credibility. If it's roadmap, take it off the navigation.  
**Options:**  
  A. Scaffold with seeded data as a governance/legal workflow demo (2–3 days work)  
  B. Remove from public navigation; preserve code for future  
**Implementation signal:** Decision B is faster and more honest. Recommend B unless legal workflow is explicitly in the primary wedge strategy.

---

### Decision D-07: Sentra — merge into Aegis or keep separate

**Decision:** Sentra (`/sentra/`) is the newest artifact (22 src files, agent mesh defense). Merge into Aegis as a "Mesh Defense" workspace or keep as separate artifact.  
**Rationale:** Aegis already has three unified workspaces (Defense/Command/Intelligence). Sentra as a fourth workspace within Aegis is cleaner than a separate top-level artifact. Reduces navigation proliferation.  
**Implementation signal:** Merge is preferred; implement as an Aegis tab post-runtime-stabilization.

---

### Decision D-08: Homepage proof modules

**Decision:** The two proof modules to feature publicly are:  
  1. **Command / Alloy** — governed workflow orchestration (primary wedge)  
  2. **Vessels** — maritime intelligence with quantifiable compliance ROI (secondary wedge)  
**Rationale:** These two have the deepest code, clearest buyer pain, and most defensible real-data stories. See `audit/05-investor-positioning.md` for full wedge rationale.

---

### Decision D-09: Remove or hide all unverified counts from public surfaces

**Decision:** Any count statistic (table count, app count, module count, connector count) that cannot be verified against a running system must be removed from public-facing surfaces immediately.  
**Rationale:** An investor who digs into the code will find the discrepancies immediately. Verifiable proof beats impressive-sounding numbers.  
**Specific items to remove/correct:**  
  - "906 database tables" → remove or replace with "100+ data entities"  
  - "40+ connector integrations" → remove (unverified)  
  - All platforms "Live" → change to accurate lifecycle states  
  - "Active artifacts: 2" → remove or correct

---

### Decision D-10: Mobile app positioning

**Decision:** `szl-holdings-mobile` is positioned as "CORTEX Mobile" — the field access companion to Command.  
**Rationale:** Carlota Jo has a mobile client that is more complete. Positioning the main mobile app as "Command mobile" directly ties it to the primary wedge.  
**Implementation signal:** Update mobile app display name, splash screen, and icon to reflect CORTEX Mobile branding.

---

## Out of Scope for This Audit

- Implementing any visual changes (next task)
- Design token file creation (next task)
- Screenshot or demo video generation (separate task)
- Wireframes or mockup creation (separate task)

---

*All design decisions above are confirmed as viable given the current codebase state. No decision requires architectural changes not already planned.*
