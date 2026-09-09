import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CartItem } from '../lib/types';

const FREE_DELIVERY_THRESHOLD = 2000;

const toNumber = (price: string) => Number(price.replace(/[^0-9.]/g, '')) || 0;
const formatTk = (amount: number) => `Tk ${amount.toLocaleString('en-US')}`;

export function CartDrawer({
  open,
  items,
  onClose,
  onSetQty,
  onRemove,
}: {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onSetQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const navigate = useNavigate();

  const goCheckout = () => {
    onClose();
    navigate('/checkout');
  };
  const subtotal = items.reduce(
    (sum, item) => sum + toNumber(item.price) * item.qty,
    0
  );
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-[#f7f7f5] shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Shopping bag"
      >
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
          <h2 className="font-serif text-2xl tracking-tight">Your bag</h2>
          <button
            aria-label="Close bag"
            className="rounded-full p-2 transition hover:bg-black/5"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {items.length > 0 && (
          <div className="border-b border-black/10 px-6 py-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-black/60">
              {remaining > 0 ? (
                <>
                  Add <span className="text-[#a05a39]">{formatTk(remaining)}</span> more for free delivery
                </>
              ) : (
                <span className="text-[#a05a39]">You've unlocked free delivery</span>
              )}
            </p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-[#a05a39] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="rounded-full bg-black/5 p-5">
              <ShoppingBag size={26} strokeWidth={1.5} className="text-black/50" />
            </span>
            <p className="font-serif text-2xl">Your bag is empty</p>
            <p className="max-w-[240px] text-sm leading-6 text-black/50">
              Beautiful bags, made for every day, are one tap away.
            </p>
            <button
              className="mt-2 inline-flex items-center gap-2 border-b border-black pb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition hover:text-[#a05a39]"
              onClick={onClose}
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-black/10 overflow-y-auto px-6">
              {items.map((item) => (
                <li className="flex gap-4 py-5" key={item.id}>
                  <div className="h-24 w-20 shrink-0 overflow-hidden bg-[#e9e9e5]">
                    <img
                      className="h-full w-full object-cover object-[center_42%]"
                      src={item.image_url}
                      alt={item.name}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">{item.name}</h3>
                        <p className="mt-0.5 text-xs text-black/45">{item.color}</p>
                      </div>
                      <p className="whitespace-nowrap text-sm font-semibold">
                        {formatTk(toNumber(item.price) * item.qty)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-black/15">
                        <button
                          aria-label="Decrease quantity"
                          className="px-2.5 py-1.5 transition hover:text-[#a05a39] disabled:opacity-30"
                          disabled={item.qty <= 1}
                          onClick={() => onSetQty(item.id, item.qty - 1)}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="min-w-6 text-center text-xs font-semibold">{item.qty}</span>
                        <button
                          aria-label="Increase quantity"
                          className="px-2.5 py-1.5 transition hover:text-[#a05a39]"
                          onClick={() => onSetQty(item.id, item.qty + 1)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        aria-label={`Remove ${item.name}`}
                        className="rounded-full p-1.5 text-black/40 transition hover:bg-black/5 hover:text-black"
                        onClick={() => onRemove(item.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-black/10 px-6 py-5">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-black/60">Subtotal</span>
                <span className="font-semibold">{formatTk(subtotal)}</span>
              </div>
              <p className="mb-4 text-[10px] text-black/45">Delivery calculated at checkout.</p>
              <button
                className="inline-flex w-full items-center justify-center gap-2 bg-[#171717] py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#a05a39]"
                onClick={goCheckout}
              >
                Checkout · {formatTk(subtotal)}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
