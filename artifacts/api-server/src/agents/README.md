# Sentra EDR Agent & SIEM Wire Protocol

## Overview

Sentra's agent system allows real endpoints to check in, receive commands (isolate/release),
and report back status via a simple REST API. SIEM events are ingested either via HMAC-signed
webhook pushes or a Splunk-style HTTP poller.

---

## Agent Wire Protocol

### 1. Mint an enrollment token

```
POST /api/sentra/agents/enroll
Content-Type: application/json
X-CSRF-Token: <csrf_token>
Cookie: <session>

{ "tenantId": "default", "tags": ["prod", "linux"] }
```

Response:
```json
{
  "token": { "token": "abc123...", "tenantId": "default", "expiresAt": "..." },
  "installSnippets": {
    "linux":   "SENTRA_TOKEN=... SENTRA_API=... curl -fsSL .../install.sh | bash -s -- ...",
    "macos":   "SENTRA_TOKEN=... SENTRA_API=... curl -fsSL .../install-mac.sh | bash -s -- ...",
    "windows": "$Token = '...' ... Invoke-Expression ..."
  }
}
```

### 2. Exchange enrollment token → long-lived agent bearer token

Agents call this once at startup with the one-time enrollment token:

```
POST /api/sentra/agents/exchange
Content-Type: application/json

{
  "enrollmentToken": "abc123...",
  "hostname": "prod-web-01",
  "os": "linux",
  "version": "1.0.0"
}
```

Response:
```json
{ "agentId": "uuid", "agentToken": "agt_..." }
```

The `agentToken` is stored locally and used for all subsequent calls. Enrollment token
is single-use per exchange; the agent bearer token is long-lived and may be rotated.

### 3. Heartbeat

Sent every 30 seconds to update `lastSeenAt` and agent metadata:

```
POST /api/sentra/agents/heartbeat
Authorization: Bearer agt_<agent_token>
Content-Type: application/json

{ "hostname": "prod-web-01", "os": "linux", "version": "1.0.0" }
```

Response:
```json
{ "agentId": "uuid", "status": "healthy" }
```

If an agent hasn't sent a heartbeat in 5 minutes, its status becomes `stale`.

### 4. Command poll

After each heartbeat, agents poll for pending commands:

```
GET /api/sentra/agents/poll
Authorization: Bearer agt_<agent_token>
```

Response (when a command is pending):
```json
{
  "command": {
    "id": "cmd-uuid",
    "kind": "isolate",
    "actor": "Operator",
    "reason": "Suspicious process detected"
  }
}
```

Response (nothing pending):
```json
{ "command": null }
```

Command `kind` values: `isolate` | `release` | `uninstall`

### 5. Command acknowledge

After executing the command, agents report success or failure:

```
POST /api/sentra/agents/commands/<cmd-id>/ack
Authorization: Bearer agt_<agent_token>
Content-Type: application/json

{ "success": true, "output": "iptables rules added — host isolated" }
```

The endpoint status in the UI updates **only when an ack arrives** — never optimistically
when the operator clicks the button. This ensures the UI reflects actual agent state.

---

## Firewall Implementation

### Linux (iptables)
```bash
# Isolate
iptables -A INPUT  -m comment --comment "sentra-agent-isolation" -j DROP
iptables -A OUTPUT -m comment --comment "sentra-agent-isolation" -j DROP

# Release
iptables -D INPUT  -m comment --comment "sentra-agent-isolation" -j DROP
iptables -D OUTPUT -m comment --comment "sentra-agent-isolation" -j DROP
```

### macOS (pfctl)
```bash
# Isolate
printf 'block in all\nblock out all\n' | sudo pfctl -a com.sentra.isolation -f -
sudo pfctl -e

# Release
sudo pfctl -a com.sentra.isolation -F all
```

### Windows (Windows Defender Firewall)
```powershell
# Isolate
New-NetFirewallRule -DisplayName "Sentra-Agent-Isolation"    -Direction Outbound -Action Block
New-NetFirewallRule -DisplayName "Sentra-Agent-Isolation-In" -Direction Inbound  -Action Block

# Release
Remove-NetFirewallRule -DisplayName "Sentra-Agent-Isolation"
Remove-NetFirewallRule -DisplayName "Sentra-Agent-Isolation-In"
```

All rule names / anchor names are fixed (`sentra-agent-isolation` / `com.sentra.isolation` /
`Sentra-Agent-Isolation`) so repeated isolate calls are idempotent.

---

## SIEM Webhook Ingest

### Payload contract

```
POST /api/sentra/siem/ingest/<connection_id>
Content-Type: application/json
X-Signature-SHA256: sha256=<hmac_hex>

{
  "title": "Lateral Movement Detected",
  "severity": "high",
  "description": "Unusual SMB lateral movement from 10.0.1.5",
  "hostname": "win-dc-01",
  "timestamp": "2026-04-27T12:00:00Z"
}
```

