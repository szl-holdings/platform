#Requires -Version 5.1

<#
Focused launcher tests using a synthetic collector in a unique temporary
directory. The test never runs the installer or changes Task Scheduler.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
if ((Get-PSDrive -Name C).Free -lt [long] (1.5 * 1GB)) {
  throw 'LOW_DISK_TEST_SKIPPED'
}

$sourceLauncher = Join-Path $PSScriptRoot 'Run-LocalHostSecurityObservation.ps1'
$sourceReader = Join-Path $PSScriptRoot 'Read-LocalHostSecurityReceipt.ps1'
$testDirectory = Join-Path $env:TEMP ('szl-host-observation-test-' + [guid]::NewGuid().ToString('N'))
$absoluteTestDirectory = [System.IO.Path]::GetFullPath($testDirectory)
$allowedPrefix = [System.IO.Path]::GetFullPath($env:TEMP).TrimEnd('\') + '\'
if (-not $absoluteTestDirectory.StartsWith($allowedPrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'UNSAFE_TEST_DIRECTORY'
}
$collector = Join-Path $testDirectory 'Read-LocalHostSecurity.ps1'
$launcher = Join-Path $testDirectory 'Run-LocalHostSecurityObservation.ps1'
$stateDirectory = Join-Path $testDirectory 'state'
$receipt = Join-Path $stateDirectory 'host-security-latest.json'
$temporaryReceipt = Join-Path $stateDirectory 'host-security-latest.json.tmp'
$windowsPowerShell = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Write-SyntheticCollector {
  param([string] $Kind, [int] $ExitCode, [int] $AgeHours)

  $body = @'
$observed = [DateTime]::UtcNow.AddHours(__AGE__).ToString('o')
$kind = '__KIND__'
$defenderState = if ($kind -in @('COMPLETE', 'MISSING_EVENTS')) { 'OBSERVED' } else { 'UNKNOWN' }
$report = [ordered]@{
  schemaVersion = 1
  scope = 'LOCAL_HOST'
  observedAtUtc = $observed
  collectionStatus = if ($kind -eq 'MISSING_EVENTS') { 'COMPLETE' } else { $kind }
  defender = [ordered]@{ status = $defenderState }
  defenderEvents24h = [ordered]@{ status = 'OBSERVED' }
  firewall = [ordered]@{ status = 'OBSERVED' }
  osVolumeEncryption = [ordered]@{ status = 'OBSERVED' }
  windowsBackup = [ordered]@{ status = 'OBSERVED' }
  tcpListeners = [ordered]@{ status = 'OBSERVED' }
}
if ($kind -eq 'MISSING_EVENTS') { $report.Remove('defenderEvents24h') }
$report | ConvertTo-Json -Depth 5 -Compress
exit __EXIT__
'@
  $body = $body.Replace('__KIND__', $Kind).Replace('__EXIT__', [string] $ExitCode).Replace('__AGE__', [string] $AgeHours)
  [System.IO.File]::WriteAllText($collector, $body, $utf8)
}

function Invoke-TestCase {
  param(
    [string] $Name,
    [string] $Kind,
    [int] $CollectorExit,
    [int] $AgeHours,
    [string] $ExpectedStatus,
    [int] $ExpectedExit,
    [AllowNull()] [string] $ExpectedReason
  )

  Write-SyntheticCollector $Kind $CollectorExit $AgeHours
  $sourceHash = (Get-FileHash -LiteralPath $collector -Algorithm SHA256).Hash
  $output = @(& $windowsPowerShell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $launcher -ExpectedCollectorSha256 $sourceHash)
  $actualExit = $LASTEXITCODE
  if (-not [System.IO.File]::Exists($receipt)) { throw "$Name missing receipt" }
  $bytes = [System.IO.File]::ReadAllBytes($receipt)
  $saved = [Text.Encoding]::UTF8.GetString($bytes) | ConvertFrom-Json
  if ($actualExit -ne $ExpectedExit -or $saved.collectionStatus -ne $ExpectedStatus -or
      [string] $saved.reasonCode -ne [string] $ExpectedReason -or $bytes.Length -gt 4095 -or
      $saved.sourceSha256 -ne $sourceHash.ToLowerInvariant()) {
    throw ("{0} result mismatch: exit={1} status={2} reason={3}" -f $Name, $actualExit, $saved.collectionStatus, $saved.reasonCode)
  }
  Write-Output ("{0}:PASS exit={1} receiptBytes={2}" -f $Name, $actualExit, $bytes.Length)
}

try {
  [System.IO.Directory]::CreateDirectory($testDirectory) | Out-Null
  [System.IO.File]::Copy($sourceLauncher, $launcher)
  Invoke-TestCase 'complete' 'COMPLETE' 0 0 'COMPLETE' 0 $null
  $reviewedHash = (Get-FileHash -LiteralPath $collector -Algorithm SHA256).Hash
  $readerOutput = @(& $windowsPowerShell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $sourceReader -ExpectedCollectorSha256 $reviewedHash -StateDirectory $stateDirectory)
  if ($LASTEXITCODE -ne 0) { throw 'fresh reader case failed' }
  Write-Output 'reader_fresh:PASS exit=0'
  $expired = [System.IO.File]::ReadAllText($receipt) | ConvertFrom-Json
  $expired.expiresAtUtc = [DateTime]::UtcNow.AddHours(-1).ToString('o')
  [System.IO.File]::WriteAllText($receipt, ($expired | ConvertTo-Json -Depth 12 -Compress), $utf8)
  $readerOutput = @(& $windowsPowerShell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $sourceReader -ExpectedCollectorSha256 $reviewedHash -StateDirectory $stateDirectory)
  $readerResult = ($readerOutput -join "`n") | ConvertFrom-Json
  if ($LASTEXITCODE -ne 3 -or $readerResult.reasonCode -ne 'RECEIPT_STALE') { throw 'stale reader case failed' }
  Write-Output 'reader_stale:PASS exit=3'
  Invoke-TestCase 'partial' 'PARTIAL' 2 0 'PARTIAL' 2 $null
  Invoke-TestCase 'stale' 'COMPLETE' 0 -2 'UNKNOWN' 3 'COLLECTOR_FRESHNESS_INVALID'
  Invoke-TestCase 'missing_event_section' 'MISSING_EVENTS' 0 0 'UNKNOWN' 3 'COLLECTOR_SCHEMA_INVALID'

  $wrongHash = '0' * 64
  $output = @(& $windowsPowerShell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $launcher -ExpectedCollectorSha256 $wrongHash)
  $actualExit = $LASTEXITCODE
  $saved = [System.IO.File]::ReadAllText($receipt) | ConvertFrom-Json
  if ($actualExit -ne 3 -or $saved.collectionStatus -ne 'UNKNOWN' -or
      $saved.reasonCode -ne 'SOURCE_HASH_MISMATCH') {
    throw 'hash mismatch case failed'
  }
  Write-Output 'hash_mismatch:PASS exit=3'
} finally {
  foreach ($file in @($temporaryReceipt, $receipt, $collector, $launcher)) {
    if ([System.IO.File]::Exists($file)) { [System.IO.File]::Delete($file) }
  }
  if ([System.IO.Directory]::Exists($stateDirectory)) {
    [System.IO.Directory]::Delete($stateDirectory)
  }
  if ([System.IO.Directory]::Exists($testDirectory)) {
    [System.IO.Directory]::Delete($testDirectory)
  }
}
