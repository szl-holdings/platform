# Operator Guide — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026  
**Audience:** Platform operators, domain leads, team leads with operator role  
**Prerequisites:** Operator or admin role; completion of Getting Started guide

This guide is for operators who own and manage decision workflows within one or more domain packs. It covers the governed decision loop in depth, approval chain management, exception handling, escalation, and performance monitoring.

---

## Your Role as Operator

Operators are the human-in-the-loop. You do not just receive recommendations — you are accountable for the decisions that execute on the platform. Every approval you make is attributed to you in the Proof Chain, permanently.

**What operators own:**
- Reviewing and acting on AI recommendations within their domain(s)
- Managing the exception queue
- Escalating signals that exceed their authority level
- Reviewing outcomes and providing feedback
- Configuring domain-specific settings (if admin-delegated)

**What operators do not own:**
- Platform configuration (admin territory)
- Covenant Policy rules (admin territory)
- Approval chain structure (admin territory)

---

## The Governed Decision Loop — Operator's View

The nine-step loop from the operator's perspective:

### Steps 1–2: Signal and Context (automated)
The platform ingests signals from your domain's data sources and enriches them with cross-domain intelligence. You do not need to do anything at this stage — the system is building the case for you.

**What to know:** Not every signal generates a recommendation. Low-priority signals may be filtered, aggregated, or auto-resolved by policy. High-priority signals are escalated to your queue immediately.

### Step 3: Recommendation (AI-generated, human-reviewed)
An AI recommendation appears in your queue. Your job at this stage:
1. Read the recommendation summary
2. Review the reasoning chain — what evidence did the AI use?
3. Check the confidence score — how certain is the model?
4. Note any alternatives the AI considered and ruled out
5. Verify the model attribution — which model generated this and when?

**Red flags to watch for:**
- Confidence score below 60% without a clear explanation
- Evidence sources that are outdated (check timestamps)
- Recommendations that conflict with your domain knowledge — document your override reason

### Step 4: Simulation (Monte Carlo, review required)
The simulation shows you the risk landscape before you decide:
- **Best case:** What happens if everything goes right
- **Expected outcome:** Most likely result
- **Worst case:** Tail risk — what the platform wants you to be aware of
- **Sensitivity tornado:** Which variables matter most

**What to do:** Ensure you understand the worst case. If the worst case is within acceptable parameters, proceed. If not, escalate or reject.

### Step 5: Policy Gate (automated, but check results)
Covenant Policy evaluates the action before it reaches you for approval. You will see the policy evaluation results in the approval panel:
- Green checkmarks = policy passed
- Yellow flags = conditional pass (may need additional sign-off)
- Red blocks = policy denied — escalate or seek waiver

**If a policy blocks an action you believe should proceed:** Use the escalation workflow. Do not attempt to work around policy gates.

### Step 6: Approval (your primary responsibility)
This is your core function as operator. Approve, reject, or escalate:

**Approve:** You have reviewed the recommendation, simulation, and policy results. You agree with the proposed action. Click **Approve** and add a brief rationale.

**Reject:** You disagree with the recommendation or believe the action is not appropriate. Click **Reject** and document why — this feeds the learning loop and improves future recommendations.

**Escalate:** The action exceeds your authority level, requires additional sign-off, or you are uncertain. Click **Escalate** and specify the escalation target.

**Time to decide:** Each approval request has a configured timeout. If you do not respond within the timeout window, the action is escalated automatically. Configure your timeout preferences under **Settings → Notifications**.

### Steps 7–9: Execution, Proof, Outcome (mostly automated)
Once approved:
- The **Workflow Engine** executes the action in tracked steps
- The **Proof Chain** seals an immutable record of the decision
- The **Outcome Graph** records what actually happened

Your responsibilities:
- Monitor execution status — check for execution failures
- Record outcome observations if prompted (30-day follow-up on major decisions)
- Review the outcome accuracy — was the simulation right?

---

## Managing the Exception Queue

The exception queue is your primary daily surface. It surfaces signals that require human judgment.

**Queue priorities:**
- **Critical** — Respond within 15 minutes. Platform may auto-escalate.
- **High** — Respond within 2 hours.
- **Medium** — Respond within 24 hours.
- **Low** — Respond within 72 hours.

**Triaging exceptions:**
1. Start with Critical and High
2. Group related exceptions (the platform clusters correlated signals)
3. Acknowledge exceptions you are actively working — prevents duplicate effort
4. Close exceptions you have resolved with the outcome documented

---

## Escalation

When an exception or recommendation exceeds your authority or requires additional judgment:

1. Click **Escalate** on the signal or recommendation
2. Select escalation target (specific person, role, or escalation chain)
3. Add context — what you've reviewed, what your recommendation is, and why you are escalating
4. Confirm — the target receives a notification with your full context

**Escalation chains** are configured by your admin. Common chains:
- Operator → Domain Lead → Founder (for high-value or novel decisions)
- Operator → Security Lead → CISO (for security escalations)
- Operator → Finance Controller → CEO (for financial commitments above threshold)

---

## Domain-Specific Operator Considerations

### Aegis Operators
- All SOAR playbook actions require approval — no autonomous execution
- Cross-domain signals (security + maritime, security + legal) are surfaced in the Threat Feed with correlation context
- Proof Chain records for security decisions must be preserved for a minimum of 7 years (configurable by admin)
- MITRE ATT&CK classifications are assigned by AI — validate against your own assessment before approving response actions

### Vessels Operators
- AIS data has a 6-minute refresh cycle — time-sensitive decisions may require you to account for position lag
- Dark vessel alerts are high-priority by default — always escalate if you cannot confirm vessel status through alternative means
- Sanctions flags require legal sign-off before any action (Covenant Policy enforces this automatically)
- Voyage P&L data updates at end-of-voyage — intra-voyage figures are estimates

### Terra Operators
- Distress signals are based on public record data — verify recency before acting
- AI underwriting confidence scores above 80% indicate strong model support — below 70%, apply additional manual review
- Deal workflow stages require document uploads at each gate — ensure all documents are attached before advancing
- Ownership graph data is refreshed weekly from county records — spot-check against direct sources for active deals

---

## Monitoring and Performance

### Signal Performance Dashboard
Track your domain's signal quality under **Reports → Signal Performance**:
- Signal volume by day and severity
- Time-to-acknowledge by severity tier
- Approval rate vs. rejection rate
- Override frequency (recommendations you rejected)
- Outcome accuracy (how often the simulation was right)

### Outcome Review
Monthly, review your outcome accuracy:
1. Go to **Reports → Outcome Analysis**
2. Filter to your domain and the past 30 days
3. Compare predicted outcomes to actual outcomes
4. Note any systematic patterns — does the model consistently over- or underestimate?
5. Submit feedback to improve future recommendations

---

## Reference

- [End User Guide](END_USER_GUIDE.md) — Daily interface reference
- [Admin Setup Guide](ADMIN_SETUP_GUIDE.md) — Organization configuration
- [Troubleshooting](TROUBLESHOOTING_GUIDE.md) — Common issues
- [Platform Primitives](PLATFORM_PRIMITIVES.md) — Technical architecture
- [Demo Guide](DEMO_GUIDE.md) — Demo scripts for showing the platform to others
