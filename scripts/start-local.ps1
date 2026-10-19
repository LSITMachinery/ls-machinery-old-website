$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $siteRoot

function Test-LocalPage([string]$Address) {
  try { return (Invoke-WebRequest -Uri $Address -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200 }
  catch { return $false }
}
function Test-DockerReady {
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    & docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
  } finally { $ErrorActionPreference = $previousPreference }
}

if (-not (Test-LocalPage 'http://127.0.0.1:8011/')) {
  $env:PORT = '8011'
  Start-Process -FilePath (Get-Command node -ErrorAction Stop).Source -ArgumentList 'preview-server.cjs' -WorkingDirectory $siteRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $siteRoot 'preview-local.log') -RedirectStandardError (Join-Path $siteRoot 'preview-local-error.log')
}

if (-not (Test-LocalPage 'http://127.0.0.1:8412/health')) {
  if (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerReady = Test-DockerReady
    if (-not $dockerReady) {
      $desktop = @(
        (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe'),
        'C:\Program Files\Docker\Docker\Docker Desktop.exe'
      ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
      if ($desktop) { Start-Process -FilePath $desktop -WindowStyle Hidden }
      Write-Host 'Waiting for Docker to start the CMS database...'
      for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Seconds 2
        $dockerReady = Test-DockerReady
        if ($dockerReady) { break }
      }
    }
    if ($dockerReady) {
      & docker compose --env-file .env -p ls-website-cms up --build -d
      if ($LASTEXITCODE -ne 0) { Write-Warning 'CMS startup failed. Read the Docker message above; existing data was preserved.' }
    } else { Write-Warning 'Docker is unavailable. The website and audit can still be reviewed.' }
  } else { Write-Warning 'Docker is required for the CMS. The website and audit can still be reviewed.' }
}

Write-Host 'Website: http://127.0.0.1:8011/home/'
Write-Host 'CMS: http://127.0.0.1:8011/cms/'
Write-Host 'Video audit: http://127.0.0.1:8011/review/videos/'
Write-Host 'Refresh the browser after editing website files. Keep Docker running while using the CMS.'
Start-Process 'http://127.0.0.1:8011/home/'
