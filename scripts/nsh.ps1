# Runs the NSH CLI version this app is built and tested with, downloading it
# into .tools/ on first use so a stale system-wide nsh cannot be picked up.
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Version = if ($env:NSH_VERSION) { $env:NSH_VERSION } else { "0.5.1" }
$Bin = Join-Path $Root ".tools\nsh\bin\nsh.exe"

if ((Test-Path $Bin) -and ((& $Bin --version 2>$null) -match [regex]::Escape($Version))) {
  & $Bin @args
  exit $LASTEXITCODE
}

$Archive = "nsh-windows-x86_64.zip"
$ExpectedSha256 = "9dc4b74037033c8ff50b1047b4702b36e6fd66beb9f5d61411d3497f4751df90"
if ($Version -ne "0.5.1") { throw "No pinned NSH archive for $Version on Windows; add its SHA256 to scripts/nsh.ps1." }
$Url = "https://github.com/longbridge/nsh/releases/download/v$Version/$Archive"
$Tools = Join-Path $Root ".tools"
$Zip = Join-Path $Tools $Archive
New-Item -ItemType Directory -Force -Path $Tools | Out-Null
Write-Host "Downloading NSH $Version ($Archive)..."
Invoke-WebRequest -Uri $Url -OutFile $Zip
$ActualSha256 = (Get-FileHash -Algorithm SHA256 $Zip).Hash.ToLowerInvariant()
if ($ActualSha256 -ne $ExpectedSha256) {
  Remove-Item $Zip -Force
  throw "NSH archive checksum mismatch: expected $ExpectedSha256, got $ActualSha256"
}
Remove-Item (Join-Path $Tools "nsh") -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive -Path $Zip -DestinationPath $Tools -Force
Remove-Item $Zip -Force

& $Bin @args
exit $LASTEXITCODE
