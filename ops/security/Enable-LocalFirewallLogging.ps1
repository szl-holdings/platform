#Requires -Version 5.1
#Requires -RunAsAdministrator

<#
Enables bounded Windows Firewall logging with configuration read-back.
Run from an elevated Windows PowerShell or PowerShell terminal.
This changes logging only; it creates no firewall allow or block rules.
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$stateDirectory = Join-Path $env:USERPROFILE 'szl-maintenance\state'
$receiptPath = Join-Path $stateDirectory 'firewall-logging-latest.json'
$backupPath = Join-Path $stateDirectory 'firewall-logging-before.json'
$logDirectory = Join-Path $env:WINDIR 'System32\LogFiles\Firewall'
$minimumFreeBytes = [long] (1.5 * 1GB)
$profileNames = @('Domain', 'Private', 'Public')
$changed = $false
$before = @()
$status = 'UNKNOWN'
$reason = $null

function Write-AtomicJson {
  param([string] $Path, [object] $Value)
  $temporary = $Path + '.tmp'
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  $json = ConvertTo-Json -InputObject $Value -Depth 6 -Compress
  if ($utf8.GetByteCount($json) -gt 4095) { throw 'RECEIPT_TOO_LARGE' }
  try {
    [System.IO.File]::WriteAllText($temporary, $json, $utf8)
    if ([System.IO.File]::Exists($Path)) {
      [System.IO.File]::Replace($temporary, $Path, [System.Management.Automation.Language.NullString]::Value)
    } else {
      [System.IO.File]::Move($temporary, $Path)
    }
  } finally {
    if ([System.IO.File]::Exists($temporary)) { [System.IO.File]::Delete($temporary) }
  }
}

try {
  $drive = New-Object System.IO.DriveInfo(($env:SystemDrive + '\'))
  if ($drive.AvailableFreeSpace -lt $minimumFreeBytes) { throw 'LOW_DISK' }
  $before = @(Get-NetFirewallProfile -PolicyStore PersistentStore -ErrorAction Stop |
    Select-Object Name, LogAllowed, LogBlocked, LogFileName, LogMaxSizeKilobytes)
  if ($before.Count -ne 3) { throw 'PROFILE_SET_INVALID' }
  [System.IO.Directory]::CreateDirectory($stateDirectory) | Out-Null
  # Preserve the first configuration snapshot for an explicit rollback.
  if (-not [System.IO.File]::Exists($backupPath)) { Write-AtomicJson $backupPath $before }
  [System.IO.Directory]::CreateDirectory($logDirectory) | Out-Null
  & icacls.exe $logDirectory /grant 'NT SERVICE\mpssvc:(OI)(CI)F' > $null
  if ($LASTEXITCODE -ne 0) { throw 'LOG_DIRECTORY_ACL_FAILED' }
  foreach ($profileName in $profileNames) {
    $changed = $true
    $logPath = Join-Path $logDirectory ('pfirewall-' + $profileName.ToLowerInvariant() + '.log')
    Set-NetFirewallProfile -Profile $profileName -LogBlocked True -LogAllowed True -LogFileName $logPath -LogMaxSizeKilobytes 20480 -ErrorAction Stop
  }
  $active = @(Get-NetFirewallProfile -PolicyStore ActiveStore -ErrorAction Stop)
  foreach ($profileName in $profileNames) {
    $profile = @($active | Where-Object { $_.Name -eq $profileName })
    $expectedPath = Join-Path $logDirectory ('pfirewall-' + $profileName.ToLowerInvariant() + '.log')
    if ($profile.Count -ne 1 -or [int] $profile[0].LogBlocked -ne 1 -or
        [int] $profile[0].LogAllowed -ne 1 -or $profile[0].LogMaxSizeKilobytes -ne 20480 -or
        [Environment]::ExpandEnvironmentVariables($profile[0].LogFileName) -ine $expectedPath) {
      throw 'ACTIVE_CONFIGURATION_MISMATCH'
    }
  }
  $status = 'CONFIGURATION_VERIFIED'
} catch {
  $allowedReasons = @('LOW_DISK', 'PROFILE_SET_INVALID', 'LOG_DIRECTORY_ACL_FAILED', 'ACTIVE_CONFIGURATION_MISMATCH', 'RECEIPT_TOO_LARGE')
  $reason = if ($_.Exception.Message -in $allowedReasons) { $_.Exception.Message } else { 'APPLY_FAILED' }
  if ($changed) {
    try {
      foreach ($profile in $before) {
        Set-NetFirewallProfile -Profile $profile.Name -LogAllowed $profile.LogAllowed -LogBlocked $profile.LogBlocked -LogFileName $profile.LogFileName -LogMaxSizeKilobytes $profile.LogMaxSizeKilobytes -ErrorAction Stop
      }
      $status = 'ROLLED_BACK'
    } catch { $status = 'ROLLBACK_UNVERIFIED' }
  }
}

$receipt = [ordered]@{
  schemaVersion = 1
  scope = 'LOCAL_HOST'
  observedAtUtc = [DateTime]::UtcNow.ToString('o')
  status = $status
  reasonCode = $reason
  profileCount = 3
  maxLogSizeKilobytesPerProfile = 20480
  logWriteEvidence = 'UNVERIFIED'
}
if ([System.IO.Directory]::Exists($stateDirectory)) {
  try { Write-AtomicJson $receiptPath $receipt } catch { $status = 'RECEIPT_WRITE_FAILED' }
}
$receipt | ConvertTo-Json -Compress
if ($status -ne 'CONFIGURATION_VERIFIED') { exit 2 }
exit 0
