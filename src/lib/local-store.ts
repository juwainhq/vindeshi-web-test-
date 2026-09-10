import type { Product } from './types';

const PRODUCTS_KEY = 'vindeshi_products';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — products just won't persist
  }
}

/* ── Product inventory (localStorage override) ──────────────── */

/** Products saved from the admin Inventory tab. While set, these
 *  replace the database products everywhere on the storefront. */
export function getLocalProducts(): Product[] | null {
  return read<Product[] | null>(PRODUCTS_KEY, null);
}

export function saveLocalProducts(products: Product[]): void {
  write(PRODUCTS_KEY, products);
}

export function clearLocalProducts(): void {
  try {
    localStorage.removeItem(PRODUCTS_KEY);
  } catch {
    // ignore
  }
}

/* ── Re-export admin auth functions ───────────────────────────── */
/** @see {@link ./admin-auth} */
export {
  setAdminPassword,
  verifyAdminPassword,
  isLockedOut,
  recordFailedAttempt,
  resetRateLimit,
  getLockoutRemainingMs,
  isLoggedIn,
  setLoggedIn,
  resetAdminSession,
} from './admin-auth';
