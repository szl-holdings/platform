# MCP Read-First Governance Rules

This document states the governance rules that every automated agent and operator
must respect when using any of the 15 governed external MCP servers in the Alloy
Meridian cognitive layer.

---

## The Read-First Principle

**All MCP server connections default to read-only.**

An agent or automated system may:
- Read data, fetch records, query APIs, and observe state.
- Draft recommendations based on what it observes.
- Propose actions with evidence, confidence, owner, and rollback path.

An agent or automated system may **not**, without explicit human confirmation:
- Create any record (issue, ticket, note, page, document, order).
- Update or patch any existing record.
- Delete or archive any record.
- Send any external message, email, notification, or webhook.
- Publish or schedule any content.
- Make, capture, refund, or initiate any payment.
- Change any permission, role, or access control.
- Deploy any change to a production system.

---

## Human Confirmation Requirements

The following action categories require **explicit human approval** before execution:

| Action Category             | Servers Affected                          | Approval Level       |
|-----------------------------|-------------------------------------------|----------------------|
| Issue / ticket creation     | Linear, Atlassian                         | Operator approval    |
| Comment or note write       | Linear, Notion, Figma, Atlassian, Miro    | Operator approval    |
| Content publish / schedule  | Squidler, Sanity, Wistia                  | Operator approval    |
| Payment / refund            | Stripe, Razorpay                          | Dual approval (2 operators) |
| Permission change           | Any                                       | Admin approval       |
| Delete / archive            | Any                                       | Admin approval       |
| Production deploy           | Any                                       | Admin + second review |

---

## Risk Class Definitions

| Risk Class | Meaning |
|------------|---------|
| `low`      | Read-only, no PII or financial data, safe to connect first. |
| `medium`   | Contains internal documents, design assets, or meeting transcripts. Write scope requires approval. |
| `high`     | Financial, payment, or broad internal data access. Restricted key mandatory. Mutations require dual approval. |
| `mutating` | Any connection where write scope is enabled. Treated as highest risk regardless of category. |

---

## Canonical Activation Order

Servers must be activated in the order listed in the MCP Activation Status dashboard
(`/meridian/mcp-activation`). This order is:

1. Low-risk observability first (Sentry, Linear, PostHog, Amplitude).
2. Knowledge and collaboration next (Notion, Granola, Figma, Squidler).
3. Financial and high-risk last (Stripe, Razorpay, Google Maps, Sanity, Wistia, Atlassian, Miro).

**Never activate a payment server before read-only readiness has been verified on the
observability servers.**

---

## Audit Trail Requirements

Every MCP call made by an automated agent must be logged with:
- Timestamp (ISO 8601).
- Agent identity and version.
- MCP server slug and method called.
- Parameters passed (redacted if they contain PII or credentials).
- Response status and latency.
- Whether the call was read-only or mutating.
- The human operator who approved the call (if mutating).

Logs are retained per the platform data retention policy (minimum 90 days).

---

## Escalation Path

If an automated agent determines that a mutating action is needed:
1. The agent **stops** and records a pending decision with full evidence.
2. The operator is notified via the Alloy decision pipeline.
3. The operator reviews the evidence, confidence, and rollback path.
4. Only after explicit approval does the agent execute the action.
5. The outcome is logged and linked back to the original decision record.

**There is no auto-approval path for mutating actions.**

---

## Source of Truth

The canonical registry of MCP servers, their risk classes, and their declared scopes
is maintained in:

```
artifacts/api-server/src/services/meridian-mcp-registry.ts
```

This file is the single source of truth. Any downstream agent or UI must read from
this registry rather than maintaining its own list.
