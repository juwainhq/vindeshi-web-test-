import type { Product } from './types';
import {
  getOrders,
  saveOrders,
  type Order,
  type OrderItem,
  type OrderStatus,
} from './local-store';

/* ── Pricing (kept in sync with the checkout summary) ────────── */

const FREE_DELIVERY_THRESHOLD = 2000;
const DELIVERY_FEE = 80;

const toNumber = (price: string) => Number(price.replace(/[^0-9.]/g, '')) || 0;

/* ── Order builder ──────────────────────────────────────────── */

/** Assemble a complete order from the cart and checkout details. */
export function buildOrder(
  cart: { product: Product; qty: number }[],
  customer: {
    customerName: string;
    email: string;
    phone: string;
    address: string;
    paymentMethod: string;
    transactionId?: string;
  }
): Order {
  const items: OrderItem[] = cart.map((line) => ({
    id: line.product.id,
    name: line.product.name,
    color: line.product.color,
    price: line.product.price,
    image_url: line.product.images[0],
    qty: line.qty,
  }));
  const subtotal = cart.reduce(
    (sum, line) => sum + toNumber(line.product.price) * line.qty,
    0
  );
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  return {
    id: `VND-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    ...customer,
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    status: 'Pending',
  };
}

/* ── Shared cloud store (jsonblob.com) ──────────────────────── */

/**
 * Every order — from any device — lives in ONE shared JSON document
 * ("blob") on jsonblob.com: a free, keyless JSON storage API with no
 * accounts and no API keys. The blob ID is the only "credential":
 * anyone who has it can read or write the document, so treat it as
 * semi-private.
 *
 * One-time setup (see SETUP.md):
 *  1. /admin → Orders → "Create cloud store" (or create a blob at
 *     jsonblob.com containing {"orders": []}).
 *  2. Paste the ID into ORDERS_BLOB_ID below and rebuild/redeploy —
 *     every visitor's checkout then saves to the same shared store.
 * Admin browsers can also link the ID locally (no rebuild needed)
 * from the same setup panel.
 */
const ORDERS_BLOB_ID = '01a08b1a-ca5b-75ab-9e81-a8d507e1db42'; // your shared cloud store

/** Blob ID saved on this browser by the admin setup panel. */
const BLOB_ID_KEY = 'vindeshi_orders_blob_id';

const API_BASE = 'https://jsonblob.com/api/jsonBlob';
const REQUEST_TIMEOUT_MS = 12000;

function readLocalBlobId(): string | null {
  try {
    const id = localStorage.getItem(BLOB_ID_KEY);
    return id && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
}

function saveLocalBlobId(id: string): void {
  try {
    localStorage.setItem(BLOB_ID_KEY, id);
  } catch {
    // storage unavailable — this browser just can't save the link
  }
}

/** Last non-empty path segment of a URL (the blob ID in jsonblob URLs). */
function lastSegment(value: string | null): string | null {
  if (!value) return null;
  const segment = value.split('?')[0].split('/').filter(Boolean).pop();
  return segment && segment.trim() ? segment.trim() : null;
}

/** Aborts a request that hangs, so checkouts never stall forever. */
function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    signal: timeoutSignal(REQUEST_TIMEOUT_MS),
  });
}

/** The shared store's blob ID: this browser's saved link wins, else the
 *  ID baked into the build (so customers' devices find the store). */
export function getOrdersBlobId(): string | null {
  return readLocalBlobId() ?? (ORDERS_BLOB_ID.trim() || null);
}

/** True when the store ID is baked into the build — meaning every
 *  device, including customer checkouts, reaches the shared store. */
export function isOrdersBlobBakedIn(): boolean {
  return ORDERS_BLOB_ID.trim() !== '';
}

/** Create the shared orders document and link this browser to it.
 *  Returns the new blob ID. */
export async function createOrdersStore(): Promise<string> {
  const res = await request('', {
    method: 'POST',
    body: JSON.stringify({ orders: [] }),
  });
  if (!res.ok) throw new Error(`jsonblob responded with ${res.status}.`);
  const id = res.headers.get('X-jsonblob') ?? lastSegment(res.headers.get('Location'));
  if (!id) {
    throw new Error(
      "Couldn't read the new store ID from the response. Create the blob manually at jsonblob.com (paste {\"orders\": []}) and link it below instead."
    );
  }
  saveLocalBlobId(id);
  return id;
}

/** Link this browser to an existing store by ID or jsonblob URL.
 *  Validates that the blob exists before saving. */
export async function linkOrdersStore(input: string): Promise<string> {
  const id = lastSegment(input);
  if (!id) throw new Error('Paste the store ID or its jsonblob.com URL.');
  const res = await request(`/${encodeURIComponent(id)}`, { method: 'GET' });
  if (res.status === 404) throw new Error('No cloud store exists with that ID.');
  if (!res.ok) throw new Error(`jsonblob responded with ${res.status}.`);
  saveLocalBlobId(id);
  return id;
}

/** Forget this browser's saved store link. The baked-in constant, if
 *  any, still applies. */
export function unlinkOrdersStore(): void {
  try {
    localStorage.removeItem(BLOB_ID_KEY);
  } catch {
    // ignore
  }
}

/* ── Defensive parsing (the store is publicly writable) ──────── */

const asString = (v: unknown) => (typeof v === 'string' ? v : '');
const asNumber = (v: unknown) => Number(v) || 0;

function normalizeItem(raw: unknown): OrderItem {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    id: asString(r.id),
    name: asString(r.name) || 'Item',
    color: asString(r.color),
    price: asString(r.price) || '0',
    image_url: asString(r.image_url),
    qty: asNumber(r.qty) || 1,
  };
}

function normalizeOrder(raw: unknown): Order | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || r.id === '') return null;
  const status: OrderStatus =
    r.status === 'Completed' || r.status === 'Cancelled'
      ? (r.status as OrderStatus)
      : 'Pending';
  return {
    id: r.id,
    createdAt: asString(r.createdAt) || new Date(0).toISOString(),
    customerName: asString(r.customerName),
    email: asString(r.email),
    phone: asString(r.phone),
    address: asString(r.address),
    paymentMethod: asString(r.paymentMethod) || 'Cash on Delivery',
    transactionId: asString(r.transactionId) || undefined,
    items: Array.isArray(r.items) ? r.items.map(normalizeItem) : [],
    subtotal: asNumber(r.subtotal),
    deliveryFee: asNumber(r.deliveryFee),
    total: asNumber(r.total) || asNumber(r.subtotal),
    status,
  } satisfies Order;
}

/** Replace the whole shared document with the given order list. */
async function putOrders(orders: Order[]): Promise<void> {
  const id = getOrdersBlobId();
  if (!id) throw new Error('No cloud store configured yet.');
  const res = await request(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ orders }),
  });
  if (res.status === 404) throw new Error('The cloud store no longer exists (404).');
  if (!res.ok) throw new Error(`Cloud store write failed (${res.status}).`);
}

/* ── Cloud operations ────────────────────────────────────────── */

/** Fetch every order from the shared cloud store — checkouts from any
 *  device, newest first. Accepts both `{"orders":[…]}` and bare `[…]`
 *  document shapes. */
export async function fetchOrders(): Promise<Order[]> {
  const id = getOrdersBlobId();
  if (!id) throw new Error('No cloud store configured yet.');
  const res = await request(`/${encodeURIComponent(id)}`, { method: 'GET' });
  if (res.status === 404) {
    throw new Error(
      'The cloud store no longer exists (404) — link a new one from the admin Orders tab.'
    );
  }
  if (!res.ok) throw new Error(`Cloud store responded with ${res.status}.`);

  const data: unknown = await res.json();
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { orders?: unknown[] } | null)?.orders)
      ? (data as { orders: unknown[] }).orders
      : [];

  return list
    .map(normalizeOrder)
    .filter((o): o is Order => o !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Save a new order to the shared cloud store (called from checkout).
 *  Merges into the current list so orders placed elsewhere are kept. */
export async function insertOrder(order: Order): Promise<void> {
  const current = await fetchOrders();
  await putOrders([order, ...current.filter((o) => o.id !== order.id)]);
}

/** Update an order's status in the shared store (admin panel). */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const current = await fetchOrders();
  if (!current.some((o) => o.id === orderId)) {
    throw new Error('Order not found in the cloud store.');
  }
  await putOrders(current.map((o) => (o.id === orderId ? { ...o, status } : o)));
}

/** One-time upload of orders saved in this browser's localStorage
 *  (placed while offline, or before the store was linked). Orders
 *  already in the cloud are skipped; failures stay on this device. */
export async function migrateLegacyOrders(): Promise<{ uploaded: number; failed: number }> {
  const legacy = getOrders();
  if (legacy.length === 0) return { uploaded: 0, failed: 0 };

  const cloud = await fetchOrders();
  const existing = new Set(cloud.map((o) => o.id));
  const pending = legacy.filter((o) => !existing.has(o.id));
  if (pending.length === 0) {
    saveOrders([]); // everything is already in the cloud
    return { uploaded: 0, failed: 0 };
  }

  try {
    await putOrders([...pending, ...cloud]);
  } catch {
    return { uploaded: 0, failed: pending.length };
  }

  saveOrders([]); // uploaded — nothing needs to stay on this device
  return { uploaded: pending.length, failed: 0 };
}
