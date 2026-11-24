param(
    [string]$Version = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$gradleFile = Join-Path $root "app\build.gradle.kts"
$keystoreFile = Join-Path $root "keystore.properties"

if (-not $Version) {
    $match = Select-String -Path $gradleFile -Pattern 'versionName\s*=\s*"([^"]+)"' |
        Select-Object -First 1
    if (-not $match) { throw "Cannot read versionName from app/build.gradle.kts" }
    $Version = $match.Matches[0].Groups[1].Value
}

if (-not (Test-Path $keystoreFile)) {
    throw "keystore.properties is missing. Release signing requires it."
}

$env:JAVA_HOME = if ($env:JAVA_HOME) {
    $env:JAVA_HOME
} else {
    "$env:USERPROFILE\.jdks\jbr-21.0.11"
}
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

& "$root\gradlew.bat" clean assembleRelease
if ($LASTEXITCODE -ne 0) { throw "Gradle build failed" }

$srcApk = Join-Path $root "app\build\outputs\apk\release\app-release.apk"
$apk = Join-Path $root "MixaVault-$Version.apk"
Copy-Item $srcApk $apk -Force

$hash = (Get-FileHash $apk -Algorithm SHA256).Hash.ToLower()
"$hash  MixaVault-$Version.apk" |
    Set-Content (Join-Path $root "MixaVault-$Version.sha256") -Encoding ascii

$staging = Join-Path $env:TEMP "mixavault-source-$Version"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

robocopy $root $staging /E `
    /XD ".git" ".gradle" "build" ".idea" ".kotlin" ".cxx" ".keystore" "dist" `
    /XF "local.properties" "keystore.properties" "MixaVault-*.apk" "MixaVault-*.sha256" "MixaVault-*-source.zip" `
    /NFL /NDL /NJH /NJS /NP | Out-Null

$zip = Join-Path $root "MixaVault-$Version-source.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path "$staging\*" -DestinationPath $zip -CompressionLevel Optimal
Remove-Item $staging -Recurse -Force

$buildTools = Join-Path $env:LOCALAPPDATA "Android\Sdk\build-tools\35.0.0"
$apksigner = Join-Path $buildTools "apksigner.bat"
if (Test-Path $apksigner) {
    & $apksigner verify --print-certs $apk
}

Write-Host ""
Write-Host "Release artifacts:"
Get-Item $apk, (Join-Path $root "MixaVault-$Version.sha256"), $zip |
    Select-Object Name, Length
Write-Host ""
Write-Host "SHA256: $hash"
