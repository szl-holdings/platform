# SZL Holdings — Decision Ledger

**Purpose:** Specify the provenance chain from signal through inference, policy, action, approval, and result — with full actor attribution for human and agent actions.

**Status:** Specification — for implementation reference
**As of:** April 2026

---

## What Is the Decision Ledger?

The Decision Ledger is the immutable, attributable record of every consequential decision made on the SZL platform. It is not a log of system events. It is a structured provenance chain that answers:

- What was observed?
- What was inferred?
- What policy applied?
- What action was proposed?
- Who approved it?
- What happened?
- What was the result?

Every entry in the Decision Ledger is a complete provenance record — a full chain from cause to consequence, with every actor and system component attributed.

---

## The Provenance Chain

```
SIGNAL → INFERENCE → POLICY → ACTION → APPROVAL → EXECUTION → RESULT
   ↑                                                               ↓
   └──────────────── FOLLOW-UP SIGNALS ───────────────────────────┘
```

Each step in the chain is a discrete, versioned, immutable record. The chain is forward-linked (each step references the IDs of preceding steps) and cross-referenced (related chains can be joined via shared signal IDs or entity IDs).

---

## Chain Step Specifications

### Step 1: Signal

**What is recorded:**
```json
{
  "ledger_entry_type": "signal",
  "signal_id": "sig_8f3a...",
  "domain": "maritime",
  "signal_type": "anomaly",
  "severity": "critical",
  "source": {
    "entity_type": "vessel",
    "entity_id": "vsl_9c2b...",
    "entity_name": "MV Ariadne"
  },
  "observed_at": "2026-04-16T14:23:11Z",
  "ingested_at": "2026-04-16T14:23:12Z",
  "ingest_actor": "system:ais-ingestion-service",
  "workspace_id": "ws_tenant_001",
  "context": {
    "ais_gap_minutes": 127,
    "last_known_position": { "lat": 24.8, "lon": 58.2 },
    "flag_state": "Panama",
    "route": "Fujairah → Singapore"
  },
  "correlation_cluster": "cluster_dark_vessel_2026_04_16"
}
```

---

### Step 2: Inference

**What is recorded:**
```json
{
  "ledger_entry_type": "inference",
  "inference_id": "inf_4a71...",
  "signal_ids": ["sig_8f3a...", "sig_2d9e..."],
  "model": {
    "model_id": "dark-vessel-classifier",
    "version": "2.3.1",
    "provider": "szl-ai-engine"
  },
  "inference_type": "risk_assessment",
  "confidence": 0.87,
  "reasoning": "AIS gap of 127 minutes combined with deviation from declared route and proximity to sanctioned port area indicates probable AIS manipulation. Historical pattern match: 3 prior incidents with same vessel on similar route segments.",
  "evidence": [
    { "type": "ais_gap", "value": 127, "threshold": 60, "weight": 0.4 },
    { "type": "route_deviation_nm", "value": 43, "threshold": 20, "weight": 0.3 },
    { "type": "sanctioned_proximity_km", "value": 12, "threshold": 50, "weight": 0.3 }
  ],
  "risk_score": 82,
  "recommended_action": "flag_for_sanctions_screening",
  "actor_id": "agent:sentinel-maritime-v2",
  "generated_at": "2026-04-16T14:23:18Z",
  "eval_id": "eval_run_4429"
}
```

---

### Step 3: Policy Application

**What is recorded:**
```json
{
  "ledger_entry_type": "policy_application",
  "policy_id": "pol_maritime_sanctions_001",
  "policy_version": "1.4",
  "policy_name": "Maritime Sanctions Screening Protocol",
  "applied_to_inference": "inf_4a71...",
  "conditions_matched": ["severity == critical", "domain == maritime", "inference_type == risk_assessment", "risk_score > 75"],
  "permitted_actions": ["flag_for_sanctions_screening", "alert_compliance_officer", "hold_voyage_approval"],
  "required_approvals": [
    { "role": "compliance_officer", "sla_minutes": 60 }
  ],
  "prohibited_actions": ["notify_vessel_directly"],
  "applied_at": "2026-04-16T14:23:19Z"
}
```

---

### Step 4: Action Proposal

**What is recorded:**
```json
{
  "ledger_entry_type": "action_proposal",
  "action_id": "act_7b33...",
  "action_type": "flag_for_sanctions_screening",
  "proposed_by": {
    "actor_id": "agent:sentinel-maritime-v2",
    "actor_type": "agent"
  },
  "inference_id": "inf_4a71...",
  "policy_id": "pol_maritime_sanctions_001",
  "target": {
    "entity_type": "vessel",
    "entity_id": "vsl_9c2b...",
    "entity_name": "MV Ariadne"
  },
  "payload": {
    "screening_authority": "OFAC",
    "urgency": "high",
    "hold_voyage_approval": true,
    "alert_message": "AIS anomaly pattern consistent with sanctions evasion. Manual screening required before voyage approval."
  },
  "status": "pending_approval",
  "priority": "critical",
  "proposed_at": "2026-04-16T14:23:20Z",
  "required_by": "2026-04-16T15:23:20Z"
}
```

