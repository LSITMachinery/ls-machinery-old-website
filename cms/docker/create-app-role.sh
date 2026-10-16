#!/bin/sh
set -eu

PGPASSWORD="$POSTGRES_PASSWORD" psql --username "$POSTGRES_USER" --dbname postgres \
  --set=app_user="$CMS_DB_USER" \
  --set=app_database="$CMS_DB_NAME" \
  --set=app_password="$CMS_DB_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_password') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'app_database', :'app_user') \gexec
SQL
