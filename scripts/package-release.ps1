# Turns `nsh package --target windows`'s output in .nsh\out into the files a
# release ships: kit-<version>-windows-<arch>.zip (portable) and
# kit-<version>-windows-<arch>-setup.exe (Inno Setup, compiled by nsh when
# ISCC.exe is installed).
param(
  [Parameter(Mandatory)][ValidateSet('windows')][string]$Target,
  [Parameter(Mandatory)][string]$Version,
  [Parameter(Mandatory)][ValidateSet('x86_64', 'arm64')][string]$Arch,
  [string]$OutDir = 'dist'
)
$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$Config = Get-Content nsh.json -Raw | ConvertFrom-Json
$Name = $Config.name
$Built = Join-Path '.nsh' 'out'
$Prefix = "kit-$Version-windows-$Arch"

if (-not (Test-Path $Built)) { throw "缺少 ${Built}，先运行 nsh package --target windows" }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$Portable = Join-Path $Built "$Name.zip"
if (-not (Test-Path $Portable)) { throw "nsh package 没有生成 $Portable" }
$Zip = Join-Path $OutDir "$Prefix.zip"
Copy-Item $Portable $Zip

# 解开便携包，确认里面是可运行的目录而不是空壳。
$Extract = Join-Path ([System.IO.Path]::GetTempPath()) ("kit-portable-" + [guid]::NewGuid().ToString('N'))
try {
  Expand-Archive -Path $Zip -DestinationPath $Extract
  foreach ($File in @("$Name\$Name.exe", "$Name\nsh\app.json", "$Name\nsh\bundle.nshc")) {
    if (-not (Test-Path (Join-Path $Extract $File))) { throw "$Zip 里没有 $File" }
  }
}
finally {
  Remove-Item $Extract -Recurse -Force -ErrorAction SilentlyContinue
}

$Setup = Join-Path $Built "$Name-setup.exe"
if (-not (Test-Path $Setup)) {
  throw "nsh package 没有生成 ${Setup}：Windows runner 需要预装 Inno Setup 6（ISCC.exe）"
}
$SetupOut = Join-Path $OutDir "$Prefix-setup.exe"
Copy-Item $Setup $SetupOut
if ((Get-Item $SetupOut).Length -le 0) { throw "安装包为空：$SetupOut" }

Get-ChildItem $OutDir -Filter "$Prefix*" | Format-Table Name, Length
Write-Host "已整理 ${Target} 产物（${Arch}）到 ${OutDir}"
