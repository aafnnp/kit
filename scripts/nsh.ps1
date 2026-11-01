# Runs the NSH CLI version this app is built and tested with, downloading it
# into .tools\ on first use so a stale system-wide nsh cannot be picked up.
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Version = if ($env:NSH_VERSION) { $env:NSH_VERSION } else { "0.3.0" }
$Bin = Join-Path $Root ".tools\nsh\bin\nsh.exe"

if (-not (Test-Path $Bin)) {
  $Archive = "nsh-windows-x86_64.zip"
  $Url = "https://github.com/longbridge/nsh/releases/download/v$Version/$Archive"
  $Tools = Join-Path $Root ".tools"
  New-Item -ItemType Directory -Force -Path $Tools | Out-Null
  $Zip = Join-Path $Tools $Archive
  Write-Host "Downloading NSH $Version ($Archive)..."
  Invoke-WebRequest -Uri $Url -OutFile $Zip
  Expand-Archive -Path $Zip -DestinationPath $Tools -Force
  Remove-Item $Zip
}

& $Bin @args
exit $LASTEXITCODE
