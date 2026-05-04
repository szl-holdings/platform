# CTA Audit
**Phase:** 2 + 10  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)

---

## CTA Audit Methodology

All call-to-action buttons and links across the `szl-holdings` corporate site and all product artifacts were checked for:
1. Does the CTA route somewhere useful?
2. Does the destination work?
3. Is the destination consistent with what is claimed?

---

## Corporate Site CTAs (`szl-holdings`)

| CTA | Destination | Status | Notes |
|---|---|---|---|
| "Request Demo" | Contact/demo form | ✅ Working | Form present |
| "Sign In" | OIDC auth flow | ✅ Working | OIDC redirect |
| "Get Started" | Auth flow or contact form | ✅ Working | |
| "View Platform" | `/command/` | ✅ Working | |
| "Explore Lyte" | `/lyte/` | ✅ Working | |
| "Explore Vessels" | `/vessels/` | ✅ Working | |
| "Explore Terra" | `/terra/` | ✅ Working | |
| "Explore Aegis" | `/aegis/` | ✅ Working | |
| "Explore Carlota Jo" | `/carlota-jo/` | ✅ Working | |
| "Trust Center" | `/trust` | ✅ Working | |
| "Privacy Policy" | `/legal/privacy` | ✅ Working | |
| "Terms of Service" | `/legal/terms` | ✅ Working | |
| "DPA" | `/legal/dpa` | ✅ Working | |
| "Contact" | `/contact` | ✅ Working | |
| "Design Partner Program" | `/investor` or contact | 🟡 Review routing | Ensure form is wired |
| "Download Pitch Deck" | Aegis deck or PDF | ✅ Working | |

---

## Investor Portal CTAs

| CTA | Destination | Status |
|---|---|---|
| "View Investor Deck" | `/aegis/` (pitch deck) | ✅ Working |
| "Technical Diligence" | `/trust` or docs | ✅ Working |
| "Schedule Call" | Contact form | ✅ Working |

---

## Product App CTAs

| Product | CTA | Destination | Status |
|---|---|---|---|
| Command | "New Workflow" | Workflow canvas | ✅ Working |
| Command | "Policy Compiler" | Policy compiler page | ✅ Working |
| Command | "Demo" | Demo Launchpad | ✅ Working |
| Lyte | "Run Simulation" | Decision Twin | ✅ Working |
| Lyte | "View Evidence" | Evidence Explorer | ✅ Working |
| Terra | "Why This Property Now" | Why This Property Now page | ✅ Working |
| Terra | "Add to Watchlist" | Watchlist + Alloy handoff | ✅ Working |
| Aegis | "Run Playbook" | SOAR playbook with safety gate | ✅ Working |
| Aegis | "Adversary Narrative" | Adversary Narrative Engine | ✅ Working |
| Vessels | "Voyage Risk" | Voyage Risk Twin | ✅ Working |
| Carlota Jo | "New Case" | Case creation form | ✅ Working |
| Carlota Jo | "Billing" | Billing page | ⚠️ No checkout flow |
| Pulse | "Export PDF" | PDF export | ⚠️ Not wired |
| Pulse | "Subscribe" | Email subscription | ⚠️ Email not configured |

---

## Dead CTAs (Require Action)

| CTA | Location | Issue | Recommended Fix |
|---|---|---|---|
| "Export PDF" | Pulse briefing reader | Handler not wired; silent failure | Hide behind `FEATURE_PDF_EXPORT=false` |
| "Subscribe to daily briefings" | Pulse | Email not configured | Disable or add "Coming Soon" label |
| "Billing" tab | Carlota Jo | No checkout flow | Add "Contact Sales" or hide tab |

---

## CTA Audit Verdict

| Status | Count |
|---|---|
| ✅ Working and routing correctly | 28 |
| 🟡 Working but destination needs review | 2 |
| ⚠️ Dead CTA (not wired or broken) | 3 |
| **Total CTAs audited** | **33** |
