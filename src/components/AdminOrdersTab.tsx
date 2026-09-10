import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  Cloud,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
  Smartphone,
  XCircle,
} from 'lucide-react';
import {
  fetchOrders,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from '../lib/orders';

const STATUSES: OrderStatus[] = ['Pending', 'Completed', 'Cancelled'];

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_ICONS: Record<OrderStatus, typeof Clock> = {
  Pending: Clock,
  Completed: CheckCircle2,
  Cancelled: XCircle,
};

const toNumber = (price: string) => Number(price.replace(/[^0-9.]/g, '')) || 0;
const formatTk = (amount: number) => `Tk ${amount.toLocaleString('en-US')}`;

type LoadState = 'loading' | 'ready' | 'error';

export function AdminOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorText, setErrorText] = useState('');
  const [tableMissing, setTableMissing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null); // refresh hiccup — list stays
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | OrderStatus>('All');
  const [search, setSearch] = useState('');
  const [statusBusy, setStatusBusy] = useState<string | null>(null);

  /* ── Cloud fetching (on demand only — no auto-polling) ── */

  // Lets the error handler ask "do we already have orders?" without
  // depending on the orders state (which would re-create `refresh`
  // after every fetch and re-trigger the effect).
  const ordersCountRef = useRef(0);
  useEffect(() => {
    ordersCountRef.current = orders.length;
  }, [orders]);

  const refresh = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const rows = await fetchOrders();
      setOrders(rows);
      setLoadState('ready');
      setSyncError(null);
      setLastSyncedAt(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isTableMissing =
        message.includes('PGRST205') || message.includes('does not exist');
      if (ordersCountRef.current > 0 && !isTableMissing) {
        // transient failure — keep showing the orders we already have
        setSyncError(`Couldn't refresh orders: ${message}`);
      } else {
        setLoadState('error');
        setErrorText(message);
        setTableMissing(isTableMissing);
      }
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, []);

  // Fetch the orders table ONCE when this tab mounts. `refresh` is a
  // stable callback (no state dependencies), so this effect never
  // re-runs on state updates — no loop, no interval, no auto-polling.
  // New orders arrive on demand via the Refresh orders button.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  /* ── Status updates (direct database writes) ── */

  const setStatus = async (order: Order, status: OrderStatus) => {
    if (order.status === status) return;

    // Update optimistically, then persist to the database
    setOrders((current) =>
      current.map((o) => (o.id === order.id ? { ...o, status } : o))
    );
    setStatusBusy(order.id);
    try {
      await updateOrderStatus(order.id, status);
      setSyncError(null);
    } catch (err) {
      setSyncError(
        `Could not update this order: ${
          err instanceof Error ? err.message : 'unknown error'
        }`
      );
      void refresh(); // revert to the database's version
    } finally {
      setStatusBusy(null);
    }
  };

  /* ── Derived list ── */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = filter === 'All' || order.status === filter;
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.phone.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, filter, search]);

  const revenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  /* ── Gates ── */

  if (loadState === 'loading' && orders.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[#a05a39]" size={28} />
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto text-red-500" size={30} />
        <p className="mt-3 font-serif text-xl">
          {tableMissing ? 'Orders table not set up yet' : "Couldn't load cloud orders"}
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-black/60">
          {tableMissing
            ? 'The Supabase "orders" table is missing. Run the SQL script from step 1 of SETUP.md in your Supabase SQL editor, then try again.'
            : errorText}
        </p>
        <button
          onClick={() => void refresh(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39]"
        >
          <RefreshCw size={13} /> Try again
        </button>
      </div>
    );
  }

  /* ── Orders dashboard ── */

  return (
    <div className="space-y-5">
      {/* Status strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
          <Cloud size={12} /> Cloud database
        </span>
        <p className="text-xs text-black/50">
          Every order placed from any phone or computer lands in the Supabase `orders`
          table{lastSyncedAt && <> · synced {lastSyncedAt.toLocaleTimeString('en-GB')}</>} —
          press <span className="font-semibold text-[#171717]">Refresh orders</span> to pull
          the latest.
        </p>
        <div className="ml-auto flex items-center gap-2">
          {refreshing && <Loader2 size={13} className="animate-spin text-black/40" />}
          <button
            onClick={() => void refresh(true)}
            disabled={refreshing}
            title="Fetch the latest orders from the cloud database now"
            className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh orders
          </button>
        </div>
      </div>

      {syncError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
          {syncError}
        </p>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Orders</p>
          <p className="mt-2 font-serif text-3xl">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Pending</p>
          <p className="mt-2 font-serif text-3xl text-amber-600">
            {orders.filter((o) => o.status === 'Pending').length}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Revenue</p>
          <p className="mt-2 font-serif text-3xl text-emerald-700">{formatTk(revenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-black/15 bg-white px-3 py-2">
          <Search size={14} className="text-black/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, name, phone…"
            className="w-48 text-xs outline-none"
          />
        </div>
        {(['All', ...STATUSES] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition ${
              filter === status
                ? 'border-[#a05a39] bg-[#a05a39] text-white'
                : 'border-black/15 bg-white text-black/50 hover:border-black/30'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Order list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 bg-white/60 px-6 py-14 text-center">
          <ShoppingBag size={26} className="mx-auto text-black/25" />
          <p className="mt-3 font-serif text-xl">No orders yet</p>
          <p className="mt-1 text-xs text-black/45">
            Orders placed at checkout — from any device — appear here after you press{' '}
            <span className="font-semibold">Refresh orders</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const StatusIcon = STATUS_ICONS[order.status];
            const isOpen = expanded === order.id;
            return (
              <div key={order.id} className="overflow-hidden rounded-xl border border-black/10 bg-white">
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="flex w-full flex-wrap items-center gap-4 px-5 py-4 text-left transition hover:bg-black/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`rounded border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[order.status]}`}>
                      <StatusIcon size={11} className="mr-1 inline" />
                      {order.status}
                    </span>
                    <span className="font-mono text-xs font-semibold text-black/60">{order.id}</span>
                  </div>
                  <div className="ml-auto flex flex-wrap items-center gap-6 text-xs">
                    <span className="font-semibold">{order.customerName}</span>
                    <span className="text-black/45">{order.phone}</span>
                    <span className="font-semibold">{formatTk(order.total)}</span>
                    <span className="text-black/40">
                      {new Date(order.createdAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-black/10 bg-[#fafaf8] px-5 py-5">
                    <div className="grid gap-6 sm:grid-cols-2">
                      {/* Customer details */}
                      <div>
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
                          Customer
                        </p>
                        <dl className="space-y-2 text-xs">
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-black/45">Name</dt>
                            <dd className="font-semibold">{order.customerName}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-black/45">Phone</dt>
                            <dd className="font-semibold">{order.phone}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-black/45">Address</dt>
                            <dd className="flex-1">{order.address}</dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-black/45">Payment</dt>
                            <dd className="flex items-center gap-1.5">
                              {order.paymentMethod === 'Cash on Delivery' ? (
                                <Banknote size={12} />
                              ) : (
                                <Smartphone size={12} />
                              )}
                              {order.paymentMethod}
                            </dd>
                          </div>
                          {order.bkashNumber && (
                            <div className="flex gap-2">
                              <dt className="w-20 shrink-0 text-black/45">
                                {order.paymentMethod === 'Rocket' ? 'Rocket no.' : 'bKash no.'}
                              </dt>
                              <dd className="font-semibold">{order.bkashNumber}</dd>
                            </div>
                          )}
                          {order.transactionId && (
                            <div className="flex gap-2">
                              <dt className="w-20 shrink-0 text-black/45">TrxID</dt>
                              <dd className="font-mono font-semibold">{order.transactionId}</dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      {/* Items */}
                      <div>
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
                          Items ({order.items.reduce((sum, item) => sum + item.qty, 0)})
                        </p>
                        <ul className="space-y-3">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex items-center gap-3">
                              <div className="h-12 w-10 shrink-0 overflow-hidden rounded bg-[#e9e9e5]">
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold">{item.name}</p>
                                <p className="text-[10px] text-black/45">
                                  {item.color} · ×{item.qty}
                                </p>
                              </div>
                              <p className="text-xs font-semibold">
                                {formatTk(toNumber(item.price) * item.qty)}
                              </p>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 space-y-1 border-t border-black/10 pt-3 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>{formatTk(order.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status control */}
                    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-black/10 pt-4">
                      <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
                        Set status
                      </span>
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          onClick={() => void setStatus(order, status)}
                          disabled={statusBusy === order.id}
                          className={`rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition disabled:opacity-50 ${
                            order.status === status
                              ? 'border-[#a05a39] bg-[#a05a39] text-white'
                              : 'border-black/15 bg-white text-black/55 hover:border-black/30'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                      {statusBusy === order.id && (
                        <Loader2 size={14} className="animate-spin text-black/40" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
