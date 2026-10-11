#requires -Version 7.3
# Repository-local source launcher; no install, profile change, or automatic inference.
# Invoke this script normally. Dot-sourcing is refused before changing caller state.

if ($MyInvocation.InvocationName -eq '.') {
    throw 'The A11oy launcher must be invoked with &, not dot-sourced.'
}

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandArgumentPassing = 'Standard'
$PSNativeCommandUseErrorActionPreference = $false
$launcherExitCode = 2
$cliArguments = @($args)
if ($cliArguments.Count -eq 0) {
    $cliArguments = @('--help')
}

try {
    $cliDirectory = $PSScriptRoot
    $requiredFiles = @(
        'src/atelier-cli.ts',
        'node_modules/tsx/package.json',
        'node_modules/commander/package.json',
        'node_modules/node-fetch/package.json',
        'node_modules/@szl-holdings/a11oy-atelier/package.json'
    )
    foreach ($relativeFile in $requiredFiles) {
        if (-not (Test-Path -LiteralPath (Join-Path $cliDirectory $relativeFile) -PathType Leaf)) {
            throw "Required local CLI file is missing: $relativeFile. No installation was attempted."
        }
    }

    $nodeCommand = Get-Command node -CommandType Application -ErrorAction Stop |
        Select-Object -First 1
    $nodeVersion = & $nodeCommand.Source --version
    if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v(\d+)\.') {
        throw 'Unable to identify the installed Node runtime.'
    }
    if ([int]$Matches[1] -lt 24) {
        throw 'The existing A11oy source requires Node 24 or newer. No runtime was installed.'
    }

    Push-Location -LiteralPath $cliDirectory
    try {
        & $nodeCommand.Source --import tsx 'src/atelier-cli.ts' @cliArguments
        $launcherExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
}
catch {
    [Console]::Error.WriteLine('A11oy local launcher: ' + $_.Exception.Message)
    $launcherExitCode = 2
}

exit $launcherExitCode
