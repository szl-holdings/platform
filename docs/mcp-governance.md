# MCP Governance Protocol

## Doctrine

The Alloy Meridian MCP governance layer enforces SZL doctrine for all external system access:

> "Read before writing. Propose and record before executing. Rollback paths are required, not optional."

---

## Governance Policy

```typescript
{
  operationsRequiringApproval: ['write', 'delete', 'send', 'publish', 'payment', 'permission'],
  readFirstEnforced: true,
  maxAutoRetries: 2,
  auditAllOperations: true,
  blockOnUnconfigured: false
}
```

---

## Execution Flow

### Step 1: Governance Check
Before any agent issues an MCP operation, it calls:
```
POST /api/meridian/mcp-governance/check
{ "serverId": "linear", "capabilityId": "linear.create_issue" }
```

The check validates:
- Server is in the registry
- Capability exists on the server
- Server is active (or reports inactive with auth instructions)
- Operation type and approval requirement

### Step 2: Read Current State
For any mutation, the agent must first read the current state of the target resource. This is logged to the Flight Recorder as a `tool_action` (type: `read`).

### Step 3: Draft Proposal
The `operator-swarm` drafts a mutation proposal including:
- Target server and capability
- Full payload (what will be created/updated/deleted)
- Evidence (which signals support this action)
- Rollback path (how to reverse this if it goes wrong)

### Step 4: Governance Sentinel Review
The `governance-sentinel` evaluates the proposal against Founder Intent doctrine:
- Does it violate any prohibited action?
- Is the domain risk tolerance acceptable?
- Does it have a tested rollback path?
- Is confidence above 0.7?
- Are sources cited?

### Step 5: Human Approval
The proposal enters the Counterfactual Ledger with status `pending_approval`. A human operator reviews and either:
- **Approves**: Execution proceeds, logged with approver identity
- **Rejects**: No action taken, reason logged

### Step 6: Execution & Outcome Logging
After approval, the `operator-swarm` executes the mutation. The outcome (success/failure, actual effect, any rollback triggered) is logged to the Flight Recorder as an `outcome` record.

---

## Approval Classes

Agents are assigned an approval class that determines what they can do autonomously:

| Class | Can Auto-Execute | Notes |
|---|---|---|
| `auto` | Read operations only | signal-cartographer, forecast-council, voice-of-business |
| `review` | No external mutations | deepseek-strategist, operator-swarm, brand-imagination-engine |
| `admin_only` | Governance powers only | governance-sentinel |

---

## Prohibited Actions (Founder Intent)

No agent may:
- Send emails or messages to external parties without approval
- Execute financial transactions without CFO sign-off
- Modify production access controls without security review
- Delete production data of any kind
- Deploy to production without CI passing and rollback plan
- Publish content on social or public channels without brand approval

---

## Audit Trail

All MCP operations (both read and write) are written to the Business Flight Recorder at:
```
GET /api/meridian/flight-recorder?type=tool_action
```

Each record includes:
- `serverId` — which external server was accessed
- `capabilityId` — which capability was invoked
- `operationType` — read/write/delete/send/publish/payment/permission
- `input` — full payload
- `output` — response (redacted for sensitive fields)
- `sources` — which signals justified this action
- `approvedBy` — who approved (or "system" for auto-approved reads)
- `rollbackPath` — how to reverse if needed
- `recordedAt` — timestamp (ISO 8601)
