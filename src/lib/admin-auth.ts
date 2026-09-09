/**
 * Admin authentication helpers.
 *
 * - The admin password is hashed (SHA-256 of the lowercase form, so
 *   matching is case-insensitive) before being stored in localStorage.
 * - When no custom password has been set, the default "admin123" is
 *   accepted (in any letter case).
 * - Login state is a simple localStorage flag with NO expiry — you stay
 *   logged in on this browser until you manually log out.
 * - resetAdminSession() is an emergency escape hatch that restores the
 *   default password and clears any lockout, so you can never get stuck.
 */

const PASSWORD_HASH_KEY = 'vindeshi_admin_password_hash';
const LEGACY_PASSWORD_KEY = 'vindeshi_admin_password'; // plain-text, older version
const LOGGED_IN_KEY = 'vindeshi_admin_logged_in';
const RATE_LIMIT_KEY = 'vindeshi_admin_rate_limit';

/** Default password (case-insensitive) until a custom one is set. */
export const DEFAULT_PASSWORD = 'admin123';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

/* ── Hashing ────────────────────────────────────────────────── */

async function hashPassword(password: string): Promise<string> {
  const lower = password.toLowerCase();
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(lower)
      );
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // fall through to the fallback below
  }
  // Fallback for non-secure contexts (e.g. http previews) where
  // crypto.subtle is unavailable — a simple deterministic hash.
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < lower.length; i++) {
    h1 = Math.imul(h1 ^ lower.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + lower.charCodeAt(i), 31 + i) >>> 0;
  }
  return `fb-${h1.toString(16)}-${h2.toString(16)}`;
}

/* ── Password ────────────────────────────────────────────────── */

/** Store a custom admin password (hashed, matched case-insensitively). */
export async function setAdminPassword(password: string): Promise<void> {
  try {
    localStorage.setItem(PASSWORD_HASH_KEY, await hashPassword(password));
  } catch {
    // storage unavailable
  }
}

/** Read the stored hash, ignoring corrupt values from older versions. */
async function getStoredPasswordHash(): Promise<string | null> {
  try {
    const stored = localStorage.getItem(PASSWORD_HASH_KEY);
    // An earlier version stored the hash JSON-quoted ("…"). Such values
    // can never match a raw hash, so treat them as unset and clear them.
    if (stored && !stored.startsWith('"')) return stored;
    if (stored) localStorage.removeItem(PASSWORD_HASH_KEY);
  } catch {
    // ignore
  }
  return null;
}

/** Verify a password (case-insensitive) against the stored hash. */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const stored = await getStoredPasswordHash();
  const expected = stored ?? (await hashPassword(DEFAULT_PASSWORD));
  return (await hashPassword(password)) === expected;
}

/** Emergency reset: restores the default password and clears any
 *  lockout or saved login, so you can never get stuck outside. */
export function resetAdminSession(): void {
  try {
    localStorage.removeItem(PASSWORD_HASH_KEY);
    localStorage.removeItem(LEGACY_PASSWORD_KEY);
    localStorage.removeItem(RATE_LIMIT_KEY);
    localStorage.removeItem(LOGGED_IN_KEY);
  } catch {
    // ignore
  }
}

/* ── Login state (no expiry — until you log out) ─────────────── */

export function isLoggedIn(): boolean {
  try {
    return localStorage.getItem(LOGGED_IN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setLoggedIn(loggedIn: boolean): void {
  try {
    if (loggedIn) {
      localStorage.setItem(LOGGED_IN_KEY, 'true');
    } else {
      localStorage.removeItem(LOGGED_IN_KEY);
    }
  } catch {
    // ignore
  }
}

/* ── Rate limiting (always resettable via resetAdminSession) ─── */

type RateLimitState = { attempts: number; lockedUntil: number | null };

function readRateLimit(): RateLimitState {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (raw) return JSON.parse(raw) as RateLimitState;
  } catch {
    // ignore
  }
  return { attempts: 0, lockedUntil: null };
}

function writeRateLimit(state: RateLimitState): void {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function isLockedOut(): boolean {
  const state = readRateLimit();
  if (!state.lockedUntil) return false;
  if (Date.now() >= state.lockedUntil) {
    writeRateLimit({ attempts: 0, lockedUntil: null });
    return false;
  }
  return true;
}

export function recordFailedAttempt(): { locked: boolean; remaining: number } {
  const state = readRateLimit();
  const attempts = state.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_MS;
    writeRateLimit({ attempts, lockedUntil });
    return { locked: true, remaining: LOCKOUT_MS };
  }
  writeRateLimit({ attempts, lockedUntil: null });
  return { locked: false, remaining: 0 };
}

export function resetRateLimit(): void {
  writeRateLimit({ attempts: 0, lockedUntil: null });
}

export function getLockoutRemainingMs(): number {
  const state = readRateLimit();
  if (!state.lockedUntil) return 0;
  return Math.max(0, state.lockedUntil - Date.now());
}
