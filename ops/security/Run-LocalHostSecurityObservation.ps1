#Requires -Version 5.1

<#
.SYNOPSIS
  Runs the pinned local host collector and keeps one bounded latest receipt.
.DESCRIPTION
  Task exit 0 means a complete observation; 2 means a partial observation;
  3 means the collector or receipt was invalid; 4 means the disk guard blocked
  a write. A receipt is evidence of this host only, not a readiness verdict.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[0-9a-fA-F]{64}$')]
  [string] $ExpectedCollectorSha256
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

$minimumFreeBytes = [long] (1.5 * 1GB)
$maximumReceiptBytes = 4095
$collectorPath = Join-Path $PSScriptRoot 'Read-LocalHostSecurity.ps1'
$stateDirectory = Join-Path $PSScriptRoot 'state'
$receiptPath = Join-Path $stateDirectory 'host-security-latest.json'
$temporaryPath = Join-Path $stateDirectory 'host-security-latest.json.tmp'
$expectedHash = $ExpectedCollectorSha256.ToLowerInvariant()

function Get-SystemDriveFreeBytes {
  if ([string]::IsNullOrWhiteSpace($env:SystemDrive)) { throw 'SYSTEM_DRIVE_UNKNOWN' }
  $drive = New-Object System.IO.DriveInfo(($env:SystemDrive + '\'))
  return [long] $drive.AvailableFreeSpace
}

function New-Receipt {
  param(
    [string] $Status,
    [AllowNull()] [string] $ReasonCode,
    [AllowNull()] [string] $ObservedAtUtc,
    [AllowNull()] [string] $ExpiresAtUtc,
    [AllowNull()] [object] $Report
  )

  return [ordered]@{
    schemaVersion = 1
    scope = 'LOCAL_HOST'
    recordedAtUtc = [DateTimeOffset]::UtcNow.ToString('o', [Globalization.CultureInfo]::InvariantCulture)
    observedAtUtc = if ([string]::IsNullOrEmpty($ObservedAtUtc)) { $null } else { $ObservedAtUtc }
    expiresAtUtc = if ([string]::IsNullOrEmpty($ExpiresAtUtc)) { $null } else { $ExpiresAtUtc }
    collectionStatus = $Status
    reasonCode = if ([string]::IsNullOrEmpty($ReasonCode)) { $null } else { $ReasonCode }
    sourceSha256 = $expectedHash
    report = $Report
  }
}

function Write-LatestReceipt {
  param([Parameter(Mandatory = $true)] [object] $Receipt)

  if ((Get-SystemDriveFreeBytes) -lt $minimumFreeBytes) { throw 'LOW_DISK' }
  $json = ConvertTo-Json -InputObject $Receipt -Depth 16 -Compress
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  $bytes = $utf8.GetBytes($json)
  if ($bytes.Length -gt $maximumReceiptBytes) { throw 'RECEIPT_TOO_LARGE' }

  [System.IO.Directory]::CreateDirectory($stateDirectory) | Out-Null
  try {
    [System.IO.File]::WriteAllBytes($temporaryPath, $bytes)
    if ([System.IO.File]::Exists($receiptPath)) {
      [System.IO.File]::Replace($temporaryPath, $receiptPath, [System.Management.Automation.Language.NullString]::Value)
    } else {
      [System.IO.File]::Move($temporaryPath, $receiptPath)
    }
    $readBack = [System.IO.File]::ReadAllBytes($receiptPath)
    if ($readBack.Length -ne $bytes.Length -or
        [Convert]::ToBase64String($readBack) -ne [Convert]::ToBase64String($bytes)) {
      throw 'RECEIPT_READBACK_MISMATCH'
    }
  } finally {
    if ([System.IO.File]::Exists($temporaryPath)) {
      [System.IO.File]::Delete($temporaryPath)
    }
  }
}

function Write-Summary {
  param([string] $Status, [AllowNull()] [string] $ReasonCode)
  [ordered]@{ collectionStatus = $Status; reasonCode = if ([string]::IsNullOrEmpty($ReasonCode)) { $null } else { $ReasonCode } } |
    ConvertTo-Json -Compress | Write-Output
}

if ((Get-SystemDriveFreeBytes) -lt $minimumFreeBytes) {
  Write-Summary 'UNKNOWN' 'LOW_DISK'
  exit 4
}

try {
  if (-not [System.IO.File]::Exists($collectorPath)) { throw 'COLLECTOR_MISSING' }
  $actualHash = (Get-FileHash -LiteralPath $collectorPath -Algorithm SHA256).Hash
  if ($actualHash -ine $expectedHash) { throw 'SOURCE_HASH_MISMATCH' }

  Write-LatestReceipt (New-Receipt 'UNKNOWN' 'COLLECTION_IN_PROGRESS' $null $null $null)

  $windowsPowerShell = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
  if (-not [System.IO.File]::Exists($windowsPowerShell)) { throw 'COLLECTOR_RUNTIME_MISSING' }
  $lines = @(& $windowsPowerShell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $collectorPath 2>$null)
  $collectorExitCode = $LASTEXITCODE
  $raw = ($lines -join "`n").Trim()
  if ([string]::IsNullOrWhiteSpace($raw)) { throw 'COLLECTOR_OUTPUT_MISSING' }
  if ([Text.Encoding]::UTF8.GetByteCount($raw) -gt 3584) { throw 'COLLECTOR_OUTPUT_TOO_LARGE' }
  try { $report = ConvertFrom-Json -InputObject $raw -ErrorAction Stop }
  catch { throw 'COLLECTOR_JSON_INVALID' }

  if ($report.schemaVersion -ne 1 -or $report.scope -ne 'LOCAL_HOST') {
    throw 'COLLECTOR_SCHEMA_INVALID'
  }
  $observedAt = [DateTimeOffset]::MinValue
  if (-not [DateTimeOffset]::TryParse([string] $report.observedAtUtc, [ref] $observedAt)) {
    throw 'COLLECTOR_FRESHNESS_INVALID'
  }
  $ageMinutes = ([DateTimeOffset]::UtcNow - $observedAt).TotalMinutes
  if ($ageMinutes -gt 5 -or $ageMinutes -lt -1) { throw 'COLLECTOR_FRESHNESS_INVALID' }

  $requiredSections = @('defender', 'defenderEvents24h', 'firewall', 'osVolumeEncryption', 'windowsBackup', 'tcpListeners')
  foreach ($name in $requiredSections) {
    $property = $report.PSObject.Properties[$name]
    if ($null -eq $property -or $null -eq $property.Value -or
        $property.Value.status -notin @('OBSERVED', 'UNKNOWN')) {
      throw 'COLLECTOR_SCHEMA_INVALID'
    }
  }
  $statusSections = @($report.PSObject.Properties | Where-Object {
      $null -ne $_.Value -and $null -ne $_.Value.PSObject.Properties['status']
    })
  foreach ($section in $statusSections) {
    if ($section.Value.status -notin @('OBSERVED', 'UNKNOWN')) {
      throw 'COLLECTOR_SCHEMA_INVALID'
    }
  }
  $unknownCount = @($statusSections | Where-Object { $_.Value.status -eq 'UNKNOWN' }).Count
  $status = $null
  $taskExitCode = 3
  if ($collectorExitCode -eq 0 -and $report.collectionStatus -eq 'COMPLETE' -and $unknownCount -eq 0) {
    $status = 'COMPLETE'
    $taskExitCode = 0
  } elseif ($collectorExitCode -eq 2 -and $report.collectionStatus -eq 'PARTIAL' -and $unknownCount -gt 0) {
    $status = 'PARTIAL'
    $taskExitCode = 2
  } else {
    throw 'COLLECTOR_RESULT_INCONSISTENT'
  }

  $observedUtc = $observedAt.ToUniversalTime().ToString('o', [Globalization.CultureInfo]::InvariantCulture)
  $expiresUtc = $observedAt.AddHours(36).ToUniversalTime().ToString('o', [Globalization.CultureInfo]::InvariantCulture)
  Write-LatestReceipt (New-Receipt $status $null $observedUtc $expiresUtc $report)
  Write-Summary $status $null
  exit $taskExitCode
} catch {
  $allowedReasons = @(
    'COLLECTOR_MISSING', 'SOURCE_HASH_MISMATCH', 'COLLECTOR_RUNTIME_MISSING',
    'COLLECTOR_OUTPUT_MISSING', 'COLLECTOR_OUTPUT_TOO_LARGE',
    'COLLECTOR_JSON_INVALID', 'COLLECTOR_SCHEMA_INVALID',
    'COLLECTOR_FRESHNESS_INVALID', 'COLLECTOR_RESULT_INCONSISTENT',
    'RECEIPT_TOO_LARGE', 'RECEIPT_READBACK_MISMATCH', 'LOW_DISK'
  )
  $reason = if ($_.Exception.Message -in $allowedReasons) { $_.Exception.Message } else { 'RUN_FAILED' }
  try {
    Write-LatestReceipt (New-Receipt 'UNKNOWN' $reason $null $null $null)
  } catch {
    # A failed write leaves the previous receipt in place; consumers must check expiry.
  }
  Write-Summary 'UNKNOWN' $reason
  exit 3
}
