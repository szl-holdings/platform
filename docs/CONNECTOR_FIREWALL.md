# Connector Firewall — A11oy Integration Security

## Philosophy

Every connector is untrusted until proven otherwise. A11oy's default policy is **deny all** — no tool call proceeds without:

1. Connector registered in the registry
2. Schema validated against the connector's declared API contract
3. Consent gate granted by an authorized operator
4. Tool call type present in the connector's explicit allowlist

## Firewall Architecture

```
Agent proposes tool call
        ↓
Connector Firewall intercepts
        ↓
Registry lookup (is connector registered?)
        ↓ [not found → BLOCKED]
Allowlist check (is this tool type allowed for this connector?)
        ↓ [not in allowlist → BLOCKED]
Schema validation (does input match declared schema?)
        ↓ [schema mismatch → BLOCKED]
Prompt injection scan (input sanitization)
        ↓ [injection detected → BLOCKED + logged]
Consent gate check (is consent active for this tenant?)
        ↓ [no consent → BLOCKED]
Output sanitization (response scrubbing)
        ↓
Tool call proceeds
        ↓
Firewall event logged to Proof Ledger
```

## Trust Score

Each connector has a Trust Score from 0–100 based on:
- Schema validation history
- Prompt injection incident count
- Output sanitization pass rate
- Consent currency
- Schema drift frequency

Trust Score thresholds:
- `≥ 80` — Green / approved
- `60–79` — Yellow / monitor
- `< 60` — Red / elevated review required

## Prompt Injection Patterns

The firewall scans for 10 known injection pattern families:
- Role override (`ignore previous instructions`)
- System prompt exfiltration
- Context pollution
- Data exfiltration
- Tool escalation
- Privilege escalation
- Loop injection
- Output format manipulation
- Model confusion attacks
- Chain-of-thought hijacking

## Blocked Tool Classes

Regardless of connector status, the following tool types are permanently blocked in all environments without explicit C-suite approval and a Tier-3 Proof Packet:
- `delete_record`, `truncate_table`, `drop_schema`
- `send_external_email` (mass distribution)
- `wire_transfer`, `initiate_payment`
- `public_disclosure`, `press_release`
- `terminate_contract` (above $100K ACV)

## Registry Schema

Each connector entry includes:
```typescript
{
  id: string;
  name: string;
  vendor: string;
  domain: string;
  category: string;
  riskScore: number;         // 0-100
  riskLevel: string;         // low | medium | high | critical
  status: string;            // approved | pending_review | blocked
  approvalRequired: boolean;
  dataClasses: string[];     // classification of data accessed
  allowedTools: string[];    // explicit allowlist
  blockedTools: string[];    // explicit blocklist (belt + suspenders)
  outputSanitized: boolean;
  promptInjectionScans: number;
  promptInjectionBlocked: number;
  trustScore: number;
  consentGranted: boolean;
  schemaValidated: boolean;
}
```

## Demo Mode

In demo mode, connection tests return scripted responses. No real network calls are made. Firewall events are logged to the demo Proof Ledger.
