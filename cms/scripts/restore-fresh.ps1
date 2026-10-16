param(
  [Parameter(Mandatory = $true)][string]$DatabaseBackup,
  [Parameter(Mandatory = $true)][string]$MediaBackup,
  [string]$ProjectName = 'ls-cms-restore',
  [ValidateRange(1024, 65535)][int]$HostPort = 8413
)

$ErrorActionPreference = 'Stop'
if ($ProjectName -notmatch '^[a-z0-9][a-z0-9_-]{1,48}$') { throw 'ProjectName must use lowercase letters, numbers, hyphens or underscores.' }
$databasePath = (Resolve-Path -LiteralPath $DatabaseBackup).Path
$mediaPath = (Resolve-Path -LiteralPath $MediaBackup).Path
if ((Get-Item -LiteralPath $databasePath).Length -lt 100 -or (Get-Item -LiteralPath $mediaPath).Length -lt 20) { throw 'Backup files are unexpectedly small.' }
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$databaseVolume = "${ProjectName}_ls_cms_database"
$mediaVolume = "${ProjectName}_ls_cms_media"
foreach ($volumeName in @($databaseVolume, $mediaVolume)) {
  & docker volume inspect $volumeName *> $null
  if ($LASTEXITCODE -eq 0) { throw "Refusing to overwrite existing volume '$volumeName'. Choose a new ProjectName." }
}

$oldPort = $env:CMS_HOST_PORT
$env:CMS_HOST_PORT = [string]$HostPort
$dumpName = 'restore-content.dump'
$mediaName = 'restore-media.tar.gz'
$composeArgs = @('-p',$ProjectName,'-f',(Join-Path $root 'docker-compose.yml'))
$dumpRestoreCommand = 'PGPASSWORD="$CMS_DB_PASSWORD" pg_restore --no-owner --no-acl -h 127.0.0.1 -U "$CMS_DB_USER" -d "$CMS_DB_NAME" "/tmp/' + $dumpName + '"'
$mediaRestoreCommand = "tar -xzf /data/$mediaName -C /data; rm -f /data/$mediaName"
$verifyCountCommand = 'PGPASSWORD="$CMS_DB_PASSWORD" psql -h 127.0.0.1 -U "$CMS_DB_USER" -d "$CMS_DB_NAME" -Atc "SELECT count(*) FROM cms_content_items"'

Push-Location $root
try {
  & docker compose @composeArgs up -d database
  if ($LASTEXITCODE -ne 0) { throw 'Could not start the fresh restore database.' }
  $databaseReady = $false
  for ($attempt = 0; $attempt -lt 24; $attempt++) {
    & docker compose @composeArgs exec -T database sh -lc 'PGPASSWORD="$CMS_DB_PASSWORD" psql -w -h 127.0.0.1 -U "$CMS_DB_USER" -d "$CMS_DB_NAME" -Atc "SELECT 1"' *> $null
    if ($LASTEXITCODE -eq 0) { $databaseReady = $true; break }
    Start-Sleep -Seconds 5
  }
  if (-not $databaseReady) { throw 'The fresh application database did not become ready.' }
  & docker compose @composeArgs cp $databasePath "database:/tmp/$dumpName"
  if ($LASTEXITCODE -ne 0) { throw 'Could not copy the database backup into the fresh database container.' }
  & docker compose @composeArgs exec -T database sh -lc $dumpRestoreCommand
  if ($LASTEXITCODE -ne 0) { throw 'Database restore failed.' }
  & docker compose @composeArgs up --build -d cms
  if ($LASTEXITCODE -ne 0) { throw 'Could not start the fresh CMS after restoring its database.' }
  $healthy = $false
  for ($attempt = 0; $attempt -lt 24; $attempt++) {
    try {
      $health = Invoke-RestMethod -Uri "http://127.0.0.1:$HostPort/health" -TimeoutSec 2
      if ($health.status -eq 'ok') { $healthy = $true; break }
    } catch { Start-Sleep -Seconds 5 }
  }
  if (-not $healthy) { throw 'The restored CMS did not become healthy.' }
  & docker compose @composeArgs cp $mediaPath "cms:/data/$mediaName"
  if ($LASTEXITCODE -ne 0) { throw 'Could not copy the media backup into the fresh project.' }
  & docker compose @composeArgs exec -T cms sh -lc $mediaRestoreCommand
  if ($LASTEXITCODE -ne 0) { throw 'Media restore failed.' }
  $count = & docker compose @composeArgs exec -T database sh -lc $verifyCountCommand
  if ($LASTEXITCODE -ne 0) { throw 'Could not verify restored content records.' }
  $mediaCountCommand = 'find /data/media -maxdepth 1 -type f | wc -l'
  $mediaCount = & docker compose @composeArgs exec -T cms sh -lc $mediaCountCommand
  if ($LASTEXITCODE -ne 0) { throw 'Could not verify restored media files.' }
  Write-Output "Fresh instance is healthy at http://127.0.0.1:$HostPort/cms/"
  Write-Output "Restored content records: $($count.Trim())"
  Write-Output "Restored media files: $($mediaCount.Trim())"
  Write-Output "The isolated instance uses project '$ProjectName'. Remove it only after reviewing its contents."
} finally {
  Pop-Location
  if ($null -eq $oldPort) { Remove-Item Env:CMS_HOST_PORT -ErrorAction SilentlyContinue } else { $env:CMS_HOST_PORT = $oldPort }
}
