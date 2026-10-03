#Requires -Version 5.1

<#
Backs up and restores the two installed local observation source files, then
compares every restored SHA-256. The archive stays on the same local volume;
this drill does not establish off-device backup or whole-computer recovery.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$installRoot = Join-Path $env:USERPROFILE 'szl-maintenance'
$stateRoot = Join-Path $installRoot 'state'
$names = @('Read-LocalHostSecurity.ps1', 'Run-LocalHostSecurityObservation.ps1')
$drillRoot = Join-Path $stateRoot ('restore-drill-' + [guid]::NewGuid().ToString('N'))
$snapshotRoot = Join-Path $drillRoot 'snapshot'
$restoredRoot = Join-Path $drillRoot 'restored'
$temporaryArchive = Join-Path $drillRoot 'backup.zip'
$archivePath = Join-Path $stateRoot 'local-host-tools-backup.zip'
$receiptPath = Join-Path $stateRoot 'local-host-tools-restore-latest.json'
$receipt = [ordered]@{
  schemaVersion = 1
  scope = 'LOCAL_OBSERVATION_SOURCE_FILES_ONLY'
  observedAtUtc = [DateTime]::UtcNow.ToString('o')
  status = 'UNKNOWN'
  storageScope = 'SAME_LOCAL_VOLUME'
  offDeviceBackupVerified = $false
  files = @()
  archiveSha256 = $null
  reasonCode = $null
}
$exitCode = 2
try {
  if ((Get-PSDrive -Name C).Free -lt [long] (1.5 * 1GB)) { throw 'LOW_DISK' }
  [IO.Directory]::CreateDirectory($snapshotRoot) | Out-Null
  $hashes = @{}
  foreach ($name in $names) {
    $source = Join-Path $installRoot $name
    $info = Get-Item -LiteralPath $source -ErrorAction Stop
    if ($info.Length -gt 65536 -or ($info.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'SOURCE_NOT_BOUNDED_FILE' }
    $hashes[$name] = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
    [IO.File]::Copy($source, (Join-Path $snapshotRoot $name), $false)
    if ((Get-FileHash -LiteralPath (Join-Path $snapshotRoot $name)).Hash -ine $hashes[$name]) { throw 'SNAPSHOT_MISMATCH' }
  }
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [IO.Compression.ZipFile]::CreateFromDirectory($snapshotRoot, $temporaryArchive)
  [IO.Compression.ZipFile]::ExtractToDirectory($temporaryArchive, $restoredRoot)
  $results = foreach ($name in $names) {
    $restoredHash = (Get-FileHash -LiteralPath (Join-Path $restoredRoot $name) -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($restoredHash -ne $hashes[$name]) { throw 'RESTORE_MISMATCH' }
    [ordered]@{ name = $name; sourceSha256 = $hashes[$name]; restoredSha256 = $restoredHash; matched = $true }
  }
  if ([IO.File]::Exists($archivePath)) {
    [IO.File]::Replace($temporaryArchive, $archivePath, [System.Management.Automation.Language.NullString]::Value)
  } else { [IO.File]::Move($temporaryArchive, $archivePath) }
  $receipt.files = @($results)
  $receipt.archiveSha256 = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
  $receipt.status = 'RESTORE_VERIFIED'
  $exitCode = 0
} catch {
  $reasons = @('LOW_DISK', 'SOURCE_NOT_BOUNDED_FILE', 'SNAPSHOT_MISMATCH', 'RESTORE_MISMATCH')
  $receipt.reasonCode = if ($_.Exception.Message -in $reasons) { $_.Exception.Message } else { 'DRILL_FAILED' }
} finally {
  if ([IO.Directory]::Exists($drillRoot)) {
    $resolved = (Resolve-Path -LiteralPath $drillRoot).Path
    $allowedPrefix = [IO.Path]::GetFullPath($stateRoot).TrimEnd('\') + '\restore-drill-'
    if (-not $resolved.StartsWith($allowedPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'UNSAFE_CLEANUP_PATH' }
    Remove-Item -LiteralPath $resolved -Recurse -Force -ErrorAction Stop
  }
}
if ((Get-PSDrive -Name C).Free -ge [long] (1.5 * 1GB)) {
  [IO.Directory]::CreateDirectory($stateRoot) | Out-Null
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  $temporary = $receiptPath + '.tmp'
  try {
    [IO.File]::WriteAllText($temporary, ($receipt | ConvertTo-Json -Depth 6 -Compress), $utf8)
    if ([IO.File]::Exists($receiptPath)) {
      [IO.File]::Replace($temporary, $receiptPath, [System.Management.Automation.Language.NullString]::Value)
    } else { [IO.File]::Move($temporary, $receiptPath) }
  } finally { if ([IO.File]::Exists($temporary)) { [IO.File]::Delete($temporary) } }
} else { $exitCode = 2 }
$receipt | ConvertTo-Json -Depth 6 -Compress
exit $exitCode
