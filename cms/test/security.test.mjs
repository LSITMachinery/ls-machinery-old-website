import test from 'node:test';
import assert from 'node:assert/strict';
import { constantTimeTextEqual, csrfFor, expiredSessionCookie, hashPassword, isLoopbackAddress, passwordError, sessionCookie, verifyPassword } from '../src/security.mjs';
import { validateContent, validateSlugRoute } from '../src/schema.mjs';

test('passwords use salted scrypt and never verify as clear text', async () => {
  const first = await hashPassword('Ls-Strong-Passphrase-2026');
  const second = await hashPassword('Ls-Strong-Passphrase-2026');
  assert.match(first, /^scrypt\$32768\$8\$1\$/);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('Ls-Strong-Passphrase-2026', first), true);
  assert.equal(await verifyPassword('wrong passphrase', first), false);
});

test('session cookies are protected and CSRF values bind to the session secret', () => {
  const token='opaque-token'; const secret='x'.repeat(48);
  assert.match(sessionCookie(token), /HttpOnly; SameSite=Strict/);
  assert.match(sessionCookie(token,{secure:true}), /; Secure$/);
  assert.match(expiredSessionCookie(), /Max-Age=0/);
  assert.equal(csrfFor(token,secret),csrfFor(token,secret));
  assert.notEqual(csrfFor(token,secret),csrfFor('another-token',secret));
  assert.equal(constantTimeTextEqual('token','token'),true);
  assert.equal(constantTimeTextEqual('token','wrong'),false);
});

test('bootstrap loopback gate recognizes local and rejects forwarded or public addresses', () => {
  assert.equal(isLoopbackAddress('127.0.0.1'),true);
  assert.equal(isLoopbackAddress('::1'),true);
  assert.equal(isLoopbackAddress('::ffff:127.0.0.1'),true);
  assert.equal(isLoopbackAddress('10.0.0.2'),false);
  assert.equal(isLoopbackAddress('192.168.1.4'),false);
});

test('content schema requires English, Simplified Chinese and Malaysian Malay in one record', () => {
  const value={translations:{en:{title:'Mixer'},zh:{title:'搅拌机'},ms:{title:'Pengadun'}},data:{modelCode:'LS-1'},mediaIds:[],internalNotes:'check value',sourceEvidence:[]};
  assert.equal(validateContent('machine',value).error,undefined);
  assert.match(validateContent('machine',{translations:{en:{},zh:{}}}).error,/translations.ms/);
  assert.match(validateContent('machine',{...value,ar:{title:'no'}}).error,/Unsupported fields/);
  assert.match(validateSlugRoute('../escape','/machine/x/'),/slug/);
});

test('password policy rejects short and low-complexity passphrases', () => {
  assert.ok(passwordError('short'));
  assert.ok(passwordError('lowercase only passphrase'));
  assert.equal(passwordError('Good-Strong-Passphrase-2026'),null);
});
