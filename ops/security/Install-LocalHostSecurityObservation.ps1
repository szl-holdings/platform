#Requires -Version 5.1

<#
.SYNOPSIS
  Installs a reviewed local host collector as a limited current-user daily task.
.DESCRIPTION
  Requires the SHA-256 of the reviewed collector bytes. Does not run the task.
  Existing tasks or installed files with the same names stop installation for
  manual review. No credentials or elevated principal are requested.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[0-9a-fA-F]{64}$')]
  [string] $ApprovedCollectorSha256
)

$ErrorActionPreference = 'Stop'
$minimumFreeBytes = [long] (1.5 * 1GB)
$taskName = 'SZL Local Host Security Observation'
$installRoot = Join-Path $env:USERPROFILE 'szl-maintenance'
$collectorName = 'Read-LocalHostSecurity.ps1'
$launcherName = 'Run-LocalHostSecurityObservation.ps1'
$sourceCollector = Join-Path $PSScriptRoot $collectorName
$sourceLauncher = Join-Path $PSScriptRoot $launcherName
$installedCollector = Join-Path $installRoot $collectorName
$installedLauncher = Join-Path $installRoot $launcherName
$approvedHash = $ApprovedCollectorSha256.ToLowerInvariant()
$registrationAttempted = $false

function Get-SystemDriveFreeBytes {
  if ([string]::IsNullOrWhiteSpace($env:SystemDrive)) { throw 'SYSTEM_DRIVE_UNKNOWN' }
  $drive = New-Object System.IO.DriveInfo(($env:SystemDrive + '\'))
  return [long] $drive.AvailableFreeSpace
}

try {
  if ((Get-SystemDriveFreeBytes) -lt $minimumFreeBytes) { throw 'LOW_DISK' }
  if (-not [System.IO.File]::Exists($sourceCollector) -or
      -not [System.IO.File]::Exists($sourceLauncher)) { throw 'SOURCE_MISSING' }
  if ((Get-FileHash -LiteralPath $sourceCollector -Algorithm SHA256).Hash -ine $approvedHash) {
    throw 'SOURCE_HASH_MISMATCH'
  }
  $approvedLauncherHash = (Get-FileHash -LiteralPath $sourceLauncher -Algorithm SHA256).Hash
  $collectorExists = [System.IO.File]::Exists($installedCollector)
  $launcherExists = [System.IO.File]::Exists($installedLauncher)
  if ($collectorExists -xor $launcherExists) { throw 'INSTALLED_FILE_COLLISION' }
  if ($collectorExists -and
      ((Get-FileHash -LiteralPath $installedCollector -Algorithm SHA256).Hash -ine $approvedHash -or
       (Get-FileHash -LiteralPath $installedLauncher -Algorithm SHA256).Hash -ine $approvedLauncherHash)) {
    throw 'INSTALLED_FILE_COLLISION'
  }
  if ($null -ne (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue)) {
    throw 'TASK_NAME_COLLISION'
  }

  [System.IO.Directory]::CreateDirectory($installRoot) | Out-Null
  [System.IO.Directory]::CreateDirectory((Join-Path $installRoot 'state')) | Out-Null
  if (-not $collectorExists) {
    [System.IO.File]::Copy($sourceCollector, $installedCollector, $false)
    [System.IO.File]::Copy($sourceLauncher, $installedLauncher, $false)
  }
  if ((Get-FileHash -LiteralPath $installedCollector -Algorithm SHA256).Hash -ine $approvedHash -or
      (Get-FileHash -LiteralPath $installedLauncher -Algorithm SHA256).Hash -ine $approvedLauncherHash) {
    throw 'COPY_READBACK_MISMATCH'
  }
  if ((Get-SystemDriveFreeBytes) -lt $minimumFreeBytes) { throw 'LOW_DISK' }

  $powershellExe = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
  if (-not [System.IO.File]::Exists($powershellExe)) { throw 'TASK_RUNTIME_MISSING' }
  $arguments = '-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}" -ExpectedCollectorSha256 {1}' -f $installedLauncher, $approvedHash
  $action = New-ScheduledTaskAction -Execute $powershellExe -Argument $arguments -WorkingDirectory $installRoot
  $now = Get-Date
  $firstRun = $now.Date.AddHours(9).AddMinutes(15)
  if ($firstRun -le $now) { $firstRun = $firstRun.AddDays(1) }
  $trigger = New-ScheduledTaskTrigger -Daily -At $firstRun
  $principal = New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
  $settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  $registrationAttempted = $true
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Read-only local host security observation; latest bounded JSON receipt only.' -ErrorAction Stop | Out-Null

  $installedTask = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
  if ($installedTask.Principal.RunLevel -ne 'Limited' -or
      $installedTask.Principal.LogonType -ne 'Interactive' -or
      $installedTask.Actions.Count -ne 1 -or
      $installedTask.Actions[0].Execute -ne $powershellExe -or
      $installedTask.Actions[0].Arguments -ne $arguments) {
    throw 'TASK_READBACK_MISMATCH'
  }
  [ordered]@{
    status = 'INSTALLED_NOT_RUN'
    taskName = $taskName
    sourceSha256 = $approvedHash
    schedule = 'DAILY_0915_LOCAL_INTERACTIVE_LIMITED'
  } | ConvertTo-Json -Compress | Write-Output
  exit 0
} catch {
  $allowedReasons = @(
    'LOW_DISK', 'SOURCE_MISSING', 'SOURCE_HASH_MISMATCH',
    'INSTALLED_FILE_COLLISION', 'TASK_NAME_COLLISION', 'COPY_READBACK_MISMATCH',
    'TASK_RUNTIME_MISSING', 'TASK_READBACK_MISMATCH'
  )
  $reason = if ($_.Exception.Message -in $allowedReasons) { $_.Exception.Message } else { 'INSTALL_FAILED' }
  $status = if ($registrationAttempted) { 'REGISTRATION_UNVERIFIED' } else { 'NOT_INSTALLED' }
  [ordered]@{ status = $status; reasonCode = $reason } |
    ConvertTo-Json -Compress | Write-Output
  exit 3
}
