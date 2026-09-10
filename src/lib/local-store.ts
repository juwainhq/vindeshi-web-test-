import type { Product } from './types';

export type OrderStatus = 'Pending' | 'Completed' | 'Cancelled';

export type OrderItem = {
  id: string;
  name: string;
  color: string;
  price: string;
  image_url: string;
  qty: number;
};

export type Order = {
  id: string;
  createdAt: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: string;
  /** TrxID for bKash / Rocket payments, when provided. */
  transactionId?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
};

const ORDERS_KEY = 'vindeshi_orders';
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
    // storage unavailable — orders/products just won't persist
  }
}

/* ── Orders ─────────────────────────────────────────────────── */

export function getOrders(): Order[] {
  return read<Order[]>(ORDERS_KEY, []);
}

export function saveOrders(orders: Order[]): void {
  write(ORDERS_KEY, orders);
}

export function addOrder(order: Order): void {
  saveOrders([order, ...getOrders()]);
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