---

### Step 5: Approval Record

**What is recorded:**
```json
{
  "ledger_entry_type": "approval",
  "approval_id": "apr_9e55...",
  "action_id": "act_7b33...",
  "required_role": "compliance_officer",
  "approver": {
    "actor_id": "usr_compliance_sarah",
    "actor_type": "human",
    "display_name": "Sarah Mitchell",
    "role": "compliance_officer"
  },
  "status": "approved",
  "decision_at": "2026-04-16T14:41:07Z",
  "time_to_decision_minutes": 17,
  "decision_note": "Confirmed AIS gap pattern. OFAC screening initiated. Voyage hold placed pending clearance.",
  "session_id": "sess_browser_a4f9...",
  "ip_hash": "sha256:9a3c...",
  "sla_deadline": "2026-04-16T15:23:20Z",
  "sla_met": true
}
```

---

### Step 6: Execution Record

**What is recorded:**
```json
{
  "ledger_entry_type": "execution",
  "execution_id": "exec_2c88...",
  "action_id": "act_7b33...",
  "approval_id": "apr_9e55...",
  "executor": {
    "actor_id": "system:alloy-workflow-engine",
    "actor_type": "system"
  },
  "status": "completed",
  "started_at": "2026-04-16T14:41:09Z",
  "completed_at": "2026-04-16T14:41:11Z",
  "duration_ms": 2100,
  "external_refs": {
    "ofac_screening_ticket": "OFAC-2026-04-16-8823",
    "voyage_hold_ref": "HOLD-vsl_9c2b-2026-04-16"
  }
}
```

---

### Step 7: Result Record

**What is recorded:**
```json
{
  "ledger_entry_type": "result",
  "result_id": "res_6d44...",
  "action_id": "act_7b33...",
  "execution_id": "exec_2c88...",
  "status": "success",
  "measured_at": "2026-04-16T16:55:00Z",
  "result_data": {
    "ofac_screening_outcome": "cleared",
    "voyage_hold_released": true,
    "voyage_hold_duration_hours": 2.2
  },
  "value_impact": {
    "risk_reduction": "high",
    "compliance_event_prevented": true,
    "voyage_delay_hours": 2.2,
    "estimated_cost_of_delay_usd": 18000
  },
  "risk_delta": -74,
  "verified_by": "usr_compliance_sarah",
  "follow_up_signals": []
}
```

---

## Chain Integrity Rules

### Immutability

Every ledger entry is written once and never modified. If a correction is needed, a new entry with `entry_type: "amendment"` is appended, referencing the original entry ID and providing a reason.

### Completeness Requirement

A provenance chain is considered **complete** if it contains entries for all seven steps: signal → inference → policy → action → approval → execution → result.

An **incomplete chain** (missing one or more steps) is flagged for audit review. Common causes:
- Action rejected at approval step (chain ends at Step 5 with `status: rejected`)
- Execution failure (chain ends at Step 6 with `status: failed`, triggering a new follow-up Signal)
- Signal that did not generate an inference (chain ends at Step 1 — policy determined no action warranted)

### Attribution Completeness

Every chain entry must carry a valid `actor_id`. Actor types:
- `human:` prefix — authenticated user; actor_id is the user's platform ID
- `agent:` prefix — registered AI agent; actor_id includes model version
- `system:` prefix — internal automation; actor_id identifies the service
- `external:` prefix — third-party integration; actor_id identifies the integration

No anonymous entries are permitted in the ledger.

---

## Ledger Query Patterns

### Full chain for an action
```sql
SELECT * FROM decision_ledger WHERE action_id = 'act_7b33...' ORDER BY entry_sequence;
```

### All chains involving a specific entity
```sql
SELECT DISTINCT action_id FROM decision_ledger WHERE target_entity_id = 'vsl_9c2b...' AND entry_type = 'action_proposal';
```

### Approval latency report
```sql
SELECT action_id, time_to_decision_minutes, sla_met FROM decision_ledger WHERE entry_type = 'approval' AND workspace_id = 'ws_tenant_001';
```

### Incomplete chains (audit flag)
```sql
SELECT action_id FROM decision_ledger GROUP BY action_id HAVING NOT BOOL_OR(entry_type = 'result');
```

---

## Ledger API Surface

| Endpoint | Method | Description |
|---|---|---|
| `/api/ledger/chains` | GET | List chains with filters (workspace, domain, date range, status) |
| `/api/ledger/chains/:action_id` | GET | Full provenance chain for one action |
| `/api/ledger/export` | POST | Export chains as signed JSON or PDF |
| `/api/ledger/audit/incomplete` | GET | All chains missing result records |
| `/api/ledger/actor/:actor_id` | GET | All chain entries attributed to an actor |

---

*The Decision Ledger is the trust anchor of the SZL platform. Its integrity is the foundation of every compliance, governance, and accountability claim made to enterprise buyers and regulators.*
