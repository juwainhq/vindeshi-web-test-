import { useState } from 'react';
import { useAuth } from '../lib/useAuth';

/** Supabase sign-in gate for admin tabs whose data is protected by
 *  row-level security (orders, site content). */
export function CloudSignIn({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-sm space-y-4 rounded-2xl border border-black/10 bg-white p-8 text-center"
    >
      <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
      <p className="text-xs leading-5 text-black/50">{description}</p>
      <div className="space-y-3 text-left">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-black/15 px-3.5 py-3 text-sm outline-none transition focus:border-[#a05a39]"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-black/15 px-3.5 py-3 text-sm outline-none transition focus:border-[#a05a39]"
        />
      </div>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-[#171717] py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#a05a39] disabled:opacity-50"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
