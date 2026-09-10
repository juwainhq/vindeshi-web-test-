import { supabase } from './supabase';
import type { Product } from './types';

/* ── Pricing (kept in sync with the checkout summary) ────────── */

const FREE_DELIVERY_THRESHOLD = 2000;
const DELIVERY_FEE = 80;

const toNumber = (price: string) => Number(price.replace(/[^0-9.]/g, '')) || 0;

/* ── Order types ─────────────────────────────────────────────── */

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
  /** bKash / Rocket account number the payment was sent from. */
  bkashNumber?: string;
  /** TrxID for bKash / Rocket payments, when provided. */
  transactionId?: string;
  items: OrderItem[];
  /** The amount the customer pays (items + delivery). */
  total: number;
  status: OrderStatus;
};

/* ── Order builder ──────────────────────────────────────────── */

/** Assemble a complete order from the cart and checkout details.
 *  The id is a temporary display value — insertOrder returns the real
 *  database-assigned id once the row is saved. */
export function buildOrder(
  cart: { product: Product; qty: number }[],
  customer: {
    customerName: string;
    email: string;
    phone: string;
    address: string;
    paymentMethod: string;
    bkashNumber?: string;
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
    total: subtotal + deliveryFee,
    status: 'Pending',
  };
}

/* ── Defensive parsing (rows come from the network) ──────────── */

const asString = (v: unknown) => (typeof v === 'string' ? v : '');

function normalizeItem(raw: unknown): OrderItem {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    id: asString(r.id),
    name: asString(r.name) || 'Item',
    color: asString(r.color),
    price: asString(r.price) || '0',
    image_url: asString(r.image_url),
    qty: Number(r.qty) || 1,
  };
}

/** Map a database row to the app's Order shape. Extra columns are
 *  ignored; missing ones fall back to safe defaults. */
function rowToOrder(row: Record<string, unknown>): Order {
  const status =
    row.status === 'Completed' || row.status === 'Cancelled'
      ? (row.status as OrderStatus)
      : 'Pending';
  return {
    id: String(row.id ?? ''),
    createdAt: asString(row.created_at) || new Date(0).toISOString(),
    customerName: asString(row.customer_name),
    email: asString(row.email), // not stored by the current schema
    phone: asString(row.customer_phone),
    address: asString(row.customer_address),
    paymentMethod: asString(row.payment_method) || 'Cash on Delivery',
    bkashNumber: asString(row.bkash_number) || undefined,
    transactionId: asString(row.bkash_trxid) || undefined,
    items: Array.isArray(row.items) ? row.items.map(normalizeItem) : [],
    total: Number(row.total_price) || 0,
    status,
  };
}

/* ── Cloud operations (Supabase `orders` table) ───────────────── */

/** Insert a new order into the Supabase `orders` table — the exact
 *  columns: customer_name, customer_phone, customer_address,
 *  payment_method, bkash_number, bkash_trxid, items (JSON),
 *  total_price, status. `id` and `created_at` are assigned by the
 *  database. Returns the database-assigned id, or null if it couldn't
 *  be read back (the row is still saved). */
export async function insertOrder(order: Order): Promise<string | null> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_name: order.customerName,
      customer_phone: order.phone,
      customer_address: order.address,
      payment_method: order.paymentMethod,
      bkash_number: order.bkashNumber ?? null,
      bkash_trxid: order.transactionId ?? null,
      items: order.items,
      total_price: order.total,
      status: order.status,
    })
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return data ? String((data as { id: unknown }).id) : null;
}

/** Fetch all orders from the cloud database, newest first — every
 *  order placed from any device, in one list. */
export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(rowToOrder);
}

/** Update an order's status in the cloud database (admin panel). */
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
}
