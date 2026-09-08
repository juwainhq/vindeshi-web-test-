import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export type ToastState = { message: string; key: number } | null;

export function Toast({ toast }: { toast: ToastState }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setShow(true);
    const timer = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      className={`pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 transition-all duration-300 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      role="status"
    >
      <div className="flex items-center gap-2.5 rounded-full bg-[#171717] px-5 py-3 text-white shadow-xl">
        <CheckCircle2 className="text-[#d9a98c]" size={16} />
        <p className="whitespace-nowrap text-xs font-semibold tracking-wide">{toast.message}</p>
      </div>
    </div>
  );
}
