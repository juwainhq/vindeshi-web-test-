import { useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Storefront } from './components/Storefront';
import { ProductPage } from './pages/ProductPage';
import { SignIn } from './components/SignIn';
import { AdminPanel } from './components/AdminPanel';
import { useAuth } from './lib/useAuth';
import { CartProvider } from './lib/cart-context';

type View = 'store' | 'signin' | 'admin';

function AdminView({ onClose }: { onClose: () => void }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <Loader2 className="animate-spin text-[#a05a39]" size={32} />
      </div>
    );
  }
  if (session) return <AdminPanel onClose={onClose} />;
  return <SignIn onClose={onClose} />;
}

function AppRoutes() {
  const { session } = useAuth();
  const [view, setView] = useState<View>('store');
  const navigate = useNavigate();

  const goStore = () => {
    setView('store');
    navigate('/');
  };

  return (
    <Routes>
      <Route
        path="/product/:id"
        element={
          <ProductPage
            onAdminClick={() => setView(session ? 'admin' : 'signin')}
          />
        }
      />
      <Route
        path="*"
        element={
          view === 'admin' || view === 'signin' ? (
            <AdminView onClose={goStore} />
          ) : (
            <Storefront onAdminClick={() => setView(session ? 'admin' : 'signin')} />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
