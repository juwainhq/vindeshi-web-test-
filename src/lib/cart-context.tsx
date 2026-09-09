import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '../lib/types';
import type { ToastState } from '../components/Toast';

type CartLine = { product: Product; qty: number };

type CartContextValue = {
  cart: CartLine[];
  cartCount: number;
  cartOpen: boolean;
  searchOpen: boolean;
  toast: ToastState;
  addToCart: (product: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  showToast: (message: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    document.body.style.overflow = cartOpen || searchOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [cartOpen, searchOpen]);

  const addToCart = (product: Product, qty = 1) => {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id ? { ...line, qty: line.qty + qty } : line
        );
      }
      return [...current, { product, qty }];
    });
    setCartOpen(true);
    setToast({ message: `${product.name} added to your bag`, key: Date.now() });
  };

  const setQty = (id: string, qty: number) => {
    setCart((current) =>
      qty <= 0
        ? current.filter((line) => line.product.id !== id)
        : current.map((line) => (line.product.id === id ? { ...line, qty } : line))
    );
  };

  const removeFromCart = (id: string) => {
    setCart((current) => current.filter((line) => line.product.id !== id));
  };

  const showToast = (message: string) => {
    setToast({ message, key: Date.now() });
  };

  const cartCount = useMemo(
    () => cart.reduce((sum, line) => sum + line.qty, 0),
    [cart]
  );

  const value = useMemo(
    () => ({
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
    }),
    [cart, cartCount, cartOpen, searchOpen, toast]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
