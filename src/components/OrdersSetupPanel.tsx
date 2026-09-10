import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Globe,
  Link2,
  Loader2,
  Plus,
} from 'lucide-react';
import { createOrdersStore, linkOrdersStore } from '../lib/orders';

/** One-time setup panel shown in the admin Orders tab when no shared
 *  cloud store is linked yet — creates one, or links an existing ID. */
export function OrdersSetupPanel({ onLinked }: { onLinked: () => void }) {
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const [linkInput, setLinkInput] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    if (!createdId) return;
    try {
      await navigator.clipboard.writeText(createdId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the ID is visible to copy manually
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      setCreatedId(await createOrdersStore());
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create the store.');
    } finally {
      setCreating(false);
    }
  };

  const handleLink = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLinking(true);
    setLinkError(null);
    try {
      await linkOrdersStore(linkInput);
      onLinked();
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Could not link the store.');
      setLinking(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-black/10 bg-white p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#a05a39]/10 text-[#a05a39]">
          <Globe size={24} />
        </span>
        <h2 className="mt-4 font-serif text-2xl tracking-tight">Connect a shared cloud store</h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-black/55">
          Orders live in one shared JSON document on jsonblob.com — free, no account, no
          keys. Every device that knows the store ID reads and writes the same orders, so
          checkouts from anywhere appear in this dashboard live.
        </p>
      </div>

      {/* Create a new store */}
      <div className="space-y-4 rounded-xl border border-black/10 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-serif text-lg tracking-tight">Start a new store</h3>
          {!createdId && (
            <button
              onClick={() => void handleCreate()}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Creating…
                </>
              ) : (
                <>
                  <Plus size={13} /> Create cloud store
                </>
              )}
            </button>
          )}
        </div>

        {!createdId ? (
          <p className="text-xs leading-5 text-black/50">
            Creates the shared order document and links this browser instantly. You'll
            then paste the store ID into the app (one line) so every visitor's checkout
            saves to it from any device.
          </p>
        ) : (
          <div className="rounded-lg border border-black/10 bg-[#fafaf8] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-black/40">
              Your shared store ID
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded border border-black/10 bg-white px-3 py-2.5 font-mono text-sm font-semibold text-[#171717]">
                {createdId}
              </code>
              <button
                onClick={() => void copyId()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-black/55 transition hover:border-[#a05a39] hover:text-[#a05a39]"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-xs leading-5 text-black/60">
              <li>Copy this ID.</li>
              <li>
                Paste it into <code className="font-mono">ORDERS_BLOB_ID</code> at the top of{' '}
                <code className="font-mono">src/lib/orders.ts</code>.
              </li>
              <li>
                Rebuild and redeploy the app — every visitor's checkout, on any device,
                then saves to this shared store.
              </li>
            </ol>
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
              This browser is already linked — you can open the orders dashboard right now.
            </p>
            <button
              onClick={onLinked}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#a05a39] py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#8d4c2f]"
            >
              Continue to orders <ArrowRight size={14} />
            </button>
          </div>
        )}

        {createError && (
          <p className="text-xs font-semibold text-red-600">{createError}</p>
        )}
        {!createdId && (
          <p className="border-t border-black/10 pt-3 text-[10px] leading-4 text-black/40">
            If creation fails, create the document manually instead: open jsonblob.com,
            paste <code className="font-mono">{'{"orders": []}'}</code>, click Create, and
            link the resulting URL below.
          </p>
        )}
      </div>

      {/* Link an existing store */}
      <form onSubmit={handleLink} className="space-y-3 rounded-xl border border-black/10 bg-white p-6">
        <h3 className="flex items-center gap-2 font-serif text-lg tracking-tight">
          <Link2 size={16} /> Link an existing store
        </h3>
        <p className="text-xs leading-5 text-black/50">
          Already created the store on another browser or device? Paste its ID — or the
          full jsonblob.com URL — to link this browser to the same orders.
        </p>
        <div className="flex gap-2">
          <input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Store ID or https://jsonblob.com/…"
            className="min-w-0 flex-1 rounded-lg border border-black/15 px-3.5 py-2.5 font-mono text-xs outline-none transition focus:border-[#a05a39]"
          />
          <button
            type="submit"
            disabled={linking || !linkInput.trim()}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#171717] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#a05a39] disabled:opacity-50"
          >
            {linking ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
            Link store
          </button>
        </div>
        {linkError && <p className="text-xs font-semibold text-red-600">{linkError}</p>}
      </form>
    </div>
  );
}
