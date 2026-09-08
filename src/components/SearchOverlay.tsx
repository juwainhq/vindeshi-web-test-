import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { Product } from '../lib/types';

export function SearchOverlay({
  open,
  products,
  onClose,
  onSelect,
}: {
  open: boolean;
  products: Product[];
  onClose: () => void;
  onSelect: (product: Product) => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.is_visible &&
        (p.name.toLowerCase().includes(q) ||
          p.color.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q))
    );
  }, [products, query]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#f7f7f5] transition-all duration-300 ${
        open ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
      aria-hidden={!open}
    >
      <div className="mx-auto flex h-full max-w-3xl flex-col px-5">
        <div className="flex items-center gap-4 border-b border-black/10 py-6">
          <input
            ref={inputRef}
            className="min-w-0 flex-1 bg-transparent font-serif text-3xl tracking-tight outline-none placeholder:text-black/25 sm:text-4xl"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bags…"
            type="search"
            value={query}
          />
          <button
            aria-label="Close search"
            className="rounded-full border border-black/15 p-2.5 transition hover:bg-black/5"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          {query.trim() === '' ? (
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">
                Popular searches
              </p>
              <div className="flex flex-wrap gap-2.5">
                {['Tote', 'Black', 'Travel', 'Everyday'].map((term) => (
                  <button
                    className="rounded-full border border-black/15 px-4 py-2 text-xs font-medium transition hover:border-[#a05a39] hover:text-[#a05a39]"
                    key={term}
                    onClick={() => setQuery(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-2xl">Nothing found</p>
              <p className="mt-2 text-sm text-black/50">Try “tote”, “black”, or “travel”.</p>
            </div>
          ) : (
            <ul className="divide-y divide-black/10">
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    className="group flex w-full items-center gap-4 py-4 text-left transition hover:bg-black/[0.03]"
                    onClick={() => {
                      onSelect(product);
                      onClose();
                    }}
                  >
                    <div className="h-16 w-14 shrink-0 overflow-hidden bg-[#e9e9e5]">
                      <img
                        alt={product.name}
                        className="h-full w-full object-cover object-[center_42%]"
                        src={product.image_url}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold">{product.name}</h3>
                      <p className="mt-0.5 text-xs text-black/45">
                        {product.color} · {product.category}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">Tk {product.price}</p>
                    <ArrowRight
                      className="shrink-0 text-black/30 transition group-hover:translate-x-1 group-hover:text-[#a05a39]"
                      size={16}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
