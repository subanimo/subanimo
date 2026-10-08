# Subanimo launcher for Windows (started by Subanimo.bat).
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"   # Invoke-WebRequest is very slow with the progress bar on
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$App = Split-Path -Parent $PSScriptRoot
$Runtime = Join-Path $App ".runtime"
$NodeMajor = 22
Set-Location $App

function Say($en, $tr) { Write-Host ""; Write-Host "  $en"; Write-Host "  $tr" }
function Fail($en, $tr) {
  Say "ERROR: $en" "HATA: $tr"
  Write-Host ""
  Read-Host "  Press Enter to close / Kapatmak icin Enter'a basin" | Out-Null
  exit 1
}

# Files from the internet carry a "downloaded" mark; remove it so helpers are not blocked.
Get-ChildItem -Path $App -Recurse -File -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue

$Platform = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { "win-arm64" } else { "win-x64" }
$NodeDir = Join-Path $Runtime "node"
$NodeExe = Join-Path $NodeDir "node.exe"

# 1. Node.js: use the one already on this computer if it is version 20 or newer,
#    otherwise download a private copy into the app folder (nothing is installed system-wide).
function Test-Node($exe) {
  if (-not $exe -or -not (Test-Path $exe)) { return $false }
  if (-not (Test-Path (Join-Path (Split-Path $exe) "npm.cmd"))) { return $false }
  try { $major = [int](& $exe -p "process.versions.node.split('.')[0]" 2>$null) } catch { return $false }
  return $major -ge 20
}
$Candidates = @(
  (Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source),
  (Join-Path $env:ProgramFiles "nodejs\node.exe"),
  $(if ($env:NVM_SYMLINK) { Join-Path $env:NVM_SYMLINK "node.exe" }),
  $NodeExe
)
$NodeBin = $Candidates | Where-Object { Test-Node $_ } | Select-Object -First 1

if (-not $NodeBin) {
  Say "Downloading Node.js (one time, about 30 MB)..." "Node.js indiriliyor (bir kerelik, yaklasik 30 MB)..."
  New-Item -ItemType Directory -Force -Path $Runtime | Out-Null
  $Base = "https://nodejs.org/dist/latest-v$NodeMajor.x"
  try { $Sums = (Invoke-WebRequest -UseBasicParsing "$Base/SHASUMS256.txt").Content }
  catch { Fail "Cannot reach nodejs.org. Check the internet connection and start again." "nodejs.org'a ulasilamiyor. Internet baglantisini kontrol edip yeniden baslatin." }
  $Line = ($Sums -split "`n") | Where-Object { $_ -match " node-v[0-9.]+-$Platform\.zip$" } | Select-Object -First 1
  if (-not $Line) { Fail "No Node.js download found for $Platform." "$Platform icin Node.js bulunamadi." }
  $Sha, $File = ($Line.Trim() -split "\s+")
  $Zip = Join-Path $Runtime $File
  try { Invoke-WebRequest -UseBasicParsing "$Base/$File" -OutFile $Zip }
  catch { Fail "Download interrupted. Start again to continue." "Indirme yarida kaldi. Devam etmek icin yeniden baslatin." }
  if ((Get-FileHash $Zip -Algorithm SHA256).Hash.ToLower() -ne $Sha.ToLower()) {
    Remove-Item $Zip -Force
    Fail "The download is damaged. Start again." "Indirilen dosya bozuk. Yeniden baslatin."
  }
  if (Test-Path $NodeDir) { Remove-Item $NodeDir -Recurse -Force }
  Expand-Archive -Path $Zip -DestinationPath $Runtime -Force
  Rename-Item (Join-Path $Runtime ($File -replace "\.zip$", "")) "node"
  Remove-Item $Zip -Force
  $NodeBin = $NodeExe
}
$env:Path = "$(Split-Path $NodeBin);$env:Path"
Say "Using Node.js $(& $NodeBin --version) ($NodeBin)" "Node.js $(& $NodeBin --version) kullaniliyor ($NodeBin)"

# 2. Components (re-installed only when package-lock.json changes, e.g. after an update).
$LockHash = (Get-FileHash (Join-Path $App "package-lock.json") -Algorithm SHA256).Hash
$Marker = Join-Path $App "node_modules\.subanimo-installed"
if (-not (Test-Path $Marker) -or ((Get-Content $Marker -Raw) -ne $LockHash)) {
  Say "Installing components (one time, a few minutes)..." "Bilesenler kuruluyor (bir kerelik, birkac dakika)..."
  # npm ci wipes node_modules; keep the downloaded Chrome (node_modules\.remotion, ~170 MB) across updates.
  $ChromeDir = Join-Path $App "node_modules\.remotion"
  $ChromeKeep = Join-Path $Runtime "remotion-cache"
  if (Test-Path $ChromeDir) {
    New-Item -ItemType Directory -Force -Path $Runtime | Out-Null
    if (Test-Path $ChromeKeep) { Remove-Item $ChromeKeep -Recurse -Force }
    Move-Item $ChromeDir $ChromeKeep
  }
  if (Test-Path (Join-Path $App "dist\render.js")) {
    & npm.cmd ci --omit=dev --no-audit --no-fund
  } else {
    # Source checkout (git clone): also build the app.
    & npm.cmd ci --no-audit --no-fund
    if ($LASTEXITCODE -eq 0) { & npm.cmd run build }
  }
  $InstallStatus = $LASTEXITCODE
  if (Test-Path $ChromeKeep) {
    New-Item -ItemType Directory -Force -Path (Join-Path $App "node_modules") | Out-Null
    if (Test-Path $ChromeDir) { Remove-Item $ChromeDir -Recurse -Force }
    Move-Item $ChromeKeep $ChromeDir
  }
  if ($InstallStatus -ne 0) {
    Fail "Installation failed. Check the internet connection and start again. If it keeps failing, move the Subanimo folder to a short path like C:\Subanimo." "Kurulum basarisiz. Internet baglantisini kontrol edip yeniden baslatin. Tekrar olursa Subanimo klasorunu C:\Subanimo gibi kisa bir yere tasiyin."
  }
  Set-Content -Path $Marker -Value $LockHash -NoNewline
}

# 3. Fonts and emoji for offline rendering (skips files that are already there).
& $NodeBin scripts\fetch-assets.js

# 4. Start the app; it opens in the browser.
Say "Starting Subanimo... Keep this window open while you use it." "Subanimo baslatiliyor... Kullanirken bu pencereyi acik tutun."
& $NodeBin dist\render.js app
if ($LASTEXITCODE -ne 0) { Fail "Subanimo stopped unexpectedly." "Subanimo beklenmedik sekilde durdu." }
