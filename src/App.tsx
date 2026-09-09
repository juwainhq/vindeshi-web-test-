import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Storefront } from './components/Storefront';
import { ProductPage } from './pages/ProductPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { CartProvider } from './lib/cart-context';

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Storefront />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          {/* Hidden admin dashboard — no links point here */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Storefront />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
