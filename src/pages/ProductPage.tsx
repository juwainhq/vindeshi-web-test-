import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useSiteContent } from '../lib/useSiteContent';
import { useCart } from '../lib/cart-context';
import { Reveal } from '../components/Reveal';
import { CartDrawer } from '../components/CartDrawer';
import { Toast } from '../components/Toast';

export function ProductPage() {
  const { content, loading, error } = useSiteContent();
  const {
    addToCart,
    cart,
    cartCount,
    cartOpen,
    setCartOpen,
    setQty,
    removeFromCart,
    toast,
    showToast,
  } = useCart();
  const { pathname } = useLocation();
  const productId = pathname.split('/').pop() ?? '';

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQtyState] = useState(1);
  const [liked, setLiked] = useState(false);

  const product = useMemo(
    () => content?.products.find((p) => p.id === productId) ?? null,
    [content, productId]
  );

  const related = useMemo(
    () =>
      content?.products
        .filter((p) => p.is_visible && p.id !== productId && p.images.length > 0)
        .slice(0, 4) ?? [],
    [content, productId]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImage(0);
    setQtyState(1);
  }, [productId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <Loader2 className="animate-spin text-[#a05a39]" size={32} />
      </div>
    );
  }

  if (error || !content?.settings) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f7f5]">
        <p className="text-sm text-black/60">{error ?? 'Could not load this product.'}</p>
        <Link to="/" className="text-xs font-bold uppercase tracking-wide text-[#a05a39]">
          Back to the store
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f7f5]">
        <p className="font-serif text-3xl">Product not found</p>
        <p className="text-sm text-black/50">It may have been removed from the catalog.</p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-2 border-b border-black pb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition hover:text-[#a05a39]"
        >
          <ArrowLeft size={14} /> Back to shop
        </Link>
      </div>
    );
  }

  const settings = content.settings;
  const priceNumber = Number(product.price.replace(/[^0-9.]/g, '')) || 0;

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="bg-[#171717] px-5 py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-white sm:text-[11px]">
        {settings.announcement}
      </div>

      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f7f7f5]/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:text-[#a05a39]"
          >
            <ArrowLeft size={16} /> Back
          </Link>
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-center">
            <span className="block font-serif text-[28px] font-semibold leading-none tracking-[-0.08em] sm:text-[32px]">
              {settings.brand_name}
            </span>
            <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.42em] text-[#8c8c84]">
              {settings.brand_tagline}
            </span>
          </Link>
          <button
            aria-label="Shopping bag"
            className="relative rounded-full p-2 transition hover:bg-black/5"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={18} strokeWidth={1.7} />
            {cartCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#a05a39] px-1 text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
        <nav className="mb-8 flex gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40">
          <Link to="/" className="transition hover:text-black">Shop</Link>
          <span>/</span>
          <span className="text-black/70">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square overflow-hidden bg-[#e9e9e5]">
              <img
                key={product.images[activeImage]}
                className="h-full w-full object-cover object-[center_42%]"
                src={product.images[activeImage]}
                alt={`${product.name} — photo ${activeImage + 1}`}
              />
              {product.badge && (
                <span className="absolute left-4 top-4 bg-[#f7f7f5] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em]">
                  {product.badge}
                </span>
              )}
              {product.images.length > 1 && (
                <>
                  <button
                    aria-label="Previous photo"
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-[#f7f7f5]/90 p-2.5 shadow transition hover:bg-white"
                    onClick={() =>
                      setActiveImage((i) => (i - 1 + product.images.length) % product.images.length)
                    }
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    aria-label="Next photo"
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-[#f7f7f5]/90 p-2.5 shadow transition hover:bg-white"
                    onClick={() => setActiveImage((i) => (i + 1) % product.images.length)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {product.images.map((image, i) => (
                  <button
                    key={image + i}
                    aria-label={`Show photo ${i + 1}`}
                    className={`h-20 w-20 shrink-0 overflow-hidden border-2 transition ${
                      activeImage === i
                        ? 'border-[#a05a39]'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    onClick={() => setActiveImage(i)}
                  >
                    <img
                      className="h-full w-full object-cover object-[center_42%]"
                      src={image}
                      alt=""
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#a05a39]">
              {product.category}
            </p>
            <h1 className="font-serif text-4xl leading-[1] tracking-[-0.04em] sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-3 text-lg font-semibold">Tk {product.price}</p>

            <p className="mt-4 text-sm leading-7 text-black/60">
              {product.description || 'Contact us for more details about this piece.'}
            </p>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center border border-black/15">
                <button
                  aria-label="Decrease quantity"
                  className="px-3.5 py-3 transition hover:text-[#a05a39] disabled:opacity-30"
                  disabled={qty <= 1}
                  onClick={() => setQtyState((q) => Math.max(1, q - 1))}
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-10 text-center text-sm font-semibold">{qty}</span>
                <button
                  aria-label="Increase quantity"
                  className="px-3.5 py-3 transition hover:text-[#a05a39]"
                  onClick={() => setQtyState((q) => q + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                aria-label="Save to wishlist"
                className={`rounded-full border p-3 transition ${
                  liked ? 'border-[#a05a39] text-[#a05a39]' : 'border-black/15 hover:border-black/40'
                }`}
                onClick={() => setLiked(!liked)}
              >
                <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </div>

            <button
              className="mt-6 w-full bg-[#171717] py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#a05a39]"
              onClick={() => addToCart(product, qty)}
            >
              Add to bag — Tk {(priceNumber * qty).toLocaleString('en-US')}
            </button>

            <div className="mt-8 divide-y divide-black/10 border-t border-black/10 text-xs text-black/55">
              <p className="flex items-center gap-3 py-3.5">
                <Truck size={15} className="text-[#a05a39]" /> Free delivery on orders over Tk 2,000
              </p>
              <p className="flex items-center gap-3 py-3.5">
                <ShieldCheck size={15} className="text-[#a05a39]" /> Crafted to last, built for everyday use
              </p>
              <p className="flex items-center gap-3 py-3.5">
                <Sparkles size={15} className="text-[#a05a39]" /> Clean lines, considered details
              </p>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-24">
            <Reveal>
              <div className="mb-8">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#a05a39]">
                  Keep exploring
                </p>
                <h2 className="font-serif text-4xl tracking-[-0.05em]">You may also like</h2>
              </div>
            </Reveal>
            <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p, index) => (
                <Reveal delay={(index % 4) * 80} key={p.id}>
                  <Link to={`/product/${p.id}`} className="group block">
                    <div className="relative aspect-square overflow-hidden bg-[#e9e9e5]">
                      <img
                        className="h-full w-full object-cover object-[center_42%] grayscale-[12%] transition duration-700 group-hover:scale-105"
                        src={p.images[0]}
                        alt={p.name}
                      />
                      {p.badge && (
                        <span className="absolute left-3 top-3 bg-[#f7f7f5] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em]">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-start justify-between pt-4">
                      <div>
                        <h3 className="text-sm font-semibold">{p.name}</h3>
                        <p className="mt-1 text-xs text-black/45">{p.color}</p>
                      </div>
                      <p className="text-sm font-semibold">Tk {p.price}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-16 bg-[#171717] px-5 py-10 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-3xl tracking-[-0.07em]">{settings.brand_name}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-white/40">
              {settings.brand_tagline}
            </p>
          </div>
          <div className="flex gap-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
            <Link to="/" className="transition hover:text-white">Shop</Link>
            <Link to="/checkout" className="transition hover:text-white">Checkout</Link>
          </div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">
            {settings.footer_copyright}
          </p>
        </div>
      </footer>

      <CartDrawer
        items={cart.map((line) => ({
          id: line.product.id,
          name: line.product.name,
          color: line.product.color,
          price: line.product.price,
          image_url: line.product.images[0],
          qty: line.qty,
        }))}
        onClose={() => setCartOpen(false)}
        onRemove={removeFromCart}
        onSetQty={setQty}
        open={cartOpen}
      />

      <Toast toast={toast} />
    </div>
  );
}
