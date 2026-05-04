"""Read sentra seed data from the TypeScript source files.

Parses artifacts/sentra/src/data/sentra-twin.ts and agent-mesh.ts,
extracting the data needed for signal discovery. Falls back to hardcoded
mirrors of the TS data when the files are unavailable or unparseable.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[5]
SENTRA_DATA_DIR = REPO_ROOT / "artifacts" / "sentra" / "src" / "data"


def _hours_ago(n: float) -> str:
    now = datetime.now(timezone.utc)
    dt = datetime.fromtimestamp(now.timestamp() - n * 3600, tz=timezone.utc)
    return dt.isoformat()


def _extract_ts_const(source: str, var_name: str) -> str | None:
    pattern = rf"(?:export\s+)?const\s+{re.escape(var_name)}(?:\s*:\s*[\w<>\[\], |]+)?\s*=\s*"
    m = re.search(pattern, source)
    if not m:
        return None
    rest = source[m.end():]
    stripped = rest.lstrip()
    if not stripped or stripped[0] not in ("{", "["):
        return None
    opener = stripped[0]
    closer = "}" if opener == "{" else "]"
    start = rest.index(opener)
    depth = 0
    in_str: str | None = None
    esc = False
    for i, ch in enumerate(rest[start:], start):
        if esc:
            esc = False
            continue
        if ch == "\\":
            esc = True
            continue
        if ch in ("'", '"', "`") and in_str is None:
            in_str = ch
            continue
        if in_str and ch == in_str:
            in_str = None
            continue
        if in_str:
            continue
        if ch == opener:
            depth += 1
        elif ch == closer:
            depth -= 1
            if depth == 0:
                return rest[start : i + 1]
    return None


def _ts_literal_to_python(raw: str) -> dict | list | None:
    s = re.sub(r"//[^\n]*", "", raw)
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.DOTALL)
    s = s.replace("'", '"')
    s = re.sub(r",(\s*[}\]])", r"\1", s)
    s = re.sub(
        r"hoursAgo\(\s*(\d+(?:\.\d+)?)\s*\)",
        lambda m: json.dumps(_hours_ago(float(m.group(1)))),
        s,
    )
    s = re.sub(r"new\s+Date\([^)]*\)(?:\.toISOString\(\))?", json.dumps(_hours_ago(0)), s)
    s = re.sub(r"\s+as\s+\w+(?:\[\])?", "", s)
    s = re.sub(r"`([^`]*)`", r'"\1"', s)
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        return None


def _load_ts(filename: str, var_name: str) -> dict | list | None:
    path = SENTRA_DATA_DIR / filename
    if not path.exists():
        return None
    try:
        source = path.read_text(encoding="utf-8")
        raw = _extract_ts_const(source, var_name)
        if raw is None:
            return None
        return _ts_literal_to_python(raw)
    except Exception:
        return None


def _fallback_sentra_twin() -> dict:
    return {
        "assets": [
            {
                "id": "asset-001",
                "name": "SCADA Server",
                "type": "OT",
                "criticality": "critical",
                "exposureScore": 88,
                "backupStatus": "stale",
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
                "controlGaps": ["RDP exposed"],
                "status": "active",
            },
        ],
        "incidents": [
            {
                "id": "INC-2026-0891",
                "title": "Ransomware-Adjacent OT Payload Detected",
                "severity": "critical",
                "status": "active",
                "mitreStage": "Execution / C2",
                "detectedAt": _hours_ago(4),
                "description": "Encrypted payload detected on 3 OT assets (SCADA, PLC). "
                "Anomalous C2 beaconing to known malicious IPs.",
                "affectedAssets": ["asset-001", "asset-003"],
            },
        ],
        "controlDrifts": [
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
        ],
        "recoveryPosture": 42,
        "financialExposure": 2800000,
    }


def _fallback_agent_mesh() -> dict:
    return {
        "exposures": [
            {
                "id": "exp-001",
                "title": "GITHUB_TOKEN reachable by 4 agents",
                "severity": "critical",
                "affectedAgentIds": [
                    "agent-claude-main",
                    "agent-cursor-composer",
                    "agent-codex-cli",
                    "agent-claude-code",
                ],
                "affectedSecretIds": ["sec-gh-pat"],
                "affectedMcpIds": ["mcp-github"],
                "explanation": "A GitHub PAT with repo+admin:org scope is readable by 4 agent runtimes "
                "via shared filesystem. Compromise of any runtime exposes the token.",
                "owaspCategory": "A01:2021 \u2013 Broken Access Control",
                "owaspRef": "https://owasp.org/Top10/A01_2021-Broken_Access_Control/",
                "cveRefs": [],
                "fixType": "scope-token",
                "fixLabel": "Scope token to minimum required permissions and rotate",
                "proofHash": "sha256:abc123",
                "status": "open",
            },
            {
                "id": "exp-002",
                "title": "Unverified MCP server exfiltrating data",
                "severity": "critical",
                "affectedAgentIds": ["agent-cursor-composer"],
                "affectedSecretIds": [],
                "affectedMcpIds": ["mcp-ext-scraper"],
                "explanation": "An unverified MCP server (ext-scraper-v2) detected sending data "
                "to an external domain not in the allowed egress list.",
                "owaspCategory": "A08:2021 \u2013 Software and Data Integrity Failures",
                "owaspRef": "https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/",
                "cveRefs": [],
                "fixType": "quarantine-server",
                "fixLabel": "Quarantine the unverified MCP server immediately",
                "proofHash": "sha256:def456",
                "status": "open",
            },
        ],
        "containmentRules": [
            {
                "id": "rule-codex-restrict",
                "name": "Codex CLI Restricted Policy",
                "agentClass": "codex-cli",
                "allowedMcpServers": ["mcp-filesystem"],
                "allowedTools": ["read_file", "write_file"],
                "allowedReadPaths": ["/workspace"],
                "allowedEgressDomains": [],
                "tier": "critical",
                "violationCount": 3,
                "lastEvaluatedAt": _hours_ago(1),
                "enforcementMode": "quarantine",
            },
            {
                "id": "rule-cursor-standard",
                "name": "Cursor Standard Policy",
                "agentClass": "cursor-composer",
                "allowedMcpServers": ["mcp-github", "mcp-filesystem", "mcp-brave-search"],
                "allowedTools": ["read_file", "write_file", "search", "github_pr"],
                "allowedReadPaths": ["/workspace", "~/.cursor"],
                "allowedEgressDomains": ["api.github.com", "search.brave.com"],
                "tier": "elevated",
                "violationCount": 1,
                "lastEvaluatedAt": _hours_ago(0.5),
                "enforcementMode": "block",
            },
        ],
        "resilienceIndex": {
            "overall": 34,
            "grade": "D",
            "secretHygiene": 22,
            "permissionSurface": 38,
            "supplyChain": 45,
            "egressContainment": 30,
            "scheduleHygiene": 55,
            "instructionTamperingRisk": 28,
            "crossAgentBlastRadius": 20,
        },
    }


def get_sentra_twin() -> dict:
    result = _load_ts("sentra-twin.ts", "sentraTwin")
    if isinstance(result, dict) and "assets" in result:
        return result
    return _fallback_sentra_twin()


def get_agent_mesh() -> dict:
    result = _load_ts("agent-mesh.ts", "agentMesh")
    if isinstance(result, dict) and "exposures" in result:
        return result
    return _fallback_agent_mesh()
