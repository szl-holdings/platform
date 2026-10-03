#Requires -Version 5.1

<#
Validates the daily task's latest local receipt before exposing its report.
The caller must supply the reviewed collector hash. A valid receipt proves
local collection only; it is not an authenticated external witness.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[0-9a-fA-F]{64}$')]
  [string] $ExpectedCollectorSha256,
  [string] $StateDirectory = (Join-Path $env:USERPROFILE 'szl-maintenance\state')
)

$ErrorActionPreference = 'Stop'
try {
  $path = Join-Path $StateDirectory 'host-security-latest.json'
  $info = Get-Item -LiteralPath $path -ErrorAction Stop
  if ($info.Length -gt 4095 -or $info.Length -lt 1) { throw 'RECEIPT_SIZE_INVALID' }
  $receipt = ConvertFrom-Json -InputObject ([IO.File]::ReadAllText($path)) -ErrorAction Stop
  if ($receipt.schemaVersion -ne 1 -or $receipt.scope -ne 'LOCAL_HOST' -or
      $receipt.collectionStatus -notin @('COMPLETE', 'PARTIAL')) { throw 'RECEIPT_UNAVAILABLE' }
  if ($receipt.sourceSha256 -ine $ExpectedCollectorSha256) { throw 'SOURCE_HASH_MISMATCH' }
  $collector = Join-Path (Split-Path -Parent $StateDirectory) 'Read-LocalHostSecurity.ps1'
  if ((Get-FileHash -LiteralPath $collector -Algorithm SHA256).Hash -ine $ExpectedCollectorSha256) { throw 'SOURCE_HASH_MISMATCH' }
  $observed = [DateTimeOffset]::MinValue
  $expires = [DateTimeOffset]::MinValue
  if (-not [DateTimeOffset]::TryParse([string] $receipt.observedAtUtc, [ref] $observed) -or
      -not [DateTimeOffset]::TryParse([string] $receipt.expiresAtUtc, [ref] $expires)) { throw 'TIMESTAMP_INVALID' }
  $now = [DateTimeOffset]::UtcNow
  if ($observed -gt $now.AddMinutes(1) -or $expires -le $now -or
      [Math]::Abs(($expires - $observed).TotalHours - 36) -gt 0.01) { throw 'RECEIPT_STALE' }
  if ($receipt.report.schemaVersion -ne 1 -or $receipt.report.scope -ne 'LOCAL_HOST' -or
      $receipt.report.collectionStatus -ne $receipt.collectionStatus) { throw 'SCHEMA_INVALID' }
  $unknownCount = 0
  foreach ($name in @('defender', 'defenderEvents24h', 'firewall', 'osVolumeEncryption', 'windowsBackup', 'tcpListeners')) {
    $section = $receipt.report.PSObject.Properties[$name]
    if ($null -eq $section -or $section.Value.status -notin @('OBSERVED', 'UNKNOWN')) { throw 'SCHEMA_INVALID' }
    if ($section.Value.status -eq 'UNKNOWN') { $unknownCount++ }
  }
  if (($receipt.collectionStatus -eq 'COMPLETE' -and $unknownCount -gt 0) -or
      ($receipt.collectionStatus -eq 'PARTIAL' -and $unknownCount -eq 0)) { throw 'RESULT_INCONSISTENT' }
  $receipt | ConvertTo-Json -Depth 16 -Compress
  if ($receipt.collectionStatus -eq 'PARTIAL') { exit 2 }
  exit 0
} catch {
  $reasons = @('RECEIPT_SIZE_INVALID', 'RECEIPT_UNAVAILABLE', 'SOURCE_HASH_MISMATCH', 'TIMESTAMP_INVALID', 'RECEIPT_STALE', 'SCHEMA_INVALID', 'RESULT_INCONSISTENT')
  $reason = if ($_.Exception.Message -in $reasons) { $_.Exception.Message } else { 'READ_FAILED' }
  [ordered]@{ collectionStatus = 'UNKNOWN'; reasonCode = $reason } | ConvertTo-Json -Compress
  exit 3
}
