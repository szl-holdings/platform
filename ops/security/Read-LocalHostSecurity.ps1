#Requires -Version 5.1

<#
.SYNOPSIS
  Collects bounded, read-only security posture evidence from the local Windows host.
.DESCRIPTION
  Emits one JSON object to stdout. An exit code of 0 means every probe returned
  an observation; 2 means at least one probe is UNKNOWN. Neither exit code is a
  security-readiness verdict. No host, user, address, port, process, or credential
  identifiers are emitted. The Windows Backup probe covers wbadmin history only.
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

function New-Unknown {
  param([string] $Reason)
  return [ordered]@{ status = 'UNKNOWN'; reason = $Reason }
}

function Get-ReadFailureReason {
  param([System.Management.Automation.ErrorRecord] $Failure)

  if ($Failure.Exception -is [System.UnauthorizedAccessException] -or
      $Failure.FullyQualifiedErrorId -match 'AccessDenied|Unauthorized' -or
      $Failure.Exception.Message -match '(?i)access (is )?denied') {
    return 'ACCESS_DENIED'
  }
  return 'READ_FAILED'
}

function Get-RequiredBoolean {
  param([AllowNull()] [object] $Value)

  if ($null -eq $Value) { throw 'MISSING_FIELD' }
  switch ($Value.ToString().ToLowerInvariant()) {
    'true'  { return $true }
    'false' { return $false }
    '1'     { return $true }
    '0'     { return $false }
    default { throw 'UNRECOGNIZED_BOOLEAN' }
  }
}

$result = [ordered]@{
  schemaVersion       = 1
  scope               = 'LOCAL_HOST'
  observedAtUtc       = [DateTime]::UtcNow.ToString('o', [Globalization.CultureInfo]::InvariantCulture)
  collectionStatus    = 'PARTIAL'
  defender            = New-Unknown 'NOT_RUN'
  defenderEvents24h   = New-Unknown 'NOT_RUN'
  firewall            = New-Unknown 'NOT_RUN'
  osVolumeEncryption  = New-Unknown 'NOT_RUN'
  windowsBackup       = New-Unknown 'NOT_RUN'
  tcpListeners        = New-Unknown 'NOT_RUN'
}

try {
  $defender = Get-MpComputerStatus -ErrorAction Stop
  if ($null -eq $defender) { throw 'NO_DEFENDER_RESULT' }
  if ($null -eq $defender.AntivirusSignatureAge) { throw 'MISSING_SIGNATURE_AGE' }

  $result.defender = [ordered]@{
    status                      = 'OBSERVED'
    antivirusEnabled            = Get-RequiredBoolean $defender.AntivirusEnabled
    realTimeProtectionEnabled   = Get-RequiredBoolean $defender.RealTimeProtectionEnabled
    behaviorMonitorEnabled      = Get-RequiredBoolean $defender.BehaviorMonitorEnabled
    tamperProtectionEnabled     = Get-RequiredBoolean $defender.IsTamperProtected
    antivirusSignatureAgeDays   = [int] $defender.AntivirusSignatureAge
  }
} catch {
  $result.defender = New-Unknown (Get-ReadFailureReason $_)
}

# Microsoft Defender Antivirus Operational event types: detection (1116), action
# taken (1117), action failed (1118), and critical action failure (1119).
# Counts cover retained log records only; they are never proof that the host
# is threat-free or that older records were not overwritten.
# https://learn.microsoft.com/en-us/defender-endpoint/troubleshoot-microsoft-defender-antivirus
try {
  $defenderLogName = 'Microsoft-Windows-Windows Defender/Operational'
  $defenderLog = Get-WinEvent -ListLog $defenderLogName -ErrorAction Stop
  if ($null -eq $defenderLog) { throw 'NO_DEFENDER_EVENT_LOG' }
  if (-not (Get-RequiredBoolean $defenderLog.IsEnabled)) {
    $result.defenderEvents24h = New-Unknown 'LOG_DISABLED'
  } else {
    $eventLimit = 1000
    $windowStart = [DateTime]::UtcNow.AddHours(-24).ToLocalTime()
    $eventCounts = [ordered]@{ '1116' = 0; '1117' = 0; '1118' = 0; '1119' = 0 }
    try {
      $events = @(Get-WinEvent -FilterHashtable @{
        LogName = $defenderLogName
        Id = @(1116, 1117, 1118, 1119)
        StartTime = $windowStart
      } -MaxEvents ($eventLimit + 1) -ErrorAction Stop)
    } catch {
      if ($_.FullyQualifiedErrorId -like 'NoMatchingEventsFound,*') {
        $events = @()
      } else {
        throw
      }
    }

    $truncated = $events.Count -gt $eventLimit
    foreach ($event in @($events | Select-Object -First $eventLimit)) {
      $eventCounts[[string]$event.Id]++
    }
    $result.defenderEvents24h = [ordered]@{
      status = 'OBSERVED'
      windowHours = 24
      eventCounts = $eventCounts
      countSemantics = if ($truncated) { 'LOWER_BOUND' } else { 'EXACT_RETAINED_EVENTS' }
      truncated = $truncated
      maxEventsCounted = $eventLimit
      threatFreeEvidence = $false
    }
  }
} catch {
  $result.defenderEvents24h = New-Unknown (Get-ReadFailureReason $_)
}

