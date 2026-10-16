param(
  [string]$ProjectName = 'ls-website-cms'
)

$ErrorActionPreference = 'Stop'
if ($ProjectName -notmatch '^[a-z0-9][a-z0-9_-]{1,48}$') { throw 'ProjectName must use lowercase letters, numbers, hyphens or underscores.' }
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$envFile = Join-Path $root '.env'
if (-not (Test-Path -LiteralPath $envFile)) { throw 'Create the local .env file by following cms/README.md.' }
$adminLine = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^CMS_DB_ADMIN_PASSWORD=' } | Select-Object -First 1
if (-not $adminLine) { throw 'CMS_DB_ADMIN_PASSWORD is missing from the local .env file.' }
$adminPassword = $adminLine.Substring('CMS_DB_ADMIN_PASSWORD='.Length)
$databaseName = 'ls_cms_' + [guid]::NewGuid().ToString('N') + '_test'
$containerTest = '/tmp/postgres.integration.test.mjs'
$composeArgs = @('--env-file','.env','-p',$ProjectName)
$databaseCreated = $false

Push-Location $root
try {
  $createDatabase = "PGPASSWORD=`"`$POSTGRES_PASSWORD`" psql -w --username `"`$POSTGRES_USER`" --dbname postgres --command `"CREATE DATABASE $databaseName OWNER postgres`""
  & docker compose @composeArgs exec -T database sh -lc $createDatabase
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the disposable PostgreSQL integration database.' }
  $databaseCreated = $true

  $source = Get-Content -Raw -LiteralPath (Join-Path $root 'cms/test/postgres.integration.test.mjs')
  $source = $source.Replace("'../src/security.mjs'", "'/opt/ls-cms/src/security.mjs'").Replace("'../src/repository.mjs'", "'/opt/ls-cms/src/repository.mjs'").Replace("const {Pool}=await import('pg');", "const pgModule=await import('/opt/ls-cms/node_modules/pg/lib/index.js'); const Pool=pgModule.default.Pool;")
  $source | docker compose @composeArgs exec -T cms sh -c "cat > $containerTest"
  if ($LASTEXITCODE -ne 0) { throw 'Could not stage the temporary integration test in the CMS container.' }

  $connectionString = "postgres://postgres:$adminPassword@database:5432/$databaseName"
  & docker compose @composeArgs exec -T -e "CMS_TEST_DATABASE_URL=$connectionString" cms node --test $containerTest
  if ($LASTEXITCODE -ne 0) { throw 'The PostgreSQL CMS workflow integration test failed.' }
} finally {
  if ($databaseCreated) {
    $dropDatabase = "PGPASSWORD=`"`$POSTGRES_PASSWORD`" dropdb --if-exists --username `"`$POSTGRES_USER`" $databaseName"
    & docker compose @composeArgs exec -T database sh -lc $dropDatabase *> $null
  }
  & docker compose @composeArgs exec -T cms rm -f $containerTest *> $null
  Pop-Location
}

Write-Output 'PostgreSQL workflow test passed; its temporary database was removed.'
