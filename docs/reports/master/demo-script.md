# SZL Holdings — Polished Demo Script
**Version:** 1.0  
**Date:** April 3, 2026  
**Runtime:** 8–12 minutes  
**Audience:** Design partners, investors, strategic partners  
**Presenter:** Stephen Lutar

---

## Before You Begin

**Setup:**
- Open Lyte Command Center (`/lyte-command-center`) — logged in as analyst
- Have SZL Holdings site (`/`) open in second tab
- Demo mode should be set to "Design Partner" (not "Live")
- Ensure DataStateBadge is visible showing "Design Partner Environment"

**Tone:**
- Direct, not salesy
- Let the product speak — narrate what you see, not what you wish it did
- Be honest when something is prototype vs. operational

---

## Act 1: The Problem (1–2 min)

**Say:**
> "Every company I've talked to has the same problem. They have operational data everywhere — signals from tools, alerts from monitors, status updates from teams — but they can't actually see what's blocked, what needs a decision, and who's responsible. The information exists. The visibility doesn't.
>
> That's what Lyte solves. Not another dashboard. A command plane for operations."

**Do:** Navigate to the Lyte home screen. Let them absorb it.

---

## Act 2: The Signal → Decision → Action Flow (3–4 min)

### 2a. Show the signal queue

**Say:**
> "This is the command queue. Every operational signal in one place — prioritized by severity, not by which tool sent it. You can see what's critical right now."

**Do:** Point to the KPI strip at the top (critical signals, open incidents, pending approvals, unassigned). Point to the queue sorted by severity.

**Say:**
> "Notice two things: every row shows the owner — or 'Unassigned' if nobody owns it. And every row shows the next action. Not just what happened — what needs to happen."

### 2b. Open a critical signal

**Do:** Click on a critical-severity signal to open the detail pane.

**Say:**
> "The detail pane shows everything. Status lifecycle, who owns it, what the next action is. But here's what matters for trust —"

**Do:** Point to the Evidence panel.

**Say:**
> "Every AI recommendation comes with evidence. Here's the source, here's the confidence score, here's the rationale. You're not trusting a black box. You're trusting a traceable chain of reasoning."

### 2c. Show the AI decision card

**Do:** Scroll to an Alloy AI decision on the entity (if present) or navigate to an AI-assisted briefing.

**Say:**
> "This is Alloy — our execution fabric. When Alloy makes a recommendation, it does three things: it retrieves evidence from your operational context, it applies your governance policy, and it requires human approval before anything executes.
>
> The 'propose only' default means nothing happens without a human decision. The AI advises. You decide."

**Do:** Show the ApprovalBadge — "pending approval" state.

### 2d. Approve and show audit trail

**Do:** Scroll to the Audit Timeline at the bottom.

**Say:**
> "And everything is logged. This is the immutable audit trail. Every state change, every decision, every approval — who did it, when, and why. This is accountability built into the product, not bolted on."

---

## Act 3: The Trust Layer (1–2 min)

**Say:**
> "A lot of platforms have data. What makes this different is that the data is labeled. See this badge? It's showing you that this is design-partner environment data. We don't hide that.
>
> Our position is that honesty about data state is a feature, not a disclaimer."

**Do:** Show the DataStateBadge, the EnvironmentLabel, the DemoMode indicator.

**Say:**
> "When this moves to a live production environment, that badge changes to 'Live' and every signal is real. The interface doesn't change. The trust layer doesn't change. Only the data does."

---

## Act 4: The Platform (1–2 min)

**Do:** Switch to SZL Holdings tab.

**Say:**
> "Lyte and Alloy are the wedge. But the infrastructure we've built — the AI engine, the workflow engine, the shared audit layer, the design system — runs across an entire ecosystem.
>
> Aegis brings this command plane to security operations. Terra brings it to real estate. Vessels brings it to fleet and maritime. They're all expansion lanes — not current products to sell, but optionality that comes for free once the core wedge is proven."

**Do:** Navigate to the ecosystem map on SZL Holdings.

**Say:**
> "Same Alloy spine. Same trust layer. Different domain. That's the architecture bet."

---

## Act 5: What We're Looking For (1 min)

**Say:**
> "We're in design-partner stage. We're not selling to everyone. We're working with a small set of operators who have a real visibility problem, who want to help shape how this product evolves, and who value honest accountability over polished demos.
>
> If that sounds like your context, the conversation I want to have is: what does your signal-to-action flow look like today, and where does it break?"

**Do:** Stop here. Do not pitch. Ask a question.

---

## Q&A Guidance

**"Is this AI or is this rules-based?"**
> "Alloy uses language models — HuggingFace inference with fallbacks — but the decision objects are schema-validated. The AI generates content within a structured envelope. It doesn't freestyle."

**"Can I see the live data?"**
> "In this environment, the queue data is design-partner demonstration data, labeled as such. Terra has four live data integrations — Census, HUD, FEMA, NYC Open Data — that I can show you pulling real market data right now."

**"What does this cost?"**
> "We're not at formal SaaS pricing yet. Design partners pay in time and feedback. The commercial structure is subscription-based; we'll share the model when we move a partner to pilot."

**"How does this compare to [Competitor]?"**
> "I'd rather show you what this does than compare to something else. What specific capability are you trying to match?"

**"Is the audit trail tamper-proof?"**
> "The audit log is persisted server-side and append-only. We have the audit infrastructure in place. For tamper-evident certification, we'd add a Merkle chain layer — that's a known extension point in the architecture."

---

## Demo Cleanup

After the demo:
- Confirm no sensitive data was visible
- Confirm demo mode was active throughout
- Send follow-up within 24 hours with: this document set, architecture brief, and a specific next step

---

*See also: [architecture-brief.md](architecture-brief.md) · [competitive-positioning-brief.md](competitive-positioning-brief.md) · [investor-confidence-checklist.md](investor-confidence-checklist.md)*
