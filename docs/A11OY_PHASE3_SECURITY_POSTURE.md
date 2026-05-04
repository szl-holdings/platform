# A11oy Phase 3 Security Posture

## Current State (Demo Environment)

### What Is True
- No secrets hardcoded in source
- All provider API keys read from environment variables
- Mock provider active when no API key is configured
- No lorem ipsum or placeholder data — all seed data is realistic and domain-accurate
- No fake partner claims or fabricated credentials
- Demo mode boundary enforced on all Phase 3 endpoints
- No destructive tool calls in demo mode
- Proof Ledger is append-only in the runtime

### What Is Demo
- Connector calls are simulated (no real network requests)
- LLM inference uses mock provider (no real API calls unless key is set)
- Board packet generation uses seeded output (no real synthesis)
- Self-test validates structural claims, not live system state

### What Is Roadmap
- SOC 2 Type II certification
- HIPAA attestation
- StateRAMP Authorization
- VPC-isolated deployment option
- Air-gapped on-premises option
- Hardware security module (HSM) for Proof Ledger signing
- Multi-party approval (MPA) for Tier-3 actions
- SSO/SAML integration (enterprise identity provider)
- Role-based access control (RBAC) with fine-grained permission sets

## Threat Model Summary

| Threat | Control | Status |
|---|---|---|
| Prompt injection via connector | Connector Firewall injection scanner | DEMO — structural |
| Unauthorized action execution | Covenant Layer + Approval Gate | BUILT |
| Post-hoc evidence tampering | Append-only Proof Ledger | BUILT (demo) |
| Model hallucination | MirrorEval 2.0 hallucination dimension | BUILT |
| Credential exfiltration | No secrets in source; env-only | ENFORCED |
| Agent self-approval | Structural separation of agent and approver | BUILT |
| Scope creep (agent goes beyond task) | Scope Adherence dimension in MirrorEval | BUILT |
| Stale context decision | Stale Context dimension in MirrorEval | BUILT |

## Data Classification Policy

All data in the A11oy demo environment is:
- Seeded (not real enterprise data)
- Non-PII (no real personal information)
- Non-MNPI (no material non-public information)
- Non-PHI (no protected health information)

Production deployments must classify all data flowing through the Signal Mesh and apply appropriate handling policies per domain.

## Secrets Policy

See `docs/SECRETS_POLICY.md` for the full policy. Summary:
- No API keys, tokens, or credentials in source files
- All secrets loaded from environment variables
- `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, and other provider keys default to mock when unset
- No secret material logged or written to the Proof Ledger

## Responsible AI Claims

A11oy makes the following responsible AI commitments:

1. **Human oversight is structural** — not optional, not bypassable
2. **Every claim is labeled** — demo vs. built vs. roadmap, always explicit
3. **No fake partner logos or endorsements**
4. **No dark patterns** in approval UI — rejection is as easy as approval
5. **Audit trail is complete** — every approval and rejection is recorded
6. **Failure modes are explicit** — blocked actions show the failure reason
