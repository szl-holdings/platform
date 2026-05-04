# A11oy Investor Demo Script — Seed Round 2026

## Opening

> "A11oy is not an AI assistant. It is a governed execution fabric — the operating layer where enterprise signals, agents, tools, people, and proof operate as one controlled system. Let me show you what that means in practice."

Navigate to: `/investor-demo` — 12-step guided tour.

---

## Step 1: The Problem (MARKET)

> "Enterprises are drowning. 60% of strategic decisions are delayed by poor signal synthesis. The cost of inaction — 4.2 days average delay, $3.8M per year per thousand-person enterprise in unharvested value. But the answer isn't more AI — unconstrained AI is a governance liability."

**Key claim:** The market is not buying more AI features — they are buying control and compliance.

---

## Step 2: The Solution (PRODUCT)

> "A11oy closes the gap between signal and action — with a structural guarantee that a human is always in the loop. Decision cycle from signal to approved action: under 90 minutes. Proof coverage: 100%. Human override: always available."

---

## Steps 3–4: Architecture

Walk through Signal Mesh → Workcell Runtime.

> "Every enterprise signal — from AIS vessel positions to CRM pipeline updates — flows through the Signal Mesh into a Workcell. A Workcell is a structured task: not a chat, not an agent loop — a controlled sequence of steps, each one eval'd and approved."

Navigate to `/replay` to show a replay.

---

## Step 5: MirrorEval 2.0 (GOVERNANCE)

Navigate to `/evals`.

> "Before any action proceeds, MirrorEval scores it across 14 dimensions. Action safety, hallucination risk, policy compliance, proof completeness — five possible dispositions from pass to blocked. Blocked means blocked. No override."

Point to the regression suite: 97 cases, 0 failing.

---

## Step 6: Connector Firewall (SECURITY)

Navigate to `/connectors`.

> "Every connector starts as untrusted. Default deny. Schema validation, consent gate, prompt injection scanning — on every call. This connector — Port Authority API — has 3 prompt injection attempts blocked this week."

Run a test connection (demo mode).

---

## Steps 7–8: Twin Foundry + Human Gate

Navigate to `/twins`.

> "Every enterprise asset has a live digital twin. A vessel, a deal, a legal matter. We simulate no-action vs. approved-action before committing anything."

Navigate back to the Investor Demo, show step 8 with the ApprovalGate component.

> "This is the structural guarantee. The agent cannot approve its own action. The approval is hash-recorded in the Proof Ledger. It's not a feature — it's architecture."

Click Approve to demonstrate.

---

## Step 9: Proof Ledger (COMPLIANCE)

> "Every executed action produces a Proof Packet — SHA-256 hash chain, all reasoning steps, tool calls, approvals, eval scores. Append-only. No post-hoc revision. Built for SOC 2, HIPAA, and StateRAMP readiness."

---

## Step 10: Boardroom Mode (EXECUTIVE)

Navigate to `/boardroom`.

> "At any moment, the board can request a full briefing. A11oy synthesizes the entire enterprise state — every signal, twin, action, and proof — into a board-ready packet in under 3 seconds. Eval-scored. Proof-referenced."

Click Generate New Board Packet.

---

## Steps 11–12: GTM + The Ask

> "We land with one domain — maritime, legal, revenue — prove ROI in 90 days, expand to 3–5 domains. ACV: $200K to $2M. TAM: $14B in enterprise governance and AI operations."
>
> "We are raising $4M seed to fund 3 pilot customers, SOC 2 certification, and the production deployment layer. 18 months to growth capital."
>
> "The Proof Ledger is our sales proof — every ROI claim is hash-chained. A11oy is the governed execution operating system for the enterprise."

---

## Objection Handling

**"How is this different from [other AI platform]?"**
> Every other platform puts AI in control and humans as optional reviewers. A11oy puts humans in control by structural guarantee. The agent cannot proceed without approval. That is the product.

**"What if the model hallucinates?"**
> MirrorEval catches it before execution. Hallucination Risk is dimension 4 of 14. A disposition of `blocked` means the action cannot proceed. The human sees a blocked action, not a bad output.

**"Is the demo real?"**
> Every architectural element you see — the eval scoring, the approval gate, the proof chain, the replay, the firewall — is built and operational in the demo environment. What is not yet real: live domain connectors (demo mode), production LLM inference (mock provider), and SOC 2 certification (roadmap).

**"What is the competitive moat?"**
> The Proof Ledger. Once an enterprise runs 6 months of decisions on A11oy, every strategic action is hash-chained and auditable. Switching cost is the complete loss of institutional decision memory.
