# LS Smart Machinery CMS foundation

This is a separate Node.js 24 service with PostgreSQL 18, local persistent media storage, staff sign-in and a revision workflow. Docker Compose exposes it at `http://127.0.0.1:8412/cms/`, bound to this computer only. The local website preview also proxies `/cms/` and `/api/cms/*` to that service. The public website and its preview server do not store staff accounts or draft content.

## Start locally with Docker Compose

Docker Desktop or another working Docker Engine is required. Create the ignored `.env` file in the project root with three fresh secrets before the first start. Do not regenerate it while the database volume is in use. Keep it on this computer; store the values in LS's approved password manager if they need to be shared or recovered:

```powershell
$env:CMS_DB_ADMIN_PASSWORD = node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('base64url'))"
$env:CMS_DB_PASSWORD = node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('base64url'))"
$env:CMS_SESSION_SECRET = node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('base64url'))"
@(
  "CMS_DB_ADMIN_PASSWORD=$env:CMS_DB_ADMIN_PASSWORD"
  "CMS_DB_PASSWORD=$env:CMS_DB_PASSWORD"
  "CMS_SESSION_SECRET=$env:CMS_SESSION_SECRET"
  'CMS_DB_USER=ls_cms'
  'CMS_DB_NAME=ls_cms'
  'CMS_HOST_PORT=8412'
  'CMS_SECURE_COOKIE=0'
) | Set-Content -LiteralPath .env -Encoding ascii
docker compose --env-file .env -p ls-website-cms up --build -d
```

Compose refuses to start if any secret is missing. The database bootstrap script creates a separate limited application role; the PostgreSQL superuser password is not used by the CMS. Compose and the backup/restore scripts use the same ignored `.env` file on each run. PostgreSQL does not reset its stored role password when the environment changes, so keep the file stable after creating the database. No LS password, account or production secret is included in this project.

Create the first CMS administrator from a local terminal:

```powershell
docker compose --env-file .env -p ls-website-cms exec cms npm run bootstrap-admin
```

The passphrase is entered without echo and is never supplied as a command argument. The service also exposes a first-admin HTTP bootstrap for direct local Node runs, but it accepts requests only when the socket peer is a loopback address. There is no public registration, seeded account or fixed password. After setup, sign in at `http://127.0.0.1:8412/cms/`.

The application runs SQL migrations when it starts. To apply them explicitly:

```powershell
docker compose --env-file .env -p ls-website-cms exec cms npm run migrate
```

The database volume stores PostgreSQL data. The media volume stores original uploaded files; the backup script briefly places its archive in a separate staging directory inside that volume and removes it after copying. The application container runs as an unprivileged user, has a read-only root filesystem and exposes no database port to the host.

## Staff permissions and publishing

| Role | Allowed work |
|---|---|
| Administrator | Create and change staff accounts and roles; read the audit log. |
| Editor | Create and save drafts, upload media and request review. |
| Technical reviewer | Approve or request changes on the current revision of a machine record. |
| Publisher | Confirm and publish an exact reviewed revision. |

Permissions are checked by the server on every action. A technical review is attached to one revision. Editing after review creates a new revision in draft state, which must go through review again. Publishing also requires the publisher to send the exact revision ID it is confirming. Concurrent edits return a conflict instead of silently replacing newer work. The audit log stores the actor, action, record/revision and time.

All authenticated staff can read private drafts and revision history. Publishing builds a complete locale-specific content bundle, alternate routes, metadata and a search index from the approved records. The CMS validates that bundle before saving it and switches one active-release pointer in the same database transaction as the record update. Public reads use only that active release. A failed build rolls back and leaves the previous release available. This local service currently publishes structured content through its API; the static website templates have not yet been connected to that API. The private preview also shows the record copy in a CMS preview frame rather than rendering the full public page template. Those integrations belong to the content-migration and cutover phase. Media files remain private unless the active release references them. Publishing blocks media with unconfirmed ownership or license; machine records also require an `exact` media match. Original uploads are stored by generated key, not by the user's filename.

