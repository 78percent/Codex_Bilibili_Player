# Start the current source in an isolated development window. No build or tests.
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$runtimePath = Join-Path $projectRoot '.runtime/electron/electron.exe'
$vitePath = Join-Path $projectRoot 'node_modules/vite/bin/vite.js'
if (!(Test-Path -LiteralPath $runtimePath) -or !(Test-Path -LiteralPath $vitePath)) {
  throw 'Electron runtime or Vite is missing.'
}
$nodePath = (Get-Command node -ErrorAction Stop).Source
$logDirectory = Join-Path $projectRoot '.runtime/integration'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
$listen = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$listen.Start()
$devPort = $listen.LocalEndpoint.Port
$listen.Stop()
$viteProcess = Start-Process -FilePath $nodePath -ArgumentList @('"node_modules/vite/bin/vite.js"','--host','127.0.0.1','--port',"$devPort",'--strictPort') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory 'vite.out.log') -RedirectStandardError (Join-Path $logDirectory 'vite.err.log') -PassThru
try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    if ($viteProcess.HasExited) { throw 'Vite exited. See .runtime/integration/vite.err.log.' }
    try { $null = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$devPort" -TimeoutSec 1; $ready = $true; break } catch { Start-Sleep -Milliseconds 200 }
  }
  if (!$ready) { throw 'Vite did not become ready.' }
  $env:BILIBILI_DEV_URL = "http://127.0.0.1:$devPort"
  Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
  $electronProcess = Start-Process -FilePath $runtimePath -ArgumentList '.' -WorkingDirectory $projectRoot -WindowStyle Normal -RedirectStandardOutput (Join-Path $logDirectory 'electron.out.log') -RedirectStandardError (Join-Path $logDirectory 'electron.err.log') -PassThru
  @{ vite = $viteProcess.Id; electron = $electronProcess.Id; port = $devPort } | ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $logDirectory 'processes.json')
  $electronProcess.WaitForExit()
  if ($electronProcess.ExitCode -ne 0) {
    Get-Content -LiteralPath (Join-Path $logDirectory 'electron.err.log') -ErrorAction SilentlyContinue
    throw "Electron exited with code $($electronProcess.ExitCode)."
  }
} finally {
  if (!$viteProcess.HasExited) { Stop-Process -Id $viteProcess.Id }
}