try {
  $rawProfiles = @(Get-NetFirewallProfile -ErrorAction Stop)
  $profiles = @()
  foreach ($name in @('Domain', 'Private', 'Public')) {
    $profile = $rawProfiles | Where-Object { $_.Name -eq $name } | Select-Object -First 1
    if ($null -eq $profile) { throw 'MISSING_FIREWALL_PROFILE' }
    $profiles += [ordered]@{
      name              = $name
      enabled           = Get-RequiredBoolean $profile.Enabled
      logBlockedPackets = Get-RequiredBoolean $profile.LogBlocked
      logAllowedPackets = Get-RequiredBoolean $profile.LogAllowed
    }
  }
  $result.firewall = [ordered]@{ status = 'OBSERVED'; profiles = $profiles }
} catch {
  $result.firewall = New-Unknown (Get-ReadFailureReason $_)
}

try {
  if ([string]::IsNullOrWhiteSpace($env:SystemDrive)) { throw 'NO_SYSTEM_DRIVE' }
  $volume = Get-BitLockerVolume -MountPoint $env:SystemDrive -ErrorAction Stop
  if ($null -eq $volume -or $null -eq $volume.ProtectionStatus -or
      $null -eq $volume.VolumeStatus -or $null -eq $volume.EncryptionPercentage) {
    throw 'MISSING_ENCRYPTION_FIELD'
  }
  $result.osVolumeEncryption = [ordered]@{
    status                = 'OBSERVED'
    protectionStatus      = $volume.ProtectionStatus.ToString()
    volumeStatus          = $volume.VolumeStatus.ToString()
    encryptionPercentage  = [int] $volume.EncryptionPercentage
  }
} catch {
  $result.osVolumeEncryption = New-Unknown (Get-ReadFailureReason $_)
}

try {
  Get-Command wbadmin.exe -ErrorAction Stop | Out-Null
  $backupOutput = @(& wbadmin.exe get versions 2>&1)
  $backupText = $backupOutput -join "`n"
  if ($LASTEXITCODE -ne 0) {
    $reason = if ($backupText -match '(?i)access (is )?denied|administrator|required privilege') {
      'ACCESS_DENIED'
    } else {
      'QUERY_FAILED'
    }
    $result.windowsBackup = New-Unknown $reason
  } else {
    $versionCount = [regex]::Matches($backupText, '(?im)^\s*Version identifier\s*:').Count
    if ($versionCount -gt 0) {
      $result.windowsBackup = [ordered]@{ status = 'OBSERVED'; versionCount = $versionCount }
    } else {
      $result.windowsBackup = New-Unknown 'UNPARSEABLE_RESULT'
    }
  }
} catch {
  $result.windowsBackup = New-Unknown (Get-ReadFailureReason $_)
}

try {
  $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop)
  $result.tcpListeners = [ordered]@{
    status                    = 'OBSERVED'
    bindingCount              = $listeners.Count
    distinctPortCount         = @($listeners | Select-Object -ExpandProperty LocalPort -Unique).Count
    wildcardIpv4BindingCount  = @($listeners | Where-Object { $_.LocalAddress -eq '0.0.0.0' }).Count
    wildcardIpv6BindingCount  = @($listeners | Where-Object { $_.LocalAddress -eq '::' }).Count
  }
} catch {
  $result.tcpListeners = New-Unknown (Get-ReadFailureReason $_)
}

$sections = @('defender', 'defenderEvents24h', 'firewall', 'osVolumeEncryption', 'windowsBackup', 'tcpListeners')
$unknownCount = @($sections | Where-Object { $result[$_]['status'] -ne 'OBSERVED' }).Count
if ($unknownCount -eq 0) { $result.collectionStatus = 'COMPLETE' }

$result | ConvertTo-Json -Depth 6 -Compress
if ($unknownCount -gt 0) { exit 2 }
exit 0
