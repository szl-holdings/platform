#requires -Version 7.0

<#
Read-only local source and Windows host observation.
Run: pwsh -NoProfile -File scripts/qa/run-local-evolution.ps1
The single JSON result never asserts hosted CI, deployment, or production readiness.
#>

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

$repositoryRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$sourceVerifier = Join-Path $PSScriptRoot 'verify-cross-lane-source.mjs'
$hostCollector = Join-Path $repositoryRoot 'ops/security/Read-LocalHostSecurity.ps1'

function Invoke-JsonChild {
    param(
        [string] $ExecutableName,
        [string] $ScriptPath,
        [string[]] $Arguments
    )

    if (-not (Test-Path -LiteralPath $ScriptPath -PathType Leaf)) {
        return [ordered]@{ exitCode = $null; payload = $null; errorCode = 'CHILD_SCRIPT_MISSING' }
    }

    $executable = Get-Command -Name $ExecutableName -CommandType Application -ErrorAction SilentlyContinue
    if ($null -eq $executable) {
        return [ordered]@{ exitCode = $null; payload = $null; errorCode = 'EXECUTABLE_UNAVAILABLE' }
    }

    try {
        $lines = @(& $executable.Source @Arguments 2>$null)
        $exitCode = $LASTEXITCODE
    }
    catch {
        return [ordered]@{ exitCode = $null; payload = $null; errorCode = 'CHILD_EXECUTION_FAILED' }
    }

    $jsonText = ($lines -join "`n").Trim()
    if ([string]::IsNullOrWhiteSpace($jsonText)) {
        return [ordered]@{ exitCode = $exitCode; payload = $null; errorCode = 'CHILD_JSON_MISSING' }
    }
    try {
        $payload = ConvertFrom-Json -InputObject $jsonText -AsHashtable -Depth 30 -ErrorAction Stop
    }
    catch {
        return [ordered]@{ exitCode = $exitCode; payload = $null; errorCode = 'CHILD_JSON_INVALID' }
    }
    if ($payload -isnot [System.Collections.IDictionary]) {
        return [ordered]@{ exitCode = $exitCode; payload = $null; errorCode = 'CHILD_JSON_NOT_OBJECT' }
    }
    return [ordered]@{ exitCode = $exitCode; payload = $payload; errorCode = $null }
}

function Test-SourceReport {
    param($Child)

    $report = $Child.payload
    if ($Child.exitCode -ne 0 -or $null -ne $Child.errorCode -or $null -eq $report) {
        return $false
    }
    if ($report.source -isnot [System.Collections.IDictionary]) {
        return $false
    }
    if (
        $report.schema -ne 'szl.cross-lane.local-source-verification/v1' -or
        $report.verification -ne 'VERIFIED_LOCAL_SOURCE' -or
        $report.runtimeReadiness -ne 'UNKNOWN' -or
        $report.source.gitHead -notmatch '^[0-9a-f]{40}$' -or
        $report.source.sha256 -notmatch '^[0-9a-f]{64}$'
    ) {
        return $false
    }

    $expectedIds = @('cyber-security', 'finance', 'data-governance', 'enterprise', 'real-estate', 'legal')
    $unknownStages = @('hostedCI', 'protectedMerge', 'providerPublication', 'deployment', 'outsideWitness')
    if ($report.lanes -isnot [array] -or $report.lanes.Count -ne $expectedIds.Count) {
        return $false
    }
    for ($index = 0; $index -lt $expectedIds.Count; $index++) {
        $lane = $report.lanes[$index]
        if ($lane -isnot [System.Collections.IDictionary] -or $lane.externalEvidence -isnot [System.Collections.IDictionary]) {
            return $false
        }
        if (
            $lane.id -ne $expectedIds[$index] -or
            $lane.sourceState -ne 'DEMO' -or
            $lane.scenarioState -ne 'DEMO' -or
            $lane.liveState -ne 'UNAVAILABLE' -or
            $lane.actionState -ne 'BLOCKED'
        ) {
            return $false
        }
        foreach ($stage in $unknownStages) {
            if ($lane.externalEvidence[$stage] -ne 'UNKNOWN') {
                return $false
            }
        }
    }
    return $true
}

function Get-HostReportStatus {
    param($Child)

    $report = $Child.payload
    if ($null -ne $Child.errorCode -or $null -eq $report) {
        return 'UNKNOWN'
    }
    if ($report.schemaVersion -ne 1 -or $report.scope -ne 'LOCAL_HOST') {
        return 'UNKNOWN'
    }
    if ($null -eq $report.observedAtUtc -or [string]::IsNullOrWhiteSpace([string] $report.observedAtUtc)) {
        return 'UNKNOWN'
    }
    $requiredSections = @('defender', 'firewall', 'osVolumeEncryption', 'windowsBackup', 'tcpListeners')
    $statuses = @()
    foreach ($sectionName in $requiredSections) {
        $section = $report[$sectionName]
        if ($section -isnot [System.Collections.IDictionary] -or $section.status -notin @('OBSERVED', 'UNKNOWN')) {
            return 'UNKNOWN'
        }
        $statuses += $section.status
    }
    $unknownCount = @($statuses | Where-Object { $_ -eq 'UNKNOWN' }).Count
    if ($Child.exitCode -eq 0 -and $report.collectionStatus -eq 'COMPLETE' -and $unknownCount -eq 0) {
        return 'OBSERVED'
    }
    if ($Child.exitCode -eq 2 -and $report.collectionStatus -eq 'PARTIAL' -and $unknownCount -gt 0) {
        return 'PARTIAL'
    }
    return 'UNKNOWN'
}

$sourceChild = Invoke-JsonChild -ExecutableName 'node' -ScriptPath $sourceVerifier -Arguments @($sourceVerifier)
$hostChild = Invoke-JsonChild -ExecutableName 'pwsh' -ScriptPath $hostCollector -Arguments @('-NoProfile', '-File', $hostCollector)

$sourceStatus = if (Test-SourceReport -Child $sourceChild) { 'VERIFIED_LOCAL_SOURCE' } else { 'UNKNOWN' }
$hostStatus = Get-HostReportStatus -Child $hostChild

$overallStatus = 'UNKNOWN'
$exitCode = 2
if ($sourceStatus -eq 'VERIFIED_LOCAL_SOURCE' -and $hostStatus -eq 'OBSERVED') {
    $overallStatus = 'LOCAL_SOURCE_ONLY'
    $exitCode = 0
}
elseif ($sourceStatus -eq 'VERIFIED_LOCAL_SOURCE' -and $hostStatus -eq 'PARTIAL') {
    $overallStatus = 'PARTIAL'
}

$result = [ordered]@{
    schemaVersion = 1
    scope = 'LOCAL_ONLY'
    overallStatus = $overallStatus
    runtimeReadiness = 'UNKNOWN'
    source = [ordered]@{
        status = $sourceStatus
        exitCode = $sourceChild.exitCode
        errorCode = $sourceChild.errorCode
        report = if ($sourceStatus -eq 'VERIFIED_LOCAL_SOURCE') { $sourceChild.payload } else { $null }
    }
    hostSecurity = [ordered]@{
        status = $hostStatus
        exitCode = $hostChild.exitCode
        errorCode = $hostChild.errorCode
        report = if ($hostStatus -in @('OBSERVED', 'PARTIAL')) { $hostChild.payload } else { $null }
    }
}

$result | ConvertTo-Json -Depth 30 -Compress | Write-Output
exit $exitCode