### HMAC-SHA256 signature

The `X-Signature-SHA256` header must be `sha256=<hex_digest>` where the digest is:

```
HMAC-SHA256(key=<connector_hmacSecret>, message=<raw_request_body_bytes>)
```

Example (Node.js):
```js
const crypto = require('crypto');
const body = JSON.stringify(payload);
const sig = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
// Set header: X-Signature-SHA256: <sig>
```

Example (Python):
```python
import hmac, hashlib, json
body = json.dumps(payload).encode()
sig = 'sha256=' + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
```

### Field normalization

Fields are mapped from the raw payload to Sentra alert fields:

| Raw field                     | Sentra field   |
|-------------------------------|----------------|
| `title` / `name` / `alert`    | `title`        |
| `severity` / `level` / `priority` | `severity` |
| `description` / `details`     | `description`  |
| `host` / `asset` / `hostname` | `asset`        |
| `timestamp` / `time`          | `detectedAt`   |

Severity mapping: `critical` → critical, `high` → high, `medium`/`warn`/`warning` → medium,
`low`/`info`/`informational` → low.

---

## Splunk HTTP Poller

The Splunk adapter polls `GET /servicesNS/admin/search/saved/searches/<saved_search>/history`
with a bearer token on the configured interval.

```
Authorization: Bearer <splunk_token>
Accept: application/json
```

Results are normalized from Splunk's `entry[].content` fields:

| Splunk field                      | Sentra field |
|-----------------------------------|--------------|
| `rule_name` / `title` / `name`    | `title`      |
| `urgency` / `severity`            | `severity`   |
| `description` / `rule_description`| `description`|
| `dest` / `src`                    | `asset`      |
| `event_time` / `_time`            | `detectedAt` |

---

## Testing the loop locally

### Prerequisites
- API server running on `http://localhost:3001` (or set `REPLIT_DEV_DOMAIN`)
- `curl`, `bash` (Linux/macOS) or PowerShell 5.1+ (Windows)

### Full agent loop (Linux/macOS)

```bash
# 1. Get a CSRF token
CSRF=$(curl -s http://localhost:3001/api/csrf-token | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Mint enrollment token
ENROLL_RESP=$(curl -s -X POST http://localhost:3001/api/sentra/agents/enroll \
  -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" \
  -d '{"tenantId":"test"}')
TOKEN=$(echo "$ENROLL_RESP" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

# 3. Exchange for agent bearer
EXCHANGE=$(curl -s -X POST http://localhost:3001/api/sentra/agents/exchange \
  -H "Content-Type: application/json" \
  -d "{\"enrollmentToken\":\"$TOKEN\",\"hostname\":\"test-host\",\"os\":\"linux\",\"version\":\"1.0.0\"}")
AGENT_TOKEN=$(echo "$EXCHANGE" | grep -o '"agentToken":"[^"]*"' | cut -d'"' -f4)
AGENT_ID=$(echo "$EXCHANGE"   | grep -o '"agentId":"[^"]*"'    | cut -d'"' -f4)

# 4. Send heartbeat
curl -s -X POST http://localhost:3001/api/sentra/agents/heartbeat \
  -H "Authorization: Bearer $AGENT_TOKEN" -H "Content-Type: application/json" \
  -d '{"hostname":"test-host","os":"linux","version":"1.0.0"}'

# 5. Operator issues isolate
curl -s -X POST "http://localhost:3001/api/sentra/agents/$AGENT_ID/action" \
  -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" \
  -d '{"action":"isolate","actor":"TestOperator"}'

# 6. Agent polls for command
POLL=$(curl -s -H "Authorization: Bearer $AGENT_TOKEN" \
  http://localhost:3001/api/sentra/agents/poll)
CMD_ID=$(echo "$POLL" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 7. Agent acknowledges
curl -s -X POST "http://localhost:3001/api/sentra/agents/commands/$CMD_ID/ack" \
  -H "Authorization: Bearer $AGENT_TOKEN" -H "Content-Type: application/json" \
  -d '{"success":true,"output":"iptables rules added"}'

# 8. Verify status is isolated
curl -s "http://localhost:3001/api/sentra/agents/$AGENT_ID" | grep '"status"'
```

### Webhook ingest

```bash
SECRET="my-hmac-secret"
BODY='{"title":"Test Alert","severity":"high","hostname":"test-host"}'
SIG="sha256=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"
curl -s -X POST "http://localhost:3001/api/sentra/siem/ingest/<connection_id>" \
  -H "Content-Type: application/json" \
  -H "X-Signature-SHA256: $SIG" \
  -d "$BODY"
```

### Verifying on the deployed environment

Replace `http://localhost:3001` with `https://<REPLIT_DEV_DOMAIN>` (no port). The install
snippets served from `/api/sentra/agents/stubs/install.sh` are already pre-populated with
the correct base URL — copy-paste the snippet shown in the Endpoint Mesh → Deploy Agent dialog.
