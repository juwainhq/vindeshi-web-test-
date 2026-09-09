import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  Smartphone,
} from 'lucide-react';
import { useSiteContent } from '../lib/useSiteContent';
import { useCart } from '../lib/cart-context';
import type { Order } from '../lib/local-store';

const PAYMENT_METHODS = [
  { id: 'Cash on Delivery', label: 'Cash on Delivery', hint: 'Pay when your bag arrives', icon: Banknote },
  { id: 'Bkash', label: 'bKash', hint: 'Pay instantly from your bKash account', icon: Smartphone },
  { id: 'Rocket', label: 'Rocket', hint: 'Pay instantly from your Rocket account', icon: Smartphone },
];

const FREE_DELIVERY_THRESHOLD = 2000;
const DELIVERY_FEE = 80;

const toNumber = (price: string) => Number(price.replace(/[^0-9.]/g, '')) || 0;
const formatTk = (amount: number) => `Tk ${amount.toLocaleString('en-US')}`;

export function CheckoutPage() {
  const { content, loading } = useSiteContent();
  const { cart, clearCart, placeOrder } = useCart();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const settings = content?.settings ?? null;

  const subtotal = cart.reduce(
    (sum, line) => sum + toNumber(line.product.price) * line.qty,
    0
  );
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    // Small delay so the success screen feels intentional
    setTimeout(() => {
      const order = placeOrder({
        customerName,
        email,
        phone,
        address,
        paymentMethod,
      });
      setPlacedOrder(order);
      setSubmitting(false);
      window.scrollTo(0, 0);
    }, 600);
  };

  /* ── Order success screen ─────────────────────────────────── */
  if (placedOrder) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] text-[#171717]">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-5 py-16 text-center">
          <div className="animate-[pop_0.4s_ease-out] rounded-full bg-[#a05a39]/10 p-6">
            <CheckCircle2 className="text-[#a05a39]" size={52} strokeWidth={1.5} />
          </div>

          <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.28em] text-[#a05a39]">
            Thank you{placedOrder.customerName ? `, ${placedOrder.customerName.split(' ')[0]}` : ''}
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-[1] tracking-[-0.04em] sm:text-6xl">
            Order confirmed
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-black/60">
            Your order <span className="font-semibold text-[#171717]">{placedOrder.id}</span> is
            in. We've sent a confirmation to {placedOrder.email} and will reach out on{' '}
            {placedOrder.phone} to arrange delivery.
          </p>

          <div className="mt-10 w-full max-w-md space-y-4 rounded-2xl border border-black/10 bg-white p-6 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="text-black/50">Order number</span>
              <span className="font-semibold">{placedOrder.id}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-black/50">Payment</span>
              <span className="font-semibold">{placedOrder.paymentMethod}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-black/50">Delivery</span>
              <span className="font-semibold">
                {placedOrder.deliveryFee === 0 ? 'Free' : formatTk(placedOrder.deliveryFee)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-black/10 pt-4 text-sm">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{formatTk(placedOrder.total)}</span>
            </div>
          </div>

          <Link
            to="/"
            className="mt-10 inline-flex items-center gap-3 border-b border-[#171717] pb-2 text-[11px] font-bold uppercase tracking-[0.2em] transition hover:gap-5"
          >
            Continue shopping <ArrowRight size={15} />
          </Link>
        </main>
      </div>
    );
  }

  /* ── Empty cart guard ──────────────────────────────────────── */
  if (!loading && cart.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f7f5]">
        <p className="font-serif text-3xl">Your bag is empty</p>
        <p className="text-sm text-black/50">Add something beautiful before checking out.</p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-2 border-b border-black pb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition hover:text-[#a05a39]"
        >
          <ArrowLeft size={14} /> Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="bg-[#171717] px-5 py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-white sm:text-[11px]">
        {settings?.announcement ?? 'Vindeshi'}
      </div>

      <header className="border-b border-black/10 bg-[#f7f7f5]">
        <div className="mx-auto flex h-[76px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="text-center">
            <span className="block font-serif text-[26px] font-semibold leading-none tracking-[-0.08em]">
              {settings?.brand_name ?? 'VINDESHI'}
            </span>
            <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.42em] text-[#8c8c84]">
              {settings?.brand_tagline ?? 'Carry your everyday'}
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:text-[#a05a39]"
          >
            <ArrowLeft size={15} /> Back to shop
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1200px] gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
        {/* Customer form */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#a05a39]">
            Checkout
          </p>
          <h1 className="font-serif text-4xl tracking-[-0.04em] sm:text-5xl">
            Delivery details
          </h1>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-black/50">
                Full name
              </span>
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jane Rahman"
                className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#a05a39]"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-black/50">
                  Email
                </span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#a05a39]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-black/50">
                  Phone number
                </span>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#a05a39]"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-black/50">
                Delivery address
              </span>
              <textarea
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House, road, area, city"
                className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#a05a39]"
              />
            </label>

            <fieldset>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-black/50">
                Payment method
              </span>
              <div className="grid gap-3 sm:grid-cols-3">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-3 transition ${
                      paymentMethod === method.id
                        ? 'border-[#a05a39] bg-[#a05a39]/5'
                        : 'border-black/15 bg-white hover:border-black/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="accent-[#a05a39]"
                    />
                    <div>
                      <p className="text-xs font-bold">{method.label}</p>
                      <p className="mt-0.5 text-[10px] text-black/45">{method.hint}</p>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#171717] py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#a05a39] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Placing order…
                </>
              ) : (
                <>
                  <ShoppingBag size={15} /> Place order · {formatTk(total)}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order summary */}
        <aside className="h-fit rounded-2xl border border-black/10 bg-white p-6 lg:sticky lg:top-8">
          <h2 className="font-serif text-2xl tracking-tight">Order summary</h2>
          <ul className="mt-5 space-y-4">
            {cart.map((line) => (
              <li className="flex items-center gap-4" key={line.product.id}>
                <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-[#e9e9e5]">
                  <img
                    className="h-full w-full object-cover object-[center_42%]"
                    src={line.product.images[0]}
                    alt={line.product.name}
                  />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#171717] px-1 text-[10px] font-bold text-white">
                    {line.qty}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{line.product.name}</p>
                  <p className="text-xs text-black/45">{line.product.color}</p>
                </div>
                <p className="text-sm font-semibold">
                  {formatTk(toNumber(line.product.price) * line.qty)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2.5 border-t border-black/10 pt-5 text-sm">
            <div className="flex justify-between">
              <span className="text-black/55">Subtotal</span>
              <span className="font-semibold">{formatTk(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/55">Delivery</span>
              <span className="font-semibold">
                {deliveryFee === 0 ? 'Free' : formatTk(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-3 text-base">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{formatTk(total)}</span>
            </div>
          </div>
          <p className="mt-5 text-[10px] leading-5 text-black/40">
            By placing this order you agree to be contacted about delivery. Orders are
            confirmed by phone or email.
          </p>
        </aside>
      </main>
    </div>
  );
}
