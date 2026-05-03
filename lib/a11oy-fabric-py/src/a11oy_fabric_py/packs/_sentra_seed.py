"""Sentra TENAX seed data — mirrored from the TS sources of truth.

Source files (keep in sync if the TS drifts):
  * artifacts/sentra/src/data/sentra-twin.ts (CyberAsset, Incident,
    ControlDrift, SentraTwin)
  * artifacts/sentra/src/data/agent-mesh.ts  (ContainmentRule, MeshExposure,
    MeshResilienceIndex)

This file deliberately holds a *representative* slice of the TS data so the
cyber-resilience reference pack can run deterministically without parsing
TypeScript at runtime. The slice is faithful to the TS structure so the
shape is recognisable to anyone debugging across both runtimes.
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta


def _hours_ago(n: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=n)).isoformat()


SENTRA_ASSETS = [
    {
        "id": "asset-001",
        "name": "SCADA Server",
        "type": "OT",
        "criticality": "critical",
        "exposureScore": 88,
        "backupStatus": "stale",
        "lastBackupAt": _hours_ago(72),
        "controlGaps": ["Endpoint Isolation missing", "MFA not enforced on admin"],
        "status": "compromised",
    },
    {
        "id": "asset-002",
        "name": "HMI Workstation",
        "type": "OT",
        "criticality": "high",
        "exposureScore": 65,
        "backupStatus": "current",
        "lastBackupAt": _hours_ago(12),
        "controlGaps": ["Patching overdue"],
        "status": "active",
    },
    {
        "id": "asset-003",
        "name": "PLC Controller",
        "type": "OT",
        "criticality": "critical",
        "exposureScore": 92,
        "backupStatus": "none",
        "controlGaps": ["Network segmentation breach"],
        "status": "compromised",
    },
    {
        "id": "asset-004",
        "name": "Domain Controller",
        "type": "IT",
        "criticality": "critical",
        "exposureScore": 45,
        "backupStatus": "stale",
        "lastBackupAt": _hours_ago(48),
        "controlGaps": ["RDP exposed"],
        "status": "active",
    },
]

SENTRA_INCIDENTS = [
    {
        "id": "INC-2026-0891",
        "title": "Ransomware-Adjacent OT Payload Detected",
        "severity": "critical",
        "status": "active",
        "mitreStage": "Execution / C2",
        "detectedAt": _hours_ago(4),
        "description": (
            "Encrypted payload detected on 3 OT assets (SCADA, PLC). "
            "Anomalous C2 beaconing to known malicious IPs."
        ),
        "affectedAssets": ["asset-001", "asset-003"],
    },
]

SENTRA_CONTROL_DRIFTS = [
    {
        "family": "Respond",
        "control": "Incident Response Plan",
        "status": "drift_detected",
        "evidence": "Isolation playbooks failed to execute on legacy SCADA systems.",
    },
    {
        "family": "Recover",
        "control": "Backup Verification",
        "status": "drift_detected",
        "evidence": "2 critical server backups failed integrity check.",
    },
]

SENTRA_TWIN = {
    "assets": SENTRA_ASSETS,
    "incidents": SENTRA_INCIDENTS,
    "controlDrifts": SENTRA_CONTROL_DRIFTS,
    "recoveryPosture": 42,
    "financialExposure": 2_800_000,
}

# A representative slice of agent-mesh.ts MeshExposure + ContainmentRule.
MESH_EXPOSURES = [
    {
        "id": "exp-001",
        "title": "Unpinned MCP server pulled from npm",
        "severity": "high",
        "owaspCategory": "Software Supply Chain",
        "owaspRef": "LLM05",
        "status": "open",
    },
    {
        "id": "exp-002",
        "title": "Unverified Codex CLI runtime",
        "severity": "medium",
        "owaspCategory": "Insecure Output Handling",
        "owaspRef": "LLM02",
        "status": "open",
    },
]

CONTAINMENT_RULES = [
    {
        "id": "rule-critical-001",
        "name": "Critical-tier MCP allowlist",
        "agentClass": "critical",
        "tier": "critical",
        "violationCount": 0,
        "enforcementMode": "block",
    },
    {
        "id": "rule-elevated-001",
        "name": "Elevated-tier MCP allowlist",
        "agentClass": "elevated",
        "tier": "elevated",
        "violationCount": 3,
        "enforcementMode": "log-only",
    },
]

MESH_RESILIENCE_INDEX = {
    "overall": 71,
    "grade": "C",
    "secretHygiene": 64,
    "permissionSurface": 58,
    "supplyChain": 73,
    "egressContainment": 79,
    "scheduleHygiene": 81,
    "instructionTamperingRisk": 66,
    "crossAgentBlastRadius": 70,
}
