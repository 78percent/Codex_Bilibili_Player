# Start the current source in an isolated development window. No build or tests.
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$runtimePath = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'node_modules/electron/dist/electron.exe'))
$vitePath = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'node_modules/vite/bin/vite.js'))
if (!(Test-Path -LiteralPath $runtimePath) -or !(Test-Path -LiteralPath $vitePath)) {
  throw 'Electron runtime or Vite is missing.'
}
$nodePath = (Get-Command node -ErrorAction Stop).Source
$logDirectory = Join-Path $projectRoot '.runtime/integration'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
# Keep the same origin so Electron can restore local preferences and playback.
$devPort = 5173
$previousRunPath = Join-Path $logDirectory 'processes.json'
$previousRun = $null
if (Test-Path -LiteralPath $previousRunPath) {
  try {
    $previousRun = Get-Content -LiteralPath $previousRunPath -Raw | ConvertFrom-Json
    if ($previousRun.port -ge 1024 -and $previousRun.port -le 65535) { $devPort = [int]$previousRun.port }
  } catch { Write-Warning 'Could not read the previous development port; using 5173.' }
}

function Get-TrackedProcess($processId, $expectedPath, $startedAt) {
  if (!$processId) { return $null }
  $tracked = Get-Process -Id ([int]$processId) -ErrorAction SilentlyContinue
  if (!$tracked) { return $null }
  try {
    if ($tracked.Path -ne $expectedPath) { return $null }
    if ($startedAt -and $tracked.StartTime.ToUniversalTime().Ticks -ne ([datetime]$startedAt).ToUniversalTime().Ticks) { return $null }
  } catch { return $null }
  return $tracked
}

$env:BILIBILI_DEV_URL = "http://127.0.0.1:$devPort"
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
$previousElectron = Get-TrackedProcess $previousRun.electron $runtimePath $previousRun.electronStartedAt
if ($previousElectron) {
  # Electron's single-instance handler restores and focuses the existing window.
  $activation = Start-Process -FilePath $runtimePath -ArgumentList '.' -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
  $activation.WaitForExit()
  return
}

$previousVite = Get-TrackedProcess $previousRun.vite $nodePath $previousRun.viteStartedAt
if ($previousVite) {
  $command = (Get-CimInstance Win32_Process -Filter "ProcessId = $($previousVite.Id)").CommandLine
  $viteArgument = '(?:"' + [regex]::Escape($vitePath) + '"|"?node_modules[\\/]vite[\\/]bin[\\/]vite\.js"?)'
  # Legacy records used a relative Vite path. Check the saved PID, executable,
  # command and port before cleaning up; never stop an unrelated port owner.
  if ($command -match $viteArgument -and $command -match "(?:^|\s)--port\s+$devPort(?:\s|$)") {
    Write-Host "Cleaning up the previous development server on port $devPort..."
    $previousVite.Kill()
    if (!$previousVite.WaitForExit(5000)) { throw 'The previous development server did not exit.' }
  }
}
$portReservation = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $devPort)
$portReservation.Server.ExclusiveAddressUse = $true
try { $portReservation.Start() }
catch { throw "Development port $devPort is unavailable. No matching leftover server could be stopped. Details: $($_.Exception.Message)" }
finally { $portReservation.Stop() }
$viteProcess = Start-Process -FilePath $nodePath -ArgumentList @(('"' + $vitePath + '"'),'--host','127.0.0.1','--port',"$devPort",'--strictPort') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory 'vite.out.log') -RedirectStandardError (Join-Path $logDirectory 'vite.err.log') -PassThru
try {
  $runRecord = @{ vite = $viteProcess.Id; viteStartedAt = $viteProcess.StartTime.ToUniversalTime().ToString('o'); electron = $null; port = $devPort }
  $runRecord | ConvertTo-Json | Set-Content -Encoding utf8 $previousRunPath
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    if ($viteProcess.HasExited) { throw "Vite exited. Close the previous development window if port $devPort is still occupied. See .runtime/integration/vite.err.log." }
    try { $null = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$devPort" -TimeoutSec 1; $ready = $true; break } catch { Start-Sleep -Milliseconds 200 }
  }
  if (!$ready) { throw 'Vite did not become ready.' }
  $electronProcess = Start-Process -FilePath $runtimePath -ArgumentList '.' -WorkingDirectory $projectRoot -WindowStyle Normal -RedirectStandardOutput (Join-Path $logDirectory 'electron.out.log') -RedirectStandardError (Join-Path $logDirectory 'electron.err.log') -PassThru
  $runRecord.electron = $electronProcess.Id
  $runRecord.electronStartedAt = $electronProcess.StartTime.ToUniversalTime().ToString('o')
  $runRecord | ConvertTo-Json | Set-Content -Encoding utf8 $previousRunPath
  $electronProcess.WaitForExit()
  if ($electronProcess.ExitCode -ne 0) {
    Get-Content -LiteralPath (Join-Path $logDirectory 'electron.err.log') -ErrorAction SilentlyContinue
    throw "Electron exited with code $($electronProcess.ExitCode)."
  }
} finally {
  if (!$viteProcess.HasExited) { Stop-Process -Id $viteProcess.Id }
}
