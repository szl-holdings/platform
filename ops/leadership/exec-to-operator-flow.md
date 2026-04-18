# Executive → Operator Flow

**Owner:** Stephen Lutar · **Audience:** Founder, design partner ops leads, demo runners

The product has two primary personas inside the same buyer organization, and both need to see themselves in the same loop:

- **Executive** — wants the one screen that matters. Buys the category.
- **Operator** — wants the queue, the receipt, the proof. Lives in the product.

The flow between them is the proof point that this is not a "dashboard" or a "workflow tool" — it is a single governed loop that compresses cleanly upward and explodes cleanly downward.

## The compression / expansion principle

| Direction | Compression rule | UI surface |
|-----------|------------------|------------|
| Executive view ↑ | Roll-up by **value-at-risk**, **policy tier**, **outcome status**. Hide everything else. | `executive-command.tsx`, `executive-summary.tsx` |
| Operator view ↓ | Expand by **signal source**, **scoring factors**, **alternatives**, **dependencies**, **state transitions**. Hide nothing. | `decision-receipts.tsx`, `action-queue.tsx`, `approvals-center.tsx` |

The same anchor (a signal ID, a decision ID, an action ID) must be addressable from both views. An executive who clicks a KPI must land in the operator surface that produced it. An operator who resolves an action must see the value-at-risk roll up to the executive view.

## The five hand-offs

### 1. KPI → Signal queue
- **From:** Executive command — Value at Risk tile, Top Signals strip.
- **To:** `/operations/signals` filtered by the same severity / value band.
- **Rule:** Every executive KPI must be a link, not a label.

### 2. Signal → Decision receipt
- **From:** Signal detail panel.
- **To:** `/operations/decision-receipts`, anchored on the recommendation generated from that signal.
- **Rule:** A signal with no decision yet shows a "pending recommendation" state with a timestamp; never a blank.

### 3. Decision → Policy chain
- **From:** Decision receipt — Policy gate row.
- **To:** `/operations/approvals` highlighted on the relevant chain.
- **Rule:** The chain shows the policy that triggered the gate, the tier required, and the named approver(s). Override is a visible button, not a hidden API.

### 4. Policy Gate → Action
- **From:** Policy chain — final policy/approval resolution.
- **To:** `/operations/action-queue` with the resulting action card already in the correct urgency tier.
- **Rule:** The action card carries the decision ID and signal ID forward. Provenance never restarts.

### 5. Action → Audit
- **From:** Action card resolution.
- **To:** `/operations/trust-audit` with the audit row scrolled into view.
- **Rule:** The audit row carries actor, actor type (user / agent / system), outcome, and the same IDs from steps 1–4.

## Required UI affordances

- A persistent **breadcrumb of provenance** in the side panel: `S-9041 → R-4412 → APR-1041 → A-2241 → AUD-8821`. Clicking any segment jumps to the relevant view.
- A **persona toggle** in the operations layout (Executive / Operator / Compliance) that re-ranks panels but never removes them. Same data, different framing.
- A **"see full receipt" affordance** on every executive KPI — clicking expands into the operator view in place rather than navigating away when the screen real estate allows it.

## What this is not

- It is not role-based access control. The flow assumes both personas have permission to see both views; it is about cognitive load, not gating.
- It is not "drilldown." Drilldowns end at a chart. Our flow ends at an immutable audit record.
- It is not personalization. The structure is the same for every buyer; only the *entry point* differs.

## Companion docs

- `demo-killer-path.md` — the linear story that uses this flow.
- `productized-governance.md` — why the flow itself is the product.
