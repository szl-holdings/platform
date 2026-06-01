# End User Guide — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026  
**Audience:** Operators, viewers, and end users of all domain packs  
**Prerequisites:** Signed in with at least viewer role

This guide covers how to use the SZL Holdings platform day-to-day across all domain packs. It is written for operators who receive signals, review recommendations, and approve or reject governed actions.

---

## The Core Workflow

Whatever domain you work in, your day-to-day on the platform follows the same pattern:

1. **A signal arrives** — something changed in your operational environment
2. **AI surfaces a recommendation** — what to do, with evidence and confidence
3. **You review the simulation** — what happens if you act, what happens if you don't
4. **You approve or reject** — your decision is recorded with full attribution
5. **The action executes** — a governed workflow runs if you approved
6. **The outcome is recorded** — actual results compared to prediction

This is the governed decision loop. It runs across every domain pack.

---

## Common Interface Elements

### Signal Feed
Your primary inbox. Signals are prioritized by severity and recency. Each signal shows:
- Source (which domain pack / data feed)
- Severity level (critical, high, medium, low)
- Brief summary and age
- Current status (new, in review, escalated, resolved)

**What to do:** Click any signal to open its full detail view.

### Recommendation Panel
When a signal has an AI recommendation:
- **Summary** — What the AI is suggesting
- **Confidence score** — How certain the model is (0–100%)
- **Evidence links** — The sources that informed the recommendation
- **Model attribution** — Which model generated it and when
- **Alternative considered** — What the AI ruled out and why

**What to do:** Read the recommendation, then check the simulation before deciding.

### Simulation Panel (Monte Carlo)
Before approving any significant action, review the simulation:
- **Scenario comparison** — Act vs. don't act vs. alternatives
- **Expected outcome** — Median, best case, worst case
- **Sensitivity chart** — Which variables drive the most uncertainty
- **Cost of waiting** — What inaction costs per hour/day

**What to do:** Understand the risk range. If the worst case is acceptable, proceed to approve.

### Approval Gate
When a recommendation is ready for your decision:
- Click **Approve** to confirm the action
- Click **Reject** to block the action and provide a reason
- Click **Escalate** to route to a higher authority
- Add a comment — it becomes part of the permanent Proof Chain record

Your decision is attributed to you by name, role, and timestamp.

### Proof Chain
The immutable record of every decision:
- Who approved (name, role, org)
- What they approved (recommendation summary, confidence, model ID)
- When they approved (timestamp, millisecond precision)
- What evidence was available (source citations)
- What actually happened (outcome, when recorded)

**What to do:** Reference the Proof Chain for audit or dispute resolution.

---

## Domain-Specific Workflows

### Lyte — Command Surface

**Primary view:** Signal Timeline + PRISM Dashboard

**Daily workflow:**
1. Open **Signal Feed** — review incoming signals by priority
2. Click a signal → review context → read recommendation
3. Check **Simulation** → review risk range
4. Approve or reject in the **Action Queue**
5. Monitor **Execution** status
6. Review **Outcomes** as they close

**PRISM Dashboard:** Tracks your organization across five dimensions:
- **P** — People metrics
- **R** — Revenue signals
- **I** — Infrastructure health
- **S** — Security posture
- **M** — Market intelligence

Each dimension shows a health score and the signals driving it.

---

### Aegis — Security Domain

**Primary view:** Threat Feed + SOC Command

**Daily workflow:**
1. Open **Threat Feed** — prioritized active alerts
2. Select a threat → view MITRE ATT&CK classification, affected assets, timeline
3. Review **SOAR Playbook** recommendation
4. Approve the playbook → track execution steps
5. Check **Investigations Board** for open cases
6. Record findings in the **Case Management** panel

**Key features:**
- MITRE ATT&CK visualization
- Cross-domain correlation (links security signals to maritime or other domain signals)
- SOAR playbook execution with human approval gate
- Proof Chain audit trail for every action

---

### Vessels — Maritime Domain

**Primary view:** Fleet Map + Exception Queue

**Daily workflow:**
1. Open **Fleet Map** — live vessel positions via AIS
2. Review exception alerts (ETA deviation, sanctions flag, dark vessel)
3. Click a vessel → view full detail: position, speed, route, cargo, compliance status
4. Review **Voyage P&L** — revenue, cost, and margin tracking per voyage
5. Act on exceptions via the governed exception workflow
6. Track resolutions in the **Exception Queue**

**Key features:**
- Live AIS feed integration
- Sanctions screening (OFAC, UN, EU lists)
- Dark vessel detection (AIS spoofing / transponder outage alerts)
- Freight rate benchmarking
- Voyage P&L with forecast vs. actual

---

### Terra — Real Estate Domain

**Primary view:** Distress Pipeline + Property Detail

**Daily workflow:**
1. Open **Distress Pipeline** — properties showing distress signals
2. Select a property → review ownership graph, liens, delinquency, legal filings
3. Review **AI Underwriting** — valuation model with evidence citations
4. Advance deals through the **Deal Workflow** stages
5. Track portfolio in the **Portfolio View**

**Key features:**
- NYC distress signal detection (tax liens, foreclosure filings, code violations)
- Ownership graph with beneficial ownership tracing
- AI-powered underwriting with confidence score and evidence
- Deal stage tracking
- Comparable analysis and market context

---

### CORTEX — Mobile Command

CORTEX is the unified mobile command layer. It gives you access to all your domain workspaces on iOS and Android.

**Core features:**
- **Workspace switcher** — switch between Aegis, Vessels, Terra, and other domains
- **Unified command feed** — all signals across domains in one feed
- **Badge counts** — unread signals per workspace
- **AI copilot** — workspace-adaptive assistant
- **Push notifications** — critical signal alerts
- **Biometric auth** — Face ID / Touch ID

---

## Managing Your Account

### Notifications
1. Go to **Settings → Notifications**
2. Configure per-channel (in-app, email, CORTEX push)
3. Set rules by severity and domain
4. Save

### Changing Your Role View
If you have multiple roles or domain assignments, switch contexts via **Settings → Active Workspace**.

### Exporting Records
For compliance or audit use, export records via:
- **Proof Chain** → Export as PDF or JSON
- **Audit Log** (admins) → Export CSV
- **Voyage P&L** → Export CSV (Vessels)
- **Deal reports** → Export PDF (Terra)

---

## Getting Help

- **In-app help:** Click the **?** icon in any panel
- **Help Center:** /help
- **Contact:** /contact
- **Email:** support@szlholdings.com

---

## Reference

- [Getting Started](getting-started.md) — First-time setup
- [Operator Guide](operator-guide.md) — Advanced operator workflows
- [Troubleshooting](troubleshooting-guide.md) — Fix common issues
- [Admin Setup Guide](admin-setup-guide.md) — Organization config (admins only)
