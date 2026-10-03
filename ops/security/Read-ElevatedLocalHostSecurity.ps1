#Requires -Version 5.1
#Requires -RunAsAdministrator

<#
Runs the installed, hash-bound collector with administrator read permissions.
Keeps a separate latest receipt so the limited daily task stays attributable.
Changes no Defender, encryption, backup, or firewall settings.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[0-9a-fA-F]{64}$')]
  [string] $ExpectedCollectorSha256
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$root = Join-Path $env:USERPROFILE 'szl-maintenance'
$collector = Join-Path $root 'Read-LocalHostSecurity.ps1'
$stateDirectory = Join-Path $root 'state'
$destination = Join-Path $stateDirectory 'host-security-elevated-latest.json'
$temporary = $destination + '.tmp'
$expectedHash = $ExpectedCollectorSha256.ToLowerInvariant()
$exitCode = 3
$receipt = [ordered]@{
  schemaVersion = 1
  scope = 'LOCAL_HOST'
  permissionContext = 'ELEVATED_READ_ONLY'
  recordedAtUtc = [DateTime]::UtcNow.ToString('o')
  collectionStatus = 'UNKNOWN'
  reasonCode = $null
  sourceSha256 = $expectedHash
  report = $null
}

try {
  $drive = New-Object System.IO.DriveInfo(($env:SystemDrive + '\'))
  if ($drive.AvailableFreeSpace -lt [long] (1.5 * 1GB)) { throw 'LOW_DISK' }
  if ((Get-FileHash -LiteralPath $collector -Algorithm SHA256).Hash -ine $expectedHash) { throw 'SOURCE_HASH_MISMATCH' }
  $powerShell = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
  $lines = @(& $powerShell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $collector 2>$null)
  $collectorExit = $LASTEXITCODE
  $raw = ($lines -join "`n").Trim()
  if ([Text.Encoding]::UTF8.GetByteCount($raw) -gt 3584) { throw 'OUTPUT_TOO_LARGE' }
  $report = ConvertFrom-Json -InputObject $raw -ErrorAction Stop
  if ($report.schemaVersion -ne 1 -or $report.scope -ne 'LOCAL_HOST') { throw 'SCHEMA_INVALID' }
  $observed = [DateTimeOffset]::MinValue
  if (-not [DateTimeOffset]::TryParse([string] $report.observedAtUtc, [ref] $observed)) { throw 'TIMESTAMP_INVALID' }
  $age = ([DateTimeOffset]::UtcNow - $observed).TotalMinutes
  if ($age -gt 5 -or $age -lt -1) { throw 'TIMESTAMP_INVALID' }
  $unknownCount = 0
  foreach ($name in @('defender', 'defenderEvents24h', 'firewall', 'osVolumeEncryption', 'windowsBackup', 'tcpListeners')) {
    $section = $report.PSObject.Properties[$name]
    if ($null -eq $section -or $section.Value.status -notin @('OBSERVED', 'UNKNOWN')) { throw 'SCHEMA_INVALID' }
    if ($section.Value.status -eq 'UNKNOWN') { $unknownCount++ }
  }
  if ($collectorExit -eq 0 -and $report.collectionStatus -eq 'COMPLETE' -and $unknownCount -eq 0) {
    $receipt.collectionStatus = 'COMPLETE'
    $exitCode = 0
  } elseif ($collectorExit -eq 2 -and $report.collectionStatus -eq 'PARTIAL' -and $unknownCount -gt 0) {
    $receipt.collectionStatus = 'PARTIAL'
    $exitCode = 2
  } else { throw 'RESULT_INCONSISTENT' }
  $receipt.report = $report
} catch {
  $allowedReasons = @('LOW_DISK', 'SOURCE_HASH_MISMATCH', 'OUTPUT_TOO_LARGE', 'SCHEMA_INVALID', 'TIMESTAMP_INVALID', 'RESULT_INCONSISTENT')
  $receipt.reasonCode = if ($_.Exception.Message -in $allowedReasons) { $_.Exception.Message } else { 'READ_FAILED' }
}

try {
  $drive = New-Object System.IO.DriveInfo(($env:SystemDrive + '\'))
  if ($drive.AvailableFreeSpace -lt [long] (1.5 * 1GB)) { throw 'LOW_DISK' }
  [System.IO.Directory]::CreateDirectory($stateDirectory) | Out-Null
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  $json = ConvertTo-Json -InputObject $receipt -Depth 12 -Compress
  if ($utf8.GetByteCount($json) -gt 4095) { throw 'RECEIPT_TOO_LARGE' }
  [System.IO.File]::WriteAllText($temporary, $json, $utf8)
  if ([System.IO.File]::Exists($destination)) {
    [System.IO.File]::Replace($temporary, $destination, [System.Management.Automation.Language.NullString]::Value)
  } else { [System.IO.File]::Move($temporary, $destination) }
} catch { $exitCode = 3 }
finally { if ([System.IO.File]::Exists($temporary)) { [System.IO.File]::Delete($temporary) } }

[ordered]@{ collectionStatus = $receipt.collectionStatus; reasonCode = $receipt.reasonCode } | ConvertTo-Json -Compress
exit $exitCode
