/**
 * Secure admin authentication helpers.
 *
 * The admin password is hashed with SHA-256 before being stored in localStorage,
 * so a compromised browser never exposes the raw credential.
 *
 * Rate limiting is enforced at the component level — failed attempts are
 * tracked in memory and locked out for a short window.
 */
// Temporary comment to trigger TypeScript server restart

const PASSWORD_KEY = 'vindeshi_admin_password';
const SESSION_KEY = 'vindeshi_admin_session';
const RATE_LIMIT_KEY = 'vindeshi_admin_rate_limit';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

type RateLimitState = {
  attempts: number;
  lockedUntil: number | null;
};

type SessionState = {
  expiresAt: number;
};

/* ── Hashing ────────────────────────────────────────────────── */

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ── Password storage ───────────────────────────────────────── */

export async function getStoredPasswordHash(): Promise<string | null> {
  try {
    return localStorage.getItem(PASSWORD_KEY);
  } catch {
    return null;
  }
}

export async function setStoredPasswordHash(password: string): Promise<void> {
  const hash = await hashPassword(password);
  try {
    localStorage.setItem(PASSWORD_KEY, hash);
  } catch {
    // storage unavailable
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  const stored = await getStoredPasswordHash();
  if (!stored) return false;
  const hash = await hashPassword(password);
  return hash === stored;
}

/* ── Rate limiting ──────────────────────────────────────────── */

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
    return { locked: true, remaining: 0 };
  }
  writeRateLimit({ attempts, lockedUntil: null });
  return { locked: false, remaining: MAX_ATTEMPTS - attempts };
}

export function resetRateLimit(): void {
  writeRateLimit({ attempts: 0, lockedUntil: null });
}

export function getLockoutRemainingMs(): number {
  const state = readRateLimit();
  if (!state.lockedUntil) return 0;
  return Math.max(0, state.lockedUntil - Date.now());
}

/* ── Session management ──────────────────────────────────────── */

export function createSession(): void {
  const session: SessionState = {
    expiresAt: Date.now() + SESSION_TIMEOUT_MS,
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function isSessionValid(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw) as SessionState;
    return Date.now() < session.expiresAt;
  } catch {
    return false;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function getSessionRemainingMs(): number {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return 0;
    const session = JSON.parse(raw) as SessionState;
    return Math.max(0, session.expiresAt - Date.now());
  } catch {
    return 0;
  }
}

/* ── Migration helper ────────────────────────────────────────── */

/**
 * If the old plain-text password exists, migrate it to a hashed version.
 * This should be called once on app load.
 */
export async function migratePlainTextPassword(): Promise<void> {
  const OLD_KEY = 'vindeshi_admin_password';
  try {
    const raw = localStorage.getItem(OLD_KEY);
    if (raw && raw !== 'admin123') {
      // Old plain-text password exists — hash and store it
      const hash = await hashPassword(raw);
      localStorage.setItem(PASSWORD_KEY, hash);
      // Remove the old plain-text key
      localStorage.removeItem(OLD_KEY);
    }
  } catch {
    // ignore
  }
}