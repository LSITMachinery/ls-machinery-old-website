import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { PgRepository } from './repository.mjs';
import { hashPassword, passwordError } from './security.mjs';
import { collectSiteBaseline } from './baseline-import.mjs';

async function promptSecret(label) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') throw new Error('Run first-admin setup from a local interactive terminal.');
  stdout.write(`${label}: `);
  stdin.setRawMode(true);
  stdin.setEncoding('utf8');
  stdin.resume();
  let value = '';
  try {
    return await new Promise((resolve, reject) => {
      const onData = (chunk) => {
        for (const character of chunk) {
          if (character === '\u0003') { cleanup(); reject(new Error('Setup cancelled.')); return; }
          if (character === '\r' || character === '\n') { cleanup(); stdout.write('\n'); resolve(value); return; }
          if (character === '\u007f' || character === '\b') { value = value.slice(0, -1); continue; }
          if (character >= ' ') value += character;
        }
      };
      const cleanup = () => stdin.off('data', onData);
      stdin.on('data', onData);
    });
  } finally {
    stdin.setRawMode(false);
  }
}

async function promptText(label) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try { return (await rl.question(`${label}: `)).trim(); }
  finally { rl.close(); }
}

async function connectRepository() {
  const { Pool } = await import('pg');
  const pool = new Pool({
    host: process.env.CMS_DB_HOST || '127.0.0.1',
    port: Number(process.env.CMS_DB_PORT || 5432),
    database: process.env.CMS_DB_NAME || 'ls_cms',
    user: process.env.CMS_DB_USER || 'ls_cms',
    password: process.env.CMS_DB_PASSWORD,
    connectionTimeoutMillis: 5000
  });
  return { pool, repository: new PgRepository(pool) };
}

export async function runCli(args = process.argv.slice(2)) {
  const command = args[0];
  if (!['migrate', 'bootstrap-admin', 'import-site-baseline'].includes(command)) {
    throw new Error('Use `node src/cli.mjs migrate`, `node src/cli.mjs bootstrap-admin`, or `node src/cli.mjs import-site-baseline`.');
  }
  const { pool, repository } = await connectRepository();
  try {
    if (command === 'migrate') {
      await repository.migrate();
      stdout.write('CMS database migrations are current.\n');
      return;
    }
    if (command === 'import-site-baseline') {
      await repository.migrate();
      const administrator = (await repository.listStaff()).find(account => account.role === 'admin' && !account.disabled);
      if (!administrator) throw new Error('Create the first administrator before importing the site baseline.');
      const records = await collectSiteBaseline();
      const result = await repository.seedBaselinePages(records, administrator.id);
      stdout.write(`Imported ${result.routeCount} existing routes and prepared ${result.pageCount} localized page records.\n`);
      return;
    }
    await repository.migrate();
    if (await repository.userCount()) throw new Error('The first administrator already exists. Use an admin account to manage staff.');
    const email = (await promptText('Administrator work email')).toLowerCase();
    const displayName = await promptText('Administrator name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !displayName || displayName.length > 120) {
      throw new Error('Enter a valid work email and a name of 1 to 120 characters.');
    }
    let password = await promptSecret('Administrator passphrase');
    let issue = passwordError(password);
    if (issue) throw new Error(issue);
    const confirmation = await promptSecret('Confirm passphrase');
    if (password !== confirmation) throw new Error('The passphrases do not match.');
    const user = await repository.bootstrapAdmin({ email, displayName, passwordHash: await hashPassword(password) });
    password = '';
    stdout.write(`First administrator created for ${user.email}. Sign in at /cms/.\n`);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  runCli().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
