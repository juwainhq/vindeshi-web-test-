import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  Copy,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
  Smartphone,
  Timer,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import {
  fetchOrders,
  getOrdersBlobId,
  isOrdersBlobBakedIn,
  isRateLimitError,
  migrateLegacyOrders,
  unlinkOrdersStore,
  updateOrderStatus,
} from '../lib/orders';
import {
  getOrders,
  saveOrders,
  type Order,
  type OrderStatus,
} from '../lib/local-store';
import { OrdersSetupPanel } from './OrdersSetupPanel';

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
  const [blobId, setBlobId] = useState<string | null>(() => getOrdersBlobId());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorText, setErrorText] = useState('');
  const [syncError, setSyncError] = useState<string | null>(null); // refresh hiccup — list stays
  const [rateLimited, setRateLimited] = useState(false); // last refresh hit a 429
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const [localOrders, setLocalOrders] = useState<Order[]>(getOrders());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | OrderStatus>('All');
  const [search, setSearch] = useState('');
  const [statusBusy, setStatusBusy] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Skips refresh results while a status write is in flight so optimistic
  // updates aren't visually reverted mid-request.
  const writeInFlight = useRef(false);
  const ordersCountRef = useRef(0);
  useEffect(() => {
    ordersCountRef.current = orders.length;
  }, [orders]);

  /* ── Cloud fetching (on demand only) ── */

  const refresh = useCallback(async (quiet = true) => {
    if (writeInFlight.current) return;
    if (!quiet) setRefreshing(true);
    try {
      const rows = await fetchOrders();
      setOrders(rows);
      setLoadState('ready');
      setRateLimited(false);
      setSyncError(null);
      setLastSyncedAt(new Date());
    } catch (err) {
      if (isRateLimitError(err)) {
        // Too many requests in a short window — friendly note, no crash
        setRateLimited(true);
        const message = 'Rate limit reached — please wait 30 seconds and click Refresh.';
        if (ordersCountRef.current > 0) {
          setSyncError(null); // the dedicated rate-limit banner below shows this
        } else {
          setLoadState('error');
          setErrorText(message);
        }
      } else {
        setRateLimited(false);
        const message = err instanceof Error ? err.message : String(err);
        if (ordersCountRef.current > 0) {
          // transient failure — keep showing the orders we already have
          setSyncError(`Couldn't refresh orders: ${message}`);
        } else {
          setLoadState('error');
          setErrorText(message);
        }
      }
    } finally {
      if (!quiet) setRefreshing(false);
    }
  }, []);

  // Fetch the shared store ONCE when the tab opens (and again only if
  // the linked store itself changes). No interval, no auto-polling —
  // the Refresh orders button pulls new orders on demand.
  useEffect(() => {
    if (!blobId) return;
    void refresh(false);
  }, [blobId, refresh]);

  /* ── Status updates ── */

  const localOnly = useMemo(
    () => localOrders.filter((local) => !orders.some((cloud) => cloud.id === local.id)),
    [localOrders, orders]
  );

  const isLocalOnly = (order: Order) => localOnly.some((o) => o.id === order.id);

  const setStatus = async (order: Order, status: OrderStatus) => {
    if (order.status === status) return;

    // Orders saved on this device (offline fallback) — update locally
    if (isLocalOnly(order)) {
      const next = getOrders().map((o) => (o.id === order.id ? { ...o, status } : o));
      saveOrders(next);
      setLocalOrders(next);
      return;
    }

    // Cloud order — update optimistically, then persist + hard refresh
    writeInFlight.current = true;
    setOrders((current) =>
      current.map((o) => (o.id === order.id ? { ...o, status } : o))
    );
    setStatusBusy(order.id);
    let failure: string | null = null;
    try {
      await updateOrderStatus(order.id, status);
    } catch (err) {
      failure = `Could not update ${order.id}: ${
        err instanceof Error ? err.message : 'unknown error'
      }`;
    } finally {
      setStatusBusy(null);
      writeInFlight.current = false;
    }
    if (failure) setSyncError(failure);
    await refresh(false);
  };

  /* ── Legacy order upload (localStorage → cloud) ── */

  const uploadLegacy = async () => {
    setUploading(true);
    setUploadMessage(null);
    try {
      const { uploaded, failed } = await migrateLegacyOrders();
      setUploadMessage(
        uploaded === 0 && failed === 0
          ? 'Nothing to upload.'
          : failed > 0
            ? `Uploaded ${uploaded}. ${failed} couldn't be uploaded — they stay on this device to retry.`
            : `Uploaded ${uploaded} order${uploaded === 1 ? '' : 's'} to the cloud.`
      );
      setLocalOrders(getOrders());
      await refresh(false);
    } catch {
      setUploadMessage('Upload failed — check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  /* ── Combined list: cloud first, then device-only rows ── */

  const allOrders = useMemo(() => [...orders, ...localOnly], [orders, localOnly]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allOrders.filter((order) => {
      const matchesStatus = filter === 'All' || order.status === filter;
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.phone.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [allOrders, filter, search]);

  const revenue = allOrders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const copyStoreId = async () => {
    if (!blobId) return;
    try {
      await navigator.clipboard.writeText(blobId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // clipboard unavailable — copy manually from the docs
    }
  };

  /* ── Gates ── */

  if (!blobId) {
    return (
      <OrdersSetupPanel
        onLinked={() => {
          setBlobId(getOrdersBlobId());
          setLoadState('loading');
        }}
      />
    );
  }

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
        <p className="mt-3 font-serif text-xl">Couldn't load cloud orders</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-black/60">{errorText}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => void refresh(false)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39]"
          >
            <RefreshCw size={13} /> Try again
          </button>
          {!isOrdersBlobBakedIn() && (
            <button
              onClick={() => {
                unlinkOrdersStore();
                setBlobId(null);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-black/55 transition hover:border-[#a05a39] hover:text-[#a05a39]"
            >
              Choose another store
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── Orders dashboard ── */

  const shortId =
    blobId.length > 14 ? `${blobId.slice(0, 8)}…${blobId.slice(-4)}` : blobId;

  return (
    <div className="space-y-5">
      {/* Status strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
          <Cloud size={12} /> Cloud synced
        </span>
        <p className="text-xs text-black/50">
          Shared cloud store{' '}
          <span className="font-mono font-semibold text-[#171717]">{shortId}</span>
          {lastSyncedAt && <> · synced {lastSyncedAt.toLocaleTimeString('en-GB')}</>} — press{' '}
          <span className="font-semibold text-[#171717]">Refresh orders</span> to pull orders
          placed from any device.
        </p>
        <div className="ml-auto flex items-center gap-2">
          {refreshing && <Loader2 size={13} className="animate-spin text-black/40" />}

          <button
            onClick={() => void refresh(false)}
            disabled={refreshing}
            title="Fetch the latest orders from the cloud store now"
            className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh orders
          </button>
          <button
            onClick={() => void copyStoreId()}
            title="Copy the shared store ID"
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-black/55 transition hover:border-[#a05a39] hover:text-[#a05a39]"
          >
            {copiedId ? <Check size={13} /> : <Copy size={13} />} {copiedId ? 'Copied' : 'Copy ID'}
          </button>
        </div>
      </div>

      {/* Hint until the store ID is baked into the build */}
      {!isOrdersBlobBakedIn() && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-800">
          This browser is linked via its saved store ID. To make <span className="font-bold">every</span>{' '}
          visitor's checkout save to the shared store, paste the ID into{' '}
          <code className="font-mono">ORDERS_BLOB_ID</code> at the top of{' '}
          <code className="font-mono">src/lib/orders.ts</code> and redeploy the app.
        </p>
      )}

      {/* Rate-limit notice — cloud asked us to slow down, nothing is lost */}
      {rateLimited && orders.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <Timer size={15} className="shrink-0 text-amber-600" />
          <p className="text-xs font-semibold text-amber-800">
            Rate limit reached — please wait 30 seconds and click Refresh.
          </p>
          <button
            onClick={() => void refresh(false)}
            disabled={refreshing}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#171717] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      )}

      {syncError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
          {syncError}
        </p>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Orders</p>
          <p className="mt-2 font-serif text-3xl">{allOrders.length}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Pending</p>
          <p className="mt-2 font-serif text-3xl text-amber-600">
            {allOrders.filter((o) => o.status === 'Pending').length}
          </p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Revenue</p>
          <p className="mt-2 font-serif text-3xl text-emerald-700">{formatTk(revenue)}</p>
        </div>
      </div>

      {/* Legacy order upload */}
      {localOnly.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-800">
            <span className="font-bold">{localOnly.length}</span> order
            {localOnly.length === 1 ? ' is' : 's are'} saved only on this device (placed while
            the cloud was unreachable). Upload them so they show everywhere.
          </p>
          <button
            onClick={() => void uploadLegacy()}
            disabled={uploading}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#a05a39] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#8d4c2f] disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <UploadCloud size={13} /> Upload to cloud
              </>
            )}
          </button>
        </div>
      )}
      {uploadMessage && (
        <p className="text-xs font-semibold text-[#a05a39]">{uploadMessage}</p>
      )}

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
            Orders placed at checkout — from any device — appear after you press{' '}
            <span className="font-semibold">Refresh orders</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const StatusIcon = STATUS_ICONS[order.status];
            const isOpen = expanded === order.id;
            const deviceOnly = isLocalOnly(order);
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
                    {deviceOnly && (
                      <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                        This device
                      </span>
                    )}
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
                            <dt className="w-20 shrink-0 text-black/45">Email</dt>
                            <dd>{order.email}</dd>
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
                          <div className="flex justify-between text-black/55">
                            <span>Subtotal</span>
                            <span>{formatTk(order.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-black/55">
                            <span>Delivery</span>
                            <span>{order.deliveryFee === 0 ? 'Free' : formatTk(order.deliveryFee)}</span>
                          </div>
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
