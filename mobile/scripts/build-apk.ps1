# Goal Muse - EAS Build APK Automation
# Builds an Android APK via Expo Application Services (EAS).

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$MobileRoot = Split-Path -Parent $ScriptDir

Set-Location $MobileRoot

# Ensure eas.json exists
if (-not (Test-Path "eas.json")) {
    Write-Error "eas.json not found in $MobileRoot. Run EAS configure first or add eas.json."
    exit 1
}

Write-Host "Building Android APK (EAS Build, profile: preview)..." -ForegroundColor Cyan
Write-Host "Project: $MobileRoot" -ForegroundColor Gray
Write-Host ""

# Use npx so global EAS CLI is not required
npx --yes eas-cli build --platform android --profile preview

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Build failed. If you see a login error, run: npx eas-cli login" -ForegroundColor Yellow
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Build submitted. Check the URL above for status and APK download." -ForegroundColor Green
