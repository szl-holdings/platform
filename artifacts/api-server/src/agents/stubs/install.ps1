#Requires -Version 5.1
# Sentra EDR Agent — Windows PowerShell stub
# Usage: .\install.ps1 -Token <enrollment_token> -ApiBase <api_base_url>
# Uninstall: .\install.ps1 -Uninstall
param(
  [string]$Token = "",
  [string]$ApiBase = "",
  [switch]$Uninstall
)

$SentraDir  = "$env:LOCALAPPDATA\SentraAgent"
$TokenFile  = "$SentraDir\agent.token"
$IdFile     = "$SentraDir\agent.id"
$PidFile    = "$SentraDir\agent.pid"
$LogFile    = "$SentraDir\agent.log"
$RuleName   = "Sentra-Agent-Isolation"
$HeartbeatInterval = 30  # seconds
$PollInterval      = 10  # seconds

function Write-Log {
  param([string]$Message)
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -Path $LogFile -Value "[$ts] $Message"
}

function Invoke-Isolate {
  # Idempotent: remove existing rule first, then add
  try {
    Remove-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName $RuleName -Direction Outbound -Action Block -Enabled True -Profile Any | Out-Null
    New-NetFirewallRule -DisplayName "${RuleName}-In" -Direction Inbound -Action Block -Enabled True -Profile Any | Out-Null
    Write-Log "Host isolated via Windows Defender Firewall (rule: $RuleName)"
    return $true
  } catch {
    Write-Log "Isolation failed: $_"
    return $false
  }
}

function Invoke-Release {
  try {
    Remove-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "${RuleName}-In" -ErrorAction SilentlyContinue
    Write-Log "Host released from isolation"
    return $true
  } catch {
    Write-Log "Release failed: $_"
    return $false
  }
}

function Invoke-Uninstall {
  Write-Host "[sentra] uninstalling agent..."
  Invoke-Release | Out-Null
  if (Test-Path $PidFile) {
    $oldPid = Get-Content $PidFile
    try { Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue } catch {}
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
  }
  if (Test-Path $SentraDir) {
    Remove-Item -Recurse -Force $SentraDir
  }
  Write-Host "[sentra] uninstall complete"
}

if ($Uninstall) {
  Invoke-Uninstall
  exit 0
}

if (-not $Token -or -not $ApiBase) {
  Write-Host "Usage: .\install.ps1 -Token <enrollment_token> -ApiBase <api_base_url>"
  exit 1
}

if (-not (Test-Path $SentraDir)) {
  New-Item -ItemType Directory -Path $SentraDir -Force | Out-Null
}

function Invoke-ExchangeToken {
  $hostname = $env:COMPUTERNAME
  $payload = @{
    enrollmentToken = $Token
    hostname        = $hostname
    os              = "windows"
    version         = "1.0.0"
  } | ConvertTo-Json -Compress

  try {
    $response = Invoke-RestMethod -Uri "$ApiBase/sentra/agents/exchange" `
      -Method POST `
      -ContentType "application/json" `
      -Body $payload
    $response.agentToken | Set-Content $TokenFile -NoNewline
    $response.agentId    | Set-Content $IdFile    -NoNewline
    Write-Log "Enrolled as $($response.agentId)"
  } catch {
    Write-Log "Exchange failed: $_"
    exit 1
  }
}

function Start-AgentLoop {
  $agentToken    = Get-Content $TokenFile
  $agentId       = Get-Content $IdFile
  $lastHeartbeat = 0
  $hostname      = $env:COMPUTERNAME

  Write-Log "Starting agent loop for $agentId"
  $PID | Set-Content $PidFile -NoNewline

  $headers = @{ Authorization = "Bearer $agentToken" }

  while ($true) {
    $now = [int][double]::Parse((Get-Date -UFormat %s))

    # Heartbeat
    if (($now - $lastHeartbeat) -ge $HeartbeatInterval) {
      try {
        $hbPayload = @{ hostname = $hostname; os = "windows"; version = "1.0.0" } | ConvertTo-Json -Compress
        Invoke-RestMethod -Uri "$ApiBase/sentra/agents/heartbeat" `
          -Method POST -Headers $headers -ContentType "application/json" -Body $hbPayload | Out-Null
        Write-Log "Heartbeat sent"
      } catch { Write-Log "Heartbeat failed: $_" }
      $lastHeartbeat = $now
    }

    # Poll for commands
    try {
      $pollResp = Invoke-RestMethod -Uri "$ApiBase/sentra/agents/poll" -Headers $headers
      $cmd = $pollResp.command
      if ($cmd -and $cmd.id) {
        Write-Log "Received command $($cmd.kind) ($($cmd.id))"
        $ackSuccess = $true
        $ackOutput  = ""
        switch ($cmd.kind) {
          "isolate" {
            $ackSuccess = Invoke-Isolate
            $ackOutput  = if ($ackSuccess) { "Host isolated via Windows Firewall" } else { "Isolation failed" }
          }
          "release" {
            $ackSuccess = Invoke-Release
            $ackOutput  = if ($ackSuccess) { "Host released from isolation" } else { "Release failed" }
          }
          "uninstall" {
            $ackSuccess = $true
            $ackOutput  = "Uninstall acknowledged"
          }
          default {
            $ackSuccess = $false
            $ackOutput  = "Unknown command: $($cmd.kind)"
          }
        }
        $ackPayload = @{ success = $ackSuccess; output = $ackOutput } | ConvertTo-Json -Compress
        try {
          Invoke-RestMethod -Uri "$ApiBase/sentra/agents/commands/$($cmd.id)/ack" `
            -Method POST -Headers $headers -ContentType "application/json" -Body $ackPayload | Out-Null
        } catch { Write-Log "Ack failed: $_" }

        if ($cmd.kind -eq "uninstall") {
          Invoke-Uninstall
          exit 0
        }
      }
    } catch { Write-Log "Poll failed: $_" }

    Start-Sleep -Seconds $PollInterval
  }
}

# ── Main ──────────────────────────────────────────────────────────────────────
if (-not (Test-Path $LogFile)) { New-Item -ItemType File -Path $LogFile -Force | Out-Null }
Write-Log "Agent starting on $(hostname)"

if ((Test-Path $TokenFile) -and (Test-Path $IdFile)) {
  Write-Log "Existing token found; skipping exchange"
} else {
  Invoke-ExchangeToken
}

Write-Host "[sentra] agent running. Log: $LogFile"
Start-AgentLoop
