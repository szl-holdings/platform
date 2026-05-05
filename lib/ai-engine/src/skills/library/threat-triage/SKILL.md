---
skill_id: threat-triage
name: Security Threat Triage
version: 2.4.0
description: Classifies threat indicators, CVEs, and incident signals against known TTPs. Generates containment briefs with CISA notification drafts.
owner: aegis-defense
category: Defense Intelligence
model: claude-sonnet-4-6
permission_mode: hitl-required
allowed_tools: ['threat_lookup', 'indicator_enrich', 'cve_query', 'stix_match']
blocked_tools: ['cisa_report_submit', 'incident_escalate', 'classified_retrieve']
allowed_mcp_servers: ['mcp-threat-intel', 'mcp-cve-nvd']
eligibility_constitution_clause: clause-9-security-clearance
covenant_policy_bundle: core:aegis-default
eval_set: eval-threat-triage-v2
telemetry_schema: gen_ai.a11oy.threat_triage
applicable_agents: ['Guardian', 'Sentra-CISO', 'alloy-core']
trigger_keywords: ['cve', 'threat', 'ioc', 'stix', 'yara', 'c2', 'apt', 'malware', 'incident', 'vulnerability']
chainable_with: ['skill-eval-harness', 'skill-proof-generator', 'skill-approval-router']
eval_pass_rate: 0.94
---

# Security Threat Triage

Classifies threat indicators, CVEs, and incident signals against known TTPs. Generates containment briefs with CISA notification drafts — restricted to cleared operators.

## What This Skill Does

1. Matches incoming signals against STIX/TAXII threat intelligence feeds
2. Scores CVEs against CVSS v4 and organizational exposure surface
3. Generates containment action sequences with tool call plan
4. Drafts CISA notification artifacts (held pending human approval)

## Governance

- PreToolUse hook: covenant-policy-gate enforces blocked_tools list
- PostToolUse hook: proof-sealer creates immutable audit entry
- Trust Tier: HITL-required (Tier 3) — every containment action requires human approval
- Eval gate: MirrorEval score must exceed 0.90 before plan is presented

## Evidence Requirements

Every output must include:
- Signal source reference (STIX ID or SIEM alert ID)
- IOC confidence score
- Affected asset count
- Recommended containment actions (not yet executed — plan mode only)

## Constitution Binding

Bound to `clause-9-security-clearance`: this skill may only be invoked by agents operating with CISO-approved clearance level ≥ 2.
