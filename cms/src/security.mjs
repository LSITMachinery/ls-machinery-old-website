import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { scrypt as scryptCallback } from 'node:crypto';

const scrypt = promisify(scryptCallback);
const SCRYPT_N = 1 << 15;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAXMEM = 64 * 1024 * 1024;

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: MAXMEM });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`;
}

export async function verifyPassword(password, encoded) {
  if (typeof encoded !== 'string') return false;
  const [name, nText, rText, pText, saltText, hashText, ...extra] = encoded.split('$');
  const n = Number(nText); const r = Number(rText); const p = Number(pText);
  if (extra.length || name !== 'scrypt' || !Number.isInteger(n) || n < 16384 || n > 131072 || !Number.isInteger(r) || r < 1 || r > 16 || !Number.isInteger(p) || p < 1 || p > 4 || !saltText || !hashText) return false;
  try {
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(hashText, 'base64url');
    const actual = Buffer.from(await scrypt(password, salt, expected.length, { N: n, r, p, maxmem: MAXMEM }));
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function passwordError(password) {
  if (typeof password !== 'string' || password.length < 14) return 'Use a passphrase with at least 14 characters.';
  if (password.length > 256) return 'Passphrase is too long.';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return 'Use at least one lowercase letter, one uppercase letter and one number.';
  return null;
}

// Temporary credentials work only in an explicitly enabled local preview.
// Replacing the stored password hash removes the temporary-password restriction.
export function localPreviewAccountAllowed(account, { enabled = false, secureCookies = false, host = '' } = {}) {
  const temporary = account?.localPreviewOnly || Boolean(account?.local_preview_password_hash && account.local_preview_password_hash === account.password_hash);
  if (!temporary) return true;
  if (!enabled || secureCookies) return false;
  try { return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(`http://${host}`).hostname); }
  catch { return false; }
}

export function sessionHash(rawToken) {
  return sha256(rawToken);
}

export function csrfFor(rawToken, secret) {
  return createHmac('sha256', secret).update(`cms-csrf:${rawToken}`).digest('base64url');
}

export function constantTimeTextEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseCookies(header = '') {
  const result = Object.create(null);
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 1) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name)) result[name] = value;
  }
  return result;
}

export function sessionCookie(token, { secure = false, maxAge = 8 * 60 * 60 } = {}) {
  return `ls_cms_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

export function expiredSessionCookie({ secure = false } = {}) {
  return `ls_cms_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
}

export function isLoopbackAddress(address = '') {
  const normalized = address.toLowerCase().replace(/^::ffff:/, '');
  return normalized === '::1' || normalized === '127.0.0.1' || /^127\./.test(normalized);
}

export function requestOriginAllowed(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const host = request.headers.host;
    return parsed.host === host && ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
