param(
  [string]$Destination = (Join-Path (Split-Path $PSScriptRoot -Parent) 'backups'),
  [string]$ProjectName = 'ls-website-cms'
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$destinationPath = [System.IO.Path]::GetFullPath($Destination)
New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
$composeArgs = @('-p',$ProjectName)
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dumpName = "ls-cms-$stamp.dump"
$mediaName = "ls-cms-$stamp-media.tar.gz"
$dumpCommand = 'PGPASSWORD="$CMS_DB_PASSWORD" pg_dump -h 127.0.0.1 -U "$CMS_DB_USER" -d "$CMS_DB_NAME" -Fc --no-owner --no-acl --exclude-table=cms_sessions --exclude-table=cms_login_limits -f "/tmp/' + $dumpName + '"'
$mediaCommand = "tar -czf /data/backup-staging/$mediaName -C /data media"

Push-Location $root
try {
  & docker compose @composeArgs exec -T database sh -lc $dumpCommand
  if ($LASTEXITCODE -ne 0) { throw 'Database backup failed.' }
  & docker compose @composeArgs exec -T cms sh -lc $mediaCommand
  if ($LASTEXITCODE -ne 0) { throw 'Media backup failed.' }
  & docker compose @composeArgs cp "database:/tmp/$dumpName" (Join-Path $destinationPath $dumpName)
  if ($LASTEXITCODE -ne 0) { throw 'Could not copy the database backup to the destination.' }
  & docker compose @composeArgs cp "cms:/data/backup-staging/$mediaName" (Join-Path $destinationPath $mediaName)
  if ($LASTEXITCODE -ne 0) { throw 'Could not copy the media backup to the destination.' }
  & docker compose @composeArgs exec -T database rm -f "/tmp/$dumpName"
  & docker compose @composeArgs exec -T cms rm -f "/data/backup-staging/$mediaName"
  $dumpBytes = (Get-Item -LiteralPath (Join-Path $destinationPath $dumpName)).Length
  $mediaBytes = (Get-Item -LiteralPath (Join-Path $destinationPath $mediaName)).Length
  if ($dumpBytes -lt 100 -or $mediaBytes -lt 20) { throw 'A backup file is unexpectedly small. Check the database and media library.' }
  Write-Output "Backup created: $destinationPath"
  Write-Output "Database: $dumpName ($dumpBytes bytes)"
  Write-Output "Media: $mediaName ($mediaBytes bytes)"
} finally {
  try { & docker compose @composeArgs exec -T database rm -f "/tmp/$dumpName" *> $null } catch { }
  try { & docker compose @composeArgs exec -T cms rm -f "/data/backup-staging/$mediaName" *> $null } catch { }
  Pop-Location
}
