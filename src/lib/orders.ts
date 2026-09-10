import { supabase } from './supabase';
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

/* ── Cloud rows ──────────────────────────────────────────────── */

/** An order row as stored in the Supabase `orders` table. */
export type CloudOrder = {
  id: string;
  created_at: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  payment_method: string;
  transaction_id: string | null;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
};

const ORDER_KEYS =
  'id, created_at, customer_name, email, phone, address, payment_method, transaction_id, items, subtotal, delivery_fee, total, status';

/** Map a database row back to the app's Order shape. */
export function cloudOrderToOrder(row: CloudOrder): Order {
  return {
    id: row.id,
    createdAt: row.created_at,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    paymentMethod: row.payment_method,
    transactionId: row.transaction_id ?? undefined,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal) || 0,
    deliveryFee: Number(row.delivery_fee) || 0,
    total: Number(row.total) || 0,
    status: row.status,
  };
}

/* ── Cloud operations ────────────────────────────────────────── */

/** Save a new order to the cloud database (called from checkout).
 *  Works for anonymous visitors thanks to an INSERT-only RLS policy —
 *  see SUPABASE_SETUP.md for the table + policies SQL. */
export async function insertOrder(order: Order): Promise<void> {
  const { error } = await supabase.from('orders').insert({
    id: order.id,
    created_at: order.createdAt,
    customer_name: order.customerName,
    email: order.email,
    phone: order.phone,
    address: order.address,
    payment_method: order.paymentMethod,
    transaction_id: order.transactionId ?? null,
    items: order.items,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    total: order.total,
    status: order.status,
  });
  if (error) throw error;
}

/** Fetch all orders — requires a signed-in admin, because SELECT is
 *  restricted to authenticated users by row-level security. */
export async function fetchOrders(): Promise<CloudOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_KEYS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CloudOrder[];
}

/** Update an order's status (admin only). */
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
}

/** Subscribe to live order changes. Returns an unsubscribe function.
 *  Requires the realtime publication SQL from SUPABASE_SETUP.md. */
export function subscribeToOrders(onChange: () => void): () => void {
  const channel = supabase
    .channel('orders-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      () => onChange()
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** One-time upload of orders that were saved in this browser's
 *  localStorage (from before the cloud upgrade, or as an offline
 *  fallback). Orders already in the cloud are skipped; orders that
 *  fail to upload stay on this device to retry later. */
export async function migrateLegacyOrders(): Promise<{ uploaded: number; failed: number }> {
  const legacy = getOrders();
  if (legacy.length === 0) return { uploaded: 0, failed: 0 };

  const existing = new Set((await fetchOrders()).map((row) => row.id));
  const remaining: Order[] = [];
  let uploaded = 0;

  for (const order of legacy) {
    if (existing.has(order.id)) continue; // already in the cloud
    try {
      await insertOrder(order);
      uploaded++;
    } catch {
      remaining.push(order);
    }
  }

  // Keep only the orders that truly couldn't be uploaded
  saveOrders(remaining);
  return { uploaded, failed: remaining.length };
}
