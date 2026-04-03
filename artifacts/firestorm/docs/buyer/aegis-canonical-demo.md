# Aegis Canonical Demo — Runbook

**Label:** DEMO / PILOT
**Duration:** 8–12 minutes  
**Audience:** Enterprise buyers, CISO, security architects  
**Environment:** Seeded pilot environment with representative data  

---

## Prerequisites

- Aegis web app loaded and authenticated (SOC Lead role or above)
- Demo mode: PILOT label visible in header
- Aegis Mobile app connected (for approval step)
- Seed dataset loaded: 4 incidents, 12 alerts, 8 assets, 3 cases, 11 findings, 3 playbooks

---

## 10-Step Demo Sequence

### Step 1: Signal Ingestion (~45s)
**Navigate to:** Alerts > Alert AL-8820  
**Talking points:**
- A CRITICAL alert arrives from the SIEM integration: lateral movement from SVC-ACCNT-04 to DC-PROD-03
- Show schema validation: "Every signal is validated before entering the queue — malformed signals are rejected and logged, not silently ignored"
- Point to the SIEM source label and the audit event created at ingestion

### Step 2: Enrichment (~40s)
**Navigate to:** Alerts > AL-8820 > Enrichment panel  
**Talking points:**
- Agent enriches with MITRE ATT&CK context: T1021 (Remote Services), T1078 (Valid Accounts)
- Asset lookup: DC-PROD-03 risk score 9.2/10
- "Confidence score is 0.91 — shown inline. Low-confidence enrichments are flagged, not silently accepted"

### Step 3: Retrieval (~35s)
**Navigate to:** Decision Console > Retrieval panel for INC-0041  
**Talking points:**
- Vector retrieval pulls: 3 prior lateral movement incidents, PB-LAT-001 playbook, SVC-ACCNT-04 prior anomalies
- Retrieval hit rate: 94%
- "If retrieval returns nothing, the agent surfaces that explicitly. It does not hallucinate context"

### Step 4: Structured Triage (~50s)
**Navigate to:** Decision Console > Triage output for INC-0041  
**Talking points:**
- Structured output: severity CRITICAL, affected assets, MITRE mapping, proposed actions
- Show schema validation badge: "Every triage output is validated against a schema. Invalid outputs are rejected, not passed downstream"
- Show audit event: "This event is already in the audit trail before the analyst has touched it"

### Step 5: Analyst Review (~60s)
**Navigate to:** Response Orchestration > PB-001 (Lateral Movement Response)  
**Talking points:**
- J. Chen reviews proposed actions with execution mode labels: observe_only, propose_only, approval_required, approved_execute
- "High-risk actions — network isolation, credential rotation — require explicit approval. The analyst cannot execute them unilaterally"
- Show the approval request creation: APR-041 created, Slack notification sent

### Step 6: Approval (~45s)
**Switch to:** Aegis Mobile > Approvals tab  
**Talking points:**
- M. Walsh (SOC Lead) receives push notification on mobile
- Show the approval detail: proposed action, evidence summary, risk assessment
- Tap Approve: "Attribution, timestamp, method — all logged to the immutable audit trail"

### Step 7: Execution (~55s)
**Navigate to:** Response Orchestration > PB-001 > Step 2 (now Approved)  
**Talking points:**
- Network isolation request sent to #network-ops via Slack
- Credential rotation request sent to #identity-ops via Teams
- Evidence collection initiated to evidence store
- "Every tool execution writes a before-and-after audit event. Failed executions surface explicitly"

### Step 8: Audit Chain (~40s)
**Navigate to:** INC-0041 > Audit Trail  
**Talking points:**
- 14 events from detection to containment: every action attributed and timestamped
- MTTD: 3 minutes, MTTA: 4 minutes
- "This is not a log you can modify. Every action is traceable to a human actor or to the system agent"

### Step 9: Executive Summary (~50s)
**Navigate to:** Executive Reports > Executive Incident Brief > INC-0041  
**Talking points:**
- Brief generated: current status, risk, actions taken, evidence citations
- Confidence labeled: HIGH
- Assumptions visibly separated: "No claims without retrieval support"
- "We export this to PDF for your CISO or board in one click"

### Step 10: Wrap (~30s)
**Navigate to:** Operator Analytics or Trust Analytics  
**Talking points:**
- MTTD trend: 21min average, down from 42min 6 weeks ago
- Trust metrics: 96.4% schema validity, 2.8% unsupported claim rate
- "What you saw is real — not a video or a mock. This runs in your environment, on your data, under your governance rules"

---

## Common Buyer Questions

**Q: Can we use our own SIEM?**  
A: Yes. Splunk HEC and syslog adapters are built. Customer provides endpoint and API key. Hook ready.

**Q: What about SSO?**  
A: SAML 2.0 and OIDC hook points are implemented. Tested with mock IdP. Binding to your actual provider (Okta, Azure AD) requires per-customer config.

**Q: Does the AI ever act without a human?**  
A: In observe_only and propose_only modes, no. In approval_required mode, no — a human must approve. In approved_execute, only for pre-approved action classes that the customer has policy-approved.

**Q: What certifications do you have?**  
A: We're honest about this. Current: encryption in transit/at rest, RBAC, tenant isolation, audit logging. SOC 2 Type II and ISO 27001 are planned — not yet achieved. We don't claim certifications we don't have.

**Q: Can we see the trust metrics?**  
A: Yes, they're live in the platform — see Trust Analytics. Schema validity, retrieval miss rate, unsupported claim rate, override rate. All published, not hidden.

---

## Seed Dataset Summary

| Entity | Count |
|--------|-------|
| Incidents | 4 |
| Alerts | 12 |
| Assets | 8 |
| Cases | 3 |
| Findings | 11 |
| Playbooks | 3 |
| Pending Approvals | 4 |
| Audit Events | 87 |

---

## Environment Label

This demo environment is labeled **PILOT**. Production deployment requires per-customer configuration for SSO, SIEM, ticketing, and identity integrations. No capabilities shown are simulated — all are functional in the pilot environment.
