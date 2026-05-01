# Sentra — Incident Response Runbook

**Document ID:** SENTRA-COMP-RB-001
**Version:** 1.0
**Owner:** Stephen P. Lutar Jr., SZL Holdings
**Last reviewed:** 2026-04-30
**Audience:** Customer security teams, NYSTEC, prime contractors
**Classification:** Public summary; per-playbook detail under NDA

---

## 1. Purpose

Sentra is the cyber-resilience product. This runbook documents the *runtime* incident-response playbooks Sentra ships with. It is distinct from `A11OY-05-incident-response-72hr.md`, which describes how SZL Holdings responds to incidents *affecting the platform*. This document describes how Sentra helps a customer respond to incidents *in their environment*.

If a buyer's RFP asks "do you have a documented IR runbook," this is the document that answers that question for the product, paired with `A11OY-05` for the platform.

## 2. Sentra IR architecture

Sentra wraps three components into one IR loop:

1. **Recursive threat modeling** (`adversary-engine`) — continuously generates and re-prioritizes plausible adversary actions against the customer's modeled assets, producing a current-best threat graph.
2. **Action queue** (`action-queue`) — surfaces recommended IR actions, scored by impact, urgency, and reversibility. Every action is human-approved by default for any non-reversible change.
3. **Aegis home / threat command** (`aegis-home`) — single-pane operator view: open alerts, in-flight playbooks, threat-graph deltas, evidence trail.

Every action Sentra recommends or executes is anchored to the evidence ledger (`aef-evidence-ledger`) with hash, actor, inputs, decision, and outcome.

## 3. Playbook catalog (v1)

Sentra ships with the following named playbooks. Each has a defined trigger, automated steps, human-decision steps, and rollback path.

| ID | Playbook | Trigger |
|---|---|---|
| SP-001 | Suspected credential compromise — single user | High-confidence GuardDuty / IdP risk signal on a single principal |
| SP-002 | Suspected credential compromise — service account | Anomalous service-account behavior detected |
| SP-003 | Suspected lateral movement | Unusual east-west traffic + auth-failure cluster |
| SP-004 | Data-exfiltration suspicion | Egress-volume anomaly to a non-allowlisted destination |
| SP-005 | Ransomware indicators | Mass-rename / mass-encrypt patterns on managed file shares |
| SP-006 | Insider misuse | Privileged action outside customer-defined policy envelope |
| SP-007 | Public-facing CVE — unpatched | Newly-published CVE matched against customer SBOM |
| SP-008 | Phishing campaign — confirmed | At least one confirmed customer report or sandbox detonation |
| SP-009 | Tenant-isolation failure indicator | Suspected cross-tenant data flow signal |
| SP-010 | Residency-policy violation | Egress to non-residency endpoint |
| SP-011 | Threat-feed action | New IOC matched in customer environment from a tier-1 feed |
| SP-012 | Authentication-system anomaly | IdP-side anomaly: spike in failures, brute-force, password-spray |
| SP-013 | Supply-chain compromise | Sigstore / npm advisory match against a deployed dependency |
| SP-014 | Cloud-account compromise | AWS/Azure account-level anomaly (cross-region calls, IAM permissive grants) |
| SP-015 | Social-engineering against employees | Repeated targeted contact patterns flagged by feed |
| SP-016 | Compromise of CI/CD pipeline | GitHub Actions / Replit deploy anomalies |
| SP-017 | DDoS / volumetric attack | WAF / load-balancer signal |
| SP-018 | Unauthorized model use | LLM call to a non-allowlisted endpoint or with disallowed prompt category |
| SP-019 | Bias-drift compliance incident | Per `A11OY-03-bias-testing-methodology.md` §7 alarm fires |
| SP-020 | Customer-reported anomaly | Customer-initiated trigger; routes to the right downstream playbook |

Per-playbook detail (steps, dependencies, success criteria, escalation matrix) is shared under NDA.

## 4. Playbook anatomy

Each playbook has a uniform shape so that operators see the same fields every time:

```
playbook:
  id: SP-001
  title: Suspected credential compromise — single user
  severity_default: high
  triggers:
    - source: aws_guardduty
      finding: UnauthorizedAccess:IAMUser/*
    - source: idp_risk_event
      risk: high
  preconditions:
    - identity_provider_connected: true
  steps:
    - id: S1
      type: automated
      action: enrich
      ...
    - id: S2
      type: human_decision
      prompt: "Approve credential rotation for {principal}?"
      reversible: false
      default: deny
    - id: S3
      type: automated
      action: rotate_credentials
      requires_approval: S2
    ...
  rollback:
    - id: R1
      action: ...
  success_criteria:
    - principal_credentials_rotated
    - no_followup_findings_24h
  evidence_anchor: required
```

## 5. Customer responsibilities

A runbook only works if the customer has done a few things upfront:

- **Connect IdP** (Okta, Entra ID, etc.) so principals can be acted on.
- **Connect SIEM** (Splunk, Sentinel, Chronicle) or `cognitive-observability` agents so signals reach Sentra.
- **Connect cloud accounts** (AWS, Azure, GCP) read-only at minimum; write for automated rotation.
- **Define policy envelope** — what Sentra is allowed to do automatically vs. queue for human approval.
- **Define notification roster** — who gets paged at each severity.
- **Define maintenance windows** — when Sentra may execute reversible automation without explicit approval.

The default policy envelope is conservative: **all non-reversible actions require explicit human approval.**

## 6. Logging, evidence, and audit

- Every alert, decision, action, and outcome is anchored to the evidence ledger.
- The `replay()` function in `codex-kernel` allows any incident to be re-walked with original inputs to confirm Sentra would have made the same decision today, or to discover where logic has drifted.
- Quarterly synthetic exercises (Sentra-on-Sentra, customer-joined where contracted) validate that the playbook surface area is exercised and that operators are familiar with it.

## 7. Metrics

Sentra reports the following metrics per customer per month:

- Mean Time To Detect (MTTD) by severity
- Mean Time To Contain (MTTC) by severity
- Mean Time To Recover (MTTR) by severity
- Action approval rate (auto / human-approved / rejected)
- False-positive rate per playbook
- Drift in threat-graph entropy week-over-week (the "is the adversary getting weirder" signal)

## 8. Honest disclosures

- **No SOC, no MDR claim.** Sentra is a product, not a managed service. SZL Holdings does not staff a 24×7 SOC. Customers either monitor Sentra themselves, or contract an MDR partner. The runbook design assumes this.
- **Recommendations, not magic.** Sentra does not "stop attacks autonomously" except in the narrow set of reversible, explicitly-pre-approved actions in §4. Buyers who want a fully-autonomous response are not Sentra's primary buyer today.
- **First-deployment runbook tuning.** No two customer environments are the same. The first 60 days at any new customer involve tuning the playbook triggers to the customer's signal baseline; SZL provides this tuning at no additional charge during paid pilots.

## 9. Change log

| Date | Change |
|---|---|
| 2026-04-30 | Initial publication. v1 catalog of 20 playbooks. |

## 10. Contact

Stephen P. Lutar Jr. · `security@szlholdings.com` · `inquiries@szlholdings.com`