Content uses fixed page types (`home`, `machine`, `food`, `segment`, `solution`, `service`, `faq`, `company`, `insight`, `career`, `contact`, and `partnership`). Each record keeps `translations.en`, `translations.zh` and `translations.ms` together. Type-specific data fields are defined in `src/schema.mjs`; machine records require a model code. `internalNotes` and `sourceEvidence` are saved with a revision for staff and reviewers and are excluded from public content responses. This is a fixed-record CMS, not an arbitrary page builder.

## Interfaces

- `POST /api/cms/auth/login`, `POST /api/cms/auth/logout`, `GET /api/cms/auth/me`
- `POST /api/cms/bootstrap` is available only to a loopback socket peer and only before the first account exists.
- `/api/cms/staff*` manages accounts and roles for administrators.
- `/api/cms/content*` stores private records, draft revisions and review actions.
- `/api/cms/preview/:id?revision=:revisionId` renders a private, no-index preview for a signed-in staff member.
- `/api/cms/media*` stores files and source, permission, alternative-text and subject-match metadata.
- `GET /api/content/published?route=/machine/example/` or `GET /api/content/published` returns published content only.
- `GET /api/content/published/search?locale=en|zh|ms` returns the active release's public search index for one language.
- `GET /api/content/media/:id` serves a media file only when a published revision refers to it.

Sessions use random opaque tokens with their SHA-256 hashes stored in PostgreSQL. Passwords use salted scrypt hashes. Cookie sessions are `HttpOnly` and `SameSite=Strict`; the server adds `Secure` when `CMS_SECURE_COOKIE=1` is configured behind HTTPS. Mutations require a session-bound CSRF header. Login attempts are limited per address and account key and tracked in PostgreSQL. Request bodies have size limits, uploaded content is checked against its declared media type, and responses receive no-index and browser security headers.

## Backup and restore

With Compose running, create both database and media backups:

```powershell
.\cms\scripts\backup.ps1
```

The script writes a PostgreSQL custom-format dump and a compressed media archive to `cms\backups` (or the destination path you provide). Login sessions and rate-limit counters are deliberately excluded. Keep both files together in LS's approved backup location.

Restore into a **new, isolated local Compose project**. This does not overwrite the current CMS volume. Use the same Compose secrets as the backup instance, and choose a project name and host port that are not already in use:

```powershell
.\cms\scripts\restore-fresh.ps1 `
  -DatabaseBackup .\cms\backups\ls-cms-YYYYMMDD-HHMMSS.dump `
  -MediaBackup .\cms\backups\ls-cms-YYYYMMDD-HHMMSS-media.tar.gz `
  -ProjectName ls-cms-restore-check `
  -HostPort 8413
```

The restore script refuses to reuse existing database or media volumes. It restores the database before starting the CMS, then restores media, waits for the service health endpoint and prints restored record and media counts. Inspect the restored CMS at `http://127.0.0.1:8413/cms/` before keeping or removing that test project. Restoring to the live instance, WordPress/cPanel, a NAS or a public host is outside this foundation and requires a separate management-approved procedure.

## Run the automated checks

The security and workflow checks use Node's built-in test runner and do not need PostgreSQL:

```powershell
node --test cms/test/*.test.mjs
```

They exercise password hashing, loopback bootstrap checks, session and CSRF handling, origin checks, role denial, private drafts, revision history, optimistic conflicts, review invalidation after edits, exact-revision publishing, publication search access and login throttling through the HTTP service. Publication-builder checks cover locale route creation, metadata, search indexing and invalid release rejection.

With the local Compose project running, the PostgreSQL workflow test creates a disposable database, checks migrations, revision publishing, atomic release activation and preservation of the previous public release when a build fails, then removes the test database:

```powershell
.\cms\scripts\test-postgres.ps1 -ProjectName ls-website-cms
```

The CMS container health check, PostgreSQL workflow, database restart persistence and fresh backup restore were verified in this workspace. The first administrator is intentionally not pre-created. This project does not set up public hosting, email delivery, CRM, a production proxy or LS staff credentials.
