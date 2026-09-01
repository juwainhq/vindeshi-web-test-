import { useState } from 'react';
import { Storefront } from './components/Storefront';
import { SignIn } from './components/SignIn';
import { AdminPanel } from './components/AdminPanel';
import { useAuth } from './lib/useAuth';

type View = 'store' | 'signin' | 'admin';

function App() {
  const { session, loading } = useAuth();
  const [view, setView] = useState<View>('store');

  if (view === 'admin' && !loading) {
    if (session) {
      return <AdminPanel onClose={() => setView('store')} />;
    }
    return <SignIn onClose={() => setView('store')} />;
  }

  if (view === 'signin' && !loading) {
    if (session) {
      return <AdminPanel onClose={() => setView('store')} />;
    }
    return <SignIn onClose={() => setView('store')} />;
  }

  return <Storefront onAdminClick={() => setView(session ? 'admin' : 'signin')} />;
}

export default App;
