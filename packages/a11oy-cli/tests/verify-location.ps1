# Offline test helper. Invokes only help or an unknown command; no provider call.
param(
    [Parameter(Mandatory = $true)][string]$Launcher,
    [switch]$Failure,
    [switch]$StrictNativeExit,
    [switch]$DotSource
)
$before = (Get-Location).Path
$PSNativeCommandUseErrorActionPreference = [bool]$StrictNativeExit
$nativePreferenceBefore = $PSNativeCommandUseErrorActionPreference
if ($DotSource) {
    try {
        . $Launcher '--help'
        throw 'Dot-source invocation was unexpectedly accepted.'
    }
    catch {
        if ($_.Exception.Message -notmatch 'must be invoked with &') { throw }
        [Console]::Out.WriteLine('DOTSOURCE_REFUSED')
        if ($before -ne (Get-Location).Path) { exit 99 }
        if ($nativePreferenceBefore -ne $PSNativeCommandUseErrorActionPreference) { exit 98 }
        exit 0
    }
}
if ($Failure) {
    & $Launcher 'definitely-not-an-a11oy-command'
}
else {
    & $Launcher '--help'
}
$childExit = $LASTEXITCODE
$after = (Get-Location).Path
[Console]::Out.WriteLine('LOCATION_RESULT:' + (@{
    before = $before
    after = $after
    cliExit = $childExit
    nativePreferenceBefore = $nativePreferenceBefore
    nativePreferenceAfter = $PSNativeCommandUseErrorActionPreference
} | ConvertTo-Json -Compress))
if ($before -ne $after) { exit 99 }
if ($nativePreferenceBefore -ne $PSNativeCommandUseErrorActionPreference) { exit 98 }
exit $childExit
