import { createElement, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  Heart,
  Loader2,
  Menu,
  Quote,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { useSiteContent } from '../lib/useSiteContent';
import type { SiteSettings, Product } from '../lib/types';
import { Reveal } from './Reveal';
import { CartDrawer } from './CartDrawer';
import { SearchOverlay } from './SearchOverlay';
import { Toast } from './Toast';
import { useCart } from '../lib/cart-context';

const FEATURE_ICONS = [Truck, Sparkles, Heart] as const;

type Category = 'All' | 'Women' | 'Men' | 'Travel';

const CATEGORIES: Category[] = ['All', 'Women', 'Men', 'Travel'];

export function Storefront({ onAdminClick }: { onAdminClick: () => void }) {
  const { content, loading, error } = useSiteContent();
  const {
    cart,
    cartCount,
    cartOpen,
    searchOpen,
    toast,
    addToCart,
    setQty,
    removeFromCart,
    setCartOpen,
    setSearchOpen,
    showToast,
  } = useCart();

  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [showTop, setShowTop] = useState(false);

  const settings: SiteSettings | null = content?.settings ?? null;
  const products: Product[] = content?.products ?? [];
  const collections = content?.collections ?? [];
  const testimonials = content?.testimonials ?? [];

  const featureData = [
    { title: settings?.feature1_title ?? '', text: settings?.feature1_text ?? '' },
    { title: settings?.feature2_title ?? '', text: settings?.feature2_text ?? '' },
    { title: settings?.feature3_title ?? '', text: settings?.feature3_text ?? '' },
  ];

  const testimonialData = testimonials.filter((t) => t.is_visible);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filteredProducts = useMemo(
    () =>
      activeCategory === 'All'
        ? products.filter((p) => p.is_visible && p.images.length > 0)
        : products.filter(
            (p) => p.category === activeCategory && p.is_visible && p.images.length > 0
          ),
    [products, activeCategory]
  );

  const toggleLike = (name: string) => {
    setLikedProducts((current) =>
      current.includes(name)
        ? current.filter((productName) => productName !== name)
        : [...current, name]
    );
  };

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      showToast('Welcome to the Vindeshi list');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <Loader2 className="animate-spin text-[#a05a39]" size={32} />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f7f5]">
        <p className="text-sm text-black/60">{error ?? 'Could not load the store.'}</p>
        <button onClick={() => window.location.reload()} className="text-xs font-bold uppercase tracking-wide text-[#a05a39]">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="bg-[#171717] px-5 py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-white sm:text-[11px]">
        {settings.announcement}
      </div>

      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f7f7f5]/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <button
            aria-label="Open menu"
            className="rounded-full p-2 transition hover:bg-black/5 lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <nav className="hidden items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.18em] lg:flex">
            <a className="transition hover:text-[#a05a39]" href="#shop">Shop</a>
            <a className="transition hover:text-[#a05a39]" href="#collections">Collections</a>
            <a className="transition hover:text-[#a05a39]" href="#story">Our story</a>
          </nav>
          <a className="absolute left-1/2 -translate-x-1/2 text-center" href="#top">
            <span className="block font-serif text-[28px] font-semibold leading-none tracking-[-0.08em] sm:text-[32px]">
              {settings.brand_name}
            </span>
            <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.42em] text-[#8c8c84]">
              {settings.brand_tagline}
            </span>
          </a>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              aria-label="Search"
              className="rounded-full p-2 transition hover:bg-black/5"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={18} strokeWidth={1.7} />
            </button>
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
        </div>
        {isMenuOpen && (
          <nav className="border-t border-black/10 bg-[#f7f7f5] px-5 py-5 lg:hidden">
            {(['Shop', 'Collections', 'Our story'] as const).map((item) => (
              <a
                className="block border-b border-black/10 py-3 text-xs font-semibold uppercase tracking-[0.18em] last:border-0"
                href={`#${item === 'Shop' ? 'shop' : item === 'Collections' ? 'collections' : 'story'}`}
                key={item}
                onClick={() => setIsMenuOpen(false)}
              >
                {item}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main id="top">
        <section className="relative overflow-hidden bg-[#dededb]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,.9),transparent_36%),linear-gradient(110deg,#d4d4d1,#ecece9_55%,#c8c8c4)]" />
          <div className="relative mx-auto grid min-h-[590px] max-w-[1440px] items-center px-5 py-16 sm:px-10 lg:grid-cols-[0.75fr_1.25fr] lg:px-20 lg:py-24">
            <div className="relative z-10 max-w-[420px]">
              <p className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#a05a39]">
                <Sparkles size={13} /> {settings.hero_eyebrow}
              </p>
              <h1 className="max-w-[500px] font-serif text-6xl leading-[0.92] tracking-[-0.06em] sm:text-8xl">
                {settings.hero_title_line1}
                <br />
                <em className="font-normal">{settings.hero_title_line2}</em>
              </h1>
              <p className="mt-7 max-w-[320px] text-sm leading-7 text-black/65">
                {settings.hero_subtitle}
              </p>
              <a className="mt-8 inline-flex items-center gap-3 border-b border-[#171717] pb-2 text-[11px] font-bold uppercase tracking-[0.2em] transition hover:gap-5" href="#shop">
                Explore the collection <ArrowRight size={15} />
              </a>
            </div>
            <div className="relative mt-10 flex min-h-[270px] items-center justify-center lg:mt-0 lg:min-h-[460px]">
              <div className="absolute h-56 w-56 rounded-full bg-white/40 blur-2xl sm:h-80 sm:w-80" />
              <img
                className="relative z-10 h-[430px] w-[340px] max-w-[92%] rounded-[28px] object-cover object-[center_42%] mix-blend-multiply shadow-[0_25px_45px_rgba(0,0,0,.12)] sm:w-[390px] lg:w-[430px]"
                src={settings.hero_image}
                alt="Vindeshi collection"
              />
              <div className="absolute bottom-5 right-0 z-20 max-w-[130px] border-l border-black/30 pl-3 text-[10px] leading-4 text-black/60 sm:right-8">
                {settings.hero_caption}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-black/10 bg-[#f7f7f5]">
          <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#a05a39]">{settings.features_eyebrow}</p>
                <h2 className="font-serif text-3xl tracking-[-0.05em] sm:text-4xl">{settings.features_title}</h2>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {featureData.map((feature, index) => (
                <Reveal key={feature.title}>
                  <div className="flex items-start gap-4">
                    <span className="rounded-full bg-[#a05a39]/10 p-3 text-[#a05a39]">
                      {createElement(FEATURE_ICONS[index % 3], { size: 18, strokeWidth: 1.7 })}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{feature.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-black/50">{feature.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="shop" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#a05a39]">{settings.shop_eyebrow}</p>
              <h2 className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">{settings.shop_title}</h2>
            </div>
            <div className="flex items-center gap-5 overflow-x-auto border-b border-black/10 pb-3 text-[11px] font-bold uppercase tracking-[0.15em]">
              {CATEGORIES.map((category) => (
                <button
                  className={`whitespace-nowrap transition ${activeCategory === category ? 'text-[#a05a39]' : 'text-black/45 hover:text-black'}`}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          {filteredProducts.length === 0 ? (
            <p className="py-16 text-center text-sm text-black/45">Nothing here yet — check back soon.</p>
          ) : (
            <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <Reveal delay={(index % 4) * 90} key={product.id}>
                  <article className="group">
                    <div className="relative aspect-square overflow-hidden bg-[#e9e9e5]">
                      <Link to={`/product/${product.id}`}>
                        <img
                          className="h-full w-full object-cover object-[center_42%] grayscale-[12%] transition duration-700 group-hover:scale-105"
                          src={product.images[0]}
                          alt={product.name}
                        />
                      </Link>
                      {product.images.length > 1 && (
                        <div className="absolute bottom-3 left-3 flex gap-1.5">
                          {product.images.slice(0, 3).map((image, i) => (
                            <span
                              key={image + i}
                              className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-[#f7f7f5]' : 'bg-[#f7f7f5]/40'}`}
                            />
                          ))}
                        </div>
                      )}
                      {product.badge && (
                        <span className="absolute left-3 top-3 bg-[#f7f7f5] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em]">
                          {product.badge}
                        </span>
                      )}
                      <button
                        aria-label={`Save ${product.name}`}
                        className="absolute right-3 top-3 rounded-full bg-[#f7f7f5]/90 p-2 transition hover:bg-white"
                        onClick={() => toggleLike(product.name)}
                      >
                        <Heart size={15} fill={likedProducts.includes(product.name) ? '#a05a39' : 'none'} color={likedProducts.includes(product.name) ? '#a05a39' : '#171717'} />
                      </button>
                      <button
                        className="absolute bottom-3 left-3 right-3 translate-y-16 bg-[#171717] py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                        onClick={() => addToCart(product)}
                      >
                        Add to bag
                      </button>
                    </div>
                    <div className="flex items-start justify-between pt-4">
                      <div>
                        <h3 className="text-sm font-semibold">
                          <Link to={`/product/${product.id}`} className="transition hover:text-[#a05a39]">
                            {product.name}
                          </Link>
                        </h3>
                        <p className="mt-1 text-xs text-black/45">{product.color} · {product.category}</p>
                      </div>
                      <p className="text-sm font-semibold">Tk {product.price}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
          <div className="mt-12 flex justify-center">
            <button className="inline-flex items-center gap-3 border-b border-black pb-2 text-[11px] font-bold uppercase tracking-[0.2em] transition hover:gap-5">
              View all bags <ArrowRight size={15} />
            </button>
          </div>
        </section>

        <section id="collections" className="bg-[#171717] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#c48c6c]">{settings.collections_eyebrow}</p>
                <h2 className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">{settings.collections_title}</h2>
              </div>
              <ChevronDown className="hidden rotate-[-90deg] opacity-50 sm:block" />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {collections.map((collection, index) => (
                <Reveal delay={index * 120} key={collection.id}>
                  <a className="group relative block min-h-[410px] overflow-hidden bg-[#353535]" href="#shop">
                    <img className="absolute inset-0 h-full w-full object-cover object-[center_42%] opacity-60 grayscale transition duration-700 group-hover:scale-105 group-hover:opacity-75" src={collection.image_url} alt={collection.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                    <div className="absolute bottom-7 left-7 sm:bottom-10 sm:left-10">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#d9a98c]">{collection.eyebrow}</p>
                      <h3 className="font-serif text-4xl leading-[0.95] tracking-[-0.05em] sm:text-5xl">{collection.title}</h3>
                      <span className="mt-6 inline-flex items-center gap-3 border-b border-white/70 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] transition group-hover:gap-5">Shop the edit <ArrowRight size={14} /></span>
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:gap-24 lg:px-20 lg:py-28">
          <Reveal className="relative mx-auto max-w-[470px]">
            <div className="absolute -left-5 -top-5 h-full w-full border border-[#a05a39]/40" />
            <img className="relative aspect-[4/5] w-full object-cover object-[center_42%] grayscale-[8%]" src={settings.story_image} alt="Vindeshi tote bag" />
          </Reveal>
          <Reveal delay={150}>
            <div className="max-w-[500px]">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#a05a39]">{settings.story_eyebrow}</p>
              <h2 className="font-serif text-5xl leading-[0.95] tracking-[-0.06em] sm:text-6xl">{settings.story_title}<br /><em className="font-normal">{settings.story_title_italic}</em></h2>
              <p className="mt-7 text-sm leading-7 text-black/60">{settings.story_body1}</p>
              <p className="mt-4 text-sm leading-7 text-black/60">{settings.story_body2}</p>
              <a className="mt-8 inline-flex items-center gap-3 border-b border-black pb-2 text-[11px] font-bold uppercase tracking-[0.2em] transition hover:gap-5" href="#shop">Discover our story <ArrowRight size={15} /></a>
            </div>
          </Reveal>
        </section>

        <section className="bg-[#ecebe7] px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <Reveal>
              <div className="mb-12 text-center">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#a05a39]">{settings.testimonials_eyebrow}</p>
                <h2 className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">{settings.testimonials_title}</h2>
              </div>
            </Reveal>
            {testimonialData.length === 0 ? (
              <p className="py-10 text-center text-sm text-black/45">No reviews yet.</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-3">
                {testimonialData.map((t, index) => (
                  <Reveal delay={index * 120} key={t.id}>
                    <figure className="flex h-full flex-col bg-[#f7f7f5] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                      <Quote className="mb-5 text-[#a05a39]/60" size={26} strokeWidth={1.5} />
                      <blockquote className="flex-1 font-serif text-lg leading-8 tracking-[-0.01em] text-black/80">
                        “{t.quote}”
                      </blockquote>
                      <figcaption className="mt-7 border-t border-black/10 pt-5">
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="mt-1 text-xs text-black/45">{t.role}</p>
                      </figcaption>
                    </figure>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-[#d9d2ca] px-5 py-16 sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#8f5135]">{settings.newsletter_eyebrow}</p>
              <h2 className="font-serif text-3xl tracking-[-0.04em] sm:text-4xl">{settings.newsletter_title}</h2>
            </div>
            {subscribed ? (
              <p className="text-sm font-medium text-[#6d402c]">You're on the list. Welcome to Vindeshi.</p>
            ) : (
              <form className="flex w-full max-w-[440px] border-b border-black/40 pb-3" onSubmit={handleSubscribe}>
                <input aria-label="Email address" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/50" onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" required type="email" value={email} />
                <button className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] transition hover:text-[#a05a39]" type="submit">Join us <ArrowRight size={15} /></button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-[#171717] px-5 py-10 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-3xl tracking-[-0.07em]">{settings.brand_name}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-white/40">{settings.brand_tagline}</p>
          </div>
          <div className="flex gap-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
            <a className="transition hover:text-white" href="#shop">Shop</a>
            <a className="transition hover:text-white" href="#story">Contact</a>
            <a className="transition hover:text-white" href="#top">Instagram</a>
            <button onClick={onAdminClick} className="transition hover:text-white">Admin</button>
          </div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">{settings.footer_copyright}</p>
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
        onCheckout={() => showToast('Checkout coming soon — your bag is saved')}
        onRemove={removeFromCart}
        onSetQty={setQty}
        open={cartOpen}
      />

      <SearchOverlay
        onClose={() => setSearchOpen(false)}
        open={searchOpen}
        products={products}
      />

      <Toast toast={toast} />

      {showTop && (
        <button
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#171717] text-white shadow-xl transition hover:bg-[#a05a39]"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ChevronDown className="rotate-180" size={18} />
        </button>
      )}
    </div>
  );
}
